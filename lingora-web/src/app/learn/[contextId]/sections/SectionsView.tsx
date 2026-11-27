import React from 'react';
import type { HomeDto } from '../../../../server/context/home-dto.ts';
import { getSections, languageName } from '../../../../components/learner/helpers.ts';
import type { HomeWithSections } from '../../../../components/learner/types.ts';
import styles from './sections.module.css';

/** Overview of the levels ("phần") of a path. View only; the "jump ahead" action arrives in phase 2. */
export function SectionsView({ data, errorMessage }: { data?: HomeDto; errorMessage?: string }) {
  if (!data) {
    return (
      <main className="content-area">
        <div id="errorBox" className="alert-box is-warning" role="alert">
          <h1 className="alert-title warning">Không thể tải các phần</h1>
          <p className="alert-message">{errorMessage}</p>
          <div className="alert-actions">
            <a href="/home" id="backToHomeBtn" className="btn btn-primary" style={{ textDecoration: 'none' }}>Về trang chủ</a>
          </div>
        </div>
      </main>
    );
  }

  const uiLocale = data.learner.uiLocale || 'vi';
  const ctx = data.contexts.find((c) => c.id === data.selectedContextId) ?? null;
  const sections = getSections(data as HomeWithSections, uiLocale);

  return (
    <div id="sectionsView" className={styles.root}>
      <a href="/home" className={styles.back}>← Về lộ trình</a>
      <div>
        <h1 className={styles.title}>Các phần</h1>
        {ctx && <p className={styles.sub}>{languageName(ctx, uiLocale)}</p>}
      </div>
      {sections.length === 0 ? (
        <div id="sectionsEmpty" className="empty-state-box">
          <p className="empty-state-text">{data.pathMessage || 'Chưa có phần nào được phát hành cho lộ trình này.'}</p>
        </div>
      ) : (
        <ol className={styles.list}>
          {sections.map((section, index) => {
            const { requiredDone, requiredTotal } = section.progress;
            const percent = requiredTotal > 0 ? Math.round((requiredDone * 100) / requiredTotal) : 0;
            const previous = sections[index - 1];
            const stateText =
              section.state === 'COMPLETED' ? 'Đã hoàn thành'
              : section.state === 'CURRENT' ? 'Đang học'
              : section.state === 'COMING_SOON' ? 'Sắp ra mắt'
              : previous ? `Hoàn thành ${previous.levelCode} để mở` : 'Đang khóa';
            const locked = section.state === 'LOCKED' || section.state === 'NEXT' || section.state === 'COMING_SOON';
            return (
              <li
                key={section.levelId}
                id={`section-${section.levelId}`}
                data-state={section.state}
                className={`${styles.card}${section.state === 'CURRENT' ? ` ${styles.cardCurrent}` : ''}${locked ? ` ${styles.cardLocked}` : ''}`}
              >
                <div className={styles.head}>
                  <h2 className={styles.name}>
                    {section.levelCode}
                    {section.levelLabel ? ` · ${section.levelLabel}` : ''}
                  </h2>
                  <span className={`${styles.state}${section.state === 'COMPLETED' ? ` ${styles.stateDone}` : section.state === 'CURRENT' ? ` ${styles.stateCurrent}` : ''}`}>
                    {locked ? `🔒 ${stateText}` : stateText}
                  </span>
                </div>
                {!locked && requiredTotal > 0 && (
                  <>
                    <span
                      className={styles.bar}
                      role="progressbar"
                      aria-label={`Tiến độ ${section.levelCode}`}
                      aria-valuemin={0}
                      aria-valuemax={requiredTotal}
                      aria-valuenow={requiredDone}
                    >
                      <span className={styles.fill} style={{ width: `${percent}%` }} />
                    </span>
                    <p className={styles.meta}>{requiredDone}/{requiredTotal} bài bắt buộc đã hoàn thành</p>
                  </>
                )}
                {section.state === 'CURRENT' && (
                  <a href="/home" className={styles.cta} id={`sectionContinue-${section.levelId}`}>Tiếp tục</a>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
