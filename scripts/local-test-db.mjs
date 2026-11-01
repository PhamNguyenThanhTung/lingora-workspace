import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { randomBytes } from 'node:crypto';
import { execFileSync, spawn } from 'node:child_process';
import EmbeddedPostgres from 'embedded-postgres';

const repoRoot = path.resolve(import.meta.dirname, '..');
const schemaPath = path.resolve(repoRoot, 'lingora-admin/prisma/product/schema.prisma');
const prismaBin = path.resolve(repoRoot, 'node_modules/.bin/prisma');

async function findAvailablePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
  });
}

const bootstrapRolesSql = `
  DO $$
  BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
      CREATE ROLE anon;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
      CREATE ROLE authenticated;
    END IF;
  END
  $$;
`;

const bootstrapAuthSql = `
  CREATE SCHEMA IF NOT EXISTS auth;
  CREATE TABLE IF NOT EXISTS auth.users (
    id uuid PRIMARY KEY,
    email text
  );
`;

const args = process.argv.slice(2);
if (!args.length) {
  console.error('Usage: node scripts/local-test-db.mjs <command> [args...]');
  process.exit(1);
}

const port = await findAvailablePort();
const password = randomBytes(24).toString('hex');
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lingora-test-pg-'));

const cluster = new EmbeddedPostgres({
  databaseDir: tempDir,
  port,
  user: 'postgres',
  password,
  persistent: false,
  postgresFlags: ['-c', 'listen_addresses=127.0.0.1'],
  onLog: () => {},
  onError: () => {},
});

let cleanedUp = false;
async function cleanup() {
  if (cleanedUp) return;
  cleanedUp = true;
  try {
    await cluster.stop();
  } catch {}
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch {}
}

const onSignal = async () => {
  await cleanup();
  process.exit(130);
};
process.on('SIGINT', onSignal);
process.on('SIGTERM', onSignal);

try {
  await cluster.initialise();
  await cluster.start();

  const dbs = ['slice10_test', 'slice11_test'];
  for (const dbName of dbs) {
    await cluster.createDatabase(dbName);
    const db = cluster.getPgClient(dbName);
    await db.connect();
    await db.query(bootstrapRolesSql);
    await db.query(bootstrapAuthSql);
    await db.end();

    const dbUrl = `postgresql://postgres:${password}@127.0.0.1:${port}/${dbName}?schema=app`;
    execFileSync(process.execPath, [prismaBin, 'migrate', 'deploy', '--schema', schemaPath], {
      stdio: 'pipe',
      cwd: repoRoot,
      env: {
        ...process.env,
        DATABASE_URL: dbUrl,
        DIRECT_URL: dbUrl,
      },
    });

  }

  const url10 = `postgresql://postgres:${password}@127.0.0.1:${port}/slice10_test?schema=app`;
  const url11 = `postgresql://postgres:${password}@127.0.0.1:${port}/slice11_test?schema=app`;

  const childEnv = {
    ...process.env,
    DATABASE_URL: url11,
    DIRECT_URL: url11,
    SLICE10_TEST_DATABASE_URL: url10,
    SLICE10_LOCAL_DATABASE_URL: url10,
    SLICE10_TEST_DATABASE_OWNED: '1',
    SLICE11_TEST_DATABASE_URL: url11,
    SLICE11_LOCAL_DATABASE_URL: url11,
    SLICE11_TEST_DATABASE_OWNED: '1',
  };

  const child = spawn(args[0], args.slice(1), {
    stdio: 'inherit',
    cwd: repoRoot,
    env: childEnv,
  });

  const code = await new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('exit', resolve);
  });

  process.exitCode = typeof code === 'number' ? code : 1;
} catch (e) {
  console.error({ code: e.code || e.name, message: e.message });
  process.exitCode = 1;
} finally {
  await cleanup();
}
