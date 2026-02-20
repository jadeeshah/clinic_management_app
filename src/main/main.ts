import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import Database from 'better-sqlite3';
import * as bcrypt from 'bcryptjs';
import { seedDatabase, hasDemoData, getDataSummary } from '../database/seed';
import { operationHandlers } from './handlers';

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
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '..', '..', 'dist', 'index.html'));
    }

    // Only open DevTools in development
    if (isDev) {
      this.mainWindow.webContents.openDevTools();
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

      // Run migrations for existing databases
      this.runMigrations();

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

  private runMigrations(): void {
    if (!this.db) return;

    // Check and add diagnosis column to Patients table
    const diagnosisColumn = this.db.prepare(
      "SELECT name FROM pragma_table_info('Patients') WHERE name = 'diagnosis'"
    ).get();

    if (!diagnosisColumn) {
      try {
        this.db.exec('ALTER TABLE Patients ADD COLUMN diagnosis TEXT');
        console.log('Migration: Added diagnosis column to Patients table');
      } catch (error) {
        console.error('Migration failed for diagnosis column:', error);
      }
    }

    // Check and create Investigations table
    const investigationsTable = this.db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='Investigations'"
    ).get();

    if (!investigationsTable) {
      try {
        this.db.exec(`
          CREATE TABLE IF NOT EXISTS Investigations (
            investigationID INTEGER PRIMARY KEY AUTOINCREMENT,
            patientID INTEGER NOT NULL,
            investigationType TEXT NOT NULL,
            investigationDate TEXT NOT NULL,
            orderedByDoctorID INTEGER,
            bodyPart TEXT,
            findings TEXT,
            status TEXT DEFAULT 'Ordered',
            notes TEXT,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
            updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patientID) REFERENCES Patients(patientID) ON DELETE CASCADE,
            FOREIGN KEY (orderedByDoctorID) REFERENCES Doctors(doctorID)
          );
          CREATE INDEX IF NOT EXISTS idx_investigations_patient ON Investigations(patientID);
          CREATE INDEX IF NOT EXISTS idx_investigations_date ON Investigations(investigationDate);
        `);
        console.log('Migration: Created Investigations table');
      } catch (error) {
        console.error('Migration failed for Investigations table:', error);
      }
    }

    // Migration: Remove CHECK constraint on visitType in Visits table
    // SQLite can't alter constraints, so we check if the constraint exists and recreate the table
    try {
      const createSql = this.db.prepare(
        "SELECT sql FROM sqlite_master WHERE type='table' AND name='Visits'"
      ).get() as { sql: string } | undefined;

      if (createSql?.sql && createSql.sql.includes("CHECK(visitType IN")) {
        this.db.exec('PRAGMA foreign_keys = OFF');
        this.db.transaction(() => {
          this.db!.exec(`
            CREATE TABLE Visits_new (
              visitID INTEGER PRIMARY KEY AUTOINCREMENT,
              patientID INTEGER NOT NULL,
              doctorID INTEGER NOT NULL,
              visitDate TEXT NOT NULL,
              startTime TEXT NOT NULL,
              endTime TEXT,
              duration INTEGER DEFAULT 45,
              status TEXT CHECK(status IN ('Scheduled', 'InProgress', 'Completed', 'Cancelled', 'NoShow')) DEFAULT 'Scheduled',
              visitType TEXT DEFAULT 'TherapySession',
              sessionIndex INTEGER,
              notes TEXT,
              patientPackageID INTEGER,
              createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
              updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (patientID) REFERENCES Patients(patientID) ON DELETE CASCADE,
              FOREIGN KEY (doctorID) REFERENCES Doctors(doctorID),
              FOREIGN KEY (patientPackageID) REFERENCES PatientPackages(patientPackageID)
            );
            INSERT INTO Visits_new SELECT * FROM Visits;
            DROP TABLE Visits;
            ALTER TABLE Visits_new RENAME TO Visits;
            CREATE INDEX IF NOT EXISTS idx_visits_date ON Visits(visitDate);
            CREATE INDEX IF NOT EXISTS idx_visits_patient ON Visits(patientID);
            CREATE INDEX IF NOT EXISTS idx_visits_doctor ON Visits(doctorID);
            CREATE INDEX IF NOT EXISTS idx_visits_status ON Visits(status);
            CREATE TRIGGER IF NOT EXISTS update_visits_timestamp
            AFTER UPDATE ON Visits
            BEGIN
              UPDATE Visits SET updatedAt = CURRENT_TIMESTAMP WHERE visitID = NEW.visitID;
            END;
          `);
        })();
        this.db.exec('PRAGMA foreign_keys = ON');
        console.log('Migration: Removed visitType CHECK constraint from Visits table');
      }
    } catch (error) {
      console.error('Migration failed for visitType constraint removal:', error);
      this.db.exec('PRAGMA foreign_keys = ON');
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

    const handler = operationHandlers[operation];
    if (!handler) {
      throw new Error(`Unknown operation: ${operation}`);
    }
    return handler(this.db, data);
  }
}

new ClinicApp();
