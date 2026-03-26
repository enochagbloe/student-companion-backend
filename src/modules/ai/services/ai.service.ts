import createHttpError from 'http-errors';
import { DateTime } from 'luxon';
import { AiRole } from '@prisma/client';
import { env } from '../../../config/env';
import { aiRepository } from '../repositories/ai.repository';
import { aiClient } from '../../../utils/openai';
import { contentPartArraySchema } from '../validators/ai.validator';
import { prisma } from '../../../config/prisma';
import { timetableStatusService } from '../../timetable/services/timetable-status.service';
import { remindersService } from '../../reminders/services/reminders.service';
import { studyPlanRepository } from '../../study-plan/repositories/study-plan.repository';
import { syllabusRepository } from '../../syllabus/repositories/syllabus.repository';

type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'code'; language?: string; code: string }
  | { type: 'list'; items: string[] }
  | { type: 'warning'; text: string }
  | { type: 'action'; action: 'create_schedule' | 'start_focus' | 'open_timetable'; payload?: any };

type AssistantStatusType =
  | 'idle'
  | 'thinking'
  | 'reading_calendar'
  | 'creating_schedule'
  | 'updating_timetable'
  | 'summarizing_syllabus'
  | 'saving_memory';

const COACH_SYSTEM_RULES = `You are an AI Coach for students. You should feel friendly, casual, and supportive, like meeting a helpful friend.

Tone rules:
- Greet naturally. If you know the user's name, use it sometimes (not every message).
- Keep messages short and human. Ask 1-2 questions at a time.
- You can do light small-talk (\"What's on your mind?\") before switching to action.

Coach mode rules:
- Default to guidance: a process, checklist, hints, and next steps.\n- If preferences.noDirectAnswers is true, avoid giving full final answers for assignment-like questions.\n- If user explicitly asks for the full answer and confirms, you can provide it.\n- If you don't have enough context, say so and ask for it.\n- Do not invent university-specific facts unless provided in context or memory.

Output format:
- You must return ONLY valid JSON, with this schema:
{
  "contentParts": ContentPart[],
  "memoryWrites": [{"key": string, "value": any, "confidence": number}] 
}

ContentPart union:
- {"type":"text","text":string}
- {"type":"code","language"?:string,"code":string}
- {"type":"list","items":string[]}
- {"type":"warning","text":string}
- {"type":"action","action":"create_schedule"|"start_focus"|"open_timetable","payload"?:any}

No markdown. No extra keys.`;

const safeJsonParse = (text: string): any => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const toRawContent = (parts: ContentPart[]): string => {
  return parts
    .map((p) => {
      switch (p.type) {
        case 'text':
          return p.text;
        case 'warning':
          return `WARNING: ${p.text}`;
        case 'list':
          return p.items.map((i) => `- ${i}`).join('\n');
        case 'code':
          return p.code;
        case 'action':
          return `ACTION: ${p.action}`;
        default:
          return '';
      }
    })
    .filter(Boolean)
    .join('\n\n');
};

const getDailyWindowUtc = (timezone: string) => {
  const nowLocal = DateTime.now().setZone(timezone);
  if (!nowLocal.isValid) {
    throw createHttpError(400, 'Invalid user timezone.');
  }
  const startUtc = nowLocal.startOf('day').toUTC();
  const nextUtc = nowLocal.plus({ days: 1 }).startOf('day').toUTC();
  return { startUtc, nextUtc, resetAtIso: nextUtc.toISO() as string };
};

const buildServerContext = async (input: { userId: string; timezone: string; nowIso?: string }) => {
  const at = input.nowIso;
  const timetableStatus = await timetableStatusService.getStatus({
    userId: input.userId,
    timezone: input.timezone,
    at,
    includeToday: true
  });

  const reminders = await remindersService.list({ userId: input.userId, timezone: input.timezone, daysAhead: 7 });
  const studyPlan = await studyPlanRepository.findByUser(input.userId);
  const syllabus = await syllabusRepository.findByUser(input.userId);

  const latestSchedule = await prisma.studySchedule.findFirst({
    where: { userId: input.userId },
    orderBy: { createdAt: 'desc' }
  });

  return {
    timetableStatus,
    reminders: reminders.slice(0, 25),
    studyPlan: studyPlan?.content ?? null,
    hasSyllabus: Boolean(syllabus),
    latestSchedule: latestSchedule?.schedule ?? null
  };
};

