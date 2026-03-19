"use client";

import { Users, DollarSign, Trophy, TrendingUp } from "lucide-react";

interface Props {
  costPerPlayer: number;
  costPerGame: number;
  activePlayers: number;
  totalPlayers: number;
  budgetTotal: number | null;
  budgetSpent: number;
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

export function StatsCards({ costPerPlayer, costPerGame, activePlayers, totalPlayers, budgetTotal, budgetSpent }: Props) {
  const remaining = budgetTotal !== null ? budgetTotal - budgetSpent : null;
  const percentUsed = budgetTotal && budgetTotal > 0 ? Math.round((budgetSpent / budgetTotal) * 100) : null;

  const budgetValue = remaining !== null ? `$${remaining.toFixed(0)}` : "—";
  const budgetSub =
    percentUsed !== null
      ? `${percentUsed}% of $${budgetTotal!.toFixed(0)} used`
      : "No budget set";
  const budgetSubColor =
    percentUsed === null
      ? "text-muted-foreground"
      : percentUsed >= 90
        ? "text-red-600"
        : percentUsed >= 70
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
        label="Budget Left"
        value={budgetValue}
        sub={budgetSub}
        subColor={budgetSubColor}
        iconColor="bg-emerald-100 text-emerald-600"
        trend={percentUsed !== null && percentUsed >= 70 ? { label: `${100 - percentUsed}% left`, positive: false } : null}
      />
      <MetricCard
        icon={<TrendingUp className="h-3.5 w-3.5" />}
        label="Cost / Player"
        value={costPerPlayer > 0 ? `$${costPerPlayer.toFixed(0)}` : "—"}
        sub={costPerPlayer > 0 ? `$${budgetSpent.toFixed(0)} total spend` : "No expenses yet"}
        iconColor="bg-violet-100 text-violet-600"
      />
      <MetricCard
        icon={<Trophy className="h-3.5 w-3.5" />}
        label="Cost / Game"
        value={costPerGame > 0 ? `$${costPerGame.toFixed(0)}` : "—"}
        sub={costPerGame > 0 ? "Based on logged games" : "No games yet"}
        iconColor="bg-orange-100 text-orange-600"
      />
    </div>
  );
}
