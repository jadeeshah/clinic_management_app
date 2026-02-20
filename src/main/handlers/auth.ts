import type Database from 'better-sqlite3';
import * as bcrypt from 'bcryptjs';
import { validateOrThrow, loginSchema } from '../../shared/validation';

export type Handler = (db: Database.Database, data: unknown) => unknown;

export const authHandlers: Record<string, Handler> = {
  'validate-user': (db, data) => {
    const validated = validateOrThrow(loginSchema, data);
    const { username, password } = validated;
    const user = db.prepare(
      'SELECT * FROM Users WHERE username = ? AND isActive = 1'
    ).get(username) as { passwordHash: string; userID: number; role: string } | undefined;

    if (user && bcrypt.compareSync(password, user.passwordHash)) {
      const { passwordHash, ...safeUser } = user;
      return safeUser;
    }
    return null;
  },
};
