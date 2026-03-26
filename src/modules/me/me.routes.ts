import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { asyncHandler } from '../../utils/async-handler';
import { AuthenticatedRequest } from '../../common/types';

const router = Router();

router.get(
  '/',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    res.status(200).json({ user: req.user });
  })
);

export default router;
