import type { Tool } from "@anthropic-ai/sdk/resources/messages";
import { assertDate, assertOptionalString, assertOptionalNumber, clampLimit } from "./validate";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

const MAX_GAMES_PER_TEAM = 500;

export const gameToolDefinitions: Tool[] = [
  {
    name: "add_game",
    description: "Add a new game or session to the schedule. Maximum 500 games per team.",
    input_schema: {
      type: "object" as const,
      properties: {
        team_id: { type: "string", description: "The team UUID" },
        game_date: { type: "string", description: "Game date in YYYY-MM-DD format" },
        opponent: { type: "string", description: "Opponent team name (optional, max 100 characters)" },
        location: { type: "string", description: "Venue or location (optional, max 200 characters)" },
        is_home: {
          type: "boolean",
          description: "Whether it's a home game (default true)",
        },
        player_count: {
          type: "number",
          description: "Number of players who attended (optional, 1–200)",
        },
        result: {
          type: "string",
          description: 'Game result, e.g. "W 3-1", "L 1-2", "Draw" (optional, max 50 characters)',
        },
        notes: { type: "string", description: "Optional notes (max 500 characters)" },
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
        limit: { type: "number", description: "Max number of results (default 10, max 50)" },
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
        result: { type: "string", description: "Game result (optional, max 50 characters)" },
        player_count: { type: "number", description: "Number of players (optional, 1–200)" },
        location: { type: "string", description: "Updated location (optional, max 200 characters)" },
        notes: { type: "string", description: "Updated notes (optional, max 500 characters)" },
      },
      required: ["game_id"],
    },
  },
];

type Input = Record<string, unknown>;
type Executor = (input: Input, supabase: SupabaseClient) => Promise<unknown>;

export const gameExecutors: Record<string, Executor> = {
  add_game: async (input, supabase) => {
    const gameDate = assertDate(input.game_date, "game_date");
    const opponent = assertOptionalString(input.opponent, "opponent", 100);
    const location = assertOptionalString(input.location, "location", 200);
    const result = assertOptionalString(input.result, "result", 50);
    const notes = assertOptionalString(input.notes, "notes", 500);
    const playerCount = assertOptionalNumber(input.player_count, "player_count", { min: 1, max: 200 });

    // Enforce games limit
    const { count, error: countError } = await supabase
      .from("games")
      .select("id", { count: "exact", head: true })
      .eq("team_id", input.team_id as string);
    if (countError) throw new Error(countError.message);
    if ((count ?? 0) >= MAX_GAMES_PER_TEAM) {
      throw new Error(`Game limit reached. A team may have at most ${MAX_GAMES_PER_TEAM} games.`);
    }

    const { data, error } = await supabase
      .from("games")
      .insert({
        team_id: input.team_id as string,
        game_date: gameDate,
        opponent,
        location,
        is_home: (input.is_home as boolean) ?? true,
        player_count: playerCount,
        result,
        notes,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { game: data };
  },

  list_games: async (input, supabase) => {
    const limit = clampLimit(input.limit, 50, 10);

    let query = supabase
      .from("games")
      .select("*")
      .eq("team_id", input.team_id as string)
      .order("game_date", { ascending: true })
      .limit(limit);

    if (input.upcoming_only) {
      query = query.gte("game_date", new Date().toISOString().split("T")[0]);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return { games: data, count: data?.length ?? 0 };
  },

  update_game: async (input, supabase) => {
    const updates: Record<string, unknown> = {};
    if (input.result !== undefined)
      updates.result = assertOptionalString(input.result, "result", 50);
    if (input.player_count !== undefined)
      updates.player_count = assertOptionalNumber(input.player_count, "player_count", { min: 1, max: 200 });
    if (input.location !== undefined)
      updates.location = assertOptionalString(input.location, "location", 200);
    if (input.notes !== undefined)
      updates.notes = assertOptionalString(input.notes, "notes", 500);

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
