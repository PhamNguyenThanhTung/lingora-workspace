import React from 'react';
import styles from '../landing.module.css';

export function LearningPreview() {
  return (
    <div className={styles.previewContainer} aria-label="Minh họa trải nghiệm học tập Lingora">
      <div className={styles.previewMainCard}>
        <div className={styles.previewHeader}>
          <div className={styles.previewTabs}>
            <span className={styles.previewTabActive}>Bài học mẫu</span>
          </div>
          <span className={styles.previewBadge}>Minh họa trải nghiệm</span>
        </div>

        <div className={styles.previewBody}>
          <div className={styles.previewSubject}>Chủ đề: Chào hỏi hàng ngày</div>
          <h3 className={styles.previewQuestion}>Chọn lời chào phù hợp vào buổi sáng:</h3>

          <div className={styles.previewChoices} role="group" aria-label="Các lựa chọn câu hỏi">
            <div className={styles.choiceCorrect}>
              <div className={styles.choiceContent}>
                <div className={styles.choiceRadioSelected} aria-hidden="true">✓</div>
                <div>
                  <div className={styles.choiceText}>Good morning</div>
                  <div className={styles.choiceSubtext}>Chào buổi sáng</div>
                </div>
              </div>
              <span className={styles.choiceCheckIcon} aria-label="Đáp án đúng">Đúng</span>
            </div>

            <div className={styles.choiceDefault}>
              <div className={styles.choiceContent}>
                <div className={styles.choiceRadio} aria-hidden="true" />
                <div>
                  <div className={styles.choiceText}>Good evening</div>
                  <div className={styles.choiceSubtext}>Chào buổi tối</div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.previewExplanation} role="region" aria-label="Lời giải thích đáp án">
            <div className={styles.previewExplanationTitle}>Lời giải thích:</div>
            <div>
              <strong>“Good morning”</strong> được dùng để chào hỏi lịch sự trong giao tiếp tiếng Anh từ sáng sớm cho đến trước 12:00 trưa.
            </div>
          </div>
        </div>
      </div>

      <div className={styles.previewSubGrid}>
        <div className={styles.subCard}>
          <div className={styles.subCardHeader}>
            <div className={styles.subCardIcon} aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <span>Luyện tập có phản hồi</span>
          </div>
          <p className={styles.subCardText}>
            Hiểu rõ lý do vì sao đúng hoặc chưa đúng ngay sau khi nộp bài tập.
          </p>
        </div>

        <div className={styles.subCard}>
          <div className={styles.subCardHeader}>
            <div className={styles.subCardIcon} aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <span>Ôn từ vựng ngắt quãng</span>
          </div>
          <p className={styles.subCardText}>
            Thẻ từ <strong className={styles.flashcardWord}>hello</strong> (<span className={styles.flashcardMeaning}>xin chào</span>) được thuật toán nhắc lại đúng lúc.
          </p>
        </div>
      </div>
    </div>
  );
}
