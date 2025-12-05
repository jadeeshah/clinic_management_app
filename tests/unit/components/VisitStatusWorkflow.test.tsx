/**
 * Unit tests for VisitStatusWorkflow component
 */

import React from 'react';
import { render, screen, fireEvent } from '../../utils/testUtils';
import VisitStatusWorkflow from '../../../src/renderer/components/VisitStatusWorkflow';
import type { VisitStatus } from '../../../src/types';

describe('VisitStatusWorkflow', () => {
  describe('Scheduled status', () => {
    it('renders stepper with Scheduled as active step', () => {
      const onStatusChange = jest.fn();
      render(
        <VisitStatusWorkflow
          currentStatus="Scheduled"
          onStatusChange={onStatusChange}
        />
      );

      expect(screen.getByText('Scheduled')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('shows Start Session button', () => {
      const onStatusChange = jest.fn();
      render(
        <VisitStatusWorkflow
          currentStatus="Scheduled"
          onStatusChange={onStatusChange}
        />
      );

      expect(screen.getByRole('button', { name: 'Start Session' })).toBeInTheDocument();
    });

    it('shows Cancel and No Show buttons', () => {
      const onStatusChange = jest.fn();
      render(
        <VisitStatusWorkflow
          currentStatus="Scheduled"
          onStatusChange={onStatusChange}
        />
      );

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'No Show' })).toBeInTheDocument();
    });

    it('calls onStatusChange with InProgress when Start Session is clicked', () => {
      const onStatusChange = jest.fn();
      render(
        <VisitStatusWorkflow
          currentStatus="Scheduled"
          onStatusChange={onStatusChange}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Start Session' }));
      expect(onStatusChange).toHaveBeenCalledWith('InProgress');
    });

    it('calls onStatusChange with Cancelled when Cancel is clicked', () => {
      const onStatusChange = jest.fn();
      render(
        <VisitStatusWorkflow
          currentStatus="Scheduled"
          onStatusChange={onStatusChange}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(onStatusChange).toHaveBeenCalledWith('Cancelled');
    });

    it('calls onStatusChange with NoShow when No Show is clicked', () => {
      const onStatusChange = jest.fn();
      render(
        <VisitStatusWorkflow
          currentStatus="Scheduled"
          onStatusChange={onStatusChange}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'No Show' }));
      expect(onStatusChange).toHaveBeenCalledWith('NoShow');
    });
  });

  describe('InProgress status', () => {
    it('renders with InProgress as active step', () => {
      const onStatusChange = jest.fn();
      render(
        <VisitStatusWorkflow
          currentStatus="InProgress"
          onStatusChange={onStatusChange}
        />
      );

      expect(screen.getByText('In Progress')).toBeInTheDocument();
    });

    it('shows Mark Complete button', () => {
      const onStatusChange = jest.fn();
      render(
        <VisitStatusWorkflow
          currentStatus="InProgress"
          onStatusChange={onStatusChange}
        />
      );

      expect(screen.getByRole('button', { name: 'Mark Complete' })).toBeInTheDocument();
    });

    it('does not show Cancel or No Show buttons', () => {
      const onStatusChange = jest.fn();
      render(
        <VisitStatusWorkflow
          currentStatus="InProgress"
          onStatusChange={onStatusChange}
        />
      );

      expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'No Show' })).not.toBeInTheDocument();
    });

    it('calls onStatusChange with Completed when Mark Complete is clicked', () => {
      const onStatusChange = jest.fn();
      render(
        <VisitStatusWorkflow
          currentStatus="InProgress"
          onStatusChange={onStatusChange}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Mark Complete' }));
      expect(onStatusChange).toHaveBeenCalledWith('Completed');
    });
  });

  describe('Completed status', () => {
    it('renders with Completed as active step', () => {
      const onStatusChange = jest.fn();
      render(
        <VisitStatusWorkflow
          currentStatus="Completed"
          onStatusChange={onStatusChange}
        />
      );

      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('does not show any action buttons for final status', () => {
      const onStatusChange = jest.fn();
      render(
        <VisitStatusWorkflow
          currentStatus="Completed"
          onStatusChange={onStatusChange}
        />
      );

      expect(screen.queryByRole('button', { name: 'Start Session' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Mark Complete' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
    });
  });

  describe('Cancelled status', () => {
    it('displays Visit Cancelled message', () => {
      const onStatusChange = jest.fn();
      render(
        <VisitStatusWorkflow
          currentStatus="Cancelled"
          onStatusChange={onStatusChange}
        />
      );

      expect(screen.getByText('Visit Cancelled')).toBeInTheDocument();
    });

    it('does not show stepper for cancelled visits', () => {
      const onStatusChange = jest.fn();
      render(
        <VisitStatusWorkflow
          currentStatus="Cancelled"
          onStatusChange={onStatusChange}
        />
      );

      // Stepper steps should not be visible
      expect(screen.queryByText('In Progress')).not.toBeInTheDocument();
    });

    it('does not show action buttons', () => {
      const onStatusChange = jest.fn();
      render(
        <VisitStatusWorkflow
          currentStatus="Cancelled"
          onStatusChange={onStatusChange}
        />
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('NoShow status', () => {
    it('displays Patient No Show message', () => {
      const onStatusChange = jest.fn();
      render(
        <VisitStatusWorkflow
          currentStatus="NoShow"
          onStatusChange={onStatusChange}
        />
      );

      expect(screen.getByText('Patient No Show')).toBeInTheDocument();
    });

    it('does not show stepper for no-show visits', () => {
      const onStatusChange = jest.fn();
      render(
        <VisitStatusWorkflow
          currentStatus="NoShow"
          onStatusChange={onStatusChange}
        />
      );

      expect(screen.queryByText('In Progress')).not.toBeInTheDocument();
    });

    it('does not show action buttons', () => {
      const onStatusChange = jest.fn();
      render(
        <VisitStatusWorkflow
          currentStatus="NoShow"
          onStatusChange={onStatusChange}
        />
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('Loading state', () => {
    it('disables buttons when isLoading is true', () => {
      const onStatusChange = jest.fn();
      render(
        <VisitStatusWorkflow
          currentStatus="Scheduled"
          onStatusChange={onStatusChange}
          isLoading={true}
        />
      );

      expect(screen.getByRole('button', { name: 'Start Session' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'No Show' })).toBeDisabled();
    });

    it('enables buttons when isLoading is false', () => {
      const onStatusChange = jest.fn();
      render(
        <VisitStatusWorkflow
          currentStatus="Scheduled"
          onStatusChange={onStatusChange}
          isLoading={false}
        />
      );

      expect(screen.getByRole('button', { name: 'Start Session' })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: 'Cancel' })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: 'No Show' })).not.toBeDisabled();
    });
  });
});
