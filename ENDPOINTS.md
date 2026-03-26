# API Endpoints (Frontend Integration)

Base URL: `/api/v1`

Auth header for protected routes:
`Authorization: Bearer <token>`

Auth token expiry: 7 days (no refresh endpoint yet).

## Health

### `GET /health`
Public health check.

Response `200`:
```json
{ "status": "ok" }
```

## Auth

### `POST /auth/register`
Create a password-based account.

Body:
```json
{ "email": "user@example.com", "password": "password123", "timezone": "Africa/Accra" }
```

Response `201`:
```json
{ "token": "jwt", "user": { "id": "cuid", "email": "user@example.com", "role": "STUDENT", "timezone": "Africa/Accra" } }
```

### `POST /auth/login`
Login with email + password.

Body:
```json
{ "email": "user@example.com", "password": "password123" }
```

Response `200`:
```json
{ "token": "jwt", "user": { "id": "cuid", "email": "user@example.com", "role": "STUDENT", "timezone": "Africa/Accra" } }
```

### `POST /auth/forgot-password`
Password reset stub (does not disclose account existence).

Body:
```json
{ "email": "user@example.com" }
```

Response `200`:
```json
{ "ok": true }
```

### `POST /auth/google`
Verify Google ID token and return app JWT.

Mounted at: `POST /api/v1/auth/google`

Body:
```json
{
  "idToken": "google_id_token_from_mobile",
  "timezone": "America/New_York"
}
```

Response `200`:
```json
{
  "token": "jwt_token",
  "user": {
    "id": "cuid",
    "email": "student@example.com",
    "role": "STUDENT",
    "timezone": "America/New_York"
  }
}
```

Errors:
- `400` missing/invalid fields (Zod validation)
- `401` invalid/expired token (message: `Invalid or expired Google idToken.`)
- `500` unexpected server error

## Timetable (Protected)

### `GET /timetable/status`
Returns the live class (if any) and next upcoming class using the user timezone.

Query params:
- `at` optional ISO datetime for deterministic UI testing (example: `2026-03-11T10:05:00Z`)
- `includeToday=true` optional to include today's schedule array (sorted)

Response `200`:
```json
{
  "now": "2026-03-11T10:05:00.000Z",
  "timezone": "Africa/Accra",
  "live": {
    "id": "cuid",
    "courseCode": "UGRC 150",
    "courseTitle": "Academic Writing II",
    "venue": "Room 2, SSS",
    "day": "WEDNESDAY",
    "startTime": "09:00",
    "endTime": "11:00"
  },
  "next": {
    "id": "cuid",
    "courseCode": "MATH 223",
    "courseTitle": "Linear Algebra",
    "venue": "CB 2.2",
    "day": "WEDNESDAY",
    "startTime": "12:00",
    "endTime": "13:00"
  },
  "today": []
}
```

### `POST /timetable/import`
Upload a timetable PDF and bulk-create entries.

- Content-Type: `multipart/form-data`
- Field name: `file`
- Query: `dryRun=true` to preview parse without saving
- Query: `debug=true` to include extracted text preview

Response `201`:
```json
{
  "created": [
    {
      "id": "cuid",
      "userId": "cuid",
      "courseName": "UGRC 150 - Academic Writing II",
      "courseCode": "UGRC 150",
      "courseTitle": "Academic Writing II",
      "venue": "Room 2, SSS",
      "day": "MONDAY",
      "startTime": "09:00",
      "endTime": "11:00",
      "createdAt": "2026-02-26T00:00:00.000Z",
      "updatedAt": "2026-02-26T00:00:00.000Z"
    }
  ],
  "parsed": [
    {
      "day": "MONDAY",
      "startTime": "09:00",
      "endTime": "11:00",
      "courseCode": "UGRC 150",
      "courseTitle": "Academic Writing II",
      "venue": "Room 2, SSS"
    }
  ],
  "warnings": []
}
```

### `POST /timetable`
Create entry.

Notes:
- Time format is `HH:mm` (minutes supported), e.g. `06:20`.
- At least one of `courseName`, `courseTitle`, or `courseCode` must be provided.

