"use client";

import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import type { Player } from "@/types/database";

const STATUS_STYLES: Record<Player["status"], string> = {
  active: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  inactive: "bg-muted text-muted-foreground hover:bg-muted",
  injured: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
};

interface Props {
  players: Player[];
}

export function PlayerList({ players }: Props) {
  if (players.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        No players yet. Ask the assistant to add some!
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12 text-xs">#</TableHead>
          <TableHead className="text-xs">Name</TableHead>
          <TableHead className="text-xs hidden sm:table-cell">Position</TableHead>
          <TableHead className="text-xs">Status</TableHead>
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
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[player.status]}`}>
                {player.status}
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
