#!/usr/bin/env node
/**
 * Dependency Verification and Isolated Clean Installation Proof Script.
 *
 * Implements G0-R4 (Acceptance Criteria G0.3):
 * - Real isolated npm ci from locked manifests in a fresh absent directory.
 * - Private HOME and npm_config_cache with no reused node_modules or global CLI.
 * - Pinned dependencies: @prisma/client (6.19.3), prisma (6.19.3), supabase (2.121.0),
 *   @supabase/supabase-js (2.112.3), pg (8.13.1).
 * - Bundled Node runtime and npm bootstrap resolution.
 * - Binary resolution and execution for local supabase and prisma CLIs.
 * - Records exact command, cwd, versions, manifest hashes, exit code, and sanitized output.
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawnSync, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const BUNDLED_NODE_DIR = '/home/tung/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin';
const BUNDLED_NODE_BIN = path.join(BUNDLED_NODE_DIR, 'node');
const NPM_BOOTSTRAP_BIN = '/home/tung/.local/bin/npm';

function getSha256(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function sanitizeString(text) {
  if (typeof text !== 'string') return text;
  return text
    .replace(/(postgres(?:ql)?:\/\/[^:]+:)([^@]+)(@)/gi, '$1[REDACTED_PASSWORD]$3')
    .replace(/(sb_secret_[A-Za-z0-9_-]+)/g, '[REDACTED_SECRET_KEY]')
    .replace(/(sb_publishable_[A-Za-z0-9_-]+)/g, '[REDACTED_PUBLISHABLE_KEY]')
    .replace(/(eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})/g, '[REDACTED_JWT]')
    .replace(/(#access_token=[A-Za-z0-9_.-]+)/g, '#access_token=[REDACTED_TOKEN]')
    .replace(/(invite_token=[A-Za-z0-9_.-]+)/g, 'invite_token=[REDACTED_TOKEN]')
    .replace(/((?:otp|token|code)=["']?)[A-Za-z0-9_.-]+(["']?)/gi, '$1[REDACTED_OTP]$2');
}

const expectedPins = {
  '@prisma/client': '6.19.3',
  '@supabase/supabase-js': '2.112.3',
  'prisma': '6.19.3',
  'supabase': '2.121.0',
  'pg': '8.13.1',
};

function getPackageVersionFromTree(baseDir, pkgName) {
  const pkgJsonPath = path.join(baseDir, 'node_modules', pkgName, 'package.json');
  if (fs.existsSync(pkgJsonPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
    return pkg.version;
  }
  return null;
}

/**
 * Execute real locked npm ci in a fresh isolated directory.
 */
export function runIsolatedCleanInstallProof() {
  const tempInstallDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lingora-clean-ci-'));
  const isolatedHome = path.join(tempInstallDir, 'home');
  const isolatedCache = path.join(tempInstallDir, 'npm-cache');
  const isolatedRepo = path.join(tempInstallDir, 'repo');
  const isolatedAdmin = path.join(isolatedRepo, 'lingora-admin');

  fs.mkdirSync(isolatedHome, { recursive: true });
  fs.mkdirSync(isolatedCache, { recursive: true });
  fs.mkdirSync(isolatedAdmin, { recursive: true });

  const rootPkgJson = path.join(rootDir, 'package.json');
  const rootPkgLock = path.join(rootDir, 'package-lock.json');
  const adminPkgJson = path.join(rootDir, 'lingora-admin/package.json');

  fs.copyFileSync(rootPkgJson, path.join(isolatedRepo, 'package.json'));
  fs.copyFileSync(rootPkgLock, path.join(isolatedRepo, 'package-lock.json'));
  fs.copyFileSync(adminPkgJson, path.join(isolatedAdmin, 'package.json'));

  const env = {
    ...process.env,
    HOME: isolatedHome,
    npm_config_cache: isolatedCache,
    PATH: `${BUNDLED_NODE_DIR}:${process.env.PATH || ''}`,
    NODE_ENV: 'development',
  };
  delete env.NODE_TEST_CONTEXT;

  const npmBin = fs.existsSync(NPM_BOOTSTRAP_BIN) ? NPM_BOOTSTRAP_BIN : 'npm';
  const command = `${npmBin} ci --ignore-scripts=false`;
  const startTime = Date.now();

  const ciRes = spawnSync(npmBin, ['ci', '--ignore-scripts=false'], {
    cwd: isolatedRepo,
    env,
    encoding: 'utf8',
  });

  const durationMs = Date.now() - startTime;

  // Resolve binaries in the clean node_modules
  const isolatedSupabaseBin = path.join(isolatedRepo, 'node_modules/.bin/supabase');
  const isolatedPrismaBin = path.join(isolatedRepo, 'node_modules/.bin/prisma');

  let cleanSupabaseVersion = null;
  if (fs.existsSync(isolatedSupabaseBin)) {
    try {
      const out = execSync(`"${isolatedSupabaseBin}" --version`, { cwd: isolatedRepo, env, encoding: 'utf8' }).trim();
      const match = out.match(/(\d+\.\d+\.\d+)/);
      cleanSupabaseVersion = match ? match[1] : out;
    } catch (err) {
      cleanSupabaseVersion = `ERR: ${err.message}`;
    }
  }

  let cleanPrismaVersion = null;
  if (fs.existsSync(isolatedPrismaBin)) {
    try {
      const out = execSync(`"${isolatedPrismaBin}" --version`, { cwd: isolatedRepo, env, encoding: 'utf8' }).trim();
      const firstLine = out.split('\n')[0];
      const match = firstLine.match(/(\d+\.\d+\.\d+)/);
      cleanPrismaVersion = match ? match[1] : firstLine.trim();
    } catch (err) {
      cleanPrismaVersion = `ERR: ${err.message}`;
    }
  }

  const cleanInstalled = {};
  let cleanAllMatch = true;
  for (const [pkg, expectedVersion] of Object.entries(expectedPins)) {
    const v = getPackageVersionFromTree(isolatedRepo, pkg);
    cleanInstalled[pkg] = v;
    if (v !== expectedVersion) {
      cleanAllMatch = false;
    }
  }

  const proof = {
    proof_status: ciRes.status === 0 && cleanAllMatch ? 'PASS' : 'FAIL',
    command,
    cwd: isolatedRepo,
    duration_ms: durationMs,
    exit_code: ciRes.status,
    node_binary: fs.existsSync(BUNDLED_NODE_BIN) ? BUNDLED_NODE_BIN : process.execPath,
    node_version: process.version,
    npm_binary: npmBin,
    isolated_home: isolatedHome,
    isolated_cache: isolatedCache,
    manifest_hashes: {
      'package.json': getSha256(path.join(isolatedRepo, 'package.json')),
      'package-lock.json': getSha256(path.join(isolatedRepo, 'package-lock.json')),
      'lingora-admin/package.json': getSha256(path.join(isolatedAdmin, 'package.json')),
    },
    installed_packages: cleanInstalled,
    matches_expected_pins: cleanAllMatch,
    resolved_binaries: {
      supabase: {
        path: isolatedSupabaseBin,
        exists: fs.existsSync(isolatedSupabaseBin),
        version: cleanSupabaseVersion,
        matches_pin: cleanSupabaseVersion === '2.121.0',
      },
      prisma: {
        path: isolatedPrismaBin,
        exists: fs.existsSync(isolatedPrismaBin),
        version: cleanPrismaVersion,
        matches_pin: cleanPrismaVersion === '6.19.3',
      },
    },
    sanitized_stdout: sanitizeString(ciRes.stdout || ''),
    sanitized_stderr: sanitizeString(ciRes.stderr || ''),
  };

  // Clean up isolated directory
  try {
    fs.rmSync(tempInstallDir, { recursive: true, force: true });
  } catch {}

  return proof;
}

