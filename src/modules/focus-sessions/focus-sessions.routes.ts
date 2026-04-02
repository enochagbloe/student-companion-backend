import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import { focusSessionsController } from './controllers/focus-sessions.controller';
import { createFocusSessionSchema, listFocusSessionsSchema } from './validators/focus-sessions.validator';

const router = Router();

router.use(authMiddleware);
router.post('/', validate(createFocusSessionSchema), asyncHandler(focusSessionsController.create));
router.get('/', validate(listFocusSessionsSchema), asyncHandler(focusSessionsController.list));

export default router;
