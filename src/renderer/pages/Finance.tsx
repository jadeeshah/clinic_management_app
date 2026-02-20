import React, { useState, useEffect } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Chip,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  TrendingUp as RevenueIcon,
  TrendingDown as ExpenseIcon,
  AccountBalance as BalanceIcon,
  EventNote as VisitsIcon,
} from '@mui/icons-material';
import type { Expense, ExpenseCategory, Doctor } from '../../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index} style={{ paddingTop: 16 }}>
    {value === index && children}
  </div>
);

interface FinanceSummary {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  totalInvoiced: number;
  totalOutstanding: number;
  completedVisits: number;
  revenueByDay: { date: string; total: number }[];
  expensesByCategory: { category: string; total: number }[];
}

const EXPENSE_CATEGORIES: ExpenseCategory[] = ['Rent', 'Utilities', 'Supplies', 'Salary', 'Equipment', 'Other'];

const Finance: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  // Date Range
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

  // Doctor filter
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorFilter, setDoctorFilter] = useState<string>('');

  // Summary state
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);

  // Expenses state
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(true);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    expenseDate: today.toISOString().split('T')[0],
    title: '',
    category: 'Other' as ExpenseCategory,
    amount: 0,
    paidTo: '',
    notes: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    loadSummary();
    loadExpenses();
  }, [startDate, endDate, doctorFilter]);

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

  const loadSummary = async () => {
    setIsLoadingSummary(true);
    try {
      const params: { startDate: string; endDate: string; doctorID?: number } = {
        startDate,
        endDate,
      };
      if (doctorFilter) {
        params.doctorID = Number(doctorFilter);
      }
      const result = await window.electronAPI.database.execute<FinanceSummary>('get-finance-summary', params);
      if (result.success && result.data) {
        setSummary(result.data);
      }
    } catch (error) {
      console.error('Failed to load finance summary:', error);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const loadExpenses = async () => {
    setIsLoadingExpenses(true);
    try {
      const result = await window.electronAPI.database.execute<Expense[]>('get-expenses', {
        startDate,
        endDate
      });
      if (result.success && result.data) {
        setExpenses(result.data);
      }
    } catch (error) {
      console.error('Failed to load expenses:', error);
    } finally {
      setIsLoadingExpenses(false);
    }
  };

  const handleOpenExpenseDialog = () => {
    setExpenseForm({
      expenseDate: today.toISOString().split('T')[0],
      title: '',
      category: 'Other',
      amount: 0,
      paidTo: '',
      notes: '',
    });
    setError(null);
    setExpenseDialogOpen(true);
  };

  const handleSaveExpense = async () => {
    if (!expenseForm.title.trim() || expenseForm.amount <= 0) {
      setError('Title and amount are required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const result = await window.electronAPI.database.execute('create-expense', expenseForm);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create expense');
      }

      await loadExpenses();
      await loadSummary();
      setExpenseDialogOpen(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteExpense = async (expense: Expense) => {
    if (!confirm(`Delete expense "${expense.title}"?`)) return;

    try {
      await window.electronAPI.database.execute('delete-expense', {
        expenseID: expense.expenseID
      });
      await loadExpenses();
      await loadSummary();
    } catch (error) {
      console.error('Failed to delete expense:', error);
    }
  };

  const handleExport = async () => {
    if (!summary) return;

    // Fetch detailed payment data for export
    interface DetailRow {
      date: string;
      patientName: string;
      amount: number;
      doctorName: string;
      servicesUsed: string;
      paymentMethod: string;
      invoiceNo: string;
    }

    const params: { startDate: string; endDate: string; doctorID?: number } = { startDate, endDate };
    if (doctorFilter) params.doctorID = Number(doctorFilter);

    const detailResult = await window.electronAPI.database.execute<DetailRow[]>('get-finance-detail-export', params);
    const details: DetailRow[] = (detailResult.success && detailResult.data) ? detailResult.data : [];

    // Generate CSV content
    let csvContent = 'Finance Report\n';
    csvContent += `Period: ${startDate} to ${endDate}\n`;
    if (doctorFilter) {
      const doc = doctors.find(d => d.doctorID === Number(doctorFilter));
      if (doc) csvContent += `Doctor: Dr. ${doc.firstName} ${doc.lastName || ''}\n`;
    }
    csvContent += '\n';

    csvContent += 'Summary\n';
    csvContent += `Total Revenue,Rs ${summary.totalRevenue.toLocaleString()}\n`;
    csvContent += `Total Expenses,Rs ${summary.totalExpenses.toLocaleString()}\n`;
    csvContent += `Net Income,Rs ${summary.netIncome.toLocaleString()}\n`;
    csvContent += `Total Invoiced,Rs ${summary.totalInvoiced.toLocaleString()}\n`;
    csvContent += `Outstanding,Rs ${summary.totalOutstanding.toLocaleString()}\n`;
    csvContent += `Completed Visits,${summary.completedVisits}\n\n`;

    csvContent += 'Payment Details\n';
    csvContent += 'Date,Patient,Amount,Doctor,Service Used,Payment Method,Invoice No\n';
    details.forEach(row => {
      const escapeCsv = (val: string) => val?.includes(',') ? `"${val}"` : (val || '');
      csvContent += `${row.date},${escapeCsv(row.patientName)},Rs ${row.amount.toLocaleString()},${escapeCsv(row.doctorName)},${escapeCsv(row.servicesUsed)},${row.paymentMethod},${row.invoiceNo}\n`;
    });
    csvContent += '\n';

    csvContent += 'Expenses by Category\n';
    csvContent += 'Category,Amount\n';
    summary.expensesByCategory.forEach(item => {
      csvContent += `${item.category},Rs ${item.total.toLocaleString()}\n`;
    });
    csvContent += '\n';

    csvContent += 'Expense Details\n';
    csvContent += 'Date,Title,Category,Amount,Paid To\n';
    expenses.forEach(exp => {
      csvContent += `${exp.expenseDate},${exp.title},${exp.category},Rs ${exp.amount.toLocaleString()},${exp.paidTo || ''}\n`;
    });

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-report-${startDate}-to-${endDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Rent': return 'primary';
      case 'Utilities': return 'secondary';
      case 'Supplies': return 'info';
      case 'Salary': return 'success';
      case 'Equipment': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Finance</Typography>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
          disabled={!summary}
        >
          Export Report
        </Button>
      </Box>

      {/* Date Range Filter */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Doctor</InputLabel>
              <Select
                value={doctorFilter}
                label="Doctor"
                onChange={(e) => setDoctorFilter(e.target.value)}
              >
                <MenuItem value="">All Doctors</MenuItem>
                {doctors.map((doctor) => (
                  <MenuItem key={doctor.doctorID} value={doctor.doctorID}>
                    Dr. {doctor.firstName} {doctor.lastName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                onClick={() => {
                  const d = new Date();
                  setStartDate(new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]);
                  setEndDate(d.toISOString().split('T')[0]);
                }}
              >
                This Month
              </Button>
              <Button
                size="small"
                onClick={() => {
                  const d = new Date();
                  const lastMonth = new Date(d.getFullYear(), d.getMonth() - 1, 1);
                  const lastDay = new Date(d.getFullYear(), d.getMonth(), 0);
                  setStartDate(lastMonth.toISOString().split('T')[0]);
                  setEndDate(lastDay.toISOString().split('T')[0]);
                }}
              >
                Last Month
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Summary Cards */}
      {isLoadingSummary ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : summary && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <RevenueIcon />
                  <Typography variant="body2">Revenue</Typography>
                </Box>
                <Typography variant="h5" fontWeight="bold">
                  Rs {summary.totalRevenue.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'error.light', color: 'error.contrastText' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <ExpenseIcon />
                  <Typography variant="body2">Expenses</Typography>
                </Box>
                <Typography variant="h5" fontWeight="bold">
                  Rs {summary.totalExpenses.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: summary.netIncome >= 0 ? 'primary.light' : 'warning.light' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <BalanceIcon />
                  <Typography variant="body2">Net Income</Typography>
                </Box>
                <Typography variant="h5" fontWeight="bold">
                  Rs {summary.netIncome.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <VisitsIcon color="action" />
                  <Typography variant="body2" color="text.secondary">Completed Visits</Typography>
                </Box>
                <Typography variant="h5" fontWeight="bold">
                  {summary.completedVisits}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Outstanding */}
          {summary.totalOutstanding > 0 && (
            <Grid item xs={12}>
              <Alert severity="warning">
                Outstanding Receivables: <strong>Rs {summary.totalOutstanding.toLocaleString()}</strong>
              </Alert>
            </Grid>
          )}
        </Grid>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="Overview" />
          <Tab label="Expenses" />
        </Tabs>
      </Paper>

      {/* Overview Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* Revenue by Day */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Daily Revenue</Typography>
                <Divider sx={{ mb: 2 }} />
                {summary?.revenueByDay && summary.revenueByDay.length > 0 ? (
                  <TableContainer sx={{ maxHeight: 300 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell align="right">Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {summary.revenueByDay.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                            <TableCell align="right">Rs {item.total.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    No revenue data for this period
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Expenses by Category */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Expenses by Category</Typography>
                <Divider sx={{ mb: 2 }} />
                {summary?.expensesByCategory && summary.expensesByCategory.length > 0 ? (
                  <Box>
                    {summary.expensesByCategory.map((item, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          py: 1,
                          borderBottom: index < summary.expensesByCategory.length - 1 ? 1 : 0,
                          borderColor: 'divider',
                        }}
                      >
                        <Chip
                          label={item.category}
                          color={getCategoryColor(item.category) as any}
                          size="small"
                        />
                        <Typography fontWeight="medium">
                          Rs {item.total.toLocaleString()}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    No expenses for this period
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Expenses Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenExpenseDialog}
          >
            Add Expense
          </Button>
        </Box>

        {isLoadingExpenses ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : expenses.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Expenses Recorded
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Track your clinic expenses for better financial management.
              </Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenExpenseDialog}>
                Add Expense
              </Button>
            </CardContent>
          </Card>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Paid To</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.expenseID} hover>
                    <TableCell>{new Date(expense.expenseDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Typography fontWeight="medium">{expense.title}</Typography>
                      {expense.notes && (
                        <Typography variant="caption" color="text.secondary">
                          {expense.notes}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={expense.category}
                        color={getCategoryColor(expense.category) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{expense.paidTo || '-'}</TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="medium" color="error.main">
                        Rs {expense.amount.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteExpense(expense)}
                        color="error"
                        aria-label="Delete expense"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>

      {/* Add Expense Dialog */}
      <Dialog open={expenseDialogOpen} onClose={() => setExpenseDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Expense</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={expenseForm.expenseDate}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, expenseDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, category: e.target.value as ExpenseCategory }))}
                  label="Category"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={expenseForm.title}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, title: e.target.value }))}
                required
                placeholder="e.g., Monthly Rent"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
                }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Paid To"
                value={expenseForm.paidTo}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, paidTo: e.target.value }))}
                placeholder="Vendor/Person name"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                value={expenseForm.notes}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, notes: e.target.value }))}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExpenseDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveExpense}
            disabled={isSaving}
          >
            {isSaving ? <CircularProgress size={24} /> : 'Add Expense'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Finance;