Body:
```json
{
  "courseName": "Math",
  "courseCode": "MATH 223",
  "courseTitle": "Linear Algebra",
  "venue": "CB 2.2",
  "day": "MONDAY",
  "startTime": "06:20",
  "endTime": "10:00"
}
```

Response `201`:
```json
{
  "id": "cuid",
  "userId": "cuid",
  "courseName": "Math",
  "courseCode": "MATH 223",
  "courseTitle": "Linear Algebra",
  "venue": "CB 2.2",
  "day": "MONDAY",
  "startTime": "06:20",
  "endTime": "10:00",
  "createdAt": "2026-02-26T00:00:00.000Z",
  "updatedAt": "2026-02-26T00:00:00.000Z"
}
```

### `GET /timetable`
List all timetable entries.

Response `200`: array of timetable items.

### `PATCH /timetable/:id`
Update entry (partial).

Body example:
```json
{
  "courseTitle": "Advanced Linear Algebra",
  "venue": "Law School Hall",
  "startTime": "09:30"
}
```

Response `200`: updated timetable item.

### `DELETE /timetable/:id`
Delete entry.

Response `204` (no body).

## Syllabus (Protected)

### `POST /syllabus`
Upload one PDF (`multipart/form-data`, field name: `file`).

Response `201`:
```json
{
  "id": "cuid",
  "userId": "cuid",
  "fileUrl": "https://...",
  "extractedText": "...",
  "createdAt": "2026-02-26T00:00:00.000Z",
  "updatedAt": "2026-02-26T00:00:00.000Z"
}
```

### `GET /syllabus`
Get current user syllabus.

Response `200`: syllabus object.

## Study Plan (Protected)

### `POST /study-plan/generate`
Generate and store plan from syllabus + timetable.

Body: none.

Response `201`:
```json
{
  "id": "cuid",
  "userId": "cuid",
  "content": [
    { "date": "2026-03-01", "courseName": "Math", "topic": "Algebra", "durationMin": 45 }
  ],
  "createdAt": "2026-02-26T00:00:00.000Z",
  "updatedAt": "2026-02-26T00:00:00.000Z"
}
```

### `GET /study-plan`
Get saved study plan.

Response `200`: study plan object.

## Chat (Protected)

### `POST /chat`
Send user message; assistant response uses syllabus context.

Body:
```json
{ "message": "What should I focus on this week?" }
```

Response `200`:
```json
{
  "message": "Focus on Algebra and Calculus this week...",
  "usage": {
    "used": 1,
    "limit": 20,
    "resetAt": "2026-02-27T05:00:00.000Z"
  }
}
```

Headers:
- `X-RateLimit-Reset`: reset timestamp in UTC ISO format.

### `GET /chat`
Get recent chat messages.

Response `200`: array of message objects.

### Rate limit behavior
- 20 user messages/day per user timezone.
- On exceed: `429 Too Many Requests`
- Returns `X-RateLimit-Reset` header.

## Reminders (Protected)

### `GET /reminders?daysAhead=7&studyHourLocal=18`
Returns precomputed reminders for mobile local scheduling.

Query params:
- `daysAhead` optional (1-30), default `7`
- `studyHourLocal` optional (0-23), default `18`

Response `200`:
```json
[
  {
    "title": "Math class",
    "body": "Starts in 30 mins",
    "scheduledAt": "2026-03-01T08:30:00.000Z"
  },
  {
    "title": "Study Algebra",
    "body": "Study Math for 45 mins today",
    "scheduledAt": "2026-03-01T18:00:00.000Z"
  }
]
```

## Common Errors

Format:
```json
{
  "error": {
    "message": "Validation error"
  }
}
```

Typical status codes:
- `400` validation/input issues
- `401` unauthorized
- `404` not found
- `409` conflict (email exists)
- `429` chat daily limit reached
- `500` internal server error

## User Profile (Protected)

### `GET /me`
Return current user from JWT.

Mounted at: `GET /api/v1/me`

Response `200`:
```json
{
  "user": {
    "id": "cuid",
    "email": "student@example.com",
    "timezone": "Africa/Accra",
    "role": "STUDENT"
  }
}
```

