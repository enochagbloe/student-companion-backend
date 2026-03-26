import { Prisma, StudyPlan } from '@prisma/client';
import { prisma } from '../../../config/prisma';

export const studyPlanRepository = {
  upsert(userId: string, content: Prisma.InputJsonValue): Promise<StudyPlan> {
    return prisma.studyPlan.upsert({
      where: { userId },
      update: { content },
      create: { userId, content }
    });
  },

  findByUser(userId: string): Promise<StudyPlan | null> {
    return prisma.studyPlan.findUnique({ where: { userId } });
  }
};
