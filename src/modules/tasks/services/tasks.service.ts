import createHttpError from 'http-errors';
import { DateTime } from 'luxon';
import { TaskSource, TaskStatus } from '@prisma/client';
import { tasksRepository } from '../repositories/tasks.repository';
import { calendarService } from '../../calendar/services/calendar.service';

const toDateTime = (value?: string | null) => {
  if (!value) return null;
  const dt = DateTime.fromISO(value, { setZone: true });
  if (!dt.isValid) {
    throw createHttpError(400, 'Invalid date format. Use ISO string.');
  }
  return dt.toJSDate();
};

export const tasksService = {
  async list(userId: string, input: { status?: string; date?: string; limit?: number }) {
    const limit = input.limit ?? 50;
    const where: any = {};

    if (input.status && input.status !== 'all') {
      const status = input.status.toUpperCase() as TaskStatus;
      where.status = status;
    }

    if (input.date) {
      const dt = DateTime.fromISO(input.date, { zone: 'utc' });
      if (!dt.isValid) {
        throw createHttpError(400, 'Invalid date query. Use YYYY-MM-DD.');
      }
      const start = dt.startOf('day').toJSDate();
      const end = dt.endOf('day').toJSDate();
      where.scheduledFor = { gte: start, lte: end };
    }

    return tasksRepository.list(userId, where, limit);
  },

  async create(userId: string, input: any) {
    const task = await tasksRepository.create({
      userId,
      title: input.title,
      description: input.description ?? null,
      courseCode: input.courseCode ?? null,
      courseTitle: input.courseTitle ?? null,
      durationMinutes: input.durationMinutes ?? null,
      status: TaskStatus.PENDING,
      source: TaskSource.USER,
      scheduledFor: toDateTime(input.scheduledFor)
    });

    await calendarService.createForTask({
      userId,
      taskId: task.id,
      title: task.title,
      description: task.description,
      scheduledFor: task.scheduledFor,
      durationMinutes: task.durationMinutes
    });

    return task;
  },

  async update(userId: string, id: string, input: any) {
    const existing = await tasksRepository.findById(userId, id);
    if (!existing) {
      throw createHttpError(404, 'Task not found.');
    }

    const status = input.status ? (input.status.toUpperCase() as TaskStatus) : undefined;
    const dismissedAt = status === TaskStatus.DISMISSED ? new Date() : undefined;

    return tasksRepository.update(id, {
      title: input.title ?? undefined,
      description: input.description ?? undefined,
      courseCode: input.courseCode ?? undefined,
      courseTitle: input.courseTitle ?? undefined,
      durationMinutes: input.durationMinutes ?? undefined,
      status,
      scheduledFor: toDateTime(input.scheduledFor) ?? undefined,
      dismissedAt
    });
  },

  async remove(userId: string, id: string) {
    const existing = await tasksRepository.findById(userId, id);
    if (!existing) {
      throw createHttpError(404, 'Task not found.');
    }

    await tasksRepository.delete(id);
  },

  async accept(userId: string, id: string) {
    const existing = await tasksRepository.findById(userId, id);
    if (!existing) {
      throw createHttpError(404, 'Task not found.');
    }

    return tasksRepository.update(id, {
      acceptedAt: new Date(),
      status: TaskStatus.PENDING
    });
  }
};
