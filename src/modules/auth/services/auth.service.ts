import createHttpError from 'http-errors';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import bcrypt from 'bcryptjs';
import { env } from '../../../config/env';
import { authRepository } from '../repositories/auth.repository';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export const authService = {
  async registerWithPassword(input: { email: string; password: string; timezone: string }) {
    const email = input.email.toLowerCase();
    const existing = await authRepository.findByEmail(email);
    if (existing) {
      throw createHttpError(409, 'Email already in use.');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await authRepository.createPasswordUser({
      email,
      passwordHash,
      timezone: input.timezone
    });

    const token = jwt.sign({ sub: user.id }, env.JWT_SECRET, { expiresIn: '7d' });
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        timezone: user.timezone
      }
    };
  },

  async loginWithPassword(input: { email: string; password: string }) {
    const email = input.email.toLowerCase();
    const user = await authRepository.findByEmail(email);
    if (!user || !user.passwordHash) {
      throw createHttpError(401, 'Invalid credentials.');
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw createHttpError(401, 'Invalid credentials.');
    }

    const token = jwt.sign({ sub: user.id }, env.JWT_SECRET, { expiresIn: '7d' });
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        timezone: user.timezone
      }
    };
  },

  async forgotPassword(_input: { email: string }) {
    // v1 stub: do not reveal whether the email exists.
    return { ok: true };
  },

  async signInWithGoogle(input: { idToken: string; timezone: string }) {
    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken: input.idToken,
        audience: env.GOOGLE_CLIENT_ID
      });
    } catch {
      throw createHttpError(401, 'Invalid or expired Google idToken.');
    }

    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) {
      throw createHttpError(401, 'Invalid Google token payload.');
    }

    if (payload.email_verified === false) {
      throw createHttpError(401, 'Google email is not verified.');
    }

    const googleId = payload.sub;
    const email = payload.email.toLowerCase();

    let user = await authRepository.findByGoogleId(googleId);
    if (!user) {
      const byEmail = await authRepository.findByEmail(email);
      user = byEmail
        ? await authRepository.linkGoogleToUser(byEmail.id, googleId, input.timezone)
        : await authRepository.createGoogleUser({ email, googleId, timezone: input.timezone });
    }

    const token = jwt.sign({ sub: user.id }, env.JWT_SECRET, { expiresIn: '7d' });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        timezone: user.timezone
      }
    };
  }
};
