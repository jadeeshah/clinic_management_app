import type Database from 'better-sqlite3';
import { validateOrThrow, createDoctorSchema, updateDoctorSchema } from '../../shared/validation';

export type Handler = (db: Database.Database, data: unknown) => unknown;

export const doctorHandlers: Record<string, Handler> = {
  'get-doctors': (db) => {
    return db.prepare('SELECT * FROM Doctors WHERE isActive = 1 ORDER BY firstName').all();
  },

  'get-doctor': (db, data) => {
    const { doctorID } = data as { doctorID: number };
    return db.prepare('SELECT * FROM Doctors WHERE doctorID = ?').get(doctorID);
  },

  'create-doctor': (db, data) => {
    const doctor = validateOrThrow(createDoctorSchema, data);
    const stmt = db.prepare(`
      INSERT INTO Doctors (firstName, lastName, education, designation, specialization,
        sessionCharge, availableDays, startTime, endTime, phone, email)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      doctor.firstName, doctor.lastName ?? null, doctor.education ?? null, doctor.designation ?? null,
      doctor.specialization ?? null, doctor.sessionCharge ?? null,
      JSON.stringify(doctor.availableDays ?? []),
      doctor.startTime ?? null, doctor.endTime ?? null, doctor.phone ?? null, doctor.email ?? null
    );
    return { doctorID: result.lastInsertRowid };
  },

  'update-doctor': (db, data) => {
    const doctor = validateOrThrow(updateDoctorSchema, data);
    const stmt = db.prepare(`
      UPDATE Doctors SET
        firstName = ?, lastName = ?, education = ?, designation = ?,
        specialization = ?, sessionCharge = ?, availableDays = ?,
        startTime = ?, endTime = ?, phone = ?, email = ?,
        updatedAt = CURRENT_TIMESTAMP
      WHERE doctorID = ?
    `);
    stmt.run(
      doctor.firstName, doctor.lastName ?? null, doctor.education ?? null, doctor.designation ?? null,
      doctor.specialization ?? null, doctor.sessionCharge ?? null,
      JSON.stringify(doctor.availableDays ?? []),
      doctor.startTime ?? null, doctor.endTime ?? null, doctor.phone ?? null, doctor.email ?? null,
      doctor.doctorID
    );
    return { success: true };
  },

  'deactivate-doctor': (db, data) => {
    const { doctorID } = data as { doctorID: number };
    db.prepare('UPDATE Doctors SET isActive = 0, updatedAt = CURRENT_TIMESTAMP WHERE doctorID = ?')
      .run(doctorID);
    return { success: true };
  },
};
