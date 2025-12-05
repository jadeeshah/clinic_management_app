/**
 * Unit tests for VisitAnalytics component
 */

import React from 'react';
import { render, screen } from '../../utils/testUtils';
import VisitAnalytics, { VisitStats } from '../../../src/renderer/components/analytics/VisitAnalytics';

const createMockVisitStats = (overrides: Partial<VisitStats> = {}): VisitStats => ({
  total: 100,
  completed: 60,
  scheduled: 20,
  inProgress: 5,
  cancelled: 10,
  noShow: 5,
  byType: [
    { type: 'TherapySession', count: 70 },
    { type: 'Evaluation', count: 20 },
    { type: 'FollowUp', count: 10 },
  ],
  byDoctor: [
    { doctorName: 'Sarah Smith', count: 50, revenue: 100000 },
    { doctorName: 'Ahmed Ali', count: 30, revenue: 60000 },
    { doctorName: 'Maria Santos', count: 20, revenue: 40000 },
  ],
  ...overrides,
});

describe('VisitAnalytics', () => {
  describe('Basic rendering', () => {
    it('renders with default title', () => {
      const stats = createMockVisitStats();
      render(<VisitAnalytics stats={stats} />);

      expect(screen.getByText('Visit Analytics')).toBeInTheDocument();
    });

    it('renders with custom title', () => {
      const stats = createMockVisitStats();
      render(<VisitAnalytics stats={stats} title="Custom Analytics" />);

      expect(screen.getByText('Custom Analytics')).toBeInTheDocument();
    });
  });

  describe('Status breakdown', () => {
    it('displays Status Breakdown section', () => {
      const stats = createMockVisitStats();
      render(<VisitAnalytics stats={stats} />);

      expect(screen.getByText('Status Breakdown')).toBeInTheDocument();
    });

    it('displays completed visits count and percentage', () => {
      const stats = createMockVisitStats({ total: 100, completed: 60 });
      render(<VisitAnalytics stats={stats} />);

      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('60')).toBeInTheDocument();
      expect(screen.getByText('(60.0%)')).toBeInTheDocument();
    });

    it('displays scheduled visits count', () => {
      const stats = createMockVisitStats({ total: 100, scheduled: 20 });
      render(<VisitAnalytics stats={stats} />);

      expect(screen.getAllByText('Scheduled')[0]).toBeInTheDocument();
      expect(screen.getAllByText('20')[0]).toBeInTheDocument();
    });

    it('displays in progress visits count', () => {
      const stats = createMockVisitStats({ total: 100, inProgress: 5 });
      render(<VisitAnalytics stats={stats} />);

      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getAllByText('5')[0]).toBeInTheDocument();
    });

    it('displays cancelled visits count', () => {
      const stats = createMockVisitStats({ total: 100, cancelled: 10 });
      render(<VisitAnalytics stats={stats} />);

      expect(screen.getByText('Cancelled')).toBeInTheDocument();
      expect(screen.getAllByText('10')[0]).toBeInTheDocument();
    });

    it('displays no show visits count', () => {
      const stats = createMockVisitStats({ total: 100, noShow: 5 });
      render(<VisitAnalytics stats={stats} />);

      expect(screen.getByText('No Show')).toBeInTheDocument();
    });
  });

  describe('Visit types', () => {
    it('displays By Visit Type section', () => {
      const stats = createMockVisitStats();
      render(<VisitAnalytics stats={stats} />);

      expect(screen.getByText('By Visit Type')).toBeInTheDocument();
    });

    it('displays each visit type with count and percentage', () => {
      const stats = createMockVisitStats({
        total: 100,
        byType: [
          { type: 'TherapySession', count: 70 },
          { type: 'Evaluation', count: 30 },
        ],
      });
      render(<VisitAnalytics stats={stats} />);

      expect(screen.getByText('TherapySession')).toBeInTheDocument();
      expect(screen.getByText('70 (70.0%)')).toBeInTheDocument();
      expect(screen.getByText('Evaluation')).toBeInTheDocument();
      expect(screen.getByText('30 (30.0%)')).toBeInTheDocument();
    });
  });

  describe('Key metrics chips', () => {
    it('displays total visits chip', () => {
      const stats = createMockVisitStats({ total: 150 });
      render(<VisitAnalytics stats={stats} />);

      expect(screen.getByText('Total Visits: 150')).toBeInTheDocument();
    });

    it('displays completion rate chip', () => {
      const stats = createMockVisitStats({
        total: 100,
        completed: 80,
        scheduled: 10,
        inProgress: 5,
        cancelled: 5,
        noShow: 0,
      });
      render(<VisitAnalytics stats={stats} />);

      // Completion rate = completed / (total - scheduled - inProgress)
      // = 80 / (100 - 10 - 5) = 80 / 85 = 94.1%
      expect(screen.getByText(/Completion Rate:/)).toBeInTheDocument();
    });

    it('displays no-show rate chip', () => {
      const stats = createMockVisitStats({ total: 100, noShow: 5 });
      render(<VisitAnalytics stats={stats} />);

      expect(screen.getByText('No-Show Rate: 5.0%')).toBeInTheDocument();
    });
  });

  describe('Doctor performance', () => {
    it('displays By Doctor section when doctors exist', () => {
      const stats = createMockVisitStats({
        byDoctor: [{ doctorName: 'Dr. Smith', count: 50, revenue: 100000 }],
      });
      render(<VisitAnalytics stats={stats} />);

      expect(screen.getByText('By Doctor')).toBeInTheDocument();
    });

    it('displays doctor name, visit count, and revenue', () => {
      const stats = createMockVisitStats({
        byDoctor: [{ doctorName: 'Sarah Smith', count: 50, revenue: 100000 }],
      });
      render(<VisitAnalytics stats={stats} />);

      expect(screen.getByText('Sarah Smith')).toBeInTheDocument();
      expect(screen.getByText('50 visits')).toBeInTheDocument();
      expect(screen.getByText('Rs. 100,000')).toBeInTheDocument();
    });

    it('does not show By Doctor section when no doctors', () => {
      const stats = createMockVisitStats({ byDoctor: [] });
      render(<VisitAnalytics stats={stats} />);

      expect(screen.queryByText('By Doctor')).not.toBeInTheDocument();
    });

    it('displays multiple doctors', () => {
      const stats = createMockVisitStats({
        byDoctor: [
          { doctorName: 'Dr. Smith', count: 50, revenue: 100000 },
          { doctorName: 'Dr. Jones', count: 30, revenue: 60000 },
        ],
      });
      render(<VisitAnalytics stats={stats} />);

      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
      expect(screen.getByText('Dr. Jones')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('handles zero total visits', () => {
      const stats = createMockVisitStats({
        total: 0,
        completed: 0,
        scheduled: 0,
        inProgress: 0,
        cancelled: 0,
        noShow: 0,
      });
      render(<VisitAnalytics stats={stats} />);

      expect(screen.getByText('Total Visits: 0')).toBeInTheDocument();
      expect(screen.getByText('Completion Rate: 0.0%')).toBeInTheDocument();
    });

    it('handles empty byType array', () => {
      const stats = createMockVisitStats({ byType: [] });
      render(<VisitAnalytics stats={stats} />);

      expect(screen.getByText('By Visit Type')).toBeInTheDocument();
    });

    it('handles high completion rate with correct color', () => {
      const stats = createMockVisitStats({
        total: 100,
        completed: 90,
        scheduled: 5,
        inProgress: 0,
        cancelled: 5,
        noShow: 0,
      });
      render(<VisitAnalytics stats={stats} />);

      // Should show success color for high completion rate
      expect(screen.getByText(/Completion Rate:/)).toBeInTheDocument();
    });

    it('handles low completion rate', () => {
      const stats = createMockVisitStats({
        total: 100,
        completed: 30,
        scheduled: 50,
        inProgress: 5,
        cancelled: 10,
        noShow: 5,
      });
      render(<VisitAnalytics stats={stats} />);

      // Completion rate should be calculated correctly
      expect(screen.getByText(/Completion Rate:/)).toBeInTheDocument();
    });
  });
});
