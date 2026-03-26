import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import { studyPlanController } from './controllers/study-plan.controller';
import { generatePlanSchema } from './validators/study-plan.validator';

const router = Router();

router.use(authMiddleware);
router.post('/generate', validate(generatePlanSchema), asyncHandler(studyPlanController.generate));
router.get('/', asyncHandler(studyPlanController.get));

export default router;
