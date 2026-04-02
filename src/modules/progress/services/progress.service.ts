import { DateTime } from 'luxon';
import { prisma } from '../../../config/prisma';
import { TaskStatus } from '@prisma/client';

const computeStreak = (dates: string[], todayIso: string) => {
  const set = new Set(dates);
  let streak = 0;
  let cursor = DateTime.fromISO(todayIso).startOf('day');
  while (true) {
    const key = cursor.toISODate() as string;
    if (!set.has(key)) break;
    streak += 1;
    cursor = cursor.minus({ days: 1 });
  }
  return streak;
};

export const progressService = {
  async summary(userId: string) {
    const now = DateTime.now();
    const weekStart = now.startOf('week');

    const weeklyGoal = 360;

    const focusSessions = await prisma.focusSession.findMany({
      where: { userId, createdAt: { gte: weekStart.toJSDate() } },
      select: { durationMinutes: true, createdAt: true }
    });

    const weeklyMinutes = focusSessions.reduce<number>((acc, s) => acc + s.durationMinutes, 0);
    const focusSessionCount = focusSessions.length;

    const tasks = await prisma.studyTask.findMany({
      where: { userId, createdAt: { gte: weekStart.toJSDate() } },
      select: { status: true, createdAt: true }
    });

    const completedTasks = tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
    const totalTasks = tasks.length;

    const progress = weeklyGoal > 0 ? Math.min(1, weeklyMinutes / weeklyGoal) : 0;
    const score = Math.round(progress * 100);
    const maxScore = 100;

    const activityDates = new Set<string>();
    for (const s of focusSessions) {
      activityDates.add(DateTime.fromJSDate(s.createdAt).toISODate() as string);
    }
    for (const t of tasks) {
      if (t.status === TaskStatus.COMPLETED) {
        activityDates.add(DateTime.fromJSDate(t.createdAt).toISODate() as string);
      }
    }
    const streakDays = computeStreak(Array.from(activityDates), now.toISODate() as string);

    const daysUntilTest = 0;
    const testDateLabel = 'No upcoming tests';

    return {
      score,
      maxScore,
      weeklyMinutes,
      weeklyGoal,
      daysUntilTest,
      testDateLabel,
      progress,
      streakDays,
      completedTasks,
      focusSessions: focusSessionCount
    };
  }
};
