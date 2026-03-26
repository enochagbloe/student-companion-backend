import { Response } from 'express';
import { AuthenticatedRequest } from '../../../common/types';
import { syllabusService } from '../services/syllabus.service';

export const syllabusController = {
  async upload(req: AuthenticatedRequest, res: Response) {
    const syllabus = await syllabusService.upload(req.user!.id, req.file as Express.Multer.File);
    res.status(201).json(syllabus);
  },

  async get(req: AuthenticatedRequest, res: Response) {
    const syllabus = await syllabusService.get(req.user!.id);
    res.status(200).json(syllabus);
  }
};
