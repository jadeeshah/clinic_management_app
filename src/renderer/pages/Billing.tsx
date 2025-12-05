import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  InputAdornment,
  Autocomplete,
  Divider,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Payment as PaymentIcon,
  Delete as DeleteIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import type { Invoice, Patient, Doctor, Service, InvoiceItem, Payment, Visit, Settings } from '../../types';
import PrintableInvoice from '../components/PrintableInvoice';
import { StatusChip, TableSkeleton, EmptyState } from '../components';
import { formatCurrency, formatDate } from '../utils/formatters';

interface InvoiceWithDetails extends Invoice {
  items?: InvoiceItem[];
  payments?: Payment[];
  patientPhone?: string;
  patientMRN?: string;
}

interface InvoiceItemForm {
  serviceID: number | null;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

const Billing: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Create Invoice State
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItemForm[]>([]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [nextVisitDate, setNextVisitDate] = useState('');
  const [nextVisitTime, setNextVisitTime] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // View Invoice State
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithDetails | null>(null);

  // Payment State
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'BankTransfer'>('Cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNotes, setPaymentNotes] = useState('');

  // Patient's next scheduled visit for auto-populate
  const [patientNextVisit, setPatientNextVisit] = useState<Visit | null>(null);

  // Print state
  const [isPrinting, setIsPrinting] = useState(false);
  const [clinicSettings, setClinicSettings] = useState<Settings | null>(null);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);

  useEffect(() => {
    loadInvoices();
    loadDoctors();
    loadServices();
    loadClinicSettings();
  }, []);

  // Handle URL params for pre-selecting patient (from Visits page) or viewing invoice
  useEffect(() => {
    const patientId = searchParams.get('patientId');
    const visitId = searchParams.get('visitId');
    const invoiceId = searchParams.get('id');

    if (invoiceId) {
      // View specific invoice
      loadAndViewInvoice(Number(invoiceId));
      setSearchParams({});
    } else if (patientId) {
      loadPatientAndVisit(Number(patientId), visitId ? Number(visitId) : undefined);
      // Clear URL params
      setSearchParams({});
    }
  }, []);

  const loadAndViewInvoice = async (invoiceID: number) => {
    try {
      // Wait for invoices to load
      await loadInvoices();
      // Find the invoice and open view dialog
      const result = await window.electronAPI.database.execute<Invoice>('get-invoice', { invoiceID });
      if (result.success && result.data) {
        handleViewInvoice(result.data);
      }
    } catch (error) {
      console.error('Failed to load invoice:', error);
    }
  };

  const loadPatientAndVisit = async (patientID: number, visitID?: number) => {
    try {
      // Load patient
      const patientResult = await window.electronAPI.database.execute<{ items: Patient[] }>('get-patients', {
        patientID,
        limit: 1
      });

      if (!patientResult.success || !patientResult.data?.items?.length) {
        console.error('Patient not found');
        return;
      }

      const patient = patientResult.data.items[0];

      // Load visit details if visitID is provided
      let visitDoctor: Doctor | null = null;
      let visitService: Service | null = null;

      if (visitID) {
        const visitResult = await window.electronAPI.database.execute<Visit>('get-visit', { visitID });
        if (visitResult.success && visitResult.data) {
          const visit = visitResult.data;
          // Find the doctor from the visit
          visitDoctor = doctors.find(d => d.doctorID === visit.doctorID) || null;
          // Find a service matching the visit type
          const visitTypeServiceMap: Record<string, string> = {
            'TherapySession': 'PT-001',
            'Evaluation': 'PT-002',
            'FollowUp': 'PT-001',
          };
          const serviceCode = visitTypeServiceMap[visit.visitType] || 'PT-001';
          visitService = services.find(s => s.code === serviceCode) || services[0] || null;
        }
      }

      // Wait for doctors to load, then open dialog with patient and visit data pre-selected
      setTimeout(async () => {
        setSelectedDoctor(visitDoctor || (doctors.length > 0 ? doctors[0] : null));
        setInvoiceDate(new Date().toISOString().split('T')[0]);

        // Pre-populate invoice items based on visit service
        if (visitService) {
          setInvoiceItems([{
            serviceID: visitService.serviceID,
            description: visitService.name,
            quantity: 1,
            unitPrice: visitService.defaultPrice,
            lineTotal: visitService.defaultPrice
          }]);
        } else {
          setInvoiceItems([{
            serviceID: null,
            description: '',
            quantity: 1,
            unitPrice: 0,
            lineTotal: 0
          }]);
        }

        setDiscountAmount(0);
        setError(null);
        await handlePatientSelect(patient);
        setCreateDialogOpen(true);
      }, 100);
    } catch (error) {
      console.error('Failed to load patient/visit:', error);
    }
  };

  const loadInvoices = async () => {
    setIsLoading(true);
    try {
      const params: { status?: string } = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const result = await window.electronAPI.database.execute<Invoice[]>('get-invoices', params);
      if (result.success && result.data) {
        setInvoices(result.data);
      }
    } catch (error) {
      console.error('Failed to load invoices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDoctors = async () => {
    try {
      const result = await window.electronAPI.database.execute<Doctor[]>('get-doctors');
      if (result.success && result.data) {
        setDoctors(result.data);
      }
    } catch (error) {
      console.error('Failed to load doctors:', error);
    }
  };

  const loadServices = async () => {
    try {
      const result = await window.electronAPI.database.execute<Service[]>('get-services');
      if (result.success && result.data) {
        setServices(result.data);
      }
    } catch (error) {
      console.error('Failed to load services:', error);
    }
  };

  const loadClinicSettings = async () => {
    try {
      const result = await window.electronAPI.database.execute<Settings>('get-settings');
      if (result.success && result.data) {
        setClinicSettings(result.data);
        // Load logo if path exists
        if (result.data.logoPath) {
          const logoResult = await window.electronAPI.files.readLogoBase64(result.data.logoPath);
          if (logoResult.success && logoResult.data) {
            setLogoBase64(logoResult.data);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load clinic settings:', error);
    }
  };

  const searchPatients = useCallback(async (query: string) => {
    if (query.length < 2) {
      setPatients([]);
      return;
    }

    try {
      const result = await window.electronAPI.database.execute<Patient[]>('search-patients', {
        query,
        limit: 10
      });
      if (result.success && result.data) {
        setPatients(result.data);
      }
    } catch (error) {
      console.error('Failed to search patients:', error);
    }
  }, []);

  const loadPatientNextVisit = async (patientID: number) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await window.electronAPI.database.execute<{ items: Visit[] }>('get-visits', {
        startDate: today,
        status: 'Scheduled',
        limit: 1
      });
      if (result.success && result.data && result.data.items && result.data.items.length > 0) {
        const visit = result.data.items[0];
        if (visit.patientID === patientID) {
          setPatientNextVisit(visit);
          setNextVisitDate(visit.visitDate);
          setNextVisitTime(visit.startTime);
        }
      }
    } catch (error) {
      console.error('Failed to load next visit:', error);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      searchPatients(patientSearch);
    }, 300);
    return () => clearTimeout(debounce);
  }, [patientSearch, searchPatients]);

  useEffect(() => {
    loadInvoices();
  }, [statusFilter]);

  const handleOpenCreateDialog = () => {
    setSelectedPatient(null);
    setSelectedDoctor(doctors.length > 0 ? doctors[0] : null);
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setInvoiceItems([{
      serviceID: null,
      description: '',
      quantity: 1,
      unitPrice: 0,
      lineTotal: 0
    }]);
    setDiscountAmount(0);
    setNextVisitDate('');
    setNextVisitTime('');
    setPatientNextVisit(null);
    setError(null);
    setCreateDialogOpen(true);
  };

  const handlePatientSelect = async (patient: Patient | null) => {
    setSelectedPatient(patient);
    if (patient) {
      await loadPatientNextVisit(patient.patientID);
    } else {
      setPatientNextVisit(null);
      setNextVisitDate('');
      setNextVisitTime('');
    }
  };

  const handleAddItem = () => {
    setInvoiceItems([...invoiceItems, {
      serviceID: null,
      description: '',
      quantity: 1,
      unitPrice: 0,
      lineTotal: 0
    }]);
  };

  const handleRemoveItem = (index: number) => {
    if (invoiceItems.length > 1) {
      setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof InvoiceItemForm, value: unknown) => {
    const newItems = [...invoiceItems];
    newItems[index] = { ...newItems[index], [field]: value };

    // Auto-calculate line total
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].lineTotal = newItems[index].quantity * newItems[index].unitPrice;
    }

    // If service selected, auto-fill description and price
    if (field === 'serviceID' && value) {
      const service = services.find(s => s.serviceID === value);
      if (service) {
        newItems[index].description = service.name;
        newItems[index].unitPrice = service.defaultPrice;
        newItems[index].lineTotal = newItems[index].quantity * service.defaultPrice;
      }
    }

    setInvoiceItems(newItems);
  };

  const calculateSubtotal = () => invoiceItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const calculateTotal = () => calculateSubtotal() - discountAmount;

  const handleCreateInvoice = async () => {
    if (!selectedPatient) {
      setError('Please select a patient');
      return;
    }

    const validItems = invoiceItems.filter(item => item.description && item.lineTotal > 0);
    if (validItems.length === 0) {
      setError('Please add at least one valid item');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const result = await window.electronAPI.database.execute<{ invoiceID: number; invoiceNo: string }>('create-invoice', {
        patientID: selectedPatient.patientID,
        doctorID: selectedDoctor?.doctorID || null,
        invoiceDate,
        items: validItems,
        discountAmount,
        taxAmount: 0,
        nextVisitDate: nextVisitDate || null,
        nextVisitTime: nextVisitTime || null,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create invoice');
      }

      await loadInvoices();
      setCreateDialogOpen(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewInvoice = async (invoice: Invoice) => {
    try {
      const result = await window.electronAPI.database.execute<InvoiceWithDetails>('get-invoice', {
        invoiceID: invoice.invoiceID
      });
      if (result.success && result.data) {
        setSelectedInvoice(result.data);
        setViewDialogOpen(true);
      }
    } catch (error) {
      console.error('Failed to load invoice details:', error);
    }
  };

  const handleOpenPaymentDialog = (invoice: InvoiceWithDetails) => {
    setSelectedInvoice(invoice);
    const remaining = invoice.total - (invoice.paidAmount || 0);
    setPaymentAmount(remaining);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('Cash');
    setPaymentNotes('');
    setPaymentDialogOpen(true);
  };

  const handleCreatePayment = async () => {
    if (!selectedInvoice || paymentAmount <= 0) return;

    setIsSaving(true);
    try {
      const result = await window.electronAPI.database.execute('create-payment', {
        invoiceID: selectedInvoice.invoiceID,
        paymentDate,
        amount: paymentAmount,
        method: paymentMethod,
        notes: paymentNotes || null,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to record payment');
      }

      await loadInvoices();
      setPaymentDialogOpen(false);
      setViewDialogOpen(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintInvoice = () => {
    if (!selectedInvoice) return;
    setIsPrinting(true);
    // Use setTimeout to ensure the print content is rendered before printing
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Billing</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateDialog}
        >
          New Invoice
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status Filter"
              >
                <MenuItem value="all">All Invoices</MenuItem>
                <MenuItem value="Unpaid">Unpaid</MenuItem>
                <MenuItem value="PartiallyPaid">Partially Paid</MenuItem>
                <MenuItem value="Paid">Paid</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Invoices Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Invoice No</TableCell>
              <TableCell>Patient</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell align="right">Paid</TableCell>
              <TableCell align="right">Balance</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Next Visit</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          {isLoading ? (
            <TableSkeleton columns={9} rows={5} />
          ) : (
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9}>
                    <EmptyState
                      title={statusFilter !== 'all' ? 'No invoices found' : 'No invoices yet'}
                      description={statusFilter !== 'all'
                        ? 'Try changing the status filter'
                        : 'Create your first invoice to start billing'
                      }
                      filterCount={statusFilter !== 'all' ? 1 : 0}
                      onClearFilters={() => setStatusFilter('all')}
                      actionLabel={statusFilter === 'all' ? 'New Invoice' : undefined}
                      onAction={statusFilter === 'all' ? handleOpenCreateDialog : undefined}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => {
                // For Paid invoices, balance should always be 0
                const balance = invoice.status === 'Paid' ? 0 : invoice.total - (invoice.paidAmount || 0);
                return (
                  <TableRow key={invoice.invoiceID} hover>
                    <TableCell>
                      <Typography fontWeight="medium">{invoice.invoiceNo}</Typography>
                    </TableCell>
                    <TableCell>{invoice.patientName}</TableCell>
                    <TableCell>{new Date(invoice.invoiceDate).toLocaleDateString()}</TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="medium">Rs {invoice.total.toLocaleString()}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography color="success.main">
                        Rs {(invoice.status === 'Paid' ? invoice.total : (invoice.paidAmount || 0)).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography color={balance > 0 ? 'error.main' : 'success.main'}>
                        Rs {balance.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <StatusChip status={invoice.status} />
                    </TableCell>
                    <TableCell>
                      {invoice.nextVisitDate ? (
                        <Typography variant="body2">
                          {new Date(invoice.nextVisitDate).toLocaleDateString()}
                          {invoice.nextVisitTime && ` @ ${invoice.nextVisitTime}`}
                        </Typography>
                      ) : '-'}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleViewInvoice(invoice)} aria-label="View invoice">
                        <ViewIcon fontSize="small" />
                      </IconButton>
                      {invoice.status !== 'Paid' && invoice.status !== 'Void' && (
                        <IconButton size="small" onClick={() => handleViewInvoice(invoice)} aria-label="Record payment" color="success">
                          <PaymentIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                );
                })
              )}
            </TableBody>
          )}
        </Table>
      </TableContainer>

      {/* Create Invoice Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Invoice</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Patient Selection */}
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={patients}
                getOptionLabel={(option) => `${option.firstName} ${option.lastName || ''} (${option.phone})`}
                value={selectedPatient}
                onChange={(_, value) => handlePatientSelect(value)}
                onInputChange={(_, value) => setPatientSearch(value)}
                renderInput={(params) => (
                  <TextField {...params} label="Search Patient (Phone/Name)" required />
                )}
                isOptionEqualToValue={(option, value) => option.patientID === value.patientID}
              />
            </Grid>

            {/* Doctor Selection */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Doctor</InputLabel>
                <Select
                  value={selectedDoctor?.doctorID || ''}
                  onChange={(e) => setSelectedDoctor(doctors.find(d => d.doctorID === e.target.value) || null)}
                  label="Doctor"
                >
                  {doctors.map((doctor) => (
                    <MenuItem key={doctor.doctorID} value={doctor.doctorID}>
                      {doctor.firstName} {doctor.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Invoice Date */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Invoice Date"
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          {/* Invoice Items */}
          <Typography variant="subtitle1" sx={{ mt: 3, mb: 2 }}>Invoice Items</Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Service</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell width={80}>Qty</TableCell>
                  <TableCell width={120}>Unit Price</TableCell>
                  <TableCell width={120}>Total</TableCell>
                  <TableCell width={50}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoiceItems.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <FormControl fullWidth size="small">
                        <Select
                          value={item.serviceID || ''}
                          onChange={(e) => handleItemChange(index, 'serviceID', e.target.value || null)}
                          displayEmpty
                        >
                          <MenuItem value="">-- Custom --</MenuItem>
                          {services.map((service) => (
                            <MenuItem key={service.serviceID} value={service.serviceID}>
                              {service.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                        inputProps={{ min: 1 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', Number(e.target.value))}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight="medium">
                        Rs {item.lineTotal.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {invoiceItems.length > 1 && (
                        <IconButton size="small" onClick={() => handleRemoveItem(index)} color="error" aria-label="Remove item">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Button startIcon={<AddIcon />} onClick={handleAddItem} sx={{ mt: 1 }}>
            Add Item
          </Button>

          {/* Totals */}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Grid container spacing={2} sx={{ maxWidth: 350 }}>
              <Grid item xs={6}><Typography>Subtotal:</Typography></Grid>
              <Grid item xs={6}><Typography align="right">Rs {calculateSubtotal().toLocaleString()}</Typography></Grid>

              <Grid item xs={6}><Typography>Discount:</Typography></Grid>
              <Grid item xs={6}>
                <TextField
                  size="small"
                  type="number"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
                  }}
                />
              </Grid>

              <Grid item xs={6}><Typography variant="h6">Total:</Typography></Grid>
              <Grid item xs={6}>
                <Typography variant="h6" align="right" color="primary">
                  Rs {calculateTotal().toLocaleString()}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Next Visit (Auto-populated with override) */}
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Next Visit on Invoice
            {patientNextVisit && (
              <Chip
                label="Auto-populated"
                size="small"
                color="info"
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Next Visit Date"
                type="date"
                value={nextVisitDate}
                onChange={(e) => setNextVisitDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                helperText={patientNextVisit ? "Based on scheduled appointment" : "Optional"}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Next Visit Time"
                type="time"
                value={nextVisitTime}
                onChange={(e) => setNextVisitTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateInvoice} disabled={isSaving}>
            {isSaving ? <CircularProgress size={24} /> : 'Create Invoice'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Invoice Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        {selectedInvoice && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Invoice {selectedInvoice.invoiceNo}</span>
                <StatusChip status={selectedInvoice.status} />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Tabs value={0}>
                <Tab label="Details" />
              </Tabs>

              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Patient</Typography>
                    <Typography fontWeight="medium">{selectedInvoice.patientName}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Date</Typography>
                    <Typography>{new Date(selectedInvoice.invoiceDate).toLocaleDateString()}</Typography>
                  </Grid>
                  {selectedInvoice.doctorName && (
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Doctor</Typography>
                      <Typography>{selectedInvoice.doctorName}</Typography>
                    </Grid>
                  )}
                  {selectedInvoice.nextVisitDate && (
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Next Visit</Typography>
                      <Typography color="primary">
                        {new Date(selectedInvoice.nextVisitDate).toLocaleDateString()}
                        {selectedInvoice.nextVisitTime && ` @ ${selectedInvoice.nextVisitTime}`}
                      </Typography>
                    </Grid>
                  )}
                </Grid>

                <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>Items</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Description</TableCell>
                        <TableCell align="center">Qty</TableCell>
                        <TableCell align="right">Unit Price</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedInvoice.items?.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell align="center">{item.quantity}</TableCell>
                          <TableCell align="right">Rs {item.unitPrice.toLocaleString()}</TableCell>
                          <TableCell align="right">Rs {item.lineTotal.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={3} align="right"><strong>Subtotal</strong></TableCell>
                        <TableCell align="right"><strong>Rs {selectedInvoice.subtotal.toLocaleString()}</strong></TableCell>
                      </TableRow>
                      {selectedInvoice.discountAmount > 0 && (
                        <TableRow>
                          <TableCell colSpan={3} align="right">Discount</TableCell>
                          <TableCell align="right">- Rs {selectedInvoice.discountAmount.toLocaleString()}</TableCell>
                        </TableRow>
                      )}
                      <TableRow>
                        <TableCell colSpan={3} align="right"><Typography variant="h6">Total</Typography></TableCell>
                        <TableCell align="right">
                          <Typography variant="h6" color="primary">Rs {selectedInvoice.total.toLocaleString()}</Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Payments */}
                <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>Payments</Typography>
                {selectedInvoice.payments && selectedInvoice.payments.length > 0 ? (
                  <List dense>
                    {selectedInvoice.payments.map((payment, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={`Rs ${payment.amount.toLocaleString()} via ${payment.method}`}
                          secondary={new Date(payment.paymentDate).toLocaleDateString()}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography color="text.secondary">No payments recorded</Typography>
                )}

                {/* Balance */}
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Grid container>
                    <Grid item xs={6}>
                      <Typography>Total Paid:</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography align="right" color="success.main">
                        Rs {(selectedInvoice.paidAmount || 0).toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography fontWeight="bold">Balance Due:</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography align="right" fontWeight="bold" color="error.main">
                        Rs {(selectedInvoice.total - (selectedInvoice.paidAmount || 0)).toLocaleString()}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={handlePrintInvoice}
              >
                Print
              </Button>
              {selectedInvoice.status !== 'Paid' && selectedInvoice.status !== 'Void' && (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<PaymentIcon />}
                  onClick={() => handleOpenPaymentDialog(selectedInvoice)}
                >
                  Record Payment
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Payment</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Payment Amount"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Payment Date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  label="Payment Method"
                >
                  <MenuItem value="Cash">Cash</MenuItem>
                  <MenuItem value="Card">Card</MenuItem>
                  <MenuItem value="BankTransfer">Bank Transfer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes (Optional)"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleCreatePayment}
            disabled={isSaving || paymentAmount <= 0}
          >
            {isSaving ? <CircularProgress size={24} /> : 'Record Payment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Hidden Print Container - Only visible when printing */}
      {isPrinting && selectedInvoice && (
        <Box className="print-container">
          <PrintableInvoice
            invoice={{
              ...selectedInvoice,
              patientPhone: selectedInvoice.patientPhone || '',
            }}
            items={selectedInvoice.items || []}
            settings={clinicSettings}
            logoBase64={logoBase64}
          />
        </Box>
      )}
    </Box>
  );
};

export default Billing;
