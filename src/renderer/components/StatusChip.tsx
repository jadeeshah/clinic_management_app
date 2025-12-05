import React from 'react';
import { Chip, ChipProps } from '@mui/material';

export type StatusType =
  // Visit statuses
  | 'Scheduled'
  | 'InProgress'
  | 'Completed'
  | 'Cancelled'
  | 'NoShow'
  // Invoice statuses
  | 'Unpaid'
  | 'PartiallyPaid'
  | 'Paid'
  | 'Void'
  // Package statuses
  | 'Active'
  | 'Expired'
  | 'Used';

export interface StatusChipProps {
  status: StatusType | string;
  size?: ChipProps['size'];
}

/**
 * Get the appropriate color for a status
 */
const getStatusColor = (status: string): ChipProps['color'] => {
  switch (status) {
    // Success states
    case 'Completed':
    case 'Paid':
    case 'Active':
      return 'success';

    // Warning states
    case 'InProgress':
    case 'PartiallyPaid':
      return 'warning';

    // Error/danger states
    case 'Cancelled':
    case 'NoShow':
    case 'Unpaid':
    case 'Expired':
      return 'error';

    // Info states
    case 'Scheduled':
      return 'info';

    // Default/neutral states
    case 'Void':
    case 'Used':
    default:
      return 'default';
  }
};

/**
 * Get human-readable label for a status
 */
const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    Scheduled: 'Scheduled',
    InProgress: 'In Progress',
    Completed: 'Completed',
    Cancelled: 'Cancelled',
    NoShow: 'No Show',
    Unpaid: 'Unpaid',
    PartiallyPaid: 'Partial',
    Paid: 'Paid',
    Void: 'Void',
    Active: 'Active',
    Expired: 'Expired',
    Used: 'Used',
  };
  return labels[status] || status;
};

/**
 * StatusChip component for consistent status display across the application
 * Automatically colors the chip based on status type
 */
const StatusChip: React.FC<StatusChipProps> = ({ status, size = 'small' }) => {
  return (
    <Chip
      label={getStatusLabel(status)}
      color={getStatusColor(status)}
      size={size}
      aria-label={`Status: ${getStatusLabel(status)}`}
    />
  );
};

export default StatusChip;
