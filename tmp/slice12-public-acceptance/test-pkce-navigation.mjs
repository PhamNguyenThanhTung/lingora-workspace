import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {runAuth} from './public-auth.mjs';
import {
  CANONICAL_LEARNER_ORIGIN, CANONICAL_PROVIDER_HOST, EXACT_LEARNER_PKCE_COOKIE_NAME,
} from './helpers-testable.mjs';

// Actual runner, synthetic dependencies: stop immediately after observing the navigation effect.
const root = fs.mkdtempSync(path.join(os.tmpdir(), 's12-offline-navigation-'));
const helperDir = path.join(root, 'tmp/slice12-public-acceptance');
const evidenceDir = path.join(root, 'plans/evidence/slice-12-public-acceptance');
fs.mkdirSync(helperDir, {recursive: true});
fs.mkdirSync(evidenceDir, {recursive: true});
const write = (name, value) => fs.writeFileSync(path.join(helperDir, name), JSON.stringify(value), {mode: 0o600});
const started = Date.parse('2026-11-05T00:00:00.000Z');
const email = 'offline-recipient@example.invalid';
const label = 'DEV_S12_PUBLIC_OFFLINE_NAVIGATION';
const originalState = {
  cookies: [{
    name: EXACT_LEARNER_PKCE_COOKIE_NAME, value: 'synthetic-only-verifier',
    domain: new URL(CANONICAL_LEARNER_ORIGIN).hostname, path: '/auth/confirm',
    httpOnly: true, secure: true, sameSite: 'Lax',
  }],
  origins: [{origin: CANONICAL_LEARNER_ORIGIN, localStorage: [{name: 'synthetic-extra-state', value: 'preserve-me'}]}],
};
const rawUrl = `https://${CANONICAL_PROVIDER_HOST}/auth/v1/verify?token=pkce_synthetic_only&type=signup&flow_id=synthetic%2Bflow&opaque=a%2fb&redirect_to=${encodeURIComponent(`${CANONICAL_LEARNER_ORIGIN}/auth/confirm`)}`;
write('ready-provenance.json', {
  commit: execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim(),
  ready: true, learnerBase: CANONICAL_LEARNER_ORIGIN,
});
write('mode0600-private.json', {email, password: 'synthetic-only-password', label});
write('auth-private.json', {
  label, subjectId: 'synthetic-subject', registrationAttemptedAt: new Date(started).toISOString(),
  registered: new Date(started + 5000).toISOString(), storageState: originalState,
});
write('eml-meta.json', {
  parsed: true, provider_host: CANONICAL_PROVIDER_HOST, type: 'signup',
  redirect_to_origin: CANONICAL_LEARNER_ORIGIN, redirect_to_path: '/auth/confirm',
  recipient_matched: true, recipient_hash: createHash('sha256').update(email).digest('hex'),
  run_label: label, message_date: new Date(started + 10000).toISOString(),
});
fs.writeFileSync(path.join(helperDir, 'eml-url-private.txt'), rawUrl, {mode: 0o600});
let navigationCount = 0;
let actualUrl;
let actualState;
let browserClosed = 0;
const browser = {
  newContext: async ({storageState}) => {
    actualState = storageState;
    return {newPage: async () => ({
      setDefaultTimeout: () => {}, on: () => {}, url: () => `${CANONICAL_LEARNER_ORIGIN}/login`,
      goto: async (url) => {
        navigationCount++;
        actualUrl = url;
        throw new Error('Synthetic post-navigation stop');
      },
    })};
  },
  close: async () => { browserClosed++; },
};
const options = {
  rootDir: root, now: started + 60000, browser,
  dbClient: {query: async () => ({rows: [{id: 'synthetic-subject', email, label, email_confirmed_at: null}]})},
};
try {
  await assert.rejects(runAuth('confirm', options), /Synthetic post-navigation stop/);
  assert.equal(navigationCount, 1, 'Actual goto path must be reached exactly once');
  assert.equal(actualUrl, rawUrl, 'Preserve the complete original URL, including parameter encoding');
  assert.deepEqual(actualState, originalState, 'Use the complete original signup storage state');
  assert.equal(browserClosed, 1);
  assert.ok(JSON.parse(fs.readFileSync(path.join(helperDir, 'auth-private.json'))).confirmationAttemptedAt);
  console.log('PASS: actual goto receives original URL/query/state; browser closes after controlled stop');
  await assert.rejects(runAuth('confirm', options), /Refuse second confirm/);
  assert.equal(navigationCount, 1, 'Restart must not cause a second navigation');
  const safeEvidence = fs.readFileSync(path.join(evidenceDir, 'public-auth.json'), 'utf8');
  for (const secret of [email, 'synthetic-only-password', 'pkce_synthetic_only', 'synthetic-only-verifier', rawUrl]) {
    assert.ok(!safeEvidence.includes(secret), 'Evidence must not contain private synthetic inputs');
  }
  console.log('PASS: restart refuses a second navigation and evidence excludes private inputs');
  process.exitCode = 0; // The runner deliberately sets failure on the controlled post-navigation stop.
} finally {
  fs.rmSync(root, {recursive: true, force: true});
}
