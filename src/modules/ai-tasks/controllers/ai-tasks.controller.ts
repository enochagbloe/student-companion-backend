import { Response } from 'express';
import { AuthenticatedRequest } from '../../../common/types';
import { aiTasksService } from '../services/ai-tasks.service';

export const aiTasksController = {
  async suggest(req: AuthenticatedRequest, res: Response) {
    const result = await aiTasksService.suggest(req.user!.id, req.body);
    res.status(201).json(result);
  }
};
