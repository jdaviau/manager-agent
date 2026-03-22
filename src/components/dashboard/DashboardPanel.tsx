"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="flex flex-col h-full bg-background">
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 flex flex-col gap-4">
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
              <TabsTrigger value="players" className="flex-1">
                Players {players.length > 0 && <span className="ml-1 opacity-50">({players.length})</span>}
              </TabsTrigger>
              <TabsTrigger value="budget" className="flex-1">Budget</TabsTrigger>
              <TabsTrigger value="expenses" className="flex-1">Expenses</TabsTrigger>
              <TabsTrigger value="games" className="flex-1">Games</TabsTrigger>
              <TabsTrigger value="payments" className="flex-1">Payments</TabsTrigger>
            </TabsList>

            <TabsContent value="players" className="mt-3">
              <Card><CardContent className="pt-4 px-0"><PlayerList players={players} /></CardContent></Card>
            </TabsContent>
            <TabsContent value="budget" className="mt-3">
              <Card><CardContent className="pt-4"><BudgetSummary budget={budget} expenses={expenses} totalCollected={totalCollected} /></CardContent></Card>
            </TabsContent>
            <TabsContent value="expenses" className="mt-3">
              <Card><CardContent className="pt-4 px-0"><ExpenseList expenses={expenses} /></CardContent></Card>
            </TabsContent>
            <TabsContent value="games" className="mt-3">
              <Card><CardContent className="pt-4 px-0"><GamesList games={games} /></CardContent></Card>
            </TabsContent>
            <TabsContent value="payments" className="mt-3">
              <Card><CardContent className="pt-4 px-0"><PaymentList payments={payments} players={players} /></CardContent></Card>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}
