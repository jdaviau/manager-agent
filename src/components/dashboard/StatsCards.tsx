"use client";

import { Users, DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Budget } from "@/types/database";

interface Props {
  activePlayers: number;
  totalPlayers: number;
  budget: Budget | null;
  totalSpent: number;
  totalCollected: number;
  totalOutstanding: number;
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function StatsCards({ activePlayers, totalPlayers, budget, totalSpent, totalCollected, totalOutstanding }: Props) {
  const budgetTotal = budget ? Number(budget.total_amount) : null;
  const netRemaining = budgetTotal !== null ? budgetTotal - totalSpent + totalCollected : null;
  const percentSpent = budgetTotal && budgetTotal > 0 ? Math.round((totalSpent / budgetTotal) * 100) : null;
  const inactivePlayers = totalPlayers - activePlayers;

  return (
    <div className="grid grid-cols-2 gap-3 @container">
      {/* Active Players */}
      <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs">
        <CardHeader>
          <CardDescription className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Active Players
          </CardDescription>
          <CardTitle className="text-3xl font-bold tabular-nums">{activePlayers}</CardTitle>
          <CardAction>
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-100 text-blue-600 shrink-0">
              <Users className="h-3.5 w-3.5" />
            </div>
          </CardAction>
        </CardHeader>
        <CardFooter>
          <span className="text-xs text-muted-foreground">
            {totalPlayers === 0
              ? "No roster yet"
              : inactivePlayers > 0
                ? `${inactivePlayers} inactive`
                : "Full roster active"}
          </span>
        </CardFooter>
      </Card>

      {/* Budget */}
      <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs">
        <CardHeader>
          <CardDescription className="flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5" />
            Budget
          </CardDescription>
          <CardTitle className="text-3xl font-bold tabular-nums">
            {budgetTotal !== null ? `$${fmt(budgetTotal)}` : "—"}
          </CardTitle>
          <CardAction>
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 shrink-0">
              <DollarSign className="h-3.5 w-3.5" />
            </div>
          </CardAction>
        </CardHeader>
        <CardFooter>
          {netRemaining !== null ? (
            <span className={`text-xs font-medium ${netRemaining < 0 ? "text-red-600" : "text-emerald-600"}`}>
              ${fmt(netRemaining)} net remaining
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              {budget ? budget.season : "No budget set"}
            </span>
          )}
        </CardFooter>
      </Card>

      {/* Expenses */}
      <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs">
        <CardHeader>
          <CardDescription className="flex items-center gap-1.5">
            <TrendingDown className="h-3.5 w-3.5" />
            Expenses
          </CardDescription>
          <CardTitle className="text-3xl font-bold tabular-nums">
            {totalSpent > 0 ? `$${fmt(totalSpent)}` : "—"}
          </CardTitle>
          <CardAction>
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-red-100 text-red-500 shrink-0">
              <TrendingDown className="h-3.5 w-3.5" />
            </div>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex items-center justify-between gap-2">
          <span className={`text-xs ${
            percentSpent === null
              ? "text-muted-foreground"
              : percentSpent >= 90
                ? "text-red-600 font-medium"
                : percentSpent >= 70
                  ? "text-yellow-600 font-medium"
                  : "text-muted-foreground"
          }`}>
            {percentSpent !== null
              ? `${percentSpent}% of $${fmt(budgetTotal!)} budget`
              : totalSpent > 0 ? "No budget set" : "No expenses yet"}
          </span>
          {percentSpent !== null && percentSpent >= 70 && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
              {100 - percentSpent}% left
            </Badge>
          )}
        </CardFooter>
      </Card>

      {/* Collected */}
      <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs">
        <CardHeader>
          <CardDescription className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            Collected
          </CardDescription>
          <CardTitle className="text-3xl font-bold tabular-nums">
            {totalCollected > 0 ? `$${fmt(totalCollected)}` : "—"}
          </CardTitle>
          <CardAction>
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-violet-100 text-violet-600 shrink-0">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
          </CardAction>
        </CardHeader>
        <CardFooter>
          <span className={`text-xs ${totalOutstanding > 0 ? "text-amber-600 font-medium" : "text-muted-foreground"}`}>
            {totalOutstanding > 0
              ? `$${fmt(totalOutstanding)} outstanding`
              : totalCollected > 0
                ? "All payments received"
                : "No payments yet"}
          </span>
        </CardFooter>
      </Card>
    </div>
  );
}
