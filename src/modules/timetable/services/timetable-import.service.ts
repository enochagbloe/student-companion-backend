import createHttpError from 'http-errors';
import { WeekDay } from '@prisma/client';
import { extractPdfText } from '../../../utils/pdf';
import { prisma } from '../../../config/prisma';

const dayAliases: Array<[RegExp, WeekDay]> = [
  [/^monday$/i, 'MONDAY'],
  [/^mon\.?$/i, 'MONDAY'],
  [/^tuesday$/i, 'TUESDAY'],
  [/^tue\.?$/i, 'TUESDAY'],
  [/^tues\.?$/i, 'TUESDAY'],
  [/^wednesday$/i, 'WEDNESDAY'],
  [/^wed\.?$/i, 'WEDNESDAY'],
  [/^thursday$/i, 'THURSDAY'],
  [/^thu\.?$/i, 'THURSDAY'],
  [/^thur\.?$/i, 'THURSDAY'],
  [/^thurs\.?$/i, 'THURSDAY'],
  [/^friday$/i, 'FRIDAY'],
  [/^fri\.?$/i, 'FRIDAY'],
  [/^saturday$/i, 'SATURDAY'],
  [/^sat\.?$/i, 'SATURDAY'],
  [/^sunday$/i, 'SUNDAY'],
  [/^sun\.?$/i, 'SUNDAY']
];

const normalizeDashes = (s: string) => s.replace(/[–—−]/g, '-');

const deSquashColumns = (line: string) => {
  // Some PDFs extract table rows without column spacing, e.g.
  // "Monday9:00-10:30UGRC 150Academic Writing IIRoom 2, SSS"
  // These heuristics re-insert spaces at common boundaries.
  return line
    .replace(/([A-Za-z])(\d)/g, '$1 $2') // Monday9 -> Monday 9
    .replace(/(\d)([A-Za-z])/g, '$1 $2') // 150Academic -> 150 Academic
    .replace(/([a-z])([A-Z])/g, '$1 $2') // WritingII -> Writing II (and II Room -> II Room after next rule)
    .replace(/([IVX])([A-Z])/g, '$1 $2') // IILaw -> II Law
    .replace(/\s+/g, ' ')
    .trim();
};

const pad2 = (n: number) => String(n).padStart(2, '0');

const toHHmm = (hour: number, minute: number) => `${pad2(hour)}:${pad2(minute)}`;

const parseTimeToken = (token: string) => {
  const m = token.match(/^(\d{1,2})(?::(\d{2}))?$/);
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = m[2] ? Number(m[2]) : 0;
  if (hour < 0 || hour > 23) return null;
  if (minute < 0 || minute > 59) return null;
  return { hour, minute };
};

const parseTimeRange = (raw: string) => {
  const s = normalizeDashes(raw)
    .replace(/\s+/g, '')
    .replace(/to/i, '-')
    .trim();

  // Examples: 9-11, 14-16, 6:20-9:00
  const parts = s.split('-');
  if (parts.length !== 2) return null;

  const start = parseTimeToken(parts[0]);
  const end = parseTimeToken(parts[1]);
  if (!start || !end) return null;

  const startTime = toHHmm(start.hour, start.minute);
  const endTime = toHHmm(end.hour, end.minute);

  // We only support same-day classes in v1.
  if (startTime >= endTime) return null;

  return { startTime, endTime };
};

