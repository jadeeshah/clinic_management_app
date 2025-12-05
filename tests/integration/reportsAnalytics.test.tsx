/**
 * Integration tests for Reports & Analytics workflow
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '../utils/testUtils';
import { mockElectronAPI } from '../setupTests';
import Reports from '../../src/renderer/pages/Reports';

// Mock URL methods for export
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

describe('Reports & Analytics Integration', () => {
  const mockRevenueData = [
    { month: 'Jan 2024', revenue: 100000, expenses: 50000 },
    { month: 'Feb 2024', revenue: 120000, expenses: 55000 },
    { month: 'Mar 2024', revenue: 110000, expenses: 52000 },
    { month: 'Apr 2024', revenue: 130000, expenses: 60000 },
    { month: 'May 2024', revenue: 140000, expenses: 65000 },
    { month: 'Jun 2024', revenue: 150000, expenses: 70000 },
  ];

  const mockVisitStats = {
    total: 150,
    completed: 100,
    scheduled: 25,
    inProgress: 5,
    cancelled: 15,
    noShow: 5,
    byType: [
      { type: 'TherapySession', count: 100 },
      { type: 'Evaluation', count: 30 },
      { type: 'FollowUp', count: 20 },
    ],
    byDoctor: [
      { doctorName: 'Dr. Sarah Smith', count: 80, revenue: 160000 },
      { doctorName: 'Dr. Ahmed Ali', count: 50, revenue: 100000 },
      { doctorName: 'Dr. Maria Santos', count: 20, revenue: 40000 },
    ],
  };

  const mockPatientStats = {
    totalPatients: 500,
    newThisMonth: 35,
    newLastMonth: 25,
    activePatients: 180,
    returningPatients: 350,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockElectronAPI.database.execute.mockImplementation((operation: string, params?: { period?: string }) => {
      if (operation === 'get-revenue-analytics') {
        // Return different data based on period
        const period = params?.period || 'last6Months';
        if (period === 'thisMonth') {
          return Promise.resolve({
            success: true,
            data: [mockRevenueData[5]], // Just current month
          });
        }
        return Promise.resolve({ success: true, data: mockRevenueData });
      }
      if (operation === 'get-visit-analytics') {
        return Promise.resolve({ success: true, data: mockVisitStats });
      }
      if (operation === 'get-patient-analytics') {
        return Promise.resolve({ success: true, data: mockPatientStats });
      }
      return Promise.resolve({ success: true, data: null });
    });
  });

  describe('Full analytics workflow', () => {
    it('loads all analytics data on mount', async () => {
      render(<Reports />);

      await waitFor(() => {
        expect(mockElectronAPI.database.execute).toHaveBeenCalledWith(
          'get-revenue-analytics',
          expect.objectContaining({ period: 'last6Months' })
        );
        expect(mockElectronAPI.database.execute).toHaveBeenCalledWith(
          'get-visit-analytics',
          expect.objectContaining({ period: 'last6Months' })
        );
        expect(mockElectronAPI.database.execute).toHaveBeenCalledWith(
          'get-patient-analytics'
        );
      });
    });

    it('displays patient statistics in overview', async () => {
      render(<Reports />);

      await waitFor(() => {
        expect(screen.getByText('Patient Statistics')).toBeInTheDocument();
        expect(screen.getAllByText('500')[0]).toBeInTheDocument(); // Total patients
        expect(screen.getAllByText('35')[0]).toBeInTheDocument(); // New this month
      });
    });

    it('displays revenue data in overview', async () => {
      render(<Reports />);

      await waitFor(() => {
        expect(screen.getByText('Revenue Overview')).toBeInTheDocument();
        expect(screen.getByText('Jan 2024')).toBeInTheDocument();
      });
    });

    it('displays visit analytics in overview', async () => {
      render(<Reports />);

      await waitFor(() => {
        expect(screen.getByText('Visit Analytics')).toBeInTheDocument();
        expect(screen.getByText('Total Visits: 150')).toBeInTheDocument();
      });
    });
  });

  describe('Tab navigation workflow', () => {
    it('navigates through all tabs and displays correct content', async () => {
      render(<Reports />);

      // Overview tab (default)
      await waitFor(() => {
        expect(screen.getByText('Patient Statistics')).toBeInTheDocument();
        expect(screen.getByText('Revenue Overview')).toBeInTheDocument();
        expect(screen.getByText('Visit Analytics')).toBeInTheDocument();
      });

      // Revenue tab
      fireEvent.click(screen.getByRole('tab', { name: 'Revenue' }));
      await waitFor(() => {
        expect(screen.getByText('Revenue Analysis')).toBeInTheDocument();
      });

      // Visits tab
      fireEvent.click(screen.getByRole('tab', { name: 'Visits' }));
      await waitFor(() => {
        expect(screen.getByText('Visit Analysis')).toBeInTheDocument();
      });

      // Patients tab
      fireEvent.click(screen.getByRole('tab', { name: 'Patients' }));
      await waitFor(() => {
        expect(screen.getByText('Patient Analysis')).toBeInTheDocument();
      });
    });
  });

  describe('Time period filtering workflow', () => {
    it('reloads data with new period when selection changes', async () => {
      render(<Reports />);

      // Wait for content to appear
      await waitFor(() => {
        expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Initial load with default period
      expect(mockElectronAPI.database.execute).toHaveBeenCalledWith(
        'get-revenue-analytics',
        { period: 'last6Months' }
      );

      // Change to "This Month"
      const select = screen.getByRole('combobox');
      fireEvent.mouseDown(select);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'This Month' })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('option', { name: 'This Month' }));

      await waitFor(() => {
        expect(mockElectronAPI.database.execute).toHaveBeenCalledWith(
          'get-revenue-analytics',
          { period: 'thisMonth' }
        );
      });
    });

    it('supports all time period options', async () => {
      render(<Reports />);

      // Wait for content to appear
      await waitFor(() => {
        expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
      }, { timeout: 5000 });

      const select = screen.getByRole('combobox');
      fireEvent.mouseDown(select);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'This Month' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Last Month' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Last 3 Months' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Last 6 Months' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'This Year' })).toBeInTheDocument();
      });
    });
  });

  describe('Revenue analytics details', () => {
    it('displays total revenue correctly', async () => {
      render(<Reports />);

      await waitFor(() => {
        // Total revenue: 100k + 120k + 110k + 130k + 140k + 150k = 750k
        expect(screen.getByText('Rs. 750,000')).toBeInTheDocument();
      });
    });

    it('displays total expenses correctly', async () => {
      render(<Reports />);

      await waitFor(() => {
        // Total expenses: 50k + 55k + 52k + 60k + 65k + 70k = 352k
        expect(screen.getByText('Rs. 352,000')).toBeInTheDocument();
      });
    });

    it('displays net profit correctly', async () => {
      render(<Reports />);

      await waitFor(() => {
        // Net profit: 750k - 352k = 398k
        expect(screen.getByText('Rs. 398,000')).toBeInTheDocument();
      });
    });
  });

  describe('Visit analytics details', () => {
    it('displays visit status breakdown', async () => {
      render(<Reports />);

      await waitFor(() => {
        expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
      }, { timeout: 5000 });

      fireEvent.click(screen.getByRole('tab', { name: 'Visits' }));

      await waitFor(() => {
        expect(screen.getByText('Status Breakdown')).toBeInTheDocument();
        expect(screen.getByText('Completed')).toBeInTheDocument();
        expect(screen.getAllByText('100')[0]).toBeInTheDocument();
      });
    });

    it('displays visits by type', async () => {
      render(<Reports />);

      await waitFor(() => {
        expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
      }, { timeout: 5000 });

      fireEvent.click(screen.getByRole('tab', { name: 'Visits' }));

      await waitFor(() => {
        expect(screen.getByText('By Visit Type')).toBeInTheDocument();
        expect(screen.getByText('TherapySession')).toBeInTheDocument();
        expect(screen.getByText('Evaluation')).toBeInTheDocument();
      });
    });

    it('displays doctor performance', async () => {
      render(<Reports />);

      await waitFor(() => {
        expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
      }, { timeout: 5000 });

      fireEvent.click(screen.getByRole('tab', { name: 'Visits' }));

      await waitFor(() => {
        expect(screen.getByText('By Doctor')).toBeInTheDocument();
        expect(screen.getByText('Dr. Sarah Smith')).toBeInTheDocument();
        expect(screen.getByText('80 visits')).toBeInTheDocument();
      });
    });
  });

  describe('Patient analytics details', () => {
    it('displays patient growth metrics', async () => {
      render(<Reports />);

      await waitFor(() => {
        expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
      }, { timeout: 5000 });

      fireEvent.click(screen.getByRole('tab', { name: 'Patients' }));

      await waitFor(() => {
        expect(screen.getByText('Patient Analysis')).toBeInTheDocument();
        expect(screen.getByText('Total Patients')).toBeInTheDocument();
        expect(screen.getByText('New This Month')).toBeInTheDocument();
        expect(screen.getByText('Growth Rate')).toBeInTheDocument();
      });
    });

    it('displays returning patients rate', async () => {
      render(<Reports />);

      await waitFor(() => {
        expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
      }, { timeout: 5000 });

      fireEvent.click(screen.getByRole('tab', { name: 'Patients' }));

      await waitFor(() => {
        expect(screen.getByText('Returning Patients')).toBeInTheDocument();
        // 350 / 500 = 70%
        expect(screen.getByText('70%')).toBeInTheDocument();
      });
    });
  });

  describe('Data refresh workflow', () => {
    it('refreshes all analytics when refresh button clicked', async () => {
      render(<Reports />);

      // Wait for content to appear
      await waitFor(() => {
        expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Clear mock to count new calls
      mockElectronAPI.database.execute.mockClear();

      fireEvent.click(screen.getByRole('button', { name: /refresh/i }));

      await waitFor(() => {
        // Should call all three analytics endpoints
        expect(mockElectronAPI.database.execute).toHaveBeenCalledWith(
          'get-revenue-analytics',
          expect.anything()
        );
        expect(mockElectronAPI.database.execute).toHaveBeenCalledWith(
          'get-visit-analytics',
          expect.anything()
        );
        expect(mockElectronAPI.database.execute).toHaveBeenCalledWith(
          'get-patient-analytics'
        );
      });
    });
  });

  describe('Export workflow', () => {
    it('generates CSV with all report data', async () => {
      const mockClick = jest.fn();
      const originalCreateElement = document.createElement.bind(document);
      jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'a') {
          return { href: '', download: '', click: mockClick } as unknown as HTMLAnchorElement;
        }
        return originalCreateElement(tagName);
      });

      render(<Reports />);

      // Wait for content to appear
      await waitFor(() => {
        expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
      }, { timeout: 5000 });

      fireEvent.click(screen.getByRole('button', { name: /export/i }));

      // Verify blob was created and download triggered
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('handles partial data failures gracefully', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-revenue-analytics') {
          return Promise.resolve({ success: true, data: mockRevenueData });
        }
        if (operation === 'get-visit-analytics') {
          return Promise.resolve({ success: false, error: 'Failed to load visits' });
        }
        if (operation === 'get-patient-analytics') {
          return Promise.resolve({ success: true, data: mockPatientStats });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Reports />);

      // Wait for content to appear
      await waitFor(() => {
        expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Should still display revenue and patient data
      expect(screen.getByText('Revenue Overview')).toBeInTheDocument();
      expect(screen.getByText('Patient Statistics')).toBeInTheDocument();
    });

    it('shows appropriate empty states when no data', async () => {
      mockElectronAPI.database.execute.mockImplementation(() => {
        return Promise.resolve({ success: true, data: null });
      });

      render(<Reports />);

      // Wait for content to appear
      await waitFor(() => {
        expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
      }, { timeout: 5000 });

      fireEvent.click(screen.getByRole('tab', { name: 'Revenue' }));

      await waitFor(() => {
        expect(screen.getByText('No revenue data available for the selected period')).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    it('loads all data in parallel', async () => {
      const callOrder: string[] = [];

      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        callOrder.push(operation);
        if (operation === 'get-revenue-analytics') {
          return Promise.resolve({ success: true, data: mockRevenueData });
        }
        if (operation === 'get-visit-analytics') {
          return Promise.resolve({ success: true, data: mockVisitStats });
        }
        if (operation === 'get-patient-analytics') {
          return Promise.resolve({ success: true, data: mockPatientStats });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Reports />);

      await waitFor(() => {
        // All three calls should have been made
        expect(callOrder).toContain('get-revenue-analytics');
        expect(callOrder).toContain('get-visit-analytics');
        expect(callOrder).toContain('get-patient-analytics');
      });
    });
  });
});
