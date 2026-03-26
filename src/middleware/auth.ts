import { NextFunction, Response } from 'express';
import createHttpError from 'http-errors';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../common/types';

export const authMiddleware = async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  const authHeader = req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return next(createHttpError(401, 'Missing or invalid authorization header.'));
  }

  const token = authHeader.slice('Bearer '.length);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string };
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user) {
      return next(createHttpError(401, 'Invalid token user.'));
    }

    req.user = { id: user.id, email: user.email, timezone: user.timezone, role: user.role };
    next();
  } catch {
    next(createHttpError(401, 'Invalid or expired token.'));
  }
};
