import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';

const appDir = path.resolve(import.meta.dirname, '../../..');
let cachedBundle = null;

export async function buildRegistrationBundle() {
  if (cachedBundle) return cachedBundle;

  const result = await build({
    entryPoints: [path.join(import.meta.dirname, 'registration-entry.tsx')],
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

export async function startRegistrationServer(port = 3025) {
  const bundle = await buildRegistrationBundle();
  const css = fs.readFileSync(path.join(appDir, 'src/app/globals.css'), 'utf8');

  const html = `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8">
    <title>Lingora Auth Test</title>
    <style>${css}</style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/bundle.js"></script>
  </body>
</html>`;

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    res.setHeader('Cache-Control', 'no-store, private');

    if (url.pathname === '/bundle.js') {
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end(bundle);
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  });

  await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));

  return {
    origin: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}
