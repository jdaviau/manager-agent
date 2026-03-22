"use client";

import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableFooter } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { PlayerPayment, Player } from "@/types/database";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  paid: "default",
  partial: "secondary",
  outstanding: "destructive",
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
      <p className="text-base text-muted-foreground text-center py-6">
        No payments logged yet.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Player</TableHead>
          <TableHead className="hidden sm:table-cell">Description</TableHead>
          <TableHead className="hidden sm:table-cell">Date</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((p) => (
          <TableRow key={p.id}>
            <TableCell className="font-medium">
              {playerMap[p.player_id] ?? "Unknown"}
            </TableCell>
            <TableCell className="text-muted-foreground hidden sm:table-cell truncate max-w-[140px]">
              {p.description}
            </TableCell>
            <TableCell className="text-muted-foreground hidden sm:table-cell tabular-nums">
              {p.payment_date}
            </TableCell>
            <TableCell className="text-right font-medium tabular-nums">
              ${Number(p.amount).toFixed(2)}
            </TableCell>
            <TableCell>
              <Badge variant={STATUS_VARIANT[p.status] ?? "secondary"}>{p.status}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      {totalCollected > 0 && (
        <TableFooter>
          <TableRow>
            <TableCell colSpan={4} className="font-medium">Collected</TableCell>
            <TableCell className="text-right font-semibold tabular-nums">
              ${totalCollected.toFixed(2)}
            </TableCell>
          </TableRow>
        </TableFooter>
      )}
    </Table>
  );
}
