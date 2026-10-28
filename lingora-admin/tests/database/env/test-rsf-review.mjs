import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import {spawnSync} from 'node:child_process';
const base=new URL('./',import.meta.url).pathname;
const eg=await import('./env-guard.mjs');
const sm=await import('./stack-manager.mjs');
function denied(fn){try{fn();}catch{}}
function withFixture(fn){const root=fs.mkdtempSync(path.join(os.tmpdir(),'codex-lock-contract-'));try{return fn(root,sm.allocateRun({runsDir:root}));}finally{fs.rmSync(root,{recursive:true,force:true});}}
function unknownStat(fn){const read=fs.readFileSync;fs.readFileSync=function(p,...args){if(String(p)===`/proc/${process.pid}/stat`){const e=new Error('review synthetic EACCES');e.code='EACCES';throw e;}return read.call(this,p,...args);};try{return fn();}finally{fs.readFileSync=read;}}
for(const kind of ['namespace','run']) {
 const get=(root,f)=>kind==='namespace'?eg.acquireNamespaceReservation(root):sm.acquireRunLock(f.runDir,f.runId);
 const release=(root,f,t)=>kind==='namespace'?eg.releaseNamespaceReservation(root,t):sm.releaseRunLock(f.runDir,t);
 for(const [label,patch] of [
  ['missing ticks',r=>delete r.start_ticks], ['zero ticks',r=>r.start_ticks='0'], ['bad ticks',r=>r.start_ticks='no'],
  ['missing boot',r=>delete r.boot_id],['invalid boot',r=>r.boot_id='invalid-boot'],
  ['wrong operation',r=>r.operation='foreign'],['wrong resource',r=>{for(const k of Object.keys(r))if(k.includes('resource')||k.includes('path'))r[k]='/tmp/wrong-resource';r.resource='/tmp/wrong-resource';}],
  ['foreign pid',r=>r.pid=1],...(kind==='run'?[['wrong run id',r=>r.run_id='run-0000000000000000']]:[])
 ]) test(`${kind}: ${label} denies release and preserves marker`,()=>withFixture((root,f)=>{
  const lock=get(root,f),original=fs.readFileSync(lock.lockFile);const rec=JSON.parse(original);patch(rec);fs.writeFileSync(lock.lockFile,JSON.stringify(rec));denied(()=>release(root,f,lock.token));assert.ok(fs.existsSync(lock.lockFile));fs.writeFileSync(lock.lockFile,original);release(root,f,lock.token);assert.equal(fs.existsSync(lock.lockFile),false);
 }));
 test(`${kind}: UNKNOWN caller denies acquisition`,()=>withFixture((root,f)=>{unknownStat(()=>denied(()=>get(root,f)));assert.equal(fs.existsSync(path.join(kind==='namespace'?root:f.runDir,kind==='namespace'?'.namespace.lock':'.run.lock')),false);}));
 test(`${kind}: UNKNOWN caller denies release`,()=>withFixture((root,f)=>{const lock=get(root,f);unknownStat(()=>denied(()=>release(root,f,lock.token)));assert.ok(fs.existsSync(lock.lockFile));release(root,f,lock.token);assert.equal(fs.existsSync(lock.lockFile),false);}));
 test(`${kind}: child cannot release parent ownership`,()=>withFixture((root,f)=>{const lock=get(root,f);const code=`import {${kind==='namespace'?'releaseNamespaceReservation':'releaseRunLock'} as release} from ${JSON.stringify(base+(kind==='namespace'?'env-guard.mjs':'stack-manager.mjs'))};try{release(process.argv[1],process.argv[2])}catch{}`;const child=spawnSync(process.execPath,['--input-type=module','-e',code,kind==='namespace'?root:f.runDir,lock.token]);assert.equal(child.status,0);assert.ok(fs.existsSync(lock.lockFile));release(root,f,lock.token);}));
}
for(const mode of ['bad-boot','unknown-stat','wrong-resource']) test(`held namespace ${mode} denies run acquisition`,()=>withFixture((root,f)=>{
 const ns=eg.acquireNamespaceReservation(root);const original=fs.readFileSync(ns.lockFile),rec=JSON.parse(original);
 if(mode==='bad-boot')rec.boot_id='invalid-boot';if(mode==='wrong-resource'){for(const k of Object.keys(rec))if(k.includes('resource')||k.includes('path'))rec[k]='/tmp/wrong-resource';rec.resource='/tmp/wrong-resource';}fs.writeFileSync(ns.lockFile,JSON.stringify(rec));
 const attempt=()=>denied(()=>sm.acquireRunLock(f.runDir,f.runId,{runsDir:root,heldNamespaceToken:ns.token}));if(mode==='unknown-stat')unknownStat(attempt);else attempt();assert.equal(fs.existsSync(path.join(f.runDir,'.run.lock')),false);fs.writeFileSync(ns.lockFile,original);eg.releaseNamespaceReservation(root,ns.token);
}));
test('run acquisition cannot bind another run ID to the same directory',()=>withFixture((root,f)=>{denied(()=>sm.acquireRunLock(f.runDir,'run-0000000000000000'));assert.equal(fs.existsSync(path.join(f.runDir,'.run.lock')),false);}));
for(const boot of ['', 'unknown-boot', 'not-a-uuid']) test(`invalid current boot ${JSON.stringify(boot)} denies acquisition`,()=>withFixture((root,f)=>{
 const read=fs.readFileSync;fs.readFileSync=function(p,...args){if(String(p)==='/proc/sys/kernel/random/boot_id')return boot;return read.call(this,p,...args);};
 try{denied(()=>eg.acquireNamespaceReservation(root));denied(()=>sm.acquireRunLock(f.runDir,f.runId));assert.equal(fs.existsSync(path.join(root,'.namespace.lock')),false);assert.equal(fs.existsSync(path.join(f.runDir,'.run.lock')),false);}finally{fs.readFileSync=read;}
}));

