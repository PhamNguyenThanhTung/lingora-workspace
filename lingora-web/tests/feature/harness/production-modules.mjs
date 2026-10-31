import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
const appDir=path.resolve(import.meta.dirname,'../../..');
export async function compileProductionModules() {
  fs.mkdirSync(path.resolve(appDir,'../tmp'),{recursive:true});
  const temp=fs.mkdtempSync(path.resolve(appDir,'../tmp/slice9-pages-'));
  const bridge=pathToFileURL(path.join(import.meta.dirname,'request-context.mjs')).href;
  const db=pathToFileURL(path.join(appDir,'src/server/db/index.ts')).href;
  const entryPoints={loginPage:'src/app/login/page.tsx',homePage:'src/app/home/page.tsx',login:'src/app/api/auth/login/route.ts',logout:'src/app/api/auth/logout/route.ts',context:'src/app/api/learner/context/route.ts'};
  const result={};
  try {
    for(const [name,relative] of Object.entries(entryPoints)) {
      const outfile=path.join(temp,`${name}.mjs`);
      await build({entryPoints:[path.join(appDir,relative)],outfile,bundle:true,format:'esm',platform:'node',packages:'external',jsx:'automatic',plugins:[{name:'test-framework-boundaries',setup(b){
        b.onResolve({filter:/^next\/(headers|navigation)(\.js)?$/},()=>({path:bridge,external:true}));
        b.onResolve({filter:/server\/db\/index\.ts$|\.\.\/db\/index\.ts$/},()=>({path:db,external:true}));
      }}]});
      result[name]=await import(pathToFileURL(outfile));
    }
    return result;
  } finally {fs.rmSync(temp,{recursive:true,force:true});}
}
