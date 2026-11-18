import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import {
  validateStrokeDataInput,
  buildSvgPath,
  createStroke,
  areStrokesEqual,
  SELF_AUTHORED_FIXTURES,
  MAX_STROKES,
  MAX_POINTS_PER_STROKE,
  MIN_POINTS_PER_STROKE,
  MAX_TOTAL_POINTS,
  MAX_STROKE_BODY_BYTES,
} from '../../src/server/characters/index.ts';

describe('S6-02: Normalized Stroke Points & Coordinate Bounds', () => {
  const dummyCharId = randomUUID();

  test('valid normalized coordinates within [0, 1] are accepted', () => {
    const input = {
      characterId: dummyCharId,
      version: 1,
      source: 'Lingora Test',
      license: 'CC0-1.0',
      strokes: [
        {
          index: 1,
          points: [
            [0.1, 0.2],
            [0.5, 0.5],
            [0.9, 0.8],
          ],
        },
      ],
    };
    const res = validateStrokeDataInput(input);
    assert.equal(res.success, true);
    assert.equal(res.data.strokes.length, 1);
    assert.deepEqual(res.data.strokes[0].start, [0.1, 0.2]);
    assert.deepEqual(res.data.strokes[0].end, [0.9, 0.8]);
    assert.equal(res.data.strokes[0].path, 'M 0.1 0.2 L 0.5 0.5 L 0.9 0.8');
  });

  test('non-finite coordinates (NaN, Infinity, -Infinity) are rejected', () => {
    for (const badCoord of [NaN, Infinity, -Infinity]) {
      const input = {
        characterId: dummyCharId,
        source: 'Lingora Test',
        license: 'CC0-1.0',
        strokes: [
          {
            index: 1,
            points: [
              [0.1, 0.2],
              [badCoord, 0.5],
            ],
          },
        ],
      };
      const res = validateStrokeDataInput(input);
      assert.equal(res.success, false);
    }
  });

  test('out-of-bounds coordinates (<0 or >1) are rejected', () => {
    for (const outOfBound of [-0.01, -1, 1.001, 2]) {
      const input = {
        characterId: dummyCharId,
        source: 'Lingora Test',
        license: 'CC0-1.0',
        strokes: [
          {
            index: 1,
            points: [
              [0.1, 0.2],
              [outOfBound, 0.5],
            ],
          },
        ],
      };
      const res = validateStrokeDataInput(input);
      assert.equal(res.success, false);
    }
  });

  test('stroke with fewer than 2 points is rejected', () => {
    const input = {
      characterId: dummyCharId,
      source: 'Lingora Test',
      license: 'CC0-1.0',
      strokes: [
        {
          index: 1,
          points: [[0.5, 0.5]],
        },
      ],
    };
    const res = validateStrokeDataInput(input);
    assert.equal(res.success, false);
  });

  test('stroke with more than 256 points is rejected', () => {
    const points = [];
    for (let i = 0; i < MAX_POINTS_PER_STROKE + 1; i++) {
      points.push([i / 300, i / 300]);
    }
    const input = {
      characterId: dummyCharId,
      source: 'Lingora Test',
      license: 'CC0-1.0',
      strokes: [{ index: 1, points }],
    };
    const res = validateStrokeDataInput(input);
    assert.equal(res.success, false);
  });

  test('total points across all strokes exceeding 4096 is rejected', () => {
    // 20 strokes with 210 points each = 4200 points (> 4096)
    const strokes = [];
    for (let s = 1; s <= 20; s++) {
      const points = [];
      for (let p = 0; p < 210; p++) {
        points.push([p / 250, p / 250]);
      }
      strokes.push({ index: s, points });
    }
    const input = {
      characterId: dummyCharId,
      source: 'Lingora Test',
      license: 'CC0-1.0',
      strokes,
    };
    const res = validateStrokeDataInput(input);
    assert.equal(res.success, false);
  });
});

