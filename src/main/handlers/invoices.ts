import type Database from 'better-sqlite3';
import { validateOrThrow, createInvoiceSchema, createPaymentSchema } from '../../shared/validation';

export type Handler = (db: Database.Database, data: unknown) => unknown;

export const invoiceHandlers: Record<string, Handler> = {
  'get-invoices': (db, data) => {
    const { patientID, status, limit = 100, offset = 0 } =
      (data as { patientID?: number; status?: string; limit?: number; offset?: number }) || {};

    // Use subquery to calculate paidAmount and dynamic status
    let query = `
      SELECT
        inv.*,
        inv.patientName,
        inv.doctorName,
        inv.paidAmount,
        CASE
          WHEN inv.storedStatus = 'Void' THEN 'Void'
          WHEN inv.paidAmount = 0 THEN 'Unpaid'
          WHEN inv.paidAmount >= inv.total THEN 'Paid'
          ELSE 'PartiallyPaid'
        END as status
      FROM (
        SELECT i.*,
          p.firstName || ' ' || COALESCE(p.lastName, '') as patientName,
          d.firstName || ' ' || COALESCE(d.lastName, '') as doctorName,
          COALESCE((SELECT SUM(amount) FROM Payments WHERE invoiceID = i.invoiceID), 0) as paidAmount,
          i.status as storedStatus
        FROM Invoices i
        JOIN Patients p ON i.patientID = p.patientID
        LEFT JOIN Doctors d ON i.doctorID = d.doctorID
      ) inv
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (patientID) {
      query += ' AND inv.patientID = ?';
      params.push(patientID);
    }
    if (status) {
      // Filter by calculated status
      query += ` AND (
        CASE
          WHEN inv.storedStatus = 'Void' THEN 'Void'
          WHEN inv.paidAmount = 0 THEN 'Unpaid'
          WHEN inv.paidAmount >= inv.total THEN 'Paid'
          ELSE 'PartiallyPaid'
        END
      ) = ?`;
      params.push(status);
    }

    query += ' ORDER BY inv.invoiceDate DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return db.prepare(query).all(...params);
  },

  'get-patient-invoices': (db, data) => {
    const { patientID } = data as { patientID: number };
    return db.prepare(`
      SELECT
        inv.*,
        inv.doctorName,
        inv.paidAmount,
        CASE
          WHEN inv.storedStatus = 'Void' THEN 'Void'
          WHEN inv.paidAmount = 0 THEN 'Unpaid'
          WHEN inv.paidAmount >= inv.total THEN 'Paid'
          ELSE 'PartiallyPaid'
        END as status
      FROM (
        SELECT i.*,
          d.firstName || ' ' || COALESCE(d.lastName, '') as doctorName,
          COALESCE((SELECT SUM(amount) FROM Payments WHERE invoiceID = i.invoiceID), 0) as paidAmount,
          i.status as storedStatus
        FROM Invoices i
        LEFT JOIN Doctors d ON i.doctorID = d.doctorID
        WHERE i.patientID = ?
      ) inv
      ORDER BY inv.invoiceDate DESC
    `).all(patientID);
  },

  'get-invoice': (db, data) => {
    const { invoiceID } = data as { invoiceID: number };
    const invoice = db.prepare(`
      SELECT
        inv.*,
        inv.patientName,
        inv.patientPhone,
        inv.patientMRN,
        inv.doctorName,
        inv.paidAmount,
        CASE
          WHEN inv.storedStatus = 'Void' THEN 'Void'
          WHEN inv.paidAmount = 0 THEN 'Unpaid'
          WHEN inv.paidAmount >= inv.total THEN 'Paid'
          ELSE 'PartiallyPaid'
        END as status
      FROM (
        SELECT i.*,
          p.firstName || ' ' || COALESCE(p.lastName, '') as patientName,
          p.phone as patientPhone,
          p.mrn as patientMRN,
          d.firstName || ' ' || COALESCE(d.lastName, '') as doctorName,
          COALESCE((SELECT SUM(amount) FROM Payments WHERE invoiceID = i.invoiceID), 0) as paidAmount,
          i.status as storedStatus
        FROM Invoices i
        JOIN Patients p ON i.patientID = p.patientID
        LEFT JOIN Doctors d ON i.doctorID = d.doctorID
        WHERE i.invoiceID = ?
      ) inv
    `).get(invoiceID) as Record<string, unknown> | undefined;

    if (!invoice) {
      return null;
    }

    const items = db.prepare(`
      SELECT ii.*, s.name as serviceName
      FROM InvoiceItems ii
      LEFT JOIN Services s ON ii.serviceID = s.serviceID
      WHERE ii.invoiceID = ?
    `).all(invoiceID);

    const payments = db.prepare(`
      SELECT * FROM Payments WHERE invoiceID = ? ORDER BY paymentDate DESC
    `).all(invoiceID);

    return { ...invoice, items, payments };
  },

  'create-invoice': (db, data) => {
    const invoice = validateOrThrow(createInvoiceSchema, data);

    // Generate invoice number
    const year = new Date().getFullYear();
    const settings = db.prepare('SELECT invoicePrefix FROM Settings WHERE settingsID = 1').get() as { invoicePrefix: string };
    const prefix = settings?.invoicePrefix || 'INV';
    const countResult = db.prepare(
      "SELECT COUNT(*) as count FROM Invoices WHERE invoiceNo LIKE ?"
    ).get(`${prefix}-${year}-%`) as { count: number };
    const invoiceNo = `${prefix}-${year}-${String(countResult.count + 1).padStart(4, '0')}`;

    // Calculate totals
    const subtotal = invoice.items.reduce((sum, item) => sum + (item.lineTotal || 0), 0);
    const discountAmount = invoice.discountAmount ?? 0;
    const taxAmount = invoice.taxAmount ?? 0;
    const total = subtotal - discountAmount + taxAmount;

    // Insert invoice
    const stmt = db.prepare(`
      INSERT INTO Invoices (invoiceNo, patientID, doctorID, visitID, invoiceDate,
        subtotal, discountAmount, taxAmount, total, status, nextVisitDate, nextVisitTime)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Unpaid', ?, ?)
    `);
    const result = stmt.run(
      invoiceNo, invoice.patientID, invoice.doctorID ?? null, invoice.visitID ?? null,
      invoice.invoiceDate, subtotal, discountAmount, taxAmount, total,
      invoice.nextVisitDate ?? null, invoice.nextVisitTime ?? null
    );

    const invoiceID = result.lastInsertRowid;

    // Insert items
    const itemStmt = db.prepare(`
      INSERT INTO InvoiceItems (invoiceID, serviceID, description, quantity, unitPrice, lineTotal)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const item of invoice.items) {
      itemStmt.run(
        invoiceID, item.serviceID ?? null, item.description,
        item.quantity ?? 1, item.unitPrice ?? 0, item.lineTotal ?? 0
      );
    }

    return { invoiceID, invoiceNo };
  },

  'create-payment': (db, data) => {
    const payment = validateOrThrow(createPaymentSchema, data);

    // Insert payment
    const stmt = db.prepare(`
      INSERT INTO Payments (invoiceID, paymentDate, amount, method, transactionID, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      payment.invoiceID, payment.paymentDate, payment.amount,
      payment.method ?? 'Cash', payment.transactionID ?? null, payment.notes ?? null
    );

    // Update invoice status
    const invoiceData = db.prepare('SELECT total FROM Invoices WHERE invoiceID = ?').get(payment.invoiceID) as { total: number };
    const totalPaid = (db.prepare('SELECT SUM(amount) as total FROM Payments WHERE invoiceID = ?').get(payment.invoiceID) as { total: number }).total;

    let newStatus = 'PartiallyPaid';
    if (totalPaid >= invoiceData.total) {
      newStatus = 'Paid';
    }

    db.prepare('UPDATE Invoices SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE invoiceID = ?')
      .run(newStatus, payment.invoiceID);

    return { paymentID: result.lastInsertRowid };
  },
};
