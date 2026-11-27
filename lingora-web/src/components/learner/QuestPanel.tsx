import React from 'react';
import styles from './quest.module.css';
import { visibleQuests } from './helpers.ts';
import type { ShellData } from './types.ts';

/** Daily quests and daily goal. Shared by the desktop right column and /quests. */
export function QuestPanel({ shell }: { shell: ShellData }) {
  const quests = visibleQuests(shell);
  const { dailyProgress, recentAchievement } = shell;

  if (shell.gamificationStatus === 'UNAVAILABLE') {
    return (
      <div className={styles.panel}>
        <div id="gamificationUnavailableAlert" role="status" className={styles.warn}>
          <strong>Tiến độ học tập: </strong>
          {shell.gamificationMessage ||
            'Dữ liệu chuỗi ngày học và nhiệm vụ tạm thời không khả dụng do múi giờ tài khoản không hợp lệ.'}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panel} id="gamificationOverview">
      <section className={styles.card} aria-labelledby="questsTitle">
        <h2 id="questsTitle" className={styles.title}>Nhiệm vụ hôm nay</h2>
        {quests.length > 0 ? (
          <ul className={styles.list}>
            {quests.map((q) => {
              const percent = q.target > 0 ? Math.min(100, Math.round((q.progress / q.target) * 100)) : 0;
              return (
                <li
                  key={q.id}
                  id={`quest-${q.id}`}
                  className={`${styles.quest}${q.isCompleted ? ` ${styles.questDone}` : ''}`}
                >
                  <div className={styles.questHead}>
                    <span>
                      <span aria-hidden="true">{q.isCompleted ? '✅ ' : '🎯 '}</span>
                      {q.title}
                    </span>
                    <span className={`${styles.reward}${q.isCompleted ? ` ${styles.rewardDone}` : ''}`}>+{q.xpReward} XP</span>
                  </div>
                  <div className={styles.progressRow}>
                    <span
                      className={styles.bar}
                      role="progressbar"
                      aria-label={q.title}
                      aria-valuemin={0}
                      aria-valuemax={q.target}
                      aria-valuenow={Math.min(q.progress, q.target)}
                    >
                      <span className={styles.fill} style={{ width: `${percent}%` }} />
                    </span>
                    <span className={styles.count}>{`${q.progress}/${q.target}`}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className={styles.muted}>Hôm nay chưa có nhiệm vụ nào.</p>
        )}
      </section>

      <section className={styles.card} aria-labelledby="goalTitle">
        <h2 id="goalTitle" className={styles.title}>Mục tiêu hôm nay</h2>
        <div id="dailyGoalDisplay" className={styles.goal}>
          <span aria-hidden="true">⏱️</span>
          <span>
            Mục tiêu: {dailyProgress.dailyGoalMinutes} phút • {dailyProgress.completedLessonsToday} bài học •{' '}
            {dailyProgress.reviewsCompletedToday} từ đã ôn
          </span>
        </div>
        {shell.streak.longestStreak > 0 && (
          <p className={styles.muted} style={{ marginTop: 8 }}>Kỷ lục chuỗi ngày: {shell.streak.longestStreak} ngày</p>
        )}
      </section>

      {recentAchievement && (
        <div id="recentAchievementBanner" className={styles.achievement}>
          <span aria-hidden="true">🏆</span>
          <span>
            <strong>Thành tựu mới:</strong> {recentAchievement.title} - {recentAchievement.description}
          </span>
        </div>
      )}
    </div>
  );
}
