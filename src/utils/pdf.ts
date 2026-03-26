import createHttpError from 'http-errors';
import pdfParse from 'pdf-parse';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const extractViaPdftotext = async (buffer: Buffer): Promise<string> => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'studentcomp-pdf-'));
  const inputPath = path.join(tmpDir, 'input.pdf');
  const outputPath = path.join(tmpDir, 'output.txt');

  try {
    await fs.writeFile(inputPath, buffer);
    await execFileAsync('pdftotext', ['-layout', '-nopgbrk', inputPath, outputPath], { maxBuffer: 20 * 1024 * 1024 });
    const text = await fs.readFile(outputPath, 'utf8');
    return text.trim();
  } finally {
    // Best-effort cleanup.
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
};

export const extractPdfText = async (buffer: Buffer): Promise<string> => {
  try {
    const parsed = await pdfParse(buffer);
    const text = parsed.text.trim();
    if (text) {
      return text;
    }
  } catch (err: any) {
    // Fall through to pdftotext fallback.
    try {
      const fallback = await extractViaPdftotext(buffer);
      if (fallback) {
        return fallback;
      }
    } catch (fallbackErr: any) {
      throw createHttpError(400, 'Failed to parse PDF. Try exporting a text-based PDF or a different file.', {
        details: String(fallbackErr?.message || fallbackErr || err?.message || err)
      });
    }

    throw createHttpError(400, 'Failed to parse PDF. Try exporting a text-based PDF or a different file.', {
      details: String(err?.message || err)
    });
  }

  // If pdf-parse succeeded but extracted empty text, try pdftotext before declaring failure.
  try {
    const fallback = await extractViaPdftotext(buffer);
    if (fallback) {
      return fallback;
    }
  } catch (fallbackErr: any) {
    throw createHttpError(400, 'Unable to extract text from PDF (it may be scanned or protected).', {
      details: String(fallbackErr?.message || fallbackErr)
    });
  }

  throw createHttpError(400, 'Unable to extract text from PDF (it may be scanned or protected).');
};
