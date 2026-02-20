import type Database from 'better-sqlite3';

export type Handler = (db: Database.Database, data: unknown) => unknown;

export const settingsHandlers: Record<string, Handler> = {
  'get-settings': (db) => {
    return db.prepare('SELECT * FROM Settings WHERE settingsID = 1').get();
  },

  'update-settings': (db, data) => {
    const settings = data as Record<string, unknown>;
    const fields = Object.keys(settings).filter(k => k !== 'settingsID');
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => settings[f]);

    db.prepare(`UPDATE Settings SET ${setClause}, updatedAt = CURRENT_TIMESTAMP WHERE settingsID = 1`)
      .run(...values);
    return true;
  },
};
