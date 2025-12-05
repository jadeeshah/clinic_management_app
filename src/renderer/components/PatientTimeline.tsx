import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Avatar,
  useTheme,
} from '@mui/material';
import {
  EventNote as VisitIcon,
  Receipt as InvoiceIcon,
  AttachFile as FileIcon,
  CardGiftcard as PackageIcon,
  CheckCircle as CompletedIcon,
  Schedule as ScheduledIcon,
  PlayArrow as InProgressIcon,
  Cancel as CancelledIcon,
  EventBusy as NoShowIcon,
} from '@mui/icons-material';
import type { Visit, Invoice, Attachment, PatientPackage } from '../../types';

// Timeline event types
type TimelineEventType = 'visit' | 'invoice' | 'file' | 'package';

interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  date: string;
  title: string;
  subtitle?: string;
  status?: string;
  statusColor?: 'success' | 'warning' | 'error' | 'info' | 'default';
  amount?: number;
  data: Visit | Invoice | Attachment | PatientPackage;
}

export interface PatientTimelineProps {
  visits: Visit[];
  invoices: Invoice[];
  attachments: Attachment[];
  packages: PatientPackage[];
  onVisitClick?: (visit: Visit) => void;
  onInvoiceClick?: (invoice: Invoice) => void;
  maxItems?: number;
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatTime = (timeStr: string): string => {
  const [hours, minutes] = timeStr.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

const getVisitStatusColor = (status: string): 'success' | 'warning' | 'error' | 'info' | 'default' => {
  switch (status) {
    case 'Completed':
      return 'success';
    case 'InProgress':
      return 'warning';
    case 'Scheduled':
      return 'info';
    case 'Cancelled':
      return 'error';
    case 'NoShow':
      return 'warning';
    default:
      return 'default';
  }
};

const getVisitStatusIcon = (status: string): React.ReactNode => {
  switch (status) {
    case 'Completed':
      return <CompletedIcon fontSize="small" />;
    case 'InProgress':
      return <InProgressIcon fontSize="small" />;
    case 'Scheduled':
      return <ScheduledIcon fontSize="small" />;
    case 'Cancelled':
      return <CancelledIcon fontSize="small" />;
    case 'NoShow':
      return <NoShowIcon fontSize="small" />;
    default:
      return <ScheduledIcon fontSize="small" />;
  }
};

const getInvoiceStatusColor = (status: string): 'success' | 'warning' | 'error' | 'info' | 'default' => {
  switch (status) {
    case 'Paid':
      return 'success';
    case 'PartiallyPaid':
      return 'warning';
    case 'Unpaid':
      return 'error';
    case 'Void':
      return 'default';
    default:
      return 'default';
  }
};

const PatientTimeline: React.FC<PatientTimelineProps> = ({
  visits,
  invoices,
  attachments,
  packages,
  onVisitClick,
  onInvoiceClick,
  maxItems = 50,
}) => {
  const theme = useTheme();

  // Combine all events into a single timeline
  const timelineEvents = useMemo(() => {
    const events: TimelineEvent[] = [];

    // Add visits
    visits.forEach((visit) => {
      events.push({
        id: `visit-${visit.visitID}`,
        type: 'visit',
        date: visit.visitDate,
        title: `${visit.visitType} with Dr. ${visit.doctorName || 'Unknown'}`,
        subtitle: formatTime(visit.startTime),
        status: visit.status,
        statusColor: getVisitStatusColor(visit.status),
        data: visit,
      });
    });

    // Add invoices
    invoices.forEach((invoice) => {
      events.push({
        id: `invoice-${invoice.invoiceID}`,
        type: 'invoice',
        date: invoice.invoiceDate,
        title: `Invoice ${invoice.invoiceNo}`,
        subtitle: invoice.doctorName ? `Dr. ${invoice.doctorName}` : undefined,
        status: invoice.status,
        statusColor: getInvoiceStatusColor(invoice.status),
        amount: invoice.total,
        data: invoice,
      });
    });

    // Add attachments
    attachments.forEach((attachment) => {
      events.push({
        id: `file-${attachment.attachmentID}`,
        type: 'file',
        date: attachment.uploadedAt.split('T')[0],
        title: attachment.fileName,
        subtitle: attachment.fileType || 'File',
        data: attachment,
      });
    });

    // Add packages
    packages.forEach((pkg) => {
      events.push({
        id: `package-${pkg.patientPackageID}`,
        type: 'package',
        date: pkg.purchaseDate,
        title: `Purchased: ${pkg.packageName || 'Package'}`,
        subtitle: `${pkg.sessionsUsed || 0}/${pkg.totalSessions || 0} sessions used`,
        status: pkg.status,
        statusColor: pkg.status === 'Active' ? 'success' : pkg.status === 'Completed' ? 'info' : 'error',
        data: pkg,
      });
    });

    // Sort by date (most recent first)
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return events.slice(0, maxItems);
  }, [visits, invoices, attachments, packages, maxItems]);

  const getEventIcon = (type: TimelineEventType) => {
    switch (type) {
      case 'visit':
        return <VisitIcon />;
      case 'invoice':
        return <InvoiceIcon />;
      case 'file':
        return <FileIcon />;
      case 'package':
        return <PackageIcon />;
      default:
        return <VisitIcon />;
    }
  };

  const getEventColor = (type: TimelineEventType): string => {
    switch (type) {
      case 'visit':
        return theme.palette.primary.main;
      case 'invoice':
        return theme.palette.success.main;
      case 'file':
        return theme.palette.info.main;
      case 'package':
        return theme.palette.secondary.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const handleEventClick = (event: TimelineEvent) => {
    if (event.type === 'visit' && onVisitClick) {
      onVisitClick(event.data as Visit);
    } else if (event.type === 'invoice' && onInvoiceClick) {
      onInvoiceClick(event.data as Invoice);
    }
  };

  if (timelineEvents.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="text.secondary">
          No activity recorded yet
        </Typography>
      </Box>
    );
  }

  // Group events by date for better display
  const groupedEvents = useMemo(() => {
    const groups: { [key: string]: TimelineEvent[] } = {};
    timelineEvents.forEach((event) => {
      const dateKey = event.date;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(event);
    });
    return groups;
  }, [timelineEvents]);

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Timeline line */}
      <Box
        sx={{
          position: 'absolute',
          left: 20,
          top: 0,
          bottom: 0,
          width: 2,
          bgcolor: 'divider',
          zIndex: 0,
        }}
      />

      {Object.entries(groupedEvents).map(([dateKey, events]) => (
        <Box key={dateKey} sx={{ mb: 2 }}>
          {/* Date header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, ml: 5 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 'medium',
                color: 'text.secondary',
                bgcolor: 'background.paper',
                px: 1,
              }}
            >
              {formatDate(dateKey)}
            </Typography>
          </Box>

          {/* Events for this date */}
          {events.map((event, index) => (
            <Box
              key={event.id}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                mb: index < events.length - 1 ? 1.5 : 0,
                cursor: (event.type === 'visit' && onVisitClick) || (event.type === 'invoice' && onInvoiceClick) ? 'pointer' : 'default',
              }}
              onClick={() => handleEventClick(event)}
            >
              {/* Event icon */}
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: getEventColor(event.type),
                  zIndex: 1,
                }}
              >
                {getEventIcon(event.type)}
              </Avatar>

              {/* Event content */}
              <Paper
                sx={{
                  ml: 2,
                  p: 1.5,
                  flex: 1,
                  transition: 'box-shadow 0.2s',
                  '&:hover': {
                    boxShadow: (event.type === 'visit' && onVisitClick) || (event.type === 'invoice' && onInvoiceClick) ? 3 : 1,
                  },
                }}
                elevation={1}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight="medium">
                      {event.title}
                    </Typography>
                    {event.subtitle && (
                      <Typography variant="caption" color="text.secondary">
                        {event.subtitle}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
                    {event.amount !== undefined && (
                      <Typography variant="body2" fontWeight="medium" color="success.main">
                        Rs. {event.amount.toLocaleString()}
                      </Typography>
                    )}
                    {event.status && (
                      <Chip
                        label={event.status}
                        size="small"
                        color={event.statusColor}
                        icon={event.type === 'visit' ? getVisitStatusIcon(event.status) as React.ReactElement : undefined}
                        sx={{ height: 24 }}
                      />
                    )}
                  </Box>
                </Box>
              </Paper>
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
};

export default PatientTimeline;
