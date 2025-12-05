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
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  InputAdornment,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import type { Service, Package } from '../../types';

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

// Service Form
interface ServiceFormData {
  code: string;
  name: string;
  defaultPrice: number;
  category: string;
}

const initialServiceForm: ServiceFormData = {
  code: '',
  name: '',
  defaultPrice: 0,
  category: '',
};

// Package Form
interface PackageFormData {
  name: string;
  totalSessions: number;
  price: number;
  validityDays: number;
}

const initialPackageForm: PackageFormData = {
  name: '',
  totalSessions: 10,
  price: 0,
  validityDays: 30,
};

const Services: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  // Services state
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceForm, setServiceForm] = useState<ServiceFormData>(initialServiceForm);

  // Packages state
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [packageDialogOpen, setPackageDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [packageForm, setPackageForm] = useState<PackageFormData>(initialPackageForm);

  // Common state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadServices();
    loadPackages();
  }, []);

  const loadServices = async () => {
    setIsLoadingServices(true);
    try {
      const result = await window.electronAPI.database.execute<Service[]>('get-services');
      if (result.success && result.data) {
        setServices(result.data);
      }
    } catch (error) {
      console.error('Failed to load services:', error);
    } finally {
      setIsLoadingServices(false);
    }
  };

  const loadPackages = async () => {
    setIsLoadingPackages(true);
    try {
      const result = await window.electronAPI.database.execute<Package[]>('get-packages');
      if (result.success && result.data) {
        setPackages(result.data);
      }
    } catch (error) {
      console.error('Failed to load packages:', error);
    } finally {
      setIsLoadingPackages(false);
    }
  };

  // Service handlers
  const handleOpenServiceDialog = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setServiceForm({
        code: service.code,
        name: service.name,
        defaultPrice: service.defaultPrice,
        category: service.category || '',
      });
    } else {
      setEditingService(null);
      setServiceForm(initialServiceForm);
    }
    setError(null);
    setServiceDialogOpen(true);
  };

  const handleCloseServiceDialog = () => {
    setServiceDialogOpen(false);
    setEditingService(null);
    setServiceForm(initialServiceForm);
    setError(null);
  };

  const handleSaveService = async () => {
    if (!serviceForm.code.trim() || !serviceForm.name.trim()) {
      setError('Code and name are required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (editingService) {
        const result = await window.electronAPI.database.execute('update-service', {
          ...serviceForm,
          serviceID: editingService.serviceID
        });
        if (!result.success) {
          throw new Error(result.error || 'Failed to update service');
        }
      } else {
        const result = await window.electronAPI.database.execute('create-service', serviceForm);
        if (!result.success) {
          throw new Error(result.error || 'Failed to create service');
        }
      }

      await loadServices();
      handleCloseServiceDialog();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteService = async (service: Service) => {
    if (!confirm(`Are you sure you want to delete "${service.name}"?`)) return;

    try {
      const result = await window.electronAPI.database.execute('deactivate-service', {
        serviceID: service.serviceID
      });
      if (result.success) {
        await loadServices();
      }
    } catch (error) {
      console.error('Failed to delete service:', error);
    }
  };

  // Package handlers
  const handleOpenPackageDialog = (pkg?: Package) => {
    if (pkg) {
      setEditingPackage(pkg);
      setPackageForm({
        name: pkg.name,
        totalSessions: pkg.totalSessions,
        price: pkg.price,
        validityDays: pkg.validityDays,
      });
    } else {
      setEditingPackage(null);
      setPackageForm(initialPackageForm);
    }
    setError(null);
    setPackageDialogOpen(true);
  };

  const handleClosePackageDialog = () => {
    setPackageDialogOpen(false);
    setEditingPackage(null);
    setPackageForm(initialPackageForm);
    setError(null);
  };

  const handleSavePackage = async () => {
    if (!packageForm.name.trim() || packageForm.totalSessions < 1) {
      setError('Name and valid session count are required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (editingPackage) {
        const result = await window.electronAPI.database.execute('update-package', {
          ...packageForm,
          packageID: editingPackage.packageID
        });
        if (!result.success) {
          throw new Error(result.error || 'Failed to update package');
        }
      } else {
        const result = await window.electronAPI.database.execute('create-package', packageForm);
        if (!result.success) {
          throw new Error(result.error || 'Failed to create package');
        }
      }

      await loadPackages();
      handleClosePackageDialog();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePackage = async (pkg: Package) => {
    if (!confirm(`Are you sure you want to delete "${pkg.name}"?`)) return;

    try {
      const result = await window.electronAPI.database.execute('deactivate-package', {
        packageID: pkg.packageID
      });
      if (result.success) {
        await loadPackages();
      }
    } catch (error) {
      console.error('Failed to delete package:', error);
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Services & Packages</Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="Services" />
          <Tab label="Packages" />
        </Tabs>
      </Paper>

      {/* Services Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenServiceDialog()}
          >
            Add Service
          </Button>
        </Box>

        {isLoadingServices ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : services.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Services Found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Add your first service to use in invoices.
              </Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenServiceDialog()}>
                Add Service
              </Button>
            </CardContent>
          </Card>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Default Price</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.serviceID} hover>
                    <TableCell>
                      <Chip label={service.code} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight="medium">{service.name}</Typography>
                    </TableCell>
                    <TableCell>{service.category || '-'}</TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="medium" color="primary">
                        Rs {service.defaultPrice.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleOpenServiceDialog(service)} aria-label="Edit service">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteService(service)} aria-label="Delete service" color="error">
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

      {/* Packages Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenPackageDialog()}
          >
            Add Package
          </Button>
        </Box>

        {isLoadingPackages ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : packages.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Packages Found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Create session packages for patients to purchase.
              </Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenPackageDialog()}>
                Add Package
              </Button>
            </CardContent>
          </Card>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Package Name</TableCell>
                  <TableCell align="center">Sessions</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="center">Validity (Days)</TableCell>
                  <TableCell align="right">Per Session</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {packages.map((pkg) => (
                  <TableRow key={pkg.packageID} hover>
                    <TableCell>
                      <Typography fontWeight="medium">{pkg.name}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={`${pkg.totalSessions} sessions`} color="primary" size="small" />
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="medium" color="primary">
                        Rs {pkg.price.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">{pkg.validityDays} days</TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="text.secondary">
                        Rs {Math.round(pkg.price / pkg.totalSessions).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleOpenPackageDialog(pkg)} aria-label="Edit package">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeletePackage(pkg)} aria-label="Delete package" color="error">
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

      {/* Service Dialog */}
      <Dialog open={serviceDialogOpen} onClose={handleCloseServiceDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingService ? 'Edit Service' : 'Add New Service'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Service Code"
                value={serviceForm.code}
                onChange={(e) => setServiceForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                required
                placeholder="e.g., PT-SESSION"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Category"
                value={serviceForm.category}
                onChange={(e) => setServiceForm(prev => ({ ...prev, category: e.target.value }))}
                placeholder="e.g., Therapy"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Service Name"
                value={serviceForm.name}
                onChange={(e) => setServiceForm(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Default Price"
                type="number"
                value={serviceForm.defaultPrice}
                onChange={(e) => setServiceForm(prev => ({ ...prev, defaultPrice: Number(e.target.value) }))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseServiceDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveService} disabled={isSaving}>
            {isSaving ? <CircularProgress size={24} /> : editingService ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Package Dialog */}
      <Dialog open={packageDialogOpen} onClose={handleClosePackageDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingPackage ? 'Edit Package' : 'Add New Package'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Package Name"
                value={packageForm.name}
                onChange={(e) => setPackageForm(prev => ({ ...prev, name: e.target.value }))}
                required
                placeholder="e.g., 10 Session Package"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Total Sessions"
                type="number"
                value={packageForm.totalSessions}
                onChange={(e) => setPackageForm(prev => ({ ...prev, totalSessions: Number(e.target.value) }))}
                inputProps={{ min: 1 }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Validity (Days)"
                type="number"
                value={packageForm.validityDays}
                onChange={(e) => setPackageForm(prev => ({ ...prev, validityDays: Number(e.target.value) }))}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Package Price"
                type="number"
                value={packageForm.price}
                onChange={(e) => setPackageForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
                }}
              />
            </Grid>
            {packageForm.totalSessions > 0 && packageForm.price > 0 && (
              <Grid item xs={12}>
                <Alert severity="info">
                  Per session cost: Rs {Math.round(packageForm.price / packageForm.totalSessions).toLocaleString()}
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePackageDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSavePackage} disabled={isSaving}>
            {isSaving ? <CircularProgress size={24} /> : editingPackage ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Services;
