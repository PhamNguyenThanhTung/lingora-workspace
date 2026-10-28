/**
 * Environment Allowlist, Identity Binding, and Security Guard for Lingora Database Runtime Harness.
 *
 * Implements WP-00/G0 D1 + D2 (Corrected for Codex Review Round 1):
 * - Strict required current-format authority (format_version: '1.0', task_id: 'wp00-g0-d1-d2').
 * - Trusted expected context independent of record: exact expected run/path/tuple/policy/version/digest.
 * - Mode 0600 on authority records/credentials, mode 0700 on run directories, UID matching runner.
 * - Allowlisted private namespace (.wp00-runs/); no legacy adoption, no temp/workspace escape defaults.
 * - Config-only Git fixture validation (config digest matching canonical).
 * - Strict full JSON parsing without brace extraction or string forwarding.
 * - Typed Linux /proc process and socket observation: verified quiescence before stop/destroy.
 * - Finite diagnostic projections only (strictly defined enums and static messages; never raw provider/error strings).
 * - Complete secret sanitization across all output paths.
 */

import { URL, fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const CANONICAL_WORKSPACE_ROOT = path.resolve(__dirname, '../../../../');
export const CANONICAL_CONFIG_PATH = path.resolve(CANONICAL_WORKSPACE_ROOT, 'supabase/config.toml');
export const CANONICAL_CONFIG_DIGEST = 'a9067406c77c9e0b4a43f6e96cbb5d19f2b9e85dc1c3f461ee7a7cec3de190e9';

export const TASK_ID = 'wp00-g0-d1-d2';
export const DEFAULT_RUNS_DIR = path.resolve(CANONICAL_WORKSPACE_ROOT, '.wp00-runs/pkg-g0-minimal');

// Legacy and prior run roots that must never be adopted or mutated
export const FORBIDDEN_UNOWNED_STATE_ROOT = path.resolve(CANONICAL_WORKSPACE_ROOT, '.local-stack');
export const FORBIDDEN_UNOWNED_HOME_ROOT = path.resolve(CANONICAL_WORKSPACE_ROOT, '.supabase-home');
export const FORBIDDEN_OLD_WP00_STATE = path.resolve(CANONICAL_WORKSPACE_ROOT, '.wp00-state');
export const FORBIDDEN_OLD_WP00_HOME = path.resolve(CANONICAL_WORKSPACE_ROOT, '.wp00-home');
export const FORBIDDEN_OLDER_RUN_ROOTS = [
  path.resolve(CANONICAL_WORKSPACE_ROOT, '.wp00-runs/run-1fab09c87d538b05'),
  path.resolve(CANONICAL_WORKSPACE_ROOT, '.wp00-runs/run-70c765fff1ad8203'),
];

export const EXACT_AUTHORIZED_LEGACY_PRUNE_PATHS = new Set([
  path.resolve(CANONICAL_WORKSPACE_ROOT, '.wp00-runs/run-1fab09c87d538b05'),
  path.resolve(CANONICAL_WORKSPACE_ROOT, '.wp00-runs/run-70c765fff1ad8203'),
]);

export const KNOWN_LEGACY_RUN_INSTANCES = {
  'run-1fab09c87d538b05': '3d170f05e6057d556065f6bea08e89af7cc96c543086625a8f58950c34e4cf4d',
  'run-70c765fff1ad8203': '13feaaa8cffb41cd9100bddb34f88ec6a57eba7a36844f6337607a9ce4d8dac8',
};

export const AUTHORIZED_LEGACY_PRUNE_ROOTS = new Set([
  'run-1fab09c87d538b05',
  'run-70c765fff1ad8203',
]);

// Compatibility aliases
export const TASK_STATE_ROOT = path.resolve(CANONICAL_WORKSPACE_ROOT, '.wp00-state');
export const TASK_HOME_ROOT = path.resolve(CANONICAL_WORKSPACE_ROOT, '.wp00-home');
export const TASK_BINDING_FILE = path.resolve(TASK_STATE_ROOT, 'runtime-binding.json');
export const CANONICAL_STATE_ROOT = TASK_STATE_ROOT;
export const CANONICAL_STATE_FILE = path.resolve(TASK_STATE_ROOT, 'runtime-state.json');
export const CANONICAL_RAW_STATE_FILE = path.resolve(TASK_STATE_ROOT, 'runtime-raw.local.json');

export const ALLOWED_HOSTS = new Set(['127.0.0.1', 'localhost']);
export const ALLOWED_PROJECT_ID = 'lingora-local-dev';
export const EXPECTED_PORTS = {
  database: 54322,
  api: 54321,
  mail: 54324,
  studio: 54323,
};

export const PINNED_CLI_VERSION = '2.121.0';
export const PINNED_CLI_SHA256 = 'e91fc61f09c4fbb9c65dadc37d415640cb6d2398e65eba6d384eec74b2dbbe10';
export const PINNED_CLI_PATH = path.resolve(
  CANONICAL_WORKSPACE_ROOT,
  'node_modules/@supabase/cli-linux-x64/bin/supabase'
);

export const MINIMUM_AVAILABLE_DISK_BYTES = 8 * 1024 * 1024 * 1024; // 8 GiB (8,589,934,592 bytes)

export const AUTHORIZED_PENDING_RECOVERY_RUNS = new Set([
  'run-75e7f7eeb707ef51',
  'run-77931baeef6362d1',
  'run-823006cc1b9e0057',
  'run-a0a95601256fd486',
]);

export const KNOWN_PENDING_RUN_INSTANCES = {
  'run-75e7f7eeb707ef51': '553abceb6946b9b2d212fb3614023a82903ac97c413811558c102b2315523039',
  'run-77931baeef6362d1': '1d07e4ceccd5f7ce81fc845ddb323a1ebd728fcf9eb99db42181af7bf5565f2d',
  'run-823006cc1b9e0057': 'e8d71734b91d3c4b58bb400900cbcb44bdf3ca021f59f11299ee5999d9aa92a8',
  'run-a0a95601256fd486': 'd9f4159eb90aac7cf286b9ae1af7abc322ebfb93e06f93c9890ac2b7413dc5b1',
};

/**
 * Canary secret registry for private test injections.
 */
const registeredCanaries = new Set();

export function registerRedactionCanary(canary) {
  if (typeof canary === 'string' && canary.trim().length > 0) {
    registeredCanaries.add(canary);
  }
}

export function clearRedactionCanaries() {
  registeredCanaries.clear();
}

export function isCanaryRegistered(canary) {
  return registeredCanaries.has(canary);
}

/**
 * Verify that targetPath is safely contained within parentDir without symlink escape.
 */
export function isSafeChildPath(parentDir, targetPath) {
  if (!parentDir || !targetPath) return false;
  const normParent = path.resolve(parentDir);
  const normTarget = path.resolve(targetPath);
  const rel = path.relative(normParent, normTarget);
  if (rel.startsWith('..') || path.isAbsolute(rel)) return false;
  if (!fs.existsSync(normParent) || !fs.existsSync(normTarget)) return false;
  try {
    if (fs.lstatSync(normTarget).isSymbolicLink()) return false;
    const realParent = fs.realpathSync(normParent);
    const realTarget = fs.realpathSync(normTarget);
    if (normTarget !== normParent && realTarget !== normTarget) {
      return false;
    }
    const realRel = path.relative(realParent, realTarget);
    return realRel === '' || (!realRel.startsWith('..') && !path.isAbsolute(realRel));
  } catch {
    return false;
  }
}

/**
 * Compute SHA-256 hex digest of a file or string.
 */
export function computeSha256(contentOrPath) {
  const hash = crypto.createHash('sha256');
  if (typeof contentOrPath === 'string' && fs.existsSync(contentOrPath) && !contentOrPath.includes('\n')) {
    hash.update(fs.readFileSync(contentOrPath));
  } else {
    hash.update(contentOrPath);
  }
  return hash.digest('hex');
}

/**
 * Redact sensitive fields and registered canaries from any string.
 * Defense-in-depth regex layer; never used as an authorization bypass.
 */
export function sanitizeString(text) {
  if (typeof text !== 'string') return text;
  let result = text
    .replace(/(postgres(?:ql)?:\/\/[^:]+:)([^@]+)(@)/gi, '$1[REDACTED_PASSWORD]$3')
    .replace(/(sb_secret_[A-Za-z0-9_-]+)/g, '[REDACTED_SECRET_KEY]')
    .replace(/(sb_publishable_[A-Za-z0-9_-]+)/g, '[REDACTED_PUBLISHABLE_KEY]')
    .replace(/(eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})/g, '[REDACTED_JWT]')
    .replace(/(#access_token=[A-Za-z0-9_.-]+)/g, '#access_token=[REDACTED_TOKEN]')
    .replace(/(invite_token=[A-Za-z0-9_.-]+)/g, 'invite_token=[REDACTED_TOKEN]')
    .replace(/(confirmation_token=[A-Za-z0-9_.-]+)/g, 'confirmation_token=[REDACTED_TOKEN]')
    .replace(/((?:otp|token|code)=["']?)[A-Za-z0-9_.-]+(["']?)/gi, '$1[REDACTED_OTP]$2')
    .replace(
      /(["']?(?:s3_protocol_access_key_secret|aws_secret_access_key|secret_key|secret|password|jwt_secret|anon_key|service_role_key|apikey)["']?\s*[:=]\s*)["']?[^"'\s,}]+["']?/gi,
      '$1"[REDACTED]"'
    );

  for (const canary of registeredCanaries) {
    if (result.includes(canary)) {
      result = result.split(canary).join('[REDACTED_CANARY]');
    }
  }

  return result;
}

/**
 * Recursively redact sensitive fields and registered canaries from any object.
 */
export function sanitizeObject(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return sanitizeString(obj);
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes('password') ||
      lowerKey.includes('secret') ||
      lowerKey.includes('token') ||
      lowerKey.includes('jwt') ||
      lowerKey.includes('otp') ||
      lowerKey.includes('key') ||
      lowerKey.includes('credential') ||
      lowerKey.includes('authorization') ||
      lowerKey.includes('auth_token') ||
      lowerKey.includes('auth_secret') ||
      lowerKey === 'anon_key' ||
      lowerKey === 'service_role_key' ||
      lowerKey === 'secret_key' ||
      lowerKey === 'publishable_key' ||
      lowerKey === 's3_protocol_access_key_secret' ||
      lowerKey === 'aws_secret_access_key'
    ) {
      result[key] = '[REDACTED]';
    } else {
      result[key] = sanitizeObject(value);
    }
  }
  return result;
}

/**
 * Strict finite enums for diagnostic projection.
 * Prevents arbitrary provider strings, parser snippets, or secret canaries from leaking.
 */
const ALLOWED_COMMANDS = new Set(['start', 'status', 'stop', 'destroy', 'data', 'recover', 'prune']);
const ALLOWED_STAGES = new Set(['init', 'lock', 'reconcile', 'effect', 'postcheck', 'cleanup', 'error', 'completed']);
const ALLOWED_STATUSES = new Set(['RESERVED', 'RUNNING', 'STOPPED', 'DESTROYED', 'FAILED', 'READY', 'NOT EXECUTED', 'RECOVERY_REQUIRED']);
const ALLOWED_CODES = new Set([
  'SUCCESS',
  'TOMBSTONE',
  'ALREADY_DESTROYED',
  'ALLOWLIST_FAIL',
  'COMMAND_INVALID',
  'LOCKED',
  'RECONCILE_FAIL',
  'PREPARE_FAIL',
  'START_FAIL',
  'STATUS_FAIL',
  'STOP_FAIL',
  'DESTROY_FAIL',
  'POSTCHECK_FAIL',
  'DATA_FAIL',
  'CLEANUP_INCOMPLETE',
  'RECOVERY_REQUIRED',
  'DISK_SPACE_FAIL',
  'PENDING_GUARD_FAIL',
  'PRUNE_FAIL',
  'RECOVER_FAIL',
  'REGISTRY_VALIDATION_FAIL',
  'RECOVER_POSTCHECK_FAIL',
  'PROCESS_INSPECT_FAIL',
  'LOCK_RELEASE_FAIL',
  'RECOVERED',
  'PRUNED',
  'UNKNOWN_ERROR',
]);

const STATIC_SAFE_MESSAGES = {
  SUCCESS: 'Operation completed successfully.',
  TOMBSTONE: 'Tombstone record verified.',
  ALREADY_DESTROYED: 'Stack is already destroyed.',
  ALLOWLIST_FAIL: 'Authority or environment allowlist check failed.',
  COMMAND_INVALID: 'Command arguments or run context invalid.',
  LOCKED: 'Operation denied: run lock is held by another process.',
  RECONCILE_FAIL: 'Registry or incarnation reconciliation failed.',
  PREPARE_FAIL: 'Stack preparation failed.',
  START_FAIL: 'Stack start operation failed.',
  STATUS_FAIL: 'Stack status check failed.',
  STOP_FAIL: 'Stack stop operation failed.',
  DESTROY_FAIL: 'Stack destroy operation failed.',
  POSTCHECK_FAIL: 'Postcondition verification failed.',
  DATA_FAIL: 'Guarded data probe failed.',
  CLEANUP_INCOMPLETE: 'Cleanup incomplete: state preserved for recovery.',
  RECOVERY_REQUIRED: 'Operation outcome uncertain: recovery required.',
  DISK_SPACE_FAIL: 'Insufficient available disk space (minimum 8 GiB required).',
  PENDING_GUARD_FAIL: 'Pending operations or unresolved recovery present in namespace.',
  PRUNE_FAIL: 'Failed to prune cache.',
  RECOVER_FAIL: 'Failed to recover pending stack.',
  REGISTRY_VALIDATION_FAIL: 'Provider registry response validation failed.',
  RECOVER_POSTCHECK_FAIL: 'Post-destroy provider recovery verification failed.',
  PROCESS_INSPECT_FAIL: 'Cannot verify process quiescence: unobservable process detected.',
  LOCK_RELEASE_FAIL: 'Lock release denied: caller identity mismatch or lock unverified.',
  RECOVERED: 'Pending stack successfully recovered and destroyed.',
  PRUNED: 'Run cache successfully pruned.',
  UNKNOWN_ERROR: 'Internal error occurred during execution.',
};

/**
 * Finite projection of diagnostic output (never raw provider streams).
 */
export function projectFiniteOutput(record) {
  if (!record || typeof record !== 'object') return {};

  const command = ALLOWED_COMMANDS.has(record.command) ? record.command : null;
  const stage = ALLOWED_STAGES.has(record.stage) ? record.stage : 'error';
  const status = ALLOWED_STATUSES.has(record.status) ? record.status : 'FAILED';
  const code = ALLOWED_CODES.has(record.code) ? record.code : 'UNKNOWN_ERROR';

  const runId =
    typeof record.run_id === 'string' && /^run-[a-f0-9]{8,32}$/i.test(record.run_id)
      ? record.run_id
      : typeof record.runId === 'string' && /^run-[a-f0-9]{8,32}$/i.test(record.runId)
      ? record.runId
      : null;

  const instanceId =
    typeof record.instance_id === 'string' && /^[a-f0-9]{64}$/i.test(record.instance_id)
      ? record.instance_id
      : typeof record.stackId === 'string' && /^[a-f0-9]{64}$/i.test(record.stackId)
      ? record.stackId
      : null;

  const phase = ['RESERVED', 'BOUND', 'DESTROYED'].includes(record.phase) ? record.phase : null;
  const exitCode = record.exit_code === 0 ? 0 : 1;
  const count = typeof record.count === 'number' && Number.isInteger(record.count) ? record.count : null;
  const retryDisposition =
    typeof record.retry_disposition === 'string' &&
    ['none', 'recovery-required', 'safe-retry'].includes(record.retry_disposition)
      ? record.retry_disposition
      : null;

  // Strict: message comes strictly from static template table; NEVER forwards arbitrary exception text
  const message = STATIC_SAFE_MESSAGES[code] || STATIC_SAFE_MESSAGES.UNKNOWN_ERROR;

  return {
    command,
    stage,
    status,
    code,
    run_id: runId,
    instance_id: instanceId,
    phase,
    exit_code: exitCode,
    count,
    retry_disposition: retryDisposition,
    message,
  };
}

/**
 * Parse strict JSON stdout without regex substring extraction.
 * Rejects extra text, incomplete payloads, or malformed syntax.
 */
export function parseStrictJson(stdout, contextName) {
  if (typeof stdout !== 'string') {
    throw new Error(`CLI_OUTPUT_ERROR: Output returned by ${contextName} is not a string.`);
  }
  const trimmed = stdout.trim();
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
    throw new Error(`CLI_OUTPUT_ERROR: Output returned by ${contextName} does not start and end with JSON object braces.`);
  }
  try {
    const parsed = JSON.parse(trimmed);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error(`CLI_OUTPUT_ERROR: Output returned by ${contextName} is not a valid JSON object.`);
    }
    return parsed;
  } catch (err) {
    if (err.message.startsWith('CLI_OUTPUT_ERROR:')) throw err;
    throw new Error(`CLI_OUTPUT_ERROR: Syntax error parsing strict JSON from ${contextName}.`);
  }
}

/**
 * Get current Git branch safely without shell expansion.
 */
export function getGitBranch(workspaceRoot = CANONICAL_WORKSPACE_ROOT) {
  const headPath = path.resolve(workspaceRoot, '.git/HEAD');
  if (fs.existsSync(headPath)) {
    const headContent = fs.readFileSync(headPath, 'utf8').trim();
    if (headContent.startsWith('ref: ')) {
      return headContent.substring(5).trim();
    }
    return headContent;
  }
  return 'main';
}

/**
 * Build explicit clean child process environment.
 * Strips PG*, NODE_OPTIONS, and provider credentials.
 */
export function buildCleanChildEnv(homeDir = TASK_HOME_ROOT) {
  const cleanEnv = {
    PATH: `/home/tung/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:${process.env.PATH || ''}`,
    HOME: homeDir,
    SUPABASE_HOME: homeDir,
    NODE_ENV: 'production',
  };

  for (const [k, v] of Object.entries(process.env)) {
    if (
      !k.startsWith('PG') &&
      !k.startsWith('NODE_OPTIONS') &&
      !k.startsWith('NODE_TEST_CONTEXT') &&
      !k.startsWith('DATABASE_URL') &&
      !k.startsWith('SUPABASE') &&
      !k.startsWith('LINGORA_')
    ) {
      cleanEnv[k] = v;
    }
  }

  return cleanEnv;
}

/**
 * Linux /proc process and socket observation helpers.
 * Returns explicit typed observation objects (KNOWN vs UNKNOWN).
 */
export function getLinuxBootId() {
  try {
    if (fs.existsSync('/proc/sys/kernel/random/boot_id')) {
      const bootId = fs.readFileSync('/proc/sys/kernel/random/boot_id', 'utf8').trim();
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(bootId)) {
        return { status: 'KNOWN', boot_id: bootId };
      }
    }
  } catch {}
  return { status: 'UNKNOWN', boot_id: null };
}

export function parseProcStat(pid) {
  const statPath = `/proc/${pid}/stat`;
  try {
    const content = fs.readFileSync(statPath, 'utf8');
    const rparen = content.lastIndexOf(')');
    if (rparen === -1) return { status: 'UNKNOWN', stat: null };
    const comm = content.substring(content.indexOf('(') + 1, rparen);
    const rest = content.substring(rparen + 2).trim().split(/\s+/);
    // rest[0] is state (field 3)
    // rest[1] is ppid (field 4)
    // rest[19] is starttime (field 22)
    return {
      status: 'KNOWN',
      stat: {
        pid: parseInt(pid, 10),
        comm,
        state: rest[0],
        ppid: parseInt(rest[1], 10),
        start_ticks: rest[19],
      },
    };
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      try {
        fs.statSync(`/proc/${pid}`);
        // If /proc/${pid} exists but stat was ENOENT, it is anomalous/UNKNOWN
        return { status: 'UNKNOWN', stat: null };
      } catch (dirErr) {
        if (dirErr && dirErr.code === 'ENOENT') {
          return { status: 'ABSENT', stat: null };
        }
        return { status: 'UNKNOWN', stat: null };
      }
    }
    return { status: 'UNKNOWN', stat: null };
  }
}

export function getProcessIdentity(pid) {
  const statRes = parseProcStat(pid);
  if (statRes.status !== 'KNOWN' || !statRes.stat) return null;
  const stat = statRes.stat;
  let exe = '';
  let cwd = '';
  let cmdline = '';
  try {
    exe = fs.readlinkSync(`/proc/${pid}/exe`);
  } catch {}
  try {
    cwd = fs.readlinkSync(`/proc/${pid}/cwd`);
  } catch {}
  try {
    cmdline = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8').replace(/\0/g, ' ').trim();
  } catch {}
  const bootRes = getLinuxBootId();
  return {
    pid: stat.pid,
    comm: stat.comm,
    state: stat.state,
    ppid: stat.ppid,
    start_ticks: stat.start_ticks,
    boot_id: bootRes.status === 'KNOWN' ? bootRes.boot_id : 'unknown-boot',
    exe,
    cwd,
    cmdline,
  };
}

export function checkProcessAlive(pid, startTicks, bootId) {
  if (!pid || !startTicks || !bootId) {
    return 'UNKNOWN';
  }
  const currentBoot = getLinuxBootId();
  if (currentBoot.status !== 'KNOWN') {
    return 'UNKNOWN';
  }
  if (bootId !== 'unknown-boot' && bootId !== currentBoot.boot_id) {
    return 'DEAD';
  }
  const statRes = parseProcStat(pid);
  if (statRes.status === 'ABSENT') {
    return 'DEAD';
  }
  if (statRes.status !== 'KNOWN' || !statRes.stat) {
    return 'UNKNOWN';
  }
  return statRes.stat.start_ticks === String(startTicks) ? 'ALIVE' : 'DEAD';
}

export function isProcessAlive(pid, startTicks, bootId) {
  const state = checkProcessAlive(pid, startTicks, bootId);
  if (state === 'UNKNOWN') {
    throw new Error(`OBSERVATION_UNKNOWN: Cannot determine liveness of PID ${pid}`);
  }
  return state === 'ALIVE';
}

export function checkProcessDisappeared(pid) {
  try {
    fs.statSync(`/proc/${pid}`);
    return false;
  } catch (err) {
    if (err && (err.code === 'ENOENT' || err.code === 'ESRCH')) {
      return true;
    }
    return false;
  }
}

/**
 * Validate process snapshot schema and typed status.
 * Fails closed on invalid or malformed observation objects.
 */
export function validateProcessSnapshot(snap) {
  if (!snap || typeof snap !== 'object' || Array.isArray(snap)) {
    const err = new Error('OBSERVATION_INVALID: Process observation result is not an object.');
    err.code = 'OBSERVATION_INVALID';
    throw err;
  }
  if (snap.status === 'UNKNOWN') {
    return snap;
  }
  if (snap.status === 'KNOWN') {
    if (snap.unobservable !== undefined && (!Array.isArray(snap.unobservable) || snap.unobservable.length > 0)) {
      const err = new Error('OBSERVATION_INVALID: KNOWN result contains unobservable processes.');
      err.code = 'OBSERVATION_INVALID';
      throw err;
    }
    if (!Array.isArray(snap.processes)) {
      const err = new Error("OBSERVATION_INVALID: Process observation with status KNOWN must have 'processes' array.");
      err.code = 'OBSERVATION_INVALID';
      throw err;
    }
    for (const p of snap.processes) {
      if (!p || typeof p !== 'object' || typeof p.pid !== 'number' || !Number.isSafeInteger(p.pid) || p.pid <= 0 ||
          typeof p.start_ticks !== 'string' || !/^[1-9]\d*$/.test(p.start_ticks) ||
          typeof p.boot_id !== 'string' || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(p.boot_id)) {
        const err = new Error('OBSERVATION_INVALID: Process observation contains invalid process entry.');
        err.code = 'OBSERVATION_INVALID';
        throw err;
      }
    }
    return snap;
  }
  const err = new Error(`OBSERVATION_INVALID: Process observation has invalid status "${snap.status}".`);
  err.code = 'OBSERVATION_INVALID';
  throw err;
}

export function isPlausibleAssociatedProcess(
  pid,
  comm,
  cmdline,
  ppid,
  resolvedHome,
  resolvedWorkdir,
  resolvedRunDir,
  stackId,
  knownPids
) {
  if (knownPids && knownPids.has(pid)) return true;
  if (ppid === process.pid) return true;
  if (
    (resolvedHome && cmdline.includes(resolvedHome)) ||
    (resolvedRunDir && cmdline.includes(resolvedRunDir)) ||
    (resolvedWorkdir && cmdline.includes(resolvedWorkdir)) ||
    (stackId && cmdline.includes(stackId))
  ) {
    return true;
  }
  if (/^(supabase|postgres|postgrest|gotrue|kong|deno|inbucket|vector|storage-api|node)$/i.test(comm)) {
    return true;
  }
  return false;
}

export function isPathAssociatedWithRun(targetPath, homeDir, workdir, runDir) {
  if (!targetPath || typeof targetPath !== 'string') return false;
  const clean = targetPath.endsWith(' (deleted)') ? targetPath.slice(0, -10) : targetPath;
  if (homeDir && (clean === homeDir || clean.startsWith(homeDir + '/'))) return true;
  if (runDir && (clean === runDir || clean.startsWith(runDir + '/'))) return true;
  if (workdir && (clean === workdir || clean.startsWith(workdir + '/'))) return true;
  return false;
}

export function snapshotRunProcesses(homeDir, workdir, stackId, options = {}) {
  const identities = [];
  const seenPids = new Set();
  const knownPids = new Set();
  if (options.knownPids) {
    for (const p of options.knownPids) knownPids.add(p);
  }
  let hadObservationError = false;
  const unobservablePids = [];

  const resolvedHome = homeDir ? path.resolve(homeDir) : null;
  const resolvedWorkdir = (workdir && workdir !== CANONICAL_WORKSPACE_ROOT) ? path.resolve(workdir) : null;
  const resolvedRunDir = options.runDir
    ? path.resolve(options.runDir)
    : (resolvedHome && path.basename(resolvedHome) === 'home' ? path.dirname(resolvedHome) : null);

  if (resolvedRunDir) {
    for (const lockName of ['.run.lock', '.recovery.lock', '.prune.lock']) {
      try {
        const lockPath = path.resolve(resolvedRunDir, lockName);
        if (fs.existsSync(lockPath)) {
          const lockRaw = fs.readFileSync(lockPath, 'utf8');
          const lockJson = JSON.parse(lockRaw);
          if (lockJson && typeof lockJson.pid === 'number') {
            knownPids.add(lockJson.pid);
          } else {
            hadObservationError = true;
          }
        }
      } catch { hadObservationError = true; }
    }
  }

  // 1. Consult known native owner identity from owner.json
  if (homeDir && stackId) {
    const ownerFile = path.resolve(homeDir, 'stacks', stackId, 'owner.json');
    const ownerAbsence = checkFileAbsence(ownerFile);
    if (ownerAbsence === 'UNKNOWN') {
      hadObservationError = true;
    } else if (ownerAbsence === 'PRESENT') {
      try {
        const ownerRaw = fs.readFileSync(ownerFile, 'utf8');
        const ownerJson = JSON.parse(ownerRaw);
        if (ownerJson && typeof ownerJson.pid === 'number') {
          const ownerPid = ownerJson.pid;
          knownPids.add(ownerPid);
          const statRes = parseProcStat(ownerPid);
          if (statRes.status === 'UNKNOWN') {
            hadObservationError = true;
          } else if (statRes.status === 'KNOWN' && statRes.stat) {
            seenPids.add(ownerPid);
            identities.push({
              pid: ownerPid,
              start_ticks: statRes.stat.start_ticks,
              boot_id: getLinuxBootId().boot_id,
            });
          }
        } else {
          hadObservationError = true;
        }
      } catch (err) {
        if (err && err.code !== 'ENOENT') {
          hadObservationError = true;
        }
      }
    }
  }

  // 2. Inspect current harness process (process.pid) for open file descriptors and memory mappings
  // Inspecting only other PIDs misses in-process handles.
  if (!seenPids.has(process.pid)) {
    let ownProcessAssociated = false;
    // Check open descriptors in /proc/self/fd
    try {
      const selfFds = fs.readdirSync(`/proc/${process.pid}/fd`);
      for (const fd of selfFds) {
        try {
          const link = fs.readlinkSync(`/proc/${process.pid}/fd/${fd}`);
          if (isPathAssociatedWithRun(link, resolvedHome, resolvedWorkdir, resolvedRunDir)) {
            ownProcessAssociated = true;
            break;
          }
        } catch (err) {
          if (err.code !== 'ENOENT' && err.code !== 'ESRCH') hadObservationError = true;
        }
      }
    } catch {
      // Inability to inspect own descriptors is an observation error
      hadObservationError = true;
    }

    // Check memory mappings in /proc/self/maps
    if (!ownProcessAssociated) {
      try {
        const selfMaps = fs.readFileSync(`/proc/${process.pid}/maps`, 'utf8');
        if (
          (resolvedHome && selfMaps.includes(resolvedHome)) ||
          (resolvedRunDir && selfMaps.includes(resolvedRunDir)) ||
          (resolvedWorkdir && selfMaps.includes(resolvedWorkdir))
        ) {
          ownProcessAssociated = true;
        }
      } catch {
        hadObservationError = true;
      }
    }

    if (ownProcessAssociated) {
      const selfIdentity = getProcessIdentity(process.pid);
      if (selfIdentity) {
        seenPids.add(process.pid);
        identities.push(selfIdentity);
      } else {
        hadObservationError = true;
      }
    }
  }

  // 3. Scan /proc for other same-UID child/service processes associated with this run
  // OS Boundary: Root/kernel/other-user processes are outside this UID-owned local harness authority.
  try {
    const entries = fs.readdirSync('/proc');
    const myUid = process.getuid ? process.getuid() : null;
    for (const entry of entries) {
      if (!/^\d+$/.test(entry)) continue;
      const pid = parseInt(entry, 10);
      if (pid === process.pid || seenPids.has(pid)) continue;

      let stat;
      try {
        stat = fs.statSync(`/proc/${pid}`);
      } catch (err) {
        if (err.code !== 'ENOENT' && err.code !== 'ESRCH') {
          hadObservationError = true;
          unobservablePids.push(pid);
        }
        continue;
      }

      if (myUid !== null && stat.uid !== myUid) {
        continue;
      }

      const procStatRes = parseProcStat(pid);
      if (procStatRes.status === 'ABSENT') {
        continue;
      }

      if (procStatRes.status !== 'KNOWN') {
        hadObservationError = true;
        unobservablePids.push(pid);
        continue;
      }

      const comm = procStatRes.stat ? procStatRes.stat.comm : '';
      const ppid = procStatRes.stat ? procStatRes.stat.ppid : null;

      let isRunProcess = false;
      let inspectError = false;

      let cwd = '';
      try {
        cwd = fs.readlinkSync(`/proc/${pid}/cwd`);
        if (isPathAssociatedWithRun(cwd, resolvedHome, resolvedWorkdir, resolvedRunDir)) {
          isRunProcess = true;
        }
      } catch (err) {
        if (err.code !== 'ENOENT' && err.code !== 'ESRCH') {
          inspectError = true;
        }
      }

      let cmdline = '';
      try {
        cmdline = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8');
        if (
          (resolvedHome && cmdline.includes(resolvedHome)) ||
          (resolvedRunDir && cmdline.includes(resolvedRunDir)) ||
          (resolvedWorkdir && cmdline.includes(resolvedWorkdir)) ||
          (stackId && cmdline.includes(stackId))
        ) {
          isRunProcess = true;
        }
      } catch (err) {
        if (err.code !== 'ENOENT' && err.code !== 'ESRCH') {
          inspectError = true;
        }
      }

      // Check /proc/${pid}/fd for open file descriptors
      if (!isRunProcess) {
        try {
          const fds = fs.readdirSync(`/proc/${pid}/fd`);
          for (const fd of fds) {
            try {
              const link = fs.readlinkSync(`/proc/${pid}/fd/${fd}`);
              if (isPathAssociatedWithRun(link, resolvedHome, resolvedWorkdir, resolvedRunDir)) {
                isRunProcess = true;
                break;
              }
            } catch (err) {
              if (err.code !== 'ENOENT' && err.code !== 'ESRCH') inspectError = true;
            }
          }
        } catch (err) {
          if (err.code !== 'ENOENT' && err.code !== 'ESRCH') {
            inspectError = true;
          }
        }
      }

      // Check /proc/${pid}/maps for mapped files
      if (!isRunProcess) {
        try {
          const maps = fs.readFileSync(`/proc/${pid}/maps`, 'utf8');
          if (
            (resolvedHome && maps.includes(resolvedHome)) ||
            (resolvedRunDir && maps.includes(resolvedRunDir)) ||
            (resolvedWorkdir && maps.includes(resolvedWorkdir))
          ) {
            isRunProcess = true;
          }
        } catch (err) {
          if (err.code !== 'ENOENT' && err.code !== 'ESRCH') {
            inspectError = true;
          }
        }
      }

      // Fail closed on any unreadable same-UID process: no process-name/comm/parent heuristic bypass
      if (inspectError) {
        const disappeared = checkProcessDisappeared(pid);
        if (!disappeared) {
          hadObservationError = true;
          unobservablePids.push(pid);
        }
      }

      if (isRunProcess) {
        const identity = getProcessIdentity(pid);
        if (identity) {
          seenPids.add(pid);
          identities.push(identity);
        } else {
          const disappeared = checkProcessDisappeared(pid);
          if (!disappeared) {
            hadObservationError = true;
          }
        }
      }
    }
  } catch (err) {
    hadObservationError = true;
  }

  if (hadObservationError) {
    return { status: 'UNKNOWN', processes: identities, unobservable: unobservablePids };
  }
  return { status: 'KNOWN', processes: identities };
}

export function snapshotRunSockets(expectedPorts = [54321, 54322, 54324, 54323]) {
  const targetPortsHex = new Set(expectedPorts.map(p => p.toString(16).toUpperCase().padStart(4, '0')));
  const activePorts = [];
  try {
    for (const tcpFile of ['/proc/net/tcp', '/proc/net/tcp6']) {
      const lines = fs.readFileSync(tcpFile, 'utf8').split('\n');
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 4) {
          const localAddr = parts[1];
          const state = parts[3];
          // state '0A' is TCP_LISTEN
          const [ip, portHex] = localAddr.split(':');
          if (targetPortsHex.has(portHex) && state === '0A') {
            activePorts.push({
              port: parseInt(portHex, 16),
              state,
              file: tcpFile,
            });
          }
        }
      }
    }
    return { status: 'KNOWN', activePorts };
  } catch {
    return { status: 'UNKNOWN', activePorts: [] };
  }
}