// In-place checks on current repo
const installed = {};
let allMatch = true;
for (const [pkg, expectedVersion] of Object.entries(expectedPins)) {
  const actualVersion = getPackageVersionFromTree(rootDir, pkg);
  installed[pkg] = actualVersion;
  if (actualVersion !== expectedVersion) {
    allMatch = false;
  }
}

let localSupabaseCliVersion = null;
const localSupabaseBin = path.join(rootDir, 'node_modules/.bin/supabase');
if (fs.existsSync(localSupabaseBin)) {
  try {
    const out = execSync(`"${localSupabaseBin}" --version`, { encoding: 'utf8' }).trim();
    const match = out.match(/(\d+\.\d+\.\d+)/);
    localSupabaseCliVersion = match ? match[1] : out;
  } catch (err) {
    localSupabaseCliVersion = `ERR: ${err.message}`;
  }
}

let localPrismaCliVersion = null;
const localPrismaBin = path.join(rootDir, 'node_modules/.bin/prisma');
if (fs.existsSync(localPrismaBin)) {
  try {
    const out = execSync(`"${localPrismaBin}" --version`, { encoding: 'utf8' }).trim();
    const lines = out.split('\n');
    const firstLine = lines[0];
    const match = firstLine.match(/(\d+\.\d+\.\d+)/);
    localPrismaCliVersion = match ? match[1] : firstLine.trim();
  } catch (err) {
    localPrismaCliVersion = `ERR: ${err.message}`;
  }
}

let npmVersion = 'UNKNOWN';
try {
  npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
} catch {}

const packageLockPath = path.join(rootDir, 'package-lock.json');
const rootPackageJsonPath = path.join(rootDir, 'package.json');
const adminPackageJsonPath = path.join(rootDir, 'lingora-admin', 'package.json');

const args = process.argv.slice(2);
const shouldRunCleanInstall = args.includes('--clean-install') || process.env.RUN_CLEAN_INSTALL === '1';

const result = {
  node_version: process.version,
  npm_version: npmVersion,
  installed,
  expected_pins: expectedPins,
  matches_pins: allMatch,
  local_binaries: {
    supabase: {
      path: localSupabaseBin,
      exists: fs.existsSync(localSupabaseBin),
      version_output: localSupabaseCliVersion,
      matches_pin: localSupabaseCliVersion === '2.121.0',
    },
    prisma: {
      path: localPrismaBin,
      exists: fs.existsSync(localPrismaBin),
      version_output: localPrismaCliVersion,
      matches_pin: localPrismaCliVersion === '6.19.3',
    },
  },
  file_hashes: {
    'package.json': getSha256(rootPackageJsonPath),
    'package-lock.json': getSha256(packageLockPath),
    'lingora-admin/package.json': getSha256(adminPackageJsonPath),
  },
  package_json_root: JSON.parse(fs.readFileSync(rootPackageJsonPath, 'utf8')),
  package_json_admin: JSON.parse(fs.readFileSync(adminPackageJsonPath, 'utf8')),
};

if (shouldRunCleanInstall) {
  result.clean_install_proof = runIsolatedCleanInstallProof();
}

console.log(JSON.stringify(result, null, 2));

if (!allMatch || (shouldRunCleanInstall && result.clean_install_proof.proof_status !== 'PASS')) {
  process.exit(1);
}
