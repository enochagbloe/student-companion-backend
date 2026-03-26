import { Request } from 'express';

export type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    email: string;
    timezone: string;
    role: string;
  };
};

export type StudyPlanItem = {
  date: string;
  courseName: string;
  topic: string;
  durationMin: number;
};

export type ReminderItem = {
  title: string;
  body: string;
  scheduledAt: string;
};
