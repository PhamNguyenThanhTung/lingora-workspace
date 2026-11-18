/**
 * Pure deterministic stroke grading engine for Lingora script learning.
 *
 * Evaluates candidate student strokes against authoritative template strokes.
 * Produces an integer score in [0, 100] and maps to three bands:
 * - EXCELLENT: score >= 75 (PASS)
 * - FAIR: 50 <= score < 75
 * - POOR: score < 50 (RETRY)
 *
 * Penalizes missing/extra strokes, inverted stroke direction, inverted stroke order,
 * and invalid/corrupt coordinates.
 */

export type GradeBand = 'EXCELLENT' | 'FAIR' | 'POOR';

export type StrokePoint = [number, number];

export interface CandidateStrokeInput {
  points: StrokePoint[];
}

export interface TemplateStrokeInput {
  index: number;
  points: StrokePoint[];
  start?: StrokePoint;
  end?: StrokePoint;
  path?: string;
}

export interface StrokeGraderInput {
  candidateStrokes: CandidateStrokeInput[];
  templateStrokes: TemplateStrokeInput[];
}

export interface IndividualStrokeScore {
  strokeIndex: number;
  score: number;
  directionScore: number;
  shapeScore: number;
  startDistance: number;
  endDistance: number;
  meanDistance: number;
  directionCosine: number;
  isDirectionInverted: boolean;
}

export interface StrokeGraderResult {
  score: number;
  band: GradeBand;
  passed: boolean;
  details: {
    strokeCountScore: number;
    orderScore: number;
    directionScore: number;
    shapeScore: number;
    strokeCount: {
      expected: number;
      actual: number;
      diff: number;
    };
    strokeScores: IndividualStrokeScore[];
    errors: string[];
  };
}

const RESAMPLE_POINTS = 32;
const MAX_SHAPE_DISTANCE = 0.25;

/**
 * Validates a single point coordinate tuple [x, y].
 * Must strictly be an array of exactly 2 finite numbers in [0, 1].
 * Returns error string if invalid, or null if valid.
 */
function validatePoint(p: unknown): string | null {
  if (!Array.isArray(p) || p.length !== 2) {
    return 'Tọa độ điểm nét phải là mảng gồm đúng 2 phần tử [x, y]';
  }
  const [x, y] = p;
  if (typeof x !== 'number' || !Number.isFinite(x) || Number.isNaN(x)) {
    return typeof x === 'number'
      ? `Tọa độ x không hợp lệ: ${x}`
      : 'Tọa độ x không hợp lệ: giá trị phải là số.';
  }
  if (typeof y !== 'number' || !Number.isFinite(y) || Number.isNaN(y)) {
    return typeof y === 'number'
      ? `Tọa độ y không hợp lệ: ${y}`
      : 'Tọa độ y không hợp lệ: giá trị phải là số.';
  }
  if (x < 0 || x > 1) {
    return `Tọa độ x nằm ngoài phạm vi [0, 1]: ${x}`;
  }
  if (y < 0 || y > 1) {
    return `Tọa độ y nằm ngoài phạm vi [0, 1]: ${y}`;
  }
  return null;
}

/**
 * Computes Euclidean distance between two points.
 */
function distance(p1: StrokePoint, p2: StrokePoint): number {
  const dx = p1[0] - p2[0];
  const dy = p1[1] - p2[1];
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Computes total arc length of a polyline stroke.
 */
function computeStrokeLength(points: StrokePoint[]): number {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    len += distance(points[i - 1], points[i]);
  }
  return len;
}

/**
 * Normalizes an entire set of strokes (candidate or template) using uniform scale
 * and translation derived from the whole-character bounding box across all strokes.
 *
 * Preserves relative position, direction, order, and scale between strokes.
 * Does not normalize stroke-by-stroke, rotate, or stretch/compress x and y independently.
 */
function normalizeStrokeSet<T extends { points: StrokePoint[] }>(strokes: T[]): T[] {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const s of strokes) {
    for (const [x, y] of s.points) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  const width = maxX - minX;
  const height = maxY - minY;
  const boxSize = Math.max(width, height);

  if (boxSize <= 0) {
    return strokes;
  }

  const scale = 1 / boxSize;
  const offsetX = (1 - width * scale) / 2;
  const offsetY = (1 - height * scale) / 2;

  return strokes.map((s) => ({
    ...s,
    points: s.points.map(([x, y]) => [
      Number(((x - minX) * scale + offsetX).toFixed(5)),
      Number(((y - minY) * scale + offsetY).toFixed(5)),
    ]) as StrokePoint[],
  }));
}

