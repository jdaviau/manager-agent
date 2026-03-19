import type { Tool } from "@anthropic-ai/sdk/resources/messages";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

export const playerToolDefinitions: Tool[] = [
  {
    name: "add_player",
    description: "Add a new player to the team roster.",
    input_schema: {
      type: "object" as const,
      properties: {
        team_id: { type: "string", description: "The team UUID" },
        name: { type: "string", description: "Player's full name" },
        jersey_number: { type: "string", description: "Jersey number (optional)" },
        position: { type: "string", description: "Playing position (optional)" },
        status: {
          type: "string",
          enum: ["active", "inactive", "injured"],
          description: "Player status, defaults to active",
        },
        joined_at: { type: "string", description: "Date joined in YYYY-MM-DD format (optional)" },
        notes: { type: "string", description: "Any additional notes (optional)" },
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
        name: { type: "string", description: "New name (optional)" },
        jersey_number: { type: "string", description: "New jersey number (optional)" },
        position: { type: "string", description: "New position (optional)" },
        status: {
          type: "string",
          enum: ["active", "inactive", "injured"],
          description: "New status (optional)",
        },
        notes: { type: "string", description: "Updated notes (optional)" },
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
    const { data, error } = await supabase
      .from("players")
      .insert({
        team_id: input.team_id as string,
        name: input.name as string,
        jersey_number: (input.jersey_number as string) ?? null,
        position: (input.position as string) ?? null,
        status: (input.status as "active" | "inactive" | "injured") ?? "active",
        joined_at: (input.joined_at as string) ?? null,
        notes: (input.notes as string) ?? null,
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
    if (input.name !== undefined) updates.name = input.name;
    if (input.jersey_number !== undefined) updates.jersey_number = input.jersey_number;
    if (input.position !== undefined) updates.position = input.position;
    if (input.status !== undefined) updates.status = input.status;
    if (input.notes !== undefined) updates.notes = input.notes;

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
