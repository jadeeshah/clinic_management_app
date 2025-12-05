import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Polyfill TextEncoder/TextDecoder for jsdom
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

// Mock matchMedia for MUI components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.electronAPI
const mockElectronAPI = {
  setup: {
    selectFolder: jest.fn().mockResolvedValue('/mock/path'),
    complete: jest.fn().mockResolvedValue({ success: true }),
    check: jest.fn().mockResolvedValue({ isComplete: true, dataPath: '/mock/path' }),
  },
  database: {
    execute: jest.fn().mockResolvedValue({ success: true, data: null }),
  },
  files: {
    save: jest.fn().mockResolvedValue({ success: true, data: { filePath: '/mock/file', fileName: 'test.pdf' } }),
    open: jest.fn().mockResolvedValue(undefined),
    select: jest.fn().mockResolvedValue([]),
    selectImage: jest.fn().mockResolvedValue(null),
    saveLogo: jest.fn().mockResolvedValue({ success: true, data: { filePath: '/mock/logo.png' } }),
    readLogoBase64: jest.fn().mockResolvedValue({ success: true, data: 'data:image/png;base64,mockbase64' }),
  },
  seed: {
    loadDemoData: jest.fn().mockResolvedValue({ success: true, counts: {} }),
    hasDemoData: jest.fn().mockResolvedValue(false),
    getSummary: jest.fn().mockResolvedValue(null),
  },
  backup: {
    create: jest.fn().mockResolvedValue({ success: true, data: '/mock/backup.db' }),
    list: jest.fn().mockResolvedValue({ success: true, data: [] }),
  },
  system: {
    getAppVersion: jest.fn().mockResolvedValue('2.0.0'),
    getDataPath: jest.fn().mockResolvedValue('/mock/data'),
    openExternal: jest.fn().mockResolvedValue(undefined),
  },
};

Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true,
});

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  // Reset mock implementations to defaults
  mockElectronAPI.database.execute.mockResolvedValue({ success: true, data: null });
  mockElectronAPI.setup.check.mockResolvedValue({ isComplete: true, dataPath: '/mock/path' });
  mockElectronAPI.setup.selectFolder.mockResolvedValue('/mock/path');
  mockElectronAPI.setup.complete.mockResolvedValue({ success: true });
  mockElectronAPI.files.save.mockResolvedValue({ success: true, data: { filePath: '/mock/file', fileName: 'test.pdf' } });
  mockElectronAPI.files.select.mockResolvedValue([]);
  mockElectronAPI.files.selectImage.mockResolvedValue(null);
  mockElectronAPI.seed.hasDemoData.mockResolvedValue(false);
  mockElectronAPI.backup.list.mockResolvedValue({ success: true, data: [] });
});

// Clean up after each test to prevent async leaks
afterEach(() => {
  jest.useRealTimers();
});

// Export for use in tests
export { mockElectronAPI };
