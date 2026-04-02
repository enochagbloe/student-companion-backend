import { Response } from 'express';
import { AuthenticatedRequest } from '../../../common/types';
import { focusSessionsService } from '../services/focus-sessions.service';

export const focusSessionsController = {
  async create(req: AuthenticatedRequest, res: Response) {
    const item = await focusSessionsService.create(req.user!.id, req.body);
    res.status(201).json(item);
  },

  async list(req: AuthenticatedRequest, res: Response) {
    const items = await focusSessionsService.list(req.user!.id, req.query.range ? String(req.query.range) : undefined);
    res.status(200).json(items);
  }
};
