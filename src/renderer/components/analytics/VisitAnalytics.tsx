import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  LinearProgress,
  Chip,
  useTheme,
} from '@mui/material';
import {
  CheckCircle as CompletedIcon,
  Schedule as ScheduledIcon,
  Cancel as CancelledIcon,
  EventBusy as NoShowIcon,
  PlayArrow as InProgressIcon,
} from '@mui/icons-material';

export interface VisitStats {
  total: number;
  completed: number;
  scheduled: number;
  inProgress: number;
  cancelled: number;
  noShow: number;
  byType: {
    type: string;
    count: number;
  }[];
  byDoctor: {
    doctorName: string;
    count: number;
    revenue: number;
  }[];
}

export interface VisitAnalyticsProps {
  stats: VisitStats;
  title?: string;
}

const StatusBar: React.FC<{
  label: string;
  count: number;
  total: number;
  color: string;
  icon: React.ReactNode;
}> = ({ label, count, total, color, icon }) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {icon}
          <Typography variant="body2">{label}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" fontWeight="bold">
            {count}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ({percentage.toFixed(1)}%)
          </Typography>
        </Box>
      </Box>
      <LinearProgress
        variant="determinate"
        value={percentage}
        sx={{
          height: 8,
          borderRadius: 4,
          bgcolor: 'grey.200',
          '& .MuiLinearProgress-bar': {
            bgcolor: color,
            borderRadius: 4,
          },
        }}
      />
    </Box>
  );
};

const VisitAnalytics: React.FC<VisitAnalyticsProps> = ({
  stats,
  title = 'Visit Analytics',
}) => {
  const theme = useTheme();

  const completionRate = useMemo(() => {
    const completed = stats.completed;
    const total = stats.total - stats.scheduled - stats.inProgress;
    return total > 0 ? (completed / total) * 100 : 0;
  }, [stats]);

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>

      <Grid container spacing={3}>
        {/* Visit Status Breakdown */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Status Breakdown
          </Typography>
          <Box sx={{ mt: 2 }}>
            <StatusBar
              label="Completed"
              count={stats.completed}
              total={stats.total}
              color={theme.palette.success.main}
              icon={<CompletedIcon sx={{ color: 'success.main', fontSize: 18 }} />}
            />
            <StatusBar
              label="Scheduled"
              count={stats.scheduled}
              total={stats.total}
              color={theme.palette.info.main}
              icon={<ScheduledIcon sx={{ color: 'info.main', fontSize: 18 }} />}
            />
            <StatusBar
              label="In Progress"
              count={stats.inProgress}
              total={stats.total}
              color={theme.palette.warning.main}
              icon={<InProgressIcon sx={{ color: 'warning.main', fontSize: 18 }} />}
            />
            <StatusBar
              label="Cancelled"
              count={stats.cancelled}
              total={stats.total}
              color={theme.palette.error.main}
              icon={<CancelledIcon sx={{ color: 'error.main', fontSize: 18 }} />}
            />
            <StatusBar
              label="No Show"
              count={stats.noShow}
              total={stats.total}
              color={theme.palette.grey[500]}
              icon={<NoShowIcon sx={{ color: 'grey.500', fontSize: 18 }} />}
            />
          </Box>
        </Grid>

        {/* Visit Types */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            By Visit Type
          </Typography>
          <Box sx={{ mt: 2 }}>
            {stats.byType.map((item) => {
              const percentage = stats.total > 0 ? (item.count / stats.total) * 100 : 0;
              return (
                <Box key={item.type} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">{item.type}</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {item.count} ({percentage.toFixed(1)}%)
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={percentage}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: 'primary.main',
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>
              );
            })}
          </Box>
        </Grid>

        {/* Key Metrics */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
            <Chip
              label={`Total Visits: ${stats.total}`}
              variant="outlined"
              color="primary"
            />
            <Chip
              label={`Completion Rate: ${completionRate.toFixed(1)}%`}
              variant="outlined"
              color={completionRate >= 80 ? 'success' : completionRate >= 60 ? 'warning' : 'error'}
            />
            <Chip
              label={`No-Show Rate: ${stats.total > 0 ? ((stats.noShow / stats.total) * 100).toFixed(1) : 0}%`}
              variant="outlined"
              color={stats.noShow / stats.total <= 0.1 ? 'success' : 'warning'}
            />
          </Box>
        </Grid>

        {/* Doctor Performance */}
        {stats.byDoctor.length > 0 && (
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
              By Doctor
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
              {stats.byDoctor.map((doc) => (
                <Paper
                  key={doc.doctorName}
                  variant="outlined"
                  sx={{ p: 2, minWidth: 150 }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {doc.doctorName}
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {doc.count} visits
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    Rs. {doc.revenue.toLocaleString()}
                  </Typography>
                </Paper>
              ))}
            </Box>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

export default VisitAnalytics;
