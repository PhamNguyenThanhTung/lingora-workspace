import fs from 'node:fs';
import pg from '/home/tung/workspace/school/project1/lingora-workspace/node_modules/pg/lib/index.js';
const s=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const expected=process.argv[3];
if(s.identity.id!==expected||s.runtime!=='native')throw Error('D0_IDENTITY_INVALID');
const u=new URL(s.env.DB_URL);
if(!['postgres:','postgresql:'].includes(u.protocol)||u.hostname!=='127.0.0.1'||u.port!=='54322'||u.pathname!=='/postgres'||u.username!=='postgres'||u.search||u.hash||!u.password)throw Error('D0_TARGET_INVALID');
const c=new pg.Client({host:'127.0.0.1',port:54322,user:'postgres',database:'postgres',password:decodeURIComponent(u.password),ssl:false,connectionTimeoutMillis:4000,query_timeout:5000,application_name:'lingora-d0'});
try {await c.connect();const q=await c.query("SELECT current_database() AS db, current_user AS usr, current_setting('server_version') AS server_version, inet_server_addr()::text AS server_addr, inet_server_port() AS server_port, pg_backend_pid() AS backend_pid");console.log(JSON.stringify({instance_id:expected,observation:q.rows[0]}));}
catch {console.error('D0_SQL_OBSERVATION_FAILED');process.exitCode=1;}
finally {await c.end().catch(()=>{});}