for(const kind of ['namespace','run']) test(`${kind}: missing caller token denies release`,()=>withFixture((root,f)=>{
 const lock=kind==='namespace'?eg.acquireNamespaceReservation(root):sm.acquireRunLock(f.runDir,f.runId);
 for(const token of [undefined,null,'']) {denied(()=>kind==='namespace'?eg.releaseNamespaceReservation(root,token):sm.releaseRunLock(f.runDir,token));assert.ok(fs.existsSync(lock.lockFile));}
 if(kind==='namespace')eg.releaseNamespaceReservation(root,lock.token);else sm.releaseRunLock(f.runDir,lock.token);
}));
test('contradictory KNOWN process observation cannot authorize quiescence',()=>{
 assert.throws(()=>eg.validateProcessSnapshot({status:'KNOWN',processes:[],unobservable:[123]}),/OBSERVATION_INVALID/);
 assert.throws(()=>eg.validateProcessSnapshot({status:'KNOWN',processes:[{pid:123}]}),/OBSERVATION_INVALID/);
});
for(const fault of ['self-fd','proc-stat','foreign-fd','foreign-stat']) test(`scanner fails closed on ${fault} permission error`,()=>{
 const read=fs.readFileSync,ls=fs.readdirSync,link=fs.readlinkSync,stat=fs.statSync;
 const fake=987654;const deniedError=()=>Object.assign(new Error('synthetic denied'),{code:'EACCES'});
 fs.readdirSync=function(p,...args){p=String(p);if(p==='/proc')return [String(fake)];if(p===`/proc/${process.pid}/fd`)return fault==='self-fd'?['99']:[];if(p===`/proc/${fake}/fd`)return ['99'];return ls.call(this,p,...args);};
 fs.statSync=function(p,...args){if(String(p)===`/proc/${fake}`){if(fault==='proc-stat')throw deniedError();return {uid:process.getuid()};}return stat.call(this,p,...args);};
 fs.readlinkSync=function(p,...args){p=String(p);if(p===`/proc/${process.pid}/fd/99`||p===`/proc/${fake}/fd/99`)throw deniedError();if(p===`/proc/${fake}/cwd`)return '/unrelated';return link.call(this,p,...args);};
 fs.readFileSync=function(p,...args){p=String(p);if(p===`/proc/${fake}/stat`){if(fault==='foreign-stat')throw deniedError();return `${fake} (synthetic) S 1 ${'0 '.repeat(17)}12345 0`;}if(p===`/proc/${fake}/cmdline`||p.endsWith('/maps'))return '';return read.call(this,p,...args);};
 try{const snap=eg.snapshotRunProcesses('/unrelated-test-home',null,null);assert.equal(snap.status,'UNKNOWN');if(fault!=='self-fd')assert.ok(snap.unobservable.includes(fake));}finally{fs.readFileSync=read;fs.readdirSync=ls;fs.readlinkSync=link;fs.statSync=stat;}
});

