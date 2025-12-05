/**
 * Unit tests for Reports page
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../utils/testUtils';
import { mockElectronAPI } from '../../setupTests';
import Reports from '../../../src/renderer/pages/Reports';

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock document.createElement for download link
const mockClick = jest.fn();
const originalCreateElement = document.createElement.bind(document);
jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
  if (tagName === 'a') {
    return {
      href: '',
      download: '',
      click: mockClick,
    } as unknown as HTMLAnchorElement;
  }
  return originalCreateElement(tagName);
});

describe('Reports', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock analytics API responses
    mockElectronAPI.database.execute.mockImplementation((operation: string) => {
      if (operation === 'get-revenue-analytics') {
        return Promise.resolve({
          success: true,
          data: [
            { month: 'Jan 2024', revenue: 100000, expenses: 50000 },
            { month: 'Feb 2024', revenue: 120000, expenses: 55000 },
            { month: 'Mar 2024', revenue: 110000, expenses: 52000 },
          ],
        });
      }
      if (operation === 'get-visit-analytics') {
        return Promise.resolve({
          success: true,
          data: {
            total: 100,
            completed: 60,
            scheduled: 20,
            inProgress: 5,
            cancelled: 10,
            noShow: 5,
            byType: [
              { type: 'TherapySession', count: 70 },
              { type: 'Evaluation', count: 30 },
            ],
            byDoctor: [
              { doctorName: 'Dr. Smith', count: 50, revenue: 100000 },
            ],
          },
        });
      }
      if (operation === 'get-patient-analytics') {
        return Promise.resolve({
          success: true,
          data: {
            totalPatients: 500,
            newThisMonth: 25,
            newLastMonth: 20,
            activePatients: 150,
            returningPatients: 300,
          },
        });
      }
      return Promise.resolve({ success: true, data: null });
    });
  });

  describe('Page rendering', () => {
    it('renders Reports & Analytics title', async () => {
      render(<Reports />);

      await waitFor(() => {
        expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
      });
    });

    it('renders time period selector', async () => {
      render(<Reports />);

      // Wait for content to appear first
      await waitFor(() => {
        expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Check for the combobox (MUI Select)
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      // Time Period text appears multiple times in MUI Select (label and legend)
      expect(screen.getAllByText('Time Period').length).toBeGreaterThan(0);
    });

    it('renders control buttons', async () => {
      render(<Reports />);

      // Wait for content to appear first
      await waitFor(() => {
        expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
      }, { timeout: 5000 });

      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /print/i })).toBeInTheDocument();
    });

    it('renders tabs', async () => {
      render(<Reports />);

      // Wait for content to appear first
      await waitFor(() => {
        expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
      }, { timeout: 5000 });

      expect(screen.getByRole('tab', { name: 'Overview' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Revenue' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Visits' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Patients' })).toBeInTheDocument();
    });
  });

  describe('Loading state', () => {
    it('shows loading indicator while fetching data', () => {
      // Make the API call hang
      mockElectronAPI.database.execute.mockImplementation(() => new Promise(() => {}));
      render(<Reports />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Tab navigation', () => {
    it('shows Overview tab content by default', async () => {
      render(<Reports />);

      // Wait for content to appear
      await waitFor(() => {
        expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
      }, { timeout: 5000 });

      expect(screen.getByText('Patient Statistics')).toBeInTheDocument();
    });

    it('switches to Revenue tab when clicked', async () => {
      render(<Reports />);

      // Wait for content to appear
      await waitFor(() => {
        expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
      }, { timeout: 5000 });

      fireEvent.click(screen.getByRole('tab', { name: 'Revenue' }));

      await waitFor(() => {
        expect(screen.getByText('Revenue Analysis')).toBeInTheDocument();
      });
    });

    it('switches to Visits tab when clicked', async () => {
      render(<Reports />);

      // Wait for content to appear
      await waitFor(() => {
        expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
      }, { timeout: 5000 });

      fireEvent.click(screen.getByRole('tab', { name: 'Visits' }));

      await waitFor(() => {
        expect(screen.getByText('Visit Analysis')).toBeInTheDocument();
      });
    });

    it('switches to Patients tab when clicked', async () => {
      render(<Reports />);

      // Wait for content to appear
      await waitFor(() => {
        expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
      }, { timeout: 5000 });

      fireEvent.click(screen.getByRole('tab', { name: 'Patients' }));

      await waitFor(() => {
        expect(screen.getByText('Patient Analysis')).toBeInTheDocument();
      });
    });
  });

  describe('Time period selection', () => {
    it('defaults to last 6 months', async () => {
      render(<Reports />);

      // Wait for content to appear (title only renders when loading is complete)
      await waitFor(() => {
        expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
      }, { timeout: 5000 });

      // The select should show "Last 6 Months" as default
      const select = screen.getByRole('combobox');
      expect(select).toHaveTextContent('Last 6 Months');
    }, 10000);

    it('reloads data when time period changes', async () => {
      render(<Reports />);

      // Wait for content to appear
      await waitFor(() => {
        expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
      }, { timeout: 5000 });

      const initialCallCount = mockElectronAPI.database.execute.mock.calls.length;

      // Change time period
      const select = screen.getByRole('combobox');
      fireEvent.mouseDown(select);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'This Month' })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('option', { name: 'This Month' }));

      await waitFor(() => {
        // Should have made additional API calls
        expect(mockElectronAPI.database.execute.mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    }, 10000);
  });

  describe('Refresh button', () => {
    it('reloads analytics data when clicked', async () => {
      render(<Reports />);

      // Wait for content to appear
      await waitFor(() => {
        expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
      }, { timeout: 5000 });

      const initialCallCount = mockElectronAPI.database.execute.mock.calls.length;

      fireEvent.click(screen.getByRole('button', { name: /refresh/i }));

      await waitFor(() => {
        expect(mockElectronAPI.database.execute.mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    }, 10000);
  });

  describe('Export functionality', () => {
    it('exports data to CSV when export button is clicked', async () => {
      render(<Reports />);

      // Wait for content to appear
      await waitFor(() => {
        expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
      }, { timeout: 5000 });

      fireEvent.click(screen.getByRole('button', { name: /export/i }));

      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
    }, 10000);
  });

  describe('Print functionality', () => {
    it('calls window.print when print button is clicked', async () => {
      const originalPrint = window.print;
      window.print = jest.fn();

      render(<Reports />);

      // Wait for content to appear
      await waitFor(() => {
        expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
      }, { timeout: 5000 });

      fireEvent.click(screen.getByRole('button', { name: /print/i }));

      expect(window.print).toHaveBeenCalled();

      window.print = originalPrint;
    }, 10000);
  });

  describe('Empty data handling', () => {
    it('shows empty message when no revenue data', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-revenue-analytics') {
          return Promise.resolve({ success: true, data: [] });
        }
        if (operation === 'get-visit-analytics') {
          return Promise.resolve({ success: true, data: null });
        }
        if (operation === 'get-patient-analytics') {
          return Promise.resolve({ success: true, data: null });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Reports />);

      // Wait for content to appear
      await waitFor(() => {
        expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Switch to Revenue tab
      fireEvent.click(screen.getByRole('tab', { name: 'Revenue' }));

      await waitFor(() => {
        expect(screen.getByText('No revenue data available for the selected period')).toBeInTheDocument();
      });
    }, 10000);

    it('shows empty message when no visit data', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-revenue-analytics') {
          return Promise.resolve({ success: true, data: [] });
        }
        if (operation === 'get-visit-analytics') {
          return Promise.resolve({ success: true, data: null });
        }
        if (operation === 'get-patient-analytics') {
          return Promise.resolve({ success: true, data: null });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Reports />);

      // Wait for content to appear
      await waitFor(() => {
        expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
      }, { timeout: 5000 });

      fireEvent.click(screen.getByRole('tab', { name: 'Visits' }));

      await waitFor(() => {
        expect(screen.getByText('No visit data available for the selected period')).toBeInTheDocument();
      });
    }, 10000);

    it('shows empty message when no patient data', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-revenue-analytics') {
          return Promise.resolve({ success: true, data: [] });
        }
        if (operation === 'get-visit-analytics') {
          return Promise.resolve({ success: true, data: null });
        }
        if (operation === 'get-patient-analytics') {
          return Promise.resolve({ success: true, data: null });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Reports />);

      // Wait for content to appear
      await waitFor(() => {
        expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
      }, { timeout: 5000 });

      fireEvent.click(screen.getByRole('tab', { name: 'Patients' }));

      await waitFor(() => {
        expect(screen.getByText('No patient data available')).toBeInTheDocument();
      });
    }, 10000);
  });

  describe('Error handling', () => {
    it('handles API errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      mockElectronAPI.database.execute.mockRejectedValue(new Error('API Error'));

      render(<Reports />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to load analytics:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });
});
