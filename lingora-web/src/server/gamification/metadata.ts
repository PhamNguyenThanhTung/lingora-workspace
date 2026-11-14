export interface AchievementDefinition {
  code: 'FIRST_LESSON' | 'LESSONS_10' | 'STREAK_7' | 'STREAK_30' | 'WORDS_100' | 'PERFECT_PRACTICE';
  title: string;
  description: string;
}

export const ACHIEVEMENTS: Record<AchievementDefinition['code'], AchievementDefinition> = {
  FIRST_LESSON: {
    code: 'FIRST_LESSON',
    title: 'Bài học đầu tiên',
    description: 'Hoàn thành bài học đầu tiên.',
  },
  LESSONS_10: {
    code: 'LESSONS_10',
    title: 'Chăm chỉ',
    description: 'Hoàn thành 10 bài học.',
  },
  STREAK_7: {
    code: 'STREAK_7',
    title: 'Kiên trì 7 ngày',
    description: 'Đạt chuỗi học tập 7 ngày liên tiếp.',
  },
  STREAK_30: {
    code: 'STREAK_30',
    title: 'Thói quen vững vàng',
    description: 'Đạt chuỗi học tập 30 ngày liên tiếp.',
  },
  WORDS_100: {
    code: 'WORDS_100',
    title: 'Vốn từ phong phú',
    description: 'Ôn tập 100 từ vựng khác nhau qua thẻ SRS.',
  },
  PERFECT_PRACTICE: {
    code: 'PERFECT_PRACTICE',
    title: 'Điểm tuyệt đối',
    description: 'Đúng toàn bộ câu hỏi cốt lõi ở lượt đầu tiên.',
  },
};

export const DAILY_QUESTS = {
  LESSON_1: {
    id: 'LESSON_1' as const,
    title: 'Hoàn thành 1 bài học',
    target: 1,
    xpReward: 10,
  },
  REVIEW_10: {
    id: 'REVIEW_10' as const,
    title: 'Ôn tập 10 từ vựng',
    target: 10,
    xpReward: 10,
  },
};