const matchDay = (token: string): WeekDay | null => {
  const t = token.trim().replace(/^["'(]+|[)"',.:;]+$/g, '');
  for (const [re, day] of dayAliases) {
    if (re.test(t)) return day;
  }
  return null;
};

const looksLikeCourseCode = (token: string) => /^[A-Z]{2,}\s*\d{2,}[A-Z]?$/.test(token);

export type ParsedTimetableRow = {
  day: WeekDay;
  startTime: string;
  endTime: string;
  courseCode?: string;
  courseTitle?: string;
  venue?: string;
};

export const timetableImportService = {
  async parsePdf(buffer: Buffer): Promise<{ rows: ParsedTimetableRow[]; warnings: string[]; rawText: string }> {
    const rawText = await extractPdfText(buffer);
    if (!rawText) {
      throw createHttpError(400, 'Unable to extract text from PDF (might be a scanned image PDF).');
    }

    const warnings: string[] = [];
    const rows: ParsedTimetableRow[] = [];

    const lines = rawText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    let currentDay: WeekDay | null = null;

    for (const line of lines) {
      const normalizedLine = (() => {
        const base = normalizeDashes(line);
        const hasTimeRange = /\d{1,2}:\d{2}-\d{1,2}:\d{2}/.test(base) || /\b\d{1,2}-\d{1,2}\b/.test(base);
        const hasSquashSignals = /[A-Za-z]\d/.test(base) || /\d[A-Za-z]/.test(base) || /[a-z][A-Z]/.test(base);
        // If the line contains a time range and shows squashed boundaries, try to re-add spaces.
        if (hasTimeRange && hasSquashSignals) {
          return deSquashColumns(base);
        }
        return base;
      })();

      // Skip header-ish lines.
      if (/\bday\b/i.test(normalizedLine) && /\btime\b/i.test(normalizedLine)) continue;
      if (/^Day\s*Time/i.test(normalizedLine)) continue;

      const tokens = normalizedLine
        .split(/\s{2,}|\t+/) // table-like spacing
        .map((t) => t.trim())
        .filter(Boolean);

      // Fallback if spacing is single spaces.
      const fallbackTokens = tokens.length >= 3 ? tokens : normalizedLine.split(/\s+/).filter(Boolean);

      const dayToken = fallbackTokens[0] || '';
      const dayFromLine = matchDay(dayToken);
      if (dayFromLine) {
        currentDay = dayFromLine;
      }

      // Find a time range token within the first few tokens.
      let timeRange: { startTime: string; endTime: string } | null = null;
      let timeIndex = -1;
      const timeSearchStart = dayFromLine ? 1 : 0;
      for (let i = timeSearchStart; i < Math.min(fallbackTokens.length, timeSearchStart + 5); i += 1) {
        const maybe = parseTimeRange(fallbackTokens[i]);
        if (maybe) {
          timeRange = maybe;
          timeIndex = i;
          break;
        }
      }

      if (!timeRange) {
        // If we can't parse time and there is no day, it's likely not a class row.
        if (dayFromLine) {
          warnings.push(`Could not parse time range for line: ${line}`);
        }
        continue;
      }

      const day = dayFromLine ?? currentDay;
      if (!day) {
        warnings.push(`Parsed time but no day context for line: ${line}`);
        continue;
      }

      const rest = fallbackTokens.slice(timeIndex + 1);
      if (rest.length === 0) {
        warnings.push(`No course info found for line: ${line}`);
        continue;
      }

      let courseCode: string | undefined;
      let courseTitle: string | undefined;
      let venue: string | undefined;

      // Heuristic: course code often looks like "UGRC 150"; sometimes split into 2 tokens.
      if (rest.length >= 2 && looksLikeCourseCode(`${rest[0]} ${rest[1]}`)) {
        courseCode = `${rest[0]} ${rest[1]}`.replace(/\s+/g, ' ').trim();
        const afterCode = rest.slice(2);
        // Title + venue are hard to split reliably; assume last 2-4 tokens may be venue if it contains commas or words like Room/Hall/Lab.
        if (afterCode.length > 0) {
          const joined = afterCode.join(' ');
          const venueMatch = joined.match(/\b(Room|Hall|Lab|Laboratory|Auditorium|Theatre|Theater|CB)\b.*$/i);
          if (venueMatch) {
            venue = venueMatch[0].trim();
            courseTitle = joined.slice(0, venueMatch.index).trim();
          } else {
            courseTitle = joined.trim();
          }
        }
      } else {
        // No code found; treat remainder as title/venue.
        const joined = rest.join(' ');
        courseTitle = joined.trim();
      }

      if (!courseCode && !courseTitle) {
        warnings.push(`Could not parse courseCode/courseTitle for line: ${line}`);
        continue;
      }

      rows.push({
        day,
        startTime: timeRange.startTime,
        endTime: timeRange.endTime,
        courseCode,
        courseTitle,
        venue
      });
    }

    if (rows.length === 0) {
      throw createHttpError(400, 'No timetable rows detected in PDF.', {
        details: {
          warnings: warnings.slice(0, 50),
          linesPreview: lines.slice(0, 30),
          normalizedLinesPreview: lines.slice(0, 30).map((l) => {
            const base = normalizeDashes(l.trim());
            const hasTimeRange = /\d{1,2}:\d{2}-\d{1,2}:\d{2}/.test(base) || /\b\d{1,2}-\d{1,2}\b/.test(base);
            const hasSquashSignals = /[A-Za-z]\d/.test(base) || /\d[A-Za-z]/.test(base) || /[a-z][A-Z]/.test(base);
            return hasTimeRange && hasSquashSignals ? deSquashColumns(base) : base;
          })
        }
      });
    }

    return { rows, warnings, rawText };
  },

  async importPdf(userId: string, buffer: Buffer, options: { dryRun: boolean; debug: boolean }) {
    const { rows, warnings, rawText } = await this.parsePdf(buffer);

    if (options.dryRun) {
      return {
        created: [],
        parsed: rows,
        warnings,
        ...(options.debug
          ? {
              rawTextPreview: rawText.slice(0, 4000),
              linesPreview: rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).slice(0, 30)
            }
          : {})
      };
    }

    const created = await prisma.$transaction(
      rows.map((row) =>
        prisma.timetable.create({
          data: {
            userId,
            // Keep existing API behavior: courseName is required in DB.
            courseName: row.courseTitle || row.courseCode || 'Untitled course',
            courseCode: row.courseCode,
            courseTitle: row.courseTitle,
            venue: row.venue,
            day: row.day,
            startTime: row.startTime,
            endTime: row.endTime
          }
        })
      )
    );

    return {
      created,
      parsed: rows,
      warnings,
      ...(options.debug
        ? {
            rawTextPreview: rawText.slice(0, 4000)
          }
        : {})
    };
  }
};
