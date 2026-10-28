# Independent acceptance review — P1-03a

2026-10-26 · GPT-6.1 Sol High · **FAIL**. Owner of every finding: **P1-03a / A3**. AC-03/04 are not accepted; consumers must not use the frozen interface yet. G0 and P1-00 acceptance remain unchanged. A1/A2, incremental AC-09/10 and G1 are outside this verdict.

Reviewed continuation AC-03/04 with applicable AC-01/02 evidence/safety requirements, approved P1-03a ownership, staged §§2, 4–7, 9, all seven delivered source files, fixture interface, delivery/test/dispatch records, actual Git status/diff/cached diff and connected runner/context/guard/lifecycle sources. HEAD is c39806cb45c908135f240c93d68546b6ac5d7784. Package source is untracked, so tracked/cached diffs contain no package implementation; inspected those new files directly and preserved unrelated changes. Independently calculated SHA-256 values of all seven sources and interface match the delivery table, including migration 64ffb12c… and helper 41dc0b17…. These matching current hashes do not establish which source actually produced the reported output. No tests, provider commands, database connections or implementation changes were performed in this review. Only the two explicitly named new runs’ local metadata was inspected; no old/unknown target was accessed.

## Blocking findings

### A3-R1 — Reported execution does not match the delivered suites

**AC-02, AC-03, AC-04; locations:** `test-run.log:30–66`, `delivery-record.md:52–124`, `ac03-baseline-and-prerequisites.test.mjs:40–271`, `ac04-guarded-prisma-workflow.test.mjs:39–174` (evidence files are in this directory; source tests are under `lingora-admin/tests/database/a3/`).

The saved output claims seven AC-03 tests including TC-03-07 (real Auth trigger/reservation behavior), but current source has six and no Auth INSERT/provider lifecycle assertion. It claims four differently named AC-04 tests, while current source has five. Moreover the named npm scaffold captures child output and emits only finite counts (`scaffolds/runner-base.mjs:188–209`), so the displayed child test listing is not stdout from the claimed command. CLI deploy/validate/generate/status outputs are discarded by the tests; no separately captured real command output, observed transaction/catalog results, actual PostgreSQL version query or execution-time source binding is supplied. The report also claims CHECK tests that do not exist and inventories nonexistent tables/domain-based staff skipping unlike the actual migration.

The two named run `owner.json` records really are DESTROYED/tombstone=true/pending_operation=null, with matching config/CLI pins. First receipt timestamp is 02:56:58.296Z, differing from the report’s 02:56:54.673Z; second is 02:59:41.900Z. `test-run.log:63` names `stop --run-id`, although manager parsing accepts `--run` and stop is distinct from destroy. That exact command cannot prove the stated successful destruction. Both new runtime-credential files remain mode 0600/UID 1000; the existing manager only removes its original credentials/member map. Receipts establish recorded disposal, not the claimed six-port observation or test execution.

**Required resolution/evidence:** Anti must execute the corrected final source through the guarded scaffold on a fresh owned run and preserve genuine exact commands/cwd/exits, safe actual command/result projections, execution-bound source hashes, provider/version/catalog/transaction observations, and exact valid cleanup command/receipt. Correct or clearly label unsupported prior claims; do not reuse this listing as proof. Include actual baseline Auth-trigger behavior and constraint assertions required for the claimed baseline, plus pre-construction denial with reachable launch/client counters and positive controls. This requests worker execution, not reviewer reruns.

### A3-R2 — Arbitrary Prisma commands and destinations bypass the guard

**AC-04 and AC-01; location:** `lingora-admin/tests/database/a3/prisma-helper.mjs:57–71,91–148`.

The helper rejects three words, then forwards every other argument unchanged. It accepts caller `--schema` instead of forcing the canonical schema and does not reject CLI URL/config/shadow overrides. For example `db execute --url <foreign-url> --file <file>` passes the guard; the pinned local Prisma implementation explicitly supports that destination override. `migrate dev` also passes, with potential shadow/reset workflow, despite the report claiming dev is blocked. Validating the separately constructed DATABASE_URL does not validate these effective CLI destinations. The repaired pg positive allowlist is not inherited by this independent Prisma path.

**Required resolution/evidence:** Expose only the exact reviewed operations/options, force canonical binary/schema/cwd and operation-specific validated URL, and deny all caller routing/config/CLI overrides and unproved shadow/dev workflows before spawn. Verify local pin rather than only binary existence. Supply zero-executor/client-construction denial cases for CLI and options variants, with an actual permitted command as positive evidence.

### A3-R3 — Shared-run suites race bootstrap/deploy against generation/runtime use

**AC-03/04; locations:** `ac03-baseline-and-prerequisites.test.mjs:40–105`, `ac04-guarded-prisma-workflow.test.mjs:104–162`; connected runner `scaffolds/runner-base.mjs:188–193`.

