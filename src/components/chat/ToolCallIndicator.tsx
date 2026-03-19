"use client";

const TOOL_LABELS: Record<string, string> = {
  add_player: "Adding player...",
  list_players: "Checking roster...",
  update_player: "Updating player...",
  remove_player: "Removing player...",
  set_budget: "Setting budget...",
  get_budget_summary: "Checking budget...",
  add_expense: "Logging expense...",
  list_expenses: "Loading expenses...",
  get_expenses_by_category: "Analyzing expenses...",
  add_game: "Adding game...",
  list_games: "Loading schedule...",
  update_game: "Updating game...",
  cost_per_player: "Calculating cost per player...",
  cost_per_game: "Calculating cost per game...",
  financial_summary: "Generating summary...",
};

interface Props {
  toolName: string;
}

export function ToolCallIndicator({ toolName }: Props) {
  const label = TOOL_LABELS[toolName] ?? `Running ${toolName}...`;

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground py-1 px-3 rounded-full bg-muted w-fit animate-pulse">
      <div className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
      {label}
    </div>
  );
}
