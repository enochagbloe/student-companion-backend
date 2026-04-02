import { z } from 'zod';

const statusEnum = z.enum(['pending', 'completed', 'dismissed', 'all']);

export const listTasksSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    status: statusEnum.optional(),
    date: z.string().optional(),
    limit: z.coerce.number().min(1).max(200).optional()
  })
});

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    courseCode: z.string().optional(),
    courseTitle: z.string().optional(),
    durationMinutes: z.number().int().min(1).max(600).optional(),
    scheduledFor: z.string().optional()
  }),
  params: z.object({}),
  query: z.object({})
});

export const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    courseCode: z.string().optional().nullable(),
    courseTitle: z.string().optional().nullable(),
    durationMinutes: z.number().int().min(1).max(600).optional().nullable(),
    scheduledFor: z.string().optional().nullable(),
    status: z.enum(['pending', 'completed', 'dismissed']).optional()
  }),
  params: z.object({ id: z.string().min(1) }),
  query: z.object({})
});

export const taskIdParamSchema = z.object({
  body: z.object({}),
  params: z.object({ id: z.string().min(1) }),
  query: z.object({})
});

export const acceptTaskSchema = z.object({
  body: z.object({}),
  params: z.object({ id: z.string().min(1) }),
  query: z.object({})
});
