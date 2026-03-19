import type { Tool } from "@anthropic-ai/sdk/resources/messages";
import { assertString, assertOptionalString, assertOptionalDate } from "./validate";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

const MAX_ROSTER_SIZE = 50;

export const playerToolDefinitions: Tool[] = [
  {
    name: "add_player",
    description: "Add a new player to the team roster. Maximum 50 players per team.",
    input_schema: {
      type: "object" as const,
      properties: {
        team_id: { type: "string", description: "The team UUID" },
        name: { type: "string", description: "Player's full name (max 100 characters)" },
        jersey_number: { type: "string", description: "Jersey number, e.g. '7' (optional, max 10 characters)" },
        position: { type: "string", description: "Playing position (optional, max 100 characters)" },
        status: {
          type: "string",
          enum: ["active", "inactive", "injured"],
          description: "Player status, defaults to active",
        },
        joined_at: { type: "string", description: "Date joined in YYYY-MM-DD format (optional)" },
        notes: { type: "string", description: "Any additional notes (optional, max 500 characters)" },
      },
      required: ["team_id", "name"],
    },
  },
  {
    name: "list_players",
    description: "List all players on the team, optionally filtered by status.",
    input_schema: {
      type: "object" as const,
      properties: {
        team_id: { type: "string", description: "The team UUID" },
        status: {
          type: "string",
          enum: ["active", "inactive", "injured"],
          description: "Filter by status (optional, returns all if omitted)",
        },
      },
      required: ["team_id"],
    },
  },
  {
    name: "update_player",
    description: "Update an existing player's information.",
    input_schema: {
      type: "object" as const,
      properties: {
        player_id: { type: "string", description: "The player UUID" },
        name: { type: "string", description: "New name (optional, max 100 characters)" },
        jersey_number: { type: "string", description: "New jersey number (optional, max 10 characters)" },
        position: { type: "string", description: "New position (optional, max 100 characters)" },
        status: {
          type: "string",
          enum: ["active", "inactive", "injured"],
          description: "New status (optional)",
        },
        notes: { type: "string", description: "Updated notes (optional, max 500 characters)" },
      },
      required: ["player_id"],
    },
  },
  {
    name: "remove_player",
    description: "Remove a player from the team roster.",
    input_schema: {
      type: "object" as const,
      properties: {
        player_id: { type: "string", description: "The player UUID to remove" },
      },
      required: ["player_id"],
    },
  },
];

type Input = Record<string, unknown>;
type Executor = (input: Input, supabase: SupabaseClient) => Promise<unknown>;

export const playerExecutors: Record<string, Executor> = {
  add_player: async (input, supabase) => {
    const name = assertString(input.name, "name", { max: 100 });
    const jerseyNumber = assertOptionalString(input.jersey_number, "jersey_number", 10);
    const position = assertOptionalString(input.position, "position", 100);
    const notes = assertOptionalString(input.notes, "notes", 500);
    const joinedAt = assertOptionalDate(input.joined_at, "joined_at");

    // Enforce roster size limit
    const { count, error: countError } = await supabase
      .from("players")
      .select("id", { count: "exact", head: true })
      .eq("team_id", input.team_id as string);
    if (countError) throw new Error(countError.message);
    if ((count ?? 0) >= MAX_ROSTER_SIZE) {
      throw new Error(
        `Roster limit reached. A team may have at most ${MAX_ROSTER_SIZE} players. Remove or deactivate a player first.`
      );
    }

    const { data, error } = await supabase
      .from("players")
      .insert({
        team_id: input.team_id as string,
        name,
        jersey_number: jerseyNumber,
        position,
        status: (input.status as "active" | "inactive" | "injured") ?? "active",
        joined_at: joinedAt,
        notes,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { player: data };
  },

  list_players: async (input, supabase) => {
    let query = supabase
      .from("players")
      .select("*")
      .eq("team_id", input.team_id as string)
      .order("name");
    if (input.status) {
      query = query.eq("status", input.status as string);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return { players: data, count: data.length };
  },

  update_player: async (input, supabase) => {
    const updates: Record<string, unknown> = {};
    if (input.name !== undefined)
      updates.name = assertString(input.name, "name", { max: 100 });
    if (input.jersey_number !== undefined)
      updates.jersey_number = assertOptionalString(input.jersey_number, "jersey_number", 10);
    if (input.position !== undefined)
      updates.position = assertOptionalString(input.position, "position", 100);
    if (input.status !== undefined)
      updates.status = input.status;
    if (input.notes !== undefined)
      updates.notes = assertOptionalString(input.notes, "notes", 500);

    const { data, error } = await supabase
      .from("players")
      .update(updates)
      .eq("id", input.player_id as string)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { player: data };
  },

  remove_player: async (input, supabase) => {
    const { data: player, error: fetchError } = await supabase
      .from("players")
      .select("name")
      .eq("id", input.player_id as string)
      .single();
    if (fetchError) throw new Error(fetchError.message);

    const { error } = await supabase
      .from("players")
      .delete()
      .eq("id", input.player_id as string);
    if (error) throw new Error(error.message);
    return { success: true, removed_name: player.name };
  },
};
