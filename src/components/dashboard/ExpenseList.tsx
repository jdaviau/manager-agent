"use client";

import { Badge } from "@/components/ui/badge";
import { Receipt } from "lucide-react";
import type { Expense, ExpenseCategory } from "@/types/database";

const CATEGORY_BADGES: Record<ExpenseCategory, string> = {
  equipment: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  travel: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  fees: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  facilities: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  medical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  uniforms: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  other: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

interface Props {
  expenses: Expense[];
}

export function ExpenseList({ expenses }: Props) {
  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <Receipt className="h-4 w-4" />
          Expenses
        </div>
        <span className="text-xs text-muted-foreground">{expenses.length} items</span>
      </div>

      {expenses.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No expenses logged yet.
        </p>
      ) : (
        <>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center gap-2 rounded-lg border p-2 text-sm"
              >
                <span
                  className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium capitalize ${CATEGORY_BADGES[expense.category]}`}
                >
                  {expense.category}
                </span>
                <span className="flex-1 truncate text-xs">{expense.description}</span>
                <span className="shrink-0 font-semibold text-xs">
                  ${Number(expense.amount).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm font-medium border-t pt-2">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </>
      )}
    </div>
  );
}
