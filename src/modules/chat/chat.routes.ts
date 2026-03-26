import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import { chatController } from './controllers/chat.controller';
import { createChatMessageSchema } from './validators/chat.validator';

const router = Router();

router.use(authMiddleware);
router.post('/', validate(createChatMessageSchema), asyncHandler(chatController.send));
router.get('/', asyncHandler(chatController.list));

export default router;
