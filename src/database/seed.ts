/**
 * Database Seeder
 * Populates the database with demo data for testing and demonstrations
 */

import Database from 'better-sqlite3';
import * as bcrypt from 'bcryptjs';
import {
  seedDoctors,
  seedPatients,
  seedPackages,
  seedServices,
  seedPatientPackages,
  seedVisits,
  seedInvoices,
  seedPayments,
  seedExpenses,
  seedDataSummary,
} from './seedData';

export interface SeedOptions {
  clearExisting?: boolean;
}

export interface SeedResult {
  success: boolean;
  message: string;
  counts: {
    doctors: number;
    patients: number;
    packages: number;
    services: number;
    patientPackages: number;
    visits: number;
    invoices: number;
    invoiceItems: number;
    payments: number;
    expenses: number;
  };
}

/**
 * Seeds the database with demo data
 * @param db - better-sqlite3 database instance
 * @param options - Seeding options
 */
export function seedDatabase(db: Database.Database, options: SeedOptions = {}): SeedResult {
  const counts = {
    doctors: 0,
    patients: 0,
    packages: 0,
    services: 0,
    patientPackages: 0,
    visits: 0,
    invoices: 0,
    invoiceItems: 0,
    payments: 0,
    expenses: 0,
  };

  try {
    // Use a transaction for atomicity
    const transaction = db.transaction(() => {
      // Clear existing data if requested
      if (options.clearExisting) {
        clearDemoData(db);
      }

      // Insert in order of dependencies
      const doctorIds = insertDoctors(db);
      counts.doctors = doctorIds.length;

      const patientIds = insertPatients(db);
      counts.patients = patientIds.length;

      const packageIds = insertPackages(db);
      counts.packages = packageIds.length;

      counts.services = insertServices(db);

      const patientPackageIds = insertPatientPackages(db, patientIds, packageIds);
      counts.patientPackages = patientPackageIds.length;

      const visitIds = insertVisits(db, patientIds, doctorIds, patientPackageIds);
      counts.visits = visitIds.length;

      const { invoiceIds, itemCount } = insertInvoices(db, patientIds, doctorIds, visitIds);
      counts.invoices = invoiceIds.length;
      counts.invoiceItems = itemCount;

      counts.payments = insertPayments(db, invoiceIds);

      counts.expenses = insertExpenses(db);
    });

    transaction();

    return {
      success: true,
      message: `Successfully seeded database with demo data`,
      counts,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      message: `Failed to seed database: ${errorMessage}`,
      counts,
    };
  }
}

/**
 * Clears demo data from the database
 * Preserves the admin user and default services
 */
function clearDemoData(db: Database.Database): void {
  // Delete in reverse order of dependencies
  db.exec('DELETE FROM Payments');
  db.exec('DELETE FROM InvoiceItems');
  db.exec('DELETE FROM Invoices');
  db.exec('DELETE FROM Visits');
  db.exec('DELETE FROM PatientPackages');
  db.exec('DELETE FROM Attachments');
  db.exec('DELETE FROM Patients');
  db.exec('DELETE FROM Packages');
  db.exec('DELETE FROM Doctors');
  db.exec('DELETE FROM Expenses');
  // Keep default services but remove any custom ones
  db.exec("DELETE FROM Services WHERE code NOT IN ('PT-SESSION', 'EVAL', 'TAPING', 'ELECTRO', 'HEP')");
}

