import { ChatRole } from '@prisma/client';
import createHttpError from 'http-errors';
import { DateTime } from 'luxon';
import { env } from '../../../config/env';
import { aiClient } from '../../../utils/openai';
import { chatRepository } from '../repositories/chat.repository';
import { syllabusRepository } from '../../syllabus/repositories/syllabus.repository';

export const chatService = {
  async sendMessage(input: { userId: string; timezone: string; message: string }) {
    const nowLocal = DateTime.now().setZone(input.timezone);
    if (!nowLocal.isValid) {
      throw createHttpError(400, 'Invalid user timezone.');
    }

    const dayStartUtc = nowLocal.startOf('day').toUTC().toJSDate();
    const nextDayStartUtc = nowLocal.plus({ days: 1 }).startOf('day').toUTC().toJSDate();
    const resetAtIso = nowLocal.plus({ days: 1 }).startOf('day').toUTC().toISO() as string;

    const used = await chatRepository.countUserMessagesInWindow(input.userId, dayStartUtc, nextDayStartUtc);
    if (used >= env.CHAT_DAILY_LIMIT) {
      throw createHttpError(429, 'Daily AI chat limit reached, try again tomorrow.', { resetAt: resetAtIso });
    }

    const syllabus = await syllabusRepository.findByUser(input.userId);
    if (!syllabus) {
      throw createHttpError(400, 'Upload syllabus before using AI chat.');
    }

    await chatRepository.create({
      userId: input.userId,
      message: input.message,
      role: ChatRole.USER
    });

    const answer = await aiClient.answerWithSyllabus({
      syllabusText: syllabus.extractedText,
      userMessage: input.message
    });

    await chatRepository.create({
      userId: input.userId,
      message: answer,
      role: ChatRole.ASSISTANT
    });

    return {
      message: answer,
      usage: {
        used: used + 1,
        limit: env.CHAT_DAILY_LIMIT,
        resetAt: resetAtIso
      }
    };
  },

  list(userId: string) {
    return chatRepository.listByUser(userId);
  }
};
