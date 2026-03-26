import { prisma } from '../../../config/prisma';
import { AiRole, AiConversation, AiMessage, AiMemory, StudySchedule } from '@prisma/client';

export const aiRepository = {
  listConversations(userId: string): Promise<Array<Pick<AiConversation, 'id' | 'title' | 'updatedAt'>>> {
    return prisma.aiConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, updatedAt: true }
    });
  },

  createConversation(userId: string, title: string | null | undefined): Promise<AiConversation> {
    return prisma.aiConversation.create({
      data: { userId, title: title ?? null }
    });
  },

  findConversationById(userId: string, id: string): Promise<AiConversation | null> {
    return prisma.aiConversation.findFirst({ where: { id, userId } });
  },

  touchConversation(id: string): Promise<AiConversation> {
    return prisma.aiConversation.update({ where: { id }, data: { updatedAt: new Date() } });
  },

  createMessage(input: { conversationId: string; role: AiRole; content: string; contentParts: any }): Promise<AiMessage> {
    return prisma.aiMessage.create({
      data: {
        conversationId: input.conversationId,
        role: input.role,
        content: input.content,
        contentParts: input.contentParts
      }
    });
  },

  listMessages(input: { userId: string; conversationId: string; limit: number; cursor?: string }) {
    // Cursor is an AiMessage.id. We page backwards by createdAt desc.
    return prisma.aiMessage.findMany({
      where: { conversationId: input.conversationId, conversation: { userId: input.userId } },
      orderBy: { createdAt: 'desc' },
      take: input.limit + 1,
      ...(input.cursor
        ? {
            cursor: { id: input.cursor },
            skip: 1
          }
        : {})
    });
  },

  listRecentMessages(input: { userId: string; conversationId: string; limit: number }): Promise<AiMessage[]> {
    return prisma.aiMessage.findMany({
      where: { conversationId: input.conversationId, conversation: { userId: input.userId } },
      orderBy: { createdAt: 'desc' },
      take: input.limit
    });
  },

  listMemory(userId: string): Promise<AiMemory[]> {
    return prisma.aiMemory.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } });
  },

  upsertMemory(input: { userId: string; key: string; value: any; source: string; confidence: number }): Promise<AiMemory> {
    return prisma.aiMemory.upsert({
      where: { userId_key: { userId: input.userId, key: input.key } },
      create: {
        userId: input.userId,
        key: input.key,
        value: input.value,
        source: input.source,
        confidence: input.confidence
      },
      update: {
        value: input.value,
        source: input.source,
        confidence: input.confidence
      }
    });
  },

  deleteMemory(userId: string, key: string): Promise<void> {
    return prisma.aiMemory
      .delete({ where: { userId_key: { userId, key } } })
      .then(() => undefined)
      .catch(() => undefined);
  },

  createStudySchedule(input: {
    userId: string;
    goal: string;
    days: number;
    dailyMinutes: number;
    constraints: any;
    courses: any;
    schedule: any;
  }): Promise<StudySchedule> {
    return prisma.studySchedule.create({
      data: {
        userId: input.userId,
        goal: input.goal,
        days: input.days,
        dailyMinutes: input.dailyMinutes,
        constraints: input.constraints,
        courses: input.courses,
        schedule: input.schedule
      }
    });
  }
};
