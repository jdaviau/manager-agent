"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Trophy } from "lucide-react";

interface Props {
  costPerPlayer: number;
  costPerGame: number;
}

export function StatsCards({ costPerPlayer, costPerGame }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            Cost / Player
          </CardTitle>
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <p className="text-xl font-bold">
            ${costPerPlayer.toFixed(2)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            Cost / Game
          </CardTitle>
          <Trophy className="h-3.5 w-3.5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <p className="text-xl font-bold">
            ${costPerGame.toFixed(2)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
