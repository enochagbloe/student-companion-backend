import { z } from 'zod';

export const createFocusSessionSchema = z.object({
  body: z.object({
    durationMinutes: z.number().int().min(1).max(600),
    courseCode: z.string().optional(),
    topic: z.string().optional()
  }),
  params: z.object({}),
  query: z.object({})
});

export const listFocusSessionsSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    range: z.enum(['week']).optional()
  })
});
