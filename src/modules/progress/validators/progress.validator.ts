import { z } from 'zod';

export const progressSummarySchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({})
});
