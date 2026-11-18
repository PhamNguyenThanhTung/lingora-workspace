import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';

const appDir = path.resolve(import.meta.dirname, '../../..');
let cachedBundle = null;

export async function buildOnboardingBundle() {
  if (cachedBundle) return cachedBundle;

  const result = await build({
    entryPoints: [path.join(import.meta.dirname, 'onboarding-entry.tsx')],
    bundle: true,
    format: 'esm',
    jsx: 'automatic',
    write: false,
    define: { 'process.env.NODE_ENV': JSON.stringify('test') },
    alias: {
      '@': path.join(appDir, 'src'),
      'next/navigation': path.join(import.meta.dirname, 'mock-next-navigation.ts'),
      'next/link': path.join(import.meta.dirname, 'mock-next-link.tsx'),
    },
  });

  cachedBundle = result.outputFiles[0].text;
  return cachedBundle;
}

export async function startOnboardingServer(port = 3030) {
  const bundle = await buildOnboardingBundle();
  const css = fs.readFileSync(path.join(appDir, 'src/app/globals.css'), 'utf8');

  const fixture = {
    options: {
      languages: [
        {
          id: 'lang-en',
          code: 'en',
          names: { vi: 'Tiếng Anh', en: 'English' },
          courses: [
            {
              id: 'course-en',
              names: { vi: 'Tiếng Anh Giao Tiếp', en: 'Conversational English' },
              levels: [
                { id: 'lvl-a1', code: 'A1', label: { vi: 'A1 - Mới bắt đầu', en: 'Beginner' }, position: 1 },
                { id: 'lvl-a2', code: 'A2', label: { vi: 'A2 - Sơ cấp', en: 'Elementary' }, position: 2 },
              ],
            },
          ],
        },
        {
          id: 'lang-ja',
          code: 'ja',
          names: { vi: 'Tiếng Nhật', en: 'Japanese' },
          courses: [
            {
              id: 'course-ja',
              names: { vi: 'Tiếng Nhật Cơ Bản', en: 'Basic Japanese' },
              levels: [
                { id: 'lvl-n5', code: 'N5', label: { vi: 'N5 - Nhập môn', en: 'Introductory' }, position: 1 },
              ],
            },
          ],
        },
      ],
    },
    preview: {
      status: 'READY',
      source: 'DEFAULT',
      course: { id: 'course-en', names: { vi: 'Tiếng Anh Giao Tiếp', en: 'Conversational English' } },
      startLevel: { id: 'lvl-a1', code: 'A1', label: { vi: 'A1 - Mới bắt đầu', en: 'Beginner' }, position: 1 },
      dailyGoalMinutes: 10,
      reasonCodes: ['PURPOSE_MATCH', 'LOWEST_AVAILABLE_LEVEL'],
      nextLesson: {
        id: 'les-1',
        title: { vi: 'Bài 1: Giới thiệu bản thân', en: 'Lesson 1: Self-introduction' },
        unitId: 'unit-1',
        unitTitle: { vi: 'Unit 1: Khởi động', en: 'Unit 1: Kickoff' },
        actionUrl: '/api/learner/contexts/ctx-new-123/lessons/les-1/actions',
        href: '/learn/ctx-new-123/les-1',
      },
    },
    completeStatus: 200,
    completeResponse: {
      context: {
        id: 'ctx-new-123',
        status: 'ACTIVE',
        rowVersion: '1',
        startSource: 'DEFAULT',
        targetLanguage: { id: 'lang-en', code: 'en', names: { vi: 'Tiếng Anh', en: 'English' } },
        course: { id: 'course-en', names: { vi: 'Tiếng Anh Giao Tiếp', en: 'Conversational English' }, isActive: true },
        framework: { id: 'fw-cefr', code: 'CEFR', version: '2020', names: { vi: 'CEFR', en: 'CEFR' } },
        selectedStartLevel: { id: 'lvl-a1', code: 'A1', label: { vi: 'A1 - Mới bắt đầu', en: 'Beginner' }, position: 1 },
        workingLevel: { id: 'lvl-a1', code: 'A1', label: { vi: 'A1 - Mới bắt đầu', en: 'Beginner' }, position: 1 },
      },
      plan: {
        id: 'plan-123',
        contextId: 'ctx-new-123',
        courseId: 'course-en',
        startLevel: { id: 'lvl-a1', code: 'A1', label: { vi: 'A1 - Mới bắt đầu', en: 'Beginner' }, position: 1 },
        source: 'DEFAULT',
        dailyGoalMinutes: 10,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        nextLesson: {
          id: 'les-1',
          title: { vi: 'Bài 1: Giới thiệu bản thân', en: 'Lesson 1: Self-introduction' },
          unitId: 'unit-1',
          unitTitle: { vi: 'Unit 1: Khởi động', en: 'Unit 1: Kickoff' },
          actionUrl: '/api/learner/contexts/ctx-new-123/lessons/les-1/actions',
          href: '/learn/ctx-new-123/les-1',
        },
      },
      nextLesson: {
        id: 'les-1',
        title: { vi: 'Bài 1: Giới thiệu bản thân', en: 'Lesson 1: Self-introduction' },
        unitId: 'unit-1',
        unitTitle: { vi: 'Unit 1: Khởi động', en: 'Unit 1: Kickoff' },
        actionUrl: '/api/learner/contexts/ctx-new-123/lessons/les-1/actions',
        href: '/learn/ctx-new-123/les-1',
      },
    },
    completeCallCount: 0,
    lastCompletePayload: null,
  };

  const html = `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8">
    <title>Lingora Onboarding Test</title>
    <style>${css}</style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/bundle.js"></script>
  </body>
</html>`;

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    res.setHeader('Cache-Control', 'no-store, private');

    if (url.pathname === '/bundle.js') {
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end(bundle);
      return;
    }

    if (url.pathname === '/api/learner/context/options' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, data: fixture.options }));
      return;
    }

    if (url.pathname === '/api/learner/onboarding/preview' && req.method === 'POST') {
      let body = '';
      for await (const chunk of req) body += chunk;
      const parsed = body ? JSON.parse(body) : {};

      const previewData = { ...fixture.preview };
      if (parsed.dailyGoalMinutes) {
        previewData.dailyGoalMinutes = parsed.dailyGoalMinutes;
      }
      if (parsed.languageId === 'lang-ja') {
        previewData.course = { id: 'course-ja', names: { vi: 'Tiếng Nhật Cơ Bản', en: 'Basic Japanese' } };
        previewData.startLevel = { id: 'lvl-n5', code: 'N5', label: { vi: 'N5 - Nhập môn', en: 'Introductory' }, position: 1 };
      }
      if (parsed.entryChoice?.startSource === 'SELF_REPORT') {
        previewData.source = 'SELF_REPORT';
        if (parsed.entryChoice.levelId === 'lvl-a2') {
          previewData.startLevel = { id: 'lvl-a2', code: 'A2', label: { vi: 'A2 - Sơ cấp', en: 'Elementary' }, position: 2 };
        }
      }
      if (parsed.entryChoice?.courseId) {
        const selectedCourse = fixture.options.languages.flatMap((language) => language.courses)
          .find((course) => course.id === parsed.entryChoice.courseId);
        if (selectedCourse) previewData.course = { id: selectedCourse.id, names: selectedCourse.names };
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, data: previewData }));
      return;
    }

    if (url.pathname === '/api/learner/onboarding/complete' && req.method === 'POST') {
      let body = '';
      for await (const chunk of req) body += chunk;
      fixture.completeCallCount++;
      fixture.lastCompletePayload = body ? JSON.parse(body) : null;

      const response = JSON.parse(JSON.stringify(fixture.completeResponse));
      const selectedCourseId = fixture.lastCompletePayload?.expectedCourseId;
      const selectedCourse = fixture.options.languages.flatMap((language) => language.courses)
        .find((course) => course.id === selectedCourseId);
      if (selectedCourse && response.context?.course) {
        response.context.course = { ...response.context.course, id: selectedCourse.id, names: selectedCourse.names };
      }
      if (selectedCourse && response.plan) response.plan.courseId = selectedCourse.id;

      res.writeHead(fixture.completeStatus, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify(
          fixture.completeStatus === 200
            ? { ok: true, data: response }
            : fixture.completeResponse
        )
      );
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  });

  await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));

  return {
    origin: `http://127.0.0.1:${port}`,
    fixture,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}
