/**
 * Package Workflow Integration Tests
 * Tests the package management flow including:
 * - Viewing packages list
 * - Creating new packages
 * - Editing packages
 */

import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, createMockPackage, createMockService } from '../utils/testUtils';
import Services from '../../src/renderer/pages/Services';
import { mockElectronAPI } from '../setupTests';

const mockServices = [
  createMockService({ serviceID: 1, code: 'PT-SESSION', name: 'Physiotherapy Session', defaultPrice: 1000 }),
  createMockService({ serviceID: 2, code: 'EVAL', name: 'Evaluation', defaultPrice: 1500 }),
];

const mockPackages = [
  createMockPackage({ packageID: 1, name: 'Basic 5-Session Package', totalSessions: 5, price: 4500, validityDays: 30 }),
  createMockPackage({ packageID: 2, name: 'Standard 10-Session Package', totalSessions: 10, price: 8500, validityDays: 60 }),
];

describe('Package Workflow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Package List Display', () => {
    it('should display packages in the Packages tab', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-services') {
          return Promise.resolve({ success: true, data: mockServices });
        }
        if (operation === 'get-packages') {
          return Promise.resolve({ success: true, data: mockPackages });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Services />);

      // Click on Packages tab
      const packagesTab = screen.getByRole('tab', { name: /packages/i });
      await userEvent.click(packagesTab);

      // Verify packages are displayed
      await waitFor(() => {
        expect(screen.getByText('Basic 5-Session Package')).toBeInTheDocument();
        expect(screen.getByText('Standard 10-Session Package')).toBeInTheDocument();
      });
    });

    it('should display package details correctly', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-services') {
          return Promise.resolve({ success: true, data: mockServices });
        }
        if (operation === 'get-packages') {
          return Promise.resolve({ success: true, data: mockPackages });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Services />);

      // Click on Packages tab
      const packagesTab = screen.getByRole('tab', { name: /packages/i });
      await userEvent.click(packagesTab);

      await waitFor(() => {
        expect(screen.getByText('Basic 5-Session Package')).toBeInTheDocument();
      });

      // Verify package details are shown - sessions are displayed as "X sessions"
      expect(screen.getByText('5 sessions')).toBeInTheDocument();
      expect(screen.getByText('30 days')).toBeInTheDocument();
    });

    it('should show empty state when no packages exist', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-services') {
          return Promise.resolve({ success: true, data: mockServices });
        }
        if (operation === 'get-packages') {
          return Promise.resolve({ success: true, data: [] });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Services />);

      // Click on Packages tab
      const packagesTab = screen.getByRole('tab', { name: /packages/i });
      await userEvent.click(packagesTab);

      // Verify empty message
      await waitFor(() => {
        expect(screen.getByText('No Packages Found')).toBeInTheDocument();
      });
    });
  });

  describe('Create Package Flow', () => {
    it('should open create package dialog', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-services') {
          return Promise.resolve({ success: true, data: mockServices });
        }
        if (operation === 'get-packages') {
          return Promise.resolve({ success: true, data: mockPackages });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Services />);

      // Click on Packages tab
      const packagesTab = screen.getByRole('tab', { name: /packages/i });
      await userEvent.click(packagesTab);

      await waitFor(() => {
        expect(screen.getByText('Basic 5-Session Package')).toBeInTheDocument();
      });

      // Click Add Package button
      const addButton = screen.getByRole('button', { name: /add package/i });
      await userEvent.click(addButton);

      // Verify dialog opens
      await waitFor(() => {
        expect(screen.getByText('Add Package')).toBeInTheDocument();
      });
    });

    it('should create package with form data', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-services') {
          return Promise.resolve({ success: true, data: mockServices });
        }
        if (operation === 'get-packages') {
          return Promise.resolve({ success: true, data: mockPackages });
        }
        if (operation === 'create-package') {
          return Promise.resolve({ success: true, data: { packageID: 3 } });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Services />);

      // Click on Packages tab
      const packagesTab = screen.getByRole('tab', { name: /packages/i });
      await userEvent.click(packagesTab);

      await waitFor(() => {
        expect(screen.getByText('Basic 5-Session Package')).toBeInTheDocument();
      });

      // Click Add Package button
      const addButton = screen.getByRole('button', { name: /add package/i });
      await userEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add Package')).toBeInTheDocument();
      });

      // Fill form - use faster input method
      const user = userEvent.setup({ delay: null });
      await user.type(screen.getByLabelText(/package name/i), 'Pkg');
      await user.clear(screen.getByLabelText(/total sessions/i));
      await user.type(screen.getByLabelText(/total sessions/i), '20');
      await user.clear(screen.getByLabelText(/price/i));
      await user.type(screen.getByLabelText(/price/i), '15000');

      // Submit - the dialog submit button text is "Add"
      const dialogButtons = screen.getAllByRole('button', { name: /^add$/i });
      const submitButton = dialogButtons[dialogButtons.length - 1]; // Last "Add" button in dialog
      await user.click(submitButton);

      // Verify API was called
      await waitFor(() => {
        expect(mockElectronAPI.database.execute).toHaveBeenCalledWith(
          'create-package',
          expect.objectContaining({
            name: 'Pkg',
            totalSessions: 20,
            price: 15000,
          })
        );
      });
    }, 15000);
  });

  describe('Services Tab', () => {
    it('should display services list by default', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-services') {
          return Promise.resolve({ success: true, data: mockServices });
        }
        if (operation === 'get-packages') {
          return Promise.resolve({ success: true, data: mockPackages });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Services />);

      // Services tab is active by default
      await waitFor(() => {
        expect(screen.getByText('Physiotherapy Session')).toBeInTheDocument();
        expect(screen.getByText('Evaluation')).toBeInTheDocument();
      });
    });

    it('should switch between Services and Packages tabs', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-services') {
          return Promise.resolve({ success: true, data: mockServices });
        }
        if (operation === 'get-packages') {
          return Promise.resolve({ success: true, data: mockPackages });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Services />);

      // Initial services are shown
      await waitFor(() => {
        expect(screen.getByText('Physiotherapy Session')).toBeInTheDocument();
      });

      // Switch to Packages
      const packagesTab = screen.getByRole('tab', { name: /packages/i });
      await userEvent.click(packagesTab);

      await waitFor(() => {
        expect(screen.getByText('Basic 5-Session Package')).toBeInTheDocument();
      });

      // Switch back to Services
      const servicesTab = screen.getByRole('tab', { name: /services/i });
      await userEvent.click(servicesTab);

      await waitFor(() => {
        expect(screen.getByText('Physiotherapy Session')).toBeInTheDocument();
      });
    });
  });
});
