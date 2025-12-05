/**
 * Patient Workflow Integration Tests
 * Tests the complete patient management flow including:
 * - Searching for patients
 * - Creating new patients
 * - Viewing patient profiles
 * - Editing patient information
 */

import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, createMockPatient, createMockVisit, createMockInvoice } from '../utils/testUtils';
import Patients from '../../src/renderer/pages/Patients';
import { mockElectronAPI } from '../setupTests';

// Mock react-router-dom
const mockNavigate = jest.fn();
const mockSetSearchParams = jest.fn();
let mockSearchParams = new URLSearchParams();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useSearchParams: () => [mockSearchParams, mockSetSearchParams],
}));

describe('Patient Workflow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  describe('View Patient Flow', () => {
    it('should display patient profile with visits and invoices', async () => {
      const mockPatient = createMockPatient({
        patientID: 1,
        firstName: 'Sara',
        lastName: 'Ali',
        phone: '03009876543',
        city: 'Lahore',
        notes: 'Regular patient with back pain',
      });

      const mockVisits = [
        createMockVisit({
          visitID: 1,
          patientID: 1,
          visitDate: '2024-01-15',
          status: 'Completed',
          doctorName: 'Sarah Smith',
        }),
      ];

      const mockInvoices = [
        createMockInvoice({
          invoiceID: 1,
          patientID: 1,
          total: 2000,
          status: 'Paid',
        }),
      ];

      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-patients') {
          return Promise.resolve({
            success: true,
            data: { items: [mockPatient], total: 1 },
          });
        }
        if (operation === 'get-patient-visits') {
          return Promise.resolve({ success: true, data: mockVisits });
        }
        if (operation === 'get-patient-invoices') {
          return Promise.resolve({ success: true, data: mockInvoices });
        }
        if (operation === 'get-attachments') {
          return Promise.resolve({ success: true, data: [] });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Patients />);

      // Wait for patients to load
      await waitFor(() => {
        expect(screen.getByText('Sara Ali')).toBeInTheDocument();
      });

      // Click on patient to view profile
      const patientRow = screen.getByText('Sara Ali').closest('tr');
      if (patientRow) {
        await userEvent.click(patientRow);
      }

      // Wait for profile dialog
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Verify patient info is displayed
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('03009876543')).toBeInTheDocument();
    });
  });

  describe('Create Patient Flow', () => {
    it('should validate required fields before submission', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-patients') {
          return Promise.resolve({
            success: true,
            data: { items: [], total: 0 },
          });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Patients />);

      // Click new patient button
      const newPatientButton = screen.getByRole('button', { name: /new patient/i });
      await userEvent.click(newPatientButton);

      // Wait for dialog
      await waitFor(() => {
        expect(screen.getByText('Register New Patient')).toBeInTheDocument();
      });

      // Try to submit without filling required fields
      const submitButton = screen.getByRole('button', { name: /register patient/i });
      await userEvent.click(submitButton);

      // Verify validation errors appear
      await waitFor(() => {
        expect(screen.getByText('First name is required')).toBeInTheDocument();
        expect(screen.getByText('Phone number is required')).toBeInTheDocument();
      });

      // API should not be called
      expect(mockElectronAPI.database.execute).not.toHaveBeenCalledWith(
        'create-patient',
        expect.anything()
      );
    });

    it('should open new patient dialog via URL parameter', async () => {
      mockSearchParams = new URLSearchParams('action=new');

      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-patients') {
          return Promise.resolve({
            success: true,
            data: { items: [], total: 0 },
          });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Patients />);

      // Dialog should open automatically
      await waitFor(() => {
        expect(screen.getByText('Register New Patient')).toBeInTheDocument();
      });
    });
  });

  describe('Edit Patient Flow', () => {
    it('should open edit dialog when clicking edit button in profile', async () => {
      const mockPatient = createMockPatient({
        patientID: 1,
        firstName: 'Ali',
        lastName: 'Ahmed',
        phone: '03001234567',
      });

      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-patients') {
          return Promise.resolve({
            success: true,
            data: { items: [mockPatient], total: 1 },
          });
        }
        if (operation === 'get-patient-visits') {
          return Promise.resolve({ success: true, data: [] });
        }
        if (operation === 'get-patient-invoices') {
          return Promise.resolve({ success: true, data: [] });
        }
        if (operation === 'get-attachments') {
          return Promise.resolve({ success: true, data: [] });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Patients />);

      // Wait for patients to load
      await waitFor(() => {
        expect(screen.getByText('Ali Ahmed')).toBeInTheDocument();
      });

      // Click on patient row to view profile
      const patientRow = screen.getByText('Ali Ahmed').closest('tr');
      if (patientRow) {
        await userEvent.click(patientRow);
      }

      // Wait for profile dialog
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Click edit button
      const editButton = screen.getByRole('button', { name: /edit/i });
      await userEvent.click(editButton);

      // Wait for edit dialog
      await waitFor(() => {
        expect(screen.getByText('Edit Patient')).toBeInTheDocument();
      });
    });
  });

  describe('Patient Search Scenarios', () => {
    it('should show empty state when no patients registered', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-patients') {
          return Promise.resolve({
            success: true,
            data: { items: [], total: 0 },
          });
        }
        if (operation === 'search-patients') {
          return Promise.resolve({ success: true, data: [] });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Patients />);

      // Verify no patients registered message
      await waitFor(() => {
        expect(screen.getByText('No patients yet')).toBeInTheDocument();
      });
    });

    it('should display patients list from API', async () => {
      const mockPatients = [
        createMockPatient({ patientID: 1, firstName: 'Ali', lastName: 'Khan', phone: '03001234567' }),
        createMockPatient({ patientID: 2, firstName: 'Sara', lastName: 'Ahmed', phone: '03009876543' }),
      ];

      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-patients') {
          return Promise.resolve({
            success: true,
            data: { items: mockPatients, total: 2 },
          });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Patients />);

      await waitFor(() => {
        expect(screen.getByText('Ali Khan')).toBeInTheDocument();
        expect(screen.getByText('Sara Ahmed')).toBeInTheDocument();
      });
    });
  });

  describe('Patient Profile Invoice Creation', () => {
    it('should show New Invoice button in Invoices tab', async () => {
      const mockPatient = createMockPatient({
        patientID: 1,
        firstName: 'Ali',
        lastName: 'Khan',
        phone: '03001234567',
      });

      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-patients') {
          return Promise.resolve({
            success: true,
            data: { items: [mockPatient], total: 1 },
          });
        }
        if (operation === 'get-patient-visits') {
          return Promise.resolve({ success: true, data: [] });
        }
        if (operation === 'get-patient-invoices') {
          return Promise.resolve({ success: true, data: [] });
        }
        if (operation === 'get-attachments') {
          return Promise.resolve({ success: true, data: [] });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Patients />);

      // Wait for patients to load
      await waitFor(() => {
        expect(screen.getByText('Ali Khan')).toBeInTheDocument();
      });

      // Click on patient row to view profile
      const patientRow = screen.getByText('Ali Khan').closest('tr');
      if (patientRow) {
        await userEvent.click(patientRow);
      }

      // Wait for profile dialog
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Click on Invoices tab
      const invoicesTab = screen.getByRole('tab', { name: /invoices/i });
      await userEvent.click(invoicesTab);

      // Verify New Invoice button is present
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /new invoice/i })).toBeInTheDocument();
      });
    });

    it('should navigate to billing page when clicking New Invoice button', async () => {
      const mockPatient = createMockPatient({
        patientID: 1,
        firstName: 'Ali',
        lastName: 'Khan',
        phone: '03001234567',
      });

      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-patients') {
          return Promise.resolve({
            success: true,
            data: { items: [mockPatient], total: 1 },
          });
        }
        if (operation === 'get-patient-visits') {
          return Promise.resolve({ success: true, data: [] });
        }
        if (operation === 'get-patient-invoices') {
          return Promise.resolve({ success: true, data: [] });
        }
        if (operation === 'get-attachments') {
          return Promise.resolve({ success: true, data: [] });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Patients />);

      // Wait for patients to load
      await waitFor(() => {
        expect(screen.getByText('Ali Khan')).toBeInTheDocument();
      });

      // Click on patient row to view profile
      const patientRow = screen.getByText('Ali Khan').closest('tr');
      if (patientRow) {
        await userEvent.click(patientRow);
      }

      // Wait for profile dialog
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Click on Invoices tab
      const invoicesTab = screen.getByRole('tab', { name: /invoices/i });
      await userEvent.click(invoicesTab);

      // Wait for New Invoice button and click it
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /new invoice/i })).toBeInTheDocument();
      });

      const newInvoiceButton = screen.getByRole('button', { name: /new invoice/i });
      await userEvent.click(newInvoiceButton);

      // Verify navigation was called with correct params
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/billing?patientId=1');
      });
    });

    it('should close profile dialog after clicking New Invoice', async () => {
      const mockPatient = createMockPatient({
        patientID: 1,
        firstName: 'Ali',
        lastName: 'Khan',
        phone: '03001234567',
      });

      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-patients') {
          return Promise.resolve({
            success: true,
            data: { items: [mockPatient], total: 1 },
          });
        }
        if (operation === 'get-patient-visits') {
          return Promise.resolve({ success: true, data: [] });
        }
        if (operation === 'get-patient-invoices') {
          return Promise.resolve({ success: true, data: [] });
        }
        if (operation === 'get-attachments') {
          return Promise.resolve({ success: true, data: [] });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Patients />);

      // Wait for patients to load
      await waitFor(() => {
        expect(screen.getByText('Ali Khan')).toBeInTheDocument();
      });

      // Click on patient row to view profile
      const patientRow = screen.getByText('Ali Khan').closest('tr');
      if (patientRow) {
        await userEvent.click(patientRow);
      }

      // Wait for profile dialog
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Click on Invoices tab
      const invoicesTab = screen.getByRole('tab', { name: /invoices/i });
      await userEvent.click(invoicesTab);

      // Click New Invoice button
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /new invoice/i })).toBeInTheDocument();
      });
      const newInvoiceButton = screen.getByRole('button', { name: /new invoice/i });
      await userEvent.click(newInvoiceButton);

      // Verify dialog is closed
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Patient API Integration', () => {
    it('should call API with correct parameters when loading patients', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-patients') {
          return Promise.resolve({
            success: true,
            data: { items: [], total: 0 },
          });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Patients />);

      await waitFor(() => {
        expect(mockElectronAPI.database.execute).toHaveBeenCalledWith(
          'get-patients',
          expect.objectContaining({ limit: 10, offset: 0 })
        );
      });
    });

    it('should handle API errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockElectronAPI.database.execute.mockRejectedValue(new Error('API Error'));

      render(<Patients />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });
});
