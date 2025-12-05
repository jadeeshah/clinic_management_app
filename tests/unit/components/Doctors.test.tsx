/**
 * Unit tests for Doctors component
 */

import React from 'react';
import { render, screen, waitFor, createMockDoctor } from '../../utils/testUtils';
import userEvent from '@testing-library/user-event';
import Doctors from '../../../src/renderer/pages/Doctors';
import { mockElectronAPI } from '../../setupTests';

describe('Doctors Component', () => {
  // Increase timeout for tests that can be slow when running with other tests
  jest.setTimeout(15000);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading spinner while fetching doctors', async () => {
      // Create a promise that doesn't resolve immediately
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockElectronAPI.database.execute.mockImplementation(() => promise);

      render(<Doctors />);

      // Check for loading state
      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      // Resolve and wait for loading to finish
      resolvePromise!({ success: true, data: [] });
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no doctors exist', async () => {
      mockElectronAPI.database.execute.mockResolvedValue({
        success: true,
        data: [],
      });

      render(<Doctors />);

      await waitFor(() => {
        expect(screen.getByText('No Doctors Found')).toBeInTheDocument();
      });

      expect(screen.getByText('Add your first doctor to get started.')).toBeInTheDocument();
      // There are two Add Doctor buttons (header + card), so use getAllByRole
      const addButtons = screen.getAllByRole('button', { name: /add doctor/i });
      expect(addButtons.length).toBe(2);
    });
  });

  describe('Table Display', () => {
    it('should display doctors in a table', async () => {
      const mockDoctors = [
        createMockDoctor({
          doctorID: 1,
          firstName: 'Sarah',
          lastName: 'Khan',
          designation: 'Senior Physiotherapist',
          specialization: 'Sports Medicine',
          sessionCharge: 2500,
          availableDays: ['Monday', 'Wednesday', 'Friday'],
          phone: '03001234567',
          email: 'sarah@clinic.com',
          startTime: '09:00',
          endTime: '17:00',
        }),
        createMockDoctor({
          doctorID: 2,
          firstName: 'Ahmed',
          lastName: 'Ali',
          designation: 'Physiotherapist',
          specialization: 'Orthopedic',
          sessionCharge: 2000,
          availableDays: ['Tuesday', 'Thursday'],
          phone: '03009876543',
          email: 'ahmed@clinic.com',
          startTime: '10:00',
          endTime: '18:00',
        }),
      ];

      mockElectronAPI.database.execute.mockResolvedValue({
        success: true,
        data: mockDoctors,
      });

      render(<Doctors />);

      await waitFor(() => {
        expect(screen.getByText('Sarah Khan')).toBeInTheDocument();
      });

      // Check both doctors are displayed
      expect(screen.getByText('Ahmed Ali')).toBeInTheDocument();

      // Check table headers
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Designation')).toBeInTheDocument();
      expect(screen.getByText('Specialization')).toBeInTheDocument();
      expect(screen.getByText('Contact')).toBeInTheDocument();
      expect(screen.getByText('Session Charge')).toBeInTheDocument();
      expect(screen.getByText('Available Days')).toBeInTheDocument();
      expect(screen.getByText('Hours')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();

      // Check session charges are displayed
      expect(screen.getByText('Rs 2,500')).toBeInTheDocument();
      expect(screen.getByText('Rs 2,000')).toBeInTheDocument();
    });

    it('should display doctor contact information', async () => {
      const mockDoctor = createMockDoctor({
        doctorID: 1,
        firstName: 'Sarah',
        lastName: 'Khan',
        phone: '03001234567',
        email: 'sarah@clinic.com',
        availableDays: ['Monday'],
      });

      mockElectronAPI.database.execute.mockResolvedValue({
        success: true,
        data: [mockDoctor],
      });

      render(<Doctors />);

      await waitFor(() => {
        expect(screen.getByText('03001234567')).toBeInTheDocument();
      });

      expect(screen.getByText('sarah@clinic.com')).toBeInTheDocument();
    });

    it('should display available days as chips', async () => {
      const mockDoctor = createMockDoctor({
        doctorID: 1,
        firstName: 'Sarah',
        lastName: 'Khan',
        availableDays: ['Monday', 'Wednesday', 'Friday'],
      });

      mockElectronAPI.database.execute.mockResolvedValue({
        success: true,
        data: [mockDoctor],
      });

      render(<Doctors />);

      await waitFor(() => {
        expect(screen.getByText('Mon')).toBeInTheDocument();
      });

      expect(screen.getByText('Wed')).toBeInTheDocument();
      expect(screen.getByText('Fri')).toBeInTheDocument();
    });
  });

  describe('Add Doctor Dialog', () => {
    it('should open add doctor dialog when clicking Add Doctor button', async () => {
      const user = userEvent.setup({ delay: null });
      mockElectronAPI.database.execute.mockResolvedValue({
        success: true,
        data: [],
      });

      render(<Doctors />);

      await waitFor(() => {
        expect(screen.getByText('No Doctors Found')).toBeInTheDocument();
      });

      // Use first Add Doctor button (header)
      const addButtons = screen.getAllByRole('button', { name: /add doctor/i });
      await user.click(addButtons[0]);

      expect(screen.getByText('Add New Doctor')).toBeInTheDocument();
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/education/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/designation/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/specialization/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/session charge/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it('should show validation error when first name is empty', async () => {
      const user = userEvent.setup({ delay: null });
      mockElectronAPI.database.execute.mockResolvedValue({
        success: true,
        data: [],
      });

      render(<Doctors />);

      await waitFor(() => {
        expect(screen.getByText('No Doctors Found')).toBeInTheDocument();
      });

      // Use first Add Doctor button (header)
      const addButtons = screen.getAllByRole('button', { name: /add doctor/i });
      await user.click(addButtons[0]);

      // Click save without filling required fields
      const addButton = screen.getByRole('button', { name: /^add$/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('First name is required')).toBeInTheDocument();
      });
    });

    it('should create doctor when form is valid', async () => {
      const user = userEvent.setup({ delay: null });
      mockElectronAPI.database.execute
        .mockResolvedValueOnce({ success: true, data: [] }) // Initial load
        .mockResolvedValueOnce({ success: true, data: { insertId: 1 } }) // Create doctor
        .mockResolvedValueOnce({ success: true, data: [] }); // Reload after create

      render(<Doctors />);

      await waitFor(() => {
        expect(screen.getByText('No Doctors Found')).toBeInTheDocument();
      });

      // Use first Add Doctor button (header)
      const addButtons = screen.getAllByRole('button', { name: /add doctor/i });
      await user.click(addButtons[0]);

      // Fill in the form
      await user.type(screen.getByLabelText(/first name/i), 'Sarah');
      await user.type(screen.getByLabelText(/last name/i), 'Khan');
      await user.type(screen.getByLabelText(/education/i), 'DPT');
      await user.type(screen.getByLabelText(/designation/i), 'Senior Physiotherapist');
      await user.type(screen.getByLabelText(/specialization/i), 'Sports Medicine');

      // Submit form
      await user.click(screen.getByRole('button', { name: /^add$/i }));

      await waitFor(() => {
        expect(mockElectronAPI.database.execute).toHaveBeenCalledWith(
          'create-doctor',
          expect.objectContaining({
            firstName: 'Sarah',
            lastName: 'Khan',
            education: 'DPT',
            designation: 'Senior Physiotherapist',
            specialization: 'Sports Medicine',
          })
        );
      });
    });

    it('should close dialog when clicking Cancel', async () => {
      const user = userEvent.setup({ delay: null });
      mockElectronAPI.database.execute.mockResolvedValue({
        success: true,
        data: [],
      });

      render(<Doctors />);

      await waitFor(() => {
        expect(screen.getByText('No Doctors Found')).toBeInTheDocument();
      });

      // Use first Add Doctor button (header)
      const addButtons = screen.getAllByRole('button', { name: /add doctor/i });
      await user.click(addButtons[0]);
      expect(screen.getByText('Add New Doctor')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      await waitFor(() => {
        expect(screen.queryByText('Add New Doctor')).not.toBeInTheDocument();
      });
    });
  });

  describe('Edit Doctor Dialog', () => {
    it('should open edit dialog with pre-filled data', async () => {
      const user = userEvent.setup({ delay: null });
      const mockDoctor = createMockDoctor({
        doctorID: 1,
        firstName: 'Sarah',
        lastName: 'Khan',
        education: 'DPT',
        designation: 'Senior Physiotherapist',
        specialization: 'Sports Medicine',
        sessionCharge: 2500,
        availableDays: ['Monday', 'Wednesday'],
        phone: '03001234567',
        email: 'sarah@clinic.com',
      });

      mockElectronAPI.database.execute.mockResolvedValue({
        success: true,
        data: [mockDoctor],
      });

      render(<Doctors />);

      await waitFor(() => {
        expect(screen.getByText('Sarah Khan')).toBeInTheDocument();
      });

      // Click edit button
      const editButtons = screen.getAllByRole('button', { name: /edit doctor/i });
      await user.click(editButtons[0]);

      expect(screen.getByText('Edit Doctor')).toBeInTheDocument();
      expect(screen.getByLabelText(/first name/i)).toHaveValue('Sarah');
      expect(screen.getByLabelText(/last name/i)).toHaveValue('Khan');
      expect(screen.getByLabelText(/education/i)).toHaveValue('DPT');
    });

    it('should update doctor when form is submitted', async () => {
      const user = userEvent.setup({ delay: null });
      const mockDoctor = createMockDoctor({
        doctorID: 1,
        firstName: 'Sarah',
        lastName: 'Khan',
        availableDays: ['Monday'],
      });

      mockElectronAPI.database.execute
        .mockResolvedValueOnce({ success: true, data: [mockDoctor] }) // Initial load
        .mockResolvedValueOnce({ success: true, data: null }) // Update doctor
        .mockResolvedValueOnce({ success: true, data: [mockDoctor] }); // Reload after update

      render(<Doctors />);

      await waitFor(() => {
        expect(screen.getByText('Sarah Khan')).toBeInTheDocument();
      });

      // Click edit button
      const editButtons = screen.getAllByRole('button', { name: /edit doctor/i });
      await user.click(editButtons[0]);

      // Modify the last name
      const lastNameInput = screen.getByLabelText(/last name/i);
      await user.clear(lastNameInput);
      await user.type(lastNameInput, 'Ahmed');

      // Submit form
      await user.click(screen.getByRole('button', { name: /update/i }));

      await waitFor(() => {
        expect(mockElectronAPI.database.execute).toHaveBeenCalledWith(
          'update-doctor',
          expect.objectContaining({
            doctorID: 1,
            lastName: 'Ahmed',
          })
        );
      });
    });
  });

  describe('Delete Doctor Dialog', () => {
    it('should open delete confirmation dialog', async () => {
      const user = userEvent.setup({ delay: null });
      const mockDoctor = createMockDoctor({
        doctorID: 1,
        firstName: 'Sarah',
        lastName: 'Khan',
        availableDays: ['Monday'],
      });

      mockElectronAPI.database.execute.mockResolvedValue({
        success: true,
        data: [mockDoctor],
      });

      render(<Doctors />);

      await waitFor(() => {
        expect(screen.getByText('Sarah Khan')).toBeInTheDocument();
      });

      // Click delete button
      const deleteButtons = screen.getAllByRole('button', { name: /delete doctor/i });
      await user.click(deleteButtons[0]);

      expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to remove Sarah Khan/)).toBeInTheDocument();
    });

    it('should deactivate doctor when delete is confirmed', async () => {
      const user = userEvent.setup({ delay: null });
      const mockDoctor = createMockDoctor({
        doctorID: 1,
        firstName: 'Sarah',
        lastName: 'Khan',
        availableDays: ['Monday'],
      });

      mockElectronAPI.database.execute
        .mockResolvedValueOnce({ success: true, data: [mockDoctor] }) // Initial load
        .mockResolvedValueOnce({ success: true, data: null }) // Deactivate
        .mockResolvedValueOnce({ success: true, data: [] }); // Reload after delete

      render(<Doctors />);

      await waitFor(() => {
        expect(screen.getByText('Sarah Khan')).toBeInTheDocument();
      });

      // Click delete button
      const deleteButtons = screen.getAllByRole('button', { name: /delete doctor/i });
      await user.click(deleteButtons[0]);

      // Confirm delete
      await user.click(screen.getByRole('button', { name: /^delete$/i }));

      await waitFor(() => {
        expect(mockElectronAPI.database.execute).toHaveBeenCalledWith(
          'deactivate-doctor',
          { doctorID: 1 }
        );
      });
    });

    it('should close delete dialog when Cancel is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      const mockDoctor = createMockDoctor({
        doctorID: 1,
        firstName: 'Sarah',
        lastName: 'Khan',
        availableDays: ['Monday'],
      });

      mockElectronAPI.database.execute.mockResolvedValue({
        success: true,
        data: [mockDoctor],
      });

      render(<Doctors />);

      await waitFor(() => {
        expect(screen.getByText('Sarah Khan')).toBeInTheDocument();
      });

      // Click delete button
      const deleteButtons = screen.getAllByRole('button', { name: /delete doctor/i });
      await user.click(deleteButtons[0]);

      expect(screen.getByText('Confirm Delete')).toBeInTheDocument();

      // Click cancel
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      await waitFor(() => {
        expect(screen.queryByText('Confirm Delete')).not.toBeInTheDocument();
      });
    });
  });

  describe('Doctor Detail Dialog', () => {
    it('should open detail dialog when clicking on a row', async () => {
      const user = userEvent.setup({ delay: null });
      const mockDoctor = createMockDoctor({
        doctorID: 1,
        firstName: 'Sarah',
        lastName: 'Khan',
        designation: 'Senior Physiotherapist',
        education: 'DPT',
        specialization: 'Sports Medicine',
        sessionCharge: 2500,
        phone: '03001234567',
        email: 'sarah@clinic.com',
        availableDays: ['Monday', 'Wednesday', 'Friday'],
        startTime: '09:00',
        endTime: '17:00',
      });

      mockElectronAPI.database.execute.mockResolvedValue({
        success: true,
        data: [mockDoctor],
      });

      render(<Doctors />);

      await waitFor(() => {
        expect(screen.getByText('Sarah Khan')).toBeInTheDocument();
      });

      // Click on the row
      await user.click(screen.getByText('Sarah Khan'));

      // Check detail dialog content
      await waitFor(() => {
        expect(screen.getByText('Dr. Sarah Khan')).toBeInTheDocument();
      });

      // Session Charge and Rs value appear in both table and dialog, so use getAllByText
      const sessionChargeElements = screen.getAllByText('Session Charge');
      expect(sessionChargeElements.length).toBeGreaterThanOrEqual(1);
      const chargeAmounts = screen.getAllByText('Rs 2,500');
      expect(chargeAmounts.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Contact Information')).toBeInTheDocument();
      expect(screen.getByText('Availability')).toBeInTheDocument();
    });

    it('should navigate to edit from detail dialog', async () => {
      const user = userEvent.setup({ delay: null });
      const mockDoctor = createMockDoctor({
        doctorID: 1,
        firstName: 'Sarah',
        lastName: 'Khan',
        availableDays: ['Monday'],
      });

      mockElectronAPI.database.execute.mockResolvedValue({
        success: true,
        data: [mockDoctor],
      });

      render(<Doctors />);

      await waitFor(() => {
        expect(screen.getByText('Sarah Khan')).toBeInTheDocument();
      });

      // Click on the row to open detail dialog
      await user.click(screen.getByText('Sarah Khan'));

      await waitFor(() => {
        expect(screen.getByText('Dr. Sarah Khan')).toBeInTheDocument();
      });

      // Click Edit button in detail dialog
      await user.click(screen.getByRole('button', { name: /edit/i }));

      // Should now show edit dialog
      await waitFor(() => {
        expect(screen.getByText('Edit Doctor')).toBeInTheDocument();
      });
    });

    it('should close detail dialog when Close is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      const mockDoctor = createMockDoctor({
        doctorID: 1,
        firstName: 'Sarah',
        lastName: 'Khan',
        availableDays: ['Monday'],
      });

      mockElectronAPI.database.execute.mockResolvedValue({
        success: true,
        data: [mockDoctor],
      });

      render(<Doctors />);

      await waitFor(() => {
        expect(screen.getByText('Sarah Khan')).toBeInTheDocument();
      });

      // Click on the row to open detail dialog
      await user.click(screen.getByText('Sarah Khan'));

      await waitFor(() => {
        expect(screen.getByText('Dr. Sarah Khan')).toBeInTheDocument();
      });

      // Click Close button
      await user.click(screen.getByRole('button', { name: /close/i }));

      await waitFor(() => {
        expect(screen.queryByText('Dr. Sarah Khan')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when create fails', async () => {
      const user = userEvent.setup({ delay: null });
      mockElectronAPI.database.execute
        .mockResolvedValueOnce({ success: true, data: [] }) // Initial load
        .mockResolvedValueOnce({ success: false, error: 'Database error: failed to create doctor' }); // Create fails

      render(<Doctors />);

      await waitFor(() => {
        expect(screen.getByText('No Doctors Found')).toBeInTheDocument();
      });

      // Use first Add Doctor button (header)
      const addButtons = screen.getAllByRole('button', { name: /add doctor/i });
      await user.click(addButtons[0]);

      // Fill in the form
      await user.type(screen.getByLabelText(/first name/i), 'Sarah');

      // Submit form
      await user.click(screen.getByRole('button', { name: /^add$/i }));

      await waitFor(() => {
        expect(screen.getByText('Database error: failed to create doctor')).toBeInTheDocument();
      });
    });

    it('should display error message when update fails', async () => {
      const user = userEvent.setup({ delay: null });
      const mockDoctor = createMockDoctor({
        doctorID: 1,
        firstName: 'Sarah',
        lastName: 'Khan',
        availableDays: ['Monday'],
      });

      mockElectronAPI.database.execute
        .mockResolvedValueOnce({ success: true, data: [mockDoctor] }) // Initial load
        .mockResolvedValueOnce({ success: false, error: 'Update failed' }); // Update fails

      render(<Doctors />);

      await waitFor(() => {
        expect(screen.getByText('Sarah Khan')).toBeInTheDocument();
      });

      // Click edit button
      const editButtons = screen.getAllByRole('button', { name: /edit doctor/i });
      await user.click(editButtons[0]);

      // Submit form
      await user.click(screen.getByRole('button', { name: /update/i }));

      await waitFor(() => {
        expect(screen.getByText('Update failed')).toBeInTheDocument();
      });
    });
  });

  describe('Header Actions', () => {
    it('should have Add Doctor button in header', async () => {
      mockElectronAPI.database.execute.mockResolvedValue({
        success: true,
        data: [createMockDoctor({ availableDays: ['Monday'] })],
      });

      render(<Doctors />);

      await waitFor(() => {
        expect(screen.getByText('Doctors')).toBeInTheDocument();
      });

      // The header should have an Add Doctor button
      const addButtons = screen.getAllByRole('button', { name: /add doctor/i });
      expect(addButtons.length).toBeGreaterThanOrEqual(1);
    });
  });
});
