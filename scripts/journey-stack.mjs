// Local acceptance stack for the teacher -> learner journey (see plans/2026-11-26-teacher-learner-journey-acceptance.md).
// Run:  node scripts/local-test-db.mjs node --experimental-strip-types scripts/journey-stack.mjs
// Starts disposable Postgres (via local-test-db), a synthetic auth provider, lingora-admin and lingora-web,
// then stays alive and writes connection info to /tmp/journey-stack.json. Never touches production.
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import pkg from 'pg';
import { PrismaClient } from '../lingora-admin/generated/product-client/index.js';
import { seed } from '../lingora-admin/prisma/product/seed.mjs';
import { provisionSampleA1Curriculum, SAMPLE_A1_CONSTANTS } from '../lingora-admin/src/server/curriculum/sample-a1.ts';
import { validateOwnedDatabaseUrl, preflightAndSeedActors } from './test-guard-utils.mjs';

const { Client } = pkg;
const repoRoot = path.resolve(import.meta.dirname, '..');
const nextBin = path.resolve(repoRoot, 'node_modules/next/dist/bin/next');
const dbUrl = validateOwnedDatabaseUrl().ownedUrl;

const IDS = {
  admin: 'cccccccc-0000-4000-8000-000000000001',
  teacher: 'aaaaaaaa-1111-4111-8111-111111111111',
  learner: '4746cc51-83e1-4aeb-9e50-7d3d6c481299',
};
const EMAILS = { admin: 'admin@lingora.test', teacher: 'teacher@lingora.test', learner: 'learner@lingora.test' };
const ADMIN_PORT = 3100, WEB_PORT = 3200;

const users = new Map(Object.keys(IDS).map((k) => [
  `token-${IDS[k]}`,
  { id: IDS[k], email: EMAILS[k], email_confirmed_at: '2026-01-01T00:00:00Z', app_metadata: { role: k.toUpperCase() } },
]));
const provider = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  res.setHeader('Content-Type', 'application/json');
  if (url.pathname === '/auth/v1/user') {
    const u = users.get((req.headers.authorization || '').replace(/^Bearer /, ''));
    if (u) return res.end(JSON.stringify(u));
    return res.writeHead(401).end('{"message":"Invalid token","status":401}');
  }
  res.writeHead(404).end('{}');
});
provider.listen(0, '127.0.0.1');
await once(provider, 'listening');
const providerOrigin = `http://127.0.0.1:${provider.address().port}`;

const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
await seed(prisma);
const pg = new Client({ connectionString: dbUrl });
await pg.connect();
await preflightAndSeedActors(pg, [
  { id: IDS.admin, role: 'ADMIN', status: 'ACTIVE', email: EMAILS.admin, displayName: 'Quản trị viên' },
  { id: IDS.teacher, role: 'TEACHER', status: 'ACTIVE', email: EMAILS.teacher, displayName: 'Cô Lan (Giáo viên)' },
  { id: IDS.learner, role: 'LEARNER', status: 'ACTIVE', email: EMAILS.learner, displayName: 'Học viên Mai' },
]);
const sample = await provisionSampleA1Curriculum(prisma, { adminId: IDS.admin, teacherId: IDS.teacher });

// An extra, empty, teacher-assigned lesson in the same unit: the authoring target for the journey.
const authoring = await prisma.lesson.create({
  data: { unitId: SAMPLE_A1_CONSTANTS.unitId, position: 4, availability: 'PLANNED', isRequired: true, rowVersion: 1n },
});
const assignment = await prisma.contentAssignment.create({
  data: { lessonId: authoring.id, currentTeacherId: IDS.teacher, createdBy: IDS.admin, scopeGeneration: 1n },
});
await prisma.assignmentHistory.create({
  data: { assignmentId: assignment.id, sequenceNo: 1, eventType: 'ASSIGNED', nextTeacherId: IDS.teacher, changedBy: IDS.admin, scopeGeneration: 1n, reason: 'journey acceptance' },
});

const baseEnv = {
  ...process.env,
  DATABASE_URL: dbUrl, DIRECT_URL: dbUrl,
  SUPABASE_URL: providerOrigin, NEXT_PUBLIC_SUPABASE_URL: providerOrigin,
  SUPABASE_ANON_KEY: 'synthetic-anon-key', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'synthetic-anon-key',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'synthetic-anon-key', SUPABASE_PUBLISHABLE_KEY: 'synthetic-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: '', SUPABASE_SECRET_KEY: '',
  LINGORA_SRS_SIGNING_SECRET: 'test-srs-hmac-secret-at-least-32-chars-long-very-secure',
};
const start = (dir, port) => spawn(process.execPath, [nextBin, 'start', '--hostname', '127.0.0.1', '-p', String(port)], {
  cwd: path.resolve(repoRoot, dir),
  env: { ...baseEnv, PORT: String(port), LINGORA_APP_ORIGIN: `http://127.0.0.1:${port}` },
  stdio: ['ignore', 'inherit', 'inherit'],
});
const children = [start('lingora-admin', ADMIN_PORT), start('lingora-web', WEB_PORT)];
for (const port of [ADMIN_PORT, WEB_PORT]) {
  for (let i = 0; i < 120; i++) { try { await fetch(`http://127.0.0.1:${port}/`); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
}

fs.writeFileSync('/tmp/journey-stack.json', JSON.stringify({
  admin: `http://127.0.0.1:${ADMIN_PORT}`, web: `http://127.0.0.1:${WEB_PORT}`, ids: IDS, emails: EMAILS,
  courseId: SAMPLE_A1_CONSTANTS.courseId, unitId: SAMPLE_A1_CONSTANTS.unitId,
  authoringLessonId: authoring.id, sampleLessonIds: sample.lessonIds,
}, null, 2));
console.log('JOURNEY_STACK_READY');

const stop = async () => { children.forEach((c) => c.kill('SIGTERM')); provider.close(); await prisma.$disconnect(); await pg.end(); process.exit(0); };
process.on('SIGINT', stop); process.on('SIGTERM', stop);
setInterval(() => {}, 1 << 30);
