/**
 * Unit tests for Services component (Services & Packages)
 */

import React from 'react';
import { render, screen, waitFor, createMockService, createMockPackage } from '../../utils/testUtils';
import userEvent from '@testing-library/user-event';
import Services from '../../../src/renderer/pages/Services';
import { mockElectronAPI } from '../../setupTests';

describe('Services Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock responses
    mockElectronAPI.database.execute.mockImplementation((operation: string) => {
      if (operation === 'get-services') {
        return Promise.resolve({ success: true, data: [] });
      }
      if (operation === 'get-packages') {
        return Promise.resolve({ success: true, data: [] });
      }
      return Promise.resolve({ success: true, data: null });
    });
  });

  describe('Tab Navigation', () => {
    it('should display Services tab by default', async () => {
      render(<Services />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /services/i })).toHaveAttribute('aria-selected', 'true');
      });
    });

    it('should switch to Packages tab when clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Services />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /packages/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /packages/i }));

      expect(screen.getByRole('tab', { name: /packages/i })).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Services Tab', () => {
    describe('Loading State', () => {
      it('should show loading spinner while fetching services', async () => {
        let resolvePromise: (value: any) => void;
        const promise = new Promise((resolve) => {
          resolvePromise = resolve;
        });

        mockElectronAPI.database.execute.mockImplementation((operation: string) => {
          if (operation === 'get-services') return promise;
          return Promise.resolve({ success: true, data: [] });
        });

        render(<Services />);

        expect(screen.getByRole('progressbar')).toBeInTheDocument();

        resolvePromise!({ success: true, data: [] });
        await waitFor(() => {
          expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
        });
      });
    });

    describe('Empty State', () => {
      it('should show empty state when no services exist', async () => {
        render(<Services />);

        await waitFor(() => {
          expect(screen.getByText('No Services Found')).toBeInTheDocument();
        });

        expect(screen.getByText('Add your first service to use in invoices.')).toBeInTheDocument();
      });
    });

    describe('Table Display', () => {
      it('should display services in a table', async () => {
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
            code: 'DN-001',
            name: 'Dry Needling',
            defaultPrice: 1500,
            category: 'Treatment',
          }),
        ];

        mockElectronAPI.database.execute.mockImplementation((operation: string) => {
          if (operation === 'get-services') {
            return Promise.resolve({ success: true, data: mockServices });
          }
          return Promise.resolve({ success: true, data: [] });
        });

        render(<Services />);

        await waitFor(() => {
          expect(screen.getByText('Physiotherapy Session')).toBeInTheDocument();
        });

        expect(screen.getByText('Dry Needling')).toBeInTheDocument();
        expect(screen.getByText('PT-SESSION')).toBeInTheDocument();
        expect(screen.getByText('DN-001')).toBeInTheDocument();
        expect(screen.getByText('Therapy')).toBeInTheDocument();
        expect(screen.getByText('Treatment')).toBeInTheDocument();
        expect(screen.getByText('Rs 2,000')).toBeInTheDocument();
        expect(screen.getByText('Rs 1,500')).toBeInTheDocument();
      });
    });

    describe('Add Service Dialog', () => {
      it('should open add service dialog when clicking Add Service button', async () => {
        const user = userEvent.setup({ delay: null });
        render(<Services />);

        await waitFor(() => {
          expect(screen.getByText('No Services Found')).toBeInTheDocument();
        });

        const addButtons = screen.getAllByRole('button', { name: /add service/i });
        await user.click(addButtons[0]);

        expect(screen.getByText('Add New Service')).toBeInTheDocument();
        expect(screen.getByLabelText(/service code/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/service name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/default price/i)).toBeInTheDocument();
      });

      it('should show validation error when required fields are empty', async () => {
        const user = userEvent.setup({ delay: null });
        render(<Services />);

        await waitFor(() => {
          expect(screen.getByText('No Services Found')).toBeInTheDocument();
        });

        const addButtons = screen.getAllByRole('button', { name: /add service/i });
        await user.click(addButtons[0]);

        // Click save without filling required fields
        await user.click(screen.getByRole('button', { name: /^add$/i }));

        await waitFor(() => {
          expect(screen.getByText('Code and name are required')).toBeInTheDocument();
        });
      });

      it('should create service when form is valid', async () => {
        const user = userEvent.setup({ delay: null });

        mockElectronAPI.database.execute.mockImplementation((operation: string) => {
          if (operation === 'get-services') {
            return Promise.resolve({ success: true, data: [] });
          }
          if (operation === 'create-service') {
            return Promise.resolve({ success: true, data: { insertId: 1 } });
          }
          return Promise.resolve({ success: true, data: [] });
        });

        render(<Services />);

        await waitFor(() => {
          expect(screen.getByText('No Services Found')).toBeInTheDocument();
        });

        const addButtons = screen.getAllByRole('button', { name: /add service/i });
        await user.click(addButtons[0]);

        await user.type(screen.getByLabelText(/service code/i), 'PT-NEW');
        await user.type(screen.getByLabelText(/service name/i), 'New Service');
        await user.type(screen.getByLabelText(/category/i), 'Therapy');

        await user.click(screen.getByRole('button', { name: /^add$/i }));

        await waitFor(() => {
          expect(mockElectronAPI.database.execute).toHaveBeenCalledWith(
            'create-service',
            expect.objectContaining({
              code: 'PT-NEW',
              name: 'New Service',
              category: 'Therapy',
            })
          );
        });
      });

      it('should close dialog when clicking Cancel', async () => {
        const user = userEvent.setup({ delay: null });
        render(<Services />);

        await waitFor(() => {
          expect(screen.getByText('No Services Found')).toBeInTheDocument();
        });

        const addButtons = screen.getAllByRole('button', { name: /add service/i });
        await user.click(addButtons[0]);

        expect(screen.getByText('Add New Service')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /cancel/i }));

        await waitFor(() => {
          expect(screen.queryByText('Add New Service')).not.toBeInTheDocument();
        });
      });
    });

    describe('Edit Service', () => {
      it('should open edit dialog with pre-filled data', async () => {
        const user = userEvent.setup({ delay: null });
        const mockService = createMockService({
          serviceID: 1,
          code: 'PT-SESSION',
          name: 'Physiotherapy Session',
          defaultPrice: 2000,
          category: 'Therapy',
        });

        mockElectronAPI.database.execute.mockImplementation((operation: string) => {
          if (operation === 'get-services') {
            return Promise.resolve({ success: true, data: [mockService] });
          }
          return Promise.resolve({ success: true, data: [] });
        });

        render(<Services />);

        await waitFor(() => {
          expect(screen.getByText('Physiotherapy Session')).toBeInTheDocument();
        });

        const editButtons = screen.getAllByRole('button', { name: /edit service/i });
        await user.click(editButtons[0]);

        expect(screen.getByText('Edit Service')).toBeInTheDocument();
        expect(screen.getByLabelText(/service code/i)).toHaveValue('PT-SESSION');
        expect(screen.getByLabelText(/service name/i)).toHaveValue('Physiotherapy Session');
      });

      it('should update service when form is submitted', async () => {
        const user = userEvent.setup({ delay: null });
        const mockService = createMockService({
          serviceID: 1,
          code: 'PT-SESSION',
          name: 'Physiotherapy Session',
        });

        mockElectronAPI.database.execute.mockImplementation((operation: string) => {
          if (operation === 'get-services') {
            return Promise.resolve({ success: true, data: [mockService] });
          }
          if (operation === 'update-service') {
            return Promise.resolve({ success: true, data: null });
          }
          return Promise.resolve({ success: true, data: [] });
        });

        render(<Services />);

        await waitFor(() => {
          expect(screen.getByText('Physiotherapy Session')).toBeInTheDocument();
        });

        const editButtons = screen.getAllByRole('button', { name: /edit service/i });
        await user.click(editButtons[0]);

        const nameInput = screen.getByLabelText(/service name/i);
        await user.clear(nameInput);
        await user.type(nameInput, 'Updated Service Name');

        await user.click(screen.getByRole('button', { name: /update/i }));

        await waitFor(() => {
          expect(mockElectronAPI.database.execute).toHaveBeenCalledWith(
            'update-service',
            expect.objectContaining({
              serviceID: 1,
              name: 'Updated Service Name',
            })
          );
        });
      });
    });

    describe('Delete Service', () => {
      it('should call deactivate-service when delete is confirmed', async () => {
        const user = userEvent.setup({ delay: null });
        const mockService = createMockService({
          serviceID: 1,
          code: 'PT-SESSION',
          name: 'Physiotherapy Session',
        });

        // Mock window.confirm
        const confirmMock = jest.spyOn(window, 'confirm').mockReturnValue(true);

        mockElectronAPI.database.execute.mockImplementation((operation: string) => {
          if (operation === 'get-services') {
            return Promise.resolve({ success: true, data: [mockService] });
          }
          if (operation === 'deactivate-service') {
            return Promise.resolve({ success: true, data: null });
          }
          return Promise.resolve({ success: true, data: [] });
        });

        render(<Services />);

        await waitFor(() => {
          expect(screen.getByText('Physiotherapy Session')).toBeInTheDocument();
        });

        const deleteButtons = screen.getAllByRole('button', { name: /delete service/i });
        await user.click(deleteButtons[0]);

        await waitFor(() => {
          expect(mockElectronAPI.database.execute).toHaveBeenCalledWith(
            'deactivate-service',
            { serviceID: 1 }
          );
        });

        confirmMock.mockRestore();
      });

      it('should not delete when confirm is cancelled', async () => {
        const user = userEvent.setup({ delay: null });
        const mockService = createMockService({
          serviceID: 1,
          code: 'PT-SESSION',
          name: 'Physiotherapy Session',
        });

        // Mock window.confirm to return false
        const confirmMock = jest.spyOn(window, 'confirm').mockReturnValue(false);

        mockElectronAPI.database.execute.mockImplementation((operation: string) => {
          if (operation === 'get-services') {
            return Promise.resolve({ success: true, data: [mockService] });
          }
          return Promise.resolve({ success: true, data: [] });
        });

        render(<Services />);

        await waitFor(() => {
          expect(screen.getByText('Physiotherapy Session')).toBeInTheDocument();
        });

        const deleteButtons = screen.getAllByRole('button', { name: /delete service/i });
        await user.click(deleteButtons[0]);

        expect(mockElectronAPI.database.execute).not.toHaveBeenCalledWith(
          'deactivate-service',
          expect.anything()
        );

        confirmMock.mockRestore();
      });
    });
  });

  describe('Packages Tab', () => {
    describe('Empty State', () => {
      it('should show empty state when no packages exist', async () => {
        const user = userEvent.setup({ delay: null });
        render(<Services />);

        await waitFor(() => {
          expect(screen.getByRole('tab', { name: /packages/i })).toBeInTheDocument();
        });

        await user.click(screen.getByRole('tab', { name: /packages/i }));

        await waitFor(() => {
          expect(screen.getByText('No Packages Found')).toBeInTheDocument();
        });

        expect(screen.getByText('Create session packages for patients to purchase.')).toBeInTheDocument();
      });
    });

    describe('Table Display', () => {
      it('should display packages in a table', async () => {
        const user = userEvent.setup({ delay: null });
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

        expect(screen.getByText('5 Session Package')).toBeInTheDocument();
        expect(screen.getByText('10 sessions')).toBeInTheDocument();
        expect(screen.getByText('5 sessions')).toBeInTheDocument();
        expect(screen.getByText('Rs 18,000')).toBeInTheDocument();
        expect(screen.getByText('Rs 9,500')).toBeInTheDocument();
        expect(screen.getByText('30 days')).toBeInTheDocument();
        expect(screen.getByText('15 days')).toBeInTheDocument();
      });
    });

    describe('Add Package Dialog', () => {
      it('should open add package dialog when clicking Add Package button', async () => {
        const user = userEvent.setup({ delay: null });
        render(<Services />);

        await waitFor(() => {
          expect(screen.getByRole('tab', { name: /packages/i })).toBeInTheDocument();
        });

        await user.click(screen.getByRole('tab', { name: /packages/i }));

        await waitFor(() => {
          expect(screen.getByText('No Packages Found')).toBeInTheDocument();
        });

        const addButtons = screen.getAllByRole('button', { name: /add package/i });
        await user.click(addButtons[0]);

        expect(screen.getByText('Add New Package')).toBeInTheDocument();
        expect(screen.getByLabelText(/package name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/total sessions/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/validity/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/package price/i)).toBeInTheDocument();
      });

      it('should show validation error when required fields are invalid', async () => {
        const user = userEvent.setup({ delay: null });
        render(<Services />);

        await waitFor(() => {
          expect(screen.getByRole('tab', { name: /packages/i })).toBeInTheDocument();
        });

        await user.click(screen.getByRole('tab', { name: /packages/i }));

        await waitFor(() => {
          expect(screen.getByText('No Packages Found')).toBeInTheDocument();
        });

        const addButtons = screen.getAllByRole('button', { name: /add package/i });
        await user.click(addButtons[0]);

        // Clear the default session count
        const sessionsInput = screen.getByLabelText(/total sessions/i);
        await user.clear(sessionsInput);
        await user.type(sessionsInput, '0');

        // Click save
        await user.click(screen.getByRole('button', { name: /^add$/i }));

        await waitFor(() => {
          expect(screen.getByText('Name and valid session count are required')).toBeInTheDocument();
        });
      });

      it('should create package when form is valid', async () => {
        const user = userEvent.setup({ delay: null });

        mockElectronAPI.database.execute.mockImplementation((operation: string) => {
          if (operation === 'create-package') {
            return Promise.resolve({ success: true, data: { insertId: 1 } });
          }
          return Promise.resolve({ success: true, data: [] });
        });

        render(<Services />);

        await waitFor(() => {
          expect(screen.getByRole('tab', { name: /packages/i })).toBeInTheDocument();
        });

        await user.click(screen.getByRole('tab', { name: /packages/i }));

        await waitFor(() => {
          expect(screen.getByText('No Packages Found')).toBeInTheDocument();
        });

        const addButtons = screen.getAllByRole('button', { name: /add package/i });
        await user.click(addButtons[0]);

        await user.type(screen.getByLabelText(/package name/i), 'New Package');

        // Sessions is pre-filled with 10, validity with 30
        await user.click(screen.getByRole('button', { name: /^add$/i }));

        await waitFor(() => {
          expect(mockElectronAPI.database.execute).toHaveBeenCalledWith(
            'create-package',
            expect.objectContaining({
              name: 'New Package',
              totalSessions: 10,
              validityDays: 30,
            })
          );
        });
      });
    });

    describe('Edit Package', () => {
      it('should open edit dialog with pre-filled data', async () => {
        const user = userEvent.setup({ delay: null });
        const mockPackage = createMockPackage({
          packageID: 1,
          name: '10 Session Package',
          totalSessions: 10,
          price: 18000,
          validityDays: 30,
        });

        mockElectronAPI.database.execute.mockImplementation((operation: string) => {
          if (operation === 'get-services') {
            return Promise.resolve({ success: true, data: [] });
          }
          if (operation === 'get-packages') {
            return Promise.resolve({ success: true, data: [mockPackage] });
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

        const editButtons = screen.getAllByRole('button', { name: /edit package/i });
        await user.click(editButtons[0]);

        expect(screen.getByText('Edit Package')).toBeInTheDocument();
        expect(screen.getByLabelText(/package name/i)).toHaveValue('10 Session Package');
      });

      it('should update package when form is submitted', async () => {
        const user = userEvent.setup({ delay: null });
        const mockPackage = createMockPackage({
          packageID: 1,
          name: '10 Session Package',
          totalSessions: 10,
          price: 18000,
          validityDays: 30,
        });

        mockElectronAPI.database.execute.mockImplementation((operation: string) => {
          if (operation === 'get-services') {
            return Promise.resolve({ success: true, data: [] });
          }
          if (operation === 'get-packages') {
            return Promise.resolve({ success: true, data: [mockPackage] });
          }
          if (operation === 'update-package') {
            return Promise.resolve({ success: true, data: null });
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

        const editButtons = screen.getAllByRole('button', { name: /edit package/i });
        await user.click(editButtons[0]);

        const nameInput = screen.getByLabelText(/package name/i);
        await user.clear(nameInput);
        await user.type(nameInput, 'Updated Package');

        await user.click(screen.getByRole('button', { name: /update/i }));

        await waitFor(() => {
          expect(mockElectronAPI.database.execute).toHaveBeenCalledWith(
            'update-package',
            expect.objectContaining({
              packageID: 1,
              name: 'Updated Package',
            })
          );
        });
      });
    });

    describe('Delete Package', () => {
      it('should call deactivate-package when delete is confirmed', async () => {
        const user = userEvent.setup({ delay: null });
        const mockPackage = createMockPackage({
          packageID: 1,
          name: '10 Session Package',
        });

        const confirmMock = jest.spyOn(window, 'confirm').mockReturnValue(true);

        mockElectronAPI.database.execute.mockImplementation((operation: string) => {
          if (operation === 'get-services') {
            return Promise.resolve({ success: true, data: [] });
          }
          if (operation === 'get-packages') {
            return Promise.resolve({ success: true, data: [mockPackage] });
          }
          if (operation === 'deactivate-package') {
            return Promise.resolve({ success: true, data: null });
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

        const deleteButtons = screen.getAllByRole('button', { name: /delete package/i });
        await user.click(deleteButtons[0]);

        await waitFor(() => {
          expect(mockElectronAPI.database.execute).toHaveBeenCalledWith(
            'deactivate-package',
            { packageID: 1 }
          );
        });

        confirmMock.mockRestore();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when service create fails', async () => {
      const user = userEvent.setup({ delay: null });

      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'create-service') {
          return Promise.resolve({ success: false, error: 'Failed to create service' });
        }
        return Promise.resolve({ success: true, data: [] });
      });

      render(<Services />);

      await waitFor(() => {
        expect(screen.getByText('No Services Found')).toBeInTheDocument();
      });

      const addButtons = screen.getAllByRole('button', { name: /add service/i });
      await user.click(addButtons[0]);

      await user.type(screen.getByLabelText(/service code/i), 'PT-NEW');
      await user.type(screen.getByLabelText(/service name/i), 'New Service');

      await user.click(screen.getByRole('button', { name: /^add$/i }));

      await waitFor(() => {
        expect(screen.getByText('Failed to create service')).toBeInTheDocument();
      });
    });

    it('should display error message when package create fails', async () => {
      const user = userEvent.setup({ delay: null });

      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'create-package') {
          return Promise.resolve({ success: false, error: 'Failed to create package' });
        }
        return Promise.resolve({ success: true, data: [] });
      });

      render(<Services />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /packages/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /packages/i }));

      await waitFor(() => {
        expect(screen.getByText('No Packages Found')).toBeInTheDocument();
      });

      const addButtons = screen.getAllByRole('button', { name: /add package/i });
      await user.click(addButtons[0]);

      await user.type(screen.getByLabelText(/package name/i), 'New Package');

      await user.click(screen.getByRole('button', { name: /^add$/i }));

      await waitFor(() => {
        expect(screen.getByText('Failed to create package')).toBeInTheDocument();
      });
    });
  });
});
