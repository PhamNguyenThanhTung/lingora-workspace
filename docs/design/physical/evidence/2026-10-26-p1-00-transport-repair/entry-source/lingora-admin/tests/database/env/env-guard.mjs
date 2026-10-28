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
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

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
const ALLOWED_COMMANDS = new Set(['start', 'status', 'stop', 'destroy', 'data']);
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
      return { status: 'KNOWN', boot_id: bootId };
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
  try {
    exe = fs.readlinkSync(`/proc/${pid}/exe`);
  } catch {}
  try {
    cwd = fs.readlinkSync(`/proc/${pid}/cwd`);
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
  };
}

export function checkProcessAlive(pid, startTicks, bootId) {
  const currentBoot = getLinuxBootId();
  if (currentBoot.status !== 'KNOWN') {
    return 'UNKNOWN';
  }
  if (bootId && bootId !== 'unknown-boot' && bootId !== currentBoot.boot_id) {
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

export function snapshotRunProcesses(homeDir, workdir, stackId) {
  const identities = [];
  const seenPids = new Set();
  let hadObservationError = false;

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
        }
      } catch (err) {
        if (err && err.code !== 'ENOENT') {
          hadObservationError = true;
        }
      }
    }
  }

  // 2. Scan /proc for child/service processes associated with this run
  try {
    const entries = fs.readdirSync('/proc');
    const myUid = process.getuid ? process.getuid() : null;
    for (const entry of entries) {
      if (!/^\d+$/.test(entry)) continue;
      const pid = parseInt(entry, 10);
      if (pid === process.pid || seenPids.has(pid)) continue;
      try {
        if (myUid !== null) {
          const stat = fs.statSync(`/proc/${pid}`);
          if (stat.uid !== myUid) continue;
        }
        let cwd = '';
        try { cwd = fs.readlinkSync(`/proc/${pid}/cwd`); } catch {
          // Unreadable cwd on non-target processes is normal on Linux
        }
        let cmdline = '';
        try { cmdline = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8'); } catch {
          // Unreadable cmdline on non-target processes is normal on Linux
        }

        const isRunProcess =
          (homeDir && (cwd === homeDir || cwd.startsWith(homeDir + '/'))) ||
          (workdir && (cwd === workdir || cwd.startsWith(workdir + '/'))) ||
          (cmdline && (
            (homeDir && cmdline.includes(homeDir)) ||
            (workdir && cmdline.includes(workdir)) ||
            (stackId && cmdline.includes(stackId))
          ));

        if (isRunProcess) {
          const identity = getProcessIdentity(pid);
          if (identity) {
            seenPids.add(pid);
            identities.push(identity);
          } else {
            hadObservationError = true;
          }
        }
      } catch (err) {
        if (err.code !== 'ENOENT' && err.code !== 'ESRCH') {
          // Ignore non-ENOENT on unrelated processes
        }
      }
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      hadObservationError = true;
    }
  }

  if (hadObservationError) {
    return { status: 'UNKNOWN', processes: identities };
  }
  return { status: 'KNOWN', processes: identities };
}

export function snapshotRunSockets(expectedPorts = [54321, 54322, 54324, 54323]) {
  const targetPortsHex = new Set(expectedPorts.map(p => p.toString(16).toUpperCase().padStart(4, '0')));
  const activePorts = [];
  try {
    for (const tcpFile of ['/proc/net/tcp', '/proc/net/tcp6']) {
      if (!fs.existsSync(tcpFile)) continue;
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

export function verifyProcessesQuiescent(snapshot, homeDir, workdir, stackId, retries = 10, delayMs = 300) {
  if (!snapshot || snapshot.status !== 'KNOWN') {
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
      const freshSnapshot = snapshotRunProcesses(homeDir, workdir, stackId);
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

export function verifySocketsQuiescent(expectedPorts = [54321, 54322, 54324, 54323], retries = 10, delayMs = 300) {
  for (let r = 0; r < retries; r++) {
    const socketSnap = snapshotRunSockets(expectedPorts);
    if (socketSnap.status !== 'KNOWN') {
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
