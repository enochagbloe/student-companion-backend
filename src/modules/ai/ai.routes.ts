import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import { aiController } from './controllers/ai.controller';
import {
  aiChatSchema,
  conversationIdParamSchema,
  createConversationSchema,
  listConversationsSchema,
  memorySchema,
  patchMemorySchema,
  scheduleSchema,
  syllabusSummarySchema
} from './validators/ai.validator';

const router = Router();

router.use(authMiddleware);

router.get('/conversations', validate(listConversationsSchema), asyncHandler(aiController.listConversations));
router.post('/conversations', validate(createConversationSchema), asyncHandler(aiController.createConversation));
router.get('/conversations/:id/messages', validate(conversationIdParamSchema), asyncHandler(aiController.getMessages));

router.post('/chat', validate(aiChatSchema), asyncHandler(aiController.chat));

router.get('/memory', validate(memorySchema), asyncHandler(aiController.getMemory));
router.patch('/memory', validate(patchMemorySchema), asyncHandler(aiController.patchMemory));

router.post('/schedule', validate(scheduleSchema), asyncHandler(aiController.createSchedule));
router.get('/syllabus/summary', validate(syllabusSummarySchema), asyncHandler(aiController.summarizeSyllabus));

export default router;
