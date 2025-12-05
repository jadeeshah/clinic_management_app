import React, { useState, useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  EventNote as EventNoteIcon,
  Receipt as ReceiptIcon,
  Assessment as AssessmentIcon,
  LocalHospital as DoctorIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  MedicalServices as ServicesIcon,
  BarChart as ReportsIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useKeyboardShortcuts, type KeyboardShortcut } from '../hooks';

const DRAWER_WIDTH = 240;

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: <DashboardIcon /> },
  { path: '/patients', label: 'Patients', icon: <PeopleIcon /> },
  { path: '/visits', label: 'Visits', icon: <EventNoteIcon /> },
  { path: '/billing', label: 'Billing', icon: <ReceiptIcon /> },
  { path: '/finance', label: 'Finance', icon: <AssessmentIcon /> },
  { path: '/reports', label: 'Reports', icon: <ReportsIcon /> },
  { path: '/services', label: 'Services', icon: <ServicesIcon />, adminOnly: true },
  { path: '/doctors', label: 'Doctors', icon: <DoctorIcon />, adminOnly: true },
  { path: '/settings', label: 'Settings', icon: <SettingsIcon />, adminOnly: true },
];

const Layout: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Global keyboard shortcuts
  const shortcuts = useMemo<KeyboardShortcut[]>(() => [
    // Navigation shortcuts (Alt+1 through Alt+6)
    { key: '1', alt: true, handler: () => navigate('/'), description: 'Go to Dashboard' },
    { key: '2', alt: true, handler: () => navigate('/patients'), description: 'Go to Patients' },
    { key: '3', alt: true, handler: () => navigate('/visits'), description: 'Go to Visits' },
    { key: '4', alt: true, handler: () => navigate('/billing'), description: 'Go to Billing' },
    { key: '5', alt: true, handler: () => navigate('/finance'), description: 'Go to Finance' },
    { key: '6', alt: true, handler: () => navigate('/reports'), description: 'Go to Reports' },
    // Quick action shortcuts
    { key: 'p', ctrl: true, shift: true, handler: () => navigate('/patients?action=new'), description: 'New Patient' },
    { key: 'v', ctrl: true, shift: true, handler: () => navigate('/visits?action=new'), description: 'New Visit' },
    { key: 'k', ctrl: true, handler: () => {
      // Focus the search input if it exists
      const searchInput = document.querySelector<HTMLInputElement>('input[placeholder*="Search"]');
      if (searchInput) searchInput.focus();
    }, description: 'Focus Search' },
  ], [navigate]);

  useKeyboardShortcuts(shortcuts);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate('/login');
  };

  const handleNavClick = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const filteredNavItems = navItems.filter(
    (item) => !item.adminOnly || user?.role === 'Admin'
  );

  const drawer = (
    <Box>
      <Toolbar sx={{ justifyContent: 'center' }}>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700 }}>
          Clinic Manager
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {filteredNavItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavClick(item.path)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.light + '20',
                  borderRight: `3px solid ${theme.palette.primary.main}`,
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color:
                    location.pathname === item.path
                      ? theme.palette.primary.main
                      : 'inherit',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { sm: `${DRAWER_WIDTH}px` },
          boxShadow: 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            aria-label="Open navigation menu"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {filteredNavItems.find((item) => item.path === location.pathname)?.label ||
              'Dashboard'}
          </Typography>

          {/* User Menu */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {user?.username}
            </Typography>
            <IconButton onClick={handleMenuOpen} color="inherit" aria-label="Open user menu">
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                <PersonIcon fontSize="small" />
              </Avatar>
            </IconButton>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem disabled>
              <Typography variant="body2" color="text.secondary">
                {user?.role}
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: '64px',
          backgroundColor: 'background.default',
          minHeight: 'calc(100vh - 64px)',
          overflow: 'auto',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
