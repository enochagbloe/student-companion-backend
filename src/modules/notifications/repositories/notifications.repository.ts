import { prisma } from '../../../config/prisma';
import { PushPlatform, PushToken } from '@prisma/client';

export const notificationsRepository = {
  findByToken(token: string): Promise<PushToken | null> {
    return prisma.pushToken.findUnique({ where: { token } });
  },

  upsertForUser(input: { userId: string; token: string; platform: PushPlatform }): Promise<PushToken> {
    return prisma.pushToken.upsert({
      where: { token: input.token },
      create: {
        userId: input.userId,
        token: input.token,
        platform: input.platform,
        lastSeenAt: new Date()
      },
      update: {
        userId: input.userId,
        platform: input.platform,
        lastSeenAt: new Date()
      }
    });
  },

  deleteByUser(userId: string): Promise<{ count: number }> {
    return prisma.pushToken.deleteMany({ where: { userId } });
  },

  deleteByUserAndToken(userId: string, token: string): Promise<{ count: number }> {
    return prisma.pushToken.deleteMany({ where: { userId, token } });
  }
};