export function verifyProcessesQuiescent(snapshot, homeDir, workdir, stackId, retries = 10, delayMs = 300, options = {}) {
  const procSnapFn = (options.adapters && options.adapters.snapshotRunProcesses) || snapshotRunProcesses;
  if (!snapshot) {
    return false;
  }
  validateProcessSnapshot(snapshot);
  if (snapshot.status !== 'KNOWN') {
    return false;
  }
  for (let r = 0; r < retries; r++) {
    let anyAliveOrUnknown = false;
    for (const p of snapshot.processes) {
      const state = checkProcessAlive(p.pid, p.start_ticks, p.boot_id);
      if (state === 'ALIVE' || state === 'UNKNOWN') {
        anyAliveOrUnknown = true;
        break;
      }
    }
    if (!anyAliveOrUnknown) {
      const rawFresh = procSnapFn(homeDir, workdir, stackId);
      const freshSnapshot = validateProcessSnapshot(rawFresh);
      if (freshSnapshot.status === 'KNOWN' && freshSnapshot.processes.length === 0) {
        return true;
      }
    }
    if (r < retries - 1) {
      const end = Date.now() + delayMs;
      while (Date.now() < end) {}
    }
  }
  return false;
}

export function verifySocketsQuiescent(expectedPorts = [54321, 54322, 54324, 54323], retries = 10, delayMs = 300, options = {}) {
  const socketSnapFn = (options.adapters && options.adapters.snapshotRunSockets) || snapshotRunSockets;
  for (let r = 0; r < retries; r++) {
    const socketSnap = socketSnapFn(expectedPorts);
    if (!socketSnap || socketSnap.status !== 'KNOWN' || !Array.isArray(socketSnap.activePorts)) {
      return false;
    }
    if (socketSnap.activePorts.length === 0) {
      return true;
    }
    if (r < retries - 1) {
      const end = Date.now() + delayMs;
      while (Date.now() < end) {}
    }
  }
  return false;
}

