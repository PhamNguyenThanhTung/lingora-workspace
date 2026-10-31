'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { TeacherDto } from '@/server/teachers';
import { TeacherCreateModal } from './TeacherCreateModal';
import { TeacherStatusModal } from './TeacherStatusModal';
import { SessionLostModal } from './SessionLostModal';
import { clearAllDrafts, removeDraft } from './draftStorage';

export interface TeachersCatalogProps {
  initialTeachers?: TeacherDto[];
  initialError?: string | null;
  account: {
    id: string;
    role: string;
    status: string;
    displayName: string | null;
  };
}

export function TeachersCatalog({
  initialTeachers,
  initialError,
  account,
}: TeachersCatalogProps) {
  const [teachers, setTeachers] = useState<TeacherDto[]>(initialTeachers || []);
  const [fetchError, setFetchError] = useState<string | null>(initialError || null);
  const [forbiddenBanner, setForbiddenBanner] = useState<string | null>(null);
  const [mutationStatus, setMutationStatus] = useState<string | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusTargetTeacher, setStatusTargetTeacher] = useState<TeacherDto | null>(null);
  const [statusAction, setStatusAction] = useState<'enable' | 'disable'>('disable');
  const [isSessionLostOpen, setIsSessionLostOpen] = useState(false);

  const openCreateBtnRef = useRef<HTMLButtonElement>(null);
  const lastActionBtnRef = useRef<HTMLButtonElement | null>(null);

  // Inert background toggle
  const anyModalOpen = isCreateModalOpen || isStatusModalOpen || isSessionLostOpen;
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

  const handleOpenCreateModal = () => {
    setMutationStatus(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenStatusModal = (
    teacher: TeacherDto,
    action: 'enable' | 'disable',
    btnEl: HTMLButtonElement | null
  ) => {
    setMutationStatus(null);
    setStatusTargetTeacher(teacher);
    setStatusAction(action);
    lastActionBtnRef.current = btnEl;
    setIsStatusModalOpen(true);
  };

  const handleCreateSuccess = (newTeacher: TeacherDto, message?: string) => {
    setTeachers((prev) => [newTeacher, ...prev]);
    setMutationStatus(message || `Đã gửi lời mời kích hoạt tới ${newTeacher.email}.`);
    openCreateBtnRef.current?.focus();
  };

  const handleStatusSuccess = (updatedTeacher: TeacherDto) => {
    setTeachers((prev) =>
      prev.map((t) => (t.id === updatedTeacher.id ? updatedTeacher : t))
    );
    const actionText = updatedTeacher.status === 'ACTIVE' ? 'kích hoạt lại' : 'vô hiệu hóa';
    setMutationStatus(`Đã ${actionText} tài khoản giáo viên thành công.`);
    lastActionBtnRef.current?.focus();
  };

  const handleSessionLost = () => {
    setIsSessionLostOpen(true);
  };

  const handleForbidden = (msg?: string) => {
    setForbiddenBanner(
      msg || 'Bạn không có quyền thực hiện thao tác quản trị trên danh sách giáo viên.'
    );
  };

  const handleLogoutOnForbidden = async () => {
    try {
      if (account?.id) {
        removeDraft(account.id);
      }
      clearAllDrafts();
    } catch {
      // Safe isolation
    }

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Origin': window.location.origin },
      });
    } catch {
      // Safe fallback
    } finally {
      window.location.href = '/login';
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="page-content" id="teachersCatalogue">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Quản lý giáo viên
          </h1>
          <p className="page-description">
            Quản trị danh sách tài khoản giảng dạy, gửi thư mời kích hoạt và quản lý trạng thái.
          </p>
        </div>

        {!forbiddenBanner && (
          <button
            ref={openCreateBtnRef}
            type="button"
            className="btn btn-primary"
            id="btnOpenCreateTeacher"
            onClick={handleOpenCreateModal}
          >
            + Thêm giáo viên
          </button>
        )}
      </div>

      {forbiddenBanner && (
        <div
          className="alert alert-danger"
          id="teachersForbiddenBanner"
          role="alert"
          style={{
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FCA5A5',
            color: '#991B1B',
          }}
        >
          <div>
            <strong>Truy cập bị từ chối:</strong> {forbiddenBanner}
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            id="btnForbiddenLogout"
            onClick={handleLogoutOnForbidden}
          >
            Đăng xuất
          </button>
        </div>
      )}

      {mutationStatus && (
        <div
          className="alert alert-success"
          id="teacherMutationStatus"
          role="status"
          style={{
            marginBottom: '20px',
            padding: '12px 16px',
            borderRadius: '6px',
            backgroundColor: '#ECFDF5',
            border: '1px solid #6EE7B7',
            color: '#065F46',
          }}
        >
          {mutationStatus}
        </div>
      )}

      {fetchError ? (
        <div className="alert alert-danger" role="alert">
          {fetchError}
        </div>
      ) : teachers.length === 0 ? (
        <div
          className="empty-state"
          id="teachersEmptyState"
          style={{
            textAlign: 'center',
            padding: '48px 16px',
            backgroundColor: 'var(--card-bg, #fff)',
            borderRadius: '8px',
            border: '1px solid var(--border-color, #e5e7eb)',
          }}
        >
          <p style={{ fontSize: '16px', color: 'var(--text-muted, #666)', marginBottom: '16px' }}>
            Chưa có giáo viên nào trong hệ thống.
          </p>
          {!forbiddenBanner && (
            <button
              type="button"
              className="btn btn-primary"
              id="btnEmptyCreateTeacher"
              onClick={handleOpenCreateModal}
            >
              Thêm giáo viên đầu tiên
            </button>
          )}
        </div>
      ) : (
        <div
          className="table-wrap"
          style={{ overflowX: 'auto' }}
        >
          <table
            className="data-table"
            id="teachersTable"
            style={{ minWidth: '800px' }}
          >
            <thead>
              <tr>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Họ và tên</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Email</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Vai trò</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Trạng thái</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Ngày tạo (UTC+7)</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => {
                const isPending = teacher.status === 'PENDING';
                const isActive = teacher.status === 'ACTIVE';
                const isDisabled = teacher.status === 'DISABLED';
                const isOrphan = !teacher.email;

                return (
                  <tr
                    key={teacher.id}
                    id={`teacher-row-${teacher.id}`}
                    style={{ borderBottom: '1px solid var(--border-color, #e5e7eb)' }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <span className="teacher-name" style={{ fontWeight: 500 }}>
                        {teacher.displayName || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {teacher.email ? (
                        <span className="teacher-email">{teacher.email}</span>
                      ) : (
                        <span
                          className="teacher-email-orphan"
                          style={{ color: 'var(--danger-red, #dc2626)', fontStyle: 'italic', fontSize: '13px' }}
                          title="Tài khoản không có định danh xác thực trong Auth"
                        >
                          (Chưa có danh tính xác thực)
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ whiteSpace: 'nowrap' }}>Giáo viên</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {isPending && (
                        <span
                          className="status-badge status-pending"
                          id={`badge-status-${teacher.id}`}
                          style={{
                            display: 'inline-block',
                            whiteSpace: 'nowrap',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 500,
                            backgroundColor: '#FEF3C7',
                            color: '#92400E',
                          }}
                          title="Chờ giáo viên kích hoạt qua thư mời"
                        >
                          Chờ kích hoạt
                        </span>
                      )}
                      {isActive && (
                        <span
                          className="status-badge status-active"
                          id={`badge-status-${teacher.id}`}
                          style={{
                            display: 'inline-block',
                            whiteSpace: 'nowrap',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 500,
                            backgroundColor: '#D1FAE5',
                            color: '#065F46',
                          }}
                        >
                          Đang hoạt động
                        </span>
                      )}
                      {isDisabled && (
                        <span
                          className="status-badge status-disabled"
                          id={`badge-status-${teacher.id}`}
                          style={{
                            display: 'inline-block',
                            whiteSpace: 'nowrap',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 500,
                            backgroundColor: '#F3F4F6',
                            color: '#4B5563',
                          }}
                        >
                          Vô hiệu hóa
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted, #666)' }}>
                      {formatDate(teacher.createdAt)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      {!forbiddenBanner && (
                        <>
                          {isPending && (
                            <span
                              style={{ fontSize: '13px', color: 'var(--text-muted, #9ca3af)', fontStyle: 'italic' }}
                            >
                              Đang chờ kích hoạt
                            </span>
                          )}
                          {isActive && (
                            <button
                              type="button"
                              className="btn-text-action btn-text-delete"
                              id={`btn-disable-${teacher.id}`}
                              disabled={isOrphan}
                              title={isOrphan ? 'Không thể thao tác trên tài khoản thiếu định danh Auth' : 'Vô hiệu hóa tài khoản giáo viên'}
                              onClick={(e) =>
                                handleOpenStatusModal(teacher, 'disable', e.currentTarget)
                              }
                            >
                              Vô hiệu hóa
                            </button>
                          )}
                          {isDisabled && (
                            <button
                              type="button"
                              className="btn-text-action btn-text-edit"
                              id={`btn-enable-${teacher.id}`}
                              disabled={isOrphan}
                              title={isOrphan ? 'Không thể thao tác trên tài khoản thiếu định danh Auth' : 'Kích hoạt lại tài khoản giáo viên'}
                              onClick={(e) =>
                                handleOpenStatusModal(teacher, 'enable', e.currentTarget)
                              }
                            >
                              Kích hoạt lại
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {isCreateModalOpen && (
        <TeacherCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setTimeout(() => {
              if (!document.getElementById('appContainer')?.hasAttribute('inert'))
                (document.getElementById('btnForbiddenLogout') || openCreateBtnRef.current)?.focus();
            }, 0);
          }}
          onSuccess={handleCreateSuccess}
          onSessionLost={handleSessionLost}
          onForbidden={handleForbidden}
        />
      )}

      {isStatusModalOpen && (
        <TeacherStatusModal
          isOpen={isStatusModalOpen}
          teacher={statusTargetTeacher}
          action={statusAction}
          onClose={() => {
            setIsStatusModalOpen(false);
            setTimeout(() => {
              if (!document.getElementById('appContainer')?.hasAttribute('inert'))
                (document.getElementById('btnForbiddenLogout') ||
                  document.getElementById(`btn-enable-${statusTargetTeacher?.id}`) ||
                  document.getElementById(`btn-disable-${statusTargetTeacher?.id}`) || openCreateBtnRef.current)?.focus();
            }, 0);
          }}
          onSuccess={handleStatusSuccess}
          onSessionLost={handleSessionLost}
          onForbidden={handleForbidden}
        />
      )}

      {isSessionLostOpen && (
        <SessionLostModal
          isOpen={isSessionLostOpen}
          hasSavedDraft={false}
        />
      )}
    </div>
  );
}
