import { prisma } from '../../../config/prisma';
import { Prisma, CalendarEvent } from '@prisma/client';

export const calendarRepository = {
  create(data: Prisma.CalendarEventUncheckedCreateInput): Promise<CalendarEvent> {
    return prisma.calendarEvent.create({ data });
  },

  findBySource(userId: string, source: string, sourceId: string): Promise<CalendarEvent | null> {
    return prisma.calendarEvent.findFirst({ where: { userId, source, sourceId } });
  }
};
