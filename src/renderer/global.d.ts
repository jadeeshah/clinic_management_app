// Global type declarations for the renderer process

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

interface ElectronAPI {
  setup: {
    selectFolder: () => Promise<string | null>;
    complete: (dataPath: string) => Promise<{ success: boolean; error?: string }>;
    check: () => Promise<{ isComplete: boolean; dataPath?: string }>;
  };
  database: {
    execute: <T = unknown>(operation: string, data?: unknown) => Promise<ApiResponse<T>>;
  };
  files: {
    save: (entityType: string, entityID: number, sourcePath: string) => Promise<ApiResponse<{ filePath: string; fileName: string }>>;
    open: (filePath: string) => Promise<void>;
    select: () => Promise<string[]>;
    selectImage: () => Promise<string | null>;
    saveLogo: (sourcePath: string) => Promise<ApiResponse<{ filePath: string }>>;
    readLogoBase64: (logoPath: string) => Promise<ApiResponse<string>>;
  };
  backup: {
    create: () => Promise<ApiResponse<string>>;
    list: () => Promise<ApiResponse<string[]>>;
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

export {};
