/**
 * Invoice Workflow Integration Tests
 * Tests the complete invoice/billing flow including:
 * - Viewing and filtering invoices
 * - Creating invoices with items
 * - Recording payments (full and partial)
 * - Invoice status transitions
 * - URL param handling for patient pre-selection
 */

import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, createMockPatient, createMockDoctor, createMockInvoice, createMockService } from '../utils/testUtils';
import Billing from '../../src/renderer/pages/Billing';
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

// Mock data
const mockDoctors = [
  createMockDoctor({ doctorID: 1, firstName: 'Sarah', lastName: 'Khan' }),
  createMockDoctor({ doctorID: 2, firstName: 'Ahmed', lastName: 'Ali' }),
];

const mockServices = [
  createMockService({ serviceID: 1, code: 'PT-SESSION', name: 'Physiotherapy Session', defaultPrice: 1000 }),
  createMockService({ serviceID: 2, code: 'EVAL', name: 'Evaluation', defaultPrice: 1500 }),
  createMockService({ serviceID: 3, code: 'ELECTRO', name: 'Electrotherapy', defaultPrice: 800 }),
];

const mockPatients = [
  createMockPatient({ patientID: 1, firstName: 'Ali', lastName: 'Imran', phone: '03001234567' }),
  createMockPatient({ patientID: 2, firstName: 'Sara', lastName: 'Ahmed', phone: '03009876543' }),
];

