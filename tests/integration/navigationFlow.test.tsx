/**
 * Navigation Flow Integration Tests
 * Tests navigation between different pages and components:
 * - Dashboard quick actions navigation
 * - URL parameter handling
 * - Cross-component data flow
 */

import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, createMockDashboardStats, createMockPatient, createMockVisit, createMockDoctor } from '../utils/testUtils';
import Dashboard from '../../src/renderer/pages/Dashboard';
import Patients from '../../src/renderer/pages/Patients';
import Visits from '../../src/renderer/pages/Visits';
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

describe('Navigation Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  describe('Dashboard Quick Actions', () => {
    beforeEach(() => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-dashboard-stats') {
          return Promise.resolve({
            success: true,
            data: createMockDashboardStats(),
          });
        }
        return Promise.resolve({ success: true, data: null });
      });
    });

    it('should navigate to new visit page when clicking New Visit card', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('New Visit')).toBeInTheDocument();
      });

      const newVisitCard = screen.getByText('New Visit').closest('button');
      if (newVisitCard) {
        await userEvent.click(newVisitCard);
      }

      expect(mockNavigate).toHaveBeenCalledWith('/visits?action=new');
    });

    it('should navigate to new patient page when clicking New Patient card', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('New Patient')).toBeInTheDocument();
      });

      const newPatientCard = screen.getByText('New Patient').closest('button');
      if (newPatientCard) {
        await userEvent.click(newPatientCard);
      }

      expect(mockNavigate).toHaveBeenCalledWith('/patients?action=new');
    });

    it('should navigate to schedule visit from empty state', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-dashboard-stats') {
          return Promise.resolve({
            success: true,
            data: createMockDashboardStats({ todaySchedule: [] }),
          });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/no visits scheduled for today/i)).toBeInTheDocument();
      });

      const scheduleButton = screen.getByRole('button', { name: /schedule a visit/i });
      await userEvent.click(scheduleButton);

      expect(mockNavigate).toHaveBeenCalledWith('/visits?action=new');
    });
  });

  describe('URL Parameter Handling', () => {
    describe('Patients Page', () => {
      it('should open new patient dialog when URL has action=new', async () => {
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

        await waitFor(() => {
          expect(screen.getByText('Register New Patient')).toBeInTheDocument();
        });

        // URL params should be cleared after opening dialog
        expect(mockSetSearchParams).toHaveBeenCalledWith({});
      });
    });

    describe('Visits Page', () => {
      it('should open new visit dialog when URL has action=new', async () => {
        mockSearchParams = new URLSearchParams('action=new');

        mockElectronAPI.database.execute.mockImplementation((operation: string) => {
          if (operation === 'get-visits') {
            return Promise.resolve({
              success: true,
              data: { items: [], total: 0 },
            });
          }
          if (operation === 'get-doctors') {
            return Promise.resolve({
              success: true,
              data: [createMockDoctor()],
            });
          }
          if (operation === 'get-patients') {
            return Promise.resolve({
              success: true,
              data: { items: [createMockPatient()], total: 1 },
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
          expect(screen.getByText('Schedule New Visit')).toBeInTheDocument();
        });

        // URL params should be cleared after opening dialog
        expect(mockSetSearchParams).toHaveBeenCalledWith({});
      });
    });
  });

  describe('Stats Display Integration', () => {
    it('should display correct stats from dashboard API', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-dashboard-stats') {
          return Promise.resolve({
            success: true,
            data: createMockDashboardStats({
              todayVisits: 15,
              completedVisits: 8,
              monthRevenue: 150000,
              outstandingBalance: 25000,
            }),
          });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Dashboard />);

      await waitFor(() => {
        // Verify today's visits
        expect(screen.getByText('15')).toBeInTheDocument();
        // Verify completed visits
        expect(screen.getByText('8')).toBeInTheDocument();
      });

      // Verify stat labels
      expect(screen.getByText("Today's Visits")).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('This Month')).toBeInTheDocument();
      expect(screen.getByText('Outstanding')).toBeInTheDocument();
    });
  });

  describe('Form Dialog Navigation', () => {
    it('should close dialog and return to list on cancel', async () => {
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

      // Open new patient dialog
      const newPatientButton = screen.getByRole('button', { name: /new patient/i });
      await userEvent.click(newPatientButton);

      await waitFor(() => {
        expect(screen.getByText('Register New Patient')).toBeInTheDocument();
      });

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await userEvent.click(cancelButton);

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByText('Register New Patient')).not.toBeInTheDocument();
      });
    });

    it('should close visit dialog and return to list on cancel', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-visits') {
          return Promise.resolve({
            success: true,
            data: { items: [], total: 0 },
          });
        }
        if (operation === 'get-doctors') {
          return Promise.resolve({
            success: true,
            data: [createMockDoctor()],
          });
        }
        if (operation === 'get-patients') {
          return Promise.resolve({
            success: true,
            data: { items: [createMockPatient()], total: 1 },
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

      // Open new visit dialog
      const newVisitButton = screen.getByRole('button', { name: /new visit/i });
      await userEvent.click(newVisitButton);

      await waitFor(() => {
        expect(screen.getByText('Schedule New Visit')).toBeInTheDocument();
      });

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await userEvent.click(cancelButton);

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByText('Schedule New Visit')).not.toBeInTheDocument();
      });
    });
  });
});
