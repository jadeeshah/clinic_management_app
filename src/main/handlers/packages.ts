import type Database from 'better-sqlite3';
import { validateOrThrow, createPackageSchema, updatePackageSchema } from '../../shared/validation';

export type Handler = (db: Database.Database, data: unknown) => unknown;

export const packageHandlers: Record<string, Handler> = {
  'get-packages': (db) => {
    return db.prepare('SELECT * FROM Packages WHERE isActive = 1 ORDER BY name').all();
  },

  'create-package': (db, data) => {
    const pkg = validateOrThrow(createPackageSchema, data);
    const stmt = db.prepare(`
      INSERT INTO Packages (name, totalSessions, price, validityDays)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(pkg.name, pkg.totalSessions, pkg.price, pkg.validityDays ?? 30);
    return { packageID: result.lastInsertRowid };
  },

  'update-package': (db, data) => {
    const pkg = validateOrThrow(updatePackageSchema, data);
    const stmt = db.prepare(`
      UPDATE Packages SET name = ?, totalSessions = ?, price = ?, validityDays = ?
      WHERE packageID = ?
    `);
    stmt.run(pkg.name, pkg.totalSessions, pkg.price, pkg.validityDays ?? 30, pkg.packageID);
    return { success: true };
  },

  'deactivate-package': (db, data) => {
    const { packageID } = data as { packageID: number };
    db.prepare('UPDATE Packages SET isActive = 0 WHERE packageID = ?').run(packageID);
    return { success: true };
  },

  'get-patient-packages': (db, data) => {
    const { patientID } = data as { patientID: number };
    return db.prepare(`
      SELECT pp.*, p.name as packageName, p.totalSessions
      FROM PatientPackages pp
      JOIN Packages p ON pp.packageID = p.packageID
      WHERE pp.patientID = ?
      ORDER BY pp.purchaseDate DESC
    `).all(patientID);
  },

  'create-patient-package': (db, data) => {
    const pp = data as Record<string, unknown>;
    // Calculate expiry date
    const pkg = db.prepare('SELECT validityDays FROM Packages WHERE packageID = ?')
      .get(pp.packageID) as { validityDays: number };
    const purchaseDate = new Date(pp.purchaseDate as string || new Date().toISOString().split('T')[0]);
    const expiryDate = new Date(purchaseDate);
    expiryDate.setDate(expiryDate.getDate() + (pkg?.validityDays || 30));

    const stmt = db.prepare(`
      INSERT INTO PatientPackages (patientID, packageID, purchaseDate, expiryDate, sessionsUsed, status)
      VALUES (?, ?, ?, ?, 0, 'Active')
    `);
    const result = stmt.run(
      pp.patientID, pp.packageID,
      purchaseDate.toISOString().split('T')[0],
      expiryDate.toISOString().split('T')[0]
    );
    return { patientPackageID: result.lastInsertRowid };
  },
};
