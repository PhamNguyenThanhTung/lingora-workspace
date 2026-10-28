/**
 * Environment Allowlist, Identity Binding, and Security Guard for Lingora Database Runtime Harness.
 *
 * Implements G0-R1, G0-R2:
 * - Fail-closed before any network/SQL on unbound/nonlocal/unknown/swapped targets.
 * - Task-local private state roots (.wp00-state, .wp00-home), canonical real paths, symlink escape rejection.
 * - Strict safe child path containment (no unsafe string prefix matching).
 * - Exact native identity tuple (workdir, git branch, stack name, runtime, full 64-char ID).
 * - Explicit rejection of unowned historical roots (.local-stack, .supabase-home).
 * - Complete secret sanitization across all output paths (passwords, JWTs, quoted S3 secrets, OTPs, tokens).
 * - Safe native inspection via reconcileNativeRegistry() before any lifecycle or data action.
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

// Task-local private roots owned by this repair package
export const TASK_STATE_ROOT = path.resolve(CANONICAL_WORKSPACE_ROOT, '.wp00-state');
export const TASK_HOME_ROOT = path.resolve(CANONICAL_WORKSPACE_ROOT, '.wp00-home');
export const TASK_BINDING_FILE = path.resolve(TASK_STATE_ROOT, 'runtime-binding.json');

// Unowned legacy roots that must never be adopted
export const FORBIDDEN_UNOWNED_STATE_ROOT = path.resolve(CANONICAL_WORKSPACE_ROOT, '.local-stack');
export const FORBIDDEN_UNOWNED_HOME_ROOT = path.resolve(CANONICAL_WORKSPACE_ROOT, '.supabase-home');

// Compatibility aliases
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

/**
 * Verify that targetPath is safely contained within parentDir without symlink escape.
 */