/**
 * Resamples a polyline curve into N equidistant points along its arc length.
 */
function resampleStroke(points: StrokePoint[], targetCount = RESAMPLE_POINTS): StrokePoint[] {
  if (points.length === 0) {
    return [];
  }
  if (points.length === 1) {
    return Array.from({ length: targetCount }, () => [points[0][0], points[0][1]]);
  }

  // 1. Calculate cumulative arc lengths
  const cumulativeLengths: number[] = [0];
  for (let i = 1; i < points.length; i++) {
    const segLen = distance(points[i - 1], points[i]);
    cumulativeLengths.push(cumulativeLengths[i - 1] + segLen);
  }

  const totalLength = cumulativeLengths[cumulativeLengths.length - 1];
  if (totalLength === 0) {
    return Array.from({ length: targetCount }, () => [points[0][0], points[0][1]]);
  }

  // 2. Resample at uniform intervals
  const resampled: StrokePoint[] = [];
  const step = totalLength / (targetCount - 1);

  let currentSeg = 0;
  for (let i = 0; i < targetCount; i++) {
    const targetDist = i * step;

    while (currentSeg < points.length - 2 && cumulativeLengths[currentSeg + 1] < targetDist) {
      currentSeg++;
    }

    const segStartDist = cumulativeLengths[currentSeg];
    const segEndDist = cumulativeLengths[currentSeg + 1];
    const segLen = segEndDist - segStartDist;

    if (segLen === 0) {
      resampled.push([points[currentSeg][0], points[currentSeg][1]]);
    } else {
      const t = (targetDist - segStartDist) / segLen;
      const x = points[currentSeg][0] + t * (points[currentSeg + 1][0] - points[currentSeg][0]);
      const y = points[currentSeg][1] + t * (points[currentSeg + 1][1] - points[currentSeg][1]);
      resampled.push([Number(x.toFixed(5)), Number(y.toFixed(5))]);
    }
  }

  return resampled;
}

/**
 * Evaluates direction vector alignment between candidate and template strokes.
 */
function evaluateDirection(candidate: StrokePoint[], template: StrokePoint[]): {
  directionScore: number;
  cosine: number;
  isInverted: boolean;
} {
  const cStart = candidate[0];
  const cEnd = candidate[candidate.length - 1];
  const tStart = template[0];
  const tEnd = template[template.length - 1];

  let cVec = [cEnd[0] - cStart[0], cEnd[1] - cStart[1]];
  let tVec = [tEnd[0] - tStart[0], tEnd[1] - tStart[1]];

  let cLen = Math.sqrt(cVec[0] * cVec[0] + cVec[1] * cVec[1]);
  let tLen = Math.sqrt(tVec[0] * tVec[0] + tVec[1] * tVec[1]);

  // For closed loops where start and end points coincide (or near coincident)
  if (cLen < 0.01 && tLen < 0.01) {
    const cMid = candidate[Math.floor(candidate.length / 2)];
    const tMid = template[Math.floor(template.length / 2)];
    cVec = [cMid[0] - cStart[0], cMid[1] - cStart[1]];
    tVec = [tMid[0] - tStart[0], tMid[1] - tStart[1]];
    cLen = Math.sqrt(cVec[0] * cVec[0] + cVec[1] * cVec[1]);
    tLen = Math.sqrt(tVec[0] * tVec[0] + tVec[1] * tVec[1]);
  }

  // If either stroke has near-zero net vector
  if (cLen < 0.01 || tLen < 0.01) {
    const d = distance(cStart, tStart);
    const score = Math.max(0, 100 * (1 - d / 0.2));
    return { directionScore: score, cosine: 1.0, isInverted: false };
  }

  // Normalized dot product = cosine of angle between directions
  const dot = cVec[0] * tVec[0] + cVec[1] * tVec[1];
  const cosine = Math.max(-1, Math.min(1, dot / (cLen * tLen)));

  if (cosine < 0) {
    // Inverted direction!
    return { directionScore: 0, cosine, isInverted: true };
  }

  // Linear scaling from cos 0..1 to 0..100
  const score = Math.max(0, Math.min(100, cosine * 100));
  return { directionScore: score, cosine, isInverted: false };
}

