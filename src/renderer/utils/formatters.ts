/**
 * Shared formatting utilities for consistent data display across the application
 */

/**
 * Format a date string to a readable format
 * @param dateStr - ISO date string or Date-compatible string
 * @returns Formatted date like "Dec 3, 2024"
 */
export const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

/**
 * Format a date string to a long readable format
 * @param dateStr - ISO date string or Date-compatible string
 * @returns Formatted date like "December 3, 2024"
 */
export const formatDateLong = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

/**
 * Format a date with optional time
 * @param dateStr - ISO date string
 * @param timeStr - Optional time string (HH:mm format)
 * @returns Formatted string like "Dec 3, 2024 at 10:30"
 */
export const formatDateTime = (dateStr: string | null | undefined, timeStr?: string | null): string => {
  const date = formatDate(dateStr);
  if (date === '-') return '-';
  return timeStr ? `${date} at ${timeStr}` : date;
};

/**
 * Format a number as currency
 * @param amount - Numeric amount
 * @param currency - Currency symbol (default: 'Rs')
 * @returns Formatted currency like "Rs 1,500"
 */
export const formatCurrency = (amount: number | null | undefined, currency = 'Rs'): string => {
  if (amount === null || amount === undefined) return `${currency} 0`;
  return `${currency} ${amount.toLocaleString()}`;
};

/**
 * Format phone number (passthrough for now, can be enhanced)
 * @param phone - Phone number string
 * @returns Formatted phone number
 */
export const formatPhone = (phone: string | null | undefined): string => {
  if (!phone) return '-';
  return phone;
};

/**
 * Format a visit type to a readable label
 * @param type - Visit type enum value
 * @returns Human-readable visit type
 */
export const formatVisitType = (type: string | null | undefined): string => {
  if (!type) return '-';
  const types: Record<string, string> = {
    Evaluation: 'Evaluation',
    FollowUp: 'Follow-up',
    TherapySession: 'Therapy Session',
  };
  return types[type] || type;
};

/**
 * Format a status to a readable label
 * @param status - Status enum value
 * @returns Human-readable status
 */
export const formatStatus = (status: string | null | undefined): string => {
  if (!status) return '-';
  const statuses: Record<string, string> = {
    Scheduled: 'Scheduled',
    InProgress: 'In Progress',
    Completed: 'Completed',
    Cancelled: 'Cancelled',
    NoShow: 'No Show',
    Unpaid: 'Unpaid',
    PartiallyPaid: 'Partially Paid',
    Paid: 'Paid',
    Void: 'Void',
    Active: 'Active',
    Expired: 'Expired',
  };
  return statuses[status] || status;
};

/**
 * Format patient name from first and last name
 * @param firstName - First name
 * @param lastName - Last name (optional)
 * @returns Full name
 */
export const formatPatientName = (firstName: string | null | undefined, lastName?: string | null): string => {
  if (!firstName) return '-';
  return lastName ? `${firstName} ${lastName}` : firstName;
};

/**
 * Get relative time description (e.g., "2 days ago", "in 3 days")
 * @param dateStr - ISO date string
 * @returns Relative time description
 */
export const getRelativeTime = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '-';

  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 0) return `in ${diffDays} days`;
  return `${Math.abs(diffDays)} days ago`;
};

/**
 * Format a duration in minutes to a readable string
 * @param minutes - Duration in minutes
 * @returns Formatted duration like "45 min" or "1h 30min"
 */
export const formatDuration = (minutes: number | null | undefined): string => {
  if (!minutes) return '-';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}min`;
};
