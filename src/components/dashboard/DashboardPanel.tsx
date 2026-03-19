"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlayerList } from "./PlayerList";
import { BudgetSummary } from "./BudgetSummary";
import { ExpenseList } from "./ExpenseList";
import { GamesList } from "./GamesList";
import { StatsCards } from "./StatsCards";
import { useDashboard } from "@/hooks/useDashboard";

interface Props {
  teamId: string;
}

export function DashboardPanel({ teamId }: Props) {
  const { players, budget, expenses, games, costPerPlayer, costPerGame, activePlayers, totalSpent } =
    useDashboard(teamId);

  return (
    <div className="flex flex-col h-full bg-muted/10">

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <StatsCards
            costPerPlayer={costPerPlayer}
            costPerGame={costPerGame}
            activePlayers={activePlayers}
            totalPlayers={players.length}
            budgetTotal={budget ? Number(budget.total_amount) : null}
            budgetSpent={totalSpent}
          />

          <Tabs defaultValue="players">
            <TabsList className="w-full bg-muted/60">
              <TabsTrigger value="players" className="flex-1 text-xs">
                Players {players.length > 0 && <span className="ml-1 opacity-60">({players.length})</span>}
              </TabsTrigger>
              <TabsTrigger value="budget" className="flex-1 text-xs">
                Budget
              </TabsTrigger>
              <TabsTrigger value="expenses" className="flex-1 text-xs">
                Expenses
              </TabsTrigger>
              <TabsTrigger value="games" className="flex-1 text-xs">
                Games
              </TabsTrigger>
            </TabsList>

            <TabsContent value="players" className="mt-3">
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <PlayerList players={players} />
              </div>
            </TabsContent>
            <TabsContent value="budget" className="mt-3">
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <BudgetSummary budget={budget} expenses={expenses} />
              </div>
            </TabsContent>
            <TabsContent value="expenses" className="mt-3">
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <ExpenseList expenses={expenses} />
              </div>
            </TabsContent>
            <TabsContent value="games" className="mt-3">
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <GamesList games={games} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}
