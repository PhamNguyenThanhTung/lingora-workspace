import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const esbuild = require('esbuild');

const appDir = path.resolve(import.meta.dirname, '../../..');
const dbUrl = 'file://' + path.resolve(appDir, 'src/server/db/index.js');

const externalDbPlugin = {
  name: 'external-db',
  setup(build) {
    build.onResolve({ filter: /db\/index\.js/ }, () => ({
      path: dbUrl,
      external: true,
    }));
  },
};

export async function compileAndLoadPage(pageRelativePath, options = {}) {
  const entryPoint = path.resolve(appDir, pageRelativePath);
  const cacheName = `.cache-${path.basename(pageRelativePath, '.tsx')}-${Date.now()}-${Math.random().toString(36).slice(2)}.mjs`;
  const tempOutfile = path.resolve(appDir, 'tests/feature/harness', cacheName);

  const defaultAlias = {
    '@': path.resolve(appDir, 'src'),
    'next/headers': 'next/headers.js',
    'next/navigation': 'next/navigation.js',
  };

  const bridgeAlias = {
    '@': path.resolve(appDir, 'src'),
    'next/headers': path.resolve(appDir, 'tests/feature/harness/next-headers-bridge.mjs'),
    'next/navigation': path.resolve(appDir, 'tests/feature/harness/next-navigation-bridge.mjs'),
  };

  await esbuild.build({
    entryPoints: [entryPoint],
    bundle: true,
    format: 'esm',
    platform: 'node',
    packages: 'external',
    outfile: tempOutfile,
    plugins: [externalDbPlugin],
    alias: options.useBridge ? bridgeAlias : defaultAlias,
  });

  try {
    const mod = await import(`file://${tempOutfile}`);
    return mod.default;
  } finally {
    try {
      if (fs.existsSync(tempOutfile)) {
        fs.unlinkSync(tempOutfile);
      }
    } catch {}
  }
}
