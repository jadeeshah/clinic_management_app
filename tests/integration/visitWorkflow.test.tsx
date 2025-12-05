/**
 * Visit Workflow Integration Tests
 * Tests the complete visit management flow including:
 * - Scheduling new visits
 * - Updating visit status (start, complete, cancel)
 * - Visit status transitions
 * - Dashboard schedule display
 */

import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, createMockVisit, createMockDoctor, createMockPatient, createMockDashboardStats } from '../utils/testUtils';
import Visits from '../../src/renderer/pages/Visits';
import Dashboard from '../../src/renderer/pages/Dashboard';
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

describe('Visit Workflow Integration Tests', () => {
  const mockDoctors = [
    createMockDoctor({ doctorID: 1, firstName: 'Sarah', lastName: 'Smith', sessionCharge: 2000 }),
    createMockDoctor({ doctorID: 2, firstName: 'John', lastName: 'Brown', sessionCharge: 2500 }),
  ];

  const mockPatients = [
    createMockPatient({ patientID: 1, firstName: 'Ali', lastName: 'Khan', phone: '03001234567' }),
    createMockPatient({ patientID: 2, firstName: 'Sara', lastName: 'Ahmed', phone: '03009876543' }),
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  describe('New Visit Dialog', () => {
    it('should open new visit dialog when clicking New Visit button', async () => {
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

      // Click new visit button
      const newVisitButton = screen.getByRole('button', { name: /new visit/i });
      await userEvent.click(newVisitButton);

      // Wait for dialog
      await waitFor(() => {
        expect(screen.getByText('Schedule New Visit')).toBeInTheDocument();
      });
    });

    it('should open dialog via URL parameter action=new', async () => {
      mockSearchParams = new URLSearchParams('action=new');

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

      // Dialog should open automatically
      await waitFor(() => {
        expect(screen.getByText('Schedule New Visit')).toBeInTheDocument();
      });
    });
  });

  describe('Visit Status Transitions', () => {
    it('should transition visit from Scheduled to InProgress', async () => {
      const mockVisits = [
        createMockVisit({
          visitID: 1,
          patientName: 'Ali Khan',
          doctorName: 'Sarah Smith',
          status: 'Scheduled',
        }),
      ];

      let statusUpdateCall: { visitID: number; status: string } | null = null;

      mockElectronAPI.database.execute.mockImplementation((operation: string, data?: unknown) => {
        if (operation === 'get-visits') {
          return Promise.resolve({
            success: true,
            data: { items: mockVisits, total: 1 },
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
        if (operation === 'update-visit-status') {
          statusUpdateCall = data as { visitID: number; status: string };
          mockVisits[0].status = 'InProgress';
          return Promise.resolve({ success: true });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Visits />);

      // Wait for visits to load
      await waitFor(() => {
        expect(screen.getByText('Ali Khan')).toBeInTheDocument();
      });

      // Click start session button
      const startButton = screen.getByRole('button', { name: /start session/i });
      await userEvent.click(startButton);

      // Verify status update was called
      await waitFor(() => {
        expect(statusUpdateCall).toEqual({
          visitID: 1,
          status: 'InProgress',
        });
      });
    });

    it('should transition visit from InProgress to Completed', async () => {
      const mockVisits = [
        createMockVisit({
          visitID: 1,
          patientName: 'Ali Khan',
          doctorName: 'Sarah Smith',
          status: 'InProgress',
        }),
      ];

      let statusUpdateCall: { visitID: number; status: string } | null = null;

      mockElectronAPI.database.execute.mockImplementation((operation: string, data?: unknown) => {
        if (operation === 'get-visits') {
          return Promise.resolve({
            success: true,
            data: { items: mockVisits, total: 1 },
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
        if (operation === 'update-visit-status') {
          statusUpdateCall = data as { visitID: number; status: string };
          return Promise.resolve({ success: true });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Visits />);

      // Wait for visits to load
      await waitFor(() => {
        expect(screen.getByText('Ali Khan')).toBeInTheDocument();
      });

      // Click complete button
      const completeButton = screen.getByRole('button', { name: /complete/i });
      await userEvent.click(completeButton);

      // Verify status update was called
      await waitFor(() => {
        expect(statusUpdateCall).toEqual({
          visitID: 1,
          status: 'Completed',
        });
      });
    });
  });

  describe('Dashboard Schedule Integration', () => {
    it('should display today\'s scheduled visits on dashboard', async () => {
      const todayVisits = [
        createMockVisit({
          visitID: 1,
          patientName: 'Ali Khan',
          startTime: '09:00',
          status: 'Scheduled',
          doctorName: 'Sarah Smith',
          visitType: 'TherapySession',
        }),
        createMockVisit({
          visitID: 2,
          patientName: 'Sara Ahmed',
          startTime: '10:00',
          status: 'Scheduled',
          doctorName: 'John Brown',
          visitType: 'Evaluation',
        }),
      ];

      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-dashboard-stats') {
          return Promise.resolve({
            success: true,
            data: createMockDashboardStats({
              todayVisits: 2,
              scheduledVisits: 2,
              completedVisits: 0,
              todaySchedule: todayVisits,
            }),
          });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Dashboard />);

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByText("Today's Schedule")).toBeInTheDocument();
      });

      // Verify visits are displayed
      expect(screen.getByText('Ali Khan')).toBeInTheDocument();
      expect(screen.getByText('Sara Ahmed')).toBeInTheDocument();
    });

    it('should show empty state when no visits scheduled', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-dashboard-stats') {
          return Promise.resolve({
            success: true,
            data: createMockDashboardStats({
              todaySchedule: [],
            }),
          });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Dashboard />);

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByText(/no visits scheduled for today/i)).toBeInTheDocument();
      });

      // Verify "Schedule a Visit" button is shown
      expect(screen.getByRole('button', { name: /schedule a visit/i })).toBeInTheDocument();
    });
  });

  describe('Edit Visit Flow', () => {
    it('should open edit dialog when clicking edit button', async () => {
      const mockVisits = [
        createMockVisit({
          visitID: 1,
          patientID: 1,
          doctorID: 1,
          patientName: 'Ali Khan',
          doctorName: 'Sarah Smith',
          status: 'Scheduled',
          notes: 'Initial notes',
        }),
      ];

      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-visits') {
          return Promise.resolve({
            success: true,
            data: { items: mockVisits, total: 1 },
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

      // Wait for visits to load
      await waitFor(() => {
        expect(screen.getByText('Ali Khan')).toBeInTheDocument();
      });

      // Click edit button
      const editButton = screen.getByRole('button', { name: /edit/i });
      await userEvent.click(editButton);

      // Wait for edit dialog
      await waitFor(() => {
        expect(screen.getByText('Edit Visit')).toBeInTheDocument();
      });
    });
  });

  describe('Visit Display', () => {
    it('should display visits list with patient and doctor info', async () => {
      const mockVisits = [
        createMockVisit({
          visitID: 1,
          patientName: 'Ali Khan',
          doctorName: 'Sarah Smith',
          status: 'Scheduled',
          visitType: 'TherapySession',
        }),
        createMockVisit({
          visitID: 2,
          patientName: 'Sara Ahmed',
          doctorName: 'John Brown',
          status: 'Completed',
          visitType: 'Evaluation',
        }),
      ];

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
        expect(screen.getByText('Sara Ahmed')).toBeInTheDocument();
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
});
