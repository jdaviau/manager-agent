"use client";

import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PlayerList } from "./PlayerList";
import { BudgetSummary } from "./BudgetSummary";
import { ExpenseList } from "./ExpenseList";
import { GamesList } from "./GamesList";
import { PaymentList } from "./PaymentList";
import { StatsCards } from "./StatsCards";
import { useDashboard } from "@/hooks/useDashboard";

type Panel = "players" | "budget" | "expenses" | "games" | "payments";

interface Props {
  teamId: string;
}

export function DashboardPanel({ teamId }: Props) {
  const [panel, setPanel] = useState<Panel>("players");
  const { players, budget, expenses, games, payments, activePlayers, totalSpent, totalCollected, totalOutstanding } =
    useDashboard(teamId);

  function handleToggle(values: string[]) {
    if (values.length > 0) setPanel(values[0] as Panel);
  }

  return (
    <div className="flex flex-col h-full bg-muted/40">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <StatsCards
            activePlayers={activePlayers}
            totalPlayers={players.length}
            budget={budget}
            totalSpent={totalSpent}
            totalCollected={totalCollected}
            totalOutstanding={totalOutstanding}
          />

          <ToggleGroup
            value={[panel]}
            onValueChange={handleToggle}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <ToggleGroupItem value="players" className="flex-1 text-xs">
              Players {players.length > 0 && <span className="ml-1 opacity-50">({players.length})</span>}
            </ToggleGroupItem>
            <ToggleGroupItem value="budget" className="flex-1 text-xs">Budget</ToggleGroupItem>
            <ToggleGroupItem value="expenses" className="flex-1 text-xs">Expenses</ToggleGroupItem>
            <ToggleGroupItem value="games" className="flex-1 text-xs">Games</ToggleGroupItem>
            <ToggleGroupItem value="payments" className="flex-1 text-xs">Payments</ToggleGroupItem>
          </ToggleGroup>

          <div className="rounded-xl border bg-card p-4 shadow-xs">
            {panel === "players" && <PlayerList players={players} />}
            {panel === "budget" && <BudgetSummary budget={budget} expenses={expenses} totalCollected={totalCollected} />}
            {panel === "expenses" && <ExpenseList expenses={expenses} />}
            {panel === "games" && <GamesList games={games} />}
            {panel === "payments" && <PaymentList payments={payments} players={players} />}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
