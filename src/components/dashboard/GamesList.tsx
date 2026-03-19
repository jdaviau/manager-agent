"use client";

import { Calendar } from "lucide-react";
import type { Game } from "@/types/database";

function ResultBadge({ result }: { result: string | null }) {
  if (!result) return <span className="text-xs text-muted-foreground">—</span>;
  const isWin = result.toUpperCase().startsWith("W");
  const isLoss = result.toUpperCase().startsWith("L");
  return (
    <span
      className={`text-xs font-medium px-1.5 py-0.5 rounded ${
        isWin
          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
          : isLoss
            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
      }`}
    >
      {result}
    </span>
  );
}

interface Props {
  games: Game[];
}

export function GamesList({ games }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const upcoming = games.filter((g) => g.game_date >= today).slice(0, 3);
  const past = games.filter((g) => g.game_date < today).slice(0, 5);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 text-sm font-medium">
        <Calendar className="h-4 w-4" />
        Schedule
      </div>

      {games.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No games scheduled. Ask the assistant to add one!
        </p>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Upcoming
              </p>
              {upcoming.map((game) => (
                <div key={game.id} className="rounded-lg border p-2.5 text-sm space-y-0.5">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">
                      {game.opponent ? `vs ${game.opponent}` : "Training / Session"}
                    </span>
                    <span className="text-xs text-muted-foreground">{game.game_date}</span>
                  </div>
                  {game.location && (
                    <p className="text-xs text-muted-foreground">{game.location}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {past.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Recent Results
              </p>
              {past.map((game) => (
                <div key={game.id} className="flex items-center gap-2 text-sm">
                  <ResultBadge result={game.result} />
                  <span className="flex-1 truncate">
                    {game.opponent ? `vs ${game.opponent}` : "Session"}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {game.game_date}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
