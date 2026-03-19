"use client";

import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import type { Player } from "@/types/database";

const STATUS_COLORS = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  inactive: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  injured: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
};

interface Props {
  players: Player[];
}

export function PlayerList({ players }: Props) {
  const active = players.filter((p) => p.status === "active").length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <Users className="h-4 w-4" />
          Roster
        </div>
        <span className="text-xs text-muted-foreground">{active} active</span>
      </div>

      {players.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No players yet. Ask the assistant to add some!
        </p>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-xs text-muted-foreground">#</th>
                <th className="text-left px-3 py-2 font-medium text-xs text-muted-foreground">Name</th>
                <th className="text-left px-3 py-2 font-medium text-xs text-muted-foreground hidden sm:table-cell">Position</th>
                <th className="text-left px-3 py-2 font-medium text-xs text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {players.map((player) => (
                <tr key={player.id} className="hover:bg-muted/30">
                  <td className="px-3 py-2 text-muted-foreground">
                    {player.jersey_number ?? "—"}
                  </td>
                  <td className="px-3 py-2 font-medium">{player.name}</td>
                  <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell">
                    {player.position ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[player.status]}`}
                    >
                      {player.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