export function isSafeChildPath(parentDir, targetPath) {
  if (!fs.existsSync(parentDir) || !fs.existsSync(targetPath)) return false;
  const realParent = fs.realpathSync(parentDir);
  const realTarget = fs.realpathSync(targetPath);
  const rel = path.relative(realParent, realTarget);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
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
 * Redact sensitive fields from any string.
 * Strips database passwords, Supabase secret/publishable keys, JWTs, invite/action tokens,
 * OTPs, and quoted JSON secret fields such as S3_PROTOCOL_ACCESS_KEY_SECRET and AWS credentials.
 */
export function sanitizeString(text) {
  if (typeof text !== 'string') return text;
  return text
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
}

/**
 * Recursively redact sensitive fields from any object.
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
  try {
    const res = spawnSync('git', ['branch', '--show-current'], {
      cwd: workspaceRoot,
      encoding: 'utf8',
    });
    if (res.status === 0 && res.stdout.trim()) {
      return res.stdout.trim();
    }
  } catch {}
  return 'main';
}

/**
 * Construct a clean child environment for CLI executions.
 * Strips inherited provider, database, profile, and NODE_OPTIONS overrides.
 */
export function buildCleanChildEnv(homeDir = TASK_HOME_ROOT) {
  const cleanEnv = {};
  if (process.env.PATH) cleanEnv.PATH = process.env.PATH;
  if (process.env.LANG) cleanEnv.LANG = process.env.LANG;
  if (process.env.LC_ALL) cleanEnv.LC_ALL = process.env.LC_ALL;
  cleanEnv.HOME = homeDir;
  cleanEnv.TMPDIR = process.env.TMPDIR || '/tmp';
  cleanEnv.SUPABASE_EXPERIMENTAL_STACK = '1';
  cleanEnv.SUPABASE_HOME = homeDir;
  return cleanEnv;
}

/**
 * Validate canonical project configuration file.
 */
export function validateCanonicalConfig(configPath = CANONICAL_CONFIG_PATH) {
  if (!fs.existsSync(configPath)) {
    throw new Error(`ALLOWLIST_FAIL: Project configuration file missing at: ${configPath}`);
  }

  // Canonical realpath check with safe child containment (reject symlink escape)
  if (!isSafeChildPath(CANONICAL_WORKSPACE_ROOT, configPath)) {
    throw new Error(`ALLOWLIST_FAIL: Config path ${configPath} escapes canonical workspace root.`);
  }

  const realConfigPath = fs.realpathSync(configPath);
  const content = fs.readFileSync(realConfigPath, 'utf8');

  // Verify project_id
  const projectMatch = content.match(/project_id\s*=\s*["']([^"']+)["']/);
  if (!projectMatch || projectMatch[1] !== ALLOWED_PROJECT_ID) {
    throw new Error(
      `ALLOWLIST_FAIL: Config project_id "${projectMatch ? projectMatch[1] : 'NONE'}" does not match allowed "${ALLOWED_PROJECT_ID}".`
    );
  }

  // Verify experimental stack setting
  if (!content.includes('[experimental]') || !content.includes('stack = true')) {
    throw new Error('ALLOWLIST_FAIL: Config must have [experimental] stack = true enabled.');
  }

  // Verify DB port
  const dbPortMatch = content.match(/\[db\][\s\S]*?port\s*=\s*(\d+)/);
  if (!dbPortMatch || parseInt(dbPortMatch[1], 10) !== EXPECTED_PORTS.database) {
    throw new Error(`ALLOWLIST_FAIL: Config db port must be ${EXPECTED_PORTS.database}.`);
  }

  // Verify API port
  const apiPortMatch = content.match(/\[api\][\s\S]*?port\s*=\s*(\d+)/);
  if (!apiPortMatch || parseInt(apiPortMatch[1], 10) !== EXPECTED_PORTS.api) {
    throw new Error(`ALLOWLIST_FAIL: Config api port must be ${EXPECTED_PORTS.api}.`);
  }

  return {
    valid: true,
    projectId: ALLOWED_PROJECT_ID,
    configPath: realConfigPath,
    configDigest: computeSha256(content),
    expectedPorts: EXPECTED_PORTS,
  };
}

/**
 * Validate a database URL against the local allowlist.
 */
export function validateDatabaseUrl(dbUrl, expectedPort = EXPECTED_PORTS.database) {
  if (!dbUrl || typeof dbUrl !== 'string') {
    throw new Error('ALLOWLIST_FAIL: Database URL is missing or empty.');
  }

  let parsed;
  try {
    parsed = new URL(dbUrl);
  } catch (err) {
    throw new Error(`ALLOWLIST_FAIL: Malformed database URL: ${err.message}`);
  }

  if (parsed.protocol !== 'postgresql:' && parsed.protocol !== 'postgres:') {
    throw new Error(`ALLOWLIST_FAIL: Unsupported protocol "${parsed.protocol}". Expected postgresql:.`);
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!ALLOWED_HOSTS.has(hostname)) {
    throw new Error(`ALLOWLIST_FAIL: Non-local host "${hostname}" is forbidden. Only 127.0.0.1 or localhost permitted.`);
  }

  const port = parseInt(parsed.port, 10);
  if (isNaN(port) || port <= 0 || port > 65535) {
    throw new Error(`ALLOWLIST_FAIL: Invalid or missing port "${parsed.port}".`);
  }

  if (expectedPort && port !== expectedPort) {
    throw new Error(`ALLOWLIST_FAIL: Port ${port} does not match expected database port ${expectedPort}.`);
  }

  const database = parsed.pathname.replace(/^\//, '');
  if (!database) {
    throw new Error('ALLOWLIST_FAIL: Database name is missing from database URL.');
  }

  return {
    valid: true,
    protocol: parsed.protocol,
    hostname,
    port,
    database,
    username: parsed.username || 'postgres',
    password: parsed.password || '',
  };
}

/**
 * Validate an HTTP API URL against the local allowlist.
 */
export function validateApiUrl(apiUrl, expectedPort = EXPECTED_PORTS.api) {
  if (!apiUrl || typeof apiUrl !== 'string') {
    throw new Error('ALLOWLIST_FAIL: API URL is missing or empty.');
  }

  let parsed;
  try {
    parsed = new URL(apiUrl);
  } catch (err) {
    throw new Error(`ALLOWLIST_FAIL: Malformed API URL: ${err.message}`);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`ALLOWLIST_FAIL: Unsupported API protocol "${parsed.protocol}".`);
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
 * Validate local task binding record (Step A: Pure local validation).
 * Enforces canonical paths, non-symlink roots, exact config digest, git branch,
 * full 64-character hex ID, safe child containment, and required loopback endpoints.
 */
export function validateTaskBinding(bindingPath = TASK_BINDING_FILE, options = {}) {
  const configPath = options.configPath || CANONICAL_CONFIG_PATH;
  const configInfo = validateCanonicalConfig(configPath);

  if (!fs.existsSync(bindingPath)) {
    return {
      bound: false,
      reason: `No task-local binding file found at ${bindingPath}.`,
    };
  }

  // Reject symlinks to binding file
  const lstat = fs.lstatSync(bindingPath);
  if (lstat.isSymbolicLink()) {
    throw new Error(`ALLOWLIST_FAIL: Binding file "${bindingPath}" is a forbidden symbolic link.`);
  }

  let binding;
  try {
    binding = JSON.parse(fs.readFileSync(bindingPath, 'utf8'));
  } catch (err) {
    throw new Error('ALLOWLIST_FAIL: Corrupted or unparseable task binding JSON.');
  }

  if (!binding || typeof binding !== 'object') {
    throw new Error('ALLOWLIST_FAIL: Task binding is not an object.');
  }

  // Check task metadata and version
  if (binding.version !== '1.0') {
    throw new Error(`ALLOWLIST_FAIL: Unsupported task binding version "${binding.version}". Expected "1.0".`);
  }
  if (!binding.taskId || typeof binding.taskId !== 'string') {
    throw new Error('ALLOWLIST_FAIL: taskId is missing or invalid in task binding.');
  }

  // Check required identifier fields
  if (!binding.stackId || typeof binding.stackId !== 'string') {
    throw new Error('ALLOWLIST_FAIL: stackId is missing or empty in task binding.');
  }
  if (!/^[a-f0-9]{64}$/i.test(binding.stackId)) {
    throw new Error(`ALLOWLIST_FAIL: stackId "${binding.stackId}" is not a valid 64-character hex ID.`);
  }

  if (!binding.stackName || typeof binding.stackName !== 'string') {
    throw new Error('ALLOWLIST_FAIL: stackName is missing in task binding.');
  }

  if (binding.runtime !== 'native') {
    throw new Error(`ALLOWLIST_FAIL: Unexpected runtime "${binding.runtime}". Only "native" permitted.`);
  }

  // Reject unowned legacy roots (.local-stack, .supabase-home)
  if (binding.stateRoot && fs.existsSync(binding.stateRoot)) {
    const realState = fs.realpathSync(binding.stateRoot);
    if (fs.existsSync(FORBIDDEN_UNOWNED_STATE_ROOT) && realState === fs.realpathSync(FORBIDDEN_UNOWNED_STATE_ROOT)) {
      throw new Error('ALLOWLIST_FAIL: Auto-adoption of unowned .local-stack root is strictly forbidden.');
    }
  }
  if (binding.homeDir && fs.existsSync(binding.homeDir)) {
    const realHome = fs.realpathSync(binding.homeDir);
    if (fs.existsSync(FORBIDDEN_UNOWNED_HOME_ROOT) && realHome === fs.realpathSync(FORBIDDEN_UNOWNED_HOME_ROOT)) {
      throw new Error('ALLOWLIST_FAIL: Auto-adoption of unowned .supabase-home root is strictly forbidden.');
    }
  }

  // Canonical realpath validation (reject symlink escape and foreign paths)
  const realWorkspace = fs.realpathSync(options.workspaceRoot || CANONICAL_WORKSPACE_ROOT);
  if (!binding.projectRoot || fs.realpathSync(binding.projectRoot) !== realWorkspace) {
    throw new Error('ALLOWLIST_FAIL: projectRoot in task binding does not match canonical workspace root.');
  }
  if (!binding.workdir || fs.realpathSync(binding.workdir) !== realWorkspace) {
    throw new Error('ALLOWLIST_FAIL: workdir in task binding does not match canonical workspace root.');
  }
  if (!binding.configPath || fs.realpathSync(binding.configPath) !== configInfo.configPath) {
    throw new Error('ALLOWLIST_FAIL: configPath in task binding does not match canonical config path.');
  }

  // Binding file canonical location: must reside directly inside binding.stateRoot
  if (!binding.stateRoot || !fs.existsSync(binding.stateRoot)) {
    throw new Error('ALLOWLIST_FAIL: stateRoot is missing or does not exist on disk.');
  }
  const realStateRoot = fs.realpathSync(binding.stateRoot);
  const realBindingPath = fs.realpathSync(bindingPath);
  if (path.dirname(realBindingPath) !== realStateRoot) {
    throw new Error('ALLOWLIST_FAIL: Binding file does not reside directly inside binding.stateRoot.');
  }

  if (!binding.homeDir || !fs.existsSync(binding.homeDir)) {
    throw new Error('ALLOWLIST_FAIL: homeDir is missing or does not exist on disk.');
  }
  const realHomeDir = fs.realpathSync(binding.homeDir);

  // Safe child path check: stateRoot and homeDir must reside within workspace or explicit test temp
  const isWorkspaceState = isSafeChildPath(realWorkspace, realStateRoot);
  const isWorkspaceHome = isSafeChildPath(realWorkspace, realHomeDir);
  const isTestState = options.allowTempRoots && (realStateRoot.startsWith('/tmp') || realStateRoot.startsWith('/var/tmp'));
  const isTestHome = options.allowTempRoots && (realHomeDir.startsWith('/tmp') || realHomeDir.startsWith('/var/tmp'));

  if (!isWorkspaceState && !isTestState) {
    throw new Error('ALLOWLIST_FAIL: stateRoot escapes permitted workspace boundary.');
  }
  if (!isWorkspaceHome && !isTestHome) {
    throw new Error('ALLOWLIST_FAIL: homeDir escapes permitted workspace boundary.');
  }

  // Config digest check
  if (binding.configDigest !== configInfo.configDigest) {
    throw new Error(
      `ALLOWLIST_FAIL: Config digest mismatch (binding: ${binding.configDigest}, config.toml: ${configInfo.configDigest}).`
    );
  }

  // Git branch check
  const currentBranch = getGitBranch(realWorkspace);
  const normalizedBindingBranch = binding.gitBranch.replace(/^refs\/heads\//, '');
  const normalizedCurrentBranch = currentBranch.replace(/^refs\/heads\//, '');
  if (normalizedBindingBranch !== normalizedCurrentBranch) {
    throw new Error(
      `ALLOWLIST_FAIL: Git branch mismatch (binding: ${binding.gitBranch}, current: ${currentBranch}).`
    );
  }

  // Endpoints validation
  const endpoints = binding.endpoints || {};
  const requiredEndpoints = ['database.sql', 'auth.http', 'rest.http', 'storage.http', 'mail.http'];
  for (const epKey of requiredEndpoints) {
    if (!endpoints[epKey] || !endpoints[epKey].url) {
      throw new Error(`ALLOWLIST_FAIL: Required endpoint "${epKey}" is missing from task binding.`);
    }
  }

  // Validate database endpoint
  const dbUrl = endpoints['database.sql'].url;
  const dbMatch = dbUrl.match(/^tcp:\/\/([^:]+):(\d+)$/);
  if (!dbMatch) {
    throw new Error(`ALLOWLIST_FAIL: Malformed database.sql endpoint URL: ${dbUrl}`);
  }
  const [, dbHost, dbPortStr] = dbMatch;
  if (!ALLOWED_HOSTS.has(dbHost.toLowerCase())) {
    throw new Error(`ALLOWLIST_FAIL: Non-local database host: ${dbHost}`);
  }
  const dbPort = parseInt(dbPortStr, 10);
  if (dbPort !== EXPECTED_PORTS.database) {
    throw new Error(`ALLOWLIST_FAIL: Database port ${dbPort} does not match expected ${EXPECTED_PORTS.database}.`);
  }

  // Validate HTTP endpoints
  validateApiUrl(endpoints['auth.http'].url, EXPECTED_PORTS.api);
  validateApiUrl(endpoints['rest.http'].url, EXPECTED_PORTS.api);
  validateApiUrl(endpoints['storage.http'].url, EXPECTED_PORTS.api);
  validateApiUrl(endpoints['mail.http'].url, EXPECTED_PORTS.mail);

  const validatedEndpoints = {
    database: { host: dbHost, port: dbPort, protocol: 'tcp' },
    auth: { url: endpoints['auth.http'].url, port: EXPECTED_PORTS.api },
    rest: { url: endpoints['rest.http'].url, port: EXPECTED_PORTS.api },
    storage: { url: endpoints['storage.http'].url, port: EXPECTED_PORTS.api },
    mail: { url: endpoints['mail.http'].url, port: EXPECTED_PORTS.mail },
  };

  return {
    valid: true,
    bound: true,
    taskId: binding.taskId,
    stackId: binding.stackId,
    id: binding.stackId,
    stackName: binding.stackName,
    runtime: binding.runtime,
    projectRoot: binding.projectRoot,
    workdir: binding.workdir,
    configPath: binding.configPath,
    gitBranch: binding.gitBranch,
    homeDir: binding.homeDir,
    stateRoot: binding.stateRoot,
    validatedEndpoints,
    sanitizedEnv: sanitizeObject(binding.env || {}),
    readiness: binding.readiness || null,
    rawBinding: binding,
  };
}

/**
 * Reconcile task binding against actual native CLI registry (Step B: Safe native inspection).
 * Runs ONLY after local validation succeeds.
 * Uses exact workdir and inspects the list of persisted stacks.
 * Reconciles full 64-char ID, stack name, branch, project root, and runtime.
 */
export function reconcileNativeRegistry({ binding, adapters = {}, cliPath } = {}) {
  if (!binding || !binding.bound || !binding.stackId) {
    throw new Error('RECONCILE_FAIL: Refusing to reconcile invalid or unbound local binding.');
  }

  const cliExecutor = adapters.cliExecutor || spawnSync;
  const env = buildCleanChildEnv(binding.homeDir);

  const res = cliExecutor(cliPath, ['stack', 'list', '--workdir', binding.workdir, '--output-format', 'json'], {
    cwd: binding.workdir,
    env,
    encoding: 'utf8',
  });

  if (res.status !== 0) {
    throw new Error(`RECONCILE_FAIL: Native CLI stack list failed with exit code ${res.status}`);
  }

  let parsed;
  try {
    const jsonMatch = (res.stdout || '').match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON output returned by stack list.');
    }
    parsed = JSON.parse(jsonMatch[0]);
  } catch (err) {
    throw new Error('RECONCILE_FAIL: Malformed JSON from native stack list (syntax error).');
  }

  const stacks = parsed.stacks || [];
  const matching = stacks.find(s => s.id === binding.stackId);

  if (!matching) {
    throw new Error(`RECONCILE_FAIL: Task stack ID "${binding.stackId}" was not found in native registry.`);
  }

  // Reconcile complete identity tuple
  if (matching.name !== binding.stackName) {
    throw new Error(
      `RECONCILE_FAIL: Native stack name mismatch (expected "${binding.stackName}", found "${matching.name}").`
    );
  }

  const realProjectRoot = fs.realpathSync(binding.projectRoot);
  const realMatchingRoot = fs.existsSync(matching.project_root) ? fs.realpathSync(matching.project_root) : matching.project_root;
  if (realMatchingRoot !== realProjectRoot) {
    throw new Error(
      `RECONCILE_FAIL: Native project_root mismatch (expected "${realProjectRoot}", found "${realMatchingRoot}").`
    );
  }

  const normalizedBindingBranch = binding.gitBranch.replace(/^refs\/heads\//, '');
  const normalizedMatchingBranch = (matching.branch_context || '').replace(/^refs\/heads\//, '');
  if (normalizedMatchingBranch !== normalizedBindingBranch) {
    throw new Error(
      `RECONCILE_FAIL: Native branch_context mismatch (expected "${binding.gitBranch}", found "${matching.branch_context}").`
    );
  }

  if (matching.runtime !== 'native') {
    throw new Error(`RECONCILE_FAIL: Native runtime mismatch (expected "native", found "${matching.runtime}").`);
  }

  return {
    reconciled: true,
    nativeRecord: matching,
  };
}

/**
 * Public entry for validating runtime state.
 */
export function getValidatedRuntimeState(targetFile = TASK_BINDING_FILE, options = {}) {
  let effectiveFile = targetFile;
  if (!fs.existsSync(effectiveFile) && fs.existsSync(TASK_BINDING_FILE)) {
    effectiveFile = TASK_BINDING_FILE;
  }
  return validateTaskBinding(effectiveFile, options);
}

// CLI entry for manual validation
if (process.argv[1] && path.basename(process.argv[1]) === 'env-guard.mjs') {
  try {
    const command = process.argv[2] || 'check';
    if (command === 'check') {
      console.log('[ENV-GUARD] Running canonical environment allowlist inspection...');
      const state = getValidatedRuntimeState();
      if (!state.bound) {
        console.log(`[ENV-GUARD] State: UNBOUND (${state.reason})`);
        console.log('[ENV-GUARD] Allowlist check: PASS (clean initial unallocated state)');
        process.exit(0);
      }
      console.log('[ENV-GUARD] State: BOUND');
      console.log('[ENV-GUARD] Stack ID:', state.stackId);
      console.log('[ENV-GUARD] Stack Name:', state.stackName);
      console.log('[ENV-GUARD] Runtime:', state.runtime);
      console.log('[ENV-GUARD] Git Branch:', state.gitBranch);
      console.log('[ENV-GUARD] Validated endpoints:', JSON.stringify(state.validatedEndpoints, null, 2));
      console.log('[ENV-GUARD] Allowlist check: PASS');
      process.exit(0);
    }
  } catch (err) {
    console.error('[ENV-GUARD] FAIL:', sanitizeString(err.message));
    process.exit(1);
  }
}
