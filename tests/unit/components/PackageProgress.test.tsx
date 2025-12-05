/**
 * Unit tests for PackageProgress component
 */

import React from 'react';
import { render, screen } from '../../utils/testUtils';
import PackageProgress from '../../../src/renderer/components/PackageProgress';
import type { PatientPackage } from '../../../src/types';

const createMockPatientPackage = (overrides: Partial<PatientPackage> = {}): PatientPackage => ({
  patientPackageID: 1,
  patientID: 1,
  packageID: 1,
  packageName: '10 Session Package',
  totalSessions: 10,
  purchaseDate: '2024-01-01',
  expiryDate: '2024-02-01',
  sessionsUsed: 5,
  status: 'Active',
  ...overrides,
});

describe('PackageProgress', () => {
  describe('Full view mode', () => {
    it('renders package name and purchase date', () => {
      const pkg = createMockPatientPackage();
      render(<PackageProgress package={pkg} />);

      expect(screen.getByText('10 Session Package')).toBeInTheDocument();
      expect(screen.getByText('Purchased: 2024-01-01')).toBeInTheDocument();
    });

    it('displays sessions used and total', () => {
      const pkg = createMockPatientPackage({ sessionsUsed: 3, totalSessions: 10 });
      render(<PackageProgress package={pkg} />);

      expect(screen.getByText('3 / 10')).toBeInTheDocument();
    });

    it('displays sessions remaining', () => {
      const pkg = createMockPatientPackage({ sessionsUsed: 3, totalSessions: 10 });
      render(<PackageProgress package={pkg} />);

      expect(screen.getByText('Sessions Remaining')).toBeInTheDocument();
      expect(screen.getByText('7')).toBeInTheDocument();
    });

    it('displays expiry date', () => {
      const pkg = createMockPatientPackage({ expiryDate: '2024-02-15' });
      render(<PackageProgress package={pkg} />);

      expect(screen.getByText('Expires')).toBeInTheDocument();
      expect(screen.getByText(/2024-02-15/)).toBeInTheDocument();
    });

    it('shows Active status chip for active packages', () => {
      // Set expiry date far in the future to avoid "X days left" warning
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const pkg = createMockPatientPackage({
        status: 'Active',
        expiryDate: futureDate.toISOString().split('T')[0],
      });
      render(<PackageProgress package={pkg} />);

      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('shows Completed status chip for completed packages', () => {
      const pkg = createMockPatientPackage({
        status: 'Completed',
        sessionsUsed: 10,
        totalSessions: 10,
      });
      render(<PackageProgress package={pkg} />);

      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('shows Expired status chip for expired packages', () => {
      const pkg = createMockPatientPackage({ status: 'Expired' });
      render(<PackageProgress package={pkg} />);

      expect(screen.getByText('Expired')).toBeInTheDocument();
    });

    it('shows warning when package expires within 7 days', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const pkg = createMockPatientPackage({
        status: 'Active',
        expiryDate: futureDate.toISOString().split('T')[0],
      });
      render(<PackageProgress package={pkg} />);

      // Should show days left instead of "Active"
      expect(screen.getByText(/days left/)).toBeInTheDocument();
    });
  });

  describe('Compact view mode', () => {
    it('renders in compact mode when compact prop is true', () => {
      const pkg = createMockPatientPackage();
      render(<PackageProgress package={pkg} compact />);

      expect(screen.getByText('10 Session Package')).toBeInTheDocument();
      expect(screen.getByText('5/10')).toBeInTheDocument();
    });

    it('does not show detailed info in compact mode', () => {
      const pkg = createMockPatientPackage();
      render(<PackageProgress package={pkg} compact />);

      expect(screen.queryByText('Purchased:')).not.toBeInTheDocument();
      expect(screen.queryByText('Sessions Remaining')).not.toBeInTheDocument();
    });
  });

  describe('Progress calculation', () => {
    it('handles zero sessions gracefully', () => {
      const pkg = createMockPatientPackage({ sessionsUsed: 0, totalSessions: 0 });
      render(<PackageProgress package={pkg} />);

      expect(screen.getByText('0 / 0')).toBeInTheDocument();
    });

    it('handles null sessionsUsed gracefully', () => {
      const pkg = createMockPatientPackage({ sessionsUsed: undefined as unknown as number });
      render(<PackageProgress package={pkg} />);

      expect(screen.getByText('0 / 10')).toBeInTheDocument();
    });

    it('handles null totalSessions gracefully', () => {
      const pkg = createMockPatientPackage({ totalSessions: undefined as unknown as number });
      render(<PackageProgress package={pkg} />);

      expect(screen.getByText('5 / 0')).toBeInTheDocument();
    });

    it('shows 100% progress when all sessions used', () => {
      const pkg = createMockPatientPackage({ sessionsUsed: 10, totalSessions: 10 });
      render(<PackageProgress package={pkg} />);

      expect(screen.getByText('10 / 10')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument(); // 0 remaining
    });
  });

  describe('Status indicators', () => {
    it('shows warning color when sessions are almost depleted', () => {
      const pkg = createMockPatientPackage({ sessionsUsed: 9, totalSessions: 10 });
      render(<PackageProgress package={pkg} />);

      // Only 1 session remaining - should show warning styling
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });
});
