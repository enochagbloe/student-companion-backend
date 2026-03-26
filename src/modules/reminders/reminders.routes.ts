import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import { remindersController } from './controllers/reminders.controller';
import { getRemindersSchema } from './validators/reminders.validator';

const router = Router();

router.use(authMiddleware);
router.get('/', validate(getRemindersSchema), asyncHandler(remindersController.list));

export default router;
