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
  iconBg: string;
  iconColor: string;
}

function MetricCard({ icon, label, value, sub, subColor = "text-muted-foreground", iconBg, iconColor }: MetricCardProps) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
        <div className={`flex items-center justify-center w-7 h-7 rounded-lg ${iconBg} ${iconColor}`}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight leading-none">{value}</p>
        <p className={`text-xs mt-1.5 ${subColor}`}>{sub}</p>
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
          : "text-green-600";

  return (
    <div className="grid grid-cols-2 gap-3">
      <MetricCard
        icon={<Users className="h-3.5 w-3.5" />}
        label="Active Players"
        value={String(activePlayers)}
        sub={totalPlayers === activePlayers ? "Full roster" : `${totalPlayers - activePlayers} inactive`}
        iconBg="bg-blue-50"
        iconColor="text-blue-600"
      />
      <MetricCard
        icon={<DollarSign className="h-3.5 w-3.5" />}
        label="Budget Left"
        value={budgetValue}
        sub={budgetSub}
        subColor={budgetSubColor}
        iconBg="bg-emerald-50"
        iconColor="text-emerald-600"
      />
      <MetricCard
        icon={<TrendingUp className="h-3.5 w-3.5" />}
        label="Cost / Player"
        value={costPerPlayer > 0 ? `$${costPerPlayer.toFixed(0)}` : "—"}
        sub={costPerPlayer > 0 ? `$${budgetSpent.toFixed(0)} total spend` : "No expenses yet"}
        iconBg="bg-violet-50"
        iconColor="text-violet-600"
      />
      <MetricCard
        icon={<Trophy className="h-3.5 w-3.5" />}
        label="Cost / Game"
        value={costPerGame > 0 ? `$${costPerGame.toFixed(0)}` : "—"}
        sub={costPerGame > 0 ? "Based on logged games" : "No games yet"}
        iconBg="bg-orange-50"
        iconColor="text-orange-600"
      />
    </div>
  );
}
