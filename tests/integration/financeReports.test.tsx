/**
 * Finance Reports Integration Tests
 * Tests the finance page flow including:
 * - Summary display (revenue, expenses, net income)
 * - Date range filtering
 * - Expenses management
 * - Export functionality
 */

import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../utils/testUtils';
import Finance from '../../src/renderer/pages/Finance';
import { mockElectronAPI } from '../setupTests';

const mockSummary = {
  totalRevenue: 50000,
  totalExpenses: 12000,
  netIncome: 38000,
  totalInvoiced: 60000,
  totalOutstanding: 10000,
  completedVisits: 25,
  revenueByDay: [
    { date: '2024-01-15', total: 18000 },
    { date: '2024-01-16', total: 14000 },
    { date: '2024-01-17', total: 18000 },
  ],
  expensesByCategory: [
    { category: 'Rent', total: 7000 },
    { category: 'Supplies', total: 3000 },
    { category: 'Utilities', total: 2000 },
  ],
};

const mockExpenses = [
  {
    expenseID: 1,
    expenseDate: '2024-01-15',
    title: 'Monthly Rent',
    category: 'Rent',
    amount: 7000,
    paidTo: 'Landlord',
    notes: 'January rent',
  },
  {
    expenseID: 2,
    expenseDate: '2024-01-16',
    title: 'Medical Supplies',
    category: 'Supplies',
    amount: 3000,
    paidTo: 'Supplier Co',
    notes: '',
  },
];

