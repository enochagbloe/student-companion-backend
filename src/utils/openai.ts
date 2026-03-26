import OpenAI from 'openai';
import createHttpError from 'http-errors';
import { env } from '../config/env';
import { StudyPlanItem } from '../common/types';

const client = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
  ...(env.OPENAI_BASE_URL ? { baseURL: env.OPENAI_BASE_URL } : {})
});

export const aiClient = {
  async generateStudyPlan(input: { syllabusText: string; timetable: Array<{ day: string; courseName: string; startTime: string; endTime: string }> }): Promise<StudyPlanItem[]> {
    const prompt = [
      'Generate a one-week study plan in strict JSON array format.',
      'Each item must follow schema: {"date":"YYYY-MM-DD","courseName":"string","topic":"string","durationMin":number}.',
      'Use timetable days and courses to map topics realistically.',
      'No markdown, no explanation, only JSON array output.',
      `Timetable: ${JSON.stringify(input.timetable)}`,
      `Syllabus: ${input.syllabusText}`
    ].join('\n');

    const completion = await client.responses.create({
      model: env.OPENAI_MODEL,
      input: prompt
    });

    const text = completion.output_text?.trim();
    if (!text) {
      throw createHttpError(502, 'OpenAI returned an empty study plan.');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw createHttpError(502, 'OpenAI returned invalid JSON for study plan.');
    }

    if (!Array.isArray(parsed)) {
      throw createHttpError(502, 'Study plan output must be an array.');
    }

    const items = parsed as StudyPlanItem[];
    for (const item of items) {
      if (!item.date || !item.courseName || !item.topic || typeof item.durationMin !== 'number') {
        throw createHttpError(502, 'Study plan output schema mismatch.');
      }
    }

    return items;
  },

  async answerWithSyllabus(input: { syllabusText: string; userMessage: string }): Promise<string> {
    const prompt = [
      'You are a course study assistant.',
      'Answer user questions using the provided syllabus context.',
      'If something is not in the syllabus, say that clearly and give best-effort guidance.',
      `Syllabus: ${input.syllabusText}`,
      `User: ${input.userMessage}`
    ].join('\n');

    const completion = await client.responses.create({
      model: env.OPENAI_MODEL,
      input: prompt
    });

    const answer = completion.output_text?.trim();
    if (!answer) {
      throw createHttpError(502, 'OpenAI returned an empty response.');
    }

    return answer;
  }
  ,

  async completeText(input: { prompt: string }): Promise<string> {
    const completion = await client.responses.create({
      model: env.OPENAI_MODEL,
      input: input.prompt
    });

    const text = completion.output_text?.trim();
    if (!text) {
      throw createHttpError(502, 'AI provider returned an empty response.');
    }

    return text;
  }
};
