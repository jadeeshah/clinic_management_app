import React from 'react';
import {
  Box,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  PlayArrow as StartIcon,
  CheckCircle as CompleteIcon,
  Cancel as CancelIcon,
  EventBusy as NoShowIcon,
} from '@mui/icons-material';
import type { VisitStatus } from '../../types';

export interface VisitStatusWorkflowProps {
  currentStatus: VisitStatus;
  onStatusChange: (newStatus: VisitStatus) => void;
  isLoading?: boolean;
}

const statusSteps: { status: VisitStatus; label: string; icon: React.ReactNode }[] = [
  { status: 'Scheduled', label: 'Scheduled', icon: <ScheduleIcon /> },
  { status: 'InProgress', label: 'In Progress', icon: <StartIcon /> },
  { status: 'Completed', label: 'Completed', icon: <CompleteIcon /> },
];

const getActiveStep = (status: VisitStatus): number => {
  if (status === 'Scheduled') return 0;
  if (status === 'InProgress') return 1;
  if (status === 'Completed') return 2;
  return -1; // Cancelled or NoShow
};

const getNextAction = (status: VisitStatus): { label: string; nextStatus: VisitStatus; color: 'primary' | 'success' | 'warning' } | null => {
  if (status === 'Scheduled') {
    return { label: 'Start Session', nextStatus: 'InProgress', color: 'warning' };
  }
  if (status === 'InProgress') {
    return { label: 'Mark Complete', nextStatus: 'Completed', color: 'success' };
  }
  return null;
};

const VisitStatusWorkflow: React.FC<VisitStatusWorkflowProps> = ({
  currentStatus,
  onStatusChange,
  isLoading = false,
}) => {
  const activeStep = getActiveStep(currentStatus);
  const nextAction = getNextAction(currentStatus);
  const isFinalStatus = currentStatus === 'Completed' || currentStatus === 'Cancelled' || currentStatus === 'NoShow';

  if (currentStatus === 'Cancelled') {
    return (
      <Box sx={{ textAlign: 'center', py: 2 }}>
        <CancelIcon sx={{ fontSize: 48, color: 'error.main', mb: 1 }} />
        <Typography color="error.main" fontWeight="medium">
          Visit Cancelled
        </Typography>
      </Box>
    );
  }

  if (currentStatus === 'NoShow') {
    return (
      <Box sx={{ textAlign: 'center', py: 2 }}>
        <NoShowIcon sx={{ fontSize: 48, color: 'warning.main', mb: 1 }} />
        <Typography color="warning.main" fontWeight="medium">
          Patient No Show
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Stepper activeStep={activeStep} alternativeLabel>
        {statusSteps.map((step) => (
          <Step key={step.status} completed={activeStep > statusSteps.findIndex(s => s.status === step.status)}>
            <StepLabel
              StepIconComponent={() => (
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: activeStep >= statusSteps.findIndex(s => s.status === step.status)
                      ? step.status === currentStatus
                        ? 'primary.main'
                        : 'success.main'
                      : 'grey.300',
                    color: activeStep >= statusSteps.findIndex(s => s.status === step.status)
                      ? 'white'
                      : 'grey.500',
                  }}
                >
                  {React.cloneElement(step.icon as React.ReactElement<{ fontSize?: 'small' | 'medium' | 'large' }>, { fontSize: 'small' })}
                </Box>
              )}
            >
              {step.label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      {!isFinalStatus && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
          {nextAction && (
            <Button
              variant="contained"
              color={nextAction.color}
              onClick={() => onStatusChange(nextAction.nextStatus)}
              disabled={isLoading}
              size="large"
            >
              {nextAction.label}
            </Button>
          )}
          {currentStatus === 'Scheduled' && (
            <>
              <Button
                variant="outlined"
                color="error"
                onClick={() => onStatusChange('Cancelled')}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="outlined"
                color="warning"
                onClick={() => onStatusChange('NoShow')}
                disabled={isLoading}
              >
                No Show
              </Button>
            </>
          )}
        </Box>
      )}
    </Box>
  );
};

export default VisitStatusWorkflow;
