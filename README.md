# Student Companion Backend (MVP)

Backend for the Student Companionship mobile app MVP.

## Stack
- Node.js + Express + TypeScript
- PostgreSQL + Prisma
- OpenAI API
- Supabase Storage (PDF uploads)
- JWT auth

## MVP Features
- Auth: Google sign-in (ID token verification) + JWT
- Timetable CRUD: `courseName`, `day`, `startTime`, `endTime`
- Syllabus upload: one PDF per user, text extraction and storage
- Study plan generation: strict JSON plan generated from syllabus + timetable
- AI chat: syllabus-aware responses, 20 messages/day cap
- Reminder payloads: deterministic class + study reminders for mobile scheduling

## Environment
Copy `.env.example` to `.env` and fill values.

Required:
- `DATABASE_URL`
- `JWT_SECRET` (>= 32 chars)
- `GOOGLE_CLIENT_ID`
- `CORS_ORIGINS` (optional, comma-separated)
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL` (set `https://openrouter.ai/api/v1` when using OpenRouter)
- `OPENAI_MODEL` (example: `openai/gpt-4o-mini`)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_BUCKET`

## Setup
```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

## API Overview
Base URL: `/api/v1`

- `POST /auth/google`
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/forgot-password`
- `GET|POST|PATCH|DELETE /timetable`
- `GET /timetable/status`
- `GET|POST /syllabus`
- `POST /study-plan/generate`
- `GET /study-plan`
- `POST /chat`
- `GET /chat`
- `GET /reminders?daysAhead=7&studyHourLocal=18`
- `GET /me`
- `GET /ai/conversations`
- `POST /ai/conversations`
- `GET /ai/conversations/:id/messages`
- `POST /ai/chat`
- `GET /ai/memory`
- `PATCH /ai/memory`
- `POST /ai/schedule`
- `POST /notifications/register`
- `DELETE /notifications/register`
- `POST /notifications/test`
- `GET /progress/summary`

Auth-protected routes use `Authorization: Bearer <token>`.
Detailed frontend contract: see `ENDPOINTS.md`.

## Chat Rate Limit
- 20 user messages/day (based on user timezone)
- On limit exceed: `429 Too Many Requests`
- Includes `X-RateLimit-Reset` header with next reset time in UTC ISO format
