# Clinic Management System

A desktop application for physical therapy clinic management built with Electron, React, and SQLite.

## Features

- **Patient Management** — Registration, profiles, diagnosis (ICD-10), visit history, file attachments
- **Visit Scheduling** — Calendar view, status workflow (Scheduled > InProgress > Completed), session tracking
- **Billing & Invoices** — Invoice generation, payment tracking, printable invoices with clinic branding
- **Session Packages** — Multi-session packages with usage tracking and expiry
- **Finance Dashboard** — Revenue/expense tracking, doctor filtering, CSV export with detailed breakdowns
- **Services & Doctors** — Configurable service catalog and doctor management
- **Investigations** — Medical investigation records (X-Ray, MRI, Lab Tests, etc.)
- **Data Export** — Patient data and reports export to CSV
- **Automatic Backups** — Daily database backups with 7-day retention

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Runtime | Electron 34 |
| Frontend | React 19 + TypeScript |
| UI Framework | Material-UI v5 |
| Database | SQLite via better-sqlite3 |
| Routing | React Router v7 |
| Validation | Zod |
| Testing | Jest + React Testing Library |
| Bundler | webpack 5 |

## Prerequisites

- Node.js 18+
- npm 9+
- Windows (primary target), macOS/Linux (untested)

## Setup

```bash
# Install dependencies
npm install

# Rebuild native modules for Electron
npm run rebuild

# Start development
npm run dev
```

## Build

```bash
# Build renderer (webpack production)
npm run build

# Build main process (TypeScript)
npm run build:main

# Build distributable installer
npm run build:all
```

## Testing

```bash
# Run all tests (702 tests)
npm test

# Skip coverage report
npm test -- --no-coverage

# Run specific test suites
npm test -- --testPathPatterns="integration"
npm test -- --testPathPatterns="unit"
```

## Architecture

```
src/
├── main/               # Electron main process
│   ├── main.ts         # App lifecycle, IPC, window management (~600 lines)
│   ├── preload.ts      # IPC bridge (window.electronAPI)
│   └── handlers/       # Database operation handlers (16 modules)
│       ├── index.ts    # Operation registry
│       ├── patients.ts # Patient CRUD
│       ├── visits.ts   # Visit scheduling
│       ├── invoices.ts # Billing operations
│       ├── finance.ts  # Financial summaries
│       └── ...         # 11 more domain modules
├── renderer/           # React frontend
│   ├── pages/          # Route pages (Dashboard, Patients, Visits, etc.)
│   ├── components/     # Shared components (ICD10Selector, PrintableInvoice, etc.)
│   ├── contexts/       # React Context (AuthContext)
│   └── utils/          # Utilities (patientExport, timeValidation)
├── shared/             # Shared between processes
│   └── validation/     # Zod schemas for all entities
├── database/           # Schema and seed data
│   ├── schema.sql      # SQLite schema
│   └── seedData.ts     # Demo data for development
└── types/              # TypeScript type definitions
```

All database operations flow through a single IPC channel (`db:execute`) with operation name dispatch:

```typescript
// Renderer
const result = await window.electronAPI.database.execute('get-patients', { limit: 10 });

// Main process — routes to src/main/handlers/patients.ts
```

## First Run

1. The setup wizard prompts you to select a data storage folder
2. Database and file directories are created at the selected path
3. Default admin credentials: `admin` / `admin123`

## License

MIT
