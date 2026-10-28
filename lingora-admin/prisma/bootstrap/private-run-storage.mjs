/**
 * Private Run Storage & Anchored Path Primitive (M-01, M-02, M-06).
 *
 * Implements anchored descriptor operations on Linux (/proc/self/fd/<dirfd>/...)
 * to eliminate parent-race conditions, symlink traversal, and path escaping:
 * - Walks from absolute root / with O_DIRECTORY | O_NOFOLLOW descriptors.
 * - Rejects ancestor symlinks, foreign UID, and unsafe modes.
 * - Enforces private run directory UID-owned mode 0700 and private files mode 0600.
 * - Retains directory descriptor; operations use /proc/self/fd/<dirfd>/<child>.
 * - Atomic writes use exclusive 0600 temp file creation, complete write/fsync, and rename.
 * - Unlink and lstat verify postcondition ENOENT.
 * - Checks directory continuity (dev & ino) before every private operation.
 * - Provides exportable storage operation counters for test instrumentation.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  TASK_ID,
  DEFAULT_RUNS_DIR,
  FORBIDDEN_UNOWNED_STATE_ROOT,
  FORBIDDEN_UNOWNED_HOME_ROOT,
  FORBIDDEN_OLD_WP00_STATE,
  FORBIDDEN_OLD_WP00_HOME,
  FORBIDDEN_OLDER_RUN_ROOTS,
  validateAuthorityRecord,
  validateDatabaseUrl,
  checkProcessAlive,
} from '../../tests/database/env/env-guard.mjs';

const SAFE_FILENAME_PATTERN = /^[a-zA-Z0-9_.-]+$/;

export const storageCounters = {
  reads: 0,
  writes: 0,
  unlinks: 0,
  renames: 0,
  continuityChecks: 0,
  preflightChecks: 0,
  reset() {
    this.reads = 0;
    this.writes = 0;
    this.unlinks = 0;
    this.renames = 0;
    this.continuityChecks = 0;
    this.preflightChecks = 0;
  },
};

/**
 * Validate that runsDir does not touch forbidden or legacy roots.
 */
export function assertAllowlistedRunPath(targetPath) {
  if (!targetPath || typeof targetPath !== 'string') {
    const err = new Error('ALLOWLIST_FAIL: targetPath must be a non-empty string.');
    err.code = 'ALLOWLIST_FAIL';
    throw err;
  }
  const norm = path.resolve(targetPath);
  const forbiddenDirs = [
    FORBIDDEN_UNOWNED_STATE_ROOT,
    FORBIDDEN_UNOWNED_HOME_ROOT,
    FORBIDDEN_OLD_WP00_STATE,
    FORBIDDEN_OLD_WP00_HOME,
    ...FORBIDDEN_OLDER_RUN_ROOTS,
  ];

  for (const fDir of forbiddenDirs) {
    if (norm === fDir || norm.startsWith(fDir + path.sep)) {
      const err = new Error(`ALLOWLIST_FAIL: Access of forbidden root "${targetPath}" is prohibited.`);
      err.code = 'ALLOWLIST_FAIL';
      throw err;
    }
  }
}

/**
 * Anchored directory wrapper maintaining a retained directory descriptor.
 */
export class AnchoredRunDirectory {
  constructor(dirFd, dev, ino, resolvedPath) {
    this.dirFd = dirFd;
    this.dev = dev;
    this.ino = ino;
    this.path = resolvedPath;
    this.closed = false;
  }

  get procPath() {
    if (this.closed) {
      const err = new Error('ALLOWLIST_FAIL: Anchored directory descriptor is closed.');
      err.code = 'ALLOWLIST_FAIL';
      throw err;
    }
    return `/proc/self/fd/${this.dirFd}`;
  }

  assertNotClosed() {
    if (this.closed) {
      const err = new Error('ALLOWLIST_FAIL: Anchored directory descriptor is closed.');
      err.code = 'ALLOWLIST_FAIL';
      throw err;
    }
  }

  validateFilename(filename) {
    if (!filename || typeof filename !== 'string' || !SAFE_FILENAME_PATTERN.test(filename)) {
      const err = new Error(`ALLOWLIST_FAIL: Filename "${filename}" contains invalid characters or path separators.`);
      err.code = 'ALLOWLIST_FAIL';
      throw err;
    }
    if (filename === '.' || filename === '..') {
      const err = new Error(`ALLOWLIST_FAIL: Filename cannot be "." or "..".`);
      err.code = 'ALLOWLIST_FAIL';
      throw err;
    }
  }

