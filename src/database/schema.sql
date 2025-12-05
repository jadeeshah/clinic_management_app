-- ============================================
-- Physical Therapy Clinic Management System
-- Database Schema v2.0
-- ============================================

-- Settings Table
CREATE TABLE IF NOT EXISTS Settings (
    settingsID INTEGER PRIMARY KEY DEFAULT 1,
    clinicName TEXT DEFAULT 'My Clinic',
    logoPath TEXT,
    address TEXT,
    phone TEXT,
    whatsApp TEXT,
    email TEXT,
    website TEXT,
    invoicePrefix TEXT DEFAULT 'INV',
    currency TEXT DEFAULT 'Rs',
    taxPercent REAL DEFAULT 0,
    defaultVisitDuration INTEGER DEFAULT 45,
    exportPath TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE IF NOT EXISTS Users (
    userID INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
    role TEXT CHECK(role IN ('Admin', 'User')) DEFAULT 'User',
    isActive INTEGER DEFAULT 1,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Doctors Table
CREATE TABLE IF NOT EXISTS Doctors (
    doctorID INTEGER PRIMARY KEY AUTOINCREMENT,
    firstName TEXT NOT NULL,
    lastName TEXT,
    education TEXT,
    designation TEXT,
    specialization TEXT,
    sessionCharge REAL DEFAULT 0,
    availableDays TEXT,
    startTime TEXT,
    endTime TEXT,
    phone TEXT,
    email TEXT,
    isActive INTEGER DEFAULT 1,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Patients Table
CREATE TABLE IF NOT EXISTS Patients (
    patientID INTEGER PRIMARY KEY AUTOINCREMENT,
    mrn TEXT UNIQUE,
    firstName TEXT NOT NULL,
    lastName TEXT,
    phone TEXT NOT NULL,
    whatsApp TEXT,
    email TEXT,
    dateOfBirth TEXT,
    sex TEXT CHECK(sex IN ('Male', 'Female', 'Other')),
    address TEXT,
    city TEXT,
    emergencyContactName TEXT,
    emergencyContactPhone TEXT,
    emergencyContactRelation TEXT,
    notes TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Services Lookup Table
CREATE TABLE IF NOT EXISTS Services (
    serviceID INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    defaultPrice REAL DEFAULT 0,
    category TEXT,
    isActive INTEGER DEFAULT 1
);

-- Packages Table
CREATE TABLE IF NOT EXISTS Packages (
    packageID INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    totalSessions INTEGER NOT NULL,
    price REAL NOT NULL,
    validityDays INTEGER DEFAULT 30,
    isActive INTEGER DEFAULT 1,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Patient Packages (purchased packages)
CREATE TABLE IF NOT EXISTS PatientPackages (
    patientPackageID INTEGER PRIMARY KEY AUTOINCREMENT,
    patientID INTEGER NOT NULL,
    packageID INTEGER NOT NULL,
    purchaseDate TEXT NOT NULL,
    expiryDate TEXT,
    sessionsUsed INTEGER DEFAULT 0,
    status TEXT CHECK(status IN ('Active', 'Expired', 'Completed')) DEFAULT 'Active',
    FOREIGN KEY (patientID) REFERENCES Patients(patientID) ON DELETE CASCADE,
    FOREIGN KEY (packageID) REFERENCES Packages(packageID)
);

-- Unified Visits Table (replaces separate Appointments + Visits)
CREATE TABLE IF NOT EXISTS Visits (
    visitID INTEGER PRIMARY KEY AUTOINCREMENT,
    patientID INTEGER NOT NULL,
    doctorID INTEGER NOT NULL,
    visitDate TEXT NOT NULL,
    startTime TEXT NOT NULL,
    endTime TEXT,
    duration INTEGER DEFAULT 45,
    status TEXT CHECK(status IN ('Scheduled', 'InProgress', 'Completed', 'Cancelled', 'NoShow')) DEFAULT 'Scheduled',
    visitType TEXT CHECK(visitType IN ('Evaluation', 'FollowUp', 'TherapySession')) DEFAULT 'TherapySession',
    sessionIndex INTEGER,
    notes TEXT,
    patientPackageID INTEGER,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patientID) REFERENCES Patients(patientID) ON DELETE CASCADE,
    FOREIGN KEY (doctorID) REFERENCES Doctors(doctorID),
    FOREIGN KEY (patientPackageID) REFERENCES PatientPackages(patientPackageID)
);

-- File Attachments Table
CREATE TABLE IF NOT EXISTS Attachments (
    attachmentID INTEGER PRIMARY KEY AUTOINCREMENT,
    entityType TEXT CHECK(entityType IN ('Patient', 'Visit')) NOT NULL,
    entityID INTEGER NOT NULL,
    fileName TEXT NOT NULL,
    filePath TEXT NOT NULL,
    fileType TEXT,
    fileSize INTEGER,
    uploadedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS Invoices (
    invoiceID INTEGER PRIMARY KEY AUTOINCREMENT,
    invoiceNo TEXT UNIQUE,
    patientID INTEGER NOT NULL,
    doctorID INTEGER,
    visitID INTEGER,
    invoiceDate TEXT NOT NULL,
    subtotal REAL DEFAULT 0,
    discountAmount REAL DEFAULT 0,
    taxAmount REAL DEFAULT 0,
    total REAL DEFAULT 0,
    status TEXT CHECK(status IN ('Unpaid', 'PartiallyPaid', 'Paid', 'Void')) DEFAULT 'Unpaid',
    nextVisitDate TEXT,
    nextVisitTime TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patientID) REFERENCES Patients(patientID) ON DELETE CASCADE,
    FOREIGN KEY (doctorID) REFERENCES Doctors(doctorID),
    FOREIGN KEY (visitID) REFERENCES Visits(visitID)
);

-- Invoice Items Table
CREATE TABLE IF NOT EXISTS InvoiceItems (
    itemID INTEGER PRIMARY KEY AUTOINCREMENT,
    invoiceID INTEGER NOT NULL,
    serviceID INTEGER,
    description TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unitPrice REAL DEFAULT 0,
    lineTotal REAL DEFAULT 0,
    FOREIGN KEY (invoiceID) REFERENCES Invoices(invoiceID) ON DELETE CASCADE,
    FOREIGN KEY (serviceID) REFERENCES Services(serviceID)
);

-- Payments Table
CREATE TABLE IF NOT EXISTS Payments (
    paymentID INTEGER PRIMARY KEY AUTOINCREMENT,
    invoiceID INTEGER NOT NULL,
    paymentDate TEXT NOT NULL,
    amount REAL NOT NULL,
    method TEXT CHECK(method IN ('Cash', 'Card', 'BankTransfer')) DEFAULT 'Cash',
    transactionID TEXT,
    notes TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoiceID) REFERENCES Invoices(invoiceID) ON DELETE CASCADE
);

-- Expenses Table
CREATE TABLE IF NOT EXISTS Expenses (
    expenseID INTEGER PRIMARY KEY AUTOINCREMENT,
    expenseDate TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT CHECK(category IN ('Rent', 'Utilities', 'Supplies', 'Salary', 'Equipment', 'Other')) DEFAULT 'Other',
    amount REAL NOT NULL,
    paidTo TEXT,
    notes TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Audit Log Table
CREATE TABLE IF NOT EXISTS AuditLog (
    auditID INTEGER PRIMARY KEY AUTOINCREMENT,
    userID INTEGER,
    action TEXT NOT NULL,
    entityType TEXT,
    entityID INTEGER,
    details TEXT,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Indexes for Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_patients_phone ON Patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_mrn ON Patients(mrn);
CREATE INDEX IF NOT EXISTS idx_patients_name ON Patients(firstName, lastName);
CREATE INDEX IF NOT EXISTS idx_visits_date ON Visits(visitDate);
CREATE INDEX IF NOT EXISTS idx_visits_patient ON Visits(patientID);
CREATE INDEX IF NOT EXISTS idx_visits_doctor ON Visits(doctorID);
CREATE INDEX IF NOT EXISTS idx_visits_status ON Visits(status);
CREATE INDEX IF NOT EXISTS idx_invoices_patient ON Invoices(patientID);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON Invoices(invoiceDate);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON Invoices(status);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON Payments(invoiceID);
CREATE INDEX IF NOT EXISTS idx_attachments_entity ON Attachments(entityType, entityID);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON Expenses(expenseDate);

-- ============================================
-- Triggers for Auto-Update Timestamps
-- ============================================

CREATE TRIGGER IF NOT EXISTS update_settings_timestamp
AFTER UPDATE ON Settings
BEGIN
    UPDATE Settings SET updatedAt = CURRENT_TIMESTAMP WHERE settingsID = NEW.settingsID;
END;

CREATE TRIGGER IF NOT EXISTS update_doctors_timestamp
AFTER UPDATE ON Doctors
BEGIN
    UPDATE Doctors SET updatedAt = CURRENT_TIMESTAMP WHERE doctorID = NEW.doctorID;
END;

CREATE TRIGGER IF NOT EXISTS update_patients_timestamp
AFTER UPDATE ON Patients
BEGIN
    UPDATE Patients SET updatedAt = CURRENT_TIMESTAMP WHERE patientID = NEW.patientID;
END;

CREATE TRIGGER IF NOT EXISTS update_visits_timestamp
AFTER UPDATE ON Visits
BEGIN
    UPDATE Visits SET updatedAt = CURRENT_TIMESTAMP WHERE visitID = NEW.visitID;
END;

CREATE TRIGGER IF NOT EXISTS update_invoices_timestamp
AFTER UPDATE ON Invoices
BEGIN
    UPDATE Invoices SET updatedAt = CURRENT_TIMESTAMP WHERE invoiceID = NEW.invoiceID;
END;

-- ============================================
-- Default Data
-- ============================================

-- Insert default settings
INSERT OR IGNORE INTO Settings (settingsID, clinicName, currency, defaultVisitDuration)
VALUES (1, 'My Clinic', 'Rs', 45);

-- Insert default services
INSERT OR IGNORE INTO Services (code, name, defaultPrice, category) VALUES
    ('PT-SESSION', 'Physiotherapy Session', 1000, 'Therapy'),
    ('EVAL', 'Initial Evaluation', 1500, 'Assessment'),
    ('TAPING', 'Taping', 500, 'Treatment'),
    ('ELECTRO', 'Electrotherapy', 800, 'Treatment'),
    ('HEP', 'Home Exercise Program Setup', 500, 'Consultation');
