import { User, UserRole } from '@prisma/client';
import { prisma } from '../../../config/prisma';

export const authRepository = {
  findByGoogleId(googleId: string): Promise<User | null> {
    return prisma.user.findFirst({ where: { googleId } as any });
  },

  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  },

  createGoogleUser(data: { email: string; googleId: string; timezone: string }): Promise<User> {
    return prisma.user.create({
      data: {
        email: data.email,
        googleId: data.googleId,
        timezone: data.timezone,
        role: UserRole.STUDENT
      } as any
    });
  },

  createPasswordUser(data: { email: string; passwordHash: string; timezone: string }): Promise<User> {
    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        timezone: data.timezone,
        role: UserRole.STUDENT
      }
    });
  },

  linkGoogleToUser(userId: string, googleId: string, timezone: string): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: { googleId, timezone } as any
    });
  }
};
