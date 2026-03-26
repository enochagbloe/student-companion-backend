import { Request, Response } from 'express';
import { authService } from '../services/auth.service';

export const authController = {
  async register(req: Request, res: Response) {
    const result = await authService.registerWithPassword(req.body);
    res.status(201).json(result);
  },

  async login(req: Request, res: Response) {
    const result = await authService.loginWithPassword(req.body);
    res.status(200).json(result);
  },

  async forgotPassword(req: Request, res: Response) {
    const result = await authService.forgotPassword(req.body);
    res.status(200).json(result);
  },

  async google(req: Request, res: Response) {
    const result = await authService.signInWithGoogle(req.body);
    res.status(200).json(result);
  }
};
