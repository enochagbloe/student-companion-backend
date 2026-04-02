import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import { aiTasksController } from './controllers/ai-tasks.controller';
import { suggestTasksSchema } from './validators/ai-tasks.validator';

const router = Router();

router.use(authMiddleware);
router.post('/suggest', validate(suggestTasksSchema), asyncHandler(aiTasksController.suggest));

export default router;
