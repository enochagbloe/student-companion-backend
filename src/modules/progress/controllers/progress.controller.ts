import { Response } from 'express';
import { AuthenticatedRequest } from '../../../common/types';
import { progressService } from '../services/progress.service';

export const progressController = {
  async summary(req: AuthenticatedRequest, res: Response) {
    const result = await progressService.summary(req.user!.id);
    res.status(200).json(result);
  }
};
