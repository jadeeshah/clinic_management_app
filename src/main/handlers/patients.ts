import type Database from 'better-sqlite3';
import { validateOrThrow, createPatientSchema, updatePatientSchema } from '../../shared/validation';

export type Handler = (db: Database.Database, data: unknown) => unknown;

export const patientHandlers: Record<string, Handler> = {
  'get-patients': (db, data) => {
    const { limit = 100, offset = 0 } = (data as { limit?: number; offset?: number }) || {};
    const patients = db.prepare(
      'SELECT * FROM Patients ORDER BY createdAt DESC LIMIT ? OFFSET ?'
    ).all(limit, offset);
    const total = (db.prepare('SELECT COUNT(*) as count FROM Patients').get() as { count: number }).count;
    return { items: patients, total };
  },

  'search-patients': (db, data) => {
    const { query, limit = 20 } = data as { query: string; limit?: number };
    return db.prepare(`
      SELECT * FROM Patients
      WHERE phone LIKE ? OR whatsApp LIKE ? OR firstName LIKE ? OR lastName LIKE ? OR mrn LIKE ?
      ORDER BY
        CASE WHEN phone LIKE ? THEN 0 ELSE 1 END,
        firstName
      LIMIT ?
    `).all(
      `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`,
      `${query}%`,
      limit
    );
  },

  'get-patient': (db, data) => {
    const { patientID } = data as { patientID: number };
    return db.prepare('SELECT * FROM Patients WHERE patientID = ?').get(patientID);
  },

  'create-patient': (db, data) => {
    const patient = validateOrThrow(createPatientSchema, data);
    // Generate MRN
    const year = new Date().getFullYear();
    const countResult = db.prepare(
      "SELECT COUNT(*) as count FROM Patients WHERE mrn LIKE ?"
    ).get(`CLN-${year}-%`) as { count: number };
    const mrn = `CLN-${year}-${String(countResult.count + 1).padStart(4, '0')}`;

    // Handle diagnosis - can be string (JSON) or array
    const diagnosisValue = patient.diagnosis
      ? (typeof patient.diagnosis === 'string' ? patient.diagnosis : JSON.stringify(patient.diagnosis))
      : null;

    const stmt = db.prepare(`
      INSERT INTO Patients (mrn, firstName, lastName, phone, whatsApp, email,
        dateOfBirth, sex, address, city, emergencyContactName,
        emergencyContactPhone, emergencyContactRelation, diagnosis, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      mrn, patient.firstName, patient.lastName ?? null, patient.phone,
      patient.whatsApp ?? null, patient.email ?? null, patient.dateOfBirth ?? null, patient.sex ?? null,
      patient.address ?? null, patient.city ?? null, patient.emergencyContactName ?? null,
      patient.emergencyContactPhone ?? null, patient.emergencyContactRelation ?? null,
      diagnosisValue, patient.notes ?? null
    );
    return { patientID: result.lastInsertRowid, mrn };
  },

  'update-patient': (db, data) => {
    const patient = validateOrThrow(updatePatientSchema, data);

    // Handle diagnosis - can be string (JSON) or array
    const diagnosisValue = patient.diagnosis
      ? (typeof patient.diagnosis === 'string' ? patient.diagnosis : JSON.stringify(patient.diagnosis))
      : null;

    const stmt = db.prepare(`
      UPDATE Patients SET
        firstName = ?, lastName = ?, phone = ?, whatsApp = ?, email = ?,
        dateOfBirth = ?, sex = ?, address = ?, city = ?,
        emergencyContactName = ?, emergencyContactPhone = ?, emergencyContactRelation = ?,
        diagnosis = ?, notes = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE patientID = ?
    `);
    stmt.run(
      patient.firstName, patient.lastName ?? null, patient.phone, patient.whatsApp ?? null, patient.email ?? null,
      patient.dateOfBirth ?? null, patient.sex ?? null, patient.address ?? null, patient.city ?? null,
      patient.emergencyContactName ?? null, patient.emergencyContactPhone ?? null, patient.emergencyContactRelation ?? null,
      diagnosisValue, patient.notes ?? null, patient.patientID
    );
    return { success: true };
  },
};
