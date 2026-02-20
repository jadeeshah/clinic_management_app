import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Investigation, InvestigationType, InvestigationStatus, Doctor } from '../../types';

interface InvestigationFormProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  patientID: number;
  investigation?: Investigation | null;
}

const INVESTIGATION_TYPES: InvestigationType[] = [
  'X-Ray',
  'CT Scan',
  'MRI',
  'Ultrasound',
  'NCS',
  'EMG',
  'Blood Test',
  'Urine Test',
  'ECG',
  'DEXA Scan',
  'Bone Scan',
  'Other',
];

const INVESTIGATION_STATUSES: InvestigationStatus[] = [
  'Ordered',
  'Scheduled',
  'Completed',
  'Reviewed',
];

export const InvestigationForm: React.FC<InvestigationFormProps> = ({
  open,
  onClose,
  onSave,
  patientID,
  investigation,
}) => {
  const [formData, setFormData] = useState({
    investigationType: '' as InvestigationType | '',
    investigationDate: new Date().toISOString().split('T')[0],
    orderedByDoctorID: '' as number | '',
    bodyPart: '',
    findings: '',
    status: 'Ordered' as InvestigationStatus,
    notes: '',
  });
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      loadDoctors();
      if (investigation) {
        setFormData({
          investigationType: investigation.investigationType,
          investigationDate: investigation.investigationDate,
          orderedByDoctorID: investigation.orderedByDoctorID || '',
          bodyPart: investigation.bodyPart || '',
          findings: investigation.findings || '',
          status: investigation.status,
          notes: investigation.notes || '',
        });
      } else {
        setFormData({
          investigationType: '',
          investigationDate: new Date().toISOString().split('T')[0],
          orderedByDoctorID: '',
          bodyPart: '',
          findings: '',
          status: 'Ordered',
          notes: '',
        });
      }
      setError('');
    }
  }, [open, investigation]);

  const loadDoctors = async () => {
    try {
      const response = await window.electronAPI.database.execute<Doctor[]>('get-doctors');
      if (response.success && response.data) {
        setDoctors(response.data.filter(d => d.isActive));
      }
    } catch (err) {
      console.error('Error loading doctors:', err);
    }
  };

  const handleChange = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async () => {
    if (!formData.investigationType) {
      setError('Please select an investigation type');
      return;
    }
    if (!formData.investigationDate) {
      setError('Please select a date');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const dataToSave = {
        ...formData,
        patientID,
        orderedByDoctorID: formData.orderedByDoctorID || null,
        investigationID: investigation?.investigationID,
      };

      const operation = investigation ? 'update-investigation' : 'create-investigation';
      const response = await window.electronAPI.database.execute(operation, dataToSave);

      if (response.success) {
        onSave();
        onClose();
      } else {
        setError(response.error || 'Failed to save investigation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {investigation ? 'Edit Investigation' : 'New Investigation'}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Investigation Type</InputLabel>
              <Select
                value={formData.investigationType}
                label="Investigation Type"
                onChange={(e) => handleChange('investigationType', e.target.value)}
              >
                {INVESTIGATION_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              type="date"
              label="Date"
              value={formData.investigationDate}
              onChange={(e) => handleChange('investigationDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Ordered By Doctor</InputLabel>
              <Select
                value={formData.orderedByDoctorID}
                label="Ordered By Doctor"
                onChange={(e) => handleChange('orderedByDoctorID', e.target.value)}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {doctors.map((doctor) => (
                  <MenuItem key={doctor.doctorID} value={doctor.doctorID}>
                    Dr. {doctor.firstName} {doctor.lastName || ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                label="Status"
                onChange={(e) => handleChange('status', e.target.value)}
              >
                {INVESTIGATION_STATUSES.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Body Part / Area"
              value={formData.bodyPart}
              onChange={(e) => handleChange('bodyPart', e.target.value)}
              placeholder="e.g., Lumbar Spine, Right Knee, Left Shoulder"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Findings"
              value={formData.findings}
              onChange={(e) => handleChange('findings', e.target.value)}
              placeholder="Enter investigation findings..."
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Additional notes..."
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {investigation ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InvestigationForm;
