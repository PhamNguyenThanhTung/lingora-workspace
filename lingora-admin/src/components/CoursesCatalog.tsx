'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { CourseDto } from '@/server/courses';
import type { LanguageDto } from '@/server/languages';
import type { FrameworkDto } from '@/server/frameworks';
import { CourseFormModal } from './CourseFormModal';
import { CourseDeleteModal } from './CourseDeleteModal';
import { SessionLostModal } from './SessionLostModal';
import { removeDraft, clearAllDrafts } from './draftStorage';

export interface CoursesCatalogProps {
  initialCourses?: CourseDto[];
  initialError?: string | null;
  isLoading?: boolean;
  languages?: LanguageDto[];
  frameworks?: FrameworkDto[];
  account: {
    id: string;
    role: string;
    status: string;
    displayName: string | null;
  };
}

export function CoursesCatalog({
  initialCourses,
  initialError,
  isLoading: propIsLoading,
  languages: propLanguages,
  frameworks: propFrameworks,
  account,
}: CoursesCatalogProps) {
  const [courses, setCourses] = useState<CourseDto[]>(initialCourses || []);
  const [isLoading, setIsLoading] = useState(
    propIsLoading !== undefined ? propIsLoading : (!initialCourses && !initialError)
  );
  const [fetchError, setFetchError] = useState<string | null>(initialError || null);
  const [forbiddenBanner, setForbiddenBanner] = useState<string | null>(null);
  const [mutationStatus, setMutationStatus] = useState<string | null>(null);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formInitialData, setFormInitialData] = useState<CourseDto | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [targetCourse, setTargetCourse] = useState<CourseDto | null>(null);

  const [isSessionLostOpen, setIsSessionLostOpen] = useState(false);

  const triggerRef = useRef<HTMLElement | null>(null);
  const openCreateBtnRef = useRef<HTMLButtonElement>(null);

  const anyModalOpen = isFormModalOpen || isDeleteModalOpen || isSessionLostOpen;
  useEffect(() => {
    const container = document.getElementById('appContainer');
    if (container) {
      if (anyModalOpen) {
        container.setAttribute('inert', '');
      } else {
        container.removeAttribute('inert');
      }
    }
  }, [anyModalOpen]);

  const fetchCourses = async () => {
    setIsLoading(true);
    setFetchError(null);
    setForbiddenBanner(null);
    setMutationStatus(null);

    try {
      const res = await fetch('/api/courses', {
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
        setIsDeleteModalOpen(false);
        setForbiddenBanner('Tài khoản của bạn không có quyền xem danh mục khóa học.');
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setFetchError(err?.error?.message || 'Không thể tải danh mục khóa học.');
        setIsLoading(false);
        return;
      }

      const json = await res.json();
      setCourses(json.data || []);
      setIsLoading(false);
    } catch {
      setFetchError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
      setIsLoading(false);
    }
  };

  const clearMutationStatus = () => {
    setMutationStatus(null);
  };

  const handleLogout = async () => {
    try {
      removeDraft(account.id);
      clearAllDrafts();
    } catch {
      // Safe isolation
    }

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          Origin: window.location.origin,
        },
      });
    } catch {}
    window.location.href = '/login';
  };

  const handleOpenCreate = (e: React.MouseEvent<HTMLButtonElement>) => {
    clearMutationStatus();
    triggerRef.current = e.currentTarget;
    setFormMode('create');
    setFormInitialData(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (c: CourseDto, e: React.MouseEvent<HTMLButtonElement>) => {
    clearMutationStatus();
    triggerRef.current = e.currentTarget;
    setFormMode('edit');
    setFormInitialData(c);
    setIsFormModalOpen(true);
  };

  const handleOpenDelete = (c: CourseDto, e: React.MouseEvent<HTMLButtonElement>) => {
    clearMutationStatus();
    triggerRef.current = e.currentTarget;
    setTargetCourse(c);
    setIsDeleteModalOpen(true);
  };

  const handleFormSuccess = (saved: CourseDto, mode: 'create' | 'edit') => {
    const courseTitle = saved.names.vi || saved.names.en || 'Khóa học';
    if (mode === 'create') {
      setCourses((prev) => [saved, ...prev.filter((c) => c.id !== saved.id)]);
      setMutationStatus(`Đã thêm khóa học "${courseTitle}" thành công.`);
    } else {
      setCourses((prev) => prev.map((c) => (c.id === saved.id ? saved : c)));
      setMutationStatus(`Đã cập nhật khóa học "${courseTitle}" thành công.`);
    }
  };

  const handleDeleteSuccess = (deletedId: string) => {
    const prevIndex = courses.findIndex((c) => c.id === deletedId);
    const deleted = courses.find((c) => c.id === deletedId);
    const nextList = courses.filter((c) => c.id !== deletedId);
    setCourses(nextList);

    const title = deleted ? deleted.names.vi || deleted.names.en || 'Khóa học' : 'Khóa học';
    setMutationStatus(`Đã xóa khóa học "${title}" thành công.`);

    setTimeout(() => {
      if (nextList.length === 0) {
        const emptyBtn = document.getElementById('btnEmptyCreateCourse') || openCreateBtnRef.current;
        emptyBtn?.focus();
      } else {
        const targetIndex = prevIndex < nextList.length ? prevIndex : nextList.length - 1;
        const targetId = nextList[targetIndex].id;
        const btn =
          document.getElementById(`btn-delete-course-${targetId}`) ||
          document.getElementById(`btn-edit-course-${targetId}`) ||
          document.getElementById(`linkCourseUnits-${targetId}`);
        if (btn) {
          btn.focus();
        } else {
          openCreateBtnRef.current?.focus();
        }
      }
    }, 50);
  };

  const getCourseDisplayName = (names: Record<string, string>) => {
    return names.vi || names.en || 'Chưa đặt tên';
  };

  return (
    <div className="page-content" id="coursesCatalogue">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý khóa học</h1>
          <p className="page-description">
            Thiết lập danh mục chương trình học, ngôn ngữ mục tiêu và đơn vị bài học trực thuộc.
          </p>
        </div>

        {!forbiddenBanner && (
          <button
            type="button"
            id="btnOpenCreateCourse"
            ref={openCreateBtnRef}
            className="btn btn-primary"
            onClick={handleOpenCreate}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Thêm khóa học</span>
          </button>
        )}
      </div>

      {/* Permission Denied Banner with Logout Action */}
      {forbiddenBanner && (
        <div
          id="forbiddenBanner"
          style={{
            padding: '14px 18px',
            backgroundColor: '#FDF2F2',
            border: '1px solid #F87171',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
          role="alert"
        >
          <div style={{ color: 'var(--danger-red)', fontSize: 'var(--font-size-sub)' }}>
            <strong>Truy cập bị từ chối:</strong> {forbiddenBanner}
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            id="forbiddenLogoutBtn"
            style={{ height: '36px', padding: '0 12px' }}
            onClick={handleLogout}
          >
            Đăng xuất
          </button>
        </div>
      )}

      {/* Mutation Catalogue hidden on 403 */}
      {!forbiddenBanner && (
        <>
          {/* Mutation Status Announcement */}
          {mutationStatus && (
            <div
              id="courseMutationStatus"
              role="status"
              aria-live="polite"
              className="table-mutation-status"
              style={{ marginBottom: '16px' }}
            >
              {mutationStatus}
            </div>
          )}

          {/* Error state with retry */}
          {fetchError && (
            <div className="empty-state-open" id="fetchErrorState">
              <h3 className="empty-title">Không thể tải dữ liệu</h3>
              <p className="empty-desc">{fetchError}</p>
              <button
                type="button"
                className="btn btn-secondary"
                id="btnRetryFetchCourses"
                onClick={fetchCourses}
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Loading Skeleton */}
          {isLoading && !fetchError && (
            <div id="coursesLoadingSkeleton" className="table-wrap">
              <div className="skeleton-row">
                <div className="skeleton-bar" style={{ width: '25%' }}></div>
                <div className="skeleton-bar" style={{ width: '15%' }}></div>
                <div className="skeleton-bar" style={{ width: '15%' }}></div>
                <div className="skeleton-bar" style={{ width: '10%' }}></div>
                <div className="skeleton-bar" style={{ width: '10%' }}></div>
                <div className="skeleton-bar" style={{ width: '15%' }}></div>
              </div>
              <div className="skeleton-row">
                <div className="skeleton-bar" style={{ width: '22%' }}></div>
                <div className="skeleton-bar" style={{ width: '14%' }}></div>
                <div className="skeleton-bar" style={{ width: '16%' }}></div>
                <div className="skeleton-bar" style={{ width: '10%' }}></div>
                <div className="skeleton-bar" style={{ width: '10%' }}></div>
                <div className="skeleton-bar" style={{ width: '15%' }}></div>
              </div>
            </div>
          )}

          {/* Populated Table */}
          {!isLoading && !fetchError && courses.length > 0 && (
            <div className="table-wrap" id="populatedCoursesTable">
              <table className="data-table" aria-label="Danh mục khóa học">
                <thead>
                  <tr>
                    <th scope="col">Tên khóa học</th>
                    <th scope="col" style={{ width: '150px' }}>Ngôn ngữ học</th>
                    <th scope="col" style={{ width: '150px' }}>Khung năng lực</th>
                    <th scope="col" style={{ width: '120px' }}>Cấp độ đầu</th>
                    <th scope="col" style={{ width: '120px' }}>Trạng thái</th>
                    <th scope="col" style={{ width: '110px' }}>Số đơn vị</th>
                    <th scope="col" style={{ minWidth: '240px', width: '240px', textAlign: 'right', whiteSpace: 'nowrap' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((c) => {
                    const langLabel = c.language
                      ? c.language.names.vi || c.language.names.en || c.language.code
                      : c.languageId;
                    const fwLabel = c.framework
                      ? `${c.framework.code} v${c.framework.version}`
                      : c.frameworkId;
                    const startLvlLabel = c.defaultStartLevel
                      ? c.defaultStartLevel.code
                      : c.defaultStartLevelId;

                    return (
                      <tr key={c.id} id={`row-course-${c.id}`}>
                        <td className="col-names">
                          <div className="name-vi">{getCourseDisplayName(c.names)}</div>
                          {c.names.en && c.names.vi && (
                            <div className="name-en">{c.names.en}</div>
                          )}
                        </td>
                        <td>{langLabel}</td>
                        <td>{fwLabel}</td>
                        <td>
                          <span className="level-badge" id={`course-start-level-${c.id}`}>
                            {startLvlLabel}
                          </span>
                        </td>
                        <td>
                          <span
                            className={c.isActive ? 'flag-yes' : 'flag-no'}
                            id={`course-status-${c.id}`}
                          >
                            {c.isActive ? 'Hoạt động' : 'Tạm dừng'}
                          </span>
                        </td>
                        <td>
                          <span id={`course-unit-count-${c.id}`}>{c.unitCount} đơn vị</span>
                        </td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div className="col-actions" style={{ justifyContent: 'flex-end', whiteSpace: 'nowrap' }}>
                            <a
                              href={`/courses/${c.id}`}
                              className="btn-text-action btn-text-levels"
                              id={`linkCourseUnits-${c.id}`}
                            >
                              Xem đơn vị
                            </a>
                            <button
                              type="button"
                              className="btn-text-action btn-text-edit"
                              id={`btn-edit-course-${c.id}`}
                              onClick={(e) => handleOpenEdit(c, e)}
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              className="btn-text-action btn-text-delete"
                              id={`btn-delete-course-${c.id}`}
                              onClick={(e) => handleOpenDelete(c, e)}
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="table-summary-bar">
                <span className="table-summary">Tổng số: {courses.length} khóa học</span>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !fetchError && courses.length === 0 && (
            <div className="empty-state-open" id="emptyCoursesTable">
              <h3 className="empty-title">Chưa có khóa học nào</h3>
              <p className="empty-desc">
                Bắt đầu bằng cách thêm khóa học đầu tiên vào danh mục quản trị.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                id="btnEmptyCreateCourse"
                onClick={handleOpenCreate}
              >
                + Thêm khóa học
              </button>
            </div>
          )}
        </>
      )}

      {/* Course Form Modal */}
      <CourseFormModal
        isOpen={isFormModalOpen}
        mode={formMode}
        initialData={formInitialData}
        triggerElement={triggerRef.current}
        languages={propLanguages}
        frameworks={propFrameworks}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={handleFormSuccess}
        onForbidden={(msg) => {
          setIsFormModalOpen(false);
          setIsDeleteModalOpen(false);
          setForbiddenBanner(msg || 'Bạn không có quyền thực hiện thao tác này.');
        }}
        onSessionExpired={() => setIsSessionLostOpen(true)}
      />

      {/* Course Delete Modal */}
      <CourseDeleteModal
        isOpen={isDeleteModalOpen}
        targetCourse={targetCourse}
        triggerElement={triggerRef.current}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={handleDeleteSuccess}
        onForbidden={(msg) => {
          setIsFormModalOpen(false);
          setIsDeleteModalOpen(false);
          setForbiddenBanner(msg || 'Bạn không có quyền thực hiện thao tác xóa.');
        }}
        onSessionExpired={() => setIsSessionLostOpen(true)}
      />

      {/* Session Lost Modal */}
      <SessionLostModal
        isOpen={isSessionLostOpen}
        hasSavedDraft={false}
      />
    </div>
  );
}
