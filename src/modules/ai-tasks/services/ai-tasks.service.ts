import { DateTime } from 'luxon';
import { TaskSource, TaskStatus } from '@prisma/client';
import { tasksRepository } from '../../tasks/repositories/tasks.repository';

export const aiTasksService = {
  async suggest(userId: string, input: any) {
    const titleBase = input.context?.topic ? `Review ${input.context.topic}` : 'Review key concepts';
    const description = input.notes ?? 'Short focused review session.';
    const duration = input.context?.timeAvailableMinutes ?? 30;

    const scheduledFor = DateTime.now().plus({ minutes: 30 }).toJSDate();

    const task = await tasksRepository.create({
      userId,
      title: titleBase,
      description,
      courseCode: input.context?.courseCode ?? null,
      courseTitle: input.context?.courseTitle ?? null,
      durationMinutes: duration,
      status: TaskStatus.PENDING,
      source: TaskSource.AI,
      scheduledFor
    });

    return { suggestions: [task] };
  }
};
