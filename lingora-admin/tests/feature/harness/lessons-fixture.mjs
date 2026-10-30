import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

/**
 * Disposable stateful Prisma double for Slice 5 Lessons & Assignments.
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
      l.unit = {
        ...structuredClone(unit),
        course: course ? structuredClone(course) : null,
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
    },
    unit: {
      findUnique: async ({ where }) => {
        const u = state.units.get(where.id?.toLowerCase());
        if (!u) return null;
        const res = structuredClone(u);
        const course = state.courses.get(res.courseId);
        res.course = course ? structuredClone(course) : null;
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
        // Check uniqueness of (unitId, position)
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
          assert.equal(prior?.lessonId, data.lessonId); assert.ok(prior.revisionNo < data.revisionNo);
        }
        if ([...state.revisions.values()].some(r => r.lessonId === data.lessonId && r.revisionNo === data.revisionNo)) throw Object.assign(new Error('duplicate revision'), { code: 'P2002' });
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
      throw error;
    } finally {
      release();
    }
  };

  return { state, fail, calls, db };
}
