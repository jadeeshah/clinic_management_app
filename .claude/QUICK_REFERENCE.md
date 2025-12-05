# Quick Reference

## Commands
```bash
npm test                    # Run all 206 tests
npm test -- --no-coverage   # Skip coverage report
npm run build               # Build everything
npm start                   # Run Electron app
```

## Key Paths
| Purpose | Path |
|---------|------|
| Page components | `src/renderer/pages/*.tsx` |
| Type definitions | `src/types/index.ts` |
| API types (renderer) | `src/renderer/global.d.ts` |
| IPC handlers | `src/main/main.ts` |
| Preload bridge | `src/main/preload.ts` |
| Test setup | `tests/setupTests.ts` |
| Test utilities | `tests/utils/testUtils.ts` |
| Seed data | `src/database/seedData.ts` |

## Mock Pattern
```typescript
mockElectronAPI.database.execute.mockImplementation((operation: string) => {
  if (operation === 'get-patients') {
    return Promise.resolve({ success: true, data: { items: [...], total: 2 } });
  }
  return Promise.resolve({ success: true, data: null });
});
```

## Mock Factories
```typescript
createMockPatient({ patientID: 1, firstName: 'John' })
createMockDoctor({ doctorID: 1, firstName: 'Sarah' })
createMockVisit({ visitID: 1, patientName: 'John Doe' })
createMockInvoice({ invoiceID: 1, patientName: 'John Doe' })
createMockPackage({ packageID: 1, name: 'Basic Package' })
createMockService({ serviceID: 1, code: 'PT-001' })
```

## Common Database Operations
- `get-patients`, `create-patient`, `search-patients`
- `get-doctors`, `create-doctor`, `update-doctor`
- `get-visits`, `create-visit`, `update-visit`
- `get-invoices`, `create-invoice`, `get-invoice-details`
- `record-payment`
- `get-services`, `get-packages`, `create-package`
- `get-settings`, `update-settings`
- `get-finance-summary`, `get-expenses`, `create-expense`
- `get-dashboard-stats`

## Test Tips
1. Use `waitFor()` for async assertions
2. Use `getAllByText()` when text appears multiple times
3. Add timeout for slow tests: `it('test', async () => {...}, 15000)`
4. Use `userEvent.setup({ delay: null })` for faster form filling
5. Check actual UI text in components for empty states
