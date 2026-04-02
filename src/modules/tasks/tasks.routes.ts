import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import { tasksController } from './controllers/tasks.controller';
import { acceptTaskSchema, createTaskSchema, listTasksSchema, taskIdParamSchema, updateTaskSchema } from './validators/tasks.validator';

const router = Router();

router.use(authMiddleware);
router.get('/', validate(listTasksSchema), asyncHandler(tasksController.list));
router.post('/', validate(createTaskSchema), asyncHandler(tasksController.create));
router.patch('/:id', validate(updateTaskSchema), asyncHandler(tasksController.update));
router.delete('/:id', validate(taskIdParamSchema), asyncHandler(tasksController.remove));
router.post('/:id/accept', validate(acceptTaskSchema), asyncHandler(tasksController.accept));

export default router;
