import { z } from 'zod';

export const listTopicsSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({})
});

export const upsertTopicSchema = z.object({
  body: z.object({
    courseCode: z.string().min(1),
    courseTitle: z.string().min(1),
    currentTopic: z.string().min(1)
  }),
  params: z.object({}),
  query: z.object({})
});
