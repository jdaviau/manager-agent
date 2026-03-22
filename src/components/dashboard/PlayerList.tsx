"use client";

import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Player } from "@/types/database";

const STATUS_VARIANT: Record<Player["status"], "default" | "secondary" | "outline"> = {
  active: "default",
  inactive: "secondary",
  injured: "outline",
};

interface Props {
  players: Player[];
}

export function PlayerList({ players }: Props) {
  if (players.length === 0) {
    return (
      <p className="text-base text-muted-foreground text-center py-6">
        No players yet. Ask the assistant to add some!
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">#</TableHead>
          <TableHead>Name</TableHead>
          <TableHead className="hidden sm:table-cell">Position</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {players.map((player) => (
          <TableRow key={player.id}>
            <TableCell className="text-muted-foreground tabular-nums">
              {player.jersey_number ?? "—"}
            </TableCell>
            <TableCell className="font-medium">{player.name}</TableCell>
            <TableCell className="text-muted-foreground hidden sm:table-cell">
              {player.position ?? "—"}
            </TableCell>
            <TableCell>
              <Badge variant={STATUS_VARIANT[player.status]}>{player.status}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
