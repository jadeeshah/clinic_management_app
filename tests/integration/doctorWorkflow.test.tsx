/**
 * Doctor Workflow Integration Tests
 * Tests the doctor management flow including:
 * - Viewing doctors list
 * - Creating new doctors
 * - Editing doctor information
 * - Doctor availability
 */

import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, createMockDoctor } from '../utils/testUtils';
import Doctors from '../../src/renderer/pages/Doctors';
import { mockElectronAPI } from '../setupTests';

const mockDoctors = [
  createMockDoctor({
    doctorID: 1,
    firstName: 'Sarah',
    lastName: 'Khan',
    specialization: 'Orthopedic Rehabilitation',
    sessionCharge: 2000,
    isActive: true,
  }),
  createMockDoctor({
    doctorID: 2,
    firstName: 'Ahmed',
    lastName: 'Ali',
    specialization: 'Sports Medicine',
    sessionCharge: 2500,
    isActive: true,
  }),
];

describe('Doctor Workflow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Doctor List Display', () => {
    it('should display doctors list from API', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-doctors') {
          return Promise.resolve({ success: true, data: mockDoctors });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Doctors />);

      await waitFor(() => {
        expect(screen.getByText('Sarah Khan')).toBeInTheDocument();
        expect(screen.getByText('Ahmed Ali')).toBeInTheDocument();
      });
    });

    it('should display doctor specializations', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-doctors') {
          return Promise.resolve({ success: true, data: mockDoctors });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Doctors />);

      await waitFor(() => {
        expect(screen.getByText('Sarah Khan')).toBeInTheDocument();
      });

      expect(screen.getByText('Orthopedic Rehabilitation')).toBeInTheDocument();
      expect(screen.getByText('Sports Medicine')).toBeInTheDocument();
    });

    it('should show empty state when no doctors exist', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-doctors') {
          return Promise.resolve({ success: true, data: [] });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Doctors />);

      await waitFor(() => {
        expect(screen.getByText('No Doctors Found')).toBeInTheDocument();
      });
    });
  });

  describe('Create Doctor Flow', () => {
    it('should open create doctor dialog', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-doctors') {
          return Promise.resolve({ success: true, data: mockDoctors });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Doctors />);

      await waitFor(() => {
        expect(screen.getByText('Sarah Khan')).toBeInTheDocument();
      });

      // Click Add Doctor button
      const addButton = screen.getByRole('button', { name: /add doctor/i });
      await userEvent.click(addButton);

      // Verify dialog opens
      await waitFor(() => {
        expect(screen.getByText('Add Doctor')).toBeInTheDocument();
      });
    });

    it('should have required form fields in dialog', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-doctors') {
          return Promise.resolve({ success: true, data: mockDoctors });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Doctors />);

      await waitFor(() => {
        expect(screen.getByText('Sarah Khan')).toBeInTheDocument();
      });

      // Click Add Doctor button
      const addButton = screen.getByRole('button', { name: /add doctor/i });
      await userEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add Doctor')).toBeInTheDocument();
      });

      // Verify form fields exist
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/session charge/i)).toBeInTheDocument();
    });
  });

  describe('Edit Doctor Flow', () => {
    it('should open edit dialog when clicking edit button', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-doctors') {
          return Promise.resolve({ success: true, data: mockDoctors });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Doctors />);

      await waitFor(() => {
        expect(screen.getByText('Sarah Khan')).toBeInTheDocument();
      });

      // Click edit button for first doctor
      const editButtons = screen.getAllByRole('button', { name: /edit doctor/i });
      await userEvent.click(editButtons[0]);

      // Verify dialog opens with edit title
      await waitFor(() => {
        expect(screen.getByText('Edit Doctor')).toBeInTheDocument();
      });
    });

    it('should pre-fill form with doctor data when editing', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-doctors') {
          return Promise.resolve({ success: true, data: mockDoctors });
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Doctors />);

      await waitFor(() => {
        expect(screen.getByText('Sarah Khan')).toBeInTheDocument();
      });

      // Click edit button for first doctor
      const editButtons = screen.getAllByRole('button', { name: /edit doctor/i });
      await userEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Edit Doctor')).toBeInTheDocument();
      });

      // Verify form is pre-filled
      expect(screen.getByLabelText(/first name/i)).toHaveValue('Sarah');
      expect(screen.getByLabelText(/last name/i)).toHaveValue('Khan');
    });
  });

  describe('API Error Handling', () => {
    it('should handle loading errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-doctors') {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({ success: true, data: null });
      });

      render(<Doctors />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });
});
