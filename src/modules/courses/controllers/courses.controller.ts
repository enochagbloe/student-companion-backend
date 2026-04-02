import { Response } from 'express';
import { AuthenticatedRequest } from '../../../common/types';
import { coursesService } from '../services/courses.service';

export const coursesController = {
  async listTopics(req: AuthenticatedRequest, res: Response) {
    const items = await coursesService.listTopics(req.user!.id);
    res.status(200).json(items);
  },

  async upsertTopic(req: AuthenticatedRequest, res: Response) {
    const item = await coursesService.upsertTopic({
      userId: req.user!.id,
      courseCode: req.body.courseCode,
      courseTitle: req.body.courseTitle,
      currentTopic: req.body.currentTopic
    });
    res.status(200).json(item);
  }
};
