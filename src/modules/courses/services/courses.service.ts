import { coursesRepository } from '../repositories/courses.repository';

export const coursesService = {
  listTopics(userId: string) {
    return coursesRepository.listTopics(userId);
  },

  upsertTopic(input: { userId: string; courseCode: string; courseTitle: string; currentTopic: string }) {
    return coursesRepository.upsertTopic(input);
  }
};