  verifyContinuity() {
    this.assertNotClosed();
    storageCounters.continuityChecks++;

    // 1. Verify retained descriptor is still valid and directory
    let fdStat;
    try {
      fdStat = fs.fstatSync(this.dirFd);
    } catch (e) {
      const err = new Error(`ALLOWLIST_FAIL: Retained directory descriptor fstat failed: ${e.message}`);
      err.code = 'ALLOWLIST_FAIL';
      throw err;
    }
    if (!fdStat.isDirectory() || fdStat.dev !== this.dev || fdStat.ino !== this.ino) {
      const err = new Error('ALLOWLIST_FAIL: Retained directory descriptor inode or device mismatch.');
      err.code = 'ALLOWLIST_FAIL';
      throw err;
    }

    // 2. Verify canonical path on filesystem still resolves to this exact dev and ino
    let pathStat;
    try {
      pathStat = fs.lstatSync(this.path);
    } catch (e) {
      const err = new Error(`ALLOWLIST_FAIL: Canonical path "${this.path}" cannot be stated: ${e.message}`);
      err.code = 'ALLOWLIST_FAIL';
      throw err;
    }
    if (pathStat.isSymbolicLink()) {
      const err = new Error(`ALLOWLIST_FAIL: Canonical path "${this.path}" was replaced by a symbolic link.`);
      err.code = 'ALLOWLIST_FAIL';
      throw err;
    }
    if (pathStat.dev !== this.dev || pathStat.ino !== this.ino) {
      const err = new Error(`ALLOWLIST_FAIL: Canonical path "${this.path}" no longer resolves to retained directory identity (replaced inode).`);
      err.code = 'ALLOWLIST_FAIL';
      throw err;
    }
  }

  lstatChild(filename) {
    this.assertNotClosed();
    this.validateFilename(filename);
    this.verifyContinuity();
    const childProcPath = `${this.procPath}/${filename}`;
    try {
      return fs.lstatSync(childProcPath);
    } catch (e) {
      if (e.code === 'ENOENT') return null;
      throw e;
    }
  }

  readPrivateRecord(filename, { allowAbsent = false, expectedMode = 0o600 } = {}) {
    this.assertNotClosed();
    this.validateFilename(filename);
    this.verifyContinuity();

    const childProcPath = `${this.procPath}/${filename}`;
    let fd;
    try {
      fd = fs.openSync(childProcPath, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0));
    } catch (e) {
      if (e.code === 'ENOENT') {
        if (allowAbsent) return null;
        const err = new Error(`PREREQUISITE_ABSENT: Private file "${filename}" is absent.`);
        err.code = 'PREREQUISITE_ABSENT';
        throw err;
      }
      if (e.code === 'ELOOP' || e.code === 'ENOTDIR') {
        const err = new Error(`ALLOWLIST_FAIL: Private file "${filename}" is a forbidden symbolic link or nonregular path.`);
        err.code = 'ALLOWLIST_FAIL';
        throw err;
      }
      throw e;
    }

