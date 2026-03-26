import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { validate } from '../../middleware/validate';
import { authController } from './controllers/auth.controller';
import { forgotPasswordSchema, googleAuthSchema, loginSchema, registerSchema } from './validators/auth.validator';

const router = Router();

router.post('/register', validate(registerSchema), asyncHandler(authController.register));
router.post('/login', validate(loginSchema), asyncHandler(authController.login));
router.post('/forgot-password', validate(forgotPasswordSchema), asyncHandler(authController.forgotPassword));
router.post('/google', validate(googleAuthSchema), asyncHandler(authController.google));

export default router;
