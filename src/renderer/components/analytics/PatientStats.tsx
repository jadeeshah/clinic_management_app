import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Avatar,
  useTheme,
} from '@mui/material';
import {
  PersonAdd as NewPatientIcon,
  Person as PatientIcon,
  TrendingUp as GrowthIcon,
  Repeat as ReturningIcon,
} from '@mui/icons-material';

export interface PatientStatsData {
  totalPatients: number;
  newThisMonth: number;
  newLastMonth: number;
  activePatients: number; // Patients with visits in last 30 days
  returningPatients: number; // Patients with more than 1 visit
}

export interface PatientStatsProps {
  stats: PatientStatsData;
  title?: string;
}

const StatBox: React.FC<{
  label: string;
  value: number | string;
  sublabel?: string;
  icon: React.ReactNode;
  color: string;
}> = ({ label, value, sublabel, icon, color }) => (
  <Paper
    sx={{
      p: 2,
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      height: '100%',
    }}
    variant="outlined"
  >
    <Avatar
      sx={{
        bgcolor: color,
        width: 48,
        height: 48,
      }}
    >
      {icon}
    </Avatar>
    <Box>
      <Typography variant="h5" fontWeight="bold">
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      {sublabel && (
        <Typography variant="caption" color="text.secondary">
          {sublabel}
        </Typography>
      )}
    </Box>
  </Paper>
);

const PatientStats: React.FC<PatientStatsProps> = ({
  stats,
  title = 'Patient Statistics',
}) => {
  const theme = useTheme();

  // Calculate growth rate
  const growthRate = stats.newLastMonth > 0
    ? ((stats.newThisMonth - stats.newLastMonth) / stats.newLastMonth) * 100
    : stats.newThisMonth > 0 ? 100 : 0;

  // Calculate retention rate
  const retentionRate = stats.totalPatients > 0
    ? (stats.returningPatients / stats.totalPatients) * 100
    : 0;

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={6} md={3}>
          <StatBox
            label="Total Patients"
            value={stats.totalPatients}
            icon={<PatientIcon />}
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatBox
            label="New This Month"
            value={stats.newThisMonth}
            sublabel={`vs ${stats.newLastMonth} last month`}
            icon={<NewPatientIcon />}
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatBox
            label="Growth Rate"
            value={`${growthRate >= 0 ? '+' : ''}${growthRate.toFixed(1)}%`}
            sublabel="month over month"
            icon={<GrowthIcon />}
            color={growthRate >= 0 ? theme.palette.success.main : theme.palette.error.main}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatBox
            label="Returning Patients"
            value={`${retentionRate.toFixed(0)}%`}
            sublabel={`${stats.returningPatients} patients`}
            icon={<ReturningIcon />}
            color={theme.palette.info.main}
          />
        </Grid>
      </Grid>

      {/* Mini Growth Chart */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Monthly Comparison
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 60 }}>
          <Box sx={{ flex: 1, textAlign: 'center' }}>
            <Box
              sx={{
                height: stats.newLastMonth > stats.newThisMonth
                  ? 50
                  : (stats.newLastMonth / Math.max(stats.newThisMonth, 1)) * 50,
                bgcolor: 'grey.300',
                borderRadius: '4px 4px 0 0',
                minHeight: 4,
                mx: 'auto',
                width: '60%',
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              Last Month
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {stats.newLastMonth}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, textAlign: 'center' }}>
            <Box
              sx={{
                height: stats.newThisMonth > stats.newLastMonth
                  ? 50
                  : (stats.newThisMonth / Math.max(stats.newLastMonth, 1)) * 50,
                bgcolor: 'primary.main',
                borderRadius: '4px 4px 0 0',
                minHeight: 4,
                mx: 'auto',
                width: '60%',
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              This Month
            </Typography>
            <Typography variant="body2" fontWeight="bold" color="primary">
              {stats.newThisMonth}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default PatientStats;
