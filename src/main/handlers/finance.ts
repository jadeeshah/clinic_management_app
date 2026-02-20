import type Database from 'better-sqlite3';

export type Handler = (db: Database.Database, data: unknown) => unknown;

export const financeHandlers: Record<string, Handler> = {
  'get-finance-summary': (db, data) => {
    const { startDate, endDate, doctorID } = data as { startDate: string; endDate: string; doctorID?: number };

    // Doctor filter: when doctorID is set, filter revenue/invoiced/outstanding/visits through Invoices.doctorID
    const doctorFilter = doctorID ? ' AND i.doctorID = ?' : '';
    const doctorPaymentFilter = doctorID
      ? ' AND p.invoiceID IN (SELECT invoiceID FROM Invoices WHERE doctorID = ?)'
      : '';
    const doctorVisitFilter = doctorID ? ' AND doctorID = ?' : '';

    const revenueParams: (string | number)[] = [startDate, endDate];
    if (doctorID) revenueParams.push(doctorID);

    const revenue = db.prepare(`
      SELECT COALESCE(SUM(p.amount), 0) as total FROM Payments p
      WHERE p.paymentDate BETWEEN ? AND ?${doctorPaymentFilter}
    `).get(...revenueParams) as { total: number };

    const expenses = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM Expenses
      WHERE expenseDate BETWEEN ? AND ?
    `).get(startDate, endDate) as { total: number };

    const invoicedParams: (string | number)[] = [startDate, endDate];
    if (doctorID) invoicedParams.push(doctorID);

    const invoiced = db.prepare(`
      SELECT COALESCE(SUM(i.total), 0) as total FROM Invoices i
      WHERE i.invoiceDate BETWEEN ? AND ? AND i.status != 'Void'${doctorFilter}
    `).get(...invoicedParams) as { total: number };

    const outstandingParams: (string | number)[] = [startDate, endDate];
    if (doctorID) outstandingParams.push(doctorID);

    const outstanding = db.prepare(`
      SELECT COALESCE(SUM(i.total - COALESCE(paid.amount, 0)), 0) as total
      FROM Invoices i
      LEFT JOIN (SELECT invoiceID, SUM(amount) as amount FROM Payments GROUP BY invoiceID) paid
        ON i.invoiceID = paid.invoiceID
      WHERE i.invoiceDate BETWEEN ? AND ? AND i.status NOT IN ('Paid', 'Void')${doctorFilter}
    `).get(...outstandingParams) as { total: number };

    const visitParams: (string | number)[] = [startDate, endDate];
    if (doctorID) visitParams.push(doctorID);

    const visitCount = db.prepare(`
      SELECT COUNT(*) as count FROM Visits
      WHERE visitDate BETWEEN ? AND ? AND status = 'Completed'${doctorVisitFilter}
    `).get(...visitParams) as { count: number };

    const revenueByDayParams: (string | number)[] = [startDate, endDate];
    if (doctorID) revenueByDayParams.push(doctorID);

    const revenueByDay = db.prepare(`
      SELECT p.paymentDate as date, SUM(p.amount) as total
      FROM Payments p
      WHERE p.paymentDate BETWEEN ? AND ?${doctorPaymentFilter}
      GROUP BY p.paymentDate
      ORDER BY p.paymentDate
    `).all(...revenueByDayParams);

    const expensesByCategory = db.prepare(`
      SELECT category, SUM(amount) as total
      FROM Expenses
      WHERE expenseDate BETWEEN ? AND ?
      GROUP BY category
      ORDER BY total DESC
    `).all(startDate, endDate);

    return {
      totalRevenue: revenue.total,
      totalExpenses: expenses.total,
      netIncome: revenue.total - expenses.total,
      totalInvoiced: invoiced.total,
      totalOutstanding: outstanding.total,
      completedVisits: visitCount.count,
      revenueByDay,
      expensesByCategory
    };
  },

  'get-finance-detail-export': (db, data) => {
    const { startDate, endDate, doctorID } = data as { startDate: string; endDate: string; doctorID?: number };

    const params: (string | number)[] = [startDate, endDate];
    let doctorClause = '';
    if (doctorID) {
      doctorClause = ' AND i.doctorID = ?';
      params.push(doctorID);
    }

    return db.prepare(`
      SELECT p.paymentDate as date, p.amount, p.method as paymentMethod,
        d.firstName || ' ' || COALESCE(d.lastName, '') as doctorName,
        pat.firstName || ' ' || COALESCE(pat.lastName, '') as patientName,
        GROUP_CONCAT(ii.description, '; ') as servicesUsed,
        i.invoiceNo
      FROM Payments p
      JOIN Invoices i ON p.invoiceID = i.invoiceID
      JOIN Patients pat ON i.patientID = pat.patientID
      LEFT JOIN Doctors d ON i.doctorID = d.doctorID
      LEFT JOIN InvoiceItems ii ON i.invoiceID = ii.invoiceID
      WHERE p.paymentDate BETWEEN ? AND ?${doctorClause}
      GROUP BY p.paymentID
      ORDER BY p.paymentDate
    `).all(...params);
  },
};
