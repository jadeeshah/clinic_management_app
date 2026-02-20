/**
 * Time validation utilities for visit scheduling
 */

import type { Doctor } from '../../types';

/**
 * Parses a time string (HH:MM) into minutes from midnight
 */
export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Day name mapping (0 = Sunday)
 */
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Gets the day name for a date string (YYYY-MM-DD)
 */
export const getDayName = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00');
  return DAY_NAMES[date.getDay()];
};

/**
 * Checks if a time is within the doctor's working hours
 */
export const isTimeWithinDoctorHours = (
  time: string,
  doctor: Doctor,
  visitDate: string
): { valid: boolean; message?: string } => {
  // If doctor has no schedule set, allow any time
  if (!doctor.startTime || !doctor.endTime) {
    return { valid: true };
  }

  // Check if it's an available day
  const dayName = getDayName(visitDate);
  const availableDays = parseAvailableDays(doctor.availableDays);

  if (availableDays.length > 0 && !availableDays.includes(dayName)) {
    return {
      valid: false,
      message: `Dr. ${doctor.firstName} is not available on ${dayName}s. Available days: ${availableDays.join(', ')}`,
    };
  }

  // Check time range
  const visitMinutes = timeToMinutes(time);
  const startMinutes = timeToMinutes(doctor.startTime);
  const endMinutes = timeToMinutes(doctor.endTime);

  if (visitMinutes < startMinutes) {
    return {
      valid: false,
      message: `Time is before Dr. ${doctor.firstName}'s start time (${doctor.startTime})`,
    };
  }

  if (visitMinutes >= endMinutes) {
    return {
      valid: false,
      message: `Time is at or after Dr. ${doctor.firstName}'s end time (${doctor.endTime})`,
    };
  }

  return { valid: true };
};

/**
 * Parses availableDays from various formats (string, JSON string, array)
 */
export const parseAvailableDays = (availableDays: string | string[] | undefined | null): string[] => {
  if (!availableDays) return [];

  if (Array.isArray(availableDays)) {
    return availableDays;
  }

  if (typeof availableDays === 'string') {
    try {
      const parsed = JSON.parse(availableDays);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      // If not valid JSON, treat as comma-separated
      return availableDays.split(',').map(d => d.trim()).filter(Boolean);
    }
  }

  return [];
};

/**
 * Gets a formatted string describing the doctor's availability
 */
export const getDoctorAvailabilityText = (doctor: Doctor): string => {
  const parts: string[] = [];

  if (doctor.startTime && doctor.endTime) {
    parts.push(`${doctor.startTime} - ${doctor.endTime}`);
  }

  const days = parseAvailableDays(doctor.availableDays);
  if (days.length > 0) {
    // Abbreviate day names
    const abbreviated = days.map(d => d.substring(0, 3));
    parts.push(abbreviated.join(', '));
  }

  return parts.join(' | ') || 'No schedule set';
};
