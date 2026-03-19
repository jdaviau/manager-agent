import type { Tool } from "@anthropic-ai/sdk/resources/messages";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

export const budgetToolDefinitions: Tool[] = [
  {
    name: "set_budget",
    description:
      "Set or update the team's budget for a season. Creates the budget if it doesn't exist, updates it if it does.",
    input_schema: {
      type: "object" as const,
      properties: {
        team_id: { type: "string", description: "The team UUID" },
        season: { type: "string", description: 'The season identifier, e.g. "2025-2026"' },
        total_amount: { type: "number", description: "Total budget amount in dollars" },
        notes: { type: "string", description: "Optional notes about the budget" },
      },
      required: ["team_id", "season", "total_amount"],
    },
  },
  {
    name: "get_budget_summary",
    description:
      "Get the budget summary for a season, including total spent and breakdown by expense category.",
    input_schema: {
      type: "object" as const,
      properties: {
        team_id: { type: "string", description: "The team UUID" },
        season: { type: "string", description: "The season identifier" },
      },
      required: ["team_id", "season"],
    },
  },
];

type Input = Record<string, unknown>;
type Executor = (input: Input, supabase: SupabaseClient) => Promise<unknown>;

export const budgetExecutors: Record<string, Executor> = {
  set_budget: async (input, supabase) => {
    const { data, error } = await supabase
      .from("budgets")
      .upsert(
        {
          team_id: input.team_id as string,
          season: input.season as string,
          total_amount: input.total_amount as number,
          notes: (input.notes as string) ?? null,
        },
        { onConflict: "team_id,season" }
      )
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { budget: data };
  },

  get_budget_summary: async (input, supabase) => {
    const { data: budget, error: budgetError } = await supabase
      .from("budgets")
      .select("*")
      .eq("team_id", input.team_id as string)
      .eq("season", input.season as string)
      .maybeSingle();

    if (budgetError || !budget) {
      return {
        budget: null,
        total_spent: 0,
        remaining: null,
        spent_by_category: {},
        message: "No budget set for this season",
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
