'use client';

import React, { useState, useRef, useEffect } from 'react';
import { SessionLostModal } from './SessionLostModal';
import { AccessDeniedView } from './AccessDeniedView';
import type { LessonDetailDto } from '@/server/lessons';

export interface LessonDraftEditorProps {
  initialLesson: LessonDetailDto;
  account: {
    id: string;
    role: string;
    status: string;
    displayName: string | null;
  };
}

export function LessonDraftEditor({
  initialLesson,
  account,
}: LessonDraftEditorProps) {
  const [lesson, setLesson] = useState<LessonDetailDto>(initialLesson);

  // Form input state initialized from currentDraft
  const initialTitle = initialLesson.currentDraft?.title || {};
  const [titleVi, setTitleVi] = useState(initialTitle.vi || '');
  const [titleEn, setTitleEn] = useState(initialTitle.en || '');

  const initialBlocks = initialLesson.currentDraft?.contentBlocks || [];
  const [paragraphs, setParagraphs] = useState<Array<{ type: 'paragraph'; text: string }>>(
    initialBlocks.map((b) => ({ type: 'paragraph', text: b.text }))
  );

  const [changeSummary, setChangeSummary] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

  const [generalError, setGeneralError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [isStaleConflict, setIsStaleConflict] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [sessionLost, setSessionLost] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  useEffect(() => {
    if (!sessionLost) return;
    const container = document.getElementById('appContainer');
    container?.setAttribute('inert', '');
    return () => container?.removeAttribute('inert');
  }, [sessionLost]);
  const isPendingRef = useRef(false);
  useEffect(() => {
    isPendingRef.current = isPending || isReloading;
  }, [isPending, isReloading]);

  const courseName = lesson.courseContext.names.vi || lesson.courseContext.names.en || 'Khóa học';
  const unitName = lesson.unitContext.names.vi || lesson.unitContext.names.en || lesson.unitContext.code;

  const handleAddParagraph = () => {
    if (paragraphs.length >= 50) return;
    setParagraphs((prev) => [...prev, { type: 'paragraph', text: '' }]);
  };

  const handleRemoveParagraph = (index: number) => {
    setParagraphs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleParagraphChange = (index: number, text: string) => {
    setParagraphs((prev) => {
      const next = [...prev];
      next[index] = { type: 'paragraph', text };
      return next;
    });
  };

  const authFailed = (res: Response) => {
    if (res.status === 401) { setSessionLost(true); return true; }
    if (res.status === 403) { setForbidden(true); return true; }
    return false;
  };

  const reconcile = (next: LessonDetailDto) => {
    if (!next || next.id !== lesson.id || !Array.isArray(next.revisions)) throw new Error('Invalid lesson response');
    setLesson(next);
    setTitleVi(next.currentDraft?.title.vi || '');
    setTitleEn(next.currentDraft?.title.en || '');
    setParagraphs(next.currentDraft?.contentBlocks.map(block => ({ ...block })) || []);
    setChangeSummary('');
  };

  const handleReloadLatestToken = async () => {
    if (isPendingRef.current) return;
    isPendingRef.current = true;
    setIsReloading(true);
    setGeneralError(null);

    try {
      const res = await fetch(`/api/teacher/lessons/${lesson.id}`, {
        method: 'GET',
        headers: { Origin: window.location.origin },
      });

      if (authFailed(res)) return;
      if (!res.ok) {
        setGeneralError('Không thể tải dữ liệu mới nhất. Vui lòng thử lại sau.');
        setIsReloading(false);
        return;
      }

      const data = await res.json();
      const updatedLesson: LessonDetailDto = data.data;

      reconcile(updatedLesson);
      setIsStaleConflict(false);
      setGeneralError(null);
      setIsReloading(false);
      setSuccessMessage('Đã tải nội dung mới nhất. Hãy kiểm tra và chỉnh sửa trước khi lưu.');
    } catch {
      setGeneralError('Lỗi kết nối khi đồng bộ phiên bản mới nhất.');
      setIsReloading(false);
    } finally {
      isPendingRef.current = false;
      setIsReloading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPendingRef.current || isStaleConflict || sessionLost || forbidden || !lesson.isEditable) return;

    setGeneralError(null);
    setTitleError(null);
    setSuccessMessage(null);
    setIsStaleConflict(false);

    const trimmedVi = titleVi.trim();
    const trimmedEn = titleEn.trim();

    if (!trimmedVi && !trimmedEn) {
      setTitleError('Ít nhất một ngôn ngữ (tiếng Việt hoặc tiếng Anh) phải có tiêu đề.');
      return;
    }

    setIsPending(true);
    isPendingRef.current = true;

    try {
      const payloadTitle = { vi: trimmedVi, en: trimmedEn };

      const payload = {
        title: payloadTitle,
        contentBlocks: paragraphs.map((p) => ({
          type: 'paragraph' as const,
          text: p.text,
        })),
        changeSummary: changeSummary.trim() || undefined,
        expectedRowVersion: lesson.rowVersion,
      };

      const res = await fetch(`/api/teacher/lessons/${lesson.id}/draft`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Origin: window.location.origin,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (authFailed(res)) { setIsPending(false); isPendingRef.current = false; return; }
      if (!res.ok) {
        setIsPending(false);
        isPendingRef.current = false;
        const errCode = data?.error?.code;
        const errMsg = data?.error?.message || 'Có lỗi xảy ra khi lưu bản nháp.';

        if (errCode === 'STALE_LESSON') {
          setIsStaleConflict(true);
          setGeneralError('Dữ liệu bài học đã bị thay đổi bởi phiên làm việc khác. Vui lòng tải lại phiên bản mới nhất trước khi lưu.');
        } else if (errCode === 'UNSUPPORTED_DRAFT_CONTENT') {
          setGeneralError(errMsg);
          setLesson(previous => ({ ...previous, isEditable: false, editabilityReason: errMsg }));
        } else if (errCode === 'DRAFT_NOT_EDITABLE') {
          setGeneralError(errMsg);
          setLesson(previous => ({ ...previous, isEditable: false, editabilityReason: errMsg }));
        } else {
          setGeneralError(errMsg);
        }
        return;
      }

      const updated: LessonDetailDto = data.data;
      reconcile(updated);
      setIsPending(false);
      isPendingRef.current = false;

      const newRevNo = updated.highestRevision?.revisionNo || 1;
      setSuccessMessage(`Đã lưu bản nháp thành công (Bản sửa đổi #${newRevNo}).`);
    } catch {
      setIsPending(false);
      isPendingRef.current = false;
      setGeneralError('Lỗi kết nối máy chủ khi lưu bản nháp. Vui lòng thử lại.');
    }
  };

  if (forbidden) return <AccessDeniedView accountId={account.id} message="Tài khoản không còn quyền truy cập bài học. Vui lòng đăng xuất." />;

  return (
    <div className="page-content" style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Return link */}
      <nav className="catalog-breadcrumbs" style={{ marginBottom: '16px' }}>
        <a href="/my-lessons" className="breadcrumb-link" id="btnBackToMyLessons" aria-disabled={isPending || isReloading} onClick={e => { if (isPendingRef.current) e.preventDefault(); }}>
          &larr; Quay lại danh sách bài học
        </a>
      </nav>

      {/* Header & context info */}
      <div
        className="editor-header"
        style={{
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '16px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
          <span className="badge" style={{ background: '#e0e7ff', color: '#3730a3', fontSize: '12px', padding: '2px 8px', borderRadius: '4px' }}>
            Khóa học: {courseName}
          </span>
          <span className="badge" style={{ background: '#f1f5f9', color: '#334155', fontSize: '12px', padding: '2px 8px', borderRadius: '4px' }}>
            Đơn vị: {lesson.unitContext.code}
          </span>
          <span className="badge" style={{ background: '#fef3c7', color: '#92400e', fontSize: '12px', padding: '2px 8px', borderRadius: '4px' }} id="badgeLessonToken">
            Phiên bản: #{lesson.rowVersion}
          </span>
        </div>

        <h1 className="page-title" id="draftEditorTitle" style={{ fontSize: '24px' }}>
          Soạn thảo nội dung — Bài học #{lesson.position}
        </h1>
        <p className="page-description" style={{ margin: 0 }}>
          {unitName}. Soạn các đoạn văn và lưu bản nháp kế thừa.
        </p>
      </div>

      {/* Read-only Alert when !isEditable */}
      {!lesson.isEditable && (
        <div
          className="form-error-banner"
          role="alert"
          id="readOnlyReasonBanner"
          style={{
            background: '#fffbeb',
            borderColor: '#f59e0b',
            color: '#b45309',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>
            Bản nháp ở chế độ chỉ đọc
          </div>
          <div>{lesson.editabilityReason || 'Bản nháp hiện tại không thể chỉnh sửa.'}</div>
        </div>
      )}

      {/* Success Banner */}
      {successMessage && (
        <div
          role="status"
          id="draftSaveSuccess"
          style={{
            background: '#f0fdf4',
            border: '1px solid #86efac',
            color: '#15803d',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px',
          }}
        >
          {successMessage}
        </div>
      )}

      {/* Error Banner with Stale Reload option */}
      {generalError && (
        <div
          className="form-error-banner"
          role="alert"
          id="draftSaveError"
          style={{
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            color: '#b91c1c',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px',
          }}
        >
          <div style={{ marginBottom: isStaleConflict ? '12px' : 0 }}>{generalError}</div>
          {isStaleConflict && (
            <button
              type="button"
              className="btn btn-secondary"
              id="btnReloadLessonToken"
              onClick={handleReloadLatestToken}
              disabled={isReloading || isPending}
              style={{ fontSize: '13px', padding: '6px 12px' }}
            >
              {isReloading ? 'Đang tải lại...' : 'Tải nội dung mới nhất (thay nội dung đang soạn)'}
            </button>
          )}
        </div>
      )}

      {/* Editor Form */}
      <form onSubmit={handleSubmit} id="lessonDraftForm">
        {/* Title Section */}
        <div
          className="form-section"
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px',
          }}
        >
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#0f172a' }}>
            1. Tiêu đề bài học
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label htmlFor="inputDraftTitleVi" className="form-label">
                Tiêu đề tiếng Việt
              </label>
              <input
                type="text"
                id="inputDraftTitleVi"
                className="form-input"
                value={titleVi}
                onChange={(e) => {
                  setTitleVi(e.target.value);
                  setTitleError(null);
                }}
                maxLength={300}
                placeholder="Nhập tiêu đề tiếng Việt..."
                disabled={isPending || isReloading || sessionLost || !lesson.isEditable}
              />
            </div>

            <div className="form-group">
              <label htmlFor="inputDraftTitleEn" className="form-label">
                Tiêu đề tiếng Anh
              </label>
              <input
                type="text"
                id="inputDraftTitleEn"
                className="form-input"
                value={titleEn}
                onChange={(e) => {
                  setTitleEn(e.target.value);
                  setTitleError(null);
                }}
                maxLength={300}
                placeholder="Nhập tiêu đề tiếng Anh..."
                disabled={isPending || isReloading || sessionLost || !lesson.isEditable}
              />
            </div>
          </div>

          {titleError && (
            <div
              className="field-error-message"
              role="alert"
              id="errorDraftTitle"
              style={{ marginTop: '8px' }}
            >
              {titleError}
            </div>
          )}
        </div>

        {/* Content Paragraphs Section */}
        <div
          className="form-section"
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: '#0f172a' }}>
                2. Nội dung bài học (Các đoạn văn)
              </h2>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                Tổng số: {paragraphs.length} / 50 đoạn văn
              </span>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              id="btnAddParagraph"
              onClick={handleAddParagraph}
              disabled={isPending || !lesson.isEditable || paragraphs.length >= 50}
              style={{ fontSize: '13px', padding: '6px 12px' }}
            >
              + Thêm đoạn văn
            </button>
          </div>

          {paragraphs.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '24px',
                background: '#f8fafc',
                borderRadius: '6px',
                color: '#64748b',
                fontStyle: 'italic',
                fontSize: '14px',
              }}
              id="emptyParagraphsNotice"
            >
              Chưa có đoạn văn nào. Bạn có thể nhấn &quot;Thêm đoạn văn&quot; hoặc lưu bản nháp chỉ có tiêu đề.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {paragraphs.map((p, idx) => (
                <div
                  key={idx}
                  id={`paragraphItem-${idx}`}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '12px 16px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px',
                    }}
                  >
                    <label
                      htmlFor={`inputParagraph-${idx}`}
                      style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}
                    >
                      Đoạn văn #{idx + 1}
                    </label>
                    <button
                      type="button"
                      className="btn-text-action btn-text-delete"
                      id={`btnRemoveParagraph-${idx}`}
                      onClick={() => handleRemoveParagraph(idx)}
                      disabled={isPending || isReloading || sessionLost || !lesson.isEditable}
                      style={{ fontSize: '12px' }}
                    >
                      Xóa đoạn
                    </button>
                  </div>
                  <textarea
                    id={`inputParagraph-${idx}`}
                    className="form-input"
                    rows={4}
                    value={p.text}
                    onChange={(e) => handleParagraphChange(idx, e.target.value)}
                    maxLength={20000}
                    placeholder="Nhập nội dung đoạn văn..."
                    disabled={isPending || isReloading || sessionLost || !lesson.isEditable}
                    style={{ resize: 'vertical' }}
                  />
                  <div style={{ textAlign: 'right', fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                    {p.text.length} / 20.000 ký tự
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Change Summary Section */}
        <div
          className="form-section"
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px',
          }}
        >
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: '#0f172a' }}>
            3. Tóm tắt thay đổi (tùy chọn)
          </h2>
          <textarea
            id="inputDraftChangeSummary"
            className="form-input"
            rows={2}
            value={changeSummary}
            onChange={(e) => setChangeSummary(e.target.value)}
            maxLength={500}
            placeholder="Ghi chú ngắn về các thay đổi trong lần lưu này (tối đa 500 ký tự)..."
            disabled={isPending || isReloading || sessionLost || !lesson.isEditable}
          />
        </div>

        {/* Submit action */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '32px' }}>
          <a href="/my-lessons" className="btn btn-secondary" id="btnCancelDraft" aria-disabled={isPending || isReloading} onClick={e => { if (isPendingRef.current) e.preventDefault(); }}>
            Hủy / Quay lại
          </a>
          <button
            type="submit"
            className="btn btn-primary"
            id="btnSaveDraft"
            disabled={isPending || isReloading || isStaleConflict || sessionLost || !lesson.isEditable}
            style={{ minWidth: '140px' }}
          >
            {isPending ? 'Đang lưu...' : 'Lưu bản nháp'}
          </button>
        </div>
      </form>

      {/* Revision History Section */}
      <div
        className="revision-history-section"
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '20px',
        }}
        id="revisionHistorySection"
      >
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#0f172a' }}>
          Lịch sử bản sửa đổi
        </h2>

        {lesson.revisions.length === 0 ? (
          <div
            style={{
              padding: '16px',
              textAlign: 'center',
              color: '#94a3b8',
              fontStyle: 'italic',
            }}
            id="emptyRevisionHistory"
          >
            Chưa có bản sửa đổi nào được lưu.
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table" aria-label="Lịch sử bản sửa đổi bài học">
              <thead>
                <tr>
                  <th scope="col" style={{ width: '90px' }}>Bản số</th>
                  <th scope="col" style={{ width: '160px' }}>Tác giả</th>
                  <th scope="col" style={{ width: '180px' }}>Thời gian</th>
                  <th scope="col">Tóm tắt thay đổi</th>
                  <th scope="col" style={{ width: '120px' }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {lesson.revisions.map((rev) => (
                  <tr key={rev.id} id={`row-revision-${rev.revisionNo}`}>
                    <td style={{ fontWeight: 600 }}>#{rev.revisionNo}</td>
                    <td>{rev.author.displayName || 'Giáo viên'}</td>
                    <td style={{ color: '#64748b', fontSize: '13px' }}>
                      {new Date(rev.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td>{rev.changeSummary || <span style={{ color: '#94a3b8' }}>—</span>}</td>
                    <td>
                      <span
                        className="level-badge"
                        style={{
                          background: rev.status === 'DRAFT' ? '#eff6ff' : '#f1f5f9',
                          color: rev.status === 'DRAFT' ? '#1d4ed8' : '#475569',
                        }}
                      >
                        {rev.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <SessionLostModal isOpen={sessionLost} />
    </div>
  );
}
