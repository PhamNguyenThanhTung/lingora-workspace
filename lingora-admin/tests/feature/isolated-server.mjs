import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const esbuild = require('esbuild');

const appDir = path.resolve(import.meta.dirname, '../..');
const harnessDir = path.resolve(appDir, 'tests/feature/harness');
const publicFontsDir = path.resolve(appDir, 'public/fonts');
const globalsCssPath = path.resolve(appDir, 'src/app/globals.css');

let cachedBundle = null;

const { setProductPrismaForTest } = await import(path.resolve(appDir, 'src/server/db/index.js'));
const { lessonsFixture } = await import(path.resolve(appDir, 'tests/feature/harness/lessons-fixture.mjs'));
const { compileAndLoadPage } = await import(path.resolve(appDir, 'tests/feature/harness/load-production-pages.mjs'));
const { setCookieStore, createMockSessionCookie } = await import(path.resolve(appDir, 'tests/feature/harness/next-headers-bridge.mjs'));

const MOCK_ADMIN = {
  id: '00000000-0000-4000-8000-000000000001',
  role: 'ADMIN',
  status: 'ACTIVE',
  displayName: 'Nguyễn Quản Trị',
  uiLocale: 'vi',
};

export async function buildHarnessBundle() {
  const result = await esbuild.build({
    entryPoints: [path.resolve(harnessDir, 'isolated-harness-entry.tsx')],
    bundle: true,
    format: 'esm',
    jsx: 'automatic',
    write: false,
    define: {
      'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify('https://supabase.test'),
      'process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY': JSON.stringify('test-public-key'),
      'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify('test-public-key'),
    },
    alias: {
      '@': path.resolve(appDir, 'src'),
      'next/navigation': path.resolve(harnessDir, 'mock-next-navigation.ts'),
    },
  });
  if (result.outputFiles && result.outputFiles[0]) {
    cachedBundle = result.outputFiles[0].text;
    return cachedBundle;
  }
  throw new Error('esbuild produced no output files');
}

