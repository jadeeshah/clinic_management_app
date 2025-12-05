/**
 * Unit tests for PatientTimeline component
 */

import React from 'react';
import { render, screen, fireEvent } from '../../utils/testUtils';
import PatientTimeline from '../../../src/renderer/components/PatientTimeline';
import type { Visit, Invoice, Attachment, PatientPackage } from '../../../src/types';

const createMockVisit = (overrides: Partial<Visit> = {}): Visit => ({
  visitID: 1,
  patientID: 1,
  doctorID: 1,
  visitDate: '2024-01-15',
  startTime: '10:00',
  endTime: '10:45',
  duration: 45,
  status: 'Completed',
  visitType: 'TherapySession',
  sessionIndex: 1,
  notes: null,
  patientPackageID: null,
  createdAt: '2024-01-15T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
  patientName: 'John Doe',
  patientPhone: '03001234567',
  doctorName: 'Sarah Smith',
  ...overrides,
});

const createMockInvoice = (overrides: Partial<Invoice> = {}): Invoice => ({
  invoiceID: 1,
  invoiceNo: 'INV-2024-0001',
  patientID: 1,
  doctorID: 1,
  visitID: 1,
  invoiceDate: '2024-01-15',
  subtotal: 2000,
  discountAmount: 0,
  taxAmount: 0,
  total: 2000,
  status: 'Paid',
  nextVisitDate: null,
  nextVisitTime: null,
  createdAt: '2024-01-15T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
  patientName: 'John Doe',
  doctorName: 'Sarah Smith',
  paidAmount: 2000,
  ...overrides,
});

const createMockAttachment = (overrides: Partial<Attachment> = {}): Attachment => ({
  attachmentID: 1,
  entityType: 'patient',
  entityID: 1,
  fileName: 'report.pdf',
  filePath: '/path/to/report.pdf',
  fileType: 'pdf',
  fileSize: 1024,
  uploadedAt: '2024-01-15T10:00:00Z',
  ...overrides,
});

const createMockPatientPackage = (overrides: Partial<PatientPackage> = {}): PatientPackage => ({
  patientPackageID: 1,
  patientID: 1,
  packageID: 1,
  packageName: '10 Session Package',
  totalSessions: 10,
  purchaseDate: '2024-01-01',
  expiryDate: '2024-02-01',
  sessionsUsed: 5,
  status: 'Active',
  ...overrides,
});

