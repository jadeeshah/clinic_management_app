/**
 * Comprehensive Seed Data Fixtures
 * Used for both automated tests and production "Load Demo Data" feature
 */

import {
  Doctor,
  Patient,
  Visit,
  Package,
  PatientPackage,
  Invoice,
  InvoiceItem,
  Payment,
  Expense,
  Service,
} from '../types';

// Helper to generate dates relative to today
const today = new Date();
const formatDate = (date: Date): string => date.toISOString().split('T')[0];
const daysAgo = (days: number): string => {
  const d = new Date(today);
  d.setDate(d.getDate() - days);
  return formatDate(d);
};
const daysFromNow = (days: number): string => {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return formatDate(d);
};

// ============================================
// DOCTORS (4 doctors)
// ============================================
export const seedDoctors: Omit<Doctor, 'doctorID' | 'createdAt' | 'updatedAt'>[] = [
  {
    firstName: 'Sarah',
    lastName: 'Khan',
    education: 'DPT, MS Orthopedic PT',
    designation: 'Senior Physiotherapist',
    specialization: 'Orthopedic Rehabilitation',
    sessionCharge: 2000,
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    startTime: '09:00',
    endTime: '17:00',
    phone: '03001234567',
    email: 'sarah.khan@clinic.com',
    isActive: true,
  },
  {
    firstName: 'Ahmed',
    lastName: 'Ali',
    education: 'DPT, Sports Medicine Certified',
    designation: 'Sports Physiotherapist',
    specialization: 'Sports Injuries & Rehabilitation',
    sessionCharge: 2500,
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    startTime: '10:00',
    endTime: '18:00',
    phone: '03009876543',
    email: 'ahmed.ali@clinic.com',
    isActive: true,
  },
  {
    firstName: 'Fatima',
    lastName: 'Malik',
    education: 'DPT, MS Neurological PT',
    designation: 'Neurological Physiotherapist',
    specialization: 'Stroke & Neurological Rehabilitation',
    sessionCharge: 2000,
    availableDays: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    startTime: '09:00',
    endTime: '16:00',
    phone: '03215551234',
    email: 'fatima.malik@clinic.com',
    isActive: true,
  },
  {
    firstName: 'Hassan',
    lastName: 'Raza',
    education: 'DPT, Pediatric PT Certified',
    designation: 'Pediatric Physiotherapist',
    specialization: 'Pediatric Developmental Therapy',
    sessionCharge: 1800,
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
    startTime: '10:00',
    endTime: '17:00',
    phone: '03331112233',
    email: 'hassan.raza@clinic.com',
    isActive: true,
  },
];

