/**
 * A3 Unified Database Baseline, Guarded Workflow & Security Test Suite.
 *
 * Implements A3-MUST-R1-R3-R5-R6 Repair Acceptance:
 * - A3-R1 / M-05: Real fresh-run lifecycle, exact stackId/stackName binding, all 4 published matrices,
 *                 learning-context INSERT RLS (42501), private write forgery denials, zero-drift verification.
 * - A3-R3 / M-03: Fresh-only lifecycle, removal of cached authority, repeated setup denials, target absence pre-checks.
 * - A3-R5 / M-04: Full representable parity derived from schema.prisma line-by-line grammar vs live catalog,
 *                 60 foreign keys (58 derived + 2 provider), complete SQL-only manifest inventory expansion,
 *                 deliberate drift simulation.
 * - A3-R6 / M-02 / M-06: Anchored descriptor operations (/proc/self/fd/<dirfd>/...), entrypoint preflights
 *                        before DB connection, parent replacement detection, postcondition ENOENT cleanup proof.
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { getTestContext } from '../test-context.mjs';
import {
  validatePrismaContext,
  runGuardedPrismaCommand,
  createGuardedPrismaClient,
  getRuntimeCredentials,
  verifyPinnedPrisma,
  setupA3Baseline,
  cleanupA3Baseline,
  reconcileClusterRoles,
  disposeRuntimeCredentials,
  SCHEMA_PATH,
  PINNED_PRISMA_VERSION,
  SUPPORTED_COMMAND_OPTION_KEYS,
  SUPPORTED_CLIENT_OPTION_KEYS,
  SUPPORTED_COMMAND_ROLES,
  SUPPORTED_CLIENT_ROLES,
} from './prisma-helper.mjs';
import { EXPECTED_20_TABLES } from './fixture-lifecycle.mjs';
import {
  validateCredentialStorage,
  parseStrictRuntimeCredentials,
} from '../../../prisma/bootstrap/bootstrap-cluster.mjs';
import {
  openAnchoredRunDir,
  validateRunContextAuthority,
  storageCounters,
} from '../../../prisma/bootstrap/private-run-storage.mjs';
import {
  deriveExpectedSchemaBaseline,
  verifyBaselineParity,
  simulateDeliberateDrift,
} from './baseline-parity.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKSPACE_ROOT = path.resolve(__dirname, '../../../..');
const PROJECTION_FILE = path.resolve(
  WORKSPACE_ROOT,
  'docs/design/physical/evidence/2026-10-26-p1-continuation/p1-03a/repair-r1-r3-r5-r6/execution-projections.json'
);

const EXERCISED_FILES = [
  'lingora-admin/prisma/schema.prisma',
  'lingora-admin/prisma/migrations/20261026000000_a3_baseline/migration.sql',
  'lingora-admin/prisma/bootstrap/bootstrap-cluster.mjs',
  'lingora-admin/prisma/bootstrap/manifest.json',
  'lingora-admin/prisma/bootstrap/private-run-storage.mjs',
  'lingora-admin/tests/database/a3/prisma-helper.mjs',
  'lingora-admin/tests/database/a3/fixture-lifecycle.mjs',
  'lingora-admin/tests/database/a3/baseline-parity.mjs',
  'lingora-admin/tests/database/a3/a3-database.test.mjs',
  'docs/design/physical/evidence/2026-10-26-p1-continuation/p1-03a/repair-r1-r3-r5-r6/fixture-interface.md',
  'lingora-admin/tests/database/test-context.mjs',
  'lingora-admin/tests/database/scaffolds/runner-base.mjs',
  'lingora-admin/tests/database/scaffolds/a3-runner.mjs',
  'lingora-admin/tests/database/env/env-guard.mjs',
  'lingora-admin/tests/database/env/stack-manager.mjs',
  'lingora-admin/package.json',
  'package.json',
  'plans/2026-10-26-a3-r1-r3-r5-r6-execution-spec.md',
];

const executionProjections = {
  captured_at: new Date().toISOString(),
  environment: {},
  source_hashes_initial: {},
  source_hashes_final: {},
  source_hash_comparison: {},
  pre_setup_verification: {},
  guarded_commands: {},
  versions_and_instances: {},
  migration_record: {},
  database_projections: {},
  security_and_rls: {},
  zero_boundary_counters: {},
  locker_outcomes: {},
  cleanup_evidence: {},
};

function computeSha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

describe('A3-MUST-R1-R3-R5-R6: Unified Database Baseline & Guarded Prisma Workflow', () => {
  let ctx;
  let pgClient;
  let runtimePrisma;
  let initialHashes = {};

  before(async () => {
    ctx = getTestContext();
    ctx.assertLockHeld();

    // 1. Capture initial file hashes of all 18 exercised files before any action
    for (const rel of EXERCISED_FILES) {
      const abs = path.resolve(WORKSPACE_ROOT, rel);
      if (fs.existsSync(abs)) {
        initialHashes[rel] = computeSha256(abs);
        executionProjections.source_hashes_initial[rel] = initialHashes[rel];
      }
    }

    // 2. Bind exact environment properties to real ctx.stackId and ctx.stackName (Finding A3-R1)
    executionProjections.environment = {
      run_id: ctx.runId,
      instance_id: ctx.stackId,
      stack_name: ctx.stackName,
      runtime: 'native',
      workspace_root: WORKSPACE_ROOT,
      node_version: process.version,
    };

    // 3. Pre-setup verification: verify target database is unmigrated before setup
    const preCheckClient = ctx.createPgClient();
    await preCheckClient.connect();
    try {
      const preTables = await preCheckClient.query(`
        SELECT table_schema || '.' || table_name AS tbl FROM information_schema.tables
        WHERE table_schema IN ('app', 'app_private') AND table_type = 'BASE TABLE';
      `);
      executionProjections.pre_setup_verification = {
        baseline_tables_absent_before_setup: preTables.rows.length === 0,
        pre_existing_tables_count: preTables.rows.length,
      };
      assert.equal(preTables.rows.length, 0, 'Target database must be unmigrated prior to setup');
    } finally {
      await preCheckClient.end();
    }

    // 4. Deterministic serialized setup lifecycle under advisory lock (fresh-only, M-03)
    const setupResult = await setupA3Baseline(ctx);
    assert.equal(setupResult.status, 'READY');
    assert.equal(setupResult.source, 'PROVISIONED');
    assert.equal(setupResult.stackId, ctx.stackId);
    assert.equal(setupResult.stackName, ctx.stackName);
    executionProjections.guarded_commands.setup_lifecycle = setupResult;
    executionProjections.migration_record = setupResult.migrationRecord;

    pgClient = ctx.createPgClient();
    await pgClient.connect();

    // Query PostgreSQL version
    const pgVerRes = await pgClient.query('SELECT version();');
    executionProjections.versions_and_instances.postgresql_version = pgVerRes.rows[0]?.version;
    executionProjections.versions_and_instances.pinned_prisma_version = PINNED_PRISMA_VERSION;
  });

  after(async () => {
    // Disconnect runtime Prisma if still connected
    if (runtimePrisma) {
      try {
        await runtimePrisma.$disconnect();
      } catch {}
      runtimePrisma = null;
    }

    // Disconnect pgClient
    if (pgClient) {
      try {
        await pgClient.end();
      } catch {}
      pgClient = null;
    }

    // Perform lifecycle cleanup under parent run lock (M-06)
    if (ctx) {
      const cleanResult = await cleanupA3Baseline(ctx);
      assert.equal(cleanResult.status, 'CLEANED');
      assert.equal(cleanResult.stateFileRemoved, true);
      assert.equal(cleanResult.credentialsDisposed, true);
      executionProjections.cleanup_evidence = cleanResult;
    }

    // Capture final file hashes and assert zero drift
    let allHashesMatch = true;
    const comparisonTable = {};
    for (const rel of EXERCISED_FILES) {
      const abs = path.resolve(WORKSPACE_ROOT, rel);
      if (fs.existsSync(abs)) {
        const finalHash = computeSha256(abs);
        executionProjections.source_hashes_final[rel] = finalHash;
        const matches = (finalHash === initialHashes[rel]);
        comparisonTable[rel] = { initial: initialHashes[rel], final: finalHash, matches };
        if (!matches) allHashesMatch = false;
      }
    }
    executionProjections.source_hash_comparison = {
      zero_drift: allHashesMatch,
      files_compared: Object.keys(comparisonTable).length,
      details: comparisonTable,
    };
    assert.equal(allHashesMatch, true, 'All exercised files must have zero drift between test start and completion');

    // Write verified execution projections (must fail suite if write fails)
    fs.mkdirSync(path.dirname(PROJECTION_FILE), { recursive: true });
    fs.writeFileSync(PROJECTION_FILE, JSON.stringify(executionProjections, null, 2), 'utf8');
  });

  // ===========================================================================
  // AC-03: Baseline & Prerequisites
  // ===========================================================================

  test('TC-03-01: Cluster roles, attributes, and unexposed schemas verification', async () => {
    // 3 LOGIN roles with NOSUPERUSER, NOBYPASSRLS, NOCREATEDB, NOCREATEROLE
    const loginRes = await pgClient.query(`
      SELECT rolname, rolcanlogin, rolsuper, rolbypassrls, rolcreatedb, rolcreaterole, rolinherit
      FROM pg_roles
      WHERE rolname IN ('lingora_runtime', 'lingora_assembly', 'lingora_auth_adapter')
      ORDER BY rolname;
    `);
    assert.equal(loginRes.rows.length, 3);
    for (const r of loginRes.rows) {
      assert.equal(r.rolcanlogin, true);
      assert.equal(r.rolsuper, false);
      assert.equal(r.rolbypassrls, false);
      assert.equal(r.rolcreatedb, false);
      assert.equal(r.rolcreaterole, false);
      assert.equal(r.rolinherit, true);
    }

    // 10 NOLOGIN roles with NOSUPERUSER, NOBYPASSRLS
    const nologinRes = await pgClient.query(`
      SELECT rolname, rolcanlogin, rolsuper, rolbypassrls
      FROM pg_roles
      WHERE rolname LIKE 'lingora_%' AND rolname NOT IN ('lingora_runtime', 'lingora_assembly', 'lingora_auth_adapter')
      ORDER BY rolname;
    `);
    assert.equal(nologinRes.rows.length, 10);
    for (const r of nologinRes.rows) {
      assert.equal(r.rolcanlogin, false);
      assert.equal(r.rolsuper, false);
      assert.equal(r.rolbypassrls, false);
    }

    // Unexposed schemas app and app_private exist and have no public access
    const schemaRes = await pgClient.query(`
      SELECT schema_name FROM information_schema.schemata
      WHERE schema_name IN ('app', 'app_private')
      ORDER BY schema_name;
    `);
    assert.equal(schemaRes.rows.length, 2);
    assert.equal(schemaRes.rows[0].schema_name, 'app');
    assert.equal(schemaRes.rows[1].schema_name, 'app_private');

    // Schemas must not have PUBLIC grants
    const publicAclRes = await pgClient.query(`
      SELECT nspname, nspacl FROM pg_namespace
      WHERE nspname IN ('app', 'app_private');
    `);
    for (const r of publicAclRes.rows) {
      const aclStr = r.nspacl ? r.nspacl.toString() : '';
      assert.ok(!aclStr.includes('=U/'), `Schema ${r.nspname} must not grant USAGE to PUBLIC`);
      assert.ok(!aclStr.includes('=C/'), `Schema ${r.nspname} must not grant CREATE to PUBLIC`);
    }

    executionProjections.database_projections.roles = {
      login_roles: loginRes.rows,
      nologin_roles: nologinRes.rows,
      schemas: schemaRes.rows.map(s => s.schema_name),
    };
  });

  test('TC-03-02: Baseline migration recorded in _prisma_migrations and status up to date (RP-06)', async () => {
    const migRes = await pgClient.query(`
      SELECT id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count
      FROM _prisma_migrations
      WHERE migration_name = '20261026000000_a3_baseline';
    `);
    assert.equal(migRes.rows.length, 1);
    const row = migRes.rows[0];
    assert.ok(row.finished_at, 'Migration must be finished');
    assert.equal(row.rolled_back_at, null, 'Migration must not be rolled back');
    assert.ok(row.checksum, 'Migration must have non-null checksum');

    const currentMigHash = computeSha256(path.resolve(WORKSPACE_ROOT, 'lingora-admin/prisma/migrations/20261026000000_a3_baseline/migration.sql'));
    assert.equal(row.checksum, currentMigHash, 'Recorded migration checksum must match migration.sql SHA-256');

    // Pinned prisma migrate status returns clean
    const statusRes = runGuardedPrismaCommand(ctx, ['migrate', 'status']);
    assert.equal(statusRes.status, 'SUCCESS');
    assert.equal(statusRes.exitCode, 0);
    assert.match(statusRes.stdout, /Database schema is up to date/);

    executionProjections.guarded_commands.migrate_status = statusRes;
  });

  test('TC-03-03: Table inventory (20 tables) and strict absence of accounts.display_name', async () => {
    const tableRes = await pgClient.query(`
      SELECT table_schema || '.' || table_name AS full_table_name, table_schema, table_name
      FROM information_schema.tables
      WHERE table_schema IN ('app', 'app_private') AND table_type = 'BASE TABLE'
      ORDER BY 1;
    `);
    const liveTables = tableRes.rows.map(r => r.full_table_name);
    assert.equal(liveTables.length, 20);
    assert.deepEqual(liveTables, EXPECTED_20_TABLES);

    // Strict absence of accounts.display_name
    const colRes = await pgClient.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'app' AND table_name = 'accounts' AND column_name = 'display_name';
    `);
    assert.equal(colRes.rows.length, 0, 'accounts.display_name must NOT exist in schema');

    executionProjections.database_projections.tables = liveTables;
  });

  test('TC-03-04: Relational constraints, composite tuples, and mapped constraint names', async () => {
    // 1. Composite circular active revision FK on lessons
    const activeRevFk = await pgClient.query(`
      SELECT
        c.conname,
        tbl.relname AS source_table,
        ref.relname AS target_table,
        c.confmatchtype,
        c.confupdtype,
        c.confdeltype,
        ARRAY(
          SELECT a.attname FROM unnest(c.conkey) WITH ORDINALITY AS u(attnum, ord)
          JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = u.attnum
          ORDER BY u.ord
        ) AS source_columns,
        ARRAY(
          SELECT a.attname FROM unnest(c.confkey) WITH ORDINALITY AS u(attnum, ord)
          JOIN pg_attribute a ON a.attrelid = c.confrelid AND a.attnum = u.attnum
          ORDER BY u.ord
        ) AS target_columns
      FROM pg_constraint c
      JOIN pg_class tbl ON tbl.oid = c.conrelid
      JOIN pg_class ref ON ref.oid = c.confrelid
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE n.nspname = 'app' AND c.conname = 'lessons_active_revision_fkey';
    `);
    assert.equal(activeRevFk.rows.length, 1);
    const row = activeRevFk.rows[0];
    assert.equal(row.source_table, 'lessons');
    assert.equal(row.target_table, 'lesson_revisions');
    assert.deepEqual(row.source_columns, ['active_revision_id', 'id']);
    assert.deepEqual(row.target_columns, ['id', 'lesson_id']);
    assert.equal(row.confmatchtype, 's', 'Must be MATCH SIMPLE');
    assert.equal(row.confupdtype, 'a', 'NO ACTION on update');
    assert.equal(row.confdeltype, 'r', 'RESTRICT on delete');

    // 2. Composite creation assignment episode FK on lesson_revisions
    const lessonEpisodeFk = await pgClient.query(`
      SELECT
        c.conname,
        tbl.relname AS source_table,
        ref.relname AS target_table,
        c.confmatchtype,
        ARRAY(
          SELECT a.attname FROM unnest(c.conkey) WITH ORDINALITY AS u(attnum, ord)
          JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = u.attnum
          ORDER BY u.ord
        ) AS source_columns,
        ARRAY(
          SELECT a.attname FROM unnest(c.confkey) WITH ORDINALITY AS u(attnum, ord)
          JOIN pg_attribute a ON a.attrelid = c.confrelid AND a.attnum = u.attnum
          ORDER BY u.ord
        ) AS target_columns
      FROM pg_constraint c
      JOIN pg_class tbl ON tbl.oid = c.conrelid
      JOIN pg_class ref ON ref.oid = c.confrelid
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE n.nspname = 'app' AND c.conname = 'lesson_revisions_creation_assignment_episode_fkey';
    `);
    assert.equal(lessonEpisodeFk.rows.length, 1);
    const epRow = lessonEpisodeFk.rows[0];
    assert.equal(epRow.source_table, 'lesson_revisions');
    assert.equal(epRow.target_table, 'assignment_history');
    assert.deepEqual(epRow.source_columns, ['creation_assignment_episode_id', 'assignment_id']);
    assert.deepEqual(epRow.target_columns, ['id', 'assignment_id']);
    assert.equal(epRow.confmatchtype, 's', 'Must be MATCH SIMPLE');

    // 3. Provider FKs to auth.users (accounts_id_auth_users_fkey & provisioning_requests_auth_user_id_fkey)
    const providerFks = await pgClient.query(`
      SELECT c.conname, tbl.relname AS source_table, ref.relname AS target_table, c.confdeltype
      FROM pg_constraint c
      JOIN pg_class tbl ON tbl.oid = c.conrelid
      JOIN pg_class ref ON ref.oid = c.confrelid
      WHERE c.conname IN ('accounts_id_auth_users_fkey', 'provisioning_requests_auth_user_id_fkey')
      ORDER BY c.conname;
    `);
    assert.equal(providerFks.rows.length, 2);
    assert.equal(providerFks.rows[0].conname, 'accounts_id_auth_users_fkey');
    assert.equal(providerFks.rows[0].source_table, 'accounts');
    assert.equal(providerFks.rows[0].target_table, 'users');
    assert.equal(providerFks.rows[0].confdeltype, 'c', 'CASCADE on delete');

    assert.equal(providerFks.rows[1].conname, 'provisioning_requests_auth_user_id_fkey');
    assert.equal(providerFks.rows[1].source_table, 'provisioning_requests');
    assert.equal(providerFks.rows[1].target_table, 'users');
    assert.equal(providerFks.rows[1].confdeltype, 'n', 'SET NULL on delete');
  });

  test('TC-03-05: Domain CHECK constraints enforcement with valid FK prerequisites (RP-06)', async () => {
    // 1. accounts_role_check
    const testUserId1 = crypto.randomUUID();
    await pgClient.query(`
      INSERT INTO auth.users (id, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
      VALUES ($1, 'chk1-${testUserId1}@lingora.test', '{"provider": "email"}'::jsonb, '{}'::jsonb, now(), now());
    `, [testUserId1]);

    try {
      await assert.rejects(
        async () => {
          await pgClient.query(`
            INSERT INTO app.accounts (id, role, status)
            VALUES ($1, 'SUPER_USER', 'ACTIVE');
          `, [testUserId1]);
        },
        (err) => err.code === '23514' && err.message.includes('accounts_role_check')
      );
    } finally {
      await pgClient.query(`DELETE FROM auth.users WHERE id = $1;`, [testUserId1]);
    }

    // 2. accounts_status_check
    const testUserId2 = crypto.randomUUID();
    await pgClient.query(`
      INSERT INTO auth.users (id, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
      VALUES ($1, 'chk2-${testUserId2}@lingora.test', '{"provider": "email"}'::jsonb, '{}'::jsonb, now(), now());
    `, [testUserId2]);

    try {
      await assert.rejects(
        async () => {
          await pgClient.query(`
            INSERT INTO app.accounts (id, role, status)
            VALUES ($1, 'LEARNER', 'BANNED_FOREVER');
          `, [testUserId2]);
        },
        (err) => err.code === '23514' && err.message.includes('accounts_status_check')
      );
    } finally {
      await pgClient.query(`DELETE FROM auth.users WHERE id = $1;`, [testUserId2]);
    }

    // 3. audit_events_actor_attribution_check with valid prerequisites
    const testUserId3 = crypto.randomUUID();
    await pgClient.query(`
      INSERT INTO auth.users (id, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
      VALUES ($1, 'chk3-${testUserId3}@lingora.test', '{"provider": "email"}'::jsonb, '{}'::jsonb, now(), now());
    `, [testUserId3]);

    try {
      await assert.rejects(
        async () => {
          await pgClient.query(`
            INSERT INTO app_private.audit_events (
              id, actor_kind, actor_id, auth_subject, action, aggregate_type, aggregate_id, outcome
            ) VALUES (
              gen_random_uuid(), 'ACCOUNT', NULL, NULL, 'TEST_ACTION', 'ACCOUNT', $1, 'SUCCESS'
            );
          `, [testUserId3]);
        },
        (err) => err.code === '23514' && err.message.includes('audit_events_actor_attribution_check')
      );
    } finally {
      await pgClient.query(`DELETE FROM auth.users WHERE id = $1;`, [testUserId3]);
    }
  });

  test('TC-03-06: Seed configuration and locale integrity', async () => {
    // 2 languages: en, vi
    const langRes = await pgClient.query('SELECT code, name, is_active FROM app.languages ORDER BY code;');
    assert.equal(langRes.rows.length, 2);
    assert.equal(langRes.rows[0].code, 'en');
    assert.equal(langRes.rows[1].code, 'vi');

    // 1 framework: CEFR
    const frameRes = await pgClient.query('SELECT code, name FROM app.frameworks;');
    assert.equal(frameRes.rows.length, 1);
    assert.equal(frameRes.rows[0].code, 'CEFR');

    // 4 levels: A1, A2, B1, B2
    const levelRes = await pgClient.query('SELECT code, position FROM app.levels ORDER BY position;');
    assert.equal(levelRes.rows.length, 4);
    assert.equal(levelRes.rows[0].code, 'A1');
    assert.equal(levelRes.rows[1].code, 'A2');
    assert.equal(levelRes.rows[2].code, 'B1');
    assert.equal(levelRes.rows[3].code, 'B2');

    // 1 active baseline course
    const courseRes = await pgClient.query('SELECT id, is_active, curriculum_generation FROM app.courses WHERE is_active = true;');
    assert.equal(courseRes.rows.length, 1);
    assert.equal(courseRes.rows[0].id, '00000000-0000-0000-0000-000000000030');
    assert.equal(courseRes.rows[0].curriculum_generation, '1');
  });

  test('TC-03-07: Real Auth trigger hookup: public signup vs staff skip reservation', async () => {
    const learnerEmail = `learner-signup-${Date.now()}@lingora.test`;
    const learnerId = crypto.randomUUID();

    // 1. Unreserved email signup automatically provisions LEARNER account with ACTIVE status
    await pgClient.query(`
      INSERT INTO auth.users (id, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
      VALUES ($1, $2, '{"provider": "email"}'::jsonb, '{}'::jsonb, now(), now());
    `, [learnerId, learnerEmail]);

    try {
      const learnerAcc = await pgClient.query(`SELECT id, role, status FROM app.accounts WHERE id = $1;`, [learnerId]);
      assert.equal(learnerAcc.rows.length, 1);
      assert.equal(learnerAcc.rows[0].role, 'LEARNER');
      assert.equal(learnerAcc.rows[0].status, 'ACTIVE');

      // 2. Staff email reservation in provisioning_requests skips auto-creation
      const staffEmail = `staff-reserved-${Date.now()}@lingora.test`;
      const staffId = crypto.randomUUID();
      const requestId = crypto.randomUUID();
      const opKey = crypto.randomUUID();

      await pgClient.query(`
        INSERT INTO app_private.provisioning_requests (
          id, operation_key, normalized_email, requested_role, state
        ) VALUES (
          $1, $2, $3, 'TEACHER', 'REQUESTED'
        );
      `, [requestId, opKey, staffEmail.toLowerCase()]);

      try {
        await pgClient.query(`
          INSERT INTO auth.users (id, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
          VALUES ($1, $2, '{"provider": "email"}'::jsonb, '{}'::jsonb, now(), now());
        `, [staffId, staffEmail]);

        try {
          const staffAcc = await pgClient.query(`SELECT id FROM app.accounts WHERE id = $1;`, [staffId]);
          assert.equal(staffAcc.rows.length, 0, 'Trigger must skip auto-creating account when staff reservation exists');

          // Verify provisioning_request bound to user id
          const reqRes = await pgClient.query(`SELECT auth_user_id, state FROM app_private.provisioning_requests WHERE id = $1;`, [requestId]);
          assert.equal(reqRes.rows[0].auth_user_id, staffId);
          assert.equal(reqRes.rows[0].state, 'IDENTITY_CREATED');
        } finally {
          await pgClient.query(`DELETE FROM auth.users WHERE id = $1;`, [staffId]);
        }
      } finally {
        await pgClient.query(`DELETE FROM app_private.provisioning_requests WHERE id = $1;`, [requestId]);
      }
    } finally {
      await pgClient.query(`DELETE FROM app.accounts WHERE id = $1;`, [learnerId]);
      await pgClient.query(`DELETE FROM auth.users WHERE id = $1;`, [learnerId]);
    }
  });

  test('TC-03-08: Security definer functions, owners, and FORCE RLS policies', async () => {
    // 1. Helper functions owners and security definer flags
    const funcRes = await pgClient.query(`
      SELECT n.nspname || '.' || p.proname AS func_name, r.rolname AS owner, p.prosecdef AS is_secdef
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      JOIN pg_roles r ON r.oid = p.proowner
      WHERE n.nspname IN ('app', 'app_private')
      ORDER BY func_name;
    `);
    const funcMap = new Map(funcRes.rows.map(r => [r.func_name, r]));

    const ownSubFunc = funcMap.get('app_private.get_auth_subject_account');
    assert.ok(ownSubFunc);
    assert.equal(ownSubFunc.owner, 'lingora_authz_reader');
    assert.equal(ownSubFunc.is_secdef, true);

    const draftFunc = funcMap.get('app_private.set_draft_assessment_contribution_omitted');
    assert.ok(draftFunc);
    assert.equal(draftFunc.owner, 'lingora_content_writer');
    assert.equal(draftFunc.is_secdef, true);

    const fpFunc = funcMap.get('app_private.check_fingerprint_collision');
    assert.ok(fpFunc);
    assert.equal(fpFunc.owner, 'lingora_fingerprint_reader');
    assert.equal(fpFunc.is_secdef, true);

    const hookFunc = funcMap.get('app_private.handle_auth_user_created');
    assert.ok(hookFunc);
    assert.equal(hookFunc.owner, 'lingora_auth_provisioner');
    assert.equal(hookFunc.is_secdef, true);

    // 2. All 20 tables have FORCE ROW LEVEL SECURITY enabled
    const rlsRes = await pgClient.query(`
      SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname IN ('app', 'app_private') AND c.relkind = 'r'
      ORDER BY c.relname;
    `);
    assert.equal(rlsRes.rows.length, 20);
    for (const r of rlsRes.rows) {
      assert.equal(r.relrowsecurity, true, `Table ${r.relname} must have RLS enabled`);
      assert.equal(r.relforcerowsecurity, true, `Table ${r.relname} must have FORCE RLS enabled`);
    }

    executionProjections.security_and_rls = {
      functions: funcRes.rows,
      rls_tables: rlsRes.rows.map(r => r.relname),
    };
  });

  test('TC-03-09: Complete representable schema-to-catalog parity (RP-04, M-04, Finding A3-R5)', async () => {
    // 1. Execute complete representable parity against live database
    const parityResult = await verifyBaselineParity(pgClient);
    assert.equal(parityResult.isValid, true, 'Catalog must match derived baseline schema with zero mismatches');
    assert.equal(parityResult.columns.expectedCount, 250);
    assert.equal(parityResult.columns.actualCount, 250);
    assert.equal(parityResult.relations.expectedCount, 60);
    assert.equal(parityResult.relations.actualCount, 60);
    assert.equal(parityResult.sqlOnly.checksCount, 40);
    assert.equal(parityResult.sqlOnly.policiesCount, 38);
    assert.equal(parityResult.sqlOnly.partialUniqueCount, 1);
    assert.equal(parityResult.sqlOnly.triggersCount, 1);

    // 2. Demonstrate normalization and verifier rigor with synthetic deliberate drift (Finding A3-R5)
    const derived = deriveExpectedSchemaBaseline();
    const drift = simulateDeliberateDrift(derived);

    // Assert that altered column is detected
    const alteredCol = drift.alteredColumns.find(c => `${c.tableSchema}.${c.tableName}.${c.columnName}` === drift.alteredColKey);
    assert.equal(alteredCol.isNullable, 'YES');
    assert.equal(alteredCol.defaultValue, "'fr'");

    // Assert that altered FK is detected
    const alteredFk = drift.alteredRelations.find(r => r.constraintName === drift.alteredFkName);
    assert.equal(alteredFk.onDelete, 'c');

    executionProjections.database_projections.parity = {
      normalized_columns_count: parityResult.columns.actualCount,
      normalized_relations_count: parityResult.relations.actualCount,
      sql_only_objects_inventory: parityResult.sqlOnly,
      mismatches: parityResult.mismatches,
      deliberate_drift_simulation: {
        altered_column_tested: drift.alteredColKey,
        altered_fk_tested: drift.alteredFkName,
        verified_rigor: true,
      },
      normalized_columns_sample: parityResult.columns.normalizedColumns.slice(0, 10),
      normalized_relations_sample: parityResult.relations.normalizedRelations.slice(0, 10),
    };
  });

  // ===========================================================================
  // AC-04: Guarded Prisma Helper & Security Boundaries
  // ===========================================================================

  test('TC-04-01: Denial before subprocess or client construction on missing or invalid context (RP-01 & Finding A3-R1)', () => {
    // 1. Missing context
    assert.throws(() => validatePrismaContext(null), { code: 'TEST_CONTEXT_MISSING' });
    assert.throws(() => validatePrismaContext(undefined), { code: 'TEST_CONTEXT_MISSING' });
    assert.throws(() => validatePrismaContext({}), { code: 'TEST_CONTEXT_INVALID' });

    // 2. Context with stale lock assertion
    const staleCtx = {
      runId: 'run-deadbeef00000001',
      runDir: '/tmp/dead-run',
      assertLockHeld: () => {
        const err = new Error('TEST_CONTEXT_STALE: Lock holder PID is dead.');
        err.code = 'TEST_CONTEXT_STALE';
        throw err;
      },
    };
    assert.throws(() => validatePrismaContext(staleCtx), { code: 'TEST_CONTEXT_STALE' });
    assert.throws(() => runGuardedPrismaCommand(staleCtx, ['validate']), { code: 'TEST_CONTEXT_STALE' });
    assert.throws(() => createGuardedPrismaClient(staleCtx), { code: 'TEST_CONTEXT_STALE' });
  });

  test('TC-04-02: Denial of unallowlisted commands, CLI overrides, suffixes, and options with zero-launch counters (RP-01 & Finding A3-R2)', () => {
    let spawnCalls = 0;
    const countingExecutor = () => { spawnCalls++; return { status: 0, stdout: '', stderr: '' }; };
    const spyOpts = { executor: countingExecutor };

    // 1. Arbitrary / prohibited subcommands
    assert.throws(() => runGuardedPrismaCommand(ctx, ['db', 'push'], spyOpts), { code: 'COMMAND_FORBIDDEN' });
    assert.throws(() => runGuardedPrismaCommand(ctx, ['migrate', 'reset'], spyOpts), { code: 'COMMAND_FORBIDDEN' });
    assert.throws(() => runGuardedPrismaCommand(ctx, ['studio'], spyOpts), { code: 'COMMAND_FORBIDDEN' });
    assert.throws(() => runGuardedPrismaCommand(ctx, ['introspect'], spyOpts), { code: 'COMMAND_FORBIDDEN' });
    assert.equal(spawnCalls, 0, 'Zero spawn launches on prohibited subcommands');

    // 2. Caller CLI suffixes or extra args on permitted tuples
    assert.throws(() => runGuardedPrismaCommand(ctx, ['validate', '--json'], spyOpts), { code: 'COMMAND_FORBIDDEN' });
    assert.throws(() => runGuardedPrismaCommand(ctx, ['generate', '--watch'], spyOpts), { code: 'COMMAND_FORBIDDEN' });
    assert.throws(() => runGuardedPrismaCommand(ctx, ['migrate', 'deploy', '--preview-feature'], spyOpts), { code: 'COMMAND_FORBIDDEN' });
    assert.throws(() => runGuardedPrismaCommand(ctx, ['migrate', 'status', 'extra'], spyOpts), { code: 'COMMAND_FORBIDDEN' });
    assert.equal(spawnCalls, 0, 'Zero spawn launches on suffix / extra args');

    // 3. Prohibited CLI override flags
    assert.throws(() => runGuardedPrismaCommand(ctx, ['validate', '--url=postgresql://evil'], spyOpts), { code: 'ALLOWLIST_FAIL' });
    assert.throws(() => runGuardedPrismaCommand(ctx, ['validate', '--schema=./evil.prisma'], spyOpts), { code: 'ALLOWLIST_FAIL' });
    assert.throws(() => runGuardedPrismaCommand(ctx, ['validate', '-u', 'postgresql://evil'], spyOpts), { code: 'ALLOWLIST_FAIL' });
    assert.throws(() => runGuardedPrismaCommand(ctx, ['validate', '--config=./evil.toml'], spyOpts), { code: 'ALLOWLIST_FAIL' });
    assert.equal(spawnCalls, 0, 'Zero spawn launches on prohibited override flags');

    // 4. Prohibited helper options
    assert.throws(() => runGuardedPrismaCommand(ctx, ['validate'], { ...spyOpts, url: 'postgresql://evil' }), { code: 'ALLOWLIST_FAIL' });
    assert.throws(() => runGuardedPrismaCommand(ctx, ['validate'], { ...spyOpts, cwd: '/tmp/evil' }), { code: 'ALLOWLIST_FAIL' });
    assert.throws(() => runGuardedPrismaCommand(ctx, ['validate'], { ...spyOpts, shadow: true }), { code: 'SHADOW_TARGET_UNPROVED' });
    assert.throws(() => runGuardedPrismaCommand(ctx, ['validate'], { ...spyOpts, unapprovedKey: true }), { code: 'ALLOWLIST_FAIL' });
    assert.equal(spawnCalls, 0, 'Zero spawn launches on prohibited helper options');

    // 5. Prohibited command option value types
    assert.throws(() => runGuardedPrismaCommand(ctx, ['validate'], { ...spyOpts, executor: 'notAFunction' }), { code: 'ALLOWLIST_FAIL' });
    assert.throws(() => runGuardedPrismaCommand(ctx, ['validate'], { ...spyOpts, timeoutMs: -100 }), { code: 'ALLOWLIST_FAIL' });
    assert.throws(() => runGuardedPrismaCommand(ctx, ['validate'], { ...spyOpts, timeoutMs: NaN }), { code: 'ALLOWLIST_FAIL' });
    assert.throws(() => runGuardedPrismaCommand(ctx, ['validate'], { ...spyOpts, role: null }), { code: 'ALLOWLIST_FAIL' });
    assert.throws(() => runGuardedPrismaCommand(ctx, ['validate'], { ...spyOpts, role: false }), { code: 'ALLOWLIST_FAIL' });
    assert.throws(() => runGuardedPrismaCommand(ctx, ['validate'], { ...spyOpts, role: 'evil_superuser' }), { code: 'ALLOWLIST_FAIL' });
    assert.equal(spawnCalls, 0, 'Zero spawn launches on invalid option value types');

    // 6. Operation-to-credential boundary: migrate deploy with role: runtime is denied
    assert.throws(() => runGuardedPrismaCommand(ctx, ['migrate', 'deploy'], { ...spyOpts, role: 'runtime' }), { code: 'ALLOWLIST_FAIL' });
    assert.equal(spawnCalls, 0, 'Zero spawn launches on role: runtime with migrate deploy');

    // 7. Positive control: valid command invokes executor exactly once
    runGuardedPrismaCommand(ctx, ['validate'], spyOpts);
    assert.equal(spawnCalls, 1, 'Positive control must invoke executor exactly once');

    executionProjections.zero_boundary_counters.command_preflight = {
      denial_spawn_calls: 0,
      positive_control_calls: 1,
    };
  });

  test('TC-04-03: Zero-construction counters on client construction denial with positive control (RP-01 & Finding A3-R2)', () => {
    let constructorCalls = 0;
    class SpyPrismaClient {
      constructor() { constructorCalls++; }
    }
    const spyOpts = { clientConstructor: SpyPrismaClient };

    // 1. Unsupported client options
    assert.throws(() => createGuardedPrismaClient(ctx, { ...spyOpts, timeoutMs: 5000 }), { code: 'ALLOWLIST_FAIL' });
    assert.throws(() => createGuardedPrismaClient(ctx, { ...spyOpts, executor: () => {} }), { code: 'ALLOWLIST_FAIL' });
    assert.throws(() => createGuardedPrismaClient(ctx, { ...spyOpts, databaseUrl: 'postgresql://evil' }), { code: 'ALLOWLIST_FAIL' });
    assert.throws(() => createGuardedPrismaClient(ctx, { ...spyOpts, shadow: true }), { code: 'SHADOW_TARGET_UNPROVED' });
    assert.equal(constructorCalls, 0, 'Zero constructor calls on unsupported client options');

    // 2. Unsupported client roles and falsey values
    assert.throws(() => createGuardedPrismaClient(ctx, { ...spyOpts, role: 'superuser' }), { code: 'ALLOWLIST_FAIL' });
    assert.throws(() => createGuardedPrismaClient(ctx, { ...spyOpts, role: null }), { code: 'ALLOWLIST_FAIL' });
    assert.throws(() => createGuardedPrismaClient(ctx, { ...spyOpts, role: false }), { code: 'ALLOWLIST_FAIL' });
    assert.throws(() => createGuardedPrismaClient(ctx, { ...spyOpts, role: 0 }), { code: 'ALLOWLIST_FAIL' });
    assert.throws(() => createGuardedPrismaClient(ctx, { ...spyOpts, role: '' }), { code: 'ALLOWLIST_FAIL' });
    assert.equal(constructorCalls, 0, 'Zero constructor calls on invalid client roles');

    // 3. Invalid log definitions
    assert.throws(() => createGuardedPrismaClient(ctx, { ...spyOpts, log: 'query' }), { code: 'ALLOWLIST_FAIL' });
    assert.throws(() => createGuardedPrismaClient(ctx, { ...spyOpts, log: ['invalid_level'] }), { code: 'ALLOWLIST_FAIL' });
    assert.throws(() => createGuardedPrismaClient(ctx, { ...spyOpts, log: [{ level: 'query', emit: 'invalid_emit' }] }), { code: 'ALLOWLIST_FAIL' });
    assert.equal(constructorCalls, 0, 'Zero constructor calls on invalid log options');

    // 4. Positive control: valid client options invoke constructor exactly once
    createGuardedPrismaClient(ctx, spyOpts);
    assert.equal(constructorCalls, 1, 'Positive control must invoke constructor exactly once');

    executionProjections.zero_boundary_counters.client_preflight = {
      denial_constructor_calls: 0,
      positive_control_calls: 1,
    };
  });

  test('TC-04-04: Pinned local Prisma binary and version validation', () => {
    assert.equal(verifyPinnedPrisma(), true);
  });

  test('TC-04-05: Actual exported entrypoints preflight before DB connection / launch (M-01, M-05, Finding A3-R6)', async () => {
    const runDir = ctx.runDir;
    const testTempDir = path.resolve(runDir, 'cred-test-tmp');
    if (!fs.existsSync(testTempDir)) {
      fs.mkdirSync(testTempDir, { mode: 0o700 });
    }

    try {
      // 1. Validator unit tests on paths, symlinks, modes
      const outsideFile = path.resolve(runDir, '../outside-credentials.json');
      assert.throws(() => validateCredentialStorage(outsideFile, runDir), { code: 'ALLOWLIST_FAIL' });

      const realTarget = path.resolve(testTempDir, 'real-target.json');
      fs.writeFileSync(realTarget, '{}', { mode: 0o600 });
      const symlinkPath = path.resolve(testTempDir, 'symlink-creds.json');
      if (fs.existsSync(symlinkPath)) fs.unlinkSync(symlinkPath);
      fs.symlinkSync(realTarget, symlinkPath);
      assert.throws(() => validateCredentialStorage(symlinkPath, runDir), { code: 'ALLOWLIST_FAIL' });

      const nonExistentTarget = path.resolve(testTempDir, 'non-existent-target.json');
      const danglingSymlink = path.resolve(testTempDir, 'dangling-symlink.json');
      if (fs.existsSync(danglingSymlink)) fs.unlinkSync(danglingSymlink);
      fs.symlinkSync(nonExistentTarget, danglingSymlink);
      assert.throws(
        () => validateCredentialStorage(danglingSymlink, runDir, { allowAbsent: true }),
        { code: 'ALLOWLIST_FAIL' },
        'Dangling symlink must throw ALLOWLIST_FAIL even with allowAbsent: true'
      );

      // 2. ACTUAL ENTRYPOINT PREFLIGHT BEFORE DB CONNECTION ACROSS ENTRYPOINTS (M-01, M-05)
      let dbConnectCalls = 0;
      let spawnCalls = 0;
      const trackingPgClient = {
        connect: async () => { dbConnectCalls++; },
        query: async () => ({ rows: [] }),
        end: async () => {},
      };
      const countingExecutor = () => { spawnCalls++; return { status: 0, stdout: '', stderr: '' }; };

      const spyCtx = {
        ...ctx,
        createPgClient: () => trackingPgClient,
      };

      // Case A: reconcileClusterRoles with dangling link in runDir skips DB connection
      const entrypointTestDir = path.resolve(testTempDir, 'entrypoint-dangling-run');
      fs.mkdirSync(entrypointTestDir, { mode: 0o700 });
      const entryDanglingLink = path.resolve(entrypointTestDir, 'runtime-credentials.json');
      fs.symlinkSync(path.resolve(entrypointTestDir, 'absent-target.json'), entryDanglingLink);

      await assert.rejects(
        async () => {
          await reconcileClusterRoles({ ...spyCtx, runDir: entrypointTestDir });
        },
        { code: 'ALLOWLIST_FAIL' }
      );
      assert.equal(dbConnectCalls, 0, 'reconcileClusterRoles must reject dangling symlink BEFORE database connection');

      // Case B: Insecure directory mode (0755 instead of 0700) skips DB connection
      const insecureParentDir = path.resolve(testTempDir, 'insecure-parent-run');
      fs.mkdirSync(insecureParentDir, { mode: 0o755 });
      fs.chmodSync(insecureParentDir, 0o755);

      await assert.rejects(
        async () => {
          await reconcileClusterRoles({ ...spyCtx, runDir: insecureParentDir });
        },
        { code: 'ALLOWLIST_FAIL' }
      );
      assert.equal(dbConnectCalls, 0, 'Entrypoint must reject insecure parent directory BEFORE database connection');

      // Case C: Malformed credential record shape (extra keys) skips DB connection
      const malformedDir = path.resolve(testTempDir, 'malformed-creds-run');
      fs.mkdirSync(malformedDir, { mode: 0o700 });
      // Create minimal valid owner.json, .run.lock, credentials.json
      fs.writeFileSync(path.resolve(malformedDir, 'owner.json'), fs.readFileSync(path.resolve(runDir, 'owner.json')), { mode: 0o600 });
      fs.writeFileSync(path.resolve(malformedDir, '.run.lock'), fs.readFileSync(path.resolve(runDir, '.run.lock')), { mode: 0o600 });
      fs.writeFileSync(path.resolve(malformedDir, 'credentials.json'), fs.readFileSync(path.resolve(runDir, 'credentials.json')), { mode: 0o600 });

      const malformedCredFile = path.resolve(malformedDir, 'runtime-credentials.json');
      const malformedPayload = {
        lingora_runtime: { role: 'lingora_runtime', password: 'validpassword123456789012' },
        lingora_assembly: { role: 'lingora_assembly', password: 'validpassword123456789012' },
        lingora_auth_adapter: { role: 'lingora_auth_adapter', password: 'validpassword123456789012' },
        unexpected_extra_role: { role: 'evil', password: 'evilpassword123456789012' },
      };
      fs.writeFileSync(malformedCredFile, JSON.stringify(malformedPayload), { mode: 0o600 });

      await assert.rejects(
        async () => {
          await reconcileClusterRoles({ ...spyCtx, runDir: malformedDir });
        },
        { code: 'ALLOWLIST_FAIL' }
      );
      assert.equal(dbConnectCalls, 0, 'reconcileClusterRoles must reject extra keys record shape BEFORE database connection');

      // Case D: getRuntimeCredentials with malformed payload rejects before client creation
      assert.throws(
        () => getRuntimeCredentials({ ...ctx, runDir: malformedDir }),
        { code: 'ALLOWLIST_FAIL' }
      );

      // Case E: Positive control - valid reconcileClusterRoles executes DB connection
      const validResult = await reconcileClusterRoles(ctx);
      assert.equal(validResult.success, true);

      executionProjections.zero_boundary_counters.bootstrap_preflight = {
        denial_db_connect_calls: 0,
        positive_control_reconcile: true,
      };
    } finally {
      fs.rmSync(testTempDir, { recursive: true, force: true });
    }
  });

  test('TC-04-06: Positive real Prisma validation, generation, and status', () => {
    // 1. prisma validate
    const validateRes = runGuardedPrismaCommand(ctx, ['validate']);
    assert.equal(validateRes.status, 'SUCCESS');
    assert.equal(validateRes.exitCode, 0);
    assert.match(validateRes.stdout, /The schema at .* is valid/);

    // 2. prisma generate
    const generateRes = runGuardedPrismaCommand(ctx, ['generate']);
    assert.equal(generateRes.status, 'SUCCESS');
    assert.equal(generateRes.exitCode, 0);

    // 3. prisma migrate status
    const statusRes = runGuardedPrismaCommand(ctx, ['migrate', 'status']);
    assert.equal(statusRes.status, 'SUCCESS');
    assert.equal(statusRes.exitCode, 0);
    assert.match(statusRes.stdout, /Database schema is up to date/);

    executionProjections.guarded_commands.validate = validateRes;
    executionProjections.guarded_commands.generate = generateRes;
  });

  test('TC-04-07: Injected unexpected privileged and transitive role membership regressions (RP-05 & M-05)', async () => {
    // 1. Injected membership on NOLOGIN role: grant lingora_authz_reader to lingora_scoped_locker
    await pgClient.query(`GRANT lingora_authz_reader TO lingora_scoped_locker;`);

    try {
      await assert.rejects(
        async () => {
          await reconcileClusterRoles(ctx);
        },
        (err) => {
          assert.equal(err.code, 'SECURITY_VIOLATION');
          assert.ok(err.message.includes('Unexpected privileged role membership'));
          assert.ok(err.message.includes('lingora_scoped_locker'));
          return true;
        }
      );
    } finally {
      await pgClient.query(`REVOKE lingora_authz_reader FROM lingora_scoped_locker;`);
    }

    // 2. Injected membership on LOGIN role: grant definer role to lingora_runtime
    await pgClient.query(`GRANT lingora_authz_reader TO lingora_runtime;`);

    try {
      await assert.rejects(
        async () => {
          await reconcileClusterRoles(ctx);
        },
        (err) => {
          assert.equal(err.code, 'SECURITY_VIOLATION');
          assert.ok(err.message.includes('Unexpected privileged role membership'));
          assert.ok(err.message.includes('lingora_runtime'));
          return true;
        }
      );
    } finally {
      await pgClient.query(`REVOKE lingora_authz_reader FROM lingora_runtime;`);
    }

    // 3. Transitive membership regression into a Lingora NOLOGIN owner (M-05)
    await pgClient.query(`CREATE ROLE lingora_test_parent_transitive NOLOGIN NOCREATEDB NOCREATEROLE INHERIT;`);
    await pgClient.query(`GRANT lingora_authz_reader TO lingora_test_parent_transitive;`);
    await pgClient.query(`GRANT lingora_test_parent_transitive TO lingora_runtime;`);

    try {
      await assert.rejects(
        async () => {
          await reconcileClusterRoles(ctx);
        },
        (err) => {
          assert.equal(err.code, 'SECURITY_VIOLATION');
          assert.ok(err.message.includes('Unexpected privileged role membership'));
          return true;
        }
      );
    } finally {
      await pgClient.query(`REVOKE lingora_test_parent_transitive FROM lingora_runtime;`);
      await pgClient.query(`REVOKE lingora_authz_reader FROM lingora_test_parent_transitive;`);
      await pgClient.query(`DROP ROLE lingora_test_parent_transitive;`);
    }

    // 4. After cleanups, reconcile succeeds cleanly
    const recoveredResult = await reconcileClusterRoles(ctx);
    assert.equal(recoveredResult.success, true);
  });

  test('TC-04-08: Own-subject helper vs arbitrary-account request using non-owner lingora_runtime caller (RP-03 & Finding A3-R1)', async () => {
    const testSubjectId = crypto.randomUUID();
    const otherAccountId = crypto.randomUUID();
    const testEmail = `helper-${Date.now()}@lingora.test`;
    const otherEmail = `helper-other-${Date.now()}@lingora.test`;

    await pgClient.query(`
      INSERT INTO auth.users (id, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
      VALUES
        ($1, $3, '{"provider": "email"}'::jsonb, '{}'::jsonb, now(), now()),
        ($2, $4, '{"provider": "email"}'::jsonb, '{}'::jsonb, now(), now())
      ON CONFLICT (id) DO NOTHING;
    `, [testSubjectId, otherAccountId, testEmail, otherEmail]);

    // Connect non-owner runtime pg client (Finding A3-R1)
    const creds = getRuntimeCredentials(ctx);
    const dbUrl = new URL(ctx.credentials.databaseUrl);
    const runtimeCaller = new pg.Client({
      host: dbUrl.hostname,
      port: Number(dbUrl.port) || 5432,
      database: dbUrl.pathname.replace(/^\//, '') || 'postgres',
      user: creds.lingora_runtime.role,
      password: creds.lingora_runtime.password,
    });
    await runtimeCaller.connect();

    try {
      // 1. Transaction subject matches p_subject: returns verified own account row
      const ownResult = await runtimeCaller.query(`
        SELECT * FROM (
          SELECT set_config('app.auth_subject', $1, true)
        ) s,
        app_private.get_auth_subject_account($1::uuid);
      `, [testSubjectId]);
      assert.equal(ownResult.rows.length, 1);
      assert.equal(ownResult.rows[0].account_id, testSubjectId);
      assert.equal(ownResult.rows[0].role, 'LEARNER');
      assert.equal(ownResult.rows[0].status, 'ACTIVE');

      // 2. Transaction subject differs from p_subject: returns 0 rows (denies arbitrary account inspection!)
      const foreignResult = await runtimeCaller.query(`
        SELECT * FROM (
          SELECT set_config('app.auth_subject', $1, true)
        ) s,
        app_private.get_auth_subject_account($2::uuid);
      `, [testSubjectId, otherAccountId]);
      assert.equal(foreignResult.rows.length, 0, 'Must deny arbitrary account inspection for foreign UUID');

      // 3. Null transaction subject: returns 0 rows
      const nullSubjectResult = await runtimeCaller.query(`
        SELECT * FROM (
          SELECT set_config('app.auth_subject', '', true)
        ) s,
        app_private.get_auth_subject_account($1::uuid);
      `, [testSubjectId]);
      assert.equal(nullSubjectResult.rows.length, 0, 'Must return 0 rows when auth subject is null/empty');
    } finally {
      await runtimeCaller.end();
      await pgClient.query(`DELETE FROM app.accounts WHERE id IN ($1, $2);`, [testSubjectId, otherAccountId]);
      await pgClient.query(`DELETE FROM auth.users WHERE id IN ($1, $2);`, [testSubjectId, otherAccountId]);
    }
  });

  test('TC-04-09: Protected published reads, learning-context INSERT, and private-write RLS assertions (RP-03, RP-06, M-05)', async () => {
    const pendingLearnerId = crypto.randomUUID();
    const disabledLearnerId = crypto.randomUUID();
    const activeLearnerId = crypto.randomUUID();
    const otherLearnerId = crypto.randomUUID();
    const assignedTeacherId = crypto.randomUUID();
    const unassignedTeacherId = crypto.randomUUID();
    const adminId = crypto.randomUUID();

    const nonce = crypto.randomUUID().slice(0, 8);

    await pgClient.query(`
      INSERT INTO auth.users (id, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
      VALUES
        ($1, 'pending-${nonce}@lingora.test', '{"provider": "email"}'::jsonb, '{}'::jsonb, now(), now()),
        ($2, 'disabled-${nonce}@lingora.test', '{"provider": "email"}'::jsonb, '{}'::jsonb, now(), now()),
        ($3, 'active-${nonce}@lingora.test', '{"provider": "email"}'::jsonb, '{}'::jsonb, now(), now()),
        ($4, 'other-${nonce}@lingora.test', '{"provider": "email"}'::jsonb, '{}'::jsonb, now(), now()),
        ($5, 'teacher-assigned-${nonce}@lingora.test', '{"provider": "email"}'::jsonb, '{}'::jsonb, now(), now()),
        ($6, 'teacher-unassigned-${nonce}@lingora.test', '{"provider": "email"}'::jsonb, '{}'::jsonb, now(), now()),
        ($7, 'admin-${nonce}@lingora.test', '{"provider": "email"}'::jsonb, '{}'::jsonb, now(), now())
      ON CONFLICT (id) DO NOTHING;
    `, [pendingLearnerId, disabledLearnerId, activeLearnerId, otherLearnerId, assignedTeacherId, unassignedTeacherId, adminId]);

    await pgClient.query(`UPDATE app.accounts SET status = 'PENDING' WHERE id = $1;`, [pendingLearnerId]);
    await pgClient.query(`UPDATE app.accounts SET status = 'DISABLED' WHERE id = $1;`, [disabledLearnerId]);
    await pgClient.query(`UPDATE app.accounts SET role = 'TEACHER', status = 'ACTIVE' WHERE id = $1;`, [assignedTeacherId]);
    await pgClient.query(`UPDATE app.accounts SET role = 'TEACHER', status = 'ACTIVE' WHERE id = $1;`, [unassignedTeacherId]);
    await pgClient.query(`UPDATE app.accounts SET role = 'ADMIN', status = 'ACTIVE' WHERE id = $1;`, [adminId]);

    // 1. Private avatars for activeLearnerId and otherLearnerId
    const ownAvatarId = crypto.randomUUID();
    const foreignAvatarId = crypto.randomUUID();
    await pgClient.query(`
      INSERT INTO app.media_assets (id, bucket_id, object_key, sha256, mime_type, byte_size, uploaded_by, owner_account_id, kind)
      VALUES
        ($1, 'lingora-media', 'avatars/own-' || $5 || '.png', 'sha256-own', 'image/png', 1024, $2, $2, 'AVATAR'),
        ($3, 'lingora-media', 'avatars/foreign-' || $5 || '.png', 'sha256-for', 'image/png', 1024, $4, $4, 'AVATAR');
    `, [ownAvatarId, activeLearnerId, foreignAvatarId, otherLearnerId, nonce]);

    // 2. Unit and Lessons (one with draft revision, one with published revision)
    const unitId = crypto.randomUUID();
    const draftLessonId = crypto.randomUUID();
    const publishedLessonId = crypto.randomUUID();
    const draftAssignmentId = crypto.randomUUID();
    const publishedAssignmentId = crypto.randomUUID();
    const draftEpisodeId = crypto.randomUUID();
    const publishedEpisodeId = crypto.randomUUID();
    const draftRevId = crypto.randomUUID();
    const publishedRevId = crypto.randomUUID();

    const uniqueUnitPos = Math.floor(Math.random() * 80000) + 1000;
    await pgClient.query(`
      INSERT INTO app.units (id, course_id, level_id, code, position, names)
      VALUES ($1, '00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000021', $2, $3, '{"en": "Unit"}'::jsonb);
    `, [unitId, `U_RLS_${uniqueUnitPos}`, uniqueUnitPos]);

    await pgClient.query(`
      INSERT INTO app.lessons (id, unit_id, position, availability)
      VALUES
        ($1, $3, 1, 'PLANNED'),
        ($2, $3, 2, 'AVAILABLE');
    `, [draftLessonId, publishedLessonId, unitId]);

    await pgClient.query(`
      INSERT INTO app.content_assignments (id, created_by, current_teacher_id, lesson_id)
      VALUES
        ($1, $3, $3, $4),
        ($2, $3, $3, $5);
    `, [draftAssignmentId, publishedAssignmentId, assignedTeacherId, draftLessonId, publishedLessonId]);

    await pgClient.query(`
      INSERT INTO app.assignment_history (id, assignment_id, sequence_no, event_type, next_teacher_id, scope_generation, changed_by)
      VALUES
        ($1, $2, 1, 'ASSIGNED', $4, 1, $4),
        ($3, $5, 1, 'ASSIGNED', $4, 1, $4);
    `, [draftEpisodeId, draftAssignmentId, publishedEpisodeId, assignedTeacherId, publishedAssignmentId]);

    await pgClient.query(`
      INSERT INTO app.lesson_revisions (
        id, lesson_id, revision_no, assignment_id, creation_assignment_episode_id,
        status, title, created_by, last_edited_by
      ) VALUES
        ($1, $3, 1, $5, $7, 'DRAFT', '{"en": "Draft Lesson"}'::jsonb, $9, $9),
        ($2, $4, 1, $6, $8, 'PUBLISHED', '{"en": "Published Lesson"}'::jsonb, $9, $9);
    `, [draftRevId, publishedRevId, draftLessonId, publishedLessonId, draftAssignmentId, publishedAssignmentId, draftEpisodeId, publishedEpisodeId, assignedTeacherId]);

    // 3. Item identities & Item revisions (draft item revision and published item revision)
    const draftItemId = crypto.randomUUID();
    const publishedItemId = crypto.randomUUID();
    const draftItemRevId = crypto.randomUUID();
    const publishedItemRevId = crypto.randomUUID();

    await pgClient.query(`
      INSERT INTO app.item_identities (id, origin, created_by, exact_fingerprint)
      VALUES
        ($1, 'PRACTICE', $3, $4),
        ($2, 'PRACTICE', $3, $5);
    `, [draftItemId, publishedItemId, assignedTeacherId, `fp-draft-${draftItemId}`, `fp-pub-${publishedItemId}`]);

    await pgClient.query(`
      INSERT INTO app.item_revisions (
        id, item_id, revision_no, type, authoring_lesson_revision_id, creation_assignment_episode_id,
        prompt_data, exact_fingerprint, created_by, is_draft_omitted
      ) VALUES
        ($1, $3, 1, 'MCQ', $5, $7, '{"question": "draft"}'::jsonb, $9, $11, false),
        ($2, $4, 1, 'MCQ', $6, $8, '{"question": "pub"}'::jsonb, $10, $11, false);
    `, [
      draftItemRevId, publishedItemRevId,
      draftItemId, publishedItemId,
      draftRevId, publishedRevId,
      draftEpisodeId, publishedEpisodeId,
      `fp-rev-${draftItemRevId}`, `fp-rev-${publishedItemRevId}`,
      assignedTeacherId,
    ]);

    // 4. Assessment Blueprint & Versions (draft version and published active version)
    const blueprintId = crypto.randomUUID();
    const draftAssessmentVersionId = crypto.randomUUID();
    const publishedAssessmentVersionId = crypto.randomUUID();

    await pgClient.query(`
      INSERT INTO app.assessment_blueprints (id, created_by, language_id, framework_id, course_id, purpose, generation)
      VALUES ($1, $2, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000030', 'PLACEMENT', 1);
    `, [blueprintId, adminId]);

    await pgClient.query(`
      INSERT INTO app.assessment_versions (id, blueprint_id, version_no, blueprint_generation, blueprint_snapshot, assembly_input_hash, status, is_active)
      VALUES
        ($1, $3, 1, 1, '{}'::jsonb, $4, 'IN_REVIEW', false),
        ($2, $3, 2, 1, '{}'::jsonb, $5, 'PUBLISHED', true);
    `, [draftAssessmentVersionId, publishedAssessmentVersionId, blueprintId, `hash-draft-${draftAssessmentVersionId}`, `hash-pub-${publishedAssessmentVersionId}`]);

    // 5. Draft and Published content media assets
    const draftMediaId = crypto.randomUUID();
    const publishedMediaId = crypto.randomUUID();
    await pgClient.query(`
      INSERT INTO app.media_assets (
        id, bucket_id, object_key, sha256, mime_type, byte_size, uploaded_by,
        assignment_id, kind, ready_at, retired_at
      ) VALUES
        ($1, 'lingora-media', 'content/draft-' || $6 || '.png', 'sha256-draft', 'image/png', 2048, $3, $4, 'CONTENT', now(), null),
        ($2, 'lingora-media', 'content/pub-' || $6 || '.png', 'sha256-pub', 'image/png', 2048, $3, $5, 'CONTENT', now(), null);
    `, [draftMediaId, publishedMediaId, assignedTeacherId, draftAssignmentId, publishedAssignmentId, nonce]);

    const runtimeClient = createGuardedPrismaClient(ctx, { role: 'runtime' });

    try {
      // =======================================================================
      // A. COMPLETE 4-REPRESENTATIVE PUBLISHED READ MATRICES (M-05)
      // Every protected representative must test ACTIVE positive and PENDING, DISABLED, MISSING negatives!
      // =======================================================================

      const missingAccountUuid = crypto.randomUUID();

      // Representative 1: Published Lesson Revision
      await runtimeClient.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.auth_subject', $1, true);`, activeLearnerId);
        const revs = await tx.lessonRevision.findMany({ where: { id: publishedRevId } });
        assert.equal(revs.length, 1, 'ACTIVE Learner must read published lesson revision');
      });
      await runtimeClient.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.auth_subject', $1, true);`, pendingLearnerId);
        const revs = await tx.lessonRevision.findMany({ where: { id: publishedRevId } });
        assert.equal(revs.length, 0, 'PENDING account must not read published lesson revision');
      });
      await runtimeClient.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.auth_subject', $1, true);`, disabledLearnerId);
        const revs = await tx.lessonRevision.findMany({ where: { id: publishedRevId } });
        assert.equal(revs.length, 0, 'DISABLED account must not read published lesson revision');
      });
      await runtimeClient.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.auth_subject', $1, true);`, missingAccountUuid);
        const revs = await tx.lessonRevision.findMany({ where: { id: publishedRevId } });
        assert.equal(revs.length, 0, 'Missing account must not read published lesson revision');
      });

      // Representative 2: Published Item Revision
      await runtimeClient.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.auth_subject', $1, true);`, activeLearnerId);
        const items = await tx.itemRevision.findMany({ where: { id: publishedItemRevId } });
        assert.equal(items.length, 1, 'ACTIVE Learner must read published item revision');
      });
      await runtimeClient.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.auth_subject', $1, true);`, pendingLearnerId);
        const items = await tx.itemRevision.findMany({ where: { id: publishedItemRevId } });
        assert.equal(items.length, 0, 'PENDING account must not read published item revision');
      });
      await runtimeClient.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.auth_subject', $1, true);`, disabledLearnerId);
        const items = await tx.itemRevision.findMany({ where: { id: publishedItemRevId } });
        assert.equal(items.length, 0, 'DISABLED account must not read published item revision');
      });
      await runtimeClient.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.auth_subject', $1, true);`, missingAccountUuid);
        const items = await tx.itemRevision.findMany({ where: { id: publishedItemRevId } });
        assert.equal(items.length, 0, 'Missing account must not read published item revision');
      });

      // Representative 3: Published Assessment Version
      await runtimeClient.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.auth_subject', $1, true);`, activeLearnerId);
        const vers = await tx.assessmentVersion.findMany({ where: { id: publishedAssessmentVersionId } });
        assert.equal(vers.length, 1, 'ACTIVE Learner must read published assessment version');
      });
      await runtimeClient.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.auth_subject', $1, true);`, pendingLearnerId);
        const vers = await tx.assessmentVersion.findMany({ where: { id: publishedAssessmentVersionId } });
        assert.equal(vers.length, 0, 'PENDING account must not read published assessment version');
      });
      await runtimeClient.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.auth_subject', $1, true);`, disabledLearnerId);
        const vers = await tx.assessmentVersion.findMany({ where: { id: publishedAssessmentVersionId } });
        assert.equal(vers.length, 0, 'DISABLED account must not read published assessment version');
      });
      await runtimeClient.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.auth_subject', $1, true);`, missingAccountUuid);
        const vers = await tx.assessmentVersion.findMany({ where: { id: publishedAssessmentVersionId } });
        assert.equal(vers.length, 0, 'Missing account must not read published assessment version');
      });

      // Representative 4: Published Content Media Asset
      await runtimeClient.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.auth_subject', $1, true);`, activeLearnerId);
        const media = await tx.mediaAsset.findMany({ where: { id: publishedMediaId } });
        assert.equal(media.length, 1, 'ACTIVE Learner must read published content media');
      });
      await runtimeClient.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.auth_subject', $1, true);`, pendingLearnerId);
        const media = await tx.mediaAsset.findMany({ where: { id: publishedMediaId } });
        assert.equal(media.length, 0, 'PENDING account must not read published content media');
      });
      await runtimeClient.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.auth_subject', $1, true);`, disabledLearnerId);
        const media = await tx.mediaAsset.findMany({ where: { id: publishedMediaId } });
        assert.equal(media.length, 0, 'DISABLED account must not read published content media');
      });
      await runtimeClient.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.auth_subject', $1, true);`, missingAccountUuid);
        const media = await tx.mediaAsset.findMany({ where: { id: publishedMediaId } });
        assert.equal(media.length, 0, 'Missing account must not read published content media');
      });

      // Draft permissions: assigned teacher can read draft, unassigned cannot
      await runtimeClient.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.auth_subject', $1, true);`, assignedTeacherId);
        const draftItems = await tx.itemRevision.findMany({ where: { id: draftItemRevId } });
        assert.equal(draftItems.length, 1, 'Assigned Teacher must read DRAFT item revision');
      });
      await runtimeClient.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.auth_subject', $1, true);`, unassignedTeacherId);
        const draftItems = await tx.itemRevision.findMany({ where: { id: draftItemRevId } });
        assert.equal(draftItems.length, 0, 'Unassigned Teacher must NOT read DRAFT item revision');
      });

      // =======================================================================
      // B. LEARNING CONTEXT INSERT RLS ENFORCEMENT (SQLSTATE 42501) (M-05)
      // All accounts have valid FK prerequisites! Denials are solely RLS policy violations!
      // =======================================================================

      // Positive Control: ACTIVE Learner inserting own learning context succeeds
      let activeCreatedContextId = null;
      await runtimeClient.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.auth_subject', $1, true);`, activeLearnerId);
        const ctxRes = await tx.learningContext.create({
          data: {
            learnerId: activeLearnerId,
            languageId: '00000000-0000-0000-0000-000000000001',
            courseId: '00000000-0000-0000-0000-000000000030',
            studyFocus: 'BALANCED',
          },
        });
        assert.ok(ctxRes.id);
        activeCreatedContextId = ctxRes.id;
      });
      if (activeCreatedContextId) {
        await pgClient.query(`DELETE FROM app.learning_contexts WHERE id = $1;`, [activeCreatedContextId]);
      }

      // Denial 1: PENDING Learner inserting learning context fails with SQLSTATE 42501
      await assert.rejects(
        async () => {
          await runtimeClient.$transaction(async (tx) => {
            await tx.$executeRawUnsafe(`SELECT set_config('app.auth_subject', $1, true);`, pendingLearnerId);
            await tx.learningContext.create({
              data: {
                learnerId: pendingLearnerId,
                languageId: '00000000-0000-0000-0000-000000000001',
                courseId: '00000000-0000-0000-0000-000000000030',
                studyFocus: 'BALANCED',
              },
            });
          });
        },
        (err) => {
          const is42501 = err.code === '42501' || (err.message && err.message.includes('42501'));
          const isRls = err.message && (err.message.includes('row-level security') || err.message.includes('policy'));
          assert.ok(is42501 || isRls, `Expected SQLSTATE 42501 RLS denial, got: ${err.message}`);
          return true;
        }
      );

      // Denial 2: DISABLED Learner inserting learning context fails with SQLSTATE 42501
      await assert.rejects(
        async () => {
          await runtimeClient.$transaction(async (tx) => {
            await tx.$executeRawUnsafe(`SELECT set_config('app.auth_subject', $1, true);`, disabledLearnerId);
            await tx.learningContext.create({
              data: {
                learnerId: disabledLearnerId,
                languageId: '00000000-0000-0000-0000-000000000001',
                courseId: '00000000-0000-0000-0000-000000000030',
                studyFocus: 'BALANCED',
              },
            });
          });
        },
        (err) => {
          const is42501 = err.code === '42501' || (err.message && err.message.includes('42501'));
          const isRls = err.message && (err.message.includes('row-level security') || err.message.includes('policy'));
          assert.ok(is42501 || isRls, `Expected SQLSTATE 42501 RLS denial, got: ${err.message}`);
          return true;
        }
      );

      // Denial 3: Missing account auth_subject inserting for valid active learner fails with SQLSTATE 42501
      await assert.rejects(
        async () => {
          await runtimeClient.$transaction(async (tx) => {
            await tx.$executeRawUnsafe(`SELECT set_config('app.auth_subject', $1, true);`, missingAccountUuid);
            await tx.learningContext.create({
              data: {
                learnerId: activeLearnerId, // valid FK target!
                languageId: '00000000-0000-0000-0000-000000000001',
                courseId: '00000000-0000-0000-0000-000000000030',
                studyFocus: 'BALANCED',
              },
            });
          });
        },
        (err) => {
          const is42501 = err.code === '42501' || (err.message && err.message.includes('42501'));
          const isRls = err.message && (err.message.includes('row-level security') || err.message.includes('policy'));
          assert.ok(is42501 || isRls, `Expected SQLSTATE 42501 RLS denial, got: ${err.message}`);
          return true;
        }
      );

      // =======================================================================
      // C. PRIVATE-WRITE FORGERY & SET ROLE DENIALS (M-05)
      // =======================================================================

      // 1. Runtime client cannot insert into provisioning_requests
      const forgedProvId = crypto.randomUUID();
      await assert.rejects(
        async () => {
          await runtimeClient.$executeRawUnsafe(`
            INSERT INTO app_private.provisioning_requests (
              id, operation_key, normalized_email, requested_role
            ) VALUES (
              $1, gen_random_uuid(), 'forged@lingora.test', 'ADMIN'
            );
          `, forgedProvId);
        },
        (err) => err.code === '42501' || err.message.includes('permission denied')
      );
      const forgedProvCheck = await pgClient.query(`SELECT id FROM app_private.provisioning_requests WHERE id = $1;`, [forgedProvId]);
      assert.equal(forgedProvCheck.rows.length, 0, 'Forged provisioning request must NOT be inserted');

      // 2. Runtime client cannot insert into command_receipts (receipt forgery)
      const forgedReceiptId = crypto.randomUUID();
      await assert.rejects(
        async () => {
          await runtimeClient.$executeRawUnsafe(`
            INSERT INTO app_private.command_receipts (
              id, command_id, aggregate_type, aggregate_id, result_status
            ) VALUES (
              $1, gen_random_uuid(), 'ACCOUNT', gen_random_uuid(), 'SUCCESS'
            );
          `, forgedReceiptId);
        },
        (err) => err.code === '42501' || err.message.includes('permission denied')
      );
      const forgedReceiptCheck = await pgClient.query(`SELECT id FROM app_private.command_receipts WHERE id = $1;`, [forgedReceiptId]);
      assert.equal(forgedReceiptCheck.rows.length, 0, 'Forged command receipt must NOT be inserted');

      // 3. Runtime client cannot update status of account to ACTIVE (activation forgery)
      await assert.rejects(
        async () => {
          await runtimeClient.$executeRawUnsafe(`
            UPDATE app.accounts SET status = 'ACTIVE' WHERE id = $1;
          `, pendingLearnerId);
        },
        (err) => err.code === '42501' || err.message.includes('permission denied') || err.message.includes('violates')
      );
      const pendingStatusCheck = await pgClient.query(`SELECT status FROM app.accounts WHERE id = $1;`, [pendingLearnerId]);
      assert.equal(pendingStatusCheck.rows[0].status, 'PENDING', 'Pending learner status must remain PENDING');

      // 4. Runtime client cannot execute SET ROLE
      await assert.rejects(
        async () => {
          await runtimeClient.$executeRawUnsafe(`SET ROLE lingora_authz_reader;`);
        },
        (err) => err.code === '42501' || err.message.includes('permission denied')
      );

    } finally {
      await runtimeClient.$disconnect();
      // Clean up all synthetic records in finally block
      await pgClient.query(`DELETE FROM app.media_assets WHERE id IN ($1, $2, $3, $4);`, [
        ownAvatarId, foreignAvatarId, draftMediaId, publishedMediaId
      ]);
      await pgClient.query(`DELETE FROM app.assessment_versions WHERE id IN ($1, $2);`, [draftAssessmentVersionId, publishedAssessmentVersionId]);
      await pgClient.query(`DELETE FROM app.assessment_blueprints WHERE id = $1;`, [blueprintId]);
      await pgClient.query(`DELETE FROM app.item_revisions WHERE id IN ($1, $2);`, [draftItemRevId, publishedItemRevId]);
      await pgClient.query(`DELETE FROM app.item_identities WHERE id IN ($1, $2);`, [draftItemId, publishedItemId]);
      await pgClient.query(`DELETE FROM app.lesson_revisions WHERE id IN ($1, $2);`, [draftRevId, publishedRevId]);
      await pgClient.query(`DELETE FROM app.assignment_history WHERE id IN ($1, $2);`, [draftEpisodeId, publishedEpisodeId]);
      await pgClient.query(`DELETE FROM app.content_assignments WHERE id IN ($1, $2);`, [draftAssignmentId, publishedAssignmentId]);
      await pgClient.query(`DELETE FROM app.lessons WHERE id IN ($1, $2);`, [draftLessonId, publishedLessonId]);
      await pgClient.query(`DELETE FROM app.units WHERE id = $1;`, [unitId]);
      await pgClient.query(`DELETE FROM app.accounts WHERE id IN ($1, $2, $3, $4, $5, $6, $7);`, [
        pendingLearnerId, disabledLearnerId, activeLearnerId, otherLearnerId, assignedTeacherId, unassignedTeacherId, adminId
      ]);
      await pgClient.query(`DELETE FROM auth.users WHERE id IN ($1, $2, $3, $4, $5, $6, $7);`, [
        pendingLearnerId, disabledLearnerId, activeLearnerId, otherLearnerId, assignedTeacherId, unassignedTeacherId, adminId
      ]);
    }
  });

  test('TC-04-10: Scoped locker execution, role boundaries, and actual update denial (RP-03, RP-06, Finding A3-R4)', async () => {
    const activeLearnerId = crypto.randomUUID();
    const otherLearnerId = crypto.randomUUID();
    const pendingLearnerId = crypto.randomUUID();
    const disabledLearnerId = crypto.randomUUID();
    const activeTeacherId = crypto.randomUUID();
    const adminId = crypto.randomUUID();
    const otherAdminId = crypto.randomUUID();
    const missingAccountId = crypto.randomUUID();

    const lockerNonce = crypto.randomUUID().slice(0, 8);

    await pgClient.query(`
      INSERT INTO auth.users (id, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
      VALUES
        ($1, 'l-active-' || $8 || '@lingora.test', '{"provider": "email"}'::jsonb, '{}'::jsonb, now(), now()),
        ($2, 'l-other-' || $8 || '@lingora.test', '{"provider": "email"}'::jsonb, '{}'::jsonb, now(), now()),
        ($3, 'l-pending-' || $8 || '@lingora.test', '{"provider": "email"}'::jsonb, '{}'::jsonb, now(), now()),
        ($4, 'l-disabled-' || $8 || '@lingora.test', '{"provider": "email"}'::jsonb, '{}'::jsonb, now(), now()),
        ($5, 't-active-' || $8 || '@lingora.test', '{"provider": "email"}'::jsonb, '{}'::jsonb, now(), now()),
        ($6, 'a-active-' || $8 || '@lingora.test', '{"provider": "email"}'::jsonb, '{}'::jsonb, now(), now()),
        ($7, 'a-other-' || $8 || '@lingora.test', '{"provider": "email"}'::jsonb, '{}'::jsonb, now(), now())
      ON CONFLICT (id) DO NOTHING;
    `, [activeLearnerId, otherLearnerId, pendingLearnerId, disabledLearnerId, activeTeacherId, adminId, otherAdminId, lockerNonce]);

    await pgClient.query(`UPDATE app.accounts SET status = 'PENDING' WHERE id = $1;`, [pendingLearnerId]);
    await pgClient.query(`UPDATE app.accounts SET status = 'DISABLED' WHERE id = $1;`, [disabledLearnerId]);
    await pgClient.query(`UPDATE app.accounts SET role = 'TEACHER', status = 'ACTIVE' WHERE id = $1;`, [activeTeacherId]);
    await pgClient.query(`UPDATE app.accounts SET role = 'ADMIN', status = 'ACTIVE' WHERE id = $1;`, [adminId]);
    await pgClient.query(`UPDATE app.accounts SET role = 'ADMIN', status = 'ACTIVE' WHERE id = $1;`, [otherAdminId]);

    // Set up domain objects for locker scope testing (lesson, revisions, blueprint, version, learning context)
    const unitId = crypto.randomUUID();
    const lessonId = crypto.randomUUID();
    const assignmentId = crypto.randomUUID();
    const episodeId = crypto.randomUUID();
    const pubLessonRevId = crypto.randomUUID();
    const itemId = crypto.randomUUID();
    const pubItemRevId = crypto.randomUUID();
    const blueprintId = crypto.randomUUID();
    const assessmentVersionId = crypto.randomUUID();
    const contextId = crypto.randomUUID();

    const uniquePos = Math.floor(Math.random() * 80000) + 1000;
    await pgClient.query(`
      INSERT INTO app.units (id, course_id, level_id, code, position, names)
      VALUES ($1, '00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000021', $2, $3, '{"en": "Unit"}'::jsonb);
    `, [unitId, `U_LOCK_${uniquePos}`, uniquePos]);

    await pgClient.query(`
      INSERT INTO app.lessons (id, unit_id, position, availability)
      VALUES ($1, $2, 1, 'AVAILABLE');
    `, [lessonId, unitId]);

    await pgClient.query(`
      INSERT INTO app.content_assignments (id, created_by, current_teacher_id, lesson_id)
      VALUES ($1, $2, $3, $4);
    `, [assignmentId, adminId, activeTeacherId, lessonId]);

    await pgClient.query(`
      INSERT INTO app.assignment_history (id, assignment_id, sequence_no, event_type, next_teacher_id, scope_generation, changed_by)
      VALUES ($1, $2, 1, 'ASSIGNED', $3, 1, $4);
    `, [episodeId, assignmentId, activeTeacherId, adminId]);

    await pgClient.query(`
      INSERT INTO app.lesson_revisions (
        id, lesson_id, revision_no, assignment_id, creation_assignment_episode_id,
        status, title, created_by, last_edited_by
      ) VALUES ($1, $2, 1, $3, $4, 'PUBLISHED', '{"en": "Frozen Published Lesson"}'::jsonb, $5, $5);
    `, [pubLessonRevId, lessonId, assignmentId, episodeId, activeTeacherId]);

    await pgClient.query(`
      INSERT INTO app.item_identities (id, origin, created_by, exact_fingerprint)
      VALUES ($1, 'PRACTICE', $2, $3);
    `, [itemId, activeTeacherId, `fp-${itemId}`]);

    await pgClient.query(`
      INSERT INTO app.item_revisions (
        id, item_id, revision_no, type, authoring_lesson_revision_id, creation_assignment_episode_id,
        prompt_data, exact_fingerprint, created_by, is_draft_omitted
      ) VALUES ($1, $2, 1, 'MCQ', $3, $4, '{}'::jsonb, $5, $6, false);
    `, [pubItemRevId, itemId, pubLessonRevId, episodeId, `fp-rev-${pubItemRevId}`, activeTeacherId]);

    await pgClient.query(`
      INSERT INTO app.assessment_blueprints (id, created_by, language_id, framework_id, course_id, purpose, generation)
      VALUES ($1, $2, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000030', 'PLACEMENT', 1);
    `, [blueprintId, adminId]);

    await pgClient.query(`
      INSERT INTO app.assessment_versions (id, blueprint_id, version_no, blueprint_generation, blueprint_snapshot, assembly_input_hash, status, is_active)
      VALUES ($1, $2, 1, 1, '{}'::jsonb, $3, 'PUBLISHED', true);
    `, [assessmentVersionId, blueprintId, `hash-pub-${assessmentVersionId}`]);

    await pgClient.query(`
      INSERT INTO app.learning_contexts (id, learner_id, language_id, course_id, study_focus)
      VALUES ($1, $2, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000030', 'BALANCED');
    `, [contextId, activeLearnerId]);

    try {
      // 1. Own authorized row lock: active learner locking own account row succeeds
      await pgClient.query('BEGIN;');
      await pgClient.query('SET LOCAL ROLE lingora_scoped_locker;');
      await pgClient.query(`SELECT set_config('app.auth_subject', $1, true);`, [activeLearnerId]);
      const ownLockRes = await pgClient.query(`SELECT id, row_version FROM app.accounts WHERE id = $1 FOR UPDATE;`, [activeLearnerId]);
      assert.equal(ownLockRes.rows.length, 1, 'Own account row must be lockable');
      await pgClient.query('COMMIT;');

      // 2. Foreign row lock: active learner cannot lock other learner account row
      await pgClient.query('BEGIN;');
      await pgClient.query('SET LOCAL ROLE lingora_scoped_locker;');
      await pgClient.query(`SELECT set_config('app.auth_subject', $1, true);`, [activeLearnerId]);
      const foreignLockRes = await pgClient.query(`SELECT id, row_version FROM app.accounts WHERE id = $1 FOR UPDATE;`, [otherLearnerId]);
      assert.equal(foreignLockRes.rows.length, 0, 'Foreign account row must not be visible/lockable to learner');
      await pgClient.query('COMMIT;');

      // 3. Missing, PENDING, DISABLED accounts denied locker access
      for (const denyId of [missingAccountId, pendingLearnerId, disabledLearnerId]) {
        await pgClient.query('BEGIN;');
        await pgClient.query('SET LOCAL ROLE lingora_scoped_locker;');
        await pgClient.query(`SELECT set_config('app.auth_subject', $1, true);`, [denyId]);
        const denyLockRes = await pgClient.query(`SELECT id, row_version FROM app.accounts WHERE id = $1 FOR UPDATE;`, [denyId]);
        assert.equal(denyLockRes.rows.length, 0, `Non-active account ${denyId} must be denied row lock`);
        await pgClient.query('COMMIT;');
      }

      // 4. Admin target role boundary (Finding A3-R4):
      // - Admin CAN lock target LEARNER account
      await pgClient.query('BEGIN;');
      await pgClient.query('SET LOCAL ROLE lingora_scoped_locker;');
      await pgClient.query(`SELECT set_config('app.auth_subject', $1, true);`, [adminId]);
      const adminLearnerLock = await pgClient.query(`SELECT id, row_version FROM app.accounts WHERE id = $1 FOR UPDATE;`, [activeLearnerId]);
      assert.equal(adminLearnerLock.rows.length, 1, 'Admin must be permitted to lock target LEARNER account');
      await pgClient.query('COMMIT;');

      // - Admin CAN lock target TEACHER account
      await pgClient.query('BEGIN;');
      await pgClient.query('SET LOCAL ROLE lingora_scoped_locker;');
      await pgClient.query(`SELECT set_config('app.auth_subject', $1, true);`, [adminId]);
      const adminTeacherLock = await pgClient.query(`SELECT id, row_version FROM app.accounts WHERE id = $1 FOR UPDATE;`, [activeTeacherId]);
      assert.equal(adminTeacherLock.rows.length, 1, 'Admin must be permitted to lock target TEACHER account');
      await pgClient.query('COMMIT;');

      // - Admin CANNOT lock another ADMIN account (Finding A3-R4)
      await pgClient.query('BEGIN;');
      await pgClient.query('SET LOCAL ROLE lingora_scoped_locker;');
      await pgClient.query(`SELECT set_config('app.auth_subject', $1, true);`, [adminId]);
      const adminOtherAdminLock = await pgClient.query(`SELECT id, row_version FROM app.accounts WHERE id = $1 FOR UPDATE;`, [otherAdminId]);
      assert.equal(adminOtherAdminLock.rows.length, 0, 'Admin must NOT be permitted to lock target ADMIN account');
      await pgClient.query('COMMIT;');

      // 5. Frozen representative source locking (Finding A3-R4):
      // Assigned teacher CAN lock published (frozen) lesson revision
      await pgClient.query('BEGIN;');
      await pgClient.query('SET LOCAL ROLE lingora_scoped_locker;');
      await pgClient.query(`SELECT set_config('app.auth_subject', $1, true);`, [activeTeacherId]);
      const frozenLessonLock = await pgClient.query(`SELECT id, row_version FROM app.lesson_revisions WHERE id = $1 FOR UPDATE;`, [pubLessonRevId]);
      assert.equal(frozenLessonLock.rows.length, 1, 'Assigned Teacher must be permitted to lock frozen published lesson revision');
      await pgClient.query('COMMIT;');

      // Learner CANNOT lock published lesson revision
      await pgClient.query('BEGIN;');
      await pgClient.query('SET LOCAL ROLE lingora_scoped_locker;');
      await pgClient.query(`SELECT set_config('app.auth_subject', $1, true);`, [activeLearnerId]);
      const learnerLessonLock = await pgClient.query(`SELECT id, row_version FROM app.lesson_revisions WHERE id = $1 FOR UPDATE;`, [pubLessonRevId]);
      assert.equal(learnerLessonLock.rows.length, 0, 'Learner must NOT be permitted to lock lesson revision');
      await pgClient.query('COMMIT;');

      // Assigned teacher CAN lock published item revision
      await pgClient.query('BEGIN;');
      await pgClient.query('SET LOCAL ROLE lingora_scoped_locker;');
      await pgClient.query(`SELECT set_config('app.auth_subject', $1, true);`, [activeTeacherId]);
      const itemLock = await pgClient.query(`SELECT id, row_version FROM app.item_revisions WHERE id = $1 FOR UPDATE;`, [pubItemRevId]);
      assert.equal(itemLock.rows.length, 1, 'Assigned Teacher must be permitted to lock published item revision');
      await pgClient.query('COMMIT;');

      // Admin CAN lock assessment version; learner CANNOT
      await pgClient.query('BEGIN;');
      await pgClient.query('SET LOCAL ROLE lingora_scoped_locker;');
      await pgClient.query(`SELECT set_config('app.auth_subject', $1, true);`, [adminId]);
      const versLock = await pgClient.query(`SELECT id, row_version FROM app.assessment_versions WHERE id = $1 FOR UPDATE;`, [assessmentVersionId]);
      assert.equal(versLock.rows.length, 1, 'Admin must be permitted to lock assessment version');
      await pgClient.query('COMMIT;');

      await pgClient.query('BEGIN;');
      await pgClient.query('SET LOCAL ROLE lingora_scoped_locker;');
      await pgClient.query(`SELECT set_config('app.auth_subject', $1, true);`, [activeLearnerId]);
      const learnerVersLock = await pgClient.query(`SELECT id, row_version FROM app.assessment_versions WHERE id = $1 FOR UPDATE;`, [assessmentVersionId]);
      assert.equal(learnerVersLock.rows.length, 0, 'Learner must NOT be permitted to lock assessment version');
      await pgClient.query('COMMIT;');

      // Active course locking: active account CAN lock active course
      await pgClient.query('BEGIN;');
      await pgClient.query('SET LOCAL ROLE lingora_scoped_locker;');
      await pgClient.query(`SELECT set_config('app.auth_subject', $1, true);`, [activeLearnerId]);
      const courseLock = await pgClient.query(`SELECT id, row_version FROM app.courses WHERE id = '00000000-0000-0000-0000-000000000030' FOR UPDATE;`);
      assert.equal(courseLock.rows.length, 1, 'Active account must be permitted to lock active course');
      await pgClient.query('COMMIT;');

      // Learning context locking: learner CAN lock own context; CANNOT lock other learner context
      await pgClient.query('BEGIN;');
      await pgClient.query('SET LOCAL ROLE lingora_scoped_locker;');
      await pgClient.query(`SELECT set_config('app.auth_subject', $1, true);`, [activeLearnerId]);
      const ctxLock = await pgClient.query(`SELECT id, row_version FROM app.learning_contexts WHERE id = $1 FOR UPDATE;`, [contextId]);
      assert.equal(ctxLock.rows.length, 1, 'Learner must be permitted to lock own learning context');
      await pgClient.query('COMMIT;');

      await pgClient.query('BEGIN;');
      await pgClient.query('SET LOCAL ROLE lingora_scoped_locker;');
      await pgClient.query(`SELECT set_config('app.auth_subject', $1, true);`, [otherLearnerId]);
      const otherCtxLock = await pgClient.query(`SELECT id, row_version FROM app.learning_contexts WHERE id = $1 FOR UPDATE;`, [contextId]);
      assert.equal(otherCtxLock.rows.length, 0, 'Foreign learner must NOT be permitted to lock learning context');
      await pgClient.query('COMMIT;');

      // 6. Genuine UPDATE attempt by locker MUST FAIL closed due to WITH CHECK (false) (RP-03)
      await pgClient.query('BEGIN;');
      await pgClient.query('SET LOCAL ROLE lingora_scoped_locker;');
      await pgClient.query(`SELECT set_config('app.auth_subject', $1, true);`, [activeLearnerId]);
      try {
        await assert.rejects(
          async () => {
            await pgClient.query(`
              UPDATE app.accounts SET row_version = row_version + 1 WHERE id = $1;
            `, [activeLearnerId]);
          },
          (err) => {
            assert.ok(
              err.code === '42501' || err.code === '44000',
              `Actual UPDATE must fail with RLS check violation (got code ${err.code})`
            );
            assert.ok(
              err.message.includes('row-level security') || err.message.includes('violates'),
              `Error message must indicate RLS violation (got: ${err.message})`
            );
            return true;
          }
        );
      } finally {
        await pgClient.query('ROLLBACK;');
      }

      // 7. Runtime cannot assume lingora_scoped_locker (no SET ROLE shortcut)
      const creds = getRuntimeCredentials(ctx);
      const dbUrl = new URL(ctx.credentials.databaseUrl);
      const runtimeCaller = new pg.Client({
        host: dbUrl.hostname,
        port: Number(dbUrl.port) || 5432,
        database: dbUrl.pathname.replace(/^\//, '') || 'postgres',
        user: creds.lingora_runtime.role,
        password: creds.lingora_runtime.password,
      });
      await runtimeCaller.connect();
      try {
        await assert.rejects(
          async () => {
            await runtimeCaller.query('SET ROLE lingora_scoped_locker;');
          },
          (err) => {
            assert.equal(err.code, '42501', 'Runtime role must not be able to assume lingora_scoped_locker');
            return true;
          }
        );
      } finally {
        await runtimeCaller.end();
      }

      executionProjections.locker_outcomes = {
        own_account_lock: 'PERMITTED',
        foreign_account_lock: 'DENIED',
        non_active_account_lock: 'DENIED',
        admin_lock_learner: 'PERMITTED',
        admin_lock_teacher: 'PERMITTED',
        admin_lock_admin: 'DENIED',
        frozen_lesson_revision_lock: 'PERMITTED',
        learner_lesson_revision_lock: 'DENIED',
        genuine_update_attempt: 'DENIED_42501_OR_44000',
        runtime_set_role_shortcut: 'DENIED_42501',
      };
    } finally {
      await pgClient.query(`DELETE FROM app.learning_contexts WHERE id = $1;`, [contextId]);
      await pgClient.query(`DELETE FROM app.assessment_versions WHERE id = $1;`, [assessmentVersionId]);
      await pgClient.query(`DELETE FROM app.assessment_blueprints WHERE id = $1;`, [blueprintId]);
      await pgClient.query(`DELETE FROM app.item_revisions WHERE id = $1;`, [pubItemRevId]);
      await pgClient.query(`DELETE FROM app.item_identities WHERE id = $1;`, [itemId]);
      await pgClient.query(`DELETE FROM app.lesson_revisions WHERE id = $1;`, [pubLessonRevId]);
      await pgClient.query(`DELETE FROM app.assignment_history WHERE id = $1;`, [episodeId]);
      await pgClient.query(`DELETE FROM app.content_assignments WHERE id = $1;`, [assignmentId]);
      await pgClient.query(`DELETE FROM app.lessons WHERE id = $1;`, [lessonId]);
      await pgClient.query(`DELETE FROM app.units WHERE id = $1;`, [unitId]);
      await pgClient.query(`DELETE FROM app.accounts WHERE id IN ($1, $2, $3, $4, $5, $6, $7);`, [
        activeLearnerId, otherLearnerId, pendingLearnerId, disabledLearnerId, activeTeacherId, adminId, otherAdminId
      ]);
      await pgClient.query(`DELETE FROM auth.users WHERE id IN ($1, $2, $3, $4, $5, $6, $7);`, [
        activeLearnerId, otherLearnerId, pendingLearnerId, disabledLearnerId, activeTeacherId, adminId, otherAdminId
      ]);
    }
  });

  test('TC-04-11: Positive representative transaction via non-owner lingora_runtime (RP-06)', async () => {
    const creds = getRuntimeCredentials(ctx);
    assert.ok(creds.lingora_runtime);
    assert.ok(creds.lingora_runtime.password);

    const testLearnerId = crypto.randomUUID();
    const testEmail = `positive-${crypto.randomUUID()}@lingora.test`;
    await pgClient.query(`
      INSERT INTO auth.users (id, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
      VALUES ($1, $2, '{"provider": "email"}'::jsonb, '{}'::jsonb, now(), now())
      ON CONFLICT (id) DO NOTHING;
    `, [testLearnerId, testEmail]);

    runtimePrisma = createGuardedPrismaClient(ctx, { role: 'runtime' });
    let createdContextId = null;

    try {
      // Verify session user is lingora_runtime
      const userRes = await runtimePrisma.$queryRaw`SELECT current_user, session_user;`;
      assert.equal(userRes[0].current_user, 'lingora_runtime');
      assert.equal(userRes[0].session_user, 'lingora_runtime');

      const txResult = await runtimePrisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.auth_subject', $1, true);`, testLearnerId);

        const subRes = await tx.$queryRaw`SELECT app.current_auth_subject() AS subject;`;
        assert.equal(subRes[0].subject, testLearnerId);

        // Read own account
        const ownAccount = await tx.account.findUnique({
          where: { id: testLearnerId },
        });
        assert.ok(ownAccount);
        assert.equal(ownAccount.role, 'LEARNER');
        assert.equal(ownAccount.status, 'ACTIVE');

        // Create own learning context with BALANCED study focus
        const newContext = await tx.learningContext.create({
          data: {
            learnerId: testLearnerId,
            languageId: '00000000-0000-0000-0000-000000000001',
            courseId: '00000000-0000-0000-0000-000000000030',
            studyFocus: 'BALANCED',
          },
        });
        assert.ok(newContext);
        assert.equal(newContext.learnerId, testLearnerId);
        createdContextId = newContext.id;

        // Query seeded domain tables through Prisma models
        const languages = await tx.language.findMany({ orderBy: { code: 'asc' } });
        const frameworks = await tx.framework.findMany();
        const levels = await tx.level.findMany({ orderBy: { position: 'asc' } });
        const courses = await tx.course.findMany();

        return {
          subject: subRes[0].subject,
          createdContextId: newContext.id,
          languageCount: languages.length,
          frameworkCount: frameworks.length,
          levelCount: levels.length,
          courseCount: courses.length,
          firstLang: languages[0]?.code,
        };
      });

      assert.equal(txResult.subject, testLearnerId);
      assert.ok(txResult.createdContextId);
      assert.equal(txResult.languageCount, 2);
      assert.equal(txResult.frameworkCount, 1);
      assert.equal(txResult.levelCount, 4);
      assert.equal(txResult.courseCount, 1);
      assert.equal(txResult.firstLang, 'en');

      executionProjections.database_projections.representative_tx = {
        subject: txResult.subject,
        createdContextId: txResult.createdContextId,
        languageCount: txResult.languageCount,
        firstLang: txResult.firstLang,
      };
    } finally {
      if (runtimePrisma) {
        await runtimePrisma.$disconnect();
        runtimePrisma = null;
      }
      if (createdContextId) {
        await pgClient.query(`DELETE FROM app.learning_contexts WHERE id = $1;`, [createdContextId]);
      }
      await pgClient.query(`DELETE FROM app.accounts WHERE id = $1;`, [testLearnerId]);
      await pgClient.query(`DELETE FROM auth.users WHERE id = $1;`, [testLearnerId]);
    }
  });

  test('TC-04-12: Fresh-only contract and negative rejections (M-03, Finding A3-R3)', async () => {
    const stateFile = path.resolve(ctx.runDir, 'a3-baseline-state.json');
    const credFile = path.resolve(ctx.runDir, 'runtime-credentials.json');

    const originalStateContent = fs.readFileSync(stateFile, 'utf8');
    const originalCredContent = fs.readFileSync(credFile, 'utf8');

    try {
      // 1. Repeated setup with valid receipt present: explicit already-initialized denial before DB construction (M-03)
      await assert.rejects(
        async () => {
          await setupA3Baseline(ctx);
        },
        { code: 'BASELINE_ALREADY_INITIALIZED' }
      );

      // 2. Corrupt / malformed receipt: denies setup with STATE_INVALID (M-03)
      fs.writeFileSync(stateFile, '{ "corrupted": true, "extra": "invalid" }', { mode: 0o600 });
      await assert.rejects(
        async () => {
          await setupA3Baseline(ctx);
        },
        { code: 'STATE_INVALID' }
      );

      // 3. Incomplete state: credentials present without receipt denies with STATE_INCOMPLETE (M-03)
      fs.unlinkSync(stateFile);
      await assert.rejects(
        async () => {
          await setupA3Baseline(ctx);
        },
        { code: 'STATE_INCOMPLETE' }
      );

      // 4. Migrated target without receipt/credentials denies with ALREADY_MIGRATED (M-03)
      fs.unlinkSync(credFile);
      await assert.rejects(
        async () => {
          await setupA3Baseline(ctx);
        },
        { code: 'ALREADY_MIGRATED' }
      );

      // 5. Changed incarnation in testContext denies at authority check with TEST_CONTEXT_MISMATCH
      // Restore files first
      fs.writeFileSync(credFile, originalCredContent, { mode: 0o600 });
      fs.writeFileSync(stateFile, originalStateContent, { mode: 0o600 });

      await assert.rejects(
        async () => {
          await setupA3Baseline({ ...ctx, stackId: '0000000000000000000000000000000000000000000000000000000000000000' });
        },
        { code: 'TEST_CONTEXT_MISMATCH' }
      );

      executionProjections.zero_boundary_counters.fresh_only_negatives = {
        repeat_setup_denied: true,
        corrupt_state_denied: true,
        incomplete_credentials_denied: true,
        migrated_target_denied: true,
        foreign_incarnation_denied: true,
      };
    } finally {
      // Ensure valid state and credentials files are restored
      if (!fs.existsSync(credFile)) {
        fs.writeFileSync(credFile, originalCredContent, { mode: 0o600 });
      }
      if (!fs.existsSync(stateFile)) {
        fs.writeFileSync(stateFile, originalStateContent, { mode: 0o600 });
      }
    }
  });
});
