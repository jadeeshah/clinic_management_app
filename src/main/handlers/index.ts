import { authHandlers } from './auth';
import { settingsHandlers } from './settings';
import { doctorHandlers } from './doctors';
import { patientHandlers } from './patients';
import { visitHandlers } from './visits';
import { serviceHandlers } from './services';
import { invoiceHandlers } from './invoices';
import { packageHandlers } from './packages';
import { attachmentHandlers } from './attachments';
import { expenseHandlers } from './expenses';
import { financeHandlers } from './finance';
import { analyticsHandlers } from './analytics';
import { exportHandlers } from './exports';
import { investigationHandlers } from './investigations';
import { adminHandlers } from './admin';
import type Database from 'better-sqlite3';

export type Handler = (db: Database.Database, data: unknown) => unknown;

export const operationHandlers: Record<string, Handler> = {
  ...authHandlers,
  ...settingsHandlers,
  ...doctorHandlers,
  ...patientHandlers,
  ...visitHandlers,
  ...serviceHandlers,
  ...invoiceHandlers,
  ...packageHandlers,
  ...attachmentHandlers,
  ...expenseHandlers,
  ...financeHandlers,
  ...analyticsHandlers,
  ...exportHandlers,
  ...investigationHandlers,
  ...adminHandlers,
};