// ============================================
// PATIENTS (10 patients)
// ============================================
export const seedPatients: Omit<Patient, 'patientID' | 'createdAt' | 'updatedAt'>[] = [
  {
    mrn: 'CLN-2024-0001',
    firstName: 'Muhammad',
    lastName: 'Imran',
    phone: '03001112233',
    whatsApp: '03001112233',
    email: 'imran@email.com',
    dateOfBirth: '1985-03-15',
    sex: 'Male',
    address: '123 Main Street, Gulberg',
    city: 'Lahore',
    emergencyContactName: 'Ayesha Imran',
    emergencyContactPhone: '03001112234',
    emergencyContactRelation: 'Wife',
    notes: 'Lower back pain, desk job. Regular physiotherapy patient.',
  },
  {
    mrn: 'CLN-2024-0002',
    firstName: 'Ayesha',
    lastName: 'Siddiqui',
    phone: '03009998877',
    whatsApp: '03009998877',
    email: 'ayesha.s@email.com',
    dateOfBirth: '1990-07-22',
    sex: 'Female',
    address: '45 Garden Town',
    city: 'Lahore',
    emergencyContactName: 'Tariq Siddiqui',
    emergencyContactPhone: '03009998878',
    emergencyContactRelation: 'Husband',
    notes: 'Post-surgery knee rehabilitation. ACL reconstruction.',
  },
  {
    mrn: 'CLN-2024-0003',
    firstName: 'Ali',
    lastName: 'Hassan',
    phone: '03215556677',
    whatsApp: '03215556677',
    email: 'ali.hassan@email.com',
    dateOfBirth: '1978-11-08',
    sex: 'Male',
    address: '78 Model Town',
    city: 'Lahore',
    emergencyContactName: 'Sana Hassan',
    emergencyContactPhone: '03215556678',
    emergencyContactRelation: 'Wife',
    notes: 'Cervical spondylosis. Office worker with neck pain.',
  },
  {
    mrn: 'CLN-2024-0004',
    firstName: 'Fatima',
    lastName: 'Bibi',
    phone: '03331234567',
    whatsApp: '03331234567',
    email: null,
    dateOfBirth: '1965-05-20',
    sex: 'Female',
    address: '23 Township',
    city: 'Lahore',
    emergencyContactName: 'Asad Ali',
    emergencyContactPhone: '03331234568',
    emergencyContactRelation: 'Son',
    notes: 'Post-stroke rehabilitation. Right side weakness.',
  },
  {
    mrn: 'CLN-2024-0005',
    firstName: 'Zain',
    lastName: 'Ahmed',
    phone: '03007654321',
    whatsApp: '03007654321',
    email: 'zain.ahmed@email.com',
    dateOfBirth: '1995-09-12',
    sex: 'Male',
    address: '56 DHA Phase 5',
    city: 'Lahore',
    emergencyContactName: 'Amna Ahmed',
    emergencyContactPhone: '03007654322',
    emergencyContactRelation: 'Mother',
    notes: 'Sports injury - shoulder. Cricket player.',
  },
  {
    mrn: 'CLN-2024-0006',
    firstName: 'Sana',
    lastName: 'Farooq',
    phone: '03111223344',
    whatsApp: '03111223344',
    email: 'sana.f@email.com',
    dateOfBirth: '1988-02-28',
    sex: 'Female',
    address: '89 Johar Town',
    city: 'Lahore',
    emergencyContactName: 'Farooq Ahmad',
    emergencyContactPhone: '03111223345',
    emergencyContactRelation: 'Father',
    notes: 'Chronic back pain. Teacher, standing for long hours.',
  },
  {
    mrn: 'CLN-2024-0007',
    firstName: 'Bilal',
    lastName: 'Mahmood',
    phone: '03009876123',
    whatsApp: '03009876123',
    email: 'bilal.m@email.com',
    dateOfBirth: '1982-12-05',
    sex: 'Male',
    address: '34 Bahria Town',
    city: 'Lahore',
    emergencyContactName: 'Nadia Bilal',
    emergencyContactPhone: '03009876124',
    emergencyContactRelation: 'Wife',
    notes: 'Frozen shoulder. Diabetic patient.',
  },
  {
    mrn: 'CLN-2024-0008',
    firstName: 'Hira',
    lastName: 'Shakeel',
    phone: '03215559988',
    whatsApp: '03215559988',
    email: 'hira.s@email.com',
    dateOfBirth: '1992-06-18',
    sex: 'Female',
    address: '12 Cavalry Ground',
    city: 'Lahore',
    emergencyContactName: 'Shakeel Ahmed',
    emergencyContactPhone: '03215559989',
    emergencyContactRelation: 'Father',
    notes: 'Postural issues. IT professional.',
  },
  {
    mrn: 'CLN-2024-0009',
    firstName: 'Hamza',
    lastName: null,
    phone: '03331122334',
    whatsApp: null,
    email: null,
    dateOfBirth: '2018-04-10',
    sex: 'Male',
    address: '67 Valencia Town',
    city: 'Lahore',
    emergencyContactName: 'Usman (Father)',
    emergencyContactPhone: '03331122335',
    emergencyContactRelation: 'Father',
    notes: 'Pediatric patient. Developmental delay therapy.',
  },
  {
    mrn: 'CLN-2024-0010',
    firstName: 'Rabia',
    lastName: 'Tariq',
    phone: '03007778899',
    whatsApp: '03007778899',
    email: 'rabia.tariq@email.com',
    dateOfBirth: '1975-10-30',
    sex: 'Female',
    address: '90 Gulshan-e-Ravi',
    city: 'Lahore',
    emergencyContactName: 'Tariq Mehmood',
    emergencyContactPhone: '03007778890',
    emergencyContactRelation: 'Husband',
    notes: 'Arthritis management. Both knees affected.',
  },
];

