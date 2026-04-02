import express from 'express';
import cors from 'cors';
import createHttpError from 'http-errors';
import { env } from './config/env';
import authRoutes from './modules/auth/auth.routes';
import timetableRoutes from './modules/timetable/timetable.routes';
import syllabusRoutes from './modules/syllabus/syllabus.routes';
import studyPlanRoutes from './modules/study-plan/study-plan.routes';
import chatRoutes from './modules/chat/chat.routes';
import remindersRoutes from './modules/reminders/reminders.routes';
import meRoutes from './modules/me/me.routes';
import aiRoutes from './modules/ai/ai.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import progressRoutes from './modules/progress/progress.routes';
import coursesRoutes from './modules/courses/courses.routes';
import tasksRoutes from './modules/tasks/tasks.routes';
import focusSessionsRoutes from './modules/focus-sessions/focus-sessions.routes';
import aiTasksRoutes from './modules/ai-tasks/ai-tasks.routes';
import { errorHandler } from './middleware/error-handler';

const app = express();

const corsOrigins = env.CORS_ORIGINS
  ? env.CORS_ORIGINS.split(',').map((v) => v.trim()).filter(Boolean)
  : null;

app.use(
  cors({
    origin: corsOrigins && corsOrigins.length > 0 ? corsOrigins : true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/timetable', timetableRoutes);
app.use('/api/v1/syllabus', syllabusRoutes);
app.use('/api/v1/study-plan', studyPlanRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/reminders', remindersRoutes);
app.use('/api/v1/me', meRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/progress', progressRoutes);
app.use('/api/v1/courses', coursesRoutes);
app.use('/api/v1/tasks', tasksRoutes);
app.use('/api/v1/focus-sessions', focusSessionsRoutes);
app.use('/api/v1/ai/tasks', aiTasksRoutes);

app.use((_req, _res, next) => {
  next(createHttpError(404, 'Route not found.'));
});

app.use(errorHandler);

export default app;
