import { z } from 'zod';

export const getRemindersSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    daysAhead: z.coerce.number().min(1).max(30).optional(),
    studyHourLocal: z.coerce.number().min(0).max(23).optional()
  })
});