    try {
      const st = fs.fstatSync(fd);
      if (!st.isFile()) {
        const err = new Error(`ALLOWLIST_FAIL: Private file "${filename}" must be a regular file.`);
        err.code = 'ALLOWLIST_FAIL';
        throw err;
      }
      if (process.getuid && st.uid !== process.getuid()) {
        const err = new Error(`ALLOWLIST_FAIL: Private file "${filename}" UID mismatch (${st.uid} != ${process.getuid()}).`);
        err.code = 'ALLOWLIST_FAIL';
        throw err;
      }
      if ((st.mode & 0o777) !== expectedMode) {
        const err = new Error(`ALLOWLIST_FAIL: Insecure private file "${filename}" mode ${(st.mode & 0o777).toString(8)} (must be ${expectedMode.toString(8)}).`);
        err.code = 'ALLOWLIST_FAIL';
        throw err;
      }

      const content = fs.readFileSync(fd, 'utf8');
      storageCounters.reads++;
      return content;
    } finally {
      fs.closeSync(fd);
    }
  }

  writePrivateRecordAtomic(filename, content, { mode = 0o600 } = {}) {
    this.assertNotClosed();
    this.validateFilename(filename);
    this.verifyContinuity();

    const tmpFilename = `${filename}.tmp.${crypto.randomBytes(8).toString('hex')}`;
    const tmpProcPath = `${this.procPath}/${tmpFilename}`;
    const targetProcPath = `${this.procPath}/${filename}`;

    const openFlags = fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | (fs.constants.O_NOFOLLOW || 0);
    let tmpFd;
    try {
      tmpFd = fs.openSync(tmpProcPath, openFlags, mode);
    } catch (e) {
      const err = new Error(`ALLOWLIST_FAIL: Failed to create exclusive temporary file: ${e.message}`);
      err.code = 'ALLOWLIST_FAIL';
      throw err;
    }

    try {
      const st = fs.fstatSync(tmpFd);
      if (!st.isFile()) {
        throw new Error('ALLOWLIST_FAIL: Temporary file must be a regular file.');
      }
      if (process.getuid && st.uid !== process.getuid()) {
        throw new Error('ALLOWLIST_FAIL: Temporary file UID mismatch.');
      }
      if ((st.mode & 0o777) !== mode) {
        throw new Error(`ALLOWLIST_FAIL: Insecure temporary file mode ${(st.mode & 0o777).toString(8)}.`);
      }

      const buf = Buffer.from(content, 'utf8');
      fs.writeSync(tmpFd, buf, 0, buf.length);
      fs.fsyncSync(tmpFd);
      storageCounters.writes++;
    } finally {
      fs.closeSync(tmpFd);
    }

    // Atomic rename within anchored directory
    this.verifyContinuity();
    try {
      fs.renameSync(tmpProcPath, targetProcPath);
      storageCounters.renames++;
    } catch (e) {
      // Clean up tmp file on failure
      try { fs.unlinkSync(tmpProcPath); } catch {}
      throw e;
    }
  }

  unlinkPrivateRecord(filename, { allowAbsent = false } = {}) {
    this.assertNotClosed();
    this.validateFilename(filename);
    this.verifyContinuity();

    const childProcPath = `${this.procPath}/${filename}`;
    let lstat;
    try {
      lstat = fs.lstatSync(childProcPath);
    } catch (e) {
      if (e.code === 'ENOENT') {
        if (allowAbsent) return false;
        const err = new Error(`PREREQUISITE_ABSENT: Cannot unlink absent private file "${filename}".`);
        err.code = 'PREREQUISITE_ABSENT';
        throw err;
      }
      throw e;
    }

    if (lstat.isSymbolicLink()) {
      const err = new Error(`ALLOWLIST_FAIL: Cannot unlink symbolic link "${filename}".`);
      err.code = 'ALLOWLIST_FAIL';
      throw err;
    }

    fs.unlinkSync(childProcPath);
    storageCounters.unlinks++;

    // Verify postcondition ENOENT
    try {
      fs.lstatSync(childProcPath);
      const err = new Error(`CLEANUP_FAILED: Private file "${filename}" still present after unlink.`);
      err.code = 'CLEANUP_FAILED';
      throw err;
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
    }

    return true;
  }

  close() {
    if (!this.closed) {
      try {
        fs.closeSync(this.dirFd);
      } catch {}
      this.closed = true;
    }
  }
}

/**
 * Open an anchored directory descriptor by walking from root with O_NOFOLLOW | O_DIRECTORY.
 */
