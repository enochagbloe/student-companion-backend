import { WeekDay } from '@prisma/client';
import createHttpError from 'http-errors';
import { timetableRepository } from '../repositories/timetable.repository';

const computeCourseName = (input: {
  courseName?: string;
  courseCode?: string;
  courseTitle?: string;
  venue?: string;
}): string => {
  if (input.courseName?.trim()) {
    return input.courseName.trim();
  }

  const parts = [input.courseCode, input.courseTitle].filter((v) => v?.trim()) as string[];
  const base = parts.join(' - ').trim();
  if (!base) {
    return 'Untitled course';
  }

  return base;
};

export const timetableService = {
  async create(
    userId: string,
    input: {
      courseName?: string;
      courseCode?: string;
      courseTitle?: string;
      venue?: string;
      day: WeekDay;
      startTime: string;
      endTime: string;
    }
  ) {
    if (input.startTime >= input.endTime) {
      throw createHttpError(400, 'startTime must be earlier than endTime.');
    }

    return timetableRepository.create({
      userId,
      courseName: computeCourseName(input),
      courseCode: input.courseCode,
      courseTitle: input.courseTitle,
      venue: input.venue,
      day: input.day,
      startTime: input.startTime,
      endTime: input.endTime
    });
  },

  list(userId: string) {
    return timetableRepository.findByUser(userId);
  },

  async update(
    userId: string,
    id: string,
    input: Partial<{
      courseName: string;
      courseCode: string;
      courseTitle: string;
      venue: string;
      day: WeekDay;
      startTime: string;
      endTime: string;
    }>
  ) {
    const existing = await timetableRepository.findOneByIdAndUser(id, userId);
    if (!existing) {
      throw createHttpError(404, 'Timetable entry not found.');
    }

    const nextStart = input.startTime ?? existing.startTime;
    const nextEnd = input.endTime ?? existing.endTime;
    if (nextStart >= nextEnd) {
      throw createHttpError(400, 'startTime must be earlier than endTime.');
    }

    // Keep courseName coherent if caller is only sending code/title updates.
    const nextCourseName =
      input.courseName !== undefined || input.courseCode !== undefined || input.courseTitle !== undefined
        ? computeCourseName({
            courseName: input.courseName ?? existing.courseName,
            courseCode: input.courseCode ?? existing.courseCode ?? undefined,
            courseTitle: input.courseTitle ?? existing.courseTitle ?? undefined
          })
        : undefined;

    return timetableRepository.update(id, {
      ...input,
      ...(nextCourseName ? { courseName: nextCourseName } : {})
    });
  },

  async remove(userId: string, id: string) {
    const existing = await timetableRepository.findOneByIdAndUser(id, userId);
    if (!existing) {
      throw createHttpError(404, 'Timetable entry not found.');
    }

    await timetableRepository.remove(id);
  }
};