describe('S6-02: Non-Moving / Degenerate Stroke & Start/End Consistency', () => {
  const dummyCharId = randomUUID();

  test('non-moving stroke (all points identical / zero path length) is rejected', () => {
    const input = {
      characterId: dummyCharId,
      source: 'Lingora Test',
      license: 'CC0-1.0',
      strokes: [
        {
          index: 1,
          points: [
            [0.5, 0.5],
            [0.5, 0.5],
            [0.5, 0.5],
          ],
        },
      ],
    };
    const res = validateStrokeDataInput(input);
    assert.equal(res.success, false);
  });

  test('start coordinate not matching first point is rejected', () => {
    const input = {
      characterId: dummyCharId,
      source: 'Lingora Test',
      license: 'CC0-1.0',
      strokes: [
        {
          index: 1,
          points: [
            [0.2, 0.3],
            [0.6, 0.7],
          ],
          start: [0.9, 0.9], // mismatch
          end: [0.6, 0.7],
        },
      ],
    };
    const res = validateStrokeDataInput(input);
    assert.equal(res.success, false);
  });

  test('end coordinate not matching last point is rejected', () => {
    const input = {
      characterId: dummyCharId,
      source: 'Lingora Test',
      license: 'CC0-1.0',
      strokes: [
        {
          index: 1,
          points: [
            [0.2, 0.3],
            [0.6, 0.7],
          ],
          start: [0.2, 0.3],
          end: [0.1, 0.1], // mismatch
        },
      ],
    };
    const res = validateStrokeDataInput(input);
    assert.equal(res.success, false);
  });

  test('start and end matching points within floating tolerance are accepted', () => {
    const input = {
      characterId: dummyCharId,
      source: 'Lingora Test',
      license: 'CC0-1.0',
      strokes: [
        {
          index: 1,
          points: [
            [0.2, 0.3],
            [0.6, 0.7],
          ],
          start: [0.2, 0.3],
          end: [0.6, 0.7],
        },
      ],
    };
    const res = validateStrokeDataInput(input);
    assert.equal(res.success, true);
  });
});

describe('S6-02: Consecutive Stroke Indices & Catalogue Stroke Count Matching', () => {
  const dummyCharId = randomUUID();

  test('indices must start at 1 and be strictly consecutive', () => {
    const valid = {
      characterId: dummyCharId,
      source: 'Lingora Test',
      license: 'CC0-1.0',
      strokes: [
        { index: 1, points: [[0.1, 0.1], [0.2, 0.2]] },
        { index: 2, points: [[0.3, 0.3], [0.4, 0.4]] },
        { index: 3, points: [[0.5, 0.5], [0.6, 0.6]] },
      ],
    };
    assert.equal(validateStrokeDataInput(valid).success, true);

    // 0-based index
    const zeroBased = {
      ...valid,
      strokes: [
        { index: 0, points: [[0.1, 0.1], [0.2, 0.2]] },
        { index: 1, points: [[0.3, 0.3], [0.4, 0.4]] },
      ],
    };
    assert.equal(validateStrokeDataInput(zeroBased).success, false);

    // Non-consecutive / gap
    const gapIndex = {
      ...valid,
      strokes: [
        { index: 1, points: [[0.1, 0.1], [0.2, 0.2]] },
        { index: 3, points: [[0.3, 0.3], [0.4, 0.4]] },
      ],
    };
    assert.equal(validateStrokeDataInput(gapIndex).success, false);

    // Duplicate index
    const duplicateIndex = {
      ...valid,
      strokes: [
        { index: 1, points: [[0.1, 0.1], [0.2, 0.2]] },
        { index: 1, points: [[0.3, 0.3], [0.4, 0.4]] },
      ],
    };
    assert.equal(validateStrokeDataInput(duplicateIndex).success, false);
  });

  test('strokes count must strictly match catalogue strokeCount when provided', () => {
    const input = {
      characterId: dummyCharId,
      source: 'Lingora Test',
      license: 'CC0-1.0',
      strokes: [
        { index: 1, points: [[0.1, 0.1], [0.2, 0.2]] },
        { index: 2, points: [[0.3, 0.3], [0.4, 0.4]] },
      ],
    };

    // Expected 2 -> matches
    assert.equal(validateStrokeDataInput(input, 2).success, true);

    // Expected 3 -> mismatch
    assert.equal(validateStrokeDataInput(input, 3).success, false);

    // Expected 1 -> mismatch
    assert.equal(validateStrokeDataInput(input, 1).success, false);
  });
});

