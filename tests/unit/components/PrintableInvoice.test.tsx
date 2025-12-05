/**
 * PrintableInvoice Component Unit Tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import PrintableInvoice from '../../../src/renderer/components/PrintableInvoice';
import type { Invoice, InvoiceItem, Settings } from '../../../src/types';

describe('PrintableInvoice Component', () => {
  const mockInvoice: Invoice = {
    invoiceID: 1,
    invoiceNo: 'INV-00001',
    patientID: 1,
    patientName: 'John Doe',
    patientPhone: '0300-1234567',
    doctorID: 1,
    doctorName: 'Dr. Sarah Khan',
    invoiceDate: '2024-01-15',
    dueDate: '2024-01-30',
    subtotal: 5000,
    discountAmount: 500,
    taxAmount: 0,
    total: 4500,
    totalAmount: 4500,
    paidAmount: 2000,
    status: 'PartiallyPaid',
    nextVisitDate: '2024-01-22',
    nextVisitTime: '10:00',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  };

  const mockItems: InvoiceItem[] = [
    {
      itemID: 1,
      invoiceID: 1,
      serviceID: 1,
      serviceName: 'PT Session',
      description: 'Physiotherapy Session',
      quantity: 2,
      unitPrice: 2000,
      lineTotal: 4000,
    },
    {
      itemID: 2,
      invoiceID: 1,
      serviceID: 2,
      serviceName: 'Evaluation',
      description: 'Initial Evaluation',
      quantity: 1,
      unitPrice: 1000,
      lineTotal: 1000,
    },
  ];

  const mockSettings: Settings = {
    settingsID: 1,
    clinicName: 'Test Clinic',
    address: '123 Test Street\nTest City',
    phone: '0300-1234567',
    whatsApp: '0300-1234567',
    email: 'test@clinic.com',
    website: 'www.testclinic.com',
    logoPath: '',
    invoicePrefix: 'INV',
    currency: 'Rs',
    taxPercent: 0,
    defaultVisitDuration: 45,
  };

  it('should render clinic name from settings', () => {
    render(
      <PrintableInvoice
        invoice={mockInvoice}
        items={mockItems}
        settings={mockSettings}
        logoBase64={null}
      />
    );

    expect(screen.getByText('Test Clinic')).toBeInTheDocument();
  });

  it('should render invoice title', () => {
    render(
      <PrintableInvoice
        invoice={mockInvoice}
        items={mockItems}
        settings={mockSettings}
        logoBase64={null}
      />
    );

    expect(screen.getByText('INVOICE')).toBeInTheDocument();
  });

  it('should render invoice number', () => {
    render(
      <PrintableInvoice
        invoice={mockInvoice}
        items={mockItems}
        settings={mockSettings}
        logoBase64={null}
      />
    );

    expect(screen.getByText('INV-00001')).toBeInTheDocument();
  });

  it('should render patient name in Bill To section', () => {
    render(
      <PrintableInvoice
        invoice={mockInvoice}
        items={mockItems}
        settings={mockSettings}
        logoBase64={null}
      />
    );

    expect(screen.getByText('BILL TO:')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should render invoice items', () => {
    render(
      <PrintableInvoice
        invoice={mockInvoice}
        items={mockItems}
        settings={mockSettings}
        logoBase64={null}
      />
    );

    expect(screen.getByText('Physiotherapy Session')).toBeInTheDocument();
    expect(screen.getByText('Initial Evaluation')).toBeInTheDocument();
  });

  it('should render item quantities and prices', () => {
    render(
      <PrintableInvoice
        invoice={mockInvoice}
        items={mockItems}
        settings={mockSettings}
        logoBase64={null}
      />
    );

    // Check for quantity column values
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should render totals section', () => {
    render(
      <PrintableInvoice
        invoice={mockInvoice}
        items={mockItems}
        settings={mockSettings}
        logoBase64={null}
      />
    );

    expect(screen.getByText('Subtotal:')).toBeInTheDocument();
    expect(screen.getByText('Discount:')).toBeInTheDocument();
    expect(screen.getByText('Total:')).toBeInTheDocument();
    expect(screen.getByText('Paid:')).toBeInTheDocument();
    expect(screen.getByText('Balance Due:')).toBeInTheDocument();
  });

  it('should render next visit information when available', () => {
    render(
      <PrintableInvoice
        invoice={mockInvoice}
        items={mockItems}
        settings={mockSettings}
        logoBase64={null}
      />
    );

    expect(screen.getByText(/Next Visit:/)).toBeInTheDocument();
  });

  it('should render thank you message', () => {
    render(
      <PrintableInvoice
        invoice={mockInvoice}
        items={mockItems}
        settings={mockSettings}
        logoBase64={null}
      />
    );

    expect(screen.getByText('Thank you for your visit!')).toBeInTheDocument();
  });

  it('should render logo when logoBase64 is provided', () => {
    const logoBase64 = 'data:image/png;base64,iVBORw0KGgo=';
    render(
      <PrintableInvoice
        invoice={mockInvoice}
        items={mockItems}
        settings={mockSettings}
        logoBase64={logoBase64}
      />
    );

    const logo = screen.getByAltText('Clinic Logo');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', logoBase64);
  });

  it('should not render logo when logoBase64 is null', () => {
    render(
      <PrintableInvoice
        invoice={mockInvoice}
        items={mockItems}
        settings={mockSettings}
        logoBase64={null}
      />
    );

    expect(screen.queryByAltText('Clinic Logo')).not.toBeInTheDocument();
  });

  it('should render clinic address when available', () => {
    render(
      <PrintableInvoice
        invoice={mockInvoice}
        items={mockItems}
        settings={mockSettings}
        logoBase64={null}
      />
    );

    expect(screen.getByText(/123 Test Street/)).toBeInTheDocument();
  });

  it('should render clinic phone when available', () => {
    render(
      <PrintableInvoice
        invoice={mockInvoice}
        items={mockItems}
        settings={mockSettings}
        logoBase64={null}
      />
    );

    // Phone appears in both clinic header and Bill To section
    const phoneElements = screen.getAllByText(/Phone: 0300-1234567/);
    expect(phoneElements.length).toBeGreaterThanOrEqual(1);
  });

  it('should render website in footer when available', () => {
    render(
      <PrintableInvoice
        invoice={mockInvoice}
        items={mockItems}
        settings={mockSettings}
        logoBase64={null}
      />
    );

    expect(screen.getByText('www.testclinic.com')).toBeInTheDocument();
  });

  it('should use default clinic name when settings is null', () => {
    render(
      <PrintableInvoice
        invoice={mockInvoice}
        items={mockItems}
        settings={null}
        logoBase64={null}
      />
    );

    expect(screen.getByText('Clinic Name')).toBeInTheDocument();
  });
});