export function checkFileAbsence(filePath) {
  try {
    fs.statSync(filePath);
    return 'PRESENT';
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      return 'ABSENT';
    }
    return 'UNKNOWN';
  }
}

export function verifyNativeStateFilesAbsent(homeDir, stackId) {
  if (!homeDir || !stackId) return 'UNKNOWN';
  const stackDir = path.resolve(homeDir, 'stacks', stackId);
  const stateFile = path.resolve(stackDir, 'state.json');
  const ownerFile = path.resolve(stackDir, 'owner.json');

  const stateRes = checkFileAbsence(stateFile);
  const ownerRes = checkFileAbsence(ownerFile);

  if (stateRes === 'PRESENT' || ownerRes === 'PRESENT') {
    return 'PRESENT';
  }
  if (stateRes === 'UNKNOWN' || ownerRes === 'UNKNOWN') {
    return 'UNKNOWN';
  }
  return 'ABSENT';
}

export function verifyIncarnationContinuity({ authority, adapters = {}, cliPath } = {}) {
  if (!authority || (!authority.bound && authority.phase !== 'BOUND')) {
    throw new Error('RECONCILE_FAIL: Cannot verify incarnation continuity on unbound authority.');
  }
  // F3: Missing initialized anchor on existing BOUND operation must deny
  if (!authority.member_map || typeof authority.member_map !== 'object' || Object.keys(authority.member_map).length === 0) {
    throw new Error('RECONCILE_FAIL: Missing initialized member_map anchor on BOUND authority.');
  }

  const cliExecutor = adapters.cliExecutor || spawnSync;
  const cleanEnv = buildCleanChildEnv(authority.home_dir);
  const res = cliExecutor(
    cliPath,
    ['stack', 'status', '--stack-id', authority.instance_id, '--workdir', authority.workdir, '--output-format', 'json'],
    { cwd: authority.workdir, env: cleanEnv, encoding: 'utf8', timeout: 30000, maxBuffer: 10 * 1024 * 1024 }
  );

  if (res.status !== 0) {
    throw new Error(`STATUS_FAIL: Pre-effect status check failed with exit code ${res.status}`);
  }

  const parsed = parseStrictJson(res.stdout, 'pre-effect status check');
  if (parsed.identity?.id !== authority.instance_id) {
    throw new Error('RECONCILE_FAIL: Status ID mismatch during incarnation check.');
  }

  if (!parsed.composition || !Array.isArray(parsed.composition.members) || parsed.composition.members.length === 0) {
    throw new Error('RECONCILE_FAIL: Active composition missing or empty during incarnation check.');
  }

  const currentMembers = {};
  for (const m of parsed.composition.members) {
    currentMembers[m.service] = m.id;
  }

  for (const [srv, expId] of Object.entries(authority.member_map)) {
    if (!currentMembers[srv]) {
      throw new Error('RECONCILE_FAIL: Required service missing from active composition.');
    }
    if (currentMembers[srv] !== expId) {
      throw new Error('RECONCILE_FAIL: Member UUID mismatch. Incarnation continuity broken.');
    }
  }

  return { verified: true, currentMembers };
}

/**
 * Validate canonical config.toml digest.
 */
export function validateCanonicalConfig(configPath = CANONICAL_CONFIG_PATH) {
  if (!fs.existsSync(configPath)) {
    throw new Error(`CONFIG_ERROR: Config file not found at: ${configPath}`);
  }
  const stat = fs.lstatSync(configPath);
  if (stat.isSymbolicLink()) {
    throw new Error(`CONFIG_ERROR: Config file at "${configPath}" is a forbidden symbolic link.`);
  }

  const content = fs.readFileSync(configPath, 'utf8');
  const digest = computeSha256(content);

  if (digest !== CANONICAL_CONFIG_DIGEST) {
    throw new Error(
      `CONFIG_ERROR: Config file digest mismatch. Expected ${CANONICAL_CONFIG_DIGEST}, got ${digest}`
    );
  }

  return {
    valid: true,
    configPath,
    configDigest: digest,
  };
}

/**
 * Validate a PostgreSQL database URL against local allowlist.
 * Rejects query parameters, fragments, non-loopback hosts, and invalid ports.
 */
export function validateDatabaseUrl(dbUrl, expectedPort = EXPECTED_PORTS.database) {
  if (!dbUrl || typeof dbUrl !== 'string') {
    throw new Error('ALLOWLIST_FAIL: Database URL is missing or empty.');
  }

  if (dbUrl.includes('?') || dbUrl.includes('#')) {
    throw new Error('ALLOWLIST_FAIL: Database URL must not contain query parameters or fragments.');
  }

  let parsed;
  try {
    parsed = new URL(dbUrl);
  } catch (err) {
    throw new Error('ALLOWLIST_FAIL: Malformed database URL.');
  }

  if (parsed.protocol !== 'postgresql:' && parsed.protocol !== 'postgres:') {
    throw new Error(`ALLOWLIST_FAIL: Unsupported database protocol "${parsed.protocol}".`);
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!ALLOWED_HOSTS.has(hostname)) {
    throw new Error(`ALLOWLIST_FAIL: Non-local database host "${hostname}" forbidden. Only loopback allowed.`);
  }

  const port = parsed.port ? parseInt(parsed.port, 10) : 5432;
  if (expectedPort && port !== expectedPort) {
    throw new Error(`ALLOWLIST_FAIL: Database port ${port} does not match expected port ${expectedPort}.`);
  }

  const database = parsed.pathname ? parsed.pathname.replace(/^\//, '') : '';
  if (!database) {
    throw new Error('ALLOWLIST_FAIL: Database name is missing from connection URL.');
  }

  const username = parsed.username || '';
  if (!username) {
    throw new Error('ALLOWLIST_FAIL: Username is missing from connection URL.');
  }

  const password = parsed.password || '';

  return {
    valid: true,
    protocol: parsed.protocol,
    hostname,
    port,
    database,
    username,
    password,
  };
}

/**
 * Validate an HTTP API URL against the local allowlist.
 * Rejects query parameters, fragments, userinfo, and non-loopback hosts.
 */
export function validateApiUrl(apiUrl, expectedPort = EXPECTED_PORTS.api) {
  if (!apiUrl || typeof apiUrl !== 'string') {
    throw new Error('ALLOWLIST_FAIL: API URL is missing or empty.');
  }

  if (apiUrl.includes('?') || apiUrl.includes('#')) {
    throw new Error('ALLOWLIST_FAIL: API URL must not contain query parameters or fragments.');
  }

  let parsed;
  try {
    parsed = new URL(apiUrl);
  } catch (err) {
    throw new Error('ALLOWLIST_FAIL: Malformed API URL.');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`ALLOWLIST_FAIL: Unsupported API protocol "${parsed.protocol}".`);
  }

  if (parsed.username || parsed.password) {
    throw new Error('ALLOWLIST_FAIL: Userinfo in API URL is forbidden.');
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!ALLOWED_HOSTS.has(hostname)) {
    throw new Error(`ALLOWLIST_FAIL: Non-local API host "${hostname}" forbidden. Only 127.0.0.1 or localhost permitted.`);
  }

  const port = parsed.port ? parseInt(parsed.port, 10) : (parsed.protocol === 'http:' ? 80 : 443);
  if (expectedPort && port !== expectedPort) {
    throw new Error(`ALLOWLIST_FAIL: API port ${port} does not match expected port ${expectedPort}.`);
  }

  return {
    valid: true,
    protocol: parsed.protocol,
    hostname,
    port,
  };
}

/**
 * Validate atomic authority record (owner.json).
 * Strict verification of format version, task ID, run ID, permissions, roots, and phases.
 */
