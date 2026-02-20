# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
# Development (starts renderer dev server + electron)
npm run dev

# Build renderer (webpack production)
npm run build

# Build main process (TypeScript compilation)
npm run build:main

# Build full distributable
npm run build:all

# Rebuild native modules after npm install (better-sqlite3)
npm run rebuild
```

## Architecture Overview

This is an Electron desktop application for physical therapy clinic management, built with:
- **Main Process**: Electron + better-sqlite3 (native SQLite)
- **Renderer Process**: React 19 + TypeScript + Material-UI v5
- **Routing**: React Router v7
- **State**: React Context (AuthContext for session management)

### Process Communication

```
┌──────────────────┐    IPC via preload.ts    ┌──────────────────┐
│  Renderer (React) │ ◄──────────────────────► │  Main (Electron) │
│                    │   window.electronAPI    │                   │
│  - React pages     │                         │  - Database ops   │
│  - Material-UI     │                         │  - File system    │
│  - AuthContext     │                         │  - better-sqlite3 │
└──────────────────┘                           └──────────────────┘
```

### Key Files

- `src/main/main.ts` - Electron main process with all database operations (switch-case on operation name)
- `src/main/preload.ts` - IPC bridge exposing `window.electronAPI` to renderer
- `src/renderer/global.d.ts` - TypeScript declarations for `window.electronAPI`
- `src/types/index.ts` - Shared type definitions for all entities
- `src/database/schema.sql` - SQLite schema (auto-copied during build)

### Database Operation Pattern

All database operations go through a single IPC channel (`db:execute`) with an operation name:

```typescript
// Renderer side
const result = await window.electronAPI.database.execute<Patient[]>('get-patients', { limit: 10 });

// Main process (main.ts) - handled in switch statement
case 'get-patients': {
  return this.db.prepare('SELECT * FROM Patients...').all();
}
```

### Feature Modules

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Quick stats, action cards, phone search |
| Patients | `/patients` | CRUD, profile with tabs (Visits/Invoices/Investigations/Files) |
| Visits | `/visits` | Unified scheduling (45-min default), status workflow |
| Billing | `/billing` | Invoices, payments, next visit on invoice |
| Finance | `/finance` | Revenue/expenses, CSV export |
| Services | `/services` | Service catalog and session packages (admin) |
| Doctors | `/doctors` | Doctor management (admin) |
| Settings | `/settings` | Clinic settings (admin) |

### First-Run Flow

1. `SetupWizard.tsx` - User selects data storage folder
2. Config saved to `%AppData%/clinic-management/config.json`
3. Database + file directories created at selected path
4. Default admin user created (admin/admin123)

### TypeScript Configuration

- `tsconfig.main.json` - Main process compilation to `dist-main/`
- `tsconfig.webpack.json` - Renderer compilation via webpack/ts-loader
- Both extend base `tsconfig.json`

### Native Module Handling

better-sqlite3 requires compilation for Electron. The `postinstall` script runs `electron-rebuild` automatically. If you see native module errors, run `npm run rebuild`.

## Testing

### Commands

```bash
npm test                                      # Run all tests (702 tests)
npm test -- --no-coverage                     # Skip coverage report
npm test -- --testPathPatterns="integration"  # Integration tests only
npm test -- --testPathPatterns="unit"         # Unit tests only
```

### Test Structure

```
tests/
├── unit/           # Component and utility unit tests
│   ├── timeValidation.test.ts     (25 tests) - Time/schedule validation
│   ├── patientExport.test.ts      (12 tests) - CSV export utilities
│   ├── icd10Codes.test.ts         (18 tests) - ICD-10 code search
│   └── validation/                 # Zod schema tests
├── integration/    # Workflow integration tests
│   ├── invoiceWorkflow.test.tsx   (13 tests)
│   ├── packageWorkflow.test.tsx   (7 tests)
│   ├── doctorWorkflow.test.tsx    (8 tests)
│   ├── settingsWorkflow.test.tsx  (8 tests)
│   ├── financeReports.test.tsx    (12 tests)
│   ├── investigationWorkflow.test.tsx (17 tests) - Investigation CRUD
│   └── ... (patient, visit, dashboard, appointment)
├── utils/testUtils.ts    # Custom render, mock factories
├── fixtures/seedData.ts  # Re-exports from src/database/seedData.ts
└── setupTests.ts         # Jest setup, mockElectronAPI
```

### Mock Pattern

```typescript
import { mockElectronAPI } from '../setupTests';
import { render, createMockPatient } from '../utils/testUtils';