describe('S6-02: SVG Path Strict Geometric Format & Sanitization', () => {
  const dummyCharId = randomUUID();

  test('SVG path generated by buildSvgPath contains only M and L commands', () => {
    const points = [
      [0.2, 0.3],
      [0.4, 0.5],
      [0.8, 0.9],
    ];
    const path = buildSvgPath(points);
    assert.equal(path, 'M 0.2 0.3 L 0.4 0.5 L 0.8 0.9');
  });

  test('custom SVG path must only contain M and L commands matching regex', () => {
    const input = {
      characterId: dummyCharId,
      source: 'Lingora Test',
      license: 'CC0-1.0',
      strokes: [
        {
          index: 1,
          points: [[0.2, 0.2], [0.8, 0.8]],
          path: 'M 0.2 0.2 L 0.8 0.8',
        },
      ],
    };
    assert.equal(validateStrokeDataInput(input).success, true);
  });

  test('disallowed SVG commands (C, Q, S, A, Z), HTML, or scripts in path are rejected', () => {
    const badPaths = [
      'M 0.2 0.2 C 0.3 0.3 0.5 0.5 0.8 0.8', // Bezier curve C
      'M 0.2 0.2 Q 0.5 0.5 0.8 0.8',         // Quadratic curve Q
      'M 0.2 0.2 L 0.8 0.8 Z',               // Close path Z
      '<svg><path d="M 0 0"/></svg>',        // SVG element
      '<script>alert(1)</script>',           // Script injection
      'javascript:void(0)',                  // URL
    ];

    for (const badPath of badPaths) {
      const input = {
        characterId: dummyCharId,
        source: 'Lingora Test',
        license: 'CC0-1.0',
        strokes: [
          {
            index: 1,
            points: [[0.2, 0.2], [0.8, 0.8]],
            path: badPath,
          },
        ],
      };
      const res = validateStrokeDataInput(input);
      assert.equal(res.success, false, `Expected path to be rejected: ${badPath}`);
    }
  });

  test('regression: syntactically valid M/L path pointing elsewhere is rejected as discrepancy', () => {
    const input = {
      characterId: dummyCharId,
      source: 'Lingora Test',
      license: 'CC0-1.0',
      strokes: [
        {
          index: 1,
          points: [
            [0.2, 0.3],
            [0.6, 0.7],
          ],
          // Valid M/L syntax, but points elsewhere
          path: 'M 0.5 0.5 L 0.9 0.9',
        },
      ],
    };
    const res = validateStrokeDataInput(input);
    assert.equal(res.success, false);
    const hasPathIssue = (res.error?.issues ?? []).some((issue) => issue.path.includes('path'));
    assert.equal(hasPathIssue, true, 'Expected validation error on path discrepancy with points');
  });

  test('supplied path with mismatched number of points is rejected', () => {
    const input = {
      characterId: dummyCharId,
      source: 'Lingora Test',
      license: 'CC0-1.0',
      strokes: [
        {
          index: 1,
          points: [
            [0.2, 0.3],
            [0.6, 0.7],
          ],
          // Has 3 points in path instead of 2
          path: 'M 0.2 0.3 L 0.4 0.5 L 0.6 0.7',
        },
      ],
    };
    const res = validateStrokeDataInput(input);
    assert.equal(res.success, false);
  });

  test('stroke with points collapsing to zero length after precision rounding is rejected', () => {
    const input = {
      characterId: dummyCharId,
      source: 'Lingora Test',
      license: 'CC0-1.0',
      strokes: [
        {
          index: 1,
          points: [
            [0.500001, 0.500001],
            [0.500002, 0.500002],
          ],
        },
      ],
    };
    const res = validateStrokeDataInput(input);
    assert.equal(res.success, false);
  });
});

