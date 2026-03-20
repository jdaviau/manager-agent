import type { Tool } from "@anthropic-ai/sdk/resources/messages";
import type { PaymentStatus } from "@/types/database";
import {
  assertString,
  assertOptionalString,
  assertNumber,
  assertOptionalNumber,
  assertOptionalDate,
  assertSeason,
  clampLimit,
} from "./validate";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

const MAX_PAYMENTS_PER_TEAM = 500;

export const paymentToolDefinitions: Tool[] = [
  {
    name: "add_player_payment",
    description:
      "Log a payment from a player toward the team's costs (dues, registration fees, etc.). Payments offset the team's expenses in the budget.",
    input_schema: {
      type: "object" as const,
      properties: {
        team_id: { type: "string", description: "The team UUID" },
        player_name: { type: "string", description: "The player's name (will be matched against the roster)" },
        amount: { type: "number", description: "Payment amount in dollars ($0.01 – $100,000)" },
        description: { type: "string", description: "What the payment is for (max 200 characters)" },
        status: {
          type: "string",
          enum: ["outstanding", "partial", "paid"],
          description: "Payment status — outstanding (expected, not received), partial (partially received), paid (received in full). Defaults to outstanding.",
        },
        payment_date: { type: "string", description: "Date in YYYY-MM-DD format (defaults to today)" },
        season: { type: "string", description: "Season to link the payment to, e.g. '2025-2026' (optional)" },
        notes: { type: "string", description: "Optional additional notes (max 500 characters)" },
      },
      required: ["team_id", "player_name", "amount", "description"],
    },
  },
  {
    name: "update_player_payment",
    description: "Update the status or amount of an existing player payment (e.g. mark as paid).",
    input_schema: {
      type: "object" as const,
      properties: {
        payment_id: { type: "string", description: "The payment UUID" },
        status: {
          type: "string",
          enum: ["outstanding", "partial", "paid"],
          description: "New payment status (optional)",
        },
        amount: { type: "number", description: "Updated amount in dollars (optional, $0.01 – $100,000)" },
        notes: { type: "string", description: "Updated notes (optional, max 500 characters)" },
      },
      required: ["payment_id"],
    },
  },
  {
    name: "list_player_payments",
    description: "List player payments for the team, optionally filtered by player name or status.",
    input_schema: {
      type: "object" as const,
      properties: {
        team_id: { type: "string", description: "The team UUID" },
        player_name: { type: "string", description: "Filter by player name (optional)" },
        status: {
          type: "string",
          enum: ["outstanding", "partial", "paid"],
          description: "Filter by payment status (optional)",
        },
        limit: { type: "number", description: "Max number of results (default 20, max 100)" },
      },
      required: ["team_id"],
    },
  },
  {
    name: "get_payment_summary",
    description: "Get a summary of player payments — total collected, total outstanding, and per-player breakdown.",
    input_schema: {
      type: "object" as const,
      properties: {
        team_id: { type: "string", description: "The team UUID" },
        season: { type: "string", description: "Filter by season (optional, e.g. '2025-2026')" },
      },
      required: ["team_id"],
    },
  },
];

type Input = Record<string, unknown>;
type Executor = (input: Input, supabase: SupabaseClient) => Promise<unknown>;

/** Resolves a player name to a single player ID using case-insensitive search. */
async function resolvePlayerByName(
  teamId: string,
  playerName: string,
  supabase: SupabaseClient
): Promise<{ id: string; name: string }> {
  const { data, error } = await supabase
    .from("players")
    .select("id, name")
    .eq("team_id", teamId)
    .ilike("name", `%${playerName}%`);

  if (error) throw new Error(error.message);
  if (!data || data.length === 0)
    throw new Error(`No player found matching "${playerName}". Use list_players to check the roster.`);
  if (data.length > 1) {
    const names = data.map((p: { name: string }) => p.name).join(", ");
    throw new Error(`Multiple players match "${playerName}": ${names}. Please be more specific.`);
  }
  return data[0] as { id: string; name: string };
}

