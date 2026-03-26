import { z } from 'zod';

export const importTimetableSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    dryRun: z
      .union([z.literal('true'), z.literal('false')])
      .optional()
      .transform((v) => v === 'true'),
    debug: z
      .union([z.literal('true'), z.literal('false')])
      .optional()
      .transform((v) => v === 'true')
  })
});
