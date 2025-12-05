/**
 * Dashboard Component Tests
 */

import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, createMockDashboardStats, createMockVisit, createMockPatient } from '../../utils/testUtils';
import Dashboard from '../../../src/renderer/pages/Dashboard';
import { mockElectronAPI } from '../../setupTests';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock responses
    mockElectronAPI.database.execute.mockImplementation((operation: string) => {
      if (operation === 'get-dashboard-stats') {
        return Promise.resolve({
          success: true,
          data: createMockDashboardStats(),
        });
      }
      if (operation === 'get-doctors') {
        return Promise.resolve({
          success: true,
          data: [],
        });
      }
      if (operation === 'search-patients') {
        return Promise.resolve({
          success: true,
          data: [],
        });
      }
      return Promise.resolve({ success: true, data: null });
    });
  });

  describe('Rendering', () => {
    it('should render search input', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search patients by phone/i)).toBeInTheDocument();
      });
    });

    it('should render quick action cards', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('New Visit')).toBeInTheDocument();
        expect(screen.getByText('Search Patient')).toBeInTheDocument();
        expect(screen.getByText('New Patient')).toBeInTheDocument();
      });
    });

    it('should render stats cards', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText("Today's Visits")).toBeInTheDocument();
        expect(screen.getByText('Completed')).toBeInTheDocument();
        expect(screen.getByText('This Month')).toBeInTheDocument();
        expect(screen.getByText('Outstanding')).toBeInTheDocument();
      });
    });

    it('should display stats values from API', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-dashboard-stats') {
          return Promise.resolve({
            success: true,
            data: createMockDashboardStats({
              todayVisits: 15,
              completedVisits: 10,
              monthRevenue: 75000,
              outstandingBalance: 25000,
            }),
          });
        }
        return Promise.resolve({ success: true, data: [] });
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('15')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument();
      });
    });

    it('should render Today\'s Schedule section', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText("Today's Schedule")).toBeInTheDocument();
      });
    });
  });

  describe('Quick Actions', () => {
    it('should navigate to visits page when New Visit clicked', async () => {
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

    it('should navigate to patients page when New Patient clicked', async () => {
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
  });

  describe('Patient Search', () => {
    it('should render search input', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search patients by phone/i)).toBeInTheDocument();
      });
    });

    it('should search patients when Enter is pressed', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-dashboard-stats') {
          return Promise.resolve({ success: true, data: createMockDashboardStats() });
        }
        if (operation === 'search-patients') {
          return Promise.resolve({
            success: true,
            data: [createMockPatient({ firstName: 'Jane', lastName: 'Smith' })],
          });
        }
        return Promise.resolve({ success: true, data: [] });
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search patients by phone/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search patients by phone/i);
      await userEvent.type(searchInput, '0300{enter}');

      await waitFor(() => {
        expect(mockElectronAPI.database.execute).toHaveBeenCalledWith(
          'search-patients',
          expect.objectContaining({ query: '0300' })
        );
      });
    });

    it('should show search results dialog', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-dashboard-stats') {
          return Promise.resolve({ success: true, data: createMockDashboardStats() });
        }
        if (operation === 'search-patients') {
          return Promise.resolve({
            success: true,
            data: [createMockPatient({ firstName: 'Jane', lastName: 'Smith', phone: '03001234567' })],
          });
        }
        return Promise.resolve({ success: true, data: [] });
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search patients by phone/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search patients by phone/i);
      await userEvent.type(searchInput, '0300{enter}');

      await waitFor(() => {
        expect(screen.getByText('Search Results')).toBeInTheDocument();
      });
    });
  });

  describe("Today's Schedule", () => {
    it('should display today\'s schedule section', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText("Today's Schedule")).toBeInTheDocument();
      });
    });

    it('should show message when no visits scheduled', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-dashboard-stats') {
          return Promise.resolve({
            success: true,
            data: createMockDashboardStats({ todaySchedule: [] }),
          });
        }
        return Promise.resolve({ success: true, data: [] });
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/no visits scheduled for today/i)).toBeInTheDocument();
      });
    });

    it('should display scheduled visits', async () => {
      const mockVisits = [
        createMockVisit({
          visitID: 1,
          patientName: 'John Doe',
          startTime: '10:00',
          status: 'Scheduled',
        }),
        createMockVisit({
          visitID: 2,
          patientName: 'Jane Smith',
          startTime: '11:00',
          status: 'Scheduled',
        }),
      ];

      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-dashboard-stats') {
          return Promise.resolve({
            success: true,
            data: createMockDashboardStats({ todaySchedule: mockVisits }),
          });
        }
        return Promise.resolve({ success: true, data: [] });
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator while fetching data', () => {
      mockElectronAPI.database.execute.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<Dashboard />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      mockElectronAPI.database.execute.mockRejectedValue(new Error('API Error'));

      render(<Dashboard />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });
});
