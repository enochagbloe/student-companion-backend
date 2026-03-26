import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import { notificationsController } from './controllers/notifications.controller';
import { registerTokenSchema, testNotificationSchema, unregisterTokenSchema } from './validators/notifications.validator';

const router = Router();

router.use(authMiddleware);
router.post('/register', validate(registerTokenSchema), asyncHandler(notificationsController.register));
router.delete('/register', validate(unregisterTokenSchema), asyncHandler(notificationsController.unregister));
router.post('/test', validate(testNotificationSchema), asyncHandler(notificationsController.test));

export default router;