## AI Coach (Protected)

### `GET /ai/conversations`
List AI Coach conversations.

Response `200`:
```json
{
  "conversations": [
    { "id": "cuid", "title": "AI Coach", "updatedAt": "2026-03-12T10:00:00.000Z" }
  ]
}
```

### `POST /ai/conversations`
Create a conversation.

Body:
```json
{ "title": "AI Coach" }
```

Response `201`:
```json
{ "conversation": { "id": "cuid", "title": "AI Coach", "createdAt": "2026-03-12T10:00:00.000Z" } }
```

### `GET /ai/conversations/:id/messages?limit=50&cursor=...`
Get message history with cursor pagination.

Response `200`:
```json
{
  "messages": [
    {
      "id": "cuid",
      "role": "assistant",
      "content": "raw text",
      "contentParts": [{ "type": "text", "text": "..." }],
      "createdAt": "2026-03-12T10:01:00.000Z"
    }
  ],
  "nextCursor": "cuid_or_null"
}
```

### `POST /ai/chat`
Main coach chat endpoint. Stores user+assistant messages. Creates a conversation if `conversationId` is null.

Body:
```json
{
  "conversationId": null,
  "message": { "text": "Help me plan for my next class" },
  "context": { "timezone": "Africa/Accra", "now": "2026-03-12T10:05:00.000Z" },
  "preferences": { "style": "coach", "noDirectAnswers": true, "format": "contentParts" }
}
```

Response `200`:
```json
{
  "conversationId": "cuid",
  "assistant": {
    "messageId": "cuid",
    "contentParts": [
      { "type": "text", "text": "Let’s plan this properly. How much time do you have before class?" },
      { "type": "list", "items": ["15 min", "30 min", "60 min"] }
    ],
    "memoryWrites": [],
    "status": {
      "type": "reading_calendar",
      "text": "Reading your timetable and reminders..."
    }
  }
}
```

Rate limit headers:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

### `GET /ai/memory`
Get AI memory facts.

### `PATCH /ai/memory`
Upsert/delete memory facts (for user trust).

Body:
```json
{
  "writes": [
    { "key": "preferred_session_length", "value": 25, "action": "upsert" },
    { "key": "old_fact", "action": "delete" }
  ]
}
```

### `POST /ai/schedule`
Create a learning schedule (stored as `StudySchedule`). v1 is deterministic placeholder.

Body:
```json
{
  "goal": "Prepare for midsem",
  "days": 14,
  "dailyMinutes": 60,
  "constraints": { "breakStyle": "50_10" },
  "courses": [{ "courseCode": "MATH 223", "priority": 1 }]
}
```

### `GET /ai/syllabus/summary?maxBullets=8`
Summarize the uploaded syllabus (uses stored extracted text, returns `contentParts`).

Response `200`:
```json
{
  "contentParts": [
    { "type": "text", "text": "Here’s the quick overview of your syllabus." },
    { "type": "list", "items": ["...", "..."] }
  ]
}
```

## Notifications (Protected)

### `POST /notifications/register`
Register or update Expo push token.

Body:
```json
{ "token": "ExponentPushToken[xxxx]", "platform": "ios" }
```

Response `200`:
```json
{ "ok": true }
```

### `DELETE /notifications/register`
Unregister device token (or all tokens for user if body omitted).

Body (optional):
```json
{ "token": "ExponentPushToken[xxxx]" }
```

Response `200`:
```json
{ "ok": true }
```

### `POST /notifications/test`
Send a test push notification via Expo.

Body:
```json
{ "token": "ExponentPushToken[xxxx]", "title": "Test", "body": "Hello" }
```

## Progress (Protected)

### `GET /progress/summary`
Return the Progress Card metrics for the user.

Response `200`:
```json
{
  "score": 84,
  "maxScore": 100,
  "weeklyMinutes": 260,
  "weeklyGoal": 360,
  "daysUntilTest": 5,
  "testDateLabel": "Next quiz • Apr 1",
  "progress": 0.64,
  "streakDays": 7,
  "completedTasks": 12,
  "focusSessions": 5
}
```