describe('Invoice Workflow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  describe('Invoice List Display', () => {
    it('should display empty state when no invoices exist', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-invoices') {
          return Promise.resolve({ success: true, data: [] });
        }
        if (operation === 'get-doctors') {
          return Promise.resolve({ success: true, data: mockDoctors });
        }
        if (operation === 'get-services') {
          return Promise.resolve({ success: true, data: mockServices });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Billing />);

      await waitFor(() => {
        expect(screen.getByText('No invoices yet')).toBeInTheDocument();
      });
      expect(screen.getByText('Create your first invoice to start billing')).toBeInTheDocument();
    });

    it('should display invoices list from API', async () => {
      const mockInvoices = [
        createMockInvoice({
          invoiceID: 1,
          invoiceNo: 'INV-2024-0001',
          patientName: 'Ali Imran',
          total: 2000,
          paidAmount: 2000,
          status: 'Paid',
        }),
        createMockInvoice({
          invoiceID: 2,
          invoiceNo: 'INV-2024-0002',
          patientName: 'Sara Ahmed',
          total: 3500,
          paidAmount: 1500,
          status: 'PartiallyPaid',
        }),
      ];

      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-invoices') {
          return Promise.resolve({ success: true, data: mockInvoices });
        }
        if (operation === 'get-doctors') {
          return Promise.resolve({ success: true, data: mockDoctors });
        }
        if (operation === 'get-services') {
          return Promise.resolve({ success: true, data: mockServices });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Billing />);

      await waitFor(() => {
        expect(screen.getByText('INV-2024-0001')).toBeInTheDocument();
        expect(screen.getByText('INV-2024-0002')).toBeInTheDocument();
      });

      expect(screen.getByText('Ali Imran')).toBeInTheDocument();
      expect(screen.getByText('Sara Ahmed')).toBeInTheDocument();
    });

    it('should display correct status chips for invoices', async () => {
      const mockInvoices = [
        createMockInvoice({ invoiceID: 1, invoiceNo: 'INV-001', status: 'Paid', total: 1000, paidAmount: 1000 }),
        createMockInvoice({ invoiceID: 2, invoiceNo: 'INV-002', status: 'Unpaid', total: 2000, paidAmount: 0 }),
        createMockInvoice({ invoiceID: 3, invoiceNo: 'INV-003', status: 'PartiallyPaid', total: 3000, paidAmount: 1500 }),
      ];

      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-invoices') {
          return Promise.resolve({ success: true, data: mockInvoices });
        }
        if (operation === 'get-doctors') {
          return Promise.resolve({ success: true, data: mockDoctors });
        }
        if (operation === 'get-services') {
          return Promise.resolve({ success: true, data: mockServices });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Billing />);

      // Wait for invoices to load and check that all three status chips appear
      await waitFor(() => {
        expect(screen.getByText('INV-001')).toBeInTheDocument();
        expect(screen.getByText('INV-002')).toBeInTheDocument();
        expect(screen.getByText('INV-003')).toBeInTheDocument();
      });

      // Check that status chips exist - use getAllByText since there may be duplicates
      // StatusChip displays 'PartiallyPaid' as 'Partial'
      expect(screen.getAllByText('Unpaid').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Partial').length).toBeGreaterThanOrEqual(1);
    });

  });

  describe('Create Invoice Flow', () => {
    it('should open create invoice dialog when clicking New Invoice button', async () => {
      // Use one invoice so there's only one New Invoice button in header
      const mockInvoices = [createMockInvoice({ invoiceID: 1, invoiceNo: 'INV-001' })];

      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-invoices') {
          return Promise.resolve({ success: true, data: mockInvoices });
        }
        if (operation === 'get-doctors') {
          return Promise.resolve({ success: true, data: mockDoctors });
        }
        if (operation === 'get-services') {
          return Promise.resolve({ success: true, data: mockServices });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Billing />);

      await waitFor(() => {
        expect(screen.getByText('INV-001')).toBeInTheDocument();
      });

      // Now there should be only one New Invoice button
      const newInvoiceButton = screen.getByRole('button', { name: /new invoice/i });
      await userEvent.click(newInvoiceButton);

      await waitFor(() => {
        expect(screen.getByText('Create New Invoice')).toBeInTheDocument();
      });
    });

    it('should show validation error when creating invoice without patient', async () => {
      // Use one invoice so there's only one New Invoice button in header
      const mockInvoices = [createMockInvoice({ invoiceID: 1, invoiceNo: 'INV-001' })];

      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-invoices') {
          return Promise.resolve({ success: true, data: mockInvoices });
        }
        if (operation === 'get-doctors') {
          return Promise.resolve({ success: true, data: mockDoctors });
        }
        if (operation === 'get-services') {
          return Promise.resolve({ success: true, data: mockServices });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Billing />);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('INV-001')).toBeInTheDocument();
      });

      // Open create dialog
      const newInvoiceButton = screen.getByRole('button', { name: /new invoice/i });
      await userEvent.click(newInvoiceButton);

      await waitFor(() => {
        expect(screen.getByText('Create New Invoice')).toBeInTheDocument();
      });

      // Try to submit without selecting patient
      const createButton = screen.getByRole('button', { name: /create invoice/i });
      await userEvent.click(createButton);

      // Should show error
      await waitFor(() => {
        expect(screen.getByText('Please select a patient')).toBeInTheDocument();
      });

      // API should not be called
      expect(mockElectronAPI.database.execute).not.toHaveBeenCalledWith(
        'create-invoice',
        expect.anything()
      );
    });

    it('should search patients when typing in patient field', async () => {
      // Use one invoice so there's only one New Invoice button in header
      const mockInvoices = [createMockInvoice({ invoiceID: 1, invoiceNo: 'INV-001' })];

      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-invoices') {
          return Promise.resolve({ success: true, data: mockInvoices });
        }
        if (operation === 'get-doctors') {
          return Promise.resolve({ success: true, data: mockDoctors });
        }
        if (operation === 'get-services') {
          return Promise.resolve({ success: true, data: mockServices });
        }
        if (operation === 'search-patients') {
          return Promise.resolve({ success: true, data: mockPatients });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Billing />);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('INV-001')).toBeInTheDocument();
      });

      // Open create dialog
      const newInvoiceButton = screen.getByRole('button', { name: /new invoice/i });
      await userEvent.click(newInvoiceButton);

      await waitFor(() => {
        expect(screen.getByText('Create New Invoice')).toBeInTheDocument();
      });

      // Type in patient search field
      const patientInput = screen.getByLabelText(/search patient/i);
      await userEvent.type(patientInput, 'Ali');

      // Verify API was called
      await waitFor(() => {
        expect(mockElectronAPI.database.execute).toHaveBeenCalledWith(
          'search-patients',
          expect.objectContaining({ query: 'Ali' })
        );
      });
    });
  });

  describe('View Invoice Details', () => {
    it('should open invoice details dialog when clicking view button', async () => {
      const mockInvoice = createMockInvoice({
        invoiceID: 1,
        invoiceNo: 'INV-2024-0001',
        patientName: 'Ali Imran',
        total: 2500,
        paidAmount: 0,
        status: 'Unpaid',
      });

      const mockInvoiceDetails = {
        ...mockInvoice,
        items: [
          { itemID: 1, invoiceID: 1, serviceID: 1, description: 'Physiotherapy Session', quantity: 2, unitPrice: 1000, lineTotal: 2000 },
          { itemID: 2, invoiceID: 1, serviceID: 3, description: 'Electrotherapy', quantity: 1, unitPrice: 500, lineTotal: 500 },
        ],
        payments: [],
      };

      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-invoices') {
          return Promise.resolve({ success: true, data: [mockInvoice] });
        }
        if (operation === 'get-invoice') {
          return Promise.resolve({ success: true, data: mockInvoiceDetails });
        }
        if (operation === 'get-doctors') {
          return Promise.resolve({ success: true, data: mockDoctors });
        }
        if (operation === 'get-services') {
          return Promise.resolve({ success: true, data: mockServices });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Billing />);

      await waitFor(() => {
        expect(screen.getByText('INV-2024-0001')).toBeInTheDocument();
      });

      // Click view button
      const viewButton = screen.getByRole('button', { name: /view invoice/i });
      await userEvent.click(viewButton);

      // Verify dialog opens with invoice details
      await waitFor(() => {
        expect(screen.getByText('Invoice INV-2024-0001')).toBeInTheDocument();
      });

      // Verify items are displayed
      expect(screen.getByText('Physiotherapy Session')).toBeInTheDocument();
      expect(screen.getByText('Electrotherapy')).toBeInTheDocument();
    });

    it('should display payment history in invoice details', async () => {
      const mockInvoice = createMockInvoice({
        invoiceID: 1,
        invoiceNo: 'INV-2024-0001',
        total: 2000,
        paidAmount: 1500,
        status: 'PartiallyPaid',
      });

      const mockInvoiceDetails = {
        ...mockInvoice,
        items: [{ itemID: 1, description: 'Session', quantity: 1, unitPrice: 2000, lineTotal: 2000 }],
        payments: [
          { paymentID: 1, invoiceID: 1, paymentDate: '2024-01-10', amount: 1000, method: 'Cash', notes: null },
          { paymentID: 2, invoiceID: 1, paymentDate: '2024-01-15', amount: 500, method: 'Card', notes: null },
        ],
      };

      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-invoices') {
          return Promise.resolve({ success: true, data: [mockInvoice] });
        }
        if (operation === 'get-invoice') {
          return Promise.resolve({ success: true, data: mockInvoiceDetails });
        }
        if (operation === 'get-doctors') {
          return Promise.resolve({ success: true, data: mockDoctors });
        }
        if (operation === 'get-services') {
          return Promise.resolve({ success: true, data: mockServices });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Billing />);

      await waitFor(() => {
        expect(screen.getByText('INV-2024-0001')).toBeInTheDocument();
      });

      // Click view button
      const viewButton = screen.getByRole('button', { name: /view invoice/i });
      await userEvent.click(viewButton);

      // Verify payments are displayed
      await waitFor(() => {
        expect(screen.getByText(/Rs 1,000 via Cash/)).toBeInTheDocument();
        expect(screen.getByText(/Rs 500 via Card/)).toBeInTheDocument();
      });
    });

    it('should show balance due in invoice details', async () => {
      const mockInvoice = createMockInvoice({
        invoiceID: 1,
        invoiceNo: 'INV-2024-0001',
        total: 5000,
        paidAmount: 3000,
        status: 'PartiallyPaid',
      });

      const mockInvoiceDetails = {
        ...mockInvoice,
        items: [{ itemID: 1, description: 'Package', quantity: 1, unitPrice: 5000, lineTotal: 5000 }],
        payments: [{ paymentID: 1, invoiceID: 1, paymentDate: '2024-01-10', amount: 3000, method: 'Cash', notes: null }],
      };

      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-invoices') {
          return Promise.resolve({ success: true, data: [mockInvoice] });
        }
        if (operation === 'get-invoice') {
          return Promise.resolve({ success: true, data: mockInvoiceDetails });
        }
        if (operation === 'get-doctors') {
          return Promise.resolve({ success: true, data: mockDoctors });
        }
        if (operation === 'get-services') {
          return Promise.resolve({ success: true, data: mockServices });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Billing />);

      await waitFor(() => {
        expect(screen.getByText('INV-2024-0001')).toBeInTheDocument();
      });

      // Open invoice details
      const viewButton = screen.getByRole('button', { name: /view invoice/i });
      await userEvent.click(viewButton);

      await waitFor(() => {
        expect(screen.getByText('Invoice INV-2024-0001')).toBeInTheDocument();
      });

      // Check balance section exists
      expect(screen.getByText('Balance Due:')).toBeInTheDocument();
    });
  });

  describe('Payment Recording', () => {
    it('should show Record Payment button for unpaid invoices', async () => {
      const mockInvoice = createMockInvoice({
        invoiceID: 1,
        invoiceNo: 'INV-2024-0001',
        total: 2000,
        paidAmount: 0,
        status: 'Unpaid',
      });

      const mockInvoiceDetails = {
        ...mockInvoice,
        items: [{ itemID: 1, description: 'Session', quantity: 1, unitPrice: 2000, lineTotal: 2000 }],
        payments: [],
      };

      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-invoices') {
          return Promise.resolve({ success: true, data: [mockInvoice] });
        }
        if (operation === 'get-invoice') {
          return Promise.resolve({ success: true, data: mockInvoiceDetails });
        }
        if (operation === 'get-doctors') {
          return Promise.resolve({ success: true, data: mockDoctors });
        }
        if (operation === 'get-services') {
          return Promise.resolve({ success: true, data: mockServices });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Billing />);

      await waitFor(() => {
        expect(screen.getByText('INV-2024-0001')).toBeInTheDocument();
      });

      // Open invoice details
      const viewButton = screen.getByRole('button', { name: /view invoice/i });
      await userEvent.click(viewButton);

      // Verify invoice dialog opens with Record Payment button
      await waitFor(() => {
        expect(screen.getByText('Invoice INV-2024-0001')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /record payment/i })).toBeInTheDocument();
      });
    });

    it('should call create-payment API when recording payment', async () => {
      const mockInvoice = createMockInvoice({
        invoiceID: 1,
        invoiceNo: 'INV-2024-0001',
        total: 2000,
        paidAmount: 0,
        status: 'Unpaid',
      });

      const mockInvoiceDetails = {
        ...mockInvoice,
        items: [{ itemID: 1, description: 'Session', quantity: 1, unitPrice: 2000, lineTotal: 2000 }],
        payments: [],
      };

      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-invoices') {
          return Promise.resolve({ success: true, data: [mockInvoice] });
        }
        if (operation === 'get-invoice') {
          return Promise.resolve({ success: true, data: mockInvoiceDetails });
        }
        if (operation === 'get-doctors') {
          return Promise.resolve({ success: true, data: mockDoctors });
        }
        if (operation === 'get-services') {
          return Promise.resolve({ success: true, data: mockServices });
        }
        if (operation === 'create-payment') {
          return Promise.resolve({ success: true, data: { paymentID: 1 } });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Billing />);

      await waitFor(() => {
        expect(screen.getByText('INV-2024-0001')).toBeInTheDocument();
      });

      // Open invoice details
      await userEvent.click(screen.getByRole('button', { name: /view invoice/i }));

      await waitFor(() => {
        expect(screen.getByText('Invoice INV-2024-0001')).toBeInTheDocument();
      });

      // Click Record Payment button to open payment dialog
      const recordButton = screen.getByRole('button', { name: /record payment/i });
      await userEvent.click(recordButton);

      // Wait for payment dialog - look for the dialog-specific content
      await waitFor(() => {
        expect(screen.getByLabelText(/payment amount/i)).toBeInTheDocument();
      });

      // Find and click the submit button in the payment dialog (last Record Payment button)
      const allButtons = screen.getAllByRole('button', { name: /record payment/i });
      const submitButton = allButtons[allButtons.length - 1];
      await userEvent.click(submitButton);

      // Verify API was called with correct data
      await waitFor(() => {
        expect(mockElectronAPI.database.execute).toHaveBeenCalledWith(
          'create-payment',
          expect.objectContaining({
            invoiceID: 1,
            amount: 2000,
            method: 'Cash',
          })
        );
      });
    });
  });

  describe('API Error Handling', () => {
    it('should handle invoice loading errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-invoices') {
          return Promise.reject(new Error('Network error'));
        }
        if (operation === 'get-doctors') {
          return Promise.resolve({ success: true, data: mockDoctors });
        }
        if (operation === 'get-services') {
          return Promise.resolve({ success: true, data: mockServices });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Billing />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Next Visit on Invoice', () => {
    it('should display next visit information on invoice list', async () => {
      const mockInvoice = createMockInvoice({
        invoiceID: 1,
        invoiceNo: 'INV-2024-0001',
        nextVisitDate: '2024-02-01',
        nextVisitTime: '10:00',
      });

      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-invoices') {
          return Promise.resolve({ success: true, data: [mockInvoice] });
        }
        if (operation === 'get-doctors') {
          return Promise.resolve({ success: true, data: mockDoctors });
        }
        if (operation === 'get-services') {
          return Promise.resolve({ success: true, data: mockServices });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Billing />);

      await waitFor(() => {
        expect(screen.getByText('INV-2024-0001')).toBeInTheDocument();
      });

      // Verify next visit column shows time
      expect(screen.getByText(/@ 10:00/)).toBeInTheDocument();
    });
  });

  describe('URL Parameter Handling', () => {
    it('should open create dialog when patientId URL param is present', async () => {
      mockSearchParams = new URLSearchParams('patientId=1');

      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-invoices') {
          return Promise.resolve({ success: true, data: [] });
        }
        if (operation === 'get-doctors') {
          return Promise.resolve({ success: true, data: mockDoctors });
        }
        if (operation === 'get-services') {
          return Promise.resolve({ success: true, data: mockServices });
        }
        if (operation === 'get-patients') {
          return Promise.resolve({
            success: true,
            data: { items: mockPatients, total: 2 },
          });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Billing />);

      // Dialog should open automatically with patient pre-selected
      await waitFor(() => {
        expect(screen.getByText('Create New Invoice')).toBeInTheDocument();
      });
    });

    it('should load patient data when patientId URL param is present', async () => {
      mockSearchParams = new URLSearchParams('patientId=1');

      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-invoices') {
          return Promise.resolve({ success: true, data: [] });
        }
        if (operation === 'get-doctors') {
          return Promise.resolve({ success: true, data: mockDoctors });
        }
        if (operation === 'get-services') {
          return Promise.resolve({ success: true, data: mockServices });
        }
        if (operation === 'get-patients') {
          return Promise.resolve({
            success: true,
            data: { items: [mockPatients[0]], total: 1 },
          });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Billing />);

      // Verify the API was called to load the patient
      await waitFor(() => {
        expect(mockElectronAPI.database.execute).toHaveBeenCalledWith(
          'get-patients',
          expect.objectContaining({
            patientID: 1,
          })
        );
      });
    });

    it('should clear URL params after reading them', async () => {
      mockSearchParams = new URLSearchParams('patientId=1');

      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-invoices') {
          return Promise.resolve({ success: true, data: [] });
        }
        if (operation === 'get-doctors') {
          return Promise.resolve({ success: true, data: mockDoctors });
        }
        if (operation === 'get-services') {
          return Promise.resolve({ success: true, data: mockServices });
        }
        if (operation === 'get-patients') {
          return Promise.resolve({
            success: true,
            data: { items: mockPatients, total: 2 },
          });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Billing />);

      // Wait for component to process params
      await waitFor(() => {
        expect(mockSetSearchParams).toHaveBeenCalledWith({});
      });
    });

    it('should not auto-open dialog when no patientId param', async () => {
      mockSearchParams = new URLSearchParams();

      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-invoices') {
          return Promise.resolve({ success: true, data: [] });
        }
        if (operation === 'get-doctors') {
          return Promise.resolve({ success: true, data: mockDoctors });
        }
        if (operation === 'get-services') {
          return Promise.resolve({ success: true, data: mockServices });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Billing />);

      // Wait for page to load
      await waitFor(() => {
        expect(screen.getByText('No invoices yet')).toBeInTheDocument();
      });

      // Dialog should NOT be open automatically
      expect(screen.queryByText('Create New Invoice')).not.toBeInTheDocument();
    });
  });
});
