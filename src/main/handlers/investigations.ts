import type Database from 'better-sqlite3';
import { validateOrThrow, createInvestigationSchema, updateInvestigationSchema } from '../../shared/validation';

export type Handler = (db: Database.Database, data: unknown) => unknown;

export const investigationHandlers: Record<string, Handler> = {
  'get-patient-investigations': (db, data) => {
    const { patientID } = data as { patientID: number };
    const investigations = db.prepare(`
      SELECT i.*,
        CASE WHEN d.firstName IS NOT NULL
          THEN d.firstName || COALESCE(' ' || d.lastName, '')
          ELSE NULL
        END as doctorName
      FROM Investigations i
      LEFT JOIN Doctors d ON i.orderedByDoctorID = d.doctorID
      WHERE i.patientID = ?
      ORDER BY i.investigationDate DESC, i.investigationID DESC
    `).all(patientID);
    return investigations;
  },

  'get-investigation': (db, data) => {
    const { investigationID } = data as { investigationID: number };
    const investigation = db.prepare(`
      SELECT i.*,
        CASE WHEN d.firstName IS NOT NULL
          THEN d.firstName || COALESCE(' ' || d.lastName, '')
          ELSE NULL
        END as doctorName
      FROM Investigations i
      LEFT JOIN Doctors d ON i.orderedByDoctorID = d.doctorID
      WHERE i.investigationID = ?
    `).get(investigationID);
    return investigation;
  },

  'create-investigation': (db, data) => {
    const validated = validateOrThrow(createInvestigationSchema, data);
    const result = db.prepare(`
      INSERT INTO Investigations (
        patientID, investigationType, investigationDate, orderedByDoctorID,
        bodyPart, findings, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      validated.patientID,
      validated.investigationType,
      validated.investigationDate,
      validated.orderedByDoctorID ?? null,
      validated.bodyPart ?? null,
      validated.findings ?? null,
      validated.status ?? 'Ordered',
      validated.notes ?? null
    );
    return { investigationID: result.lastInsertRowid };
  },

  'update-investigation': (db, data) => {
    const validated = validateOrThrow(updateInvestigationSchema, data);
    db.prepare(`
      UPDATE Investigations SET
        investigationType = ?,
        investigationDate = ?,
        orderedByDoctorID = ?,
        bodyPart = ?,
        findings = ?,
        status = ?,
        notes = ?,
        updatedAt = CURRENT_TIMESTAMP
      WHERE investigationID = ?
    `).run(
      validated.investigationType,
      validated.investigationDate,
      validated.orderedByDoctorID ?? null,
      validated.bodyPart ?? null,
      validated.findings ?? null,
      validated.status ?? 'Ordered',
      validated.notes ?? null,
      validated.investigationID
    );
    return { success: true };
  },

  'delete-investigation': (db, data) => {
    const { investigationID } = data as { investigationID: number };
    db.prepare('DELETE FROM Investigations WHERE investigationID = ?').run(investigationID);
    return { success: true };
  },
};
