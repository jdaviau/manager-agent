import type { Tool } from "@anthropic-ai/sdk/resources/messages";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

export const analysisToolDefinitions: Tool[] = [
  {
    name: "cost_per_player",
    description: "Calculate the total expenses divided by the number of active players.",
    input_schema: {
      type: "object" as const,
      properties: {
        team_id: { type: "string", description: "The team UUID" },
        season: { type: "string", description: "The season to analyze" },
      },
      required: ["team_id", "season"],
    },
  },
  {
    name: "cost_per_game",
    description: "Calculate the total expenses divided by the number of games played.",
    input_schema: {
      type: "object" as const,
      properties: {
        team_id: { type: "string", description: "The team UUID" },
        season: { type: "string", description: "The season to analyze" },
      },
      required: ["team_id", "season"],
    },
  },
  {
    name: "financial_summary",
    description:
      "Get a complete financial overview including budget, spending by category, cost per player, and cost per game.",
    input_schema: {
      type: "object" as const,
      properties: {
        team_id: { type: "string", description: "The team UUID" },
        season: { type: "string", description: "The season to summarize" },
      },
      required: ["team_id", "season"],
    },
  },
];

type Input = Record<string, unknown>;
type Executor = (input: Input, supabase: SupabaseClient) => Promise<unknown>;

async function getSeasonExpenses(
  teamId: string,
  season: string,
  supabase: SupabaseClient
) {
  const { data: budget } = await supabase
    .from("budgets")
    .select("id, total_amount")
    .eq("team_id", teamId)
    .eq("season", season)
    .maybeSingle();

  if (!budget) return { budget: null, expenses: [], totalSpent: 0 };

  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .eq("budget_id", budget.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalSpent = (expenses ?? []).reduce((sum: number, e: any) => sum + Number(e.amount), 0);
  return { budget, expenses: expenses ?? [], totalSpent };
}

export const analysisExecutors: Record<string, Executor> = {
  cost_per_player: async (input, supabase) => {
    const { totalSpent } = await getSeasonExpenses(
      input.team_id as string,
      input.season as string,
      supabase
    );

    const { data: players } = await supabase
      .from("players")
      .select("id")
      .eq("team_id", input.team_id as string)
      .eq("status", "active");

    const playerCount = players?.length ?? 0;
    const costPerPlayer = playerCount > 0 ? totalSpent / playerCount : 0;

    return {
      total_players: playerCount,
      total_spent: totalSpent,
      cost_per_player: costPerPlayer,
      season: input.season,
    };
  },

  cost_per_game: async (input, supabase) => {
    const { totalSpent } = await getSeasonExpenses(
      input.team_id as string,
      input.season as string,
      supabase
    );

    const { data: games } = await supabase
      .from("games")
      .select("id")
      .eq("team_id", input.team_id as string);

    const gameCount = games?.length ?? 0;
    const costPerGame = gameCount > 0 ? totalSpent / gameCount : 0;

    return {
      total_games: gameCount,
      total_spent: totalSpent,
      cost_per_game: costPerGame,
      season: input.season,
    };
  },

  financial_summary: async (input, supabase) => {
    const { budget, expenses, totalSpent } = await getSeasonExpenses(
      input.team_id as string,
      input.season as string,
      supabase
    );

    const { data: players } = await supabase
      .from("players")
      .select("id")
      .eq("team_id", input.team_id as string)
      .eq("status", "active");

    const { data: games } = await supabase
      .from("games")
      .select("id")
      .eq("team_id", input.team_id as string);

    const playerCount = players?.length ?? 0;
    const gameCount = games?.length ?? 0;

    // Category breakdown
    const byCategory: Record<string, number> = {};
    for (const expense of expenses) {
      byCategory[expense.category] = (byCategory[expense.category] ?? 0) + Number(expense.amount);
    }

    // Largest expense
    const largestExpense =
      expenses.length > 0
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? expenses.reduce((max: any, e: any) => (Number(e.amount) > Number(max.amount) ? e : max))
        : null;

    // Recent 5 expenses
    const recentExpenses = [...expenses]
      .sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime())
      .slice(0, 5);

    return {
      season: input.season,
      budget_total: budget ? Number(budget.total_amount) : null,
      total_spent: totalSpent,
      remaining: budget ? Number(budget.total_amount) - totalSpent : null,
      percent_used: budget
        ? Math.round((totalSpent / Number(budget.total_amount)) * 100)
        : null,
      by_category: byCategory,
      cost_per_player: playerCount > 0 ? totalSpent / playerCount : 0,
      cost_per_game: gameCount > 0 ? totalSpent / gameCount : 0,
      largest_expense: largestExpense,
      recent_expenses: recentExpenses,
    };
  },
};
