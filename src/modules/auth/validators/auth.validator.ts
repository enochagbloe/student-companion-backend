import { z } from 'zod';

export const googleAuthSchema = z.object({
  body: z.object({
    idToken: z.string().min(1),
    timezone: z.string().min(1)
  }),
  params: z.object({}),
  query: z.object({})
});

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    timezone: z.string().min(1)
  }),
  params: z.object({}),
  query: z.object({})
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8)
  }),
  params: z.object({}),
  query: z.object({})
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email()
  }),
  params: z.object({}),
  query: z.object({})
});
