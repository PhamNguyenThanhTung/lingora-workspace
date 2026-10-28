// =============================================================================
// Standalone Read-Only Product Database Preflight & Target Safety Helper
// Authority: plans/2026-10-27-product-database-finalize-spec.md §5, FDB-01, FDB-02
// Resolves: DB-R2, review findings FDB-01, FDB-02
// =============================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { verifyCatalogParity } from './product-catalog-contract.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const adminRoot = path.resolve(__dirname, '..');

export const EXACT_PROJECT_REF = 'sncfyvpzwedqgwfpffkh';
export const APPROVED_POOLER_HOST = 'aws-0-ap-northeast-1.pooler.supabase.com';
export const BASELINE_MIGRATION_NAME = '20261027000000_product_baseline';
export const BASELINE_CHECKSUM = '69093deb1f9ed8d2350fda757a86546044c2a66eb6d58a4cef326928188d9862';
export const FINALIZE_MIGRATION_NAME = '20261027010000_product_finalize';
export const FINALIZE_CHECKSUM = 'b3cea3d36ab2072b6ef839b957a96c484f9c79d63e01b13cadd4407e31545f16';
export const CORRECTION_MIGRATION_NAME = '20261027020000_product_correction';
export const CORRECTION_CHECKSUM = '3a5847261839367edd608065be3bcb8359bb11eeaaf7c0f51813231dbc1d9029';
export const REMEDIATION_MIGRATION_NAME = '20261027030000_product_remediation';
export const REMEDIATION_CHECKSUM = '5026899d25e2bfd04bec69e7e74d8c84a71d13ce92344dde3f8999cf4e23dbf6';
export const REPAIR_MIGRATION_NAME = '20261028000000_product_remaining_repair';
export const REPAIR_CHECKSUM = 'c078345384710e5425e8af02529926abd9aec518ec8dc8bc2c9eac5cca42ae75';

export const CANONICAL_APP_TABLES = [
  'accounts',
  'languages',
  'frameworks',
  'levels',
  'courses',
  'units',
  'lessons',
  'lesson_revisions',
  'content_assignments',
  'assignment_history',
  'vocabulary_concepts',
  'lesson_vocabulary_links',
  'media_assets',
  'media_bindings',
  'item_identities',
  'item_revisions',
  'lesson_exercises',
  'learning_contexts',
  'lesson_attempts',
  'lesson_responses',
  'lesson_completions',
  'srs_cards',
  'srs_review_operations',
  'assessment_blueprints',
  'assessment_versions',
  'assessment_version_items',
  'assessment_attempts',
  'assessment_results',
  'revision_reviews',
];

export const CANONICAL_APP_PRIVATE_TABLES = [
  'item_grading_secrets',
  'assessment_responses',
  'command_receipts',
  'audit_events',
  'provisioning_requests',
];

export const TOTAL_PRODUCT_TABLES = CANONICAL_APP_TABLES.length + CANONICAL_APP_PRIVATE_TABLES.length; // 34

/**
 * Load env safely from lingora-admin/.env in memory without exposing secrets.
 */
export function loadEnvSafely() {
  const envPath = path.join(adminRoot, '.env');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Z_]+)=(.*)$/);
    if (match) {
      let val = match[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[match[1]] = val;
    }
  }
  return env;
}

/**
 * Parse and validate connection URL against exact DEV target contract.
 * Rejects bad, unknown, loopback, port 6543, fragments, or ambiguous configurations offline.
 * @param {string} urlString
 * @param {string} expectedRef
 * @returns {{ ok: boolean, reason?: string, targetClass?: 'direct' | 'pooler', ref?: string, host?: string, user?: string, db?: string, port?: number }}
 */
export function parseAndValidateTarget(urlString, expectedRef = EXACT_PROJECT_REF, options = {}) {
  if (!urlString || typeof urlString !== 'string') {
    return { ok: false, reason: 'URL string is missing or empty' };
  }
  if (urlString.includes('placeholder')) {
    return { ok: false, reason: 'Placeholder URL rejected' };
  }

  let parsed;
  try {
    parsed = new URL(urlString);
  } catch {
    return { ok: false, reason: 'Malformed database URL' };
  }

  if (parsed.protocol !== 'postgresql:' && parsed.protocol !== 'postgres:') {
    return { ok: false, reason: `Unsupported URL protocol: ${parsed.protocol}` };
  }

  // Reject URL fragments
  if (parsed.hash && parsed.hash !== '') {
    return { ok: false, reason: `URL fragment rejected: ${parsed.hash}` };
  }

  // Port validation: exactly 5432 (or omitted default). Reject port 6543 (transaction pooler) or arbitrary ports.
  const portStr = parsed.port;
  if (portStr && portStr !== '5432') {
    return { ok: false, reason: `Invalid port '${portStr}'; strictly port 5432 session endpoint required (port 6543 transaction mode prohibited)` };
  }

  const hostname = parsed.hostname.toLowerCase();
  const rawUser = decodeURIComponent(parsed.username || '');
  const pathname = parsed.pathname || '';
  const databaseName = pathname.replace(/^\//, '');

  // Reject loopback / localhost / harness aliases
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname.includes('local') ||
    hostname.includes('harness')
  ) {
    return { ok: false, reason: 'Loopback / local / harness target rejected' };
  }

  // Query parameter inspection
  const seenQueryKeys = new Set();
  const allowedQueryKeys = new Set(['schema', 'sslmode', 'uselibpqcompat']);
  for (const [key, val] of parsed.searchParams.entries()) {
    const k = key.toLowerCase();
    if (seenQueryKeys.has(k)) {
      return { ok: false, reason: `Duplicate query parameter '${key}' rejected` };
    }
    seenQueryKeys.add(k);

    if (!allowedQueryKeys.has(k)) {
      return { ok: false, reason: `Prohibited or unknown query parameter '${key}' rejected` };
    }

    if (k === 'schema') {
      if (val !== 'app') {
        return { ok: false, reason: `Query parameter schema must be 'app', got '${val}'` };
      }
    }
  }

  // Expected database is strictly 'postgres' (or guarded sibling if authorized, PRE-06)
  const isSiblingAllowed = options.allowSiblingTarget || process.env.ALLOW_SIBLING_TARGET === '1';
  const isSibling = isSiblingAllowed && /^lingora_clean_[a-z0-9_]+$/.test(databaseName);
  if (databaseName !== 'postgres' && !isSibling) {
    return { ok: false, reason: `Invalid database '${databaseName}'; expected 'postgres'` };
  }

  // Direct connection form: db.<ref>.supabase.co, user: postgres
  const directHost = `db.${expectedRef}.supabase.co`;
  // Pooler hostname: approved host only, user: postgres.<ref>
  const poolerUser = `postgres.${expectedRef}`;

  if (hostname === directHost) {
    if (rawUser !== 'postgres') {
      return { ok: false, reason: `Direct target user must be 'postgres', got '${rawUser}'` };
    }
    return {
      ok: true,
      targetClass: 'direct',
      ref: expectedRef,
      host: hostname,
      user: rawUser,
      db: databaseName,
      port: 5432,
    };
  }

  if (hostname === APPROVED_POOLER_HOST) {
    if (rawUser !== poolerUser) {
      return { ok: false, reason: `Pooler target user must be '${poolerUser}', got '${rawUser}'` };
    }
    return {
      ok: true,
      targetClass: 'pooler',
      ref: expectedRef,
      host: hostname,
      user: rawUser,
      db: databaseName,
      port: 5432,
    };
  }

  // Any other host is rejected
  return { ok: false, reason: `Unrecognized or unauthorized host: ${hostname}` };
}

