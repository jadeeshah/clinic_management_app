import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  useTheme,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';

export interface RevenueData {
  month: string;
  revenue: number;
  expenses: number;
}

export interface RevenueChartProps {
  data: RevenueData[];
  title?: string;
}

const RevenueChart: React.FC<RevenueChartProps> = ({
  data,
  title = 'Revenue Overview',
}) => {
  const theme = useTheme();

  const { maxValue, totalRevenue, totalExpenses, profit, trend } = useMemo(() => {
    const revenues = data.map((d) => d.revenue);
    const expenses = data.map((d) => d.expenses);
    const maxRev = Math.max(...revenues, 1);
    const maxExp = Math.max(...expenses, 1);

    const totalRev = revenues.reduce((a, b) => a + b, 0);
    const totalExp = expenses.reduce((a, b) => a + b, 0);

    // Calculate trend (compare last 3 months to previous 3 months)
    const recentRevenue = revenues.slice(-3).reduce((a, b) => a + b, 0);
    const previousRevenue = revenues.slice(-6, -3).reduce((a, b) => a + b, 0);
    const trendPercent = previousRevenue > 0
      ? ((recentRevenue - previousRevenue) / previousRevenue) * 100
      : 0;

    return {
      maxValue: Math.max(maxRev, maxExp),
      totalRevenue: totalRev,
      totalExpenses: totalExp,
      profit: totalRev - totalExp,
      trend: trendPercent,
    };
  }, [data]);

  const getBarHeight = (value: number): number => {
    return (value / maxValue) * 100;
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Total Revenue
              </Typography>
              <Typography variant="h5" color="success.main" fontWeight="bold">
                Rs. {totalRevenue.toLocaleString()}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Total Expenses
              </Typography>
              <Typography variant="h5" color="error.main" fontWeight="bold">
                Rs. {totalExpenses.toLocaleString()}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Net Profit
              </Typography>
              <Typography
                variant="h5"
                color={profit >= 0 ? 'primary.main' : 'error.main'}
                fontWeight="bold"
              >
                Rs. {profit.toLocaleString()}
              </Typography>
            </Box>
          </Box>
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
            bgcolor: trend >= 0 ? 'success.50' : 'error.50',
          }}
        >
          {trend >= 0 ? (
            <TrendingUpIcon sx={{ color: 'success.main' }} />
          ) : (
            <TrendingDownIcon sx={{ color: 'error.main' }} />
          )}
          <Typography
            variant="body2"
            fontWeight="bold"
            color={trend >= 0 ? 'success.main' : 'error.main'}
          >
            {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
          </Typography>
        </Box>
      </Box>

      {/* Bar Chart */}
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 200 }}>
        {data.map((item, index) => (
          <Box
            key={index}
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              height: '100%',
            }}
          >
            <Box
              sx={{
                flex: 1,
                width: '100%',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                gap: 0.5,
              }}
            >
              {/* Revenue Bar */}
              <Box
                sx={{
                  width: '40%',
                  height: `${getBarHeight(item.revenue)}%`,
                  bgcolor: 'success.main',
                  borderRadius: '4px 4px 0 0',
                  minHeight: 4,
                  transition: 'height 0.3s ease',
                  '&:hover': {
                    opacity: 0.8,
                  },
                }}
                title={`Revenue: Rs. ${item.revenue.toLocaleString()}`}
              />
              {/* Expenses Bar */}
              <Box
                sx={{
                  width: '40%',
                  height: `${getBarHeight(item.expenses)}%`,
                  bgcolor: 'error.light',
                  borderRadius: '4px 4px 0 0',
                  minHeight: 4,
                  transition: 'height 0.3s ease',
                  '&:hover': {
                    opacity: 0.8,
                  },
                }}
                title={`Expenses: Rs. ${item.expenses.toLocaleString()}`}
              />
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 1, fontSize: 10 }}
            >
              {item.month}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Legend */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 12, height: 12, bgcolor: 'success.main', borderRadius: 0.5 }} />
          <Typography variant="caption" color="text.secondary">Revenue</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 12, height: 12, bgcolor: 'error.light', borderRadius: 0.5 }} />
          <Typography variant="caption" color="text.secondary">Expenses</Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default RevenueChart;
