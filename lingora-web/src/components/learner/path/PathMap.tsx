'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { PathSectionDto } from '../types.ts';
import { numberedTitle, hasNumberPrefix } from '../../../shared/lesson-title.ts';
import { waveOffset } from '../helpers.ts';
import { LangText } from '../LangText.tsx';
import { PathNode, STATE_LABEL } from './PathNode.tsx';
import { SectionDivider } from './SectionDivider.tsx';
import styles from './path.module.css';

interface PathMapProps {
  sections: PathSectionDto[];
  continueStatus: 'IN_PROGRESS' | 'READY' | null;
  targetLanguage?: string;
}

function chapterKicker(levelCode: string, position: number, title: string): string {
  const prefix = hasNumberPrefix(title) ? '' : numberedTitle('Chương', position, '');
  return [levelCode, prefix].filter(Boolean).join(' · ');
}

/**
 * Winding lesson path. Node offsets follow a fixed sine wave of the index inside the chapter.
 * The same data is mirrored by a textual list (the [≡] button) for screen-reader and keyboard users.
 */
export function PathMap({ sections, continueStatus, targetLanguage }: PathMapProps) {
  const [openNodeId, setOpenNodeId] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const unitKeys = useMemo(
    () => sections.flatMap((s) => s.units.map((u) => ({ key: `${s.levelId}:${u.unitId}`, section: s, unit: u }))),
    [sections],
  );
  const [activeKey, setActiveKey] = useState<string | null>(unitKeys[0]?.key ?? null);
  const [topOffset, setTopOffset] = useState(72);
  const unitRefs = useRef(new Map<string, HTMLElement>());

  const firstCurrent = useMemo(
    () => sections.flatMap((s) => s.units.flatMap((u) => u.nodes)).find((n) => n.state === 'CURRENT') ?? null,
    [sections],
  );

  // Keep the banner right under the sticky top bar, whatever height the bar has on this viewport.
  useEffect(() => {
    const measure = () => {
      const bar = document.getElementById('learnerTopBar');
      setTopOffset(bar ? Math.round(bar.getBoundingClientRect().height) + 8 : 8);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Open on the current node, unless the URL points somewhere specific.
  useEffect(() => {
    if (!firstCurrent || window.location.hash) return;
    const el = document.getElementById(`pathNode-${firstCurrent.lessonId}`);
    el?.scrollIntoView({ block: 'center', behavior: 'auto' });
    // Only on first mount of a given current node.
  }, [firstCurrent?.lessonId]);

  // The banner follows whichever chapter crosses the line just under it.
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || unitKeys.length === 0) return;
    let observer: IntersectionObserver | null = null;
    const build = () => {
      observer?.disconnect();
      const line = topOffset + 56;
      const bottom = Math.max(0, window.innerHeight - line - 2);
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) setActiveKey((entry.target as HTMLElement).dataset.unitKey ?? null);
          }
        },
        { rootMargin: `-${line}px 0px -${bottom}px 0px`, threshold: 0 },
      );
      unitRefs.current.forEach((el) => observer?.observe(el));
    };
    build();
    window.addEventListener('resize', build);
    return () => {
      window.removeEventListener('resize', build);
      observer?.disconnect();
    };
  }, [unitKeys, topOffset]);

  const active = unitKeys.find((u) => u.key === activeKey) ?? unitKeys[0];
  if (!active) return null;

  const toggleNode = (id: string | null) => {
    setOpenNodeId(id);
    if (id) setListOpen(false);
  };
  const bubbleText = continueStatus === 'IN_PROGRESS' ? 'TIẾP TỤC' : 'BẮT ĐẦU';

  return (
    <section id="learningPathSection" aria-labelledby="pathHeading" className={styles.section}>
      <h2 id="pathHeading" className="sr-only">Lộ trình bài học</h2>
      <div className={styles.banner} style={{ top: topOffset }} id="pathChapterBanner">
        <div className={styles.bannerText}>
          <span className={styles.bannerKicker}>{chapterKicker(active.section.levelCode, active.unit.position, active.unit.title)}</span>
          <span className={styles.bannerTitle}>
            <LangText text={active.unit.title} targetLanguage={targetLanguage} />
          </span>
        </div>
        <button
          type="button"
          id="pathListToggle"
          className={styles.listBtn}
          aria-expanded={listOpen}
          aria-controls="pathTextList"
          aria-label={listOpen ? 'Đóng danh sách bài học' : 'Mở danh sách bài học'}
          onClick={() => {
            setListOpen((v) => !v);
            setOpenNodeId(null);
          }}
        >
          <span aria-hidden="true">≡</span>
        </button>
      </div>

      {listOpen && (
        <div id="pathTextList" role="region" aria-label="Danh sách bài học" className={styles.textList}>
          {sections.map((section) =>
            section.units.map((unit) => (
              <React.Fragment key={`${section.levelId}:${unit.unitId}`}>
                <h3>
                  {section.levelCode ? `${section.levelCode} · ` : ''}
                  <LangText text={unit.title} targetLanguage={targetLanguage} />
                </h3>
                <ol>
                  {unit.nodes.map((node) => {
                    const navigable = node.state === 'COMPLETED' || node.state === 'CURRENT' || node.state === 'AVAILABLE';
                    const body = (
                      <>
                        <span><LangText text={node.title} targetLanguage={targetLanguage} /></span>
                        <span className={styles.chipText}>{STATE_LABEL[node.state]}</span>
                        {node.score != null && <span className={styles.chipText}>{node.score}%</span>}
                        {!node.isRequired && node.state !== 'COMING_SOON' && <span className={styles.chipText}>Tùy chọn</span>}
                      </>
                    );
                    return (
                      <li key={node.lessonId}>
                        {navigable ? (
                          <a href={node.href} id={`pathLink-${node.lessonId}`} className={styles.textItem}>
                            {body}
                          </a>
                        ) : (
                          <span id={`pathDisabled-${node.lessonId}`} className={`${styles.textItem} ${styles.textItemLocked}`}>
                            {body}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </React.Fragment>
            )),
          )}
        </div>
      )}

      <div id="learningPathList">
        {sections.map((section, sectionIndex) => (
          <React.Fragment key={section.levelId}>
            {sectionIndex > 0 && <SectionDivider section={section} previous={sections[sectionIndex - 1]} />}
            {section.units.map((unit) => {
              const key = `${section.levelId}:${unit.unitId}`;
              const optionalCount = unit.nodes.filter((n) => !n.isRequired && n.state !== 'COMING_SOON').length;
              return (
                <section
                  key={key}
                  className={styles.unit}
                  data-unit-key={key}
                  aria-labelledby={`unitHeading-${key}`}
                  ref={(el) => {
                    if (el) unitRefs.current.set(key, el);
                    else unitRefs.current.delete(key);
                  }}
                >
                  <h3 id={`unitHeading-${key}`} className={styles.unitHeading}>
                    <span className={styles.unitHeadingText}>
                      {chapterKicker('', unit.position, unit.title) ? `${chapterKicker('', unit.position, unit.title)} · ` : ''}
                      <LangText text={unit.title} targetLanguage={targetLanguage} />
                      <span className="sr-only">
                        . {unit.progress.done}/{unit.progress.total} bài bắt buộc đã hoàn thành
                        {optionalCount > 0 ? `, ${optionalCount} bài tùy chọn` : ''}
                      </span>
                    </span>
                  </h3>
                  <ol className={styles.nodes}>
                    {unit.nodes.map((node, index) => (
                      <PathNode
                        key={node.lessonId}
                        node={node}
                        index={index}
                        offset={waveOffset(index)}
                        open={openNodeId === node.lessonId}
                        showBubble={firstCurrent?.lessonId === node.lessonId}
                        bubbleText={bubbleText}
                        inProgress={continueStatus === 'IN_PROGRESS'}
                        targetLanguage={targetLanguage}
                        onToggle={toggleNode}
                      />
                    ))}
                  </ol>
                </section>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}
