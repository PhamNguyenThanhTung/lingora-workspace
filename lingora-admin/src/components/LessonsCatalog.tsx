'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { CourseDto } from '@/server/courses';
import type { UnitDto } from '@/server/units';
import type { LessonDetailDto, LessonSummaryDto, TeacherOptionDto } from '@/server/lessons';
import { LessonFormModal } from './LessonFormModal';
import { LessonAssignModal } from './LessonAssignModal';
import { SessionLostModal } from './SessionLostModal';
import { removeDraft, clearAllDrafts } from './draftStorage';

export interface LessonsCatalogProps {
  course: CourseDto;
  unit: UnitDto;
  initialLessons?: LessonSummaryDto[];
  teacherOptions?: TeacherOptionDto[];
  initialTeacherOptionsError?: string | null;
  initialError?: string | null;
  isLoading?: boolean;
  account: {
    id: string;
    role: string;
    status: string;
    displayName: string | null;
  };
}

export function LessonsCatalog({
  course,
  unit,
  initialLessons = [],
  teacherOptions = [],
  initialTeacherOptionsError = null,
  initialError,
  isLoading: propIsLoading,
  account,
}: LessonsCatalogProps) {
  const [lessons, setLessons] = useState<LessonSummaryDto[]>(initialLessons);
  const [teachers, setTeachers] = useState<TeacherOptionDto[]>(teacherOptions);
  const [teachersError, setTeachersError] = useState<string | null>(initialTeacherOptionsError);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [isLoading, setIsLoading] = useState(
    propIsLoading !== undefined ? propIsLoading : (!initialLessons && !initialError)
  );
  const [fetchError, setFetchError] = useState<string | null>(initialError || null);
  const [forbiddenBanner, setForbiddenBanner] = useState<string | null>(null);
  const [mutationStatus, setMutationStatus] = useState<string | null>(null);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formInitialData, setFormInitialData] = useState<LessonSummaryDto | null>(null);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [targetAssignLesson, setTargetAssignLesson] = useState<LessonSummaryDto | null>(null);

  const [isSessionLostOpen, setIsSessionLostOpen] = useState(false);

  const triggerRef = useRef<HTMLElement | null>(null);
  const openCreateBtnRef = useRef<HTMLButtonElement>(null);

  const anyModalOpen = isFormModalOpen || isAssignModalOpen || isSessionLostOpen;
  useEffect(() => {
    const container = document.getElementById('appContainer');
    if (container) {
      if (anyModalOpen) {
        container.setAttribute('inert', '');
      } else {
        container.removeAttribute('inert');
      }
    }
    return () => container?.removeAttribute('inert');
  }, [anyModalOpen]);

  const fetchTeachers = async () => {
    setLoadingTeachers(true);
    try {
      const res = await fetch(`/api/courses/${course.id}/units/${unit.id}/lessons/teacher-options`);
      if (res.status === 401 || res.status === 403) {
        setIsFormModalOpen(false);
        setIsAssignModalOpen(false);
        if (res.status === 401) setIsSessionLostOpen(true);
        else setForbiddenBanner('Tài khoản không còn quyền tải danh sách giáo viên.');
        return;
      }
      if (!res.ok) throw new Error('Options unavailable');
      const body = await res.json();
      if (!Array.isArray(body.data)) throw new Error('Invalid options');
      setTeachers(body.data);
      setTeachersError(null);
    } catch {
      setTeachersError('Không thể tải danh sách giáo viên. Vui lòng thử lại.');
    } finally { setLoadingTeachers(false); }
  };

  const fetchLessons = async () => {
    setIsLoading(true);
    setFetchError(null);
    setForbiddenBanner(null);
    setMutationStatus(null);

    try {
      const res = await fetch(`/api/courses/${course.id}/units/${unit.id}/lessons`, {
        headers: {
          Origin: window.location.origin,
        },
      });

      if (res.status === 401) {
        setIsSessionLostOpen(true);
        setIsLoading(false);
        return;
      }

      if (res.status === 403) {
        setIsFormModalOpen(false);
        setIsAssignModalOpen(false);
        setForbiddenBanner('Tài khoản của bạn không có quyền xem danh sách bài học.');
        setIsLoading(false);
        return;
      }

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

  const handleOpenCreate = (e: React.MouseEvent<HTMLButtonElement>) => {
    triggerRef.current = e.currentTarget;
    setFormMode('create');
    setFormInitialData(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (lesson: LessonSummaryDto, e: React.MouseEvent<HTMLButtonElement>) => {
    triggerRef.current = e.currentTarget;
    setFormMode('edit');
    setFormInitialData(lesson);
    setIsFormModalOpen(true);
  };

  const handleOpenAssign = (lesson: LessonSummaryDto, e: React.MouseEvent<HTMLButtonElement>) => {
    triggerRef.current = e.currentTarget;
    setTargetAssignLesson(lesson);
    setIsAssignModalOpen(true);
  };

  const handleFormSuccess = (saved: LessonDetailDto | LessonSummaryDto, mode: 'create' | 'edit') => {
    setIsFormModalOpen(false);
    setFetchError(null);

    if (mode === 'create') {
      setLessons((prev) => {
        const next = [...prev, saved];
        next.sort((a, b) => a.position - b.position);
        return next;
      });
      setMutationStatus(`Đã tạo thành công bài học ở vị trí #${saved.position}.`);
    } else {
      setLessons((prev) =>
        prev
          .map((l) => (l.id === saved.id ? saved : l))
          .sort((a, b) => a.position - b.position)
      );
      setMutationStatus(`Đã cập nhật thành công bài học #${saved.position}.`);
    }

    setTimeout(() => {
      if (triggerRef.current && typeof triggerRef.current.focus === 'function') {
        triggerRef.current.focus();
      } else {
        openCreateBtnRef.current?.focus();
      }
    }, 50);
  };

  const handleAssignSuccess = (updated: LessonDetailDto | LessonSummaryDto) => {
    setIsAssignModalOpen(false);
    setFetchError(null);

    setLessons((prev) =>
      prev.map((l) => (l.id === updated.id ? updated : l))
    );

    const teacherName = updated.assignment?.currentTeacher?.displayName || 'giáo viên';
    setMutationStatus(`Đã cập nhật phân công bài học #${updated.position} cho ${teacherName}.`);

    setTimeout(() => {
      if (triggerRef.current && typeof triggerRef.current.focus === 'function') {
        triggerRef.current.focus();
      } else {
        openCreateBtnRef.current?.focus();
      }
    }, 50);
  };

  const handleLogoutOnForbidden = async () => {
    try {
      removeDraft(account.id);
      clearAllDrafts();
    } catch {
      // Safe isolation
    }

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Origin: window.location.origin },
      });
    } catch {
      // Safe fallback
    } finally {
      window.location.href = '/login';
    }
  };

  const courseDisplayName = course.names.vi || course.names.en || 'Khóa học';
  const unitDisplayName = unit.names.vi || unit.names.en || unit.code;

  return (
    <div className="page-content">
      {/* Return breadcrumb */}
      <nav className="catalog-breadcrumbs" aria-label="Đường dẫn">
        <a href="/courses" className="breadcrumb-link" id="breadcrumbCourses">
          Khóa học
        </a>
        <span className="breadcrumb-sep">/</span>
        <a
          href={`/courses/${course.id}`}
          className="breadcrumb-link"
          id="breadcrumbCourseUnits"
        >
          {courseDisplayName}
        </a>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current" id="breadcrumbUnitCurrent">
          {unit.code} — {unitDisplayName}
        </span>
      </nav>

      {/* Header section */}
      <div className="page-header" style={{ marginTop: '12px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              className="badge"
              style={{
                background: '#e0e7ff',
                color: '#3730a3',
                fontSize: '12px',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: 600,
              }}
            >
              Đơn vị: {unit.code}
            </span>
          </div>
          <h1 className="page-title" id="lessonsPageTitle">
            Quản lý bài học — {unitDisplayName}
          </h1>
          <p className="page-description">
            Khung bài học trực thuộc khóa học {courseDisplayName}. Tạo khung và phân công giáo viên biên soạn.
          </p>
        </div>

        {!forbiddenBanner && (
          <div className="catalog-actions">
            <button type="button" className="btn btn-secondary" id="btnRefreshLessons" onClick={fetchLessons} disabled={isLoading}>
              Làm mới danh sách
            </button>
            <button
              type="button"
              className="btn btn-primary"
              id="btnOpenCreateLesson"
              onClick={handleOpenCreate}
              ref={openCreateBtnRef}
            >
              + Thêm bài học
            </button>
          </div>
        )}
      </div>

      {/* Forbidden Banner */}
      {forbiddenBanner && (
        <div className="permission-denied-banner" role="alert" id="lessonsForbiddenBanner">
          <div className="permission-denied-content">
            <div className="permission-denied-title">Truy cập bị từ chối</div>
            <p className="permission-denied-message">{forbiddenBanner}</p>
          </div>
          <button
            type="button"
            className="btn btn-secondary logout-denied-btn"
            id="btnLogoutOnLessonsForbidden"
            onClick={handleLogoutOnForbidden}
          >
            Đăng xuất
          </button>
        </div>
      )}

      {!forbiddenBanner && (
        <>
          {/* Mutation Status */}
          {mutationStatus && (
            <div
              id="lessonMutationStatus"
              role="status"
              aria-live="polite"
              className="table-mutation-status"
              style={{ marginBottom: '16px' }}
            >
              {mutationStatus}
            </div>
          )}

          {/* Error state */}
          {fetchError && (
            <div className="empty-state-open" id="fetchErrorState">
              <h3 className="empty-title">Không thể tải dữ liệu</h3>
              <p className="empty-desc">{fetchError}</p>
              <button
                type="button"
                className="btn btn-secondary"
                id="btnRetryFetchLessons"
                onClick={fetchLessons}
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Loading Skeleton */}
          {isLoading && !fetchError && (
            <div id="lessonsLoadingSkeleton" className="table-wrap">
              <div className="skeleton-row">
                <div className="skeleton-bar" style={{ width: '10%' }}></div>
                <div className="skeleton-bar" style={{ width: '15%' }}></div>
                <div className="skeleton-bar" style={{ width: '15%' }}></div>
                <div className="skeleton-bar" style={{ width: '25%' }}></div>
                <div className="skeleton-bar" style={{ width: '20%' }}></div>
                <div className="skeleton-bar" style={{ width: '15%' }}></div>
              </div>
              <div className="skeleton-row">
                <div className="skeleton-bar" style={{ width: '10%' }}></div>
                <div className="skeleton-bar" style={{ width: '15%' }}></div>
                <div className="skeleton-bar" style={{ width: '15%' }}></div>
                <div className="skeleton-bar" style={{ width: '25%' }}></div>
                <div className="skeleton-bar" style={{ width: '20%' }}></div>
                <div className="skeleton-bar" style={{ width: '15%' }}></div>
              </div>
            </div>
          )}

          {/* Populated Table */}
          {!isLoading && !fetchError && lessons.length > 0 && (
            <div className="table-wrap" id="populatedLessonsTable">
              <table className="data-table" aria-label="Danh mục bài học">
                <thead>
                  <tr>
                    <th scope="col" style={{ width: '90px' }}>Vị trí</th>
                    <th scope="col" style={{ width: '110px' }}>Bắt buộc</th>
                    <th scope="col" style={{ width: '120px' }}>Trạng thái</th>
                    <th scope="col">Giáo viên phụ trách</th>
                    <th scope="col">Bản sửa đổi</th>
                    <th scope="col" style={{ width: '180px', textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {lessons.map((l) => {
                    const teacher = l.assignment?.currentTeacher;
                    const teacherDisabled = teacher?.status === 'DISABLED';
                    const highest = l.highestRevision;

                    return (
                      <tr key={l.id} id={`row-lesson-${l.id}`}>
                        <td>
                          <span className="unit-position-number" id={`lesson-pos-${l.id}`}>
                            #{l.position}
                          </span>
                        </td>
                        <td>
                          {l.isRequired ? (
                            <span
                              className="status-badge status-active"
                              id={`lesson-required-badge-${l.id}`}
                              style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}
                            >
                              Bắt buộc
                            </span>
                          ) : (
                            <span
                              style={{ color: '#64748b', fontSize: '12px' }}
                              id={`lesson-optional-badge-${l.id}`}
                            >
                              Tùy chọn
                            </span>
                          )}
                        </td>
                        <td>
                          <span
                            className="level-badge"
                            id={`lesson-avail-badge-${l.id}`}
                            style={{ background: '#f1f5f9', color: '#475569' }}
                          >
                            {l.availability}
                          </span>
                        </td>
                        <td>
                          {teacher ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span id={`lesson-teacher-name-${l.id}`} style={{ fontWeight: 500 }}>
                                {teacher.displayName || teacher.id}
                              </span>
                              {teacherDisabled && (
                                <span
                                  className="status-badge status-disabled"
                                  id={`lesson-teacher-disabled-badge-${l.id}`}
                                  style={{
                                    background: '#fee2e2',
                                    color: '#991b1b',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                  }}
                                >
                                  Vô hiệu hóa
                                </span>
                              )}
                              <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                                (Đợt #{l.assignment?.generation})
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8', fontStyle: 'italic' }} id={`lesson-unassigned-${l.id}`}>
                              Chưa phân công
                            </span>
                          )}
                        </td>
                        <td>
                          {highest ? (
                            <span id={`lesson-revision-summary-${l.id}`}>
                              Bản #{highest.revisionNo} ({highest.status})
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontStyle: 'italic' }} id={`lesson-no-draft-${l.id}`}>
                              Chưa có bản nháp
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div className="col-actions" style={{ justifyContent: 'flex-end', whiteSpace: 'nowrap' }}>
                            <button
                              type="button"
                              className="btn-text-action btn-text-edit"
                              id={`btn-edit-lesson-${l.id}`}
                              onClick={(e) => handleOpenEdit(l, e)}
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              className="btn-text-action btn-text-view"
                              id={`btn-assign-lesson-${l.id}`}
                              onClick={(e) => handleOpenAssign(l, e)}
                            >
                              Phân công
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="table-summary-bar">
                <span className="table-summary">Tổng số: {lessons.length} bài học</span>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !fetchError && lessons.length === 0 && (
            <div className="empty-state-open" id="emptyLessonsTable">
              <h3 className="empty-title">Chưa có bài học nào</h3>
              <p className="empty-desc">
                Tạo khung bài học đầu tiên trong đơn vị bài học này để bắt đầu phân công giáo viên biên soạn.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                id="btnEmptyCreateLesson"
                onClick={handleOpenCreate}
              >
                Thêm bài học đầu tiên
              </button>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <LessonFormModal
        isOpen={isFormModalOpen}
        mode={formMode}
        courseId={course.id}
        unitId={unit.id}
        initialData={formInitialData}
        triggerElement={triggerRef.current}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={handleFormSuccess}
        onForbidden={(msg) => setForbiddenBanner(msg || 'Tài khoản không có quyền thao tác.')}
        onSessionExpired={() => { setIsFormModalOpen(false); setIsAssignModalOpen(false); setIsSessionLostOpen(true); }}
      />

      <LessonAssignModal
        isOpen={isAssignModalOpen}
        courseId={course.id}
        unitId={unit.id}
        lesson={targetAssignLesson}
        teacherOptions={teachers}
        teacherOptionsError={teachersError}
        loadingOptions={loadingTeachers}
        onRetryOptions={fetchTeachers}
        triggerElement={triggerRef.current}
        onClose={() => setIsAssignModalOpen(false)}
        onSuccess={handleAssignSuccess}
        onForbidden={(msg) => setForbiddenBanner(msg || 'Tài khoản không có quyền thao tác.')}
        onSessionExpired={() => { setIsFormModalOpen(false); setIsAssignModalOpen(false); setIsSessionLostOpen(true); }}
      />

      <SessionLostModal
        isOpen={isSessionLostOpen}
      />
    </div>
  );
}
