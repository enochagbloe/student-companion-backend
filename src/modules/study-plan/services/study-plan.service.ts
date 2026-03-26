import createHttpError from 'http-errors';
import { aiClient } from '../../../utils/openai';
import { studyPlanRepository } from '../repositories/study-plan.repository';
import { syllabusRepository } from '../../syllabus/repositories/syllabus.repository';
import { timetableRepository } from '../../timetable/repositories/timetable.repository';

export const studyPlanService = {
  async generate(userId: string) {
    const syllabus = await syllabusRepository.findByUser(userId);
    if (!syllabus) {
      throw createHttpError(400, 'Upload syllabus before generating study plan.');
    }

    const timetable = await timetableRepository.findByUser(userId);
    if (timetable.length === 0) {
      throw createHttpError(400, 'Create timetable entries before generating study plan.');
    }

    const planItems = await aiClient.generateStudyPlan({
      syllabusText: syllabus.extractedText,
      timetable: timetable.map((entry) => ({
        day: entry.day,
        courseName: entry.courseName,
        startTime: entry.startTime,
        endTime: entry.endTime
      }))
    });

    return studyPlanRepository.upsert(userId, planItems as any);
  },

  async get(userId: string) {
    const plan = await studyPlanRepository.findByUser(userId);
    if (!plan) {
      throw createHttpError(404, 'Study plan not found.');
    }

    return plan;
  }
};
