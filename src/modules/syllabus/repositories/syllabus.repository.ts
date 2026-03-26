import { Syllabus } from '@prisma/client';
import { prisma } from '../../../config/prisma';

export const syllabusRepository = {
  upsert(userId: string, fileUrl: string, extractedText: string): Promise<Syllabus> {
    return prisma.syllabus.upsert({
      where: { userId },
      update: { fileUrl, extractedText },
      create: { userId, fileUrl, extractedText }
    });
  },

  findByUser(userId: string): Promise<Syllabus | null> {
    return prisma.syllabus.findUnique({ where: { userId } });
  }
};