export function openAnchoredRunDir(runDir) {
  assertAllowlistedRunPath(runDir);
  const resolved = path.resolve(runDir);
  const parts = resolved.split(path.sep).filter(Boolean);

  let curFd = fs.openSync('/', fs.constants.O_RDONLY | fs.constants.O_DIRECTORY | (fs.constants.O_NOFOLLOW || 0));

  try {
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = (i === parts.length - 1);
      const childProcPath = `/proc/self/fd/${curFd}/${part}`;

      let nextFd;
      try {
        nextFd = fs.openSync(childProcPath, fs.constants.O_RDONLY | fs.constants.O_DIRECTORY | (fs.constants.O_NOFOLLOW || 0));
      } catch (err) {
        if (err.code === 'ELOOP' || err.code === 'ENOTDIR') {
          const e = new Error(`ALLOWLIST_FAIL: Ancestor path component "${part}" is a forbidden symbolic link or non-directory.`);
          e.code = 'ALLOWLIST_FAIL';
          throw e;
        }
        if (err.code === 'ENOENT') {
          const e = new Error(`ALLOWLIST_FAIL: Path component "${part}" does not exist.`);
          e.code = 'ALLOWLIST_FAIL';
          throw e;
        }
        throw err;
      }

      let st;
      try {
        st = fs.fstatSync(nextFd);
      } catch (err) {
        fs.closeSync(nextFd);
        throw err;
      }

      if (!st.isDirectory()) {
        fs.closeSync(nextFd);
        const err = new Error(`ALLOWLIST_FAIL: Component "${part}" is not a directory.`);
        err.code = 'ALLOWLIST_FAIL';
        throw err;
      }

      if (isLast) {
        // Final component (runDir): must be owned by process UID and mode 0700
        if (process.getuid && st.uid !== process.getuid()) {
          fs.closeSync(nextFd);
          const err = new Error(`ALLOWLIST_FAIL: Run directory UID mismatch (${st.uid} != ${process.getuid()}).`);
          err.code = 'ALLOWLIST_FAIL';
          throw err;
        }
        if ((st.mode & 0o777) !== 0o700) {
          fs.closeSync(nextFd);
          const err = new Error(`ALLOWLIST_FAIL: Insecure run directory permissions ${(st.mode & 0o777).toString(8)} (must be 0700).`);
          err.code = 'ALLOWLIST_FAIL';
          throw err;
        }
        fs.closeSync(curFd);
        return new AnchoredRunDirectory(nextFd, st.dev, st.ino, resolved);
      } else {
        // Ancestor component: must be owned by root or process UID
        if (process.getuid && st.uid !== 0 && st.uid !== process.getuid()) {
          fs.closeSync(nextFd);
          const err = new Error(`ALLOWLIST_FAIL: Ancestor directory component "${part}" has foreign owner UID ${st.uid}.`);
          err.code = 'ALLOWLIST_FAIL';
          throw err;
        }
        fs.closeSync(curFd);
        curFd = nextFd;
      }
    }
  } catch (err) {
    fs.closeSync(curFd);
    throw err;
  }
}

/**
 * Perform preflight validation of current authority, lock, and provider credentials
 * before any database connection or Prisma CLI launch (M-01).
 */
