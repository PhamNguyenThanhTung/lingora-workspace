'use client';

import React, { useState } from 'react';
import type { ReviewCommentDto } from '@/server/lessons/comments';
import styles from './studio-styles';

export interface BlockCommentsProps {
  comments: ReviewCommentDto[];
  targetBlockKey?: string | null;
  targetItemRevisionId?: string | null;
  isRevisionWide?: boolean;
  canResolve?: boolean;
  canReopen?: boolean;
  canAdd?: boolean;
  onResolve?: (commentId: string, rowVersion: string) => Promise<void>;
  onReopen?: (commentId: string, rowVersion: string) => Promise<void>;
  onAddComment?: (body: string, blockKey?: string | null, itemRevisionId?: string | null) => Promise<void>;
  disabled?: boolean;
}

export function BlockComments({
  comments,
  targetBlockKey,
  targetItemRevisionId,
  isRevisionWide = false,
  canResolve = false,
  canReopen = false,
  canAdd = false,
  onResolve,
  onReopen,
  onAddComment,
  disabled = false,
}: BlockCommentsProps) {
  const [newCommentBody, setNewCommentBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Filter comments belonging to this target
  const relevantComments = comments.filter((c) => {
    if (targetBlockKey) {
      return c.blockKey === targetBlockKey;
    }
    if (targetItemRevisionId) {
      return c.itemRevisionId === targetItemRevisionId;
    }
    if (isRevisionWide) {
      return !c.blockKey && !c.itemRevisionId;
    }
    return false;
  });

  const openCount = relevantComments.filter((c) => c.status === 'OPEN').length;

  if (relevantComments.length === 0 && !canAdd) {
    return null;
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCommentBody.trim();
    if (!trimmed || !onAddComment || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddComment(
        trimmed,
        targetBlockKey || null,
        targetItemRevisionId || null
      );
      setNewCommentBody('');
      setShowAddForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async (comment: ReviewCommentDto) => {
    if (!onResolve || actioningId) return;
    setActioningId(comment.id);
    try {
      await onResolve(comment.id, comment.rowVersion);
    } finally {
      setActioningId(null);
    }
  };

  const handleReopen = async (comment: ReviewCommentDto) => {
    if (!onReopen || actioningId) return;
    setActioningId(comment.id);
    try {
      await onReopen(comment.id, comment.rowVersion);
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div
      className={styles.commentsSection}
      id={`blockComments-${targetBlockKey || targetItemRevisionId || 'revision'}`}
      role="region"
      aria-label="Nhận xét kiểm duyệt"
    >
      <div className={styles.commentsHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>💬 Yêu cầu chỉnh sửa / Nhận xét ({relevantComments.length})</span>
          {openCount > 0 && (
            <span className={styles.commentBadgeOpen}>
              {openCount} đang chờ xử lý
            </span>
          )}
        </div>

        {canAdd && !showAddForm && (
          <button
            type="button"
            className={styles.commentActionBtn}
            onClick={() => setShowAddForm(true)}
            disabled={disabled}
            style={{ fontSize: '11.5px', padding: '3px 8px' }}
          >
            + Viết nhận xét
          </button>
        )}
      </div>

      {/* Add Comment Form */}
      {canAdd && showAddForm && (
        <form onSubmit={handleCreate} style={{ marginBottom: '12px' }}>
          <textarea
            className={styles.formTextarea}
            rows={2}
            value={newCommentBody}
            onChange={(e) => setNewCommentBody(e.target.value)}
            placeholder="Nhập nội dung nhận xét hoặc yêu cầu chỉnh sửa..."
            maxLength={2000}
            disabled={disabled || isSubmitting}
            autoFocus
          />
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <button
              type="submit"
              className={`${styles.commentActionBtn} ${styles.commentActionBtnSuccess}`}
              disabled={disabled || isSubmitting || !newCommentBody.trim()}
            >
              {isSubmitting ? 'Đang gửi...' : 'Lưu nhận xét'}
            </button>
            <button
              type="button"
              className={styles.commentActionBtn}
              onClick={() => {
                setShowAddForm(false);
                setNewCommentBody('');
              }}
              disabled={disabled || isSubmitting}
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      {/* Comments List */}
      {relevantComments.map((comment) => {
        const isActioning = actioningId === comment.id;
        const formattedDate = comment.createdAt
          ? new Date(comment.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
          : '';

        return (
          <div
            key={comment.id}
            id={`commentItem-${comment.id}`}
            className={styles.commentItem}
          >
            <div className={styles.commentMeta}>
              <div>
                <strong>{comment.author.displayName || 'Quản trị viên'}</strong>
                <span style={{ marginLeft: '8px' }}>{formattedDate}</span>
              </div>
              <div>
                {comment.status === 'OPEN' ? (
                  <span className={styles.commentBadgeOpen}>Đang mở</span>
                ) : (
                  <span className={styles.commentBadgeResolved}>Đã xử lý</span>
                )}
              </div>
            </div>

            <div className={styles.commentBody}>{comment.body}</div>

            {comment.status === 'RESOLVED' && comment.resolvedBy && (
              <div style={{ fontSize: '11px', color: '#15803d', marginTop: '6px' }}>
                ✓ Đã xử lý bởi <strong>{comment.resolvedBy.displayName || 'Giáo viên'}</strong>
                {comment.resolvedAt && (
                  <span> lúc {new Date(comment.resolvedAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</span>
                )}
              </div>
            )}

            {/* Resolve button for teacher or admin */}
            {comment.status === 'OPEN' && canResolve && onResolve && (
              <button
                type="button"
                className={`${styles.commentActionBtn} ${styles.commentActionBtnSuccess}`}
                id={`btnResolveComment-${comment.id}`}
                onClick={() => handleResolve(comment)}
                disabled={disabled || isActioning}
              >
                {isActioning ? 'Đang cập nhật...' : '✓ Đánh dấu đã xử lý'}
              </button>
            )}

            {/* Reopen button for admin */}
            {comment.status === 'RESOLVED' && canReopen && onReopen && (
              <button
                type="button"
                className={styles.commentActionBtn}
                id={`btnReopenComment-${comment.id}`}
                onClick={() => handleReopen(comment)}
                disabled={disabled || isActioning}
              >
                {isActioning ? 'Đang mở lại...' : '↺ Mở lại nhận xét'}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
