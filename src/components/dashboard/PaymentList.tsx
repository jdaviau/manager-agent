"use client";

import type { PlayerPayment, Player } from "@/types/database";

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700",
  partial: "bg-amber-100 text-amber-700",
  outstanding: "bg-red-100 text-red-700",
};

interface Props {
  payments: PlayerPayment[];
  players: Player[];
}

export function PaymentList({ payments, players }: Props) {
  const playerMap = Object.fromEntries(players.map((p) => [p.id, p.name]));

  const totalCollected = payments
    .filter((p) => p.status === "paid" || p.status === "partial")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  if (payments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        No payments logged yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
        {payments.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {playerMap[p.player_id] ?? "Unknown"}
              </p>
              <p className="text-xs text-muted-foreground truncate">{p.description}</p>
            </div>
            <div className="text-right shrink-0 space-y-0.5">
              <p className="font-semibold">${Number(p.amount).toFixed(2)}</p>
              <p className="text-[10px] text-muted-foreground">{p.payment_date}</p>
            </div>
            <span
              className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${STATUS_STYLES[p.status]}`}
            >
              {p.status}
            </span>
          </div>
        ))}
      </div>

      {totalCollected > 0 && (
        <div className="flex justify-end pt-1 text-xs font-medium text-emerald-600">
          Collected: ${totalCollected.toFixed(2)}
        </div>
      )}
    </div>
  );
}
