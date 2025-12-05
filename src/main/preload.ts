import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Setup
  setup: {
    selectFolder: () => ipcRenderer.invoke('setup:select-folder'),
    complete: (dataPath: string) => ipcRenderer.invoke('setup:complete', dataPath),
    check: () => ipcRenderer.invoke('setup:check')
  },

  // Database operations
  database: {
    execute: <T = unknown>(operation: string, data?: unknown) =>
      ipcRenderer.invoke('db:execute', operation, data) as Promise<{ success: boolean; data?: T; error?: string }>
  },

  // File operations
  files: {
    save: (entityType: string, entityID: number, sourcePath: string) =>
      ipcRenderer.invoke('file:save', entityType, entityID, sourcePath),
    open: (filePath: string) => ipcRenderer.invoke('file:open', filePath),
    select: () => ipcRenderer.invoke('file:select') as Promise<string[]>,
    selectImage: () => ipcRenderer.invoke('file:select-image') as Promise<string | null>,
    saveLogo: (sourcePath: string) => ipcRenderer.invoke('file:save-logo', sourcePath),
    readLogoBase64: (logoPath: string) => ipcRenderer.invoke('file:read-logo-base64', logoPath)
  },

  // Backup operations
  backup: {
    create: () => ipcRenderer.invoke('backup:create'),
    list: () => ipcRenderer.invoke('backup:list')
  },

  // System
  system: {
    getAppVersion: () => ipcRenderer.invoke('system:version') as Promise<string>,
    getDataPath: () => ipcRenderer.invoke('system:data-path') as Promise<string>,
    openExternal: (url: string) => ipcRenderer.invoke('system:open-external', url)
  },

  // Seed / Demo Data
  seed: {
    loadDemoData: (clearExisting?: boolean) => ipcRenderer.invoke('seed:load-demo-data', clearExisting),
    hasDemoData: () => ipcRenderer.invoke('seed:has-demo-data') as Promise<boolean>,
    getSummary: () => ipcRenderer.invoke('seed:get-summary') as Promise<Record<string, number> | null>
  }
});

// Type definitions for the exposed API
export interface ElectronAPI {
  setup: {
    selectFolder: () => Promise<string | null>;
    complete: (dataPath: string) => Promise<{ success: boolean; error?: string }>;
    check: () => Promise<{ isComplete: boolean; dataPath?: string }>;
  };
  database: {
    execute: <T = unknown>(operation: string, data?: unknown) => Promise<{ success: boolean; data?: T; error?: string }>;
  };
  files: {
    save: (entityType: string, entityID: number, sourcePath: string) => Promise<{ success: boolean; data?: { filePath: string; fileName: string }; error?: string }>;
    open: (filePath: string) => Promise<void>;
    select: () => Promise<string[]>;
    selectImage: () => Promise<string | null>;
    saveLogo: (sourcePath: string) => Promise<{ success: boolean; data?: { filePath: string }; error?: string }>;
    readLogoBase64: (logoPath: string) => Promise<{ success: boolean; data?: string; error?: string }>;
  };
  backup: {
    create: () => Promise<{ success: boolean; data?: string; error?: string }>;
    list: () => Promise<{ success: boolean; data?: string[]; error?: string }>;
  };
  system: {
    getAppVersion: () => Promise<string>;
    getDataPath: () => Promise<string>;
    openExternal: (url: string) => Promise<void>;
  };
  seed: {
    loadDemoData: (clearExisting?: boolean) => Promise<{
      success: boolean;
      message?: string;
      error?: string;
      counts?: {
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
    }>;
    hasDemoData: () => Promise<boolean>;
    getSummary: () => Promise<Record<string, number> | null>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