/**
 * Verify exact route agreement between DATABASE_URL and DIRECT_URL offline.
 * Rejects ambient overrides that conflict with .env file.
 * @param {Record<string, string>} [envOverride]
 * @returns {{ ok: boolean, reason?: string, devProjectRef?: string, dbTarget?: object, directTarget?: object }}
 */
export function verifyTargetAgreement(envOverride) {
  const env = envOverride || loadEnvSafely();

  // Reject ambient override conflict
  if (process.env.DATABASE_URL && process.env.DATABASE_URL !== env.DATABASE_URL) {
    return { ok: false, reason: 'Ambient process.env.DATABASE_URL conflicts with ignored .env' };
  }
  if (process.env.DIRECT_URL && process.env.DIRECT_URL !== env.DIRECT_URL) {
    return { ok: false, reason: 'Ambient process.env.DIRECT_URL conflicts with ignored .env' };
  }

  // Reject ambient project ref overrides that conflict
  const ambientRefs = [
    { key: 'SUPABASE_DEV_PROJECT_REF', val: process.env.SUPABASE_DEV_PROJECT_REF },
    { key: 'PROJECT_REF', val: process.env.PROJECT_REF },
    { key: 'SUPABASE_PROJECT_REF', val: process.env.SUPABASE_PROJECT_REF },
  ];
  for (const { key, val } of ambientRefs) {
    if (val && val !== EXACT_PROJECT_REF) {
      return { ok: false, reason: `Ambient process.env.${key} '${val}' conflicts with authorized ref '${EXACT_PROJECT_REF}'` };
    }
  }

  const projectRef = process.env.SUPABASE_DEV_PROJECT_REF || env.SUPABASE_DEV_PROJECT_REF;
  const databaseUrl = process.env.DATABASE_URL || env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL || env.DIRECT_URL;

  if (!projectRef) {
    return { ok: false, reason: 'SUPABASE_DEV_PROJECT_REF is missing' };
  }
  if (projectRef !== EXACT_PROJECT_REF) {
    return { ok: false, reason: `SUPABASE_DEV_PROJECT_REF '${projectRef}' does not match exact authorized ref '${EXACT_PROJECT_REF}'` };
  }

  const dbTarget = parseAndValidateTarget(databaseUrl, EXACT_PROJECT_REF);
  if (!dbTarget.ok) {
    return { ok: false, reason: `DATABASE_URL invalid: ${dbTarget.reason}` };
  }

  const directTarget = parseAndValidateTarget(directUrl, EXACT_PROJECT_REF);
  if (!directTarget.ok) {
    return { ok: false, reason: `DIRECT_URL invalid: ${directTarget.reason}` };
  }

  if (dbTarget.ref !== directTarget.ref || dbTarget.ref !== EXACT_PROJECT_REF) {
    return { ok: false, reason: `Target project ref mismatch: db=${dbTarget.ref} vs direct=${directTarget.ref} (expected ${EXACT_PROJECT_REF})` };
  }

  if (dbTarget.db !== directTarget.db || dbTarget.port !== directTarget.port) {
    return { ok: false, reason: `Target db/port mismatch: db=${dbTarget.db}:${dbTarget.port} vs direct=${directTarget.db}:${directTarget.port}` };
  }

  return {
    ok: true,
    devProjectRef: EXACT_PROJECT_REF,
    dbTarget,
    directTarget,
  };
}

/**
 * Build a sanitized pg connection string with uselibpqcompat=true and query cleanup.
 * @param {string} urlString
 * @returns {string}
 */
export function sanitizeConnectionUrl(urlString) {
  try {
    const u = new URL(urlString);
    u.searchParams.set('uselibpqcompat', 'true');
    if (!u.searchParams.has('sslmode')) {
      u.searchParams.set('sslmode', 'require');
    }
    return u.toString();
  } catch {
    return urlString;
  }
}

