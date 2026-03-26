import { Prisma, Timetable } from '@prisma/client';
import { prisma } from '../../../config/prisma';

export const timetableRepository = {
  create(data: Prisma.TimetableUncheckedCreateInput): Promise<Timetable> {
    return prisma.timetable.create({ data });
  },

  findByUser(userId: string): Promise<Timetable[]> {
    return prisma.timetable.findMany({ where: { userId }, orderBy: [{ day: 'asc' }, { startTime: 'asc' }] });
  },

  findOneByIdAndUser(id: string, userId: string): Promise<Timetable | null> {
    return prisma.timetable.findFirst({ where: { id, userId } });
  },

  update(id: string, data: Prisma.TimetableUpdateInput): Promise<Timetable> {
    return prisma.timetable.update({ where: { id }, data });
  },

  remove(id: string): Promise<Timetable> {
    return prisma.timetable.delete({ where: { id } });
  }
};
