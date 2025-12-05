import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  Paper,
  Autocomplete,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  Receipt as ReceiptIcon,
  Refresh as RefreshIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import type { Visit, Doctor, Patient, Service, PatientPackage } from '../../types';
import { StatusChip, TableSkeleton, EmptyState, PackageProgress, VisitStatusWorkflow } from '../components';
import { formatVisitType } from '../utils/formatters';

// Visit Form Component
interface VisitFormProps {
  visit?: Visit | null;
  doctors: Doctor[];
  patients: Patient[];
  defaultDuration: number;
  onSave: (visit: Partial<Visit>) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

const VisitForm: React.FC<VisitFormProps> = ({
  visit,
  doctors,
  patients,
  defaultDuration,
  onSave,
  onCancel,
  isLoading,
}) => {
  const [formData, setFormData] = useState<Partial<Visit>>({
    patientID: undefined,
    doctorID: undefined,
    visitDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    duration: defaultDuration,
    visitType: 'TherapySession',
    status: 'Scheduled',
    notes: '',
    patientPackageID: undefined,
  });
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [patientPackages, setPatientPackages] = useState<PatientPackage[]>([]);

  useEffect(() => {
    if (visit) {
      setFormData({
        ...visit,
        visitDate: visit.visitDate || new Date().toISOString().split('T')[0],
      });
      // Find and set the selected patient
      const patient = patients.find(p => p.patientID === visit.patientID);
      if (patient) {
        setSelectedPatient(patient);
        loadPatientPackages(patient.patientID);
      }
    }
  }, [visit, patients]);

  useEffect(() => {
    if (patientSearch.length >= 2) {
      searchPatients();
    } else {
      setSearchResults([]);
    }
  }, [patientSearch]);

  const searchPatients = async () => {
    try {
      const result = await window.electronAPI.database.execute<Patient[]>('search-patients', {
        query: patientSearch,
        limit: 10,
      });
      if (result.success && result.data) {
        setSearchResults(result.data);
      }
    } catch (error) {
      console.error('Patient search failed:', error);
    }
  };

  const loadPatientPackages = async (patientID: number) => {
    try {
      const result = await window.electronAPI.database.execute<PatientPackage[]>('get-patient-packages', { patientID });
      if (result.success && result.data) {
        // Filter only active packages with remaining sessions
        const activePackages = result.data.filter(
          (pkg) => pkg.status === 'Active' && (pkg.totalSessions || 0) > (pkg.sessionsUsed || 0)
        );
        setPatientPackages(activePackages);
      }
    } catch (error) {
      console.error('Failed to load patient packages:', error);
      setPatientPackages([]);
    }
  };

  const handleChange = (field: keyof Visit) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: unknown } }
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const calculateEndTime = (startTime: string, duration: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.patientID) {
      newErrors.patientID = 'Please select a patient';
    }
    if (!formData.doctorID) {
      newErrors.doctorID = 'Please select a doctor';
    }
    if (!formData.visitDate) {
      newErrors.visitDate = 'Please select a date';
    }
    if (!formData.startTime) {
      newErrors.startTime = 'Please select a time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validate()) {
      const endTime = calculateEndTime(formData.startTime!, formData.duration!);
      await onSave({ ...formData, endTime });
    }
  };

  return (
    <Grid container spacing={2}>
      {/* Patient Selection */}
      <Grid item xs={12}>
        <Autocomplete
          value={selectedPatient}
          onChange={(_, newValue) => {
            setSelectedPatient(newValue);
            setFormData((prev) => ({ ...prev, patientID: newValue?.patientID, patientPackageID: undefined }));
            if (newValue?.patientID) {
              loadPatientPackages(newValue.patientID);
            } else {
              setPatientPackages([]);
            }
          }}
          inputValue={patientSearch}
          onInputChange={(_, newInputValue) => setPatientSearch(newInputValue)}
          options={searchResults.length > 0 ? searchResults : patients.slice(0, 20)}
          getOptionLabel={(option) => `${option.firstName} ${option.lastName || ''} (${option.phone})`}
          isOptionEqualToValue={(option, value) => option.patientID === value.patientID}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Patient"
              required
              error={!!errors.patientID}
              helperText={errors.patientID || 'Search by name or phone number'}
            />
          )}
          renderOption={(props, option) => (
            <li {...props} key={option.patientID}>
              <Box>
                <Typography variant="body1">
                  {option.firstName} {option.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {option.phone} | {option.mrn}
                </Typography>
              </Box>
            </li>
          )}
        />
      </Grid>

      {/* Active Packages */}
      {selectedPatient && patientPackages.length > 0 && (
        <Grid item xs={12}>
          <Paper sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Active Packages
            </Typography>
            <FormControl fullWidth size="small">
              <InputLabel>Use Package Session (Optional)</InputLabel>
              <Select
                value={formData.patientPackageID || ''}
                label="Use Package Session (Optional)"
                onChange={(e) => setFormData((prev) => ({ ...prev, patientPackageID: e.target.value as number || undefined }))}
              >
                <MenuItem value="">
                  <em>Don't use package</em>
                </MenuItem>
                {patientPackages.map((pkg) => (
                  <MenuItem key={pkg.patientPackageID} value={pkg.patientPackageID}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <Typography>{pkg.packageName}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {(pkg.totalSessions || 0) - (pkg.sessionsUsed || 0)} sessions left
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {formData.patientPackageID && (
              <Alert severity="info" sx={{ mt: 1 }} icon={false}>
                This visit will use 1 session from the selected package.
              </Alert>
            )}
          </Paper>
        </Grid>
      )}

      {/* Doctor Selection */}
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required error={!!errors.doctorID}>
          <InputLabel>Doctor</InputLabel>
          <Select
            value={formData.doctorID || ''}
            label="Doctor"
            onChange={(e) => handleChange('doctorID')({ target: { value: e.target.value } })}
          >
            {doctors.map((doctor) => (
              <MenuItem key={doctor.doctorID} value={doctor.doctorID}>
                Dr. {doctor.firstName} {doctor.lastName} - Rs {doctor.sessionCharge}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {/* Visit Type */}
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Visit Type</InputLabel>
          <Select
            value={formData.visitType || 'TherapySession'}
            label="Visit Type"
            onChange={(e) => handleChange('visitType')({ target: { value: e.target.value } })}
          >
            <MenuItem value="Evaluation">Evaluation</MenuItem>
            <MenuItem value="FollowUp">Follow Up</MenuItem>
            <MenuItem value="TherapySession">Therapy Session</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      {/* Date */}
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="Date"
          type="date"
          value={formData.visitDate || ''}
          onChange={handleChange('visitDate')}
          error={!!errors.visitDate}
          helperText={errors.visitDate}
          InputLabelProps={{ shrink: true }}
          required
        />
      </Grid>

      {/* Start Time */}
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="Start Time"
          type="time"
          value={formData.startTime || ''}
          onChange={handleChange('startTime')}
          error={!!errors.startTime}
          helperText={errors.startTime}
          InputLabelProps={{ shrink: true }}
          required
        />
      </Grid>

      {/* Duration */}
      <Grid item xs={12} sm={4}>
        <FormControl fullWidth>
          <InputLabel>Duration</InputLabel>
          <Select
            value={formData.duration || defaultDuration}
            label="Duration"
            onChange={(e) => handleChange('duration')({ target: { value: e.target.value } })}
          >
            <MenuItem value={15}>15 minutes</MenuItem>
            <MenuItem value={30}>30 minutes</MenuItem>
            <MenuItem value={45}>45 minutes</MenuItem>
            <MenuItem value={60}>60 minutes</MenuItem>
            <MenuItem value={90}>90 minutes</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      {/* Status (for editing) */}
      {visit && (
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={formData.status || 'Scheduled'}
              label="Status"
              onChange={(e) => handleChange('status')({ target: { value: e.target.value } })}
            >
              <MenuItem value="Scheduled">Scheduled</MenuItem>
              <MenuItem value="InProgress">In Progress</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
              <MenuItem value="Cancelled">Cancelled</MenuItem>
              <MenuItem value="NoShow">No Show</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      )}

      {/* Notes */}
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Notes"
          value={formData.notes || ''}
          onChange={handleChange('notes')}
          multiline
          rows={3}
          placeholder="Session notes, observations, etc."
        />
      </Grid>

      {/* Actions */}
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
          <Button onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            {visit ? 'Update Visit' : 'Schedule Visit'}
          </Button>
        </Box>
      </Grid>
    </Grid>
  );
};

// Main Visits Component
const Visits: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [visits, setVisits] = useState<Visit[]>([]);
  const [totalVisits, setTotalVisits] = useState(0);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [defaultDuration, setDefaultDuration] = useState(45);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    status: '',
    doctorID: '',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Detail dialog state
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedVisitForDetail, setSelectedVisitForDetail] = useState<Visit | null>(null);

  useEffect(() => {
    loadInitialData();

    // Check for action query param
    if (searchParams.get('action') === 'new') {
      setFormDialogOpen(true);
      setSearchParams({});
    }

    // Check for visit id query param to show detail
    const visitId = searchParams.get('id');
    if (visitId) {
      loadAndShowVisit(Number(visitId));
      setSearchParams({});
    }
  }, []);

  const loadAndShowVisit = async (visitID: number) => {
    try {
      const result = await window.electronAPI.database.execute<Visit>('get-visit', { visitID });
      if (result.success && result.data) {
        setSelectedVisitForDetail(result.data);
        setDetailDialogOpen(true);
      }
    } catch (error) {
      console.error('Failed to load visit:', error);
    }
  };

  useEffect(() => {
    loadVisits();
  }, [page, rowsPerPage, filters]);

  const loadInitialData = async () => {
    try {
      const [doctorsResult, patientsResult, settingsResult] = await Promise.all([
        window.electronAPI.database.execute<Doctor[]>('get-doctors'),
        window.electronAPI.database.execute<{ items: Patient[]; total: number }>('get-patients', { limit: 100 }),
        window.electronAPI.database.execute<{ defaultVisitDuration: number }>('get-settings'),
      ]);

      if (doctorsResult.success) setDoctors(doctorsResult.data || []);
      if (patientsResult.success) setPatients(patientsResult.data?.items || []);
      if (settingsResult.success) setDefaultDuration(settingsResult.data?.defaultVisitDuration || 45);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const loadVisits = async () => {
    setIsLoading(true);
    try {
      const result = await window.electronAPI.database.execute<{ items: Visit[]; total: number }>('get-visits', {
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        status: filters.status || undefined,
        doctorID: filters.doctorID ? Number(filters.doctorID) : undefined,
        limit: rowsPerPage,
        offset: page * rowsPerPage,
      });

      if (result.success && result.data) {
        setVisits(result.data.items);
        setTotalVisits(result.data.total);
      }
    } catch (error) {
      console.error('Failed to load visits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveVisit = async (visitData: Partial<Visit>) => {
    setIsSaving(true);
    setMessage(null);

    try {
      const operation = selectedVisit ? 'update-visit' : 'create-visit';
      const data = selectedVisit ? { ...visitData, visitID: selectedVisit.visitID } : visitData;

      const result = await window.electronAPI.database.execute(operation, data);

      if (result.success) {
        setMessage({
          type: 'success',
          text: selectedVisit ? 'Visit updated successfully' : 'Visit scheduled successfully',
        });
        setFormDialogOpen(false);
        setSelectedVisit(null);
        loadVisits();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save visit' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (visitID: number, newStatus: string) => {
    try {
      const result = await window.electronAPI.database.execute('update-visit-status', {
        visitID,
        status: newStatus,
      });

      if (result.success) {
        loadVisits();
        setMessage({ type: 'success', text: `Visit marked as ${newStatus}` });
      } else {
        setMessage({ type: 'error', text: 'Failed to update status' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update status' });
    }
  };

  const handleEdit = (visit: Visit) => {
    setSelectedVisit(visit);
    setFormDialogOpen(true);
  };

  const handleNewVisit = () => {
    setSelectedVisit(null);
    setFormDialogOpen(true);
  };

  const handleCreateInvoice = (visit: Visit) => {
    navigate(`/billing?patientId=${visit.patientID}&visitId=${visit.visitID}`);
  };

  const handleRowClick = (visit: Visit) => {
    setSelectedVisitForDetail(visit);
    setDetailDialogOpen(true);
  };

  const handleEditFromDetail = () => {
    setDetailDialogOpen(false);
    if (selectedVisitForDetail) {
      setSelectedVisit(selectedVisitForDetail);
      setFormDialogOpen(true);
    }
  };

  const handleCreateInvoiceFromDetail = () => {
    if (selectedVisitForDetail) {
      setDetailDialogOpen(false);
      navigate(`/billing?patientId=${selectedVisitForDetail.patientID}&visitId=${selectedVisitForDetail.visitID}`);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Visits</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleNewVisit}>
          New Visit
        </Button>
      </Box>

      {/* Messages */}
      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="From Date"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="To Date"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Scheduled">Scheduled</MenuItem>
                  <MenuItem value="InProgress">In Progress</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="Cancelled">Cancelled</MenuItem>
                  <MenuItem value="NoShow">No Show</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Doctor</InputLabel>
                <Select
                  value={filters.doctorID}
                  label="Doctor"
                  onChange={(e) => setFilters((prev) => ({ ...prev, doctorID: e.target.value }))}
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
            <Grid item xs={12} sm={1}>
              <IconButton onClick={loadVisits} color="primary" aria-label="Refresh visits">
                <RefreshIcon />
              </IconButton>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Visits Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date & Time</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Doctor</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            {isLoading ? (
              <TableSkeleton columns={6} rows={5} />
            ) : (
              <TableBody>
                {visits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <EmptyState
                        title="No visits found"
                        description={filters.startDate || filters.status || filters.doctorID
                          ? 'Try adjusting your filters'
                          : 'Schedule your first visit to get started'
                        }
                        filterCount={
                          (filters.startDate ? 1 : 0) +
                          (filters.endDate ? 1 : 0) +
                          (filters.status ? 1 : 0) +
                          (filters.doctorID ? 1 : 0)
                        }
                        onClearFilters={() => setFilters({
                          startDate: '',
                          endDate: '',
                          status: '',
                          doctorID: '',
                        })}
                        actionLabel={!filters.startDate && !filters.status && !filters.doctorID ? 'Schedule Visit' : undefined}
                        onAction={!filters.startDate && !filters.status && !filters.doctorID ? handleNewVisit : undefined}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                visits.map((visit) => (
                  <TableRow
                    key={visit.visitID}
                    hover
                    onClick={() => handleRowClick(visit)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {visit.visitDate}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {visit.startTime} - {visit.endTime || `${visit.duration}min`}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {visit.patientName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {visit.patientPhone}
                      </Typography>
                    </TableCell>
                    <TableCell>Dr. {visit.doctorName}</TableCell>
                    <TableCell>{formatVisitType(visit.visitType)}</TableCell>
                    <TableCell>
                      <StatusChip status={visit.status} />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                        {visit.status === 'Scheduled' && (
                          <>
                            <Tooltip title="Start Session">
                              <IconButton
                                size="small"
                                color="warning"
                                aria-label="Start session"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(visit.visitID, 'InProgress');
                                }}
                              >
                                <CheckCircleIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Cancel">
                              <IconButton
                                size="small"
                                color="error"
                                aria-label="Cancel visit"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(visit.visitID, 'Cancelled');
                                }}
                              >
                                <CancelIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        {visit.status === 'InProgress' && (
                          <Tooltip title="Complete">
                            <IconButton
                              size="small"
                              color="success"
                              aria-label="Complete visit"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(visit.visitID, 'Completed');
                              }}
                            >
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            aria-label="Edit visit"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(visit);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {visit.status === 'Completed' && (
                          <Tooltip title="Create Invoice">
                            <IconButton
                              size="small"
                              color="primary"
                              aria-label="Create invoice"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCreateInvoice(visit);
                              }}
                            >
                              <ReceiptIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
                )}
              </TableBody>
            )}
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={totalVisits}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Card>

      {/* Visit Form Dialog */}
      <Dialog open={formDialogOpen} onClose={() => setFormDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedVisit ? 'Edit Visit' : 'Schedule New Visit'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <VisitForm
              visit={selectedVisit}
              doctors={doctors}
              patients={patients}
              defaultDuration={defaultDuration}
              onSave={handleSaveVisit}
              onCancel={() => {
                setFormDialogOpen(false);
                setSelectedVisit(null);
              }}
              isLoading={isSaving}
            />
          </Box>
        </DialogContent>
      </Dialog>

      {/* Visit Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedVisitForDetail && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CalendarIcon color="action" />
                    <Typography variant="h6">
                      {selectedVisitForDetail.visitDate}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TimeIcon color="action" fontSize="small" />
                    <Typography variant="body2" color="text.secondary">
                      {selectedVisitForDetail.startTime} - {selectedVisitForDetail.endTime || `${selectedVisitForDetail.duration} min`}
                    </Typography>
                  </Box>
                </Box>
                <StatusChip status={selectedVisitForDetail.status} />
              </Box>
            </DialogTitle>
            <DialogContent>
              {/* Patient Info */}
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Patient
              </Typography>
              <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon color="action" />
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      {selectedVisitForDetail.patientName}
                    </Typography>
                    {selectedVisitForDetail.patientPhone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {selectedVisitForDetail.patientPhone}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Paper>

              {/* Doctor Info */}
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Doctor
              </Typography>
              <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="body1">
                  Dr. {selectedVisitForDetail.doctorName}
                </Typography>
              </Paper>

              {/* Visit Details */}
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Visit Details
              </Typography>
              <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Type</Typography>
                    <Typography variant="body1">{formatVisitType(selectedVisitForDetail.visitType)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Duration</Typography>
                    <Typography variant="body1">{selectedVisitForDetail.duration} minutes</Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Notes */}
              {selectedVisitForDetail.notes && (
                <>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Notes
                  </Typography>
                  <Paper sx={{ p: 2, mb: 3 }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {selectedVisitForDetail.notes}
                    </Typography>
                  </Paper>
                </>
              )}

              {/* Status Workflow */}
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Status Workflow
              </Typography>
              <Paper sx={{ p: 2 }}>
                <VisitStatusWorkflow
                  currentStatus={selectedVisitForDetail.status}
                  onStatusChange={async (newStatus) => {
                    await handleStatusChange(selectedVisitForDetail.visitID, newStatus);
                    setSelectedVisitForDetail({ ...selectedVisitForDetail, status: newStatus });
                    if (newStatus === 'Completed') {
                      loadVisits();
                    }
                  }}
                />
              </Paper>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
              {selectedVisitForDetail.status === 'Completed' && (
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<ReceiptIcon />}
                  onClick={handleCreateInvoiceFromDetail}
                >
                  Create Invoice
                </Button>
              )}
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleEditFromDetail}
              >
                Edit
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Visits;
