// ============================================
// Core Entity Types for Clinic Management System
// ============================================

// Settings
export interface Settings {
  settingsID: number;
  clinicName: string;
  logoPath: string | null;
  address: string | null;
  phone: string | null;
  whatsApp: string | null;
  email: string | null;
  website: string | null;
  invoicePrefix: string;
  currency: string;
  taxPercent: number;
  defaultVisitDuration: number;
  exportPath: string | null;
  dataPath: string; // Custom data storage path
  createdAt: string;
  updatedAt: string;
}

// Users
export interface User {
  userID: number;
  username: string;
  passwordHash?: string;
  role: 'Admin' | 'User';
  isActive: boolean;
  createdAt: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

// Doctors
export interface Doctor {
  doctorID: number;
  firstName: string;
  lastName: string | null;
  education: string | null;
  designation: string | null;
  specialization: string | null;
  sessionCharge: number;
  availableDays: string[]; // JSON array of days
  startTime: string | null;
  endTime: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Patients
export interface Patient {
  patientID: number;
  mrn: string;
  firstName: string;
  lastName: string | null;
  phone: string; // Primary search field
  whatsApp: string | null;
  email: string | null;
  dateOfBirth: string | null;
  sex: 'Male' | 'Female' | 'Other' | null;
  address: string | null;
  city: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelation: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// Services (lookup table)
export interface Service {
  serviceID: number;
  code: string;
  name: string;
  defaultPrice: number;
  category: string | null;
  isActive: boolean;
}

// Packages
export interface Package {
  packageID: number;
  name: string;
  totalSessions: number;
  price: number;
  validityDays: number;
  isActive: boolean;
  createdAt: string;
}

// Patient Packages (purchased)
export interface PatientPackage {
  patientPackageID: number;
  patientID: number;
  packageID: number;
  purchaseDate: string;
  expiryDate: string | null;
  sessionsUsed: number;
  status: 'Active' | 'Expired' | 'Completed';
  // Joined fields
  packageName?: string;
  totalSessions?: number;
}

// Unified Visits (replaces Appointments + Visits)
export type VisitStatus = 'Scheduled' | 'InProgress' | 'Completed' | 'Cancelled' | 'NoShow';
export type VisitType = 'Evaluation' | 'FollowUp' | 'TherapySession';

export interface Visit {
  visitID: number;
  patientID: number;
  doctorID: number;
  visitDate: string;
  startTime: string;
  endTime: string | null;
  duration: number;
  status: VisitStatus;
  visitType: VisitType;
  sessionIndex: number | null;
  notes: string | null;
  patientPackageID: number | null;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  patientName?: string;
  patientPhone?: string;
  doctorName?: string;
}

// File Attachments
export type AttachmentEntityType = 'Patient' | 'Visit';

export interface Attachment {
  attachmentID: number;
  entityType: AttachmentEntityType;
  entityID: number;
  fileName: string;
  filePath: string;
  fileType: string | null;
  fileSize: number | null;
  uploadedAt: string;
}

// Invoices
export type InvoiceStatus = 'Unpaid' | 'PartiallyPaid' | 'Paid' | 'Void';

export interface Invoice {
  invoiceID: number;
  invoiceNo: string;
  patientID: number;
  doctorID: number | null;
  visitID: number | null;
  invoiceDate: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  status: InvoiceStatus;
  nextVisitDate: string | null;
  nextVisitTime: string | null;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  patientName?: string;
  doctorName?: string;
  paidAmount?: number;
}

// Invoice Items
export interface InvoiceItem {
  itemID: number;
  invoiceID: number;
  serviceID: number | null;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

// Payments
export type PaymentMethod = 'Cash' | 'Card' | 'BankTransfer';

export interface Payment {
  paymentID: number;
  invoiceID: number;
  paymentDate: string;
  amount: number;
  method: PaymentMethod;
  transactionID: string | null;
  notes: string | null;
  createdAt: string;
}

// Expenses
export type ExpenseCategory = 'Rent' | 'Utilities' | 'Supplies' | 'Salary' | 'Equipment' | 'Other';

export interface Expense {
  expenseID: number;
  expenseDate: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  paidTo: string | null;
  notes: string | null;
  createdAt: string;
}

// Audit Log
export type AuditAction = 'Create' | 'Update' | 'Delete' | 'Export' | 'Login' | 'Logout';

export interface AuditLog {
  auditID: number;
  userID: number | null;
  action: AuditAction;
  entityType: string | null;
  entityID: number | null;
  details: string | null;
  timestamp: string;
}

// ============================================
// API Types for IPC Communication
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SearchParams {
  query: string;
  limit?: number;
  offset?: number;
}

// Dashboard Stats
export interface DashboardStats {
  todayVisits: number;
  scheduledVisits: number;
  completedVisits: number;
  monthRevenue: number;
  outstandingBalance: number;
  todaySchedule: Visit[];
}

// ============================================
// Electron API Types (declared in preload.ts)
// ============================================
// Note: The actual ElectronAPI interface and global Window declaration
// are in src/main/preload.ts to avoid duplicate declarations
