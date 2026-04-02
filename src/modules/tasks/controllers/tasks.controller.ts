import { Response } from 'express';
import { AuthenticatedRequest } from '../../../common/types';
import { tasksService } from '../services/tasks.service';

export const tasksController = {
  async list(req: AuthenticatedRequest, res: Response) {
    const items = await tasksService.list(req.user!.id, {
      status: req.query.status ? String(req.query.status) : undefined,
      date: req.query.date ? String(req.query.date) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined
    });
    res.status(200).json(items);
  },

  async create(req: AuthenticatedRequest, res: Response) {
    const item = await tasksService.create(req.user!.id, req.body);
    res.status(201).json(item);
  },

  async update(req: AuthenticatedRequest, res: Response) {
    const item = await tasksService.update(req.user!.id, String(req.params.id), req.body);
    res.status(200).json(item);
  },

  async remove(req: AuthenticatedRequest, res: Response) {
    await tasksService.remove(req.user!.id, String(req.params.id));
    res.status(204).send();
  },

  async accept(req: AuthenticatedRequest, res: Response) {
    await tasksService.accept(req.user!.id, String(req.params.id));
    res.status(200).json({ ok: true });
  }
};
