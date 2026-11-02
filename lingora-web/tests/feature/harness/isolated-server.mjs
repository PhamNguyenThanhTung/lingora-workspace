import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';
import { serializeCookieHeader } from '@supabase/ssr';
import { setLearnerPrismaForTest } from '../../../src/server/db/index.ts';
import { compileProductionModules } from './production-modules.mjs';
import { requests } from './request-context.mjs';
import {
  account,
  contextRow,
  unitRow,
  lessonRow,
  lesson2Row,
  exercisesRows,
  vocabularyRows,
  setupEnv,
  fixtureDb,
  providerDouble,
} from './learner-fixture.mjs';

const appDir = path.resolve(import.meta.dirname, '../../..');
let cachedBundle;

export async function buildHarnessBundle() {
  const result = await build({
    entryPoints: [path.join(import.meta.dirname, 'isolated-harness-entry.tsx')],
    bundle: true,
    format: 'esm',
    jsx: 'automatic',
    write: false,
    define: { 'process.env.NODE_ENV': JSON.stringify('test'), 'process.env': '{}' },
    alias: {
      '@': path.join(appDir, 'src'),
      'next/navigation': path.join(import.meta.dirname, 'mock-next-navigation.ts'),
      'next/link': path.join(import.meta.dirname, 'mock-next-link.tsx'),
    },
  });
  cachedBundle = result.outputFiles[0].text;
  return cachedBundle;
}

