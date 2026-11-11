import { test, before, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { setProductPrismaForTest } from '../../src/server/db/index.js';
import { compileAndLoadPage } from './harness/load-production-pages.mjs';
import { createMockSessionCookie } from './harness/next-headers-bridge.mjs';
let cookieStore;
mock.module('next/headers.js', { exports: { cookies: async () => cookieStore } });
mock.module('next/navigation.js', { exports: {
  redirect: target => { throw new Error(`NEXT_REDIRECT:${target}`); },
  useRouter: () => ({ push() {}, refresh() {} }),
  usePathname: () => '/dashboard',
} });

const id = '00000000-0000-4000-8000-000000000001';
const originalFetch = globalThis.fetch;
let DashboardPage, account, reads, prisma;
before(async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project-ref.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  DashboardPage = await compileAndLoadPage('src/app/dashboard/page.tsx', {});
});
beforeEach(() => {
  reads = 0;
  account = { id, role: 'ADMIN', status: 'ACTIVE', displayName: 'Quản trị viên', uiLocale: 'vi' };
  cookieStore = { getAll: () => [createMockSessionCookie(id)] };
  globalThis.fetch = async () => new Response(JSON.stringify({ id, email: 'admin@lingora.test' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  prisma = {
    account: { findUnique: async () => account },
    language: { findMany: async () => { reads++; return []; } },
    course: { findMany: async () => { reads++; return []; } },
    $queryRaw: async () => { reads++; return []; },
    revisionReview: { findMany: async () => { reads++; return []; } },
  };
  setProductPrismaForTest(prisma);
});
afterEach(() => { globalThis.fetch = originalFetch; setProductPrismaForTest(null); });

test('anonymous visitor redirects before any dashboard data reads', async () => {
  cookieStore = { getAll: () => [] };
  await assert.rejects(DashboardPage, /NEXT_REDIRECT:\/login/);
  assert.equal(reads, 0);
});
test('teachers redirect to holding; learner and inactive admin cannot read metrics', async () => {
  account.role = 'TEACHER';
  await assert.rejects(DashboardPage, /NEXT_REDIRECT:\/holding/);
  assert.equal(reads, 0);
  account.role = 'LEARNER';
  assert.equal((await DashboardPage()).type.name, 'AccessDeniedView');
  account.role = 'ADMIN';
  account.status = 'DISABLED';
  assert.equal((await DashboardPage()).type.name, 'AccessDeniedView');
  assert.equal(reads, 0);
});
test('auth outage renders unavailable before data reads', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ message: 'temporarily unavailable' }), { status: 503 });
  assert.equal((await DashboardPage()).type.name, 'ServiceUnavailableView');
  assert.equal(reads, 0);
});
test('successful empty services render actual zero totals and an empty queue', async () => {
  const jsx = await DashboardPage();
  assert.equal(jsx.type.name, 'AppShell');
  assert.deepEqual(jsx.props.children.props.counts, { languages: 0, courses: 0, teachers: 0, reviews: 0 });
  assert.deepEqual(jsx.props.children.props.queue, []);
  assert.equal(reads, 4);
});
test('dashboard maps real totals, limits review summaries and omits unrelated private data', async () => {
  prisma.language.findMany = async () => [{ id: 'en', code: 'en', names: { vi: 'Tiếng Anh' } }];
  prisma.course.findMany = async () => [{ id: 'course-1', names: { vi: 'Tiếng Anh A1' }, curriculumGeneration: 1n }];
  prisma.$queryRaw = async () => [{ id: 'teacher-1', role: 'TEACHER', status: 'PENDING', email: 'private@lingora.test', createdAt: new Date() }];
  prisma.revisionReview.findMany = async () => Array.from({ length: 6 }, (_, i) => ({
    id: `submission-${i}`, actorId: 'teacher-1', actor: { id: 'teacher-1', displayName: 'Giáo viên Lan' }, occurredAt: new Date('2026-11-06T09:00:00Z'),
    lessonRevision: { id: `revision-${i}`, lessonId: `lesson-${i}`, revisionNo: 1, status: 'IN_REVIEW', title: { vi: `Bài học ${i}` }, lesson: { position: i + 1, unit: { code: 'UNIT-1', names: { vi: 'Làm quen' }, course: { names: { vi: 'Tiếng Anh A1' } } } } },
  }));
  const props = (await DashboardPage()).props.children.props;
  assert.deepEqual(props.counts, { languages: 1, courses: 1, teachers: 1, reviews: 6 });
  assert.equal(props.queue.length, 5);
  assert.deepEqual(props.queue[0], { id: 'submission-0', title: 'Bài học 0', submitter: 'Giáo viên Lan', submittedAt: '2026-11-06T09:00:00.000Z' });
  assert.equal(JSON.stringify(props).includes('private@lingora.test'), false);
});
test('a failed service remains unavailable while successful empty services remain zero', async () => {
  prisma.language.findMany = async () => { throw new Error('database temporarily unavailable'); };
  prisma.revisionReview.findMany = async () => { throw new Error('queue temporarily unavailable'); };
  const props = (await DashboardPage()).props.children.props;
  assert.deepEqual(props.counts, { languages: null, courses: 0, teachers: 0, reviews: null });
  assert.equal(props.queue, null);
});
