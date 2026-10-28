/**
 * Cluster Role and Prerequisite Bootstrap Operator Script.
 *
 * Implements P1-03a AC-03 and spec §2, §5, §9 (Corrected for Finding A3-R6):
 * - Reconciles required cluster roles without hardcoded or committed passwords.
 * - Enforces separation of administrative migration credentials and runtime/assembly/adapter logins.
 * - Enforces NOSUPERUSER, NOBYPASSRLS, NOCREATEDB, NOCREATEROLE, INHERIT on all roles.
 * - Reconciles or fails closed on unsafe existing role flags and memberships.
 * - Anchored descriptor operations prevent symlink traversal and parent race conditions.
 * - Preflights current authority and credential records strictly BEFORE DB connection.
 * - Exposes disposeRuntimeCredentials for clean A3 lifecycle teardown.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import pg from 'pg';
const { Client } = pg;

import {
  openAnchoredRunDir,
  validateRunContextAuthority,
  storageCounters,
} from './private-run-storage.mjs';

export const CLUSTER_LOGIN_ROLES = [
  'lingora_runtime',
  'lingora_assembly',
  'lingora_auth_adapter',
];

export const CLUSTER_NOLOGIN_ROLES = [
  'lingora_authz_reader',
  'lingora_scoped_locker',
  'lingora_content_writer',
  'lingora_transition_writer',
  'lingora_learner_writer',
  'lingora_grader',
  'lingora_fingerprint_reader',
  'lingora_assembly_writer',
  'lingora_auth_provisioner',
  'lingora_audit_writer',
];

export const VALID_PASSWORD_PATTERN = /^[a-zA-Z0-9_-]{24,64}$/;

/**
 * Validate that credential storage path is regular, non-symlink, mode 0600, UID-matching,
 * and strictly contained within the active run directory.
 */
export function validateCredentialStorage(credPath, runDir, { allowAbsent = false } = {}) {
  if (!credPath || typeof credPath !== 'string') {
    const err = new Error('ALLOWLIST_FAIL: Credential path must be a non-empty string.');
    err.code = 'ALLOWLIST_FAIL';
    throw err;
  }
  if (!runDir || typeof runDir !== 'string') {
    const err = new Error('ALLOWLIST_FAIL: Run directory must be a non-empty string.');
    err.code = 'ALLOWLIST_FAIL';
    throw err;
  }

  const resolvedRun = path.resolve(runDir);
  const resolvedCred = path.resolve(credPath);

  // Validate runDir itself: must exist, be a directory, not a symlink, mode 0700, UID match
  let runStat;
  try {
    runStat = fs.lstatSync(resolvedRun);
  } catch (err) {
    const runErr = new Error(`ALLOWLIST_FAIL: Run directory does not exist at "${resolvedRun}".`);
    runErr.code = 'ALLOWLIST_FAIL';
    throw runErr;
  }

  if (runStat.isSymbolicLink()) {
    const err = new Error('ALLOWLIST_FAIL: Run directory must not be a symbolic link.');
    err.code = 'ALLOWLIST_FAIL';
    throw err;
  }
  if (!runStat.isDirectory()) {
    const err = new Error('ALLOWLIST_FAIL: Run directory must be a directory.');
    err.code = 'ALLOWLIST_FAIL';
    throw err;
  }
  if (process.getuid && runStat.uid !== process.getuid()) {
    const err = new Error('ALLOWLIST_FAIL: Run directory UID mismatch.');
    err.code = 'ALLOWLIST_FAIL';
    throw err;
  }
  if ((runStat.mode & 0o777) !== 0o700) {
    const err = new Error(`ALLOWLIST_FAIL: Insecure run directory mode ${(runStat.mode & 0o777).toString(8)} (must be 0700).`);
    err.code = 'ALLOWLIST_FAIL';
    throw err;
  }

  const rel = path.relative(resolvedRun, resolvedCred);
  if (rel.startsWith('..') || path.isAbsolute(rel) || rel === '' || rel.includes('..' + path.sep)) {
    const err = new Error('ALLOWLIST_FAIL: Credential file must be located directly within run directory.');
    err.code = 'ALLOWLIST_FAIL';
    throw err;
  }

  // Verify all parent directory components between resolvedRun and path.dirname(resolvedCred)
  let parent = path.dirname(resolvedCred);
  while (parent.length >= resolvedRun.length) {
    let pStat;
    try {
      pStat = fs.lstatSync(parent);
    } catch (err) {
      const errP = new Error(`ALLOWLIST_FAIL: Parent path component "${parent}" does not exist.`);
      errP.code = 'ALLOWLIST_FAIL';
      throw errP;
    }
    if (pStat.isSymbolicLink()) {
      const err = new Error('ALLOWLIST_FAIL: Parent directory of credential storage must not be a symbolic link.');
      err.code = 'ALLOWLIST_FAIL';
      throw err;
    }
    if (!pStat.isDirectory()) {
      const err = new Error('ALLOWLIST_FAIL: Parent path component must be a directory.');
      err.code = 'ALLOWLIST_FAIL';
      throw err;
    }
    if (process.getuid && pStat.uid !== process.getuid()) {
      const err = new Error('ALLOWLIST_FAIL: Parent directory UID mismatch.');
      err.code = 'ALLOWLIST_FAIL';
      throw err;
    }
    if ((pStat.mode & 0o777) !== 0o700) {
      const err = new Error(`ALLOWLIST_FAIL: Insecure parent directory mode ${(pStat.mode & 0o777).toString(8)}.`);
      err.code = 'ALLOWLIST_FAIL';
      throw err;
    }
    if (parent === resolvedRun) break;
    parent = path.dirname(parent);
  }

  let lstat;
  try {
    lstat = fs.lstatSync(resolvedCred);
  } catch (err) {
    if (err.code === 'ENOENT') {
      if (allowAbsent) return true;
      const notFoundErr = new Error(`PREREQUISITE_ABSENT: Credential file does not exist at "${resolvedCred}".`);
      notFoundErr.code = 'PREREQUISITE_ABSENT';
      throw notFoundErr;
    }
    throw err;
  }

  // Reject symlinks (including dangling symlinks) before following or reading
  if (lstat.isSymbolicLink()) {
    const err = new Error('ALLOWLIST_FAIL: Credential storage must not be a symbolic link.');
    err.code = 'ALLOWLIST_FAIL';
    throw err;
  }

  if (!lstat.isFile()) {
    const err = new Error('ALLOWLIST_FAIL: Credential storage must be a regular file.');
    err.code = 'ALLOWLIST_FAIL';
    throw err;
  }

  if (process.getuid && lstat.uid !== process.getuid()) {
    const err = new Error('ALLOWLIST_FAIL: Credential file UID mismatch.');
    err.code = 'ALLOWLIST_FAIL';
    throw err;
  }

  if ((lstat.mode & 0o777) !== 0o600) {
    const err = new Error(`ALLOWLIST_FAIL: Insecure credential file mode ${(lstat.mode & 0o777).toString(8)} (must be 0600).`);
    err.code = 'ALLOWLIST_FAIL';
    throw err;
  }

  return true;
}

