import { Response } from 'express';
import { AuthenticatedRequest } from '../../../common/types';
import { studyPlanService } from '../services/study-plan.service';

export const studyPlanController = {
  async generate(req: AuthenticatedRequest, res: Response) {
    const plan = await studyPlanService.generate(req.user!.id);
    res.status(201).json(plan);
  },

  async get(req: AuthenticatedRequest, res: Response) {
    const plan = await studyPlanService.get(req.user!.id);
    res.status(200).json(plan);
  }
};
