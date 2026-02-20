/**
 * Settings Workflow Integration Tests
 * Tests the settings management flow including:
 * - Loading settings
 * - Updating clinic information
 * - Invoice settings
 * - Backup functionality
 */

import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../utils/testUtils';
import Settings from '../../src/renderer/pages/Settings';
import { mockElectronAPI } from '../setupTests';

// Mock useAuth to return admin user for testing admin-only features
jest.mock('../../src/renderer/contexts/AuthContext', () => ({
  ...jest.requireActual('../../src/renderer/contexts/AuthContext'),
  useAuth: () => ({
    user: { userID: 1, username: 'admin', role: 'Admin' },
    isAuthenticated: true,
    login: jest.fn(),
    logout: jest.fn(),
  }),
}));

const mockSettings = {
  settingsID: 1,
  clinicName: 'PhysioClinic Lahore',
  address: '123 Main Street, Gulberg',
  phone: '042-1234567',
  whatsApp: '03001234567',
  email: 'info@physioclinic.com',
  website: 'www.physioclinic.com',
  invoicePrefix: 'INV',
  currency: 'Rs',
  taxPercent: 0,
  defaultVisitDuration: 45,
};

describe('Settings Workflow Integration Tests', () => {
  // Increase timeout for settings tests which can be slow when running with other tests
  jest.setTimeout(15000);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Settings Load', () => {
    it('should load and display current settings', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-settings') {
          return Promise.resolve({ success: true, data: mockSettings });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Settings />);

      await waitFor(() => {
        expect(screen.getByLabelText(/clinic name/i)).toHaveValue('PhysioClinic Lahore');
      });

      expect(screen.getByLabelText(/address/i)).toHaveValue('123 Main Street, Gulberg');
      expect(screen.getByLabelText(/phone/i)).toHaveValue('042-1234567');
    });

    it('should display clinic information section', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-settings') {
          return Promise.resolve({ success: true, data: mockSettings });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Settings />);

      await waitFor(() => {
        expect(screen.getByText('Clinic Information')).toBeInTheDocument();
      });
    });

    it('should display invoice settings section', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-settings') {
          return Promise.resolve({ success: true, data: mockSettings });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Settings />);

      await waitFor(() => {
        expect(screen.getByText('Invoice Settings')).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/invoice prefix/i)).toHaveValue('INV');
      expect(screen.getByLabelText(/currency symbol/i)).toHaveValue('Rs');
    });
  });

  describe('Update Settings', () => {
    it('should save updated settings when clicking save button', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-settings') {
          return Promise.resolve({ success: true, data: mockSettings });
        }
        if (operation === 'update-settings') {
          return Promise.resolve({ success: true });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Settings />);

      await waitFor(() => {
        expect(screen.getByLabelText(/clinic name/i)).toHaveValue('PhysioClinic Lahore');
      });

      // Change clinic name
      const clinicNameInput = screen.getByLabelText(/clinic name/i);
      await userEvent.clear(clinicNameInput);
      await userEvent.type(clinicNameInput, 'Updated Clinic Name');

      // Save settings
      const saveButton = screen.getByRole('button', { name: /save settings/i });
      await userEvent.click(saveButton);

      // Verify API was called
      await waitFor(() => {
        expect(mockElectronAPI.database.execute).toHaveBeenCalledWith(
          'update-settings',
          expect.objectContaining({
            clinicName: 'Updated Clinic Name',
          })
        );
      });
    });

    it('should show success message after saving', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-settings') {
          return Promise.resolve({ success: true, data: mockSettings });
        }
        if (operation === 'update-settings') {
          return Promise.resolve({ success: true });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Settings />);

      await waitFor(() => {
        expect(screen.getByLabelText(/clinic name/i)).toHaveValue('PhysioClinic Lahore');
      });

      // Save settings
      const saveButton = screen.getByRole('button', { name: /save settings/i });
      await userEvent.click(saveButton);

      // Verify success message
      await waitFor(() => {
        expect(screen.getByText('Settings saved successfully')).toBeInTheDocument();
      });
    });
  });

  describe('Backup & Data Section', () => {
    it('should display backup section', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-settings') {
          return Promise.resolve({ success: true, data: mockSettings });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Settings />);

      await waitFor(() => {
        expect(screen.getByText('Backup & Data')).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /create backup now/i })).toBeInTheDocument();
    });

    it('should create backup when clicking backup button', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-settings') {
          return Promise.resolve({ success: true, data: mockSettings });
        }
        return Promise.resolve({ success: true, data: null });
      });

      mockElectronAPI.backup.create.mockResolvedValue({
        success: true,
        data: 'backup-2024-01-15.db',
      });

      render(<Settings />);

      await waitFor(() => {
        expect(screen.getByText('Backup & Data')).toBeInTheDocument();
      });

      // Click backup button
      const backupButton = screen.getByRole('button', { name: /create backup now/i });
      await userEvent.click(backupButton);

      // Verify backup was created
      await waitFor(() => {
        expect(mockElectronAPI.backup.create).toHaveBeenCalled();
      });
    });

    it('should display Load Demo Data button', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-settings') {
          return Promise.resolve({ success: true, data: mockSettings });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Settings />);

      await waitFor(() => {
        expect(screen.getByText('Backup & Data')).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /load demo data/i })).toBeInTheDocument();
    });
  });
});
