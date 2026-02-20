import type Database from 'better-sqlite3';

export type Handler = (db: Database.Database, data: unknown) => unknown;

export const analyticsHandlers: Record<string, Handler> = {
  'get-revenue-analytics': (db, data) => {
    const { period } = data as { period: string };

    // Determine date range based on period
    const now = new Date();
    let startDate: string;

    switch (period) {
      case 'thisMonth':
        startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        break;
      case 'lastMonth': {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        startDate = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}-01`;
        break;
      }
      case 'last3Months': {
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        startDate = `${threeMonthsAgo.getFullYear()}-${String(threeMonthsAgo.getMonth() + 1).padStart(2, '0')}-01`;
        break;
      }
      case 'last6Months': {
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        startDate = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}-01`;
        break;
      }
      case 'thisYear':
        startDate = `${now.getFullYear()}-01-01`;
        break;
      default:
        startDate = `${now.getFullYear()}-01-01`;
    }

    const endDate = now.toISOString().split('T')[0];

    // Get revenue by month
    const revenueByMonth = db.prepare(`
      SELECT
        strftime('%Y-%m', paymentDate) as month,
        SUM(amount) as revenue
      FROM Payments
      WHERE paymentDate >= ? AND paymentDate <= ?
      GROUP BY strftime('%Y-%m', paymentDate)
      ORDER BY month
    `).all(startDate, endDate) as { month: string; revenue: number }[];

    // Get expenses by month
    const expensesByMonth = db.prepare(`
      SELECT
        strftime('%Y-%m', expenseDate) as month,
        SUM(amount) as expenses
      FROM Expenses
      WHERE expenseDate >= ? AND expenseDate <= ?
      GROUP BY strftime('%Y-%m', expenseDate)
      ORDER BY month
    `).all(startDate, endDate) as { month: string; expenses: number }[];

    // Combine into single result with month names
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthsMap = new Map<string, { revenue: number; expenses: number }>();

    revenueByMonth.forEach(r => {
      monthsMap.set(r.month, { revenue: r.revenue, expenses: 0 });
    });

    expensesByMonth.forEach(e => {
      const existing = monthsMap.get(e.month) || { revenue: 0, expenses: 0 };
      monthsMap.set(e.month, { ...existing, expenses: e.expenses });
    });

    const result = Array.from(monthsMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([yearMonth, data]) => {
        const [year, month] = yearMonth.split('-');
        return {
          month: `${monthNames[parseInt(month) - 1]} ${year}`,
          revenue: data.revenue,
          expenses: data.expenses
        };
      });

    return result;
  },

  'get-visit-analytics': (db, data) => {
    const { period } = data as { period: string };

    // Determine date range
    const now = new Date();
    let startDate: string;

    switch (period) {
      case 'thisMonth':
        startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        break;
      case 'lastMonth': {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        startDate = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}-01`;
        break;
      }
      case 'last3Months': {
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        startDate = `${threeMonthsAgo.getFullYear()}-${String(threeMonthsAgo.getMonth() + 1).padStart(2, '0')}-01`;
        break;
      }
      case 'last6Months': {
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        startDate = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}-01`;
        break;
      }
      case 'thisYear':
        startDate = `${now.getFullYear()}-01-01`;
        break;
      default:
        startDate = `${now.getFullYear()}-01-01`;
    }

    const endDate = now.toISOString().split('T')[0];

    // Get visit counts by status
    const statusCounts = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM Visits
      WHERE visitDate >= ? AND visitDate <= ?
      GROUP BY status
    `).all(startDate, endDate) as { status: string; count: number }[];

    const statusMap: Record<string, number> = {};
    statusCounts.forEach(s => { statusMap[s.status] = s.count; });

    // Get visits by type
    const byType = db.prepare(`
      SELECT visitType as type, COUNT(*) as count
      FROM Visits
      WHERE visitDate >= ? AND visitDate <= ?
      GROUP BY visitType
      ORDER BY count DESC
    `).all(startDate, endDate) as { type: string; count: number }[];

    // Get visits by doctor with revenue
    const byDoctor = db.prepare(`
      SELECT
        d.firstName || ' ' || COALESCE(d.lastName, '') as doctorName,
        COUNT(*) as count,
        COALESCE(SUM(p.amount), 0) as revenue
      FROM Visits v
      JOIN Doctors d ON v.doctorID = d.doctorID
      LEFT JOIN Invoices i ON v.visitID = i.visitID
      LEFT JOIN Payments p ON i.invoiceID = p.invoiceID
      WHERE v.visitDate >= ? AND v.visitDate <= ?
      GROUP BY v.doctorID
      ORDER BY count DESC
    `).all(startDate, endDate) as { doctorName: string; count: number; revenue: number }[];

    return {
      total: Object.values(statusMap).reduce((a, b) => a + b, 0),
      completed: statusMap['Completed'] || 0,
      scheduled: statusMap['Scheduled'] || 0,
      inProgress: statusMap['InProgress'] || 0,
      cancelled: statusMap['Cancelled'] || 0,
      noShow: statusMap['NoShow'] || 0,
      byType,
      byDoctor
    };
  },

  'get-patient-analytics': (db) => {
    const now = new Date();
    const thisMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStart = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}-01`;
    const lastMonthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Total patients
    const total = (db.prepare('SELECT COUNT(*) as count FROM Patients').get() as { count: number }).count;

    // New this month
    const newThisMonth = (db.prepare(
      "SELECT COUNT(*) as count FROM Patients WHERE date(createdAt) >= ?"
    ).get(thisMonthStart) as { count: number }).count;

    // New last month
    const newLastMonth = (db.prepare(
      "SELECT COUNT(*) as count FROM Patients WHERE date(createdAt) >= ? AND date(createdAt) < ?"
    ).get(lastMonthStart, lastMonthEnd) as { count: number }).count;

    // Active patients (with visits in last 30 days)
    const activePatients = (db.prepare(`
      SELECT COUNT(DISTINCT patientID) as count FROM Visits
      WHERE visitDate >= ?
    `).get(thirtyDaysAgo) as { count: number }).count;

    // Returning patients (more than 1 visit)
    const returningPatients = (db.prepare(`
      SELECT COUNT(*) as count FROM (
        SELECT patientID FROM Visits
        GROUP BY patientID
        HAVING COUNT(*) > 1
      )
    `).get() as { count: number }).count;

    return {
      totalPatients: total,
      newThisMonth,
      newLastMonth,
      activePatients,
      returningPatients
    };
  },

  'get-dashboard-stats': (db) => {
    const today = new Date().toISOString().split('T')[0];
    const monthStart = today.substring(0, 7) + '-01';

    const todayVisits = db.prepare(
      "SELECT COUNT(*) as count FROM Visits WHERE visitDate = ?"
    ).get(today) as { count: number };

    const scheduledVisits = db.prepare(
      "SELECT COUNT(*) as count FROM Visits WHERE visitDate = ? AND status = 'Scheduled'"
    ).get(today) as { count: number };

    const completedVisits = db.prepare(
      "SELECT COUNT(*) as count FROM Visits WHERE visitDate = ? AND status = 'Completed'"
    ).get(today) as { count: number };

    const monthRevenue = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM Payments
      WHERE paymentDate >= ?
    `).get(monthStart) as { total: number };

    const outstanding = db.prepare(`
      SELECT COALESCE(SUM(total - COALESCE(paid, 0)), 0) as total
      FROM Invoices i
      LEFT JOIN (SELECT invoiceID, SUM(amount) as paid FROM Payments GROUP BY invoiceID) p
        ON i.invoiceID = p.invoiceID
      WHERE i.status != 'Paid' AND i.status != 'Void'
    `).get() as { total: number };

    const todaySchedule = db.prepare(`
      SELECT v.*,
        p.firstName || ' ' || COALESCE(p.lastName, '') as patientName,
        p.phone as patientPhone,
        d.firstName || ' ' || COALESCE(d.lastName, '') as doctorName
      FROM Visits v
      JOIN Patients p ON v.patientID = p.patientID
      JOIN Doctors d ON v.doctorID = d.doctorID
      WHERE v.visitDate = ?
      ORDER BY v.startTime
    `).all(today);

    return {
      todayVisits: todayVisits.count,
      scheduledVisits: scheduledVisits.count,
      completedVisits: completedVisits.count,
      monthRevenue: monthRevenue.total,
      outstandingBalance: outstanding.total,
      todaySchedule
    };
  },
};
