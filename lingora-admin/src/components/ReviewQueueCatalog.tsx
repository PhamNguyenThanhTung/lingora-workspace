'use client';

import React, { useState } from 'react';
import type { ReviewQueueItemDto } from '@/server/lessons/workflow';

export interface ReviewQueueCatalogProps {
  initialQueue: ReviewQueueItemDto[];
  initialError?: string | null;
  account: {
    id: string;
    role: string;
    status: string;
    displayName: string | null;
  };
}

export function ReviewQueueCatalog({
  initialQueue,
  initialError,
  account,
}: ReviewQueueCatalogProps) {
  const [queue, setQueue] = useState<ReviewQueueItemDto[]>(initialQueue || []);
  const [error, setError] = useState<string | null>(initialError || null);

  return (
    <div className="page-content" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div
        className="catalog-header"
        style={{
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '16px',
          marginBottom: '24px',
        }}
      >
        <h1 className="page-title" id="reviewQueueTitle" style={{ fontSize: '24px' }}>
          Hàng đợi kiểm duyệt bài học
        </h1>
        <p className="page-description" style={{ margin: 0, color: '#64748b' }}>
          Danh sách các bản nộp bài học đang chờ Quản trị viên xem xét, phê duyệt hoặc yêu cầu chỉnh sửa.
        </p>
      </div>

      {error && (
        <div
          className="form-error-banner"
          role="alert"
          id="reviewQueueError"
          style={{
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            color: '#b91c1c',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px',
          }}
        >
          {error}
        </div>
      )}

      {queue.length === 0 ? (
        <div
          id="emptyReviewQueue"
          style={{
            textAlign: 'center',
            padding: '48px 24px',
            background: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            color: '#64748b',
          }}
        >
          <div style={{ fontSize: '18px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
            Không có bài học chờ duyệt
          </div>
          <p style={{ margin: 0, fontSize: '14px' }}>
            Hiện không có bản nộp bài học nào ở trạng thái chờ kiểm duyệt.
          </p>
        </div>
      ) : (
        <div
          className="table-wrap"
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <table className="data-table" id="reviewQueueTable" aria-label="Danh sách bài học chờ kiểm duyệt">
            <thead>
              <tr>
                <th scope="col" style={{ width: '180px' }}>Khóa học / Đơn vị</th>
                <th scope="col" style={{ width: '130px' }} id="colLessonRevision">Bài học & Bản sửa đổi</th>
                <th scope="col">Tiêu đề bài học</th>
                <th scope="col" style={{ width: '160px' }}>Người nộp</th>
                <th scope="col" style={{ width: '160px' }}>Thời gian nộp</th>
                <th scope="col" style={{ width: '110px' }}>Trạng thái</th>
                <th scope="col" style={{ width: '120px', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((item) => {
                const courseName = item.courseName.vi || item.courseName.en || 'Khóa học';
                const unitName = item.unitName.vi || item.unitName.en || item.unitCode;
                const title = item.title.vi || item.title.en || 'Chưa đặt tiêu đề';

                return (
                  <tr key={item.submissionId} id={`reviewRow-${item.submissionId}`}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: '#1e293b' }}>{courseName}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{unitName}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>Bài #{item.lessonPosition}</div>
                      <span
                        className="badge"
                        style={{ background: '#f3e8ff', color: '#6b21a8', fontSize: '11px', marginTop: '2px' }}
                      >
                        Bản #{item.revisionNo}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: '#0f172a' }}>{title}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        ID nộp: {item.submissionId.slice(0, 8)}...
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>
                        {item.submitter?.displayName || 'Giáo viên'}
                      </div>
                    </td>
                    <td style={{ fontSize: '12px', color: '#64748b' }}>
                      {new Date(item.submittedAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                    </td>
                    <td>
                      <span
                        className="level-badge"
                        style={{ background: '#eff6ff', color: '#1d4ed8' }}
                      >
                        {item.statusLabel}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <a
                        href={`/review/${item.submissionId}`}
                        id={`btnViewReview-${item.submissionId}`}
                        className="btn btn-primary"
                        style={{ fontSize: '13px', padding: '6px 12px', textDecoration: 'none', display: 'inline-block' }}
                      >
                        Kiểm duyệt
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