export function validateAuthorityRecord(recordOrPath, options = {}) {
  let record;
  let recordPath = null;
  if (typeof recordOrPath === 'string') {
    recordPath = recordOrPath;
    if (!fs.existsSync(recordPath)) {
      return { bound: false, reason: `No task-local binding file found at: ${recordPath}` };
    }
    const lstat = fs.lstatSync(recordPath);
    if (lstat.isSymbolicLink()) {
      throw new Error(`ALLOWLIST_FAIL: Authority record "${recordPath}" is a forbidden symbolic link.`);
    }

    // UID & Permission check
    const stat = fs.statSync(recordPath);
    if (process.getuid && stat.uid !== process.getuid()) {
      throw new Error(`ALLOWLIST_FAIL: Authority record UID ${stat.uid} does not match runner UID ${process.getuid()}.`);
    }
    const mode = stat.mode & 0o777;
    if (mode !== 0o600) {
      throw new Error(`ALLOWLIST_FAIL: Insecure authority record file permissions ${mode.toString(8)} (must be 0600).`);
    }

    try {
      record = JSON.parse(fs.readFileSync(recordPath, 'utf8'));
    } catch {
      throw new Error('ALLOWLIST_FAIL: Corrupted or unparseable task binding JSON.');
    }
  } else if (recordOrPath && typeof recordOrPath === 'object') {
    record = recordOrPath;
  } else {
    throw new Error('ALLOWLIST_FAIL: Invalid authority record parameter.');
  }

  if (!record || typeof record !== 'object') {
    throw new Error('ALLOWLIST_FAIL: Task binding is not an object.');
  }

  // Strict: format_version must be exactly '1.0'
  if (record.format_version !== '1.0') {
    throw new Error(`ALLOWLIST_FAIL: Unsupported format version "${record.format_version || 'missing'}". Expected "1.0".`);
  }

  // Strict: task_id must be exactly TASK_ID
  const expectedTask = options.expectedTaskId || TASK_ID;
  if (!record.task_id || record.task_id !== expectedTask) {
    throw new Error(`ALLOWLIST_FAIL: Task ID mismatch ("${record.task_id || 'missing'}" != "${expectedTask}").`);
  }

  // Phase validation
  const phase = record.phase;
  if (!['RESERVED', 'BOUND', 'DESTROYED'].includes(phase)) {
    throw new Error(`ALLOWLIST_FAIL: Invalid authority phase "${phase}".`);
  }

  // Run ID validation
  const runId = record.run_id;
  if (!runId || typeof runId !== 'string' || !/^run-[a-f0-9]{8,32}$/i.test(runId)) {
    throw new Error('ALLOWLIST_FAIL: run_id missing or invalid in authority record.');
  }
  const expectedRunId = options.expectedRunId || options.runId;
  if (expectedRunId && runId !== expectedRunId) {
    throw new Error(`ALLOWLIST_FAIL: Run ID mismatch ("${runId}" != "${expectedRunId}").`);
  }

  const stackName = record.stack_name;
  if (!stackName || typeof stackName !== 'string') {
    throw new Error('ALLOWLIST_FAIL: stack_name missing in authority record.');
  }

  if (record.runtime !== 'native') {
    throw new Error(`ALLOWLIST_FAIL: Unexpected runtime "${record.runtime}". Only "native" permitted.`);
  }

  const instanceId = record.instance_id;
  if (phase === 'BOUND' || phase === 'DESTROYED') {
    if (!instanceId || typeof instanceId !== 'string' || !/^[a-f0-9]{64}$/i.test(instanceId)) {
      throw new Error(`ALLOWLIST_FAIL: stackId "${instanceId}" is not a valid 64-character hex ID.`);
    }
    if (phase === 'BOUND' && (!record.member_map || typeof record.member_map !== 'object' || Object.keys(record.member_map).length === 0)) {
      throw new Error('ALLOWLIST_FAIL: BOUND record must contain non-empty initialized member_map anchor.');
    }
  } else if (phase === 'RESERVED') {
    if (instanceId !== null && instanceId !== undefined) {
      throw new Error('ALLOWLIST_FAIL: RESERVED record must not have bound instance_id.');
    }
  }

  // Control root check: must reside strictly inside runsDir without symlink escape
  const runsDir = options.runsDir ? path.resolve(options.runsDir) : DEFAULT_RUNS_DIR;
  const controlRoot = record.control_root;
  if (!controlRoot || !fs.existsSync(controlRoot)) {
    throw new Error('ALLOWLIST_FAIL: control_root is missing or does not exist.');
  }
  if (fs.lstatSync(controlRoot).isSymbolicLink()) {
    throw new Error('ALLOWLIST_FAIL: control_root is a forbidden symbolic link.');
  }
  const expectedLexicalControl = path.resolve(runsDir, runId);
  if (path.resolve(controlRoot) !== expectedLexicalControl) {
    throw new Error('ALLOWLIST_FAIL: control_root does not match exact lexical run path.');
  }
  const realControl = fs.realpathSync(controlRoot);
  if (realControl !== expectedLexicalControl) {
    throw new Error('ALLOWLIST_FAIL: control_root escapes or contains forbidden symlinks.');
  }

  // Reject unowned legacy roots and prior disposable runs
  if (fs.existsSync(FORBIDDEN_UNOWNED_STATE_ROOT) && realControl === fs.realpathSync(FORBIDDEN_UNOWNED_STATE_ROOT)) {
    throw new Error('ALLOWLIST_FAIL: Auto-adoption of unowned .local-stack root is strictly forbidden.');
  }
  if (fs.existsSync(FORBIDDEN_OLD_WP00_STATE) && realControl === fs.realpathSync(FORBIDDEN_OLD_WP00_STATE)) {
    throw new Error('ALLOWLIST_FAIL: Auto-adoption of legacy .wp00-state root is forbidden.');
  }
  for (const olderRoot of FORBIDDEN_OLDER_RUN_ROOTS) {
    if (fs.existsSync(olderRoot) && realControl === fs.realpathSync(olderRoot)) {
      throw new Error('ALLOWLIST_FAIL: Auto-adoption or mutation of older disposable run is strictly forbidden.');
    }
  }

  // Check control_root permissions and UID
  const ctrlStat = fs.statSync(realControl);
  if (process.getuid && ctrlStat.uid !== process.getuid()) {
    throw new Error(`ALLOWLIST_FAIL: control_root UID ${ctrlStat.uid} does not match runner UID ${process.getuid()}.`);
  }
  if ((ctrlStat.mode & 0o777) !== 0o700) {
    throw new Error(`ALLOWLIST_FAIL: Insecure control_root directory permissions ${(ctrlStat.mode & 0o777).toString(8)} (must be 0700).`);
  }

  if (recordPath) {
    const realRecordDir = fs.realpathSync(path.dirname(recordPath));
    if (realRecordDir !== realControl) {
      throw new Error('ALLOWLIST_FAIL: Binding file does not reside directly inside binding.control_root.');
    }
  }

  // Home root check: must reside inside controlRoot without symlink escape
  const homeDir = record.home_dir;
  if (!homeDir || !fs.existsSync(homeDir)) {
    throw new Error('ALLOWLIST_FAIL: home_dir is missing or does not exist.');
  }
  if (fs.lstatSync(homeDir).isSymbolicLink()) {
    throw new Error('ALLOWLIST_FAIL: home_dir is a forbidden symbolic link.');
  }
  const expectedLexicalHome = path.resolve(expectedLexicalControl, 'home');
  if (path.resolve(homeDir) !== expectedLexicalHome) {
    throw new Error('ALLOWLIST_FAIL: home_dir does not match exact lexical run home path.');
  }
  const realHome = fs.realpathSync(homeDir);
  if (realHome !== expectedLexicalHome) {
    throw new Error('ALLOWLIST_FAIL: home_dir escapes or contains forbidden symlinks.');
  }

  // Reject unowned legacy home roots
  if (fs.existsSync(FORBIDDEN_UNOWNED_HOME_ROOT) && realHome === fs.realpathSync(FORBIDDEN_UNOWNED_HOME_ROOT)) {
    throw new Error('ALLOWLIST_FAIL: Auto-adoption of unowned .supabase-home root is strictly forbidden.');
  }
  if (fs.existsSync(FORBIDDEN_OLD_WP00_HOME) && realHome === fs.realpathSync(FORBIDDEN_OLD_WP00_HOME)) {
    throw new Error('ALLOWLIST_FAIL: Auto-adoption of legacy .wp00-home root is forbidden.');
  }

  // Check home_dir permissions and UID
  const homeStat = fs.statSync(realHome);
  if (process.getuid && homeStat.uid !== process.getuid()) {
    throw new Error(`ALLOWLIST_FAIL: home_dir UID ${homeStat.uid} does not match runner UID ${process.getuid()}.`);
  }
  if ((homeStat.mode & 0o777) !== 0o700) {
    throw new Error(`ALLOWLIST_FAIL: Insecure home_dir directory permissions ${(homeStat.mode & 0o777).toString(8)} (must be 0700).`);
  }

  // Workdir and Project root: Must be trusted run fixture inside control_root
  const projectRoot = record.project_root;
  const workdir = record.workdir;
  if (!projectRoot || !fs.existsSync(projectRoot)) {
    throw new Error('ALLOWLIST_FAIL: project_root in authority is missing or does not exist.');
  }
  if (!workdir || !fs.existsSync(workdir)) {
    throw new Error('ALLOWLIST_FAIL: workdir in authority is missing or does not exist.');
  }
  if (fs.lstatSync(workdir).isSymbolicLink() || fs.lstatSync(projectRoot).isSymbolicLink()) {
    throw new Error('ALLOWLIST_FAIL: workdir or project_root is a forbidden symbolic link.');
  }
  const realProject = fs.realpathSync(projectRoot);
  const realWorkdir = fs.realpathSync(workdir);
  if (realProject !== realWorkdir) {
    throw new Error('ALLOWLIST_FAIL: project_root and workdir must match.');
  }

  const expectedLexicalFixture = path.resolve(expectedLexicalControl, 'fixture');
  const isRunFixture = path.resolve(workdir) === expectedLexicalFixture && realWorkdir === expectedLexicalFixture;
  if (!isRunFixture) {
    throw new Error('ALLOWLIST_FAIL: workdir must be a trusted private run fixture contained in control_root.');
  }

  // Config digest check: required and must match CANONICAL_CONFIG_DIGEST
  const configPath = record.config_path || path.resolve(realWorkdir, 'supabase/config.toml');
  const configInfo = validateCanonicalConfig(configPath);
  const configDigest = record.config_digest;
  if (!configDigest || configDigest !== configInfo.configDigest) {
    throw new Error('ALLOWLIST_FAIL: Config digest mismatch between authority and actual config file.');
  }

  // Branch check: required and must match current branch
  const branchRef = record.branch_ref;
  if (!branchRef) {
    throw new Error('ALLOWLIST_FAIL: branch_ref missing in authority record.');
  }
  const currentBranch = getGitBranch(realWorkdir);
  const normRecord = branchRef.replace(/^refs\/heads\//, '');
  const normCurrent = currentBranch.replace(/^refs\/heads\//, '');
  if (normRecord !== normCurrent) {
    throw new Error(`ALLOWLIST_FAIL: Git branch mismatch (binding: ${branchRef}, current: ${currentBranch}).`);
  }

  // CLI version & digest checks: required and must match pinned values
  if (record.cli_version !== PINNED_CLI_VERSION) {
    throw new Error(`ALLOWLIST_FAIL: CLI version mismatch in authority. Expected "${PINNED_CLI_VERSION}".`);
  }
  if (record.cli_digest !== PINNED_CLI_SHA256) {
    throw new Error(`ALLOWLIST_FAIL: CLI digest mismatch in authority. Expected "${PINNED_CLI_SHA256}".`);
  }

  return {
    valid: true,
    bound: phase === 'BOUND',
    format_version: '1.0',
    task_id: TASK_ID,
    phase,
    pending_operation: record.pending_operation || null,
    run_id: runId,
    runId,
    instance_id: instanceId || null,
    stackId: instanceId || null,
    stack_name: stackName,
    stackName,
    runtime: 'native',
    cli_version: PINNED_CLI_VERSION,
    cli_digest: PINNED_CLI_SHA256,
    project_root: realProject,
    projectRoot: realProject,
    workdir: realWorkdir,
    config_path: configInfo.configPath,
    configPath: configInfo.configPath,
    config_digest: configInfo.configDigest,
    branch_ref: branchRef || getGitBranch(realWorkdir),
    gitBranch: branchRef || getGitBranch(realWorkdir),
    home_dir: realHome,
    homeDir: realHome,
    control_root: realControl,
    stateRoot: realControl,
    member_map: record.member_map || null,
    tombstone: phase === 'DESTROYED',
    destroyed_at: record.destroyed_at || null,
    rawAuthority: record,
    validatedEndpoints: {
      database: { host: '127.0.0.1', port: EXPECTED_PORTS.database, protocol: 'tcp' },
      auth: { url: 'http://127.0.0.1:54321', port: EXPECTED_PORTS.api },
      rest: { url: 'http://127.0.0.1:54321', port: EXPECTED_PORTS.api },
      storage: { url: 'http://127.0.0.1:54321', port: EXPECTED_PORTS.api },
      mail: { url: 'http://127.0.0.1:54324', port: EXPECTED_PORTS.mail },
    },
  };
}

/**
 * Validate native registry response (stack list) strictly according to pinned CLI contract.
 * Grounded in actual fields: id, name, project_root, branch_context, runtime, owner.
 * Rejects malformed JSON/shape, missing fields, invalid enums, duplicate IDs, and contradictory identity.
 */
export function validateRegistryResponse(parsed, context = 'stack list') {
  function regErr(msg) {
    const err = new Error(`REGISTRY_VALIDATION_FAIL: [${context}] ${msg}`);
    err.code = 'REGISTRY_VALIDATION_FAIL';
    return err;
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw regErr('Response must be a non-null object.');
  }
  if (!Array.isArray(parsed.stacks)) {
    throw regErr("Response missing required 'stacks' array.");
  }
  if (parsed.message !== undefined && typeof parsed.message !== 'string') {
    throw regErr("Field 'message' must be a string.");
  }

  const seenIds = new Set();
  const seenNameRoots = new Map();
  const ALLOWED_RUNTIMES = new Set(['native', 'docker', 'podman']);
  const ALLOWED_OWNERS = new Set(['reachable', 'unavailable']);
  const ALLOWED_STATES = new Set(['running', 'stopped', 'starting', 'paused', 'healthy', 'unhealthy']);
  const ALLOWED_STATUSES = new Set(['running', 'stopped', 'starting', 'paused', 'healthy', 'unhealthy']);

  for (let i = 0; i < parsed.stacks.length; i++) {
    const s = parsed.stacks[i];
    if (!s || typeof s !== 'object' || Array.isArray(s)) {
      throw regErr(`Stack entry at index ${i} is not a valid object.`);
    }

    const requiredFields = ['id', 'name', 'project_root', 'branch_context', 'runtime', 'owner'];
    for (const f of requiredFields) {
      if (s[f] === undefined || s[f] === null) {
        throw regErr(`Stack entry at index ${i} missing required field '${f}'.`);
      }
      if (typeof s[f] !== 'string') {
        throw regErr(`Stack entry at index ${i} field '${f}' must be a string.`);
      }
    }

    // Strict 64-char lowercase hex ID
    if (!/^[0-9a-f]{64}$/.test(s.id)) {
      throw regErr(`Stack entry at index ${i} has invalid id '${s.id}' (must be 64-character lowercase hex).`);
    }

    // Strict non-empty identity fields
    if (s.name.trim().length === 0) {
      throw regErr(`Stack entry '${s.id}' has empty name.`);
    }
    if (s.branch_context.trim().length === 0) {
      throw regErr(`Stack entry '${s.id}' has empty branch_context.`);
    }
    if (s.project_root.trim().length === 0 || !path.isAbsolute(s.project_root)) {
      throw regErr(`Stack entry '${s.id}' has invalid project_root '${s.project_root}' (must be non-empty absolute path).`);
    }

    if (!ALLOWED_RUNTIMES.has(s.runtime)) {
      throw regErr(`Stack entry '${s.id}' has invalid runtime '${s.runtime}'.`);
    }

    if (!ALLOWED_OWNERS.has(s.owner)) {
      throw regErr(`Stack entry '${s.id}' has invalid owner '${s.owner}'.`);
    }

    // Reject unsupported state/status values
    if (s.state !== undefined) {
      if (typeof s.state !== 'string' || !ALLOWED_STATES.has(s.state.toLowerCase())) {
        throw regErr(`Stack entry '${s.id}' has unsupported state '${s.state}'.`);
      }
    }
    if (s.status !== undefined) {
      if (typeof s.status !== 'string' || !ALLOWED_STATUSES.has(s.status.toLowerCase())) {
        throw regErr(`Stack entry '${s.id}' has unsupported status '${s.status}'.`);
      }
    }

    if (seenIds.has(s.id)) {
      throw regErr(`Duplicate stack id '${s.id}' in stacks array.`);
    }
    seenIds.add(s.id);

    const nameRootKey = JSON.stringify([s.name, s.project_root]);
    if (seenNameRoots.has(nameRootKey)) {
      const existingId = seenNameRoots.get(nameRootKey);
      throw regErr(`Conflicting stacks with same name and project_root ('${s.name}') under different IDs ('${existingId}' and '${s.id}').`);
    }
    seenNameRoots.set(nameRootKey, s.id);
  }

  return {
    valid: true,
    stacks: parsed.stacks,
    message: parsed.message || '',
  };
}

/**
 * Check global port mapping (ports.sqlite) read-only precheck before prune.
 */
export function checkGlobalPortReservations(stackId, expectedPorts = [54321, 54322, 54324, 54323], options = {}) {
  const adapters = options.adapters || {};
  if (adapters.portsDb) {
    return adapters.portsDb(stackId, expectedPorts);
  }

  const portsDbPath = adapters.portsDbPath || path.resolve(
    process.env.SUPABASE_HOME || path.resolve(os.homedir(), '.supabase'),
    'ports.sqlite'
  );

  if (!fs.existsSync(portsDbPath)) {
    return { quiescent: true, reservations: [] };
  }

  try {
    const db = new DatabaseSync(portsDbPath, { readOnly: true });
    try {
      const query = db.prepare('SELECT port, state_root, stack_id, endpoint FROM reservation');
      const rows = query.all();
      if (stackId) {
        const activeForStack = rows.filter(r => r.stack_id === stackId);
        if (activeForStack.length > 0) {
          return {
            quiescent: false,
            reason: `Global port reservations still active for stack ${stackId}: ports ${activeForStack.map(r => r.port).join(', ')}`,
            reservations: activeForStack,
          };
        }
      }
      if (expectedPorts && expectedPorts.length > 0) {
        const activeTargetPorts = rows.filter(r => expectedPorts.includes(r.port));
        if (activeTargetPorts.length > 0) {
          return {
            quiescent: false,
            reason: `Target ports still reserved in global port registry: ${activeTargetPorts.map(r => `${r.port} (stack ${r.stack_id})`).join(', ')}`,
            reservations: activeTargetPorts,
          };
        }
      }
      return { quiescent: true, reservations: [] };
    } finally {
      db.close();
    }
  } catch (err) {
    throw new Error(`GLOBAL_PORTS_OBSERVATION_FAIL: Cannot inspect global ports registry: ${err.message}`);
  }
}

/**
 * Reconcile task authority against actual native CLI registry (stack list).
 * Checks exact full tuple: ID, stack_name, project_root, branch_context, runtime.
 */
export function reconcileNativeRegistry({ authority, adapters = {}, cliPath } = {}) {
  const auth = authority;
  if (!auth || (!auth.bound && auth.phase !== 'BOUND') || !auth.instance_id) {
    throw new Error('RECONCILE_FAIL: Refusing to reconcile invalid or unbound local authority.');
  }

  const targetId = auth.instance_id;
  const targetName = auth.stack_name;
  const targetWorkdir = auth.workdir;
  const targetHome = auth.home_dir;

  const cliExecutor = adapters.cliExecutor || spawnSync;
  const env = buildCleanChildEnv(targetHome);

  const res = cliExecutor(cliPath, ['stack', 'list', '--workdir', targetWorkdir, '--output-format', 'json'], {
    cwd: targetWorkdir,
    env,
    encoding: 'utf8',
    timeout: 30000,
    maxBuffer: 10 * 1024 * 1024,
  });

  if (res.status !== 0) {
    throw new Error(`RECONCILE_FAIL: Native CLI stack list failed with exit code ${res.status}`);
  }

  const parsed = parseStrictJson(res.stdout, 'stack list');
  if (!parsed || !Array.isArray(parsed.stacks)) {
    throw new Error('RECONCILE_FAIL: Missing or invalid stacks array in native stack list output.');
  }

  const matches = parsed.stacks.filter(s => s.id === targetId);
  if (matches.length === 0) {
    throw new Error(`RECONCILE_FAIL: Task stack ID "${targetId}" was not found in native registry.`);
  }
  if (matches.length > 1) {
    throw new Error(`RECONCILE_FAIL: Duplicate stack ID "${targetId}" found in native registry.`);
  }
  const matching = matches[0];

  const sameNameOtherId = parsed.stacks.find(s => s.name === targetName && s.id !== targetId);
  if (sameNameOtherId) {
    throw new Error(`RECONCILE_FAIL: Stack name "${targetName}" is duplicated under a different ID.`);
  }

  // Exact tuple matching
  if (matching.name !== targetName) {
    throw new Error('RECONCILE_FAIL: Native stack name mismatch.');
  }

  const realProjectRoot = fs.realpathSync(auth.project_root);
  const realMatchingRoot = fs.existsSync(matching.project_root)
    ? fs.realpathSync(matching.project_root)
    : matching.project_root;
  if (realMatchingRoot !== realProjectRoot) {
    throw new Error('RECONCILE_FAIL: Native project_root mismatch.');
  }

  const expectedBranch = (auth.branch_ref || '').replace(/^refs\/heads\//, '');
  const matchingBranch = (matching.branch_context || '').replace(/^refs\/heads\//, '');
  if (matchingBranch !== expectedBranch) {
    throw new Error('RECONCILE_FAIL: Native branch_context mismatch.');
  }

  if (matching.runtime !== 'native') {
    throw new Error('RECONCILE_FAIL: Native runtime mismatch.');
  }

  return {
    reconciled: true,
    nativeRecord: matching,
  };
}

/**
 * Public entry for validating runtime state.
 */
export function getValidatedRuntimeState(runId = null, options = {}) {
  if (!runId && typeof options === 'string') {
    runId = options;
  }
  if (!runId && process.env.LINGORA_RUN_ID) {
    runId = process.env.LINGORA_RUN_ID;
  }
  if (!runId) {
    return { bound: false, reason: 'unallocated' };
  }
  const runsDir = options.runsDir || DEFAULT_RUNS_DIR;
  const recordPath = path.resolve(runsDir, runId, 'owner.json');
  return validateAuthorityRecord(recordPath, { ...options, expectedRunId: runId });
}

export function validateTaskBinding(recordOrPath, options = {}) {
  return validateAuthorityRecord(recordOrPath, options);
}

/**
 * Universal pending operation check.
 * Fails closed with RECOVERY_REQUIRED if authority has an in-flight operation.
 */
export function assertNoPendingOperation(authority, commandName = 'OPERATION') {
  if (authority && authority.pending_operation !== null && authority.pending_operation !== undefined) {
    const err = new Error(`${commandName.toUpperCase()}_FAIL: Existing pending operation (RECOVERY_REQUIRED). Recovery required.`);
    err.code = 'RECOVERY_REQUIRED';
    err.disposition = 'recovery-required';
    throw err;
  }
}

/**
 * Minimum 8 GiB available disk space check via statfs (CL-04).
 */
export function verifyAvailableDiskSpace(targetPath = CANONICAL_WORKSPACE_ROOT, adapters = {}) {
  const statfsFn = adapters.statfs || fs.statfsSync;
  let checkPath = targetPath;
  if (!fs.existsSync(checkPath)) {
    checkPath = path.dirname(checkPath);
    if (!fs.existsSync(checkPath)) {
      checkPath = CANONICAL_WORKSPACE_ROOT;
    }
  }

  let stat;
  try {
    stat = statfsFn(checkPath);
  } catch (err) {
    const spaceErr = new Error(`DISK_SPACE_FAIL: statfs observation failed: ${err.message || 'unknown'}`);
    spaceErr.code = 'DISK_SPACE_FAIL';
    throw spaceErr;
  }

  if (
    !stat ||
    typeof stat !== 'object' ||
    (typeof stat.bavail !== 'number' && typeof stat.bavail !== 'bigint') ||
    (typeof stat.bsize !== 'number' && typeof stat.bsize !== 'bigint')
  ) {
    const spaceErr = new Error('DISK_SPACE_FAIL: statfs returned invalid or unknown observation.');
    spaceErr.code = 'DISK_SPACE_FAIL';
    throw spaceErr;
  }

  const bavail = Number(stat.bavail);
  const bsize = Number(stat.bsize || stat.frsize || 4096);
  const availableBytes = bavail * bsize;

  if (!Number.isFinite(availableBytes) || availableBytes < 0) {
    const spaceErr = new Error('DISK_SPACE_FAIL: statfs computed available bytes is not a valid non-negative finite number.');
    spaceErr.code = 'DISK_SPACE_FAIL';
    throw spaceErr;
  }

  if (availableBytes < MINIMUM_AVAILABLE_DISK_BYTES) {
    const spaceErr = new Error(
      `DISK_SPACE_FAIL: Insufficient available disk space (${availableBytes} bytes available, minimum ${MINIMUM_AVAILABLE_DISK_BYTES} bytes / 8 GiB required).`
    );
    spaceErr.code = 'DISK_SPACE_FAIL';
    spaceErr.availableBytes = availableBytes;
    spaceErr.requiredBytes = MINIMUM_AVAILABLE_DISK_BYTES;
    throw spaceErr;
  }

  return {
    valid: true,
    availableBytes,
    requiredBytes: MINIMUM_AVAILABLE_DISK_BYTES,
  };
}

/**
 * Namespace reservation locking (CL-04).
 */
export function verifyPathSecurity(targetPath) {
  const resolved = path.resolve(targetPath);
  if (!fs.existsSync(resolved)) {
    return;
  }
  let current = resolved;
  while (current && current !== path.dirname(current)) {
    if (fs.existsSync(current)) {
      const lstat = fs.lstatSync(current);
      if (lstat.isSymbolicLink()) {
        const err = new Error(`SECURITY_FAIL: Path component "${current}" is a forbidden symbolic link.`);
        err.code = 'SECURITY_FAIL';
        throw err;
      }
    }
    current = path.dirname(current);
  }
}

/**
 * Verify pinned Supabase CLI binary existence, hash, and version.
 */
export function verifyPinnedCli(cliPath = PINNED_CLI_PATH, adapters = {}) {
  const resolved = path.resolve(cliPath || PINNED_CLI_PATH);
  verifyPathSecurity(resolved);
  if (!fs.existsSync(resolved)) {
    throw new Error(`PINNED_CLI_FAIL: Local Supabase CLI not found at "${resolved}".`);
  }
  if (fs.lstatSync(resolved).isSymbolicLink()) {
    throw new Error(`PINNED_CLI_FAIL: Supabase CLI binary cannot be a symbolic link.`);
  }
  const binaryHash = crypto.createHash('sha256').update(fs.readFileSync(resolved)).digest('hex');
  if (binaryHash !== PINNED_CLI_SHA256) {
    throw new Error(`PINNED_CLI_FAIL: Binary SHA-256 digest mismatch. Expected ${PINNED_CLI_SHA256}, got ${binaryHash}.`);
  }
  const cliExecutor = adapters.cliExecutor || spawnSync;
  const res = cliExecutor(resolved, ['--version'], {
    encoding: 'utf8',
    timeout: 10000,
  });
  if (res.status !== 0) {
    throw new Error(`PINNED_CLI_FAIL: Local Supabase CLI execution failed with exit code ${res.status}.`);
  }
  const ver = (res.stdout || '').trim();
  if (ver !== PINNED_CLI_VERSION) {
    throw new Error(`PINNED_CLI_FAIL: CLI version mismatch. Expected "${PINNED_CLI_VERSION}", got "${ver}".`);
  }
  return resolved;
}

/**
 * Create a strictly validated lock record for the caller process.
 * Never synthesizes fallback identity. Throws if caller stat or boot is unknown/invalid.
 */
export function buildStrictLockRecord({ operation, resource, runId = null }) {
  if (!operation || typeof operation !== 'string') {
    throw new Error('LOCK_SCHEMA_FAIL: Lock operation is required.');
  }
  const allowedOps = new Set(['namespace-gate', 'lifecycle', 'prune', 'recovery']);
  if (!allowedOps.has(operation)) {
    throw new Error(`LOCK_SCHEMA_FAIL: Invalid lock operation "${operation}".`);
  }
  if (!resource || typeof resource !== 'string' || !path.isAbsolute(resource)) {
    throw new Error('LOCK_SCHEMA_FAIL: Absolute canonical resource path is required.');
  }
  const isRunScoped = operation !== 'namespace-gate';
  if (isRunScoped) {
    if (!runId || typeof runId !== 'string' || runId.trim().length === 0) {
      throw new Error(`LOCK_SCHEMA_FAIL: Exact run_id is required for ${operation} lock.`);
    }
  }

  const pid = process.pid;
  if (typeof pid !== 'number' || !Number.isInteger(pid) || pid <= 0) {
    throw new Error('LOCK_ACQUIRE_FAIL: Invalid caller PID.');
  }

  const statRes = parseProcStat(pid);
  if (statRes.status !== 'KNOWN' || !statRes.stat || !statRes.stat.start_ticks) {
    throw new Error('LOCK_ACQUIRE_FAIL: Cannot verify caller process start_ticks (stat UNKNOWN).');
  }
  const startTicks = String(statRes.stat.start_ticks);
  if (!/^[1-9]\d*$/.test(startTicks)) {
    throw new Error(`LOCK_ACQUIRE_FAIL: Invalid caller start_ticks "${startTicks}".`);
  }

  const bootRes = getLinuxBootId();
  if (bootRes.status !== 'KNOWN' || !bootRes.boot_id || bootRes.boot_id === 'unknown-boot') {
    throw new Error('LOCK_ACQUIRE_FAIL: Cannot verify system boot ID (boot UNKNOWN).');
  }
  const bootId = bootRes.boot_id;

  const record = {
    token: crypto.randomUUID(),
    pid,
    start_ticks: startTicks,
    boot_id: bootId,
    operation,
    resource: path.resolve(resource),
    locked_at: new Date().toISOString(),
  };

  if (isRunScoped) {
    record.run_id = runId;
  }

  return record;
}

/**
 * Verify lock record against strict caller and target identity contracts.
 * Rejects missing fields, foreign PIDs, mismatched start_ticks/boot_id/operation/resource/run_id.
 */
export function verifyLockRecord(data, { expectedToken, expectedOperation, expectedResource, expectedRunId = null }) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    const err = new Error('LOCK_VALIDATION_FAIL: Lock record is not a valid object.');
    err.code = 'LOCK_VALIDATION_FAIL';
    throw err;
  }

  if (typeof data.token !== 'string' || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(data.token)) {
    const err = new Error('LOCK_VALIDATION_FAIL: Lock token missing or invalid.');
    err.code = 'LOCK_VALIDATION_FAIL';
    throw err;
  }
  if (typeof expectedToken !== 'string' || expectedToken.length === 0 || data.token !== expectedToken) {
    const err = new Error(`LOCK_VALIDATION_FAIL: Token mismatch. Expected "${expectedToken}", got "${data.token}".`);
    err.code = 'LOCK_VALIDATION_FAIL';
    throw err;
  }

  if (typeof data.pid !== 'number' || !Number.isSafeInteger(data.pid) || data.pid <= 0) {
    const err = new Error('LOCK_VALIDATION_FAIL: Lock pid missing or invalid.');
    err.code = 'LOCK_VALIDATION_FAIL';
    throw err;
  }
  if (data.pid !== process.pid) {
    const err = new Error(`LOCK_VALIDATION_FAIL: Lock held by foreign PID ${data.pid}, caller is PID ${process.pid}.`);
    err.code = 'LOCK_VALIDATION_FAIL';
    throw err;
  }

  if (typeof data.start_ticks !== 'string' || !/^[1-9]\d*$/.test(data.start_ticks)) {
    const err = new Error('LOCK_VALIDATION_FAIL: Lock start_ticks missing or non-numeric/zero.');
    err.code = 'LOCK_VALIDATION_FAIL';
    throw err;
  }

  const statRes = parseProcStat(process.pid);
  if (statRes.status !== 'KNOWN' || !statRes.stat || !statRes.stat.start_ticks) {
    const err = new Error('LOCK_VALIDATION_FAIL: Cannot verify caller process identity (stat UNKNOWN).');
    err.code = 'LOCK_VALIDATION_FAIL';
    throw err;
  }
  if (String(data.start_ticks) !== String(statRes.stat.start_ticks)) {
    const err = new Error(`LOCK_VALIDATION_FAIL: Caller start_ticks mismatch ("${data.start_ticks}" != "${statRes.stat.start_ticks}").`);
    err.code = 'LOCK_VALIDATION_FAIL';
    throw err;
  }

  if (typeof data.boot_id !== 'string' || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(data.boot_id)) {
    const err = new Error('LOCK_VALIDATION_FAIL: Lock boot_id missing or invalid.');
    err.code = 'LOCK_VALIDATION_FAIL';
    throw err;
  }

  const bootRes = getLinuxBootId();
  if (bootRes.status !== 'KNOWN' || !bootRes.boot_id || bootRes.boot_id === 'unknown-boot') {
    const err = new Error('LOCK_VALIDATION_FAIL: Cannot verify system boot ID (boot UNKNOWN).');
    err.code = 'LOCK_VALIDATION_FAIL';
    throw err;
  }
  if (data.boot_id !== bootRes.boot_id) {
    const err = new Error(`LOCK_VALIDATION_FAIL: Boot ID mismatch ("${data.boot_id}" != "${bootRes.boot_id}").`);
    err.code = 'LOCK_VALIDATION_FAIL';
    throw err;
  }

  if (expectedOperation) {
    if (data.operation !== expectedOperation) {
      const err = new Error(`LOCK_VALIDATION_FAIL: Operation mismatch. Expected "${expectedOperation}", got "${data.operation}".`);
      err.code = 'LOCK_VALIDATION_FAIL';
      throw err;
    }
  }

  if (expectedResource) {
    const canonicalExpected = path.resolve(expectedResource);
    if (typeof data.resource !== 'string' || data.resource !== canonicalExpected) {
      const err = new Error(`LOCK_VALIDATION_FAIL: Resource mismatch. Expected "${canonicalExpected}", got "${data.resource}".`);
      err.code = 'LOCK_VALIDATION_FAIL';
      throw err;
    }
  }

  const isRunScoped = expectedOperation ? expectedOperation !== 'namespace-gate' : !!expectedRunId;
  if (isRunScoped || expectedRunId) {
    if (!data.run_id || typeof data.run_id !== 'string') {
      const err = new Error('LOCK_VALIDATION_FAIL: Lock run_id missing or invalid.');
      err.code = 'LOCK_VALIDATION_FAIL';
      throw err;
    }
    if (expectedRunId && data.run_id !== expectedRunId) {
      const err = new Error(`LOCK_VALIDATION_FAIL: run_id mismatch. Expected "${expectedRunId}", got "${data.run_id}".`);
      err.code = 'LOCK_VALIDATION_FAIL';
      throw err;
    }
  }

  return true;
}

export function acquireNamespaceReservation(runsDir = DEFAULT_RUNS_DIR) {
  verifyPathSecurity(runsDir);
  if (!fs.existsSync(runsDir)) {
    fs.mkdirSync(runsDir, { recursive: true, mode: 0o700 });
  }
  const runsStat = fs.statSync(runsDir);
  if (process.getuid && runsStat.uid !== process.getuid()) {
    throw new Error(`SECURITY_FAIL: runsDir UID mismatch (${runsStat.uid} != ${process.getuid()}).`);
  }
  if ((runsStat.mode & 0o777) !== 0o700) {
    throw new Error(`SECURITY_FAIL: Insecure runsDir permissions ${(runsStat.mode & 0o777).toString(8)} (must be 0700).`);
  }
  const canonicalRunsDir = fs.realpathSync(runsDir);
  const lockFile = path.resolve(canonicalRunsDir, '.namespace.lock');
  const lockData = buildStrictLockRecord({
    operation: 'namespace-gate',
    resource: canonicalRunsDir,
  });

  try {
    const fd = fs.openSync(lockFile, 'wx', 0o600);
    try {
      fs.writeSync(fd, JSON.stringify(lockData, null, 2), 0, 'utf8');
      fs.fsyncSync(fd);
    } finally {
      fs.closeSync(fd);
    }
    const dirFd = fs.openSync(canonicalRunsDir, 'r');
    try {
      fs.fsyncSync(dirFd);
    } finally {
      fs.closeSync(dirFd);
    }
    return { lockFile, token: lockData.token };
  } catch (err) {
    if (err.code === 'EEXIST') {
      try {
        const existingData = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
        if (existingData.pid && isProcessAlive(existingData.pid, existingData.start_ticks, existingData.boot_id)) {
          const lockErr = new Error(`LOCKED: Namespace reservation lock held in "${runsDir}".`);
          lockErr.code = 'LOCKED';
          throw lockErr;
        }
      } catch (parseOrAliveErr) {
        if (parseOrAliveErr.code === 'LOCKED') throw parseOrAliveErr;
      }
      const lockErr = new Error(`LOCKED: Namespace reservation lock held in "${runsDir}".`);
      lockErr.code = 'LOCKED';
      throw lockErr;
    }
    throw err;
  }
}

export function releaseNamespaceReservation(runsDir = DEFAULT_RUNS_DIR, token) {
  const canonicalRunsDir = fs.existsSync(runsDir) ? fs.realpathSync(runsDir) : path.resolve(runsDir);
  const lockFile = path.resolve(canonicalRunsDir, '.namespace.lock');
  if (!fs.existsSync(lockFile)) {
    const err = new Error(`LOCK_RELEASE_FAIL: Namespace reservation lock not found in "${runsDir}".`);
    err.code = 'LOCK_RELEASE_FAIL';
    throw err;
  }
  let data;
  try {
    data = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
  } catch {
    const err = new Error(`LOCK_RELEASE_FAIL: Corrupted namespace lock in "${runsDir}".`);
    err.code = 'LOCK_RELEASE_FAIL';
    throw err;
  }
  try {
    verifyLockRecord(data, {
      expectedToken: token,
      expectedOperation: 'namespace-gate',
      expectedResource: canonicalRunsDir,
    });
  } catch (valErr) {
    const err = new Error(`LOCK_RELEASE_FAIL: ${valErr.message}`);
    err.code = 'LOCK_RELEASE_FAIL';
    throw err;
  }
  fs.unlinkSync(lockFile);
  try {
    const dirFd = fs.openSync(canonicalRunsDir, 'r');
    try {
      fs.fsyncSync(dirFd);
    } finally {
      fs.closeSync(dirFd);
    }
  } catch {}
}

/**
 * Universal namespace cleanliness guard (CL-04).
 */
export function verifyNamespaceClean(runsDir = DEFAULT_RUNS_DIR, { heldNamespaceToken } = {}) {
  verifyPathSecurity(runsDir);
  if (!fs.existsSync(runsDir)) {
    return { clean: true, count: 0 };
  }
  const dirStat = fs.statSync(runsDir);
  if (!dirStat.isDirectory() || fs.lstatSync(runsDir).isSymbolicLink()) {
    const err = new Error(`PENDING_GUARD_FAIL: Namespace root "${runsDir}" is not a directory or is a symbolic link.`);
    err.code = 'PENDING_GUARD_FAIL';
    throw err;
  }
  if (process.getuid && dirStat.uid !== process.getuid()) {
    const err = new Error(`PENDING_GUARD_FAIL: Namespace directory UID mismatch.`);
    err.code = 'PENDING_GUARD_FAIL';
    throw err;
  }
  if ((dirStat.mode & 0o777) !== 0o700) {
    const err = new Error(`PENDING_GUARD_FAIL: Insecure namespace directory permissions.`);
    err.code = 'PENDING_GUARD_FAIL';
    throw err;
  }

  // A caller reusing its gate must prove complete ownership; PID alone is insufficient.
  const nsLockFile = path.resolve(runsDir, '.namespace.lock');
  if (fs.existsSync(nsLockFile) || heldNamespaceToken) {
    try {
      verifyLockRecord(JSON.parse(fs.readFileSync(nsLockFile, 'utf8')), {
        expectedToken: heldNamespaceToken,
        expectedOperation: 'namespace-gate',
        expectedResource: fs.realpathSync(runsDir),
      });
    } catch {
      const err = new Error('PENDING_GUARD_FAIL: Namespace reservation ownership cannot be verified.');
      err.code = 'PENDING_GUARD_FAIL';
      throw err;
    }
  }

  const entries = fs.readdirSync(runsDir);
  let checkedCount = 0;
  for (const entry of entries) {
    if (entry === '.namespace.lock' || entry === 'telemetry.json') {
      continue;
    }
    if (!/^run-[a-f0-9]{8,32}$/i.test(entry)) {
      const err = new Error(`PENDING_GUARD_FAIL: Foreign or unknown entry "${entry}" in authorized namespace "${runsDir}".`);
      err.code = 'PENDING_GUARD_FAIL';
      throw err;
    }

    const runDir = path.resolve(runsDir, entry);
    let stat;
    try {
      stat = fs.lstatSync(runDir);
    } catch {
      const err = new Error(`PENDING_GUARD_FAIL: Cannot stat namespace entry "${entry}".`);
      err.code = 'PENDING_GUARD_FAIL';
      throw err;
    }

    if (!stat.isDirectory() || stat.isSymbolicLink()) {
      const err = new Error(`PENDING_GUARD_FAIL: Namespace entry "${entry}" is not a regular directory or is a symbolic link.`);
      err.code = 'PENDING_GUARD_FAIL';
      throw err;
    }

    if (process.getuid && stat.uid !== process.getuid()) {
      const err = new Error(`PENDING_GUARD_FAIL: Namespace entry "${entry}" UID mismatch.`);
      err.code = 'PENDING_GUARD_FAIL';
      throw err;
    }

    if ((stat.mode & 0o777) !== 0o700) {
      const err = new Error(`PENDING_GUARD_FAIL: Namespace entry "${entry}" permissions must be 0700.`);
      err.code = 'PENDING_GUARD_FAIL';
      throw err;
    }

    if (fs.realpathSync(runDir) !== runDir) {
      const err = new Error(`PENDING_GUARD_FAIL: Namespace entry "${entry}" contains forbidden symlinks.`);
      err.code = 'PENDING_GUARD_FAIL';
      throw err;
    }

    // Check locks
    for (const lockName of ['.run.lock', '.recovery.lock', '.prune.lock']) {
      const lf = path.resolve(runDir, lockName);
      if (fs.existsSync(lf)) {
        const err = new Error(`PENDING_GUARD_FAIL: Active or unresolved lock held in "${entry}" (${lockName}). Recovery required.`);
        err.code = 'PENDING_GUARD_FAIL';
        throw err;
      }
    }

    // Check owner.json
    const ownerFile = path.resolve(runDir, 'owner.json');
    if (!fs.existsSync(ownerFile)) {
      const err = new Error(`PENDING_GUARD_FAIL: Missing authority record in "${entry}".`);
      err.code = 'PENDING_GUARD_FAIL';
      throw err;
    }

    let owner;
    try {
      owner = validateAuthorityRecord(ownerFile, { runsDir, expectedRunId: entry });
    } catch (valErr) {
      const err = new Error(`PENDING_GUARD_FAIL: Authority validation failed for "${entry}": ${valErr.message}`);
      err.code = 'PENDING_GUARD_FAIL';
      throw err;
    }

    if (owner.pending_operation !== null) {
      const err = new Error(
        `PENDING_GUARD_FAIL: Run "${entry}" has pending_operation "${owner.pending_operation}". Recovery required.`
      );
      err.code = 'PENDING_GUARD_FAIL';
      throw err;
    }

    if (owner.phase !== 'DESTROYED') {
      const err = new Error(
        `PENDING_GUARD_FAIL: Run "${entry}" is in phase "${owner.phase}" (expected DESTROYED). Recovery or termination required.`
      );
      err.code = 'PENDING_GUARD_FAIL';
      throw err;
    }

    if (owner.tombstone !== true) {
      const err = new Error(`PENDING_GUARD_FAIL: Run "${entry}" lacks verified tombstone=true.`);
      err.code = 'PENDING_GUARD_FAIL';
      throw err;
    }

    // Native state files must be ABSENT
    if (owner.instance_id) {
      const homeDir = owner.home_dir || path.resolve(runDir, 'home');
      const absent = verifyNativeStateFilesAbsent(homeDir, owner.instance_id);
      if (absent !== 'ABSENT') {
        const err = new Error(`PENDING_GUARD_FAIL: Run "${entry}" native state files are not ABSENT.`);
        err.code = 'PENDING_GUARD_FAIL';
        throw err;
      }
    }

    checkedCount++;
  }

  return { clean: true, count: checkedCount };
}

/**
 * Hardlink-aware size calculation (CL-03, C4).
 * Accurately measures allocated blocks (stat.blocks * 512).
 * Fails closed on unreadable files instead of silently swallowing errors.
 * Accounts for external hardlinks: data blocks are only counted as bytesFreed
 * if all hardlinks to the inode are contained within targetDir.
 */
export function calculateAllocatedBytes(targetDir, options = {}) {
  if (!fs.existsSync(targetDir)) {
    return options.detailed ? { bytesFreed: 0, allocatedFootprint: 0, externallyLinkedFiles: 0 } : 0;
  }
  const inodeCounts = new Map();
  const inodeInfo = new Map();

  function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (err) {
      const readErr = new Error(`READ_FAIL: Cannot read directory "${dir}": ${err.message}`);
      readErr.code = 'READ_FAIL';
      throw readErr;
    }
    for (const ent of entries) {
      const fullPath = path.join(dir, ent.name);
      let stat;
      try {
        stat = fs.lstatSync(fullPath);
      } catch (err) {
        const statErr = new Error(`STAT_FAIL: Cannot stat path "${fullPath}": ${err.message}`);
        statErr.code = 'STAT_FAIL';
        throw statErr;
      }
      if (stat.isSymbolicLink()) {
        continue;
      }
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (stat.isFile()) {
        const inodeKey = `${stat.dev}:${stat.ino}`;
        const blocks = stat.blocks !== undefined ? stat.blocks * 512 : stat.size;
        const currentCount = inodeCounts.get(inodeKey) || 0;
        inodeCounts.set(inodeKey, currentCount + 1);
        if (!inodeInfo.has(inodeKey)) {
          inodeInfo.set(inodeKey, { nlink: stat.nlink, blocks });
        }
      }
    }
  }

  walk(targetDir);

  let allocatedFootprint = 0;
  let bytesFreed = 0;
  let externallyLinkedFiles = 0;

  for (const [inodeKey, info] of inodeInfo.entries()) {
    allocatedFootprint += info.blocks;
    const countInSubtree = inodeCounts.get(inodeKey) || 0;
    // An inode's data blocks are physically freed ONLY when all existing hardlinks to it are removed.
    // If countInSubtree < info.nlink, there is at least one link outside targetDir, so removing
    // targetDir does not physically free the disk blocks for this inode.
    if (countInSubtree >= info.nlink) {
      bytesFreed += info.blocks;
    } else {
      externallyLinkedFiles++;
    }
  }

  if (options.detailed) {
    return {
      bytesFreed,
      allocatedFootprint,
      externallyLinkedFiles,
    };
  }
  return bytesFreed;
}

/**
 * Minimal legacy prune-only validator for authorized historical roots (CL-03).
 * Validates exact two canonical retained root/ID tuples:
 * 1. run-1fab09c87d538b05: canonical workspace root and config
 * 2. run-70c765fff1ad8203: owned fixture root and fixture config
 * Rejects missing/non-null pending_operation, wrong tasks, wrong phases, or mismatched tuples.
 */
export function validateLegacyAuthorityRecord(ownerFile, realRunDir) {
  if (!ownerFile || !fs.existsSync(ownerFile)) {
    throw new Error('PRUNE_FAIL: Authority record missing.');
  }
  if (!EXACT_AUTHORIZED_LEGACY_PRUNE_PATHS.has(realRunDir) || ownerFile !== path.join(realRunDir, 'owner.json')) {
    throw new Error('PRUNE_FAIL: Legacy canonical root/owner path mismatch.');
  }
  if (fs.lstatSync(ownerFile).isSymbolicLink()) {
    throw new Error('PRUNE_FAIL: Authority record cannot be a symbolic link.');
  }
  const ownerStat = fs.statSync(ownerFile);
  if (process.getuid && ownerStat.uid !== process.getuid()) {
    throw new Error('PRUNE_FAIL: Authority record UID mismatch.');
  }
  if ((ownerStat.mode & 0o777) !== 0o600) {
    throw new Error('PRUNE_FAIL: Insecure authority record permissions (must be 0600).');
  }

  let authority;
  try {
    authority = JSON.parse(fs.readFileSync(ownerFile, 'utf8'));
  } catch {
    throw new Error('PRUNE_FAIL: Corrupted legacy authority record.');
  }

  if (!authority || typeof authority !== 'object' || Array.isArray(authority)) {
    throw new Error('PRUNE_FAIL: Legacy authority record is not an object.');
  }

  const runId = path.basename(realRunDir);
  if (!AUTHORIZED_LEGACY_PRUNE_ROOTS.has(runId)) {
    throw new Error(`PRUNE_FAIL: Run "${runId}" is not an authorized legacy prune root.`);
  }

  if (authority.format_version !== '1.0') {
    throw new Error(`PRUNE_FAIL: Unsupported legacy format version "${authority.format_version}".`);
  }
  if (authority.task_id !== 'wp00-g0-d1-d2') {
    throw new Error(`PRUNE_FAIL: Legacy task_id mismatch ("${authority.task_id}").`);
  }
  if (authority.run_id !== runId) {
    throw new Error(`PRUNE_FAIL: Legacy run_id mismatch ("${authority.run_id}" != "${runId}").`);
  }
  if (authority.phase !== 'DESTROYED') {
    throw new Error(`PRUNE_FAIL: Refusing to prune non-DESTROYED run (phase: "${authority.phase}").`);
  }
  // Strict: pending_operation must be exactly null (rejecting missing, undefined, or non-null string)
  if (authority.pending_operation !== null) {
    throw new Error(`PRUNE_FAIL: Refusing to prune run with pending_operation "${authority.pending_operation}".`);
  }
  if (authority.tombstone !== true) {
    throw new Error('PRUNE_FAIL: Refusing to prune legacy run without verified tombstone=true.');
  }
  if (authority.runtime !== 'native') {
    throw new Error(`PRUNE_FAIL: Incomplete legacy authority tuple: runtime "${authority.runtime}".`);
  }
  if (authority.branch_ref !== 'refs/heads/main') {
    throw new Error(`PRUNE_FAIL: Legacy branch_ref mismatch ("${authority.branch_ref}").`);
  }
  if (authority.cli_version !== PINNED_CLI_VERSION) {
    throw new Error(`PRUNE_FAIL: Legacy cli_version mismatch ("${authority.cli_version}").`);
  }
  if (authority.cli_digest !== PINNED_CLI_SHA256) {
    throw new Error(`PRUNE_FAIL: Legacy cli_digest mismatch ("${authority.cli_digest}").`);
  }

  const expectedInstance = KNOWN_LEGACY_RUN_INSTANCES[runId];
  if (!expectedInstance || authority.instance_id !== expectedInstance) {
    throw new Error(`PRUNE_FAIL: Legacy instance ID mismatch (expected "${expectedInstance}", found "${authority.instance_id}").`);
  }

  const expectedLegacyHome = path.resolve(realRunDir, 'home');
  if (authority.home_dir !== expectedLegacyHome || authority.control_root !== realRunDir) {
    throw new Error('PRUNE_FAIL: Legacy home_dir or control_root path binding mismatch.');
  }

  if (runId === 'run-1fab09c87d538b05') {
    if (authority.stack_name !== 'lingora-wp00-f827ab19') {
      throw new Error(`PRUNE_FAIL: Legacy stack_name mismatch for run-1fab09c87d538b05 ("${authority.stack_name}").`);
    }
    if (authority.project_root !== CANONICAL_WORKSPACE_ROOT || authority.workdir !== CANONICAL_WORKSPACE_ROOT) {
      throw new Error('PRUNE_FAIL: Legacy project_root/workdir mismatch with canonical workspace root.');
    }
    const expectedLegacyConfig = path.resolve(CANONICAL_WORKSPACE_ROOT, 'supabase/config.toml');
    if (authority.config_path !== expectedLegacyConfig) {
      throw new Error('PRUNE_FAIL: Legacy config_path does not match canonical config.');
    }
    if (!fs.existsSync(expectedLegacyConfig)) {
      throw new Error('PRUNE_FAIL: Canonical config file missing for legacy validation.');
    }
    const curConfigHash = crypto.createHash('sha256').update(fs.readFileSync(expectedLegacyConfig)).digest('hex');
    if (authority.config_digest !== curConfigHash) {
      throw new Error('PRUNE_FAIL: Legacy config_digest does not match canonical config hash.');
    }
  } else if (runId === 'run-70c765fff1ad8203') {
    if (authority.stack_name !== 'lingora-wp00-2101fcc4') {
      throw new Error(`PRUNE_FAIL: Legacy stack_name mismatch for run-70c765fff1ad8203 ("${authority.stack_name}").`);
    }
    const expectedFixtureRoot = path.resolve(realRunDir, 'fixture');
    if (authority.project_root !== expectedFixtureRoot || authority.workdir !== expectedFixtureRoot) {
      throw new Error('PRUNE_FAIL: Legacy project_root/workdir mismatch with owned fixture root.');
    }
    const expectedFixtureConfig = path.resolve(expectedFixtureRoot, 'supabase/config.toml');
    if (authority.config_path !== expectedFixtureConfig) {
      throw new Error('PRUNE_FAIL: Legacy config_path does not match fixture config.');
    }
    if (!fs.existsSync(expectedFixtureConfig)) {
      throw new Error('PRUNE_FAIL: Owned fixture config file missing for legacy validation.');
    }
    const curConfigHash = crypto.createHash('sha256').update(fs.readFileSync(expectedFixtureConfig)).digest('hex');
    if (authority.config_digest !== curConfigHash) {
      throw new Error('PRUNE_FAIL: Legacy config_digest does not match fixture config hash.');
    }
  } else {
    throw new Error(`PRUNE_FAIL: Unknown legacy run ID "${runId}".`);
  }

  return authority;
}

/**
 * Prune regenerable per-run cache under exclusive ownership (CL-03, CL-04).
 */
export function pruneRunCache(runDir, options = {}) {
  const adapters = options.adapters || {};
  const cliExecutor = adapters.cliExecutor || spawnSync;
  if (!runDir || !fs.existsSync(runDir)) {
    throw new Error('PRUNE_FAIL: Run directory does not exist.');
  }

  verifyPathSecurity(runDir);
  const realRunDir = fs.realpathSync(runDir);
  if (fs.lstatSync(runDir).isSymbolicLink() || realRunDir !== path.resolve(runDir)) {
    throw new Error('PRUNE_FAIL: Run directory cannot be a symbolic link or escape.');
  }

  const runStat = fs.statSync(realRunDir);
  if (process.getuid && runStat.uid !== process.getuid()) {
    throw new Error('PRUNE_FAIL: Run directory UID mismatch.');
  }
  if ((runStat.mode & 0o777) !== 0o700) {
    throw new Error('PRUNE_FAIL: Run directory permissions must be 0700.');
  }

  const runId = path.basename(realRunDir);
  const runsDir = path.dirname(realRunDir);
  const isLegacy = EXACT_AUTHORIZED_LEGACY_PRUNE_PATHS.has(realRunDir);

  let authority;
  const ownerFile = path.resolve(realRunDir, 'owner.json');
  if (!fs.existsSync(ownerFile)) {
    throw new Error('PRUNE_FAIL: Authority record missing.');
  }
  if (fs.lstatSync(ownerFile).isSymbolicLink()) {
    throw new Error('PRUNE_FAIL: Authority record cannot be a symbolic link.');
  }
  const ownerStat = fs.statSync(ownerFile);
  if (process.getuid && ownerStat.uid !== process.getuid()) {
    throw new Error('PRUNE_FAIL: Authority record UID mismatch.');
  }
  if ((ownerStat.mode & 0o777) !== 0o600) {
    throw new Error('PRUNE_FAIL: Insecure authority record permissions (must be 0600).');
  }

  if (isLegacy) {
    // Narrowly bounded validation for authorized legacy roots (CL-03)
    authority = validateLegacyAuthorityRecord(ownerFile, realRunDir);
  } else {
    // Normal namespace runs: full validation via validateAuthorityRecord
    try {
      authority = validateAuthorityRecord(ownerFile, { runsDir, expectedRunId: runId });
    } catch (err) {
      throw new Error(`PRUNE_FAIL: Authority record validation failed: ${err.message}`);
    }
    if (authority.phase !== 'DESTROYED') {
      throw new Error(`PRUNE_FAIL: Refusing to prune non-DESTROYED run (phase: "${authority.phase}").`);
    }
    if (authority.pending_operation !== null || authority.rawAuthority.pending_operation !== null) {
      throw new Error(`PRUNE_FAIL: Refusing to prune run with pending_operation "${authority.pending_operation}".`);
    }
    if (authority.tombstone !== true || authority.rawAuthority.tombstone !== true) {
      throw new Error('PRUNE_FAIL: Refusing to prune run without verified tombstone=true.');
    }
  }

  // Exclusive lock verification
  const lockFile = path.resolve(realRunDir, '.run.lock');
  const recLockFile = path.resolve(realRunDir, '.recovery.lock');
  const pruneLockFile = path.resolve(realRunDir, '.prune.lock');
  let acquiredPruneLock = false;
  let pruneToken = null;
  let acquiredNsLock = false;
  let nsToken = null;

  if (options.heldLockToken) {
    if (options.isPostRecovery) {
      if (!fs.existsSync(recLockFile)) {
        throw new Error('PRUNE_FAIL: Caller claims post-recovery held lock, but .recovery.lock does not exist.');
      }
      let recData;
      try {
        recData = JSON.parse(fs.readFileSync(recLockFile, 'utf8'));
      } catch {
        throw new Error('PRUNE_FAIL: Corrupted .recovery.lock when verifying caller lock.');
      }
      try {
        verifyLockRecord(recData, {
          expectedToken: options.heldLockToken,
          expectedOperation: 'recovery',
          expectedResource: realRunDir,
          expectedRunId: runId,
        });
      } catch (valErr) {
        throw new Error(`PRUNE_FAIL: Caller does not hold verified recovery lock: ${valErr.message}`);
      }
      if (!options.heldNamespaceToken) {
        throw new Error('PRUNE_FAIL: Post-recovery prune requires held namespace reservation.');
      }
      {
        const canonicalParent = path.dirname(realRunDir);
        const nsLockFile = path.resolve(canonicalParent, '.namespace.lock');
        if (!fs.existsSync(nsLockFile)) {
          throw new Error('PRUNE_FAIL: Held namespace reservation lock not found.');
        }
        let nsData;
        try { nsData = JSON.parse(fs.readFileSync(nsLockFile, 'utf8')); } catch {}
        try {
          verifyLockRecord(nsData, {
            expectedToken: options.heldNamespaceToken,
            expectedOperation: 'namespace-gate',
            expectedResource: canonicalParent,
          });
        } catch (valErr) {
          throw new Error(`PRUNE_FAIL: Held namespace reservation validation failed: ${valErr.message}`);
        }
      }
    } else {
      if (!fs.existsSync(lockFile)) {
        throw new Error('PRUNE_FAIL: Caller claims held lock, but .run.lock does not exist.');
      }
      let lockData;
      try {
        lockData = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
      } catch {
        throw new Error('PRUNE_FAIL: Corrupted .run.lock when verifying caller lock.');
      }
      try {
        verifyLockRecord(lockData, {
          expectedToken: options.heldLockToken,
          expectedOperation: 'lifecycle',
          expectedResource: realRunDir,
          expectedRunId: runId,
        });
      } catch (valErr) {
        throw new Error(`PRUNE_FAIL: Caller does not hold verified run lock: ${valErr.message}`);
      }
    }
  } else {
    // Standalone prune: acquire namespace reservation first to gate all cross-path contenders (including legacy roots)
    try {
      const res = acquireNamespaceReservation(runsDir);
      acquiredNsLock = true;
      nsToken = res.token;
    } catch (err) {
      throw err;
    }
    // Check .run.lock and .recovery.lock under namespace reservation
    if (fs.existsSync(lockFile)) {
      if (acquiredNsLock && nsToken) releaseNamespaceReservation(runsDir, nsToken);
      throw new Error('PRUNE_FAIL: Run lock is held. Cannot prune locked run.');
    }
    if (fs.existsSync(recLockFile)) {
      if (acquiredNsLock && nsToken) releaseNamespaceReservation(runsDir, nsToken);
      throw new Error('PRUNE_FAIL: Recovery lock is held. Cannot prune recovering run.');
    }
    // Acquire exclusive .prune.lock
    const pruneLockData = buildStrictLockRecord({
      operation: 'prune',
      resource: realRunDir,
      runId,
    });
    pruneToken = pruneLockData.token;
    try {
      const fd = fs.openSync(pruneLockFile, 'wx', 0o600);
      try {
        fs.writeSync(fd, JSON.stringify(pruneLockData, null, 2), 0, 'utf8');
        fs.fsyncSync(fd);
      } finally {
        fs.closeSync(fd);
      }
      acquiredPruneLock = true;
    } catch (err) {
      if (acquiredNsLock && nsToken) releaseNamespaceReservation(runsDir, nsToken);
      if (err.code === 'EEXIST') {
        throw new Error('PRUNE_FAIL: Competing prune lock held.');
      }
      throw err;
    }
  }

  try {
    const homeDir = isLegacy ? path.resolve(realRunDir, 'home') : authority.home_dir;
    verifyPathSecurity(homeDir);
    if (!isSafeChildPath(realRunDir, homeDir)) {
      throw new Error('PRUNE_FAIL: home_dir escapes run directory.');
    }

    const cacheDir = path.resolve(homeDir, 'cache');
    try {
      const cacheLstat = fs.lstatSync(cacheDir);
      if (cacheLstat.isSymbolicLink()) {
        throw new Error('PRUNE_FAIL: home/cache is a forbidden symbolic link.');
      }
    } catch (err) {
      if (err.message.startsWith('PRUNE_FAIL:')) throw err;
      if (err.code !== 'ENOENT') throw err;
    }
    if (fs.existsSync(cacheDir) && !isSafeChildPath(homeDir, cacheDir)) {
      throw new Error('PRUNE_FAIL: home/cache escapes home directory.');
    }

    // Preconditions (Quiescence before deletion)
    if (authority.instance_id) {
      const absent = verifyNativeStateFilesAbsent(homeDir, authority.instance_id);
      if (absent !== 'ABSENT') {
        throw new Error(`PRUNE_FAIL: Native state files are not ABSENT (${absent}).`);
      }
    }

    const rawWorkdir = authority.workdir;
    const workdir = (rawWorkdir && rawWorkdir !== CANONICAL_WORKSPACE_ROOT) ? rawWorkdir : null;
    const procSnapFn = (adapters && adapters.snapshotRunProcesses) || snapshotRunProcesses;
    const procSnap = validateProcessSnapshot(procSnapFn(homeDir, workdir, authority.instance_id, { runDir: realRunDir }));
    if (procSnap.status !== 'KNOWN' || procSnap.processes.length > 0) {
      throw new Error('PRUNE_FAIL: Run processes are not quiescent.');
    }

    const sockQuiescent = verifySocketsQuiescent([54321, 54322, 54324, 54323], 10, 300, { adapters });
    if (!sockQuiescent) {
      throw new Error('PRUNE_FAIL: Sockets are not quiescent.');
    }

    // Read-only precheck: native provider registry (runs for normal and legacy runs)
    if (authority.instance_id) {
      const cliPath = verifyPinnedCli(adapters.cliPath || PINNED_CLI_PATH, adapters);
      const cleanEnv = buildCleanChildEnv(homeDir);
      const listRes = cliExecutor(
        cliPath,
        ['stack', 'list', '--workdir', authority.workdir || CANONICAL_WORKSPACE_ROOT, '--output-format', 'json'],
        { cwd: authority.workdir || CANONICAL_WORKSPACE_ROOT, env: cleanEnv, encoding: 'utf8', timeout: 30000, maxBuffer: 10 * 1024 * 1024 }
      );
      if (listRes.status !== 0) {
        throw new Error(`PRUNE_FAIL: Native registry check failed with code ${listRes.status}.`);
      }
      const listParsed = parseStrictJson(listRes.stdout, 'stack list (prune precheck)');
      const validated = validateRegistryResponse(listParsed, 'stack list (prune precheck)');
      if (validated.stacks.some(s => s.id === authority.instance_id ||
          (s.name === authority.stack_name && s.project_root === authority.workdir))) {
        throw new Error(`PRUNE_FAIL: Stack ID "${authority.instance_id}" is still registered in provider registry.`);
      }
    }

    // Read-only precheck: global port reservations
    const portCheck = checkGlobalPortReservations(authority.instance_id, [54321, 54322, 54324, 54323], { adapters });
    if (!portCheck.quiescent) {
      throw new Error(`PRUNE_FAIL: ${portCheck.reason}`);
    }

    // Check cache directory
    if (!fs.existsSync(cacheDir)) {
      return {
        pruned: true,
        alreadyPruned: true,
        bytesFreed: 0,
        allocatedFootprint: 0,
        cachePath: cacheDir,
      };
    }

    const sizeStats = calculateAllocatedBytes(cacheDir, { detailed: true });

    // Final pre-removal quiescence verification under exclusive lock to close observation-to-delete gap
    const finalProcSnap = validateProcessSnapshot(procSnapFn(homeDir, workdir, authority.instance_id, { runDir: realRunDir }));
    if (finalProcSnap.status !== 'KNOWN' || finalProcSnap.processes.length > 0) {
      throw new Error('PRUNE_FAIL: Run processes are not quiescent (detected during final pre-removal verification).');
    }

    const ownMarker = options.heldLockToken ? (options.isPostRecovery ? recLockFile : lockFile) : pruneLockFile;
    verifyLockRecord(JSON.parse(fs.readFileSync(ownMarker, 'utf8')), {
      expectedToken: options.heldLockToken || pruneToken,
      expectedOperation: options.heldLockToken ? (options.isPostRecovery ? 'recovery' : 'lifecycle') : 'prune',
      expectedResource: realRunDir, expectedRunId: runId,
    });
    const ownedNamespaceToken = nsToken || options.heldNamespaceToken;
    if (ownedNamespaceToken) verifyLockRecord(JSON.parse(fs.readFileSync(path.join(runsDir, '.namespace.lock'), 'utf8')), {
      expectedToken: ownedNamespaceToken, expectedOperation: 'namespace-gate', expectedResource: runsDir,
    });

    const rmFn = adapters.rmSync || fs.rmSync;
    try {
      rmFn(cacheDir, { recursive: true, force: false });
    } catch (err) {
      const pruneErr = new Error(`CLEANUP_INCOMPLETE: Removal failed: ${err.message}`);
      pruneErr.code = 'CLEANUP_INCOMPLETE';
      throw pruneErr;
    }

    if (fs.existsSync(cacheDir)) {
      const pruneErr = new Error('CLEANUP_INCOMPLETE: Cache directory still exists after removal.');
      pruneErr.code = 'CLEANUP_INCOMPLETE';
      throw pruneErr;
    }

    return {
      pruned: true,
      alreadyPruned: false,
      bytesFreed: sizeStats.bytesFreed,
      allocatedFootprint: sizeStats.allocatedFootprint,
      cachePath: cacheDir,
    };
  } finally {
    if (acquiredPruneLock && pruneLockFile && fs.existsSync(pruneLockFile)) {
      try {
        const content = fs.readFileSync(pruneLockFile, 'utf8');
        const data = JSON.parse(content);
        verifyLockRecord(data, {
          expectedToken: pruneToken,
          expectedOperation: 'prune',
          expectedResource: realRunDir,
          expectedRunId: runId,
        });
        fs.unlinkSync(pruneLockFile);
      } catch {}
    }
    if (acquiredNsLock && nsToken) {
      releaseNamespaceReservation(runsDir, nsToken);
    }
  }
}

/**
 * Exact runtime recovery for positively owned pending runs (CL-02).
 */
export function recoverPendingRun(runDir, options = {}) {
  const adapters = options.adapters || {};
  const cliExecutor = adapters.cliExecutor || spawnSync;

  if (!runDir || !fs.existsSync(runDir)) {
    throw new Error('RECOVER_FAIL: Run directory does not exist.');
  }

  verifyPathSecurity(runDir);
  const realRunDir = fs.realpathSync(runDir);
  if (fs.lstatSync(runDir).isSymbolicLink() || realRunDir !== path.resolve(runDir)) {
    throw new Error('RECOVER_FAIL: Run directory cannot be a symbolic link or escape.');
  }

  const dirStat = fs.statSync(realRunDir);
  if (process.getuid && dirStat.uid !== process.getuid()) {
    throw new Error('RECOVER_FAIL: Run directory UID mismatch.');
  }
  if ((dirStat.mode & 0o777) !== 0o700) {
    throw new Error('RECOVER_FAIL: Run directory permissions must be 0700.');
  }

  const ownerFile = path.resolve(realRunDir, 'owner.json');
  if (!fs.existsSync(ownerFile)) {
    throw new Error('RECOVER_FAIL: Authority record owner.json is missing.');
  }
  if (fs.lstatSync(ownerFile).isSymbolicLink()) {
    throw new Error('RECOVER_FAIL: Authority record cannot be a symbolic link.');
  }
  const ownerStat = fs.statSync(ownerFile);
  if (process.getuid && ownerStat.uid !== process.getuid()) {
    throw new Error('RECOVER_FAIL: owner.json UID mismatch.');
  }
  if ((ownerStat.mode & 0o777) !== 0o600) {
    throw new Error('RECOVER_FAIL: owner.json permissions must be 0600.');
  }

  const runId = path.basename(realRunDir);
  const runsDir = path.dirname(realRunDir);
  const allowedSet = options.authorizedPendingRuns || AUTHORIZED_PENDING_RECOVERY_RUNS;
  if (!allowedSet.has(runId)) {
    throw new Error(`RECOVER_FAIL: Run "${runId}" is not in authorized pending recovery whitelist.`);
  }

  let authority;
  try {
    authority = validateAuthorityRecord(ownerFile, { runsDir, expectedRunId: runId, expectedTaskId: TASK_ID });
  } catch (err) {
    throw new Error(`RECOVER_FAIL: Authority record validation failed: ${err.message}`);
  }

  if (authority.phase !== 'RESERVED') {
    throw new Error(`RECOVER_FAIL: Pending recovery expects phase RESERVED, found "${authority.phase}".`);
  }
  if (authority.pending_operation !== 'prepare') {
    throw new Error(`RECOVER_FAIL: Pending recovery expects pending_operation "prepare", found "${authority.pending_operation}".`);
  }

  const origOwnerFingerprint = {
    mtime: ownerStat.mtimeMs,
    sha256: crypto.createHash('sha256').update(fs.readFileSync(ownerFile)).digest('hex'),
  };

  const configPath = authority.config_path || path.resolve(authority.workdir, 'supabase/config.toml');
  validateCanonicalConfig(configPath);

  const currentBranch = getGitBranch(authority.workdir);
  const normRecord = (authority.branch_ref || '').replace(/^refs\/heads\//, '');
  const normCurrent = currentBranch.replace(/^refs\/heads\//, '');
  if (normRecord !== normCurrent) {
    throw new Error(`RECOVER_FAIL: Git branch mismatch ("${authority.branch_ref}" vs "${currentBranch}").`);
  }

  // Acquire namespace reservation to serialize recovery across namespace (C3)
  let nsToken = null;
  try {
    const res = acquireNamespaceReservation(runsDir);
    nsToken = res.token;
  } catch (err) {
    const lockErr = new Error(`LOCKED: Cannot acquire namespace reservation for recovery: ${err.message}`);
    lockErr.code = 'LOCKED';
    throw lockErr;
  }

  // Mutual exclusion: Check if prune is running on this run
  const pruneLockFile = path.resolve(realRunDir, '.prune.lock');
  if (fs.existsSync(pruneLockFile)) {
    if (nsToken) releaseNamespaceReservation(runsDir, nsToken);
    const lockErr = new Error(`LOCKED: Competing prune lock held in "${realRunDir}".`);
    lockErr.code = 'LOCKED';
    throw lockErr;
  }

  const lockFile = path.resolve(realRunDir, '.run.lock');
  let origLockFingerprint = null;
  if (fs.existsSync(lockFile)) {
    if (fs.lstatSync(lockFile).isSymbolicLink()) {
      if (nsToken) releaseNamespaceReservation(runsDir, nsToken);
      throw new Error('RECOVER_FAIL: .run.lock cannot be a symbolic link.');
    }
    const lstat = fs.statSync(lockFile);
    origLockFingerprint = {
      mtime: lstat.mtimeMs,
      sha256: crypto.createHash('sha256').update(fs.readFileSync(lockFile)).digest('hex'),
    };
    let lockData;
    try {
      lockData = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
    } catch {
      if (nsToken) releaseNamespaceReservation(runsDir, nsToken);
      throw new Error('RECOVER_FAIL: Corrupted .run.lock file.');
    }

    if (!lockData || typeof lockData !== 'object') {
      if (nsToken) releaseNamespaceReservation(runsDir, nsToken);
      throw new Error('RECOVER_FAIL: .run.lock content is not an object.');
    }
    if (
      !lockData.pid || typeof lockData.pid !== 'number' || !Number.isInteger(lockData.pid) || lockData.pid <= 0 ||
      !lockData.start_ticks || typeof lockData.start_ticks !== 'string' || !/^[1-9]\d*$/.test(lockData.start_ticks) ||
      typeof lockData.boot_id !== 'string' || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(lockData.boot_id) ||
      typeof lockData.token !== 'string' || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(lockData.token) ||
      !lockData.run_id || lockData.run_id !== runId ||
      lockData.operation !== 'lifecycle' ||
      typeof lockData.resource !== 'string' || lockData.resource !== realRunDir
    ) {
      if (nsToken) releaseNamespaceReservation(runsDir, nsToken);
      throw new Error('RECOVER_FAIL: .run.lock is missing required identity fields or run_id mismatch.');
    }

    const currentBoot = getLinuxBootId();
    if (currentBoot.status !== 'KNOWN') {
      if (nsToken) releaseNamespaceReservation(runsDir, nsToken);
      throw new Error('RECOVER_FAIL: Cannot verify system boot ID.');
    }
    if (lockData.boot_id !== currentBoot.boot_id) {
      if (nsToken) releaseNamespaceReservation(runsDir, nsToken);
      throw new Error(`RECOVER_FAIL: Lock boot_id mismatch ("${lockData.boot_id}" != "${currentBoot.boot_id}"). Denied.`);
    }

    const aliveState = checkProcessAlive(lockData.pid, lockData.start_ticks, lockData.boot_id);
    if (aliveState === 'ALIVE') {
      if (nsToken) releaseNamespaceReservation(runsDir, nsToken);
      const lockErr = new Error(`LOCKED: Run lock held by active harness PID ${lockData.pid} (disposition: RECOVERY_REQUIRED).`);
      lockErr.code = 'LOCKED';
      lockErr.disposition = 'recovery-required';
      throw lockErr;
    }
    if (aliveState === 'UNKNOWN') {
      if (nsToken) releaseNamespaceReservation(runsDir, nsToken);
      const lockErr = new Error(`RECOVERY_REQUIRED: Cannot determine liveness of lock owner PID ${lockData.pid}.`);
      lockErr.code = 'RECOVERY_REQUIRED';
      lockErr.disposition = 'recovery-required';
      throw lockErr;
    }
  }

  const recLockFile = path.resolve(realRunDir, '.recovery.lock');
  const recLockData = buildStrictLockRecord({
    operation: 'recovery',
    resource: realRunDir,
    runId,
  });
  const recToken = recLockData.token;
  try {
    const fd = fs.openSync(recLockFile, 'wx', 0o600);
    try {
      fs.writeSync(fd, JSON.stringify(recLockData, null, 2), 0, 'utf8');
      fs.fsyncSync(fd);
    } finally {
      fs.closeSync(fd);
    }
  } catch (err) {
    if (nsToken) releaseNamespaceReservation(runsDir, nsToken);
    if (err.code === 'EEXIST') {
      const lockErr = new Error(`LOCKED: Recovery reservation lock already held in "${realRunDir}".`);
      lockErr.code = 'LOCKED';
      throw lockErr;
    }
    throw err;
  }

  try {
    const cliPath = verifyPinnedCli(adapters.cliPath || PINNED_CLI_PATH, adapters);
    const cleanEnv = buildCleanChildEnv(authority.home_dir);
    const procSnapFn = (adapters && adapters.snapshotRunProcesses) || snapshotRunProcesses;

    const listRes = cliExecutor(
      cliPath,
      ['stack', 'list', '--workdir', authority.workdir, '--output-format', 'json'],
      { cwd: authority.workdir, env: cleanEnv, encoding: 'utf8', timeout: 30000, maxBuffer: 10 * 1024 * 1024 }
    );
    if (listRes.status !== 0) {
      throw new Error(`RECOVER_FAIL: stack list failed with code ${listRes.status}`);
    }
    const listParsed = parseStrictJson(listRes.stdout, 'stack list (recovery)');
    const validatedList = validateRegistryResponse(listParsed, 'stack list (recovery)');
    const stacks = validatedList.stacks;

    const expectedInstanceId = KNOWN_PENDING_RUN_INSTANCES[runId] || authority.instance_id;
    let targetInstanceId = expectedInstanceId;

    // Reject contradictory entries for expectedInstanceId or conflicting entries for workdir/name
    for (const s of stacks) {
      const sNormBranch = (s.branch_context || '').replace(/^refs\/heads\//, '');
      if (expectedInstanceId && s.id === expectedInstanceId) {
        if (
          s.name !== authority.stack_name ||
          s.project_root !== fs.realpathSync(authority.workdir) ||
          sNormBranch !== normRecord ||
          s.runtime !== 'native'
        ) {
          throw new Error(`RECOVER_FAIL: Registry stack "${expectedInstanceId}" contradicts authority tuple.`);
        }
      }
      if (s.name === authority.stack_name && s.project_root === fs.realpathSync(authority.workdir)) {
        if (sNormBranch !== normRecord || s.runtime !== 'native') {
          throw new Error('RECOVER_FAIL: Registry ownership contradicts authority branch/runtime.');
        }
        if (expectedInstanceId && s.id !== expectedInstanceId) {
          throw new Error(`RECOVER_FAIL: Conflicting registry stack for "${s.name}" with unexpected ID "${s.id}".`);
        }
      }
    }

    const matchingCandidates = stacks.filter(
      s =>
        s.name === authority.stack_name &&
        s.project_root === fs.realpathSync(authority.workdir) &&
        (s.branch_context || '').replace(/^refs\/heads\//, '') === normRecord &&
        s.runtime === 'native'
    );

    if (matchingCandidates.length > 1) {
      throw new Error(`RECOVER_FAIL: Ambiguous identity: found ${matchingCandidates.length} candidate stacks.`);
    }

    if (matchingCandidates.length === 1) {
      const cand = matchingCandidates[0];
      if (expectedInstanceId && cand.id !== expectedInstanceId) {
        throw new Error(`RECOVER_FAIL: Reconciled candidate ID mismatch (expected "${expectedInstanceId}", found "${cand.id}").`);
      }
      targetInstanceId = cand.id;

      const procSnap = validateProcessSnapshot(procSnapFn(authority.home_dir, authority.workdir, targetInstanceId));
      if (procSnap.status !== 'KNOWN') {
        throw new Error('RECOVER_FAIL: Required process observation is UNKNOWN.');
      }
      for (const p of procSnap.processes) {
        if (p.exe !== cliPath) {
          throw new Error(`RECOVER_FAIL: Process exe "${p.exe}" does not match pinned CLI.`);
        }
        if (typeof p.cmdline !== 'string' || !p.cmdline.includes(targetInstanceId)) {
          throw new Error('RECOVER_FAIL: Process cmdline does not contain target instance ID.');
        }
      }

      const destroyRes = cliExecutor(
        cliPath,
        ['stack', 'destroy', '--stack-id', targetInstanceId, '--workdir', authority.workdir, '--yes', '--output-format', 'json'],
        { cwd: authority.workdir, env: cleanEnv, encoding: 'utf8', timeout: 30000, maxBuffer: 10 * 1024 * 1024 }
      );
      if (destroyRes.status !== 0) {
        throw new Error(`RECOVER_FAIL: CLI stack destroy failed with code ${destroyRes.status}.`);
      }
      const destroyParsed = parseStrictJson(destroyRes.stdout, 'stack destroy (recovery)');
      if (destroyParsed.destroyed !== true || destroyParsed.id !== targetInstanceId) {
        throw new Error('RECOVER_FAIL: CLI destroy did not acknowledge destroyed=true for target stack.');
      }

      const lingerSnap = validateProcessSnapshot(procSnapFn(authority.home_dir, authority.workdir, targetInstanceId));
      if (lingerSnap.status !== 'KNOWN' || lingerSnap.processes.length > 0) {
        throw new Error(`RECOVER_POSTCHECK_FAIL: Lingering provider processes detected after destroy (${lingerSnap.processes ? lingerSnap.processes.length : 0} active).`);
      }
    } else {
      if (!targetInstanceId) {
        throw new Error('RECOVER_FAIL: No candidate in registry and no known instance ID.');
      }
    }

    // Postcheck 1: Registry absence
    const postListRes = cliExecutor(
      cliPath,
      ['stack', 'list', '--workdir', authority.workdir, '--output-format', 'json'],
      { cwd: authority.workdir, env: cleanEnv, encoding: 'utf8', timeout: 30000, maxBuffer: 10 * 1024 * 1024 }
    );
    if (postListRes.status !== 0) {
      throw new Error(`RECOVER_POSTCHECK_FAIL: Registry check failed with code ${postListRes.status}.`);
    }
    const postListParsed = parseStrictJson(postListRes.stdout, 'stack list (recovery postcheck)');
    const validatedPostList = validateRegistryResponse(postListParsed, 'stack list (recovery postcheck)');
    if (validatedPostList.stacks.some(s => s.id === targetInstanceId ||
        (s.name === authority.stack_name && s.project_root === authority.workdir))) {
      throw new Error(`RECOVER_POSTCHECK_FAIL: Stack ID "${targetInstanceId}" still present in registry.`);
    }

    // Postcheck 2: Native state files absent
    const stateAbsent = verifyNativeStateFilesAbsent(authority.home_dir, targetInstanceId);
    if (stateAbsent !== 'ABSENT') {
      throw new Error(`RECOVER_POSTCHECK_FAIL: Native state files are not ABSENT (${stateAbsent}).`);
    }

    // Postcheck 3: Process quiescence
    const procQuiescent = verifyProcessesQuiescent(
      validateProcessSnapshot(procSnapFn(authority.home_dir, authority.workdir, targetInstanceId)),
      authority.home_dir,
      authority.workdir,
      targetInstanceId,
      10,
      300,
      { adapters }
    );
    if (!procQuiescent) {
      throw new Error('RECOVER_POSTCHECK_FAIL: Provider processes still active after destroy.');
    }

    // Postcheck 4: Socket quiescence
    const sockQuiescent = verifySocketsQuiescent([54321, 54322, 54324, 54323], 10, 300, { adapters });
    if (!sockQuiescent) {
      throw new Error('RECOVER_POSTCHECK_FAIL: Target sockets still listening.');
    }

    // Retained fingerprint verification before mutation
    const curOwnerStat = fs.statSync(ownerFile);
    const curOwnerHash = crypto.createHash('sha256').update(fs.readFileSync(ownerFile)).digest('hex');
    if (curOwnerStat.mtimeMs !== origOwnerFingerprint.mtime || curOwnerHash !== origOwnerFingerprint.sha256) {
      throw new Error('RECOVER_FAIL: Authority record modified concurrently during recovery. Update denied.');
    }

    const verifyStaleFingerprint = () => {
      if (fs.existsSync(lockFile) !== !!origLockFingerprint) {
        throw new Error('RECOVER_FAIL: Run lock appeared/disappeared during recovery.');
      }
      if (origLockFingerprint) {
        const curLockStat = fs.statSync(lockFile);
        const curLockHash = crypto.createHash('sha256').update(fs.readFileSync(lockFile)).digest('hex');
        if (curLockStat.mtimeMs !== origLockFingerprint.mtime || curLockHash !== origLockFingerprint.sha256) {
          throw new Error('RECOVER_FAIL: Lock file modified concurrently during recovery. Unlink denied.');
        }
      }
    };
    verifyStaleFingerprint();

    // Atomically persist DESTROYED tombstone receipt
    const tombstoneReceipt = {
      format_version: '1.0',
      task_id: TASK_ID,
      run_id: authority.run_id,
      phase: 'DESTROYED',
      tombstone: true,
      pending_operation: null,
      instance_id: targetInstanceId,
      stack_name: authority.stack_name,
      project_root: authority.project_root,
      repo_root: authority.project_root,
      control_root: authority.control_root,
      home_dir: authority.home_dir,
      workdir: authority.workdir,
      config_path: authority.config_path,
      config_digest: authority.config_digest,
      branch_ref: authority.branch_ref,
      runtime: 'native',
      cli_version: PINNED_CLI_VERSION,
      cli_digest: PINNED_CLI_SHA256,
      destroyed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      recovery_receipt: {
        recovered_from_pending: 'prepare',
        reconciled_instance_id: targetInstanceId,
        recovered_at: new Date().toISOString(),
        cli_version: PINNED_CLI_VERSION,
        cli_digest: PINNED_CLI_SHA256,
        config_digest: authority.config_digest,
        branch_ref: authority.branch_ref,
        inspected_stacks_count: stacks.length,
        quiescence_verified: true,
        native_state_files_absent: true,
        sockets_quiescent: true,
      },
    };

    const tempFile = path.resolve(realRunDir, `.tmp-owner-${crypto.randomBytes(6).toString('hex')}.json`);
    const fd = fs.openSync(tempFile, 'wx', 0o600);
    try {
      fs.writeSync(fd, JSON.stringify(tombstoneReceipt, null, 2), 0, 'utf8');
      fs.fsyncSync(fd);
    } finally {
      fs.closeSync(fd);
    }
    fs.renameSync(tempFile, ownerFile);
    const dirFd = fs.openSync(realRunDir, 'r');
    try {
      fs.fsyncSync(dirFd);
    } finally {
      fs.closeSync(dirFd);
    }

    const credFile = path.resolve(realRunDir, 'credentials.json');
    const memberMapFile = path.resolve(realRunDir, 'member-map.json');

    // Auto-prune cache post recovery under held recovery lock
    try {
      pruneRunCache(realRunDir, {
        heldLockToken: recToken,
        isPostRecovery: true,
        heldNamespaceToken: nsToken,
        adapters,
      });
    } catch (pruneErr) {
      // Finite sanitized error code: never leak raw provider message or registered canaries into durable receipt
      const safeErrCode = (pruneErr.code && ALLOWED_CODES.has(pruneErr.code)) ? pruneErr.code : 'PRUNE_FAIL';
      const updatedReceipt = {
        ...tombstoneReceipt,
        recovery_receipt: {
          ...tombstoneReceipt.recovery_receipt,
          cleanup_incomplete: true,
          cleanup_error: safeErrCode,
          cleanup_attempted_at: new Date().toISOString(),
        },
      };
      // Atomic persistence via temp file, fsync, rename, dir fsync (do not suppress durable write failures)
      const tmpReceipt = path.resolve(realRunDir, `.tmp-owner-${crypto.randomBytes(6).toString('hex')}.json`);
      const rFd = fs.openSync(tmpReceipt, 'wx', 0o600);
      try {
        fs.writeSync(rFd, JSON.stringify(updatedReceipt, null, 2), 0, 'utf8');
        fs.fsyncSync(rFd);
      } finally {
        fs.closeSync(rFd);
      }
      fs.renameSync(tmpReceipt, ownerFile);
      const dFd = fs.openSync(realRunDir, 'r');
      try {
        fs.fsyncSync(dFd);
      } finally {
        fs.closeSync(dFd);
      }

      // Credentials and member-map are strictly preserved on disk for retry
      const incompleteErr = new Error(`CLEANUP_INCOMPLETE: Recovery succeeded destroying stack, but cache prune failed (${safeErrCode}).`);
      incompleteErr.code = 'CLEANUP_INCOMPLETE';
      incompleteErr.runId = runId;
      incompleteErr.instanceId = targetInstanceId;
      incompleteErr.disposition = 'cleanup-incomplete';
      throw incompleteErr;
    }

    // Revalidate after provider/cache hooks; never unlink a replaced ownership record.
    verifyStaleFingerprint();
    verifyLockRecord(JSON.parse(fs.readFileSync(recLockFile, 'utf8')), {
      expectedToken: recToken, expectedOperation: 'recovery', expectedResource: realRunDir, expectedRunId: runId,
    });
    verifyLockRecord(JSON.parse(fs.readFileSync(path.join(runsDir, '.namespace.lock'), 'utf8')), {
      expectedToken: nsToken, expectedOperation: 'namespace-gate', expectedResource: runsDir,
    });
    // Only unlink credentials, member-map, and old run lock AFTER cache prune succeeds
    if (fs.existsSync(credFile)) fs.unlinkSync(credFile);
    if (fs.existsSync(memberMapFile)) fs.unlinkSync(memberMapFile);
    if (fs.existsSync(lockFile)) fs.unlinkSync(lockFile);

    return {
      runId,
      instanceId: targetInstanceId,
      phase: 'DESTROYED',
      status: 'DESTROYED',
      code: 'RECOVERED',
      tombstone: true,
    };
  } finally {
    if (fs.existsSync(recLockFile)) {
      try {
        const content = fs.readFileSync(recLockFile, 'utf8');
        const data = JSON.parse(content);
        verifyLockRecord(data, {
          expectedToken: recToken,
          expectedOperation: 'recovery',
          expectedResource: realRunDir,
          expectedRunId: runId,
        });
        fs.unlinkSync(recLockFile);
      } catch {}
    }
    if (nsToken) {
      releaseNamespaceReservation(runsDir, nsToken);
    }
  }
}
