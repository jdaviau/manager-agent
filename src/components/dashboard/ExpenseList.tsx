"use client";

import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableFooter } from "@/components/ui/table";
import type { Expense, ExpenseCategory } from "@/types/database";

const CATEGORY_STYLES: Record<ExpenseCategory, string> = {
  equipment: "bg-blue-100 text-blue-700",
  travel: "bg-purple-100 text-purple-700",
  fees: "bg-orange-100 text-orange-700",
  facilities: "bg-cyan-100 text-cyan-700",
  medical: "bg-red-100 text-red-700",
  uniforms: "bg-pink-100 text-pink-700",
  other: "bg-muted text-muted-foreground",
};

interface Props {
  expenses: Expense[];
}

export function ExpenseList({ expenses }: Props) {
  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  if (expenses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        No expenses logged yet.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-xs">Category</TableHead>
          <TableHead className="text-xs">Description</TableHead>
          <TableHead className="text-xs hidden sm:table-cell">Date</TableHead>
          <TableHead className="text-xs text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {expenses.map((expense) => (
          <TableRow key={expense.id}>
            <TableCell>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${CATEGORY_STYLES[expense.category]}`}>
                {expense.category}
              </span>
            </TableCell>
            <TableCell className="text-sm max-w-[160px] truncate">{expense.description}</TableCell>
            <TableCell className="text-muted-foreground text-xs hidden sm:table-cell tabular-nums">
              {expense.expense_date}
            </TableCell>
            <TableCell className="text-right font-medium tabular-nums">
              ${Number(expense.amount).toFixed(2)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3} className="text-xs font-medium">Total</TableCell>
          <TableCell className="text-right font-semibold tabular-nums">
            ${total.toFixed(2)}
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
