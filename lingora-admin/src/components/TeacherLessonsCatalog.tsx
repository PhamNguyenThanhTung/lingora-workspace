'use client';

import React, { useState, useEffect } from 'react';
import { SessionLostModal } from './SessionLostModal';
import { AccessDeniedView } from './AccessDeniedView';
import type { LessonSummaryDto } from '@/server/lessons';

export interface TeacherLessonsCatalogProps {
  initialLessons?: LessonSummaryDto[];
  initialError?: string | null;
  account: {
    id: string;
    role: string;
    status: string;
    displayName: string | null;
  };
}

export function TeacherLessonsCatalog({
  initialLessons = [],
  initialError,
  account,
}: TeacherLessonsCatalogProps) {
  const [lessons, setLessons] = useState<LessonSummaryDto[]>(initialLessons);
  const [fetchError, setFetchError] = useState<string | null>(initialError || null);
  const [isLoading, setIsLoading] = useState(false);

  const [sessionLost, setSessionLost] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  useEffect(() => {
    if (!sessionLost) return;
    const container = document.getElementById('appContainer');
    container?.setAttribute('inert', '');
    return () => container?.removeAttribute('inert');
  }, [sessionLost]);

  const fetchLessons = async () => {
    setIsLoading(true);
    setFetchError(null);

    try {
      const res = await fetch('/api/teacher/lessons', {
        headers: { Origin: window.location.origin },
      });

      if (res.status === 401) { setSessionLost(true); setIsLoading(false); return; }
      if (res.status === 403) { setForbidden(true); setIsLoading(false); return; }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setFetchError(err?.error?.message || 'Không thể tải danh sách bài học.');
        setIsLoading(false);
        return;
      }

      const data = await res.json();
      setLessons(data.data || []);
      setIsLoading(false);
    } catch {
      setFetchError('Lỗi kết nối máy chủ khi tải danh sách bài học.');
      setIsLoading(false);
    }
  };

  if (forbidden) return <AccessDeniedView accountId={account.id} message="Tài khoản không còn quyền truy cập bài học. Vui lòng đăng xuất." />;
  return (
    <div className="page-content">
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" id="teacherLessonsTitle">
            Bài học được phân công
          </h1>
          <p className="page-description">
            Danh sách các bài học bạn được phân công phụ trách biên soạn nội dung.
          </p>
        </div>
      </div>

      {fetchError && (
        <div className="empty-state-open" id="teacherLessonsError">
          <h3 className="empty-title">Không thể tải dữ liệu</h3>
          <p className="empty-desc">{fetchError}</p>
          <button
            type="button"
            className="btn btn-secondary"
            id="btnRetryTeacherLessons"
            onClick={fetchLessons}
            disabled={isLoading || sessionLost}
          >
            Thử lại
          </button>
        </div>
      )}

      {!fetchError && lessons.length > 0 && (
        <div className="table-wrap" id="populatedTeacherLessonsTable">
          <table className="data-table" aria-label="Danh sách bài học được phân công">
            <thead>
              <tr>
                <th scope="col" style={{ width: '180px' }}>Khóa học</th>
                <th scope="col" style={{ width: '220px' }}>Đơn vị bài học</th>
                <th scope="col" style={{ width: '90px' }}>Vị trí</th>
                <th scope="col" style={{ width: '130px' }}>Đợt phân công</th>
                <th scope="col">Bản sửa đổi hiện tại</th>
                <th scope="col" style={{ width: '130px', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {lessons.map((l) => {
                const courseName = l.courseContext.names.vi || l.courseContext.names.en || 'Khóa học';
                const unitName = l.unitContext.names.vi || l.unitContext.names.en || l.unitContext.code;
                const highest = l.highestRevision;

                return (
                  <tr key={l.id} id={`row-teacher-lesson-${l.id}`}>
                    <td style={{ fontWeight: 500 }}>{courseName}</td>
                    <td>
                      <span className="badge" style={{ background: '#f1f5f9', color: '#475569', marginRight: '6px' }}>
                        {l.unitContext.code}
                      </span>
                      <span>{unitName}</span>
                    </td>
                    <td>
                      <span className="unit-position-number" id={`teacher-lesson-pos-${l.id}`}>
                        #{l.position}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: '#64748b', fontSize: '13px' }}>
                        Đợt #{l.assignment?.generation || '1'}
                      </span>
                    </td>
                    <td>
                      {highest ? (
                        <span id={`teacher-lesson-rev-${l.id}`}>
                          Bản #{highest.revisionNo} ({highest.status})
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic' }} id={`teacher-lesson-no-draft-${l.id}`}>
                          Chưa có bản nháp
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <a
                        href={`/my-lessons/${l.id}`}
                        className="btn-text-action btn-text-view"
                        id={`btn-open-lesson-${l.id}`}
                      >
                        Soạn bài
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="table-summary-bar">
            <span className="table-summary">Tổng số: {lessons.length} bài học được phân công</span>
          </div>
        </div>
      )}

      {!fetchError && lessons.length === 0 && (
        <div className="empty-state-open" id="emptyTeacherLessonsTable">
          <h3 className="empty-title">Chưa có bài học nào</h3>
          <p className="empty-desc">
            Bạn hiện chưa được phân công bài học nào. Quản trị viên sẽ phân công bài học khi bắt đầu chương trình biên soạn.
          </p>
        </div>
      )}
      <SessionLostModal isOpen={sessionLost} />
    </div>
  );
}