test('namespace cleanliness guard requires full held ownership',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'codex-clean-gate-'));
 try{const ns=eg.acquireNamespaceReservation(root);assert.throws(()=>eg.verifyNamespaceClean(root),/PENDING_GUARD_FAIL/);assert.equal(eg.verifyNamespaceClean(root,{heldNamespaceToken:ns.token}).clean,true);
 const raw=fs.readFileSync(ns.lockFile);const rec=JSON.parse(raw);delete rec.boot_id;fs.writeFileSync(ns.lockFile,JSON.stringify(rec));assert.throws(()=>eg.verifyNamespaceClean(root,{heldNamespaceToken:ns.token}),/PENDING_GUARD_FAIL/);fs.writeFileSync(ns.lockFile,raw);eg.releaseNamespaceReservation(root,ns.token);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('malformed socket observation cannot establish quiescence',()=>{
 for(const snap of [null,{status:'UNKNOWN',activePorts:[]},{status:'KNOWN',activePorts:''},{status:'KNOWN'}])assert.equal(eg.verifySocketsQuiescent([],1,0,{adapters:{snapshotRunSockets:()=>snap}}),false);
});
test('post-recovery prune requires namespace identity and preserves cache on bad ownership',()=>withFixture((root,f)=>{
 const a=JSON.parse(fs.readFileSync(f.recordPath));Object.assign(a,{phase:'DESTROYED',tombstone:true,pending_operation:null,instance_id:'a'.repeat(64)});sm.persistAuthorityAtomic(f.recordPath,a);
 const cache=path.join(f.homeDir,'cache');fs.mkdirSync(cache);fs.writeFileSync(path.join(cache,'canary'),'keep');
 const rec=eg.buildStrictLockRecord({operation:'recovery',resource:f.runDir,runId:f.runId});fs.writeFileSync(path.join(f.runDir,'.recovery.lock'),JSON.stringify(rec),{mode:0o600});
 const ns=eg.acquireNamespaceReservation(root);const original=fs.readFileSync(ns.lockFile);
 const adapters={cliExecutor:(cli,args)=>({status:0,stdout:args.includes('--version')?eg.PINNED_CLI_VERSION:'{"stacks":[]}'}),snapshotRunProcesses:()=>({status:'KNOWN',processes:[]}),snapshotRunSockets:()=>({status:'KNOWN',activePorts:[]}),portsDb:()=>({quiescent:true})};
 const opts={isPostRecovery:true,heldLockToken:rec.token,adapters};
 assert.throws(()=>eg.pruneRunCache(f.runDir,opts),/requires held namespace/);assert.ok(fs.existsSync(cache));
 const bad=JSON.parse(original);delete bad.start_ticks;fs.writeFileSync(ns.lockFile,JSON.stringify(bad));
 assert.throws(()=>eg.pruneRunCache(f.runDir,{...opts,heldNamespaceToken:ns.token}),/namespace reservation validation/);assert.ok(fs.existsSync(cache));
 fs.writeFileSync(ns.lockFile,original);assert.equal(eg.pruneRunCache(f.runDir,{...opts,heldNamespaceToken:ns.token}).pruned,true);assert.equal(fs.existsSync(cache),false);eg.releaseNamespaceReservation(root,ns.token);
}));
