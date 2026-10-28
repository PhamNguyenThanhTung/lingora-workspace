#!/usr/bin/env python3
"""D0 experiment recorder only. Does not import or modify the WP-00 harness."""
import argparse
import datetime
import hashlib
import json
import os
from pathlib import Path
import re
import signal
import subprocess
import time

HERE = Path(__file__).resolve().parent
ROOT = Path((HERE / 'private-root.txt').read_text().strip())
STATE = ROOT / 'state.json'

def load():
    return json.loads(STATE.read_text())

def save(s):
    STATE.write_text(json.dumps(s, indent=2))
    STATE.chmod(0o600)

def shape(v):
    if isinstance(v, dict):
        return {k: shape(x) for k, x in v.items()}
    if isinstance(v, list):
        items = []
        for x in v:
            t = shape(x)
            if t not in items:
                items.append(t)
        return {'type': 'array', 'items_observed': items}
    if v is None:
        return 'null'
    return {str: 'string', bool: 'boolean', int: 'integer', float: 'number'}.get(type(v), 'unknown')

def remember_secrets(v, s):
    if isinstance(v, dict):
        for k, x in v.items():
            if isinstance(x, str) and any(z in k.lower() for z in ['password', 'secret', 'token', 'key']):
                s['secrets'].append(x)
            if k.lower() == 'env' and isinstance(x, dict):
                for ek, ev in x.items():
                    if isinstance(ev, str):
                        if any(z in ek.lower() for z in ['key', 'secret', 'token', 'password']):
                            s['secrets'].append(ev)
                        if ek == 'DB_URL':
                            from urllib.parse import urlsplit, unquote
                            pw = urlsplit(ev).password
                            if pw:
                                s['secrets'].append(unquote(pw))
            remember_secrets(x, s)
    elif isinstance(v, list):
        for x in v:
            remember_secrets(x, s)
    s['secrets'] = sorted(set(s['secrets']), key=len, reverse=True)

def clean_text(v, s):
    for secret in s['secrets']:
        if len(secret) >= 8:
            v = v.replace(secret, '<WITHHELD_GENERATED_SECRET>')
    v = re.sub(r'(postgres(?:ql)?://[^:@\s]+:)[^@\s]+@', r'\1<WITHHELD>@', v)
    v = re.sub(r'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+', '<WITHHELD_JWT>', v)
    v = re.sub(r'sb_(?:secret|publishable)_[A-Za-z0-9_-]+', '<WITHHELD_KEY>', v)
    return v

def clean(v, s):
    if isinstance(v, dict):
        return {k: ('<WITHHELD_ENV_MAP_VALUES>' if k.lower() == 'env' else
                    '<WITHHELD_CREDENTIAL_FIELDS>' if k.lower() == 'credentials' else
                    '<WITHHELD>' if any(z in k.lower() for z in ['password', 'secret', 'token', 'key'])
                    else clean(x, s)) for k, x in v.items()}
    if isinstance(v, list):
        return [clean(x, s) for x in v]
    return clean_text(v, s) if isinstance(v, str) else v

def private_write(p, text):
    p.write_text(text)
    p.chmod(0o600)

def snapshot(label):
    s = load()
    records = []
    for home in ['home-a', 'home-b']:
        for f in (ROOT / home / 'stacks').glob('*/state.json'):
            raw = json.loads(f.read_text())
            remember_secrets(raw, s)
            op = f.parent / 'owner.json'
            owner = json.loads(op.read_text()) if op.exists() else {}
            remember_secrets(owner, s)
            records.append({'home': home, 'relative_directory': str(f.parent.relative_to(ROOT)),
                'id': raw.get('id'), 'identity': raw.get('identity'), 'runtime': raw.get('runtime'),
                'state_shape': shape(raw), 'instances_count': len(raw.get('instances', [])),
                'owner': {k: owner.get(k) for k in ['pid', 'port', 'role', 'release', 'lifetime', 'startedAt']}})
    save(s)
    procs = []
    for p in Path('/proc').iterdir():
        if not p.name.isdigit():
            continue
        try:
            cmd = (p / 'cmdline').read_bytes()
            env = (p / 'environ').read_bytes()
            cwd = str((p / 'cwd').resolve())
            reasons = []
            if str(ROOT).encode() in cmd:
                reasons.append('cmdline_contains_private_root')
            if any((b'SUPABASE_HOME=' + str(ROOT / h).encode()) in env for h in ['home-a', 'home-b']):
                reasons.append('private_supabase_home')
            if cwd.startswith(str(ROOT)):
                reasons.append('cwd_in_private_root')
            if reasons:
                procs.append({'pid': int(p.name), 'start_ticks': (p / 'stat').read_text().split()[21],
                    'ppid': int((p / 'stat').read_text().split()[3]),
                    'comm': (p / 'comm').read_text().strip(), 'exe': str((p / 'exe').resolve()),
                    'cwd': cwd, 'ownership_observation': reasons,
                    'stack_ids_in_cwd': [x['id'] for x in records if x['id'] in cwd],
                    'stack_ids_in_cmdline': [x['id'] for x in records if x['id'].encode() in cmd]})
        except (OSError, ProcessLookupError):
            pass
    owner_ids = {x['owner']['pid']: x['id'] for x in records if x.get('owner', {}).get('pid')}
    by_pid = {x['pid']: x for x in procs}
    for proc in procs:
        pid, seen = proc['pid'], set()
        while pid in by_pid and pid not in seen:
            seen.add(pid)
            if pid in owner_ids:
                proc['native_owner_ancestry_id'] = owner_ids[pid]
                break
            pid = by_pid[pid]['ppid']
    result = {'utc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
              'native_records': records, 'private_root_processes': procs}
    (HERE / (label + '.json')).write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({'snapshot': label, 'registered_records': len(records), 'private_processes': len(procs)}))

