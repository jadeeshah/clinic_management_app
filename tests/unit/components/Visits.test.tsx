/**
 * Visits Component Tests
 */

import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, createMockVisit, createMockDoctor, createMockPatient } from '../../utils/testUtils';
import Visits from '../../../src/renderer/pages/Visits';
import { mockElectronAPI } from '../../setupTests';

// Mock useSearchParams
const mockSetSearchParams = jest.fn();
let mockSearchParams = new URLSearchParams();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: () => [mockSearchParams, mockSetSearchParams],
}));

describe('Visits Component', () => {
  const mockDoctors = [
    createMockDoctor({ doctorID: 1, firstName: 'Sarah', lastName: 'Smith' }),
    createMockDoctor({ doctorID: 2, firstName: 'John', lastName: 'Brown' }),
  ];

  const mockPatients = [
    createMockPatient({ patientID: 1, firstName: 'John', lastName: 'Doe' }),
    createMockPatient({ patientID: 2, firstName: 'Jane', lastName: 'Smith' }),
  ];

  const mockVisits = [
    createMockVisit({
      visitID: 1,
      patientName: 'John Doe',
      doctorName: 'Sarah Smith',
      visitDate: '2024-01-15',
      startTime: '10:00',
      status: 'Scheduled',
      visitType: 'TherapySession',
    }),
    createMockVisit({
      visitID: 2,
      patientName: 'Jane Smith',
      doctorName: 'John Brown',
      visitDate: '2024-01-15',
      startTime: '11:00',
      status: 'Completed',
      visitType: 'Evaluation',
    }),
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = new URLSearchParams();

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
  });

  describe('Rendering', () => {
    it('should render visits page title', async () => {
      render(<Visits />);

      expect(screen.getByText('Visits')).toBeInTheDocument();
    });

    it('should render new visit button', async () => {
      render(<Visits />);

      expect(screen.getByRole('button', { name: /new visit/i })).toBeInTheDocument();
    });

    it('should render filter controls', async () => {
      render(<Visits />);

      await waitFor(() => {
        // Check for filter labels (MUI renders them in multiple elements)
        expect(screen.getAllByText('From Date').length).toBeGreaterThan(0);
        expect(screen.getAllByText('To Date').length).toBeGreaterThan(0);
      });
    });

    it('should render visits table headers', async () => {
      render(<Visits />);

      await waitFor(() => {
        expect(screen.getByText('Date & Time')).toBeInTheDocument();
        expect(screen.getByText('Patient')).toBeInTheDocument();
        expect(screen.getByText('Actions')).toBeInTheDocument();
      });

      // Check table has rows
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });
  });

  describe('Loading Visits', () => {
    it('should display loading indicator while fetching', () => {
      mockElectronAPI.database.execute.mockImplementation(() => new Promise(() => {}));

      render(<Visits />);

      expect(screen.getByTestId('table-skeleton')).toBeInTheDocument();
    });

    it('should display visits after loading', async () => {
      render(<Visits />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    it('should display doctor names', async () => {
      render(<Visits />);

      await waitFor(() => {
        expect(screen.getByText('Dr. Sarah Smith')).toBeInTheDocument();
        expect(screen.getByText('Dr. John Brown')).toBeInTheDocument();
      });
    });

    it('should show empty state when no visits', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-visits') {
          return Promise.resolve({
            success: true,
            data: { items: [], total: 0 },
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
        expect(screen.getByText('No visits found')).toBeInTheDocument();
      });
    });
  });

  describe('Status Chips', () => {
    it('should display status chip for scheduled visits', async () => {
      render(<Visits />);

      await waitFor(() => {
        const scheduledChip = screen.getByText('Scheduled');
        expect(scheduledChip).toBeInTheDocument();
      });
    });

    it('should display status chip for completed visits', async () => {
      render(<Visits />);

      await waitFor(() => {
        const completedChip = screen.getByText('Completed');
        expect(completedChip).toBeInTheDocument();
      });
    });
  });

  describe('Visit Type Display', () => {
    it('should display therapy session type correctly', async () => {
      render(<Visits />);

      await waitFor(() => {
        expect(screen.getByText('Therapy Session')).toBeInTheDocument();
      });
    });

    it('should display evaluation type correctly', async () => {
      render(<Visits />);

      await waitFor(() => {
        expect(screen.getByText('Evaluation')).toBeInTheDocument();
      });
    });
  });

  describe('New Visit Dialog', () => {
    it('should open form dialog when New Visit button clicked', async () => {
      render(<Visits />);

      const newVisitButton = screen.getByRole('button', { name: /new visit/i });
      await userEvent.click(newVisitButton);

      await waitFor(() => {
        expect(screen.getByText('Schedule New Visit')).toBeInTheDocument();
      });
    });

    it('should open form dialog when URL has action=new', async () => {
      mockSearchParams = new URLSearchParams('action=new');

      render(<Visits />);

      await waitFor(() => {
        expect(screen.getByText('Schedule New Visit')).toBeInTheDocument();
      });
    });

    it('should render visit form fields in dialog', async () => {
      render(<Visits />);

      const newVisitButton = screen.getByRole('button', { name: /new visit/i });
      await userEvent.click(newVisitButton);

      await waitFor(() => {
        expect(screen.getByText('Schedule New Visit')).toBeInTheDocument();
        // Check for key form elements
        expect(screen.getByRole('button', { name: /schedule visit/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });
    });
  });

  describe('Visit Form Validation', () => {
    it('should show validation errors when submitting empty form', async () => {
      render(<Visits />);

      const newVisitButton = screen.getByRole('button', { name: /new visit/i });
      await userEvent.click(newVisitButton);

      await waitFor(() => {
        expect(screen.getByText('Schedule New Visit')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /schedule visit/i });
      await userEvent.click(submitButton);

      // Should show validation errors (at least one of them)
      await waitFor(() => {
        const patientError = screen.queryByText('Please select a patient');
        const doctorError = screen.queryByText('Please select a doctor');
        expect(patientError || doctorError).toBeTruthy();
      });
    });
  });

  describe('Status Actions', () => {
    it('should update status when clicking start session button', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string, data?: unknown) => {
        if (operation === 'get-visits') {
          return Promise.resolve({
            success: true,
            data: { items: mockVisits, total: 2 },
          });
        }
        if (operation === 'update-visit-status') {
          return Promise.resolve({ success: true });
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
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Find and click start session button (first visit is Scheduled)
      const startButtons = screen.getAllByRole('button', { name: /start session/i });
      if (startButtons.length > 0) {
        await userEvent.click(startButtons[0]);
      }

      await waitFor(() => {
        expect(mockElectronAPI.database.execute).toHaveBeenCalledWith(
          'update-visit-status',
          expect.objectContaining({ visitID: 1, status: 'InProgress' })
        );
      });
    });

    it('should show success message after status update', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-visits') {
          return Promise.resolve({
            success: true,
            data: { items: mockVisits, total: 2 },
          });
        }
        if (operation === 'update-visit-status') {
          return Promise.resolve({ success: true });
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
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const startButtons = screen.getAllByRole('button', { name: /start session/i });
      if (startButtons.length > 0) {
        await userEvent.click(startButtons[0]);
      }

      await waitFor(() => {
        expect(screen.getByText(/visit marked as inprogress/i)).toBeInTheDocument();
      });
    });
  });

  describe('Filtering', () => {
    it('should render filter section', async () => {
      render(<Visits />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Filter section should have date inputs (MUI renders labels in multiple elements)
      expect(screen.getAllByText('From Date').length).toBeGreaterThan(0);
      expect(screen.getAllByText('To Date').length).toBeGreaterThan(0);
    });

    it('should load doctors for filter dropdown', async () => {
      render(<Visits />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Doctors API should have been called
      await waitFor(() => {
        expect(mockElectronAPI.database.execute).toHaveBeenCalledWith('get-doctors');
      });
    });

    it('should have date range filter inputs', async () => {
      render(<Visits />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Check that date filter inputs are rendered
      const dateInputs = screen.getAllByDisplayValue(/\d{4}-\d{2}-\d{2}|/);
      expect(dateInputs.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Edit Visit', () => {
    it('should open edit dialog when clicking edit button', async () => {
      render(<Visits />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      if (editButtons.length > 0) {
        await userEvent.click(editButtons[0]);
      }

      await waitFor(() => {
        expect(screen.getByText('Edit Visit')).toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    it('should display pagination controls', async () => {
      render(<Visits />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Check for rows per page text which indicates pagination is present
      expect(screen.getByText(/rows per page/i)).toBeInTheDocument();
    });

    it('should call API with pagination params', async () => {
      render(<Visits />);

      await waitFor(() => {
        expect(mockElectronAPI.database.execute).toHaveBeenCalledWith(
          'get-visits',
          expect.objectContaining({ limit: 10, offset: 0 })
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockElectronAPI.database.execute.mockRejectedValueOnce(new Error('API Error'));

      render(<Visits />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    it('should show error message when status update fails', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-visits') {
          return Promise.resolve({
            success: true,
            data: { items: mockVisits, total: 2 },
          });
        }
        if (operation === 'update-visit-status') {
          return Promise.resolve({ success: false, error: 'Update failed' });
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
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const startButtons = screen.getAllByRole('button', { name: /start session/i });
      if (startButtons.length > 0) {
        await userEvent.click(startButtons[0]);
      }

      await waitFor(() => {
        expect(screen.getByText('Failed to update status')).toBeInTheDocument();
      });
    });
  });
});