describe('S6-02: Provenance, Source, License & Payload Size Limits', () => {
  const dummyCharId = randomUUID();

  test('empty source or empty license is rejected', () => {
    const emptySource = {
      characterId: dummyCharId,
      source: '   ',
      license: 'CC0-1.0',
      strokes: [{ index: 1, points: [[0.1, 0.1], [0.9, 0.9]] }],
    };
    assert.equal(validateStrokeDataInput(emptySource).success, false);

    const emptyLicense = {
      characterId: dummyCharId,
      source: 'Lingora Test',
      license: '',
      strokes: [{ index: 1, points: [[0.1, 0.1], [0.9, 0.9]] }],
    };
    assert.equal(validateStrokeDataInput(emptyLicense).success, false);
  });

  test('provenance requires author and attribution with strict schema', () => {
    const valid = {
      characterId: dummyCharId,
      source: 'Lingora Test',
      license: 'CC0-1.0',
      provenance: {
        author: 'Lingora Team',
        version: '1.0.0',
        attribution: 'Self-authored normalized stroke coordinates',
        licenseObligations: 'CC0 Public Domain',
      },
      strokes: [{ index: 1, points: [[0.1, 0.1], [0.9, 0.9]] }],
    };
    assert.equal(validateStrokeDataInput(valid).success, true);

    // Unrecognized field rejected (strict schema)
    const withExtra = {
      ...valid,
      provenance: {
        ...valid.provenance,
        unknownField: 'bad',
      },
    };
    assert.equal(validateStrokeDataInput(withExtra).success, false);
  });

  test('payload exceeding 256 KiB byte limit is rejected', () => {
    // Generate large harmless string in notes
    const largeNotes = 'a'.repeat(260 * 1024);
    const input = {
      characterId: dummyCharId,
      source: 'Lingora Test',
      license: 'CC0-1.0',
      provenance: {
        author: 'Lingora Team',
        attribution: 'Lingora Team',
        notes: largeNotes,
      },
      strokes: [{ index: 1, points: [[0.1, 0.1], [0.9, 0.9]] }],
    };
    const res = validateStrokeDataInput(input);
    assert.equal(res.success, false);
  });
});

describe('S6-02: Self-Authored Japanese & Chinese Fixtures Validation', () => {
  test('all self-authored fixtures in SELF_AUTHORED_FIXTURES pass validation', () => {
    assert.ok(SELF_AUTHORED_FIXTURES.length >= 8, 'Expected at least 8 fixtures (4 JA + 4 ZH)');

    for (const fixture of SELF_AUTHORED_FIXTURES) {
      assert.ok(['ja', 'zh'].includes(fixture.languageCode));
      assert.ok(fixture.glyph.length > 0);
      assert.ok(fixture.strokes.length === fixture.strokeCount);
      assert.ok(fixture.source.length > 0);
      assert.ok(fixture.license.length > 0);
      assert.ok(fixture.provenance.author.length > 0);
      assert.ok(fixture.provenance.attribution.length > 0);

      // Validate through the full validator with expected stroke count
      const validationInput = {
        characterId: randomUUID(),
        version: 1,
        strokes: fixture.strokes,
        source: fixture.source,
        license: fixture.license,
        provenance: fixture.provenance,
      };

      const res = validateStrokeDataInput(validationInput, fixture.strokeCount);
      assert.equal(
        res.success,
        true,
        `Fixture for glyph "${fixture.glyph}" (${fixture.languageCode}) failed validation: ${!res.success ? res.error?.message : ''}`
      );
    }
  });

  test('areStrokesEqual correctly detects identical vs differing stroke datasets', () => {
    const s1 = [createStroke(1, [[0.2, 0.2], [0.8, 0.8]])];
    const s1Identical = [createStroke(1, [[0.2, 0.2], [0.8, 0.8]])];
    const s1Different = [createStroke(1, [[0.2, 0.2], [0.8, 0.85]])];
    const s1MicroDiff = [createStroke(1, [[0.2, 0.2], [0.8, 0.80005]])];
    const s2 = [
      createStroke(1, [[0.2, 0.2], [0.8, 0.8]]),
      createStroke(2, [[0.3, 0.3], [0.7, 0.7]]),
    ];

    assert.equal(areStrokesEqual(s1, s1Identical), true);
    assert.equal(areStrokesEqual(s1, s1Different), false);
    assert.equal(areStrokesEqual(s1, s1MicroDiff), false, 'Micro-differences in coordinates must not be loosely tolerated');
    assert.equal(areStrokesEqual(s1, s2), false);
    assert.equal(areStrokesEqual(null, s1), false);
  });
});