export const paymentExecutors: Record<string, Executor> = {
  add_player_payment: async (input, supabase) => {
    const playerName = assertString(input.player_name, "player_name", { max: 100 });
    const amount = assertNumber(input.amount, "amount", { min: 0.01, max: 100_000 });
    const description = assertString(input.description, "description", { max: 200 });
    const notes = assertOptionalString(input.notes, "notes", 500);
    const paymentDate = assertOptionalDate(input.payment_date, "payment_date")
      ?? new Date().toISOString().split("T")[0];
    const status = (input.status as PaymentStatus) ?? "outstanding";

    // Enforce payments limit
    const { count, error: countError } = await supabase
      .from("player_payments")
      .select("id", { count: "exact", head: true })
      .eq("team_id", input.team_id as string);
    if (countError) throw new Error(countError.message);
    if ((count ?? 0) >= MAX_PAYMENTS_PER_TEAM) {
      throw new Error(`Payment limit reached. A team may have at most ${MAX_PAYMENTS_PER_TEAM} payments.`);
    }

    // Resolve player
    const player = await resolvePlayerByName(input.team_id as string, playerName, supabase);

    // Optionally resolve budget_id
    let budgetId: string | null = null;
    if (input.season) {
      const season = assertSeason(input.season);
      const { data: budget } = await supabase
        .from("budgets")
        .select("id")
        .eq("team_id", input.team_id as string)
        .eq("season", season)
        .maybeSingle();
      budgetId = budget?.id ?? null;
    }

    const { data: payment, error } = await supabase
      .from("player_payments")
      .insert({
        team_id: input.team_id as string,
        player_id: player.id,
        budget_id: budgetId,
        amount,
        payment_date: paymentDate,
        status,
        description,
        notes,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { payment, player_name: player.name };
  },

  update_player_payment: async (input, supabase) => {
    const updates: Record<string, unknown> = {};
    if (input.status !== undefined) updates.status = input.status;
    if (input.amount !== undefined)
      updates.amount = assertNumber(input.amount, "amount", { min: 0.01, max: 100_000 });
    if (input.notes !== undefined)
      updates.notes = assertOptionalString(input.notes, "notes", 500);

    if (Object.keys(updates).length === 0) {
      throw new Error("No fields to update. Provide at least one of: status, amount, notes.");
    }

    const { data, error } = await supabase
      .from("player_payments")
      .update(updates)
      .eq("id", input.payment_id as string)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { payment: data };
  },

  list_player_payments: async (input, supabase) => {
    const limit = clampLimit(input.limit, 100, 20);

    let playerId: string | null = null;
    if (input.player_name) {
      const player = await resolvePlayerByName(
        input.team_id as string,
        input.player_name as string,
        supabase
      );
      playerId = player.id;
    }

    let query = supabase
      .from("player_payments")
      .select("*, players(name)")
      .eq("team_id", input.team_id as string)
      .order("payment_date", { ascending: false })
      .limit(limit);

    if (playerId) query = query.eq("player_id", playerId);
    if (input.status) query = query.eq("status", input.status as string);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    // Flatten player name onto each payment
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payments = (data ?? []).map((p: any) => ({
      ...p,
      player_name: p.players?.name ?? "Unknown",
      players: undefined,
    }));

    const totalCollected = payments
      .filter((p: { status: PaymentStatus }) => p.status === "paid" || p.status === "partial")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

    return { payments, count: payments.length, total_collected: totalCollected };
  },

  get_payment_summary: async (input, supabase) => {
    let query = supabase
      .from("player_payments")
      .select("*, players(name)")
      .eq("team_id", input.team_id as string);

    if (input.season) {
      const season = assertSeason(input.season);
      const { data: budget } = await supabase
        .from("budgets")
        .select("id")
        .eq("team_id", input.team_id as string)
        .eq("season", season)
        .maybeSingle();
      if (budget) query = query.eq("budget_id", budget.id);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payments = (data ?? []) as any[];

    // Per-player aggregation
    const byPlayer: Record<string, { player_name: string; collected: number; outstanding: number; payment_count: number }> = {};
    let totalCollected = 0;
    let totalOutstanding = 0;

    for (const p of payments) {
      const pid = p.player_id;
      if (!byPlayer[pid]) {
        byPlayer[pid] = { player_name: p.players?.name ?? "Unknown", collected: 0, outstanding: 0, payment_count: 0 };
      }
      byPlayer[pid].payment_count++;
      if (p.status === "paid" || p.status === "partial") {
        byPlayer[pid].collected += Number(p.amount);
        totalCollected += Number(p.amount);
      } else {
        byPlayer[pid].outstanding += Number(p.amount);
        totalOutstanding += Number(p.amount);
      }
    }

    return {
      total_collected: totalCollected,
      total_outstanding: totalOutstanding,
      payment_count: payments.length,
      by_player: Object.values(byPlayer).sort((a, b) => b.collected - a.collected),
    };
  },
};
