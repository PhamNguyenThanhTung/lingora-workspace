'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { CourseDto } from '@/server/courses';
import type { UnitDto } from '@/server/units';
import type { LevelDto } from '@/server/levels';
import { UnitFormModal } from './UnitFormModal';
import { UnitDeleteModal } from './UnitDeleteModal';
import { SessionLostModal } from './SessionLostModal';
import { removeDraft, clearAllDrafts } from './draftStorage';

export interface UnitsCatalogProps {
  course: CourseDto;
  frameworkLevels?: LevelDto[];
  initialUnits?: UnitDto[];
  initialError?: string | null;
  initialLevelsError?: string | null;
  isLoading?: boolean;
  account: {
    id: string;
    role: string;
    status: string;
    displayName: string | null;
  };
}

export function UnitsCatalog({
  course,
  frameworkLevels = [],
  initialUnits,
  initialError,
  initialLevelsError,
  isLoading: propIsLoading,
  account,
}: UnitsCatalogProps) {
  const [units, setUnits] = useState<UnitDto[]>(initialUnits || []);
  const [levels, setLevels] = useState<LevelDto[]>(frameworkLevels);
  const [levelsError, setLevelsError] = useState<string | null>(initialLevelsError || null);
  const [isLoadingLevels, setIsLoadingLevels] = useState(false);
  const [isLoading, setIsLoading] = useState(
    propIsLoading !== undefined ? propIsLoading : (!initialUnits && !initialError)
  );
  const [fetchError, setFetchError] = useState<string | null>(initialError || null);
  const [forbiddenBanner, setForbiddenBanner] = useState<string | null>(null);
  const [mutationStatus, setMutationStatus] = useState<string | null>(null);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formInitialData, setFormInitialData] = useState<UnitDto | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [targetUnit, setTargetUnit] = useState<UnitDto | null>(null);

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

  const fetchUnits = async () => {
    setIsLoading(true);
    setFetchError(null);
    setForbiddenBanner(null);
    setMutationStatus(null);

    try {
      const res = await fetch(`/api/courses/${course.id}/units`, {
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
        setForbiddenBanner('Tài khoản của bạn không có quyền xem danh sách đơn vị bài học.');
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setFetchError(err?.error?.message || 'Không thể tải danh sách đơn vị bài học.');
        setIsLoading(false);
        return;
      }

      const json = await res.json();
      setUnits(json.data || []);
      setIsLoading(false);
    } catch {
      setFetchError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
      setIsLoading(false);
    }
  };

  const fetchLevels = async () => {
    setIsLoadingLevels(true);
    setLevelsError(null);
    try {
      const res = await fetch(`/api/frameworks/${course.frameworkId}/levels`, {
        headers: {
          Origin: window.location.origin,
        },
      });

      if (res.status === 401) {
        setIsSessionLostOpen(true);
        setIsLoadingLevels(false);
        return;
      }

      if (res.status === 403) {
        setIsLoadingLevels(false);
        setIsFormModalOpen(false);
        setIsDeleteModalOpen(false);
        const data = await res.json().catch(() => ({}));
        setForbiddenBanner(data?.error?.message || 'Bạn không có quyền xem danh sách cấp độ.');
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setLevelsError(err?.error?.message || 'Không thể tải danh sách cấp độ.');
        setIsLoadingLevels(false);
        return;
      }

      const json = await res.json();
      setLevels(json.data || []);
      setIsLoadingLevels(false);
    } catch {
      setLevelsError('Không thể kết nối đến máy chủ khi tải danh sách cấp độ.');
      setIsLoadingLevels(false);
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

  const handleOpenEdit = (u: UnitDto, e: React.MouseEvent<HTMLButtonElement>) => {
    clearMutationStatus();
    triggerRef.current = e.currentTarget;
    setFormMode('edit');
    setFormInitialData(u);
    setIsFormModalOpen(true);
  };

  const handleOpenDelete = (u: UnitDto, e: React.MouseEvent<HTMLButtonElement>) => {
    clearMutationStatus();
    triggerRef.current = e.currentTarget;
    setTargetUnit(u);
    setIsDeleteModalOpen(true);
  };

  const sortUnits = (items: UnitDto[]): UnitDto[] => {
    return [...items].sort((a, b) => {
      const lvlA = frameworkLevels.find((l) => l.id === a.levelId);
      const lvlB = frameworkLevels.find((l) => l.id === b.levelId);
      const posA = a.level?.position ?? lvlA?.position ?? 0;
      const posB = b.level?.position ?? lvlB?.position ?? 0;
      if (posA !== posB) return posA - posB;
      if (a.position !== b.position) return a.position - b.position;
      return a.id.localeCompare(b.id);
    });
  };

  const handleFormSuccess = (saved: UnitDto, mode: 'create' | 'edit') => {
    if (mode === 'create') {
      setUnits((prev) => sortUnits([saved, ...prev.filter((u) => u.id !== saved.id)]));
      setMutationStatus(`Đã thêm đơn vị bài học "${saved.code}" thành công.`);
    } else {
      setUnits((prev) => sortUnits(prev.map((u) => (u.id === saved.id ? saved : u))));
      setMutationStatus(`Đã cập nhật đơn vị bài học "${saved.code}" thành công.`);
    }
  };

  const handleDeleteSuccess = (deletedId: string) => {
    const prevIndex = units.findIndex((u) => u.id === deletedId);
    const deleted = units.find((u) => u.id === deletedId);
    const nextList = units.filter((u) => u.id !== deletedId);
    setUnits(nextList);

    const title = deleted ? deleted.code : 'Đơn vị bài học';
    setMutationStatus(`Đã xóa đơn vị bài học "${title}" thành công.`);

    setTimeout(() => {
      if (nextList.length === 0) {
        const emptyBtn = document.getElementById('btnEmptyCreateUnit') || openCreateBtnRef.current;
        emptyBtn?.focus();
      } else {
        const targetIndex = prevIndex < nextList.length ? prevIndex : nextList.length - 1;
        const targetId = nextList[targetIndex].id;
        const btn =
          document.getElementById(`btn-delete-unit-${targetId}`) ||
          document.getElementById(`btn-edit-unit-${targetId}`);
        if (btn) {
          btn.focus();
        } else {
          openCreateBtnRef.current?.focus();
        }
      }
    }, 50);
  };

  const getUnitDisplayName = (names: Record<string, string>) => {
    return names.vi || names.en || 'Chưa đặt tên';
  };

  // Authoritative labels for parent banner
  const courseTitle = course.names.vi || course.names.en || 'Khóa học';
  const targetLanguageLabel = course.language
    ? course.language.names.vi || course.language.names.en || course.language.code
    : course.languageId;
  const frameworkLabel = course.framework
    ? `${course.framework.code} v${course.framework.version}`
    : course.frameworkId;
  const defaultStartLevelLabel = course.defaultStartLevel
    ? course.defaultStartLevel.code
    : course.defaultStartLevelId;

  return (
    <div className="page-content" id="unitsCatalogue">
      {/* Back Link to Courses Catalog */}
      <a href="/courses" className="back-link" id="linkBackToCourses">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        <span>Quay lại danh mục khóa học</span>
      </a>

      {/* Parent Identity Banner */}
      <div className="parent-identity-banner" id="parentIdentityBanner">
        <span className="parent-identity-code" id="parentCourseName">
          {courseTitle}
        </span>
        <span className="parent-identity-version" id="parentCourseTargetLanguage" title="Ngôn ngữ học mục tiêu">
          Ngôn ngữ: {targetLanguageLabel}
        </span>
        <span className="parent-identity-version" id="parentCourseFramework" title="Khung năng lực áp dụng">
          Khung: {frameworkLabel}
        </span>
        <span className="parent-identity-version" id="parentCourseStartLevel" title="Cấp độ bắt đầu mặc định">
          Khởi đầu: {defaultStartLevelLabel}
        </span>
      </div>

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Danh sách đơn vị bài học</h1>
          <p className="page-description">
            Quản lý các bài học lớn (Unit) trực thuộc khóa học và phân bổ theo từng cấp độ khung năng lực.
          </p>
        </div>

        {!forbiddenBanner && (
          <button
            type="button"
            id="btnOpenCreateUnit"
            ref={openCreateBtnRef}
            className="btn btn-primary"
            onClick={handleOpenCreate}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Thêm đơn vị</span>
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

      {/* Content hidden on 403 */}
      {!forbiddenBanner && (
        <>
          {/* Mutation Status Announcement */}
          {mutationStatus && (
            <div
              id="unitMutationStatus"
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
                id="btnRetryFetchUnits"
                onClick={fetchUnits}
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Loading Skeleton */}
          {isLoading && !fetchError && (
            <div id="unitsLoadingSkeleton" className="table-wrap">
              <div className="skeleton-row">
                <div className="skeleton-bar" style={{ width: '12%' }}></div>
                <div className="skeleton-bar" style={{ width: '10%' }}></div>
                <div className="skeleton-bar" style={{ width: '18%' }}></div>
                <div className="skeleton-bar" style={{ width: '40%' }}></div>
                <div className="skeleton-bar" style={{ width: '20%' }}></div>
              </div>
              <div className="skeleton-row">
                <div className="skeleton-bar" style={{ width: '12%' }}></div>
                <div className="skeleton-bar" style={{ width: '10%' }}></div>
                <div className="skeleton-bar" style={{ width: '16%' }}></div>
                <div className="skeleton-bar" style={{ width: '42%' }}></div>
                <div className="skeleton-bar" style={{ width: '20%' }}></div>
              </div>
            </div>
          )}

          {/* Populated Table */}
          {!isLoading && !fetchError && units.length > 0 && (
            <div className="table-wrap" id="populatedUnitsTable">
              <table className="data-table" aria-label="Danh mục đơn vị bài học">
                <thead>
                  <tr>
                    <th scope="col" style={{ width: '120px' }}>Cấp độ</th>
                    <th scope="col" style={{ width: '100px' }}>Vị trí</th>
                    <th scope="col" style={{ width: '160px' }}>Mã đơn vị</th>
                    <th scope="col">Tên đơn vị bài học</th>
                    <th scope="col" style={{ width: '160px', textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {units.map((u) => {
                    const matchedLevel = frameworkLevels.find((l) => l.id === u.levelId);
                    const lvlCode = u.level?.code || matchedLevel?.code || '—';

                    return (
                      <tr key={u.id} id={`row-unit-${u.id}`}>
                        <td>
                          <span className="level-badge" id={`unit-level-badge-${u.id}`}>
                            {lvlCode}
                          </span>
                        </td>
                        <td>
                          <span className="unit-position-number" id={`unit-pos-${u.id}`}>
                            #{u.position}
                          </span>
                        </td>
                        <td className="col-code">{u.code}</td>
                        <td className="col-names">
                          <div className="name-vi">{getUnitDisplayName(u.names)}</div>
                          {u.names.en && u.names.vi && (
                            <div className="name-en">{u.names.en}</div>
                          )}
                        </td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div className="col-actions" style={{ justifyContent: 'flex-end', whiteSpace: 'nowrap' }}>
                            <button
                              type="button"
                              className="btn-text-action btn-text-edit"
                              id={`btn-edit-unit-${u.id}`}
                              onClick={(e) => handleOpenEdit(u, e)}
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              className="btn-text-action btn-text-delete"
                              id={`btn-delete-unit-${u.id}`}
                              onClick={(e) => handleOpenDelete(u, e)}
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
                <span className="table-summary">Tổng số: {units.length} đơn vị bài học</span>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !fetchError && units.length === 0 && (
            <div className="empty-state-open" id="emptyUnitsTable">
              <h3 className="empty-title">Chưa có đơn vị bài học nào</h3>
              <p className="empty-desc">
                Bắt đầu xây dựng chương trình bằng cách thêm đơn vị bài học đầu tiên vào khóa học này.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                id="btnEmptyCreateUnit"
                onClick={handleOpenCreate}
              >
                + Thêm đơn vị
              </button>
            </div>
          )}
        </>
      )}

      {/* Unit Form Modal */}
      <UnitFormModal
        isOpen={isFormModalOpen}
        mode={formMode}
        courseId={course.id}
        frameworkLevels={levels}
        levelsError={levelsError}
        onRetryLevels={fetchLevels}
        isLoadingLevels={isLoadingLevels}
        initialData={formInitialData}
        triggerElement={triggerRef.current}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={handleFormSuccess}
        onForbidden={(msg) => {
          setIsFormModalOpen(false);
          setIsDeleteModalOpen(false);
          setForbiddenBanner(msg || 'Bạn không có quyền thực hiện thao tác này.');
        }}
        onSessionExpired={() => setIsSessionLostOpen(true)}
      />

      {/* Unit Delete Modal */}
      <UnitDeleteModal
        isOpen={isDeleteModalOpen}
        courseId={course.id}
        targetUnit={targetUnit}
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
