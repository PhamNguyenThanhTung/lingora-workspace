'use client';

import React, { useState, useRef } from 'react';
import type { ReviewDetailDto } from '@/server/lessons/workflow';

export interface ReviewDetailViewProps {
  initialDetail: ReviewDetailDto;
  initialError?: string | null;
  account: {
    id: string;
    role: string;
    status: string;
    displayName: string | null;
  };
}

export function ReviewDetailView({
  initialDetail,
  initialError,
  account,
}: ReviewDetailViewProps) {
  const [detail, setDetail] = useState<ReviewDetailDto>(initialDetail);
  const [comment, setComment] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError || null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isStaleConflict, setIsStaleConflict] = useState(false);

  const isPendingRef = useRef(false);

  const authFailed = (res: Response): boolean => {
    if (res.status === 401) {
      window.location.href = '/login';
      return true;
    }
    if (res.status === 403) {
      setErrorMessage('Tài khoản không đủ quyền thực hiện thao tác này.');
      return true;
    }
    return false;
  };

  const handleReload = async () => {
    if (isPendingRef.current) return;
    isPendingRef.current = true;
    setIsReloading(true);
    setErrorMessage(null);
    setIsStaleConflict(false);

    try {
      const res = await fetch(`/api/reviews/${detail.submissionId}`, {
        headers: { Origin: window.location.origin },
      });
      if (authFailed(res)) return;
      if (!res.ok) {
        setErrorMessage('Không thể tải lại chi tiết bản nộp.');
        return;
      }
      const data = await res.json();
      if (data.data) {
        setDetail(data.data);
      }
    } catch {
      setErrorMessage('Lỗi kết nối khi tải lại thông tin.');
    } finally {
      isPendingRef.current = false;
      setIsReloading(false);
    }
  };

  const handleRequestChanges = async () => {
    if (isPendingRef.current) return;
    isPendingRef.current = true;
    setIsPending(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsStaleConflict(false);

    try {
      const res = await fetch(`/api/reviews/${detail.submissionId}/request-changes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: window.location.origin,
        },
        body: JSON.stringify({
          expectedRevisionRowVersion: detail.revision.rowVersion,
          comment: comment.trim() || undefined,
        }),
      });

      if (authFailed(res)) return;
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 409) {
          setIsStaleConflict(true);
          setErrorMessage(data?.error?.message || 'Bản nộp đã bị thay đổi bởi thao tác khác. Vui lòng tải lại dữ liệu mới nhất.');
        } else {
          setErrorMessage(data?.error?.message || 'Có lỗi xảy ra khi yêu cầu chỉnh sửa.');
        }
        return;
      }

      if (data.data) {
        setDetail(data.data);
      }
      setSuccessMessage('Đã chuyển bài học sang trạng thái Yêu cầu chỉnh sửa thành công.');
      setComment('');
    } catch {
      setErrorMessage('Lỗi mạng khi gửi yêu cầu chỉnh sửa.');
    } finally {
      isPendingRef.current = false;
      setIsPending(false);
    }
  };

  const handleApprove = async () => {
    if (isPendingRef.current) return;
    isPendingRef.current = true;
    setIsPending(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsStaleConflict(false);

    try {
      const res = await fetch(`/api/reviews/${detail.submissionId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: window.location.origin,
        },
        body: JSON.stringify({
          expectedRevisionRowVersion: detail.revision.rowVersion,
          comment: comment.trim() || undefined,
        }),
      });

      if (authFailed(res)) return;
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 409) {
          setIsStaleConflict(true);
          setErrorMessage(data?.error?.message || 'Bản nộp đã bị thay đổi bởi thao tác khác. Vui lòng tải lại dữ liệu mới nhất.');
        } else {
          setErrorMessage(data?.error?.message || 'Có lỗi xảy ra khi phê duyệt bài học.');
        }
        return;
      }

      if (data.data) {
        setDetail(data.data);
      }
      setSuccessMessage('Đã phê duyệt bài học thành công.');
      setComment('');
    } catch {
      setErrorMessage('Lỗi mạng khi phê duyệt bài học.');
    } finally {
      isPendingRef.current = false;
      setIsPending(false);
    }
  };

  const handlePublish = async () => {
    if (isPendingRef.current) return;
    isPendingRef.current = true;
    setIsPending(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsStaleConflict(false);

    try {
      const res = await fetch(`/api/reviews/${detail.submissionId}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: window.location.origin,
        },
        body: JSON.stringify({
          expectedLessonRowVersion: detail.lesson.rowVersion,
          expectedRevisionRowVersion: detail.revision.rowVersion,
        }),
      });

      if (authFailed(res)) return;
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 409) {
          setIsStaleConflict(true);
          setErrorMessage(data?.error?.message || 'Dữ liệu bài học hoặc bản sửa đổi đã bị thay đổi bởi thao tác khác.');
        } else {
          setErrorMessage(data?.error?.message || 'Có lỗi xảy ra khi xuất bản bài học.');
        }
        return;
      }

      if (data.data) {
        setDetail(data.data);
      }
      setSuccessMessage('Đã xuất bản bài học thành công!');
    } catch {
      setErrorMessage('Lỗi mạng khi xuất bản bài học.');
    } finally {
      isPendingRef.current = false;
      setIsPending(false);
    }
  };

  const courseName = detail.lesson.courseName.vi || detail.lesson.courseName.en || 'Khóa học';
  const unitName = detail.lesson.unitName.vi || detail.lesson.unitName.en || detail.lesson.unitCode;

  return (
    <div className="page-content" style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Return link */}
      <nav className="catalog-breadcrumbs" style={{ marginBottom: '16px' }}>
        <a
          href="/review"
          className="breadcrumb-link"
          id="btnBackToReviewQueue"
          aria-disabled={isPending || isReloading}
          onClick={(e) => {
            if (isPendingRef.current) e.preventDefault();
          }}
        >
          &larr; Quay lại hàng đợi kiểm duyệt
        </a>
      </nav>

      {/* Header & Meta */}
      <div
        className="review-header"
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
          <span className="badge" style={{ background: '#e0e7ff', color: '#3730a3', fontSize: '12px', padding: '2px 8px', borderRadius: '4px' }}>
            Khóa học: {courseName}
          </span>
          <span className="badge" style={{ background: '#f1f5f9', color: '#334155', fontSize: '12px', padding: '2px 8px', borderRadius: '4px' }}>
            Đơn vị: {detail.lesson.unitCode}
          </span>
          <span className="badge" style={{ background: '#f3e8ff', color: '#6b21a8', fontSize: '12px', padding: '2px 8px', borderRadius: '4px' }} id="badgeRevisionNo">
            Bản sửa đổi: #{detail.revision.revisionNo}
          </span>
          <span className="badge" style={{ background: '#e2e8f0', color: '#1e293b', fontSize: '12px', padding: '2px 8px', borderRadius: '4px' }} id="badgeRevisionStatus">
            Trạng thái: {detail.revision.statusLabel}
          </span>
          <span className="badge" style={{ background: '#fef3c7', color: '#92400e', fontSize: '12px', padding: '2px 8px', borderRadius: '4px' }}>
            Phiên bản: #{detail.revision.rowVersion}
          </span>
        </div>

        <h1 className="page-title" style={{ fontSize: '24px', marginBottom: '8px' }}>
          Kiểm duyệt: Bài học #{detail.lesson.position} — {detail.revision.title.vi || detail.revision.title.en || 'Chưa đặt tiêu đề'}
        </h1>

        <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            Người nộp: <strong>{detail.revision.submitter?.displayName || 'Giáo viên'}</strong>
          </div>
          {detail.revision.submittedAt && (
            <div>
              Thời gian nộp: <strong>{new Date(detail.revision.submittedAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</strong>
            </div>
          )}
          {detail.assignmentEpisode && (
            <div>
              Thế hệ phân công: <strong>#{detail.assignmentEpisode.sequenceNo} ({detail.assignmentEpisode.scopeGeneration})</strong>
            </div>
          )}
        </div>

        {detail.revision.changeSummary && (
          <div style={{ marginTop: '12px', padding: '10px 14px', background: '#f8fafc', borderRadius: '6px', fontSize: '13px' }}>
            <strong>Tóm tắt thay đổi từ tác giả:</strong> {detail.revision.changeSummary}
          </div>
        )}
      </div>

      {/* Notifications */}
      {successMessage && (
        <div
          role="status"
          id="reviewActionSuccess"
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

      {errorMessage && (
        <div
          className="form-error-banner"
          role="alert"
          id="reviewActionError"
          style={{
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            color: '#b91c1c',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px',
          }}
        >
          <div style={{ marginBottom: isStaleConflict ? '12px' : 0 }}>{errorMessage}</div>
          {isStaleConflict && (
            <button
              type="button"
              className="btn btn-secondary"
              id="btnReloadReview"
              onClick={handleReload}
              disabled={isReloading || isPending}
              style={{ fontSize: '13px', padding: '6px 12px' }}
            >
              {isReloading ? 'Đang tải lại...' : 'Tải lại dữ liệu mới nhất'}
            </button>
          )}
        </div>
      )}

      {/* Section 1: Content Paragraphs */}
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
          1. Nội dung bài học ({detail.revision.contentBlocks.length} đoạn văn)
        </h2>
        {detail.revision.contentBlocks.length === 0 ? (
          <p style={{ color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>Không có đoạn văn nào.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {detail.revision.contentBlocks.map((block, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px 16px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  lineHeight: '1.6',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                  ĐOẠN #{idx + 1}
                </div>
                {block.text}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Exercises */}
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
          2. Danh sách bài tập ({detail.exercises.length} bài tập)
        </h2>
        {detail.exercises.length === 0 ? (
          <p style={{ color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>Không có bài tập nào.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {detail.exercises.map((ex, idx) => (
              <div
                key={ex.id || idx}
                id={`exerciseBlock-${idx}`}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '16px',
                  background: '#ffffff',
                }}
              >
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>#{ex.position}</span>
                  <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '12px' }}>
                    {ex.type}
                  </span>
                  <span
                    className="badge"
                    style={{
                      background: ex.isCore ? '#fef3c7' : '#f1f5f9',
                      color: ex.isCore ? '#92400e' : '#475569',
                      fontSize: '12px',
                    }}
                  >
                    {ex.isCore ? 'Cốt lõi' : 'Mở rộng'}
                  </span>
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>CÂU HỎI / PROMPT:</div>
                  <div style={{ fontSize: '14px', marginTop: '2px' }}>{ex.promptData?.prompt || '—'}</div>
                  {ex.promptData?.audioUrl && (
                    <div style={{ fontSize: '12px', color: '#0284c7', marginTop: '4px' }}>
                      Âm thanh: {ex.promptData.audioUrl}
                    </div>
                  )}
                </div>

                {ex.promptData?.options && (
                  <div style={{ marginBottom: '8px', fontSize: '13px' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>CÁC LỰA CHỌN:</div>
                    <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                      {ex.promptData.options.map((opt: any) => (
                        <li key={opt.id} style={{ margin: '2px 0' }}>
                          {opt.id}: {opt.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {ex.type === 'FILL_BLANK' && ex.promptData?.sentence && (
                  <div style={{ marginBottom: '8px', fontSize: '13px' }}>
                    <strong>Câu cần điền:</strong> {ex.promptData.sentence}
                  </div>
                )}
                {ex.type === 'REORDER' && Array.isArray(ex.promptData?.tokens) && (
                  <div style={{ marginBottom: '8px', fontSize: '13px' }}>
                    <div style={{ fontWeight: 600 }}>Các cụm từ cần sắp xếp:</div>
                    <ol style={{ margin: '4px 0 0 20px', padding: 0 }}>
                      {ex.promptData.tokens.map((token: any) => (
                        <li key={token.id}>{token.text}</li>
                      ))}
                    </ol>
                  </div>
                )}
                {ex.type === 'GRAMMAR' && (
                  <div style={{ marginBottom: '8px', fontSize: '13px' }}>
                    {ex.promptData?.sourceSentence && <div><strong>Câu gốc:</strong> {ex.promptData.sourceSentence}</div>}
                    {ex.promptData?.targetPattern && <div><strong>Mẫu ngữ pháp:</strong> {ex.promptData.targetPattern}</div>}
                  </div>
                )}

                <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '4px', fontSize: '13px' }}>
                  <div style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>ĐÁP ÁN (DỮ LIỆU CHẤM ĐIỂM):</div>
                  <pre style={{ margin: '4px 0 0', fontSize: '12px', color: '#0f172a', whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(ex.gradingData, null, 2)}
                  </pre>
                </div>

                {ex.feedbackData?.explanation && (
                  <div style={{ marginTop: '8px', fontSize: '13px', color: '#475569' }}>
                    <strong>Giải thích đáp án:</strong> {ex.feedbackData.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 3: Vocabulary */}
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
          3. Danh sách từ vựng ({detail.vocabulary.length} từ vựng)
        </h2>
        {detail.vocabulary.length === 0 ? (
          <p style={{ color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>Không có từ vựng nào.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table" aria-label="Từ vựng trong bài học">
              <thead>
                <tr>
                  <th scope="col" style={{ width: '60px' }}>Vị trí</th>
                  <th scope="col" style={{ width: '90px' }}>Phân loại</th>
                  <th scope="col">Từ / Thuật ngữ</th>
                  <th scope="col">Ý nghĩa</th>
                  <th scope="col">Ví dụ</th>
                </tr>
              </thead>
              <tbody>
                {detail.vocabulary.map((v, idx) => {
                  const snap = v.displaySnapshot || {};
                  return (
                    <tr key={v.id || idx}>
                      <td style={{ fontWeight: 600 }}>#{v.position}</td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: v.isCore ? '#fef3c7' : '#f1f5f9',
                            color: v.isCore ? '#92400e' : '#475569',
                            fontSize: '11px',
                          }}
                        >
                          {v.isCore ? 'Cốt lõi' : 'Mở rộng'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{snap.canonicalForm || '—'}</div>
                        {snap.phonetic && <div style={{ fontSize: '11px', color: '#64748b' }}>{snap.phonetic}</div>}
                        {snap.partOfSpeech && (
                          <span className="badge" style={{ fontSize: '10px', background: '#f1f5f9', color: '#475569' }}>
                            {snap.partOfSpeech}
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: '13px' }}>
                        {snap.meaningLabels?.vi && <div>vi: {snap.meaningLabels.vi}</div>}
                        {snap.meaningLabels?.en && <div style={{ color: '#64748b' }}>en: {snap.meaningLabels.en}</div>}
                      </td>
                      <td style={{ fontSize: '12px', color: '#475569' }}>{snap.example || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 4: Review History */}
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
          4. Lịch sử kiểm duyệt & xử lý ({detail.reviews.length} sự kiện)
        </h2>
        {detail.reviews.length === 0 ? (
          <p style={{ color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>Chưa có sự kiện kiểm duyệt nào.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table" aria-label="Lịch sử kiểm duyệt">
              <thead>
                <tr>
                  <th scope="col" style={{ width: '130px' }}>Hành động</th>
                  <th scope="col" style={{ width: '150px' }}>Người thực hiện</th>
                  <th scope="col" style={{ width: '160px' }}>Thời gian (UTC+7)</th>
                  <th scope="col">Ghi chú / Nhận xét</th>
                </tr>
              </thead>
              <tbody>
                {detail.reviews.map((r) => (
                  <tr key={r.id} id={`reviewEvent-${r.id}`}>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background:
                            r.action === 'SUBMIT'
                              ? '#eff6ff'
                              : r.action === 'APPROVE'
                              ? '#f0fdf4'
                              : r.action === 'PUBLISH'
                              ? '#ecfdf5'
                              : r.action === 'REQUEST_CHANGES'
                              ? '#fffbeb'
                              : '#f1f5f9',
                          color:
                            r.action === 'SUBMIT'
                              ? '#1d4ed8'
                              : r.action === 'APPROVE'
                              ? '#166534'
                              : r.action === 'PUBLISH'
                              ? '#065f46'
                              : r.action === 'REQUEST_CHANGES'
                              ? '#b45309'
                              : '#475569',
                          fontSize: '11px',
                        }}
                      >
                        {r.actionLabel || r.action}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>{r.actor.displayName || 'Người dùng'}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>ID: {r.actor.id.slice(0, 8)}...</div>
                    </td>
                    <td style={{ fontSize: '12px', color: '#64748b' }}>
                      {new Date(r.occurredAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                    </td>
                    <td style={{ fontSize: '13px' }}>
                      {r.comment || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Không có ghi chú</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Actions Panel */}
      <div
        className="form-section"
        id="reviewActionsPanel"
        style={{
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '32px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        }}
      >
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#0f172a' }}>
          Hành động kiểm duyệt
        </h2>

        {detail.revision.status === 'IN_REVIEW' && (
          <div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label htmlFor="inputReviewComment" className="form-label" style={{ fontWeight: 600 }}>
                Ghi chú / Ý kiến phản hồi (tùy chọn)
              </label>
              <textarea
                id="inputReviewComment"
                className="form-input"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={2000}
                placeholder="Nhập ghi chú yêu cầu chỉnh sửa hoặc lưu ý khi phê duyệt..."
                disabled={isPending || isReloading}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                id="btnRequestChanges"
                onClick={handleRequestChanges}
                disabled={isPending || isReloading}
                style={{ color: '#b45309', borderColor: '#f59e0b' }}
              >
                {isPending ? 'Đang xử lý...' : 'Yêu cầu chỉnh sửa'}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                id="btnApprove"
                onClick={handleApprove}
                disabled={isPending || isReloading}
              >
                {isPending ? 'Đang xử lý...' : 'Phê duyệt bản nộp'}
              </button>
            </div>
          </div>
        )}

        {detail.revision.status === 'APPROVED' && (
          <div>
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                padding: '12px 16px',
                borderRadius: '6px',
                color: '#166534',
                marginBottom: '16px',
                fontSize: '14px',
              }}
            >
              Bản sửa đổi này đã được phê duyệt. Nhấn <strong>Xuất bản bài học</strong> để cập nhật phiên bản chính thức hoạt động.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-primary"
                id="btnPublish"
                onClick={handlePublish}
                disabled={isPending || isReloading}
                style={{ background: '#16a34a', borderColor: '#15803d' }}
              >
                {isPending ? 'Đang xuất bản...' : 'Xuất bản bài học'}
              </button>
            </div>
          </div>
        )}

        {detail.revision.status === 'CHANGES_REQUESTED' && (
          <div
            style={{
              background: '#fffbeb',
              border: '1px solid #fef3c7',
              padding: '12px 16px',
              borderRadius: '6px',
              color: '#92400e',
              fontSize: '14px',
            }}
          >
            Bài học đang ở trạng thái <strong>Yêu cầu chỉnh sửa</strong>. Đang chờ giáo viên tạo bản nháp sửa đổi và nộp lại.
          </div>
        )}

        {detail.revision.status === 'PUBLISHED' && (
          <div
            style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              padding: '12px 16px',
              borderRadius: '6px',
              color: '#065f46',
              fontSize: '14px',
            }}
          >
            Bản sửa đổi này <strong>đã được xuất bản</strong> và đang là phiên bản chính thức của bài học.
          </div>
        )}
      </div>
    </div>
  );
}
