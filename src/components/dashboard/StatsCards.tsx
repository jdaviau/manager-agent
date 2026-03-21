"use client";

import { Users, DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import type { Budget } from "@/types/database";

interface Props {
  activePlayers: number;
  totalPlayers: number;
  budget: Budget | null;
  totalSpent: number;
  totalCollected: number;
  totalOutstanding: number;
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  subColor?: string;
  iconColor: string;
  trend?: { label: string; positive: boolean } | null;
}

function MetricCard({ icon, label, value, sub, subColor = "text-muted-foreground", iconColor, trend }: MetricCardProps) {
  return (
    <div className="group/card relative rounded-xl ring-1 ring-foreground/10 shadow-xs bg-gradient-to-t from-primary/5 to-card p-4 flex flex-col gap-3 overflow-hidden transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground leading-tight">{label}</span>
        <div className={`flex items-center justify-center w-7 h-7 rounded-lg ${iconColor} shrink-0`}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight leading-none">{value}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <p className={`text-xs ${subColor}`}>{sub}</p>
          {trend && (
            <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
              trend.positive
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-600"
            }`}>
              {trend.positive ? "▲" : "▼"} {trend.label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function StatsCards({ activePlayers, totalPlayers, budget, totalSpent, totalCollected, totalOutstanding }: Props) {
  const budgetTotal = budget ? Number(budget.total_amount) : null;
  const netRemaining = budgetTotal !== null ? budgetTotal - totalSpent + totalCollected : null;

  const percentSpent = budgetTotal && budgetTotal > 0
    ? Math.round((totalSpent / budgetTotal) * 100)
    : null;

  const expenseSubColor =
    percentSpent === null
      ? "text-muted-foreground"
      : percentSpent >= 90
        ? "text-red-600"
        : percentSpent >= 70
          ? "text-yellow-600"
          : "text-emerald-600";

  const inactivePlayers = totalPlayers - activePlayers;

  return (
    <div className="grid grid-cols-2 gap-3">
      <MetricCard
        icon={<Users className="h-3.5 w-3.5" />}
        label="Active Players"
        value={String(activePlayers)}
        sub={totalPlayers === 0 ? "No roster yet" : inactivePlayers > 0 ? `${inactivePlayers} inactive` : "Full roster active"}
        iconColor="bg-blue-100 text-blue-600"
      />
      <MetricCard
        icon={<DollarSign className="h-3.5 w-3.5" />}
        label="Budget"
        value={budgetTotal !== null ? `$${budgetTotal.toLocaleString()}` : "—"}
        sub={
          budget
            ? netRemaining !== null
              ? `$${netRemaining.toFixed(0)} net remaining`
              : budget.season
            : "No budget set"
        }
        subColor={
          netRemaining === null
            ? "text-muted-foreground"
            : netRemaining < 0
              ? "text-red-600"
              : "text-emerald-600"
        }
        iconColor="bg-emerald-100 text-emerald-600"
      />
      <MetricCard
        icon={<TrendingDown className="h-3.5 w-3.5" />}
        label="Expenses"
        value={totalSpent > 0 ? `$${totalSpent.toLocaleString()}` : "—"}
        sub={
          percentSpent !== null
            ? `${percentSpent}% of $${budgetTotal!.toLocaleString()} budget`
            : totalSpent > 0
              ? "No budget set"
              : "No expenses yet"
        }
        subColor={expenseSubColor}
        iconColor="bg-red-100 text-red-500"
        trend={percentSpent !== null && percentSpent >= 70 ? { label: `${100 - percentSpent}% left`, positive: false } : null}
      />
      <MetricCard
        icon={<TrendingUp className="h-3.5 w-3.5" />}
        label="Collected"
        value={totalCollected > 0 ? `$${totalCollected.toLocaleString()}` : "—"}
        sub={
          totalOutstanding > 0
            ? `$${totalOutstanding.toLocaleString()} outstanding`
            : totalCollected > 0
              ? "All payments received"
              : "No payments yet"
        }
        subColor={totalOutstanding > 0 ? "text-amber-600" : "text-muted-foreground"}
        iconColor="bg-violet-100 text-violet-600"
      />
    </div>
  );
}
