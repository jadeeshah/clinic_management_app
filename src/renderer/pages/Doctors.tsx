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
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Alert,
  CircularProgress,
  InputAdornment,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import type { Doctor, Visit } from '../../types';
import { DoctorSchedule } from '../components';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface DoctorFormData {
  firstName: string;
  lastName: string;
  education: string;
  designation: string;
  specialization: string;
  sessionCharge: number;
  availableDays: string[];
  startTime: string;
  endTime: string;
  phone: string;
  email: string;
}

const initialFormData: DoctorFormData = {
  firstName: '',
  lastName: '',
  education: '',
  designation: '',
  specialization: '',
  sessionCharge: 0,
  availableDays: [],
  startTime: '09:00',
  endTime: '17:00',
  phone: '',
  email: '',
};

const Doctors: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [formData, setFormData] = useState<DoctorFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null);

  // Detail dialog state
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [doctorVisits, setDoctorVisits] = useState<Visit[]>([]);
  const [isLoadingVisits, setIsLoadingVisits] = useState(false);

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    setIsLoading(true);
    try {
      const result = await window.electronAPI.database.execute<Doctor[]>('get-doctors');
      if (result.success && result.data) {
        // Parse availableDays from JSON string
        const parsedDoctors = result.data.map(doc => ({
          ...doc,
          availableDays: typeof doc.availableDays === 'string'
            ? JSON.parse(doc.availableDays)
            : doc.availableDays || []
        }));
        setDoctors(parsedDoctors);
      }
    } catch (error) {
      console.error('Failed to load doctors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (doctor?: Doctor) => {
    if (doctor) {
      setEditingDoctor(doctor);
      setFormData({
        firstName: doctor.firstName,
        lastName: doctor.lastName || '',
        education: doctor.education || '',
        designation: doctor.designation || '',
        specialization: doctor.specialization || '',
        sessionCharge: doctor.sessionCharge,
        availableDays: doctor.availableDays || [],
        startTime: doctor.startTime || '09:00',
        endTime: doctor.endTime || '17:00',
        phone: doctor.phone || '',
        email: doctor.email || '',
      });
    } else {
      setEditingDoctor(null);
      setFormData(initialFormData);
    }
    setError(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingDoctor(null);
    setFormData(initialFormData);
    setError(null);
  };

  const handleInputChange = (field: keyof DoctorFormData) => (
    e: React.ChangeEvent<HTMLInputElement | { value: unknown }>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleDaysChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const value = event.target.value as string[];
    setFormData(prev => ({
      ...prev,
      availableDays: value
    }));
  };

  const handleSave = async () => {
    // Validation
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (editingDoctor) {
        // Update
        const result = await window.electronAPI.database.execute('update-doctor', {
          ...formData,
          doctorID: editingDoctor.doctorID
        });
        if (!result.success) {
          throw new Error(result.error || 'Failed to update doctor');
        }
      } else {
        // Create
        const result = await window.electronAPI.database.execute('create-doctor', formData);
        if (!result.success) {
          throw new Error(result.error || 'Failed to create doctor');
        }
      }

      await loadDoctors();
      handleCloseDialog();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (doctor: Doctor) => {
    setDoctorToDelete(doctor);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!doctorToDelete) return;

    try {
      const result = await window.electronAPI.database.execute('deactivate-doctor', {
        doctorID: doctorToDelete.doctorID
      });
      if (result.success) {
        await loadDoctors();
      }
    } catch (error) {
      console.error('Failed to delete doctor:', error);
    } finally {
      setDeleteDialogOpen(false);
      setDoctorToDelete(null);
    }
  };

  const handleRowClick = async (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setDetailDialogOpen(true);
    setIsLoadingVisits(true);
    try {
      const result = await window.electronAPI.database.execute<Visit[]>('get-doctor-visits', {
        doctorID: doctor.doctorID,
      });
      if (result.success && result.data) {
        setDoctorVisits(result.data);
      }
    } catch (error) {
      console.error('Failed to load doctor visits:', error);
    } finally {
      setIsLoadingVisits(false);
    }
  };

  const handleEditFromDetail = () => {
    setDetailDialogOpen(false);
    if (selectedDoctor) {
      handleOpenDialog(selectedDoctor);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Doctors</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Doctor
        </Button>
      </Box>

      {doctors.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Doctors Found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Add your first doctor to get started.
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
              Add Doctor
            </Button>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Designation</TableCell>
                <TableCell>Specialization</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Session Charge</TableCell>
                <TableCell>Available Days</TableCell>
                <TableCell>Hours</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {doctors.map((doctor) => (
                <TableRow
                  key={doctor.doctorID}
                  hover
                  onClick={() => handleRowClick(doctor)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Typography fontWeight="medium">
                      {doctor.firstName} {doctor.lastName}
                    </Typography>
                    {doctor.education && (
                      <Typography variant="caption" color="text.secondary">
                        {doctor.education}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{doctor.designation || '-'}</TableCell>
                  <TableCell>{doctor.specialization || '-'}</TableCell>
                  <TableCell>
                    {doctor.phone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2">{doctor.phone}</Typography>
                      </Box>
                    )}
                    {doctor.email && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <EmailIcon fontSize="small" color="action" />
                        <Typography variant="body2">{doctor.email}</Typography>
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight="medium" color="primary">
                      Rs {doctor.sessionCharge.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {doctor.availableDays?.map((day: string) => (
                        <Chip
                          key={day}
                          label={day.substring(0, 3)}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {doctor.startTime && doctor.endTime ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <TimeIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {doctor.startTime} - {doctor.endTime}
                        </Typography>
                      </Box>
                    ) : '-'}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDialog(doctor);
                      }}
                      aria-label="Edit doctor"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(doctor);
                      }}
                      aria-label="Delete doctor"
                      color="error"
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.firstName}
                onChange={handleInputChange('firstName')}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.lastName}
                onChange={handleInputChange('lastName')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Education"
                value={formData.education}
                onChange={handleInputChange('education')}
                placeholder="e.g., MBBS, DPT"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Designation"
                value={formData.designation}
                onChange={handleInputChange('designation')}
                placeholder="e.g., Senior Physiotherapist"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Specialization"
                value={formData.specialization}
                onChange={handleInputChange('specialization')}
                placeholder="e.g., Sports Injury"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Session Charge"
                type="number"
                value={formData.sessionCharge}
                onChange={handleInputChange('sessionCharge')}
                InputProps={{
                  startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={handleInputChange('phone')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Available Days</InputLabel>
                <Select
                  multiple
                  value={formData.availableDays}
                  onChange={handleDaysChange as any}
                  input={<OutlinedInput label="Available Days" />}
                  renderValue={(selected) => (selected as string[]).join(', ')}
                >
                  {DAYS_OF_WEEK.map((day) => (
                    <MenuItem key={day} value={day}>
                      <Checkbox checked={formData.availableDays.includes(day)} />
                      <ListItemText primary={day} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Time"
                type="time"
                value={formData.startTime}
                onChange={handleInputChange('startTime')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Time"
                type="time"
                value={formData.endTime}
                onChange={handleInputChange('endTime')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? <CircularProgress size={24} /> : editingDoctor ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove {doctorToDelete?.firstName} {doctorToDelete?.lastName}?
            This doctor will be deactivated and will no longer appear in the list.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Doctor Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedDoctor && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="h5">
                    Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}
                  </Typography>
                  {selectedDoctor.designation && (
                    <Typography variant="subtitle1" color="text.secondary">
                      {selectedDoctor.designation}
                    </Typography>
                  )}
                  {selectedDoctor.education && (
                    <Chip label={selectedDoctor.education} size="small" sx={{ mt: 1 }} />
                  )}
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              {/* Session Charge - Prominent */}
              <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.50', textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Session Charge
                </Typography>
                <Typography variant="h4" color="primary" fontWeight="bold">
                  Rs {selectedDoctor.sessionCharge.toLocaleString()}
                </Typography>
              </Paper>

              {/* Contact Information */}
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Contact Information
              </Typography>
              <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PhoneIcon color="action" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Phone</Typography>
                        <Typography variant="body1">{selectedDoctor.phone || 'Not provided'}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmailIcon color="action" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Email</Typography>
                        <Typography variant="body1">{selectedDoctor.email || 'Not provided'}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* Professional Info */}
              {selectedDoctor.specialization && (
                <>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Specialization
                  </Typography>
                  <Paper sx={{ p: 2, mb: 3 }}>
                    <Typography variant="body1">{selectedDoctor.specialization}</Typography>
                  </Paper>
                </>
              )}

              {/* Availability */}
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Availability
              </Typography>
              <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Available Days
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {selectedDoctor.availableDays && selectedDoctor.availableDays.length > 0 ? (
                        selectedDoctor.availableDays.map((day: string) => (
                          <Chip key={day} label={day} size="small" color="primary" variant="outlined" />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No days specified
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TimeIcon color="action" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Working Hours</Typography>
                        <Typography variant="body1">
                          {selectedDoctor.startTime && selectedDoctor.endTime
                            ? `${selectedDoctor.startTime} - ${selectedDoctor.endTime}`
                            : 'Not specified'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* Weekly Schedule */}
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Weekly Schedule
              </Typography>
              {isLoadingVisits ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <DoctorSchedule
                  doctor={selectedDoctor}
                  visits={doctorVisits}
                  onVisitClick={(visit) => {
                    // Could navigate to visit details in the future
                    console.log('Visit clicked:', visit);
                  }}
                />
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
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

export default Doctors;
