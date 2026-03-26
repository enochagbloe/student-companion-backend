import { Response } from 'express';
import { AuthenticatedRequest } from '../../../common/types';
import { remindersService } from '../services/reminders.service';

export const remindersController = {
  async list(req: AuthenticatedRequest, res: Response) {
    const reminders = await remindersService.list({
      userId: req.user!.id,
      timezone: req.user!.timezone,
      daysAhead: req.query.daysAhead ? Number(req.query.daysAhead) : undefined,
      studyHourLocal: req.query.studyHourLocal ? Number(req.query.studyHourLocal) : undefined
    });

    res.status(200).json(reminders);
  }
};
