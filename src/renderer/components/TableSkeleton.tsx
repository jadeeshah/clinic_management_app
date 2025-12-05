import React from 'react';
import { TableBody, TableRow, TableCell, Skeleton } from '@mui/material';

export interface TableSkeletonProps {
  /** Number of columns to display */
  columns: number;
  /** Number of skeleton rows to show (default: 5) */
  rows?: number;
  /** Whether to show action column with smaller skeleton (default: false) */
  hasActions?: boolean;
}

/**
 * TableSkeleton component for loading states in tables
 * Shows skeleton rows while data is being fetched
 * Renders as a TableBody element for proper table structure
 */
const TableSkeleton: React.FC<TableSkeletonProps> = ({
  columns,
  rows = 5,
  hasActions = false
}) => {
  const totalColumns = hasActions ? columns + 1 : columns;

  return (
    <TableBody data-testid="table-skeleton">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <TableRow key={rowIndex}>
          {Array.from({ length: totalColumns }).map((_, colIndex) => (
            <TableCell key={colIndex}>
              {hasActions && colIndex === totalColumns - 1 ? (
                // Smaller skeleton for action buttons
                <Skeleton variant="circular" width={32} height={32} />
              ) : (
                <Skeleton
                  variant="text"
                  width={colIndex === 0 ? '80%' : '60%'}
                  animation="wave"
                />
              )}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
};

export default TableSkeleton;
