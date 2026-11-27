'use client';

import React from 'react';
import type { LearningContextSummaryDto } from '../../server/context/dto.ts';
import { getLocalizedText } from '../../components/learner/helpers.ts';
import type { ContextActions } from './useContextActions';

const PURPOSE_LABELS: Record<string, string> = {
  TRAVEL: 'Du lịch & Khám phá',
  WORK: 'Công việc & Sự nghiệp',
  SCHOOL: 'Học tập & Nhà trường',
  EXAM: 'Luyện thi & Chứng chỉ',
  CONVERSATION: 'Giao tiếp hàng ngày',
  CULTURE: 'Văn hóa & Đời sống',
  ENTERTAINMENT: 'Giải trí & Phim ảnh',
  OTHER: 'Mục đích khác',
};

const INTEREST_LABELS: Record<string, string> = {
  TRAVEL: 'Du lịch',
  BUSINESS: 'Kinh doanh & Khởi nghiệp',
  ACADEMICS: 'Học thuật & Nghiên cứu',
  DAILY_LIFE: 'Đời sống & Thường nhật',
  CULTURE: 'Văn hóa & Lịch sử',
  ENTERTAINMENT: 'Giải trí & Nghệ thuật',
  TECHNOLOGY: 'Công nghệ & Đổi mới',
  FOOD: 'Ẩm thực & Nấu ăn',
  NEWS: 'Tin tức & Xã hội',
  SCIENCE: 'Khoa học & Tự nhiên',
};

interface ContextManagerProps {
  actions: ContextActions;
  uiLocale: string;
}

