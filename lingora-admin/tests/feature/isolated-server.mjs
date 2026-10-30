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
const { compileAndLoadPage } = await import(path.resolve(appDir, 'tests/feature/harness/load-production-pages.mjs'));

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
    alias: {
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

        if (pathname === '/login') {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
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
