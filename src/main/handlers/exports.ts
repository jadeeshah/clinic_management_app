import type Database from 'better-sqlite3';

export type Handler = (db: Database.Database, data: unknown) => unknown;

export const exportHandlers: Record<string, Handler> = {
  'get-patient-export-data': (db, data) => {
    const { patientID } = data as { patientID: number };

    const patient = db.prepare('SELECT * FROM Patients WHERE patientID = ?').get(patientID);
    if (!patient) {
      throw new Error('Patient not found');
    }

    const visits = db.prepare(`
      SELECT v.*,
        d.firstName || ' ' || COALESCE(d.lastName, '') as doctorName,
        pkg.name as packageName,
        COALESCE(pay.paidAmount, 0) as paidAmount
      FROM Visits v
      JOIN Doctors d ON v.doctorID = d.doctorID
      LEFT JOIN PatientPackages pp ON v.patientPackageID = pp.patientPackageID
      LEFT JOIN Packages pkg ON pp.packageID = pkg.packageID
      LEFT JOIN (
        SELECT i.visitID, SUM(pm.amount) as paidAmount
        FROM Invoices i
        JOIN Payments pm ON i.invoiceID = pm.invoiceID
        WHERE i.visitID IS NOT NULL
        GROUP BY i.visitID
      ) pay ON v.visitID = pay.visitID
      WHERE v.patientID = ?
      ORDER BY v.visitDate DESC, v.startTime DESC
    `).all(patientID);

    const invoices = db.prepare(`
      SELECT i.*,
        d.firstName || ' ' || COALESCE(d.lastName, '') as doctorName,
        COALESCE((SELECT SUM(amount) FROM Payments WHERE invoiceID = i.invoiceID), 0) as paidAmount
      FROM Invoices i
      LEFT JOIN Doctors d ON i.doctorID = d.doctorID
      WHERE i.patientID = ?
      ORDER BY i.invoiceDate DESC
    `).all(patientID);

    const packages = db.prepare(`
      SELECT pp.*, p.name as packageName, p.totalSessions
      FROM PatientPackages pp
      JOIN Packages p ON pp.packageID = p.packageID
      WHERE pp.patientID = ?
      ORDER BY pp.purchaseDate DESC
    `).all(patientID);

    return { patient, visits, invoices, packages };
  },

  'get-patients-list-export': (db) => {
    const patients = db.prepare(`
      SELECT
        p.patientID,
        p.mrn,
        p.firstName,
        p.lastName,
        p.phone,
        p.city,
        p.createdAt,
        COALESCE(v.totalVisits, 0) as totalVisits,
        COALESCE(v.completedVisits, 0) as completedVisits,
        COALESCE(pay.totalPaid, 0) as totalPaid
      FROM Patients p
      LEFT JOIN (
        SELECT patientID,
          COUNT(*) as totalVisits,
          SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completedVisits
        FROM Visits GROUP BY patientID
      ) v ON p.patientID = v.patientID
      LEFT JOIN (
        SELECT i.patientID, SUM(pm.amount) as totalPaid
        FROM Invoices i
        JOIN Payments pm ON i.invoiceID = pm.invoiceID
        GROUP BY i.patientID
      ) pay ON p.patientID = pay.patientID
      ORDER BY p.firstName, p.lastName
    `).all();

    return patients;
  },
};
