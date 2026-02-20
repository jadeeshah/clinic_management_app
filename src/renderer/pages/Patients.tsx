import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Paper,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Edit as EditIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Event as EventIcon,
  AttachFile as AttachFileIcon,
  Receipt as ReceiptIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  CardGiftcard as PackageIcon,
  Timeline as TimelineIcon,
  Download as DownloadIcon,
  Biotech as BiotechIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import type { Patient, Visit, Invoice, Attachment, PatientPackage, Package, Investigation } from '../../types';
import { TableSkeleton, EmptyState, TabPanel, PackageProgress, PatientTimeline, ICD10Selector, InvestigationForm } from '../components';
import { formatDate } from '../utils/formatters';
import { exportPatientToCSV, exportPatientListToCSV, downloadCSV } from '../utils/patientExport';
import type { ICD10Code } from '../../data/icd10-codes';

// Patient Form Component
interface PatientFormProps {
  patient?: Patient | null;
  onSave: (patient: Partial<Patient>) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

const PatientForm: React.FC<PatientFormProps> = ({ patient, onSave, onCancel, isLoading }) => {
  const [formData, setFormData] = useState<Partial<Patient>>({
    firstName: '',
    lastName: '',
    phone: '',
    whatsApp: '',
    email: '',
    dateOfBirth: '',
    sex: undefined,
    address: '',
    city: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    notes: '',
  });
  const [diagnosisCodes, setDiagnosisCodes] = useState<ICD10Code[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (patient) {
      setFormData({
        ...patient,
        dateOfBirth: patient.dateOfBirth || '',
      });
      // Parse diagnosis codes from JSON string
      if (patient.diagnosis) {
        try {
          const parsed = typeof patient.diagnosis === 'string'
            ? JSON.parse(patient.diagnosis)
            : patient.diagnosis;
          if (Array.isArray(parsed)) {
            setDiagnosisCodes(parsed);
          }
        } catch {
          setDiagnosisCodes([]);
        }
      } else {
        setDiagnosisCodes([]);
      }
    }
  }, [patient]);

  const handleChange = (field: keyof Patient) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: unknown } }
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName?.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.phone?.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\d\s\-+()]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validate()) {
      // Include diagnosis codes as JSON string
      const dataToSave = {
        ...formData,
        diagnosis: diagnosisCodes.length > 0 ? JSON.stringify(diagnosisCodes) : null,
      };
      await onSave(dataToSave);
    }
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="First Name"
          value={formData.firstName || ''}
          onChange={handleChange('firstName')}
          error={!!errors.firstName}
          helperText={errors.firstName}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Last Name"
          value={formData.lastName || ''}
          onChange={handleChange('lastName')}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Phone Number"
          value={formData.phone || ''}
          onChange={handleChange('phone')}
          error={!!errors.phone}
          helperText={errors.phone}
          required
          placeholder="Primary contact number"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="WhatsApp"
          value={formData.whatsApp || ''}
          onChange={handleChange('whatsApp')}
          placeholder="WhatsApp number (if different)"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Email"
          type="email"
          value={formData.email || ''}
          onChange={handleChange('email')}
          error={!!errors.email}
          helperText={errors.email}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Date of Birth"
          type="date"
          value={formData.dateOfBirth || ''}
          onChange={handleChange('dateOfBirth')}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Sex</InputLabel>
          <Select
            value={formData.sex || ''}
            label="Sex"
            onChange={(e) => handleChange('sex')({ target: { value: e.target.value } })}
          >
            <MenuItem value="Male">Male</MenuItem>
            <MenuItem value="Female">Female</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="City"
          value={formData.city || ''}
          onChange={handleChange('city')}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Address"
          value={formData.address || ''}
          onChange={handleChange('address')}
          multiline
          rows={2}
        />
      </Grid>

      <Grid item xs={12}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Emergency Contact
        </Typography>
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="Contact Name"
          value={formData.emergencyContactName || ''}
          onChange={handleChange('emergencyContactName')}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="Contact Phone"
          value={formData.emergencyContactPhone || ''}
          onChange={handleChange('emergencyContactPhone')}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="Relationship"
          value={formData.emergencyContactRelation || ''}
          onChange={handleChange('emergencyContactRelation')}
        />
      </Grid>

      <Grid item xs={12}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Diagnosis (ICD-10)
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <ICD10Selector
          value={diagnosisCodes}
          onChange={setDiagnosisCodes}
          label="Diagnosis Codes"
          placeholder="Search by ICD-10 code or description..."
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Notes"
          value={formData.notes || ''}
          onChange={handleChange('notes')}
          multiline
          rows={3}
          placeholder="Medical history, allergies, special notes..."
        />
      </Grid>

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
            {patient ? 'Update Patient' : 'Register Patient'}
          </Button>
        </Box>
      </Grid>
    </Grid>
  );
};

