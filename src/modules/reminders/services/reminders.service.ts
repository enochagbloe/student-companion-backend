import createHttpError from 'http-errors';
import { DateTime } from 'luxon';
import { ReminderItem, StudyPlanItem } from '../../../common/types';
import { timetableRepository } from '../../timetable/repositories/timetable.repository';
import { studyPlanRepository } from '../../study-plan/repositories/study-plan.repository';

const dayMap: Record<string, number> = {
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
  SUNDAY: 7
};

const parseHHmm = (value: string) => {
  const [hour, minute] = value.split(':').map(Number);
  return { hour, minute };
};

const courseLabel = (entry: { courseTitle?: string | null; courseCode?: string | null; courseName: string }) => {
  return entry.courseTitle || entry.courseCode || entry.courseName;
};

export const remindersService = {
  async list(input: { userId: string; timezone: string; daysAhead?: number; studyHourLocal?: number }): Promise<ReminderItem[]> {
    const baseNow = DateTime.now().setZone(input.timezone);
    if (!baseNow.isValid) {
      throw createHttpError(400, 'Invalid user timezone.');
    }

    const daysAhead = input.daysAhead ?? 7;
    const studyHourLocal = input.studyHourLocal ?? 18;
    const end = baseNow.plus({ days: daysAhead }).endOf('day');

    const reminders: ReminderItem[] = [];

    const timetable = await timetableRepository.findByUser(input.userId);
    for (const entry of timetable) {
      const targetWeekday = dayMap[entry.day];
      for (let i = 0; i <= daysAhead; i += 1) {
        const current = baseNow.plus({ days: i });
        if (current.weekday !== targetWeekday) {
          continue;
        }

        const { hour, minute } = parseHHmm(entry.startTime);
        const classStart = current.set({ hour, minute, second: 0, millisecond: 0 });
        const scheduled = classStart.minus({ minutes: 30 });
        if (scheduled < baseNow || scheduled > end) {
          continue;
        }

        reminders.push({
          title: `${courseLabel(entry)} class`,
          body: 'Starts in 30 mins',
          scheduledAt: scheduled.toUTC().toISO() as string
        });
      }
    }

    const plan = await studyPlanRepository.findByUser(input.userId);
    const planItems = (plan?.content ?? []) as unknown as StudyPlanItem[];

    for (const item of planItems) {
      const date = DateTime.fromISO(item.date, { zone: input.timezone });
      if (!date.isValid) {
        continue;
      }

      const scheduled = date.set({ hour: studyHourLocal, minute: 0, second: 0, millisecond: 0 });
      if (scheduled < baseNow || scheduled > end) {
        continue;
      }

      reminders.push({
        title: `Study ${item.topic}`,
        body: `Study ${item.courseName} for ${item.durationMin} mins today`,
        scheduledAt: scheduled.toUTC().toISO() as string
      });
    }

    reminders.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    return reminders;
  }
};
