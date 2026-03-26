import createHttpError from 'http-errors';
import { PushPlatform } from '@prisma/client';
import { notificationsRepository } from '../repositories/notifications.repository';

const toPlatform = (platform: string): PushPlatform => {
  const normalized = platform.toLowerCase();
  if (normalized === 'ios') return PushPlatform.IOS;
  if (normalized === 'android') return PushPlatform.ANDROID;
  throw createHttpError(400, 'Invalid platform.');
};

export const notificationsService = {
  async register(input: { userId: string; token: string; platform: string }) {
    const platform = toPlatform(input.platform);
    await notificationsRepository.upsertForUser({ userId: input.userId, token: input.token, platform });
    return { ok: true };
  },

  async unregister(input: { userId: string; token?: string }) {
    if (input.token) {
      await notificationsRepository.deleteByUserAndToken(input.userId, input.token);
    } else {
      await notificationsRepository.deleteByUser(input.userId);
    }
    return { ok: true };
  },

  async testSend(input: { token: string; title: string; body: string }) {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: input.token, title: input.title, body: input.body })
    });

    if (!response.ok) {
      const text = await response.text();
      throw createHttpError(502, `Expo push send failed: ${text}`);
    }

    return { ok: true };
  }
};
