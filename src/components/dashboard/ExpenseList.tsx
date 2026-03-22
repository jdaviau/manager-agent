"use client";

import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableFooter } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Expense } from "@/types/database";

interface Props {
  expenses: Expense[];
}

export function ExpenseList({ expenses }: Props) {
  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  if (expenses.length === 0) {
    return (
      <p className="text-base text-muted-foreground text-center py-6">
        No expenses logged yet.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Category</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="hidden sm:table-cell">Date</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {expenses.map((expense) => (
          <TableRow key={expense.id}>
            <TableCell>
              <Badge variant="secondary" className="capitalize">{expense.category}</Badge>
            </TableCell>
            <TableCell className="max-w-[160px] truncate">{expense.description}</TableCell>
            <TableCell className="text-muted-foreground hidden sm:table-cell tabular-nums">
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
          <TableCell colSpan={3} className="font-medium">Total</TableCell>
          <TableCell className="text-right font-semibold tabular-nums">
            ${total.toFixed(2)}
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
