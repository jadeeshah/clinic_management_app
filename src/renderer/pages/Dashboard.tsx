import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  EventNote as EventNoteIcon,
  PersonSearch as PersonSearchIcon,
  PersonAdd as PersonAddIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import type { Visit, Patient, DashboardStats } from '../../types';
import { StatusChip } from '../components';
import { formatCurrency } from '../utils/formatters';
import { usePatientSearch } from '../hooks/usePatientSearch';

// Action Card Component
interface ActionCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
}

const ActionCard: React.FC<ActionCardProps> = ({ title, subtitle, icon, color, onClick }) => (
  <Card sx={{ height: '100%' }}>
    <CardActionArea onClick={onClick} sx={{ height: '100%', p: 2 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            bgcolor: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
          }}
        >
          {icon}
        </Box>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      </Box>
    </CardActionArea>
  </Card>
);

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
    <Box
      sx={{
        width: 48,
        height: 48,
        borderRadius: 2,
        bgcolor: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {icon}
    </Box>
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600 }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {title}
      </Typography>
    </Box>
  </Paper>
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);

  // Use the patient search hook
  const {
    patients: searchResults,
    isSearching,
    searchQuery,
    setSearchQuery,
    clearPatients,
    searchPatients,
  } = usePatientSearch({ minLength: 1, debounceMs: 0 }); // No debounce - manual search on Enter

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const result = await window.electronAPI.database.execute<DashboardStats>('get-dashboard-stats');
      if (result.success && result.data) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    searchPatients(searchQuery);
    setSearchDialogOpen(true);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    setSearchDialogOpen(false);
    clearPatients();
    navigate(`/patients?id=${patient.patientID}`);
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
      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search patients by phone number, name, or MRN..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleSearchKeyPress}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchQuery('')} aria-label="Clear search">
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Tip: Search by phone number for fastest results
        </Typography>
      </Paper>

      {/* Action Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <ActionCard
            title="New Visit"
            subtitle="Schedule or record a visit"
            icon={<EventNoteIcon sx={{ fontSize: 32, color: 'white' }} />}
            color="primary.main"
            onClick={() => navigate('/visits?action=new')}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <ActionCard
            title="Search Patient"
            subtitle="Find by phone number"
            icon={<PersonSearchIcon sx={{ fontSize: 32, color: 'white' }} />}
            color="secondary.main"
            onClick={() => document.querySelector<HTMLInputElement>('input')?.focus()}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <ActionCard
            title="New Patient"
            subtitle="Register a new patient"
            icon={<PersonAddIcon sx={{ fontSize: 32, color: 'white' }} />}
            color="success.main"
            onClick={() => navigate('/patients?action=new')}
          />
        </Grid>
      </Grid>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <StatCard
            title="Today's Visits"
            value={stats?.todayVisits || 0}
            icon={<ScheduleIcon sx={{ color: 'white' }} />}
            color="info.main"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title="Completed"
            value={stats?.completedVisits || 0}
            icon={<CheckCircleIcon sx={{ color: 'white' }} />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title="This Month"
            value={formatCurrency(stats?.monthRevenue || 0)}
            icon={<MoneyIcon sx={{ color: 'white' }} />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title="Outstanding"
            value={formatCurrency(stats?.outstandingBalance || 0)}
            icon={<WarningIcon sx={{ color: 'white' }} />}
            color="warning.main"
          />
        </Grid>
      </Grid>

      {/* Today's Schedule */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Today's Schedule
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {stats?.todaySchedule && stats.todaySchedule.length > 0 ? (
            <List disablePadding>
              {stats.todaySchedule.map((visit: Visit, index: number) => (
                <React.Fragment key={visit.visitID}>
                  <ListItem
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' },
                      borderRadius: 1,
                    }}
                    onClick={() => navigate(`/visits?id=${visit.visitID}`)}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {visit.startTime}
                          </Typography>
                          <Typography variant="body1">
                            {visit.patientName}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                          <Typography variant="body2" color="text.secondary">
                            {visit.visitType}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Dr. {visit.doctorName}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <StatusChip status={visit.status} />
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < stats.todaySchedule.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No visits scheduled for today
              </Typography>
              <Button
                variant="outlined"
                startIcon={<EventNoteIcon />}
                onClick={() => navigate('/visits?action=new')}
                sx={{ mt: 2 }}
              >
                Schedule a Visit
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Search Results Dialog */}
      <Dialog
        open={searchDialogOpen}
        onClose={() => setSearchDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Search Results</DialogTitle>
        <DialogContent>
          {searchResults.length > 0 ? (
            <List>
              {searchResults.map((patient) => (
                <ListItem
                  key={patient.patientID}
                  button
                  onClick={() => handlePatientSelect(patient)}
                  sx={{ borderRadius: 1 }}
                >
                  <ListItemText
                    primary={`${patient.firstName} ${patient.lastName || ''}`}
                    secondary={
                      <Box>
                        <Typography variant="body2" component="span">
                          Phone: {patient.phone}
                        </Typography>
                        <Typography variant="body2" component="span" sx={{ ml: 2 }}>
                          MRN: {patient.mrn}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              No patients found matching "{searchQuery}"
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSearchDialogOpen(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => {
              setSearchDialogOpen(false);
              navigate('/patients?action=new');
            }}
          >
            Register New Patient
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