/**
 * Evaluates shape trajectory distance between resampled candidate and template curves.
 */
function evaluateShape(resampledCand: StrokePoint[], resampledTpl: StrokePoint[]): {
  shapeScore: number;
  meanDistance: number;
  startDistance: number;
  endDistance: number;
} {
  const count = Math.min(resampledCand.length, resampledTpl.length);
  if (count === 0) {
    return { shapeScore: 0, meanDistance: 1.0, startDistance: 1.0, endDistance: 1.0 };
  }

  let totalDist = 0;
  for (let i = 0; i < count; i++) {
    totalDist += distance(resampledCand[i], resampledTpl[i]);
  }
  const meanDistance = totalDist / count;
  const startDistance = distance(resampledCand[0], resampledTpl[0]);
  const endDistance = distance(resampledCand[count - 1], resampledTpl[count - 1]);

  // Combined distance gives weight to endpoints and overall trajectory
  const combinedDistance = 0.5 * meanDistance + 0.25 * startDistance + 0.25 * endDistance;
  const shapeScore = Math.max(0, Math.min(100, 100 * (1 - combinedDistance / MAX_SHAPE_DISTANCE)));

  return {
    shapeScore,
    meanDistance: Number(meanDistance.toFixed(5)),
    startDistance: Number(startDistance.toFixed(5)),
    endDistance: Number(endDistance.toFixed(5)),
  };
}

/**
 * Evaluates a single candidate stroke against a template stroke.
 */
function gradeSingleStrokePair(
  candidatePoints: StrokePoint[],
  templatePoints: StrokePoint[],
  strokeIndex: number
): IndividualStrokeScore {
  const resampledCand = resampleStroke(candidatePoints);
  const resampledTpl = resampleStroke(templatePoints);

  const dir = evaluateDirection(resampledCand, resampledTpl);
  const shape = evaluateShape(resampledCand, resampledTpl);

  // If direction is inverted, stroke score cannot exceed 20
  let strokeScore = 0.6 * shape.shapeScore + 0.4 * dir.directionScore;
  if (dir.isInverted) {
    strokeScore = Math.min(20, strokeScore * 0.2);
  }

  return {
    strokeIndex,
    score: Number(strokeScore.toFixed(2)),
    directionScore: Number(dir.directionScore.toFixed(2)),
    shapeScore: Number(shape.shapeScore.toFixed(2)),
    startDistance: shape.startDistance,
    endDistance: shape.endDistance,
    meanDistance: shape.meanDistance,
    directionCosine: Number(dir.cosine.toFixed(4)),
    isDirectionInverted: dir.isInverted,
  };
}

export function validateTemplateStrokes(rawTemplates: unknown): string[] {
  if (!Array.isArray(rawTemplates) || rawTemplates.length === 0) {
    return ['Dữ liệu nét mẫu (templateStrokes) không hợp lệ hoặc rỗng.'];
  }

  const expectedCount = rawTemplates.length;
  const templateErrors: string[] = [];
  for (let sIdx = 0; sIdx < rawTemplates.length; sIdx++) {
    const stroke = rawTemplates[sIdx];
    if (!stroke || typeof stroke !== 'object') {
      templateErrors.push(`Nét mẫu ${sIdx + 1} không hợp lệ.`);
      continue;
    }
    const strokeLabel = typeof stroke.index === 'number' ? stroke.index : sIdx + 1;
    if (typeof stroke.index !== 'number' || !Number.isInteger(stroke.index) || stroke.index < 1) {
      templateErrors.push(`Chỉ số nét mẫu ${sIdx + 1} phải là số nguyên dương.`);
    }
    if (!Array.isArray(stroke.points) || stroke.points.length < 2) {
      templateErrors.push(`Nét mẫu ${strokeLabel} phải chứa ít nhất 2 điểm tọa độ.`);
      continue;
    }
    let strokeCoordError = false;
    for (let pIdx = 0; pIdx < stroke.points.length; pIdx++) {
      const err = validatePoint(stroke.points[pIdx]);
      if (err) {
        templateErrors.push(`Nét mẫu ${strokeLabel}, điểm ${pIdx + 1}: ${err}`);
        strokeCoordError = true;
        break;
      }
    }
    if (!strokeCoordError && computeStrokeLength(stroke.points) <= 1e-6) {
      templateErrors.push(
        `Nét mẫu ${strokeLabel} không có chuyển động (nét đứng yên/chấm tĩnh).`
      );
    }
  }

  // Template indices must be continuous integers 1..N
  if (templateErrors.length === 0) {
    const sortedIndices = rawTemplates.map((s) => s.index).sort((a, b) => a - b);
    for (let i = 0; i < expectedCount; i++) {
      if (sortedIndices[i] !== i + 1) {
        templateErrors.push(
          `Chỉ số nét mẫu (template index) phải là số nguyên liên tục từ 1 đến ${expectedCount}.`
        );
        break;
      }
    }
  }

  return templateErrors;
}

