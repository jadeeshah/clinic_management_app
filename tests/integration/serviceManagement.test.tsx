/**
 * Service Management Integration Tests
 * Tests integrated service management workflows including:
 * - Service tab switching
 * - Service and package interactions
 * - Service data consistency
 */

import React from 'react';
import { render, screen, waitFor, createMockService, createMockPackage } from '../utils/testUtils';
import userEvent from '@testing-library/user-event';
import Services from '../../src/renderer/pages/Services';
import { mockElectronAPI } from '../setupTests';

describe('Service Management Integration Tests', () => {
  const mockServices = [
    createMockService({
      serviceID: 1,
      code: 'PT-SESSION',
      name: 'Physiotherapy Session',
      defaultPrice: 2000,
      category: 'Therapy',
    }),
    createMockService({
      serviceID: 2,
      code: 'EVAL-001',
      name: 'Initial Evaluation',
      defaultPrice: 1500,
      category: 'Evaluation',
    }),
    createMockService({
      serviceID: 3,
      code: 'DN-001',
      name: 'Dry Needling',
      defaultPrice: 1000,
      category: 'Treatment',
    }),
  ];

  const mockPackages = [
    createMockPackage({
      packageID: 1,
      name: '10 Session Package',
      totalSessions: 10,
      price: 18000,
      validityDays: 30,
    }),
    createMockPackage({
      packageID: 2,
      name: '5 Session Package',
      totalSessions: 5,
      price: 9500,
      validityDays: 15,
    }),
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Tab Navigation and Data Loading', () => {
    it('should load services tab by default', async () => {
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

      await waitFor(() => {
        expect(screen.getByText('Physiotherapy Session')).toBeInTheDocument();
      });

      // Services tab should be selected
      expect(screen.getByRole('tab', { name: /services/i })).toHaveAttribute('aria-selected', 'true');
    });

    it('should maintain data after switching tabs', async () => {
      const user = userEvent.setup({ delay: null });

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

      await waitFor(() => {
        expect(screen.getByText('Physiotherapy Session')).toBeInTheDocument();
      });

      // Switch to Packages tab
      await user.click(screen.getByRole('tab', { name: /packages/i }));

      await waitFor(() => {
        expect(screen.getByText('10 Session Package')).toBeInTheDocument();
      });

      // Switch back to Services tab
      await user.click(screen.getByRole('tab', { name: /services/i }));

      await waitFor(() => {
        expect(screen.getByText('Physiotherapy Session')).toBeInTheDocument();
      });
    });
  });

  describe('Service List Management', () => {
    it('should display all services with their details', async () => {
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

      await waitFor(() => {
        expect(screen.getByText('Physiotherapy Session')).toBeInTheDocument();
      });

      // Check all services and their codes
      expect(screen.getByText('PT-SESSION')).toBeInTheDocument();
      expect(screen.getByText('Initial Evaluation')).toBeInTheDocument();
      expect(screen.getByText('EVAL-001')).toBeInTheDocument();
      expect(screen.getByText('Dry Needling')).toBeInTheDocument();
      expect(screen.getByText('DN-001')).toBeInTheDocument();

      // Check categories
      expect(screen.getByText('Therapy')).toBeInTheDocument();
      expect(screen.getByText('Evaluation')).toBeInTheDocument();
      expect(screen.getByText('Treatment')).toBeInTheDocument();

      // Check prices
      expect(screen.getByText('Rs 2,000')).toBeInTheDocument();
      expect(screen.getByText('Rs 1,500')).toBeInTheDocument();
      expect(screen.getByText('Rs 1,000')).toBeInTheDocument();
    });

    it('should uppercase service code automatically', async () => {
      const user = userEvent.setup({ delay: null });

      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-services') {
          return Promise.resolve({ success: true, data: [] });
        }
        if (operation === 'get-packages') {
          return Promise.resolve({ success: true, data: [] });
        }
        if (operation === 'create-service') {
          return Promise.resolve({ success: true, data: { insertId: 1 } });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Services />);

      await waitFor(() => {
        expect(screen.getByText('No Services Found')).toBeInTheDocument();
      });

      // Open add dialog
      const addButtons = screen.getAllByRole('button', { name: /add service/i });
      await user.click(addButtons[0]);

      // Type lowercase code
      await user.type(screen.getByLabelText(/service code/i), 'pt-new');
      await user.type(screen.getByLabelText(/service name/i), 'New Service');

      // Submit
      await user.click(screen.getByRole('button', { name: /^add$/i }));

      await waitFor(() => {
        expect(mockElectronAPI.database.execute).toHaveBeenCalledWith(
          'create-service',
          expect.objectContaining({
            code: 'PT-NEW', // Should be uppercase
            name: 'New Service',
          })
        );
      });
    });
  });

  describe('Package List Management', () => {
    it('should calculate and display per-session cost', async () => {
      const user = userEvent.setup({ delay: null });

      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-services') {
          return Promise.resolve({ success: true, data: [] });
        }
        if (operation === 'get-packages') {
          return Promise.resolve({ success: true, data: mockPackages });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Services />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /packages/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /packages/i }));

      await waitFor(() => {
        expect(screen.getByText('10 Session Package')).toBeInTheDocument();
      });

      // Per session cost for 18000/10 = 1800
      expect(screen.getByText('Rs 1,800')).toBeInTheDocument();

      // Per session cost for 9500/5 = 1900
      expect(screen.getByText('Rs 1,900')).toBeInTheDocument();
    });

    it('should show validity period for packages', async () => {
      const user = userEvent.setup({ delay: null });

      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-services') {
          return Promise.resolve({ success: true, data: [] });
        }
        if (operation === 'get-packages') {
          return Promise.resolve({ success: true, data: mockPackages });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Services />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /packages/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /packages/i }));

      await waitFor(() => {
        expect(screen.getByText('10 Session Package')).toBeInTheDocument();
      });

      // Check validity periods
      expect(screen.getByText('30 days')).toBeInTheDocument();
      expect(screen.getByText('15 days')).toBeInTheDocument();
    });
  });

  describe('Edit Workflows', () => {
    it('should update service and refresh list', async () => {
      const user = userEvent.setup({ delay: null });
      let updateCalled = false;

      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-services') {
          if (updateCalled) {
            // Return updated service
            return Promise.resolve({
              success: true,
              data: [
                { ...mockServices[0], name: 'Updated Physiotherapy Session' },
                ...mockServices.slice(1),
              ],
            });
          }
          return Promise.resolve({ success: true, data: mockServices });
        }
        if (operation === 'get-packages') {
          return Promise.resolve({ success: true, data: [] });
        }
        if (operation === 'update-service') {
          updateCalled = true;
          return Promise.resolve({ success: true, data: null });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Services />);

      await waitFor(() => {
        expect(screen.getByText('Physiotherapy Session')).toBeInTheDocument();
      });

      // Click edit button
      const editButtons = screen.getAllByRole('button', { name: /edit service/i });
      await user.click(editButtons[0]);

      // Update the name
      const nameInput = screen.getByLabelText(/service name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Physiotherapy Session');

      // Submit
      await user.click(screen.getByRole('button', { name: /update/i }));

      await waitFor(() => {
        expect(mockElectronAPI.database.execute).toHaveBeenCalledWith(
          'update-service',
          expect.objectContaining({
            serviceID: 1,
            name: 'Updated Physiotherapy Session',
          })
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle service load failure gracefully', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-services') {
          return Promise.reject(new Error('Database error'));
        }
        if (operation === 'get-packages') {
          return Promise.resolve({ success: true, data: [] });
        }
        return Promise.resolve({ success: true, data: null });
      });

      // Should not throw
      render(<Services />);

      // Should show empty state since load failed
      await waitFor(() => {
        expect(screen.getByText('No Services Found')).toBeInTheDocument();
      });
    });

    it('should handle package load failure gracefully', async () => {
      const user = userEvent.setup({ delay: null });

      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-services') {
          return Promise.resolve({ success: true, data: mockServices });
        }
        if (operation === 'get-packages') {
          return Promise.reject(new Error('Database error'));
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Services />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /packages/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /packages/i }));

      // Should show empty state since load failed
      await waitFor(() => {
        expect(screen.getByText('No Packages Found')).toBeInTheDocument();
      });
    });
  });
});
