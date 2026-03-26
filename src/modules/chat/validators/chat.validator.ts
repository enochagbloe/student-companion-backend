import { z } from 'zod';

export const createChatMessageSchema = z.object({
  body: z.object({
    message: z.string().min(1).max(5000)
  }),
  params: z.object({}),
  query: z.object({})
});