/** Per-language management (goal, pause/resume, start level). Kept from the old home page, now under the map. */
export function ContextManager({ actions, uiLocale }: ContextManagerProps) {
  const {
    contexts, options, isLoadingOptions, optionsError, pendingContexts, contextErrors,
    recoveringContextId, recoveringSource, setRecoveringSource, recoveringLevelId, setRecoveringLevelId, isRecovering,
    editingGoalContextId, setEditingGoalContextId, goalMinutesState, setGoalMinutesState,
    purposeDraft, setPurposeDraft, interestsDraft, setInterestsDraft, serverPreferences,
    pendingGoalPayloads, isLoadingPlan, isUpdatingGoal, goalErrors,
    handleOpenGoalEditor, handleSaveGoal, handleOpenStartLevel, handleCancelStartLevel,
    handleConfirmStartLevel, handleRetryOptions, handlePause, handleResume, refresh,
  } = actions;

  const [open, setOpen] = React.useState(false);
  // The hero card's "choose a starting level" action lives in this section, so make sure it is visible.
  React.useEffect(() => {
    if (recoveringContextId) setOpen(true);
  }, [recoveringContextId]);

  return (
    <details
      id="contextManager"
      className="context-manager"
      style={{ marginTop: '24px' }}
      open={open}
      onToggle={(event) => setOpen((event.currentTarget as HTMLDetailsElement).open)}
    >
      <summary id="contextManagerSummary" style={{ cursor: 'pointer', fontWeight: 800, minHeight: '44px', display: 'flex', alignItems: 'center' }}>
        Quản lý lộ trình
      </summary>
            <div id="contextList" className="context-grid">
              {contexts.map((ctx: LearningContextSummaryDto) => {
                const courseTitle = getLocalizedText(ctx.course.names, uiLocale);
                const langTitle = getLocalizedText(ctx.targetLanguage.names, uiLocale);
                const workingLvl = ctx.workingLevel
                  ? `${ctx.workingLevel.code} - ${getLocalizedText(
                      ctx.workingLevel.label,
                      uiLocale
                    )}`
                  : 'Chưa chọn trình độ';

                const isPending = !!pendingContexts[ctx.id];
                const cardError = contextErrors[ctx.id];

                return (
                  <article key={ctx.id} className="context-card" data-context-id={ctx.id}>
                    <div className="context-card-header">
                      <div>
                        <h2 className="context-course-name">{courseTitle || 'Khóa học'}</h2>
                        <span className="context-target-lang">
                          {langTitle || ctx.targetLanguage.code}
                        </span>
                      </div>
                      <span
                        className={`badge ${
                          ctx.status === 'ACTIVE' ? 'badge-active' : 'badge-paused'
                        }`}
                      >
                        {ctx.status === 'ACTIVE' ? 'Đang học' : 'Tạm dừng'}
                      </span>
                    </div>

                    <div className="context-details">
                      <div className="context-detail-row">
                        <span className="context-detail-label">Trình độ hiện tại</span>
                        <span className="context-detail-value">{workingLvl}</span>
                      </div>
                    </div>

                    {/* Goal update section for context */}
                    <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-strong)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Mục tiêu học:</span>
                        <button
                          type="button"
                          id={`editGoalBtn-${ctx.id}`}
                          className="btn btn-outline"
                          style={{ fontSize: '0.8rem', padding: '2px 8px' }}
                          onClick={() => handleOpenGoalEditor(ctx)}
                          disabled={ctx.status !== 'ACTIVE' || !ctx.workingLevel || isUpdatingGoal[ctx.id]}
                        >
                          {editingGoalContextId === ctx.id ? 'Đóng' : 'Cập nhật mục tiêu'}
                        </button>
                      </div>

                      {editingGoalContextId === ctx.id && (
                        <div id={`goalEditor-${ctx.id}`} style={{ marginTop: '8px', padding: '12px', background: 'var(--surface-sunken)', borderRadius: '6px' }}>
                          {isLoadingPlan[ctx.id] ? (
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                              Đang tải thông tin mục tiêu...
                            </p>
                          ) : (
                            <>
                              <div style={{ marginBottom: '10px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                                  Số phút học mỗi ngày:
                                </label>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  {[5, 10, 15, 20].map((mins) => {
                                    const currentSelected = (goalMinutesState[ctx.id] || 10) === mins;
                                    return (
                                      <button
                                        key={mins}
                                        type="button"
                                        id={`selectGoal-${ctx.id}-${mins}`}
                                        className={`btn ${currentSelected ? 'btn-primary' : 'btn-outline'}`}
                                        style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                                        onClick={() => setGoalMinutesState((prev) => ({ ...prev, [ctx.id]: mins }))}
                                        disabled={isUpdatingGoal[ctx.id] || pendingGoalPayloads.current.has(ctx.id)}
                                      >
                                        {mins}p
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              <div style={{ marginBottom: '10px' }}>
                                <label htmlFor={`purposeSelect-${ctx.id}`} style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                                  Mục đích học tập:
                                </label>
                                <select
                                  id={`purposeSelect-${ctx.id}`}
                                  className="form-control"
                                  value={purposeDraft[ctx.id] || ''}
                                  onChange={(e) => setPurposeDraft((prev) => ({ ...prev, [ctx.id]: e.target.value ? e.target.value : null }))}
                                  disabled={isUpdatingGoal[ctx.id] || pendingGoalPayloads.current.has(ctx.id)}
                                  style={{ width: '100%', fontSize: '0.85rem', padding: '6px 8px' }}
                                >
                                  <option value="">-- Chưa thiết lập --</option>
                                  {Object.entries(PURPOSE_LABELS).map(([k, label]) => (
                                    <option key={k} value={k}>{label}</option>
                                  ))}
                                </select>
                              </div>

                              <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                                  Chủ đề quan tâm (tối đa 5):
                                </label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                  {Object.entries(INTEREST_LABELS).map(([k, label]) => {
                                    const isChecked = (interestsDraft[ctx.id] || []).includes(k);
                                    return (
                                      <button
                                        key={k}
                                        type="button"
                                        id={`interestPill-${ctx.id}-${k}`}
                                        className={`btn ${isChecked ? 'btn-primary' : 'btn-outline'}`}
                                        style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px' }}
                                        disabled={isUpdatingGoal[ctx.id] || pendingGoalPayloads.current.has(ctx.id)}
                                        onClick={() => {
                                          setInterestsDraft((prev) => {
                                            const current = prev[ctx.id] || [];
                                            if (current.includes(k)) {
                                              return { ...prev, [ctx.id]: current.filter((x) => x !== k) };
                                            }
                                            if (current.length >= 5) return prev;
                                            return { ...prev, [ctx.id]: [...current, k] };
                                          });
                                        }}
                                      >
                                        {label}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {goalErrors[ctx.id] && (
                                <div id={`goalAlert-${ctx.id}`} role="alert" className="login-alert" style={{ marginBottom: '8px', fontSize: '0.8rem', padding: '6px 8px' }}>
                                  <span>{goalErrors[ctx.id]?.message}</span>
                                </div>
                              )}

                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  type="button"
                                  id={`saveGoalBtn-${ctx.id}`}
                                  className="btn btn-primary"
                                  style={{ fontSize: '0.8rem', padding: '4px 12px' }}
                                  disabled={isUpdatingGoal[ctx.id] || !serverPreferences[ctx.id] || ctx.status !== 'ACTIVE'}
                                  onClick={() => handleSaveGoal(ctx)}
                                >
                                  {isUpdatingGoal[ctx.id] ? 'Đang lưu...' : pendingGoalPayloads.current.has(ctx.id) ? 'Thử lưu lại' : 'Lưu mục tiêu'}
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline"
                                  style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                                  disabled={isUpdatingGoal[ctx.id] || pendingGoalPayloads.current.has(ctx.id)}
                                  onClick={() => setEditingGoalContextId(null)}
                                >
                                  Hủy
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Context error alert if any */}
                    {cardError && (
                      <div
                        id={`contextAlert-${ctx.id}`}
                        role="alert"
                        className="login-alert"
                        style={{ marginTop: '12px' }}
                      >
                        <span>{cardError.message}</span>
                        {cardError.status === 409 && (
                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{ marginLeft: '8px' }}
                            onClick={() => refresh()}
                          >
                            Tải lại
                          </button>
                        )}
                      </div>
                    )}

                    {/* Inline recovery form for null contexts */}
                    {recoveringContextId === ctx.id && (
                      <div
                        id={`startLevelSection-${ctx.id}`}
                        style={{
                          marginTop: '14px',
                          padding: '14px',
                          border: '1px solid var(--border-strong)',
                          borderRadius: '6px',
                          background: 'var(--surface-sunken)',
                        }}
                      >
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px' }}>
                          Chọn trình độ bắt đầu
                        </h3>
                        {isLoadingOptions && (
                          <p style={{ color: 'var(--text-muted)' }}>Đang tải danh sách trình độ...</p>
                        )}
                        {optionsError && (
                          <div id="optionsErrorAlert" role="alert" className="login-alert" style={{ marginBottom: '10px' }}>
                            <span>{optionsError}</span>
                            <button id="retryOptionsBtn" type="button" className="btn btn-outline" onClick={handleRetryOptions}>
                              Thử tải lại
                            </button>
                          </div>
                        )}
                        <div style={{ marginBottom: '10px' }}>
                          <label
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              cursor: 'pointer',
                              marginBottom: '6px',
                            }}
                          >
                            <input
                              type="radio"
                              name={`startSource-${ctx.id}`}
                              value="DEFAULT"
                              checked={recoveringSource === 'DEFAULT'}
                              onChange={() => setRecoveringSource('DEFAULT')}
                              disabled={isRecovering}
                            />
                            <span>Trình độ mặc định (bài học đầu tiên)</span>
                          </label>
                          <label
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              cursor: 'pointer',
                            }}
                          >
                            <input
                              type="radio"
                              name={`startSource-${ctx.id}`}
                              value="SELF_REPORT"
                              checked={recoveringSource === 'SELF_REPORT'}
                              onChange={() => setRecoveringSource('SELF_REPORT')}
                              disabled={isRecovering}
                            />
                            <span>Tự chọn trình độ</span>
                          </label>
                        </div>
                        {recoveringSource === 'SELF_REPORT' && (
                          <div style={{ marginBottom: '10px' }}>
                            <label
                              htmlFor={`startLevelSelect-${ctx.id}`}
                              style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}
                            >
                              Trình độ
                            </label>
                            <select
                              id={`startLevelSelect-${ctx.id}`}
                              className="form-control"
                              value={recoveringLevelId}
                              onChange={(e) => setRecoveringLevelId(e.target.value)}
                              disabled={isRecovering}
                            >
                              <option value="">-- Chọn trình độ --</option>
                              {(() => {
                                const lOpt = options?.languages.find(
                                  (l) => l.id === ctx.targetLanguage.id
                                );
                                const cOpt = lOpt?.courses.find((c) => c.id === ctx.course.id);
                                return (cOpt?.levels || []).map((lvl) => (
                                  <option key={lvl.id} value={lvl.id}>
                                    {lvl.code} - {getLocalizedText(lvl.label, uiLocale)}
                                  </option>
                                ));
                              })()}
                            </select>
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            id={`confirmStartLevelBtn-${ctx.id}`}
                            className="btn btn-primary"
                            onClick={() => handleConfirmStartLevel(ctx)}
                            disabled={isRecovering}
                          >
                            {isRecovering ? 'Đang lưu...' : 'Xác nhận trình độ'}
                          </button>
                          <button
                            type="button"
                            id={`cancelStartLevelBtn-${ctx.id}`}
                            className="btn btn-outline"
                            onClick={handleCancelStartLevel}
                            disabled={isRecovering}
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Actions: Pause / Resume + Enter course / Start level */}
                    <div
                      style={{
                        marginTop: '16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        {ctx.status === 'ACTIVE' ? (
                          <button
                            type="button"
                            id={`pauseBtn-${ctx.id}`}
                            className="btn btn-outline"
                            onClick={() => handlePause(ctx)}
                            disabled={isPending || isRecovering}
                          >
                            {isPending ? 'Đang tạm dừng...' : 'Tạm dừng'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            id={`resumeBtn-${ctx.id}`}
                            className="btn btn-outline"
                            onClick={() => handleResume(ctx)}
                            disabled={isPending || isRecovering}
                          >
                            {isPending ? 'Đang tiếp tục...' : 'Tiếp tục học'}
                          </button>
                        )}
                      </div>

                      {ctx.status === 'ACTIVE' && ctx.course.isActive && (
                        ctx.workingLevel ? (
                          <a
                            href={`/learn/${ctx.id}`}
                            id={`enterContextBtn-${ctx.id}`}
                            className="btn btn-primary"
                            style={{
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            Vào học
                          </a>
                        ) : recoveringContextId !== ctx.id ? (
                          <button
                            type="button"
                            id={`startLevelBtn-${ctx.id}`}
                            className="btn btn-primary"
                            onClick={() => handleOpenStartLevel(ctx)}
                            disabled={isPending || isRecovering}
                          >
                            Chọn trình độ bắt đầu
                          </button>
                        ) : null
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
    </details>
  );
}