export async function startIsolatedServer(port = 3019) {
  setupEnv();
  if (!cachedBundle) await buildHarnessBundle();
  const modules = await compileProductionModules();
  const state = {
    account: account(),
    contexts: [contextRow()],
    units: [unitRow()],
    lessons: [lessonRow(), lesson2Row()],
    exercises: exercisesRows(),
    vocabulary: vocabularyRows(),
    completions: [],
    consumptions: [],
  };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = providerDouble(state);
  setLearnerPrismaForTest(fixtureDb(state));
  const css = fs.readFileSync(path.join(appDir, 'src/app/globals.css'), 'utf8');
  const html = (bootstrap) =>
    `<!doctype html><html lang="vi"><head><meta charset="utf-8"><style>${css}</style></head><body><div id="root"></div>${
      bootstrap
        ? `<script id="production-page" type="application/json">${JSON.stringify(bootstrap).replaceAll('<', '\\u003c')}</script>`
        : ''
    }<script type="module" src="/bundle.js"></script></body></html>`;

  const server = http.createServer(async (req, res) => {
    const origin = `http://127.0.0.1:${port}`;
    const url = new URL(req.url, origin);
    res.setHeader('Cache-Control', 'no-store, private');

    if (url.pathname === '/bundle.js') {
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end(cachedBundle);
      return;
    }
    if (url.pathname === '/fonts/Lato-Regular.ttf') {
      res.end(fs.readFileSync(path.join(appDir, 'public/fonts/Lato-Regular.ttf')));
      return;
    }
    if (url.pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html());
      return;
    }

    const jar = new Map(
      (req.headers.cookie || '')
        .split(';')
        .filter(Boolean)
        .map((c) => {
          const [name, ...value] = c.trim().split('=');
          return [name, value.join('=')];
        })
    );
    const writes = [];
    const store = {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      set: (name, value, options) => {
        if (options?.maxAge === 0) jar.delete(name);
        else jar.set(name, value);
        writes.push(serializeCookieHeader(name, value, options));
      },
      delete: (name) => {
        jar.delete(name);
        writes.push(serializeCookieHeader(name, '', { path: '/', maxAge: 0 }));
      },
    };
    const writeCookies = () => {
      if (writes.length) res.setHeader('Set-Cookie', writes);
    };

    await requests.run(store, async () => {
      try {
        if (url.pathname === '/login' || url.pathname === '/home') {
          const kind = url.pathname === '/login' ? 'login' : 'home';
          const element = await modules[`${kind}Page`].default();
          writeCookies();
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(html({ kind, props: element.props }));
          return;
        }

        const catalogueMatch = url.pathname.match(/^\/learn\/([0-9a-f-]{36})$/);
        if (catalogueMatch) {
          const element = await modules.cataloguePage.default({
            params: Promise.resolve({ contextId: catalogueMatch[1] }),
          });
          writeCookies();
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(html({ kind: 'catalogue', props: element.props }));
          return;
        }

        const playerMatch = url.pathname.match(/^\/learn\/([0-9a-f-]{36})\/([0-9a-f-]{36})$/);
        if (playerMatch) {
          const element = await modules.lessonPlayerPage.default({
            params: Promise.resolve({ contextId: playerMatch[1], lessonId: playerMatch[2] }),
          });
          writeCookies();
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(html({ kind: 'lessonPlayer', props: element.props }));
          return;
        }

        const lessonsMatch = url.pathname.match(/^\/api\/learner\/contexts\/([0-9a-f-]{36})\/lessons$/);
        if (lessonsMatch && req.method === 'GET') {
          const response = await modules.lessonsApi.GET(
            new Request(url, { method: req.method, headers: req.headers }),
            { params: Promise.resolve({ contextId: lessonsMatch[1] }) }
          );
          response.headers.forEach((value, key) => {
            if (key !== 'set-cookie') res.setHeader(key, value);
          });
          writeCookies();
          res.statusCode = response.status;
          res.end(await response.text());
          return;
        }

        const detailMatch = url.pathname.match(/^\/api\/learner\/contexts\/([0-9a-f-]{36})\/lessons\/([0-9a-f-]{36})$/);
        if (detailMatch && req.method === 'GET') {
          const response = await modules.lessonDetailApi.GET(
            new Request(url, { method: req.method, headers: req.headers }),
            { params: Promise.resolve({ contextId: detailMatch[1], lessonId: detailMatch[2] }) }
          );
          response.headers.forEach((value, key) => {
            if (key !== 'set-cookie') res.setHeader(key, value);
          });
          writeCookies();
          res.statusCode = response.status;
          res.end(await response.text());
          return;
        }

        const consumptionMatch = url.pathname.match(
          /^\/api\/learner\/contexts\/([0-9a-f-]{36})\/lessons\/([0-9a-f-]{36})\/consumption$/
        );
        if (consumptionMatch) {
          const chunks = [];
          for await (const chunk of req) chunks.push(chunk);
          const body = Buffer.concat(chunks);
          const handler =
            req.method === 'POST' ? modules.consumptionApi.POST : modules.consumptionApi.GET;
          const response = await handler(
            new Request(url, {
              method: req.method,
              headers: req.headers,
              ...(body.length ? { body } : {}),
            }),
            { params: Promise.resolve({ contextId: consumptionMatch[1], lessonId: consumptionMatch[2] }) }
          );
          response.headers.forEach((value, key) => {
            if (key !== 'set-cookie') res.setHeader(key, value);
          });
          writeCookies();
          res.statusCode = response.status;
          res.end(await response.text());
          return;
        }

        const attemptsMatch = url.pathname.match(
          /^\/api\/learner\/contexts\/([a-zA-Z0-9_-]+)\/lessons\/([a-zA-Z0-9_-]+)\/attempts$/
        );
        if (attemptsMatch && req.method === 'POST') {
          const chunks = [];
          for await (const chunk of req) chunks.push(chunk);
          const body = Buffer.concat(chunks);
          const response = await modules.attemptsApi.POST(
            new Request(url, {
              method: req.method,
              headers: req.headers,
              ...(body.length ? { body } : {}),
            }),
            { params: Promise.resolve({ contextId: attemptsMatch[1], lessonId: attemptsMatch[2] }) }
          );
          response.headers.forEach((value, key) => {
            if (key !== 'set-cookie') res.setHeader(key, value);
          });
          writeCookies();
          res.statusCode = response.status;
          res.end(await response.text());
          return;
        }

        const responsesMatch = url.pathname.match(
          /^\/api\/learner\/contexts\/([a-zA-Z0-9_-]+)\/lessons\/([a-zA-Z0-9_-]+)\/attempts\/([a-zA-Z0-9_-]+)\/responses$/
        );
        if (responsesMatch && req.method === 'POST') {
          const chunks = [];
          for await (const chunk of req) chunks.push(chunk);
          const body = Buffer.concat(chunks);
          const response = await modules.responsesApi.POST(
            new Request(url, {
              method: req.method,
              headers: req.headers,
              ...(body.length ? { body } : {}),
            }),
            { params: Promise.resolve({ contextId: responsesMatch[1], lessonId: responsesMatch[2], attemptId: responsesMatch[3] }) }
          );
          response.headers.forEach((value, key) => {
            if (key !== 'set-cookie') res.setHeader(key, value);
          });
          writeCookies();
          res.statusCode = response.status;
          res.end(await response.text());
          return;
        }

        const finalizeMatch = url.pathname.match(
          /^\/api\/learner\/contexts\/([a-zA-Z0-9_-]+)\/lessons\/([a-zA-Z0-9_-]+)\/attempts\/([a-zA-Z0-9_-]+)\/finalize$/
        );
        if (finalizeMatch && req.method === 'POST') {
          const chunks = [];
          for await (const chunk of req) chunks.push(chunk);
          const body = Buffer.concat(chunks);
          const response = await modules.finalizeApi.POST(
            new Request(url, {
              method: req.method,
              headers: req.headers,
              ...(body.length ? { body } : {}),
            }),
            { params: Promise.resolve({ contextId: finalizeMatch[1], lessonId: finalizeMatch[2], attemptId: finalizeMatch[3] }) }
          );
          response.headers.forEach((value, key) => {
            if (key !== 'set-cookie') res.setHeader(key, value);
          });
          writeCookies();
          res.statusCode = response.status;
          res.end(await response.text());
          return;
        }

        const attemptDetailMatch = url.pathname.match(
          /^\/api\/learner\/contexts\/([a-zA-Z0-9_-]+)\/lessons\/([a-zA-Z0-9_-]+)\/attempts\/([a-zA-Z0-9_-]+)$/
        );
        if (attemptDetailMatch && req.method === 'GET') {
          const response = await modules.attemptDetailApi.GET(
            new Request(url, { method: req.method, headers: req.headers }),
            { params: Promise.resolve({ contextId: attemptDetailMatch[1], lessonId: attemptDetailMatch[2], attemptId: attemptDetailMatch[3] }) }
          );
          response.headers.forEach((value, key) => {
            if (key !== 'set-cookie') res.setHeader(key, value);
          });
          writeCookies();
          res.statusCode = response.status;
          res.end(await response.text());
          return;
        }

        const contextPatchMatch = url.pathname.match(
          /^\/api\/learner\/contexts\/([a-zA-Z0-9_-]+)$/
        );
        if (contextPatchMatch && req.method === 'PATCH') {
          const chunks = [];
          for await (const chunk of req) chunks.push(chunk);
          const body = Buffer.concat(chunks);
          const response = await modules.contextPatch.PATCH(
            new Request(url, {
              method: req.method,
              headers: req.headers,
              ...(body.length ? { body } : {}),
            }),
            { params: Promise.resolve({ contextId: contextPatchMatch[1] }) }
          );
          response.headers.forEach((value, key) => {
            if (key !== 'set-cookie') res.setHeader(key, value);
          });
          writeCookies();
          res.statusCode = response.status;
          res.end(await response.text());
          return;
        }

        if (url.pathname === '/api/learner/context/options' && req.method === 'GET') {
          const response = await modules.contextOptions.GET(
            new Request(url, { method: req.method, headers: req.headers })
          );
          response.headers.forEach((value, key) => {
            if (key !== 'set-cookie') res.setHeader(key, value);
          });
          writeCookies();
          res.statusCode = response.status;
          res.end(await response.text());
          return;
        }

        if (url.pathname === '/api/learner/context' && req.method === 'POST') {
          const chunks = [];
          for await (const chunk of req) chunks.push(chunk);
          const body = Buffer.concat(chunks);
          const response = await modules.context.POST(
            new Request(url, {
              method: req.method,
              headers: req.headers,
              ...(body.length ? { body } : {}),
            })
          );
          response.headers.forEach((value, key) => {
            if (key !== 'set-cookie') res.setHeader(key, value);
          });
          writeCookies();
          res.statusCode = response.status;
          res.end(await response.text());
          return;
        }

        const handler = {
          '/api/auth/login': modules.login.POST,
          '/api/auth/logout': modules.logout.POST,
          '/api/learner/context': modules.context.GET,
        }[url.pathname];

        if (handler) {
          const chunks = [];
          for await (const chunk of req) chunks.push(chunk);
          const body = Buffer.concat(chunks);
          const response = await handler(
            new Request(url, {
              method: req.method,
              headers: req.headers,
              ...(body.length ? { body } : {}),
            })
          );
          response.headers.forEach((value, key) => {
            if (key !== 'set-cookie') res.setHeader(key, value);
          });
          writeCookies();
          res.statusCode = response.status;
          res.end(await response.text());
          return;
        }

        res.writeHead(404);
        res.end('Not found');
      } catch (error) {
        writeCookies();
        if (error.destination) {
          res.writeHead(302, { Location: error.destination });
          res.end();
          return;
        }
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { code: 'TEST_SERVER_ERROR', message: error.name } }));
      }
    });
  });
  server.fixture = state;
  server.once('close', () => {
    globalThis.fetch = originalFetch;
    setLearnerPrismaForTest(null);
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
  return server;
}