mockElectronAPI.database.execute.mockImplementation((operation: string) => {
  if (operation === 'get-patients') {
    return Promise.resolve({ success: true, data: { items: [createMockPatient()], total: 1 } });
  }
  return Promise.resolve({ success: true, data: null });
});
```

### Mock Factories (testUtils.ts)

```typescript
createMockPatient({ patientID: 1, firstName: 'John', lastName: 'Doe', diagnosis: 'M54.5' })
createMockDoctor({ doctorID: 1, firstName: 'Sarah', specialization: 'PT' })
createMockVisit({ visitID: 1, patientName: 'John Doe', status: 'Scheduled' })
createMockInvoice({ invoiceID: 1, patientName: 'John Doe', status: 'Unpaid' })
createMockPackage({ packageID: 1, name: 'Basic Package', totalSessions: 5 })
createMockService({ serviceID: 1, code: 'PT-001', name: 'PT Session' })
createMockDashboardStats({ todayVisits: 5, completedVisits: 3 })
createMockInvestigation({ investigationID: 1, investigationType: 'X-Ray', status: 'Ordered' })
createMockPatientPackage({ packageName: '10 Sessions', sessionsUsed: 3, totalSessions: 10 })
```

### Testing Tips

1. Use `waitFor()` for async assertions after renders
2. Use `getAllByText()` when text appears multiple times
3. Add timeout for slow form tests: `it('test', async () => {...}, 15000)`
4. Use `userEvent.setup({ delay: null })` for faster form interactions
5. Check actual component text for empty states (varies per component)

## Demo Data / Seed Data

### Loading Demo Data

The Settings page has a "Load Demo Data" button for demos/training. Programmatically:

```typescript
// Via IPC
window.electronAPI.seed.loadDemoData(clearExisting?: boolean)
window.electronAPI.seed.hasDemoData()
window.electronAPI.seed.getSummary()
```

### Seed Data Contents (src/database/seedData.ts)

- 4 doctors (Sarah Khan, Ahmed Ali, Maria Santos, James Wilson)
- 10 patients with Pakistani phone numbers
- 3 packages (5, 10, 15 sessions)
- 4 services (PT Session, Evaluation, Dry Needling, Cupping)
- 25 visits (various statuses)
- 15 invoices (Paid, Unpaid, Partial)
- 10 payments
- 8 expenses

## New Components & Utilities (v2.0.0)

### Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `ICD10Selector` | `src/renderer/components/` | Modal for searching/selecting ICD-10 diagnosis codes |
| `InvestigationForm` | `src/renderer/components/` | Form for creating/editing medical investigations |

### Utilities

| Utility | Location | Purpose |
|---------|----------|---------|
| `timeValidation.ts` | `src/renderer/utils/` | Doctor schedule validation functions |
| `patientExport.ts` | `src/renderer/utils/` | CSV export for patient data |

### Database Operations

New operations added to `main.ts`:
- `get-patient-investigations` - List investigations for a patient
- `get-investigation` - Get single investigation by ID
- `create-investigation` - Create new investigation record
- `update-investigation` - Update existing investigation
- `delete-investigation` - Delete investigation record

### Validation Schemas

New schema in `src/shared/validation/schemas/`:
- `investigation.ts` - Zod schema for investigation validation

## Additional Notes

See `.claude/SESSION_NOTES.md` for detailed session history and `.claude/QUICK_REFERENCE.md` for quick lookups.