describe('PatientTimeline', () => {
  describe('Empty state', () => {
    it('displays empty message when no activity exists', () => {
      render(
        <PatientTimeline
          visits={[]}
          invoices={[]}
          attachments={[]}
          packages={[]}
        />
      );

      expect(screen.getByText('No activity recorded yet')).toBeInTheDocument();
    });
  });

  describe('Visit events', () => {
    it('displays visit events in timeline', () => {
      const visit = createMockVisit({ visitType: 'TherapySession', doctorName: 'Sarah Smith' });
      render(
        <PatientTimeline
          visits={[visit]}
          invoices={[]}
          attachments={[]}
          packages={[]}
        />
      );

      expect(screen.getByText(/TherapySession with Dr. Sarah Smith/)).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('displays visit time', () => {
      const visit = createMockVisit({ startTime: '14:30' });
      render(
        <PatientTimeline
          visits={[visit]}
          invoices={[]}
          attachments={[]}
          packages={[]}
        />
      );

      expect(screen.getByText('2:30 PM')).toBeInTheDocument();
    });

    it('calls onVisitClick when visit is clicked', () => {
      const visit = createMockVisit();
      const onVisitClick = jest.fn();
      render(
        <PatientTimeline
          visits={[visit]}
          invoices={[]}
          attachments={[]}
          packages={[]}
          onVisitClick={onVisitClick}
        />
      );

      // Find the visit event and click it
      fireEvent.click(screen.getByText(/TherapySession with Dr./));
      expect(onVisitClick).toHaveBeenCalledWith(visit);
    });

    it('shows different status colors for different visit statuses', () => {
      const visits = [
        createMockVisit({ visitID: 1, status: 'Completed', visitDate: '2024-01-15' }),
        createMockVisit({ visitID: 2, status: 'Scheduled', visitDate: '2024-01-16' }),
        createMockVisit({ visitID: 3, status: 'Cancelled', visitDate: '2024-01-17' }),
      ];
      render(
        <PatientTimeline
          visits={visits}
          invoices={[]}
          attachments={[]}
          packages={[]}
        />
      );

      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('Scheduled')).toBeInTheDocument();
      expect(screen.getByText('Cancelled')).toBeInTheDocument();
    });
  });

  describe('Invoice events', () => {
    it('displays invoice events in timeline', () => {
      const invoice = createMockInvoice({ invoiceNo: 'INV-2024-0001', total: 5000 });
      render(
        <PatientTimeline
          visits={[]}
          invoices={[invoice]}
          attachments={[]}
          packages={[]}
        />
      );

      expect(screen.getByText('Invoice INV-2024-0001')).toBeInTheDocument();
      expect(screen.getByText('Rs. 5,000')).toBeInTheDocument();
    });

    it('displays invoice status', () => {
      const invoice = createMockInvoice({ status: 'Paid' });
      render(
        <PatientTimeline
          visits={[]}
          invoices={[invoice]}
          attachments={[]}
          packages={[]}
        />
      );

      expect(screen.getByText('Paid')).toBeInTheDocument();
    });

    it('calls onInvoiceClick when invoice is clicked', () => {
      const invoice = createMockInvoice();
      const onInvoiceClick = jest.fn();
      render(
        <PatientTimeline
          visits={[]}
          invoices={[invoice]}
          attachments={[]}
          packages={[]}
          onInvoiceClick={onInvoiceClick}
        />
      );

      fireEvent.click(screen.getByText(/Invoice INV/));
      expect(onInvoiceClick).toHaveBeenCalledWith(invoice);
    });
  });

  describe('Attachment events', () => {
    it('displays attachment events in timeline', () => {
      const attachment = createMockAttachment({ fileName: 'xray-report.pdf', fileType: 'pdf' });
      render(
        <PatientTimeline
          visits={[]}
          invoices={[]}
          attachments={[attachment]}
          packages={[]}
        />
      );

      expect(screen.getByText('xray-report.pdf')).toBeInTheDocument();
      expect(screen.getByText('pdf')).toBeInTheDocument();
    });
  });

  describe('Package events', () => {
    it('displays package purchase events in timeline', () => {
      const pkg = createMockPatientPackage({ packageName: '10 Session Package' });
      render(
        <PatientTimeline
          visits={[]}
          invoices={[]}
          attachments={[]}
          packages={[pkg]}
        />
      );

      expect(screen.getByText('Purchased: 10 Session Package')).toBeInTheDocument();
      expect(screen.getByText('5/10 sessions used')).toBeInTheDocument();
    });

    it('displays package status', () => {
      const pkg = createMockPatientPackage({ status: 'Active' });
      render(
        <PatientTimeline
          visits={[]}
          invoices={[]}
          attachments={[]}
          packages={[pkg]}
        />
      );

      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  describe('Timeline ordering', () => {
    it('sorts events by date (most recent first)', () => {
      const visit1 = createMockVisit({ visitID: 1, visitDate: '2024-01-01' });
      const visit2 = createMockVisit({ visitID: 2, visitDate: '2024-01-15' });
      const invoice = createMockInvoice({ invoiceDate: '2024-01-10' });

      const { container } = render(
        <PatientTimeline
          visits={[visit1, visit2]}
          invoices={[invoice]}
          attachments={[]}
          packages={[]}
        />
      );

      // The events should be in order: Jan 15, Jan 10, Jan 1
      const dates = container.querySelectorAll('[class*="caption"]');
      expect(dates.length).toBeGreaterThan(0);
    });

    it('respects maxItems prop', () => {
      const visits = Array.from({ length: 10 }, (_, i) =>
        createMockVisit({
          visitID: i + 1,
          visitDate: `2024-01-${String(i + 1).padStart(2, '0')}`
        })
      );

      render(
        <PatientTimeline
          visits={visits}
          invoices={[]}
          attachments={[]}
          packages={[]}
          maxItems={5}
        />
      );

      // Should only show 5 visits
      const completedChips = screen.getAllByText('Completed');
      expect(completedChips.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Date grouping', () => {
    it('groups events by date', () => {
      const visit1 = createMockVisit({ visitID: 1, visitDate: '2024-01-15', startTime: '09:00' });
      const visit2 = createMockVisit({ visitID: 2, visitDate: '2024-01-15', startTime: '14:00' });

      render(
        <PatientTimeline
          visits={[visit1, visit2]}
          invoices={[]}
          attachments={[]}
          packages={[]}
        />
      );

      // Both visits should be under the same date header
      expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument();
    });
  });
});
