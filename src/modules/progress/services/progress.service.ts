export const progressService = {
  async summary(userId: string) {
    void userId;

    // v1: computed from available data with safe defaults.
    const weeklyGoal = 360;
    const weeklyMinutes = 0;
    const completedTasks = 0;
    const focusSessions = 0;

    const progress = weeklyGoal > 0 ? Math.min(1, weeklyMinutes / weeklyGoal) : 0;
    const score = Math.round(progress * 100);
    const maxScore = 100;

    const streakDays = 0;

    // Optional: if you store test dates later, plug here. For now, 0.
    const daysUntilTest = 0;
    const testDateLabel = 'No upcoming tests';

    return {
      score,
      maxScore,
      weeklyMinutes,
      weeklyGoal,
      daysUntilTest,
      testDateLabel,
      progress,
      streakDays,
      completedTasks,
      focusSessions
    };
  }
};
