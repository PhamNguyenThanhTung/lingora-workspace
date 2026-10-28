/**
 * A3 Baseline Fixture Lifecycle & Serialization Helper (Findings A3-R1, A3-R3, A3-R6).
 *
 * Implements deterministic serialized setup, deployment, generation, and cleanup:
 * - Fresh-only setup: removes cached authority; a3-baseline-state.json is a strictly validated receipt.
 * - Repeated setup with valid receipt denies with explicit already-initialized denial before DB construction.
 * - Rejects already-migrated targets even if state files were removed.
 * - Binds directly to ctx.stackId and ctx.stackName from accepted test context (no runId fallback).
 * - Anchored descriptor operations eliminate symlink traversal and parent race conditions.
 * - Captures complete deploy and generate execution results (command, cwd, start/end, stdout/stderr, exit).
 * - Compares live migration checksum directly to SHA-256 of migration.sql source.
 * - Completes full representable baseline parity and SQL-only ownership verification before READY.
 * - Authenticates all three generated LOGIN credentials before READY.
 * - Proves exact cleanup execution and postcondition ENOENT under parent run lock.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import {
  reconcileClusterRoles,
  disposeRuntimeCredentials,
  validateCredentialStorage,
  parseStrictRuntimeCredentials,
} from '../../../prisma/bootstrap/bootstrap-cluster.mjs';
import { runGuardedPrismaCommand } from './prisma-helper.mjs';
import {
  openAnchoredRunDir,
  validateRunContextAuthority,
} from '../../../prisma/bootstrap/private-run-storage.mjs';
import {
  verifyBaselineParity,
} from './baseline-parity.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKSPACE_ROOT = path.resolve(__dirname, '../../../..');
const SCHEMA_FILE = path.resolve(WORKSPACE_ROOT, 'lingora-admin/prisma/schema.prisma');
const MIGRATION_FILE = path.resolve(WORKSPACE_ROOT, 'lingora-admin/prisma/migrations/20261026000000_a3_baseline/migration.sql');
const BOOTSTRAP_FILE = path.resolve(WORKSPACE_ROOT, 'lingora-admin/prisma/bootstrap/bootstrap-cluster.mjs');
const MANIFEST_FILE = path.resolve(WORKSPACE_ROOT, 'lingora-admin/prisma/bootstrap/manifest.json');

const A3_LIFECYCLE_ADVISORY_LOCK_ID = 7103001;

export const EXPECTED_20_TABLES = [
  'app.accounts',
  'app.assessment_blueprints',
  'app.assessment_versions',
  'app.assignment_history',
  'app.content_assignments',
  'app.courses',
  'app.frameworks',
  'app.item_identities',
  'app.item_revisions',
  'app.languages',
  'app.learning_contexts',
  'app.lesson_revisions',
  'app.lessons',
  'app.levels',
  'app.media_assets',
  'app.revision_reviews',
  'app.units',
  'app_private.audit_events',
  'app_private.command_receipts',
  'app_private.provisioning_requests',
];

function hashFile(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

/**
 * Setup and deploy the complete A3 baseline deterministically under advisory lock.
 * Fresh-only contract: rejects cached adoption and repeated setup.
 */