export function validateRunContextAuthority(ctx, options = {}) {
  storageCounters.preflightChecks++;

  if (!ctx || typeof ctx !== 'object') {
    const err = new Error('TEST_CONTEXT_MISSING: Test context object is required.');
    err.code = 'TEST_CONTEXT_MISSING';
    throw err;
  }

  if (typeof ctx.assertLockHeld !== 'function') {
    const err = new Error('TEST_CONTEXT_INVALID: testContext missing assertLockHeld.');
    err.code = 'TEST_CONTEXT_INVALID';
    throw err;
  }

  // 1. Enforce parent run lock assertion
  ctx.assertLockHeld();

  if (!ctx.runId || typeof ctx.runId !== 'string' || !/^run-[a-f0-9]{8,32}$/i.test(ctx.runId)) {
    const err = new Error('TEST_CONTEXT_INVALID: runId missing or invalid in test context.');
    err.code = 'TEST_CONTEXT_INVALID';
    throw err;
  }

  if (!ctx.runDir || typeof ctx.runDir !== 'string') {
    const err = new Error('TEST_CONTEXT_INVALID: runDir missing or invalid in test context.');
    err.code = 'TEST_CONTEXT_INVALID';
    throw err;
  }

  // 2. Open anchored run directory descriptor
  const anchored = options.anchoredDir || openAnchoredRunDir(ctx.runDir);
  let shouldCloseAnchored = !options.anchoredDir;

  try {
    // 3. Validate authority record (owner.json) under anchored storage
    const ownerContent = anchored.readPrivateRecord('owner.json', { allowAbsent: false, expectedMode: 0o600 });
    let owner;
    try {
      owner = JSON.parse(ownerContent);
    } catch {
      const err = new Error('ALLOWLIST_FAIL: Corrupted or unparseable owner.json.');
      err.code = 'ALLOWLIST_FAIL';
      throw err;
    }

    validateAuthorityRecord(owner, { expectedRunId: ctx.runId });

    if (owner.phase !== 'BOUND' || !owner.bound) {
      const err = new Error(`TEST_CONTEXT_DENIED: Environment is not bound (phase: ${owner.phase || 'unknown'}).`);
      err.code = 'TEST_CONTEXT_DENIED';
      throw err;
    }

    if (owner.pending_operation !== null && owner.pending_operation !== undefined) {
      const err = new Error('RECOVERY_REQUIRED: Authority record contains pending operation.');
      err.code = 'RECOVERY_REQUIRED';
      throw err;
    }

    if (owner.tombstone) {
      const err = new Error('TEST_CONTEXT_DENIED: Authority record indicates destroyed/tombstoned run.');
      err.code = 'TEST_CONTEXT_DENIED';
      throw err;
    }

    // Verify stackId (instance_id) and stackName match authority record exactly
    const expectedInstanceId = owner.instance_id;
    const expectedStackName = owner.stack_name;

    if (ctx.stackId && ctx.stackId !== expectedInstanceId) {
      const err = new Error(`TEST_CONTEXT_MISMATCH: stackId mismatch ("${ctx.stackId}" != "${expectedInstanceId}").`);
      err.code = 'TEST_CONTEXT_MISMATCH';
      throw err;
    }

    if (ctx.stackName && ctx.stackName !== expectedStackName) {
      const err = new Error(`TEST_CONTEXT_MISMATCH: stackName mismatch ("${ctx.stackName}" != "${expectedStackName}").`);
      err.code = 'TEST_CONTEXT_MISMATCH';
      throw err;
    }

    // 4. Validate run lock (.run.lock) under anchored storage
    const lockContent = anchored.readPrivateRecord('.run.lock', { allowAbsent: false, expectedMode: 0o600 });
    let lockData;
    try {
      lockData = JSON.parse(lockContent);
    } catch {
      const err = new Error('TEST_CONTEXT_STALE: Corrupted .run.lock file.');
      err.code = 'TEST_CONTEXT_STALE';
      throw err;
    }

    if (lockData.run_id !== ctx.runId) {
      const err = new Error(`TEST_CONTEXT_MISMATCH: Lock run_id mismatch ("${lockData.run_id}" != "${ctx.runId}").`);
      err.code = 'TEST_CONTEXT_MISMATCH';
      throw err;
    }

    if (ctx._lockToken && lockData.token !== ctx._lockToken) {
      const err = new Error('TEST_CONTEXT_FORBIDDEN: Lock token mismatch. Caller does not own the active lock.');
      err.code = 'TEST_CONTEXT_FORBIDDEN';
      throw err;
    }

    const liveness = checkProcessAlive(lockData.pid, lockData.start_ticks, lockData.boot_id);
    if (liveness !== 'ALIVE') {
      const err = new Error(`TEST_CONTEXT_STALE: Run lock holder PID ${lockData.pid} is not alive (${liveness}).`);
      err.code = 'TEST_CONTEXT_STALE';
      throw err;
    }

    // 5. Validate provider credentials (credentials.json) under anchored storage
    const credContent = anchored.readPrivateRecord('credentials.json', { allowAbsent: false, expectedMode: 0o600 });
    let creds;
    try {
      creds = JSON.parse(credContent);
    } catch {
      const err = new Error('DATA_FAIL: Failed to parse provider credentials JSON.');
      err.code = 'DATA_FAIL';
      throw err;
    }

    if (!creds || typeof creds !== 'object' || !creds.DB_URL) {
      const err = new Error('DATA_FAIL: Missing DB_URL in provider credentials.');
      err.code = 'DATA_FAIL';
      throw err;
    }

    if (ctx.credentials?.databaseUrl && ctx.credentials.databaseUrl !== creds.DB_URL) {
      const err = new Error('TEST_CONTEXT_MISMATCH: Database URL in context does not match credentials.json.');
      err.code = 'TEST_CONTEXT_MISMATCH';
      throw err;
    }

    validateDatabaseUrl(creds.DB_URL, 54322);

    return {
      valid: true,
      anchoredDir: anchored,
      authority: owner,
      lockData,
      providerCredentials: creds,
      stackId: expectedInstanceId,
      stackName: expectedStackName,
    };
  } finally {
    if (shouldCloseAnchored && anchored) {
      anchored.close();
    }
  }
}
