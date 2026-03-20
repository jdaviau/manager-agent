"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Player, Budget, Expense, Game, PlayerPayment } from "@/types/database";

interface DashboardData {
  players: Player[];
  budget: Budget | null;
  expenses: Expense[];
  games: Game[];
  payments: PlayerPayment[];
  costPerPlayer: number;
  costPerGame: number;
  activePlayers: number;
  totalSpent: number;
  totalCollected: number;
  isLoading: boolean;
}

export function useDashboard(teamId: string): DashboardData {
  const [players, setPlayers] = useState<Player[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [payments, setPayments] = useState<PlayerPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!teamId) return;
    const supabase = createClient();

    const [{ data: playersRaw }, { data: gamesRaw }] = await Promise.all([
      supabase.from("players").select("*").eq("team_id", teamId).order("name"),
      supabase.from("games").select("*").eq("team_id", teamId).order("game_date"),
    ]);

    let budgetData: Budget | null = null;
    let expensesData: Expense[] = [];
    let paymentsData: PlayerPayment[] = [];

    const { data: budgetRaw } = await supabase
      .from("budgets")
      .select("*")
      .eq("team_id", teamId)
      .eq("is_current", true)
      .maybeSingle();
    budgetData = (budgetRaw as Budget | null) ?? null;

    if (budgetData) {
      const { data: expensesRaw } = await supabase
        .from("expenses")
        .select("*")
        .eq("budget_id", budgetData.id)
        .order("expense_date", { ascending: false });
      expensesData = (expensesRaw as Expense[] | null) ?? [];
    }

    const { data: paymentsRaw } = await supabase
      .from("player_payments")
      .select("*")
      .eq("team_id", teamId)
      .order("payment_date", { ascending: false });
    paymentsData = (paymentsRaw as PlayerPayment[] | null) ?? [];

    setPlayers((playersRaw as Player[] | null) ?? []);
    setBudget(budgetData);
    setExpenses(expensesData);
    setGames((gamesRaw as Game[] | null) ?? []);
    setPayments(paymentsData);
    setIsLoading(false);
  }, [teamId]);

  useEffect(() => {
    refresh();

    function handleRefresh() {
      refresh();
    }
    window.addEventListener("dashboard:refresh", handleRefresh);
    return () => window.removeEventListener("dashboard:refresh", handleRefresh);
  }, [refresh]);

  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalCollected = payments
    .filter((p) => p.status === "paid" || p.status === "partial")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const activePlayers = players.filter((p) => p.status === "active").length;
  const costPerPlayer = activePlayers > 0 ? totalSpent / activePlayers : 0;
  const costPerGame = games.length > 0 ? totalSpent / games.length : 0;

  return { players, budget, expenses, games, payments, costPerPlayer, costPerGame, activePlayers, totalSpent, totalCollected, isLoading };
}
