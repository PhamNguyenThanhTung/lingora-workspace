'use client';

import { useRef, useState, type PointerEvent } from 'react';
import type { CandidateStrokeInput } from '@lingora/lesson-content';

interface WritingSrsAttemptProps {
  characterNumber: number;
  characterCount: number;
  strokeCount: number;
  disabled: boolean;
  isSubmitting: boolean;
  onSubmit: (strokes: CandidateStrokeInput[]) => void;
}

type Point = [number, number];

const MAX_STROKES = 128;
const MIN_STROKE_POINTS = 2;
const MAX_STROKE_POINTS = 256;
const MAX_TOTAL_POINTS = 4096;

export function WritingSrsAttempt({
  characterNumber,
  characterCount,
  strokeCount,
  disabled,
  isSubmitting,
  onSubmit,
}: WritingSrsAttemptProps) {
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[] | null>(null);
  const strokesRef = useRef<Point[][]>([]);
  const currentStrokeRef = useRef<Point[] | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  function point(event: PointerEvent<SVGSVGElement>): Point {
    const bounds = event.currentTarget.getBoundingClientRect();
    const rawX = bounds.width > 0 ? (event.clientX - bounds.left) / bounds.width : 0;
    const rawY = bounds.height > 0 ? (event.clientY - bounds.top) / bounds.height : 0;
    const x = Number.isFinite(rawX) ? Math.max(0, Math.min(1, rawX)) : 0;
    const y = Number.isFinite(rawY) ? Math.max(0, Math.min(1, rawY)) : 0;
    return [Number(x.toFixed(5)), Number(y.toFixed(5))];
  }

  function startStroke(event: PointerEvent<SVGSVGElement>) {
    if (disabled || isSubmitting || event.button !== 0) return;
    if (strokesRef.current.length >= MAX_STROKES) return;
    const totalCommittedPoints = strokesRef.current.reduce((sum, s) => sum + s.length, 0);
    if (totalCommittedPoints >= MAX_TOTAL_POINTS) return;
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      // Ignore setPointerCapture failure on synthetic events
    }
    const pt = point(event);
    currentStrokeRef.current = [pt];
    setCurrentStroke([pt]);
  }

  function continueStroke(event: PointerEvent<SVGSVGElement>) {
    if (disabled || isSubmitting || !currentStrokeRef.current) return;
    if (currentStrokeRef.current.length >= MAX_STROKE_POINTS) return;
    const totalCommittedPoints = strokesRef.current.reduce((sum, s) => sum + s.length, 0);
    if (totalCommittedPoints + currentStrokeRef.current.length >= MAX_TOTAL_POINTS) return;
    const pt = point(event);
    currentStrokeRef.current.push(pt);
    setCurrentStroke([...currentStrokeRef.current]);
  }

  function finishStroke() {
    const committed = currentStrokeRef.current;
    currentStrokeRef.current = null;
    setCurrentStroke(null);
    if (committed && committed.length >= MIN_STROKE_POINTS) {
      if (strokesRef.current.length < MAX_STROKES) {
        strokesRef.current = [...strokesRef.current, committed];
        setStrokes(strokesRef.current);
      }
    }
  }

  function clearStrokes() {
    strokesRef.current = [];
    currentStrokeRef.current = null;
    setStrokes([]);
    setCurrentStroke(null);
  }

  const visibleStrokes = currentStroke ? [...strokes, currentStroke] : strokes;
  const candidateStrokes = strokes.map(points => ({ points: points as CandidateStrokeInput['points'] }));

  return (
    <section aria-label="Luyện viết từ vựng" style={{ width: '100%', maxWidth: '440px', margin: '0 auto' }}>
      <p role="status" style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '10px' }}>
        Ký tự {characterNumber}/{characterCount} · {strokeCount} nét · Viết theo nghĩa gợi ý
      </p>
      <svg
        ref={svgRef}
        id="srs-writing-canvas"
        role="img"
        aria-label={`Bảng viết ký tự ${characterNumber} trên ${characterCount}`}
        viewBox="0 0 1 1"
        onPointerDown={startStroke}
        onPointerMove={continueStroke}
        onPointerUp={finishStroke}
        onPointerCancel={finishStroke}
        style={{ width: '100%', aspectRatio: '1', background: 'var(--canvas-bg)', border: '1px solid var(--border-subtle)', borderRadius: '8px', touchAction: 'none', cursor: (disabled || isSubmitting) ? 'default' : 'crosshair' }}
      >
        {visibleStrokes.map((points, index) => (
          <polyline
            key={index}
            points={points.map(([x, y]) => `${x},${y}`).join(' ')}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.025"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>
      <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
        <button
          type="button"
          id="srs-writing-clear"
          className="btn btn-outline"
          onClick={clearStrokes}
          disabled={disabled || isSubmitting || (strokes.length === 0 && !currentStroke)}
        >
          Xóa nét
        </button>
        <button
          type="button"
          id="srs-writing-submit"
          className="btn btn-primary"
          onClick={() => onSubmit(candidateStrokes)}
          disabled={disabled || isSubmitting || candidateStrokes.length === 0}
          style={{ flex: 1, minHeight: '44px' }}
        >
          {isSubmitting ? 'Đang chấm...' : 'Gửi bài viết'}
        </button>
      </div>
    </section>
  );
}
