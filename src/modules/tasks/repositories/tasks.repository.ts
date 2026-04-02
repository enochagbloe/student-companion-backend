import { prisma } from '../../../config/prisma';
import { Prisma, StudyTask } from '@prisma/client';

export const tasksRepository = {
  list(userId: string, where: Prisma.StudyTaskWhereInput, limit: number): Promise<StudyTask[]> {
    return prisma.studyTask.findMany({
      where: { userId, ...where },
      orderBy: [{ scheduledFor: 'asc' }, { createdAt: 'desc' }],
      take: limit
    });
  },

  create(data: Prisma.StudyTaskUncheckedCreateInput): Promise<StudyTask> {
    return prisma.studyTask.create({ data });
  },

  findById(userId: string, id: string): Promise<StudyTask | null> {
    return prisma.studyTask.findFirst({ where: { id, userId } });
  },

  update(id: string, data: Prisma.StudyTaskUpdateInput): Promise<StudyTask> {
    return prisma.studyTask.update({ where: { id }, data });
  },

  delete(id: string): Promise<StudyTask> {
    return prisma.studyTask.delete({ where: { id } });
  }
};
