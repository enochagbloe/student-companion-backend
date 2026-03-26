import { z } from 'zod';

export const registerTokenSchema = z.object({
  body: z.object({
    token: z.string().min(1),
    platform: z.enum(['ios', 'android'])
  }),
  params: z.object({}),
  query: z.object({})
});

export const unregisterTokenSchema = z.object({
  body: z.object({
    token: z.string().min(1).optional()
  }),
  params: z.object({}),
  query: z.object({})
});

export const testNotificationSchema = z.object({
  body: z.object({
    token: z.string().min(1),
    title: z.string().min(1).max(100),
    body: z.string().min(1).max(500)
  }),
  params: z.object({}),
  query: z.object({})
});
