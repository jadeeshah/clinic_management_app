/**
 * Patient export utilities
 */

import type { Patient, Visit, Invoice, PatientPackage } from '../../types';

interface PatientExportData {
  patient: Patient;
  visits: Visit[];
  invoices: Invoice[];
  packages: PatientPackage[];
}

/**
 * Escapes a value for CSV (handles commas, quotes, newlines)
 */
const escapeCSV = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // If contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * Formats a date for display in exports
 */
const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US');
};

/**
 * Exports a single patient's complete data to CSV
 */
export const exportPatientToCSV = (data: PatientExportData): string => {
  const { patient, visits, invoices, packages } = data;
  const lines: string[] = [];

  // Format diagnosis codes for use in patient info and visit rows
  let diagnosisText = '';
  if (patient.diagnosis) {
    try {
      const codes = JSON.parse(patient.diagnosis);
      diagnosisText = Array.isArray(codes)
        ? codes.map((c: { code: string; description?: string }) => c.description ? `${c.code} - ${c.description}` : c.code).join('; ')
        : patient.diagnosis;
    } catch {
      diagnosisText = patient.diagnosis;
    }
  }

  // Patient Information Section
  lines.push('PATIENT INFORMATION');
  lines.push('');
  lines.push(`MRN,${escapeCSV(patient.mrn)}`);
  lines.push(`Name,${escapeCSV(`${patient.firstName} ${patient.lastName || ''}`)}`);
  lines.push(`Phone,${escapeCSV(patient.phone)}`);
  lines.push(`WhatsApp,${escapeCSV(patient.whatsApp)}`);
  lines.push(`Email,${escapeCSV(patient.email)}`);
  lines.push(`Date of Birth,${formatDate(patient.dateOfBirth)}`);
  lines.push(`Sex,${escapeCSV(patient.sex)}`);
  lines.push(`Address,${escapeCSV(patient.address)}`);
  lines.push(`City,${escapeCSV(patient.city)}`);
  lines.push(`Emergency Contact,${escapeCSV(patient.emergencyContactName)}`);
  lines.push(`Emergency Phone,${escapeCSV(patient.emergencyContactPhone)}`);
  lines.push(`Emergency Relation,${escapeCSV(patient.emergencyContactRelation)}`);
  lines.push(`Diagnosis,${escapeCSV(diagnosisText)}`);
  lines.push(`Notes,${escapeCSV(patient.notes)}`);
  lines.push(`Registered,${formatDate(patient.createdAt)}`);
  lines.push('');

  // Visits Section
  lines.push('VISIT HISTORY');
  lines.push(`Total Visits,${visits.length}`);
  lines.push(`Completed,${visits.filter(v => v.status === 'Completed').length}`);
  lines.push('');
  lines.push('Date,Patient Name,Phone,Diagnosis,Doctor,Session #,Payment,Package,Status,Notes');
  visits.forEach(visit => {
    const visitAny = visit as Visit & { packageName?: string; paidAmount?: number };
    lines.push([
      formatDate(visit.visitDate),
      escapeCSV(`${patient.firstName} ${patient.lastName || ''}`),
      escapeCSV(patient.phone),
      escapeCSV(diagnosisText),
      visit.doctorName || '',
      visit.sessionIndex || '',
      visitAny.paidAmount || 0,
      escapeCSV(visitAny.packageName || ''),
      visit.status,
      escapeCSV(visit.notes)
    ].join(','));
  });
  lines.push('');

  // Invoices Section
  lines.push('INVOICE HISTORY');
  const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
  lines.push(`Total Invoiced,${totalInvoiced}`);
  lines.push(`Total Paid,${totalPaid}`);
  lines.push(`Outstanding,${totalInvoiced - totalPaid}`);
  lines.push('');
  lines.push('Invoice #,Date,Doctor,Total,Paid,Status');
  invoices.forEach(inv => {
    lines.push([
      inv.invoiceNo,
      formatDate(inv.invoiceDate),
      inv.doctorName || '',
      inv.total,
      inv.paidAmount || 0,
      inv.status
    ].join(','));
  });
  lines.push('');

  // Packages Section
  if (packages.length > 0) {
    lines.push('PACKAGES');
    lines.push('Package,Total Sessions,Used,Remaining,Status,Purchase Date,Expiry Date');
    packages.forEach(pkg => {
      const remaining = (pkg.totalSessions || 0) - (pkg.sessionsUsed || 0);
      lines.push([
        pkg.packageName || '',
        pkg.totalSessions || 0,
        pkg.sessionsUsed || 0,
        remaining,
        pkg.status,
        formatDate(pkg.purchaseDate),
        formatDate(pkg.expiryDate)
      ].join(','));
    });
  }

  return lines.join('\n');
};

interface PatientListItem {
  patientID: number;
  mrn: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  totalVisits: number;
  completedVisits: number;
  totalPaid: number;
  createdAt: string;
}

/**
 * Exports a list of patients to CSV
 */
export const exportPatientListToCSV = (patients: PatientListItem[]): string => {
  const lines: string[] = [];

  // Header
  lines.push('MRN,Name,Phone,City,Total Visits,Completed Sessions,Total Paid (Rs),Registered Date');

  // Data rows
  patients.forEach(patient => {
    lines.push([
      escapeCSV(patient.mrn),
      escapeCSV(`${patient.firstName} ${patient.lastName || ''}`),
      escapeCSV(patient.phone),
      escapeCSV(patient.city),
      patient.totalVisits || 0,
      patient.completedVisits || 0,
      patient.totalPaid || 0,
      formatDate(patient.createdAt)
    ].join(','));
  });

  return lines.join('\n');
};

/**
 * Triggers a file download with the given content
 */
export const downloadCSV = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
