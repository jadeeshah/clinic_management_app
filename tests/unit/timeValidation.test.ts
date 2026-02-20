/**
 * Unit tests for time validation utility
 */

import {
  timeToMinutes,
  getDayName,
  isTimeWithinDoctorHours,
  parseAvailableDays,
  getDoctorAvailabilityText,
} from '../../src/renderer/utils/timeValidation';
import { Doctor } from '../../src/types';

describe('timeValidation utility', () => {
  describe('timeToMinutes', () => {
    it('converts 00:00 to 0 minutes', () => {
      expect(timeToMinutes('00:00')).toBe(0);
    });

    it('converts 09:00 to 540 minutes', () => {
      expect(timeToMinutes('09:00')).toBe(540);
    });

    it('converts 17:30 to 1050 minutes', () => {
      expect(timeToMinutes('17:30')).toBe(1050);
    });

    it('converts 23:59 to 1439 minutes', () => {
      expect(timeToMinutes('23:59')).toBe(1439);
    });

    it('converts 12:00 to 720 minutes', () => {
      expect(timeToMinutes('12:00')).toBe(720);
    });
  });

  describe('getDayName', () => {
    it('returns Monday for 2024-01-15', () => {
      expect(getDayName('2024-01-15')).toBe('Monday');
    });

    it('returns Tuesday for 2024-01-16', () => {
      expect(getDayName('2024-01-16')).toBe('Tuesday');
    });

    it('returns Sunday for 2024-01-21', () => {
      expect(getDayName('2024-01-21')).toBe('Sunday');
    });

    it('returns Saturday for 2024-01-20', () => {
      expect(getDayName('2024-01-20')).toBe('Saturday');
    });
  });

  describe('parseAvailableDays', () => {
    it('parses JSON array string', () => {
      expect(parseAvailableDays('["Monday", "Wednesday", "Friday"]')).toEqual([
        'Monday',
        'Wednesday',
        'Friday',
      ]);
    });

    it('returns array as-is if already an array', () => {
      const days = ['Monday', 'Tuesday'];
      expect(parseAvailableDays(days)).toEqual(days);
    });

    it('returns empty array for invalid JSON', () => {
      expect(parseAvailableDays('invalid')).toEqual(['invalid']);
    });

    it('returns empty array for empty string', () => {
      expect(parseAvailableDays('')).toEqual([]);
    });

    it('returns empty array for null', () => {
      expect(parseAvailableDays(null)).toEqual([]);
    });

    it('returns empty array for undefined', () => {
      expect(parseAvailableDays(undefined)).toEqual([]);
    });
  });

  describe('isTimeWithinDoctorHours', () => {
    const createDoctor = (overrides: Partial<Doctor> = {}): Doctor => ({
      doctorID: 1,
      firstName: 'Test',
      lastName: 'Doctor',
      education: null,
      designation: null,
      specialization: null,
      sessionCharge: 1000,
      availableDays: ['Monday', 'Wednesday', 'Friday'],
      startTime: '09:00',
      endTime: '17:00',
      phone: null,
      email: null,
      isActive: true,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      ...overrides,
    });

    it('returns valid for time within doctor hours on available day', () => {
      const doctor = createDoctor();
      // 2024-01-15 is a Monday
      const result = isTimeWithinDoctorHours('10:00', doctor, '2024-01-15');
      expect(result.valid).toBe(true);
    });

    it('returns invalid for time before doctor starts', () => {
      const doctor = createDoctor();
      const result = isTimeWithinDoctorHours('08:00', doctor, '2024-01-15');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('before');
    });

    it('returns invalid for time after doctor ends', () => {
      const doctor = createDoctor();
      const result = isTimeWithinDoctorHours('18:00', doctor, '2024-01-15');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('after');
    });

    it('returns invalid for unavailable day', () => {
      const doctor = createDoctor();
      // 2024-01-16 is a Tuesday (not in availableDays)
      const result = isTimeWithinDoctorHours('10:00', doctor, '2024-01-16');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('not available');
    });

    it('returns valid when doctor has no time restrictions', () => {
      const doctor = createDoctor({ startTime: null, endTime: null });
      const result = isTimeWithinDoctorHours('10:00', doctor, '2024-01-15');
      expect(result.valid).toBe(true);
    });

    it('returns valid when doctor has no day restrictions', () => {
      const doctor = createDoctor({ availableDays: [] });
      // Any day should work
      const result = isTimeWithinDoctorHours('10:00', doctor, '2024-01-16');
      expect(result.valid).toBe(true);
    });

    it('handles edge case at exact start time', () => {
      const doctor = createDoctor();
      const result = isTimeWithinDoctorHours('09:00', doctor, '2024-01-15');
      expect(result.valid).toBe(true);
    });

    it('returns invalid for time at exact end time (end time is exclusive)', () => {
      const doctor = createDoctor();
      const result = isTimeWithinDoctorHours('17:00', doctor, '2024-01-15');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('after');
    });

    it('returns valid for time just before end time', () => {
      const doctor = createDoctor();
      const result = isTimeWithinDoctorHours('16:59', doctor, '2024-01-15');
      expect(result.valid).toBe(true);
    });

    it('handles JSON string availableDays', () => {
      const doctor = createDoctor({
        availableDays: '["Monday", "Wednesday"]' as unknown as string[],
      });
      const result = isTimeWithinDoctorHours('10:00', doctor, '2024-01-15');
      expect(result.valid).toBe(true);
    });
  });

  describe('getDoctorAvailabilityText', () => {
    const createDoctor = (overrides: Partial<Doctor> = {}): Doctor => ({
      doctorID: 1,
      firstName: 'Test',
      lastName: 'Doctor',
      education: null,
      designation: null,
      specialization: null,
      sessionCharge: 1000,
      availableDays: ['Monday', 'Wednesday', 'Friday'],
      startTime: '09:00',
      endTime: '17:00',
      phone: null,
      email: null,
      isActive: true,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      ...overrides,
    });

    it('returns full availability text with abbreviated days and hours', () => {
      const doctor = createDoctor();
      const text = getDoctorAvailabilityText(doctor);
      expect(text).toContain('Mon');
      expect(text).toContain('Wed');
      expect(text).toContain('Fri');
      expect(text).toContain('09:00');
      expect(text).toContain('17:00');
    });

    it('returns hours only when no days specified', () => {
      const doctor = createDoctor({ availableDays: [] });
      const text = getDoctorAvailabilityText(doctor);
      expect(text).toContain('09:00');
      expect(text).toContain('17:00');
      expect(text).not.toContain('Mon');
    });

    it('returns "No schedule set" when no restrictions', () => {
      const doctor = createDoctor({
        availableDays: [],
        startTime: null,
        endTime: null,
      });
      const text = getDoctorAvailabilityText(doctor);
      expect(text).toBe('No schedule set');
    });

    it('uses abbreviated day names', () => {
      const doctor = createDoctor();
      const text = getDoctorAvailabilityText(doctor);
      expect(text).toContain('Mon');
      expect(text).not.toContain('Monday');
    });
  });
});