// ============================================
// PACKAGES (3 packages)
// ============================================
export const seedPackages: Omit<Package, 'packageID' | 'createdAt'>[] = [
  {
    name: 'Basic 5-Session Package',
    totalSessions: 5,
    price: 4500,
    validityDays: 30,
    isActive: true,
  },
  {
    name: 'Standard 10-Session Package',
    totalSessions: 10,
    price: 8500,
    validityDays: 60,
    isActive: true,
  },
  {
    name: 'Premium 15-Session Package',
    totalSessions: 15,
    price: 12000,
    validityDays: 90,
    isActive: true,
  },
];

// ============================================
// ADDITIONAL SERVICES (beyond defaults)
// ============================================
export const seedServices: Omit<Service, 'serviceID'>[] = [
  {
    code: 'MASSAGE',
    name: 'Therapeutic Massage',
    defaultPrice: 1200,
    category: 'Treatment',
    isActive: true,
  },
  {
    code: 'ULTRASOUND',
    name: 'Ultrasound Therapy',
    defaultPrice: 600,
    category: 'Treatment',
    isActive: true,
  },
  {
    code: 'CUPPING',
    name: 'Cupping Therapy',
    defaultPrice: 800,
    category: 'Treatment',
    isActive: true,
  },
];

// ============================================
// PATIENT PACKAGES (3 enrollments)
// Uses patient and package IDs - will be populated after insert
// ============================================
export const seedPatientPackages: Array<{
  patientIndex: number; // Index in seedPatients array
  packageIndex: number; // Index in seedPackages array
  purchaseDate: string;
  sessionsUsed: number;
  status: 'Active' | 'Expired' | 'Completed';
}> = [
  {
    patientIndex: 1, // Ayesha - ACL rehab
    packageIndex: 1, // Standard 10-Session
    purchaseDate: daysAgo(20),
    sessionsUsed: 4,
    status: 'Active',
  },
  {
    patientIndex: 4, // Zain - Sports injury
    packageIndex: 0, // Basic 5-Session
    purchaseDate: daysAgo(35),
    sessionsUsed: 5,
    status: 'Completed',
  },
  {
    patientIndex: 6, // Bilal - Frozen shoulder
    packageIndex: 0, // Basic 5-Session
    purchaseDate: daysAgo(45),
    sessionsUsed: 3,
    status: 'Expired',
  },
];

