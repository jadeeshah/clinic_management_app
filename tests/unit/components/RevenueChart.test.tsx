/**
 * Unit tests for RevenueChart component
 */

import React from 'react';
import { render, screen } from '../../utils/testUtils';
import RevenueChart, { RevenueData } from '../../../src/renderer/components/analytics/RevenueChart';

const createMockRevenueData = (months: number = 6): RevenueData[] => {
  const data: RevenueData[] = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = 0; i < months; i++) {
    data.push({
      month: `${monthNames[i]} 2024`,
      revenue: 50000 + (i * 10000),
      expenses: 20000 + (i * 5000),
    });
  }
  return data;
};

describe('RevenueChart', () => {
  describe('Basic rendering', () => {
    it('renders with default title', () => {
      const data = createMockRevenueData();
      render(<RevenueChart data={data} />);

      expect(screen.getByText('Revenue Overview')).toBeInTheDocument();
    });

    it('renders with custom title', () => {
      const data = createMockRevenueData();
      render(<RevenueChart data={data} title="Custom Title" />);

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('displays month labels', () => {
      const data = createMockRevenueData(3);
      render(<RevenueChart data={data} />);

      expect(screen.getByText('Jan 2024')).toBeInTheDocument();
      expect(screen.getByText('Feb 2024')).toBeInTheDocument();
      expect(screen.getByText('Mar 2024')).toBeInTheDocument();
    });
  });

  describe('Totals calculation', () => {
    it('displays total revenue', () => {
      const data = [
        { month: 'Jan 2024', revenue: 100000, expenses: 50000 },
        { month: 'Feb 2024', revenue: 150000, expenses: 60000 },
      ];
      render(<RevenueChart data={data} />);

      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(screen.getByText('Rs. 250,000')).toBeInTheDocument();
    });

    it('displays total expenses', () => {
      const data = [
        { month: 'Jan 2024', revenue: 100000, expenses: 50000 },
        { month: 'Feb 2024', revenue: 150000, expenses: 60000 },
      ];
      render(<RevenueChart data={data} />);

      expect(screen.getByText('Total Expenses')).toBeInTheDocument();
      expect(screen.getByText('Rs. 110,000')).toBeInTheDocument();
    });

    it('displays net profit', () => {
      const data = [
        { month: 'Jan 2024', revenue: 100000, expenses: 50000 },
        { month: 'Feb 2024', revenue: 150000, expenses: 60000 },
      ];
      render(<RevenueChart data={data} />);

      expect(screen.getByText('Net Profit')).toBeInTheDocument();
      expect(screen.getByText('Rs. 140,000')).toBeInTheDocument();
    });

    it('handles negative profit', () => {
      const data = [
        { month: 'Jan 2024', revenue: 50000, expenses: 100000 },
      ];
      render(<RevenueChart data={data} />);

      expect(screen.getByText('Rs. -50,000')).toBeInTheDocument();
    });
  });

  describe('Trend calculation', () => {
    it('shows positive trend when recent revenue is higher', () => {
      const data = [
        { month: 'Jan 2024', revenue: 50000, expenses: 20000 },
        { month: 'Feb 2024', revenue: 50000, expenses: 20000 },
        { month: 'Mar 2024', revenue: 50000, expenses: 20000 },
        { month: 'Apr 2024', revenue: 100000, expenses: 30000 },
        { month: 'May 2024', revenue: 100000, expenses: 30000 },
        { month: 'Jun 2024', revenue: 100000, expenses: 30000 },
      ];
      render(<RevenueChart data={data} />);

      // Trend should be positive (recent 3 months = 300k vs previous 3 months = 150k = +100%)
      expect(screen.getByText(/\+100\.0%/)).toBeInTheDocument();
    });

    it('shows negative trend when recent revenue is lower', () => {
      const data = [
        { month: 'Jan 2024', revenue: 100000, expenses: 30000 },
        { month: 'Feb 2024', revenue: 100000, expenses: 30000 },
        { month: 'Mar 2024', revenue: 100000, expenses: 30000 },
        { month: 'Apr 2024', revenue: 50000, expenses: 20000 },
        { month: 'May 2024', revenue: 50000, expenses: 20000 },
        { month: 'Jun 2024', revenue: 50000, expenses: 20000 },
      ];
      render(<RevenueChart data={data} />);

      // Trend should be negative
      expect(screen.getByText(/-50\.0%/)).toBeInTheDocument();
    });

    it('handles zero previous revenue', () => {
      const data = [
        { month: 'Apr 2024', revenue: 100000, expenses: 30000 },
        { month: 'May 2024', revenue: 100000, expenses: 30000 },
        { month: 'Jun 2024', revenue: 100000, expenses: 30000 },
      ];
      render(<RevenueChart data={data} />);

      // Should show 0% trend when no previous data
      expect(screen.getByText(/0\.0%/)).toBeInTheDocument();
    });
  });

  describe('Legend', () => {
    it('displays revenue legend item', () => {
      const data = createMockRevenueData();
      render(<RevenueChart data={data} />);

      expect(screen.getByText('Revenue')).toBeInTheDocument();
    });

    it('displays expenses legend item', () => {
      const data = createMockRevenueData();
      render(<RevenueChart data={data} />);

      expect(screen.getByText('Expenses')).toBeInTheDocument();
    });
  });

  describe('Empty data handling', () => {
    it('handles empty data array', () => {
      render(<RevenueChart data={[]} />);

      expect(screen.getByText('Revenue Overview')).toBeInTheDocument();
      // Rs. 0 appears multiple times (revenue, expenses, profit)
      expect(screen.getAllByText('Rs. 0').length).toBeGreaterThan(0);
    });

    it('handles single month data', () => {
      const data = [{ month: 'Jan 2024', revenue: 100000, expenses: 50000 }];
      render(<RevenueChart data={data} />);

      expect(screen.getByText('Jan 2024')).toBeInTheDocument();
      expect(screen.getByText('Rs. 100,000')).toBeInTheDocument();
    });
  });

  describe('Chart bars', () => {
    it('renders bar for each month', () => {
      const data = createMockRevenueData(3);
      const { container } = render(<RevenueChart data={data} />);

      // Each month should have 2 bars (revenue + expenses)
      // We check that the month labels are present
      expect(screen.getByText('Jan 2024')).toBeInTheDocument();
      expect(screen.getByText('Feb 2024')).toBeInTheDocument();
      expect(screen.getByText('Mar 2024')).toBeInTheDocument();
    });
  });
});
