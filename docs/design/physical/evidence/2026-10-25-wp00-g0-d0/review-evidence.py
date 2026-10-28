#!/usr/bin/env python3
"""D0-only review of captured runtime evidence; no provider mutation."""
from pathlib import Path
import hashlib, json, subprocess, datetime, os
HERE=Path(__file__).resolve().parent
REPO=HERE.parents[4]
ROOT=Path((HERE/'private-root.txt').read_text().strip())
state=json.loads((ROOT/'state.json').read_text())
def read(n): return json.loads((HERE/(n+'.json')).read_text())
def output(n): return json.loads(read(n)['stdout_sanitized'])
def sha(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def put(n,d): (HERE/n).write_text(json.dumps(d,indent=2)+'\n')
checks={}
checks['pinned_version']=read('00-version')['stdout_sanitized'].strip()=='2.121.0'
checks['supabase_home_independent_of_HOME']=len(output('92-supabase-home-a-home-b')['stacks'])==1 and not output('93-supabase-home-b-home-a')['stacks']
checks['project_root_changes_identity']=output('91-prepare-home-factor-target')['id']!=output('95-other-project-same-name')['id']
checks['full_ID_does_not_enforce_workdir']=output('09-other-workdir-same-id')['identity']['project_root'].endswith('project-a') and read('09-other-workdir-same-id')['cwd'].endswith('project-b')
checks['full_ID_does_not_enforce_branch']=output('35-full-id-other-branch')['identity']['branch_context']=='refs/heads/d0-main'
checks['default_selection_varies_with_branch']=output('33-default-status-main')['identity']['id']!=output('37-default-status-alt')['identity']['id']
checks['prepare_timeout_nonzero']=all(read(n)['exit_code']!=0 and read(n)['timeout_injected'] for n in ['04-prepare-reserved-a','18-prepare-runtime-main'])
checks['paused_dispatched_zero_match']=all(x['name']!='d0-paused-intent' for x in output('38a-zero-match-while-native-cli-paused')['stacks'])
checks['same_intent_after_registration_kill']=read('68-hard-kill-caller-after-registration')['exit_code']==-9 and output('73-recover-crash-same-id')['id']==read('68-hard-kill-caller-after-registration')['registration_observed_before_kill']['id']
checks['malformed_delivery_reconciled']=read('76-malformed-delivery-after-side-effect')['same_as_actual_prepare_id'] and not read('76-malformed-delivery-after-side-effect')['delivered_json_parse_success']
checks['stopped_is_not_literal_state']=output('49-status-after-running-stop')['lifecycle'] is None and output('49-status-after-running-stop')['readiness']=='unavailable'
checks['unreachable_is_not_quiescent']=output('63-status-owner-unresponsive')['owner']=='unavailable' and len(read('65-owner-paused-services-alive')['private_root_processes'])==10
checks['stop_processes_quiescent']=not read('stop-process-comparison')['same_process_identities_remaining']
checks['destroy_quiescent']=not read('89-final-process-resource-quiescence')['same_process_identities_alive_after_destroy'] and not read('89-final-process-resource-quiescence')['remaining_owned_socket_inodes']
checks['repeat_stop_noop_ack']=output('79-stop-already-stopped')['stopped']==[] and len(output('79-stop-already-stopped')['not_running'])==1
checks['repeat_destroy_nonzero']=read('87-repeat-native-destroy')['exit_code']!=0
checks['credential_reacquisition']=read('29-credential-reacquisition')['same_env_values_start_vs_status']
checks['SQL_reacquired_target']=read('31-sql-from-status')['exit_code']==0
checks['member_continuity_stop_start']=read('62-stop-start-continuity')['member_ids_stable_stop_start']
checks['logical_id_reused_generation_changes']=read('112-initialized-generation-comparison')['same_logical_id'] and not read('112-initialized-generation-comparison')['member_ids_equal']
checks['final_registries_empty']=not output('114-final-registry-a')['stacks'] and not output('115-final-registry-b')['stacks']
checks['final_owned_processes_absent']=not read('116-final-provider-state')['native_records'] and not read('116-final-provider-state')['private_root_processes']
for n in ['08-other-home-same-id','10-default-with-named-only','34-default-status-other-branch','41-id-name-conflict','42-malformed-stop-argv','43-invalid-runtime-no-allocation','86-status-destroyed-id','87-repeat-native-destroy']:
 checks[n+'_nonzero']=read(n)['exit_code']!=0
commands=[]
for f in sorted(HERE.glob('*.json')):
 d=json.loads(f.read_text())
 if 'command_argv' in d:
  commands.append({'evidence':f.name,'argv':d['command_argv'],'cwd':d.get('cwd'),'exit_code':d.get('exit_code'),'timeout_injected':d.get('timeout_injected',False),'observed_stdout_shape':d.get('stdout_shape'),'binary_sha256':d.get('binary_sha256')})
put('command-index.json',commands)
put('schema-index.json',[{'evidence':x['evidence'],'command':x['argv'][1:3], 'exit_code':x['exit_code'],'shape':x['observed_stdout_shape']} for x in commands if x['observed_stdout_shape'] is not None])
put('intent-ledger.json',{'private_root':str(ROOT),'intents':state['intents'],'interpretation':'recorded before prepare except explicitly never-dispatched reservation; no secret values; branch transition fixture is separately recorded'})
node=Path(state['node_dir'])/'node'
cmd=[str(node),'--version']; proc=subprocess.run(cmd,env={'PATH':str(node.parent)+':/usr/bin:/bin','HOME':str(ROOT/'home-b')},cwd=ROOT, capture_output=True,text=True)
put('toolchain-and-inputs.json',{'utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'platform':os.uname()._asdict() if hasattr(os.uname(),'_asdict') else list(os.uname()),'boot_id':Path('/proc/sys/kernel/random/boot_id').read_text().strip(),'node':{'command':cmd,'cwd':str(ROOT),'exit_code':proc.returncode,'stdout':proc.stdout,'stderr':proc.stderr,'sha256':sha(node)},'cli_sha256':sha(REPO/'node_modules/@supabase/cli-linux-x64/bin/supabase'),'cli_version_evidence':'00-version.json','fixture_sha256':{p:sha(ROOT/p/'supabase/config.toml') for p in ['project-a','project-b']},'repository_input_sha256':{p:sha(REPO/p) for p in ['supabase/config.toml','package.json','package-lock.json','lingora-admin/package.json','lingora-admin/tests/database/env/stack-manager.mjs','lingora-admin/tests/database/env/env-guard.mjs','lingora-admin/tests/database/scaffolds/runner-base.mjs','scripts/verify-dependencies.mjs','scripts/verify-provenance.py']},'recorder_final_sha256':sha(HERE/'probe.py'),'recorder_evolution':'optional HOME-factor inputs and recorder/config hashes added during experiments; earlier observations not retroactively assigned the final recorder hash','package_versions':{p:json.loads((REPO/'node_modules'/p/'package.json').read_text())['version'] for p in ['supabase','pg','@supabase/cli-linux-x64']}})
# Scan actual known generated secret values without printing values, even on failure.
secrets=[v.encode() for v in state['secrets'] if isinstance(v,str) and len(v)>=8 and v!='postgres']
leaks=[]
for p in HERE.rglob('*'):
 if p.is_file() and '__pycache__' not in p.parts:
  b=p.read_bytes()
  if any(v in b for v in secrets): leaks.append(str(p.relative_to(HERE)))
checks['published_artifacts_no_known_generated_secrets']=not leaks
put('codex-observation-checks.json',{'checks':checks,'failed_checks':[k for k,v in checks.items() if not v],'known_generated_secret_scan':{'files_with_matches':leaks,'minimum_value_length':8,'exclusions':'short fixed strings, including postgres database/user/default provider password; URI password fields and env values independently projected out','scope':'known generated values in D0 artifacts only; not proof against arbitrary unknown payloads and not harness canary coverage'},'command_count':len(commands),'reviewer':'Codex direct evidence cross-check; no worker PASS claim'})
print(json.dumps({'checks':len(checks),'failed':[k for k,v in checks.items() if not v],'command_records':len(commands),'secret_matched_files':leaks}))
if not all(checks.values()): raise SystemExit(1)