/**
 * Parse and strictly validate runtime credentials JSON payload.
 */
export function parseStrictRuntimeCredentials(content) {
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    const err = new Error('DATA_FAIL: Failed to parse runtime credentials JSON.');
    err.code = 'DATA_FAIL';
    throw err;
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    const err = new Error('ALLOWLIST_FAIL: Runtime credentials payload must be an object.');
    err.code = 'ALLOWLIST_FAIL';
    throw err;
  }

  const keys = Object.keys(parsed).sort();
  const expectedKeys = [...CLUSTER_LOGIN_ROLES].sort();
  if (keys.length !== expectedKeys.length || !expectedKeys.every(r => keys.includes(r))) {
    const err = new Error('ALLOWLIST_FAIL: Runtime credentials record shape mismatch (extra or missing roles).');
    err.code = 'ALLOWLIST_FAIL';
    throw err;
  }

  for (const roleName of CLUSTER_LOGIN_ROLES) {
    const entry = parsed[roleName];
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      const err = new Error(`ALLOWLIST_FAIL: Malformed entry for role "${roleName}".`);
      err.code = 'ALLOWLIST_FAIL';
      throw err;
    }
    const entryKeys = Object.keys(entry).sort();
    if (entryKeys.length !== 2 || entryKeys[0] !== 'password' || entryKeys[1] !== 'role') {
      const err = new Error(`ALLOWLIST_FAIL: Malformed entry keys for role "${roleName}".`);
      err.code = 'ALLOWLIST_FAIL';
      throw err;
    }
    if (
      entry.role !== roleName ||
      typeof entry.password !== 'string' ||
      !VALID_PASSWORD_PATTERN.test(entry.password)
    ) {
      const err = new Error(`ALLOWLIST_FAIL: Malformed or unvalidated credential entry for role "${roleName}".`);
      err.code = 'ALLOWLIST_FAIL';
      throw err;
    }
  }

  return parsed;
}

/**
 * Reconcile cluster roles, schemas, grants, and credentials.
 */
