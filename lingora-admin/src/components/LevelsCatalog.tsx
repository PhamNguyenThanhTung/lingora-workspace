'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { FrameworkDto } from '@/server/frameworks';
import type { LevelDto } from '@/server/levels';
import { LevelFormModal } from './LevelFormModal';
import { LevelDeleteModal } from './LevelDeleteModal';
import { SessionLostModal } from './SessionLostModal';
import { removeDraft, clearAllDrafts } from './draftStorage';

export interface LevelsCatalogProps {
  framework: FrameworkDto;
  initialLevels?: LevelDto[];
  initialError?: string | null;
  isLoading?: boolean;
  account: {
    id: string;
    role: string;
    status: string;
    displayName: string | null;
  };
}

export function LevelsCatalog({
  framework,
  initialLevels,
  initialError,
  isLoading: propIsLoading,
  account,
}: LevelsCatalogProps) {
  const [levels, setLevels] = useState<LevelDto[]>(initialLevels || []);
  const [isLoading, setIsLoading] = useState(
    propIsLoading !== undefined ? propIsLoading : (!initialLevels && !initialError)
  );
  const [fetchError, setFetchError] = useState<string | null>(initialError || null);
  const [forbiddenBanner, setForbiddenBanner] = useState<string | null>(null);
  const [mutationStatus, setMutationStatus] = useState<string | null>(null);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formInitialData, setFormInitialData] = useState<LevelDto | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [targetLevel, setTargetLevel] = useState<LevelDto | null>(null);

  const [isSessionLostOpen, setIsSessionLostOpen] = useState(false);

  // Focus trigger element ref
  const triggerRef = useRef<HTMLElement | null>(null);
  const openCreateBtnRef = useRef<HTMLButtonElement>(null);

  // Background inert when any modal is open
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

  const fetchLevels = async () => {
    setIsLoading(true);
    setFetchError(null);
    setForbiddenBanner(null);
    setMutationStatus(null);

    try {
      const res = await fetch(`/api/frameworks/${framework.id}/levels`, {
        headers: {
          'Origin': window.location.origin,
        },
      });

      if (res.status === 401) {
        setIsSessionLostOpen(true);
        setIsLoading(false);
        return;
      }

      if (res.status === 403) {
        setForbiddenBanner('Tài khoản của bạn không có quyền xem danh mục cấp độ.');
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setFetchError(err?.error?.message || 'Không thể tải danh sách cấp độ.');
        setIsLoading(false);
        return;
      }

      const json = await res.json();
      setLevels(json.data || []);
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
          'Origin': window.location.origin,
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

  const handleOpenEdit = (lvl: LevelDto, e: React.MouseEvent<HTMLButtonElement>) => {
    clearMutationStatus();
    triggerRef.current = e.currentTarget;
    setFormMode('edit');
    setFormInitialData(lvl);
    setIsFormModalOpen(true);
  };

  const handleOpenDelete = (lvl: LevelDto, e: React.MouseEvent<HTMLButtonElement>) => {
    clearMutationStatus();
    triggerRef.current = e.currentTarget;
    setTargetLevel(lvl);
    setIsDeleteModalOpen(true);
  };

  const handleFormSuccess = (saved: LevelDto, mode: 'create' | 'edit') => {
    if (mode === 'create') {
      setLevels((prev) => {
        const updated = [...prev.filter((l) => l.id !== saved.id), saved];
        return updated.sort((a, b) => a.position - b.position || a.code.localeCompare(b.code));
      });
      setMutationStatus(`Đã thêm cấp độ ${saved.code} thành công.`);
    } else {
      setLevels((prev) => {
        const updated = prev.map((l) => (l.id === saved.id ? saved : l));
        return updated.sort((a, b) => a.position - b.position || a.code.localeCompare(b.code));
      });
      setMutationStatus(`Đã cập nhật cấp độ ${saved.code} thành công.`);
    }
  };

  const handleDeleteSuccess = (deletedId: string) => {
    const prevIndex = levels.findIndex((l) => l.id === deletedId);
    const deleted = levels.find((l) => l.id === deletedId);
    const nextList = levels.filter((l) => l.id !== deletedId);
    setLevels(nextList);
    setMutationStatus(
      deleted ? `Đã xóa cấp độ ${deleted.code} thành công.` : 'Đã xóa cấp độ thành công.'
    );

    setTimeout(() => {
      if (nextList.length === 0) {
        const emptyBtn = document.getElementById('btnEmptyCreateLevel') || openCreateBtnRef.current;
        emptyBtn?.focus();
      } else {
        const targetIndex = prevIndex < nextList.length ? prevIndex : nextList.length - 1;
        const targetId = nextList[targetIndex].id;
        const btn =
          document.getElementById(`btn-delete-level-${targetId}`) ||
          document.getElementById(`btn-edit-level-${targetId}`);
        if (btn) {
          btn.focus();
        } else {
          openCreateBtnRef.current?.focus();
        }
      }
    }, 50);
  };

  const getFrameworkDisplayName = (fw: FrameworkDto) => {
    return fw.names.vi || fw.names.en || `${fw.code} (${fw.version})`;
  };

  const getLevelDisplayName = (label: Record<string, string>) => {
    return label.vi || label.en || 'Chưa đặt tên';
  };

  // Compute next suggested position
  const nextPosition =
    levels.length > 0 ? Math.max(...levels.map((l) => l.position)) + 1 : 1;

  return (
    <div className="page-content" id="levelsCatalogue">
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
            id="forbiddenLogoutBtnLevel"
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
          {/* Back Link to Frameworks Catalog */}
          <a href="/frameworks" className="back-link" id="linkBackToFrameworks">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>Quay lại danh mục khung năng lực</span>
          </a>

          {/* Parent Identity Banner */}
          <div className="parent-identity-banner" id="parentIdentityBanner">
            <span className="parent-identity-code">{framework.code}</span>
            <span className="parent-identity-version">v{framework.version}</span>
            <span className="parent-identity-name">{getFrameworkDisplayName(framework)}</span>
          </div>

          {/* Page Header */}
          <div className="page-header">
            <div>
              <h1 className="page-title">Danh sách cấp độ</h1>
              <p className="page-description">
                Quản lý các cấp độ thành thạo trực thuộc khung năng lực {framework.code} ({framework.version}), sắp xếp theo thứ tự độ khó tăng dần.
              </p>
            </div>

            <button
              type="button"
              id="btnOpenCreateLevel"
              ref={openCreateBtnRef}
              className="btn btn-primary"
              onClick={handleOpenCreate}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Thêm cấp độ</span>
            </button>
          </div>

          {/* Mutation Status Announcement */}
          {mutationStatus && (
            <div
              id="levelMutationStatus"
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
                id="btnRetryFetchLevels"
                onClick={fetchLevels}
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Loading Skeleton */}
          {isLoading && !fetchError && (
            <div id="levelsLoadingSkeleton" className="table-wrap">
              <div className="skeleton-row">
                <div className="skeleton-bar" style={{ width: '10%' }}></div>
                <div className="skeleton-bar" style={{ width: '15%' }}></div>
                <div className="skeleton-bar" style={{ width: '45%' }}></div>
                <div className="skeleton-bar" style={{ width: '20%' }}></div>
              </div>
              <div className="skeleton-row">
                <div className="skeleton-bar" style={{ width: '10%' }}></div>
                <div className="skeleton-bar" style={{ width: '15%' }}></div>
                <div className="skeleton-bar" style={{ width: '45%' }}></div>
                <div className="skeleton-bar" style={{ width: '20%' }}></div>
              </div>
            </div>
          )}

          {/* Populated Table */}
          {!isLoading && !fetchError && levels.length > 0 && (
            <div className="table-wrap" id="populatedLevelsTable">
              <table className="data-table" aria-label="Danh sách cấp độ">
                <thead>
                  <tr>
                    <th scope="col" style={{ width: '100px' }}>Thứ tự</th>
                    <th scope="col" style={{ width: '130px' }}>Mã cấp độ</th>
                    <th scope="col">Tên / Nhãn hiển thị</th>
                    <th scope="col" style={{ width: '160px', textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {levels.map((lvl) => (
                    <tr key={lvl.id} id={`row-level-${lvl.id}`}>
                      <td>
                        <span className="level-badge" id={`level-position-${lvl.id}`}>
                          #{lvl.position}
                        </span>
                      </td>
                      <td className="col-code">{lvl.code}</td>
                      <td className="col-names">
                        <div className="name-vi">{getLevelDisplayName(lvl.label)}</div>
                        {lvl.label.en && lvl.label.vi && (
                          <div className="name-en">{lvl.label.en}</div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="col-actions" style={{ justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn-text-action btn-text-edit"
                            id={`btn-edit-level-${lvl.id}`}
                            onClick={(e) => handleOpenEdit(lvl, e)}
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            className="btn-text-action btn-text-delete"
                            id={`btn-delete-level-${lvl.id}`}
                            onClick={(e) => handleOpenDelete(lvl, e)}
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="table-summary-bar">
                <span className="table-summary">Tổng số: {levels.length} cấp độ</span>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !fetchError && levels.length === 0 && (
            <div className="empty-state-open" id="emptyLevelsState">
              <h3 className="empty-title">Chưa có cấp độ nào trong khung này</h3>
              <p className="empty-desc">
                Khung năng lực {framework.code} v{framework.version} hiện chưa có cấp độ nào. Nhấn &ldquo;Thêm cấp độ&rdquo; để tạo cấp độ đầu tiên (ví dụ A1, A2, B1,...).
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleOpenCreate}
                id="btnEmptyCreateLevel"
              >
                Thêm cấp độ
              </button>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <LevelFormModal
        isOpen={isFormModalOpen}
        mode={formMode}
        frameworkId={framework.id}
        initialData={formInitialData}
        defaultPosition={formMode === 'create' ? nextPosition : undefined}
        triggerElement={triggerRef.current}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={handleFormSuccess}
        onForbidden={(msg) => setForbiddenBanner(msg || 'Bạn không có quyền thực hiện thao tác này.')}
        onSessionExpired={() => {
          setIsFormModalOpen(false);
          setIsSessionLostOpen(true);
        }}
      />

      <LevelDeleteModal
        isOpen={isDeleteModalOpen}
        frameworkId={framework.id}
        targetLevel={targetLevel}
        triggerElement={triggerRef.current}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={handleDeleteSuccess}
        onForbidden={(msg) => setForbiddenBanner(msg || 'Bạn không có quyền thực hiện thao tác này.')}
        onSessionExpired={() => {
          setIsDeleteModalOpen(false);
          setIsSessionLostOpen(true);
        }}
      />

      <SessionLostModal
        isOpen={isSessionLostOpen}
        hasSavedDraft={false}
      />
    </div>
  );
}
