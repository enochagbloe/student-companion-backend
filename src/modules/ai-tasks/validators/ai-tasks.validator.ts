import { z } from 'zod';

export const suggestTasksSchema = z.object({
  body: z.object({
    conversationId: z.string().min(1).optional(),
    context: z.object({
      courseCode: z.string().optional(),
      courseTitle: z.string().optional(),
      topic: z.string().optional(),
      difficulty: z.string().optional(),
      timeAvailableMinutes: z.number().int().min(1).max(600).optional()
    }),
    notes: z.string().optional()
  }),
  params: z.object({}),
  query: z.object({})
});
