import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Folder as FolderIcon,
  Check as CheckIcon,
  Storage as StorageIcon,
  People as PeopleIcon,
  EventNote as EventNoteIcon,
  CloudUpload as CloudUploadIcon,
  Backup as BackupIcon,
} from '@mui/icons-material';

interface SetupWizardProps {
  onComplete: () => void;
}

const steps = ['Welcome', 'Select Data Location', 'Complete'];

const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [dataPath, setDataPath] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectFolder = async () => {
    try {
      const folder = await window.electronAPI.setup.selectFolder();
      if (folder) {
        setDataPath(folder);
        setError(null);
      }
    } catch (err) {
      setError('Failed to select folder');
    }
  };

  const handleNext = async () => {
    if (activeStep === 1) {
      if (!dataPath) {
        setError('Please select a data storage location');
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const result = await window.electronAPI.setup.complete(dataPath);
        if (result.success) {
          setActiveStep(2);
        } else {
          setError(result.error || 'Setup failed');
        }
      } catch (err) {
        setError('An unexpected error occurred');
      } finally {
        setIsProcessing(false);
      }
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
              Welcome to Clinic Manager
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
              This wizard will help you set up your clinic management system.
              We'll configure your data storage location and create the necessary folders.
            </Typography>

            <List sx={{ maxWidth: 400, mx: 'auto', textAlign: 'left' }}>
              <ListItem>
                <ListItemIcon><PeopleIcon color="primary" /></ListItemIcon>
                <ListItemText primary="Patient Management" secondary="Register and search patients by phone" />
              </ListItem>
              <ListItem>
                <ListItemIcon><EventNoteIcon color="primary" /></ListItemIcon>
                <ListItemText primary="Visit Scheduling" secondary="Schedule and track patient visits" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CloudUploadIcon color="primary" /></ListItemIcon>
                <ListItemText primary="File Attachments" secondary="Attach files to patient records" />
              </ListItem>
              <ListItem>
                <ListItemIcon><BackupIcon color="primary" /></ListItemIcon>
                <ListItemText primary="Automatic Backups" secondary="Daily backups to keep your data safe" />
              </ListItem>
            </List>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ py: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ textAlign: 'center' }}>
              Select Data Storage Location
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
              Choose a folder where your clinic data will be stored. This includes the database,
              patient files, and backups.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
              <TextField
                fullWidth
                label="Data Folder Path"
                value={dataPath}
                InputProps={{ readOnly: true }}
                placeholder="Click 'Browse' to select a folder"
              />
              <Button
                variant="contained"
                startIcon={<FolderIcon />}
                onClick={handleSelectFolder}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Browse
              </Button>
            </Box>

            {dataPath && (
              <Alert severity="info" sx={{ mb: 2 }}>
                The following folders will be created:
                <List dense>
                  <ListItem sx={{ py: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}><StorageIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="database/" secondary="Stores the SQLite database" />
                  </ListItem>
                  <ListItem sx={{ py: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}><PeopleIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="patients/" secondary="Patient file attachments" />
                  </ListItem>
                  <ListItem sx={{ py: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}><EventNoteIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="visits/" secondary="Visit file attachments" />
                  </ListItem>
                  <ListItem sx={{ py: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}><BackupIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="backups/" secondary="Automatic database backups" />
                  </ListItem>
                </List>
              </Alert>
            )}

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          </Box>
        );

      case 2:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'success.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
              }}
            >
              <CheckIcon sx={{ fontSize: 48, color: 'success.main' }} />
            </Box>
            <Typography variant="h4" gutterBottom>
              Setup Complete!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Your clinic management system is ready to use.
              Click the button below to log in with the default admin credentials.
            </Typography>
            <Alert severity="info" sx={{ maxWidth: 400, mx: 'auto', mb: 3 }}>
              <Typography variant="body2">
                <strong>Default Login:</strong><br />
                Username: admin<br />
                Password: admin123
              </Typography>
            </Alert>
            <Typography variant="caption" color="text.secondary">
              Please change the default password after your first login.
            </Typography>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
        p: 3,
      }}
    >
      <Card sx={{ maxWidth: 700, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {renderStepContent()}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
            {activeStep < 2 && (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={isProcessing}
                startIcon={isProcessing ? <CircularProgress size={20} /> : null}
              >
                {activeStep === 1 ? 'Complete Setup' : 'Next'}
              </Button>
            )}
            {activeStep === 2 && (
              <Button variant="contained" onClick={onComplete}>
                Go to Login
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SetupWizard;
