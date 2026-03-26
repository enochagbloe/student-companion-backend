import { Response } from 'express';
import { AuthenticatedRequest } from '../../../common/types';
import { notificationsService } from '../services/notifications.service';

export const notificationsController = {
  async register(req: AuthenticatedRequest, res: Response) {
    const result = await notificationsService.register({
      userId: req.user!.id,
      token: req.body.token,
      platform: req.body.platform
    });
    res.status(200).json(result);
  },

  async unregister(req: AuthenticatedRequest, res: Response) {
    const result = await notificationsService.unregister({
      userId: req.user!.id,
      token: req.body?.token
    });
    res.status(200).json(result);
  },

  async test(req: AuthenticatedRequest, res: Response) {
    const result = await notificationsService.testSend({
      token: req.body.token,
      title: req.body.title,
      body: req.body.body
    });
    res.status(200).json(result);
  }
};