/**
 * Main pure deterministic stroke grader.
 */
export function gradeStrokeAttempt(input: StrokeGraderInput): StrokeGraderResult {
  const rawCandidates = input?.candidateStrokes;
  const rawTemplates = input?.templateStrokes;

  // 1. Strict validation of templateStrokes
  const templateErrors = validateTemplateStrokes(rawTemplates);
  if (templateErrors.length > 0) {
    const expectedCount = Array.isArray(rawTemplates) ? rawTemplates.length : 0;
    const actualCount = Array.isArray(rawCandidates) ? rawCandidates.length : 0;
    const countDiff = actualCount - expectedCount;
    return {
      score: 0,
      band: 'POOR',
      passed: false,
      details: {
        strokeCountScore: 0,
        orderScore: 0,
        directionScore: 0,
        shapeScore: 0,
        strokeCount: {
          expected: expectedCount,
          actual: actualCount,
          diff: countDiff,
        },
        strokeScores: [],
        errors: templateErrors,
      },
    };
  }

  const expectedCount = rawTemplates.length;
  const actualCount = Array.isArray(rawCandidates) ? rawCandidates.length : 0;
  const countDiff = actualCount - expectedCount;

  // 2. Strict validation of candidateStrokes
  if (!Array.isArray(rawCandidates) || rawCandidates.length === 0) {
    return {
      score: 0,
      band: 'POOR',
      passed: false,
      details: {
        strokeCountScore: 0,
        orderScore: 0,
        directionScore: 0,
        shapeScore: 0,
        strokeCount: { expected: expectedCount, actual: 0, diff: -expectedCount },
        strokeScores: [],
        errors: ['Chưa có nét vẽ nào từ người học.'],
      },
    };
  }

  const candidateErrors: string[] = [];
  for (let sIdx = 0; sIdx < rawCandidates.length; sIdx++) {
    const stroke = rawCandidates[sIdx];
    if (
      !stroke ||
      typeof stroke !== 'object' ||
      !Array.isArray(stroke.points) ||
      stroke.points.length < 2
    ) {
      candidateErrors.push(`Nét ${sIdx + 1} phải chứa ít nhất 2 điểm tọa độ.`);
      continue;
    }
    let strokeCoordError = false;
    for (let pIdx = 0; pIdx < stroke.points.length; pIdx++) {
      const err = validatePoint(stroke.points[pIdx]);
      if (err) {
        candidateErrors.push(`Nét ${sIdx + 1}, điểm ${pIdx + 1}: ${err}`);
        strokeCoordError = true;
        break;
      }
    }
    if (!strokeCoordError && computeStrokeLength(stroke.points) <= 1e-6) {
      candidateErrors.push(`Nét ${sIdx + 1} không có chuyển động (nét đứng yên/chấm tĩnh).`);
    }
  }

  if (candidateErrors.length > 0) {
    return {
      score: 0,
      band: 'POOR',
      passed: false,
      details: {
        strokeCountScore: 0,
        orderScore: 0,
        directionScore: 0,
        shapeScore: 0,
        strokeCount: { expected: expectedCount, actual: actualCount, diff: countDiff },
        strokeScores: [],
        errors: candidateErrors,
      },
    };
  }

  // 3. Normalize whole character bounding boxes for both template and candidate sets
  const sortedTemplates = [...rawTemplates].sort((a, b) => a.index - b.index);
  const normTemplates = normalizeStrokeSet(sortedTemplates);
  const normCandidates = normalizeStrokeSet(rawCandidates);

  // 4. Stroke Count Score: missing or extra strokes penalty
  const absDiff = Math.abs(countDiff);
  const strokeCountScore = Math.max(0, 100 * (1 - absDiff / expectedCount));

  // 5. Sequential Pairing & Evaluation on normalized strokes
  const evaluatedPairs = Math.min(actualCount, expectedCount);
  const strokeScores: IndividualStrokeScore[] = [];

  for (let i = 0; i < evaluatedPairs; i++) {
    const cand = normCandidates[i].points;
    const tpl = normTemplates[i].points;
    const score = gradeSingleStrokePair(cand, tpl, normTemplates[i].index);
    strokeScores.push(score);
  }

  // 6. Stroke Order Verification
  const errors: string[] = [];
  let orderPenalty = 0;
  if (expectedCount > 1 && evaluatedPairs > 1) {
    let orderSwaps = 0;
    for (let i = 0; i < evaluatedPairs; i++) {
      const directScore = strokeScores[i]?.score ?? 0;
      for (let j = 0; j < expectedCount; j++) {
        if (i !== j) {
          const crossScore = gradeSingleStrokePair(
            normCandidates[i].points,
            normTemplates[j].points,
            normTemplates[j].index
          ).score;
          // If cross match is dramatically better than direct match (difference > 35)
          if (crossScore > 60 && crossScore - directScore > 35) {
            orderSwaps++;
            break;
          }
        }
      }
    }

    if (orderSwaps > 0) {
      orderPenalty = Math.min(100, (orderSwaps / expectedCount) * 80);
      errors.push(`Phát hiện sai thứ tự nét viết (${orderSwaps} nét không đúng thứ tự chuẩn).`);
    }
  }

  const orderScore = Math.max(0, 100 - orderPenalty);

  // 7. Aggregate sub-scores
  const avgDirectionScore =
    strokeScores.length > 0
      ? strokeScores.reduce((sum, s) => sum + s.directionScore, 0) / strokeScores.length
      : 0;

  const avgShapeScore =
    strokeScores.length > 0
      ? strokeScores.reduce((sum, s) => sum + s.shapeScore, 0) / strokeScores.length
      : 0;

  const hasInvertedDirection = strokeScores.some((s) => s.isDirectionInverted);
  if (hasInvertedDirection) {
    errors.push('Phát hiện nét vẽ bị đảo ngược hướng viết so với mẫu chuẩn.');
  }

  if (countDiff < 0) {
    errors.push(`Thiếu ${-countDiff} nét so với mẫu chuẩn (${expectedCount} nét).`);
  } else if (countDiff > 0) {
    errors.push(`Thừa ${countDiff} nét so với mẫu chuẩn (${expectedCount} nét).`);
  }

  // 8. Overall Score Calculation
  // Weighted blend: Shape 50%, Direction 25%, Order 15%, StrokeCount 10%
  let rawScore =
    avgShapeScore * 0.5 +
    avgDirectionScore * 0.25 +
    orderScore * 0.15 +
    strokeCountScore * 0.1;

  // Severe penalty scaling:
  // - If stroke count is wrong: scale by stroke count fidelity
  if (absDiff > 0) {
    rawScore = rawScore * (strokeCountScore / 100);
  }

  // - If any direction is inverted: cap overall score below 50 (POOR)
  if (hasInvertedDirection) {
    rawScore = Math.min(45, rawScore * 0.45);
  }

  // - If order is inverted: cap overall score below 50 (POOR)
  if (orderPenalty >= 40) {
    rawScore = Math.min(45, rawScore * 0.45);
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(rawScore)));

  // Three bands:
  // - EXCELLENT: >= 75
  // - FAIR: 50..74
  // - POOR: < 50
  let band: GradeBand = 'POOR';
  if (finalScore >= 75) {
    band = 'EXCELLENT';
  } else if (finalScore >= 50) {
    band = 'FAIR';
  }

  return {
    score: finalScore,
    band,
    passed: finalScore >= 75,
    details: {
      strokeCountScore: Math.round(strokeCountScore),
      orderScore: Math.round(orderScore),
      directionScore: Math.round(avgDirectionScore),
      shapeScore: Math.round(avgShapeScore),
      strokeCount: {
        expected: expectedCount,
        actual: actualCount,
        diff: countDiff,
      },
      strokeScores,
      errors,
    },
  };
}