export const aiService = {
  async listConversations(userId: string) {
    const conversations = await aiRepository.listConversations(userId);
    return { conversations };
  },

  async createConversation(userId: string, title?: string | null) {
    const conversation = await aiRepository.createConversation(userId, title ?? null);
    return { conversation };
  },

  async getMessages(userId: string, conversationId: string, limit: number, cursor?: string) {
    const convo = await aiRepository.findConversationById(userId, conversationId);
    if (!convo) {
      throw createHttpError(404, 'Conversation not found.');
    }

    const items = await aiRepository.listMessages({ userId, conversationId, limit, cursor });
    const hasNext = items.length > limit;
    const page = items.slice(0, limit);

    // Return ascending for UI.
    const messages = page
      .slice()
      .reverse()
      .map((m) => ({
        id: m.id,
        role: m.role.toLowerCase(),
        content: m.content,
        contentParts: m.contentParts,
        createdAt: m.createdAt
      }));

    const nextCursor = hasNext ? items[limit].id : null;
    return { messages, nextCursor };
  },

  async getMemory(userId: string) {
    const memory = await aiRepository.listMemory(userId);
    return {
      memory: memory.map((m) => ({
        key: m.key,
        value: m.value,
        source: m.source,
        confidence: m.confidence,
        updatedAt: m.updatedAt
      }))
    };
  },

  async patchMemory(userId: string, writes: Array<{ key: string; value: any; action: 'upsert' | 'delete' }>) {
    for (const w of writes) {
      if (w.action === 'delete') {
        await aiRepository.deleteMemory(userId, w.key);
      } else {
        await aiRepository.upsertMemory({ userId, key: w.key, value: w.value ?? null, source: 'user', confidence: 1 });
      }
    }

    return this.getMemory(userId);
  },

  async chat(input: {
    userId: string;
    timezone: string;
    conversationId?: string | null;
    userText: string;
    context?: any;
    preferences?: any;
  }) {
    // Rate limiting: reuse CHAT_DAILY_LIMIT (per user timezone) for AI Coach v1.
    const { startUtc, nextUtc, resetAtIso } = getDailyWindowUtc(input.timezone);

    // Count USER messages in AiMessage.
    const used = await prisma.aiMessage.count({
      where: {
        conversation: { userId: input.userId },
        role: AiRole.USER,
        createdAt: { gte: startUtc.toJSDate(), lt: nextUtc.toJSDate() }
      }
    });

    const limit = env.CHAT_DAILY_LIMIT;
    const remaining = Math.max(0, limit - used);
    if (used >= limit) {
      throw createHttpError(429, 'Daily AI chat limit reached, try again tomorrow.', { resetAt: resetAtIso, limit, remaining: 0 });
    }

    const conversationId = await (async () => {
      if (input.conversationId) {
        const convo = await aiRepository.findConversationById(input.userId, input.conversationId);
        if (!convo) {
          throw createHttpError(404, 'Conversation not found.');
        }
        return convo.id;
      }
      const convo = await aiRepository.createConversation(input.userId, null);
      return convo.id;
    })();

    // Store user message.
    const userParts: ContentPart[] = [{ type: 'text', text: input.userText }];
    await aiRepository.createMessage({
      conversationId,
      role: AiRole.USER,
      content: input.userText,
      contentParts: userParts
    });

    const memory = await aiRepository.listMemory(input.userId);
    const memoryContext = memory.map((m) => ({ key: m.key, value: m.value, source: m.source, confidence: m.confidence }));

    // If frontend provides name once, store it as memory for friendly greetings.
    const providedName = input.context?.user?.name;
    if (typeof providedName === 'string' && providedName.trim().length > 0) {
      await aiRepository.upsertMemory({
        userId: input.userId,
        key: 'name',
        value: providedName.trim(),
        source: 'user',
        confidence: 1
      });
    }

    const recent = await aiRepository.listRecentMessages({ userId: input.userId, conversationId, limit: 20 });
    const history = recent
      .slice()
      .reverse()
      .map((m) => ({ role: m.role.toLowerCase(), content: m.content }));

    const preferences = {
      style: input.preferences?.style ?? 'coach',
      noDirectAnswers: input.preferences?.noDirectAnswers ?? true,
      format: input.preferences?.format ?? 'contentParts'
    };

    const serverContext = await buildServerContext({
      userId: input.userId,
      timezone: input.timezone,
      nowIso: input.context?.now
    });

    const system = COACH_SYSTEM_RULES;
    const prompt = [
      system,
      `Preferences: ${JSON.stringify(preferences)}`,
      `Context: ${JSON.stringify({ ...(input.context ?? {}), server: serverContext })}`,
      `Memory: ${JSON.stringify(memoryContext)}`,
      `History: ${JSON.stringify(history)}`,
      `User: ${input.userText}`
    ].join('\n\n');

    const answerText = await aiClient.completeText({ prompt });

    const parsed = safeJsonParse(answerText);
    const contentParts = parsed?.contentParts;
    const memoryWrites = Array.isArray(parsed?.memoryWrites) ? parsed.memoryWrites : [];

    const validatedParts = (() => {
      const candidate = Array.isArray(contentParts) ? contentParts : [{ type: 'text', text: answerText }];
      const v = contentPartArraySchema.safeParse(candidate);
      return v.success ? (v.data as ContentPart[]) : ([{ type: 'text', text: answerText }] as ContentPart[]);
    })();

    const assistantRaw = toRawContent(validatedParts);

    const assistantMsg = await aiRepository.createMessage({
      conversationId,
      role: AiRole.ASSISTANT,
      content: assistantRaw,
      contentParts: validatedParts
    });

    // v1: accept memoryWrites but do not persist unless explicitly via PATCH /ai/memory
    // (keeps trust model simple; frontend can show suggested memory writes).

    const status = (() => {
      // Minimal v1 status: reflect what the backend actually did during this request.
      let type: AssistantStatusType = 'thinking';
      let text = 'Thinking...';

      // We always fetch timetable status/reminders as server context for now.
      if (serverContext) {
        type = 'reading_calendar';
        text = 'Reading your timetable and reminders...';
      }

      // If the model suggests memory writes, surface that.
      if (Array.isArray(memoryWrites) && memoryWrites.length > 0) {
        type = 'saving_memory';
        text = 'Saving a preference...';
      }

      return { type, text };
    })();

    await aiRepository.touchConversation(conversationId);

    return {
      conversationId,
      assistant: {
        messageId: assistantMsg.id,
        contentParts: validatedParts,
        memoryWrites: memoryWrites as Array<{ key: string; value: any; confidence: number }>,
        status
      },
      rateLimit: {
        limit,
        remaining: Math.max(0, limit - (used + 1)),
        resetAt: resetAtIso
      }
    };
  },

  async createSchedule(input: {
    userId: string;
    goal: string;
    days: number;
    dailyMinutes: number;
    constraints?: any;
    courses?: any;
  }) {
    // v1: deterministic schedule generator (no AI) as placeholder.
    const start = DateTime.now().startOf('day');
    const schedule = Array.from({ length: input.days }).map((_, idx) => {
      const date = start.plus({ days: idx }).toISODate();
      return {
        date,
        blocks: [
          { minutes: input.dailyMinutes, title: `${(input.courses?.[0]?.courseCode ?? 'Study')}: focus block`, type: 'study' }
        ]
      };
    });

    const saved = await aiRepository.createStudySchedule({
      userId: input.userId,
      goal: input.goal,
      days: input.days,
      dailyMinutes: input.dailyMinutes,
      constraints: input.constraints ?? null,
      courses: input.courses ?? null,
      schedule
    });

    return { schedule: saved.schedule };
  },

  async summarizeSyllabus(input: { userId: string; maxBullets?: number }) {
    const syllabus = await syllabusRepository.findByUser(input.userId);
    if (!syllabus) {
      throw createHttpError(400, 'Upload syllabus before requesting a summary.');
    }

    const maxBullets = input.maxBullets ?? 8;
    const prompt = [
      COACH_SYSTEM_RULES,
      'Task: Summarize the uploaded syllabus for the student in a friendly tone.',
      `Output must be JSON only with contentParts + memoryWrites. memoryWrites should be [].`,
      `Include: 1 short intro line, then a list of up to ${maxBullets} bullets, then 1 warning if key info is missing.`,
      `SyllabusText: ${syllabus.extractedText}`
    ].join('\\n\\n');

    const answerText = await aiClient.completeText({ prompt });
    const parsed = safeJsonParse(answerText);
    const contentParts = parsed?.contentParts;

    const validatedParts = (() => {
      const candidate = Array.isArray(contentParts) ? contentParts : [{ type: 'text', text: answerText }];
      const v = contentPartArraySchema.safeParse(candidate);
      return v.success ? (v.data as ContentPart[]) : ([{ type: 'text', text: answerText }] as ContentPart[]);
    })();

    return { contentParts: validatedParts };
  }
};