// ============================================
// VISITS (25 visits)
// Mix of past completed, current scheduled, and future
// ============================================
export const seedVisits: Array<{
  patientIndex: number;
  doctorIndex: number;
  visitDate: string;
  startTime: string;
  duration: number;
  status: 'Scheduled' | 'InProgress' | 'Completed' | 'Cancelled' | 'NoShow';
  visitType: 'Evaluation' | 'FollowUp' | 'TherapySession';
  sessionIndex: number | null;
  notes: string | null;
  patientPackageIndex?: number; // Optional link to patient package
}> = [
  // Past completed visits
  { patientIndex: 0, doctorIndex: 0, visitDate: daysAgo(28), startTime: '09:00', duration: 45, status: 'Completed', visitType: 'Evaluation', sessionIndex: 1, notes: 'Initial evaluation. Lower back pain assessment.' },
  { patientIndex: 0, doctorIndex: 0, visitDate: daysAgo(21), startTime: '09:00', duration: 45, status: 'Completed', visitType: 'TherapySession', sessionIndex: 2, notes: 'Manual therapy and exercises.' },
  { patientIndex: 0, doctorIndex: 0, visitDate: daysAgo(14), startTime: '09:00', duration: 45, status: 'Completed', visitType: 'TherapySession', sessionIndex: 3, notes: 'Good progress. Reduced pain.' },
  { patientIndex: 1, doctorIndex: 0, visitDate: daysAgo(20), startTime: '10:00', duration: 60, status: 'Completed', visitType: 'Evaluation', sessionIndex: 1, notes: 'Post ACL surgery evaluation.', patientPackageIndex: 0 },
  { patientIndex: 1, doctorIndex: 0, visitDate: daysAgo(15), startTime: '10:00', duration: 45, status: 'Completed', visitType: 'TherapySession', sessionIndex: 2, notes: 'ROM exercises.', patientPackageIndex: 0 },
  { patientIndex: 1, doctorIndex: 0, visitDate: daysAgo(10), startTime: '10:00', duration: 45, status: 'Completed', visitType: 'TherapySession', sessionIndex: 3, notes: 'Strengthening started.', patientPackageIndex: 0 },
  { patientIndex: 1, doctorIndex: 0, visitDate: daysAgo(5), startTime: '10:00', duration: 45, status: 'Completed', visitType: 'TherapySession', sessionIndex: 4, notes: 'Progressive exercises.', patientPackageIndex: 0 },
  { patientIndex: 2, doctorIndex: 0, visitDate: daysAgo(25), startTime: '11:00', duration: 45, status: 'Completed', visitType: 'Evaluation', sessionIndex: 1, notes: 'Cervical assessment.' },
  { patientIndex: 2, doctorIndex: 0, visitDate: daysAgo(18), startTime: '11:00', duration: 45, status: 'Completed', visitType: 'TherapySession', sessionIndex: 2, notes: 'Neck exercises and posture correction.' },
  { patientIndex: 3, doctorIndex: 2, visitDate: daysAgo(30), startTime: '09:00', duration: 60, status: 'Completed', visitType: 'Evaluation', sessionIndex: 1, notes: 'Stroke rehab evaluation. Right hemiparesis.' },
  { patientIndex: 3, doctorIndex: 2, visitDate: daysAgo(23), startTime: '09:00', duration: 45, status: 'Completed', visitType: 'TherapySession', sessionIndex: 2, notes: 'Balance and gait training.' },
  { patientIndex: 3, doctorIndex: 2, visitDate: daysAgo(16), startTime: '09:00', duration: 45, status: 'Completed', visitType: 'TherapySession', sessionIndex: 3, notes: 'Functional activities.' },
  { patientIndex: 4, doctorIndex: 1, visitDate: daysAgo(35), startTime: '10:00', duration: 45, status: 'Completed', visitType: 'Evaluation', sessionIndex: 1, notes: 'Shoulder injury assessment.', patientPackageIndex: 1 },
  { patientIndex: 4, doctorIndex: 1, visitDate: daysAgo(28), startTime: '10:00', duration: 45, status: 'Completed', visitType: 'TherapySession', sessionIndex: 2, notes: 'Rotator cuff exercises.', patientPackageIndex: 1 },
  { patientIndex: 4, doctorIndex: 1, visitDate: daysAgo(21), startTime: '10:00', duration: 45, status: 'Completed', visitType: 'TherapySession', sessionIndex: 3, notes: 'Progressive strengthening.', patientPackageIndex: 1 },
  { patientIndex: 4, doctorIndex: 1, visitDate: daysAgo(14), startTime: '10:00', duration: 45, status: 'Completed', visitType: 'TherapySession', sessionIndex: 4, notes: 'Sports-specific rehab.', patientPackageIndex: 1 },
  { patientIndex: 4, doctorIndex: 1, visitDate: daysAgo(7), startTime: '10:00', duration: 45, status: 'Completed', visitType: 'TherapySession', sessionIndex: 5, notes: 'Discharge. Return to sports.', patientPackageIndex: 1 },
  { patientIndex: 5, doctorIndex: 0, visitDate: daysAgo(12), startTime: '14:00', duration: 45, status: 'Completed', visitType: 'Evaluation', sessionIndex: 1, notes: 'Chronic back pain evaluation.' },
  { patientIndex: 8, doctorIndex: 3, visitDate: daysAgo(22), startTime: '10:00', duration: 45, status: 'Completed', visitType: 'Evaluation', sessionIndex: 1, notes: 'Pediatric developmental assessment.' },
  { patientIndex: 8, doctorIndex: 3, visitDate: daysAgo(15), startTime: '10:00', duration: 45, status: 'Completed', visitType: 'TherapySession', sessionIndex: 2, notes: 'Motor skill development.' },

  // Cancelled/NoShow
  { patientIndex: 7, doctorIndex: 0, visitDate: daysAgo(8), startTime: '15:00', duration: 45, status: 'Cancelled', visitType: 'Evaluation', sessionIndex: null, notes: 'Patient cancelled due to illness.' },
  { patientIndex: 9, doctorIndex: 0, visitDate: daysAgo(5), startTime: '16:00', duration: 45, status: 'NoShow', visitType: 'Evaluation', sessionIndex: null, notes: 'No show. Called, rescheduled.' },

  // Today's visits
  { patientIndex: 0, doctorIndex: 0, visitDate: formatDate(today), startTime: '09:00', duration: 45, status: 'Completed', visitType: 'TherapySession', sessionIndex: 4, notes: 'Maintenance session.' },
  { patientIndex: 3, doctorIndex: 2, visitDate: formatDate(today), startTime: '10:00', duration: 45, status: 'InProgress', visitType: 'TherapySession', sessionIndex: 4, notes: null },
  { patientIndex: 5, doctorIndex: 0, visitDate: formatDate(today), startTime: '14:00', duration: 45, status: 'Scheduled', visitType: 'FollowUp', sessionIndex: 2, notes: null },

  // Future scheduled
  { patientIndex: 1, doctorIndex: 0, visitDate: daysFromNow(2), startTime: '10:00', duration: 45, status: 'Scheduled', visitType: 'TherapySession', sessionIndex: 5, notes: null, patientPackageIndex: 0 },
  { patientIndex: 2, doctorIndex: 0, visitDate: daysFromNow(3), startTime: '11:00', duration: 45, status: 'Scheduled', visitType: 'TherapySession', sessionIndex: 3, notes: null },
  { patientIndex: 8, doctorIndex: 3, visitDate: daysFromNow(4), startTime: '10:00', duration: 45, status: 'Scheduled', visitType: 'TherapySession', sessionIndex: 3, notes: null },
  { patientIndex: 9, doctorIndex: 0, visitDate: daysFromNow(5), startTime: '16:00', duration: 60, status: 'Scheduled', visitType: 'Evaluation', sessionIndex: 1, notes: 'Rescheduled from no-show.' },
];

