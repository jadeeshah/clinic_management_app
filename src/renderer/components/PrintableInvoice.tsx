import React from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Divider } from '@mui/material';
import type { Invoice, InvoiceItem, Settings } from '../../types';

interface PrintableInvoiceData extends Invoice {
  patientPhone?: string;
  dueDate?: string;
}

interface PrintableInvoiceProps {
  invoice: PrintableInvoiceData;
  items: InvoiceItem[];
  settings: Settings | null;
  logoBase64: string | null;
}

const PrintableInvoice: React.FC<PrintableInvoiceProps> = ({ invoice, items, settings, logoBase64 }) => {
  const formatCurrency = (amount: number) => {
    const currency = settings?.currency || 'Rs';
    return `${currency} ${amount.toLocaleString()}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discountAmount = invoice.discountAmount || 0;
  const total = invoice.total;
  const paid = invoice.paidAmount || 0;
  const balance = total - paid;

  return (
    <Box className="printable-invoice" sx={{ p: 4, maxWidth: 800, mx: 'auto', fontFamily: 'Arial, sans-serif' }}>
      {/* Header with Logo and Clinic Info */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          {logoBase64 && (
            <img
              src={logoBase64}
              alt="Clinic Logo"
              style={{ width: 80, height: 80, objectFit: 'contain' }}
            />
          )}
          <Box>
            <Typography variant="h5" fontWeight="bold">
              {settings?.clinicName || 'Clinic Name'}
            </Typography>
            {settings?.address && (
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                {settings.address}
              </Typography>
            )}
            {settings?.phone && (
              <Typography variant="body2" color="text.secondary">
                Phone: {settings.phone}
              </Typography>
            )}
            {settings?.email && (
              <Typography variant="body2" color="text.secondary">
                Email: {settings.email}
              </Typography>
            )}
          </Box>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="h4" fontWeight="bold" color="primary">
            INVOICE
          </Typography>
          <Typography variant="body1">
            <strong>Invoice #:</strong> {settings?.invoicePrefix || 'INV'}-{String(invoice.invoiceID).padStart(5, '0')}
          </Typography>
          <Typography variant="body1">
            <strong>Date:</strong> {formatDate(invoice.invoiceDate)}
          </Typography>
          {invoice.dueDate && (
            <Typography variant="body1">
              <strong>Due Date:</strong> {formatDate(invoice.dueDate)}
            </Typography>
          )}
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Bill To Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          BILL TO:
        </Typography>
        <Typography variant="body1" fontWeight="bold">
          {invoice.patientName}
        </Typography>
        {invoice.patientPhone && (
          <Typography variant="body2">
            Phone: {invoice.patientPhone}
          </Typography>
        )}
      </Box>

      {/* Items Table */}
      <Table sx={{ mb: 3 }} size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: 'grey.100' }}>
            <TableCell sx={{ fontWeight: 'bold', borderBottom: '2px solid #000' }}>Description</TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold', borderBottom: '2px solid #000' }}>Qty</TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold', borderBottom: '2px solid #000' }}>Unit Price</TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold', borderBottom: '2px solid #000' }}>Total</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.itemID}>
              <TableCell sx={{ borderBottom: '1px solid #ddd' }}>
                {item.description || `Service #${item.serviceID}`}
              </TableCell>
              <TableCell align="center" sx={{ borderBottom: '1px solid #ddd' }}>
                {item.quantity}
              </TableCell>
              <TableCell align="right" sx={{ borderBottom: '1px solid #ddd' }}>
                {formatCurrency(item.unitPrice)}
              </TableCell>
              <TableCell align="right" sx={{ borderBottom: '1px solid #ddd' }}>
                {formatCurrency(item.quantity * item.unitPrice)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Totals Section */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
        <Box sx={{ width: 300 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
            <Typography>Subtotal:</Typography>
            <Typography>{formatCurrency(subtotal)}</Typography>
          </Box>
          {discountAmount > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
              <Typography>Discount:</Typography>
              <Typography color="error">-{formatCurrency(discountAmount)}</Typography>
            </Box>
          )}
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
            <Typography fontWeight="bold">Total:</Typography>
            <Typography fontWeight="bold">{formatCurrency(total)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
            <Typography>Paid:</Typography>
            <Typography color="success.main">{formatCurrency(paid)}</Typography>
          </Box>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, bgcolor: balance > 0 ? 'error.light' : 'success.light', px: 1, borderRadius: 1 }}>
            <Typography fontWeight="bold">Balance Due:</Typography>
            <Typography fontWeight="bold">{formatCurrency(balance)}</Typography>
          </Box>
        </Box>
      </Box>

      {/* Next Visit Info */}
      {invoice.nextVisitDate && (
        <Box sx={{ mb: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
          <Typography variant="body1">
            <strong>Next Visit:</strong> {formatDate(invoice.nextVisitDate)}
            {invoice.nextVisitTime && ` at ${invoice.nextVisitTime}`}
          </Typography>
        </Box>
      )}

      {/* Footer */}
      <Divider sx={{ mb: 2 }} />
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Thank you for your visit!
        </Typography>
        {settings?.website && (
          <Typography variant="body2" color="text.secondary">
            {settings.website}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default PrintableInvoice;
