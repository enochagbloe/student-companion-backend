import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import { timetableController } from './controllers/timetable.controller';
import { createTimetableSchema, timetableIdParamSchema, updateTimetableSchema } from './validators/timetable.validator';
import { importTimetableSchema } from './validators/timetable-import.validator';
import { timetableStatusSchema } from './validators/timetable-status.validator';
import multer from 'multer';
import createHttpError from 'http-errors';
import { env } from '../../config/env';

const router = Router();

const maxBytes = env.PDF_MAX_MB * 1024 * 1024;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxBytes },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      cb(createHttpError(400, 'Only PDF files are allowed.'));
      return;
    }

    cb(null, true);
  }
});

router.use(authMiddleware);
router.post('/import', upload.single('file'), validate(importTimetableSchema), asyncHandler(timetableController.importPdf));
router.get('/status', validate(timetableStatusSchema), asyncHandler(timetableController.status));
router.post('/', validate(createTimetableSchema), asyncHandler(timetableController.create));
router.get('/', asyncHandler(timetableController.list));
router.patch('/:id', validate(updateTimetableSchema), asyncHandler(timetableController.update));
router.delete('/:id', validate(timetableIdParamSchema), asyncHandler(timetableController.remove));

export default router;