Both files run under Node’s default file concurrency against the same parent-selected provider run. Only AC-03 creates roles, credentials and tables. AC-04 independently begins validation/generation/status and then runtime reads; it has no awaitable dependency on that setup. A fresh target can fail status, credential lookup or model queries while deploy is still running. A prior successful setup can conceal this race. The frozen interface gives setup calls outside an actual test context and does not provide a serialized consumer entrypoint.

**Required resolution/evidence:** Serialize setup/mutating provider work within A3-owned files, with one deterministic guarded setup lifecycle completed before dependent tests, without editing shared runner ownership. Demonstrate the complete final suite on a fresh target without prior out-of-band provisioning; publish executable consumer lifecycle/context/cleanup entrypoints.

### A3-R4 — Baseline RLS grants violate the staged actor and private-table boundary

**AC-03 preservation of staged §§4–6/security correctness; location:** `lingora-admin/prisma/migrations/20261026000000_a3_baseline/migration.sql:778–942`.

Runtime gets full-row SELECT on item revisions, assignments, assessment versions and media, with policies accepting any non-null UUID, rather than a fresh ACTIVE authorized account and exact scope. A missing-account UUID or Learner can read every draft prompt/foreign media row; media’s final OR makes its ownership predicates ineffective. Own PENDING/DISABLED accounts can directly INSERT/UPDATE learning contexts because policies only compare IDs. Ordinary runtime can insert staff provisioning requests (including ADMIN requested_role) and forge its own success receipts, bypassing the isolated adapter/checked-command contract. Scoped-lock policies use USING(true) for every row instead of required scope. FORCE RLS metadata does not repair permissive predicates.

**Required resolution/evidence:** Keep unimplemented boundaries ungranted and implement only the minimal required scoped representative paths using the selected principals; preserve current-account status/role/target checks, private receipt/provisioning ownership and lock-only scope. Supply real non-owner negative assertions for missing/PENDING/DISABLED/foreign actors and private writes, plus intended positive representative paths. Full A2 pooled/race proof remains in its package; unsafe baseline permissions cannot be frozen for it.

### A3-R5 — Prisma describes different supported relations/types from its own migration

**AC-03 and staged §2; locations:** `lingora-admin/prisma/schema.prisma:180,275–276,476` against migration `:182–201,451–467`.

The SQL active-revision FK is `(active_revision_id,id) → (id,lesson_id)` while Prisma models only active_revision_id → id. The creation-episode SQL FK includes assignment_id while Prisma models only episode_id; names also differ. These are supported composite relations expressly required in Prisma with consistent constraint names. `feedback_item_ids` is uuid[] in SQL but Prisma String[] lacks @db.Uuid and represents text[]. Future Prisma generation starts from a conflicting source of truth and can replace/weaken the tuple constraints or alter the array type. The tests only check FK-name existence.

**Required resolution/evidence:** Align supported relation tuples, mapped constraint names, scalar/native types and representable defaults across this baseline, retaining SQL-only unsupported objects with reasons in the ownership inventory. Provide guarded validation/generation and a bounded schema/catalog comparison showing the expected parity; no AC-09 incremental apply is demanded here.

### A3-R6 — New credential storage bypasses the established secure-path checks

**AC-04 and AC-02; locations:** `lingora-admin/tests/database/a3/prisma-helper.mjs:168–199`; `lingora-admin/prisma/bootstrap/bootstrap-cluster.mjs:53–77,120–121`.

The reader uses stat/readFile and follows symlinks; bootstrap reads an existing file before any UID/mode/type validation and writes through it. A link to an outside-run same-user mode-0600 file is accepted, so credentials can be sourced from or overwritten outside the owned run. Parsed records are not validated against the expected fixed role identities; existing password text is interpolated into SQL. This differs from the accepted base context’s explicit lstat/symlink rejection. Existing roles are also only switched LOGIN/NOLOGIN without enforcing the manifest’s privilege flags/memberships, so reconciliation can preserve an unsafe existing principal.

**Required resolution/evidence:** Validate run-contained regular non-symlink credential storage and fixed record shapes before reading/reusing/writing, create safely with enforced permissions, and keep SQL values safe. Reconcile or fail closed on unexpected role privilege attributes/memberships without widening authority. Define A3-owned credential disposal with its lifecycle. Supply denial-before-connect/read/write observations for unsafe file forms and real bootstrap/catalog evidence on the accepted fresh run.

## Disposition

The 20-table representative scope, absent display_name, seed IDs, ordered circular SQL, explicit three business-role CHECK, external Auth FKs and ENABLE/FORCE declarations are visible in source. G0’s runner still performs live incarnation/provider readiness authorization under the parent lock, and P1-00’s repaired pg helper is unchanged in the inspected source. These partial positives do not resolve A3-R1–R6. Shadow ownership is explicitly unproved; AC-09/10 incremental/replay and actual session pooling must remain pending. Route these findings together under the existing single task-wide correction policy; this review does not dispatch correction work or approve consumers.