// ============================================
// INVOICES (15 invoices)
// Mix of statuses
// ============================================
export const seedInvoices: Array<{
  patientIndex: number;
  doctorIndex: number;
  visitIndex?: number;
  invoiceDate: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  status: 'Unpaid' | 'PartiallyPaid' | 'Paid' | 'Void';
  nextVisitDate: string | null;
  nextVisitTime: string | null;
  items: Array<{ serviceCode: string; quantity: number; unitPrice: number }>;
}> = [
  // Paid invoices
  { patientIndex: 0, doctorIndex: 0, visitIndex: 0, invoiceDate: daysAgo(28), subtotal: 1500, discountAmount: 0, taxAmount: 0, total: 1500, status: 'Paid', nextVisitDate: daysAgo(21), nextVisitTime: '09:00', items: [{ serviceCode: 'EVAL', quantity: 1, unitPrice: 1500 }] },
  { patientIndex: 0, doctorIndex: 0, visitIndex: 1, invoiceDate: daysAgo(21), subtotal: 1000, discountAmount: 0, taxAmount: 0, total: 1000, status: 'Paid', nextVisitDate: daysAgo(14), nextVisitTime: '09:00', items: [{ serviceCode: 'PT-SESSION', quantity: 1, unitPrice: 1000 }] },
  { patientIndex: 0, doctorIndex: 0, visitIndex: 2, invoiceDate: daysAgo(14), subtotal: 1000, discountAmount: 0, taxAmount: 0, total: 1000, status: 'Paid', nextVisitDate: formatDate(today), nextVisitTime: '09:00', items: [{ serviceCode: 'PT-SESSION', quantity: 1, unitPrice: 1000 }] },
  { patientIndex: 1, doctorIndex: 0, invoiceDate: daysAgo(20), subtotal: 8500, discountAmount: 0, taxAmount: 0, total: 8500, status: 'Paid', nextVisitDate: daysAgo(15), nextVisitTime: '10:00', items: [{ serviceCode: 'PT-SESSION', quantity: 10, unitPrice: 850 }] }, // Package purchase
  { patientIndex: 4, doctorIndex: 1, invoiceDate: daysAgo(35), subtotal: 4500, discountAmount: 0, taxAmount: 0, total: 4500, status: 'Paid', nextVisitDate: daysAgo(28), nextVisitTime: '10:00', items: [{ serviceCode: 'PT-SESSION', quantity: 5, unitPrice: 900 }] }, // Package purchase
  { patientIndex: 3, doctorIndex: 2, visitIndex: 9, invoiceDate: daysAgo(30), subtotal: 1500, discountAmount: 0, taxAmount: 0, total: 1500, status: 'Paid', nextVisitDate: daysAgo(23), nextVisitTime: '09:00', items: [{ serviceCode: 'EVAL', quantity: 1, unitPrice: 1500 }] },
  { patientIndex: 3, doctorIndex: 2, visitIndex: 10, invoiceDate: daysAgo(23), subtotal: 1000, discountAmount: 100, taxAmount: 0, total: 900, status: 'Paid', nextVisitDate: daysAgo(16), nextVisitTime: '09:00', items: [{ serviceCode: 'PT-SESSION', quantity: 1, unitPrice: 1000 }] },
  { patientIndex: 8, doctorIndex: 3, visitIndex: 18, invoiceDate: daysAgo(22), subtotal: 1500, discountAmount: 0, taxAmount: 0, total: 1500, status: 'Paid', nextVisitDate: daysAgo(15), nextVisitTime: '10:00', items: [{ serviceCode: 'EVAL', quantity: 1, unitPrice: 1500 }] },

  // Partially paid
  { patientIndex: 2, doctorIndex: 0, visitIndex: 7, invoiceDate: daysAgo(25), subtotal: 2300, discountAmount: 0, taxAmount: 0, total: 2300, status: 'PartiallyPaid', nextVisitDate: daysAgo(18), nextVisitTime: '11:00', items: [{ serviceCode: 'EVAL', quantity: 1, unitPrice: 1500 }, { serviceCode: 'ELECTRO', quantity: 1, unitPrice: 800 }] },
  { patientIndex: 5, doctorIndex: 0, visitIndex: 17, invoiceDate: daysAgo(12), subtotal: 2000, discountAmount: 200, taxAmount: 0, total: 1800, status: 'PartiallyPaid', nextVisitDate: formatDate(today), nextVisitTime: '14:00', items: [{ serviceCode: 'EVAL', quantity: 1, unitPrice: 1500 }, { serviceCode: 'TAPING', quantity: 1, unitPrice: 500 }] },

  // Unpaid
  { patientIndex: 3, doctorIndex: 2, visitIndex: 11, invoiceDate: daysAgo(16), subtotal: 1500, discountAmount: 0, taxAmount: 0, total: 1500, status: 'Unpaid', nextVisitDate: formatDate(today), nextVisitTime: '10:00', items: [{ serviceCode: 'PT-SESSION', quantity: 1, unitPrice: 1000 }, { serviceCode: 'TAPING', quantity: 1, unitPrice: 500 }] },
  { patientIndex: 8, doctorIndex: 3, visitIndex: 19, invoiceDate: daysAgo(15), subtotal: 900, discountAmount: 0, taxAmount: 0, total: 900, status: 'Unpaid', nextVisitDate: daysFromNow(4), nextVisitTime: '10:00', items: [{ serviceCode: 'PT-SESSION', quantity: 1, unitPrice: 900 }] },
  { patientIndex: 0, doctorIndex: 0, visitIndex: 22, invoiceDate: formatDate(today), subtotal: 1000, discountAmount: 0, taxAmount: 0, total: 1000, status: 'Unpaid', nextVisitDate: null, nextVisitTime: null, items: [{ serviceCode: 'PT-SESSION', quantity: 1, unitPrice: 1000 }] },

  // Void
  { patientIndex: 7, doctorIndex: 0, invoiceDate: daysAgo(8), subtotal: 1500, discountAmount: 0, taxAmount: 0, total: 1500, status: 'Void', nextVisitDate: null, nextVisitTime: null, items: [{ serviceCode: 'EVAL', quantity: 1, unitPrice: 1500 }] }, // Cancelled visit
];

