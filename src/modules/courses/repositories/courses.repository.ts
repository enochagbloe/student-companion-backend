import { prisma } from '../../../config/prisma';
import { CourseTopic } from '@prisma/client';

export const coursesRepository = {
  listTopics(userId: string): Promise<CourseTopic[]> {
    return prisma.courseTopic.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } });
  },

  upsertTopic(input: { userId: string; courseCode: string; courseTitle: string; currentTopic: string }): Promise<CourseTopic> {
    return prisma.courseTopic.upsert({
      where: { userId_courseCode: { userId: input.userId, courseCode: input.courseCode } },
      create: {
        userId: input.userId,
        courseCode: input.courseCode,
        courseTitle: input.courseTitle,
        currentTopic: input.currentTopic
      },
      update: {
        courseTitle: input.courseTitle,
        currentTopic: input.currentTopic
      }
    });
  }
};
