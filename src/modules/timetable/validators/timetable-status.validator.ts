import { z } from 'zod';

export const timetableStatusSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    at: z.string().min(1).optional(),
    includeToday: z
      .union([z.literal('true'), z.literal('false')])
      .optional()
      .transform((v) => v === 'true')
  })
});
