import { ChatMessage, ChatRole } from '@prisma/client';
import { prisma } from '../../../config/prisma';

export const chatRepository = {
  create(data: { userId: string; message: string; role: ChatRole }): Promise<ChatMessage> {
    return prisma.chatMessage.create({ data });
  },

  countUserMessagesInWindow(userId: string, start: Date, end: Date): Promise<number> {
    return prisma.chatMessage.count({
      where: {
        userId,
        role: ChatRole.USER,
        createdAt: {
          gte: start,
          lt: end
        }
      }
    });
  },

  listByUser(userId: string, limit = 50): Promise<ChatMessage[]> {
    return prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }
};
