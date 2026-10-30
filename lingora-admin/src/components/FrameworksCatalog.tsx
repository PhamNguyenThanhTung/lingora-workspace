'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { FrameworkDto } from '@/server/frameworks';
import { FrameworkFormModal } from './FrameworkFormModal';
import { FrameworkDeleteModal } from './FrameworkDeleteModal';
import { SessionLostModal } from './SessionLostModal';
import { removeDraft, clearAllDrafts } from './draftStorage';

export interface FrameworksCatalogProps {
  initialFrameworks?: FrameworkDto[];
  initialError?: string | null;
  isLoading?: boolean;
  account: {
    id: string;
    role: string;
    status: string;
    displayName: string | null;
  };
}

export function FrameworksCatalog({
  initialFrameworks,
  initialError,
  isLoading: propIsLoading,
  account,
}: FrameworksCatalogProps) {
  const [frameworks, setFrameworks] = useState<FrameworkDto[]>(initialFrameworks || []);
  const [isLoading, setIsLoading] = useState(
    propIsLoading !== undefined ? propIsLoading : (!initialFrameworks && !initialError)
  );
  const [fetchError, setFetchError] = useState<string | null>(initialError || null);
  const [forbiddenBanner, setForbiddenBanner] = useState<string | null>(null);
  const [mutationStatus, setMutationStatus] = useState<string | null>(null);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formInitialData, setFormInitialData] = useState<FrameworkDto | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [targetFramework, setTargetFramework] = useState<FrameworkDto | null>(null);

  const [isSessionLostOpen, setIsSessionLostOpen] = useState(false);

  // Active trigger element for focus restoration
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

  const fetchFrameworks = async () => {
    setIsLoading(true);
    setFetchError(null);
    setForbiddenBanner(null);
    setMutationStatus(null);

    try {
      const res = await fetch('/api/frameworks', {
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
        setForbiddenBanner('Tài khoản của bạn không có quyền xem danh mục khung năng lực.');
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setFetchError(err?.error?.message || 'Không thể tải danh mục khung năng lực.');
        setIsLoading(false);
        return;
      }

      const json = await res.json();
      setFrameworks(json.data || []);
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

  const handleOpenEdit = (fw: FrameworkDto, e: React.MouseEvent<HTMLButtonElement>) => {
    clearMutationStatus();
    triggerRef.current = e.currentTarget;
    setFormMode('edit');
    setFormInitialData(fw);
    setIsFormModalOpen(true);
  };

  const handleOpenDelete = (fw: FrameworkDto, e: React.MouseEvent<HTMLButtonElement>) => {
    clearMutationStatus();
    triggerRef.current = e.currentTarget;
    setTargetFramework(fw);
    setIsDeleteModalOpen(true);
  };

  const handleFormSuccess = (saved: FrameworkDto, mode: 'create' | 'edit') => {
    if (mode === 'create') {
      setFrameworks((prev) => [saved, ...prev.filter((f) => f.id !== saved.id)]);
      setMutationStatus(`Đã thêm khung năng lực ${saved.code} (${saved.version}) thành công.`);
    } else {
      setFrameworks((prev) => prev.map((f) => (f.id === saved.id ? saved : f)));
      setMutationStatus(`Đã cập nhật khung năng lực ${saved.code} (${saved.version}) thành công.`);
    }
  };

  const handleDeleteSuccess = (deletedId: string) => {
    const prevIndex = frameworks.findIndex((f) => f.id === deletedId);
    const deleted = frameworks.find((f) => f.id === deletedId);
    const nextList = frameworks.filter((f) => f.id !== deletedId);
    setFrameworks(nextList);
    setMutationStatus(
      deleted
        ? `Đã xóa khung năng lực ${deleted.code} (${deleted.version}) thành công.`
        : 'Đã xóa khung năng lực thành công.'
    );

    setTimeout(() => {
      if (nextList.length === 0) {
        const emptyBtn = document.getElementById('btnEmptyCreateFramework') || openCreateBtnRef.current;
        emptyBtn?.focus();
      } else {
        const targetIndex = prevIndex < nextList.length ? prevIndex : nextList.length - 1;
        const targetId = nextList[targetIndex].id;
        const btn =
          document.getElementById(`btn-delete-framework-${targetId}`) ||
          document.getElementById(`btn-edit-framework-${targetId}`) ||
          document.getElementById(`btn-view-levels-${targetId}`);
        if (btn) {
          btn.focus();
        } else {
          openCreateBtnRef.current?.focus();
        }
      }
    }, 50);
  };

  const getDisplayName = (names: Record<string, string>) => {
    return names.vi || names.en || 'Chưa đặt tên';
  };

  return (
    <div className="page-content" id="frameworksCatalogue">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý khung năng lực</h1>
          <p className="page-description">
            Thiết lập danh mục khung năng lực giảng dạy, tiêu chuẩn đánh giá và cấp độ trực thuộc.
          </p>
        </div>

        {!forbiddenBanner && (
          <button
            type="button"
            id="btnOpenCreateFramework"
            ref={openCreateBtnRef}
            className="btn btn-primary"
            onClick={handleOpenCreate}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Thêm khung năng lực</span>
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
              id="frameworkMutationStatus"
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
                id="btnRetryFetchFrameworks"
                onClick={fetchFrameworks}
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Loading Skeleton */}
          {isLoading && !fetchError && (
            <div id="frameworksLoadingSkeleton" className="table-wrap">
              <div className="skeleton-row">
                <div className="skeleton-bar" style={{ width: '12%' }}></div>
                <div className="skeleton-bar" style={{ width: '10%' }}></div>
                <div className="skeleton-bar" style={{ width: '40%' }}></div>
                <div className="skeleton-bar" style={{ width: '15%' }}></div>
                <div className="skeleton-bar" style={{ width: '15%' }}></div>
              </div>
              <div className="skeleton-row">
                <div className="skeleton-bar" style={{ width: '14%' }}></div>
                <div className="skeleton-bar" style={{ width: '8%' }}></div>
                <div className="skeleton-bar" style={{ width: '38%' }}></div>
                <div className="skeleton-bar" style={{ width: '15%' }}></div>
                <div className="skeleton-bar" style={{ width: '15%' }}></div>
              </div>
              <div className="skeleton-row">
                <div className="skeleton-bar" style={{ width: '10%' }}></div>
                <div className="skeleton-bar" style={{ width: '12%' }}></div>
                <div className="skeleton-bar" style={{ width: '42%' }}></div>
                <div className="skeleton-bar" style={{ width: '15%' }}></div>
                <div className="skeleton-bar" style={{ width: '15%' }}></div>
              </div>
            </div>
          )}

          {/* Populated Table */}
          {!isLoading && !fetchError && frameworks.length > 0 && (
            <div className="table-wrap" id="populatedFrameworksTable">
              <table className="data-table" aria-label="Danh mục khung năng lực">
                <thead>
                  <tr>
                    <th scope="col" style={{ width: '120px' }}>Mã khung</th>
                    <th scope="col" style={{ width: '110px' }}>Phiên bản</th>
                    <th scope="col">Tên hiển thị</th>
                    <th scope="col" style={{ width: '130px' }}>Số cấp độ</th>
                    <th scope="col" style={{ width: '220px', textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {frameworks.map((fw) => (
                    <tr key={fw.id} id={`row-framework-${fw.id}`}>
                      <td className="col-code">{fw.code}</td>
                      <td>{fw.version}</td>
                      <td className="col-names">
                        <div className="name-vi">{getDisplayName(fw.names)}</div>
                        {fw.names.en && fw.names.vi && (
                          <div className="name-en">{fw.names.en}</div>
                        )}
                      </td>
                      <td>
                        <span className="level-badge" id={`level-count-${fw.id}`}>
                          {fw.levelCount} cấp độ
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="col-actions" style={{ justifyContent: 'flex-end' }}>
                          <a
                            href={`/frameworks/${fw.id}`}
                            className="btn-text-action btn-text-levels"
                            id={`btn-view-levels-${fw.id}`}
                          >
                            Xem cấp độ
                          </a>
                          <button
                            type="button"
                            className="btn-text-action btn-text-edit"
                            id={`btn-edit-framework-${fw.id}`}
                            onClick={(e) => handleOpenEdit(fw, e)}
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            className="btn-text-action btn-text-delete"
                            id={`btn-delete-framework-${fw.id}`}
                            onClick={(e) => handleOpenDelete(fw, e)}
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
                <span className="table-summary">Tổng số: {frameworks.length} khung năng lực</span>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !fetchError && frameworks.length === 0 && (
            <div className="empty-state-open" id="emptyFrameworksState">
              <h3 className="empty-title">Chưa có khung năng lực nào</h3>
              <p className="empty-desc">
                Bắt đầu cấu hình bằng cách thêm khung năng lực đầu tiên (ví dụ CEFR, ACTFL, HSK). Mỗi khung năng lực có thể chứa các cấp độ độc lập.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleOpenCreate}
                id="btnEmptyCreateFramework"
              >
                Thêm khung năng lực
              </button>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <FrameworkFormModal
        isOpen={isFormModalOpen}
        mode={formMode}
        initialData={formInitialData}
        triggerElement={triggerRef.current}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={handleFormSuccess}
        onForbidden={(msg) => setForbiddenBanner(msg || 'Bạn không có quyền thực hiện thao tác này.')}
        onSessionExpired={() => {
          setIsFormModalOpen(false);
          setIsSessionLostOpen(true);
        }}
      />

      <FrameworkDeleteModal
        isOpen={isDeleteModalOpen}
        targetFramework={targetFramework}
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
