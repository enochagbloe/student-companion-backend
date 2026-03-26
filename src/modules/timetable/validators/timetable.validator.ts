import { z } from 'zod';

const weekDayEnum = z.enum([
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY'
]);

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const createTimetableSchema = z.object({
  body: z
    .object({
      courseName: z.string().min(1).optional(),
      courseCode: z.string().min(1).optional(),
      courseTitle: z.string().min(1).optional(),
      venue: z.string().min(1).optional(),
      day: weekDayEnum,
      startTime: z.string().regex(timeRegex, 'startTime must be HH:mm'),
      endTime: z.string().regex(timeRegex, 'endTime must be HH:mm')
    })
    .refine((v) => !!(v.courseName || v.courseTitle || v.courseCode), {
      message: 'Provide at least one of courseName, courseTitle, or courseCode.'
    }),
  params: z.object({}),
  query: z.object({})
});

export const updateTimetableSchema = z.object({
  body: z.object({
    courseName: z.string().min(1).optional(),
    courseCode: z.string().min(1).optional(),
    courseTitle: z.string().min(1).optional(),
    venue: z.string().min(1).optional(),
    day: weekDayEnum.optional(),
    startTime: z.string().regex(timeRegex, 'startTime must be HH:mm').optional(),
    endTime: z.string().regex(timeRegex, 'endTime must be HH:mm').optional()
  }),
  params: z.object({ id: z.string().min(1) }),
  query: z.object({})
});

export const timetableIdParamSchema = z.object({
  body: z.object({}),
  params: z.object({ id: z.string().min(1) }),
  query: z.object({})
});
