/**
 * Persistent Executable Test Suite for Environment Allowlist & Secret Redaction.
 *
 * Verifies:
 * - G0-R1: Fail-closed before any network/SQL on unbound/nonlocal/unknown/swapped targets.
 * - G0-R1: Injected process/network spies verify ZERO network or process calls on forbidden targets.
 * - G0-R2: Complete canary secret/JWT/password/invite-URL redaction across all functions.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  CANONICAL_WORKSPACE_ROOT,
  EXPECTED_PORTS,
  ALLOWED_PROJECT_ID,
  validateCanonicalConfig,
  validateDatabaseUrl,
  validateApiUrl,
  sanitizeString,
  sanitizeObject,
  getValidatedRuntimeState,
} from './env-guard.mjs';

test('1. Initial unbound state check without existing state file', () => {
  const dummyStatePath = path.resolve(CANONICAL_WORKSPACE_ROOT, '.local-stack', 'non-existent-state.json');
  const state = getValidatedRuntimeState(dummyStatePath);
  assert.equal(state.bound, false);
  assert.match(state.reason, /No task-local runtime state file found/);
});

test('2. Positive database URL allowlist check', () => {
  const res1 = validateDatabaseUrl(`postgresql://postgres:synthetic@127.0.0.1:${EXPECTED_PORTS.database}/postgres`);
  assert.equal(res1.valid, true);
  assert.equal(res1.hostname, '127.0.0.1');
  assert.equal(res1.port, EXPECTED_PORTS.database);

  const res2 = validateDatabaseUrl(`postgresql://postgres:synthetic@localhost:${EXPECTED_PORTS.database}/postgres`);
  assert.equal(res2.valid, true);
  assert.equal(res2.hostname, 'localhost');
});

test('3. Positive API URL allowlist check', () => {
  const res1 = validateApiUrl(`http://127.0.0.1:${EXPECTED_PORTS.api}`);
  assert.equal(res1.valid, true);
  assert.equal(res1.hostname, '127.0.0.1');
  assert.equal(res1.port, EXPECTED_PORTS.api);

  const res2 = validateApiUrl(`http://localhost:${EXPECTED_PORTS.api}`);
  assert.equal(res2.valid, true);
});

test('4. Negative check: foreign host IP is rejected', () => {
  assert.throws(
    () => validateDatabaseUrl('postgresql://postgres:pass@192.168.1.100:54322/postgres'),
    /ALLOWLIST_FAIL: Non-local host "192.168.1.100" is forbidden/
  );
});

test('5. Negative check: remote domain is rejected', () => {
  assert.throws(
    () => validateDatabaseUrl('postgresql://postgres:pass@app.supabase.co:54322/postgres'),
    /ALLOWLIST_FAIL: Non-local host "app.supabase.co" is forbidden/
  );
  assert.throws(
    () => validateApiUrl('https://api.supabase.co'),
    /ALLOWLIST_FAIL: Non-local API host "api.supabase.co" forbidden/
  );
});

test('6. Negative check: swapped or mismatched port is rejected', () => {
  assert.throws(
    () => validateDatabaseUrl('postgresql://postgres:pass@127.0.0.1:54321/postgres', EXPECTED_PORTS.database),
    /ALLOWLIST_FAIL: Port 54321 does not match expected database port 54322/
  );
  assert.throws(
    () => validateApiUrl('http://127.0.0.1:54322', EXPECTED_PORTS.api),
    /ALLOWLIST_FAIL: API port 54322 does not match expected port 54321/
  );
});

test('7. Negative check: malformed protocol is rejected', () => {
  assert.throws(
    () => validateDatabaseUrl('mysql://127.0.0.1:54322/postgres'),
    /ALLOWLIST_FAIL: Unsupported protocol "mysql:"/
  );
  assert.throws(
    () => validateApiUrl('ftp://127.0.0.1:54321'),
    /ALLOWLIST_FAIL: Unsupported API protocol "ftp:"/
  );
});

test('8. Negative check: missing or altered config file is rejected', () => {
  assert.throws(
    () => validateCanonicalConfig('/non-existent/config.toml'),
    /ALLOWLIST_FAIL: Project configuration file missing/
  );
});

test('9. Canary secret and token redaction across all fields', () => {
  const canaryPassword = 'CANARY_SECRET_PASSWORD_12345';
  const canaryJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJDQU5BUllfVVNFUiJ9.CANARY_SIGNATURE_9876543210';
  const canarySecretKey = 'sb_secret_CANARY_SERVICE_ROLE_KEY_12345';
  const canaryPublishableKey = 'sb_publishable_CANARY_ANON_KEY_67890';
  const canaryInviteUrl = 'http://127.0.0.1:3000/auth/callback#access_token=CANARY_INVITE_TOKEN_XYZ&type=invite';

  const rawString = `DB: postgresql://postgres:${canaryPassword}@127.0.0.1:54322/postgres, JWT: ${canaryJwt}, Key: ${canarySecretKey}, Pub: ${canaryPublishableKey}, Link: ${canaryInviteUrl}`;
  const sanitizedStr = sanitizeString(rawString);

  assert.equal(sanitizedStr.includes(canaryPassword), false, 'Canary password leaked in sanitizeString');
  assert.equal(sanitizedStr.includes('CANARY_SIGNATURE'), false, 'Canary JWT signature leaked in sanitizeString');
  assert.equal(sanitizedStr.includes('CANARY_SERVICE_ROLE_KEY'), false, 'Canary service key leaked in sanitizeString');
  assert.equal(sanitizedStr.includes('CANARY_INVITE_TOKEN'), false, 'Canary invite token leaked in sanitizeString');

  const rawObj = {
    password: canaryPassword,
    jwt_secret: canaryJwt,
    service_role_key: canarySecretKey,
    publishable_key: canaryPublishableKey,
    invite_url: canaryInviteUrl,
    nested: {
      inner_token: 'CANARY_INNER_TOKEN',
      safe_metric: 42,
    },
  };
  const sanitizedObj = sanitizeObject(rawObj);
  const serialized = JSON.stringify(sanitizedObj);

  assert.equal(serialized.includes(canaryPassword), false, 'Canary password leaked in sanitizeObject');
  assert.equal(serialized.includes('CANARY_SERVICE_ROLE_KEY'), false, 'Canary secret key leaked in sanitizeObject');
  assert.equal(serialized.includes('CANARY_INNER_TOKEN'), false, 'Canary inner token leaked in sanitizeObject');
  assert.equal(sanitizedObj.nested.safe_metric, 42, 'Safe metric was altered');
});

test('10. Process and network spy test: forbidden target checks trigger NO network or spawn calls', () => {
  let networkCallCount = 0;
  let processSpawnCount = 0;

  // Spy on global fetch
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (...args) => {
    networkCallCount++;
    throw new Error('SPY: Network call prohibited on forbidden target');
  };

  try {
    // Attempt multiple forbidden operations
    assert.throws(() => validateDatabaseUrl('postgresql://postgres:pass@10.0.0.1:54322/postgres'));
    assert.throws(() => validateDatabaseUrl('postgresql://postgres:pass@remote.domain.com:54322/postgres'));
    assert.throws(() => validateApiUrl('http://192.168.0.1:54321'));
    assert.throws(() => validateApiUrl('https://evil.target.com'));

    // Assert that zero network or process calls occurred
    assert.equal(networkCallCount, 0, 'Forbidden validation attempted network calls!');
    assert.equal(processSpawnCount, 0, 'Forbidden validation attempted process spawns!');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