export async function reconcileClusterRoles(testContext, options = {}) {
  if (!testContext || !testContext.credentials || !testContext.runDir) {
    const err = new Error('TEST_CONTEXT_INVALID: Valid test context required for cluster bootstrap.');
    err.code = 'TEST_CONTEXT_INVALID';
    throw err;
  }

  // Preflight validation of current authority under lock BEFORE any DB connection or mutation (M-01)
  const runDir = testContext.runDir;
  const runtimeCredFile = path.resolve(runDir, 'runtime-credentials.json');

  // Validate storage path security before opening
  validateCredentialStorage(runtimeCredFile, runDir, { allowAbsent: true });

  const anchored = openAnchoredRunDir(runDir);
  let existingRuntimeCreds = {};

  try {
    validateRunContextAuthority(testContext, { anchoredDir: anchored });

    // Check if runtime-credentials.json exists
    const credLstat = anchored.lstatChild('runtime-credentials.json');
    if (credLstat) {
      if (credLstat.isSymbolicLink()) {
        const err = new Error('ALLOWLIST_FAIL: Credential storage must not be a symbolic link.');
        err.code = 'ALLOWLIST_FAIL';
        throw err;
      }
      const credContent = anchored.readPrivateRecord('runtime-credentials.json', { allowAbsent: false });
      existingRuntimeCreds = parseStrictRuntimeCredentials(credContent);
    }

    // Connect admin DB client ONLY AFTER preflight succeeds
    const adminClient = testContext.createPgClient();
    await adminClient.connect();

    const generatedCredentials = {};

    try {
      // 1. Reconcile LOGIN roles with secure per-run passwords and strict flags
      for (const roleName of CLUSTER_LOGIN_ROLES) {
        if (!CLUSTER_LOGIN_ROLES.includes(roleName)) {
          const err = new Error(`ALLOWLIST_FAIL: Prohibited role creation attempt: "${roleName}".`);
          err.code = 'ALLOWLIST_FAIL';
          throw err;
        }

        const rolePassword = existingRuntimeCreds[roleName]?.password || crypto.randomBytes(24).toString('hex');
        if (!VALID_PASSWORD_PATTERN.test(rolePassword)) {
          const err = new Error('DATA_FAIL: Generated password failed safety pattern.');
          err.code = 'DATA_FAIL';
          throw err;
        }

        generatedCredentials[roleName] = {
          role: roleName,
          password: rolePassword,
        };

        const res = await adminClient.query(
          'SELECT rolname, rolcanlogin, rolsuper, rolbypassrls, rolcreatedb, rolcreaterole, rolinherit FROM pg_roles WHERE rolname = $1;',
          [roleName]
        );

        // Quote literal safely
        const escapedPassword = `'${rolePassword.replace(/'/g, "''")}'`;

        if (res.rows.length === 0) {
          await adminClient.query(
            `CREATE ROLE ${roleName} WITH LOGIN PASSWORD ${escapedPassword} NOCREATEDB NOCREATEROLE INHERIT;`
          );
        } else {
          // Enforce that existing role does not have unsafe superuser or bypassrls flags
          if (res.rows[0].rolsuper || res.rows[0].rolbypassrls) {
            const err = new Error(`SECURITY_VIOLATION: Existing role "${roleName}" has unsafe superuser or bypassrls privilege.`);
            err.code = 'SECURITY_VIOLATION';
            throw err;
          }
          // Enforce all required security attributes and update password
          await adminClient.query(
            `ALTER ROLE ${roleName} WITH LOGIN NOCREATEDB NOCREATEROLE INHERIT PASSWORD ${escapedPassword};`
          );
        }
      }

      // 2. Reconcile NOLOGIN roles with strict attributes
      for (const roleName of CLUSTER_NOLOGIN_ROLES) {
        if (!CLUSTER_NOLOGIN_ROLES.includes(roleName)) {
          const err = new Error(`ALLOWLIST_FAIL: Prohibited NOLOGIN role creation attempt: "${roleName}".`);
          err.code = 'ALLOWLIST_FAIL';
          throw err;
        }

        const res = await adminClient.query(
          'SELECT rolname, rolcanlogin, rolsuper, rolbypassrls, rolcreatedb, rolcreaterole, rolinherit FROM pg_roles WHERE rolname = $1;',
          [roleName]
        );

        if (res.rows.length === 0) {
          await adminClient.query(
            `CREATE ROLE ${roleName} WITH NOLOGIN NOCREATEDB NOCREATEROLE INHERIT;`
          );
        } else {
          if (res.rows[0].rolsuper || res.rows[0].rolbypassrls) {
            const err = new Error(`SECURITY_VIOLATION: Existing role "${roleName}" has unsafe superuser or bypassrls privilege.`);
            err.code = 'SECURITY_VIOLATION';
            throw err;
          }
          await adminClient.query(
            `ALTER ROLE ${roleName} WITH NOLOGIN NOCREATEDB NOCREATEROLE INHERIT;`
          );
        }
      }

      // Inspect effective inherited membership and SET ROLE reachability for all 13 roles (3 LOGIN + 10 NOLOGIN)
      const allRolesToCheck = [...CLUSTER_LOGIN_ROLES, ...CLUSTER_NOLOGIN_ROLES];
      for (const roleName of allRolesToCheck) {
        const memberRes = await adminClient.query(`
          WITH RECURSIVE role_tree AS (
            SELECT m.roleid, m.member, r.rolname AS parent_role, mem.rolname AS member_role
            FROM pg_auth_members m
            JOIN pg_roles r ON r.oid = m.roleid
            JOIN pg_roles mem ON mem.oid = m.member
            WHERE mem.rolname = $1
            UNION
            SELECT m.roleid, m.member, r.rolname AS parent_role, rt.member_role
            FROM pg_auth_members m
            JOIN pg_roles r ON r.oid = m.roleid
            JOIN role_tree rt ON rt.roleid = m.member
          )
          SELECT DISTINCT parent_role FROM role_tree;
        `, [roleName]);

        if (memberRes.rows.length > 0) {
          const unexpectedRoles = memberRes.rows.map(r => r.parent_role).join(', ');
          const err = new Error(
            `SECURITY_VIOLATION: Unexpected privileged role membership detected for role "${roleName}": [${unexpectedRoles}].`
          );
          err.code = 'SECURITY_VIOLATION';
          throw err;
        }
      }

      // Grant NOLOGIN roles to setup/migration admin (postgres) so it can set function ownership
      await adminClient.query(`GRANT ${CLUSTER_NOLOGIN_ROLES.join(', ')} TO postgres;`);

      // 3. Ensure schemas app and app_private exist
      await adminClient.query('CREATE SCHEMA IF NOT EXISTS app;');
      await adminClient.query('CREATE SCHEMA IF NOT EXISTS app_private;');

      // 4. Revoke default PUBLIC schema access
      await adminClient.query('REVOKE ALL ON SCHEMA app FROM PUBLIC;');
      await adminClient.query('REVOKE ALL ON SCHEMA app_private FROM PUBLIC;');

      // 5. Grant schema USAGE and function owner CREATE privileges
      const allRoles = [...CLUSTER_LOGIN_ROLES, ...CLUSTER_NOLOGIN_ROLES].join(', ');
      await adminClient.query(`GRANT USAGE ON SCHEMA app TO ${allRoles};`);
      await adminClient.query(`GRANT USAGE ON SCHEMA app_private TO ${allRoles};`);

      // Grant CREATE on app_private to roles that own functions in app_private
      const functionOwners = [
        'lingora_authz_reader',
        'lingora_content_writer',
        'lingora_fingerprint_reader',
        'lingora_auth_provisioner',
      ].join(', ');
      await adminClient.query(`GRANT CREATE ON SCHEMA app_private TO ${functionOwners};`);

      // 6. Safely persist private credentials strictly in run-owned private storage (mode 0600) via anchored storage
      const credPayload = JSON.stringify(generatedCredentials, null, 2);
      anchored.writePrivateRecordAtomic('runtime-credentials.json', credPayload, { mode: 0o600 });

      return {
        success: true,
        reconciledRoles: [...CLUSTER_LOGIN_ROLES, ...CLUSTER_NOLOGIN_ROLES],
        credentialsFile: runtimeCredFile,
      };
    } finally {
      await adminClient.end();
    }
  } finally {
    anchored.close();
  }
}

/**
 * Explicit credential disposal for clean lifecycle teardown (Finding A3-R6).
 */
export function disposeRuntimeCredentials(testContext) {
  if (!testContext || !testContext.runDir) {
    const err = new Error('TEST_CONTEXT_INVALID: Valid test context required for credential disposal.');
    err.code = 'TEST_CONTEXT_INVALID';
    throw err;
  }

  testContext.assertLockHeld();

  const runDir = testContext.runDir;
  const runtimeCredFile = path.resolve(runDir, 'runtime-credentials.json');

  const anchored = openAnchoredRunDir(runDir);
  try {
    const stat = anchored.lstatChild('runtime-credentials.json');
    if (stat) {
      anchored.unlinkPrivateRecord('runtime-credentials.json');
      return { disposed: true, file: runtimeCredFile };
    }
    return { disposed: false, file: runtimeCredFile };
  } finally {
    anchored.close();
  }
}