// ============================================
// PAYMENTS (10 payments)
// ============================================
export const seedPayments: Array<{
  invoiceIndex: number;
  paymentDate: string;
  amount: number;
  method: 'Cash' | 'Card' | 'BankTransfer';
  transactionID: string | null;
  notes: string | null;
}> = [
  { invoiceIndex: 0, paymentDate: daysAgo(28), amount: 1500, method: 'Cash', transactionID: null, notes: null },
  { invoiceIndex: 1, paymentDate: daysAgo(21), amount: 1000, method: 'Cash', transactionID: null, notes: null },
  { invoiceIndex: 2, paymentDate: daysAgo(14), amount: 1000, method: 'Card', transactionID: 'TXN-001234', notes: null },
  { invoiceIndex: 3, paymentDate: daysAgo(20), amount: 8500, method: 'BankTransfer', transactionID: 'BT-567890', notes: 'Package payment' },
  { invoiceIndex: 4, paymentDate: daysAgo(35), amount: 4500, method: 'Cash', transactionID: null, notes: 'Package payment' },
  { invoiceIndex: 5, paymentDate: daysAgo(30), amount: 1500, method: 'Cash', transactionID: null, notes: null },
  { invoiceIndex: 6, paymentDate: daysAgo(23), amount: 900, method: 'Cash', transactionID: null, notes: 'With discount' },
  { invoiceIndex: 7, paymentDate: daysAgo(22), amount: 1500, method: 'Card', transactionID: 'TXN-001235', notes: null },
  { invoiceIndex: 8, paymentDate: daysAgo(25), amount: 1500, method: 'Cash', transactionID: null, notes: 'Partial payment' },
  { invoiceIndex: 9, paymentDate: daysAgo(12), amount: 1000, method: 'Cash', transactionID: null, notes: 'Partial payment' },
];

