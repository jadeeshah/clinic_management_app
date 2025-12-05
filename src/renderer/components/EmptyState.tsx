import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import {
  SearchOff as SearchOffIcon,
  FilterAltOff as FilterOffIcon,
  Add as AddIcon,
} from '@mui/icons-material';

export interface EmptyStateProps {
  /** Main title for the empty state */
  title: string;
  /** Optional description text */
  description?: string;
  /** Number of active filters (shows filter-related messaging if > 0) */
  filterCount?: number;
  /** Callback when "Clear Filters" is clicked */
  onClearFilters?: () => void;
  /** Label for the primary action button */
  actionLabel?: string;
  /** Callback when primary action is clicked */
  onAction?: () => void;
  /** Custom icon to display */
  icon?: React.ReactNode;
  /** Whether to show in a Paper container */
  elevated?: boolean;
}

/**
 * EmptyState component for consistent "no data" displays
 * Provides context-aware messaging based on filter state
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  filterCount = 0,
  onClearFilters,
  actionLabel,
  onAction,
  icon,
  elevated = true,
}) => {
  const hasFilters = filterCount > 0;

  // Determine the icon to show
  const displayIcon = icon || (hasFilters ? (
    <FilterOffIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
  ) : (
    <SearchOffIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
  ));

  // Build description with filter context
  const displayDescription = description || (hasFilters
    ? `No results match your ${filterCount} active filter${filterCount > 1 ? 's' : ''}. Try adjusting or clearing filters.`
    : undefined
  );

  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 6,
        px: 3,
        textAlign: 'center',
      }}
    >
      {displayIcon}

      <Typography variant="h6" color="text.secondary" gutterBottom>
        {title}
      </Typography>

      {displayDescription && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 3, maxWidth: 400 }}
        >
          {displayDescription}
        </Typography>
      )}

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
        {hasFilters && onClearFilters && (
          <Button
            variant="outlined"
            startIcon={<FilterOffIcon />}
            onClick={onClearFilters}
          >
            Clear Filters
          </Button>
        )}

        {actionLabel && onAction && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAction}
          >
            {actionLabel}
          </Button>
        )}
      </Box>
    </Box>
  );

  if (elevated) {
    return <Paper>{content}</Paper>;
  }

  return content;
};

export default EmptyState;
