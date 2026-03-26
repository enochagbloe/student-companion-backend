import { Router } from 'express';
import multer from 'multer';
import createHttpError from 'http-errors';
import { authMiddleware } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import { env } from '../../config/env';
import { syllabusController } from './controllers/syllabus.controller';
import { uploadSyllabusSchema } from './validators/syllabus.validator';

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
router.post('/', upload.single('file'), validate(uploadSyllabusSchema), asyncHandler(syllabusController.upload));
router.get('/', asyncHandler(syllabusController.get));

export default router;
