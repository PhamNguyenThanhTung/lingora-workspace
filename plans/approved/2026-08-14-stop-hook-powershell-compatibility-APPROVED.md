# Stop Hook PowerShell Compatibility

> Immutable human-approved task snapshot. Implementation had not started when this snapshot was created.

## Status

APPROVED

## Objective

Make the Codex Stop hook execute correctly on Windows PowerShell by replacing its Bash/POSIX wrapper with a direct Node invocation while preserving the existing hook behavior and exit-code contract.

## Root Cause

The Stop hook command in `.codex/hooks.json` contains POSIX/Bash syntax including `[ ! -f ... ]`, `||`, `$HOME`, brace groups and `/dev/null` redirection. Codex executes the command through Windows PowerShell, which rejects that syntax before Node can start.

The referenced hook is already a Node entry point and handles Stop routing, malformed input, re-entrancy and internal failures with an exit-code-zero contract. The smallest compatible fix is therefore to invoke Node directly.

## Approved Fix

Change only the Stop hook `command` property to:

```text
node ".codex/skills/impeccable/scripts/hook.mjs"
```

Preserve the existing Stop hook values:

- `timeout`: `30`
- `statusMessage`: `Design deep pass`

## Approved Scope

1. Modify only `.codex/hooks.json`.
2. Change only the Stop hook `command` property.
3. Preserve the Stop hook timeout and status message exactly.
4. Preserve the hook's intended stdout and exit-code semantics.

## Files Expected To Change

- `.codex/hooks.json`

No other implementation file is authorized. If another file becomes necessary, return the task to `REVIEW` and obtain human approval before changing it.

## Explicitly Out Of Scope

- Any change to the `PostToolUse` hook.
- Any change to `.codex/skills/impeccable/scripts/hook.mjs` or its imported scripts.
- Any change to M1.3 plans, implementation, evidence or semantics.
- Any migration, Prisma schema, database policy, dependency, `.env`, application code or product behavior change.
- Any project-workflow rule change.
- Git commit, amend, reset, history rewrite or push.

## Test Plan

- Validate `.codex/hooks.json`.
- Verify `node` resolves on PATH and its major version is at least `22`.
- Run `node --check ".codex/skills/impeccable/scripts/hook.mjs"`.
- Test a valid clean Stop event and verify exit code `0`.
- Test malformed stdin and verify exit code `0`.
- Test inherited `IMPECCABLE_HOOK_DEPTH=1` and verify exit code `0`.
- Run `git diff --check`.
- Verify the exact diff changes only the Stop command; timeout, status message, PostToolUse and hook scripts remain unchanged.

## Acceptance Criteria

- The Stop hook command is exactly `node ".codex/skills/impeccable/scripts/hook.mjs"`.
- Windows PowerShell no longer parses Bash/POSIX wrapper syntax for the Stop hook.
- Stop timeout remains `30` and status message remains `Design deep pass`.
- `PostToolUse` is unchanged.
- `hook.mjs` and all files outside `.codex/hooks.json` remain unchanged during implementation.
- Clean, malformed and re-entrant test paths all exit `0`.
- The final diff contains only the intended Stop command change.
- No commit is created.
- Any Codex hook reload/reapproval requirement is reported after implementation.

## Approval

Status: APPROVED
Approved by: Human product owner
Date: 2026-08-14
