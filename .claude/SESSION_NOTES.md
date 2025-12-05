# Clinic Management System - Session Notes

Last Updated: 2025-12-01

## Project Overview

A desktop clinic management application for physiotherapy clinics built with:
- **Frontend**: React 19 + TypeScript + Material UI (MUI)
- **Backend**: Electron (main process)
- **Database**: better-sqlite3 (SQLite)
- **Testing**: Jest + React Testing Library

## Architecture

```
src/
├── main/           # Electron main process
│   ├── main.ts     # Entry point, IPC handlers, window management
│   ├── preload.ts  # Exposes electronAPI to renderer
│   └── database/   # Database operations
├── renderer/       # React frontend
│   ├── pages/      # Page components (Dashboard, Patients, Visits, etc.)
│   ├── components/ # Reusable UI components
│   ├── contexts/   # React contexts (AuthContext)
│   └── global.d.ts # TypeScript declarations for electronAPI
├── database/       # Database utilities
│   ├── seed.ts     # Demo data seeding logic
│   └── seedData.ts # Seed data constants
└── types/          # Shared TypeScript types
    └── index.ts    # All entity types (Patient, Visit, Invoice, etc.)

tests/
├── unit/           # Unit tests for components and utilities
├── integration/    # Integration tests for workflows
├── utils/          # Test utilities (testUtils.ts)
├── fixtures/       # Test fixtures (re-exports from src/database/seedData.ts)
└── setupTests.ts   # Jest setup with mockElectronAPI
```

## Key Files

### Main Process
- `src/main/main.ts` - IPC handlers for all database operations, file operations, backup, seed data
- `src/main/preload.ts` - Defines `window.electronAPI` interface exposed to renderer

### Renderer
- `src/renderer/global.d.ts` - TypeScript types for `window.electronAPI`
- `src/renderer/pages/` - Main page components:
  - `Dashboard.tsx` - Home page with stats, quick actions, today's schedule
  - `Patients.tsx` - Patient list, registration, profile dialog
  - `Visits.tsx` - Visit scheduling, status management
  - `Invoices.tsx` - Invoice creation, viewing, payments
  - `Doctors.tsx` - Doctor management
  - `Services.tsx` - Services and Packages (tabbed interface)
  - `Finance.tsx` - Revenue/expense tracking, reports
  - `Settings.tsx` - Clinic settings, backup, demo data loading

### Database
- `src/database/seed.ts` - `loadDemoData()` function for seeding database
- `src/database/seedData.ts` - All seed data constants (doctors, patients, visits, etc.)

### Testing
- `tests/setupTests.ts` - Jest configuration, `mockElectronAPI` setup
- `tests/utils/testUtils.ts` - Custom render, mock factories (`createMockPatient`, etc.)

## Database Operations (IPC)

All database operations go through `window.electronAPI.database.execute(operation, data)`:

| Operation | Description |
|-----------|-------------|
| `get-dashboard-stats` | Dashboard statistics |
| `get-patients` | Paginated patient list |
| `search-patients` | Search patients by query |
| `create-patient` | Register new patient |
| `get-doctors` | List all doctors |
| `create-doctor` / `update-doctor` | Doctor CRUD |
| `get-visits` | List visits with filters |
| `create-visit` / `update-visit` | Visit CRUD |
| `get-invoices` | List invoices |
| `create-invoice` | Create invoice with items |
| `get-invoice-details` | Full invoice with items/payments |
| `record-payment` | Add payment to invoice |
| `get-services` / `get-packages` | Services and packages |
| `get-settings` / `update-settings` | Clinic settings |
| `get-finance-summary` | Financial summary by date range |
| `get-expenses` / `create-expense` | Expense tracking |

## Seed Data API

```typescript
window.electronAPI.seed.loadDemoData(clearExisting?: boolean)
window.electronAPI.seed.hasDemoData()
window.electronAPI.seed.getSummary()
```