/**
 * Compute local migration checksum if file exists.
 * @param {string} relativePath
 * @returns {string | null}
 */
export function getLocalMigrationChecksum(relativePath) {
  const fullPath = path.join(adminRoot, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  const content = fs.readFileSync(fullPath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Inspect clean-proof capability on DEV cluster read-only.
 * Checks whether creating an authentic isolated provider database is feasible.
 * @param {any} client pg client inside BEGIN READ ONLY
 * @returns {Promise<{ feasible: boolean, reason: string, details: object }>}
 */
export async function inspectCleanProofCapability(client) {
  const roleRes = await client.query('SELECT rolname, rolsuper, rolcreatedb FROM pg_roles WHERE rolname = CURRENT_USER');
  const role = roleRes.rows[0] || {};
  const isSuper = role.rolsuper === true;
  const canCreateDb = role.rolcreatedb === true;

  const authOwnerRes = await client.query(
    "SELECT pg_catalog.pg_get_userbyid(nspowner) AS owner FROM pg_namespace WHERE nspname = 'auth'"
  );
  const authOwner = authOwnerRes.rows[0]?.owner || 'unknown';

  let hasPgDump = false;
  let hasPsql = false;
  try {
    const { spawnSync } = await import('child_process');
    hasPgDump = spawnSync('which', ['pg_dump']).status === 0;
    hasPsql = spawnSync('which', ['psql']).status === 0;
  } catch {}

  const procedure = {
    targetPattern: 'lingora_clean_<nonce>',
    template: 'template0',
    owner: 'postgres',
    authenticPrerequisite: 'Schema-only provider auth DDL (no user data, no mock rows)',
    migrationSequence: 'All 5 migrations in order (baseline, finalize, correction, remediation, repair)',
    verification: 'verifyCatalogParity with allowPendingRepair: false',
    cleanupMethod: 'Verified OID/owner/nonce, disconnect all clients, DROP DATABASE WITH (FORCE = false)',
  };

  const details = {
    currentUser: role.rolname,
    rolsuper: isSuper,
    rolcreatedb: canCreateDb,
    authSchemaOwner: authOwner,
    hasPgDump,
    hasPsql,
    procedure,
    status: 'NOT_RUN',
  };

  return {
    feasible: null,
    status: 'NOT_RUN',
    reason: `Clean proof procedure delivered (PRE-06): role=${role.rolname}, rolcreatedb=${canCreateDb}, rolsuper=${isSuper}, authOwner=${authOwner}, pg_dump=${hasPgDump}, psql=${hasPsql}. Stage A prohibits remote database mutations (CREATE/DROP DATABASE). Stage B isolated sibling proof procedure documented and guarded; status is NOT RUN / UNESTABLISHED pending Stage B authorization.`,
    details,
  };
}

/**
 * Run read-only product database preflight check against positive DEV.
 * Evaluates state: INITIAL_CLEAN | UPGRADE_BASELINE | UPGRADE_FINALIZE | REPLAY_CORRECTED | FAIL_BLOCKED.
 * Connects to BOTH DATABASE_URL and DIRECT_URL to verify route agreement.
 * @param {{ intent?: 'migrate' | 'seed' | 'smoke', silent?: boolean, envOverride?: Record<string, string> }} [options]
 * @returns {Promise<{ ok: boolean, state: string, reason?: string, details?: object }>}
 */
export async function runPreflight(options = {}) {
  const intent = options.intent || 'migrate';
  const silent = !!options.silent;

  if (!silent) {
    console.log('=============================================================================');
    console.log(` Lingora Canonical Product Database Preflight Check [intent=${intent}]`);
    console.log(` Target Ref: ${EXACT_PROJECT_REF} (Read-Only Two-Route Verification)`);
    console.log('=============================================================================');
  }

  // 1. Verify target agreement offline
  const targetCheck = verifyTargetAgreement(options.envOverride);
  if (!targetCheck.ok) {
    if (!silent) console.error(`❌ PREFLIGHT TARGET FAIL: ${targetCheck.reason}`);
    return { ok: false, state: 'FAIL_BLOCKED', reason: targetCheck.reason };
  }
  if (!silent) {
    console.log(`✅ [TARGET-AGREEMENT] Verified offline target agreement for ref: ${EXACT_PROJECT_REF}`);
    console.log(`   DATABASE_URL target: ${targetCheck.dbTarget.targetClass} (${targetCheck.dbTarget.host}:5432)`);
    console.log(`   DIRECT_URL target:   ${targetCheck.directTarget.targetClass} (${targetCheck.directTarget.host}:5432)`);
  }

  // Check local migration files existence & checksums
  const baselineLocalSha = getLocalMigrationChecksum(`prisma/product/migrations/${BASELINE_MIGRATION_NAME}/migration.sql`);
  const finalizeLocalSha = getLocalMigrationChecksum(`prisma/product/migrations/${FINALIZE_MIGRATION_NAME}/migration.sql`);
  const correctionLocalSha = getLocalMigrationChecksum(`prisma/product/migrations/${CORRECTION_MIGRATION_NAME}/migration.sql`);
  const remediationLocalSha = getLocalMigrationChecksum(`prisma/product/migrations/${REMEDIATION_MIGRATION_NAME}/migration.sql`);
  const repairLocalSha = getLocalMigrationChecksum(`prisma/product/migrations/${REPAIR_MIGRATION_NAME}/migration.sql`);

  if (!baselineLocalSha || baselineLocalSha !== BASELINE_CHECKSUM) {
    return { ok: false, state: 'FAIL_BLOCKED', reason: `Local baseline migration missing or checksum mismatch: ${baselineLocalSha}` };
  }
  if (!finalizeLocalSha || finalizeLocalSha !== FINALIZE_CHECKSUM) {
    return { ok: false, state: 'FAIL_BLOCKED', reason: `Local finalize migration missing or checksum mismatch: ${finalizeLocalSha}` };
  }
  if (!correctionLocalSha || correctionLocalSha !== CORRECTION_CHECKSUM) {
    return { ok: false, state: 'FAIL_BLOCKED', reason: `Local correction migration missing or checksum mismatch: ${correctionLocalSha}` };
  }
  if (!remediationLocalSha || remediationLocalSha !== REMEDIATION_CHECKSUM) {
    return { ok: false, state: 'FAIL_BLOCKED', reason: `Local remediation migration missing or checksum mismatch: ${remediationLocalSha}` };
  }
  if (!repairLocalSha || repairLocalSha !== REPAIR_CHECKSUM) {
    return { ok: false, state: 'FAIL_BLOCKED', reason: `Local repair migration missing or checksum mismatch: ${repairLocalSha}` };
  }

  const env = options.envOverride || loadEnvSafely();
  const databaseUrl = process.env.DATABASE_URL || env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL || env.DIRECT_URL;
  const cleanDbUrl = sanitizeConnectionUrl(databaseUrl);
  const cleanDirectUrl = sanitizeConnectionUrl(directUrl);

  const { default: pg } = await import('pg');

  // Helper to probe a route
  async function probeRoute(urlString, label) {
    const pool = new pg.Pool({
      connectionString: urlString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 8000,
      query_timeout: 8000,
      statement_timeout: 8000,
      max: 1,
    });
    try {
      const client = await pool.connect();
      try {
        await client.query('BEGIN READ ONLY');

        // Check version, user, db
        const verRes = await client.query("SELECT current_setting('server_version') AS ver");
        const whoRes = await client.query('SELECT current_user AS u, current_database() AS db');
        const ver = verRes.rows[0]?.ver || 'unknown';
        const user = whoRes.rows[0]?.u;
        const db = whoRes.rows[0]?.db;

        // Check auth.users
        const authRes = await client.query(
          "SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users'"
        );
        const hasAuthUsers = authRes.rowCount > 0;

        // Check product tables and any conflicting foreign tables across all schemas
        const tablesRes = await client.query(
          "SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'auth', 'extensions', 'graphql', 'realtime', 'storage', 'vault', 'supabase_functions', 'supabase_migrations') ORDER BY table_schema, table_name"
        );
        const appTables = [];
        const appPrivateTables = [];
        const foreignTables = [];

        for (const row of tablesRes.rows) {
          if (row.table_name === '_prisma_migrations') continue;
          if (row.table_schema === 'app') {
            if (CANONICAL_APP_TABLES.includes(row.table_name)) {
              appTables.push(row.table_name);
            } else {
              foreignTables.push(`app.${row.table_name}`);
            }
          } else if (row.table_schema === 'app_private') {
            if (CANONICAL_APP_PRIVATE_TABLES.includes(row.table_name)) {
              appPrivateTables.push(row.table_name);
            } else {
              foreignTables.push(`app_private.${row.table_name}`);
            }
          } else {
            // Table in another schema (e.g. public) with canonical product name is a conflict
            if (CANONICAL_APP_TABLES.includes(row.table_name) || CANONICAL_APP_PRIVATE_TABLES.includes(row.table_name)) {
              foreignTables.push(`${row.table_schema}.${row.table_name}`);
            }
          }
        }

        // Check _prisma_migrations schema (must ONLY be in app, reject if in public or ANY other schema)
        const migTableRes = await client.query(
          "SELECT table_schema FROM information_schema.tables WHERE table_name = '_prisma_migrations'"
        );
        const migSchemas = migTableRes.rows.map((r) => r.table_schema);
        const nonAppMigSchemas = migSchemas.filter((s) => s !== 'app');
        if (nonAppMigSchemas.length > 0) {
          await client.query('ROLLBACK');
          return { ok: false, error: `Conflicting _prisma_migrations found in non-app schema(s): ${nonAppMigSchemas.join(', ')}` };
        }

        const migRows = [];
        if (migSchemas.includes('app')) {
          const res = await client.query(
            'SELECT migration_name, checksum, finished_at, rolled_back_at FROM app._prisma_migrations ORDER BY started_at ASC'
          );
          migRows.push(...res.rows);
        }

        // Bounded read-only data violation queries (PRE-04)
        const dataViolations = [];
        const subRevRes = await client.query(`
          SELECT count(*) AS c
            FROM app.lesson_revisions
           WHERE status IN ('IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'PUBLISHED')
             AND (submitted_at IS NULL OR submitted_by IS NULL OR submitted_assignment_generation IS NULL OR assignment_scope_snapshot IS NULL)
        `);
        const subRevBad = parseInt(subRevRes.rows[0]?.c || '0', 10);
        if (subRevBad > 0) dataViolations.push(`${subRevBad} submitted lesson revisions missing required submission facts`);

        const ptsRes = await client.query(`
          SELECT count(*) AS c
            FROM app.assessment_results
           WHERE raw_points < 0 OR possible_points <= 0 OR raw_points > possible_points
        `);
        const ptsBad = parseInt(ptsRes.rows[0]?.c || '0', 10);
        if (ptsBad > 0) dataViolations.push(`${ptsBad} assessment results with invalid points bounds`);

        const oldEnumRes = await client.query(`
          SELECT count(*) AS c
            FROM pg_constraint
           WHERE conrelid = 'app.assessment_results'::regclass
             AND conname = 'assessment_results_assessment_type_check'
        `);
        const oldEnumBad = parseInt(oldEnumRes.rows[0]?.c || '0', 10);
        if (oldEnumBad > 0) dataViolations.push('Obsolete enum constraint assessment_results_assessment_type_check still exists');

        // Catalog parity check (PRE-04, PRE-05)
        let catalogParity = null;
        if (migRows.length === 4) {
          catalogParity = await verifyCatalogParity(client, { allowPendingRepair: true });
        } else if (migRows.length === 5) {
          catalogParity = await verifyCatalogParity(client, { allowPendingRepair: false });
        }

        // Clean-proof capability check
        const cleanProof = await inspectCleanProofCapability(client);

        await client.query('ROLLBACK');

        return {
          ok: true,
          label,
          ver,
          user,
          db,
          hasAuthUsers,
          appTables: appTables.slice().sort(),
          appPrivateTables: appPrivateTables.slice().sort(),
          appTablesCount: appTables.length,
          appPrivateTablesCount: appPrivateTables.length,
          totalTables: appTables.length + appPrivateTables.length,
          foreignTables,
          migRows,
          dataViolations,
          catalogParity,
          cleanProof,
        };
      } finally {
        client.release();
      }
    } finally {
      await pool.end();
    }
  }

  // 2. Probe both routes
  let dbObs, directObs;
  try {
    dbObs = await probeRoute(cleanDbUrl, 'DATABASE_URL');
  } catch (err) {
    return { ok: false, state: 'FAIL_BLOCKED', reason: `DATABASE_URL connection probe failed: ${err.message}` };
  }
  if (!dbObs.ok) {
    return { ok: false, state: 'FAIL_BLOCKED', reason: dbObs.error };
  }

  try {
    directObs = await probeRoute(cleanDirectUrl, 'DIRECT_URL');
  } catch (err) {
    return { ok: false, state: 'FAIL_BLOCKED', reason: `DIRECT_URL connection probe failed: ${err.message}` };
  }
  if (!directObs.ok) {
    return { ok: false, state: 'FAIL_BLOCKED', reason: directObs.error };
  }

  // 3. Verify route agreement
  if (dbObs.ver !== directObs.ver || dbObs.user !== directObs.user || dbObs.db !== directObs.db) {
    return {
      ok: false,
      state: 'FAIL_BLOCKED',
      reason: `Route observation mismatch: db=${dbObs.user}@${dbObs.db} (v${dbObs.ver}) vs direct=${directObs.user}@${directObs.db} (v${directObs.ver})`,
    };
  }

  if (dbObs.user !== 'postgres' || dbObs.db !== 'postgres' || !dbObs.ver.startsWith('17.')) {
    return {
      ok: false,
      state: 'FAIL_BLOCKED',
      reason: `Unexpected server identity: expected postgres@postgres (PostgreSQL 17.x), got ${dbObs.user}@${dbObs.db} (${dbObs.ver})`,
    };
  }

  if (!dbObs.hasAuthUsers || !directObs.hasAuthUsers) {
    return { ok: false, state: 'FAIL_BLOCKED', reason: 'Provider auth.users table missing' };
  }

  const allForeignTables = [...new Set([...dbObs.foreignTables, ...directObs.foreignTables])];
  if (allForeignTables.length > 0) {
    return { ok: false, state: 'FAIL_BLOCKED', reason: `Foreign or conflicting tables found: ${allForeignTables.join(', ')}` };
  }

  // Table catalog parity across both routes
  if (
    JSON.stringify(dbObs.appTables) !== JSON.stringify(directObs.appTables) ||
    JSON.stringify(dbObs.appPrivateTables) !== JSON.stringify(directObs.appPrivateTables)
  ) {
    return {
      ok: false,
      state: 'FAIL_BLOCKED',
      reason: 'Catalog table mismatch between DATABASE_URL and DIRECT_URL routes',
    };
  }

  // Migration history parity across both routes
  if (dbObs.migRows.length !== directObs.migRows.length) {
    return {
      ok: false,
      state: 'FAIL_BLOCKED',
      reason: `Migration row count mismatch: db=${dbObs.migRows.length} vs direct=${directObs.migRows.length}`,
    };
  }

  for (let i = 0; i < dbObs.migRows.length; i++) {
    const r1 = dbObs.migRows[i];
    const r2 = directObs.migRows[i];
    if (
      r1.migration_name !== r2.migration_name ||
      r1.checksum !== r2.checksum ||
      !r1.finished_at ||
      !r2.finished_at ||
      r1.rolled_back_at ||
      r2.rolled_back_at
    ) {
      return {
        ok: false,
        state: 'FAIL_BLOCKED',
        reason: `Migration history row ${i} (${r1.migration_name}) mismatch between routes`,
      };
    }
  }

  // 4. Evaluate finite migration states
  const migRows = dbObs.migRows;
  let state = 'FAIL_BLOCKED';
  let stateReason = '';

  if (dbObs.totalTables === 0 && migRows.length === 0) {
    state = 'INITIAL_CLEAN';
  } else if (migRows.length === 1) {
    const r1 = migRows[0];
    const baselineOk = r1.migration_name === BASELINE_MIGRATION_NAME && r1.checksum === BASELINE_CHECKSUM && !!r1.finished_at && !r1.rolled_back_at;
    if (baselineOk && dbObs.totalTables === TOTAL_PRODUCT_TABLES) {
      state = 'UPGRADE_BASELINE';
    } else {
      state = 'FAIL_BLOCKED';
      stateReason = `Baseline discrepancy: baselineOk=${baselineOk}, tables=${dbObs.totalTables}`;
    }
  } else if (migRows.length === 2) {
    const [r1, r2] = migRows;
    const baselineOk = r1.migration_name === BASELINE_MIGRATION_NAME && r1.checksum === BASELINE_CHECKSUM && !!r1.finished_at && !r1.rolled_back_at;
    const finalizeOk = r2.migration_name === FINALIZE_MIGRATION_NAME && r2.checksum === FINALIZE_CHECKSUM && !!r2.finished_at && !r2.rolled_back_at;
    if (baselineOk && finalizeOk && dbObs.totalTables === TOTAL_PRODUCT_TABLES) {
      state = 'UPGRADE_FINALIZE';
    } else {
      state = 'FAIL_BLOCKED';
      stateReason = `Finalize discrepancy: baselineOk=${baselineOk}, finalizeOk=${finalizeOk}`;
    }
  } else if (migRows.length === 3) {
    const [r1, r2, r3] = migRows;
    const baselineOk = r1.migration_name === BASELINE_MIGRATION_NAME && r1.checksum === BASELINE_CHECKSUM && !!r1.finished_at && !r1.rolled_back_at;
    const finalizeOk = r2.migration_name === FINALIZE_MIGRATION_NAME && r2.checksum === FINALIZE_CHECKSUM && !!r2.finished_at && !r2.rolled_back_at;
    const correctionOk = r3.migration_name === CORRECTION_MIGRATION_NAME && r3.checksum === CORRECTION_CHECKSUM && !!r3.finished_at && !r3.rolled_back_at;
    if (baselineOk && finalizeOk && correctionOk && dbObs.totalTables === TOTAL_PRODUCT_TABLES) {
      state = 'UPGRADE_REMEDIATION';
    } else {
      state = 'FAIL_BLOCKED';
      stateReason = `Correction discrepancy: baselineOk=${baselineOk}, finalizeOk=${finalizeOk}, correctionOk=${correctionOk}`;
    }
  } else if (migRows.length === 4) {
    const [r1, r2, r3, r4] = migRows;
    const baselineOk = r1.migration_name === BASELINE_MIGRATION_NAME && r1.checksum === BASELINE_CHECKSUM && !!r1.finished_at && !r1.rolled_back_at;
    const finalizeOk = r2.migration_name === FINALIZE_MIGRATION_NAME && r2.checksum === FINALIZE_CHECKSUM && !!r2.finished_at && !r2.rolled_back_at;
    const correctionOk = r3.migration_name === CORRECTION_MIGRATION_NAME && r3.checksum === CORRECTION_CHECKSUM && !!r3.finished_at && !r3.rolled_back_at;
    const remediationOk = r4.migration_name === REMEDIATION_MIGRATION_NAME && r4.checksum === REMEDIATION_CHECKSUM && !!r4.finished_at && !r4.rolled_back_at;
    if (baselineOk && finalizeOk && correctionOk && remediationOk && dbObs.totalTables === TOTAL_PRODUCT_TABLES) {
      state = 'UPGRADE_REPAIR';
    } else {
      state = 'FAIL_BLOCKED';
      stateReason = `Remediation discrepancy: baselineOk=${baselineOk}, finalizeOk=${finalizeOk}, correctionOk=${correctionOk}, remediationOk=${remediationOk}`;
    }
  } else if (migRows.length === 5) {
    const [r1, r2, r3, r4, r5] = migRows;
    const baselineOk = r1.migration_name === BASELINE_MIGRATION_NAME && r1.checksum === BASELINE_CHECKSUM && !!r1.finished_at && !r1.rolled_back_at;
    const finalizeOk = r2.migration_name === FINALIZE_MIGRATION_NAME && r2.checksum === FINALIZE_CHECKSUM && !!r2.finished_at && !r2.rolled_back_at;
    const correctionOk = r3.migration_name === CORRECTION_MIGRATION_NAME && r3.checksum === CORRECTION_CHECKSUM && !!r3.finished_at && !r3.rolled_back_at;
    const remediationOk = r4.migration_name === REMEDIATION_MIGRATION_NAME && r4.checksum === REMEDIATION_CHECKSUM && !!r4.finished_at && !r4.rolled_back_at;
    const repairOk = r5.migration_name === REPAIR_MIGRATION_NAME && r5.checksum === REPAIR_CHECKSUM && !!r5.finished_at && !r5.rolled_back_at;
    if (baselineOk && finalizeOk && correctionOk && remediationOk && repairOk && dbObs.totalTables === TOTAL_PRODUCT_TABLES) {
      state = 'REPLAY_REPAIRED';
    } else {
      state = 'FAIL_BLOCKED';
      stateReason = `Repair discrepancy: baselineOk=${baselineOk}, finalizeOk=${finalizeOk}, correctionOk=${correctionOk}, remediationOk=${remediationOk}, repairOk=${repairOk}`;
    }
  } else {
    state = 'FAIL_BLOCKED';
    stateReason = `Unexpected migration count (${migRows.length}) in _prisma_migrations`;
  }

  // Data violations check (PRE-04)
  if (dbObs.dataViolations && dbObs.dataViolations.length > 0) {
    state = 'FAIL_BLOCKED';
    stateReason = `Data violations detected: ${dbObs.dataViolations.join('; ')}`;
  }

  // Catalog parity check (PRE-04)
  if (dbObs.catalogParity && !dbObs.catalogParity.ok) {
    state = 'FAIL_BLOCKED';
    stateReason = `Catalog definition drift: ${dbObs.catalogParity.diffs.join('; ')}`;
  }

  // Intent gating
  let intentAllowed = false;
  if (intent === 'migrate') {
    intentAllowed = state === 'INITIAL_CLEAN' || state === 'UPGRADE_BASELINE' || state === 'UPGRADE_FINALIZE' || state === 'UPGRADE_REMEDIATION' || state === 'UPGRADE_REPAIR' || state === 'REPLAY_REPAIRED';
  } else if (intent === 'seed' || intent === 'smoke') {
    intentAllowed = state === 'REPLAY_REPAIRED';
  }

  const details = {
    serverVersion: dbObs.ver,
    currentUser: dbObs.user,
    currentDb: dbObs.db,
    totalProductTablesFound: dbObs.totalTables,
    migRowsCount: migRows.length,
    state,
    intent,
    intentAllowed,
    cleanProof: dbObs.cleanProof,
  };

  if (!intentAllowed) {
    const msg = `Intent '${intent}' disallowed in state '${state}': ${stateReason || 'Database not in required migration state'}`;
    if (!silent) console.error(`❌ PREFLIGHT FAIL: ${msg}`);
    return { ok: false, state, reason: msg, details };
  }

  if (!silent) {
    console.log(`✅ [PREFLIGHT-PASS] State: ${state} (server=${dbObs.ver}, tables=${dbObs.totalTables}, migrations=${migRows.length})`);
    console.log(`   Clean proof capability: ${dbObs.cleanProof.reason}`);
  }

  return { ok: true, state, details };
}

/**
 * Offline target parsing test runner.
 * Exercises parseAndValidateTarget across all prohibited / malformed target patterns without network.
 * @returns {{ allPassed: boolean, totalCases: number, passedCases: number, results: Array<{ name: string, pass: boolean, note: string }> }}
 */
export function testBadTargets() {
  const cases = [
    {
      name: 'Valid exact direct URL',
      url: `postgresql://postgres:secret@db.${EXACT_PROJECT_REF}.supabase.co:5432/postgres?schema=app`,
      expectOk: true,
    },
    {
      name: 'Valid exact pooler URL',
      url: `postgresql://postgres.${EXACT_PROJECT_REF}:secret@${APPROVED_POOLER_HOST}:5432/postgres?schema=app`,
      expectOk: true,
    },
    {
      name: 'Reject ref in password only',
      url: `postgresql://postgres:${EXACT_PROJECT_REF}@otherhost.com:5432/postgres`,
      expectOk: false,
    },
    {
      name: 'Reject ref in query parameter only',
      url: `postgresql://postgres:secret@otherhost.com:5432/postgres?project=${EXACT_PROJECT_REF}`,
      expectOk: false,
    },
    {
      name: 'Reject ref as hostname suffix (spoofing)',
      url: `postgresql://postgres:secret@db.${EXACT_PROJECT_REF}.evil.com:5432/postgres`,
      expectOk: false,
    },
    {
      name: 'Reject localhost loopback',
      url: 'postgresql://postgres:secret@127.0.0.1:5432/postgres',
      expectOk: false,
    },
    {
      name: 'Reject query override of host',
      url: `postgresql://postgres:secret@db.${EXACT_PROJECT_REF}.supabase.co:5432/postgres?host=127.0.0.1`,
      expectOk: false,
    },
    {
      name: 'Reject non-postgres database name',
      url: `postgresql://postgres:secret@db.${EXACT_PROJECT_REF}.supabase.co:5432/otherdb`,
      expectOk: false,
    },
    {
      name: 'Reject wrong pooler user',
      url: `postgresql://postgres:secret@${APPROVED_POOLER_HOST}:5432/postgres`,
      expectOk: false,
    },
    {
      name: 'Reject placeholder URL',
      url: 'postgresql://placeholder:placeholder@127.0.0.1:5432/placeholder',
      expectOk: false,
    },
    {
      name: 'Reject transaction pooler port 6543',
      url: `postgresql://postgres.${EXACT_PROJECT_REF}:secret@${APPROVED_POOLER_HOST}:6543/postgres`,
      expectOk: false,
    },
    {
      name: 'Reject arbitrary port 5433',
      url: `postgresql://postgres.${EXACT_PROJECT_REF}:secret@${APPROVED_POOLER_HOST}:5433/postgres`,
      expectOk: false,
    },
    {
      name: 'Reject URL fragment',
      url: `postgresql://postgres:secret@db.${EXACT_PROJECT_REF}.supabase.co:5432/postgres#fragment`,
      expectOk: false,
    },
    {
      name: 'Reject duplicate query parameters',
      url: `postgresql://postgres:secret@db.${EXACT_PROJECT_REF}.supabase.co:5432/postgres?schema=app&schema=public`,
      expectOk: false,
    },
    {
      name: 'Reject schema=public override',
      url: `postgresql://postgres:secret@db.${EXACT_PROJECT_REF}.supabase.co:5432/postgres?schema=public`,
      expectOk: false,
    },
    {
      name: 'Reject options query parameter',
      url: `postgresql://postgres:secret@db.${EXACT_PROJECT_REF}.supabase.co:5432/postgres?options=-c%20search_path=public`,
      expectOk: false,
    },
    {
      name: 'Reject unapproved pooler region/subdomain',
      url: `postgresql://postgres.${EXACT_PROJECT_REF}:secret@aws-0-us-west-1.pooler.supabase.com:5432/postgres`,
      expectOk: false,
    },
  ];

  const results = [];
  let passedCases = 0;

  for (const c of cases) {
    const res = parseAndValidateTarget(c.url, EXACT_PROJECT_REF);
    const pass = res.ok === c.expectOk;
    if (pass) passedCases++;
    results.push({
      name: c.name,
      pass,
      note: res.ok ? `Parsed targetClass=${res.targetClass}` : `Rejected with: ${res.reason}`,
    });
  }

  // Also test ambient override conflicts and target agreement offline
  const baseValidEnv = {
    SUPABASE_DEV_PROJECT_REF: EXACT_PROJECT_REF,
    DATABASE_URL: `postgresql://postgres.${EXACT_PROJECT_REF}:secret@${APPROVED_POOLER_HOST}:5432/postgres?schema=app`,
    DIRECT_URL: `postgresql://postgres:secret@db.${EXACT_PROJECT_REF}.supabase.co:5432/postgres?schema=app`,
  };

  // 1. Ambient DATABASE_URL conflict
  const origDb = process.env.DATABASE_URL;
  try {
    process.env.DATABASE_URL = 'postgresql://postgres:secret@otherhost.com:5432/postgres';
    const conflictRes = verifyTargetAgreement(baseValidEnv);
    const pass = conflictRes.ok === false && conflictRes.reason.includes('Ambient');
    if (pass) passedCases++;
    results.push({
      name: 'Reject ambient DATABASE_URL conflict',
      pass,
      note: pass ? 'Rejected ambient DATABASE_URL conflict' : `Unexpected result: ${conflictRes.reason}`,
    });
  } finally {
    if (origDb !== undefined) process.env.DATABASE_URL = origDb;
    else delete process.env.DATABASE_URL;
  }

  // 2. Ambient DIRECT_URL conflict
  const origDirect = process.env.DIRECT_URL;
  try {
    process.env.DIRECT_URL = 'postgresql://postgres:secret@otherhost.com:5432/postgres';
    const conflictRes = verifyTargetAgreement(baseValidEnv);
    const pass = conflictRes.ok === false && conflictRes.reason.includes('Ambient');
    if (pass) passedCases++;
    results.push({
      name: 'Reject ambient DIRECT_URL conflict',
      pass,
      note: pass ? 'Rejected ambient DIRECT_URL conflict' : `Unexpected result: ${conflictRes.reason}`,
    });
  } finally {
    if (origDirect !== undefined) process.env.DIRECT_URL = origDirect;
    else delete process.env.DIRECT_URL;
  }

  // 3. Ambient PROJECT_REF conflict
  const origProj = process.env.PROJECT_REF;
  try {
    process.env.PROJECT_REF = 'evilprojectref123';
    const conflictRes = verifyTargetAgreement(baseValidEnv);
    const pass = conflictRes.ok === false && conflictRes.reason.includes('PROJECT_REF');
    if (pass) passedCases++;
    results.push({
      name: 'Reject ambient PROJECT_REF conflict',
      pass,
      note: pass ? 'Rejected ambient PROJECT_REF conflict' : `Unexpected result: ${conflictRes.reason}`,
    });
  } finally {
    if (origProj !== undefined) process.env.PROJECT_REF = origProj;
    else delete process.env.PROJECT_REF;
  }

  // 4. Ambient SUPABASE_PROJECT_REF conflict
  const origSubProj = process.env.SUPABASE_PROJECT_REF;
  try {
    process.env.SUPABASE_PROJECT_REF = 'evilprojectref456';
    const conflictRes = verifyTargetAgreement(baseValidEnv);
    const pass = conflictRes.ok === false && conflictRes.reason.includes('SUPABASE_PROJECT_REF');
    if (pass) passedCases++;
    results.push({
      name: 'Reject ambient SUPABASE_PROJECT_REF conflict',
      pass,
      note: pass ? 'Rejected ambient SUPABASE_PROJECT_REF conflict' : `Unexpected result: ${conflictRes.reason}`,
    });
  } finally {
    if (origSubProj !== undefined) process.env.SUPABASE_PROJECT_REF = origSubProj;
    else delete process.env.SUPABASE_PROJECT_REF;
  }

  // 5. Mismatched DIRECT_URL target ref
  const mismatchedDirectEnv = {
    ...baseValidEnv,
    DIRECT_URL: `postgresql://postgres:secret@db.otherref12345678.supabase.co:5432/postgres?schema=app`,
  };
  const mismatchRes = verifyTargetAgreement(mismatchedDirectEnv);
  const mismatchPass = mismatchRes.ok === false && mismatchRes.reason.includes('DIRECT_URL invalid');
  if (mismatchPass) passedCases++;
  results.push({
    name: 'Reject mismatched DIRECT_URL ref',
    pass: mismatchPass,
    note: mismatchPass ? 'Rejected mismatched DIRECT_URL ref' : `Unexpected result: ${mismatchRes.reason}`,
  });

  const totalCases = cases.length + 5;

  return {
    allPassed: passedCases === totalCases,
    totalCases,
    passedCases,
    results,
  };
}

if (process.argv[1] && process.argv[1].endsWith('product-preflight.mjs')) {
  const args = process.argv.slice(2);
  const staticMode = args.includes('--static') || args.includes('--test-targets');
  const intentArg = args.find((a) => a.startsWith('--intent='));
  const intent = intentArg ? intentArg.split('=')[1] : 'migrate';

  if (staticMode) {
    console.log('--- Testing Bad Target Configurations Offline (No Network) ---');
    const testResult = testBadTargets();
    for (const r of testResult.results) {
      console.log(`${r.pass ? 'PASS' : 'FAIL'}: ${r.name} -> ${r.note}`);
    }
    console.log(`\nTARGET TEST RESULT: ${testResult.passedCases}/${testResult.totalCases} passed`);
    process.exit(testResult.allPassed ? 0 : 1);
  }

  runPreflight({ intent })
    .then((result) => {
      if (result.ok) {
        console.log(`\nPREFLIGHT STATUS: PASS (${result.state})`);
        process.exit(0);
      } else {
        console.log(`\nPREFLIGHT STATUS: FAIL (${result.state}: ${result.reason})`);
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error('Unexpected preflight error:', err);
      process.exit(1);
    });
}
