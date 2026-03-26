import { Response } from 'express';
import createHttpError from 'http-errors';
import { AuthenticatedRequest } from '../../../common/types';
import { timetableService } from '../services/timetable.service';
import { timetableImportService } from '../services/timetable-import.service';
import { timetableStatusService } from '../services/timetable-status.service';

export const timetableController = {
  async create(req: AuthenticatedRequest, res: Response) {
    const item = await timetableService.create(req.user!.id, req.body);
    res.status(201).json(item);
  },

  async list(req: AuthenticatedRequest, res: Response) {
    const items = await timetableService.list(req.user!.id);
    res.status(200).json(items);
  },

  async update(req: AuthenticatedRequest, res: Response) {
    const item = await timetableService.update(req.user!.id, String(req.params.id), req.body);
    res.status(200).json(item);
  },

  async remove(req: AuthenticatedRequest, res: Response) {
    await timetableService.remove(req.user!.id, String(req.params.id));
    res.status(204).send();
  },

  async importPdf(req: AuthenticatedRequest, res: Response) {
    const file = req.file as Express.Multer.File | undefined;
    if (!file) {
      throw createHttpError(400, 'PDF file is required.');
    }

    const result = await timetableImportService.importPdf(req.user!.id, file.buffer, {
      dryRun: Boolean((req.query as any).dryRun),
      debug: Boolean((req.query as any).debug)
    });

    res.status(201).json(result);
  },

  async status(req: AuthenticatedRequest, res: Response) {
    const result = await timetableStatusService.getStatus({
      userId: req.user!.id,
      timezone: req.user!.timezone,
      at: (req.query as any).at,
      includeToday: Boolean((req.query as any).includeToday)
    });

    res.status(200).json(result);
  }
};
