'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { LanguageDto } from '@/server/languages';
import { LanguageFormModal } from './LanguageFormModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { DeleteBlockedModal } from './DeleteBlockedModal';
import { SessionLostModal } from './SessionLostModal';
import {
  loadDraft,
  removeDraft,
  clearAllDrafts,
  enforceIdentityAndPrune,
  type LanguageDraftData,
} from './draftStorage';

export interface LanguagesCatalogProps {
  initialLanguages?: LanguageDto[];
  initialError?: string | null;
  isLoading?: boolean;
  account: {
    id: string;
    role: string;
    status: string;
    displayName: string | null;
  };
}

export function LanguagesCatalog({
  initialLanguages,
  initialError,
  isLoading: propIsLoading,
  account,
}: LanguagesCatalogProps) {
  const [languages, setLanguages] = useState<LanguageDto[]>(initialLanguages || []);
  const [isLoading, setIsLoading] = useState(
    propIsLoading !== undefined ? propIsLoading : (!initialLanguages && !initialError)
  );
  const [fetchError, setFetchError] = useState<string | null>(initialError || null);
  const [forbiddenBanner, setForbiddenBanner] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [mutationStatus, setMutationStatus] = useState<string | null>(null);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formInitialData, setFormInitialData] = useState<LanguageDto | null>(null);
  const [formInitialDraft, setFormInitialDraft] = useState<LanguageDraftData | null>(null);

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleteBlockedOpen, setIsDeleteBlockedOpen] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState<LanguageDto | null>(null);

  const [isSessionLostOpen, setIsSessionLostOpen] = useState(false);
  const [hasSavedDraftOnExpiry, setHasSavedDraftOnExpiry] = useState(false);

  // Active trigger element for focus restoration
  const triggerRef = useRef<HTMLElement | null>(null);
  const openCreateBtnRef = useRef<HTMLButtonElement>(null);

  // Draft recovery prompt state
  const [pendingDraft, setPendingDraft] = useState<LanguageDraftData | null>(null);

  // Check for saved draft on mount and clean up expired / other account drafts
  useEffect(() => {
    enforceIdentityAndPrune(account.id);
    const draft = loadDraft(account.id);
    if (draft) {
      setPendingDraft(draft);
    } else {
      setPendingDraft(null);
    }
  }, [account.id]);

  // Inert background toggle: sets inert on #appContainer when any modal is open
  const anyModalOpen = isFormModalOpen || isDeleteConfirmOpen || isDeleteBlockedOpen || isSessionLostOpen;
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

  // Fetch languages catalogue
  const fetchLanguages = async () => {
    setIsLoading(true);
    setFetchError(null);
    setForbiddenBanner(null);
    clearMutationStatus();

    try {
      const res = await fetch('/api/languages', {
        headers: {
          'Origin': window.location.origin,
        },
      });

      if (res.status === 401) {
        setIsLoading(false);
        setHasSavedDraftOnExpiry(false);
        setIsSessionLostOpen(true);
        return;
      }

      if (res.status === 403) {
        setIsLoading(false);
        const json = await res.json().catch(() => null);
        setForbiddenBanner(json?.error?.message || 'Bạn không có quyền truy cập danh mục ngôn ngữ.');
        return;
      }

      if (res.status === 503) {
        setIsLoading(false);
        const json = await res.json().catch(() => null);
        setFetchError(json?.error?.message || 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.');
        return;
      }

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setIsLoading(false);
        setFetchError(json?.error?.message || 'Không thể tải danh mục ngôn ngữ.');
        return;
      }

      const json = await res.json();
      setLanguages(json.data || []);
      setIsLoading(false);
    } catch {
      setIsLoading(false);
      setFetchError('Lỗi kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.');
    }
  };

  useEffect(() => {
    if (propIsLoading === undefined && !initialLanguages && !initialError) {
      fetchLanguages();
    }
  }, [initialLanguages, initialError, propIsLoading]);

  const clearMutationStatus = () => {
    setMutationStatus(null);
  };

  const showMutationStatus = (msg: string) => {
    setMutationStatus(msg);
  };

  // Filtered languages
  const filteredLanguages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return languages;
    return languages.filter((l) => {
      const codeMatch = l.code.toLowerCase().includes(q);
      const viMatch = (l.names.vi || '').toLowerCase().includes(q);
      const enMatch = (l.names.en || '').toLowerCase().includes(q);
      return codeMatch || viMatch || enMatch;
    });
  }, [languages, searchQuery]);

  // Handlers for Opening Modals
  const handleOpenCreate = (e?: React.MouseEvent) => {
    clearMutationStatus();
    triggerRef.current = (e?.currentTarget as HTMLElement) || openCreateBtnRef.current;
    setFormMode('create');
    setFormInitialData(null);
    setFormInitialDraft(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (lang: LanguageDto, e: React.MouseEvent) => {
    clearMutationStatus();
    triggerRef.current = e.currentTarget as HTMLElement;
    setFormMode('edit');
    setFormInitialData(lang);
    setFormInitialDraft(null);
    setIsFormModalOpen(true);
  };

  const handleOpenDelete = (lang: LanguageDto, e: React.MouseEvent) => {
    clearMutationStatus();
    triggerRef.current = e.currentTarget as HTMLElement;
    setTargetLanguage(lang);
    setIsDeleteConfirmOpen(true);
  };

  const handleDraftRecovery = () => {
    if (!pendingDraft) return;
    clearMutationStatus();
    setFormMode(pendingDraft.mode || 'create');
    setFormInitialDraft(pendingDraft);
    if (pendingDraft.mode === 'edit') {
      setFormInitialData({
        id: pendingDraft.id || '',
        code: pendingDraft.code || '',
        names: { vi: pendingDraft.vi || '', ...(pendingDraft.en ? { en: pendingDraft.en } : {}) },
        isLearnable: Boolean(pendingDraft.isLearnable),
        isUiLocale: Boolean(pendingDraft.isUiLocale),
      });
    } else {
      setFormInitialData(null);
    }
    setPendingDraft(null);
    setIsFormModalOpen(true);
  };

  const handleDraftDiscard = () => {
    removeDraft(account.id);
    setPendingDraft(null);
  };

  const handleForbidden = (msg?: string) => {
    setIsFormModalOpen(false);
    setIsDeleteConfirmOpen(false);
    setForbiddenBanner(msg || 'Bạn không có quyền thực hiện thao tác quản trị này.');
  };

  const handleSessionExpired = (savedSuccess = false) => {
    setIsFormModalOpen(false);
    setIsDeleteConfirmOpen(false);
    setHasSavedDraftOnExpiry(savedSuccess);
    setIsSessionLostOpen(true);
  };

  const handleLogout = async () => {
    try {
      removeDraft(account.id);
      clearAllDrafts();
    } catch {}
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Origin': window.location.origin },
      });
    } catch {}
    window.location.href = '/login';
  };

  // Mutation Callbacks
  const handleFormSuccess = (saved: LanguageDto, mode: 'create' | 'edit') => {
    setIsFormModalOpen(false);

    if (mode === 'create') {
      setLanguages((prev) => {
        const next = [...prev, saved];
        return next.sort((a, b) => a.code.localeCompare(b.code));
      });
      showMutationStatus('Đã thêm ngôn ngữ');
      setTimeout(() => openCreateBtnRef.current?.focus(), 50);
    } else {
      setLanguages((prev) =>
        prev.map((l) => (l.id === saved.id ? saved : l))
      );
      showMutationStatus('Đã cập nhật ngôn ngữ');
      setTimeout(() => {
        const btn = document.getElementById(`btn-edit-${saved.code}`);
        if (btn) {
          btn.focus();
        } else {
          openCreateBtnRef.current?.focus();
        }
      }, 50);
    }
  };

  const handleDeleteSuccess = (deletedId: string) => {
    setIsDeleteConfirmOpen(false);

    const prevIndex = languages.findIndex((l) => l.id === deletedId);
    const nextList = languages.filter((l) => l.id !== deletedId);
    setLanguages(nextList);
    showMutationStatus('Đã xóa ngôn ngữ');

    // Focus restoration per baseline §5.2
    setTimeout(() => {
      if (nextList.length === 0) {
        const emptyBtn = document.getElementById('emptyCreateBtn') || openCreateBtnRef.current;
        emptyBtn?.focus();
      } else {
        const targetIndex = prevIndex < nextList.length ? prevIndex : nextList.length - 1;
        const targetCode = nextList[targetIndex].code;
        const btn =
          document.getElementById(`btn-delete-${targetCode}`) ||
          document.getElementById(`btn-edit-${targetCode}`);
        if (btn) {
          btn.focus();
        } else {
          openCreateBtnRef.current?.focus();
        }
      }
    }, 50);
  };

  const handleDeleteBlocked = (lang: LanguageDto) => {
    setIsDeleteConfirmOpen(false);
    setTargetLanguage(lang);
    setIsDeleteBlockedOpen(true);
  };

  return (
    <>
      <main className="page-content">
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
              style={{ height: '36px', padding: '0 12px' }}
              onClick={handleLogout}
            >
              Đăng xuất
            </button>
          </div>
        )}

        {/* Draft Recovery Prompt Banner */}
        {pendingDraft && (
          <div
            id="draftRecoveryBanner"
            style={{
              padding: '14px 18px',
              backgroundColor: '#EBF3EE',
              border: '1px solid #CBD5CE',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            <div style={{ fontSize: 'var(--font-size-sub)', color: 'var(--text-main)' }}>
              Bạn có dữ liệu Bản nháp chưa lưu cho ngôn ngữ{' '}
              <strong>{pendingDraft.vi || pendingDraft.code || 'đang nhập'}</strong> từ phiên làm việc trước.
            </div>
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <button
                type="button"
                id="draftDiscardBtn"
                className="btn btn-secondary"
                style={{ height: '36px', padding: '0 12px' }}
                onClick={handleDraftDiscard}
              >
                Bỏ qua
              </button>
              <button
                type="button"
                id="draftRecoverBtn"
                className="btn btn-primary"
                style={{ height: '36px', padding: '0 12px' }}
                onClick={handleDraftRecovery}
              >
                Khôi phục
              </button>
            </div>
          </div>
        )}

        <div className="page-header">
          <div>
            <h1 className="page-title">Quản lý ngôn ngữ</h1>
            <p className="page-description">
              Khai báo mã ngôn ngữ, cấu hình học tập và hỗ trợ bản địa hóa giao diện.
            </p>
          </div>
          <button
            type="button"
            id="openCreateBtn"
            ref={openCreateBtnRef}
            className="btn btn-primary"
            onClick={handleOpenCreate}
          >
            + Thêm ngôn ngữ
          </button>
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <div className="search-input-wrapper">
            <svg className="search-icon" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              id="searchLanguageInput"
              className="search-input"
              placeholder="Tìm kiếm ngôn ngữ..."
              aria-label="Tìm kiếm ngôn ngữ"
              value={searchQuery}
              onChange={(e) => {
                clearMutationStatus();
                setSearchQuery(e.target.value);
              }}
              onFocus={clearMutationStatus}
            />
          </div>
        </div>

        {/* Table Wrap */}
        <div className="table-wrap">
          {isLoading ? (
            <div id="loadingTableView" style={{ paddingTop: '8px' }}>
              <div className="skeleton-row">
                <div className="skeleton-bar" style={{ width: '40px' }}></div>
                <div className="skeleton-bar" style={{ width: '180px' }}></div>
                <div className="skeleton-bar" style={{ width: '100px' }}></div>
                <div className="skeleton-bar" style={{ width: '100px' }}></div>
              </div>
              <div className="skeleton-row">
                <div className="skeleton-bar" style={{ width: '40px' }}></div>
                <div className="skeleton-bar" style={{ width: '160px' }}></div>
                <div className="skeleton-bar" style={{ width: '100px' }}></div>
                <div className="skeleton-bar" style={{ width: '100px' }}></div>
              </div>
              <div className="skeleton-row">
                <div className="skeleton-bar" style={{ width: '40px' }}></div>
                <div className="skeleton-bar" style={{ width: '170px' }}></div>
                <div className="skeleton-bar" style={{ width: '100px' }}></div>
                <div className="skeleton-bar" style={{ width: '100px' }}></div>
              </div>
            </div>
          ) : fetchError ? (
            <div id="fetchErrorTableView" className="empty-state-open">
              <h2 className="empty-title" style={{ color: 'var(--danger-red)' }}>
                Lỗi kết nối máy chủ
              </h2>
              <p className="empty-desc">{fetchError}</p>
              <button
                type="button"
                id="fetchRetryBtn"
                className="btn btn-secondary"
                onClick={fetchLanguages}
              >
                Thử tải lại
              </button>
            </div>
          ) : (
            <>
              {languages.length === 0 ? (
                <div id="emptyTableView" className="empty-state-open">
                  <h2 className="empty-title">Chưa có ngôn ngữ nào</h2>
                  <p className="empty-desc">
                    Bắt đầu bằng cách thêm ngôn ngữ đầu tiên vào danh mục quản trị.
                  </p>
                  <button
                    type="button"
                    id="emptyCreateBtn"
                    className="btn btn-primary"
                    onClick={handleOpenCreate}
                  >
                    + Thêm ngôn ngữ
                  </button>
                </div>
              ) : filteredLanguages.length === 0 ? (
                <div style={{ padding: '36px 0', color: 'var(--text-muted)' }}>
                  Không tìm thấy ngôn ngữ phù hợp với từ khóa &ldquo;{searchQuery}&rdquo;.
                </div>
              ) : (
                <table id="populatedTable" className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>Mã</th>
                      <th style={{ minWidth: '240px' }}>Tên ngôn ngữ</th>
                      <th style={{ width: '160px' }}>Có thể học</th>
                      <th style={{ width: '160px' }}>Làm giao diện</th>
                      <th style={{ width: '140px', textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLanguages.map((lang) => {
                      const viName = lang.names.vi || lang.code;
                      const enName = lang.names.en;
                      return (
                        <tr key={lang.id} id={`row-${lang.code}`}>
                          <td className="col-code">{lang.code}</td>
                          <td>
                            <div className="col-names">
                              <span className="name-vi">{viName}</span>
                              {enName && <span className="name-en">{enName}</span>}
                            </div>
                          </td>
                          <td>
                            <span className={lang.isLearnable ? 'flag-yes' : 'flag-no'}>
                              {lang.isLearnable ? 'Học được' : '— Không'}
                            </span>
                          </td>
                          <td>
                            <span className={lang.isUiLocale ? 'flag-yes' : 'flag-no'}>
                              {lang.isUiLocale ? 'Hỗ trợ giao diện' : '— Không'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="col-actions" style={{ justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                className="btn-text-action btn-text-edit"
                                id={`btn-edit-${lang.code}`}
                                data-code={lang.code}
                                onClick={(e) => handleOpenEdit(lang, e)}
                              >
                                Sửa
                              </button>
                              <button
                                type="button"
                                className="btn-text-action btn-text-delete"
                                id={`btn-delete-${lang.code}`}
                                data-code={lang.code}
                                onClick={(e) => handleOpenDelete(lang, e)}
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
              )}

              {/* Table Summary & Inline Status Feedback — ALWAYS preserved across transitions */}
              <div className="table-summary-bar">
                <div id="tableSummary" className="table-summary">
                  {languages.length} ngôn ngữ trong danh mục
                </div>
                {mutationStatus && (
                  <div
                    id="tableMutationStatus"
                    className="table-mutation-status"
                    role="status"
                    aria-live="polite"
                  >
                    {mutationStatus}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Modals rendered via portal outside inert appContainer */}
      <LanguageFormModal
        isOpen={isFormModalOpen}
        mode={formMode}
        initialData={formInitialData}
        initialDraft={formInitialDraft}
        accountId={account.id}
        triggerElement={triggerRef.current}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={handleFormSuccess}
        onForbidden={handleForbidden}
        onSessionExpired={handleSessionExpired}
      />

      <DeleteConfirmModal
        isOpen={isDeleteConfirmOpen}
        targetLanguage={targetLanguage}
        triggerElement={triggerRef.current}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onSuccess={handleDeleteSuccess}
        onBlocked={handleDeleteBlocked}
        onForbidden={handleForbidden}
        onSessionExpired={() => handleSessionExpired(false)}
      />

      <DeleteBlockedModal
        isOpen={isDeleteBlockedOpen}
        blockedLanguage={targetLanguage}
        triggerElement={triggerRef.current}
        onClose={() => setIsDeleteBlockedOpen(false)}
      />

      <SessionLostModal
        isOpen={isSessionLostOpen}
        hasSavedDraft={hasSavedDraftOnExpiry}
      />
    </>
  );
}