// Patient Profile Component
interface PatientProfileProps {
  patient: Patient;
  onEdit: () => void;
  onClose: () => void;
}

const PatientProfile: React.FC<PatientProfileProps> = ({ patient, onEdit, onClose }) => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [patientPackages, setPatientPackages] = useState<PatientPackage[]>([]);
  const [availablePackages, setAvailablePackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [selectedPackageID, setSelectedPackageID] = useState<number | ''>('');
  const [isExportingPatient, setIsExportingPatient] = useState(false);
  const [investigationFormOpen, setInvestigationFormOpen] = useState(false);
  const [selectedInvestigation, setSelectedInvestigation] = useState<Investigation | null>(null);

  const handleCreateInvoice = () => {
    onClose();
    navigate(`/billing?patientId=${patient.patientID}`);
  };

  useEffect(() => {
    loadPatientData();
  }, [patient.patientID]);

  const loadPatientData = async () => {
    setIsLoading(true);
    try {
      const [visitsResult, invoicesResult, attachmentsResult, packagesResult, availableResult, investigationsResult] = await Promise.all([
        window.electronAPI.database.execute<Visit[]>('get-patient-visits', { patientID: patient.patientID }),
        window.electronAPI.database.execute<Invoice[]>('get-patient-invoices', { patientID: patient.patientID }),
        window.electronAPI.database.execute<Attachment[]>('get-attachments', { entityType: 'Patient', entityID: patient.patientID }),
        window.electronAPI.database.execute<PatientPackage[]>('get-patient-packages', { patientID: patient.patientID }),
        window.electronAPI.database.execute<Package[]>('get-packages'),
        window.electronAPI.database.execute<Investigation[]>('get-patient-investigations', { patientID: patient.patientID }),
      ]);

      if (visitsResult.success) setVisits(visitsResult.data || []);
      if (invoicesResult.success) setInvoices(invoicesResult.data || []);
      if (attachmentsResult.success) setAttachments(attachmentsResult.data || []);
      if (packagesResult.success) setPatientPackages(packagesResult.data || []);
      if (availableResult.success) setAvailablePackages(availableResult.data || []);
      if (investigationsResult.success) setInvestigations(investigationsResult.data || []);
    } catch (error) {
      console.error('Failed to load patient data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchasePackage = async () => {
    if (!selectedPackageID) return;

    setIsPurchasing(true);
    try {
      const result = await window.electronAPI.database.execute('create-patient-package', {
        patientID: patient.patientID,
        packageID: selectedPackageID,
        purchaseDate: new Date().toISOString().split('T')[0],
      });

      if (result.success) {
        setPurchaseDialogOpen(false);
        setSelectedPackageID('');
        // Reload packages
        const packagesResult = await window.electronAPI.database.execute<PatientPackage[]>(
          'get-patient-packages',
          { patientID: patient.patientID }
        );
        if (packagesResult.success) setPatientPackages(packagesResult.data || []);
      }
    } catch (error) {
      console.error('Failed to purchase package:', error);
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleUploadFiles = async () => {
    try {
      const filePaths = await window.electronAPI.files.select();
      if (filePaths.length === 0) return;

      setIsUploading(true);
      for (const sourcePath of filePaths) {
        // Save file to storage
        const saveResult = await window.electronAPI.files.save('Patient', patient.patientID, sourcePath);
        if (saveResult.success && saveResult.data) {
          // Create attachment record
          await window.electronAPI.database.execute('create-attachment', {
            entityType: 'Patient',
            entityID: patient.patientID,
            fileName: saveResult.data.fileName,
            filePath: saveResult.data.filePath,
            fileType: sourcePath.split('.').pop() || null,
            fileSize: null, // Could get from file stats if needed
          });
        }
      }
      // Reload attachments
      const result = await window.electronAPI.database.execute<Attachment[]>('get-attachments', {
        entityType: 'Patient',
        entityID: patient.patientID
      });
      if (result.success) setAttachments(result.data || []);
    } catch (error) {
      console.error('Failed to upload files:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenFile = async (filePath: string) => {
    try {
      await window.electronAPI.files.open(filePath);
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  };

  const handleDeleteAttachment = async (attachment: Attachment) => {
    if (!confirm(`Delete "${attachment.fileName}"?`)) return;

    try {
      await window.electronAPI.database.execute('delete-attachment', {
        attachmentID: attachment.attachmentID
      });
      setAttachments(attachments.filter(a => a.attachmentID !== attachment.attachmentID));
    } catch (error) {
      console.error('Failed to delete attachment:', error);
    }
  };

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <FileIcon />;
    const type = fileType.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(type)) return '🖼️';
    if (['pdf'].includes(type)) return '📄';
    if (['doc', 'docx'].includes(type)) return '📝';
    if (['xls', 'xlsx'].includes(type)) return '📊';
    return <FileIcon />;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString();
  };

  const calculateAge = (dob: string | null) => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age} years`;
  };

  const handleExportPatient = async () => {
    setIsExportingPatient(true);
    try {
      const result = await window.electronAPI.database.execute<{
        patient: Patient;
        visits: Visit[];
        invoices: Invoice[];
        packages: PatientPackage[];
      }>('get-patient-export-data', { patientID: patient.patientID });

      if (result.success && result.data) {
        const csv = exportPatientToCSV(result.data);
        const patientName = `${patient.firstName}_${patient.lastName || ''}`.replace(/\s+/g, '_');
        const today = new Date().toISOString().split('T')[0];
        downloadCSV(csv, `patient-${patientName}-${today}.csv`);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExportingPatient(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5">
            {patient.firstName} {patient.lastName}
          </Typography>
          <Chip label={patient.mrn} size="small" sx={{ mt: 1 }} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            startIcon={isExportingPatient ? <CircularProgress size={16} /> : <DownloadIcon />}
            onClick={handleExportPatient}
            disabled={isExportingPatient}
          >
            Export
          </Button>
          <Button startIcon={<EditIcon />} onClick={onEdit}>
            Edit
          </Button>
          <Button onClick={onClose}>Close</Button>
        </Box>
      </Box>

      {/* Contact Info */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PhoneIcon color="action" />
              <Box>
                <Typography variant="body2" color="text.secondary">Phone</Typography>
                <Typography variant="body1">{patient.phone}</Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PhoneIcon color="action" />
              <Box>
                <Typography variant="body2" color="text.secondary">WhatsApp</Typography>
                <Typography variant="body1">{patient.whatsApp || 'N/A'}</Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmailIcon color="action" />
              <Box>
                <Typography variant="body2" color="text.secondary">Email</Typography>
                <Typography variant="body1">{patient.email || 'N/A'}</Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Demographics */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Demographics
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Typography variant="body2" color="text.secondary">Sex</Typography>
            <Typography variant="body1">{patient.sex || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="body2" color="text.secondary">Date of Birth</Typography>
            <Typography variant="body1">{formatDate(patient.dateOfBirth)}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="body2" color="text.secondary">Age</Typography>
            <Typography variant="body1">{calculateAge(patient.dateOfBirth)}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="body2" color="text.secondary">City</Typography>
            <Typography variant="body1">{patient.city || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">Address</Typography>
            <Typography variant="body1">{patient.address || 'N/A'}</Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Emergency Contact */}
      {(patient.emergencyContactName || patient.emergencyContactPhone) && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Emergency Contact
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Typography variant="body2" color="text.secondary">Name</Typography>
              <Typography variant="body1">{patient.emergencyContactName || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="body2" color="text.secondary">Phone</Typography>
              <Typography variant="body1">{patient.emergencyContactPhone || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="body2" color="text.secondary">Relationship</Typography>
              <Typography variant="body1">{patient.emergencyContactRelation || 'N/A'}</Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Notes */}
      {patient.notes && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Notes
          </Typography>
          <Typography variant="body1">{patient.notes}</Typography>
        </Paper>
      )}

      {/* Tabs for History */}
      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
        <Tab icon={<TimelineIcon />} label="Timeline" />
        <Tab icon={<PackageIcon />} label="Packages" />
        <Tab icon={<EventIcon />} label="Visits" />
        <Tab icon={<ReceiptIcon />} label="Invoices" />
        <Tab icon={<BiotechIcon />} label="Investigations" />
        <Tab icon={<AttachFileIcon />} label="Files" />
      </Tabs>

      {/* Timeline Tab */}
      <TabPanel value={tabValue} index={0}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <PatientTimeline
            visits={visits}
            invoices={invoices}
            attachments={attachments}
            packages={patientPackages}
            onVisitClick={(visit) => {
              onClose();
              navigate(`/visits?id=${visit.visitID}`);
            }}
            onInvoiceClick={(invoice) => {
              onClose();
              navigate(`/billing?id=${invoice.invoiceID}`);
            }}
          />
        )}
      </TabPanel>

      {/* Packages Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={<PackageIcon />}
            onClick={() => setPurchaseDialogOpen(true)}
            disabled={availablePackages.length === 0}
          >
            Purchase Package
          </Button>
        </Box>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : patientPackages.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {patientPackages.map((pkg) => (
              <PackageProgress key={pkg.patientPackageID} package={pkg} />
            ))}
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <PackageIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography color="text.secondary">
              No packages purchased
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Click "Purchase Package" to buy a session package
            </Typography>
          </Box>
        )}
      </TabPanel>

      {/* Visits Tab */}
      <TabPanel value={tabValue} index={2}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : visits.length > 0 ? (
          <List>
            {visits.map((visit, index) => (
              <React.Fragment key={visit.visitID}>
                <ListItem
                  button
                  onClick={() => {
                    onClose();
                    navigate(`/visits?id=${visit.visitID}`);
                  }}
                  sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <ListItemText
                    primary={`${visit.visitDate} at ${visit.startTime}`}
                    secondary={`${visit.visitType} - ${visit.doctorName || 'Doctor'}`}
                  />
                  <ListItemSecondaryAction>
                    <Chip
                      label={visit.status}
                      size="small"
                      color={visit.status === 'Completed' ? 'success' : 'default'}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                {index < visits.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No visits recorded
          </Typography>
        )}
      </TabPanel>

      {/* Invoices Tab */}
      <TabPanel value={tabValue} index={3}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={<ReceiptIcon />}
            onClick={handleCreateInvoice}
          >
            New Invoice
          </Button>
        </Box>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : invoices.length > 0 ? (
          <List>
            {invoices.map((invoice, index) => (
              <React.Fragment key={invoice.invoiceID}>
                <ListItem
                  button
                  onClick={() => {
                    onClose();
                    navigate(`/billing?id=${invoice.invoiceID}`);
                  }}
                  sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <ListItemText
                    primary={invoice.invoiceNo}
                    secondary={`${invoice.invoiceDate} - Rs ${invoice.total.toLocaleString()}`}
                  />
                  <ListItemSecondaryAction>
                    <Chip
                      label={invoice.status}
                      size="small"
                      color={invoice.status === 'Paid' ? 'success' : invoice.status === 'Unpaid' ? 'error' : 'warning'}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                {index < invoices.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No invoices
          </Typography>
        )}
      </TabPanel>

      {/* Investigations Tab */}
      <TabPanel value={tabValue} index={4}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedInvestigation(null);
              setInvestigationFormOpen(true);
            }}
          >
            Add Investigation
          </Button>
        </Box>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : investigations.length > 0 ? (
          <List>
            {investigations.map((investigation, index) => (
              <React.Fragment key={investigation.investigationID}>
                <ListItem
                  sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                  onClick={() => {
                    setSelectedInvestigation(investigation);
                    setInvestigationFormOpen(true);
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BiotechIcon color="action" fontSize="small" />
                        <Typography>{investigation.investigationType}</Typography>
                        {investigation.bodyPart && (
                          <Typography variant="body2" color="text.secondary">
                            ({investigation.bodyPart})
                          </Typography>
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary" component="span">
                          {investigation.investigationDate}
                          {investigation.doctorName && ` - Dr. ${investigation.doctorName}`}
                        </Typography>
                        {investigation.findings && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 0.5, display: 'block' }}
                          >
                            {investigation.findings.length > 100
                              ? `${investigation.findings.substring(0, 100)}...`
                              : investigation.findings}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={investigation.status}
                        size="small"
                        color={
                          investigation.status === 'Reviewed' ? 'success' :
                          investigation.status === 'Completed' ? 'primary' :
                          investigation.status === 'Scheduled' ? 'warning' : 'default'
                        }
                      />
                      <IconButton
                        size="small"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (confirm('Delete this investigation?')) {
                            await window.electronAPI.database.execute('delete-investigation', {
                              investigationID: investigation.investigationID,
                            });
                            setInvestigations(investigations.filter(
                              i => i.investigationID !== investigation.investigationID
                            ));
                          }
                        }}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < investigations.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <BiotechIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography color="text.secondary">
              No investigations recorded
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Click "Add Investigation" to record X-rays, MRIs, etc.
            </Typography>
          </Box>
        )}
      </TabPanel>

      {/* Files Tab */}
      <TabPanel value={tabValue} index={5}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={isUploading ? <CircularProgress size={20} /> : <UploadIcon />}
            onClick={handleUploadFiles}
            disabled={isUploading}
          >
            Upload Files
          </Button>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : attachments.length > 0 ? (
          <List>
            {attachments.map((attachment, index) => (
              <React.Fragment key={attachment.attachmentID}>
                <ListItem
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleOpenFile(attachment.filePath)}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{getFileIcon(attachment.fileType)}</span>
                        <Typography>{attachment.fileName}</Typography>
                      </Box>
                    }
                    secondary={new Date(attachment.uploadedAt).toLocaleDateString()}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAttachment(attachment);
                      }}
                      color="error"
                      aria-label="Delete attachment"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < attachments.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <FolderIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography color="text.secondary">
              No files attached
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Click "Upload Files" to attach documents
            </Typography>
          </Box>
        )}
      </TabPanel>

      {/* Purchase Package Dialog */}
      <Dialog open={purchaseDialogOpen} onClose={() => setPurchaseDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Purchase Session Package</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Select Package</InputLabel>
              <Select
                value={selectedPackageID}
                label="Select Package"
                onChange={(e) => setSelectedPackageID(e.target.value as number)}
              >
                {availablePackages.map((pkg) => (
                  <MenuItem key={pkg.packageID} value={pkg.packageID}>
                    <Box>
                      <Typography>{pkg.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {pkg.totalSessions} sessions - Rs {pkg.price.toLocaleString()} ({pkg.validityDays} days validity)
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPurchaseDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handlePurchasePackage}
            disabled={!selectedPackageID || isPurchasing}
            startIcon={isPurchasing ? <CircularProgress size={20} /> : null}
          >
            Purchase
          </Button>
        </DialogActions>
      </Dialog>

      {/* Investigation Form Dialog */}
      <InvestigationForm
        open={investigationFormOpen}
        onClose={() => {
          setInvestigationFormOpen(false);
          setSelectedInvestigation(null);
        }}
        onSave={async () => {
          // Reload investigations
          const result = await window.electronAPI.database.execute<Investigation[]>(
            'get-patient-investigations',
            { patientID: patient.patientID }
          );
          if (result.success) setInvestigations(result.data || []);
        }}
        patientID={patient.patientID}
        investigation={selectedInvestigation}
      />
    </Box>
  );
};

// Main Patients Component
const Patients: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [totalPatients, setTotalPatients] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    // Check for action query param
    if (searchParams.get('action') === 'new') {
      setFormDialogOpen(true);
      setSearchParams({});
    }
    // Check for patient ID to view
    const patientId = searchParams.get('id');
    if (patientId) {
      loadPatientById(parseInt(patientId));
    }

    loadPatients();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      searchPatients();
    } else {
      loadPatients();
    }
  }, [page, rowsPerPage, searchQuery]);

  const loadPatients = async () => {
    setIsLoading(true);
    try {
      const result = await window.electronAPI.database.execute<{ items: Patient[]; total: number }>(
        'get-patients',
        { limit: rowsPerPage, offset: page * rowsPerPage }
      );
      if (result.success && result.data) {
        setPatients(result.data.items);
        setTotalPatients(result.data.total);
      }
    } catch (error) {
      console.error('Failed to load patients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPatientById = async (patientID: number) => {
    try {
      const result = await window.electronAPI.database.execute<Patient>('get-patient', { patientID });
      if (result.success && result.data) {
        setSelectedPatient(result.data);
        setProfileDialogOpen(true);
        setSearchParams({});
      }
    } catch (error) {
      console.error('Failed to load patient:', error);
    }
  };

  const searchPatients = async () => {
    setIsLoading(true);
    try {
      const result = await window.electronAPI.database.execute<Patient[]>('search-patients', {
        query: searchQuery,
        limit: rowsPerPage,
      });
      if (result.success && result.data) {
        setPatients(result.data);
        setTotalPatients(result.data.length);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePatient = async (patientData: Partial<Patient>) => {
    setIsSaving(true);
    setMessage(null);

    try {
      const operation = selectedPatient ? 'update-patient' : 'create-patient';
      const data = selectedPatient ? { ...patientData, patientID: selectedPatient.patientID } : patientData;

      const result = await window.electronAPI.database.execute<{ patientID: number; mrn?: string }>(operation, data);

      if (result.success) {
        setMessage({
          type: 'success',
          text: selectedPatient ? 'Patient updated successfully' : `Patient registered with MRN: ${result.data?.mrn}`,
        });
        setFormDialogOpen(false);
        setSelectedPatient(null);
        loadPatients();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save patient' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRowClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setProfileDialogOpen(true);
  };

  const handleEdit = () => {
    setProfileDialogOpen(false);
    setFormDialogOpen(true);
  };

  const handleNewPatient = () => {
    setSelectedPatient(null);
    setFormDialogOpen(true);
  };

  const handleExportList = async () => {
    setIsExporting(true);
    try {
      const result = await window.electronAPI.database.execute<{
        patientID: number;
        mrn: string;
        firstName: string;
        lastName: string;
        phone: string;
        city: string;
        totalVisits: number;
        completedVisits: number;
        totalPaid: number;
        createdAt: string;
      }[]>('get-patients-list-export');

      if (result.success && result.data) {
        const csv = exportPatientListToCSV(result.data);
        const today = new Date().toISOString().split('T')[0];
        downloadCSV(csv, `patients-export-${today}.csv`);
        setMessage({ type: 'success', text: `Exported ${result.data.length} patients` });
      } else {
        setMessage({ type: 'error', text: 'Failed to export patients' });
      }
    } catch (error) {
      console.error('Export failed:', error);
      setMessage({ type: 'error', text: 'Export failed' });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Patients</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={isExporting ? <CircularProgress size={16} /> : <DownloadIcon />}
            onClick={handleExportList}
            disabled={isExporting}
          >
            Export List
          </Button>
          <Button variant="contained" startIcon={<PersonAddIcon />} onClick={handleNewPatient}>
            New Patient
          </Button>
        </Box>
      </Box>

      {/* Messages */}
      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search by phone number, name, or MRN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
        </CardContent>
      </Card>

      {/* Patients Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>MRN</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>City</TableCell>
                <TableCell>Registered</TableCell>
              </TableRow>
            </TableHead>
            {isLoading ? (
              <TableSkeleton columns={5} rows={5} />
            ) : (
              <TableBody>
                {patients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <EmptyState
                        title={searchQuery ? 'No patients found' : 'No patients yet'}
                        description={searchQuery
                          ? 'Try adjusting your search terms'
                          : 'Register your first patient to get started'
                        }
                        filterCount={searchQuery ? 1 : 0}
                        onClearFilters={searchQuery ? () => setSearchQuery('') : undefined}
                        actionLabel={!searchQuery ? 'Register Patient' : undefined}
                        onAction={!searchQuery ? () => setFormDialogOpen(true) : undefined}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  patients.map((patient) => (
                    <TableRow
                      key={patient.patientID}
                      hover
                      onClick={() => handleRowClick(patient)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Chip label={patient.mrn} size="small" />
                      </TableCell>
                      <TableCell>
                        {patient.firstName} {patient.lastName}
                      </TableCell>
                      <TableCell>{patient.phone}</TableCell>
                      <TableCell>{patient.city || '-'}</TableCell>
                      <TableCell>{formatDate(patient.createdAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            )}
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={totalPatients}
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

      {/* Patient Form Dialog */}
      <Dialog open={formDialogOpen} onClose={() => setFormDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedPatient ? 'Edit Patient' : 'Register New Patient'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <PatientForm
              patient={selectedPatient}
              onSave={handleSavePatient}
              onCancel={() => {
                setFormDialogOpen(false);
                setSelectedPatient(null);
              }}
              isLoading={isSaving}
            />
          </Box>
        </DialogContent>
      </Dialog>

      {/* Patient Profile Dialog */}
      <Dialog open={profileDialogOpen} onClose={() => setProfileDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogContent>
          {selectedPatient && (
            <PatientProfile
              patient={selectedPatient}
              onEdit={handleEdit}
              onClose={() => {
                setProfileDialogOpen(false);
                setSelectedPatient(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Patients;
