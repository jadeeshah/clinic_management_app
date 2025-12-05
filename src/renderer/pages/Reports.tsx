import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Tabs,
  Tab,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Print as PrintIcon,
  FileDownload as ExportIcon,
} from '@mui/icons-material';
import { TabPanel } from '../components';
import {
  RevenueChart,
  VisitAnalytics,
  PatientStats,
  RevenueData,
  VisitStats,
  PatientStatsData,
} from '../components/analytics';

type TimePeriod = 'thisMonth' | 'lastMonth' | 'last3Months' | 'last6Months' | 'thisYear';

const Reports: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('last6Months');

  // Analytics data
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [visitStats, setVisitStats] = useState<VisitStats | null>(null);
  const [patientStats, setPatientStats] = useState<PatientStatsData | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [timePeriod]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const [revenueResult, visitsResult, patientsResult] = await Promise.all([
        window.electronAPI.database.execute<RevenueData[]>('get-revenue-analytics', { period: timePeriod }),
        window.electronAPI.database.execute<VisitStats>('get-visit-analytics', { period: timePeriod }),
        window.electronAPI.database.execute<PatientStatsData>('get-patient-analytics'),
      ]);

      if (revenueResult.success && revenueResult.data) {
        setRevenueData(revenueResult.data);
      }
      if (visitsResult.success && visitsResult.data) {
        setVisitStats(visitsResult.data);
      }
      if (patientsResult.success && patientsResult.data) {
        setPatientStats(patientsResult.data);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      // Export analytics data to CSV
      const csvContent = generateCSVReport();
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clinic-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  const generateCSVReport = (): string => {
    const lines: string[] = [];

    // Header
    lines.push('Clinic Management Report');
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push(`Period: ${timePeriod}`);
    lines.push('');

    // Revenue Summary
    lines.push('Revenue Summary');
    lines.push('Month,Revenue,Expenses,Profit');
    revenueData.forEach((item) => {
      lines.push(`${item.month},${item.revenue},${item.expenses},${item.revenue - item.expenses}`);
    });
    lines.push('');

    // Visit Stats
    if (visitStats) {
      lines.push('Visit Statistics');
      lines.push(`Total Visits,${visitStats.total}`);
      lines.push(`Completed,${visitStats.completed}`);
      lines.push(`Scheduled,${visitStats.scheduled}`);
      lines.push(`Cancelled,${visitStats.cancelled}`);
      lines.push(`No Show,${visitStats.noShow}`);
      lines.push('');

      lines.push('Visits by Type');
      visitStats.byType.forEach((item) => {
        lines.push(`${item.type},${item.count}`);
      });
      lines.push('');

      lines.push('Visits by Doctor');
      lines.push('Doctor,Visits,Revenue');
      visitStats.byDoctor.forEach((doc) => {
        lines.push(`${doc.doctorName},${doc.count},${doc.revenue}`);
      });
    }
    lines.push('');

    // Patient Stats
    if (patientStats) {
      lines.push('Patient Statistics');
      lines.push(`Total Patients,${patientStats.totalPatients}`);
      lines.push(`New This Month,${patientStats.newThisMonth}`);
      lines.push(`Active Patients,${patientStats.activePatients}`);
      lines.push(`Returning Patients,${patientStats.returningPatients}`);
    }

    return lines.join('\n');
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Reports & Analytics</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Time Period</InputLabel>
            <Select
              value={timePeriod}
              label="Time Period"
              onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
            >
              <MenuItem value="thisMonth">This Month</MenuItem>
              <MenuItem value="lastMonth">Last Month</MenuItem>
              <MenuItem value="last3Months">Last 3 Months</MenuItem>
              <MenuItem value="last6Months">Last 6 Months</MenuItem>
              <MenuItem value="thisYear">This Year</MenuItem>
            </Select>
          </FormControl>
          <Button
            startIcon={<RefreshIcon />}
            onClick={loadAnalytics}
          >
            Refresh
          </Button>
          <Button
            startIcon={<ExportIcon />}
            onClick={handleExport}
          >
            Export
          </Button>
          <Button
            startIcon={<PrintIcon />}
            onClick={handlePrint}
          >
            Print
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="Overview" />
          <Tab label="Revenue" />
          <Tab label="Visits" />
          <Tab label="Patients" />
        </Tabs>
      </Paper>

      {/* Overview Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {patientStats && (
            <Grid item xs={12}>
              <PatientStats stats={patientStats} />
            </Grid>
          )}
          {revenueData.length > 0 && (
            <Grid item xs={12}>
              <RevenueChart data={revenueData} />
            </Grid>
          )}
          {visitStats && (
            <Grid item xs={12}>
              <VisitAnalytics stats={visitStats} />
            </Grid>
          )}
        </Grid>
      </TabPanel>

      {/* Revenue Tab */}
      <TabPanel value={tabValue} index={1}>
        {revenueData.length > 0 ? (
          <RevenueChart data={revenueData} title="Revenue Analysis" />
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No revenue data available for the selected period
            </Typography>
          </Paper>
        )}
      </TabPanel>

      {/* Visits Tab */}
      <TabPanel value={tabValue} index={2}>
        {visitStats ? (
          <VisitAnalytics stats={visitStats} title="Visit Analysis" />
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No visit data available for the selected period
            </Typography>
          </Paper>
        )}
      </TabPanel>

      {/* Patients Tab */}
      <TabPanel value={tabValue} index={3}>
        {patientStats ? (
          <PatientStats stats={patientStats} title="Patient Analysis" />
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No patient data available
            </Typography>
          </Paper>
        )}
      </TabPanel>
    </Box>
  );
};

export default Reports;
