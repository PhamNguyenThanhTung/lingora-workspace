'use client';

import React, { useState, useRef, useCallback } from 'react';
import type {
  AuditEventDto,
  AuditFilters,
  AuditEventAction,
  AuditEventOutcome,
} from '../server/audit/types.ts';
import {
  ACTION_LABELS,
  OUTCOME_LABELS,
  ACTOR_KIND_LABELS,
  TARGET_TYPE_LABELS,
  KNOWN_ACTIONS,
  KNOWN_OUTCOMES,
} from '../server/audit/types.ts';

export interface AuditEventsCatalogProps {
  initialData: AuditEventDto[];
  initialFilters: AuditFilters;
  initialNextCursor: string | null;
  initialError?: string | null;
  account: {
    id: string;
    role: string;
    status: string;
    displayName: string | null;
  };
}

function toLocalDatetimeInput(utcIso: string): string {
  const d = new Date(utcIso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalDatetimeInput(localVal: string): string {
  const d = new Date(localVal);
  return d.toISOString();
}

type Transition =
  | {
      type: 'apply';
      params: {
        from: string;
        to: string;
        action: AuditEventAction | null;
        outcome: AuditEventOutcome | null;
      };
    }
  | {
      type: 'reset';
      params: {
        from: string;
        to: string;
        action: null;
        outcome: null;
      };
      resetInputs: {
        fromInput: string;
        toInput: string;
      };
    }
  | {
      type: 'next';
      params: {
        from: string;
        to: string;
        action: AuditEventAction | null;
        outcome: AuditEventOutcome | null;
        cursor: string;
      };
      targetCursor: string;
      previousCursor: string | null;
    }
  | {
      type: 'back';
      params: {
        from: string;
        to: string;
        action: AuditEventAction | null;
        outcome: AuditEventOutcome | null;
        cursor?: string | null;
      };
      targetCursor: string | null;
    }
  | {
      type: 'initial_retry';
      params: {
        from: string;
        to: string;
        action: AuditEventAction | null;
        outcome: AuditEventOutcome | null;
      };
    };

export function AuditEventsCatalog({
  initialData,
  initialFilters,
  initialNextCursor,
  initialError,
  account,
}: AuditEventsCatalogProps) {
  const [events, setEvents] = useState<AuditEventDto[]>(initialData || []);
  const [filters, setFilters] = useState<AuditFilters>(initialFilters);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([]);
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);

  // Form input states (retained on error)
  const [fromInput, setFromInput] = useState<string>(
    initialFilters.from ? toLocalDatetimeInput(initialFilters.from) : ''
  );
  const [toInput, setToInput] = useState<string>(
    initialFilters.to ? toLocalDatetimeInput(initialFilters.to) : ''
  );
  const [actionInput, setActionInput] = useState<string>(initialFilters.action || '');
  const [outcomeInput, setOutcomeInput] = useState<string>(initialFilters.outcome || '');

  const [isPending, setIsPending] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError || null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState<string | null>(null);

  const requestIdRef = useRef(0);
  const lastFailedActionRef = useRef<(() => void) | null>(null);

  const executeTransition = useCallback(async (transition: Transition) => {
    const requestId = ++requestIdRef.current;
    setIsPending(true);
    setErrorMessage(null);
    setValidationError(null);

    try {
      const query = new URLSearchParams();
      query.set('from', transition.params.from);
      query.set('to', transition.params.to);
      if (transition.params.action) {
        query.set('action', transition.params.action);
      }
      if (transition.params.outcome) {
        query.set('outcome', transition.params.outcome);
      }
      if ('cursor' in transition.params && transition.params.cursor) {
        query.set('cursor', transition.params.cursor);
      }

      const res = await fetch(`/api/audit-events?${query.toString()}`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      // Drop obsolete response before parsing body
      if (requestId !== requestIdRef.current) {
        return;
      }

      if (res.status === 401 || res.status === 403) {
        // Never retain privileged data on auth loss
        setEvents([]);
        setNextCursor(null);
        setCurrentCursor(null);
        setCursorStack([]);
        const errBody = await res.json().catch(() => ({}));
        if (requestId !== requestIdRef.current) return;
        setAccessDeniedMessage(
          errBody?.error?.message || 'Phiên làm việc đã hết hạn hoặc bạn không có quyền truy cập.'
        );
        return;
      }

      if (res.status === 503) {
        const errBody = await res.json().catch(() => ({}));
        if (requestId !== requestIdRef.current) return;
        setErrorMessage(
          errBody?.error?.message || 'Cơ sở dữ liệu tạm thời không phản hồi. Vui lòng thử lại.'
        );
        lastFailedActionRef.current = () => executeTransition(transition);
        return;
      }

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        if (requestId !== requestIdRef.current) return;
        setErrorMessage(
          errBody?.error?.message || 'Đã xảy ra lỗi khi tải danh sách nhật ký hoạt động.'
        );
        lastFailedActionRef.current = () => executeTransition(transition);
        return;
      }

      const result = await res.json();
      // Drop obsolete response after body parsing
      if (requestId !== requestIdRef.current) {
        return;
      }

      // SUCCESS: Commit view data, effective filters, current cursor and history together
      setEvents(result.data || []);
      setFilters(result.filters);
      setNextCursor(result.nextCursor || null);

      if (transition.type === 'next') {
        setCurrentCursor(transition.targetCursor);
        setCursorStack((prev) => [...prev, transition.previousCursor]);
      } else if (transition.type === 'back') {
        setCurrentCursor(transition.targetCursor);
        setCursorStack((prev) => prev.slice(0, -1));
      } else if (transition.type === 'apply' || transition.type === 'initial_retry') {
        setCurrentCursor(null);
        setCursorStack([]);
      } else if (transition.type === 'reset') {
        setCurrentCursor(null);
        setCursorStack([]);
        setFromInput(transition.resetInputs.fromInput);
        setToInput(transition.resetInputs.toInput);
        setActionInput('');
        setOutcomeInput('');
      }

      lastFailedActionRef.current = null;
    } catch {
      if (requestId === requestIdRef.current) {
        setErrorMessage('Lỗi kết nối máy chủ. Vui lòng thử lại sau.');
        lastFailedActionRef.current = () => executeTransition(transition);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsPending(false);
      }
    }
  }, []);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fromInput || !toInput) {
      setValidationError('Vui lòng chọn đầy đủ thời gian từ ngày và đến ngày.');
      return;
    }

    let isoFrom: string;
    let isoTo: string;
    try {
      isoFrom = fromLocalDatetimeInput(fromInput);
      isoTo = fromLocalDatetimeInput(toInput);
    } catch {
      setValidationError('Định dạng ngày giờ không hợp lệ.');
      return;
    }

    const fromDate = new Date(isoFrom);
    const toDate = new Date(isoTo);

    if (fromDate.getTime() >= toDate.getTime()) {
      setValidationError('Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc.');
      return;
    }

    const maxSpanMs = 31 * 24 * 60 * 60 * 1000;
    if (toDate.getTime() - fromDate.getTime() > maxSpanMs) {
      setValidationError('Khoảng thời gian tra cứu không được vượt quá 31 ngày.');
      return;
    }

    setValidationError(null);

    const act = (actionInput || null) as AuditEventAction | null;
    const out = (outcomeInput || null) as AuditEventOutcome | null;

    executeTransition({
      type: 'apply',
      params: {
        from: isoFrom,
        to: isoTo,
        action: act,
        outcome: out,
      },
    });
  };

  const handleReset = () => {
    if (isPending) return;

    const now = new Date();
    const toIso = now.toISOString();
    const fromIso = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    setValidationError(null);

    executeTransition({
      type: 'reset',
      params: {
        from: fromIso,
        to: toIso,
        action: null,
        outcome: null,
      },
      resetInputs: {
        fromInput: toLocalDatetimeInput(fromIso),
        toInput: toLocalDatetimeInput(toIso),
      },
    });
  };

  const handleNext = () => {
    if (isPending || !nextCursor) return;

    const nextTargetCursor = nextCursor;
    executeTransition({
      type: 'next',
      params: {
        from: filters.from,
        to: filters.to,
        action: filters.action,
        outcome: filters.outcome,
        cursor: nextTargetCursor,
      },
      targetCursor: nextTargetCursor,
      previousCursor: currentCursor,
    });
  };

  const handleBack = () => {
    if (isPending || cursorStack.length === 0) return;

    const prevCursor = cursorStack[cursorStack.length - 1];
    executeTransition({
      type: 'back',
      params: {
        from: filters.from,
        to: filters.to,
        action: filters.action,
        outcome: filters.outcome,
        cursor: prevCursor,
      },
      targetCursor: prevCursor,
    });
  };

  const handleRetry = () => {
    if (lastFailedActionRef.current) {
      lastFailedActionRef.current();
    } else {
      executeTransition({
        type: 'initial_retry',
        params: {
          from: filters.from,
          to: filters.to,
          action: filters.action,
          outcome: filters.outcome,
        },
      });
    }
  };

  return (
    <div className="page-content audit-catalog-root" id="auditEventsCatalog">
      <style>{`
        .audit-catalog-root {
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }
        .audit-filter-form {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: flex-end;
          padding: 16px;
          background-color: #ffffff;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          margin-bottom: 24px;
          box-sizing: border-box;
          width: 100%;
          max-width: 100%;
        }
        .audit-filter-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }
        .audit-filter-field input,
        .audit-filter-field select {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          box-sizing: border-box;
          max-width: 100%;
        }
        .audit-filter-actions {
          display: flex;
          gap: 8px;
          margin-left: auto;
        }
        .audit-table-wrapper {
          overflow-x: auto;
          width: 100%;
          max-width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background-color: #ffffff;
          box-sizing: border-box;
        }
        .audit-table-caption {
          text-align: left;
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          caption-side: top;
        }
        @media (max-width: 768px) {
          #auditEventsCatalog {
            padding: 16px;
          }
          .audit-filter-form {
            flex-direction: column;
            align-items: stretch;
            padding: 12px;
          }
          .audit-filter-field {
            width: 100%;
          }
          .audit-filter-field input,
          .audit-filter-field select {
            width: 100%;
            min-width: 0;
          }
          .audit-filter-actions {
            width: 100%;
            margin-left: 0;
            flex-wrap: wrap;
          }
          .audit-filter-actions button {
            flex: 1;
          }
          #auditEventsCatalog .pagination-controls {
            flex-wrap: wrap;
            gap: 12px;
          }
        }
      `}</style>

      <div className="page-header">
        <div>
          <h1 className="page-title">Nhật ký hoạt động</h1>
          <p className="page-description" style={{ maxWidth: '800px' }}>
            Nhật ký lưu trữ các sự kiện hoạt động vận hành hệ thống. Lưu ý: Việc không có bản ghi không đồng nghĩa với việc không có hoạt động diễn ra. Khoảng thời gian tra cứu tối đa là 31 ngày.
          </p>
        </div>
      </div>

      {accessDeniedMessage && (
        <div
          className="alert alert-danger"
          id="auditAccessDeniedBanner"
          role="alert"
          style={{
            marginBottom: '20px',
            padding: '16px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #F87171',
            borderRadius: '8px',
            color: '#991B1B',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 600 }}>Truy cập bị từ chối:</span>
            <span>{accessDeniedMessage}</span>
          </div>
        </div>
      )}

      {errorMessage && (
        <div
          className="alert alert-warning"
          id="auditErrorBanner"
          role="alert"
          style={{
            marginBottom: '20px',
            padding: '16px',
            backgroundColor: '#FFFBEB',
            border: '1px solid #FCD34D',
            borderRadius: '8px',
            color: '#92400E',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{errorMessage}</span>
          <button
            type="button"
            id="btnAuditRetry"
            className="btn btn-secondary"
            onClick={handleRetry}
            disabled={isPending}
            style={{ padding: '6px 12px', fontSize: '13px' }}
          >
            Thử lại
          </button>
        </div>
      )}

      {validationError && (
        <div
          className="alert alert-danger"
          id="auditValidationErrorBanner"
          role="alert"
          style={{
            marginBottom: '20px',
            padding: '12px 16px',
            borderRadius: '6px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FCA5A5',
            color: '#991B1B',
          }}
        >
          {validationError}
        </div>
      )}

      <form
        onSubmit={handleApply}
        id="auditFilterForm"
        className="audit-filter-form"
      >
        <div className="audit-filter-field">
          <label htmlFor="auditFromInput" style={{ fontSize: '13px', fontWeight: 600 }}>
            Từ ngày
          </label>
          <input
            id="auditFromInput"
            type="datetime-local"
            value={fromInput}
            onChange={(e) => setFromInput(e.target.value)}
            disabled={isPending}
          />
        </div>

        <div className="audit-filter-field">
          <label htmlFor="auditToInput" style={{ fontSize: '13px', fontWeight: 600 }}>
            Đến ngày
          </label>
          <input
            id="auditToInput"
            type="datetime-local"
            value={toInput}
            onChange={(e) => setToInput(e.target.value)}
            disabled={isPending}
          />
        </div>

        <div className="audit-filter-field">
          <label htmlFor="auditActionSelect" style={{ fontSize: '13px', fontWeight: 600 }}>
            Hành động
          </label>
          <select
            id="auditActionSelect"
            value={actionInput}
            onChange={(e) => setActionInput(e.target.value)}
            disabled={isPending}
            style={{ minWidth: '160px' }}
          >
            <option value="">Tất cả hành động</option>
            {KNOWN_ACTIONS.map((act) => (
              <option key={act} value={act}>
                {ACTION_LABELS[act]}
              </option>
            ))}
            <option value="OTHER">{ACTION_LABELS.OTHER}</option>
          </select>
        </div>

        <div className="audit-filter-field">
          <label htmlFor="auditOutcomeSelect" style={{ fontSize: '13px', fontWeight: 600 }}>
            Kết quả
          </label>
          <select
            id="auditOutcomeSelect"
            value={outcomeInput}
            onChange={(e) => setOutcomeInput(e.target.value)}
            disabled={isPending}
            style={{ minWidth: '130px' }}
          >
            <option value="">Tất cả kết quả</option>
            {KNOWN_OUTCOMES.map((out) => (
              <option key={out} value={out}>
                {OUTCOME_LABELS[out]}
              </option>
            ))}
          </select>
        </div>

        <div className="audit-filter-actions">
          <button
            type="submit"
            id="btnApplyAuditFilters"
            className="btn btn-primary"
            disabled={isPending}
          >
            Áp dụng
          </button>
          <button
            type="button"
            id="btnResetAuditFilters"
            className="btn btn-secondary"
            onClick={handleReset}
            disabled={isPending}
          >
            Đặt lại
          </button>
        </div>
      </form>

      {isPending && (
        <div
          role="status"
          aria-busy="true"
          id="auditLoadingStatus"
          style={{
            padding: '12px 16px',
            marginBottom: '16px',
            backgroundColor: '#F3F4F6',
            borderRadius: '6px',
            fontSize: '14px',
            color: '#4B5563',
          }}
        >
          Đang tải dữ liệu nhật ký...
        </div>
      )}

      {events.length === 0 ? (
        <div
          id="auditEventsEmptyState"
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
          }}
        >
          <p style={{ fontSize: '16px', color: '#6b7280', margin: 0 }}>
            Không tìm thấy sự kiện nhật ký nào trong khoảng thời gian đã chọn.
          </p>
        </div>
      ) : (
        <div className="table-wrap audit-table-wrapper" id="auditEventsTableWrapper">
          <table
            className="data-table"
            id="auditEventsTable"
            style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse' }}
          >
            <caption className="audit-table-caption">
              Nhật ký hoạt động hệ thống (tra cứu tối đa 31 ngày)
            </caption>
            <thead>
              <tr>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Thời điểm (UTC)</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Tác nhân</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Hành động</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Đối tượng</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Kết quả</th>
              </tr>
            </thead>
            <tbody>
              {events.map((evt) => {
                const actionLabel = ACTION_LABELS[evt.action] || 'Khác';
                const actorLabel = ACTOR_KIND_LABELS[evt.actorKind] || 'Khác';
                const targetLabel = TARGET_TYPE_LABELS[evt.targetType] || 'Khác';
                const outcomeLabel = OUTCOME_LABELS[evt.outcome] || 'Khác';

                const outcomeBg =
                  evt.outcome === 'SUCCESS'
                    ? '#ECFDF5'
                    : evt.outcome === 'DENIED' || evt.outcome === 'FAILURE'
                    ? '#FEF2F2'
                    : '#F3F4F6';
                const outcomeColor =
                  evt.outcome === 'SUCCESS'
                    ? '#065F46'
                    : evt.outcome === 'DENIED' || evt.outcome === 'FAILURE'
                    ? '#991B1B'
                    : '#374151';

                return (
                  <tr key={evt.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td
                      style={{
                        padding: '12px 16px',
                        fontSize: '13px',
                        fontFamily: 'monospace',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <time dateTime={evt.occurredAt}>{evt.occurredAt}</time>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                      <span style={{ fontWeight: 500 }}>{actorLabel}</span>
                      {evt.actorId && (
                        <span
                          style={{
                            display: 'block',
                            fontSize: '12px',
                            color: '#6b7280',
                            fontFamily: 'monospace',
                            wordBreak: 'break-all',
                          }}
                        >
                          {evt.actorId}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500 }}>
                      {actionLabel}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                      <span>{targetLabel}</span>
                      {evt.targetId && (
                        <span
                          style={{
                            display: 'block',
                            fontSize: '12px',
                            color: '#6b7280',
                            fontFamily: 'monospace',
                            wordBreak: 'break-all',
                          }}
                        >
                          {evt.targetId}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: 500,
                          backgroundColor: outcomeBg,
                          color: outcomeColor,
                        }}
                      >
                        {outcomeLabel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div
        className="pagination-controls"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '20px',
          padding: '12px 0',
        }}
      >
        <button
          type="button"
          id="btnAuditPrev"
          className="btn btn-secondary"
          onClick={handleBack}
          disabled={cursorStack.length === 0 || isPending}
        >
          &larr; Trang trước
        </button>

        <span style={{ fontSize: '13px', color: '#6b7280' }}>
          Đang hiển thị {events.length} sự kiện (Trang {cursorStack.length + 1})
        </span>

        <button
          type="button"
          id="btnAuditNext"
          className="btn btn-secondary"
          onClick={handleNext}
          disabled={!nextCursor || isPending}
        >
          Trang tiếp &rarr;
        </button>
      </div>
    </div>
  );
}
