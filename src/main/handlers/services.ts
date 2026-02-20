import type Database from 'better-sqlite3';
import { validateOrThrow, createServiceSchema, updateServiceSchema } from '../../shared/validation';

export type Handler = (db: Database.Database, data: unknown) => unknown;

export const serviceHandlers: Record<string, Handler> = {
  'get-services': (db) => {
    return db.prepare('SELECT * FROM Services WHERE isActive = 1 ORDER BY name').all();
  },

  'create-service': (db, data) => {
    const service = validateOrThrow(createServiceSchema, data);
    const stmt = db.prepare(`
      INSERT INTO Services (code, name, defaultPrice, category)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(
      service.code, service.name, service.defaultPrice ?? 0, service.category ?? null
    );
    return { serviceID: result.lastInsertRowid };
  },

  'update-service': (db, data) => {
    const service = validateOrThrow(updateServiceSchema, data);
    const stmt = db.prepare(`
      UPDATE Services SET code = ?, name = ?, defaultPrice = ?, category = ?
      WHERE serviceID = ?
    `);
    stmt.run(service.code, service.name, service.defaultPrice ?? 0, service.category ?? null, service.serviceID);
    return { success: true };
  },

  'deactivate-service': (db, data) => {
    const { serviceID } = data as { serviceID: number };
    db.prepare('UPDATE Services SET isActive = 0 WHERE serviceID = ?').run(serviceID);
    return { success: true };
  },
};
