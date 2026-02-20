import type Database from 'better-sqlite3';
import { validateOrThrow, createVisitSchema, updateVisitSchema, updateVisitStatusSchema } from '../../shared/validation';

export type Handler = (db: Database.Database, data: unknown) => unknown;

export const visitHandlers: Record<string, Handler> = {
  'get-visits-by-date': (db, data) => {
    const { date } = data as { date: string };
    return db.prepare(`
      SELECT v.*,
        p.firstName || ' ' || COALESCE(p.lastName, '') as patientName,
        p.phone as patientPhone,
        d.firstName || ' ' || COALESCE(d.lastName, '') as doctorName
      FROM Visits v
      JOIN Patients p ON v.patientID = p.patientID
      JOIN Doctors d ON v.doctorID = d.doctorID
      WHERE v.visitDate = ?
      ORDER BY v.startTime
    `).all(date);
  },

  'get-patient-visits': (db, data) => {
    const { patientID } = data as { patientID: number };
    return db.prepare(`
      SELECT v.*,
        d.firstName || ' ' || COALESCE(d.lastName, '') as doctorName
      FROM Visits v
      JOIN Doctors d ON v.doctorID = d.doctorID
      WHERE v.patientID = ?
      ORDER BY v.visitDate DESC, v.startTime DESC
    `).all(patientID);
  },

  'get-doctor-visits': (db, data) => {
    const { doctorID } = data as { doctorID: number };
    return db.prepare(`
      SELECT v.*,
        p.firstName || ' ' || COALESCE(p.lastName, '') as patientName,
        p.phone as patientPhone
      FROM Visits v
      JOIN Patients p ON v.patientID = p.patientID
      WHERE v.doctorID = ?
      ORDER BY v.visitDate DESC, v.startTime DESC
    `).all(doctorID);
  },

  'create-visit': (db, data) => {
    const visit = validateOrThrow(createVisitSchema, data);

    // Validate package has available sessions if one is selected
    if (visit.patientPackageID) {
      const patientPackage = db.prepare(`
        SELECT pp.sessionsUsed, pp.status as packageStatus, pp.expiryDate, p.totalSessions
        FROM PatientPackages pp
        JOIN Packages p ON pp.packageID = p.packageID
        WHERE pp.patientPackageID = ?
      `).get(visit.patientPackageID) as {
        sessionsUsed: number;
        packageStatus: string;
        expiryDate: string;
        totalSessions: number;
      } | undefined;

      if (!patientPackage) {
        throw new Error('Selected package not found');
      }

      if (patientPackage.packageStatus === 'Completed') {
        throw new Error('This package has been fully used. Please select another package or create a visit without a package.');
      }

      if (patientPackage.packageStatus === 'Expired') {
        throw new Error('This package has expired. Please select another package or create a visit without a package.');
      }

      // Check if package has available sessions
      const remainingSessions = patientPackage.totalSessions - patientPackage.sessionsUsed;
      if (remainingSessions <= 0) {
        throw new Error('This package has no remaining sessions. Please select another package or create a visit without a package.');
      }

      // Check if package is expired by date
      const today = new Date().toISOString().split('T')[0];
      if (patientPackage.expiryDate < today) {
        // Update package status to Expired
        db.prepare(
          "UPDATE PatientPackages SET status = 'Expired' WHERE patientPackageID = ?"
        ).run(visit.patientPackageID);
        throw new Error('This package has expired. Please select another package or create a visit without a package.');
      }
    }

    // Get session index for this patient
    const sessionCount = db.prepare(
      "SELECT COUNT(*) as count FROM Visits WHERE patientID = ? AND status = 'Completed'"
    ).get(visit.patientID) as { count: number };

    const stmt = db.prepare(`
      INSERT INTO Visits (patientID, doctorID, visitDate, startTime, endTime,
        duration, status, visitType, sessionIndex, notes, patientPackageID)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      visit.patientID, visit.doctorID, visit.visitDate, visit.startTime,
      visit.endTime ?? null, visit.duration ?? 45, visit.status ?? 'Scheduled',
      visit.visitType ?? 'TherapySession', sessionCount.count + 1,
      visit.notes ?? null, visit.patientPackageID ?? null
    );
    return { visitID: result.lastInsertRowid };
  },

  'update-visit-status': (db, data) => {
    const validated = validateOrThrow(updateVisitStatusSchema, data);

    // Get the current visit to check for package and previous status
    const currentVisit = db.prepare(
      'SELECT status, patientPackageID FROM Visits WHERE visitID = ?'
    ).get(validated.visitID) as { status: string; patientPackageID: number | null } | undefined;

    if (!currentVisit) {
      throw new Error('Visit not found');
    }

    const previousStatus = currentVisit.status;
    const newStatus = validated.status;
    const packageID = currentVisit.patientPackageID;

    // Update the visit status
    db.prepare(
      'UPDATE Visits SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE visitID = ?'
    ).run(newStatus, validated.visitID);

    // Handle package session tracking
    if (packageID) {
      // Get the package info
      const patientPackage = db.prepare(`
        SELECT pp.*, p.totalSessions
        FROM PatientPackages pp
        JOIN Packages p ON pp.packageID = p.packageID
        WHERE pp.patientPackageID = ?
      `).get(packageID) as { patientPackageID: number; sessionsUsed: number; totalSessions: number; status: string } | undefined;

      if (patientPackage) {
        // Status changing TO Completed - increment sessions used
        if (newStatus === 'Completed' && previousStatus !== 'Completed') {
          const newSessionsUsed = patientPackage.sessionsUsed + 1;

          // Update sessions used
          db.prepare(
            'UPDATE PatientPackages SET sessionsUsed = ? WHERE patientPackageID = ?'
          ).run(newSessionsUsed, packageID);

          // Check if package is complete
          if (newSessionsUsed >= patientPackage.totalSessions) {
            db.prepare(
              "UPDATE PatientPackages SET status = 'Completed' WHERE patientPackageID = ?"
            ).run(packageID);
          }
        }
        // Status changing FROM Completed - decrement sessions used (rollback)
        else if (previousStatus === 'Completed' && newStatus !== 'Completed') {
          const newSessionsUsed = Math.max(0, patientPackage.sessionsUsed - 1);

          // Update sessions used
          db.prepare(
            'UPDATE PatientPackages SET sessionsUsed = ? WHERE patientPackageID = ?'
          ).run(newSessionsUsed, packageID);

          // Reactivate package if it was completed
          if (patientPackage.status === 'Completed') {
            db.prepare(
              "UPDATE PatientPackages SET status = 'Active' WHERE patientPackageID = ?"
            ).run(packageID);
          }
        }
      }
    }

    return true;
  },

  'get-visits': (db, data) => {
    const { startDate, endDate, status, doctorID, limit = 100, offset = 0 } =
      (data as { startDate?: string; endDate?: string; status?: string; doctorID?: number; limit?: number; offset?: number }) || {};

    let query = `
      SELECT v.*,
        p.firstName || ' ' || COALESCE(p.lastName, '') as patientName,
        p.phone as patientPhone,
        p.mrn as patientMRN,
        d.firstName || ' ' || COALESCE(d.lastName, '') as doctorName
      FROM Visits v
      JOIN Patients p ON v.patientID = p.patientID
      JOIN Doctors d ON v.doctorID = d.doctorID
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (startDate) {
      query += ' AND v.visitDate >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND v.visitDate <= ?';
      params.push(endDate);
    }
    if (status) {
      query += ' AND v.status = ?';
      params.push(status);
    }
    if (doctorID) {
      query += ' AND v.doctorID = ?';
      params.push(doctorID);
    }

    query += ' ORDER BY v.visitDate DESC, v.startTime DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const visits = db.prepare(query).all(...params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as count FROM Visits v WHERE 1=1';
    const countParams: (string | number)[] = [];
    if (startDate) { countQuery += ' AND v.visitDate >= ?'; countParams.push(startDate); }
    if (endDate) { countQuery += ' AND v.visitDate <= ?'; countParams.push(endDate); }
    if (status) { countQuery += ' AND v.status = ?'; countParams.push(status); }
    if (doctorID) { countQuery += ' AND v.doctorID = ?'; countParams.push(doctorID); }

    const total = (db.prepare(countQuery).get(...countParams) as { count: number }).count;
    return { items: visits, total };
  },

  'get-visit': (db, data) => {
    const { visitID } = data as { visitID: number };
    return db.prepare(`
      SELECT v.*,
        p.firstName || ' ' || COALESCE(p.lastName, '') as patientName,
        p.phone as patientPhone,
        p.mrn as patientMRN,
        d.firstName || ' ' || COALESCE(d.lastName, '') as doctorName
      FROM Visits v
      JOIN Patients p ON v.patientID = p.patientID
      JOIN Doctors d ON v.doctorID = d.doctorID
      WHERE v.visitID = ?
    `).get(visitID);
  },

  'update-visit': (db, data) => {
    const visit = validateOrThrow(updateVisitSchema, data);
    const stmt = db.prepare(`
      UPDATE Visits SET
        doctorID = ?, visitDate = ?, startTime = ?, endTime = ?,
        duration = ?, status = ?, visitType = ?, notes = ?,
        updatedAt = CURRENT_TIMESTAMP
      WHERE visitID = ?
    `);
    stmt.run(
      visit.doctorID, visit.visitDate, visit.startTime, visit.endTime ?? null,
      visit.duration ?? 45, visit.status, visit.visitType, visit.notes ?? null,
      visit.visitID
    );
    return { success: true };
  },
};
