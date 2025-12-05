/**
 * Integration tests for Expense Workflow in Finance page
 */

import React from 'react';
import { render, screen, waitFor, createMockExpense } from '../utils/testUtils';
import userEvent from '@testing-library/user-event';
import Finance from '../../src/renderer/pages/Finance';
import { mockElectronAPI } from '../setupTests';

// Increase timeout for workflow tests
jest.setTimeout(15000);

describe('Expense Workflow Integration Tests', () => {
  const mockSummary = {
    totalRevenue: 100000,
    totalExpenses: 30000,
    netIncome: 70000,
    totalInvoiced: 120000,
    totalOutstanding: 20000,
    completedVisits: 25,
    revenueByDay: [
      { date: '2024-01-15', total: 15000 },
      { date: '2024-01-16', total: 20000 },
    ],
    expensesByCategory: [
      { category: 'Rent', total: 25000 },
      { category: 'Utilities', total: 5000 },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Finance Dashboard Loading', () => {
    it('should display finance summary cards with data', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-finance-summary') {
          return Promise.resolve({ success: true, data: mockSummary });
        }
        if (operation === 'get-expenses') {
          return Promise.resolve({ success: true, data: [] });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Finance />);

      await waitFor(() => {
        expect(screen.getByText('Rs 100,000')).toBeInTheDocument();
      });

      // Check summary cards
      expect(screen.getByText('Revenue')).toBeInTheDocument();
      // 'Expenses' appears both in card and as tab, so use getAllByText
      const expensesTexts = screen.getAllByText('Expenses');
      expect(expensesTexts.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Net Income')).toBeInTheDocument();
      expect(screen.getByText('Rs 30,000')).toBeInTheDocument();
      expect(screen.getByText('Rs 70,000')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
    });

    it('should display outstanding receivables alert when there are outstanding amounts', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-finance-summary') {
          return Promise.resolve({ success: true, data: mockSummary });
        }
        if (operation === 'get-expenses') {
          return Promise.resolve({ success: true, data: [] });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Finance />);

      await waitFor(() => {
        expect(screen.getByText(/Outstanding Receivables/)).toBeInTheDocument();
      });

      // Rs 20,000 appears multiple times (revenue chart + outstanding), use getAllByText
      const amounts = screen.getAllByText(/Rs 20,000/);
      expect(amounts.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Tab Navigation', () => {
    it('should display Overview tab by default', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-finance-summary') {
          return Promise.resolve({ success: true, data: mockSummary });
        }
        if (operation === 'get-expenses') {
          return Promise.resolve({ success: true, data: [] });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Finance />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /overview/i })).toHaveAttribute('aria-selected', 'true');
      });

      expect(screen.getByText('Daily Revenue')).toBeInTheDocument();
      expect(screen.getByText('Expenses by Category')).toBeInTheDocument();
    });

    it('should switch to Expenses tab when clicked', async () => {
      const user = userEvent.setup({ delay: null });

      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-finance-summary') {
          return Promise.resolve({ success: true, data: mockSummary });
        }
        if (operation === 'get-expenses') {
          return Promise.resolve({ success: true, data: [] });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Finance />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /expenses/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /expenses/i }));

      expect(screen.getByRole('tab', { name: /expenses/i })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByText('No Expenses Recorded')).toBeInTheDocument();
    });
  });

  describe('Expense CRUD Operations', () => {
    it('should display expenses in a table', async () => {
      const user = userEvent.setup({ delay: null });
      const mockExpenses = [
        createMockExpense({
          expenseID: 1,
          expenseDate: '2024-01-15',
          title: 'Office Rent',
          category: 'Rent',
          amount: 25000,
          paidTo: 'Landlord',
        }),
        createMockExpense({
          expenseID: 2,
          expenseDate: '2024-01-10',
          title: 'Electricity Bill',
          category: 'Utilities',
          amount: 5000,
          paidTo: 'Electric Company',
        }),
      ];

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
        expect(screen.getByRole('tab', { name: /expenses/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /expenses/i }));

      await waitFor(() => {
        expect(screen.getByText('Office Rent')).toBeInTheDocument();
      });

      expect(screen.getByText('Electricity Bill')).toBeInTheDocument();
      expect(screen.getByText('Landlord')).toBeInTheDocument();
      expect(screen.getByText('Electric Company')).toBeInTheDocument();
      expect(screen.getByText('Rs 25,000')).toBeInTheDocument();
      expect(screen.getByText('Rs 5,000')).toBeInTheDocument();
    });

    it('should open add expense dialog when clicking Add Expense button', async () => {
      const user = userEvent.setup({ delay: null });

      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-finance-summary') {
          return Promise.resolve({ success: true, data: mockSummary });
        }
        if (operation === 'get-expenses') {
          return Promise.resolve({ success: true, data: [] });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Finance />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /expenses/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /expenses/i }));

      await waitFor(() => {
        expect(screen.getByText('No Expenses Recorded')).toBeInTheDocument();
      });

      const addButtons = screen.getAllByRole('button', { name: /add expense/i });
      await user.click(addButtons[0]);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      // Title field is shared across many dialogs, look for it specifically
      const titleInputs = screen.getAllByLabelText(/title/i);
      expect(titleInputs.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
      // Category is a MUI Select and may appear multiple times (label + notched outline)
      const categoryLabels = screen.getAllByText('Category');
      expect(categoryLabels.length).toBeGreaterThanOrEqual(1);
    });

    it('should show validation error when required fields are empty', async () => {
      const user = userEvent.setup({ delay: null });

      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-finance-summary') {
          return Promise.resolve({ success: true, data: mockSummary });
        }
        if (operation === 'get-expenses') {
          return Promise.resolve({ success: true, data: [] });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Finance />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /expenses/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /expenses/i }));

      await waitFor(() => {
        expect(screen.getByText('No Expenses Recorded')).toBeInTheDocument();
      });

      const addButtons = screen.getAllByRole('button', { name: /add expense/i });
      await user.click(addButtons[0]);

      // Click save without filling required fields
      const addButton = screen.getByRole('button', { name: /^add expense$/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Title and amount are required')).toBeInTheDocument();
      });
    });

    it('should create expense when form is valid', async () => {
      const user = userEvent.setup({ delay: null });

      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-finance-summary') {
          return Promise.resolve({ success: true, data: mockSummary });
        }
        if (operation === 'get-expenses') {
          return Promise.resolve({ success: true, data: [] });
        }
        if (operation === 'create-expense') {
          return Promise.resolve({ success: true, data: { insertId: 1 } });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Finance />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /expenses/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /expenses/i }));

      await waitFor(() => {
        expect(screen.getByText('No Expenses Recorded')).toBeInTheDocument();
      });

      const addButtons = screen.getAllByRole('button', { name: /add expense/i });
      await user.click(addButtons[0]);

      // Fill in the form
      await user.type(screen.getByLabelText(/title/i), 'Office Rent');
      await user.clear(screen.getByLabelText(/amount/i));
      await user.type(screen.getByLabelText(/amount/i), '25000');
      await user.type(screen.getByLabelText(/paid to/i), 'Landlord');

      // Submit form
      const addButton = screen.getByRole('button', { name: /^add expense$/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(mockElectronAPI.database.execute).toHaveBeenCalledWith(
          'create-expense',
          expect.objectContaining({
            title: 'Office Rent',
            amount: 25000,
            paidTo: 'Landlord',
          })
        );
      });
    });

    it('should delete expense when confirmed', async () => {
      const user = userEvent.setup({ delay: null });
      const mockExpense = createMockExpense({
        expenseID: 1,
        title: 'Office Rent',
        category: 'Rent',
        amount: 25000,
      });

      const confirmMock = jest.spyOn(window, 'confirm').mockReturnValue(true);

      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-finance-summary') {
          return Promise.resolve({ success: true, data: mockSummary });
        }
        if (operation === 'get-expenses') {
          return Promise.resolve({ success: true, data: [mockExpense] });
        }
        if (operation === 'delete-expense') {
          return Promise.resolve({ success: true, data: null });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Finance />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /expenses/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /expenses/i }));

      await waitFor(() => {
        expect(screen.getByText('Office Rent')).toBeInTheDocument();
      });

      // Click delete button
      const deleteButton = screen.getByRole('button', { name: /delete expense/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockElectronAPI.database.execute).toHaveBeenCalledWith(
          'delete-expense',
          { expenseID: 1 }
        );
      });

      confirmMock.mockRestore();
    });
  });

  describe('Date Filtering', () => {
    it('should reload data when date range changes', async () => {
      const user = userEvent.setup({ delay: null });

      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-finance-summary') {
          return Promise.resolve({ success: true, data: mockSummary });
        }
        if (operation === 'get-expenses') {
          return Promise.resolve({ success: true, data: [] });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Finance />);

      await waitFor(() => {
        expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
      });

      // Change start date
      const startDateInput = screen.getByLabelText(/start date/i);
      await user.clear(startDateInput);
      await user.type(startDateInput, '2024-01-01');

      // Wait for the API calls to be made with the new date
      await waitFor(() => {
        expect(mockElectronAPI.database.execute).toHaveBeenCalledWith(
          'get-finance-summary',
          expect.objectContaining({
            startDate: '2024-01-01',
          })
        );
      });
    });

    it('should have quick filter buttons for This Month and Last Month', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-finance-summary') {
          return Promise.resolve({ success: true, data: mockSummary });
        }
        if (operation === 'get-expenses') {
          return Promise.resolve({ success: true, data: [] });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Finance />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /this month/i })).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /last month/i })).toBeInTheDocument();
    });
  });

  describe('Overview Tab Content', () => {
    it('should display daily revenue data', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-finance-summary') {
          return Promise.resolve({ success: true, data: mockSummary });
        }
        if (operation === 'get-expenses') {
          return Promise.resolve({ success: true, data: [] });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Finance />);

      await waitFor(() => {
        expect(screen.getByText('Daily Revenue')).toBeInTheDocument();
      });

      // Check that revenue by day is displayed (may have duplicates)
      expect(screen.getByText('Rs 15,000')).toBeInTheDocument();
      // Rs 20,000 may appear multiple times (outstanding alert + daily revenue)
      const revenueAmounts = screen.getAllByText(/Rs 20,000/);
      expect(revenueAmounts.length).toBeGreaterThanOrEqual(1);
    });

    it('should display expenses by category breakdown', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-finance-summary') {
          return Promise.resolve({ success: true, data: mockSummary });
        }
        if (operation === 'get-expenses') {
          return Promise.resolve({ success: true, data: [] });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Finance />);

      await waitFor(() => {
        expect(screen.getByText('Expenses by Category')).toBeInTheDocument();
      });

      // Check that expenses by category are displayed
      expect(screen.getByText('Rent')).toBeInTheDocument();
      expect(screen.getByText('Utilities')).toBeInTheDocument();
    });
  });

  describe('Export Functionality', () => {
    it('should have Export Report button', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-finance-summary') {
          return Promise.resolve({ success: true, data: mockSummary });
        }
        if (operation === 'get-expenses') {
          return Promise.resolve({ success: true, data: [] });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Finance />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /export report/i })).toBeInTheDocument();
      });
    });

    it('should enable Export Report button when summary is loaded', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-finance-summary') {
          return Promise.resolve({ success: true, data: mockSummary });
        }
        if (operation === 'get-expenses') {
          return Promise.resolve({ success: true, data: [] });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Finance />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /export report/i })).not.toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when expense creation fails', async () => {
      const user = userEvent.setup({ delay: null });

      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-finance-summary') {
          return Promise.resolve({ success: true, data: mockSummary });
        }
        if (operation === 'get-expenses') {
          return Promise.resolve({ success: true, data: [] });
        }
        if (operation === 'create-expense') {
          return Promise.resolve({ success: false, error: 'Failed to create expense' });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Finance />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /expenses/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /expenses/i }));

      await waitFor(() => {
        expect(screen.getByText('No Expenses Recorded')).toBeInTheDocument();
      });

      const addButtons = screen.getAllByRole('button', { name: /add expense/i });
      await user.click(addButtons[0]);

      await user.type(screen.getByLabelText(/title/i), 'Office Rent');
      await user.clear(screen.getByLabelText(/amount/i));
      await user.type(screen.getByLabelText(/amount/i), '25000');

      const addButton = screen.getByRole('button', { name: /^add expense$/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to create expense')).toBeInTheDocument();
      });
    });
  });
});
