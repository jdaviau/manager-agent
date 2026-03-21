"use client";

import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableFooter } from "@/components/ui/table";
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-xs">Player</TableHead>
          <TableHead className="text-xs hidden sm:table-cell">Description</TableHead>
          <TableHead className="text-xs hidden sm:table-cell">Date</TableHead>
          <TableHead className="text-xs text-right">Amount</TableHead>
          <TableHead className="text-xs">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((p) => (
          <TableRow key={p.id}>
            <TableCell className="font-medium">
              {playerMap[p.player_id] ?? "Unknown"}
            </TableCell>
            <TableCell className="text-muted-foreground text-xs hidden sm:table-cell truncate max-w-[140px]">
              {p.description}
            </TableCell>
            <TableCell className="text-muted-foreground text-xs hidden sm:table-cell tabular-nums">
              {p.payment_date}
            </TableCell>
            <TableCell className="text-right font-medium tabular-nums">
              ${Number(p.amount).toFixed(2)}
            </TableCell>
            <TableCell>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[p.status]}`}>
                {p.status}
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      {totalCollected > 0 && (
        <TableFooter>
          <TableRow>
            <TableCell colSpan={4} className="text-xs font-medium">Collected</TableCell>
            <TableCell className="text-right font-semibold tabular-nums text-emerald-600">
              ${totalCollected.toFixed(2)}
            </TableCell>
          </TableRow>
        </TableFooter>
      )}
    </Table>
  );
}
