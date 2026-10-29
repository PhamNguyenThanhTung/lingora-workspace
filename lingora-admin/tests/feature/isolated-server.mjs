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
