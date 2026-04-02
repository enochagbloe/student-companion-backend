import { DateTime } from 'luxon';
import { prisma } from '../../../config/prisma';

export const focusSessionsService = {
  async create(userId: string, input: { durationMinutes: number; courseCode?: string; topic?: string }) {
    return prisma.focusSession.create({
      data: {
        userId,
        durationMinutes: input.durationMinutes,
        courseCode: input.courseCode ?? null,
        topic: input.topic ?? null
      }
    });
  },

  async list(userId: string, range?: string) {
    const where: any = { userId };
    if (range === 'week') {
      const start = DateTime.now().startOf('week').toJSDate();
      where.createdAt = { gte: start };
    }

    return prisma.focusSession.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
  }
};