export function startIsolatedServer(port = 3007) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!cachedBundle) {
        await buildHarnessBundle();
      }

      const server = http.createServer(async (req, res) => {
        const url = new URL(req.url, `http://localhost:${port}`);
        const pathname = url.pathname;

        // CORS / Origin safety
        res.setHeader('Access-Control-Allow-Origin', `http://localhost:${port}`);
        res.setHeader('Cache-Control', 'no-store, private');

        if (pathname === '/' || pathname === '/index.html') {
          const state = url.searchParams.get('state');
          let injectedScript = '';

          if (state === 'page-framework-detail-wire') {
            const fwId = url.searchParams.get('frameworkId') || '11111111-1111-4111-8111-111111111111';
            setProductPrismaForTest({
              account: { findUnique: async () => MOCK_ADMIN },
              framework: { findUnique: async () => ({ id: fwId, code: 'CEFR', version: '2020', names: { vi: 'Khung Tham chiếu Châu Âu', en: 'Common European Framework' }, _count: { levels: 2 } }) },
              level: { findMany: async () => [
                { id: 'aaaa1111-1111-4111-8111-111111111111', frameworkId: fwId, code: 'A1', label: { vi: 'Mới bắt đầu A1', en: 'Breakthrough' }, position: 1 },
                { id: 'aaaa2222-2222-4222-8222-222222222222', frameworkId: fwId, code: 'A2', label: { vi: 'Sơ cấp A2', en: 'Waystage' }, position: 2 },
              ] },
            });
            globalThis.fetch = async () => new Response(JSON.stringify({ id: MOCK_ADMIN.id }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sncfyvpzwedqgwfpffkh.supabase.co';
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

            const FrameworkDetailPage = await compileAndLoadPage('src/app/frameworks/[frameworkId]/page.tsx', { useBridge: true });
            const jsx = await FrameworkDetailPage({ params: Promise.resolve({ frameworkId: fwId }) });
            injectedScript = `<script>window.__PAGE_PROPS__ = ${JSON.stringify({ account: jsx.props.account, ...jsx.props.children.props })};</script>`;
          }

          if (state === 'page-frameworks-wire') {
            const fwId = '11111111-1111-4111-8111-111111111111';
            setProductPrismaForTest({
              account: { findUnique: async () => MOCK_ADMIN },
              framework: { findMany: async () => [
                { id: fwId, code: 'CEFR', version: '2020', names: { vi: 'Khung Tham chiếu Châu Âu', en: 'Common European Framework' }, _count: { levels: 2 } }
              ] },
            });
            globalThis.fetch = async () => new Response(JSON.stringify({ id: MOCK_ADMIN.id }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sncfyvpzwedqgwfpffkh.supabase.co';
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

            const FrameworksPage = await compileAndLoadPage('src/app/frameworks/page.tsx', { useBridge: true });
            const jsx = await FrameworksPage();
            injectedScript = `<script>window.__PAGE_PROPS__ = ${JSON.stringify({ account: jsx.props.account, ...jsx.props.children.props })};</script>`;
          }

          if (state === 'page-course-detail-wire') {
            const courseId = url.searchParams.get('courseId') || '33333333-3333-4333-8333-333333333030';
            const fwId = '11111111-1111-4111-8111-111111111111';
            const langId = '22222222-2222-4222-8222-222222222222';
            const lvlId = 'aaaa1111-1111-4111-8111-111111111111';
            const failLevels = url.searchParams.get('failLevels') === 'true';

            setProductPrismaForTest({
              account: { findUnique: async () => MOCK_ADMIN },
              course: {
                findUnique: async () => ({
                  id: courseId,
                  languageId: langId,
                  frameworkId: fwId,
                  defaultStartLevelId: lvlId,
                  names: { vi: 'Tiếng Anh Chuẩn', en: 'Core English' },
                  isActive: true,
                  curriculumGeneration: 1n,
                  rowVersion: 1n,
                  language: { id: langId, code: 'en', names: { vi: 'Tiếng Anh' } },
                  framework: { id: fwId, code: 'CEFR', version: '2020', names: { vi: 'Khung Châu Âu' } },
                  defaultStartLevel: { id: lvlId, code: 'A1', label: { vi: 'Mới bắt đầu' }, position: 1 },
                  _count: { units: 2 },
                }),
              },
              unit: {
                findMany: async () => [
                  { id: '44444444-4444-4444-8444-444444444040', courseId, levelId: lvlId, code: 'UNIT-01', names: { vi: 'Bài 1: Làm quen' }, position: 1, level: { id: lvlId, code: 'A1', label: { vi: 'Mới bắt đầu' }, position: 1 } },
                  { id: '44444444-4444-4444-8444-444444444041', courseId, levelId: lvlId, code: 'UNIT-02', names: { vi: 'Bài 2: Giao tiếp' }, position: 2, level: { id: lvlId, code: 'A1', label: { vi: 'Mới bắt đầu' }, position: 1 } },
                ],
              },
              level: {
                findMany: async () => {
                  if (failLevels) {
                    throw new Error('Database connection failed when fetching levels');
                  }
                  return [
                    { id: lvlId, frameworkId: fwId, code: 'A1', label: { vi: 'Mới bắt đầu' }, position: 1 },
                  ];
                },
              },
            });
            globalThis.fetch = async () => new Response(JSON.stringify({ id: MOCK_ADMIN.id }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sncfyvpzwedqgwfpffkh.supabase.co';
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

            const CourseDetailPage = await compileAndLoadPage('src/app/courses/[courseId]/page.tsx', { useBridge: true });
            const jsx = await CourseDetailPage({ params: Promise.resolve({ courseId }) });
            injectedScript = `<script>window.__PAGE_PROPS__ = ${JSON.stringify({ account: jsx.props.account, ...jsx.props.children.props })};</script>`;
          }

          if (state === 'page-courses-wire') {
            const courseId = '33333333-3333-4333-8333-333333333030';
            const fwId = '11111111-1111-4111-8111-111111111111';
            const langId = '22222222-2222-4222-8222-222222222222';
            const lvlId = 'aaaa1111-1111-4111-8111-111111111111';
            setProductPrismaForTest({
              account: { findUnique: async () => MOCK_ADMIN },
              course: {
                findMany: async () => [
                  {
                    id: courseId,
                    languageId: langId,
                    frameworkId: fwId,
                    defaultStartLevelId: lvlId,
                    names: { vi: 'Tiếng Anh Chuẩn', en: 'Core English' },
                    isActive: true,
                    curriculumGeneration: 1n,
                    rowVersion: 1n,
                    language: { id: langId, code: 'en', names: { vi: 'Tiếng Anh' } },
                    framework: { id: fwId, code: 'CEFR', version: '2020', names: { vi: 'Khung Châu Âu' } },
                    defaultStartLevel: { id: lvlId, code: 'A1', label: { vi: 'Mới bắt đầu' }, position: 1 },
                    _count: { units: 2 },
                  },
                ],
              },
              language: {
                findMany: async () => [{ id: langId, code: 'en', names: { vi: 'Tiếng Anh' } }],
              },
              framework: {
                findMany: async () => [{ id: fwId, code: 'CEFR', version: '2020', names: { vi: 'Khung Châu Âu' } }],
              },
            });
            globalThis.fetch = async () => new Response(JSON.stringify({ id: MOCK_ADMIN.id }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sncfyvpzwedqgwfpffkh.supabase.co';
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

            const CoursesPage = await compileAndLoadPage('src/app/courses/page.tsx', { useBridge: true });
            const jsx = await CoursesPage();
            injectedScript = `<script>window.__PAGE_PROPS__ = ${JSON.stringify({ account: jsx.props.account, ...jsx.props.children.props })};</script>`;
          }

          if (state === 'page-teachers-wire') {
            const teacherId = '11111111-1111-4111-8111-111111111111';
            setProductPrismaForTest({
              account: { findUnique: async () => MOCK_ADMIN },
              $queryRaw: async () => [
                {
                  id: teacherId,
                  email: 'teacher.lan@lingora.edu.vn',
                  displayName: 'Nguyễn Thị Lan',
                  role: 'TEACHER',
                  status: 'ACTIVE',
                  createdAt: new Date('2026-10-28T08:00:00.000Z'),
                  activatedAt: new Date('2026-10-28T09:00:00.000Z'),
                },
              ],
            });
            globalThis.fetch = async () => new Response(JSON.stringify({ id: MOCK_ADMIN.id }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sncfyvpzwedqgwfpffkh.supabase.co';
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

            const TeachersPage = await compileAndLoadPage('src/app/teachers/page.tsx', { useBridge: true });
            const jsx = await TeachersPage();
            injectedScript = `<script>window.__PAGE_PROPS__ = ${JSON.stringify({ account: jsx.props.account, ...jsx.props.children.props })};</script>`;
          }

          if (state === 'page-unit-lessons-wire') {
            const courseId = url.searchParams.get('courseId') || '33333333-3333-4333-8333-333333333030';
            const unitId = url.searchParams.get('unitId') || '44444444-4444-4444-8444-444444444040';
            const teacherId = '11111111-1111-4111-8111-111111111111';

            setCookieStore({
              getAll: () => [createMockSessionCookie(MOCK_ADMIN.id, 'admin@lingora.test')],
              get: () => createMockSessionCookie(MOCK_ADMIN.id, 'admin@lingora.test'),
              set: () => {},
              delete: () => {},
            });

            setProductPrismaForTest({
              account: {
                findUnique: async () => MOCK_ADMIN,
                findMany: async () => { if (url.searchParams.has('failOptions')) throw new Error('Options unavailable'); return [
                  { id: teacherId, displayName: 'Nguyễn Thị Lan', role: 'TEACHER', status: 'ACTIVE' },
                ]; },
              },
              course: {
                findUnique: async () => ({
                  id: courseId,
                  languageId: '11111111-1111-4111-8111-111111111111',
                  frameworkId: '11111111-1111-4111-8111-111111111111',
                  defaultStartLevelId: '11111111-1111-4111-8111-111111111111',
                  names: { vi: 'Tiếng Anh Chuẩn', en: 'Core English' },
                  isActive: true,
                  curriculumGeneration: 1n,
                  language: { id: '11111111-1111-4111-8111-111111111111', code: 'en', names: { vi: 'Tiếng Anh' } },
                  framework: { id: '11111111-1111-4111-8111-111111111111', code: 'CEFR', version: '2020', names: { vi: 'Khung CEFR' } },
                  defaultStartLevel: { id: '11111111-1111-4111-8111-111111111111', code: 'A1', label: { vi: 'Cơ bản' }, position: 1 },
                  _count: { units: 1 },
                }),
              },
              unit: {
                findUnique: async () => ({
                  id: unitId,
                  courseId,
                  code: 'UNIT-01',
                  names: { vi: 'Bài 1: Làm quen' },
                  position: 1,
                  levelId: '11111111-1111-4111-8111-111111111111',
                  level: { id: '11111111-1111-4111-8111-111111111111', code: 'A1', label: { vi: 'Cơ bản' }, position: 1 },
                  course: { id: courseId, names: { vi: 'Tiếng Anh Chuẩn', en: 'Core English' } },
                }),
                findFirst: async () => ({
                  id: unitId,
                  courseId,
                  code: 'UNIT-01',
                  names: { vi: 'Bài 1: Làm quen' },
                  position: 1,
                  levelId: '11111111-1111-4111-8111-111111111111',
                  level: { id: '11111111-1111-4111-8111-111111111111', code: 'A1', label: { vi: 'Cơ bản' }, position: 1 },
                  course: { id: courseId, names: { vi: 'Tiếng Anh Chuẩn', en: 'Core English' } },
                }),
              },
              lesson: {
                findMany: async () => [
                  {
                    id: '55555555-5555-5555-8555-555555555001',
                    unitId,
                    position: 1,
                    isRequired: true,
                    availability: 'PLANNED',
                    rowVersion: 1n,
                    unit: {
                      id: unitId,
                      code: 'UNIT-01',
                      names: { vi: 'Bài 1: Làm quen' },
                      course: { id: courseId, names: { vi: 'Tiếng Anh Chuẩn' } },
                    },
                    assignment: {
                      id: '66666666-6666-6666-8666-666666666001',
                      currentTeacher: { id: teacherId, displayName: 'Nguyễn Thị Lan', status: 'ACTIVE' },
                      scopeGeneration: 1n,
                    },
                    revisions: [],
                  },
                ],
              },
            });
            globalThis.fetch = async () => new Response(JSON.stringify({ id: MOCK_ADMIN.id }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sncfyvpzwedqgwfpffkh.supabase.co';
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

            const UnitLessonsPage = await compileAndLoadPage('src/app/courses/[courseId]/units/[unitId]/page.tsx', { useBridge: true });
            const jsx = await UnitLessonsPage({ params: Promise.resolve({ courseId, unitId }) });
            injectedScript = `<script>window.__PAGE_PROPS__ = ${JSON.stringify({ account: jsx.props.account, ...jsx.props.children.props })};</script>`;
          }

          if (state === 'page-teacher-draft-wire' || state === 'page-teacher-lessons-wire') {
            const f = lessonsFixture();
            const teacherId = '11111111-1111-4111-8111-111111111111';
            const lessonId = '55555555-5555-5555-8555-555555555001';
            const courseId = '33333333-3333-4333-8333-333333333030';
            const unitId = '44444444-4444-4444-8444-444444444040';
            const account = { id: teacherId, role: 'TEACHER', status: 'ACTIVE', displayName: 'Nguyễn Thị Lan', uiLocale: 'vi' };
            f.state.accounts.set(teacherId, account);
            f.state.courses.set(courseId, { id: courseId, names: { vi: 'Tiếng Anh Chuẩn' }, languageId: '22222222-2222-4222-8222-222222222222' });
            f.state.units.set(unitId, { id: unitId, courseId, position: 1, code: 'UNIT-01', names: { vi: 'Bài 1: Làm quen' } });
            f.state.lessons.set(lessonId, { id: lessonId, unitId, position: 1, isRequired: true, availability: 'PLANNED', rowVersion: 1n });
            f.state.assignments.set('66666666-6666-6666-8666-666666666001', { id: '66666666-6666-6666-8666-666666666001', lessonId, currentTeacherId: teacherId, scopeGeneration: 1n });
            f.state.revisions.set('77777777-7777-7777-8777-777777777001', {
              id: '77777777-7777-7777-8777-777777777001', lessonId, revisionNo: 1,
              title: { vi: 'Bài học #1', en: 'Lesson 1' },
              contentBlocks: url.searchParams.has('unsupported') ? [{ type: 'media', assetId: 'existing' }] : [{ type: 'paragraph', text: 'Nội dung khởi tạo' }],
              changeSummary: 'Khởi tạo', status: 'DRAFT', createdBy: teacherId, lastEditedBy: teacherId,
              createdAt: new Date('2026-10-30T09:00:00Z'), _count: {},
            });
            if (url.searchParams.has('failList')) f.db.lesson.findMany = async () => { throw new Error('Unavailable'); };
            setCookieStore({ getAll: () => [createMockSessionCookie(teacherId, 'teacher@lingora.test')], set: () => {} });
            setProductPrismaForTest(f.db);
            globalThis.fetch = async () => Response.json({ id: teacherId });
            process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sncfyvpzwedqgwfpffkh.supabase.co';
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
            const Page = await compileAndLoadPage(state === 'page-teacher-draft-wire' ? 'src/app/my-lessons/[lessonId]/page.tsx' : 'src/app/my-lessons/page.tsx', { useBridge: true });
            const jsx = await Page({ params: Promise.resolve({ lessonId }) });
            injectedScript = `<script>window.__PAGE_PROPS__ = ${JSON.stringify({ account: jsx.props.account, ...jsx.props.children.props })};</script>`;
          }

          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Lingora Isolated Feature Component Harness</title>
  <link rel="stylesheet" href="/globals.css">
  <style>
    @font-face {
      font-family: 'Lato';
      font-style: normal;
      font-weight: 400;
      src: url('/fonts/Lato-Regular.ttf') format('truetype');
    }
    @font-face {
      font-family: 'Lato';
      font-style: normal;
      font-weight: 600;
      src: url('/fonts/Lato-Semibold.ttf') format('truetype');
    }
    @font-face {
      font-family: 'Lato';
      font-style: normal;
      font-weight: 700;
      src: url('/fonts/Lato-Bold.ttf') format('truetype');
    }
  </style>
</head>
<body>
  <div id="root"></div>
  ${injectedScript}
  <script type="module" src="/bundle.js"></script>
</body>
</html>`);
          return;
        }

        if (pathname === '/bundle.js') {
          res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
          res.end(cachedBundle);
          return;
        }

        if (pathname === '/globals.css') {
          const css = fs.readFileSync(globalsCssPath, 'utf8');
          res.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8' });
          res.end(css);
          return;
        }

        if (pathname.startsWith('/fonts/')) {
          const fontFileName = path.basename(pathname);
          const fontFilePath = path.join(publicFontsDir, fontFileName);
          if (fs.existsSync(fontFilePath)) {
            const buf = fs.readFileSync(fontFilePath);
            res.writeHead(200, { 'Content-Type': 'font/ttf' });
            res.end(buf);
            return;
          }
        }

        // Mock API responses for interactive components
        if (pathname === '/api/languages' && req.method === 'POST') {
          let bodyStr = '';
          req.on('data', (chunk) => { bodyStr += chunk; });
          req.on('end', () => {
            let body = {};
            try { body = JSON.parse(bodyStr); } catch {}

            // Real 409 duplicate rejection
            if (body.code === 'vi' || body.code === 'en') {
              res.writeHead(409, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: {
                  code: 'DUPLICATE_CODE',
                  message: 'Mã ngôn ngữ này đã tồn tại trong hệ thống.',
                  fields: {
                    code: 'Mã ngôn ngữ này đã tồn tại trong hệ thống.',
                  },
                },
              }));
              return;
            }

            // Session expiry on form submit
            if (body.code === 'expire401') {
              res.writeHead(401, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: {
                  code: 'UNAUTHENTICATED',
                  message: 'Phiên đăng nhập không tồn tại hoặc đã hết hạn.',
                },
              }));
              return;
            }

            // Forbidden 403
            if (body.code === 'err403') {
              res.writeHead(403, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: {
                  code: 'FORBIDDEN',
                  message: 'Bạn không có quyền thực hiện thao tác này.',
                },
              }));
              return;
            }

            // Service unavailable
            if (body.code === 'err503') {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: {
                  code: 'SERVICE_UNAVAILABLE',
                  message: 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau ít phút.',
                },
              }));
              return;
            }

            // Held POST request to test pending state and duplicate lock
            if (body.code === 'held' || body.code === 'heldpost') {
              setTimeout(() => {
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  data: {
                    id: '88888888-8888-4888-8888-888888888888',
                    code: body.code,
                    names: body.names || { vi: 'Ngôn ngữ giữ chờ' },
                    isLearnable: Boolean(body.isLearnable),
                    isUiLocale: Boolean(body.isUiLocale),
                  },
                }));
              }, 450);
              return;
            }

            // Success 201
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              data: {
                id: '99999999-9999-4999-8999-999999999999',
                code: body.code,
                names: body.names || { vi: 'Ngôn ngữ mới' },
                isLearnable: Boolean(body.isLearnable),
                isUiLocale: Boolean(body.isUiLocale),
              },
            }));
          });
          return;
        }

        if (pathname.startsWith('/api/languages/') && req.method === 'PATCH') {
          const id = pathname.replace('/api/languages/', '');
          let bodyStr = '';
          req.on('data', (chunk) => { bodyStr += chunk; });
          req.on('end', () => {
            let body = {};
            try { body = JSON.parse(bodyStr); } catch {}

            if (body.code) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: {
                  code: 'IMMUTABLE_FIELD',
                  message: 'Mã ngôn ngữ không thể thay đổi sau khi tạo.',
                  fields: { code: 'Mã ngôn ngữ không thể thay đổi sau khi tạo.' },
                },
              }));
              return;
            }

            if (id.includes('expire401')) {
              res.writeHead(401, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: {
                  code: 'UNAUTHENTICATED',
                  message: 'Phiên đăng nhập đã hết hạn.',
                },
              }));
              return;
            }

            if (id.includes('err403') || body.names?.vi === 'err403') {
              res.writeHead(403, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: {
                  code: 'FORBIDDEN',
                  message: 'Bạn không có quyền thực hiện thao tác này.',
                },
              }));
              return;
            }

            if (id.includes('err503') || body.names?.vi === 'err503') {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: {
                  code: 'SERVICE_UNAVAILABLE',
                  message: 'Cơ sở dữ liệu tạm thời không phản hồi. Vui lòng thử lại sau ít phút.',
                },
              }));
              return;
            }

            if (id.includes('held') || body.names?.vi === 'heldpatch') {
              setTimeout(() => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  data: {
                    id,
                    code: 'vi',
                    names: body.names || { vi: 'Tiếng Việt cập nhật' },
                    isLearnable: Boolean(body.isLearnable),
                    isUiLocale: Boolean(body.isUiLocale),
                  },
                }));
              }, 450);
              return;
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              data: {
                id,
                code: 'vi',
                names: body.names || { vi: 'Tiếng Việt cập nhật' },
                isLearnable: Boolean(body.isLearnable),
                isUiLocale: Boolean(body.isUiLocale),
              },
            }));
          });
          return;
        }

        if (pathname.startsWith('/api/languages/') && req.method === 'DELETE') {
          const id = pathname.replace('/api/languages/', '');

          // Simulate held request to test pending state and locks
          if (id.includes('held')) {
            setTimeout(() => {
              res.writeHead(204);
              res.end();
            }, 450);
            return;
          }

          // Foreign key restriction
          if (id.includes('fk') || id === '22222222-2222-4222-8222-222222222222') {
            res.writeHead(409, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              error: {
                code: 'LANGUAGE_IN_USE',
                message: 'Ngôn ngữ đang được sử dụng trong các khóa học hoặc tài khoản người dùng.',
              },
            }));
            return;
          }

          // Retryable error
          if (id.includes('retry')) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              error: {
                code: 'SERVICE_UNAVAILABLE',
                message: 'Cơ sở dữ liệu tạm thời không phản hồi. Vui lòng thử lại sau.',
              },
            }));
            return;
          }

          if (id.includes('expire401')) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              error: {
                code: 'UNAUTHENTICATED',
                message: 'Phiên làm việc đã hết hạn.',
              },
            }));
            return;
          }

          res.writeHead(204);
          res.end();
          return;
        }

        // --- Mock Frameworks & Levels Endpoints ---
        if (pathname === '/api/frameworks' && req.method === 'GET') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            data: [
              {
                id: '11111111-1111-4111-8111-111111111111',
                code: 'CEFR',
                version: '2020',
                names: { vi: 'Khung Tham chiếu Châu Âu', en: 'Common European Framework' },
                levelCount: 4,
              },
              {
                id: '22222222-2222-4222-8222-222222222222',
                code: 'ACTFL',
                version: '2024',
                names: { vi: 'Khung Năng lực ACTFL', en: 'ACTFL Proficiency Guidelines' },
                levelCount: 0,
              },
            ],
          }));
          return;
        }

        if (pathname === '/api/frameworks' && req.method === 'POST') {
          let bodyStr = '';
          req.on('data', (chunk) => { bodyStr += chunk; });
          req.on('end', () => {
            let body = {};
            try { body = JSON.parse(bodyStr); } catch {}

            if (body.code === 'duplicate' || (body.code === 'CEFR' && body.version === '2020')) {
              res.writeHead(409, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: {
                  code: 'DUPLICATE_CODE_VERSION',
                  message: 'Cặp mã khung và phiên bản này đã tồn tại trong hệ thống.',
                  fields: {
                    code: 'Cặp mã khung và phiên bản này đã tồn tại trong hệ thống.',
                    version: 'Cặp mã khung và phiên bản này đã tồn tại trong hệ thống.',
                  },
                },
              }));
              return;
            }

            if (body.code === 'expire401') {
              res.writeHead(401, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: { code: 'UNAUTHENTICATED', message: 'Phiên làm việc đã hết hạn.' },
              }));
              return;
            }

            if (body.code === 'err403') {
              res.writeHead(403, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: { code: 'FORBIDDEN', message: 'Bạn không có quyền thực hiện thao tác này.' },
              }));
              return;
            }

            if (body.code === 'err503') {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: { code: 'SERVICE_UNAVAILABLE', message: 'Cơ sở dữ liệu tạm thời không phản hồi.' },
              }));
              return;
            }

            if (body.code === 'held' || body.code === 'heldpost') {
              setTimeout(() => {
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  data: {
                    id: 'ffff1111-1111-4111-8111-111111111111',
                    code: body.code,
                    version: body.version || '1.0',
                    names: body.names || {},
                    levelCount: 0,
                  },
                }));
              }, 450);
              return;
            }

            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              data: {
                id: 'ffff2222-2222-4222-8222-222222222222',
                code: body.code,
                version: body.version || '1.0',
                names: body.names || {},
                levelCount: 0,
              },
            }));
          });
          return;
        }

        if (pathname.startsWith('/api/frameworks/') && !pathname.includes('/levels') && req.method === 'PATCH') {
          const id = pathname.replace('/api/frameworks/', '');
          let bodyStr = '';
          req.on('data', (chunk) => { bodyStr += chunk; });
          req.on('end', () => {
            let body = {};
            try { body = JSON.parse(bodyStr); } catch {}

            if (id.includes('404') || body.code === 'notfound404') {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: {
                  code: 'NOT_FOUND',
                  message: 'Không tìm thấy khung năng lực trong hệ thống.',
                },
              }));
              return;
            }

            if (body.code === 'duplicate' || id.includes('duplicate')) {
              res.writeHead(409, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: {
                  code: 'DUPLICATE_CODE_VERSION',
                  message: 'Cặp mã khung và phiên bản này đã tồn tại trong hệ thống.',
                  fields: {
                    code: 'Cặp mã khung và phiên bản này đã tồn tại trong hệ thống.',
                    version: 'Cặp mã khung và phiên bản này đã tồn tại trong hệ thống.',
                  },
                },
              }));
              return;
            }

            if (id.includes('expire401') || body.code === 'expire401') {
              res.writeHead(401, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: { code: 'UNAUTHENTICATED', message: 'Phiên làm việc đã hết hạn.' },
              }));
              return;
            }

            if (id.includes('err403') || body.code === 'err403') {
              res.writeHead(403, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: { code: 'FORBIDDEN', message: 'Bạn không có quyền thực hiện thao tác này.' },
              }));
              return;
            }

            if (id.includes('err503') || body.code === 'err503') {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: { code: 'SERVICE_UNAVAILABLE', message: 'Cơ sở dữ liệu tạm thời không phản hồi.' },
              }));
              return;
            }

            const mergedNames = { vi: 'Khung Tham chiếu Châu Âu', en: 'CEFR Companion', fr: 'Cadre europeen' };
            if (body.names) {
              for (const [k, v] of Object.entries(body.names)) {
                if (v && v.length > 0) mergedNames[k] = v;
                else delete mergedNames[k];
              }
            }

            if (id.includes('held') || body.code === 'held') {
              setTimeout(() => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  data: {
                    id,
                    code: body.code,
                    version: body.version || '2020',
                    names: mergedNames,
                    levelCount: 4,
                  },
                }));
              }, 450);
              return;
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              data: {
                id,
                code: body.code,
                version: body.version || '2020',
                names: mergedNames,
                levelCount: 4,
              },
            }));
          });
          return;
        }

        if (pathname.startsWith('/api/frameworks/') && !pathname.includes('/levels') && req.method === 'DELETE') {
          const id = pathname.replace('/api/frameworks/', '');

          if (id.includes('404')) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              error: {
                code: 'NOT_FOUND',
                message: 'Không tìm thấy khung năng lực trong hệ thống.',
              },
            }));
            return;
          }

          if (id.includes('held')) {
            setTimeout(() => {
              res.writeHead(204);
              res.end();
            }, 450);
            return;
          }

          if (id.includes('fk') || id.includes('inuse') || id === '11111111-1111-4111-8111-111111111111') {
            res.writeHead(409, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              error: {
                code: 'FRAMEWORK_IN_USE',
                message: 'Khung năng lực đang được sử dụng hoặc có cấp độ trực thuộc, không thể xóa.',
              },
            }));
            return;
          }

          if (id.includes('retry')) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              error: {
                code: 'SERVICE_UNAVAILABLE',
                message: 'Cơ sở dữ liệu tạm thời không phản hồi. Vui lòng thử lại sau.',
              },
            }));
            return;
          }

          if (id.includes('expire401')) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              error: { code: 'UNAUTHENTICATED', message: 'Phiên làm việc đã hết hạn.' },
            }));
            return;
          }

          res.writeHead(204);
          res.end();
          return;
        }

        // Levels Routes under /api/frameworks/:fwId/levels
        if (pathname.includes('/levels') && req.method === 'GET') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            data: [
              {
                id: 'aaaa1111-1111-4111-8111-111111111111',
                frameworkId: '11111111-1111-4111-8111-111111111111',
                code: 'A1',
                label: { vi: 'Mới bắt đầu A1', en: 'Breakthrough' },
                position: 1,
              },
              {
                id: 'aaaa2222-2222-4222-8222-222222222222',
                frameworkId: '11111111-1111-4111-8111-111111111111',
                code: 'A2',
                label: { vi: 'Sơ cấp A2', en: 'Waystage' },
                position: 2,
              },
            ],
          }));
          return;
        }

        if (pathname.includes('/levels') && req.method === 'POST') {
          const m = pathname.match(/^\/api\/frameworks\/([^/]+)\/levels/);
          const parentFwId = m ? m[1] : '11111111-1111-4111-8111-111111111111';

          if (parentFwId.includes('404') || parentFwId.includes('notfound')) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              error: {
                code: 'NOT_FOUND',
                message: 'Khung năng lực cha không tồn tại trong hệ thống.',
              },
            }));
            return;
          }

          let bodyStr = '';
          req.on('data', (chunk) => { bodyStr += chunk; });
          req.on('end', () => {
            let body = {};
            try { body = JSON.parse(bodyStr); } catch {}

            if (body.code === 'dupcode' || body.code === 'A1') {
              res.writeHead(409, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: {
                  code: 'DUPLICATE_LEVEL_CODE',
                  message: 'Mã cấp độ này đã tồn tại trong khung năng lực.',
                  fields: { code: 'Mã cấp độ này đã tồn tại trong khung năng lực.' },
                },
              }));
              return;
            }

            if (body.position === 999 || body.position === 1) {
              res.writeHead(409, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: {
                  code: 'DUPLICATE_LEVEL_POSITION',
                  message: 'Thứ tự vị trí này đã tồn tại trong khung năng lực.',
                  fields: { position: 'Thứ tự vị trí này đã tồn tại trong khung năng lực.' },
                },
              }));
              return;
            }

            if (body.code === 'expire401') {
              res.writeHead(401, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: { code: 'UNAUTHENTICATED', message: 'Phiên làm việc đã hết hạn.' },
              }));
              return;
            }

            if (body.code === 'err403') {
              res.writeHead(403, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: { code: 'FORBIDDEN', message: 'Bạn không có quyền thực hiện thao tác này.' },
              }));
              return;
            }

            if (body.code === 'err503') {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: { code: 'SERVICE_UNAVAILABLE', message: 'Cơ sở dữ liệu tạm thời không phản hồi.' },
              }));
              return;
            }

            if (body.code === 'held') {
              setTimeout(() => {
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  data: {
                    id: 'llll1111-1111-4111-8111-111111111111',
                    frameworkId: parentFwId,
                    code: body.code,
                    label: body.label || {},
                    position: body.position || 5,
                  },
                }));
              }, 450);
              return;
            }

            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              data: {
                id: 'llll2222-2222-4222-8222-222222222222',
                frameworkId: parentFwId,
                code: body.code,
                label: body.label || {},
                position: body.position || 5,
              },
            }));
          });
          return;
        }

        if (pathname.includes('/levels/') && req.method === 'PATCH') {
          const parts = pathname.split('/levels/');
          const levelId = parts[1];
          let bodyStr = '';
          req.on('data', (chunk) => { bodyStr += chunk; });
          req.on('end', () => {
            let body = {};
            try { body = JSON.parse(bodyStr); } catch {}

            if (levelId.includes('404') || body.code === 'notfound404') {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: {
                  code: 'NOT_FOUND',
                  message: 'Không tìm thấy cấp độ trong khung năng lực.',
                },
              }));
              return;
            }

            if (body.code === 'dupcode') {
              res.writeHead(409, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: {
                  code: 'DUPLICATE_LEVEL_CODE',
                  message: 'Mã cấp độ này đã tồn tại trong khung năng lực.',
                  fields: { code: 'Mã cấp độ này đã tồn tại trong khung năng lực.' },
                },
              }));
              return;
            }

            if (body.position === 999) {
              res.writeHead(409, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: {
                  code: 'DUPLICATE_LEVEL_POSITION',
                  message: 'Thứ tự vị trí này đã tồn tại trong khung năng lực.',
                  fields: { position: 'Thứ tự vị trí này đã tồn tại trong khung năng lực.' },
                },
              }));
              return;
            }

            if (levelId.includes('expire401') || body.code === 'expire401') {
              res.writeHead(401, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: { code: 'UNAUTHENTICATED', message: 'Phiên làm việc đã hết hạn.' },
              }));
              return;
            }

            if (levelId.includes('err403') || body.code === 'err403') {
              res.writeHead(403, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: { code: 'FORBIDDEN', message: 'Bạn không có quyền thực hiện thao tác này.' },
              }));
              return;
            }

            if (levelId.includes('err503') || body.code === 'err503') {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: { code: 'SERVICE_UNAVAILABLE', message: 'Cơ sở dữ liệu tạm thời không phản hồi.' },
              }));
              return;
            }

            const mergedLabel = { vi: 'Mới bắt đầu A1', en: 'Breakthrough', de: 'Grundstufe' };
            if (body.label) {
              for (const [k, v] of Object.entries(body.label)) {
                if (v && v.length > 0) mergedLabel[k] = v;
                else delete mergedLabel[k];
              }
            }

            if (levelId.includes('held') || body.code === 'held') {
              setTimeout(() => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  data: {
                    id: levelId,
                    frameworkId: '11111111-1111-4111-8111-111111111111',
                    code: body.code,
                    label: mergedLabel,
                    position: body.position,
                  },
                }));
              }, 450);
              return;
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              data: {
                id: levelId,
                frameworkId: '11111111-1111-4111-8111-111111111111',
                code: body.code,
                label: mergedLabel,
                position: body.position,
              },
            }));
          });
          return;
        }

        if (pathname.includes('/levels/') && req.method === 'DELETE') {
          const parts = pathname.split('/levels/');
          const levelId = parts[1];

          if (levelId.includes('404')) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              error: {
                code: 'NOT_FOUND',
                message: 'Không tìm thấy cấp độ trong khung năng lực.',
              },
            }));
            return;
          }

          if (levelId.includes('held')) {
            setTimeout(() => {
              res.writeHead(204);
              res.end();
            }, 450);
            return;
          }

          if (levelId.includes('inuse') || levelId.includes('fk') || levelId === 'aaaa1111-1111-4111-8111-111111111111') {
            res.writeHead(409, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              error: {
                code: 'LEVEL_IN_USE',
                message: 'Cấp độ đang được sử dụng trong bài học hoặc khóa học, không thể xóa.',
              },
            }));
            return;
          }

          if (levelId.includes('retry')) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              error: {
                code: 'SERVICE_UNAVAILABLE',
                message: 'Cơ sở dữ liệu tạm thời không phản hồi. Vui lòng thử lại sau.',
              },
            }));
            return;
          }

          if (levelId.includes('expire401')) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              error: { code: 'UNAUTHENTICATED', message: 'Phiên làm việc đã hết hạn.' },
            }));
            return;
          }

          res.writeHead(204);
          res.end();
          return;
        }

        // ==========================================
        // COURSES & UNITS MOCK API ROUTES
        // ==========================================

        // Course collection
        if (pathname === '/api/courses' && req.method === 'GET') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            data: [
              {
                id: '33333333-3333-4333-8333-333333333030',
                languageId: '22222222-2222-4222-8222-222222222222',
                frameworkId: '11111111-1111-4111-8111-111111111111',
                defaultStartLevelId: 'aaaa1111-1111-4111-8111-111111111111',
                names: { vi: 'Tiếng Anh Giao Tiếp', en: 'Conversational English' },
                isActive: true,
                curriculumGeneration: 1,
                rowVersion: 1,
                unitCount: 2,
                language: { id: '22222222-2222-4222-8222-222222222222', code: 'en', names: { vi: 'Tiếng Anh' } },
                framework: { id: '11111111-1111-4111-8111-111111111111', code: 'CEFR', version: '2020', names: { vi: 'Khung Châu Âu' } },
                defaultStartLevel: { id: 'aaaa1111-1111-4111-8111-111111111111', code: 'A1', label: { vi: 'Mới bắt đầu' }, position: 1 },
              },
            ],
          }));
          return;
        }

        if (pathname === '/api/courses' && req.method === 'POST') {
          let bodyStr = '';
          req.on('data', (chunk) => { bodyStr += chunk; });
          req.on('end', () => {
            let body = {};
            try { body = JSON.parse(bodyStr); } catch {}

            if (body.names?.vi === 'expire401') {
              res.writeHead(401, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: { code: 'UNAUTHENTICATED', message: 'Phiên làm việc đã hết hạn.' } }));
              return;
            }

            if (body.names?.vi === 'err403') {
              res.writeHead(403, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: { code: 'FORBIDDEN', message: 'Bạn không có quyền thực hiện thao tác này.' } }));
              return;
            }

            if (body.names?.vi === 'err503') {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Cơ sở dữ liệu tạm thời không phản hồi.' } }));
              return;
            }

            if (body.defaultStartLevelId === 'invalid-level-400') {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: {
                  code: 'FRAMEWORK_LEVEL_MISMATCH',
                  message: 'Cấp độ bắt đầu không thuộc khung năng lực đã chọn.',
                  fields: { defaultStartLevelId: 'Cấp độ bắt đầu không thuộc khung năng lực đã chọn.' },
                },
              }));
              return;
            }

            const responseData = {
              id: '33333333-3333-4333-8333-999999999999',
              languageId: body.languageId || '22222222-2222-4222-8222-222222222222',
              frameworkId: body.frameworkId || '11111111-1111-4111-8111-111111111111',
              defaultStartLevelId: body.defaultStartLevelId || 'aaaa1111-1111-4111-8111-111111111111',
              names: body.names || { vi: 'Khóa học mới' },
              isActive: body.isActive !== undefined ? body.isActive : true,
              curriculumGeneration: 1,
              rowVersion: 1,
              unitCount: 0,
              language: { id: body.languageId || '22222222-2222-4222-8222-222222222222', code: 'en', names: { vi: 'Tiếng Anh' } },
              framework: { id: body.frameworkId || '11111111-1111-4111-8111-111111111111', code: 'CEFR', version: '2020', names: { vi: 'Khung Châu Âu' } },
              defaultStartLevel: { id: body.defaultStartLevelId || 'aaaa1111-1111-4111-8111-111111111111', code: 'A1', label: { vi: 'Mới bắt đầu' }, position: 1 },
            };

            if (body.names?.vi === 'heldpost') {
              setTimeout(() => {
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ data: responseData }));
              }, 450);
              return;
            }

            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ data: responseData }));
          });
          return;
        }

        // Single course PATCH / DELETE
        if (pathname.match(/^\/api\/courses\/[^/]+$/) && req.method === 'PATCH') {
          const courseId = pathname.replace('/api/courses/', '');
          let bodyStr = '';
          req.on('data', (chunk) => { bodyStr += chunk; });
          req.on('end', () => {
            let body = {};
            try { body = JSON.parse(bodyStr); } catch {}

            if (courseId.includes('404')) {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Khóa học không tồn tại trong hệ thống.' } }));
              return;
            }

            if (body.names?.vi === 'expire401' || courseId.includes('expire401')) {
              res.writeHead(401, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: { code: 'UNAUTHENTICATED', message: 'Phiên làm việc đã hết hạn.' } }));
              return;
            }

            if (body.names?.vi === 'err403' || courseId.includes('err403')) {
              res.writeHead(403, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: { code: 'FORBIDDEN', message: 'Bạn không có quyền thực hiện thao tác này.' } }));
              return;
            }

            if (body.names?.vi === 'err503' || courseId.includes('err503')) {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Cơ sở dữ liệu tạm thời không phản hồi.' } }));
              return;
            }

            if (courseId.includes('scopefrozen') || body.languageId === 'frozen-lang') {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: { code: 'SCOPE_FROZEN', message: 'Không thể thay đổi ngôn ngữ hoặc khung năng lực khi khóa học đã có bài học.' } }));
              return;
            }

            const responseData = {
              id: courseId,
              languageId: body.languageId || '22222222-2222-4222-8222-222222222222',
              frameworkId: body.frameworkId || '11111111-1111-4111-8111-111111111111',
              defaultStartLevelId: body.defaultStartLevelId || 'aaaa1111-1111-4111-8111-111111111111',
              names: body.names || { vi: 'Khóa học cập nhật' },
              isActive: body.isActive !== undefined ? body.isActive : true,
              curriculumGeneration: 2,
              rowVersion: 2,
              unitCount: 2,
              language: { id: body.languageId || '22222222-2222-4222-8222-222222222222', code: 'en', names: { vi: 'Tiếng Anh' } },
              framework: { id: body.frameworkId || '11111111-1111-4111-8111-111111111111', code: 'CEFR', version: '2020', names: { vi: 'Khung Châu Âu' } },
              defaultStartLevel: { id: body.defaultStartLevelId || 'aaaa1111-1111-4111-8111-111111111111', code: 'A1', label: { vi: 'Mới bắt đầu' }, position: 1 },
            };

            if (courseId.includes('held') || body.names?.vi === 'heldpatch') {
              setTimeout(() => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ data: responseData }));
              }, 450);
              return;
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ data: responseData }));
          });
          return;
        }

        if (pathname.match(/^\/api\/courses\/[^/]+$/) && req.method === 'DELETE') {
          const courseId = pathname.replace('/api/courses/', '');

          if (courseId.includes('404')) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Khóa học không tồn tại trong hệ thống.' } }));
            return;
          }

          if (courseId.includes('expire401')) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: { code: 'UNAUTHENTICATED', message: 'Phiên làm việc đã hết hạn.' } }));
            return;
          }

          if (courseId.includes('err403')) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: { code: 'FORBIDDEN', message: 'Bạn không có quyền thực hiện thao tác này.' } }));
            return;
          }

          if (courseId.includes('err503')) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Cơ sở dữ liệu tạm thời không phản hồi.' } }));
            return;
          }

          if (courseId.includes('inuse') || courseId === '33333333-3333-4333-8333-333333333030' || courseId.includes('hasunits')) {
            res.writeHead(409, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: { code: 'COURSE_IN_USE', message: 'Khóa học đã có đơn vị bài học, không thể xóa.' } }));
            return;
          }

          if (courseId.includes('held')) {
            setTimeout(() => {
              res.writeHead(204);
              res.end();
            }, 450);
            return;
          }

          res.writeHead(204);
          res.end();
          return;
        }

        // Units collection: /api/courses/[courseId]/units
        if (pathname.match(/^\/api\/courses\/[^/]+\/units$/) && req.method === 'GET') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            data: [
              {
                id: '44444444-4444-4444-8444-444444444040',
                courseId: '33333333-3333-4333-8333-333333333030',
                levelId: 'aaaa1111-1111-4111-8111-111111111111',
                code: 'UNIT-01',
                names: { vi: 'Bài 1: Làm quen', en: 'Getting Started' },
                position: 1,
                level: { id: 'aaaa1111-1111-4111-8111-111111111111', code: 'A1', label: { vi: 'Mới bắt đầu' }, position: 1 },
              },
            ],
          }));
          return;
        }

        if (pathname.match(/^\/api\/courses\/[^/]+\/units$/) && req.method === 'POST') {
          const courseId = pathname.split('/')[3];
          let bodyStr = '';
          req.on('data', (chunk) => { bodyStr += chunk; });
          req.on('end', () => {
            let body = {};
            try { body = JSON.parse(bodyStr); } catch {}

            if (courseId.includes('404')) {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Khóa học không tồn tại.' } }));
              return;
            }

            if (body.code === 'expire401' || body.names?.vi === 'expire401') {
              res.writeHead(401, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: { code: 'UNAUTHENTICATED', message: 'Phiên làm việc đã hết hạn.' } }));
              return;
            }

            if (body.code === 'err403' || body.names?.vi === 'err403') {
              res.writeHead(403, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: { code: 'FORBIDDEN', message: 'Bạn không có quyền thực hiện thao tác này.' } }));
              return;
            }

            if (body.code === 'err503' || body.names?.vi === 'err503') {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Cơ sở dữ liệu tạm thời không phản hồi.' } }));
              return;
            }

            if (body.position === 999 || (body.position === 1 && body.levelId === 'aaaa1111-1111-4111-8111-111111111111' && body.names?.vi !== 'heldpost')) {
              res.writeHead(409, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: {
                  code: 'DUPLICATE_UNIT_POSITION',
                  message: 'Thứ tự vị trí đơn vị bài học này đã tồn tại trong cấp độ của khóa học.',
                  fields: { position: 'Thứ tự vị trí đơn vị bài học này đã tồn tại trong cấp độ của khóa học.' },
                },
              }));
              return;
            }

            const responseData = {
              id: '44444444-4444-4444-8444-999999999999',
              courseId,
              levelId: body.levelId,
              code: body.code,
              names: body.names || {},
              position: body.position,
              level: { id: body.levelId, code: 'A1', label: { vi: 'Mới bắt đầu' }, position: 1 },
            };

            if (body.code === 'held' || body.names?.vi === 'heldpost') {
              setTimeout(() => {
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ data: responseData }));
              }, 450);
              return;
            }

            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ data: responseData }));
          });
          return;
        }

        // Single Unit PATCH / DELETE: /api/courses/[courseId]/units/[unitId]
        if (pathname.match(/^\/api\/courses\/[^/]+\/units\/[^/]+$/) && req.method === 'PATCH') {
          const parts = pathname.split('/');
          const courseId = parts[3];
          const unitId = parts[5];
          let bodyStr = '';
          req.on('data', (chunk) => { bodyStr += chunk; });
          req.on('end', () => {
            let body = {};
            try { body = JSON.parse(bodyStr); } catch {}

            if (unitId.includes('notfound404') || courseId.includes('notfound404')) {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Không tìm thấy đơn vị bài học.' } }));
              return;
            }

            if (unitId.includes('expire401') || body.code === 'expire401') {
              res.writeHead(401, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: { code: 'UNAUTHENTICATED', message: 'Phiên làm việc đã hết hạn.' } }));
              return;
            }

            if (unitId.includes('err403') || body.code === 'err403') {
              res.writeHead(403, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: { code: 'FORBIDDEN', message: 'Bạn không có quyền thực hiện thao tác này.' } }));
              return;
            }

            if (unitId.includes('err503') || body.code === 'err503') {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Cơ sở dữ liệu tạm thời không phản hồi.' } }));
              return;
            }

            if (body.position === 999) {
              res.writeHead(409, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: {
                  code: 'DUPLICATE_UNIT_POSITION',
                  message: 'Thứ tự vị trí đơn vị bài học này đã tồn tại trong cấp độ của khóa học.',
                  fields: { position: 'Thứ tự vị trí đơn vị bài học này đã tồn tại trong cấp độ của khóa học.' },
                },
              }));
              return;
            }

            const responseData = {
              id: unitId,
              courseId,
              levelId: body.levelId || 'aaaa1111-1111-4111-8111-111111111111',
              code: body.code || 'UNIT-01',
              names: body.names || {},
              position: body.position !== undefined ? body.position : 1,
              level: { id: body.levelId || 'aaaa1111-1111-4111-8111-111111111111', code: 'A1', label: { vi: 'Mới bắt đầu' }, position: 1 },
            };

            if (unitId.includes('held') || body.code === 'held') {
              setTimeout(() => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ data: responseData }));
              }, 450);
              return;
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ data: responseData }));
          });
          return;
        }

        if (pathname.match(/^\/api\/courses\/[^/]+\/units\/[^/]+$/) && req.method === 'DELETE') {
          const parts = pathname.split('/');
          const unitId = parts[5];

          if (unitId.includes('notfound404')) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Không tìm thấy đơn vị bài học.' } }));
            return;
          }

          if (unitId.includes('expire401')) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: { code: 'UNAUTHENTICATED', message: 'Phiên làm việc đã hết hạn.' } }));
            return;
          }

          if (unitId.includes('err403')) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: { code: 'FORBIDDEN', message: 'Bạn không có quyền thực hiện thao tác này.' } }));
            return;
          }

          if (unitId.includes('err503')) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Cơ sở dữ liệu tạm thời không phản hồi.' } }));
            return;
          }

          if (unitId.includes('inuse') || unitId.includes('haslessons') || unitId === '44444444-4444-4444-8444-444444444040') {
            res.writeHead(409, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: { code: 'UNIT_IN_USE', message: 'Đơn vị bài học đang chứa bài học, không thể xóa.' } }));
            return;
          }

          if (unitId.includes('held')) {
            setTimeout(() => {
              res.writeHead(204);
              res.end();
            }, 450);
            return;
          }

          res.writeHead(204);
          res.end();
          return;
        }

        if (pathname === '/login') {
          res.end('<!DOCTYPE html><html><body><h1>Đăng nhập Lingora</h1></body></html>');
          return;
        }

        if (pathname === '/api/auth/logout') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ data: { success: true } }));
          return;
        }

        res.writeHead(404);
        res.end('Not Found');
      });

      server.listen(port, () => {
        resolve({
          server,
          port,
          close: () => new Promise((cb) => server.close(cb)),
        });
      });

      server.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
}
