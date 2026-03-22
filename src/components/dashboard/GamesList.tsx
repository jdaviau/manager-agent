"use client";

import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Game } from "@/types/database";

function ResultBadge({ result }: { result: string | null }) {
  if (!result) return <span className="text-muted-foreground">—</span>;
  const isWin = result.toUpperCase().startsWith("W");
  const isLoss = result.toUpperCase().startsWith("L");
  const variant = isWin ? "default" : isLoss ? "destructive" : "secondary";
  return <Badge variant={variant}>{result}</Badge>;
}

interface Props {
  games: Game[];
}

export function GamesList({ games }: Props) {
  if (games.length === 0) {
    return (
      <p className="text-base text-muted-foreground text-center py-6">
        No games scheduled. Ask the assistant to add one!
      </p>
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const upcoming = games.filter((g) => g.game_date >= today);
  const past = [...games.filter((g) => g.game_date < today)].reverse();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Opponent</TableHead>
          <TableHead className="hidden sm:table-cell">Location</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Result</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {upcoming.length > 0 && upcoming.map((game) => (
          <TableRow key={game.id}>
            <TableCell className="font-medium">
              {game.opponent ? `vs ${game.opponent}` : "Session"}
            </TableCell>
            <TableCell className="text-muted-foreground hidden sm:table-cell truncate max-w-[120px]">
              {game.location ?? "—"}
            </TableCell>
            <TableCell className="text-muted-foreground tabular-nums">{game.game_date}</TableCell>
            <TableCell>
              <span className="text-muted-foreground">Upcoming</span>
            </TableCell>
          </TableRow>
        ))}
        {past.length > 0 && past.map((game) => (
          <TableRow key={game.id}>
            <TableCell className="font-medium">
              {game.opponent ? `vs ${game.opponent}` : "Session"}
            </TableCell>
            <TableCell className="text-muted-foreground hidden sm:table-cell truncate max-w-[120px]">
              {game.location ?? "—"}
            </TableCell>
            <TableCell className="text-muted-foreground tabular-nums">{game.game_date}</TableCell>
            <TableCell><ResultBadge result={game.result} /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