function insertDoctors(db: Database.Database): number[] {
  const stmt = db.prepare(`
    INSERT INTO Doctors (firstName, lastName, education, designation, specialization,
      sessionCharge, availableDays, startTime, endTime, phone, email, isActive)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const ids: number[] = [];
  for (const doctor of seedDoctors) {
    const result = stmt.run(
      doctor.firstName,
      doctor.lastName,
      doctor.education,
      doctor.designation,
      doctor.specialization,
      doctor.sessionCharge,
      JSON.stringify(doctor.availableDays),
      doctor.startTime,
      doctor.endTime,
      doctor.phone,
      doctor.email,
      doctor.isActive ? 1 : 0
    );
    ids.push(result.lastInsertRowid as number);
  }
  return ids;
}

function insertPatients(db: Database.Database): number[] {
  const stmt = db.prepare(`
    INSERT INTO Patients (mrn, firstName, lastName, phone, whatsApp, email, dateOfBirth,
      sex, address, city, emergencyContactName, emergencyContactPhone, emergencyContactRelation, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const ids: number[] = [];
  for (const patient of seedPatients) {
    const result = stmt.run(
      patient.mrn,
      patient.firstName,
      patient.lastName,
      patient.phone,
      patient.whatsApp,
      patient.email,
      patient.dateOfBirth,
      patient.sex,
      patient.address,
      patient.city,
      patient.emergencyContactName,
      patient.emergencyContactPhone,
      patient.emergencyContactRelation,
      patient.notes
    );
    ids.push(result.lastInsertRowid as number);
  }
  return ids;
}

function insertPackages(db: Database.Database): number[] {
  const stmt = db.prepare(`
    INSERT INTO Packages (name, totalSessions, price, validityDays, isActive)
    VALUES (?, ?, ?, ?, ?)
  `);

  const ids: number[] = [];
  for (const pkg of seedPackages) {
    const result = stmt.run(
      pkg.name,
      pkg.totalSessions,
      pkg.price,
      pkg.validityDays,
      pkg.isActive ? 1 : 0
    );
    ids.push(result.lastInsertRowid as number);
  }
  return ids;
}

function insertServices(db: Database.Database): number {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO Services (code, name, defaultPrice, category, isActive)
    VALUES (?, ?, ?, ?, ?)
  `);

  let count = 0;
  for (const service of seedServices) {
    const result = stmt.run(
      service.code,
      service.name,
      service.defaultPrice,
      service.category,
      service.isActive ? 1 : 0
    );
    if (result.changes > 0) count++;
  }
  return count;
}

function insertPatientPackages(
  db: Database.Database,
  patientIds: number[],
  packageIds: number[]
): number[] {
  const stmt = db.prepare(`
    INSERT INTO PatientPackages (patientID, packageID, purchaseDate, expiryDate, sessionsUsed, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const ids: number[] = [];
  for (const pp of seedPatientPackages) {
    const patientId = patientIds[pp.patientIndex];
    const packageId = packageIds[pp.packageIndex];
    const pkg = seedPackages[pp.packageIndex];

    // Calculate expiry date
    const purchaseDate = new Date(pp.purchaseDate);
    const expiryDate = new Date(purchaseDate);
    expiryDate.setDate(expiryDate.getDate() + pkg.validityDays);

    const result = stmt.run(
      patientId,
      packageId,
      pp.purchaseDate,
      expiryDate.toISOString().split('T')[0],
      pp.sessionsUsed,
      pp.status
    );
    ids.push(result.lastInsertRowid as number);
  }
  return ids;
}

function insertVisits(
  db: Database.Database,
  patientIds: number[],
  doctorIds: number[],
  patientPackageIds: number[]
): number[] {
  const stmt = db.prepare(`
    INSERT INTO Visits (patientID, doctorID, visitDate, startTime, endTime, duration,
      status, visitType, sessionIndex, notes, patientPackageID)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const ids: number[] = [];
  for (const visit of seedVisits) {
    const patientId = patientIds[visit.patientIndex];
    const doctorId = doctorIds[visit.doctorIndex];
    const patientPackageId = visit.patientPackageIndex !== undefined
      ? patientPackageIds[visit.patientPackageIndex]
      : null;

    // Calculate end time
    const startTimeParts = visit.startTime.split(':');
    const startHour = parseInt(startTimeParts[0]);
    const startMin = parseInt(startTimeParts[1]);
    const endMin = startMin + visit.duration;
    const endHour = startHour + Math.floor(endMin / 60);
    const endMinFinal = endMin % 60;
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMinFinal.toString().padStart(2, '0')}`;

    const result = stmt.run(
      patientId,
      doctorId,
      visit.visitDate,
      visit.startTime,
      endTime,
      visit.duration,
      visit.status,
      visit.visitType,
      visit.sessionIndex,
      visit.notes,
      patientPackageId
    );
    ids.push(result.lastInsertRowid as number);
  }
  return ids;
}

function insertInvoices(
  db: Database.Database,
  patientIds: number[],
  doctorIds: number[],
  visitIds: number[]
): { invoiceIds: number[]; itemCount: number } {
  const invoiceStmt = db.prepare(`
    INSERT INTO Invoices (invoiceNo, patientID, doctorID, visitID, invoiceDate,
      subtotal, discountAmount, taxAmount, total, status, nextVisitDate, nextVisitTime)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const itemStmt = db.prepare(`
    INSERT INTO InvoiceItems (invoiceID, serviceID, description, quantity, unitPrice, lineTotal)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // Get service IDs by code
  const services = db.prepare('SELECT serviceID, code, name FROM Services').all() as Array<{
    serviceID: number;
    code: string;
    name: string;
  }>;
  const serviceMap = new Map(services.map(s => [s.code, { id: s.serviceID, name: s.name }]));

  const invoiceIds: number[] = [];
  let itemCount = 0;
  let invoiceCounter = 1;

  for (const invoice of seedInvoices) {
    const patientId = patientIds[invoice.patientIndex];
    const doctorId = doctorIds[invoice.doctorIndex];
    const visitId = invoice.visitIndex !== undefined ? visitIds[invoice.visitIndex] : null;
    const invoiceNo = `INV-2024-${invoiceCounter.toString().padStart(4, '0')}`;

    const result = invoiceStmt.run(
      invoiceNo,
      patientId,
      doctorId,
      visitId,
      invoice.invoiceDate,
      invoice.subtotal,
      invoice.discountAmount,
      invoice.taxAmount,
      invoice.total,
      invoice.status,
      invoice.nextVisitDate,
      invoice.nextVisitTime
    );
    const invoiceId = result.lastInsertRowid as number;
    invoiceIds.push(invoiceId);
    invoiceCounter++;

    // Insert invoice items
    for (const item of invoice.items) {
      const service = serviceMap.get(item.serviceCode);
      if (service) {
        itemStmt.run(
          invoiceId,
          service.id,
          service.name,
          item.quantity,
          item.unitPrice,
          item.quantity * item.unitPrice
        );
        itemCount++;
      }
    }
  }

  return { invoiceIds, itemCount };
}

function insertPayments(db: Database.Database, invoiceIds: number[]): number {
  const stmt = db.prepare(`
    INSERT INTO Payments (invoiceID, paymentDate, amount, method, transactionID, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  let count = 0;
  for (const payment of seedPayments) {
    const invoiceId = invoiceIds[payment.invoiceIndex];
    stmt.run(
      invoiceId,
      payment.paymentDate,
      payment.amount,
      payment.method,
      payment.transactionID,
      payment.notes
    );
    count++;
  }
  return count;
}

function insertExpenses(db: Database.Database): number {
  const stmt = db.prepare(`
    INSERT INTO Expenses (expenseDate, title, category, amount, paidTo, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  let count = 0;
  for (const expense of seedExpenses) {
    stmt.run(
      expense.expenseDate,
      expense.title,
      expense.category,
      expense.amount,
      expense.paidTo,
      expense.notes
    );
    count++;
  }
  return count;
}

/**
 * Check if demo data already exists
 */
export function hasDemoData(db: Database.Database): boolean {
  const result = db.prepare('SELECT COUNT(*) as count FROM Doctors').get() as { count: number };
  return result.count > 0;
}

/**
 * Get summary of current data in database
 */
export function getDataSummary(db: Database.Database): Record<string, number> {
  return {
    doctors: (db.prepare('SELECT COUNT(*) as c FROM Doctors').get() as { c: number }).c,
    patients: (db.prepare('SELECT COUNT(*) as c FROM Patients').get() as { c: number }).c,
    visits: (db.prepare('SELECT COUNT(*) as c FROM Visits').get() as { c: number }).c,
    invoices: (db.prepare('SELECT COUNT(*) as c FROM Invoices').get() as { c: number }).c,
    packages: (db.prepare('SELECT COUNT(*) as c FROM Packages').get() as { c: number }).c,
    expenses: (db.prepare('SELECT COUNT(*) as c FROM Expenses').get() as { c: number }).c,
  };
}
