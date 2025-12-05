/**
 * Patients Component Tests
 */

import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, createMockPatient, createMockVisit, createMockInvoice } from '../../utils/testUtils';
import Patients from '../../../src/renderer/pages/Patients';
import { mockElectronAPI } from '../../setupTests';

// Mock useSearchParams
const mockSetSearchParams = jest.fn();
let mockSearchParams = new URLSearchParams();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: () => [mockSearchParams, mockSetSearchParams],
}));

describe('Patients Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = new URLSearchParams();

    // Default mock responses
    mockElectronAPI.database.execute.mockImplementation((operation: string) => {
      if (operation === 'get-patients') {
        return Promise.resolve({
          success: true,
          data: {
            items: [
              createMockPatient({ patientID: 1, firstName: 'John', lastName: 'Doe', mrn: 'MRN-2024-0001' }),
              createMockPatient({ patientID: 2, firstName: 'Jane', lastName: 'Smith', mrn: 'MRN-2024-0002' }),
            ],
            total: 2,
          },
        });
      }
      if (operation === 'search-patients') {
        return Promise.resolve({
          success: true,
          data: [createMockPatient({ firstName: 'John', lastName: 'Doe' })],
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
      if (operation === 'get-patient-packages') {
        return Promise.resolve({ success: true, data: [] });
      }
      if (operation === 'get-packages') {
        return Promise.resolve({ success: true, data: [] });
      }
      return Promise.resolve({ success: true, data: null });
    });
  });

  describe('Rendering', () => {
    it('should render patients page title', async () => {
      render(<Patients />);

      expect(screen.getByText('Patients')).toBeInTheDocument();
    });

    it('should render new patient button', async () => {
      render(<Patients />);

      expect(screen.getByRole('button', { name: /new patient/i })).toBeInTheDocument();
    });

    it('should render search input', async () => {
      render(<Patients />);

      expect(screen.getByPlaceholderText(/search by phone.*name.*mrn/i)).toBeInTheDocument();
    });

    it('should render patients table with headers', async () => {
      render(<Patients />);

      await waitFor(() => {
        expect(screen.getByText('MRN')).toBeInTheDocument();
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Phone')).toBeInTheDocument();
        expect(screen.getByText('City')).toBeInTheDocument();
        expect(screen.getByText('Registered')).toBeInTheDocument();
      });
    });
  });

  describe('Loading Patients', () => {
    it('should display loading indicator while fetching', () => {
      mockElectronAPI.database.execute.mockImplementation(() => new Promise(() => {}));

      render(<Patients />);

      expect(screen.getByTestId('table-skeleton')).toBeInTheDocument();
    });

    it('should display patients after loading', async () => {
      render(<Patients />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    it('should display MRN chips', async () => {
      render(<Patients />);

      await waitFor(() => {
        expect(screen.getByText('MRN-2024-0001')).toBeInTheDocument();
        expect(screen.getByText('MRN-2024-0002')).toBeInTheDocument();
      });
    });

    it('should show empty state when no patients', async () => {
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
        expect(screen.getByText('No patients yet')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Search Functionality', () => {
    it('should search patients when typing in search box', async () => {
      render(<Patients />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search by phone.*name.*mrn/i);
      await userEvent.type(searchInput, '0300');

      await waitFor(() => {
        expect(mockElectronAPI.database.execute).toHaveBeenCalledWith(
          'search-patients',
          expect.objectContaining({ query: '0300' })
        );
      });
    });

    it('should show no results message when search returns empty', async () => {
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

      const searchInput = screen.getByPlaceholderText(/search by phone.*name.*mrn/i);
      await userEvent.type(searchInput, 'nonexistent');

      await waitFor(() => {
        expect(screen.getByText('No patients found')).toBeInTheDocument();
      });
    });

    it('should clear search when clicking clear button', async () => {
      render(<Patients />);

      const searchInput = screen.getByPlaceholderText(/search by phone.*name.*mrn/i);
      await userEvent.type(searchInput, '0300');

      const clearButton = screen.getByRole('button', { name: /clear search/i });
      await userEvent.click(clearButton);

      expect(searchInput).toHaveValue('');
    });
  });

  describe('New Patient Dialog', () => {
    it('should open form dialog when New Patient button clicked', async () => {
      render(<Patients />);

      const newPatientButton = screen.getByRole('button', { name: /new patient/i });
      await userEvent.click(newPatientButton);

      await waitFor(() => {
        expect(screen.getByText('Register New Patient')).toBeInTheDocument();
      });
    });

    it('should open form dialog when URL has action=new', async () => {
      mockSearchParams = new URLSearchParams('action=new');

      render(<Patients />);

      await waitFor(() => {
        expect(screen.getByText('Register New Patient')).toBeInTheDocument();
      });
    });

    it('should render patient form fields in dialog', async () => {
      render(<Patients />);

      const newPatientButton = screen.getByRole('button', { name: /new patient/i });
      await userEvent.click(newPatientButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/whatsapp/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument();
      });
    });
  });

  describe('Patient Form Validation', () => {
    it('should show error when first name is empty', async () => {
      render(<Patients />);

      const newPatientButton = screen.getByRole('button', { name: /new patient/i });
      await userEvent.click(newPatientButton);

      await waitFor(() => {
        expect(screen.getByText('Register New Patient')).toBeInTheDocument();
      });

      // Fill in phone but leave first name empty
      const phoneInput = screen.getByLabelText(/phone number/i);
      await userEvent.type(phoneInput, '03001234567');

      const submitButton = screen.getByRole('button', { name: /register patient/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('First name is required')).toBeInTheDocument();
      });
    });

    it('should show error when phone is empty', async () => {
      render(<Patients />);

      const newPatientButton = screen.getByRole('button', { name: /new patient/i });
      await userEvent.click(newPatientButton);

      await waitFor(() => {
        expect(screen.getByText('Register New Patient')).toBeInTheDocument();
      });

      // Fill in first name but leave phone empty
      const firstNameInput = screen.getByLabelText(/first name/i);
      await userEvent.type(firstNameInput, 'John');

      const submitButton = screen.getByRole('button', { name: /register patient/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Phone number is required')).toBeInTheDocument();
      });
    });

    it('should show error for invalid phone format', async () => {
      render(<Patients />);

      const newPatientButton = screen.getByRole('button', { name: /new patient/i });
      await userEvent.click(newPatientButton);

      await waitFor(() => {
        expect(screen.getByText('Register New Patient')).toBeInTheDocument();
      });

      const firstNameInput = screen.getByLabelText(/first name/i);
      await userEvent.type(firstNameInput, 'John');

      const phoneInput = screen.getByLabelText(/phone number/i);
      await userEvent.type(phoneInput, 'invalid-phone');

      const submitButton = screen.getByRole('button', { name: /register patient/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid phone number format')).toBeInTheDocument();
      });
    });

    it('should show error for invalid email format', async () => {
      render(<Patients />);

      const newPatientButton = screen.getByRole('button', { name: /new patient/i });
      await userEvent.click(newPatientButton);

      await waitFor(() => {
        expect(screen.getByText('Register New Patient')).toBeInTheDocument();
      });

      const firstNameInput = screen.getByLabelText(/first name/i);
      await userEvent.type(firstNameInput, 'John');

      const phoneInput = screen.getByLabelText(/phone number/i);
      await userEvent.type(phoneInput, '03001234567');

      const emailInput = screen.getByLabelText(/email/i);
      await userEvent.type(emailInput, 'invalid-email');

      const submitButton = screen.getByRole('button', { name: /register patient/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid email format')).toBeInTheDocument();
      });
    });
  });

  describe('Creating Patient', () => {
    it('should create patient with valid data', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-patients') {
          return Promise.resolve({
            success: true,
            data: { items: [], total: 0 },
          });
        }
        if (operation === 'create-patient') {
          return Promise.resolve({
            success: true,
            data: { patientID: 1, mrn: 'MRN-2024-0003' },
          });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Patients />);

      const newPatientButton = screen.getByRole('button', { name: /new patient/i });
      await userEvent.click(newPatientButton);

      await waitFor(() => {
        expect(screen.getByText('Register New Patient')).toBeInTheDocument();
      });

      const firstNameInput = screen.getByLabelText(/first name/i);
      await userEvent.type(firstNameInput, 'John');

      const phoneInput = screen.getByLabelText(/phone number/i);
      await userEvent.type(phoneInput, '03001234567');

      const submitButton = screen.getByRole('button', { name: /register patient/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockElectronAPI.database.execute).toHaveBeenCalledWith(
          'create-patient',
          expect.objectContaining({
            firstName: 'John',
            phone: '03001234567',
          })
        );
      });
    });

    it('should show success message after creating patient', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-patients') {
          return Promise.resolve({
            success: true,
            data: { items: [], total: 0 },
          });
        }
        if (operation === 'create-patient') {
          return Promise.resolve({
            success: true,
            data: { patientID: 1, mrn: 'MRN-2024-0003' },
          });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Patients />);

      const newPatientButton = screen.getByRole('button', { name: /new patient/i });
      await userEvent.click(newPatientButton);

      await waitFor(() => {
        expect(screen.getByText('Register New Patient')).toBeInTheDocument();
      });

      const firstNameInput = screen.getByLabelText(/first name/i);
      await userEvent.type(firstNameInput, 'John');

      const phoneInput = screen.getByLabelText(/phone number/i);
      await userEvent.type(phoneInput, '03001234567');

      const submitButton = screen.getByRole('button', { name: /register patient/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/patient registered with mrn.*MRN-2024-0003/i)).toBeInTheDocument();
      });
    });
  });

  describe('Patient Profile', () => {
    it('should open profile dialog when clicking patient row', async () => {
      render(<Patients />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const patientRow = screen.getByText('John Doe').closest('tr');
      if (patientRow) {
        await userEvent.click(patientRow);
      }

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should display patient info in profile', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-patients') {
          return Promise.resolve({
            success: true,
            data: {
              items: [
                createMockPatient({
                  patientID: 1,
                  firstName: 'John',
                  lastName: 'Doe',
                  phone: '03001234567',
                  city: 'Karachi',
                  mrn: 'MRN-2024-0001',
                }),
              ],
              total: 1,
            },
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
        if (operation === 'get-patient-packages') {
          return Promise.resolve({ success: true, data: [] });
        }
        if (operation === 'get-packages') {
          return Promise.resolve({ success: true, data: [] });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Patients />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const patientRow = screen.getByText('John Doe').closest('tr');
      if (patientRow) {
        await userEvent.click(patientRow);
      }

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(within(dialog).getByText('03001234567')).toBeInTheDocument();
      });
    });

    it('should display visits tab in profile', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-patients') {
          return Promise.resolve({
            success: true,
            data: {
              items: [createMockPatient()],
              total: 1,
            },
          });
        }
        if (operation === 'get-patient-visits') {
          return Promise.resolve({
            success: true,
            data: [
              createMockVisit({ visitID: 1, visitDate: '2024-01-15', startTime: '10:00' }),
            ],
          });
        }
        if (operation === 'get-patient-invoices') {
          return Promise.resolve({ success: true, data: [] });
        }
        if (operation === 'get-attachments') {
          return Promise.resolve({ success: true, data: [] });
        }
        if (operation === 'get-patient-packages') {
          return Promise.resolve({ success: true, data: [] });
        }
        if (operation === 'get-packages') {
          return Promise.resolve({ success: true, data: [] });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Patients />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const patientRow = screen.getByText('John Doe').closest('tr');
      if (patientRow) {
        await userEvent.click(patientRow);
      }

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /visits/i })).toBeInTheDocument();
      });
    });

    it('should show empty state when no visits', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-patients') {
          return Promise.resolve({
            success: true,
            data: {
              items: [createMockPatient()],
              total: 1,
            },
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
        if (operation === 'get-patient-packages') {
          return Promise.resolve({ success: true, data: [] });
        }
        if (operation === 'get-packages') {
          return Promise.resolve({ success: true, data: [] });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Patients />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const patientRow = screen.getByText('John Doe').closest('tr');
      if (patientRow) {
        await userEvent.click(patientRow);
      }

      // Wait for profile dialog and click on Visits tab
      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /visits/i })).toBeInTheDocument();
      });

      const visitsTab = screen.getByRole('tab', { name: /visits/i });
      await userEvent.click(visitsTab);

      await waitFor(() => {
        expect(screen.getByText('No visits recorded')).toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    it('should display pagination controls', async () => {
      render(<Patients />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      expect(screen.getByRole('combobox')).toBeInTheDocument(); // Rows per page select
    });

    it('should call API with correct pagination params', async () => {
      render(<Patients />);

      await waitFor(() => {
        expect(mockElectronAPI.database.execute).toHaveBeenCalledWith(
          'get-patients',
          expect.objectContaining({ limit: 10, offset: 0 })
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockElectronAPI.database.execute.mockRejectedValueOnce(new Error('API Error'));

      render(<Patients />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });
});
