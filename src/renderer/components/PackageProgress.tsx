import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Chip,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import type { PatientPackage } from '../../types';

export interface PackageProgressProps {
  package: PatientPackage;
  compact?: boolean;
}

const PackageProgress: React.FC<PackageProgressProps> = ({ package: pkg, compact = false }) => {
  const sessionsUsed = pkg.sessionsUsed || 0;
  const totalSessions = pkg.totalSessions || 0;
  const sessionsRemaining = totalSessions - sessionsUsed;
  const progressPercent = totalSessions > 0 ? (sessionsUsed / totalSessions) * 100 : 0;

  // Calculate days until expiry
  const today = new Date();
  const expiryDate = pkg.expiryDate ? new Date(pkg.expiryDate) : null;
  const daysUntilExpiry = expiryDate
    ? Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Determine status color and icon
  const getStatusInfo = () => {
    if (pkg.status === 'Completed') {
      return {
        color: 'success' as const,
        icon: <CheckCircleIcon fontSize="small" />,
        label: 'Completed',
      };
    }
    if (pkg.status === 'Expired' || (daysUntilExpiry !== null && daysUntilExpiry < 0)) {
      return {
        color: 'error' as const,
        icon: <ErrorIcon fontSize="small" />,
        label: 'Expired',
      };
    }
    if (daysUntilExpiry !== null && daysUntilExpiry <= 7) {
      return {
        color: 'warning' as const,
        icon: <WarningIcon fontSize="small" />,
        label: `${daysUntilExpiry} days left`,
      };
    }
    return {
      color: 'primary' as const,
      icon: null,
      label: 'Active',
    };
  };

  const statusInfo = getStatusInfo();

  // Get progress bar color
  const getProgressColor = () => {
    if (progressPercent >= 100) return 'success';
    if (progressPercent >= 80) return 'warning';
    return 'primary';
  };

  if (compact) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" sx={{ minWidth: 100 }}>
          {pkg.packageName}
        </Typography>
        <Box sx={{ flexGrow: 1, mx: 1 }}>
          <LinearProgress
            variant="determinate"
            value={progressPercent}
            color={getProgressColor()}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 60 }}>
          {sessionsUsed}/{totalSessions}
        </Typography>
        <Chip
          label={statusInfo.label}
          color={statusInfo.color}
          size="small"
          icon={statusInfo.icon || undefined}
          sx={{ minWidth: 80 }}
        />
      </Box>
    );
  }

  return (
    <Paper
      sx={{
        p: 2,
        borderLeft: 4,
        borderColor: `${statusInfo.color}.main`,
      }}
      elevation={1}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Box>
          <Typography variant="subtitle1" fontWeight="medium">
            {pkg.packageName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Purchased: {pkg.purchaseDate}
          </Typography>
        </Box>
        <Chip
          label={statusInfo.label}
          color={statusInfo.color}
          size="small"
          icon={statusInfo.icon || undefined}
        />
      </Box>

      <Box sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            Sessions Used
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            {sessionsUsed} / {totalSessions}
          </Typography>
        </Box>
        <Tooltip title={`${sessionsRemaining} sessions remaining`}>
          <LinearProgress
            variant="determinate"
            value={progressPercent}
            color={getProgressColor()}
            sx={{ height: 10, borderRadius: 5 }}
          />
        </Tooltip>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Sessions Remaining
        </Typography>
        <Typography
          variant="body2"
          fontWeight="medium"
          color={sessionsRemaining <= 2 ? 'warning.main' : 'text.primary'}
        >
          {sessionsRemaining}
        </Typography>
      </Box>

      {expiryDate && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Expires
          </Typography>
          <Typography
            variant="body2"
            fontWeight="medium"
            color={daysUntilExpiry !== null && daysUntilExpiry <= 7 ? 'warning.main' : 'text.primary'}
          >
            {pkg.expiryDate}
            {daysUntilExpiry !== null && daysUntilExpiry > 0 && (
              <Typography component="span" variant="body2" color="text.secondary">
                {' '}({daysUntilExpiry} days)
              </Typography>
            )}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default PackageProgress;
