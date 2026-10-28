#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function getSha256(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function getPackageVersion(pkgName) {
  const pkgJsonPath = path.join(rootDir, 'node_modules', pkgName, 'package.json');
  if (fs.existsSync(pkgJsonPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
    return pkg.version;
  }
  return null;
}

const expectedPins = {
  '@prisma/client': '6.19.3',
  '@supabase/supabase-js': '2.112.3',
  'prisma': '6.19.3',
  'supabase': '2.121.0',
  'pg': '8.13.1',
};

const installed = {};
let allMatch = true;
for (const [pkg, expectedVersion] of Object.entries(expectedPins)) {
  const actualVersion = getPackageVersion(pkg);
  installed[pkg] = actualVersion;
  if (actualVersion !== expectedVersion) {
    allMatch = false;
  }
}

let localSupabaseCliVersion = null;
const localSupabaseBin = path.join(rootDir, 'node_modules', '.bin', 'supabase');
if (fs.existsSync(localSupabaseBin)) {
  try {
    localSupabaseCliVersion = execSync(`"${localSupabaseBin}" --version`, { encoding: 'utf8' }).trim();
  } catch (err) {
    localSupabaseCliVersion = `ERR: ${err.message}`;
  }
}

let localPrismaCliVersion = null;
const localPrismaBin = path.join(rootDir, 'node_modules', '.bin', 'prisma');
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

const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();

const packageLockPath = path.join(rootDir, 'package-lock.json');
const rootPackageJsonPath = path.join(rootDir, 'package.json');
const adminPackageJsonPath = path.join(rootDir, 'lingora-admin', 'package.json');

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
      matches_pin: localSupabaseCliVersion?.includes('2.121.0') || false
    },
    prisma: {
      path: localPrismaBin,
      exists: fs.existsSync(localPrismaBin),
      version_output: localPrismaCliVersion,
      matches_pin: localPrismaCliVersion?.includes('6.19.3') || false
    }
  },
  file_hashes: {
    'package.json': getSha256(rootPackageJsonPath),
    'package-lock.json': getSha256(packageLockPath),
    'lingora-admin/package.json': getSha256(adminPackageJsonPath)
  },
  package_json_root: JSON.parse(fs.readFileSync(rootPackageJsonPath, 'utf8')),
  package_json_admin: JSON.parse(fs.readFileSync(adminPackageJsonPath, 'utf8'))
};

console.log(JSON.stringify(result, null, 2));
