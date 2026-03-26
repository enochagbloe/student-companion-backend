import createHttpError from 'http-errors';
import { storage } from '../../../utils/storage';
import { extractPdfText } from '../../../utils/pdf';
import { syllabusRepository } from '../repositories/syllabus.repository';

export const syllabusService = {
  async upload(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw createHttpError(400, 'PDF file is required.');
    }

    if (file.mimetype !== 'application/pdf') {
      throw createHttpError(400, 'Only PDF files are allowed.');
    }

    const extractedText = await extractPdfText(file.buffer);
    if (!extractedText) {
      throw createHttpError(400, 'Unable to extract text from PDF.');
    }

    const fileUrl = await storage.uploadPdf(userId, file.buffer, file.originalname);
    return syllabusRepository.upsert(userId, fileUrl, extractedText);
  },

  async get(userId: string) {
    const syllabus = await syllabusRepository.findByUser(userId);
    if (!syllabus) {
      throw createHttpError(404, 'Syllabus not found.');
    }

    return syllabus;
  }
};
