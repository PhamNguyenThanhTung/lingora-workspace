import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

/**
 * Disposable stateful Prisma double for Slice 5 & 6 Lessons, Assignments, Exercises & Vocabulary.
 * Supports parameterized $queryRaw FOR UPDATE locking, full relational queries,
 * transactional atomicity with complete rollback on any mutation failure.
 */
export function lessonsFixture() {
  const state = {
    accounts: new Map(),
    courses: new Map(),
    units: new Map(),
    lessons: new Map(),
    assignments: new Map(),
    histories: new Map(),
    revisions: new Map(),
    itemIdentities: new Map(),
    itemRevisions: new Map(),
    itemGradingSecrets: new Map(),
    lessonExercises: new Map(),
    vocabularyConcepts: new Map(),
    lessonVocabularyLinks: new Map(),
    mediaBindings: new Map(),
    mediaAssets: new Map(),
  };

  const fail = {};
  const calls = { queryRaw: 0, transactions: 0 };

  const matches = (row, where) => {
    if (!where) return true;
    return Object.entries(where).every(([k, v]) => {
      if (v === undefined) return true;
      if (v && typeof v === 'object') {
        if ('not' in v) return row[k] !== v.not;
        if ('in' in v) return v.in.includes(row[k]);
        if ('select' in v) return true;
      }
      return row[k] === v;
    });
  };

  const changed = (row, data) => {
    Object.entries(data).forEach(([k, v]) => {
      if (v && typeof v === 'object' && 'increment' in v) {
        row[k] = (row[k] || 0n) + BigInt(v.increment);
      } else {
        row[k] = v;
      }
    });
  };

  const populateRelations = (lesson, include = {}) => {
    const l = structuredClone(lesson);
    const unit = state.units.get(l.unitId);
    if (unit) {
      const course = state.courses.get(unit.courseId);
      const c = course ? structuredClone(course) : null;
      if (c && !c.languageId) c.languageId = '22222222-2222-4222-8222-222222222222';
      l.unit = {
        ...structuredClone(unit),
        course: c,
      };
    }
    const assignment = [...state.assignments.values()].find((a) => a.lessonId === l.id);
    if (assignment) {
      const teacher = state.accounts.get(assignment.currentTeacherId);
      l.assignment = {
        ...structuredClone(assignment),
        currentTeacher: teacher ? structuredClone(teacher) : null,
      };
    } else {
      l.assignment = null;
    }
    const revs = [...state.revisions.values()]
      .filter((r) => r.lessonId === l.id)
      .sort((a, b) => b.revisionNo - a.revisionNo);
    l.revisions = (include.revisions?.take ? revs.slice(0, include.revisions.take) : revs).map((r) => {
      const rev = structuredClone(r);
      const creator = state.accounts.get(rev.createdBy);
      const lastEditor = state.accounts.get(rev.lastEditedBy);
      rev.creator = creator ? structuredClone(creator) : null;
      rev.lastEditor = lastEditor ? structuredClone(lastEditor) : null;

      const exList = [...state.lessonExercises.values()]
        .filter(e => e.lessonRevisionId === rev.id)
        .sort((a, b) => a.position - b.position);
      const vlList = [...state.lessonVocabularyLinks.values()]
        .filter(v => v.lessonRevisionId === rev.id)
        .sort((a, b) => a.position - b.position);
      const mbList = [...state.mediaBindings.values()]
        .filter(m => m.lessonRevisionId === rev.id);
      const irList = [...state.itemRevisions.values()]
        .filter(ir => ir.authoringLessonRevisionId === rev.id);

      rev._count = {
        exercises: Math.max(r._count?.exercises || 0, exList.length),
        vocabularyLinks: Math.max(r._count?.vocabularyLinks || 0, vlList.length),
        mediaBindings: Math.max(r._count?.mediaBindings || 0, mbList.length),
        authoredItemRevisions: Math.max(r._count?.authoredItemRevisions || 0, irList.length),
        attempts: r._count?.attempts !== undefined ? r._count.attempts : 0,
        assessmentVersionItems: r._count?.assessmentVersionItems !== undefined ? r._count.assessmentVersionItems : 0,
      };

      if (include.revisions?.include?.exercises) {
        rev.exercises = exList.map(e => {
          const ex = structuredClone(e);
          const item = state.itemIdentities.get(ex.itemId);
          const itemRev = state.itemRevisions.get(ex.itemRevisionId);
          ex.item = item ? structuredClone(item) : null;
          if (itemRev) {
            const ir = structuredClone(itemRev);
            const secret = [...state.itemGradingSecrets.values()].find(s => s.itemRevisionId === ir.id);
            ir.gradingSecret = secret ? structuredClone(secret) : null;
            ir._count = { ...ir._count, mediaBindings: [...state.mediaBindings.values()].filter(m => m.itemRevisionId === ir.id).length };
            ex.itemRevision = ir;
          } else {
            ex.itemRevision = null;
          }
          return ex;
        });
      }

      if (include.revisions?.include?.vocabularyLinks) {
        rev.vocabularyLinks = vlList.map(v => {
          const vl = structuredClone(v);
          const concept = state.vocabularyConcepts.get(vl.vocabularyId);
          vl.vocabulary = concept ? structuredClone(concept) : null;
          return vl;
        });
      }

      return rev;
    });
    return l;
  };

  const db = {
    account: {
      findUnique: async ({ where }) => structuredClone(state.accounts.get(where.id?.toLowerCase()) || null),
      findMany: async ({ where, orderBy }) => {
        let rows = [...state.accounts.values()].filter((a) => matches(a, where));
        return rows.map((r) => structuredClone(r));
      },
    },
    course: {
      findUnique: async ({ where }) => structuredClone(state.courses.get(where.id?.toLowerCase()) || null),
      findFirst: async ({ where }) => {
        let rows = [...state.courses.values()];
        if (where?.units?.some?.lessons?.some?.id) {
          const lId = where.units.some.lessons.some.id.toLowerCase();
          const lesson = state.lessons.get(lId);
          if (!lesson) return null;
          const unit = state.units.get(lesson.unitId);
          if (!unit) return null;
          const course = state.courses.get(unit.courseId);
          return course ? structuredClone(course) : null;
        }
        return rows.length > 0 ? structuredClone(rows[0]) : null;
      },
    },
    unit: {
      findUnique: async ({ where }) => {
        const u = state.units.get(where.id?.toLowerCase());
        if (!u) return null;
        const res = structuredClone(u);
        const course = state.courses.get(res.courseId);
        const c = course ? structuredClone(course) : null;
        if (c && !c.languageId) c.languageId = '22222222-2222-4222-8222-222222222222';
        res.course = c;
        return res;
      },
    },
    lesson: {
      findUnique: async ({ where, include }) => {
        const l = state.lessons.get(where.id?.toLowerCase());
        if (!l) return null;
        if (include) return populateRelations(l, include);
        return structuredClone(l);
      },
      findFirst: async ({ where, include }) => {
        const list = [...state.lessons.values()];
        const match = list.find((l) => {
          if (where.id && !matches(l, { id: where.id })) return false;
          if (where.unitId && l.unitId !== where.unitId.toLowerCase()) return false;
          if (where.position !== undefined && l.position !== where.position) return false;
          if (where.assignment) {
            const assignment = [...state.assignments.values()].find((a) => a.lessonId === l.id);
            if (!assignment || !matches(assignment, where.assignment)) return false;
          }
          return true;
        });
        if (!match) return null;
        if (include) return populateRelations(match, include);
        return structuredClone(match);
      },
      findMany: async ({ where, include }) => {
        let list = [...state.lessons.values()];
        if (where?.unitId) {
          list = list.filter((l) => l.unitId === where.unitId.toLowerCase());
        }
        if (where?.assignment) {
          list = list.filter((l) => {
            const assignment = [...state.assignments.values()].find((a) => a.lessonId === l.id);
            if (!assignment) return false;
            return matches(assignment, where.assignment);
          });
        }
        list.sort((a, b) => a.position - b.position);
        if (include) return list.map(l => populateRelations(l, include));
        return list.map((l) => structuredClone(l));
      },
      create: async ({ data, include }) => {
        if (fail.lessonCreate) throw new Error('database unavailable');
        const duplicate = [...state.lessons.values()].find(
          (l) => l.unitId === data.unitId.toLowerCase() && l.position === data.position
        );
        if (duplicate) {
          throw Object.assign(new Error('duplicate position'), { code: 'P2002' });
        }
        const row = {
          id: data.id || randomUUID(),
          unitId: data.unitId.toLowerCase(),
          position: data.position,
          isRequired: data.isRequired ?? true,
          availability: data.availability || 'PLANNED',
          activeRevisionId: null,
          rowVersion: 1n,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        state.lessons.set(row.id, row);
        if (include) return populateRelations(row);
        return structuredClone(row);
      },
      update: async ({ where, data, include }) => {
        if (fail.lessonUpdate) throw new Error('lesson update failed');
        const row = state.lessons.get(where.id?.toLowerCase());
        if (!row) throw Object.assign(new Error('record not found'), { code: 'P2025' });
        if (data.position && data.position !== row.position) {
          const duplicate = [...state.lessons.values()].find(
            (l) => l.id !== row.id && l.unitId === row.unitId && l.position === data.position
          );
          if (duplicate) throw Object.assign(new Error('duplicate position'), { code: 'P2002' });
        }
        changed(row, data);
        row.updatedAt = new Date();
        if (include) return populateRelations(row);
        return structuredClone(row);
      },
    },
    contentAssignment: {
      findUnique: async ({ where }) => {
        if (where.id) return structuredClone(state.assignments.get(where.id) || null);
        if (where.lessonId) {
          const match = [...state.assignments.values()].find((a) => a.lessonId === where.lessonId.toLowerCase());
          return match ? structuredClone(match) : null;
        }
        return null;
      },
      create: async ({ data }) => {
        if (fail.assignmentCreate) throw new Error('assignment create failed');
        assert.ok(state.lessons.has(data.lessonId), 'assignment Lesson FK');
        assert.ok(state.accounts.has(data.createdBy) && state.accounts.has(data.currentTeacherId), 'assignment Account FKs');
        if ([...state.assignments.values()].some(a => a.lessonId === data.lessonId)) throw Object.assign(new Error('duplicate assignment'), { code: 'P2002' });
        const row = {
          id: data.id || randomUUID(),
          lessonId: data.lessonId.toLowerCase(),
          createdBy: data.createdBy.toLowerCase(),
          currentTeacherId: data.currentTeacherId.toLowerCase(),
          requirement: data.requirement || {},
          scope: data.scope || {},
          scopeGeneration: data.scopeGeneration || 1n,
          rowVersion: 1n,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        state.assignments.set(row.id, row);
        return structuredClone(row);
      },
      update: async ({ where, data }) => {
        if (fail.assignmentUpdate) throw new Error('assignment update failed');
        const row = state.assignments.get(where.id);
        if (!row) throw new Error('not found');
        changed(row, data);
        row.updatedAt = new Date();
        return structuredClone(row);
      },
    },
    assignmentHistory: {
      findFirst: async ({ where, orderBy }) => {
        let rows = [...state.histories.values()].filter((h) => matches(h, where));
        if (orderBy?.sequenceNo === 'desc') {
          rows.sort((a, b) => b.sequenceNo - a.sequenceNo);
        }
        return rows.length > 0 ? structuredClone(rows[0]) : null;
      },
      create: async ({ data }) => {
        if (fail.historyCreate) throw new Error('history create failed');
        assert.ok(state.assignments.has(data.assignmentId), 'history assignment FK');
        assert.ok(state.accounts.has(data.nextTeacherId) && state.accounts.has(data.changedBy), 'history Account FKs');
        if ([...state.histories.values()].some(h => h.assignmentId === data.assignmentId && h.sequenceNo === data.sequenceNo)) throw Object.assign(new Error('duplicate sequence'), { code: 'P2002' });
        const row = {
          id: data.id || randomUUID(),
          assignmentId: data.assignmentId,
          sequenceNo: data.sequenceNo,
          eventType: data.eventType,
          previousTeacherId: data.previousTeacherId ? data.previousTeacherId.toLowerCase() : null,
          nextTeacherId: data.nextTeacherId.toLowerCase(),
          scopeGeneration: data.scopeGeneration,
          changedBy: data.changedBy.toLowerCase(),
          scopeSnapshot: data.scopeSnapshot || {},
          changedAt: new Date(),
          createdAt: new Date(),
        };
        state.histories.set(row.id, row);
        return structuredClone(row);
      },
    },
    lessonRevision: {
      findFirst: async ({ where, orderBy, include }) => {
        let rows = [...state.revisions.values()].filter(r => matches(r, where));
        if (orderBy?.revisionNo === 'desc') {
          rows.sort((a, b) => b.revisionNo - a.revisionNo);
        }
        if (rows.length === 0) return null;
        const rev = structuredClone(rows[0]);
        if (include?.creator) {
          const u = state.accounts.get(rev.createdBy);
          rev.creator = u ? structuredClone(u) : null;
        }
        if (include?.lastEditor) {
          const u = state.accounts.get(rev.lastEditedBy);
          rev.lastEditor = u ? structuredClone(u) : null;
        }

        const exList = [...state.lessonExercises.values()]
          .filter(e => e.lessonRevisionId === rev.id)
          .sort((a, b) => a.position - b.position);
        const vlList = [...state.lessonVocabularyLinks.values()]
          .filter(v => v.lessonRevisionId === rev.id)
          .sort((a, b) => a.position - b.position);
        const mbList = [...state.mediaBindings.values()]
          .filter(m => m.lessonRevisionId === rev.id);
        const irList = [...state.itemRevisions.values()]
          .filter(ir => ir.authoringLessonRevisionId === rev.id);

        rev._count = {
          exercises: Math.max(rows[0]._count?.exercises || 0, exList.length),
          vocabularyLinks: Math.max(rows[0]._count?.vocabularyLinks || 0, vlList.length),
          mediaBindings: Math.max(rows[0]._count?.mediaBindings || 0, mbList.length),
          authoredItemRevisions: Math.max(rows[0]._count?.authoredItemRevisions || 0, irList.length),
          attempts: rows[0]._count?.attempts !== undefined ? rows[0]._count.attempts : 0,
          assessmentVersionItems: rows[0]._count?.assessmentVersionItems !== undefined ? rows[0]._count.assessmentVersionItems : 0,
        };

        if (include?.exercises) {
          rev.exercises = exList.map(e => {
            const ex = structuredClone(e);
            const item = state.itemIdentities.get(ex.itemId);
            const itemRev = state.itemRevisions.get(ex.itemRevisionId);
            ex.item = item ? structuredClone(item) : null;
            if (itemRev) {
              const ir = structuredClone(itemRev);
              const secret = [...state.itemGradingSecrets.values()].find(s => s.itemRevisionId === ir.id);
              ir.gradingSecret = secret ? structuredClone(secret) : null;
            ir._count = { ...ir._count, mediaBindings: [...state.mediaBindings.values()].filter(m => m.itemRevisionId === ir.id).length };
              ex.itemRevision = ir;
            } else {
              ex.itemRevision = null;
            }
            return ex;
          });
        }
        if (include?.vocabularyLinks) {
          rev.vocabularyLinks = vlList.map(v => {
            const vl = structuredClone(v);
            const concept = state.vocabularyConcepts.get(vl.vocabularyId);
            vl.vocabulary = concept ? structuredClone(concept) : null;
            return vl;
          });
        }
        return rev;
      },
      create: async ({ data }) => {
        if (fail.revisionCreate) throw new Error('revision create failed');
        assert.notEqual(data.coverageSnapshot, null, 'nullable JSON requires omitted SQL NULL or explicit Prisma null enum');
        const assignment = state.assignments.get(data.assignmentId), episode = state.histories.get(data.creationAssignmentEpisodeId);
        assert.equal(assignment?.lessonId, data.lessonId, 'revision assignment/Lesson composite FK');
        assert.equal(episode?.assignmentId, data.assignmentId, 'revision episode/assignment composite FK');
        assert.equal(episode?.nextTeacherId, data.createdBy, 'actual corrected migration provenance guard');
        if (data.priorRevisionId) {
          const prior = state.revisions.get(data.priorRevisionId);
          assert.equal(prior?.lessonId, data.lessonId);
          assert.ok(prior.revisionNo < data.revisionNo);
        }
        if ([...state.revisions.values()].some(r => r.lessonId === data.lessonId && r.revisionNo === data.revisionNo)) {
          throw Object.assign(new Error('duplicate revision'), { code: 'P2002' });
        }
        const row = {
          id: data.id || randomUUID(),
          lessonId: data.lessonId.toLowerCase(),
          revisionNo: data.revisionNo,
          priorRevisionId: data.priorRevisionId || null,
          changeSummary: data.changeSummary || null,
          assignmentId: data.assignmentId,
          creationAssignmentEpisodeId: data.creationAssignmentEpisodeId,
          status: data.status || 'DRAFT',
          title: data.title || {},
          contentBlocks: data.contentBlocks || [],
          topicIds: data.topicIds || [],
          skillIds: data.skillIds || [],
          purposeTags: data.purposeTags || [],
          coverageCatalogGeneration: data.coverageCatalogGeneration || null,
          coverageSnapshot: data.coverageSnapshot || null,
          submittedAssignmentGeneration: data.submittedAssignmentGeneration || null,
          assignmentScopeSnapshot: data.assignmentScopeSnapshot || null,
          createdBy: data.createdBy.toLowerCase(),
          lastEditedBy: data.lastEditedBy.toLowerCase(),
          submittedBy: null,
          submittedAt: null,
          approvedBy: null,
          approvedAt: null,
          publishedBy: null,
          publishedAt: null,
          endedAt: null,
          rowVersion: 1n,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: {
            exercises: 0,
            vocabularyLinks: 0,
            mediaBindings: 0,
            authoredItemRevisions: 0,
            attempts: 0,
            assessmentVersionItems: 0,
          },
        };
        state.revisions.set(row.id, row);
        return structuredClone(row);
      },
    },
    itemIdentity: {
      findUnique: async ({ where }) => structuredClone(state.itemIdentities.get(where.id?.toLowerCase()) || null),
      findMany: async ({ where }) => {
        let rows = [...state.itemIdentities.values()].filter(i => matches(i, where));
        return rows.map(r => structuredClone(r));
      },
      create: async ({ data }) => {
        if (fail.itemIdentityCreate) throw new Error('itemIdentity create failed');
        assert.equal(data.origin, 'PRACTICE', 'Item exercise origin must be PRACTICE');
        assert.ok(data.exactFingerprint && data.exactFingerprint.trim().length > 0, 'exactFingerprint required');
        const row = {
          id: data.id || randomUUID(),
          origin: data.origin,
          createdBy: data.createdBy.toLowerCase(),
          variantOfId: data.variantOfId || null,
          exactFingerprint: data.exactFingerprint,
          practiceExposedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        state.itemIdentities.set(row.id, row);
        return structuredClone(row);
      },
    },
    itemRevision: {
      findUnique: async ({ where }) => {
        if (where.id) return structuredClone(state.itemRevisions.get(where.id?.toLowerCase()) || null);
        if (where.itemId_revisionNo) {
          const match = [...state.itemRevisions.values()].find(
            r => r.itemId === where.itemId_revisionNo.itemId.toLowerCase() && r.revisionNo === where.itemId_revisionNo.revisionNo
          );
          return match ? structuredClone(match) : null;
        }
        return null;
      },
      findFirst: async ({ where, orderBy }) => {
        let rows = [...state.itemRevisions.values()].filter(r => matches(r, where));
        if (orderBy?.revisionNo === 'desc') {
          rows.sort((a, b) => b.revisionNo - a.revisionNo);
        }
        return rows.length > 0 ? structuredClone(rows[0]) : null;
      },
      findMany: async ({ where }) => {
        let rows = [...state.itemRevisions.values()].filter(r => matches(r, where));
        return rows.map(r => structuredClone(r));
      },
      create: async ({ data }) => {
        if (fail.itemRevisionCreate) throw new Error('itemRevision create failed');
        assert.ok(state.itemIdentities.has(data.itemId), 'itemRevision item FK');
        assert.ok(state.revisions.has(data.authoringLessonRevisionId), 'itemRevision authoringLessonRevision FK');
        const ep = state.histories.get(data.creationAssignmentEpisodeId);
        assert.ok(ep, 'itemRevision creation episode FK');
        assert.equal(ep.nextTeacherId, data.createdBy, 'itemRevision created_by must match episode nextTeacherId');
        const parentRev = state.revisions.get(data.authoringLessonRevisionId);
        assert.equal(ep.assignmentId, parentRev.assignmentId, 'episode assignment must match lesson revision assignment');

        if ([...state.itemRevisions.values()].some(r => r.itemId === data.itemId && r.revisionNo === data.revisionNo)) {
          throw Object.assign(new Error('duplicate item revision'), { code: 'P2002' });
        }
        const row = {
          id: data.id || randomUUID(),
          itemId: data.itemId.toLowerCase(),
          revisionNo: data.revisionNo,
          type: data.type,
          promptData: structuredClone(data.promptData),
          practiceSkillIds: data.practiceSkillIds || [],
          practiceCoverageSnapshot: data.practiceCoverageSnapshot || null,
          schemaVersion: data.schemaVersion || 1,
          exactFingerprint: data.exactFingerprint,
          createdBy: data.createdBy.toLowerCase(),
          creationAssignmentEpisodeId: data.creationAssignmentEpisodeId,
          authoringLessonRevisionId: data.authoringLessonRevisionId,
          assessmentBlueprintId: null,
          blueprintGeneration: null,
          isDraftOmitted: false,
          frozenAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          rowVersion: 1n,
        };
        state.itemRevisions.set(row.id, row);
        return structuredClone(row);
      },
    },
    itemGradingSecret: {
      findUnique: async ({ where }) => {
        if (where.itemRevisionId) {
          const match = [...state.itemGradingSecrets.values()].find(s => s.itemRevisionId === where.itemRevisionId.toLowerCase());
          return match ? structuredClone(match) : null;
        }
        return null;
      },
      create: async ({ data }) => {
        if (fail.gradingSecretCreate) throw new Error('gradingSecret create failed');
        assert.ok(state.itemRevisions.has(data.itemRevisionId), 'gradingSecret itemRevision FK');
        if ([...state.itemGradingSecrets.values()].some(s => s.itemRevisionId === data.itemRevisionId.toLowerCase())) {
          throw Object.assign(new Error('duplicate grading secret'), { code: 'P2002' });
        }
        const row = {
          id: data.id || randomUUID(),
          itemRevisionId: data.itemRevisionId.toLowerCase(),
          gradingData: structuredClone(data.gradingData),
          feedbackData: data.feedbackData ? structuredClone(data.feedbackData) : null,
          schemaVersion: data.schemaVersion || 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        state.itemGradingSecrets.set(row.id, row);
        return structuredClone(row);
      },
    },
    lessonExercise: {
      findUnique: async ({ where }) => {
        if (where.id) return structuredClone(state.lessonExercises.get(where.id?.toLowerCase()) || null);
        return null;
      },
      findMany: async ({ where, orderBy, include }) => {
        let rows = [...state.lessonExercises.values()].filter(e => matches(e, where));
        if (orderBy?.position === 'asc') rows.sort((a, b) => a.position - b.position);
        return rows.map(e => {
          const res = structuredClone(e);
          if (include?.item) res.item = structuredClone(state.itemIdentities.get(e.itemId) || null);
          if (include?.itemRevision) {
            const ir = state.itemRevisions.get(e.itemRevisionId);
            if (ir) {
              const irClone = structuredClone(ir);
              if (include.itemRevision?.include?.gradingSecret) {
                irClone.gradingSecret = structuredClone(state.itemGradingSecrets.get(ir.id) || null);
              }
              res.itemRevision = irClone;
            } else {
              res.itemRevision = null;
            }
          }
          return res;
        });
      },
      create: async ({ data }) => {
        if (fail.lessonExerciseCreate) throw new Error('lessonExercise create failed');
        assert.ok(state.revisions.has(data.lessonRevisionId), 'lessonExercise revision FK');
        assert.ok(state.itemRevisions.has(data.itemRevisionId), 'lessonExercise itemRevision FK');
        assert.ok(state.itemIdentities.has(data.itemId), 'lessonExercise item FK');
        assert.equal(state.itemRevisions.get(data.itemRevisionId).itemId, data.itemId, 'composite item revision identity FK');
        assert.ok(Number.isInteger(data.position) && data.position > 0 && data.position <= 2147483647, 'positive int32 position');

        if ([...state.lessonExercises.values()].some(e => e.lessonRevisionId === data.lessonRevisionId && e.position === data.position)) {
          throw Object.assign(new Error('duplicate exercise position'), { code: 'P2002' });
        }
        if ([...state.lessonExercises.values()].some(e => e.lessonRevisionId === data.lessonRevisionId && e.itemId === data.itemId)) {
          throw Object.assign(new Error('duplicate exercise item'), { code: 'P2002' });
        }
        const row = {
          id: data.id || randomUUID(),
          lessonRevisionId: data.lessonRevisionId.toLowerCase(),
          itemRevisionId: data.itemRevisionId.toLowerCase(),
          itemId: data.itemId.toLowerCase(),
          position: data.position,
          isCore: data.isCore ?? true,
          createdAt: new Date(),
        };
        state.lessonExercises.set(row.id, row);
        return structuredClone(row);
      },
    },
    vocabularyConcept: {
      findUnique: async ({ where }) => {
        if (where.id) return structuredClone(state.vocabularyConcepts.get(where.id?.toLowerCase()) || null);
        if (where.languageId_normalizedForm_senseKey) {
          const { languageId, normalizedForm, senseKey } = where.languageId_normalizedForm_senseKey;
          const match = [...state.vocabularyConcepts.values()].find(
            v => v.languageId === languageId.toLowerCase() && v.normalizedForm === normalizedForm && v.senseKey === senseKey
          );
          return match ? structuredClone(match) : null;
        }
        return null;
      },
      findFirst: async ({ where }) => {
        let rows = [...state.vocabularyConcepts.values()].filter(v => matches(v, where));
        return rows.length > 0 ? structuredClone(rows[0]) : null;
      },
      findMany: async ({ where, orderBy, take }) => {
        let rows = [...state.vocabularyConcepts.values()].filter(v => matches(v, where));
        if (orderBy?.senseKey === 'asc') rows.sort((a, b) => a.senseKey.localeCompare(b.senseKey));
        if (take) rows = rows.slice(0, take);
        return rows.map(r => structuredClone(r));
      },
      create: async ({ data }) => {
        if (fail.vocabularyConceptCreate) throw new Error('vocabularyConcept create failed');
        if ([...state.vocabularyConcepts.values()].some(
          v => v.languageId === data.languageId.toLowerCase() && v.normalizedForm === data.normalizedForm && v.senseKey === data.senseKey
        )) {
          throw Object.assign(new Error('duplicate vocabulary concept'), { code: 'P2002' });
        }
        const row = {
          id: data.id || randomUUID(),
          languageId: data.languageId.toLowerCase(),
          canonicalForm: data.canonicalForm,
          normalizedForm: data.normalizedForm,
          senseKey: data.senseKey,
          meaningLabels: structuredClone(data.meaningLabels),
          phonetic: data.phonetic || null,
          partOfSpeech: data.partOfSpeech || null,
          example: data.example || null,
          createdBy: data.createdBy.toLowerCase(),
          frozenAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          rowVersion: 1n,
        };
        state.vocabularyConcepts.set(row.id, row);
        return structuredClone(row);
      },
    },
    lessonVocabularyLink: {
      findUnique: async ({ where }) => {
        if (where.id) return structuredClone(state.lessonVocabularyLinks.get(where.id?.toLowerCase()) || null);
        return null;
      },
      findMany: async ({ where, orderBy, include }) => {
        let rows = [...state.lessonVocabularyLinks.values()].filter(v => matches(v, where));
        if (orderBy?.position === 'asc') rows.sort((a, b) => a.position - b.position);
        return rows.map(v => {
          const res = structuredClone(v);
          if (include?.vocabulary) res.vocabulary = structuredClone(state.vocabularyConcepts.get(v.vocabularyId) || null);
          return res;
        });
      },
      create: async ({ data }) => {
        if (fail.lessonVocabularyLinkCreate) throw new Error('lessonVocabularyLink create failed');
        assert.ok(state.revisions.has(data.lessonRevisionId), 'lessonVocabularyLink revision FK');
        assert.ok(state.vocabularyConcepts.has(data.vocabularyId), 'lessonVocabularyLink vocabulary FK');

        if ([...state.lessonVocabularyLinks.values()].some(v => v.lessonRevisionId === data.lessonRevisionId && v.position === data.position)) {
          throw Object.assign(new Error('duplicate vocabulary position'), { code: 'P2002' });
        }
        if ([...state.lessonVocabularyLinks.values()].some(v => v.lessonRevisionId === data.lessonRevisionId && v.vocabularyId === data.vocabularyId)) {
          throw Object.assign(new Error('duplicate vocabulary link'), { code: 'P2002' });
        }
        const row = {
          id: data.id || randomUUID(),
          lessonRevisionId: data.lessonRevisionId.toLowerCase(),
          vocabularyId: data.vocabularyId.toLowerCase(),
          position: data.position,
          isCore: data.isCore ?? true,
          displaySnapshot: structuredClone(data.displaySnapshot),
          createdAt: new Date(),
        };
        state.lessonVocabularyLinks.set(row.id, row);
        return structuredClone(row);
      },
    },
    mediaBinding: {
      findMany: async ({ where }) => {
        let rows = [...state.mediaBindings.values()].filter(m => matches(m, where));
        return rows.map(r => structuredClone(r));
      },
      create: async ({ data }) => {
        const row = {
          id: data.id || randomUUID(),
          mediaAssetId: data.mediaAssetId,
          lessonRevisionId: data.lessonRevisionId || null,
          itemRevisionId: data.itemRevisionId || null,
          position: data.position,
          usage: data.usage,
          createdAt: new Date(),
        };
        state.mediaBindings.set(row.id, row);
        return structuredClone(row);
      },
    },
    $queryRaw: async (strings, ...args) => {
      calls.queryRaw++;
      const q = strings.join('?');

      if (q.includes('FROM app.accounts') && q.includes('FOR NO KEY UPDATE')) {
        const id = args[0]?.toLowerCase();
        const acc = state.accounts.get(id);
        if (!acc) return [];
        return [
          {
            id: acc.id,
            role: acc.role,
            status: acc.status,
            displayName: acc.displayName,
          },
        ];
      }

      if (q.includes('FROM app.lessons') && q.includes('FOR UPDATE')) {
        const id = args[0]?.toLowerCase();
        const l = state.lessons.get(id);
        if (!l) return [];
        return [
          {
            id: l.id,
            unitId: l.unitId,
            position: l.position,
            isRequired: l.isRequired,
            availability: l.availability,
            activeRevisionId: l.activeRevisionId,
            rowVersion: l.rowVersion,
          },
        ];
      }

      if (q.includes('FROM app.content_assignments') && q.includes('FOR UPDATE')) {
        const lessonId = args[0]?.toLowerCase();
        const assignment = [...state.assignments.values()].find((a) => a.lessonId === lessonId);
        if (!assignment) return [];
        return [
          {
            id: assignment.id,
            lessonId: assignment.lessonId,
            createdBy: assignment.createdBy,
            currentTeacherId: assignment.currentTeacherId,
            scopeGeneration: assignment.scopeGeneration,
            rowVersion: assignment.rowVersion,
            requirement: assignment.requirement,
            scope: assignment.scope,
          },
        ];
      }

      if (q.includes('FROM app.assignment_history')) {
        const assignmentId = args[0];
        const histories = [...state.histories.values()]
          .filter((h) => h.assignmentId === assignmentId)
          .sort((a, b) => b.sequenceNo - a.sequenceNo);
        if (histories.length === 0) return [];
        const h = histories[0];
        return [
          {
            id: h.id,
            assignmentId: h.assignmentId,
            sequenceNo: h.sequenceNo,
            nextTeacherId: h.nextTeacherId,
            scopeGeneration: h.scopeGeneration,
          },
        ];
      }

      if (q.includes('FROM app.item_identities') && q.includes('FOR UPDATE')) {
        const id = args[0]?.toLowerCase();
        const item = state.itemIdentities.get(id);
        if (!item) return [];
        return [{ id: item.id }];
      }

      throw new Error('Unexpected raw query in lessons double: ' + q);
    },
  };

  let tail = Promise.resolve();
  db.$transaction = async (fn) => {
    calls.transactions++;
    const previous = tail;
    let release;
    tail = new Promise((r) => {
      release = r;
    });
    await previous;

    // Deep snapshot state for transaction rollback
    const saved = {
      accounts: new Map([...state.accounts].map(([k, v]) => [k, structuredClone(v)])),
      courses: new Map([...state.courses].map(([k, v]) => [k, structuredClone(v)])),
      units: new Map([...state.units].map(([k, v]) => [k, structuredClone(v)])),
      lessons: new Map([...state.lessons].map(([k, v]) => [k, structuredClone(v)])),
      assignments: new Map([...state.assignments].map(([k, v]) => [k, structuredClone(v)])),
      histories: new Map([...state.histories].map(([k, v]) => [k, structuredClone(v)])),
      revisions: new Map([...state.revisions].map(([k, v]) => [k, structuredClone(v)])),
      itemIdentities: new Map([...state.itemIdentities].map(([k, v]) => [k, structuredClone(v)])),
      itemRevisions: new Map([...state.itemRevisions].map(([k, v]) => [k, structuredClone(v)])),
      itemGradingSecrets: new Map([...state.itemGradingSecrets].map(([k, v]) => [k, structuredClone(v)])),
      lessonExercises: new Map([...state.lessonExercises].map(([k, v]) => [k, structuredClone(v)])),
      vocabularyConcepts: new Map([...state.vocabularyConcepts].map(([k, v]) => [k, structuredClone(v)])),
      lessonVocabularyLinks: new Map([...state.lessonVocabularyLinks].map(([k, v]) => [k, structuredClone(v)])),
      mediaBindings: new Map([...state.mediaBindings].map(([k, v]) => [k, structuredClone(v)])),
      mediaAssets: new Map([...state.mediaAssets].map(([k, v]) => [k, structuredClone(v)])),
    };

    try {
      return await fn(db);
    } catch (error) {
      // Roll back state completely
      state.accounts = saved.accounts;
      state.courses = saved.courses;
      state.units = saved.units;
      state.lessons = saved.lessons;
      state.assignments = saved.assignments;
      state.histories = saved.histories;
      state.revisions = saved.revisions;
      state.itemIdentities = saved.itemIdentities;
      state.itemRevisions = saved.itemRevisions;
      state.itemGradingSecrets = saved.itemGradingSecrets;
      state.lessonExercises = saved.lessonExercises;
      state.vocabularyConcepts = saved.vocabularyConcepts;
      state.lessonVocabularyLinks = saved.lessonVocabularyLinks;
      state.mediaBindings = saved.mediaBindings;
      state.mediaAssets = saved.mediaAssets;
      throw error;
    } finally {
      release();
    }
  };

  return { state, fail, calls, db };
}