Seed data includes:
- 4 doctors (Sarah Khan, Ahmed Ali, Maria Santos, James Wilson)
- 10 patients with Pakistani phone numbers
- 3 packages (5, 10, 15 sessions)
- 4 services (PT Session, Evaluation, Dry Needling, Cupping)
- 25 visits across various statuses
- 15 invoices with different payment states
- 10 payments
- 8 expenses

## Testing Conventions

### Test Structure
```typescript
// tests/integration/[workflow].test.tsx
describe('Workflow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Feature Area', () => {
    it('should do something', async () => {
      // Setup mock
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-something') {
          return Promise.resolve({ success: true, data: mockData });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Component />);

      await waitFor(() => {
        expect(screen.getByText('Expected')).toBeInTheDocument();
      });
    });
  });
});
```

### Mock Factories (from testUtils.ts)
```typescript
createMockPatient({ patientID: 1, firstName: 'John', ... })
createMockDoctor({ doctorID: 1, firstName: 'Sarah', ... })
createMockVisit({ visitID: 1, patientName: 'John Doe', ... })
createMockInvoice({ invoiceID: 1, patientName: 'John Doe', ... })
createMockPackage({ packageID: 1, name: 'Basic Package', ... })
createMockService({ serviceID: 1, code: 'PT-001', ... })
createMockDashboardStats({ todayVisits: 5, ... })
```

### Running Tests
```bash
npm test                                    # All tests
npm test -- --no-coverage                   # Skip coverage
npm test -- --testPathPatterns="integration" # Integration only
npm test -- --testPathPatterns="unit"       # Unit only
```

### Known Test Considerations
1. **Timeouts**: Some form-heavy tests need extended timeouts (15000ms)
2. **userEvent speed**: Use `userEvent.setup({ delay: null })` for faster typing
3. **Multiple elements**: Use `getAllByText()` when values may appear multiple times
4. **Dialog buttons**: Dialogs often have same button text (e.g., "Add") - use `getAllByRole` and select by index
5. **Empty states**: Check actual component text (e.g., "No Doctors Found" vs "No doctors registered")

## Current Test Coverage

```
Test Suites: 15 passed
Tests: 206 passed

Integration tests:
- invoiceWorkflow.test.tsx (13 tests)
- packageWorkflow.test.tsx (7 tests)
- doctorWorkflow.test.tsx (8 tests)
- settingsWorkflow.test.tsx (8 tests)
- financeReports.test.tsx (12 tests)
- patientWorkflow.test.tsx (existing)
- visitWorkflow.test.tsx (existing)
- dashboardWorkflow.test.tsx (existing)
- appointmentFlow.test.tsx (existing)
```

## Build Commands

```bash
npm run build           # Build all (main + renderer)
npm run build:main      # Build Electron main process only
npm run build:renderer  # Build React frontend only
npm start               # Start Electron app
npm run dev             # Development mode with hot reload
```

## Project Configuration

- `tsconfig.json` - Main TypeScript config (rootDir: src/)
- `tsconfig.test.json` - Test TypeScript config
- `jest.config.js` - Jest configuration
- `webpack.*.js` - Webpack configs for main/renderer

## Known Issues / Warnings

1. **ts-jest deprecation warnings**: `isolatedModules` config format is deprecated but still works
2. **React act() warnings**: Common in React 19 tests, not causing failures
3. **File paths**: Use forward slashes or path.join() for cross-platform compatibility

## Recent Changes (This Session)

1. Created seed data infrastructure (`src/database/seedData.ts`, `src/database/seed.ts`)
2. Added "Load Demo Data" button to Settings page with confirmation dialog
3. Created 5 new integration test files (48 new tests total)
4. Fixed test assertions to match actual UI text
5. Added timeouts for slow form tests

## Suggested Future Improvements

1. Add E2E tests with Playwright for full Electron testing
2. Add more error handling tests
3. Consider adding test coverage thresholds
4. Add visual regression testing for UI components
5. Consider extracting common test patterns into shared helpers
