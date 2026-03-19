import type { Tool } from "@anthropic-ai/sdk/resources/messages";
import type { ExpenseCategory } from "@/types/database";
import { assertString, assertOptionalString, assertNumber, assertOptionalDate, assertSeason, clampLimit } from "./validate";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

export const expenseToolDefinitions: Tool[] = [
  {
    name: "add_expense",
    description:
      "Log a new expense for the team. Automatically links to the current season's budget if one exists.",
    input_schema: {
      type: "object" as const,
      properties: {
        team_id: { type: "string", description: "The team UUID" },
        season: {
          type: "string",
          description: "Season to link the expense to (e.g. '2025-2026')",
        },
        category: {
          type: "string",
          enum: ["equipment", "travel", "fees", "facilities", "medical", "uniforms", "other"],
          description: "Expense category",
        },
        description: { type: "string", description: "Description of the expense (max 200 characters)" },
        amount: { type: "number", description: "Expense amount in dollars ($0.01 – $100,000)" },
        expense_date: {
          type: "string",
          description: "Date in YYYY-MM-DD format (defaults to today)",
        },
        notes: { type: "string", description: "Optional additional notes (max 500 characters)" },
      },
      required: ["team_id", "season", "category", "description", "amount"],
    },
  },
  {
    name: "list_expenses",
    description: "List expenses for the team with optional date range filtering.",
    input_schema: {
      type: "object" as const,
      properties: {
        team_id: { type: "string", description: "The team UUID" },
        limit: { type: "number", description: "Max number of results (default 20, max 100)" },
        start_date: { type: "string", description: "Start date filter YYYY-MM-DD (optional)" },
        end_date: { type: "string", description: "End date filter YYYY-MM-DD (optional)" },
      },
      required: ["team_id"],
    },
  },
  {
    name: "get_expenses_by_category",
    description: "Get all expenses for a specific category, with total amount.",
    input_schema: {
      type: "object" as const,
      properties: {
        team_id: { type: "string", description: "The team UUID" },
        category: {
          type: "string",
          enum: ["equipment", "travel", "fees", "facilities", "medical", "uniforms", "other"],
          description: "Expense category to filter by",
        },
        season: {
          type: "string",
          description: "Season to filter by (optional)",
        },
      },
      required: ["team_id", "category"],
    },
  },
];

type Input = Record<string, unknown>;
type Executor = (input: Input, supabase: SupabaseClient) => Promise<unknown>;

export const expenseExecutors: Record<string, Executor> = {
  add_expense: async (input, supabase) => {
    const season = assertSeason(input.season);
    const description = assertString(input.description, "description", { max: 200 });
    const amount = assertNumber(input.amount, "amount", { min: 0.01, max: 100_000 });
    const notes = assertOptionalString(input.notes, "notes", 500);
    const expenseDate = assertOptionalDate(input.expense_date, "expense_date")
      ?? new Date().toISOString().split("T")[0];

    // Find the budget for linking
    const { data: budget } = await supabase
      .from("budgets")
      .select("id, total_amount")
      .eq("team_id", input.team_id as string)
      .eq("season", season)
      .maybeSingle();

    const { data: expense, error } = await supabase
      .from("expenses")
      .insert({
        team_id: input.team_id as string,
        budget_id: budget?.id ?? null,
        category: input.category as ExpenseCategory,
        description,
        amount,
        expense_date: expenseDate,
        notes,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Return remaining budget if we have one
    let newRemaining = null;
    if (budget) {
      const { data: allExpenses } = await supabase
        .from("expenses")
        .select("amount")
        .eq("budget_id", budget.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const totalSpent = (allExpenses ?? []).reduce((sum: number, e: any) => sum + Number(e.amount), 0);
      newRemaining = Number(budget.total_amount) - totalSpent;
    }

    return { expense, new_remaining_budget: newRemaining };
  },

  list_expenses: async (input, supabase) => {
    const limit = clampLimit(input.limit, 100, 20);
    const startDate = assertOptionalDate(input.start_date, "start_date");
    const endDate = assertOptionalDate(input.end_date, "end_date");

    let query = supabase
      .from("expenses")
      .select("*")
      .eq("team_id", input.team_id as string)
      .order("expense_date", { ascending: false })
      .limit(limit);

    if (startDate) query = query.gte("expense_date", startDate);
    if (endDate) query = query.lte("expense_date", endDate);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const total = (data ?? []).reduce((sum: number, e: any) => sum + Number(e.amount), 0);
    return { expenses: data, total, count: data?.length ?? 0 };
  },

  get_expenses_by_category: async (input, supabase) => {
    let query = supabase
      .from("expenses")
      .select("*")
      .eq("team_id", input.team_id as string)
      .eq("category", input.category as string)
      .order("expense_date", { ascending: false });

    if (input.season) {
      const season = assertSeason(input.season);
      const { data: budget } = await supabase
        .from("budgets")
        .select("id")
        .eq("team_id", input.team_id as string)
        .eq("season", season)
        .maybeSingle();
      if (budget) {
        query = query.eq("budget_id", budget.id);
      }
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalAmount = (data ?? []).reduce((sum: number, e: any) => sum + Number(e.amount), 0);
    return { expenses: data, total_amount: totalAmount, count: data?.length ?? 0 };
  },
};
