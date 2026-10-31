import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// The bundled shared client falls back to <app cwd>/generated/product-client.
// Reuse assets from the single schema owner; do not generate a second client/schema.
export function preparePrismaRuntime(source, destination) {
  const isEngine = name => /^(?:libquery_engine-|query_engine-).+\.node$/.test(name);
  const files = fs.readdirSync(source).filter(name => name === 'schema.prisma' || isEngine(name));
  if (!files.includes('schema.prisma') || !files.some(isEngine)) {
    throw new Error('Generated Prisma schema and native engine are required');
  }
  fs.mkdirSync(destination, { recursive: true });
  for (const name of files) fs.copyFileSync(path.join(source, name), path.join(destination, name));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  preparePrismaRuntime(
    fileURLToPath(new URL('../../lingora-admin/generated/product-client/', import.meta.url)),
    fileURLToPath(new URL('../generated/product-client/', import.meta.url)),
  );
}