export async function setupA3Baseline(testContext, options = {}) {
  if (!testContext || typeof testContext !== 'object') {
    const err = new Error('TEST_CONTEXT_MISSING: Valid test context required for setup.');
    err.code = 'TEST_CONTEXT_MISSING';
    throw err;
  }
  testContext.assertLockHeld();

  const stateFile = path.resolve(testContext.runDir, 'a3-baseline-state.json');
  const credFile = path.resolve(testContext.runDir, 'runtime-credentials.json');

  // Preflight state and credential path safety before acquiring DB connection
  validateCredentialStorage(stateFile, testContext.runDir, { allowAbsent: true });
  validateCredentialStorage(credFile, testContext.runDir, { allowAbsent: true });

  const currentSchemaHash = hashFile(SCHEMA_FILE);
  const currentMigrationHash = hashFile(MIGRATION_FILE);
  const currentBootstrapHash = hashFile(BOOTSTRAP_FILE);
  const currentManifestHash = hashFile(MANIFEST_FILE);

  const anchored = openAnchoredRunDir(testContext.runDir);

  try {
    // 1. Current authority and pre-connection validation (M-01)
    const authResult = validateRunContextAuthority(testContext, { anchoredDir: anchored });
    const stackId = authResult.stackId;
    const stackName = authResult.stackName;

    // 2. Fresh-only contract: verify absence of existing state receipt and credentials (M-03)
    const existingStateStat = anchored.lstatChild('a3-baseline-state.json');
    if (existingStateStat) {
      if (existingStateStat.isSymbolicLink()) {
        const err = new Error('ALLOWLIST_FAIL: State file must not be a symbolic link.');
        err.code = 'ALLOWLIST_FAIL';
        throw err;
      }
      let existingContent = '';
      try {
        existingContent = anchored.readPrivateRecord('a3-baseline-state.json', { allowAbsent: false });
      } catch (e) {
        const err = new Error(`STATE_INVALID: Existing state file unreadable: ${e.message}`);
        err.code = 'STATE_INVALID';
        throw err;
      }

      let parsedState;
      try {
        parsedState = JSON.parse(existingContent);
      } catch {
        const err = new Error('STATE_INVALID: Existing state file contains malformed JSON.');
        err.code = 'STATE_INVALID';
        throw err;
      }

      // Check if this is a valid repeat receipt
      const isValidRepeatReceipt = (
        parsedState.status === 'READY' &&
        parsedState.runId === testContext.runId &&
        parsedState.stackId === stackId &&
        parsedState.schemaHash === currentSchemaHash &&
        parsedState.migrationHash === currentMigrationHash &&
        parsedState.bootstrapHash === currentBootstrapHash &&
        parsedState.manifestHash === currentManifestHash
      );

      if (isValidRepeatReceipt) {
        const err = new Error(
          'BASELINE_ALREADY_INITIALIZED: Baseline has already been initialized with a valid receipt on this target. ' +
          'Repeated setup is denied; cached authority is removed.'
        );
        err.code = 'BASELINE_ALREADY_INITIALIZED';
        throw err;
      } else {
        const err = new Error('STATE_INVALID: Existing state file is stale, foreign, or corrupted. Setup denied.');
        err.code = 'STATE_INVALID';
        throw err;
      }
    }

    const existingCredStat = anchored.lstatChild('runtime-credentials.json');
    if (existingCredStat) {
      const err = new Error('STATE_INCOMPLETE: Runtime credentials exist without valid baseline receipt. Setup denied.');
      err.code = 'STATE_INCOMPLETE';
      throw err;
    }

    // Connect admin DB client ONLY AFTER preflight succeeds
    const adminClient = testContext.createPgClient();
    await adminClient.connect();

    try {
      // Acquire dedicated advisory lock for A3 fixture setup serialization
      await adminClient.query('SELECT pg_advisory_lock($1);', [A3_LIFECYCLE_ADVISORY_LOCK_ID]);

      // 3. Query absence of application baseline tables and migration history on target DB before effects
      const tableCheckRes = await adminClient.query(`
        SELECT table_schema || '.' || table_name AS tbl FROM information_schema.tables
        WHERE table_schema IN ('app', 'app_private') AND table_type = 'BASE TABLE';
      `);
      if (tableCheckRes.rows.length > 0) {
        const err = new Error(
          `ALREADY_MIGRATED: Target database already contains ${tableCheckRes.rows.length} baseline application tables. ` +
          'Fresh unmigrated target is required for A3 setup.'
        );
        err.code = 'ALREADY_MIGRATED';
        throw err;
      }

      const migTableRes = await adminClient.query(`
        SELECT to_regclass('_prisma_migrations') AS mig_tbl;
      `);
      if (migTableRes.rows[0]?.mig_tbl) {
        const migHistoryRes = await adminClient.query(`
          SELECT migration_name FROM _prisma_migrations
          WHERE migration_name = '20261026000000_a3_baseline';
        `);
        if (migHistoryRes.rows.length > 0) {
          const err = new Error(
            'ALREADY_MIGRATED: Baseline migration "20261026000000_a3_baseline" is already recorded in _prisma_migrations. ' +
            'Fresh unmigrated target is required for A3 setup.'
          );
          err.code = 'ALREADY_MIGRATED';
          throw err;
        }
      }

      // 4. Reconcile cluster roles and schemas
      const roleResult = await reconcileClusterRoles(testContext, options);

      // 5. Deploy baseline migration via guarded Prisma CLI and capture results
      const deployResult = runGuardedPrismaCommand(testContext, ['migrate', 'deploy']);
      if (deployResult.status !== 'SUCCESS') {
        throw new Error(`MIGRATE_DEPLOY_FAILED: Prisma migrate deploy failed with exit code ${deployResult.exitCode}.\nstdout: ${deployResult.stdout}\nstderr: ${deployResult.stderr}`);
      }

      // 6. Generate Prisma client and capture results
      const genResult = runGuardedPrismaCommand(testContext, ['generate']);
      if (genResult.status !== 'SUCCESS') {
        throw new Error(`GENERATE_FAILED: Prisma generate failed with exit code ${genResult.exitCode}.\nstdout: ${genResult.stdout}\nstderr: ${genResult.stderr}`);
      }

      // 7. Query live migration checksum from _prisma_migrations and compare to current migration source
      const migCheckRes = await adminClient.query(`
        SELECT checksum, started_at, finished_at FROM _prisma_migrations
        WHERE migration_name = '20261026000000_a3_baseline' AND finished_at IS NOT NULL AND rolled_back_at IS NULL;
      `);
      if (migCheckRes.rows.length === 0) {
        throw new Error('MIGRATION_MISSING: Baseline migration record not found in _prisma_migrations after deploy.');
      }
      const migrationChecksum = migCheckRes.rows[0].checksum;
      const migStartedAt = migCheckRes.rows[0].started_at;
      const migFinishedAt = migCheckRes.rows[0].finished_at;

      if (migrationChecksum !== currentMigrationHash) {
        throw new Error(
          `CHECKSUM_MISMATCH: Live migration checksum "${migrationChecksum}" does not match source migration.sql SHA-256 "${currentMigrationHash}".`
        );
      }

      // 8. Complete representable parity and complete SQL ownership verification (M-04)
      const parityResult = await verifyBaselineParity(adminClient);
      if (!parityResult.isValid) {
        const details = JSON.stringify(parityResult.mismatches, null, 2);
        throw new Error(`PARITY_VERIFICATION_FAILED: Database catalog failed representable parity check:\n${details}`);
      }

      // 9. Read generated credentials from anchored storage and authenticate all three LOGIN credentials
      const credContent = anchored.readPrivateRecord('runtime-credentials.json', { allowAbsent: false });
      const parsedCreds = parseStrictRuntimeCredentials(credContent);
      const credentialsDigest = crypto.createHash('sha256').update(credContent).digest('hex');

      const dbUrl = new URL(testContext.credentials.databaseUrl);
      const dbHost = dbUrl.hostname;
      const dbPort = Number(dbUrl.port) || 54322;
      const dbName = dbUrl.pathname.replace(/^\//, '') || 'postgres';

      for (const roleName of ['lingora_runtime', 'lingora_assembly', 'lingora_auth_adapter']) {
        const client = new pg.Client({
          host: dbHost,
          port: dbPort,
          database: dbName,
          user: parsedCreds[roleName].role,
          password: parsedCreds[roleName].password,
          connectionTimeoutMillis: 5000,
        });

        await client.connect();
        try {
          const whoRes = await client.query('SELECT current_user, session_user;');
          if (whoRes.rows[0]?.current_user !== roleName) {
            throw new Error(`AUTH_VERIFICATION_FAILED: Expected current_user "${roleName}", got "${whoRes.rows[0]?.current_user}".`);
          }
          const roleAttrRes = await client.query(
            'SELECT rolsuper, rolbypassrls, rolcreatedb, rolcreaterole FROM pg_roles WHERE rolname = current_user;'
          );
          if (roleAttrRes.rows[0]?.rolsuper || roleAttrRes.rows[0]?.rolbypassrls) {
            throw new Error(`AUTH_VERIFICATION_FAILED: Role "${roleName}" has unsafe superuser or bypassrls privileges.`);
          }
        } finally {
          await client.end();
        }
      }

      // 10. Record state receipt atomically and race-safely via anchored storage
      const stateRecord = {
        status: 'READY',
        source: 'PROVISIONED',
        runId: testContext.runId,
        stackId,
        stackName,
        schemaHash: currentSchemaHash,
        migrationHash: currentMigrationHash,
        bootstrapHash: currentBootstrapHash,
        manifestHash: currentManifestHash,
        migrationApplied: '20261026000000_a3_baseline',
        migrationChecksum,
        migrationStartedAt: migStartedAt,
        migrationFinishedAt: migFinishedAt,
        catalogTables: EXPECTED_20_TABLES,
        credentialsDigest,
        timestamp: new Date().toISOString(),
        reconciledRoles: roleResult.reconciledRoles,
        paritySummary: {
          columnsCount: parityResult.columns.actualCount,
          relationsCount: parityResult.relations.actualCount,
          sqlOnly: parityResult.sqlOnly,
        },
      };

      anchored.writePrivateRecordAtomic('a3-baseline-state.json', JSON.stringify(stateRecord, null, 2), { mode: 0o600 });

      return {
        status: 'READY',
        source: 'PROVISIONED',
        runId: testContext.runId,
        stackId,
        stackName,
        stateFile,
        deployResult,
        generateResult,
        migrationRecord: {
          migrationName: '20261026000000_a3_baseline',
          checksum: migrationChecksum,
          startedAt: migStartedAt,
          finishedAt: migFinishedAt,
        },
        parityResult,
      };
    } finally {
      try {
        await adminClient.query('SELECT pg_advisory_unlock($1);', [A3_LIFECYCLE_ADVISORY_LOCK_ID]);
      } catch {}
      await adminClient.end();
    }
  } finally {
    anchored.close();
  }
}

/**
 * Clean up A3 baseline credentials and state on target teardown.
 */
export async function cleanupA3Baseline(testContext, options = {}) {
  if (!testContext || !testContext.runDir) {
    return { status: 'NOOP' };
  }
  testContext.assertLockHeld();

  const startedAt = new Date().toISOString();
  const anchored = openAnchoredRunDir(testContext.runDir);
  const stateFile = path.resolve(testContext.runDir, 'a3-baseline-state.json');
  const credFile = path.resolve(testContext.runDir, 'runtime-credentials.json');

  let stateRemoved = false;

  try {
    const authResult = validateRunContextAuthority(testContext, { anchoredDir: anchored });
    const stackId = authResult.stackId;

    // 1. Unlink a3-baseline-state.json via anchored descriptor
    const stateStat = anchored.lstatChild('a3-baseline-state.json');
    if (stateStat) {
      anchored.unlinkPrivateRecord('a3-baseline-state.json');
      stateRemoved = true;
    }

    // 2. Dispose runtime credentials via anchored descriptor
    const credStat = anchored.lstatChild('runtime-credentials.json');
    let credRemoved = false;
    if (credStat) {
      anchored.unlinkPrivateRecord('runtime-credentials.json');
      credRemoved = true;
    }

    // 3. Verify postcondition ENOENT on both files via anchored descriptor
    const postStateStat = anchored.lstatChild('a3-baseline-state.json');
    if (postStateStat !== null) {
      throw new Error(`CLEANUP_FAILED: State file "${stateFile}" still present after cleanup.`);
    }

    const postCredStat = anchored.lstatChild('runtime-credentials.json');
    if (postCredStat !== null) {
      throw new Error(`CLEANUP_FAILED: Credential file "${credFile}" still present after cleanup.`);
    }

    const finishedAt = new Date().toISOString();

    return {
      status: 'CLEANED',
      stateFileRemoved: stateRemoved,
      credentialsDisposed: credRemoved,
      runId: testContext.runId,
      stackId,
      startedAt,
      finishedAt,
    };
  } finally {
    anchored.close();
  }
}
