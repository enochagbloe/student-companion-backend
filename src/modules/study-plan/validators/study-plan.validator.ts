import { z } from 'zod';

export const generatePlanSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({})
});
