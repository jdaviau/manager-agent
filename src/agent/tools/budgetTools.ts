import type { Tool } from "@anthropic-ai/sdk/resources/messages";
import { assertNumber, assertOptionalString, assertSeason } from "./validate";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

export const budgetToolDefinitions: Tool[] = [
  {
    name: "set_budget",
    description:
      "Set or update the team's budget for a season. Creates the budget if it doesn't exist, updates it if it does. Automatically marks it as the current/active budget.",
    input_schema: {
      type: "object" as const,
      properties: {
        team_id: { type: "string", description: "The team UUID" },
        season: { type: "string", description: 'The season identifier, e.g. "2025-2026" (max 20 characters)' },
        total_amount: { type: "number", description: "Total budget amount in dollars ($1 – $10,000,000)" },
        notes: { type: "string", description: "Optional notes about the budget (max 500 characters)" },
      },
      required: ["team_id", "season", "total_amount"],
    },
  },
  {
    name: "set_current_budget",
    description:
      "Switch the active/current budget to a different season. Use this when the manager wants to work with a prior or future season's budget.",
    input_schema: {
      type: "object" as const,
      properties: {
        team_id: { type: "string", description: "The team UUID" },
        season: { type: "string", description: "The season to make current, e.g. '2024-2025'" },
      },
      required: ["team_id", "season"],
    },
  },
  {
    name: "get_budget_summary",
    description:
      "Get the budget summary including total spent and breakdown by expense category. Defaults to the current/active budget if no season is specified.",
    input_schema: {
      type: "object" as const,
      properties: {
        team_id: { type: "string", description: "The team UUID" },
        season: { type: "string", description: "The season identifier (optional — defaults to current budget)" },
      },
      required: ["team_id"],
    },
  },
];

type Input = Record<string, unknown>;
type Executor = (input: Input, supabase: SupabaseClient) => Promise<unknown>;

/** Marks the given budget as current and clears the flag on all others for the team. */
async function makeCurrentBudget(
  teamId: string,
  budgetId: string,
  supabase: SupabaseClient
): Promise<void> {
  // Clear current flag on all budgets for this team
  await supabase
    .from("budgets")
    .update({ is_current: false })
    .eq("team_id", teamId)
    .neq("id", budgetId);

  // Set current flag on the target budget
  const { error } = await supabase
    .from("budgets")
    .update({ is_current: true })
    .eq("id", budgetId);

  if (error) throw new Error(error.message);
}

export const budgetExecutors: Record<string, Executor> = {
  set_budget: async (input, supabase) => {
    const season = assertSeason(input.season);
    const totalAmount = assertNumber(input.total_amount, "total_amount", { min: 1, max: 10_000_000 });
    const notes = assertOptionalString(input.notes, "notes", 500);

    const { data, error } = await supabase
      .from("budgets")
      .upsert(
        {
          team_id: input.team_id as string,
          season,
          total_amount: totalAmount,
          notes,
        },
        { onConflict: "team_id,season" }
      )
      .select()
      .single();
    if (error) throw new Error(error.message);

    await makeCurrentBudget(input.team_id as string, data.id, supabase);

    return { budget: { ...data, is_current: true } };
  },

  set_current_budget: async (input, supabase) => {
    const season = assertSeason(input.season);

    const { data: budget, error } = await supabase
      .from("budgets")
      .select("id, season")
      .eq("team_id", input.team_id as string)
      .eq("season", season)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!budget) throw new Error(`No budget found for season "${season}". Use set_budget to create one first.`);

    await makeCurrentBudget(input.team_id as string, budget.id, supabase);

    return { message: `Budget for ${season} is now the active budget.`, budget_id: budget.id };
  },

  get_budget_summary: async (input, supabase) => {
    let budget: Record<string, unknown> | null = null;

    if (input.season) {
      const season = assertSeason(input.season);
      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .eq("team_id", input.team_id as string)
        .eq("season", season)
        .maybeSingle();
      if (error) throw new Error(error.message);
      budget = data;
    } else {
      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .eq("team_id", input.team_id as string)
        .eq("is_current", true)
        .maybeSingle();
      if (error) throw new Error(error.message);
      budget = data;
    }

    if (!budget) {
      return {
        budget: null,
        total_spent: 0,
        remaining: null,
        spent_by_category: {},
        message: input.season
          ? `No budget set for season "${input.season}"`
          : "No active budget. Use set_budget to create one.",
      };
    }

    const { data: expenses, error: expensesError } = await supabase
      .from("expenses")
      .select("amount, category")
      .eq("team_id", input.team_id as string)
      .eq("budget_id", budget.id);

    if (expensesError) throw new Error(expensesError.message);

    const spentByCategory: Record<string, number> = {};
    let totalSpent = 0;
    for (const expense of expenses ?? []) {
      spentByCategory[expense.category] =
        (spentByCategory[expense.category] ?? 0) + Number(expense.amount);
      totalSpent += Number(expense.amount);
    }

    return {
      budget,
      total_spent: totalSpent,
      remaining: Number(budget.total_amount) - totalSpent,
      spent_by_category: spentByCategory,
    };
  },
};
