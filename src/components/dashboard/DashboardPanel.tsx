"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LayoutDashboard, Calendar } from "lucide-react";
import { PlayerList } from "./PlayerList";
import { BudgetSummary } from "./BudgetSummary";
import { ExpenseList } from "./ExpenseList";
import { GamesList } from "./GamesList";
import { StatsCards } from "./StatsCards";
import { useDashboard } from "@/hooks/useDashboard";

interface Props {
  teamId: string;
  teamName: string;
  teamSeason: string | null;
}

export function DashboardPanel({ teamId, teamName, teamSeason }: Props) {
  const { players, budget, expenses, games, costPerPlayer, costPerGame, activePlayers, totalSpent, isLoading } =
    useDashboard(teamId);

  return (
    <div className="flex flex-col h-full bg-muted/10">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-white shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary shrink-0">
            <LayoutDashboard className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-sm leading-tight truncate">{teamName}</h2>
            <p className="text-xs text-muted-foreground">Overview</p>
          </div>
          {isLoading && (
            <div className="w-3.5 h-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
          )}
        </div>
        {teamSeason && (
          <div className="mt-2.5 flex items-center gap-1.5">
            <div className="flex items-center gap-1 bg-muted/60 border border-border rounded-full px-2.5 py-1">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">{teamSeason}</span>
            </div>
          </div>
        )}
      </div>

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
