import type Database from 'better-sqlite3';

export type Handler = (db: Database.Database, data: unknown) => unknown;

export const attachmentHandlers: Record<string, Handler> = {
  'get-attachments': (db, data) => {
    const { entityType, entityID } = data as { entityType: string; entityID: number };
    return db.prepare(`
      SELECT * FROM Attachments WHERE entityType = ? AND entityID = ?
      ORDER BY uploadedAt DESC
    `).all(entityType, entityID);
  },

  'create-attachment': (db, data) => {
    const att = data as Record<string, unknown>;
    const stmt = db.prepare(`
      INSERT INTO Attachments (entityType, entityID, fileName, filePath, fileType, fileSize)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      att.entityType, att.entityID, att.fileName, att.filePath,
      att.fileType ?? null, att.fileSize ?? null
    );
    return { attachmentID: result.lastInsertRowid };
  },

  'delete-attachment': (db, data) => {
    const { attachmentID } = data as { attachmentID: number };
    db.prepare('DELETE FROM Attachments WHERE attachmentID = ?').run(attachmentID);
    return { success: true };
  },
};