// ============================================
// EXPENSES (8 expenses)
// ============================================
export const seedExpenses: Omit<Expense, 'expenseID' | 'createdAt'>[] = [
  { expenseDate: daysAgo(30), title: 'Monthly Rent', category: 'Rent', amount: 50000, paidTo: 'Building Owner', notes: null },
  { expenseDate: daysAgo(28), title: 'Electricity Bill', category: 'Utilities', amount: 8500, paidTo: 'LESCO', notes: 'July 2024' },
  { expenseDate: daysAgo(25), title: 'Exercise Bands', category: 'Supplies', amount: 3500, paidTo: 'Medical Supplies Co.', notes: 'Resistance bands for exercises' },
  { expenseDate: daysAgo(20), title: 'Staff Salary - Receptionist', category: 'Salary', amount: 30000, paidTo: 'Maria Qureshi', notes: 'July salary' },
  { expenseDate: daysAgo(15), title: 'Internet Bill', category: 'Utilities', amount: 2500, paidTo: 'PTCL', notes: null },
  { expenseDate: daysAgo(10), title: 'Ultrasound Gel', category: 'Supplies', amount: 1200, paidTo: 'Medical Supplies Co.', notes: '5 bottles' },
  { expenseDate: daysAgo(5), title: 'Water Dispenser Refill', category: 'Utilities', amount: 800, paidTo: 'Nestle', notes: '4 bottles' },
  { expenseDate: daysAgo(2), title: 'TENS Machine Repair', category: 'Equipment', amount: 5000, paidTo: 'PhysioTech Services', notes: 'Electrode replacement' },
];

// ============================================
// SUMMARY STATS (for verification)
// ============================================
export const seedDataSummary = {
  doctors: seedDoctors.length,
  patients: seedPatients.length,
  packages: seedPackages.length,
  patientPackages: seedPatientPackages.length,
  visits: seedVisits.length,
  invoices: seedInvoices.length,
  payments: seedPayments.length,
  expenses: seedExpenses.length,
  additionalServices: seedServices.length,
};
