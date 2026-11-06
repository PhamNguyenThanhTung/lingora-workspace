import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
const appDir = path.resolve(import.meta.dirname, '../../..');

export async function compileProductionModules() {
  fs.mkdirSync(path.resolve(appDir, '../tmp'), { recursive: true });
  const temp = fs.mkdtempSync(path.resolve(appDir, '../tmp/slice10-pages-'));
  const bridge = pathToFileURL(path.join(import.meta.dirname, 'request-context.mjs')).href;
  const db = pathToFileURL(path.join(appDir, 'src/server/db/index.ts')).href;
  const entryPoints = {
    loginPage: 'src/app/login/page.tsx',
    homePage: 'src/app/home/page.tsx',
    cataloguePage: 'src/app/learn/[contextId]/page.tsx',
    lessonPlayerPage: 'src/app/learn/[contextId]/[lessonId]/page.tsx',
    login: 'src/app/api/auth/login/route.ts',
    logout: 'src/app/api/auth/logout/route.ts',
    context: 'src/app/api/learner/context/route.ts',
    contextOptions: 'src/app/api/learner/context/options/route.ts',
    contextPatch: 'src/app/api/learner/contexts/[contextId]/route.ts',
    lessonsApi: 'src/app/api/learner/contexts/[contextId]/lessons/route.ts',
    lessonDetailApi: 'src/app/api/learner/contexts/[contextId]/lessons/[lessonId]/route.ts',
    consumptionApi: 'src/app/api/learner/contexts/[contextId]/lessons/[lessonId]/consumption/route.ts',
    attemptsApi: 'src/app/api/learner/contexts/[contextId]/lessons/[lessonId]/attempts/route.ts',
    attemptDetailApi: 'src/app/api/learner/contexts/[contextId]/lessons/[lessonId]/attempts/[attemptId]/route.ts',
    responsesApi: 'src/app/api/learner/contexts/[contextId]/lessons/[lessonId]/attempts/[attemptId]/responses/route.ts',
    finalizeApi: 'src/app/api/learner/contexts/[contextId]/lessons/[lessonId]/attempts/[attemptId]/finalize/route.ts',
    reviewPage: 'src/app/review/page.tsx',
    reviewStartApi: 'src/app/api/learner/review/start/route.ts',
    reviewRespondApi: 'src/app/api/learner/review/respond/route.ts',
  };
  const result = {};
  try {
    for (const [name, relative] of Object.entries(entryPoints)) {
      const outfile = path.join(temp, `${name}.mjs`);
      await build({
        entryPoints: [path.join(appDir, relative)],
        outfile,
        bundle: true,
        format: 'esm',
        platform: 'node',
        packages: 'external',
        jsx: 'automatic',
        plugins: [
          {
            name: 'test-framework-boundaries',
            setup(b) {
              b.onResolve({ filter: /^next\/(headers|navigation)(\.js)?$/ }, () => ({
                path: bridge,
                external: true,
              }));
              b.onResolve({ filter: /^next\/link$/ }, () => ({
                path: 'next/link.js',
                external: true,
              }));
              b.onResolve({ filter: /server\/db\/index\.ts$|\.\.\/db\/index\.ts$/ }, () => ({
                path: db,
                external: true,
              }));
            },
          },
        ],
      });
      result[name] = await import(pathToFileURL(outfile));
    }
    return result;
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
