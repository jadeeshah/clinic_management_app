/**
 * Integration tests for Investigation workflow
 */

import React from 'react';
import { screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, createMockDoctor, createMockInvestigation } from '../utils/testUtils';
import { mockElectronAPI } from '../setupTests';
import { InvestigationForm } from '../../src/renderer/components';

describe('Investigation Workflow', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    onSave: jest.fn(),
    patientID: 1,
    investigation: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockElectronAPI.database.execute.mockImplementation((operation: string) => {
      if (operation === 'get-doctors') {
        return Promise.resolve({
          success: true,
          data: [
            createMockDoctor({ doctorID: 1, firstName: 'Sarah', lastName: 'Khan' }),
            createMockDoctor({ doctorID: 2, firstName: 'Ahmed', lastName: 'Ali', isActive: false }),
          ],
        });
      }
      if (operation === 'create-investigation') {
        return Promise.resolve({ success: true, data: { investigationID: 1 } });
      }
      if (operation === 'update-investigation') {
        return Promise.resolve({ success: true });
      }
      return Promise.resolve({ success: true, data: null });
    });
  });

  describe('InvestigationForm Component', () => {
    it('renders form dialog with title', async () => {
      render(<InvestigationForm {...defaultProps} />);

      expect(screen.getByText('New Investigation')).toBeInTheDocument();
    });

    it('renders all form fields', async () => {
      render(<InvestigationForm {...defaultProps} />);

      // Check for main fields - use getAllByText since MUI renders labels multiple times
      expect(screen.getAllByText('Investigation Type').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Date').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Ordered By Doctor').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Status').length).toBeGreaterThan(0);
    });

    it('loads doctors on mount', async () => {
      render(<InvestigationForm {...defaultProps} />);

      await waitFor(() => {
        expect(mockElectronAPI.database.execute).toHaveBeenCalledWith('get-doctors');
      });
    });

    it('shows Create button for new investigation', async () => {
      render(<InvestigationForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Create/i })).toBeInTheDocument();
    });

    it('shows Update button for existing investigation', async () => {
      const existingInvestigation = createMockInvestigation();
      render(
        <InvestigationForm {...defaultProps} investigation={existingInvestigation} />
      );

      expect(screen.getByText('Edit Investigation')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Update/i })).toBeInTheDocument();
    });

    it('shows Cancel button', async () => {
      render(<InvestigationForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });

    it('calls onClose when cancel is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      const onClose = jest.fn();

      render(<InvestigationForm {...defaultProps} onClose={onClose} />);

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('validates required fields - shows error without investigation type', async () => {
      const user = userEvent.setup({ delay: null });
      render(<InvestigationForm {...defaultProps} />);

      // Try to submit without selecting investigation type
      const createButton = screen.getByRole('button', { name: /Create/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/Please select an investigation type/i)).toBeInTheDocument();
      });
    });

    it('populates form when editing existing investigation', async () => {
      const existingInvestigation = createMockInvestigation({
        investigationID: 5,
        investigationType: 'MRI',
        bodyPart: 'Right Knee',
        findings: 'ACL tear detected',
        status: 'Completed',
      });

      render(
        <InvestigationForm {...defaultProps} investigation={existingInvestigation} />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Right Knee')).toBeInTheDocument();
        expect(screen.getByDisplayValue('ACL tear detected')).toBeInTheDocument();
      });
    });

    it('displays error when API fails', async () => {
      mockElectronAPI.database.execute.mockImplementation((operation: string) => {
        if (operation === 'get-doctors') {
          return Promise.resolve({ success: true, data: [] });
        }
        if (operation === 'create-investigation') {
          return Promise.resolve({ success: false, error: 'Database error' });
        }
        return Promise.resolve({ success: true, data: null });
      });

      const user = userEvent.setup({ delay: null });
      render(<InvestigationForm {...defaultProps} />);

      // Find and click the investigation type dropdown
      const typeDropdown = screen.getAllByRole('combobox')[0];
      await user.click(typeDropdown);

      // Select X-Ray from listbox
      const listbox = await screen.findByRole('listbox');
      const xrayOption = within(listbox).getByText('X-Ray');
      await user.click(xrayOption);

      // Submit
      const createButton = screen.getByRole('button', { name: /Create/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/Database error/i)).toBeInTheDocument();
      });
    });

    it('calls create-investigation on form submission', async () => {
      const user = userEvent.setup({ delay: null });
      const onSave = jest.fn();
      const onClose = jest.fn();

      render(<InvestigationForm {...defaultProps} onSave={onSave} onClose={onClose} />);

      // Wait for doctors to load
      await waitFor(() => {
        expect(mockElectronAPI.database.execute).toHaveBeenCalledWith('get-doctors');
      });

      // Select investigation type using combobox
      const typeDropdown = screen.getAllByRole('combobox')[0];
      await user.click(typeDropdown);

      const listbox = await screen.findByRole('listbox');
      const xrayOption = within(listbox).getByText('X-Ray');
      await user.click(xrayOption);

      // Fill body part
      const bodyPartInput = screen.getByPlaceholderText(/Lumbar Spine/i);
      await user.type(bodyPartInput, 'Left Shoulder');

      // Submit
      const createButton = screen.getByRole('button', { name: /Create/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(mockElectronAPI.database.execute).toHaveBeenCalledWith(
          'create-investigation',
          expect.objectContaining({
            patientID: 1,
            investigationType: 'X-Ray',
            bodyPart: 'Left Shoulder',
          })
        );
      });
    });

    it('calls update-investigation when editing', async () => {
      const user = userEvent.setup({ delay: null });
      const existingInvestigation = createMockInvestigation({
        investigationID: 5,
        investigationType: 'X-Ray',
        bodyPart: 'Lumbar Spine',
      });

      render(
        <InvestigationForm {...defaultProps} investigation={existingInvestigation} />
      );

      // Wait for form to populate
      await waitFor(() => {
        expect(screen.getByDisplayValue('Lumbar Spine')).toBeInTheDocument();
      });

      // Update body part
      const bodyPartInput = screen.getByDisplayValue('Lumbar Spine');
      await user.clear(bodyPartInput);
      await user.type(bodyPartInput, 'Thoracic Spine');

      // Submit
      const updateButton = screen.getByRole('button', { name: /Update/i });
      await user.click(updateButton);

      await waitFor(() => {
        expect(mockElectronAPI.database.execute).toHaveBeenCalledWith(
          'update-investigation',
          expect.objectContaining({
            investigationID: 5,
            bodyPart: 'Thoracic Spine',
          })
        );
      });
    });

    it('calls onSave and onClose on successful submission', async () => {
      const user = userEvent.setup({ delay: null });
      const onSave = jest.fn();
      const onClose = jest.fn();

      render(<InvestigationForm {...defaultProps} onSave={onSave} onClose={onClose} />);

      // Select investigation type
      const typeDropdown = screen.getAllByRole('combobox')[0];
      await user.click(typeDropdown);

      const listbox = await screen.findByRole('listbox');
      const xrayOption = within(listbox).getByText('X-Ray');
      await user.click(xrayOption);

      // Submit
      const createButton = screen.getByRole('button', { name: /Create/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(onSave).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe('Investigation Types', () => {
    const investigationTypes = [
      'X-Ray',
      'CT Scan',
      'MRI',
      'Ultrasound',
      'Blood Test',
      'ECG',
    ];

    it('displays all investigation types in dropdown', async () => {
      const user = userEvent.setup({ delay: null });
      render(<InvestigationForm {...defaultProps} />);

      // Open the dropdown
      const typeDropdown = screen.getAllByRole('combobox')[0];
      await user.click(typeDropdown);

      const listbox = await screen.findByRole('listbox');

      for (const type of investigationTypes) {
        expect(within(listbox).getByText(type)).toBeInTheDocument();
      }
    });
  });

  describe('Investigation Status', () => {
    const statuses = ['Ordered', 'Scheduled', 'Completed', 'Reviewed'];

    it('displays all status options in dropdown', async () => {
      const user = userEvent.setup({ delay: null });
      render(<InvestigationForm {...defaultProps} />);

      // Find and open the status dropdown (second combobox)
      const comboboxes = screen.getAllByRole('combobox');
      const statusDropdown = comboboxes[comboboxes.length - 1]; // Status is last
      await user.click(statusDropdown);

      const listbox = await screen.findByRole('listbox');

      for (const status of statuses) {
        expect(within(listbox).getByText(status)).toBeInTheDocument();
      }
    });
  });
});
