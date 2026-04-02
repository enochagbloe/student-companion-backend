import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import { coursesController } from './controllers/courses.controller';
import { listTopicsSchema, upsertTopicSchema } from './validators/courses.validator';

const router = Router();

router.use(authMiddleware);
router.get('/topics', validate(listTopicsSchema), asyncHandler(coursesController.listTopics));
router.post('/topics', validate(upsertTopicSchema), asyncHandler(coursesController.upsertTopic));

export default router;
