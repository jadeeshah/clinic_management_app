import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import type { Doctor, Visit } from '../../types';

export interface DoctorScheduleProps {
  doctor: Doctor;
  visits?: Visit[];
  onSlotClick?: (date: string, time: string) => void;
  onVisitClick?: (visit: Visit) => void;
  compact?: boolean;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const generateTimeSlots = (startTime: string, endTime: string, intervalMinutes: number = 30): string[] => {
  const slots: string[] = [];
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  let currentHour = startHour;
  let currentMin = startMin;

  while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
    slots.push(`${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`);
    currentMin += intervalMinutes;
    if (currentMin >= 60) {
      currentHour += Math.floor(currentMin / 60);
      currentMin = currentMin % 60;
    }
  }

  return slots;
};

const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

const getWeekDates = (weekOffset: number): Date[] => {
  const dates: Date[] = [];
  const today = new Date();
  const currentDay = today.getDay();
  const firstDayOfWeek = new Date(today);
  firstDayOfWeek.setDate(today.getDate() - currentDay + (weekOffset * 7));

  for (let i = 0; i < 7; i++) {
    const date = new Date(firstDayOfWeek);
    date.setDate(firstDayOfWeek.getDate() + i);
    dates.push(date);
  }

  return dates;
};

const formatDateString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const DoctorSchedule: React.FC<DoctorScheduleProps> = ({
  doctor,
  visits = [],
  onSlotClick,
  onVisitClick,
  compact = false,
}) => {
  const theme = useTheme();
  const [weekOffset, setWeekOffset] = useState(0);

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  const timeSlots = useMemo(() => {
    const start = doctor.startTime || '09:00';
    const end = doctor.endTime || '17:00';
    return generateTimeSlots(start, end, 30);
  }, [doctor.startTime, doctor.endTime]);

  const availableDays = useMemo(() => {
    const days = doctor.availableDays || [];
    return days.map(day => DAYS_OF_WEEK.indexOf(day));
  }, [doctor.availableDays]);

  // Create a map of visits by date and time for quick lookup
  const visitMap = useMemo(() => {
    const map: Record<string, Visit> = {};
    visits.forEach(visit => {
      const key = `${visit.visitDate}-${visit.startTime}`;
      map[key] = visit;
    });
    return map;
  }, [visits]);

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPast = (date: Date, time: string): boolean => {
    const now = new Date();
    const slotDate = new Date(date);
    const [hours, minutes] = time.split(':').map(Number);
    slotDate.setHours(hours, minutes, 0, 0);
    return slotDate < now;
  };

  const handlePrevWeek = () => setWeekOffset(prev => prev - 1);
  const handleNextWeek = () => setWeekOffset(prev => prev + 1);
  const handleToday = () => setWeekOffset(0);

  const handleSlotClick = (date: Date, time: string) => {
    if (onSlotClick && !isPast(date, time)) {
      onSlotClick(formatDateString(date), time);
    }
  };

  const getVisitForSlot = (date: Date, time: string): Visit | null => {
    const dateStr = formatDateString(date);
    const key = `${dateStr}-${time}`;
    return visitMap[key] || null;
  };

  // Get week range display
  const weekRangeText = useMemo(() => {
    const start = weekDates[0];
    const end = weekDates[6];
    const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
    const year = end.getFullYear();

    if (startMonth === endMonth) {
      return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${year}`;
    }
    return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${year}`;
  }, [weekDates]);

  if (compact) {
    // Compact view showing just today's schedule
    const today = new Date();
    const dayIndex = today.getDay();
    const isAvailableToday = availableDays.includes(dayIndex);
    const todayStr = formatDateString(today);
    const todayVisits = visits.filter(v => v.visitDate === todayStr);

    return (
      <Box>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Today's Schedule ({DAYS_OF_WEEK[dayIndex]})
        </Typography>
        {!isAvailableToday ? (
          <Typography variant="body2" color="text.secondary">
            Not available today
          </Typography>
        ) : todayVisits.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No appointments scheduled
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {todayVisits.map((visit) => (
              <Paper
                key={visit.visitID}
                sx={{
                  p: 1,
                  cursor: onVisitClick ? 'pointer' : 'default',
                  bgcolor: visit.status === 'Completed' ? 'success.50' : 'primary.50',
                }}
                onClick={() => onVisitClick?.(visit)}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" fontWeight="medium">
                    {formatTime(visit.startTime)}
                  </Typography>
                  <Chip
                    label={visit.status}
                    size="small"
                    color={visit.status === 'Completed' ? 'success' : 'primary'}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {visit.patientName}
                </Typography>
              </Paper>
            ))}
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box>
      {/* Week Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={handlePrevWeek} size="small">
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="subtitle1" fontWeight="medium" sx={{ minWidth: 180, textAlign: 'center' }}>
            {weekRangeText}
          </Typography>
          <IconButton onClick={handleNextWeek} size="small">
            <ChevronRightIcon />
          </IconButton>
        </Box>
        <Tooltip title="Go to today">
          <IconButton onClick={handleToday} size="small" color={weekOffset === 0 ? 'primary' : 'default'}>
            <TodayIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Schedule Grid */}
      <Paper sx={{ overflow: 'auto' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: `60px repeat(7, 1fr)`, minWidth: 600 }}>
          {/* Header Row */}
          <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }} />
          {weekDates.map((date, index) => {
            const dayNum = date.getDay();
            const isAvailable = availableDays.includes(dayNum);
            const isTodayDate = isToday(date);

            return (
              <Box
                key={index}
                sx={{
                  p: 1,
                  textAlign: 'center',
                  borderBottom: 1,
                  borderLeft: 1,
                  borderColor: 'divider',
                  bgcolor: isTodayDate ? 'primary.50' : 'grey.50',
                }}
              >
                <Typography
                  variant="caption"
                  color={isAvailable ? 'text.primary' : 'text.disabled'}
                  fontWeight={isTodayDate ? 'bold' : 'normal'}
                >
                  {SHORT_DAYS[dayNum]}
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={isTodayDate ? 'bold' : 'medium'}
                  color={isAvailable ? 'text.primary' : 'text.disabled'}
                >
                  {date.getDate()}
                </Typography>
              </Box>
            );
          })}

          {/* Time Slots */}
          {timeSlots.map((time) => (
            <React.Fragment key={time}>
              {/* Time Label */}
              <Box
                sx={{
                  p: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderBottom: 1,
                  borderColor: 'divider',
                  bgcolor: 'grey.50',
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {formatTime(time)}
                </Typography>
              </Box>

              {/* Day Slots */}
              {weekDates.map((date, dayIndex) => {
                const dayNum = date.getDay();
                const isAvailable = availableDays.includes(dayNum);
                const visit = getVisitForSlot(date, time);
                const past = isPast(date, time);

                return (
                  <Box
                    key={dayIndex}
                    sx={{
                      p: 0.5,
                      minHeight: 40,
                      borderBottom: 1,
                      borderLeft: 1,
                      borderColor: 'divider',
                      bgcolor: !isAvailable
                        ? 'grey.100'
                        : past
                        ? 'grey.50'
                        : 'background.paper',
                      cursor: isAvailable && !past && !visit && onSlotClick ? 'pointer' : 'default',
                      '&:hover': isAvailable && !past && !visit && onSlotClick ? {
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                      } : {},
                    }}
                    onClick={() => isAvailable && !visit && handleSlotClick(date, time)}
                  >
                    {visit ? (
                      <Tooltip title={`${visit.patientName} - ${visit.visitType}`}>
                        <Chip
                          size="small"
                          icon={<PersonIcon />}
                          label={visit.patientName?.split(' ')[0] || 'Patient'}
                          color={
                            visit.status === 'Completed'
                              ? 'success'
                              : visit.status === 'InProgress'
                              ? 'warning'
                              : visit.status === 'Cancelled' || visit.status === 'NoShow'
                              ? 'error'
                              : 'primary'
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            onVisitClick?.(visit);
                          }}
                          sx={{
                            width: '100%',
                            justifyContent: 'flex-start',
                            cursor: onVisitClick ? 'pointer' : 'default',
                          }}
                        />
                      </Tooltip>
                    ) : !isAvailable ? (
                      <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10 }}>
                        -
                      </Typography>
                    ) : null}
                  </Box>
                );
              })}
            </React.Fragment>
          ))}
        </Box>
      </Paper>

      {/* Legend */}
      <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 16, height: 16, bgcolor: 'grey.100', border: 1, borderColor: 'divider' }} />
          <Typography variant="caption" color="text.secondary">Unavailable</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 16, height: 16, bgcolor: 'background.paper', border: 1, borderColor: 'divider' }} />
          <Typography variant="caption" color="text.secondary">Available</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Chip size="small" label="S" color="primary" sx={{ height: 16, fontSize: 10 }} />
          <Typography variant="caption" color="text.secondary">Scheduled</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Chip size="small" label="P" color="warning" sx={{ height: 16, fontSize: 10 }} />
          <Typography variant="caption" color="text.secondary">In Progress</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Chip size="small" label="C" color="success" sx={{ height: 16, fontSize: 10 }} />
          <Typography variant="caption" color="text.secondary">Completed</Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default DoctorSchedule;
