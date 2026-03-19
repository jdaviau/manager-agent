"use client";

const TOOL_LABELS: Record<string, string> = {
  add_player: "Adding player",
  list_players: "Checking roster",
  update_player: "Updating player",
  remove_player: "Removing player",
  set_budget: "Setting budget",
  get_budget_summary: "Checking budget",
  add_expense: "Logging expense",
  list_expenses: "Loading expenses",
  get_expenses_by_category: "Analyzing expenses",
  add_game: "Adding game",
  list_games: "Loading schedule",
  update_game: "Updating game",
  cost_per_player: "Calculating cost per player",
  cost_per_game: "Calculating cost per game",
  financial_summary: "Generating summary",
};

interface Props {
  toolName: string;
}

export function ToolCallIndicator({ toolName }: Props) {
  const label = TOOL_LABELS[toolName] ?? `Running ${toolName}`;

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground py-1.5 px-3 rounded-full bg-muted/80 w-fit border border-border/50">
      <span>{label}</span>
      <span className="flex gap-0.5">
        <span className="w-1 h-1 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
        <span className="w-1 h-1 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
        <span className="w-1 h-1 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
      </span>
    </div>
  );
}
