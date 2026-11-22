'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { LearnerStrokeTemplateDto } from '../../../../server/lessons/character-service.ts';

export type WritingPracticeStage = 'DEMO' | 'TRACE' | 'FREEHAND' | 'RESULT';

export interface WritingPracticeCharacter {
  characterId: string;
  blockKey?: string;
  lessonVocabularyLinkId?: string;
  glyph: string;
  scriptType?: string;
  strokeCount?: number;
  meaning?: string;
  primaryReading?: string;
  romanization?: string;
  showStrokeAnimation?: boolean;
  guidedWriting?: boolean;
}

export interface WritingPracticeModalProps {
  contextId: string;
  lessonId: string;
  expectedPublishedRevisionId?: string;
  character: WritingPracticeCharacter;
  initialStrokeData?: {
    strokeVersion?: number;
    strokes: LearnerStrokeTemplateDto[];
  };
  onClose: () => void;
}

interface AttemptResult {
  score: number;
  band: 'EXCELLENT' | 'FAIR' | 'POOR';
  passed: boolean;
  details: {
    strokeCount: {
      expected: number;
      actual: number;
      diff: number;
    };
    strokeFeedback: Array<{
      strokeIndex: number;
      score: number;
      directionInverted: boolean;
    }>;
  };
  isReplay?: boolean;
}

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function WritingPracticeModal({
  contextId,
  lessonId,
  expectedPublishedRevisionId,
  character,
  initialStrokeData,
  onClose,
}: WritingPracticeModalProps) {
  const canShowStrokeAnimation = character.showStrokeAnimation === true;
  const canGuidedWrite = character.guidedWriting === true;
  const [stage, setStage] = useState<WritingPracticeStage>(() =>
    canShowStrokeAnimation ? 'DEMO' : 'TRACE'
  );
  const [strokes, setStrokes] = useState<LearnerStrokeTemplateDto[]>(
    initialStrokeData?.strokes || []
  );
  const [isLoadingStrokes, setIsLoadingStrokes] = useState(!initialStrokeData);
  const [strokeError, setStrokeError] = useState<string | null>(null);

  // Session state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [sessionRequestId, setSessionRequestId] = useState<string>(() => generateUuid());
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const completionPendingRef = useRef(false);

  // Demo state
  const [demoStep, setDemoStep] = useState(1);
  const [isPlayingDemo, setIsPlayingDemo] = useState(canShowStrokeAnimation);

  // Trace state
  const [traceStrokes, setTraceStrokes] = useState<Array<Array<[number, number]>>>([]);

  // Freehand state
  const [freehandStrokes, setFreehandStrokes] = useState<Array<Array<[number, number]>>>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingLimitError, setDrawingLimitError] = useState<string | null>(null);
  const currentStrokeRef = useRef<Array<[number, number]>>([]);
  const failedCandidateStrokesRef = useRef<Array<{ points: Array<[number, number]> }> | null>(null);

  // Attempt & submission state
  const [currentOperationKey, setCurrentOperationKey] = useState<string>(() => generateUuid());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isInputRejected, setIsInputRejected] = useState(false);
  const [attemptResult, setAttemptResult] = useState<AttemptResult | null>(null);

  // Accessibility live message
  const [liveAnnouncement, setLiveAnnouncement] = useState('');

  // Canvas refs
  const traceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const freehandCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const comparisonCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  const MAX_STROKES = 128;
  const MAX_POINTS_PER_STROKE = 256;
  const MAX_TOTAL_POINTS = 4096;

  const totalStrokes = strokes.length > 0 ? strokes.length : character.strokeCount || 1;

  // 1. Fetch character stroke data if not supplied
  useEffect(() => {
    if (initialStrokeData) return;

    let isMounted = true;
    async function loadStrokes() {
      setIsLoadingStrokes(true);
      setStrokeError(null);
      try {
        const query = new URLSearchParams({
          contextId,
          lessonId,
        });
        if (character.blockKey) {
          query.set('blockKey', character.blockKey);
        } else if (character.lessonVocabularyLinkId) {
          query.set('lessonVocabularyLinkId', character.lessonVocabularyLinkId);
        }
        if (expectedPublishedRevisionId) {
          query.set('expectedPublishedRevisionId', expectedPublishedRevisionId);
        }

        const res = await fetch(`/api/characters/${character.characterId}?${query.toString()}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error?.message || 'Không thể tải dữ liệu nét chữ.');
        }
        const data = await res.json();
        if (isMounted) {
          if (Array.isArray(data.data?.strokes) && data.data.strokes.length > 0) {
            setStrokes(data.data.strokes);
          } else {
            setStrokes([]);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setStrokeError(err.message || 'Lỗi kết nối khi tải nét chữ.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingStrokes(false);
        }
      }
    }

    loadStrokes();
    return () => {
      isMounted = false;
    };
  }, [contextId, lessonId, character, expectedPublishedRevisionId, initialStrokeData]);

  // 2. Start writing session on mount or demand
  const ensureSession = useCallback(async (): Promise<string> => {
    if (sessionId) return sessionId;
    if (!expectedPublishedRevisionId) {
      throw new Error('Không xác định được phiên bản bài học. Vui lòng tải lại bài học.');
    }

    const payload: Record<string, any> = {
      contextId,
      lessonId,
      expectedPublishedRevisionId,
      requestId: sessionRequestId,
    };
    if (character.lessonVocabularyLinkId) payload.characterId = character.characterId;
    if (character.blockKey) payload.blockKey = character.blockKey;
    if (character.lessonVocabularyLinkId) payload.lessonVocabularyLinkId = character.lessonVocabularyLinkId;

    const res = await fetch('/api/writing/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: window.location.origin,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Không thể tạo phiên luyện viết.');
    }

    const resJson = await res.json();
    const createdSessionId = resJson.data.sessionId || resJson.data.id;
    setSessionId(createdSessionId);
    return createdSessionId;
  }, [sessionId, sessionRequestId, contextId, lessonId, character, expectedPublishedRevisionId]);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusTimer = window.setTimeout(() => {
      document.getElementById('closePracticeModalBtn')?.focus();
    }, 0);
    return () => {
      window.clearTimeout(focusTimer);
      previousFocus?.focus();
    };
  }, []);

  // 3. Demo stage animation loop
  useEffect(() => {
    if (!canShowStrokeAnimation || stage !== 'DEMO' || !isPlayingDemo || strokes.length === 0) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setDemoStep(strokes.length);
      setIsPlayingDemo(false);
      return;
    }

    const timer = setInterval(() => {
      setDemoStep((prev) => {
        if (prev >= strokes.length) {
          return 1;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [canShowStrokeAnimation, stage, isPlayingDemo, strokes.length]);

  // 4. Keyboard navigation (Space, Enter, Escape, Ctrl+Z)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (e.key === 'Tab' && focusable?.length) {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
        return;
      }

      const target = e.target instanceof HTMLElement ? e.target : null;
      if (target?.closest('button, input, select, textarea, a, [contenteditable="true"]')) return;

      if (e.key === ' ' && canShowStrokeAnimation && stage === 'DEMO') {
        e.preventDefault();
        setIsPlayingDemo((prev) => !prev);
      } else if (e.key === 'Enter') {
        if (stage === 'DEMO' && canGuidedWrite) {
          e.preventDefault();
          setStage('TRACE');
        } else if (stage === 'TRACE' && canGuidedWrite) {
          e.preventDefault();
          setStage('FREEHAND');
        } else if (stage === 'FREEHAND' && canGuidedWrite && freehandStrokes.length > 0 && !isSubmitting && !isInputRejected) {
          e.preventDefault();
          handleSubmitAttempt();
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (stage === 'FREEHAND') {
          handleUndoFreehand();
        } else if (stage === 'TRACE') {
          handleUndoTrace();
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stage, freehandStrokes.length, isSubmitting, submitError, isInputRejected, onClose, canShowStrokeAnimation, canGuidedWrite]);

  // Update live announcement on stage change
  useEffect(() => {
    if (stage === 'DEMO') {
      setLiveAnnouncement(`Đang xem thứ tự nét của ký tự ${character.glyph}.`);
    } else if (stage === 'TRACE') {
      setLiveAnnouncement(`Chuyển sang màn đồ nét theo mẫu. Hãy tô từng nét.`);
    } else if (stage === 'FREEHAND') {
      setLiveAnnouncement(`Chuyển sang màn tự viết. Vẽ các nét trong khung.`);
    } else if (stage === 'RESULT' && attemptResult) {
      setLiveAnnouncement(
        `Kết quả chấm: ${attemptResult.score} điểm, xếp loại ${attemptResult.band}.`
      );
    }
  }, [stage, attemptResult, character.glyph]);

  // 5. Canvas Drawing Helpers
  const redrawCanvas = (
    canvas: HTMLCanvasElement | null,
    strokeList: Array<Array<[number, number]>>,
    options: {
      color?: string;
      lineWidth?: number;
      showGrid?: boolean;
    } = {}
  ) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Draw 2x2 grid if requested
    if (options.showGrid) {
      ctx.save();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);

      // Center horizontal line
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Center vertical line
      ctx.beginPath();
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width / 2, height);
      ctx.stroke();

      // Border outline
      ctx.setLineDash([]);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, width - 2, height - 2);
      ctx.restore();
    }

    // Draw user strokes
    ctx.save();
    ctx.strokeStyle = options.color || '#2563eb';
    ctx.lineWidth = options.lineWidth || 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const stroke of strokeList) {
      if (stroke.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0][0] * width, stroke[0][1] * height);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i][0] * width, stroke[i][1] * height);
      }
      ctx.stroke();
    }
    ctx.restore();
  };

  // Trace Canvas Pointer Events
  const handleTracePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = traceCanvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    const rect = canvas.getBoundingClientRect();
    const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    currentStrokeRef.current = [[Number(nx.toFixed(4)), Number(ny.toFixed(4))]];
    setIsDrawing(true);
  };

  const resumeAfterRejectedInput = () => {
    if (!isInputRejected) return;
    setIsInputRejected(false);
    setSubmitError(null);
    setCurrentOperationKey(generateUuid());
  };

  const handleTracePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = traceCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    currentStrokeRef.current.push([Number(nx.toFixed(4)), Number(ny.toFixed(4))]);

    // Live redraw
    redrawCanvas(canvas, [...traceStrokes, currentStrokeRef.current], {
      color: '#2563eb',
      lineWidth: 8,
    });
  };

  const handleTracePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentStrokeRef.current.length >= 2) {
      const updated = [...traceStrokes, currentStrokeRef.current];
      setTraceStrokes(updated);
      redrawCanvas(traceCanvasRef.current, updated, {
        color: '#2563eb',
        lineWidth: 8,
      });
      setLiveAnnouncement(`Đã đồ nét ${updated.length} trên ${totalStrokes}`);
    }
    currentStrokeRef.current = [];
  };

  const handleUndoTrace = () => {
    const nextStrokes = traceStrokes.slice(0, -1);
    setTraceStrokes(nextStrokes);
    redrawCanvas(traceCanvasRef.current, nextStrokes, {
      color: '#2563eb',
      lineWidth: 8,
    });
  };

  const handleResetTrace = () => {
    setTraceStrokes([]);
    redrawCanvas(traceCanvasRef.current, [], {
      color: '#2563eb',
      lineWidth: 8,
    });
  };

  // Freehand Canvas Pointer Events
  const handleFreehandPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if ((submitError && !isInputRejected) || (failedCandidateStrokesRef.current && !isInputRejected)) return;
    const canvas = freehandCanvasRef.current;
    if (!canvas) return;
    if (freehandStrokes.length >= MAX_STROKES) {
      setDrawingLimitError(`Chỉ được gửi tối đa ${MAX_STROKES} nét.`);
      return;
    }
    const existingPointCount = freehandStrokes.reduce((sum, stroke) => sum + stroke.length, 0);
    if (existingPointCount >= MAX_TOTAL_POINTS) {
      setDrawingLimitError(`Bài vẽ đã đạt giới hạn ${MAX_TOTAL_POINTS} điểm.`);
      return;
    }
    canvas.setPointerCapture(e.pointerId);
    const rect = canvas.getBoundingClientRect();
    const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    currentStrokeRef.current = [[Number(nx.toFixed(4)), Number(ny.toFixed(4))]];
    setIsDrawing(true);
  };

  const handleFreehandPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || (submitError && !isInputRejected) || (failedCandidateStrokesRef.current && !isInputRejected)) return;
    const canvas = freehandCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const existingPointCount = freehandStrokes.reduce((sum, stroke) => sum + stroke.length, 0);
    if (currentStrokeRef.current.length >= MAX_POINTS_PER_STROKE || existingPointCount + currentStrokeRef.current.length >= MAX_TOTAL_POINTS) {
      setDrawingLimitError('Bài vẽ đã đạt giới hạn điểm; hãy hoàn tất hoặc xóa nét hiện tại.');
      return;
    }
    currentStrokeRef.current.push([Number(nx.toFixed(4)), Number(ny.toFixed(4))]);

    // Live redraw
    redrawCanvas(canvas, [...freehandStrokes, currentStrokeRef.current], {
      color: '#1e293b',
      lineWidth: 8,
      showGrid: true,
    });
  };

  const handleFreehandPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentStrokeRef.current.length >= 2) {
      resumeAfterRejectedInput();
      const updated = [...freehandStrokes, currentStrokeRef.current];
      setFreehandStrokes(updated);
      redrawCanvas(freehandCanvasRef.current, updated, {
        color: '#1e293b',
        lineWidth: 8,
        showGrid: true,
      });
      setLiveAnnouncement(`Đã viết nét ${updated.length}`);
    }
    currentStrokeRef.current = [];
  };

  const handleUndoFreehand = () => {
    if ((submitError && !isInputRejected) || (failedCandidateStrokesRef.current && !isInputRejected)) return;
    resumeAfterRejectedInput();
    const nextStrokes = freehandStrokes.slice(0, -1);
    setFreehandStrokes(nextStrokes);
    redrawCanvas(freehandCanvasRef.current, nextStrokes, {
      color: '#1e293b',
      lineWidth: 8,
      showGrid: true,
    });
  };

  const handleResetFreehand = () => {
    if ((submitError && !isInputRejected) || (failedCandidateStrokesRef.current && !isInputRejected)) return;
    resumeAfterRejectedInput();
    setFreehandStrokes([]);
    setDrawingLimitError(null);
    redrawCanvas(freehandCanvasRef.current, [], {
      color: '#1e293b',
      lineWidth: 8,
      showGrid: true,
    });
  };

  // Sync canvas redraw on stage switch
  useEffect(() => {
    if (stage === 'FREEHAND' && freehandCanvasRef.current) {
      redrawCanvas(freehandCanvasRef.current, freehandStrokes, {
        color: '#1e293b',
        lineWidth: 8,
        showGrid: true,
      });
    } else if (stage === 'TRACE' && traceCanvasRef.current) {
      redrawCanvas(traceCanvasRef.current, traceStrokes, {
        color: '#2563eb',
        lineWidth: 8,
      });
    } else if (stage === 'RESULT' && comparisonCanvasRef.current) {
      drawComparisonCanvas();
    }
  }, [stage]);

  // Comparison canvas rendering
  const drawComparisonCanvas = () => {
    const canvas = comparisonCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // 1. Grid
    ctx.save();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();
    ctx.restore();

    // 2. Official template strokes (dashed green)
    ctx.save();
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash([8, 8]);
    ctx.globalAlpha = 0.75;

    for (const stroke of strokes) {
      const pts = stroke.points;
      if (Array.isArray(pts) && pts.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(pts[0][0] * width, pts[0][1] * height);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i][0] * width, pts[i][1] * height);
        }
        ctx.stroke();
      }
    }
    ctx.restore();

    // 3. Learner freehand strokes (solid blue)
    ctx.save();
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const stroke of freehandStrokes) {
      if (stroke.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0][0] * width, stroke[0][1] * height);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i][0] * width, stroke[i][1] * height);
      }
      ctx.stroke();
    }
    ctx.restore();
  };

  // 6. Submit Attempt
  const handleSubmitAttempt = async () => {
    if (!failedCandidateStrokesRef.current && freehandStrokes.length === 0) {
      setSubmitError('Vui lòng vẽ ít nhất một nét trước khi gửi chấm điểm.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const activeSessionId = await ensureSession();

      const candidateStrokes = failedCandidateStrokesRef.current || freehandStrokes.map((pts) => ({ points: [...pts] }));
      failedCandidateStrokesRef.current = candidateStrokes;

      const res = await fetch(`/api/writing/sessions/${activeSessionId}/attempts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: window.location.origin,
        },
        body: JSON.stringify({
          operationKey: currentOperationKey,
          candidateStrokes,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        if (res.status === 400 && errJson.error?.code === 'INVALID_STROKE_GEOMETRY') {
          failedCandidateStrokesRef.current = null;
          setIsInputRejected(true);
        }
        throw new Error(errJson.error?.message || 'Không thể chấm điểm nét vẽ.');
      }

      const resJson = await res.json();
      setAttemptResult(resJson.data);
      setStage('RESULT');
    } catch (err: any) {
      setSubmitError(err.message || 'Lỗi gửi bài làm. Bạn có thể nhấn Thử lại gửi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 7. Complete Session
  const handleCompleteSession = async () => {
    if (!sessionId || completionPendingRef.current || sessionCompleted) return;
    completionPendingRef.current = true;
    setIsCompleting(true);
    setCompleteError(null);
    try {
      const res = await fetch(`/api/writing/sessions/${sessionId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: window.location.origin,
        },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || 'Không thể hoàn thành phiên luyện viết.');
      }
      setSessionCompleted(true);
      setLiveAnnouncement('Phiên luyện viết đã được ghi nhận hoàn thành!');
    } catch (err: any) {
      setCompleteError(err.message || 'Không thể hoàn thành phiên luyện viết. Vui lòng thử lại.');
    } finally {
      completionPendingRef.current = false;
      setIsCompleting(false);
    }
  };

  // 8. Retry Practice (writes again with new operationKey)
  const handleRetryPractice = () => {
    if (completionPendingRef.current || isCompleting || completeError) return;
    setCurrentOperationKey(generateUuid());
    failedCandidateStrokesRef.current = null;
    setFreehandStrokes([]);
    setDrawingLimitError(null);
    setAttemptResult(null);
    setSubmitError(null);
    setIsInputRejected(false);
    setCompleteError(null);
    if (sessionCompleted) {
      setSessionId(null);
      setSessionRequestId(generateUuid());
      setSessionCompleted(false);
    }
    setStage('FREEHAND');
  };

  const viewBox = '0 0 1 1';

  return (
    <div
      id="writingPracticeModal"
      className="writing-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="writing-practice-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
    >
      <div
        className="writing-modal-card"
        ref={modalRef}
        tabIndex={-1}
        style={{
          backgroundColor: 'var(--surface-bg, #ffffff)',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* ARIA Live Region */}
        <div
          id="practice-aria-live"
          role="status"
          aria-live="polite"
          style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0 0 0 0)' }}
        >
          {liveAnnouncement}
        </div>

        {/* Modal Header */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle, #f1f5f9)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                fontSize: '28px',
                fontWeight: 700,
                lineHeight: 1,
                fontFamily: 'serif',
                color: 'var(--text-main, #0f172a)',
              }}
            >
              {character.glyph}
            </span>
            <div>
              <h2
                id="writing-practice-title"
                style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--text-main, #0f172a)' }}
              >
                {canGuidedWrite ? 'Luyện viết' : 'Xem thứ tự nét'} {character.scriptType ? `(${character.scriptType})` : ''}
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>
                {character.meaning ? `Nghĩa: ${character.meaning}` : `${totalStrokes} nét`}
                {character.primaryReading ? ` • ${character.primaryReading}` : ''}
              </span>
            </div>
          </div>

          <button
            type="button"
            id="closePracticeModalBtn"
            onClick={onClose}
            className="btn btn-outline"
            style={{ padding: '4px 10px', fontSize: '16px', lineHeight: 1 }}
            aria-label="Đóng màn luyện viết"
          >
            ✕
          </button>
        </header>

        {/* Stage Navigation Tabs */}
        <nav
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-subtle, #f1f5f9)',
            backgroundColor: '#f8fafc',
          }}
        >
          {canShowStrokeAnimation && (
            <button
              type="button"
              id="tab-demo"
              onClick={() => setStage('DEMO')}
              style={{
                flex: 1,
                padding: '10px 4px',
                border: 'none',
                background: 'none',
                fontWeight: stage === 'DEMO' ? 700 : 500,
                color: stage === 'DEMO' ? 'var(--primary-color, #2563eb)' : '#64748b',
                borderBottom: stage === 'DEMO' ? '2px solid var(--primary-color, #2563eb)' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              1. Xem mẫu
            </button>
          )}
          {canGuidedWrite && (
            <>
              <button
                type="button"
                id="tab-trace"
                onClick={() => setStage('TRACE')}
                style={{
                  flex: 1,
                  padding: '10px 4px',
                  border: 'none',
                  background: 'none',
                  fontWeight: stage === 'TRACE' ? 700 : 500,
                  color: stage === 'TRACE' ? 'var(--primary-color, #2563eb)' : '#64748b',
                  borderBottom: stage === 'TRACE' ? '2px solid var(--primary-color, #2563eb)' : '2px solid transparent',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                {canShowStrokeAnimation ? '2' : '1'}. Đồ nét
              </button>
              <button
                type="button"
                id="tab-freehand"
                onClick={() => setStage('FREEHAND')}
                style={{
                  flex: 1,
                  padding: '10px 4px',
                  border: 'none',
                  background: 'none',
                  fontWeight: stage === 'FREEHAND' ? 700 : 500,
                  color: stage === 'FREEHAND' ? 'var(--primary-color, #2563eb)' : '#64748b',
                  borderBottom: stage === 'FREEHAND' ? '2px solid var(--primary-color, #2563eb)' : '2px solid transparent',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                {canShowStrokeAnimation ? '3' : '2'}. Tự viết
              </button>
              <button
                type="button"
                id="tab-result"
                onClick={() => {
                  if (attemptResult) setStage('RESULT');
                }}
                disabled={!attemptResult}
                style={{
                  flex: 1,
                  padding: '10px 4px',
                  border: 'none',
                  background: 'none',
                  fontWeight: stage === 'RESULT' ? 700 : 500,
                  color: stage === 'RESULT' ? 'var(--primary-color, #2563eb)' : '#64748b',
                  borderBottom: stage === 'RESULT' ? '2px solid var(--primary-color, #2563eb)' : '2px solid transparent',
                  cursor: attemptResult ? 'pointer' : 'not-allowed',
                  opacity: attemptResult ? 1 : 0.5,
                  fontSize: '13px',
                }}
              >
                {canShowStrokeAnimation ? '4' : '3'}. Kết quả
              </button>
            </>
          )}
        </nav>

        {/* Modal Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {isLoadingStrokes && (
            <div id="strokes-loading" style={{ padding: '40px', color: '#64748b' }}>
              Đang tải dữ liệu nét chữ...
            </div>
          )}

          {strokeError && (
            <div className="alert-box is-warning" style={{ margin: '16px 0', width: '100%' }}>
              <p className="alert-message">{strokeError}</p>
            </div>
          )}

          {/* STAGE 1: DEMO (Xem mẫu) */}
          {canShowStrokeAnimation && stage === 'DEMO' && !isLoadingStrokes && (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Canvas/SVG container */}
              <div
                style={{
                  width: 'min(320px, 100%)',
                  aspectRatio: '1 / 1',
                  height: 'auto',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  backgroundColor: '#ffffff',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.02)',
                }}
              >
                {/* 2x2 Dashed Grid */}
                <svg
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                  viewBox="0 0 100 100"
                >
                  <line x1="50" y1="0" x2="50" y2="100" stroke="#f1f5f9" strokeDasharray="3 3" strokeWidth="1" />
                  <line x1="0" y1="50" x2="100" y2="50" stroke="#f1f5f9" strokeDasharray="3 3" strokeWidth="1" />
                </svg>

                {/* SVG Stroke animation */}
                <svg
                  id="stroke-order-svg"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                  viewBox={viewBox}
                >
                  {strokes.map((s, idx) => {
                    const isPassed = idx < demoStep - 1;
                    const isCurrent = idx === demoStep - 1;
                    if (idx >= demoStep) return null;

                    const strokeColor = isCurrent ? '#2563eb' : '#334155';
                    const strokeWidth = 0.035;

                    return (
                      <path
                        key={`demo-stroke-${idx}`}
                        d={s.path}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    );
                  })}
                </svg>
              </div>

              {/* Progress Indicator */}
              <div style={{ marginTop: '14px', fontSize: '14px', fontWeight: 600, color: '#334155' }}>
                <span id="demo-step-counter">
                  Nét {Math.min(demoStep, totalStrokes)} / {totalStrokes}
                </span>
              </div>

              {/* Controls */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  marginTop: '16px',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}
              >
                <button
                  type="button"
                  id="demo-play-pause-btn"
                  className="btn btn-outline"
                  onClick={() => setIsPlayingDemo((prev) => !prev)}
                  style={{ fontSize: '13px' }}
                >
                  {isPlayingDemo ? 'Dừng' : 'Tiếp tục'}
                </button>
                <button
                  type="button"
                  id="demo-replay-btn"
                  className="btn btn-outline"
                  onClick={() => {
                    setDemoStep(1);
                    setIsPlayingDemo(true);
                  }}
                  style={{ fontSize: '13px' }}
                >
                  Xem lại
                </button>
                <button
                  type="button"
                  id="demo-prev-btn"
                  className="btn btn-outline"
                  onClick={() => {
                    setIsPlayingDemo(false);
                    setDemoStep((prev) => Math.max(1, prev - 1));
                  }}
                  disabled={demoStep <= 1}
                  style={{ fontSize: '13px' }}
                >
                  ← Nét trước
                </button>
                <button
                  type="button"
                  id="demo-next-btn"
                  className="btn btn-outline"
                  onClick={() => {
                    setIsPlayingDemo(false);
                    setDemoStep((prev) => Math.min(totalStrokes, prev + 1));
                  }}
                  disabled={demoStep >= totalStrokes}
                  style={{ fontSize: '13px' }}
                >
                  Nét sau →
                </button>
              </div>

              {canGuidedWrite && (
                <div style={{ marginTop: '20px', width: '100%', display: 'flex', justifyContent: 'center' }}>
                  <button
                    type="button"
                    id="demo-to-trace-btn"
                    className="btn btn-primary"
                    onClick={() => setStage('TRACE')}
                    style={{ width: '100%', maxWidth: '320px' }}
                  >
                    Bắt đầu đồ nét →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STAGE 2: TRACE (Đồ nét) */}
          {canGuidedWrite && stage === 'TRACE' && !isLoadingStrokes && (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Trace Canvas Container with ghost background */}
              <div
                style={{
                  width: 'min(320px, 100%)',
                  aspectRatio: '1 / 1',
                  height: 'auto',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  backgroundColor: '#ffffff',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Ghost SVG template in background */}
                <svg
                  id="trace-ghost-template"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0.28,
                    pointerEvents: 'none',
                  }}
                  viewBox={viewBox}
                >
                  {strokes.map((s, idx) => (
                    <path
                      key={`ghost-${idx}`}
                      d={s.path}
                      fill="none"
                      stroke="#475569"
                      strokeWidth={0.03}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ))}
                </svg>

                {/* Drawing Canvas */}
                <canvas
                  id="trace-canvas"
                  ref={traceCanvasRef}
                  width={320}
                  height={320}
                  onPointerDown={handleTracePointerDown}
                  onPointerMove={handleTracePointerMove}
                  onPointerUp={handleTracePointerUp}
                  onPointerCancel={handleTracePointerUp}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    touchAction: 'none',
                    cursor: 'crosshair',
                  }}
                />
              </div>

              {/* Progress counter */}
              <div style={{ marginTop: '12px', fontSize: '14px', fontWeight: 600, color: '#334155' }}>
                <span id="trace-stroke-progress">
                  Nét hiện tại: {traceStrokes.length} / {totalStrokes}
                </span>
              </div>

              {/* Trace Controls */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                <button
                  type="button"
                  id="trace-undo-btn"
                  className="btn btn-outline"
                  onClick={handleUndoTrace}
                  disabled={traceStrokes.length === 0}
                  style={{ fontSize: '13px' }}
                >
                  Hoàn tác
                </button>
                <button
                  type="button"
                  id="trace-reset-btn"
                  className="btn btn-outline"
                  onClick={handleResetTrace}
                  disabled={traceStrokes.length === 0}
                  style={{ fontSize: '13px' }}
                >
                  Xóa hết
                </button>
              </div>

              <div style={{ marginTop: '20px', width: '100%', display: 'flex', justifyContent: 'center' }}>
                <button
                  type="button"
                  id="trace-to-freehand-btn"
                  className="btn btn-primary"
                  onClick={() => setStage('FREEHAND')}
                  style={{ width: '100%', maxWidth: '320px' }}
                >
                  Tiếp tục: Tự viết →
                </button>
              </div>
            </div>
          )}

          {/* STAGE 3: FREEHAND (Tự viết) */}
          {canGuidedWrite && stage === 'FREEHAND' && !isLoadingStrokes && (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Canvas container: strictly NO ghost template */}
              <div
                style={{
                  width: 'min(320px, 100%)',
                  aspectRatio: '1 / 1',
                  height: 'auto',
                  borderRadius: '12px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
              <canvas
                  id="freehand-canvas"
                  ref={freehandCanvasRef}
                  width={320}
                  height={320}
                  onPointerDown={handleFreehandPointerDown}
                  onPointerMove={handleFreehandPointerMove}
                  onPointerUp={handleFreehandPointerUp}
                  onPointerCancel={handleFreehandPointerUp}
                  style={{
                    width: '100%',
                    height: '100%',
                    touchAction: 'none',
                    cursor: 'crosshair',
                    backgroundColor: '#ffffff',
                  }}
                />
              </div>

              {/* Stroke Count Display */}
              <div style={{ marginTop: '12px', fontSize: '14px', fontWeight: 600, color: '#334155' }}>
                <span id="freehand-stroke-count">
                  Đã viết: {freehandStrokes.length} nét (Mục tiêu: {totalStrokes} nét)
                </span>
              </div>

              {/* Error / Feedback Alert */}
              {submitError && (
                <div
                  id="submit-error-alert"
                  className="alert-box is-danger"
                  style={{ marginTop: '12px', width: '100%', padding: '12px 16px' }}
                  role="alert"
                >
                  <p className="alert-message" style={{ margin: 0, fontSize: '13px' }}>
                    {submitError}
                  </p>
                </div>
              )}
              {drawingLimitError && (
                <div className="alert-box is-warning" role="status" style={{ marginTop: '8px', width: '100%' }}>
                  <p className="alert-message" style={{ margin: 0, fontSize: '13px' }}>{drawingLimitError}</p>
                </div>
              )}

              {/* Freehand Controls */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                <button
                  type="button"
                  id="freehand-undo-btn"
                  className="btn btn-outline"
                  onClick={handleUndoFreehand}
                  disabled={freehandStrokes.length === 0 || isSubmitting || (Boolean(submitError) && !isInputRejected)}
                  style={{ fontSize: '13px' }}
                >
                  Hoàn tác
                </button>
                <button
                  type="button"
                  id="freehand-reset-btn"
                  className="btn btn-outline"
                  onClick={handleResetFreehand}
                  disabled={freehandStrokes.length === 0 || isSubmitting || (Boolean(submitError) && !isInputRejected)}
                  style={{ fontSize: '13px' }}
                >
                  Xóa hết
                </button>
              </div>

              {/* Submit Buttons */}
              <div style={{ marginTop: '20px', width: '100%', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                {submitError ? (
                  <button
                    type="button"
                    id="retry-submit-btn"
                    className="btn btn-primary"
                    onClick={handleSubmitAttempt}
                    disabled={isSubmitting || isInputRejected}
                    style={{ width: '100%', maxWidth: '320px' }}
                  >
                    {isSubmitting
                      ? 'Đang gửi lại...'
                      : isInputRejected
                      ? 'Sửa nét trước khi chấm lại'
                      : 'Thử lại gửi (cùng mã yêu cầu)'}
                  </button>
                ) : (
                  <button
                    type="button"
                    id="freehand-submit-btn"
                    className="btn btn-primary"
                    onClick={handleSubmitAttempt}
                    disabled={freehandStrokes.length === 0 || isSubmitting}
                    style={{ width: '100%', maxWidth: '320px' }}
                  >
                    {isSubmitting ? 'Đang chấm điểm...' : 'Chấm điểm'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STAGE 4: RESULT (Đối chiếu & Kết quả) */}
          {canGuidedWrite && stage === 'RESULT' && attemptResult && (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Score & Band Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  maxWidth: '360px',
                  marginBottom: '16px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor:
                    attemptResult.band === 'EXCELLENT'
                      ? '#dbeafe'
                      : attemptResult.band === 'FAIR'
                      ? '#fef3c7'
                      : '#fee2e2',
                }}
              >
                <div>
                  <span style={{ fontSize: '13px', color: '#475569', display: 'block' }}>
                    Điểm số bài viết:
                  </span>
                  <strong id="attempt-score" style={{ fontSize: '24px', color: '#0f172a' }}>
                    {attemptResult.score} / 100
                  </strong>
                </div>

                <span
                  id="attempt-band-badge"
                  className="badge"
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    padding: '4px 12px',
                    borderRadius: '6px',
                    backgroundColor:
                      attemptResult.band === 'EXCELLENT'
                        ? '#1E40AF'
                        : attemptResult.band === 'FAIR'
                        ? '#92400e'
                        : '#991b1b',
                    color: '#ffffff',
                  }}
                >
                  {attemptResult.band === 'EXCELLENT'
                    ? 'Đạt'
                    : attemptResult.band === 'FAIR'
                    ? 'Gần đúng'
                    : 'Cần luyện tập thêm'}
                </span>
              </div>

              {/* Comparison Canvas */}
              <div
                style={{
                  width: 'min(320px, 100%)',
                  aspectRatio: '1 / 1',
                  height: 'auto',
                  borderRadius: '12px',
                  position: 'relative',
                  overflow: 'hidden',
                  border: '2px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                }}
              >
                  <canvas
                  id="comparison-canvas"
                  ref={comparisonCanvasRef}
                  width={320}
                  height={320}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>

              {Array.isArray(attemptResult.details.strokeFeedback) && attemptResult.details.strokeFeedback.length > 0 && (
                <ul
                  className="writing-stroke-feedback"
                  aria-label="Nhận xét theo từng nét"
                  style={{ width: '100%', maxWidth: '320px', margin: '12px 0 0', paddingLeft: '22px' }}
                >
                  {attemptResult.details.strokeFeedback.map((stroke) => (
                    <li key={stroke.strokeIndex}>
                      Nét {stroke.strokeIndex}: {stroke.score}/100
                      {stroke.directionInverted ? ' · hướng nét bị đảo' : ''}
                    </li>
                  ))}
                </ul>
              )}

              {/* Comparison Legend */}
              <div
                style={{
                  display: 'flex',
                  gap: '16px',
                  marginTop: '10px',
                  fontSize: '12px',
                  color: '#475569',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '12px', height: '12px', backgroundColor: '#2563eb', borderRadius: '2px' }} />
                  Nét bạn vẽ
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span
                    style={{
                      width: '12px',
                      height: '12px',
                      border: '2px dashed #2563eb',
                      borderRadius: '2px',
                    }}
                  />
                  Mẫu chuẩn
                </span>
              </div>

              {/* Session completed notice */}
              {completeError && (
                <div role="alert" className="alert-box is-danger" style={{ marginTop: '14px', width: '100%' }}>
                  <p className="alert-message" style={{ margin: 0 }}>{completeError}</p>
                </div>
              )}
              {sessionCompleted && (
                <div
                  id="session-completed-notice"
                  style={{
                    marginTop: '14px',
                    padding: '8px 16px',
                    backgroundColor: '#dbeafe',
                    color: '#1E40AF',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  ✓ Đã hoàn thành phiên luyện viết!
                </div>
              )}

              {/* Action buttons */}
              <div
                style={{
                  marginTop: '20px',
                  display: 'flex',
                  gap: '10px',
                  width: '100%',
                  maxWidth: '360px',
                  justifyContent: 'center',
                }}
              >
                <button
                  type="button"
                  id="retry-practice-btn"
                  className="btn btn-outline"
                  onClick={handleRetryPractice}
                  disabled={isCompleting || Boolean(completeError)}
                  style={{ flex: 1, fontSize: '13px' }}
                >
                  Viết lại
                </button>

                {!sessionCompleted ? (
                  <button
                    type="button"
                    id="complete-session-btn"
                    className="btn btn-primary"
                    onClick={handleCompleteSession}
                    disabled={isCompleting}
                    style={{ flex: 1, fontSize: '13px' }}
                  >
                    {isCompleting ? 'Đang hoàn thành...' : 'Hoàn thành'}
                  </button>
                ) : (
                  <button
                    type="button"
                    id="close-completed-btn"
                    className="btn btn-primary"
                    onClick={onClose}
                    style={{ flex: 1, fontSize: '13px' }}
                  >
                    Đóng
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
