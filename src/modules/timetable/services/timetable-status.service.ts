import createHttpError from 'http-errors';
import { DateTime } from 'luxon';
import { WeekDay, Timetable } from '@prisma/client';
import { timetableRepository } from '../repositories/timetable.repository';

const weekdayToEnum = (weekday: number): WeekDay => {
  // Luxon: Monday=1 .. Sunday=7
  switch (weekday) {
    case 1:
      return 'MONDAY';
    case 2:
      return 'TUESDAY';
    case 3:
      return 'WEDNESDAY';
    case 4:
      return 'THURSDAY';
    case 5:
      return 'FRIDAY';
    case 6:
      return 'SATURDAY';
    case 7:
      return 'SUNDAY';
    default:
      return 'MONDAY';
  }
};

const hhmmToMinutes = (hhmm: string): number => {
  const m = hhmm.match(/^(\d{2}):(\d{2})$/);
  if (!m) {
    throw createHttpError(400, `Invalid time format: ${hhmm}`);
  }
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  return hour * 60 + minute;
};

const pickEntry = (entry: Timetable) => ({
  id: entry.id,
  courseCode: entry.courseCode,
  courseTitle: entry.courseTitle,
  venue: entry.venue,
  day: entry.day,
  startTime: entry.startTime,
  endTime: entry.endTime
});

export const timetableStatusService = {
  async getStatus(input: { userId: string; timezone: string; at?: string; includeToday: boolean }) {
    const tz = input.timezone || 'UTC';

    const nowUtc = (() => {
      if (!input.at) return DateTime.utc();
      const parsed = DateTime.fromISO(input.at, { setZone: true });
      if (!parsed.isValid) {
        throw createHttpError(400, 'Invalid `at` datetime. Use ISO format, e.g. 2026-03-11T10:05:00Z');
      }
      return parsed.toUTC();
    })();

    const nowLocal = nowUtc.setZone(tz);
    if (!nowLocal.isValid) {
      throw createHttpError(400, 'Invalid user timezone.');
    }

    const entries = await timetableRepository.findByUser(input.userId);

    const todayEnum = weekdayToEnum(nowLocal.weekday);
    const nowMinutes = nowLocal.hour * 60 + nowLocal.minute;

    const todays = entries
      .filter((e) => e.day === todayEnum)
      .slice()
      .sort((a, b) => hhmmToMinutes(a.startTime) - hhmmToMinutes(b.startTime));

    const live = todays.find((e) => {
      const start = hhmmToMinutes(e.startTime);
      const end = hhmmToMinutes(e.endTime);
      return start <= nowMinutes && nowMinutes < end;
    });

    const nextToday = todays.find((e) => hhmmToMinutes(e.startTime) > nowMinutes);

    const nextAcrossWeek = (() => {
      if (nextToday) return nextToday;

      // Look ahead up to 7 days, earliest class in the earliest upcoming day.
      for (let offsetDays = 1; offsetDays <= 7; offsetDays += 1) {
        const day = weekdayToEnum(nowLocal.plus({ days: offsetDays }).weekday);
        const dayEntries = entries
          .filter((e) => e.day === day)
          .slice()
          .sort((a, b) => hhmmToMinutes(a.startTime) - hhmmToMinutes(b.startTime));
        if (dayEntries.length > 0) return dayEntries[0];
      }

      return null;
    })();

    return {
      now: nowUtc.toISO(),
      timezone: tz,
      live: live ? pickEntry(live) : null,
      next: nextAcrossWeek ? pickEntry(nextAcrossWeek) : null,
      ...(input.includeToday ? { today: todays.map(pickEntry) } : {})
    };
  }
};
