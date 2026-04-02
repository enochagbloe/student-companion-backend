import { z } from 'zod';

export const listConversationsSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({})
});

export const createConversationSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(120).optional().nullable()
  }),
  params: z.object({}),
  query: z.object({})
});

export const conversationIdParamSchema = z.object({
  body: z.object({}),
  params: z.object({ id: z.string().min(1) }),
  query: z.object({
    limit: z.coerce.number().min(1).max(200).optional(),
    cursor: z.string().min(1).optional()
  })
});

const contentPartSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), text: z.string() }),
  z.object({ type: z.literal('code'), language: z.string().min(1).optional(), code: z.string() }),
  z.object({ type: z.literal('list'), items: z.array(z.string()) }),
  z.object({ type: z.literal('warning'), text: z.string() }),
  z.object({
    type: z.literal('action'),
    action: z.enum([
      'create_schedule',
      'start_focus',
      'open_timetable',
      'create_task',
      'update_task',
      'delete_task',
      'read_tasks'
    ]),
    payload: z.any().optional()
  })
]);

export const aiChatSchema = z.object({
  body: z.object({
    conversationId: z.string().min(1).nullable().optional(),
    message: z.object({
      text: z.string().min(1).max(10000)
    }),
    context: z.any().optional(),
    preferences: z
      .object({
        style: z.string().optional(),
        noDirectAnswers: z.boolean().optional(),
        format: z.string().optional()
      })
      .optional()
  }),
  params: z.object({}),
  query: z.object({})
});

export const memorySchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({})
});

export const patchMemorySchema = z.object({
  body: z.object({
    writes: z
      .array(
        z.object({
          key: z.string().min(1).max(100),
          value: z.any().optional().nullable(),
          action: z.enum(['upsert', 'delete']).default('upsert')
        })
      )
      .default([])
  }),
  params: z.object({}),
  query: z.object({})
});

export const scheduleSchema = z.object({
  body: z.object({
    goal: z.string().min(1).max(200),
    days: z.number().int().min(1).max(60),
    dailyMinutes: z.number().int().min(5).max(600),
    constraints: z.any().optional(),
    courses: z.array(z.object({ courseCode: z.string().min(1), priority: z.number().int().min(1).max(5).optional() })).optional()
  }),
  params: z.object({}),
  query: z.object({})
});

export const contentPartArraySchema = z.array(contentPartSchema);

export const syllabusSummarySchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    maxBullets: z.coerce.number().min(3).max(20).optional()
  })
});
