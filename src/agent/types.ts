import type { Team, Budget } from "@/types/database";

export interface TeamContext {
  team: Team;
  activePlayers: number;
  budget: Budget | null;
  totalSpent: number;
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}
