import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { preparePrismaRuntime } from '../../scripts/prepare-prisma-runtime.mjs';
import nextConfig from '../../next.config.mjs';

for (const engine of ['libquery_engine-rhel-openssl-3.0.x.so.node','libquery_engine-darwin-arm64.dylib.node']) {
  test(`build copies only schema and native runtime assets: ${engine}`, () => {
    const root=fs.mkdtempSync(path.join(os.tmpdir(),'s9-prisma-runtime-'));
    try {
      const source=path.join(root,'source'),target=path.join(root,'app/generated/product-client');
      fs.mkdirSync(source);
      for(const [name,value] of [['schema.prisma','schema'],[engine,'native engine'],['index.js','generated client'],['.env','never copy']])fs.writeFileSync(path.join(source,name),value);
      preparePrismaRuntime(source,target);
      assert.deepEqual(fs.readdirSync(target).sort(),[engine,'schema.prisma'].sort());
      assert.equal(fs.readFileSync(path.join(target,engine),'utf8'),'native engine');
      assert.equal(fs.readFileSync(path.join(target,'schema.prisma'),'utf8'),'schema');
    } finally {fs.rmSync(root,{recursive:true,force:true});}
  });
}
test('build fails before copying an incomplete generated runtime',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'s9-prisma-runtime-'));
  try {
    const source=path.join(root,'source'),target=path.join(root,'target');fs.mkdirSync(source);
    fs.writeFileSync(path.join(source,'schema.prisma'),'schema');
    assert.throws(()=>preparePrismaRuntime(source,target),/native engine/);
    assert.equal(fs.existsSync(target),false);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('Next traces learner runtime assets and the shared generated client outside the app',()=>{
  assert.equal(path.resolve(nextConfig.outputFileTracingRoot),path.resolve(import.meta.dirname,'../../..'));
  assert.deepEqual(nextConfig.outputFileTracingIncludes['/*'],['./generated/product-client/schema.prisma','./generated/product-client/*.node']);
});
