import { Response } from 'express';
import { AuthenticatedRequest } from '../../../common/types';
import { chatService } from '../services/chat.service';

export const chatController = {
  async send(req: AuthenticatedRequest, res: Response) {
    try {
      const response = await chatService.sendMessage({
        userId: req.user!.id,
        timezone: req.user!.timezone,
        message: req.body.message
      });

      res.setHeader('X-RateLimit-Reset', response.usage.resetAt);
      res.status(200).json(response);
    } catch (error: any) {
      if (error.status === 429 && error.resetAt) {
        res.setHeader('X-RateLimit-Reset', error.resetAt);
      }

      throw error;
    }
  },

  async list(req: AuthenticatedRequest, res: Response) {
    const messages = await chatService.list(req.user!.id);
    res.status(200).json(messages);
  }
};
