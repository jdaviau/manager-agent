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
  teamName: string;
}

export function DashboardPanel({ teamId, teamName }: Props) {
  const { players, budget, expenses, games, costPerPlayer, costPerGame, isLoading } =
    useDashboard(teamId);

  return (
    <div className="flex flex-col h-full bg-muted/20">
      <div className="px-4 py-3 border-b bg-background">
        <h2 className="font-semibold text-sm">{teamName}</h2>
        <p className="text-xs text-muted-foreground">Team Dashboard</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <StatsCards costPerPlayer={costPerPlayer} costPerGame={costPerGame} />

          <Tabs defaultValue="players">
            <TabsList className="w-full">
              <TabsTrigger value="players" className="flex-1 text-xs">
                Players ({players.length})
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
              <PlayerList players={players} />
            </TabsContent>
            <TabsContent value="budget" className="mt-3">
              <BudgetSummary budget={budget} expenses={expenses} />
            </TabsContent>
            <TabsContent value="expenses" className="mt-3">
              <ExpenseList expenses={expenses} />
            </TabsContent>
            <TabsContent value="games" className="mt-3">
              <GamesList games={games} />
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}