describe('Finance Reports Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Summary Display', () => {
    it('should display finance summary cards', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-finance-summary') {
          return Promise.resolve({ success: true, data: mockSummary });
        }
        if (operation === 'get-expenses') {
          return Promise.resolve({ success: true, data: mockExpenses });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Finance />);

      // Wait for summary to load
      await waitFor(() => {
        expect(screen.getByText('Revenue')).toBeInTheDocument();
      });

      // Verify summary values - use getAllByText since values may appear in multiple places
      expect(screen.getAllByText('Rs 50,000').length).toBeGreaterThan(0); // Revenue
      expect(screen.getAllByText('Rs 12,000').length).toBeGreaterThan(0); // Expenses
      expect(screen.getAllByText('Rs 38,000').length).toBeGreaterThan(0); // Net Income
      expect(screen.getByText('25')).toBeInTheDocument(); // Completed Visits
    });

    it('should display outstanding receivables alert', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-finance-summary') {
          return Promise.resolve({ success: true, data: mockSummary });
        }
        if (operation === 'get-expenses') {
          return Promise.resolve({ success: true, data: mockExpenses });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Finance />);

      await waitFor(() => {
        expect(screen.getByText(/Outstanding Receivables/)).toBeInTheDocument();
      });

      expect(screen.getByText(/Rs 10,000/)).toBeInTheDocument();
    });

    it('should display daily revenue in overview tab', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-finance-summary') {
          return Promise.resolve({ success: true, data: mockSummary });
        }
        if (operation === 'get-expenses') {
          return Promise.resolve({ success: true, data: mockExpenses });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Finance />);

      await waitFor(() => {
        expect(screen.getByText('Daily Revenue')).toBeInTheDocument();
      });

      // Verify daily revenue entries - use getAllByText since Rs 18,000 appears twice
      expect(screen.getAllByText('Rs 18,000').length).toBeGreaterThan(0);
      expect(screen.getByText('Rs 14,000')).toBeInTheDocument();
    });

    it('should display expenses by category breakdown', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-finance-summary') {
          return Promise.resolve({ success: true, data: mockSummary });
        }
        if (operation === 'get-expenses') {
          return Promise.resolve({ success: true, data: mockExpenses });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Finance />);

      await waitFor(() => {
        expect(screen.getByText('Expenses by Category')).toBeInTheDocument();
      });

      // Verify category breakdown
      expect(screen.getByText('Rent')).toBeInTheDocument();
      expect(screen.getByText('Supplies')).toBeInTheDocument();
      expect(screen.getByText('Utilities')).toBeInTheDocument();
    });
  });

  describe('Expenses Tab', () => {
    it('should switch to expenses tab and display expense list', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-finance-summary') {
          return Promise.resolve({ success: true, data: mockSummary });
        }
        if (operation === 'get-expenses') {
          return Promise.resolve({ success: true, data: mockExpenses });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Finance />);

      await waitFor(() => {
        expect(screen.getByText('Revenue')).toBeInTheDocument();
      });

      // Click Expenses tab
      const expensesTab = screen.getByRole('tab', { name: /expenses/i });
      await userEvent.click(expensesTab);

      // Verify expenses are displayed
      await waitFor(() => {
        expect(screen.getByText('Monthly Rent')).toBeInTheDocument();
        expect(screen.getByText('Medical Supplies')).toBeInTheDocument();
      });
    });

    it('should show empty state when no expenses exist', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-finance-summary') {
          return Promise.resolve({ success: true, data: { ...mockSummary, totalExpenses: 0, expensesByCategory: [] } });
        }
        if (operation === 'get-expenses') {
          return Promise.resolve({ success: true, data: [] });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Finance />);

      await waitFor(() => {
        expect(screen.getByText('Revenue')).toBeInTheDocument();
      });

      // Click Expenses tab
      const expensesTab = screen.getByRole('tab', { name: /expenses/i });
      await userEvent.click(expensesTab);

      // Verify empty state
      await waitFor(() => {
        expect(screen.getByText('No Expenses Recorded')).toBeInTheDocument();
      });
    });

    it('should open add expense dialog', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-finance-summary') {
          return Promise.resolve({ success: true, data: mockSummary });
        }
        if (operation === 'get-expenses') {
          return Promise.resolve({ success: true, data: mockExpenses });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Finance />);

      await waitFor(() => {
        expect(screen.getByText('Revenue')).toBeInTheDocument();
      });

      // Click Expenses tab
      const expensesTab = screen.getByRole('tab', { name: /expenses/i });
      await userEvent.click(expensesTab);

      await waitFor(() => {
        expect(screen.getByText('Monthly Rent')).toBeInTheDocument();
      });

      // Click Add Expense button
      const addButtons = screen.getAllByRole('button', { name: /add expense/i });
      await userEvent.click(addButtons[0]);

      // Verify dialog opens
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should create expense with form data', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-finance-summary') {
          return Promise.resolve({ success: true, data: mockSummary });
        }
        if (operation === 'get-expenses') {
          return Promise.resolve({ success: true, data: mockExpenses });
        }
        if (operation === 'create-expense') {
          return Promise.resolve({ success: true, data: { expenseID: 3 } });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Finance />);

      await waitFor(() => {
        expect(screen.getByText('Revenue')).toBeInTheDocument();
      });

      // Click Expenses tab
      const expensesTab = screen.getByRole('tab', { name: /expenses/i });
      await userEvent.click(expensesTab);

      await waitFor(() => {
        expect(screen.getByText('Monthly Rent')).toBeInTheDocument();
      });

      // Click Add Expense button
      const addButtons = screen.getAllByRole('button', { name: /add expense/i });
      await userEvent.click(addButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Fill form - use shorter input methods
      const user = userEvent.setup({ delay: null });
      await user.type(screen.getByLabelText(/title/i), 'Bill');
      const amountInput = screen.getByLabelText(/amount/i);
      await user.clear(amountInput);
      await user.type(amountInput, '3000');

      // Submit using the dialog button (second Add Expense button)
      const dialogAddButton = screen.getByRole('button', { name: /add expense$/i });
      await user.click(dialogAddButton);

      // Verify API was called
      await waitFor(() => {
        expect(mockElectronAPI.database.execute).toHaveBeenCalledWith(
          'create-expense',
          expect.objectContaining({
            title: 'Bill',
            amount: 3000,
          })
        );
      });
    }, 15000);
  });

  describe('Date Range Filter', () => {
    it('should display date filter fields', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-finance-summary') {
          return Promise.resolve({ success: true, data: mockSummary });
        }
        if (operation === 'get-expenses') {
          return Promise.resolve({ success: true, data: mockExpenses });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Finance />);

      await waitFor(() => {
        expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
      });

      // Verify quick filter buttons
      expect(screen.getByRole('button', { name: /this month/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /last month/i })).toBeInTheDocument();
    });

    it('should have export report button', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-finance-summary') {
          return Promise.resolve({ success: true, data: mockSummary });
        }
        if (operation === 'get-expenses') {
          return Promise.resolve({ success: true, data: mockExpenses });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Finance />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /export report/i })).toBeInTheDocument();
      });
    });
  });

  describe('Empty State Handling', () => {
    it('should handle no revenue data', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-finance-summary') {
          return Promise.resolve({
            success: true,
            data: {
              ...mockSummary,
              totalRevenue: 0,
              revenueByDay: [],
            }
          });
        }
        if (operation === 'get-expenses') {
          return Promise.resolve({ success: true, data: [] });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Finance />);

      await waitFor(() => {
        expect(screen.getByText('No revenue data for this period')).toBeInTheDocument();
      });
    });

    it('should handle no expenses category data', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-finance-summary') {
          return Promise.resolve({
            success: true,
            data: {
              ...mockSummary,
              totalExpenses: 0,
              expensesByCategory: [],
            }
          });
        }
        if (operation === 'get-expenses') {
          return Promise.resolve({ success: true, data: [] });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Finance />);

      await waitFor(() => {
        expect(screen.getByText('No expenses for this period')).toBeInTheDocument();
      });
    });
  });
});
