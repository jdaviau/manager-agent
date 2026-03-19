import type { Tool } from "@anthropic-ai/sdk/resources/messages";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

export const gameToolDefinitions: Tool[] = [
  {
    name: "add_game",
    description: "Add a new game or session to the schedule.",
    input_schema: {
      type: "object" as const,
      properties: {
        team_id: { type: "string", description: "The team UUID" },
        game_date: { type: "string", description: "Game date in YYYY-MM-DD format" },
        opponent: { type: "string", description: "Opponent team name (optional)" },
        location: { type: "string", description: "Venue or location (optional)" },
        is_home: {
          type: "boolean",
          description: "Whether it's a home game (default true)",
        },
        player_count: {
          type: "number",
          description: "Number of players who attended (optional)",
        },
        result: {
          type: "string",
          description: 'Game result, e.g. "W 3-1", "L 1-2", "Draw" (optional)',
        },
        notes: { type: "string", description: "Optional notes" },
      },
      required: ["team_id", "game_date"],
    },
  },
  {
    name: "list_games",
    description: "List the team's games, optionally only upcoming ones.",
    input_schema: {
      type: "object" as const,
      properties: {
        team_id: { type: "string", description: "The team UUID" },
        upcoming_only: {
          type: "boolean",
          description: "If true, only return games from today onwards",
        },
        limit: { type: "number", description: "Max number of results (default 10)" },
      },
      required: ["team_id"],
    },
  },
  {
    name: "update_game",
    description: "Update a game's result, player count, or notes.",
    input_schema: {
      type: "object" as const,
      properties: {
        game_id: { type: "string", description: "The game UUID" },
        result: { type: "string", description: "Game result (optional)" },
        player_count: { type: "number", description: "Number of players (optional)" },
        location: { type: "string", description: "Updated location (optional)" },
        notes: { type: "string", description: "Updated notes (optional)" },
      },
      required: ["game_id"],
    },
  },
];

type Input = Record<string, unknown>;
type Executor = (input: Input, supabase: SupabaseClient) => Promise<unknown>;

export const gameExecutors: Record<string, Executor> = {
  add_game: async (input, supabase) => {
    const { data, error } = await supabase
      .from("games")
      .insert({
        team_id: input.team_id as string,
        game_date: input.game_date as string,
        opponent: (input.opponent as string) ?? null,
        location: (input.location as string) ?? null,
        is_home: (input.is_home as boolean) ?? true,
        player_count: (input.player_count as number) ?? null,
        result: (input.result as string) ?? null,
        notes: (input.notes as string) ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { game: data };
  },

  list_games: async (input, supabase) => {
    let query = supabase
      .from("games")
      .select("*")
      .eq("team_id", input.team_id as string)
      .order("game_date", { ascending: true })
      .limit((input.limit as number) ?? 10);

    if (input.upcoming_only) {
      query = query.gte("game_date", new Date().toISOString().split("T")[0]);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return { games: data, count: data?.length ?? 0 };
  },

  update_game: async (input, supabase) => {
    const updates: Record<string, unknown> = {};
    if (input.result !== undefined) updates.result = input.result;
    if (input.player_count !== undefined) updates.player_count = input.player_count;
    if (input.location !== undefined) updates.location = input.location;
    if (input.notes !== undefined) updates.notes = input.notes;

    const { data, error } = await supabase
      .from("games")
      .update(updates)
      .eq("id", input.game_id as string)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { game: data };
  },
};
