import type Database from 'better-sqlite3';
import { validateOrThrow, createExpenseSchema } from '../../shared/validation';

export type Handler = (db: Database.Database, data: unknown) => unknown;

export const expenseHandlers: Record<string, Handler> = {
  'get-expenses': (db, data) => {
    const { startDate, endDate, category, limit = 100, offset = 0 } =
      (data as { startDate?: string; endDate?: string; category?: string; limit?: number; offset?: number }) || {};

    let query = 'SELECT * FROM Expenses WHERE 1=1';
    const params: (string | number)[] = [];

    if (startDate) {
      query += ' AND expenseDate >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND expenseDate <= ?';
      params.push(endDate);
    }
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY expenseDate DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return db.prepare(query).all(...params);
  },

  'create-expense': (db, data) => {
    const expense = validateOrThrow(createExpenseSchema, data);
    const stmt = db.prepare(`
      INSERT INTO Expenses (expenseDate, title, category, amount, paidTo, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      expense.expenseDate, expense.title, expense.category ?? 'Other',
      expense.amount, expense.paidTo ?? null, expense.notes ?? null
    );
    return { expenseID: result.lastInsertRowid };
  },

  'delete-expense': (db, data) => {
    const { expenseID } = data as { expenseID: number };
    db.prepare('DELETE FROM Expenses WHERE expenseID = ?').run(expenseID);
    return { success: true };
  },
};
