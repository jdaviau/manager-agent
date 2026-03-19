import type { Tool } from "@anthropic-ai/sdk/resources/messages";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

import { playerToolDefinitions, playerExecutors } from "./tools/playerTools";
import { budgetToolDefinitions, budgetExecutors } from "./tools/budgetTools";
import { expenseToolDefinitions, expenseExecutors } from "./tools/expenseTools";
import { gameToolDefinitions, gameExecutors } from "./tools/gameTools";
import { analysisToolDefinitions, analysisExecutors } from "./tools/analysisTools";

export const allTools: Tool[] = [
  ...playerToolDefinitions,
  ...budgetToolDefinitions,
  ...expenseToolDefinitions,
  ...gameToolDefinitions,
  ...analysisToolDefinitions,
];

type Executor = (
  input: Record<string, unknown>,
  supabase: SupabaseClient
) => Promise<unknown>;

export const allExecutors: Record<string, Executor> = {
  ...playerExecutors,
  ...budgetExecutors,
  ...expenseExecutors,
  ...gameExecutors,
  ...analysisExecutors,
};

export async function executeTool(
  name: string,
  input: Record<string, unknown>,
  supabase: SupabaseClient
): Promise<{ success: boolean; result?: unknown; error?: string }> {
  const executor = allExecutors[name];
  if (!executor) {
    return { success: false, error: `Unknown tool: ${name}` };
  }
  try {
    const result = await executor(input, supabase);
    return { success: true, result };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}
