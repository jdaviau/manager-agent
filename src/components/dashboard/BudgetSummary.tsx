"use client";

import { Progress } from "@/components/ui/progress";
import { DollarSign } from "lucide-react";
import type { Budget, Expense, ExpenseCategory } from "@/types/database";

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  equipment: "bg-blue-500",
  travel: "bg-purple-500",
  fees: "bg-orange-500",
  facilities: "bg-cyan-500",
  medical: "bg-red-500",
  uniforms: "bg-pink-500",
  other: "bg-gray-400",
};

interface Props {
  budget: Budget | null;
  expenses: Expense[];
  totalCollected: number;
}

export function BudgetSummary({ budget, expenses, totalCollected }: Props) {
  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const remaining = budget ? Number(budget.total_amount) - totalSpent + totalCollected : 0;
  const percentUsed = budget
    ? Math.min(Math.round((totalSpent / Number(budget.total_amount)) * 100), 100)
    : 0;

  const byCategory: Partial<Record<ExpenseCategory, number>> = {};
  for (const expense of expenses) {
    byCategory[expense.category] = (byCategory[expense.category] ?? 0) + Number(expense.amount);
  }

  const progressColor =
    percentUsed >= 90
      ? "text-destructive"
      : percentUsed >= 75
        ? "text-warning"
        : "text-primary";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1.5 text-base font-medium">
        <DollarSign className="size-4" />
        Budget
        {budget && (
          <span className="text-base text-muted-foreground ml-1">({budget.season})</span>
        )}
      </div>

      {!budget ? (
        <p className="text-base text-muted-foreground py-4 text-center">
          No budget set. Ask the assistant to set one!
        </p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-muted/60 border p-2.5">
              <p className="text-basetext-muted-foreground uppercase tracking-wide">Total</p>
              <p className="font-semibold text-base mt-0.5">${Number(budget.total_amount).toFixed(2)}</p>
            </div>
            <div className="rounded-lg bg-muted/60 border p-2.5">
              <p className="text-basetext-muted-foreground uppercase tracking-wide">Spent</p>
              <p className="font-semibold text-base mt-0.5">${totalSpent.toFixed(2)}</p>
            </div>
            <div className="rounded-lg bg-muted/60 border p-2.5">
              <p className="text-basetext-muted-foreground uppercase tracking-wide">Net Left</p>
              <p className={`font-semibold text-base mt-0.5 ${progressColor}`}>
                ${remaining.toFixed(2)}
              </p>
            </div>
          </div>

          {totalCollected > 0 && (
            <p className="text-basetext-primary font-medium text-right">
              +${totalCollected.toFixed(2)} collected from players
            </p>
          )}

          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-base text-muted-foreground">
              <span>{percentUsed}% used</span>
              <span>${remaining.toFixed(2)} remaining</span>
            </div>
            <Progress value={percentUsed} className="h-2" />
          </div>

          {Object.keys(byCategory).length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-basefont-medium text-muted-foreground">By Category</p>
              {(Object.entries(byCategory) as [ExpenseCategory, number][])
                .sort(([, a], [, b]) => b - a)
                .map(([cat, amount]) => (
                  <div key={cat} className="flex items-center gap-2 text-base">
                    <div
                      className={`size-2 rounded-full shrink-0 ${CATEGORY_COLORS[cat]}`}
                    />
                    <span className="capitalize flex-1">{cat}</span>
                    <span className="font-medium">${amount.toFixed(2)}</span>
                  </div>
                ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
