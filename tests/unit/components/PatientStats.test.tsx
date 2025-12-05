/**
 * Unit tests for PatientStats component
 */

import React from 'react';
import { render, screen } from '../../utils/testUtils';
import PatientStats, { PatientStatsData } from '../../../src/renderer/components/analytics/PatientStats';

const createMockPatientStats = (overrides: Partial<PatientStatsData> = {}): PatientStatsData => ({
  totalPatients: 500,
  newThisMonth: 25,
  newLastMonth: 20,
  activePatients: 150,
  returningPatients: 300,
  ...overrides,
});

describe('PatientStats', () => {
  describe('Basic rendering', () => {
    it('renders with default title', () => {
      const stats = createMockPatientStats();
      render(<PatientStats stats={stats} />);

      expect(screen.getByText('Patient Statistics')).toBeInTheDocument();
    });

    it('renders with custom title', () => {
      const stats = createMockPatientStats();
      render(<PatientStats stats={stats} title="Custom Patient Stats" />);

      expect(screen.getByText('Custom Patient Stats')).toBeInTheDocument();
    });
  });

  describe('Total patients', () => {
    it('displays total patients count', () => {
      const stats = createMockPatientStats({ totalPatients: 500 });
      render(<PatientStats stats={stats} />);

      expect(screen.getByText('Total Patients')).toBeInTheDocument();
      expect(screen.getByText('500')).toBeInTheDocument();
    });

    it('handles zero total patients', () => {
      const stats = createMockPatientStats({ totalPatients: 0 });
      render(<PatientStats stats={stats} />);

      expect(screen.getByText('Total Patients')).toBeInTheDocument();
      expect(screen.getAllByText('0')[0]).toBeInTheDocument();
    });
  });

  describe('New patients this month', () => {
    it('displays new patients this month', () => {
      const stats = createMockPatientStats({ newThisMonth: 25 });
      render(<PatientStats stats={stats} />);

      expect(screen.getByText('New This Month')).toBeInTheDocument();
      // 25 appears in multiple places (new this month card and monthly comparison)
      expect(screen.getAllByText('25')[0]).toBeInTheDocument();
    });

    it('displays comparison with last month', () => {
      const stats = createMockPatientStats({ newThisMonth: 25, newLastMonth: 20 });
      render(<PatientStats stats={stats} />);

      expect(screen.getByText('vs 20 last month')).toBeInTheDocument();
    });
  });

  describe('Growth rate calculation', () => {
    it('calculates positive growth rate', () => {
      const stats = createMockPatientStats({ newThisMonth: 30, newLastMonth: 20 });
      render(<PatientStats stats={stats} />);

      expect(screen.getByText('Growth Rate')).toBeInTheDocument();
      expect(screen.getByText('+50.0%')).toBeInTheDocument();
    });

    it('calculates negative growth rate', () => {
      const stats = createMockPatientStats({ newThisMonth: 10, newLastMonth: 20 });
      render(<PatientStats stats={stats} />);

      expect(screen.getByText('-50.0%')).toBeInTheDocument();
    });

    it('handles zero last month (100% growth)', () => {
      const stats = createMockPatientStats({ newThisMonth: 20, newLastMonth: 0 });
      render(<PatientStats stats={stats} />);

      expect(screen.getByText('+100.0%')).toBeInTheDocument();
    });

    it('handles zero both months (0% growth)', () => {
      const stats = createMockPatientStats({ newThisMonth: 0, newLastMonth: 0 });
      render(<PatientStats stats={stats} />);

      expect(screen.getByText('+0.0%')).toBeInTheDocument();
    });

    it('displays month over month subtitle', () => {
      const stats = createMockPatientStats();
      render(<PatientStats stats={stats} />);

      expect(screen.getByText('month over month')).toBeInTheDocument();
    });
  });

  describe('Returning patients', () => {
    it('displays returning patients percentage', () => {
      const stats = createMockPatientStats({ totalPatients: 500, returningPatients: 300 });
      render(<PatientStats stats={stats} />);

      expect(screen.getByText('Returning Patients')).toBeInTheDocument();
      expect(screen.getByText('60%')).toBeInTheDocument();
      expect(screen.getByText('300 patients')).toBeInTheDocument();
    });

    it('handles zero total patients for retention rate', () => {
      const stats = createMockPatientStats({ totalPatients: 0, returningPatients: 0 });
      render(<PatientStats stats={stats} />);

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('calculates 100% retention rate', () => {
      const stats = createMockPatientStats({ totalPatients: 100, returningPatients: 100 });
      render(<PatientStats stats={stats} />);

      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('Monthly comparison chart', () => {
    it('displays monthly comparison section', () => {
      const stats = createMockPatientStats();
      render(<PatientStats stats={stats} />);

      expect(screen.getByText('Monthly Comparison')).toBeInTheDocument();
    });

    it('displays last month label and value', () => {
      const stats = createMockPatientStats({ newLastMonth: 20 });
      render(<PatientStats stats={stats} />);

      expect(screen.getByText('Last Month')).toBeInTheDocument();
      expect(screen.getAllByText('20')[0]).toBeInTheDocument();
    });

    it('displays this month label and value', () => {
      const stats = createMockPatientStats({ newThisMonth: 25 });
      render(<PatientStats stats={stats} />);

      expect(screen.getByText('This Month')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('handles all zeros', () => {
      const stats = createMockPatientStats({
        totalPatients: 0,
        newThisMonth: 0,
        newLastMonth: 0,
        activePatients: 0,
        returningPatients: 0,
      });
      render(<PatientStats stats={stats} />);

      expect(screen.getByText('Patient Statistics')).toBeInTheDocument();
      expect(screen.getByText('Total Patients')).toBeInTheDocument();
    });

    it('handles large numbers', () => {
      const stats = createMockPatientStats({
        totalPatients: 10000,
        newThisMonth: 500,
        newLastMonth: 400,
        returningPatients: 8000,
      });
      render(<PatientStats stats={stats} />);

      expect(screen.getByText('10000')).toBeInTheDocument();
    });

    it('handles decimal growth rates correctly', () => {
      const stats = createMockPatientStats({ newThisMonth: 33, newLastMonth: 30 });
      render(<PatientStats stats={stats} />);

      // 33/30 - 1 = 0.1 = 10%
      expect(screen.getByText('+10.0%')).toBeInTheDocument();
    });
  });
});
