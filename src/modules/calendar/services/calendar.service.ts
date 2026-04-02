import { DateTime } from 'luxon';
import { calendarRepository } from '../repositories/calendar.repository';

const toDate = (value?: string | Date | null) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  const dt = DateTime.fromISO(value, { setZone: true });
  return dt.isValid ? dt.toJSDate() : null;
};

export const calendarService = {
  async createForTask(input: {
    userId: string;
    taskId: string;
    title: string;
    description?: string | null;
    scheduledFor?: Date | string | null;
    durationMinutes?: number | null;
  }) {
    const existing = await calendarRepository.findBySource(input.userId, 'study_task', input.taskId);
    if (existing) return existing;

    const startAt = toDate(input.scheduledFor) ?? new Date();
    const endAt = input.durationMinutes
      ? DateTime.fromJSDate(startAt).plus({ minutes: input.durationMinutes }).toJSDate()
      : null;

    return calendarRepository.create({
      userId: input.userId,
      title: input.title,
      description: input.description ?? null,
      startAt,
      endAt,
      source: 'study_task',
      sourceId: input.taskId
    });
  }
};
