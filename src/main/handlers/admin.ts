import type Database from 'better-sqlite3';

export type Handler = (db: Database.Database, data: unknown) => unknown;

export const adminHandlers: Record<string, Handler> = {
  'clear-all-data': (db) => {
    // Delete all data except settings and users (preserves services)
    const transaction = db.transaction(() => {
      db.exec('DELETE FROM Payments');
      db.exec('DELETE FROM InvoiceItems');
      db.exec('DELETE FROM Invoices');
      db.exec('DELETE FROM Visits');
      db.exec('DELETE FROM PatientPackages');
      db.exec('DELETE FROM Attachments');
      db.exec('DELETE FROM Patients');
      db.exec('DELETE FROM Packages');
      db.exec('DELETE FROM Doctors');
      db.exec('DELETE FROM Expenses');
    });
    transaction();
    return { success: true };
  },
};
