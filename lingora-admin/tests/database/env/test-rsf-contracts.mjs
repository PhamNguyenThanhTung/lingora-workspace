/**
 * RSF-S1 Comprehensive Contract and Acceptance Assertion Suite
 *
 * Implements deterministic, assert-based verification for:
 * - Section L: Strict local lock ownership (acquire/release denial matrix, held reuse, schema validation)
 * - Section P: Process quiescence & observation boundary (typed validation, legacy authority matrix, positive contract disposal)
 * - Section R: Registry response validator & recovery boundary matrix (initial & postcheck invalid variations)
 * - Section T: Real historical retention & pending-stop preservation without mutation
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

import {
  CANONICAL_WORKSPACE_ROOT,
  CANONICAL_CONFIG_PATH,
  CANONICAL_CONFIG_DIGEST,
  TASK_ID,
  PINNED_CLI_VERSION,
  PINNED_CLI_SHA256,
  PINNED_CLI_PATH,
  getGitBranch,
  getLinuxBootId,
  parseProcStat,
  buildStrictLockRecord,
  verifyLockRecord,
  validateProcessSnapshot,
  validateLegacyAuthorityRecord,
  validateAuthorityRecord,
  validateRegistryResponse,
  acquireNamespaceReservation,
  releaseNamespaceReservation,
  pruneRunCache,
  recoverPendingRun,
  snapshotRunProcesses,
} from './env-guard.mjs';

import {
  acquireRunLock,
  releaseRunLock,
} from './stack-manager.mjs';

// =============================================================================
// Section L — Strict local lock ownership
// =============================================================================

test('RSF-L01: buildStrictLockRecord enforces complete schema, caller stat, and valid boot', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rsf-l01-'));
  try {
    // 1. Valid namespace lock record
    const nsRec = buildStrictLockRecord({
      operation: 'namespace-gate',
      resource: tempDir,
    });
    assert.equal(typeof nsRec.token, 'string');
    assert.ok(nsRec.token.length > 0);
    assert.equal(nsRec.pid, process.pid);
    assert.ok(typeof nsRec.start_ticks === 'string' && /^[1-9]\d*$/.test(nsRec.start_ticks));
    assert.ok(typeof nsRec.boot_id === 'string' && nsRec.boot_id.length > 0 && nsRec.boot_id !== 'unknown-boot');
    assert.equal(nsRec.operation, 'namespace-gate');
    assert.equal(nsRec.resource, path.resolve(tempDir));
    assert.equal(nsRec.run_id, undefined);

    // 2. Valid run-scoped lock record
    const runRec = buildStrictLockRecord({
      operation: 'lifecycle',
      resource: tempDir,
      runId: 'run-test1234',
    });
    assert.equal(runRec.operation, 'lifecycle');
    assert.equal(runRec.run_id, 'run-test1234');
    assert.equal(runRec.resource, path.resolve(tempDir));

    // 3. Negative checks: missing run_id on run-scoped lock denies
    assert.throws(
      () => buildStrictLockRecord({ operation: 'lifecycle', resource: tempDir }),
      /LOCK_SCHEMA_FAIL: Exact run_id is required/
    );
    assert.throws(
      () => buildStrictLockRecord({ operation: 'prune', resource: tempDir }),
      /LOCK_SCHEMA_FAIL: Exact run_id is required/
    );
    assert.throws(
      () => buildStrictLockRecord({ operation: 'recovery', resource: tempDir }),
      /LOCK_SCHEMA_FAIL: Exact run_id is required/
    );

    // 4. Invalid operation denies
    assert.throws(
      () => buildStrictLockRecord({ operation: 'unsupported', resource: tempDir }),
      /LOCK_SCHEMA_FAIL: Invalid lock operation/
    );

    // 5. Relative or missing resource denies
    assert.throws(
      () => buildStrictLockRecord({ operation: 'namespace-gate', resource: 'relative/path' }),
      /LOCK_SCHEMA_FAIL: Absolute canonical resource path is required/
    );
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('RSF-L02: Lock release strictly denies malformed, missing identity, foreign PID, and mismatched run/resource', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rsf-l02-'));
  try {
    const runDir = path.resolve(tempDir, 'run-test001');
    fs.mkdirSync(runDir, { recursive: true, mode: 0o700 });
    const lockFile = path.resolve(runDir, '.run.lock');

    // Baseline genuine lock
    const genuineRecord = buildStrictLockRecord({
      operation: 'lifecycle',
      resource: runDir,
      runId: 'run-test001',
    });
    fs.writeFileSync(lockFile, JSON.stringify(genuineRecord, null, 2), { mode: 0o600 });

    // 1. Missing / deleted start_ticks denies release
    const noTicks = { ...genuineRecord };
    delete noTicks.start_ticks;
    fs.writeFileSync(lockFile, JSON.stringify(noTicks, null, 2), { mode: 0o600 });
    assert.throws(
      () => releaseRunLock(runDir, genuineRecord.token),
      /LOCK_RELEASE_FAIL.*start_ticks/
    );
    assert.equal(fs.existsSync(lockFile), true, 'Lock file must remain on disk');

    // 2. Zero start_ticks denies release
    const zeroTicks = { ...genuineRecord, start_ticks: '0' };
    fs.writeFileSync(lockFile, JSON.stringify(zeroTicks, null, 2), { mode: 0o600 });
    assert.throws(
      () => releaseRunLock(runDir, genuineRecord.token),
      /LOCK_RELEASE_FAIL.*start_ticks/
    );
    assert.equal(fs.existsSync(lockFile), true, 'Lock file must remain on disk');

    // 3. Missing / deleted boot_id denies release
    const noBoot = { ...genuineRecord };
    delete noBoot.boot_id;
    fs.writeFileSync(lockFile, JSON.stringify(noBoot, null, 2), { mode: 0o600 });
    assert.throws(
      () => releaseRunLock(runDir, genuineRecord.token),
      /LOCK_RELEASE_FAIL.*boot_id/
    );
    assert.equal(fs.existsSync(lockFile), true, 'Lock file must remain on disk');

    // 4. Invalid boot_id denies release
    const badBoot = { ...genuineRecord, boot_id: 'invalid-boot-uuid' };
    fs.writeFileSync(lockFile, JSON.stringify(badBoot, null, 2), { mode: 0o600 });
    assert.throws(
      () => releaseRunLock(runDir, genuineRecord.token),
      /LOCK_RELEASE_FAIL.*boot_id/
    );
    assert.equal(fs.existsSync(lockFile), true, 'Lock file must remain on disk');

    // 5. Foreign PID denies release
    const foreignPid = { ...genuineRecord, pid: process.pid + 100000 };
    fs.writeFileSync(lockFile, JSON.stringify(foreignPid, null, 2), { mode: 0o600 });
    assert.throws(
      () => releaseRunLock(runDir, genuineRecord.token),
      /LOCK_RELEASE_FAIL.*foreign PID/
    );
    assert.equal(fs.existsSync(lockFile), true, 'Lock file must remain on disk');

    // 6. Mismatched run_id in record denies release
    const wrongRunId = { ...genuineRecord, run_id: 'run-other999' };
    fs.writeFileSync(lockFile, JSON.stringify(wrongRunId, null, 2), { mode: 0o600 });
    assert.throws(
      () => releaseRunLock(runDir, genuineRecord.token),
      /LOCK_RELEASE_FAIL.*run_id mismatch/
    );
    assert.equal(fs.existsSync(lockFile), true, 'Lock file must remain on disk');

    // 7. Mismatched resource path denies release
    const wrongResource = { ...genuineRecord, resource: '/tmp/other/resource' };
    fs.writeFileSync(lockFile, JSON.stringify(wrongResource, null, 2), { mode: 0o600 });
    assert.throws(
      () => releaseRunLock(runDir, genuineRecord.token),
      /LOCK_RELEASE_FAIL.*Resource mismatch/
    );
    assert.equal(fs.existsSync(lockFile), true, 'Lock file must remain on disk');

    // 8. Genuine record releases cleanly
    fs.writeFileSync(lockFile, JSON.stringify(genuineRecord, null, 2), { mode: 0o600 });
    releaseRunLock(runDir, genuineRecord.token);
    assert.equal(fs.existsSync(lockFile), false, 'Genuine owner successfully unlinks lock file');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('RSF-L03: Held namespace reservation reuse strictly validates boot_id, caller stat, and resource', () => {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rsf-l03-'));
  try {
    const runDir = path.resolve(tempRunsDir, 'run-acquire-test');
    fs.mkdirSync(runDir, { recursive: true, mode: 0o700 });
    const nsLockFile = path.resolve(tempRunsDir, '.namespace.lock');

    const validNsRec = buildStrictLockRecord({
      operation: 'namespace-gate',
      resource: tempRunsDir,
    });
    fs.writeFileSync(nsLockFile, JSON.stringify(validNsRec, null, 2), { mode: 0o600 });

    // 1. Invalid boot_id in held namespace denies acquire with LOCKED
    const invalidBootNs = { ...validNsRec, boot_id: 'invalid-boot' };
    fs.writeFileSync(nsLockFile, JSON.stringify(invalidBootNs, null, 2), { mode: 0o600 });
    assert.throws(
      () => acquireRunLock(runDir, 'run-acquire-test', { runsDir: tempRunsDir, heldNamespaceToken: validNsRec.token }),
      /LOCKED.*boot_id/
    );

    // 2. Foreign PID in held namespace denies acquire with LOCKED
    const foreignPidNs = { ...validNsRec, pid: process.pid + 50000 };
    fs.writeFileSync(nsLockFile, JSON.stringify(foreignPidNs, null, 2), { mode: 0o600 });
    assert.throws(
      () => acquireRunLock(runDir, 'run-acquire-test', { runsDir: tempRunsDir, heldNamespaceToken: validNsRec.token }),
      /LOCKED.*foreign PID/
    );

    // 3. Mismatched resource in held namespace denies acquire with LOCKED
    const wrongResNs = { ...validNsRec, resource: '/tmp/wrong-namespace' };
    fs.writeFileSync(nsLockFile, JSON.stringify(wrongResNs, null, 2), { mode: 0o600 });
    assert.throws(
      () => acquireRunLock(runDir, 'run-acquire-test', { runsDir: tempRunsDir, heldNamespaceToken: validNsRec.token }),
      /LOCKED.*Resource mismatch/
    );

    // 4. Genuine held namespace permits acquisition
    fs.writeFileSync(nsLockFile, JSON.stringify(validNsRec, null, 2), { mode: 0o600 });
    const acquired = acquireRunLock(runDir, 'run-acquire-test', { runsDir: tempRunsDir, heldNamespaceToken: validNsRec.token });
    assert.equal(fs.existsSync(acquired.lockFile), true);
    assert.equal(fs.existsSync(nsLockFile), true, 'Held namespace gate was asserted by caller, so caller owns its release');

    releaseRunLock(runDir, acquired.token);
    releaseNamespaceReservation(tempRunsDir, validNsRec.token);
    assert.equal(fs.existsSync(nsLockFile), false);
  } finally {
    fs.rmSync(tempRunsDir, { recursive: true, force: true });
  }
});

// =============================================================================
// Section P — Process quiescence & observation boundary
// =============================================================================

test('RSF-P01: validateProcessSnapshot rejects malformed, non-array, and invalid process items', () => {
  assert.throws(() => validateProcessSnapshot(null), /OBSERVATION_INVALID/);
  assert.throws(() => validateProcessSnapshot('not-an-object'), /OBSERVATION_INVALID/);
  assert.throws(() => validateProcessSnapshot([]), /OBSERVATION_INVALID/);
  assert.throws(() => validateProcessSnapshot({ status: 'INVALID_STATUS' }), /OBSERVATION_INVALID/);
  assert.throws(() => validateProcessSnapshot({ status: 'KNOWN' }), /OBSERVATION_INVALID/);
  assert.throws(() => validateProcessSnapshot({ status: 'KNOWN', processes: 'not-an-array' }), /OBSERVATION_INVALID/);
  assert.throws(() => validateProcessSnapshot({ status: 'KNOWN', processes: [null] }), /OBSERVATION_INVALID/);
  assert.throws(() => validateProcessSnapshot({ status: 'KNOWN', processes: [{ pid: -1 }] }), /OBSERVATION_INVALID/);
  assert.throws(() => validateProcessSnapshot({ status: 'KNOWN', processes: [{ pid: 'not-a-number' }] }), /OBSERVATION_INVALID/);

  // Valid shapes
  const unknownSnap = validateProcessSnapshot({ status: 'UNKNOWN' });
  assert.equal(unknownSnap.status, 'UNKNOWN');

  const knownEmptySnap = validateProcessSnapshot({ status: 'KNOWN', processes: [] });
  assert.equal(knownEmptySnap.status, 'KNOWN');
  assert.equal(knownEmptySnap.processes.length, 0);

  const knownValidSnap = validateProcessSnapshot({ status: 'KNOWN', processes: [{ pid: 12345, start_ticks: '12345', boot_id: getLinuxBootId().boot_id }] });
  assert.equal(knownValidSnap.processes.length, 1);
});

test('RSF-P02: Minimal legacy prune-only validator validates both real retained legacy roots read-only', () => {
  const legacyRoot1 = path.resolve(CANONICAL_WORKSPACE_ROOT, '.wp00-runs/run-1fab09c87d538b05');
  const legacyRoot2 = path.resolve(CANONICAL_WORKSPACE_ROOT, '.wp00-runs/run-70c765fff1ad8203');

  const owner1 = path.resolve(legacyRoot1, 'owner.json');
  const owner2 = path.resolve(legacyRoot2, 'owner.json');

  assert.equal(fs.existsSync(owner1), true, 'Historical retained root 1 owner.json must exist');
  assert.equal(fs.existsSync(owner2), true, 'Historical retained root 2 owner.json must exist');

  // 1. Read-only validation passes legacy validator for BOTH exact roots
  const parsed1 = validateLegacyAuthorityRecord(owner1, legacyRoot1);
  assert.equal(parsed1.run_id, 'run-1fab09c87d538b05');
  assert.equal(parsed1.instance_id, '3d170f05e6057d556065f6bea08e89af7cc96c543086625a8f58950c34e4cf4d');
  assert.equal(parsed1.project_root, CANONICAL_WORKSPACE_ROOT);
  assert.equal(parsed1.workdir, CANONICAL_WORKSPACE_ROOT);
  assert.equal(parsed1.pending_operation, null);

  const parsed2 = validateLegacyAuthorityRecord(owner2, legacyRoot2);
  assert.equal(parsed2.run_id, 'run-70c765fff1ad8203');
  assert.equal(parsed2.instance_id, '13feaaa8cffb41cd9100bddb34f88ec6a57eba7a36844f6337607a9ce4d8dac8');
  assert.equal(parsed2.project_root, path.resolve(legacyRoot2, 'fixture'));
  assert.equal(parsed2.workdir, path.resolve(legacyRoot2, 'fixture'));
  assert.equal(parsed2.pending_operation, null);

  // 2. Normal lifecycle authority validator (validateAuthorityRecord) MUST continue rejecting legacy roots
  assert.throws(
    () => validateAuthorityRecord(owner1, { runsDir: path.dirname(legacyRoot1), expectedRunId: 'run-1fab09c87d538b05' }),
    /ALLOWLIST_FAIL/
  );
  assert.throws(
    () => validateAuthorityRecord(owner2, { runsDir: path.dirname(legacyRoot2), expectedRunId: 'run-70c765fff1ad8203' }),
    /ALLOWLIST_FAIL/
  );
});

test('RSF-P03: Legacy validator rejects malformed records read through the real canonical path', () => {
  const dir=path.join(CANONICAL_WORKSPACE_ROOT,'.wp00-runs/run-70c765fff1ad8203');
  const owner=path.join(dir,'owner.json');const read=fs.readFileSync;
  const actual=JSON.parse(read(owner,'utf8'));
  for(const patch of [r=>delete r.pending_operation,r=>r.pending_operation='stop',r=>r.run_id='other',r=>r.branch_ref='other',r=>r.cli_digest='bad',r=>r.project_root=CANONICAL_WORKSPACE_ROOT,r=>r.instance_id='a'.repeat(64),r=>r.config_digest='bad',r=>r.phase='BOUND']) {
    const record=structuredClone(actual);patch(record);
    fs.readFileSync=function(p,...args){return p===owner?JSON.stringify(record):read.call(this,p,...args);};
    try{assert.throws(()=>validateLegacyAuthorityRecord(owner,dir),/PRUNE_FAIL/);}finally{fs.readFileSync=read;}
  }
  assert.throws(()=>validateLegacyAuthorityRecord(owner,path.join(os.tmpdir(),path.basename(dir))),/PRUNE_FAIL.*canonical root/);
  assert.throws(()=>validateLegacyAuthorityRecord(CANONICAL_CONFIG_PATH,dir),/PRUNE_FAIL.*owner path/);
});

// =============================================================================
// Section R — Registry/recovery matrix
// =============================================================================

test('RSF-R01: validateRegistryResponse matrix covers malformed, missing, invalid enum, and contradictory identity', () => {
  const validEntry = {
    id: crypto.randomBytes(32).toString('hex'),
    name: 'lingora-test-stack',
    project_root: '/home/tung/workspace/school/project1/lingora-workspace',
    branch_context: 'refs/heads/main',
    runtime: 'native',
    owner: 'reachable',
  };

  // 1. Valid pinned CLI response without state/status
  const validRes = validateRegistryResponse({ stacks: [validEntry] });
  assert.equal(validRes.stacks.length, 1);
  assert.equal(validRes.stacks[0].id, validEntry.id);

  // 2. Valid response with optional recognized state/status
  const withState = validateRegistryResponse({
    stacks: [{ ...validEntry, state: 'running', status: 'healthy' }],
  });
  assert.equal(withState.stacks[0].state, 'running');

  // 3. Malformed JSON / top-level non-object
  assert.throws(() => validateRegistryResponse(null), /REGISTRY_VALIDATION_FAIL/);
  assert.throws(() => validateRegistryResponse([]), /REGISTRY_VALIDATION_FAIL/);
  assert.throws(() => validateRegistryResponse({}), /REGISTRY_VALIDATION_FAIL.*Response missing required 'stacks' array/);

  // 4. Missing required fields
  for (const field of ['id', 'name', 'project_root', 'branch_context', 'runtime', 'owner']) {
    const incomplete = { ...validEntry };
    delete incomplete[field];
    assert.throws(
      () => validateRegistryResponse({ stacks: [incomplete] }),
      new RegExp(`REGISTRY_VALIDATION_FAIL.*missing required field '${field}'`)
    );
  }

  // 5. Invalid ID (non-64 hex or uppercase)
  assert.throws(
    () => validateRegistryResponse({ stacks: [{ ...validEntry, id: 'bad-short-id' }] }),
    /REGISTRY_VALIDATION_FAIL.*must be 64-character lowercase hex/
  );

  // 6. Non-absolute or empty project_root
  assert.throws(
    () => validateRegistryResponse({ stacks: [{ ...validEntry, project_root: 'relative/path' }] }),
    /REGISTRY_VALIDATION_FAIL.*must be non-empty absolute path/
  );

  // 7. Unsupported state / status enum ('BORKED', 'EXPLODED')
  assert.throws(
    () => validateRegistryResponse({ stacks: [{ ...validEntry, state: 'BORKED' }] }),
    /REGISTRY_VALIDATION_FAIL.*unsupported state 'BORKED'/
  );
  assert.throws(
    () => validateRegistryResponse({ stacks: [{ ...validEntry, status: 'EXPLODED' }] }),
    /REGISTRY_VALIDATION_FAIL.*unsupported status 'EXPLODED'/
  );

  // 8. Duplicate stack ID
  assert.throws(
    () => validateRegistryResponse({ stacks: [validEntry, validEntry] }),
    /REGISTRY_VALIDATION_FAIL.*Duplicate stack id/
  );

  // 9. Contradictory ownership: same name and project_root under different IDs
  const secondEntrySameName = {
    ...validEntry,
    id: crypto.randomBytes(32).toString('hex'),
  };
  assert.throws(
    () => validateRegistryResponse({ stacks: [validEntry, secondEntrySameName] }),
    /REGISTRY_VALIDATION_FAIL.*Conflicting stacks with same name and project_root/
  );
});

test('RSF-R02: Pending stop real resource run-af1371dc4e4b01d7 remains untouched BLOCKED', () => {
  const pendingStopRunDir = path.resolve(CANONICAL_WORKSPACE_ROOT, '.wp00-runs/pkg-g0-minimal/run-af1371dc4e4b01d7');
  assert.equal(fs.existsSync(pendingStopRunDir),true,'Protected pending-stop run must remain present');
  {
    const ownerFile = path.resolve(pendingStopRunDir, 'owner.json');
    assert.equal(fs.existsSync(ownerFile), true, 'Pending stop authority record must exist');
    const beforeOwner = fs.readFileSync(ownerFile, 'utf8');
    const owner = JSON.parse(beforeOwner);

    // Verify read-only state
    assert.equal(owner.run_id, 'run-af1371dc4e4b01d7');
    assert.equal(owner.phase, 'BOUND');
    assert.equal(owner.pending_operation, 'stop');
    assert.equal(owner.tombstone, false);

    // Attempting recovery on this run must be rejected without mutating state
    assert.throws(
      () =>
        recoverPendingRun(pendingStopRunDir, {
          expectedRunId: 'run-af1371dc4e4b01d7',
          authorizedPendingRuns: new Set(['run-af1371dc4e4b01d7']),
        }),
      /RECOVER_FAIL: Pending recovery expects phase RESERVED, found "BOUND"/
    );

    // Verify record remains untouched
    assert.equal(fs.readFileSync(ownerFile,'utf8'),beforeOwner,'Full authority bytes remain unchanged');
    const afterOwner = JSON.parse(beforeOwner);
    assert.equal(afterOwner.phase, 'BOUND');
    assert.equal(afterOwner.pending_operation, 'stop');
  }
});
