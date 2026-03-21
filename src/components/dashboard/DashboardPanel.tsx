"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PlayerList } from "./PlayerList";
import { BudgetSummary } from "./BudgetSummary";
import { ExpenseList } from "./ExpenseList";
import { GamesList } from "./GamesList";
import { PaymentList } from "./PaymentList";
import { StatsCards } from "./StatsCards";
import { useDashboard } from "@/hooks/useDashboard";

interface Props {
  teamId: string;
}

export function DashboardPanel({ teamId }: Props) {
  const { players, budget, expenses, games, payments, activePlayers, totalSpent, totalCollected, totalOutstanding } =
    useDashboard(teamId);

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

          <Tabs defaultValue="players">
            <TabsList className="w-full">
              <TabsTrigger value="players" className="flex-1 text-xs">
                Players {players.length > 0 && <span className="ml-1 opacity-50">({players.length})</span>}
              </TabsTrigger>
              <TabsTrigger value="budget" className="flex-1 text-xs">Budget</TabsTrigger>
              <TabsTrigger value="expenses" className="flex-1 text-xs">Expenses</TabsTrigger>
              <TabsTrigger value="games" className="flex-1 text-xs">Games</TabsTrigger>
              <TabsTrigger value="payments" className="flex-1 text-xs">Payments</TabsTrigger>
            </TabsList>

            <TabsContent value="players" className="mt-3">
              <div className="rounded-xl border bg-card p-4 shadow-xs">
                <PlayerList players={players} />
              </div>
            </TabsContent>
            <TabsContent value="budget" className="mt-3">
              <div className="rounded-xl border bg-card p-4 shadow-xs">
                <BudgetSummary budget={budget} expenses={expenses} totalCollected={totalCollected} />
              </div>
            </TabsContent>
            <TabsContent value="expenses" className="mt-3">
              <div className="rounded-xl border bg-card p-4 shadow-xs">
                <ExpenseList expenses={expenses} />
              </div>
            </TabsContent>
            <TabsContent value="games" className="mt-3">
              <div className="rounded-xl border bg-card p-4 shadow-xs">
                <GamesList games={games} />
              </div>
            </TabsContent>
            <TabsContent value="payments" className="mt-3">
              <div className="rounded-xl border bg-card p-4 shadow-xs">
                <PaymentList payments={payments} players={players} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}
