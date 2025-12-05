/**
 * Test utilities for rendering components with required providers
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AuthProvider } from '../../src/renderer/contexts/AuthContext';

const theme = createTheme();

interface AllProvidersProps {
  children: React.ReactNode;
}

const AllProviders: React.FC<AllProvidersProps> = ({ children }) => {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <BrowserRouter>{children}</BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

// Custom render with all providers
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllProviders, ...options });

// Provider without auth (for testing login page)
const ProvidersWithoutAuth: React.FC<AllProvidersProps> = ({ children }) => {
  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>{children}</BrowserRouter>
    </ThemeProvider>
  );
};

const renderWithoutAuth = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: ProvidersWithoutAuth, ...options });

// Provider with router only
const RouterProvider: React.FC<AllProvidersProps> = ({ children }) => {
  return <BrowserRouter>{children}</BrowserRouter>;
};

const renderWithRouter = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: RouterProvider, ...options });

// Export everything
export * from '@testing-library/react';
export { customRender as render, renderWithoutAuth, renderWithRouter };

// Mock data factories
export const createMockPatient = (overrides = {}) => ({
  patientID: 1,
  mrn: 'MRN-2024-0001',
  firstName: 'John',
  lastName: 'Doe',
  phone: '03001234567',
  whatsApp: null,
  email: 'john@example.com',
  dateOfBirth: '1990-01-15',
  sex: 'Male' as const,
  address: '123 Main St',
  city: 'Karachi',
  emergencyContactName: null,
  emergencyContactPhone: null,
  emergencyContactRelation: null,
  notes: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockDoctor = (overrides = {}) => ({
  doctorID: 1,
  firstName: 'Dr. Sarah',
  lastName: 'Smith',
  education: 'DPT',
  designation: 'Senior Physiotherapist',
  specialization: 'Sports Medicine',
  sessionCharge: 2000,
  availableDays: ['Monday', 'Wednesday', 'Friday'],
  startTime: '09:00',
  endTime: '17:00',
  phone: '03001234567',
  email: 'sarah@clinic.com',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockVisit = (overrides = {}) => ({
  visitID: 1,
  patientID: 1,
  doctorID: 1,
  visitDate: '2024-01-15',
  startTime: '10:00',
  endTime: '10:45',
  duration: 45,
  status: 'Scheduled' as const,
  visitType: 'TherapySession' as const,
  sessionIndex: 1,
  notes: null,
  patientPackageID: null,
  createdAt: '2024-01-15T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
  patientName: 'John Doe',
  patientPhone: '03001234567',
  doctorName: 'Dr. Sarah Smith',
  ...overrides,
});

export const createMockInvoice = (overrides = {}) => ({
  invoiceID: 1,
  invoiceNo: 'INV-2024-0001',
  patientID: 1,
  doctorID: 1,
  visitID: 1,
  invoiceDate: '2024-01-15',
  subtotal: 2000,
  discountAmount: 0,
  taxAmount: 0,
  total: 2000,
  status: 'Unpaid' as const,
  nextVisitDate: null,
  nextVisitTime: null,
  createdAt: '2024-01-15T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
  patientName: 'John Doe',
  doctorName: 'Dr. Sarah Smith',
  paidAmount: 0,
  ...overrides,
});

export const createMockService = (overrides = {}) => ({
  serviceID: 1,
  code: 'PT-SESSION',
  name: 'Physiotherapy Session',
  defaultPrice: 1000,
  category: 'Therapy',
  isActive: true,
  ...overrides,
});

export const createMockPackage = (overrides = {}) => ({
  packageID: 1,
  name: '10 Session Package',
  totalSessions: 10,
  price: 8000,
  validityDays: 30,
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockExpense = (overrides = {}) => ({
  expenseID: 1,
  expenseDate: '2024-01-15',
  title: 'Office Rent',
  category: 'Rent' as const,
  amount: 50000,
  paidTo: 'Landlord',
  notes: null,
  createdAt: '2024-01-15T00:00:00Z',
  ...overrides,
});

export const createMockUser = (overrides = {}) => ({
  userID: 1,
  username: 'admin',
  role: 'Admin' as const,
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockDashboardStats = (overrides = {}) => ({
  todayVisits: 10,
  scheduledVisits: 5,
  completedVisits: 5,
  monthRevenue: 50000,
  outstandingBalance: 10000,
  todaySchedule: [],
  ...overrides,
});
