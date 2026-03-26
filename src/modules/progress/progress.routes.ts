import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import { progressController } from './controllers/progress.controller';
import { progressSummarySchema } from './validators/progress.validator';

const router = Router();

router.use(authMiddleware);
router.get('/summary', validate(progressSummarySchema), asyncHandler(progressController.summary));

export default router;
