/**
 * Environment Allowlist and Security Guard for Lingora Database Runtime Harness.
 *
 * Rules:
 * - Must fail closed before any network/SQL on unbound/nonlocal/unknown targets.
 * - Enforces that host is strictly 127.0.0.1 or localhost.
 * - Enforces canonical task workspace root, config.toml, and state root.
 * - Enforces exact local disposable project identifier ('lingora-local-dev').
 * - Validates required endpoint set and ports (DB 54322, API 54321, Mail 54324).
 * - Never loads inherited root .env or real credentials.
 * - Sanitizes secrets (passwords, JWTs, keys, tokens, invite URLs) in all outputs.
 */

import { URL, fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const CANONICAL_WORKSPACE_ROOT = path.resolve(__dirname, '../../../../');
export const CANONICAL_CONFIG_PATH = path.resolve(CANONICAL_WORKSPACE_ROOT, 'supabase/config.toml');
export const CANONICAL_STATE_ROOT = path.resolve(CANONICAL_WORKSPACE_ROOT, '.local-stack');
export const CANONICAL_STATE_FILE = path.resolve(CANONICAL_STATE_ROOT, 'runtime-state.json');
export const CANONICAL_RAW_STATE_FILE = path.resolve(CANONICAL_STATE_ROOT, 'runtime-raw.local.json');

export const ALLOWED_HOSTS = new Set(['127.0.0.1', 'localhost']);
export const ALLOWED_PROJECT_ID = 'lingora-local-dev';
export const EXPECTED_PORTS = {
  database: 54322,
  api: 54321,
  mail: 54324,
  studio: 54323,
};

/**
 * Redact sensitive fields from any string.
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
    .replace(/(api-key|secret|password|token)[:=]\s*["']?[^"'\s,]+["']?/gi, '$1=[REDACTED]');
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
      lowerKey === 'anon_key' ||
      lowerKey === 'service_role_key' ||
      lowerKey === 'secret_key' ||
      lowerKey === 'publishable_key'
    ) {
      result[key] = '[REDACTED]';
    } else {
      result[key] = sanitizeObject(value);
    }
  }
  return result;
}

/**
 * Validate canonical project configuration file.
 */
export function validateCanonicalConfig(configPath = CANONICAL_CONFIG_PATH) {
  if (!fs.existsSync(configPath)) {
    throw new Error(`ALLOWLIST_FAIL: Project configuration file missing at: ${configPath}`);
  }

  const content = fs.readFileSync(configPath, 'utf8');

  // Verify project_id
  const projectMatch = content.match(/project_id\s*=\s*["']([^"']+)["']/);
  if (!projectMatch || projectMatch[1] !== ALLOWED_PROJECT_ID) {
    throw new Error(`ALLOWLIST_FAIL: Config project_id "${projectMatch ? projectMatch[1] : 'NONE'}" does not match allowed "${ALLOWED_PROJECT_ID}".`);
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
    configPath,
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

  return {
    valid: true,
    protocol: parsed.protocol,
    hostname,
    port,
    database: parsed.pathname.replace(/^\//, ''),
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
 * Read the active task-local runtime state and validate all endpoints and identity.
 */
export function getValidatedRuntimeState(stateFile = CANONICAL_STATE_FILE) {
  // First, canonical config must be valid
  validateCanonicalConfig();

  if (!fs.existsSync(stateFile)) {
    return {
      bound: false,
      reason: `No task-local runtime state file found at ${stateFile}.`,
    };
  }

  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  } catch (err) {
    throw new Error(`ALLOWLIST_FAIL: Failed to parse runtime state file: ${err.message}`);
  }

  if (!raw.id || typeof raw.id !== 'string') {
    throw new Error('ALLOWLIST_FAIL: Stack ID missing or invalid in runtime state.');
  }

  if (raw.runtime !== 'native') {
    throw new Error(`ALLOWLIST_FAIL: Unexpected runtime "${raw.runtime}". Only "native" permitted.`);
  }

  const endpoints = raw.endpoints || {};
  const requiredEndpoints = ['database.sql', 'auth.http', 'rest.http', 'storage.http', 'mail.http'];

  for (const epKey of requiredEndpoints) {
    if (!endpoints[epKey] || !endpoints[epKey].url) {
      throw new Error(`ALLOWLIST_FAIL: Required endpoint "${epKey}" is missing from runtime state.`);
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

  // Validate auth endpoint
  const authUrl = endpoints['auth.http'].url;
  validateApiUrl(authUrl, EXPECTED_PORTS.api);

  // Validate rest endpoint
  const restUrl = endpoints['rest.http'].url;
  validateApiUrl(restUrl, EXPECTED_PORTS.api);

  // Validate storage endpoint
  const storageUrl = endpoints['storage.http'].url;
  validateApiUrl(storageUrl, EXPECTED_PORTS.api);

  // Validate mail endpoint
  const mailUrl = endpoints['mail.http'].url;
  validateApiUrl(mailUrl, EXPECTED_PORTS.mail);

  const validatedEndpoints = {
    database: { host: dbHost, port: dbPort, protocol: 'tcp' },
    auth: { url: authUrl, port: EXPECTED_PORTS.api },
    rest: { url: restUrl, port: EXPECTED_PORTS.api },
    storage: { url: storageUrl, port: EXPECTED_PORTS.api },
    mail: { url: mailUrl, port: EXPECTED_PORTS.mail },
  };

  return {
    bound: true,
    stackId: raw.id,
    runtime: raw.runtime,
    validatedEndpoints,
    sanitizedEnv: sanitizeObject(raw.env || {}),
  };
}

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
      console.log('[ENV-GUARD] Runtime:', state.runtime);
      console.log('[ENV-GUARD] Validated endpoints:', JSON.stringify(state.validatedEndpoints, null, 2));
      console.log('[ENV-GUARD] Allowlist check: PASS');
      process.exit(0);
    }
  } catch (err) {
    console.error('[ENV-GUARD] FAIL:', sanitizeString(err.message));
    process.exit(1);
  }
}
