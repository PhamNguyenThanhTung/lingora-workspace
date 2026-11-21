import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  assertActorSafe, assertCurriculumSafe, verifyDatabaseTarget, provisionDemoActors,
  DEMO_COURSE_SPEC, DEMO_UNITS_SPEC,
  ActorCollisionError, CurriculumCollisionError, TargetSafetyError,
} from '../../lingora-admin/src/server/curriculum/demo-a1.ts';

const actor = { id: 'e0000000-0000-4000-8000-00000000000a', expectedRole: 'TEACHER', displayName: 'Fixture', email: 'fixture@lingora.test' };

test('Actor ownership lookup failure aborts before any mutation', async () => {
  const db = {
    account: { findUnique: async () => null },
    $queryRawUnsafe: async () => { throw new Error('Auth lookup unavailable'); },
    $executeRawUnsafe: async () => assert.fail('No writes before verified ownership'),
  };
  await assert.rejects(() => assertActorSafe(db, actor), /Auth lookup unavailable/);
});

test('Existing account with unknown auth email cannot be claimed as a fixture actor', async () => {
  const db = {
    account: { findUnique: async () => ({ role: 'TEACHER', status: 'ACTIVE' }) },
    $queryRawUnsafe: async () => [{ id: actor.id, email: null }],
    $executeRawUnsafe: async () => assert.fail('Human identity must stay unchanged'),
  };
  await assert.rejects(() => assertActorSafe(db, actor), ActorCollisionError);
});

for (const names of [null, { ...DEMO_COURSE_SPEC.names, en: 'Unrelated course' }]) {
  test(`Course metadata collision is rejected: ${JSON.stringify(names)}`, async () => {
    const db = { course: { findUnique: async () => ({ ...DEMO_COURSE_SPEC, names }) } };
    await assert.rejects(() => assertCurriculumSafe(db), CurriculumCollisionError);
  });
}

test('Unit metadata collision is rejected even when one locale still matches', async () => {
  const unit = DEMO_UNITS_SPEC[0];
  const db = {
    course: { findUnique: async () => DEMO_COURSE_SPEC },
    unit: { findUnique: async () => ({ ...unit, names: { ...unit.names, en: 'Human unit' } }) },
  };
  await assert.rejects(() => assertCurriculumSafe(db), CurriculumCollisionError);
});

test('Unrelated lesson at fixture position is rejected before provision', async () => {
  const db = {
    course: { findUnique: async () => DEMO_COURSE_SPEC },
    unit: { findUnique: async () => null, findFirst: async () => null },
    lesson: { findFirst: async () => ({
      id: 'human-lesson', isRequired: true, assignment: { currentTeacherId: 'human-teacher' },
      revisions: [{ title: { vi: 'Human lesson' }, createdBy: 'human-teacher' }],
    }) },
  };
  await assert.rejects(() => assertCurriculumSafe(db), CurriculumCollisionError);
});

test('Environment cannot redefine the trusted DEV project', () => {
  const old = process.env.SUPABASE_DEV_PROJECT_REF;
  try {
    process.env.SUPABASE_DEV_PROJECT_REF = 'unknownproject999';
    assert.throws(() => verifyDatabaseTarget('postgresql://postgres:pass@db.unknownproject999.supabase.co:5432/postgres', {
      nodeEnv: 'development', allowRemoteDevTarget: 'unknownproject999',
    }), TargetSafetyError);
  } finally {
    if (old === undefined) delete process.env.SUPABASE_DEV_PROJECT_REF;
    else process.env.SUPABASE_DEV_PROJECT_REF = old;
  }
});

test('All actors are checked before the first mutation when a later actor collides', async () => {
  const db = {
    account: { findUnique: async ({ where }) => where.id === actor.id ? null : ({ role: 'LEARNER', status: 'ACTIVE' }) },
    $queryRawUnsafe: async () => [],
    $transaction: async () => assert.fail('Preflight must finish before mutation'),
  };
  await assert.rejects(() => provisionDemoActors(db, [actor, { ...actor, id: 'human-id' }]), ActorCollisionError);
});
