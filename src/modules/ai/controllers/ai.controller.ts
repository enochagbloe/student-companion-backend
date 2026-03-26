import { Response } from 'express';
import { AuthenticatedRequest } from '../../../common/types';
import { aiService } from '../services/ai.service';

export const aiController = {
  async listConversations(req: AuthenticatedRequest, res: Response) {
    const result = await aiService.listConversations(req.user!.id);
    res.status(200).json(result);
  },

  async createConversation(req: AuthenticatedRequest, res: Response) {
    const result = await aiService.createConversation(req.user!.id, req.body.title);
    res.status(201).json(result);
  },

  async getMessages(req: AuthenticatedRequest, res: Response) {
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const cursor = req.query.cursor ? String(req.query.cursor) : undefined;
    const result = await aiService.getMessages(req.user!.id, String(req.params.id), limit, cursor);
    res.status(200).json(result);
  },

  async chat(req: AuthenticatedRequest, res: Response) {
    try {
      const result = await aiService.chat({
        userId: req.user!.id,
        timezone: req.body?.context?.timezone ?? req.user!.timezone,
        conversationId: req.body.conversationId,
        userText: req.body.message.text,
        context: req.body.context,
        preferences: req.body.preferences
      });

      res.setHeader('X-RateLimit-Limit', String(result.rateLimit.limit));
      res.setHeader('X-RateLimit-Remaining', String(result.rateLimit.remaining));
      res.setHeader('X-RateLimit-Reset', result.rateLimit.resetAt);

    res.status(200).json({
      conversationId: result.conversationId,
      assistant: result.assistant
    });
    } catch (err: any) {
      if (err?.status === 429) {
        if (err.limit !== undefined) res.setHeader('X-RateLimit-Limit', String(err.limit));
        if (err.remaining !== undefined) res.setHeader('X-RateLimit-Remaining', String(err.remaining));
        if (err.resetAt) res.setHeader('X-RateLimit-Reset', String(err.resetAt));
      }
      throw err;
    }
  },

  async getMemory(req: AuthenticatedRequest, res: Response) {
    const result = await aiService.getMemory(req.user!.id);
    res.status(200).json(result);
  },

  async patchMemory(req: AuthenticatedRequest, res: Response) {
    const result = await aiService.patchMemory(req.user!.id, req.body.writes);
    res.status(200).json(result);
  },

  async createSchedule(req: AuthenticatedRequest, res: Response) {
    const result = await aiService.createSchedule({
      userId: req.user!.id,
      goal: req.body.goal,
      days: req.body.days,
      dailyMinutes: req.body.dailyMinutes,
      constraints: req.body.constraints,
      courses: req.body.courses
    });

    res.status(200).json(result);
  },

  async summarizeSyllabus(req: AuthenticatedRequest, res: Response) {
    const maxBullets = req.query.maxBullets ? Number(req.query.maxBullets) : undefined;
    const result = await aiService.summarizeSyllabus({ userId: req.user!.id, maxBullets });
    res.status(200).json(result);
  }
};
