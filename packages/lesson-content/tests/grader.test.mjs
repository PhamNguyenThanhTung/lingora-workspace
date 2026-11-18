import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { gradeStrokeAttempt } from '../src/index.ts';

describe('S6-05: Stroke Grader Deterministic Module', () => {
  // Fixture: 2-stroke character "十" (cross: horizontal stroke 1, vertical stroke 2)
  // Stroke 1 (horizontal): (0.2, 0.5) -> (0.8, 0.5)
  // Stroke 2 (vertical):   (0.5, 0.2) -> (0.5, 0.8)
  const templateCross = [
    {
      index: 1,
      points: [
        [0.2, 0.5],
        [0.5, 0.5],
        [0.8, 0.5],
      ],
      start: [0.2, 0.5],
      end: [0.8, 0.5],
    },
    {
      index: 2,
      points: [
        [0.5, 0.2],
        [0.5, 0.5],
        [0.5, 0.8],
      ],
      start: [0.5, 0.2],
      end: [0.5, 0.8],
    },
  ];

  // Fixture: 4-stroke character "日" (box with middle bar)
  // Stroke 1: Left vertical:   (0.2, 0.2) -> (0.2, 0.8)
  // Stroke 2: Top-right corner: (0.2, 0.2) -> (0.8, 0.2) -> (0.8, 0.8)
  // Stroke 3: Middle bar:       (0.2, 0.5) -> (0.8, 0.5)
  // Stroke 4: Bottom bar:       (0.2, 0.8) -> (0.8, 0.8)
  const templateSun = [
    {
      index: 1,
      points: [
        [0.2, 0.2],
        [0.2, 0.5],
        [0.2, 0.8],
      ],
    },
    {
      index: 2,
      points: [
        [0.2, 0.2],
        [0.8, 0.2],
        [0.8, 0.5],
        [0.8, 0.8],
      ],
    },
    {
      index: 3,
      points: [
        [0.2, 0.5],
        [0.5, 0.5],
        [0.8, 0.5],
      ],
    },
    {
      index: 4,
      points: [
        [0.2, 0.8],
        [0.5, 0.8],
        [0.8, 0.8],
      ],
    },
  ];

  // ===========================================================================
  // 1. EXCELLENT Band (score >= 75, passed = true)
  // ===========================================================================
  test('EXCELLENT: Perfect match yields score >= 95 and passed = true', () => {
    const candidateStrokes = [
      {
        points: [
          [0.2, 0.5],
          [0.5, 0.5],
          [0.8, 0.5],
        ],
      },
      {
        points: [
          [0.5, 0.2],
          [0.5, 0.5],
          [0.5, 0.8],
        ],
      },
    ];

    const result = gradeStrokeAttempt({
      candidateStrokes,
      templateStrokes: templateCross,
    });

    assert.equal(result.band, 'EXCELLENT');
    assert.equal(result.passed, true);
    assert.ok(result.score >= 95, `Expected score >= 95, got ${result.score}`);
    assert.equal(result.details.errors.length, 0);
    assert.equal(result.details.strokeCount.diff, 0);
  });

  test('EXCELLENT: Natural handwriting variation with minor tremor scores in EXCELLENT band (>= 75)', () => {
    const candidateStrokes = [
      {
        points: [
          [0.21, 0.51],
          [0.52, 0.49],
          [0.79, 0.51],
        ],
      },
      {
        points: [
          [0.49, 0.21],
          [0.51, 0.52],
          [0.5, 0.79],
        ],
      },
    ];

    const result = gradeStrokeAttempt({
      candidateStrokes,
      templateStrokes: templateCross,
    });

    assert.equal(result.band, 'EXCELLENT');
    assert.equal(result.passed, true);
    assert.ok(result.score >= 75, `Expected score >= 75, got ${result.score}`);
  });

  // ===========================================================================
  // 2. FAIR Band (50 <= score < 75, passed = false)
  // ===========================================================================
  test('FAIR: Moderate trajectory offset without inversion scores in FAIR band (50..74)', () => {
    // Authentic handwriting deformation: noticeable slant and curved wobble, but correct order and direction
    const candidateStrokes = [
      {
        points: [
          [0.2, 0.38],
          [0.5, 0.56],
          [0.8, 0.62],
        ],
      },
      {
        points: [
          [0.38, 0.2],
          [0.56, 0.5],
          [0.62, 0.8],
        ],
      },
    ];

    const result = gradeStrokeAttempt({
      candidateStrokes,
      templateStrokes: templateCross,
    });

    assert.equal(result.band, 'FAIR');
    assert.equal(result.passed, false);
    assert.ok(
      result.score >= 50 && result.score < 75,
      `Expected 50 <= score < 75, got ${result.score}`
    );
  });

  // ===========================================================================
  // 3. POOR Band — Missing Strokes (Thiếu nét)
  // ===========================================================================
  test('POOR: Missing strokes penalizes heavily and drops score < 50', () => {
    // Expected 2 strokes, candidate only draws stroke 1 (horizontal)
    const candidateStrokes = [
      {
        points: [
          [0.2, 0.5],
          [0.5, 0.5],
          [0.8, 0.5],
        ],
      },
    ];

    const result = gradeStrokeAttempt({
      candidateStrokes,
      templateStrokes: templateCross,
    });

    assert.equal(result.band, 'POOR');
    assert.equal(result.passed, false);
    assert.ok(result.score < 50, `Expected score < 50 for missing stroke, got ${result.score}`);
    assert.equal(result.details.strokeCount.diff, -1);
    assert.ok(result.details.errors.some((e) => e.includes('Thiếu 1 nét')));
  });

  test('POOR: Drawing only 2 of 4 strokes on "日" drops score < 50', () => {
    const candidateStrokes = [
      {
        points: [
          [0.2, 0.2],
          [0.2, 0.8],
        ],
      },
      {
        points: [
          [0.2, 0.2],
          [0.8, 0.2],
          [0.8, 0.8],
        ],
      },
    ];

    const result = gradeStrokeAttempt({
      candidateStrokes,
      templateStrokes: templateSun,
    });

    assert.equal(result.band, 'POOR');
    assert.equal(result.passed, false);
    assert.ok(result.score < 50, `Expected score < 50 for missing 2 strokes, got ${result.score}`);
    assert.equal(result.details.strokeCount.diff, -2);
    assert.ok(result.details.errors.some((e) => e.includes('Thiếu 2 nét')));
  });

  // ===========================================================================
  // 4. POOR Band — Extra Strokes (Thừa nét)
  // ===========================================================================
  test('POOR: Extra strokes penalizes score into POOR band (< 50)', () => {
    // Expected 2 strokes, candidate draws 4 strokes (2 spurious scribbles)
    const candidateStrokes = [
      {
        points: [
          [0.2, 0.5],
          [0.8, 0.5],
        ],
      },
      {
        points: [
          [0.5, 0.2],
          [0.5, 0.8],
        ],
      },
      {
        points: [
          [0.1, 0.1],
          [0.2, 0.2],
        ],
      },
      {
        points: [
          [0.8, 0.8],
          [0.9, 0.9],
        ],
      },
    ];

    const result = gradeStrokeAttempt({
      candidateStrokes,
      templateStrokes: templateCross,
    });

    assert.equal(result.band, 'POOR');
    assert.equal(result.passed, false);
    assert.ok(result.score < 50, `Expected score < 50 for 2 extra strokes, got ${result.score}`);
    assert.equal(result.details.strokeCount.diff, 2);
    assert.ok(result.details.errors.some((e) => e.includes('Thừa 2 nét')));
  });

  // ===========================================================================
  // 5. POOR Band — Inverted Stroke Direction (Đảo hướng nét)
  // ===========================================================================
  test('POOR: Inverted stroke direction (drawn backwards) drops score < 50', () => {
    // Template stroke 1 is (0.2, 0.5) -> (0.8, 0.5) (Left to Right)
    // Candidate draws right-to-left: (0.8, 0.5) -> (0.2, 0.5)
    const candidateStrokes = [
      {
        points: [
          [0.8, 0.5],
          [0.5, 0.5],
          [0.2, 0.5],
        ],
      },
      {
        points: [
          [0.5, 0.2],
          [0.5, 0.5],
          [0.5, 0.8],
        ],
      },
    ];

    const result = gradeStrokeAttempt({
      candidateStrokes,
      templateStrokes: templateCross,
    });

    assert.equal(result.band, 'POOR');
    assert.equal(result.passed, false);
    assert.ok(result.score < 50, `Expected score < 50 for inverted direction, got ${result.score}`);
    assert.ok(result.details.strokeScores[0].isDirectionInverted, 'Stroke 1 must be marked inverted');
    assert.ok(result.details.errors.some((e) => e.includes('đảo ngược hướng viết')));
  });

  // ===========================================================================
  // 6. POOR Band — Inverted Stroke Order (Đảo thứ tự nét)
  // ===========================================================================
  test('POOR: Inverted stroke order (vertical drawn before horizontal) drops score < 50', () => {
    // Cross requires: Stroke 1 (horizontal), Stroke 2 (vertical)
    // Candidate draws Stroke 2 first, then Stroke 1
    const candidateStrokes = [
      {
        points: [
          [0.5, 0.2],
          [0.5, 0.5],
          [0.5, 0.8],
        ], // Vertical first!
      },
      {
        points: [
          [0.2, 0.5],
          [0.5, 0.5],
          [0.8, 0.5],
        ], // Horizontal second!
      },
    ];

    const result = gradeStrokeAttempt({
      candidateStrokes,
      templateStrokes: templateCross,
    });

    assert.equal(result.band, 'POOR');
    assert.equal(result.passed, false);
    assert.ok(result.score < 50, `Expected score < 50 for inverted order, got ${result.score}`);
    assert.ok(result.details.errors.some((e) => e.includes('sai thứ tự nét viết')));
  });

  // ===========================================================================
  // 7. POOR Band — Coordinate Errors (Tọa độ lỗi)
  // ===========================================================================
  test('POOR: Coordinates with NaN, Infinity, out of bounds, or empty stroke drop to 0', () => {
    // Test NaN
    const resNaN = gradeStrokeAttempt({
      candidateStrokes: [
        {
          points: [
            [0.2, NaN],
            [0.8, 0.5],
          ],
        },
        {
          points: [
            [0.5, 0.2],
            [0.5, 0.8],
          ],
        },
      ],
      templateStrokes: templateCross,
    });
    assert.equal(resNaN.score, 0);
    assert.equal(resNaN.band, 'POOR');
    assert.equal(resNaN.passed, false);
    assert.ok(resNaN.details.errors.some((e) => e.includes('Tọa độ y không hợp lệ: NaN')));

    // Test Infinity
    const resInf = gradeStrokeAttempt({
      candidateStrokes: [
        {
          points: [
            [0.2, 0.5],
            [Infinity, 0.5],
          ],
        },
      ],
      templateStrokes: templateCross,
    });
    assert.equal(resInf.score, 0);
    assert.equal(resInf.band, 'POOR');

    // Test Out of bounds (e.g. x = 2.5)
    const resOOB = gradeStrokeAttempt({
      candidateStrokes: [
        {
          points: [
            [0.2, 0.5],
            [2.5, 0.5],
          ],
        },
      ],
      templateStrokes: templateCross,
    });
    assert.equal(resOOB.score, 0);
    assert.equal(resOOB.band, 'POOR');
    assert.ok(resOOB.details.errors.some((e) => e.includes('ngoài phạm vi')));

    // Test Empty candidate strokes
    const resEmpty = gradeStrokeAttempt({
      candidateStrokes: [],
      templateStrokes: templateCross,
    });
    assert.equal(resEmpty.score, 0);
    assert.equal(resEmpty.band, 'POOR');
    assert.ok(resEmpty.details.errors.some((e) => e.includes('Chưa có nét vẽ nào')));

    // Test stroke with fewer than 2 points
    const resTooFew = gradeStrokeAttempt({
      candidateStrokes: [{ points: [[0.5, 0.5]] }],
      templateStrokes: templateCross,
    });
    assert.equal(resTooFew.score, 0);
    assert.equal(resTooFew.band, 'POOR');
    assert.ok(resTooFew.details.errors.some((e) => e.includes('ít nhất 2 điểm')));
  });

  test('POOR: Non-primitive JSON coordinates and template indices return errors without throwing', () => {
    const hostileJsonValue = JSON.parse('{"toString":null}');
    const validStroke = { index: 1, points: [[0.1, 0.2], [0.9, 0.8]] };

    const invalidX = gradeStrokeAttempt({
      candidateStrokes: [{ points: [[hostileJsonValue, 0.2], [0.9, 0.8]] }],
      templateStrokes: [validStroke],
    });
    assert.equal(invalidX.score, 0);
    assert.equal(invalidX.band, 'POOR');
    assert.ok(invalidX.details.errors.length > 0);

    const invalidY = gradeStrokeAttempt({
      candidateStrokes: [{ points: [[0.1, hostileJsonValue], [0.9, 0.8]] }],
      templateStrokes: [validStroke],
    });
    assert.equal(invalidY.score, 0);
    assert.equal(invalidY.band, 'POOR');
    assert.ok(invalidY.details.errors.length > 0);

    const invalidIndex = gradeStrokeAttempt({
      candidateStrokes: [{ points: validStroke.points }],
      templateStrokes: [{ ...validStroke, index: hostileJsonValue }],
    });
    assert.equal(invalidIndex.score, 0);
    assert.equal(invalidIndex.band, 'POOR');
    assert.ok(invalidIndex.details.errors.length > 0);
  });

  // ===========================================================================
  // 8. Determinism
  // ===========================================================================
  test('Determinism: 100 consecutive invocations produce identical results', () => {
    const candidateStrokes = [
      {
        points: [
          [0.22, 0.48],
          [0.51, 0.51],
          [0.78, 0.5],
        ],
      },
      {
        points: [
          [0.48, 0.22],
          [0.5, 0.51],
          [0.52, 0.78],
        ],
      },
    ];

    const baseline = gradeStrokeAttempt({
      candidateStrokes,
      templateStrokes: templateCross,
    });

    for (let i = 0; i < 100; i++) {
      const current = gradeStrokeAttempt({
        candidateStrokes,
        templateStrokes: templateCross,
      });

      assert.equal(current.score, baseline.score);
      assert.equal(current.band, baseline.band);
      assert.equal(current.passed, baseline.passed);
      assert.equal(current.details.strokeCountScore, baseline.details.strokeCountScore);
      assert.equal(current.details.orderScore, baseline.details.orderScore);
      assert.equal(current.details.directionScore, baseline.details.directionScore);
      assert.equal(current.details.shapeScore, baseline.details.shapeScore);
    }
  });

  // ===========================================================================
  // 9. S6-05 Regressions & Invariant Verifications
  // ===========================================================================
  test('Regression S6-05: Template [[0.1,0.2],[0.9,0.8]] and candidate [[0.55,0.05],[0.75,0.2]] score 100', () => {
    const templateStrokes = [
      {
        index: 1,
        points: [
          [0.1, 0.2],
          [0.9, 0.8],
        ],
      },
    ];
    const candidateStrokes = [
      {
        points: [
          [0.55, 0.05],
          [0.75, 0.2],
        ],
      },
    ];

    const result = gradeStrokeAttempt({
      candidateStrokes,
      templateStrokes,
    });

    assert.equal(result.band, 'EXCELLENT');
    assert.equal(result.passed, true);
    assert.equal(result.score, 100);
    assert.equal(result.details.shapeScore, 100);
    assert.equal(result.details.directionScore, 100);
    assert.equal(result.details.errors.length, 0);
  });

  test('EXCELLENT: Multi-stroke character scaled and translated scores >= 95 and passed = true', () => {
    // 2-stroke cross scaled by 0.5 and translated to top-left corner
    const candidateStrokes = [
      {
        points: [
          [0.1, 0.25],
          [0.25, 0.25],
          [0.4, 0.25],
        ],
      },
      {
        points: [
          [0.25, 0.1],
          [0.25, 0.25],
          [0.25, 0.4],
        ],
      },
    ];

    const result = gradeStrokeAttempt({
      candidateStrokes,
      templateStrokes: templateCross,
    });

    assert.equal(result.band, 'EXCELLENT');
    assert.equal(result.passed, true);
    assert.ok(result.score >= 95, `Expected score >= 95, got ${result.score}`);
    assert.equal(result.details.errors.length, 0);
  });

  test('FAIR/POOR: Penalizes stroke with wrong relative position in multi-stroke character', () => {
    // Horizontal stroke drawn properly, but vertical stroke shifted far to the right (x=0.9 instead of x=0.5)
    const candidateStrokes = [
      {
        points: [
          [0.2, 0.5],
          [0.5, 0.5],
          [0.8, 0.5],
        ],
      },
      {
        points: [
          [0.9, 0.2],
          [0.9, 0.5],
          [0.9, 0.8],
        ],
      },
    ];

    const result = gradeStrokeAttempt({
      candidateStrokes,
      templateStrokes: templateCross,
    });

    assert.equal(result.passed, false);
    assert.ok(result.score < 75, `Expected score < 75, got ${result.score}`);
    const stroke2Score = result.details.strokeScores.find((s) => s.strokeIndex === 2);
    assert.ok(stroke2Score, 'Stroke 2 score detail must exist');
    assert.equal(stroke2Score.shapeScore, 0, 'Stroke 2 shape score must drop to 0 due to relative position shift');
  });

  test('POOR: Coordinate validation strictly rejects x > 1 (x=1.04) and tuples with length != 2 ([x,y,z])', () => {
    // Test x = 1.04
    const resOverOne = gradeStrokeAttempt({
      candidateStrokes: [
        {
          points: [
            [0.2, 0.5],
            [1.04, 0.5],
          ],
        },
      ],
      templateStrokes: templateCross,
    });
    assert.equal(resOverOne.score, 0);
    assert.equal(resOverOne.band, 'POOR');
    assert.equal(resOverOne.passed, false);
    assert.ok(
      resOverOne.details.errors.some((e) => e.includes('ngoài phạm vi [0, 1]: 1.04')),
      'Must reject coordinate x=1.04 exceeding [0, 1]'
    );

    // Test coordinate tuple with 3 elements [x, y, z]
    const resTriple = gradeStrokeAttempt({
      candidateStrokes: [
        {
          points: [
            // @ts-expect-error testing invalid tuple runtime input
            [0.2, 0.5, 0.1],
            // @ts-expect-error testing invalid tuple runtime input
            [0.8, 0.5, 0.2],
          ],
        },
      ],
      templateStrokes: templateCross,
    });
    assert.equal(resTriple.score, 0);
    assert.equal(resTriple.band, 'POOR');
    assert.equal(resTriple.passed, false);
    assert.ok(
      resTriple.details.errors.some((e) => e.includes('đúng 2 phần tử [x, y]')),
      'Must reject coordinate tuple with length != 2'
    );
  });

  test('POOR: Rejects stationary stroke (static dot with no movement) with POOR error', () => {
    const resStationary = gradeStrokeAttempt({
      candidateStrokes: [
        {
          points: [
            [0.5, 0.5],
            [0.5, 0.5],
          ],
        },
        {
          points: [
            [0.5, 0.2],
            [0.5, 0.8],
          ],
        },
      ],
      templateStrokes: templateCross,
    });
    assert.equal(resStationary.score, 0);
    assert.equal(resStationary.band, 'POOR');
    assert.equal(resStationary.passed, false);
    assert.ok(
      resStationary.details.errors.some((e) =>
        e.includes('không có chuyển động (nét đứng yên/chấm tĩnh)')
      ),
      'Must flag stationary stroke as error'
    );
  });

  test('EXCELLENT: Accepts valid closed-loop stroke where start and end points coincide if trajectory moves', () => {
    const loopTemplate = [
      {
        index: 1,
        points: [
          [0.3, 0.3],
          [0.7, 0.3],
          [0.7, 0.7],
          [0.3, 0.7],
          [0.3, 0.3],
        ],
      },
    ];
    const loopCandidate = [
      {
        points: [
          [0.3, 0.3],
          [0.7, 0.3],
          [0.7, 0.7],
          [0.3, 0.7],
          [0.3, 0.3],
        ],
      },
    ];

    const result = gradeStrokeAttempt({
      candidateStrokes: loopCandidate,
      templateStrokes: loopTemplate,
    });

    assert.equal(result.band, 'EXCELLENT');
    assert.equal(result.passed, true);
    assert.equal(result.score, 100);
    assert.equal(result.details.errors.length, 0);
  });

  test('EXCELLENT: Closed-loop direction is invariant to extra collinear pointer samples', () => {
    const start = [0.5, 0.5];
    const loop = [start, [0.2, 0.5], [0.2, 0.2], [0.35, 0.3], start, [0.75, 0.5], start];
    const denserLoop = [
      ...loop.slice(0, 5),
      [0.525, 0.5], [0.55, 0.5], [0.575, 0.5], [0.6, 0.5], [0.625, 0.5],
      [0.65, 0.5], [0.675, 0.5], [0.7, 0.5], [0.725, 0.5], [0.75, 0.5],
      [0.7, 0.5], [0.65, 0.5], [0.6, 0.5], [0.55, 0.5], start,
    ];

    const result = gradeStrokeAttempt({
      candidateStrokes: [{ points: denserLoop }],
      templateStrokes: [{ index: 1, points: loop }],
    });

    assert.equal(result.score, 100);
    assert.equal(result.band, 'EXCELLENT');
    assert.equal(result.details.strokeScores[0].isDirectionInverted, false);
  });

  test('POOR: Template validation rejects missing points or non-continuous indices without throwing TypeError', () => {
    // Template missing points property: [{ index: 1 }]
    const resMissingPoints = gradeStrokeAttempt({
      candidateStrokes: [
        {
          points: [
            [0.2, 0.5],
            [0.8, 0.5],
          ],
        },
      ],
      // @ts-expect-error testing invalid template runtime input
      templateStrokes: [{ index: 1 }],
    });
    assert.equal(resMissingPoints.score, 0);
    assert.equal(resMissingPoints.band, 'POOR');
    assert.equal(resMissingPoints.passed, false);
    assert.ok(
      resMissingPoints.details.errors.some((e) => e.includes('phải chứa ít nhất 2 điểm tọa độ')),
      'Must reject template missing points without TypeError'
    );

    // Template non-continuous index: [{ index: 2, points: [...] }]
    const resNonContinuous = gradeStrokeAttempt({
      candidateStrokes: [
        {
          points: [
            [0.2, 0.5],
            [0.8, 0.5],
          ],
        },
      ],
      templateStrokes: [
        {
          index: 2,
          points: [
            [0.2, 0.5],
            [0.8, 0.5],
          ],
        },
      ],
    });
    assert.equal(resNonContinuous.score, 0);
    assert.equal(resNonContinuous.band, 'POOR');
    assert.equal(resNonContinuous.passed, false);
    assert.ok(
      resNonContinuous.details.errors.some((e) => e.includes('số nguyên liên tục từ 1 đến 1')),
      'Must reject non-continuous template index'
    );

    // Template duplicate indices: [{ index: 1 }, { index: 1 }]
    const resDuplicate = gradeStrokeAttempt({
      candidateStrokes: [
        {
          points: [
            [0.2, 0.5],
            [0.8, 0.5],
          ],
        },
        {
          points: [
            [0.5, 0.2],
            [0.5, 0.8],
          ],
        },
      ],
      templateStrokes: [
        {
          index: 1,
          points: [
            [0.2, 0.5],
            [0.8, 0.5],
          ],
        },
        {
          index: 1,
          points: [
            [0.5, 0.2],
            [0.5, 0.8],
          ],
        },
      ],
    });
    assert.equal(resDuplicate.score, 0);
    assert.equal(resDuplicate.band, 'POOR');
    assert.equal(resDuplicate.passed, false);
    assert.ok(
      resDuplicate.details.errors.some((e) => e.includes('số nguyên liên tục từ 1 đến 2')),
      'Must reject duplicate template indices'
    );
  });

  test('POOR: Hostile JSON objects in coordinates and template indices return errors without throwing', () => {
    const hostileJsonValue = JSON.parse('{"toString":null}');
    const candidateStrokes = [{ points: [[0.2, 0.5], [0.8, 0.5]] }];

    for (const points of [
      [[hostileJsonValue, 0.5], [0.8, 0.5]],
      [[0.2, hostileJsonValue], [0.8, 0.5]],
    ]) {
      const result = gradeStrokeAttempt({
        candidateStrokes,
        // @ts-expect-error testing invalid JSON coordinate value at runtime
        templateStrokes: [{ index: 1, points }],
      });
      assert.equal(result.score, 0);
      assert.equal(result.band, 'POOR');
      assert.ok(result.details.errors.length > 0);
    }

    const result = gradeStrokeAttempt({
      candidateStrokes,
      // @ts-expect-error testing invalid JSON template index at runtime
      templateStrokes: [{ index: hostileJsonValue, points: [[0.2, 0.5], [0.8, 0.5]] }],
    });
    assert.equal(result.score, 0);
    assert.equal(result.band, 'POOR');
    assert.ok(result.details.errors.length > 0);
  });
});