def call(label, home, project, args, timeout=50, pause_label=None, home_override=None, unset_supabase_home=False):
    s = load()
    if not re.fullmatch(r'[a-zA-Z0-9_-]+', label):
        raise ValueError('unsafe evidence label')
    hp, pp = s['home_' + home], s['project_' + project]
    binary = Path(s['repo']) / 'node_modules/@supabase/cli-linux-x64/bin/supabase'
    env = {'PATH': s['node_dir'] + ':/usr/bin:/bin', 'HOME': hp, 'SUPABASE_HOME': hp,
           'SUPABASE_EXPERIMENTAL_STACK': '1', 'LANG': 'C.UTF-8', 'TMPDIR': str(ROOT)}
    if home_override is not None:
        assert home_override in [s['home_a'], s['home_b']]
        env['HOME'] = home_override
    if unset_supabase_home:
        del env['SUPABASE_HOME']
    cmd = [str(binary)] + args
    if '--version' not in args:
        cmd += ['--workdir', pp, '--output-format', 'json']
    if len(args) >= 2 and args[:2] == ['stack', 'prepare'] and '--help' not in args and '--stack-id' not in args:
        name = args[args.index('--stack') + 1] if '--stack' in args else ''
        head = (Path(pp) / '.git/HEAD').read_text().strip()
        branch = head.removeprefix('ref: ')
        intent = {'home': hp, 'project_root': pp, 'branch_context': branch,
                  'name': name, 'runtime': 'native', 'reserved_utc': datetime.datetime.now(datetime.timezone.utc).isoformat()}
        if label in s['intents']:
            raise ValueError('intent label already used')
        s['intents'][label] = intent
        save(s)
    start = time.time()
    proc = subprocess.Popen(cmd, cwd=pp, env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    private_write(ROOT / 'active-call.json', json.dumps({'label': label, 'pid': proc.pid,
        'start_ticks': Path(f'/proc/{proc.pid}/stat').read_text().split()[21], 'argv': cmd, 'cwd': pp}))
    pause_observation = None
    if pause_label:
        os.kill(proc.pid, signal.SIGSTOP)
        try:
            pause_observation = {'pid': proc.pid, 'proc_state': Path(f'/proc/{proc.pid}/stat').read_text().split()[2],
                'exe': str(Path(f'/proc/{proc.pid}/exe').resolve()), 'meaning': 'native CLI launched but suspended; no terminal acknowledgement'}
            call(pause_label, home, project, ['stack', 'list'], 12)
        finally:
            os.kill(proc.pid, signal.SIGCONT)
    timed_out = False
    try:
        out, err = proc.communicate(timeout=timeout)
    except subprocess.TimeoutExpired:
        timed_out = True
        proc.terminate()
        try:
            out, err = proc.communicate(timeout=8)
        except subprocess.TimeoutExpired:
            proc.kill()
            out, err = proc.communicate(timeout=8)
    stdout, stderr = out.decode(errors='replace'), err.decode(errors='replace')
    private_write(ROOT / 'captures' / (label + '.stdout'), stdout)
    private_write(ROOT / 'captures' / (label + '.stderr'), stderr)
    parsed = None
    try:
        parsed = json.loads(stdout)
        remember_secrets(parsed, s)
        save(s)
    except (ValueError, TypeError):
        pass
    safe_out = json.dumps(clean(parsed, s), indent=2) if parsed is not None else clean_text(stdout, s)
    meta = {'label': label, 'utc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'command_argv': cmd, 'cwd': pp, 'environment_keys': sorted(env), 'home': hp,
            'home_environment': {'HOME': env['HOME'], 'SUPABASE_HOME': env.get('SUPABASE_HOME')},
            'binary_sha256': hashlib.sha256(binary.read_bytes()).hexdigest(),
            'exit_code': proc.returncode, 'timeout_injected': timed_out, 'duration_seconds': round(time.time()-start, 3),
            'pause_observation': pause_observation,
            'recorder_sha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
            'fixture_config_sha256': hashlib.sha256((Path(pp) / 'supabase/config.toml').read_bytes()).hexdigest(),
            'stdout_json_valid': parsed is not None, 'stdout_shape': shape(parsed) if parsed is not None else 'non-JSON text',
            'stdout_sanitized': safe_out, 'stderr_sanitized': clean_text(stderr, s),
            'projection': 'all env map values and generated credentials withheld; raw streams private only'}
    (HERE / (label + '.json')).write_text(json.dumps(meta, indent=2) + '\n')
    (HERE / (label + '.log')).write_text('COMMAND ' + json.dumps(cmd) + '\nCWD ' + pp +
        '\nEXIT ' + str(proc.returncode) + '\nSTDOUT (SANITIZED)\n' + safe_out +
        '\nSTDERR (SANITIZED)\n' + clean_text(stderr, s) + '\n')
    print(json.dumps({'label': label, 'exit': proc.returncode, 'timed_out': timed_out,
                      'json': parsed is not None, 'top_keys': list(parsed) if isinstance(parsed, dict) else [],
                      'id': parsed.get('id') if isinstance(parsed, dict) else None,
                      'stack_count': len(parsed.get('stacks', [])) if isinstance(parsed, dict) else None}))

if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--label', required=True)
    p.add_argument('--home', choices=['a', 'b'], default='a')
    p.add_argument('--project', choices=['a', 'b'], default='a')
    p.add_argument('--timeout', type=float, default=50)
    p.add_argument('command', nargs=argparse.REMAINDER)
    a = p.parse_args()
    command = a.command[1:] if a.command[:1] == ['--'] else a.command
    call(a.label, a.home, a.project, command, a.timeout)
