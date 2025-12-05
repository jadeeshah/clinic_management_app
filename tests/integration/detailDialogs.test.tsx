/**
 * Detail Dialogs Integration Tests
 * Tests the detail dialog functionality including:
 * - Visit Detail Dialog
 * - Doctor Detail Dialog
 * - Invoice creation from dialogs
 */

import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, createMockVisit, createMockDoctor, createMockPatient } from '../utils/testUtils';
import Visits from '../../src/renderer/pages/Visits';
import Doctors from '../../src/renderer/pages/Doctors';
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

describe('Detail Dialogs Integration Tests', () => {
  const mockDoctors = [
    createMockDoctor({
      doctorID: 1,
      firstName: 'Sarah',
      lastName: 'Khan',
      education: 'DPT, MS',
      designation: 'Senior Physiotherapist',
      specialization: 'Orthopedic Rehabilitation',
      sessionCharge: 2000,
      phone: '03001234567',
      email: 'sarah@clinic.com',
      availableDays: ['Monday', 'Wednesday', 'Friday'],
      startTime: '09:00',
      endTime: '17:00',
      isActive: true,
    }),
    createMockDoctor({
      doctorID: 2,
      firstName: 'Ahmed',
      lastName: 'Ali',
      education: 'MBBS, FCPS',
      designation: 'Consultant',
      specialization: 'Sports Medicine',
      sessionCharge: 2500,
      phone: '03009876543',
      email: 'ahmed@clinic.com',
      availableDays: ['Tuesday', 'Thursday', 'Saturday'],
      startTime: '10:00',
      endTime: '18:00',
      isActive: true,
    }),
  ];

  const mockPatients = [
    createMockPatient({ patientID: 1, firstName: 'Ali', lastName: 'Khan', phone: '03001234567' }),
    createMockPatient({ patientID: 2, firstName: 'Sara', lastName: 'Ahmed', phone: '03009876543' }),
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  describe('Doctor Detail Dialog', () => {
    it('should open detail dialog when clicking on doctor row', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-doctors') {
          return Promise.resolve({ success: true, data: mockDoctors });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Doctors />);

      await waitFor(() => {
        expect(screen.getByText('Sarah Khan')).toBeInTheDocument();
      });

      // Click on the doctor row (not the edit button)
      const row = screen.getByText('Sarah Khan').closest('tr');
      if (row) {
        await userEvent.click(row);
      }

      // Verify detail dialog opens - check for dialog role first
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Then check for doctor name in the dialog (text may be split across elements)
      await waitFor(() => {
        expect(screen.getByText(/Dr\. Sarah Khan/)).toBeInTheDocument();
      });
    });

    it('should display doctor information in detail dialog', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-doctors') {
          return Promise.resolve({ success: true, data: mockDoctors });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Doctors />);

      await waitFor(() => {
        expect(screen.getByText('Sarah Khan')).toBeInTheDocument();
      });

      // Click on the doctor row
      const row = screen.getByText('Sarah Khan').closest('tr');
      if (row) {
        await userEvent.click(row);
      }

      // Wait for dialog to open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Check designation (in dialog)
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('Senior Physiotherapist')).toBeInTheDocument();

      // Check education
      expect(within(dialog).getByText('DPT, MS')).toBeInTheDocument();

      // Check session charge (format may vary)
      expect(within(dialog).getByText(/Rs\s*2,000/)).toBeInTheDocument();

      // Check contact info - may appear multiple times so check within dialog
      expect(within(dialog).getAllByText('03001234567').length).toBeGreaterThan(0);
      expect(within(dialog).getByText('sarah@clinic.com')).toBeInTheDocument();
    });

    it('should display available days in detail dialog', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-doctors') {
          return Promise.resolve({ success: true, data: mockDoctors });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Doctors />);

      await waitFor(() => {
        expect(screen.getByText('Sarah Khan')).toBeInTheDocument();
      });

      // Click on the doctor row
      const row = screen.getByText('Sarah Khan').closest('tr');
      if (row) {
        await userEvent.click(row);
      }

      // Wait for dialog to open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Check available days are shown in dialog
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('Monday')).toBeInTheDocument();
      expect(within(dialog).getByText('Wednesday')).toBeInTheDocument();
      expect(within(dialog).getByText('Friday')).toBeInTheDocument();
    });

    it('should display working hours in detail dialog', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-doctors') {
          return Promise.resolve({ success: true, data: mockDoctors });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Doctors />);

      await waitFor(() => {
        expect(screen.getByText('Sarah Khan')).toBeInTheDocument();
      });

      // Click on the doctor row
      const row = screen.getByText('Sarah Khan').closest('tr');
      if (row) {
        await userEvent.click(row);
      }

      // Wait for dialog to open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Check working hours
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('09:00 - 17:00')).toBeInTheDocument();
    });

    it('should open edit dialog when clicking Edit button in detail dialog', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-doctors') {
          return Promise.resolve({ success: true, data: mockDoctors });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Doctors />);

      await waitFor(() => {
        expect(screen.getByText('Sarah Khan')).toBeInTheDocument();
      });

      // Click on the doctor row to open detail dialog
      const row = screen.getByText('Sarah Khan').closest('tr');
      if (row) {
        await userEvent.click(row);
      }

      // Wait for detail dialog
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Click Edit button in the detail dialog
      const dialog = screen.getByRole('dialog');
      const editButton = within(dialog).getByRole('button', { name: /edit/i });
      await userEvent.click(editButton);

      // Verify edit dialog opens
      await waitFor(() => {
        expect(screen.getByText('Edit Doctor')).toBeInTheDocument();
      });
    });

    it('should close detail dialog when clicking Close button', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-doctors') {
          return Promise.resolve({ success: true, data: mockDoctors });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Doctors />);

      await waitFor(() => {
        expect(screen.getByText('Sarah Khan')).toBeInTheDocument();
      });

      // Click on the doctor row to open detail dialog
      const row = screen.getByText('Sarah Khan').closest('tr');
      if (row) {
        await userEvent.click(row);
      }

      // Wait for detail dialog
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Click Close button
      const dialog = screen.getByRole('dialog');
      const closeButton = within(dialog).getByRole('button', { name: /close/i });
      await userEvent.click(closeButton);

      // Verify dialog is closed
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Visit Detail Dialog', () => {
    const mockVisits = [
      createMockVisit({
        visitID: 1,
        patientID: 1,
        doctorID: 1,
        patientName: 'Ali Khan',
        patientPhone: '03001234567',
        doctorName: 'Sarah Smith',
        status: 'Completed',
        visitType: 'TherapySession',
        visitDate: '2024-01-15',
        startTime: '09:00',
        endTime: '09:45',
        duration: 45,
        notes: 'Patient showing good progress. Continue with exercises.',
      }),
      createMockVisit({
        visitID: 2,
        patientID: 2,
        doctorID: 2,
        patientName: 'Sara Ahmed',
        patientPhone: '03009876543',
        doctorName: 'John Brown',
        status: 'Scheduled',
        visitType: 'Evaluation',
        visitDate: '2024-01-16',
        startTime: '10:00',
        duration: 60,
      }),
    ];

    it('should open detail dialog when clicking on visit row', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-visits') {
          return Promise.resolve({
            success: true,
            data: { items: mockVisits, total: 2 },
          });
        }
        if (operation === 'get-doctors') {
          return Promise.resolve({ success: true, data: mockDoctors });
        }
        if (operation === 'get-patients') {
          return Promise.resolve({
            success: true,
            data: { items: mockPatients, total: 2 },
          });
        }
        if (operation === 'get-settings') {
          return Promise.resolve({
            success: true,
            data: { defaultVisitDuration: 45 },
          });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Visits />);

      await waitFor(() => {
        expect(screen.getByText('Ali Khan')).toBeInTheDocument();
      });

      // Click on the visit row
      const row = screen.getByText('Ali Khan').closest('tr');
      if (row) {
        await userEvent.click(row);
      }

      // Verify detail dialog opens (check for dialog role)
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should display visit information in detail dialog', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-visits') {
          return Promise.resolve({
            success: true,
            data: { items: mockVisits, total: 2 },
          });
        }
        if (operation === 'get-doctors') {
          return Promise.resolve({ success: true, data: mockDoctors });
        }
        if (operation === 'get-patients') {
          return Promise.resolve({
            success: true,
            data: { items: mockPatients, total: 2 },
          });
        }
        if (operation === 'get-settings') {
          return Promise.resolve({
            success: true,
            data: { defaultVisitDuration: 45 },
          });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Visits />);

      await waitFor(() => {
        expect(screen.getByText('Ali Khan')).toBeInTheDocument();
      });

      // Click on the visit row
      const row = screen.getByText('Ali Khan').closest('tr');
      if (row) {
        await userEvent.click(row);
      }

      // Verify dialog shows patient info
      await waitFor(() => {
        // Patient name in dialog (there may be multiple instances)
        const patientNames = screen.getAllByText('Ali Khan');
        expect(patientNames.length).toBeGreaterThan(0);
      });

      // Check phone number is displayed (may appear multiple times)
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getAllByText('03001234567').length).toBeGreaterThan(0);

      // Check doctor info
      expect(within(dialog).getByText('Dr. Sarah Smith')).toBeInTheDocument();

      // Check duration
      expect(within(dialog).getByText('45 minutes')).toBeInTheDocument();
    });

    it('should display visit notes in detail dialog', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-visits') {
          return Promise.resolve({
            success: true,
            data: { items: mockVisits, total: 2 },
          });
        }
        if (operation === 'get-doctors') {
          return Promise.resolve({ success: true, data: mockDoctors });
        }
        if (operation === 'get-patients') {
          return Promise.resolve({
            success: true,
            data: { items: mockPatients, total: 2 },
          });
        }
        if (operation === 'get-settings') {
          return Promise.resolve({
            success: true,
            data: { defaultVisitDuration: 45 },
          });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Visits />);

      await waitFor(() => {
        expect(screen.getByText('Ali Khan')).toBeInTheDocument();
      });

      // Click on the visit row
      const row = screen.getByText('Ali Khan').closest('tr');
      if (row) {
        await userEvent.click(row);
      }

      // Verify notes are displayed
      await waitFor(() => {
        expect(screen.getByText('Patient showing good progress. Continue with exercises.')).toBeInTheDocument();
      });
    });

    it('should show Create Invoice button for completed visits', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-visits') {
          return Promise.resolve({
            success: true,
            data: { items: mockVisits, total: 2 },
          });
        }
        if (operation === 'get-doctors') {
          return Promise.resolve({ success: true, data: mockDoctors });
        }
        if (operation === 'get-patients') {
          return Promise.resolve({
            success: true,
            data: { items: mockPatients, total: 2 },
          });
        }
        if (operation === 'get-settings') {
          return Promise.resolve({
            success: true,
            data: { defaultVisitDuration: 45 },
          });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Visits />);

      await waitFor(() => {
        expect(screen.getByText('Ali Khan')).toBeInTheDocument();
      });

      // Click on the completed visit row
      const row = screen.getByText('Ali Khan').closest('tr');
      if (row) {
        await userEvent.click(row);
      }

      // Verify Create Invoice button is present in dialog
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        const createInvoiceBtn = within(dialog).getByRole('button', { name: /create invoice/i });
        expect(createInvoiceBtn).toBeInTheDocument();
      });
    });

    it('should navigate to billing when clicking Create Invoice in detail dialog', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-visits') {
          return Promise.resolve({
            success: true,
            data: { items: mockVisits, total: 2 },
          });
        }
        if (operation === 'get-doctors') {
          return Promise.resolve({ success: true, data: mockDoctors });
        }
        if (operation === 'get-patients') {
          return Promise.resolve({
            success: true,
            data: { items: mockPatients, total: 2 },
          });
        }
        if (operation === 'get-settings') {
          return Promise.resolve({
            success: true,
            data: { defaultVisitDuration: 45 },
          });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Visits />);

      await waitFor(() => {
        expect(screen.getByText('Ali Khan')).toBeInTheDocument();
      });

      // Click on the completed visit row
      const row = screen.getByText('Ali Khan').closest('tr');
      if (row) {
        await userEvent.click(row);
      }

      // Wait for dialog to open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Click Create Invoice button in dialog
      const dialog = screen.getByRole('dialog');
      const createInvoiceBtn = within(dialog).getByRole('button', { name: /create invoice/i });
      await userEvent.click(createInvoiceBtn);

      // Verify navigation was called with correct params
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/billing?patientId=1&visitId=1');
      });
    });

    it('should open edit dialog when clicking Edit in detail dialog', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-visits') {
          return Promise.resolve({
            success: true,
            data: { items: mockVisits, total: 2 },
          });
        }
        if (operation === 'get-doctors') {
          return Promise.resolve({ success: true, data: mockDoctors });
        }
        if (operation === 'get-patients') {
          return Promise.resolve({
            success: true,
            data: { items: mockPatients, total: 2 },
          });
        }
        if (operation === 'get-settings') {
          return Promise.resolve({
            success: true,
            data: { defaultVisitDuration: 45 },
          });
        }
        if (operation === 'search-patients') {
          return Promise.resolve({ success: true, data: mockPatients });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Visits />);

      await waitFor(() => {
        expect(screen.getByText('Ali Khan')).toBeInTheDocument();
      });

      // Click on the visit row
      const row = screen.getByText('Ali Khan').closest('tr');
      if (row) {
        await userEvent.click(row);
      }

      // Wait for detail dialog
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Click Edit button in detail dialog
      const dialog = screen.getByRole('dialog');
      const editBtn = within(dialog).getByRole('button', { name: /edit/i });
      await userEvent.click(editBtn);

      // Verify edit dialog opens
      await waitFor(() => {
        expect(screen.getByText('Edit Visit')).toBeInTheDocument();
      });
    });
  });

});
