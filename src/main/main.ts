import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import Database from 'better-sqlite3';
import * as bcrypt from 'bcryptjs';
import { seedDatabase, hasDemoData, getDataSummary } from '../database/seed';
import {
  validateOrThrow,
  loginSchema,
  createPatientSchema,
  updatePatientSchema,
  createDoctorSchema,
  updateDoctorSchema,
  createVisitSchema,
  updateVisitSchema,
  updateVisitStatusSchema,
  createInvoiceSchema,
  createPaymentSchema,
  createServiceSchema,
  updateServiceSchema,
  createPackageSchema,
  updatePackageSchema,
  createExpenseSchema,
} from '../shared/validation';

// Check if running in development
const isDev = !app.isPackaged;

// Configuration storage path (Windows registry alternative)
const configPath = path.join(app.getPath('userData'), 'config.json');

interface AppConfig {
  dataPath: string;
  isSetupComplete: boolean;
}

class ClinicApp {
  private mainWindow: BrowserWindow | null = null;
  private db: Database.Database | null = null;
  private config: AppConfig | null = null;

  constructor() {
    this.setupApp();
  }

  private setupApp(): void {
    app.whenReady().then(() => {
      this.loadConfig();
      this.createWindow();
      this.setupIPC();

      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          this.createWindow();
        }
      });
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        this.closeDatabase();
        app.quit();
      }
    });
  }

  private loadConfig(): void {
    try {
      if (fs.existsSync(configPath)) {
        const data = fs.readFileSync(configPath, 'utf-8');
        this.config = JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  }

  private saveConfig(): void {
    try {
      fs.writeFileSync(configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Error saving config:', error);
    }
  }

  private createWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1200,
      minHeight: 800,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      }
    });

    // Load the app
    if (isDev) {
      this.mainWindow.loadURL('http://localhost:3001');
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '..', '..', 'dist', 'index.html'));
    }

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  private initDatabase(): boolean {
    if (!this.config?.dataPath) {
      return false;
    }

    try {
      const dbPath = path.join(this.config.dataPath, 'database', 'clinic.db');

      // Ensure directory exists
      const dbDir = path.dirname(dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      this.db = new Database(dbPath);
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('foreign_keys = ON');

      // Check if tables exist, if not create schema
      const tableCheck = this.db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='Settings'"
      ).get();

      if (!tableCheck) {
        this.createSchema();
      }

      // Auto backup on startup
      this.autoBackup();

      return true;
    } catch (error) {
      console.error('Database initialization error:', error);
      return false;
    }
  }

  private createSchema(): void {
    if (!this.db) return;

    const schemaPath = isDev
      ? path.join(__dirname, '..', '..', 'src', 'database', 'schema.sql')
      : path.join(__dirname, '..', 'database', 'schema.sql');

    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf-8');
      this.db.exec(schema);
    } else {
      // Inline minimal schema if file not found
      this.createInlineSchema();
    }

    // Create default admin user
    this.createDefaultAdmin();
  }

  private createInlineSchema(): void {
    if (!this.db) return;

    this.db.exec(`
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

      CREATE TABLE IF NOT EXISTS Users (
        userID INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        passwordHash TEXT NOT NULL,
        role TEXT CHECK(role IN ('Admin', 'User')) DEFAULT 'User',
        isActive INTEGER DEFAULT 1,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      );

      INSERT OR IGNORE INTO Settings (settingsID) VALUES (1);
    `);
  }

  private createDefaultAdmin(): void {
    if (!this.db) return;

    const existingAdmin = this.db.prepare(
      "SELECT userID FROM Users WHERE username = 'admin'"
    ).get();

    if (!existingAdmin) {
      const passwordHash = bcrypt.hashSync('admin123', 10);
      this.db.prepare(
        "INSERT INTO Users (username, passwordHash, role) VALUES (?, ?, 'Admin')"
      ).run('admin', passwordHash);
    }
  }

  private autoBackup(): void {
    if (!this.db || !this.config?.dataPath) return;

    const backupDir = path.join(this.config.dataPath, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const today = new Date().toISOString().split('T')[0];
    const todayBackup = path.join(backupDir, `clinic_${today}.db`);

    // Only backup if today's backup doesn't exist
    if (!fs.existsSync(todayBackup)) {
      try {
        this.db.backup(todayBackup);
        console.log('Auto backup created:', todayBackup);
        this.cleanOldBackups(backupDir);
      } catch (error) {
        console.error('Auto backup failed:', error);
      }
    }
  }

  private cleanOldBackups(backupDir: string): void {
    try {
      const files = fs.readdirSync(backupDir)
        .filter(f => f.startsWith('clinic_') && f.endsWith('.db'))
        .map(f => ({
          name: f,
          path: path.join(backupDir, f),
          time: fs.statSync(path.join(backupDir, f)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time);

      // Keep only last 7 backups
      if (files.length > 7) {
        files.slice(7).forEach(f => {
          fs.unlinkSync(f.path);
          console.log('Deleted old backup:', f.name);
        });
      }
    } catch (error) {
      console.error('Error cleaning backups:', error);
    }
  }

  private closeDatabase(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  private setupIPC(): void {
    // Setup wizard - select data folder
    ipcMain.handle('setup:select-folder', async () => {
      const result = await dialog.showOpenDialog(this.mainWindow!, {
        properties: ['openDirectory', 'createDirectory'],
        title: 'Select Data Storage Location'
      });

      if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0];
      }
      return null;
    });

    // Complete setup
    ipcMain.handle('setup:complete', async (_, dataPath: string) => {
      try {
        // Create directory structure
        const dirs = ['database', 'patients', 'visits', 'exports', 'backups'];
        for (const dir of dirs) {
          const dirPath = path.join(dataPath, dir);
          if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
          }
        }

        // Save config
        this.config = { dataPath, isSetupComplete: true };
        this.saveConfig();

        // Initialize database
        const success = this.initDatabase();
        return { success, error: success ? undefined : 'Failed to initialize database' };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Check if setup is complete
    ipcMain.handle('setup:check', () => {
      if (this.config?.isSetupComplete && this.config?.dataPath) {
        const success = this.initDatabase();
        return { isComplete: success, dataPath: this.config.dataPath };
      }
      return { isComplete: false };
    });

    // Database operations
    ipcMain.handle('db:execute', async (_, operation: string, data?: unknown) => {
      if (!this.db) {
        return { success: false, error: 'Database not initialized' };
      }

      try {
        const result = await this.handleDatabaseOperation(operation, data);
        return { success: true, data: result };
      } catch (error) {
        console.error(`Database operation ${operation} failed:`, error);
        return { success: false, error: (error as Error).message };
      }
    });

    // File operations
    ipcMain.handle('file:save', async (_, entityType: string, entityID: number, sourcePath: string) => {
      if (!this.config?.dataPath) {
        return { success: false, error: 'Data path not configured' };
      }

      try {
        const destDir = path.join(this.config.dataPath, entityType.toLowerCase() + 's', entityID.toString());
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }

        const fileName = path.basename(sourcePath);
        const destPath = path.join(destDir, `${Date.now()}_${fileName}`);
        fs.copyFileSync(sourcePath, destPath);

        return { success: true, data: { filePath: destPath, fileName } };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    ipcMain.handle('file:open', async (_, filePath: string) => {
      await shell.openPath(filePath);
    });

    ipcMain.handle('file:select', async () => {
      const result = await dialog.showOpenDialog(this.mainWindow!, {
        properties: ['openFile', 'multiSelections']
      });

      if (!result.canceled) {
        return result.filePaths;
      }
      return [];
    });

    // Logo file operations
    ipcMain.handle('file:select-image', async () => {
      const result = await dialog.showOpenDialog(this.mainWindow!, {
        properties: ['openFile'],
        filters: [
          { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'] }
        ],
        title: 'Select Clinic Logo'
      });

      if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0];
      }
      return null;
    });

    ipcMain.handle('file:save-logo', async (_, sourcePath: string) => {
      if (!this.config?.dataPath) {
        return { success: false, error: 'Data path not configured' };
      }

      try {
        const ext = path.extname(sourcePath);
        const destPath = path.join(this.config.dataPath, `clinic_logo${ext}`);
        fs.copyFileSync(sourcePath, destPath);
        return { success: true, data: { filePath: destPath } };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    ipcMain.handle('file:read-logo-base64', async (_, logoPath: string) => {
      try {
        if (!logoPath || !fs.existsSync(logoPath)) {
          return { success: false, error: 'Logo file not found' };
        }
        const buffer = fs.readFileSync(logoPath);
        const base64 = buffer.toString('base64');
        const ext = path.extname(logoPath).toLowerCase().replace('.', '');
        const mimeType = ext === 'jpg' ? 'jpeg' : ext;
        return { success: true, data: `data:image/${mimeType};base64,${base64}` };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Backup operations
    ipcMain.handle('backup:create', async () => {
      if (!this.db || !this.config?.dataPath) {
        return { success: false, error: 'Database not initialized' };
      }

      try {
        const backupDir = path.join(this.config.dataPath, 'backups');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(backupDir, `clinic_${timestamp}.db`);

        await this.db.backup(backupPath);
        return { success: true, data: backupPath };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    ipcMain.handle('backup:list', async () => {
      if (!this.config?.dataPath) {
        return { success: false, error: 'Data path not configured' };
      }

      try {
        const backupDir = path.join(this.config.dataPath, 'backups');
        if (!fs.existsSync(backupDir)) {
          return { success: true, data: [] };
        }

        const files = fs.readdirSync(backupDir)
          .filter(f => f.endsWith('.db'))
          .map(f => path.join(backupDir, f))
          .sort((a, b) => fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime());

        return { success: true, data: files };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // System
    ipcMain.handle('system:version', () => app.getVersion());
    ipcMain.handle('system:data-path', () => this.config?.dataPath || '');
    ipcMain.handle('system:open-external', async (_, url: string) => {
      await shell.openExternal(url);
    });

    // Demo data / Seeding
    ipcMain.handle('seed:load-demo-data', async (_, clearExisting?: boolean) => {
      if (!this.db) {
        return { success: false, error: 'Database not initialized' };
      }

      try {
        const result = seedDatabase(this.db, { clearExisting: clearExisting ?? true });
        return result;
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    ipcMain.handle('seed:has-demo-data', () => {
      if (!this.db) {
        return false;
      }
      return hasDemoData(this.db);
    });

    ipcMain.handle('seed:get-summary', () => {
      if (!this.db) {
        return null;
      }
      return getDataSummary(this.db);
    });
  }

  private handleDatabaseOperation(operation: string, data: unknown): unknown {
    if (!this.db) throw new Error('Database not initialized');

    switch (operation) {
      // Auth
      case 'validate-user': {
        const validated = validateOrThrow(loginSchema, data);
        const { username, password } = validated;
        const user = this.db.prepare(
          'SELECT * FROM Users WHERE username = ? AND isActive = 1'
        ).get(username) as { passwordHash: string; userID: number; role: string } | undefined;

        if (user && bcrypt.compareSync(password, user.passwordHash)) {
          const { passwordHash, ...safeUser } = user;
          return safeUser;
        }
        return null;
      }

      // Settings
      case 'get-settings': {
        return this.db.prepare('SELECT * FROM Settings WHERE settingsID = 1').get();
      }

      case 'update-settings': {
        const settings = data as Record<string, unknown>;
        const fields = Object.keys(settings).filter(k => k !== 'settingsID');
        const setClause = fields.map(f => `${f} = ?`).join(', ');
        const values = fields.map(f => settings[f]);

        this.db.prepare(`UPDATE Settings SET ${setClause}, updatedAt = CURRENT_TIMESTAMP WHERE settingsID = 1`)
          .run(...values);
        return true;
      }

      // Doctors
      case 'get-doctors': {
        return this.db.prepare('SELECT * FROM Doctors WHERE isActive = 1 ORDER BY firstName').all();
      }

      case 'get-doctor': {
        const { doctorID } = data as { doctorID: number };
        return this.db.prepare('SELECT * FROM Doctors WHERE doctorID = ?').get(doctorID);
      }

      case 'create-doctor': {
        const doctor = validateOrThrow(createDoctorSchema, data);
        const stmt = this.db.prepare(`
          INSERT INTO Doctors (firstName, lastName, education, designation, specialization,
            sessionCharge, availableDays, startTime, endTime, phone, email)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(
          doctor.firstName, doctor.lastName ?? null, doctor.education ?? null, doctor.designation ?? null,
          doctor.specialization ?? null, doctor.sessionCharge ?? null,
          JSON.stringify(doctor.availableDays ?? []),
          doctor.startTime ?? null, doctor.endTime ?? null, doctor.phone ?? null, doctor.email ?? null
        );
        return { doctorID: result.lastInsertRowid };
      }

      // Patients
      case 'get-patients': {
        const { limit = 100, offset = 0 } = (data as { limit?: number; offset?: number }) || {};
        const patients = this.db.prepare(
          'SELECT * FROM Patients ORDER BY createdAt DESC LIMIT ? OFFSET ?'
        ).all(limit, offset);
        const total = (this.db.prepare('SELECT COUNT(*) as count FROM Patients').get() as { count: number }).count;
        return { items: patients, total };
      }

      case 'search-patients': {
        const { query, limit = 20 } = data as { query: string; limit?: number };
        // Search by phone (primary), name, or MRN
        return this.db.prepare(`
          SELECT * FROM Patients
          WHERE phone LIKE ? OR whatsApp LIKE ? OR firstName LIKE ? OR lastName LIKE ? OR mrn LIKE ?
          ORDER BY
            CASE WHEN phone LIKE ? THEN 0 ELSE 1 END,
            firstName
          LIMIT ?
        `).all(
          `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`,
          `${query}%`,
          limit
        );
      }

      case 'get-patient': {
        const { patientID } = data as { patientID: number };
        return this.db.prepare('SELECT * FROM Patients WHERE patientID = ?').get(patientID);
      }

      case 'create-patient': {
        const patient = validateOrThrow(createPatientSchema, data);
        // Generate MRN
        const year = new Date().getFullYear();
        const countResult = this.db.prepare(
          "SELECT COUNT(*) as count FROM Patients WHERE mrn LIKE ?"
        ).get(`CLN-${year}-%`) as { count: number };
        const mrn = `CLN-${year}-${String(countResult.count + 1).padStart(4, '0')}`;

        const stmt = this.db.prepare(`
          INSERT INTO Patients (mrn, firstName, lastName, phone, whatsApp, email,
            dateOfBirth, sex, address, city, emergencyContactName,
            emergencyContactPhone, emergencyContactRelation, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(
          mrn, patient.firstName, patient.lastName ?? null, patient.phone,
          patient.whatsApp ?? null, patient.email ?? null, patient.dateOfBirth ?? null, patient.sex ?? null,
          patient.address ?? null, patient.city ?? null, patient.emergencyContactName ?? null,
          patient.emergencyContactPhone ?? null, patient.emergencyContactRelation ?? null, patient.notes ?? null
        );
        return { patientID: result.lastInsertRowid, mrn };
      }

      // Visits
      case 'get-visits-by-date': {
        const { date } = data as { date: string };
        return this.db.prepare(`
          SELECT v.*,
            p.firstName || ' ' || COALESCE(p.lastName, '') as patientName,
            p.phone as patientPhone,
            d.firstName || ' ' || COALESCE(d.lastName, '') as doctorName
          FROM Visits v
          JOIN Patients p ON v.patientID = p.patientID
          JOIN Doctors d ON v.doctorID = d.doctorID
          WHERE v.visitDate = ?
          ORDER BY v.startTime
        `).all(date);
      }

      case 'get-patient-visits': {
        const { patientID } = data as { patientID: number };
        return this.db.prepare(`
          SELECT v.*,
            d.firstName || ' ' || COALESCE(d.lastName, '') as doctorName
          FROM Visits v
          JOIN Doctors d ON v.doctorID = d.doctorID
          WHERE v.patientID = ?
          ORDER BY v.visitDate DESC, v.startTime DESC
        `).all(patientID);
      }

      case 'get-doctor-visits': {
        const { doctorID } = data as { doctorID: number };
        return this.db.prepare(`
          SELECT v.*,
            p.firstName || ' ' || COALESCE(p.lastName, '') as patientName,
            p.phone as patientPhone
          FROM Visits v
          JOIN Patients p ON v.patientID = p.patientID
          WHERE v.doctorID = ?
          ORDER BY v.visitDate DESC, v.startTime DESC
        `).all(doctorID);
      }

      case 'create-visit': {
        const visit = validateOrThrow(createVisitSchema, data);
        // Get session index for this patient
        const sessionCount = this.db.prepare(
          "SELECT COUNT(*) as count FROM Visits WHERE patientID = ? AND status = 'Completed'"
        ).get(visit.patientID) as { count: number };

        const stmt = this.db.prepare(`
          INSERT INTO Visits (patientID, doctorID, visitDate, startTime, endTime,
            duration, status, visitType, sessionIndex, notes, patientPackageID)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(
          visit.patientID, visit.doctorID, visit.visitDate, visit.startTime,
          visit.endTime ?? null, visit.duration ?? 45, visit.status ?? 'Scheduled',
          visit.visitType ?? 'TherapySession', sessionCount.count + 1,
          visit.notes ?? null, visit.patientPackageID ?? null
        );
        return { visitID: result.lastInsertRowid };
      }

      case 'update-visit-status': {
        const validated = validateOrThrow(updateVisitStatusSchema, data);
        this.db.prepare(
          'UPDATE Visits SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE visitID = ?'
        ).run(validated.status, validated.visitID);
        return true;
      }

      // Update Patient
      case 'update-patient': {
        const patient = validateOrThrow(updatePatientSchema, data);
        const stmt = this.db.prepare(`
          UPDATE Patients SET
            firstName = ?, lastName = ?, phone = ?, whatsApp = ?, email = ?,
            dateOfBirth = ?, sex = ?, address = ?, city = ?,
            emergencyContactName = ?, emergencyContactPhone = ?, emergencyContactRelation = ?,
            notes = ?, updatedAt = CURRENT_TIMESTAMP
          WHERE patientID = ?
        `);
        stmt.run(
          patient.firstName, patient.lastName ?? null, patient.phone, patient.whatsApp ?? null, patient.email ?? null,
          patient.dateOfBirth ?? null, patient.sex ?? null, patient.address ?? null, patient.city ?? null,
          patient.emergencyContactName ?? null, patient.emergencyContactPhone ?? null, patient.emergencyContactRelation ?? null,
          patient.notes ?? null, patient.patientID
        );
        return { success: true };
      }

      // Get all visits with optional filters
      case 'get-visits': {
        const { startDate, endDate, status, doctorID, limit = 100, offset = 0 } =
          (data as { startDate?: string; endDate?: string; status?: string; doctorID?: number; limit?: number; offset?: number }) || {};

        let query = `
          SELECT v.*,
            p.firstName || ' ' || COALESCE(p.lastName, '') as patientName,
            p.phone as patientPhone,
            p.mrn as patientMRN,
            d.firstName || ' ' || COALESCE(d.lastName, '') as doctorName
          FROM Visits v
          JOIN Patients p ON v.patientID = p.patientID
          JOIN Doctors d ON v.doctorID = d.doctorID
          WHERE 1=1
        `;
        const params: (string | number)[] = [];

        if (startDate) {
          query += ' AND v.visitDate >= ?';
          params.push(startDate);
        }
        if (endDate) {
          query += ' AND v.visitDate <= ?';
          params.push(endDate);
        }
        if (status) {
          query += ' AND v.status = ?';
          params.push(status);
        }
        if (doctorID) {
          query += ' AND v.doctorID = ?';
          params.push(doctorID);
        }

        query += ' ORDER BY v.visitDate DESC, v.startTime DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const visits = this.db.prepare(query).all(...params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) as count FROM Visits v WHERE 1=1';
        const countParams: (string | number)[] = [];
        if (startDate) { countQuery += ' AND v.visitDate >= ?'; countParams.push(startDate); }
        if (endDate) { countQuery += ' AND v.visitDate <= ?'; countParams.push(endDate); }
        if (status) { countQuery += ' AND v.status = ?'; countParams.push(status); }
        if (doctorID) { countQuery += ' AND v.doctorID = ?'; countParams.push(doctorID); }

        const total = (this.db.prepare(countQuery).get(...countParams) as { count: number }).count;
        return { items: visits, total };
      }

      // Get single visit
      case 'get-visit': {
        const { visitID } = data as { visitID: number };
        return this.db.prepare(`
          SELECT v.*,
            p.firstName || ' ' || COALESCE(p.lastName, '') as patientName,
            p.phone as patientPhone,
            p.mrn as patientMRN,
            d.firstName || ' ' || COALESCE(d.lastName, '') as doctorName
          FROM Visits v
          JOIN Patients p ON v.patientID = p.patientID
          JOIN Doctors d ON v.doctorID = d.doctorID
          WHERE v.visitID = ?
        `).get(visitID);
      }

      // Update visit
      case 'update-visit': {
        const visit = validateOrThrow(updateVisitSchema, data);
        const stmt = this.db.prepare(`
          UPDATE Visits SET
            doctorID = ?, visitDate = ?, startTime = ?, endTime = ?,
            duration = ?, status = ?, visitType = ?, notes = ?,
            updatedAt = CURRENT_TIMESTAMP
          WHERE visitID = ?
        `);
        stmt.run(
          visit.doctorID, visit.visitDate, visit.startTime, visit.endTime ?? null,
          visit.duration ?? 45, visit.status, visit.visitType, visit.notes ?? null,
          visit.visitID
        );
        return { success: true };
      }

      // Services
      case 'get-services': {
        return this.db.prepare('SELECT * FROM Services WHERE isActive = 1 ORDER BY name').all();
      }

      // Invoices
      case 'get-invoices': {
        const { patientID, status, limit = 100, offset = 0 } =
          (data as { patientID?: number; status?: string; limit?: number; offset?: number }) || {};

        let query = `
          SELECT i.*,
            p.firstName || ' ' || COALESCE(p.lastName, '') as patientName,
            d.firstName || ' ' || COALESCE(d.lastName, '') as doctorName,
            COALESCE((SELECT SUM(amount) FROM Payments WHERE invoiceID = i.invoiceID), 0) as paidAmount
          FROM Invoices i
          JOIN Patients p ON i.patientID = p.patientID
          LEFT JOIN Doctors d ON i.doctorID = d.doctorID
          WHERE 1=1
        `;
        const params: (string | number)[] = [];

        if (patientID) {
          query += ' AND i.patientID = ?';
          params.push(patientID);
        }
        if (status) {
          query += ' AND i.status = ?';
          params.push(status);
        }

        query += ' ORDER BY i.invoiceDate DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        return this.db.prepare(query).all(...params);
      }

      case 'get-patient-invoices': {
        const { patientID } = data as { patientID: number };
        return this.db.prepare(`
          SELECT i.*,
            d.firstName || ' ' || COALESCE(d.lastName, '') as doctorName,
            COALESCE((SELECT SUM(amount) FROM Payments WHERE invoiceID = i.invoiceID), 0) as paidAmount
          FROM Invoices i
          LEFT JOIN Doctors d ON i.doctorID = d.doctorID
          WHERE i.patientID = ?
          ORDER BY i.invoiceDate DESC
        `).all(patientID);
      }

      case 'get-invoice': {
        const { invoiceID } = data as { invoiceID: number };
        const invoice = this.db.prepare(`
          SELECT i.*,
            p.firstName || ' ' || COALESCE(p.lastName, '') as patientName,
            p.phone as patientPhone,
            p.mrn as patientMRN,
            d.firstName || ' ' || COALESCE(d.lastName, '') as doctorName
          FROM Invoices i
          JOIN Patients p ON i.patientID = p.patientID
          LEFT JOIN Doctors d ON i.doctorID = d.doctorID
          WHERE i.invoiceID = ?
        `).get(invoiceID) as Record<string, unknown> | undefined;

        if (!invoice) {
          return null;
        }

        const items = this.db.prepare(`
          SELECT ii.*, s.name as serviceName
          FROM InvoiceItems ii
          LEFT JOIN Services s ON ii.serviceID = s.serviceID
          WHERE ii.invoiceID = ?
        `).all(invoiceID);

        const payments = this.db.prepare(`
          SELECT * FROM Payments WHERE invoiceID = ? ORDER BY paymentDate DESC
        `).all(invoiceID);

        return { ...invoice, items, payments };
      }

      case 'create-invoice': {
        const invoice = validateOrThrow(createInvoiceSchema, data);

        // Generate invoice number
        const year = new Date().getFullYear();
        const settings = this.db.prepare('SELECT invoicePrefix FROM Settings WHERE settingsID = 1').get() as { invoicePrefix: string };
        const prefix = settings?.invoicePrefix || 'INV';
        const countResult = this.db.prepare(
          "SELECT COUNT(*) as count FROM Invoices WHERE invoiceNo LIKE ?"
        ).get(`${prefix}-${year}-%`) as { count: number };
        const invoiceNo = `${prefix}-${year}-${String(countResult.count + 1).padStart(4, '0')}`;

        // Calculate totals
        const subtotal = invoice.items.reduce((sum, item) => sum + (item.lineTotal || 0), 0);
        const discountAmount = invoice.discountAmount ?? 0;
        const taxAmount = invoice.taxAmount ?? 0;
        const total = subtotal - discountAmount + taxAmount;

        // Insert invoice
        const stmt = this.db.prepare(`
          INSERT INTO Invoices (invoiceNo, patientID, doctorID, visitID, invoiceDate,
            subtotal, discountAmount, taxAmount, total, status, nextVisitDate, nextVisitTime)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Unpaid', ?, ?)
        `);
        const result = stmt.run(
          invoiceNo, invoice.patientID, invoice.doctorID ?? null, invoice.visitID ?? null,
          invoice.invoiceDate, subtotal, discountAmount, taxAmount, total,
          invoice.nextVisitDate ?? null, invoice.nextVisitTime ?? null
        );

        const invoiceID = result.lastInsertRowid;

        // Insert items
        const itemStmt = this.db.prepare(`
          INSERT INTO InvoiceItems (invoiceID, serviceID, description, quantity, unitPrice, lineTotal)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        for (const item of invoice.items) {
          itemStmt.run(
            invoiceID, item.serviceID ?? null, item.description,
            item.quantity ?? 1, item.unitPrice ?? 0, item.lineTotal ?? 0
          );
        }

        return { invoiceID, invoiceNo };
      }

      case 'create-payment': {
        const payment = validateOrThrow(createPaymentSchema, data);

        // Insert payment
        const stmt = this.db.prepare(`
          INSERT INTO Payments (invoiceID, paymentDate, amount, method, transactionID, notes)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(
          payment.invoiceID, payment.paymentDate, payment.amount,
          payment.method ?? 'Cash', payment.transactionID ?? null, payment.notes ?? null
        );

        // Update invoice status
        const invoiceData = this.db.prepare('SELECT total FROM Invoices WHERE invoiceID = ?').get(payment.invoiceID) as { total: number };
        const totalPaid = (this.db.prepare('SELECT SUM(amount) as total FROM Payments WHERE invoiceID = ?').get(payment.invoiceID) as { total: number }).total;

        let newStatus = 'PartiallyPaid';
        if (totalPaid >= invoiceData.total) {
          newStatus = 'Paid';
        }

        this.db.prepare('UPDATE Invoices SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE invoiceID = ?')
          .run(newStatus, payment.invoiceID);

        return { paymentID: result.lastInsertRowid };
      }

      // Update Doctor
      case 'update-doctor': {
        const doctor = validateOrThrow(updateDoctorSchema, data);
        const stmt = this.db.prepare(`
          UPDATE Doctors SET
            firstName = ?, lastName = ?, education = ?, designation = ?,
            specialization = ?, sessionCharge = ?, availableDays = ?,
            startTime = ?, endTime = ?, phone = ?, email = ?,
            updatedAt = CURRENT_TIMESTAMP
          WHERE doctorID = ?
        `);
        stmt.run(
          doctor.firstName, doctor.lastName ?? null, doctor.education ?? null, doctor.designation ?? null,
          doctor.specialization ?? null, doctor.sessionCharge ?? null,
          JSON.stringify(doctor.availableDays ?? []),
          doctor.startTime ?? null, doctor.endTime ?? null, doctor.phone ?? null, doctor.email ?? null,
          doctor.doctorID
        );
        return { success: true };
      }

      // Deactivate Doctor
      case 'deactivate-doctor': {
        const { doctorID } = data as { doctorID: number };
        this.db.prepare('UPDATE Doctors SET isActive = 0, updatedAt = CURRENT_TIMESTAMP WHERE doctorID = ?')
          .run(doctorID);
        return { success: true };
      }

      // Services CRUD
      case 'create-service': {
        const service = validateOrThrow(createServiceSchema, data);
        const stmt = this.db.prepare(`
          INSERT INTO Services (code, name, defaultPrice, category)
          VALUES (?, ?, ?, ?)
        `);
        const result = stmt.run(
          service.code, service.name, service.defaultPrice ?? 0, service.category ?? null
        );
        return { serviceID: result.lastInsertRowid };
      }

      case 'update-service': {
        const service = validateOrThrow(updateServiceSchema, data);
        const stmt = this.db.prepare(`
          UPDATE Services SET code = ?, name = ?, defaultPrice = ?, category = ?
          WHERE serviceID = ?
        `);
        stmt.run(service.code, service.name, service.defaultPrice ?? 0, service.category ?? null, service.serviceID);
        return { success: true };
      }

      case 'deactivate-service': {
        const { serviceID } = data as { serviceID: number };
        this.db.prepare('UPDATE Services SET isActive = 0 WHERE serviceID = ?').run(serviceID);
        return { success: true };
      }

      // Packages CRUD
      case 'get-packages': {
        return this.db.prepare('SELECT * FROM Packages WHERE isActive = 1 ORDER BY name').all();
      }

      case 'create-package': {
        const pkg = validateOrThrow(createPackageSchema, data);
        const stmt = this.db.prepare(`
          INSERT INTO Packages (name, totalSessions, price, validityDays)
          VALUES (?, ?, ?, ?)
        `);
        const result = stmt.run(pkg.name, pkg.totalSessions, pkg.price, pkg.validityDays ?? 30);
        return { packageID: result.lastInsertRowid };
      }

      case 'update-package': {
        const pkg = validateOrThrow(updatePackageSchema, data);
        const stmt = this.db.prepare(`
          UPDATE Packages SET name = ?, totalSessions = ?, price = ?, validityDays = ?
          WHERE packageID = ?
        `);
        stmt.run(pkg.name, pkg.totalSessions, pkg.price, pkg.validityDays ?? 30, pkg.packageID);
        return { success: true };
      }

      case 'deactivate-package': {
        const { packageID } = data as { packageID: number };
        this.db.prepare('UPDATE Packages SET isActive = 0 WHERE packageID = ?').run(packageID);
        return { success: true };
      }

      // Patient Packages
      case 'get-patient-packages': {
        const { patientID } = data as { patientID: number };
        return this.db.prepare(`
          SELECT pp.*, p.name as packageName, p.totalSessions
          FROM PatientPackages pp
          JOIN Packages p ON pp.packageID = p.packageID
          WHERE pp.patientID = ?
          ORDER BY pp.purchaseDate DESC
        `).all(patientID);
      }

      case 'create-patient-package': {
        const pp = data as Record<string, unknown>;
        // Calculate expiry date
        const pkg = this.db.prepare('SELECT validityDays FROM Packages WHERE packageID = ?')
          .get(pp.packageID) as { validityDays: number };
        const purchaseDate = new Date(pp.purchaseDate as string || new Date().toISOString().split('T')[0]);
        const expiryDate = new Date(purchaseDate);
        expiryDate.setDate(expiryDate.getDate() + (pkg?.validityDays || 30));

        const stmt = this.db.prepare(`
          INSERT INTO PatientPackages (patientID, packageID, purchaseDate, expiryDate, sessionsUsed, status)
          VALUES (?, ?, ?, ?, 0, 'Active')
        `);
        const result = stmt.run(
          pp.patientID, pp.packageID,
          purchaseDate.toISOString().split('T')[0],
          expiryDate.toISOString().split('T')[0]
        );
        return { patientPackageID: result.lastInsertRowid };
      }

      // Attachments
      case 'get-attachments': {
        const { entityType, entityID } = data as { entityType: string; entityID: number };
        return this.db.prepare(`
          SELECT * FROM Attachments WHERE entityType = ? AND entityID = ?
          ORDER BY uploadedAt DESC
        `).all(entityType, entityID);
      }

      case 'create-attachment': {
        const att = data as Record<string, unknown>;
        const stmt = this.db.prepare(`
          INSERT INTO Attachments (entityType, entityID, fileName, filePath, fileType, fileSize)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(
          att.entityType, att.entityID, att.fileName, att.filePath,
          att.fileType ?? null, att.fileSize ?? null
        );
        return { attachmentID: result.lastInsertRowid };
      }

      case 'delete-attachment': {
        const { attachmentID } = data as { attachmentID: number };
        this.db.prepare('DELETE FROM Attachments WHERE attachmentID = ?').run(attachmentID);
        return { success: true };
      }

      // Expenses
      case 'get-expenses': {
        const { startDate, endDate, category, limit = 100, offset = 0 } =
          (data as { startDate?: string; endDate?: string; category?: string; limit?: number; offset?: number }) || {};

        let query = 'SELECT * FROM Expenses WHERE 1=1';
        const params: (string | number)[] = [];

        if (startDate) {
          query += ' AND expenseDate >= ?';
          params.push(startDate);
        }
        if (endDate) {
          query += ' AND expenseDate <= ?';
          params.push(endDate);
        }
        if (category) {
          query += ' AND category = ?';
          params.push(category);
        }

        query += ' ORDER BY expenseDate DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        return this.db.prepare(query).all(...params);
      }

      case 'create-expense': {
        const expense = validateOrThrow(createExpenseSchema, data);
        const stmt = this.db.prepare(`
          INSERT INTO Expenses (expenseDate, title, category, amount, paidTo, notes)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(
          expense.expenseDate, expense.title, expense.category ?? 'Other',
          expense.amount, expense.paidTo ?? null, expense.notes ?? null
        );
        return { expenseID: result.lastInsertRowid };
      }

      case 'delete-expense': {
        const { expenseID } = data as { expenseID: number };
        this.db.prepare('DELETE FROM Expenses WHERE expenseID = ?').run(expenseID);
        return { success: true };
      }

      // Finance Reports
      case 'get-finance-summary': {
        const { startDate, endDate } = data as { startDate: string; endDate: string };

        const revenue = this.db.prepare(`
          SELECT COALESCE(SUM(amount), 0) as total FROM Payments
          WHERE paymentDate BETWEEN ? AND ?
        `).get(startDate, endDate) as { total: number };

        const expenses = this.db.prepare(`
          SELECT COALESCE(SUM(amount), 0) as total FROM Expenses
          WHERE expenseDate BETWEEN ? AND ?
        `).get(startDate, endDate) as { total: number };

        const invoiced = this.db.prepare(`
          SELECT COALESCE(SUM(total), 0) as total FROM Invoices
          WHERE invoiceDate BETWEEN ? AND ? AND status != 'Void'
        `).get(startDate, endDate) as { total: number };

        const outstanding = this.db.prepare(`
          SELECT COALESCE(SUM(i.total - COALESCE(p.paid, 0)), 0) as total
          FROM Invoices i
          LEFT JOIN (SELECT invoiceID, SUM(amount) as paid FROM Payments GROUP BY invoiceID) p
            ON i.invoiceID = p.invoiceID
          WHERE i.invoiceDate BETWEEN ? AND ? AND i.status NOT IN ('Paid', 'Void')
        `).get(startDate, endDate) as { total: number };

        const visitCount = this.db.prepare(`
          SELECT COUNT(*) as count FROM Visits
          WHERE visitDate BETWEEN ? AND ? AND status = 'Completed'
        `).get(startDate, endDate) as { count: number };

        const revenueByDay = this.db.prepare(`
          SELECT paymentDate as date, SUM(amount) as total
          FROM Payments
          WHERE paymentDate BETWEEN ? AND ?
          GROUP BY paymentDate
          ORDER BY paymentDate
        `).all(startDate, endDate);

        const expensesByCategory = this.db.prepare(`
          SELECT category, SUM(amount) as total
          FROM Expenses
          WHERE expenseDate BETWEEN ? AND ?
          GROUP BY category
          ORDER BY total DESC
        `).all(startDate, endDate);

        return {
          totalRevenue: revenue.total,
          totalExpenses: expenses.total,
          netIncome: revenue.total - expenses.total,
          totalInvoiced: invoiced.total,
          totalOutstanding: outstanding.total,
          completedVisits: visitCount.count,
          revenueByDay,
          expensesByCategory
        };
      }

      // Analytics - Revenue
      case 'get-revenue-analytics': {
        const { period } = data as { period: string };

        // Determine date range based on period
        const now = new Date();
        let startDate: string;

        switch (period) {
          case 'thisMonth':
            startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
            break;
          case 'lastMonth': {
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            startDate = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}-01`;
            break;
          }
          case 'last3Months': {
            const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
            startDate = `${threeMonthsAgo.getFullYear()}-${String(threeMonthsAgo.getMonth() + 1).padStart(2, '0')}-01`;
            break;
          }
          case 'last6Months': {
            const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
            startDate = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}-01`;
            break;
          }
          case 'thisYear':
            startDate = `${now.getFullYear()}-01-01`;
            break;
          default:
            startDate = `${now.getFullYear()}-01-01`;
        }

        const endDate = now.toISOString().split('T')[0];

        // Get revenue by month
        const revenueByMonth = this.db.prepare(`
          SELECT
            strftime('%Y-%m', paymentDate) as month,
            SUM(amount) as revenue
          FROM Payments
          WHERE paymentDate >= ? AND paymentDate <= ?
          GROUP BY strftime('%Y-%m', paymentDate)
          ORDER BY month
        `).all(startDate, endDate) as { month: string; revenue: number }[];

        // Get expenses by month
        const expensesByMonth = this.db.prepare(`
          SELECT
            strftime('%Y-%m', expenseDate) as month,
            SUM(amount) as expenses
          FROM Expenses
          WHERE expenseDate >= ? AND expenseDate <= ?
          GROUP BY strftime('%Y-%m', expenseDate)
          ORDER BY month
        `).all(startDate, endDate) as { month: string; expenses: number }[];

        // Combine into single result with month names
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthsMap = new Map<string, { revenue: number; expenses: number }>();

        revenueByMonth.forEach(r => {
          monthsMap.set(r.month, { revenue: r.revenue, expenses: 0 });
        });

        expensesByMonth.forEach(e => {
          const existing = monthsMap.get(e.month) || { revenue: 0, expenses: 0 };
          monthsMap.set(e.month, { ...existing, expenses: e.expenses });
        });

        const result = Array.from(monthsMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([yearMonth, data]) => {
            const [year, month] = yearMonth.split('-');
            return {
              month: `${monthNames[parseInt(month) - 1]} ${year}`,
              revenue: data.revenue,
              expenses: data.expenses
            };
          });

        return result;
      }

      // Analytics - Visits
      case 'get-visit-analytics': {
        const { period } = data as { period: string };

        // Determine date range
        const now = new Date();
        let startDate: string;

        switch (period) {
          case 'thisMonth':
            startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
            break;
          case 'lastMonth': {
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            startDate = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}-01`;
            break;
          }
          case 'last3Months': {
            const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
            startDate = `${threeMonthsAgo.getFullYear()}-${String(threeMonthsAgo.getMonth() + 1).padStart(2, '0')}-01`;
            break;
          }
          case 'last6Months': {
            const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
            startDate = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}-01`;
            break;
          }
          case 'thisYear':
            startDate = `${now.getFullYear()}-01-01`;
            break;
          default:
            startDate = `${now.getFullYear()}-01-01`;
        }

        const endDate = now.toISOString().split('T')[0];

        // Get visit counts by status
        const statusCounts = this.db.prepare(`
          SELECT status, COUNT(*) as count
          FROM Visits
          WHERE visitDate >= ? AND visitDate <= ?
          GROUP BY status
        `).all(startDate, endDate) as { status: string; count: number }[];

        const statusMap: Record<string, number> = {};
        statusCounts.forEach(s => { statusMap[s.status] = s.count; });

        // Get visits by type
        const byType = this.db.prepare(`
          SELECT visitType as type, COUNT(*) as count
          FROM Visits
          WHERE visitDate >= ? AND visitDate <= ?
          GROUP BY visitType
          ORDER BY count DESC
        `).all(startDate, endDate) as { type: string; count: number }[];

        // Get visits by doctor with revenue
        const byDoctor = this.db.prepare(`
          SELECT
            d.firstName || ' ' || COALESCE(d.lastName, '') as doctorName,
            COUNT(*) as count,
            COALESCE(SUM(p.amount), 0) as revenue
          FROM Visits v
          JOIN Doctors d ON v.doctorID = d.doctorID
          LEFT JOIN Invoices i ON v.visitID = i.visitID
          LEFT JOIN Payments p ON i.invoiceID = p.invoiceID
          WHERE v.visitDate >= ? AND v.visitDate <= ?
          GROUP BY v.doctorID
          ORDER BY count DESC
        `).all(startDate, endDate) as { doctorName: string; count: number; revenue: number }[];

        return {
          total: Object.values(statusMap).reduce((a, b) => a + b, 0),
          completed: statusMap['Completed'] || 0,
          scheduled: statusMap['Scheduled'] || 0,
          inProgress: statusMap['InProgress'] || 0,
          cancelled: statusMap['Cancelled'] || 0,
          noShow: statusMap['NoShow'] || 0,
          byType,
          byDoctor
        };
      }

      // Analytics - Patients
      case 'get-patient-analytics': {
        const now = new Date();
        const thisMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthStart = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}-01`;
        const lastMonthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // Total patients
        const total = (this.db.prepare('SELECT COUNT(*) as count FROM Patients').get() as { count: number }).count;

        // New this month
        const newThisMonth = (this.db.prepare(
          "SELECT COUNT(*) as count FROM Patients WHERE date(createdAt) >= ?"
        ).get(thisMonthStart) as { count: number }).count;

        // New last month
        const newLastMonth = (this.db.prepare(
          "SELECT COUNT(*) as count FROM Patients WHERE date(createdAt) >= ? AND date(createdAt) < ?"
        ).get(lastMonthStart, lastMonthEnd) as { count: number }).count;

        // Active patients (with visits in last 30 days)
        const activePatients = (this.db.prepare(`
          SELECT COUNT(DISTINCT patientID) as count FROM Visits
          WHERE visitDate >= ?
        `).get(thirtyDaysAgo) as { count: number }).count;

        // Returning patients (more than 1 visit)
        const returningPatients = (this.db.prepare(`
          SELECT COUNT(*) as count FROM (
            SELECT patientID FROM Visits
            GROUP BY patientID
            HAVING COUNT(*) > 1
          )
        `).get() as { count: number }).count;

        return {
          totalPatients: total,
          newThisMonth,
          newLastMonth,
          activePatients,
          returningPatients
        };
      }

      // Dashboard stats
      case 'get-dashboard-stats': {
        const today = new Date().toISOString().split('T')[0];
        const monthStart = today.substring(0, 7) + '-01';

        const todayVisits = this.db.prepare(
          "SELECT COUNT(*) as count FROM Visits WHERE visitDate = ?"
        ).get(today) as { count: number };

        const scheduledVisits = this.db.prepare(
          "SELECT COUNT(*) as count FROM Visits WHERE visitDate = ? AND status = 'Scheduled'"
        ).get(today) as { count: number };

        const completedVisits = this.db.prepare(
          "SELECT COUNT(*) as count FROM Visits WHERE visitDate = ? AND status = 'Completed'"
        ).get(today) as { count: number };

        const monthRevenue = this.db.prepare(`
          SELECT COALESCE(SUM(amount), 0) as total FROM Payments
          WHERE paymentDate >= ?
        `).get(monthStart) as { total: number };

        const outstanding = this.db.prepare(`
          SELECT COALESCE(SUM(total - COALESCE(paid, 0)), 0) as total
          FROM Invoices i
          LEFT JOIN (SELECT invoiceID, SUM(amount) as paid FROM Payments GROUP BY invoiceID) p
            ON i.invoiceID = p.invoiceID
          WHERE i.status != 'Paid' AND i.status != 'Void'
        `).get() as { total: number };

        const todaySchedule = this.db.prepare(`
          SELECT v.*,
            p.firstName || ' ' || COALESCE(p.lastName, '') as patientName,
            p.phone as patientPhone,
            d.firstName || ' ' || COALESCE(d.lastName, '') as doctorName
          FROM Visits v
          JOIN Patients p ON v.patientID = p.patientID
          JOIN Doctors d ON v.doctorID = d.doctorID
          WHERE v.visitDate = ?
          ORDER BY v.startTime
        `).all(today);

        return {
          todayVisits: todayVisits.count,
          scheduledVisits: scheduledVisits.count,
          completedVisits: completedVisits.count,
          monthRevenue: monthRevenue.total,
          outstandingBalance: outstanding.total,
          todaySchedule
        };
      }

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }
}

new ClinicApp();
