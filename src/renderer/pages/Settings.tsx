import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { Save as SaveIcon, Backup as BackupIcon, DataObject as DataIcon, CloudUpload as UploadIcon, Close as CloseIcon } from '@mui/icons-material';
import type { Settings as SettingsType } from '../../types';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<Partial<SettingsType>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDemoDataDialog, setShowDemoDataDialog] = useState(false);
  const [isLoadingDemoData, setIsLoadingDemoData] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const result = await window.electronAPI.database.execute<SettingsType>('get-settings');
      if (result.success && result.data) {
        setSettings(result.data);
        // Load logo preview if logoPath exists
        if (result.data.logoPath) {
          const logoResult = await window.electronAPI.files.readLogoBase64(result.data.logoPath);
          if (logoResult.success && logoResult.data) {
            setLogoPreview(logoResult.data);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const result = await window.electronAPI.database.execute('update-settings', settings);
      if (result.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackup = async () => {
    try {
      const result = await window.electronAPI.backup.create();
      if (result.success) {
        setMessage({ type: 'success', text: `Backup created: ${result.data}` });
      } else {
        setMessage({ type: 'error', text: result.error || 'Backup failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Backup failed' });
    }
  };

  const handleChange = (field: keyof SettingsType) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleLogoUpload = async () => {
    try {
      const imagePath = await window.electronAPI.files.selectImage();
      if (!imagePath) return;

      const saveResult = await window.electronAPI.files.saveLogo(imagePath);
      if (saveResult.success && saveResult.data) {
        setSettings((prev) => ({ ...prev, logoPath: saveResult.data!.filePath }));

        // Load the preview
        const logoResult = await window.electronAPI.files.readLogoBase64(saveResult.data.filePath);
        if (logoResult.success && logoResult.data) {
          setLogoPreview(logoResult.data);
        }
        setMessage({ type: 'success', text: 'Logo uploaded. Click Save Settings to apply.' });
      } else {
        setMessage({ type: 'error', text: saveResult.error || 'Failed to upload logo' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to upload logo' });
    }
  };

  const handleLogoRemove = () => {
    setSettings((prev) => ({ ...prev, logoPath: '' }));
    setLogoPreview(null);
    setMessage({ type: 'success', text: 'Logo removed. Click Save Settings to apply.' });
  };

  const handleLoadDemoData = async () => {
    setIsLoadingDemoData(true);
    setShowDemoDataDialog(false);
    setMessage(null);

    try {
      const result = await window.electronAPI.seed.loadDemoData(true);
      if (result.success && result.counts) {
        const { doctors, patients, visits, invoices, packages, expenses } = result.counts;
        setMessage({
          type: 'success',
          text: `Demo data loaded successfully: ${doctors} doctors, ${patients} patients, ${visits} visits, ${invoices} invoices, ${packages} packages, ${expenses} expenses`,
        });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to load demo data' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load demo data' });
    } finally {
      setIsLoadingDemoData(false);
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
      <Typography variant="h5" sx={{ mb: 3 }}>Clinic Settings</Typography>

      {message && (
        <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Clinic Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Clinic Information
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {/* Logo Upload Section */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Clinic Logo
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box
                    sx={{
                      width: 100,
                      height: 100,
                      border: '2px dashed',
                      borderColor: 'divider',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      bgcolor: 'grey.50',
                    }}
                  >
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Clinic Logo"
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary" textAlign="center">
                        No Logo
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<UploadIcon />}
                      onClick={handleLogoUpload}
                    >
                      {logoPreview ? 'Change Logo' : 'Upload Logo'}
                    </Button>
                    {logoPreview && (
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        startIcon={<CloseIcon />}
                        onClick={handleLogoRemove}
                      >
                        Remove
                      </Button>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      Recommended: PNG or JPG, max 200x200px
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <TextField
                fullWidth
                label="Clinic Name"
                value={settings.clinicName || ''}
                onChange={handleChange('clinicName')}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Address"
                value={settings.address || ''}
                onChange={handleChange('address')}
                margin="normal"
                multiline
                rows={2}
              />
              <TextField
                fullWidth
                label="Phone"
                value={settings.phone || ''}
                onChange={handleChange('phone')}
                margin="normal"
              />
              <TextField
                fullWidth
                label="WhatsApp"
                value={settings.whatsApp || ''}
                onChange={handleChange('whatsApp')}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Email"
                value={settings.email || ''}
                onChange={handleChange('email')}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Website"
                value={settings.website || ''}
                onChange={handleChange('website')}
                margin="normal"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Invoice Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Invoice Settings
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <TextField
                fullWidth
                label="Invoice Prefix"
                value={settings.invoicePrefix || ''}
                onChange={handleChange('invoicePrefix')}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Currency Symbol"
                value={settings.currency || ''}
                onChange={handleChange('currency')}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Tax Percentage"
                type="number"
                value={settings.taxPercent || 0}
                onChange={handleChange('taxPercent')}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Default Visit Duration (minutes)"
                type="number"
                value={settings.defaultVisitDuration || 45}
                onChange={handleChange('defaultVisitDuration')}
                margin="normal"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Backup */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Backup & Data
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
                <Button
                  variant="outlined"
                  startIcon={<BackupIcon />}
                  onClick={handleBackup}
                >
                  Create Backup Now
                </Button>
                <Typography variant="body2" color="text.secondary">
                  Automatic backups are created daily on app startup
                </Typography>
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Demo Data
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={isLoadingDemoData ? <CircularProgress size={20} /> : <DataIcon />}
                  onClick={() => setShowDemoDataDialog(true)}
                  disabled={isLoadingDemoData}
                >
                  Load Demo Data
                </Button>
                <Typography variant="body2" color="text.secondary">
                  Load sample data for training and demonstrations
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Demo Data Confirmation Dialog */}
      <Dialog
        open={showDemoDataDialog}
        onClose={() => setShowDemoDataDialog(false)}
        aria-labelledby="demo-data-dialog-title"
      >
        <DialogTitle id="demo-data-dialog-title">Load Demo Data?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will clear all existing data (doctors, patients, visits, invoices, packages, expenses)
            and replace it with sample demo data. This action cannot be undone.
          </DialogContentText>
          <DialogContentText sx={{ mt: 2, fontWeight: 'bold' }}>
            Are you sure you want to proceed?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDemoDataDialog(false)}>Cancel</Button>
          <Button onClick={handleLoadDemoData} color="warning" variant="contained">
            Load Demo Data
          </Button>
        </DialogActions>
      </Dialog>

      {/* Save Button */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={isSaving ? <CircularProgress size={20} /> : <SaveIcon />}
          onClick={handleSave}
          disabled={isSaving}
        >
          Save Settings
        </Button>
      </Box>
    </Box>
  );
};

export default Settings;
