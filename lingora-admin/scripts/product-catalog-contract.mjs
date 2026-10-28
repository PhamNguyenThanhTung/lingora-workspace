// =============================================================================
// Authoritative Expected Product Database Catalog Contract & Parity Helper
// Authority: plans/2026-10-28-database-remaining-repair-spec.md §6, FDB-03, FDB-05, FDB-06
// Resolves: PRE-05
// Grounded in: lingora-admin/prisma/product/schema.prisma + ordered effective SQL
// (baseline, finalize, correction, remediation, remaining_repair)
// =============================================================================

export const CANONICAL_APP_TABLES = [
  'accounts',
  'languages',
  'frameworks',
  'levels',
  'courses',
  'units',
  'lessons',
  'lesson_revisions',
  'content_assignments',
  'assignment_history',
  'vocabulary_concepts',
  'lesson_vocabulary_links',
  'media_assets',
  'media_bindings',
  'item_identities',
  'item_revisions',
  'lesson_exercises',
  'learning_contexts',
  'lesson_attempts',
  'lesson_responses',
  'lesson_completions',
  'srs_cards',
  'srs_review_operations',
  'assessment_blueprints',
  'assessment_versions',
  'assessment_version_items',
  'assessment_attempts',
  'assessment_results',
  'revision_reviews',
];

export const CANONICAL_APP_PRIVATE_TABLES = [
  'item_grading_secrets',
  'assessment_responses',
  'command_receipts',
  'audit_events',
  'provisioning_requests',
];

export const TOTAL_PRODUCT_TABLES = CANONICAL_APP_TABLES.length + CANONICAL_APP_PRIVATE_TABLES.length; // 34

export const EXPECTED_MIGRATIONS = [
  {
    name: '20261027000000_product_baseline',
    checksum: '69093deb1f9ed8d2350fda757a86546044c2a66eb6d58a4cef326928188d9862',
  },
  {
    name: '20261027010000_product_finalize',
    checksum: 'b3cea3d36ab2072b6ef839b957a96c484f9c79d63e01b13cadd4407e31545f16',
  },
  {
    name: '20261027020000_product_correction',
    checksum: '3a5847261839367edd608065be3bcb8359bb11eeaaf7c0f51813231dbc1d9029',
  },
  {
    name: '20261027030000_product_remediation',
    checksum: '5026899d25e2bfd04bec69e7e74d8c84a71d13ce92344dde3f8999cf4e23dbf6',
  },
  {
    name: '20261028000000_product_remaining_repair',
    checksum: 'c078345384710e5425e8af02529926abd9aec518ec8dc8bc2c9eac5cca42ae75',
  },
];

export const EXPECTED_PARTIAL_INDEXES = [
  {
    name: 'assessment_attempts_context_submission_key_idx',
    table: 'assessment_attempts',
    columns: ['submission_key'],
    predicatePattern: /submission_key\s+IS\s+NOT\s+NULL/i,
  },
  {
    name: 'assessment_versions_active_blueprint_idx',
    table: 'assessment_versions',
    columns: ['blueprint_id'],
    predicatePattern: /is_active\s*(=|\s+IS)\s*(true|TRUE)?/i,
  },
  {
    name: 'media_bindings_item_rev_pos_idx',
    table: 'media_bindings',
    columns: ['item_revision_id', 'position'],
    predicatePattern: /item_revision_id\s+IS\s+NOT\s+NULL/i,
  },
  {
    name: 'media_bindings_lesson_rev_pos_idx',
    table: 'media_bindings',
    columns: ['lesson_revision_id', 'position'],
    predicatePattern: /lesson_revision_id\s+IS\s+NOT\s+NULL/i,
  },
  {
    name: 'srs_review_ops_card_session_reinf_idx',
    table: 'srs_review_operations',
    columns: ['card_id', 'session_key'],
    predicatePattern: /kind\s*=\s*'REINFORCEMENT'/i,
  },
  {
    name: 'srs_review_ops_card_session_sched_idx',
    table: 'srs_review_operations',
    columns: ['card_id', 'session_key'],
    predicatePattern: /kind\s*=\s*'SCHEDULE'/i,
  },
  {
    name: 'srs_review_ops_reinforces_op_idx',
    table: 'srs_review_operations',
    columns: ['reinforces_operation_id'],
    predicatePattern: /kind\s*=\s*'REINFORCEMENT'/i,
  },
];

export const EXPECTED_COMPOSITE_FKS = [
  {
    conname: 'assessment_version_items_item_source_owner_fkey',
    childTable: 'assessment_version_items',
    childColumns: 'item_revision_id, source_lesson_revision_id',
    parentTable: 'item_revisions',
    parentColumns: 'id, authoring_lesson_revision_id',
  },
  {
    conname: 'assessment_version_items_source_review_tuple_fkey',
    childTable: 'assessment_version_items',
    childColumns: 'source_submission_id, source_lesson_revision_id, contribution_assignment_episode_id',
    parentTable: 'revision_reviews',
    parentColumns: 'id, lesson_revision_id, assignment_episode_id',
  },
  {
    conname: 'lesson_completions_attempt_context_lesson_fkey',
    childTable: 'lesson_completions',
    childColumns: 'first_attempt_id, context_id, lesson_id',
    parentTable: 'lesson_attempts',
    parentColumns: 'id, context_id, lesson_id',
  },
  {
    conname: 'lessons_active_revision_fkey',
    childTable: 'lessons',
    childColumns: 'active_revision_id, id',
    parentTable: 'lesson_revisions',
    parentColumns: 'id, lesson_id',
  },
  {
    conname: 'lesson_responses_attempt_revision_fkey',
    childTable: 'lesson_responses',
    childColumns: 'attempt_id, lesson_revision_id',
    parentTable: 'lesson_attempts',
    parentColumns: 'id, lesson_revision_id',
  },
  {
    conname: 'lesson_responses_exercise_revision_fkey',
    childTable: 'lesson_responses',
    childColumns: 'lesson_exercise_id, lesson_revision_id',
    parentTable: 'lesson_exercises',
    parentColumns: 'id, lesson_revision_id',
  },
  {
    conname: 'srs_review_operations_card_learner_fkey',
    childTable: 'srs_review_operations',
    childColumns: 'card_id, learner_id',
    parentTable: 'srs_cards',
    parentColumns: 'id, learner_id',
  },
  {
    conname: 'assessment_responses_attempt_version_fkey',
    childTable: 'assessment_responses',
    childColumns: 'attempt_id, assessment_version_id',
    parentTable: 'assessment_attempts',
    parentColumns: 'id, assessment_version_id',
  },
  {
    conname: 'assessment_responses_version_item_fkey',
    childTable: 'assessment_responses',
    childColumns: 'assessment_version_item_id, assessment_version_id',
    parentTable: 'assessment_version_items',
    parentColumns: 'id, assessment_version_id',
  },
];

export const EXPECTED_PROVIDER_FKS = [
  {
    conname: 'accounts_id_auth_users_fkey',
    childSchema: 'app',
    childTable: 'accounts',
    childColumns: 'id',
    parentSchema: 'auth',
    parentTable: 'users',
    parentColumns: 'id',
  },
  {
    conname: 'provisioning_requests_auth_user_id_fkey',
    childSchema: 'app_private',
    childTable: 'provisioning_requests',
    childColumns: 'auth_user_id',
    parentSchema: 'auth',
    parentTable: 'users',
    parentColumns: 'id',
  },
];

export const KEY_TRIGGER_FUNCTION_BINDINGS = [
  { tgname: 'trg_lesson_revision_submitted_payload', table: 'lesson_revisions', func: 'guard_lesson_revision_submitted_payload' },
  { tgname: 'trg_revision_review_provenance', table: 'revision_reviews', func: 'check_revision_review_provenance' },
  { tgname: 'trg_assessment_version_snapshot_shape', table: 'assessment_versions', func: 'check_assessment_version_snapshot' },
  { tgname: 'trg_assessment_version_item_eligibility', table: 'assessment_version_items', func: 'check_assessment_version_item_eligibility' },
  { tgname: 'trg_item_revision_delete', table: 'item_revisions', func: 'guard_item_revision_delete' },
  { tgname: 'trg_item_revision_insert', table: 'item_revisions', func: 'guard_item_revision_insert' },
  { tgname: 'trg_media_binding_parent_frozen', table: 'media_bindings', func: 'guard_media_binding_parent_frozen' },
  { tgname: 'trg_grading_secret_no_insert', table: 'item_grading_secrets', func: 'guard_grading_secret_frozen' },
  { tgname: 'trg_lesson_attempt_scope', table: 'lesson_attempts', func: 'check_lesson_attempt_scope' },
  { tgname: 'trg_lesson_available_revision', table: 'lessons', func: 'check_lesson_available_revision' },
  { tgname: 'trg_assessment_blueprint_immutable_scope', table: 'assessment_blueprints', func: 'guard_assessment_blueprint_immutable_scope' },
  { tgname: 'trg_framework_level_scope', table: 'levels', func: 'guard_framework_level_scope' },
  { tgname: 'trg_assessment_attempt_scope', table: 'assessment_attempts', func: 'check_assessment_attempt_scope' },
  { tgname: 'trg_item_identity_update', table: 'item_identities', func: 'guard_item_identity_update' },
];

/**
 * Perform exhaustive catalog comparison against authoritative contract.
 * @param {any} client pg client inside BEGIN READ ONLY
 * @param {{ allowPendingRepair?: boolean }} [options]
 *   allowPendingRepair=true evaluates expected state prior to 5th migration (4 applied)
 *   allowPendingRepair=false (default) evaluates final post-5th migration state (5 applied)
 * @returns {Promise<{ ok: boolean, summary: string, diffs: string[], details: object }>}
 */
export async function verifyCatalogParity(client, options = {}) {
  const allowPendingRepair = options.allowPendingRepair === true;
  const diffs = [];

  // 1. Table sets (34 product tables: 29 app + 5 app_private)
  const tablesRes = await client.query(`
    SELECT table_schema, table_name
      FROM information_schema.tables
     WHERE table_schema IN ('app', 'app_private')
       AND table_name != '_prisma_migrations'
     ORDER BY table_schema, table_name;
  `);

  const foundApp = tablesRes.rows.filter((r) => r.table_schema === 'app').map((r) => r.table_name);
  const foundPrivate = tablesRes.rows.filter((r) => r.table_schema === 'app_private').map((r) => r.table_name);

  const missingApp = CANONICAL_APP_TABLES.filter((t) => !foundApp.includes(t));
  const extraApp = foundApp.filter((t) => !CANONICAL_APP_TABLES.includes(t));
  const missingPrivate = CANONICAL_APP_PRIVATE_TABLES.filter((t) => !foundPrivate.includes(t));
  const extraPrivate = foundPrivate.filter((t) => !CANONICAL_APP_PRIVATE_TABLES.includes(t));

  if (missingApp.length > 0) diffs.push(`Missing app tables: ${missingApp.join(', ')}`);
  if (extraApp.length > 0) diffs.push(`Unexpected app tables: ${extraApp.join(', ')}`);
  if (missingPrivate.length > 0) diffs.push(`Missing app_private tables: ${missingPrivate.join(', ')}`);
  if (extraPrivate.length > 0) diffs.push(`Unexpected app_private tables: ${extraPrivate.join(', ')}`);

  // 2. Primary Keys: all 34 tables must have 'id' of type 'uuid' as primary key
  const pkRes = await client.query(`
    SELECT tc.table_schema, tc.table_name, kcu.column_name, c.udt_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      JOIN information_schema.columns c
        ON c.table_schema = kcu.table_schema AND c.table_name = kcu.table_name AND c.column_name = kcu.column_name
     WHERE tc.constraint_type = 'PRIMARY KEY'
       AND tc.table_schema IN ('app', 'app_private')
       AND tc.table_name != '_prisma_migrations'
     ORDER BY tc.table_schema, tc.table_name;
  `);
  if (pkRes.rows.length !== 34) {
    diffs.push(`Expected exactly 34 primary keys, found ${pkRes.rows.length}`);
  }
  for (const row of pkRes.rows) {
    if (row.column_name !== 'id' || row.udt_name !== 'uuid') {
      diffs.push(`Table ${row.table_schema}.${row.table_name} PK is not UUID id (got ${row.column_name}:${row.udt_name})`);
    }
  }

  // 3. Foreign Keys: exactly 100 foreign keys (98 product + 2 provider auth), all RESTRICT delete and NO ACTION update
  const fkRes = await client.query(`
    SELECT
      c.conname,
      ns_child.nspname AS child_schema,
      cl_child.relname AS child_table,
      array_to_string(ARRAY(
        SELECT attname FROM pg_attribute
         WHERE attrelid = c.conrelid AND attnum = ANY(c.conkey)
         ORDER BY array_position(c.conkey, attnum)
      ), ', ') AS child_columns,
      ns_parent.nspname AS parent_schema,
      cl_parent.relname AS parent_table,
      array_to_string(ARRAY(
        SELECT attname FROM pg_attribute
         WHERE attrelid = c.confrelid AND attnum = ANY(c.confkey)
         ORDER BY array_position(c.confkey, attnum)
      ), ', ') AS parent_columns,
      c.confdeltype,
      c.confupdtype
    FROM pg_constraint c
    JOIN pg_class cl_child ON cl_child.oid = c.conrelid
    JOIN pg_namespace ns_child ON ns_child.oid = cl_child.relnamespace
    JOIN pg_class cl_parent ON cl_parent.oid = c.confrelid
    JOIN pg_namespace ns_parent ON ns_parent.oid = cl_parent.relnamespace
    WHERE c.contype = 'f'
      AND ns_child.nspname IN ('app', 'app_private')
    ORDER BY ns_child.nspname, cl_child.relname, c.conname;
  `);

  if (fkRes.rows.length !== 100) {
    diffs.push(`Expected exactly 100 foreign keys, found ${fkRes.rows.length}`);
  }
  for (const fk of fkRes.rows) {
    if (fk.confdeltype !== 'r') {
      diffs.push(`FK ${fk.conname} does not have RESTRICT delete (got confdeltype=${fk.confdeltype})`);
    }
    if (fk.confupdtype !== 'a') {
      diffs.push(`FK ${fk.conname} does not have NO ACTION update (got confupdtype=${fk.confupdtype})`);
    }
  }

  // Verify BOTH Provider FKs (PRE-05)
  const fkMap = new Map(fkRes.rows.map((r) => [r.conname, r]));
  for (const pFk of EXPECTED_PROVIDER_FKS) {
    const found = fkMap.get(pFk.conname);
    if (!found) {
      diffs.push(`Missing required provider FK: ${pFk.conname}`);
    } else {
      if (found.child_table !== pFk.childTable || found.parent_table !== pFk.parentTable) {
        diffs.push(`Provider FK ${pFk.conname} table mismatch: ${found.child_table} -> ${found.parent_table} (expected ${pFk.childTable} -> ${pFk.parentTable})`);
      }
      if (found.child_columns !== pFk.childColumns || found.parent_columns !== pFk.parentColumns) {
        diffs.push(`Provider FK ${pFk.conname} columns mismatch: (${found.child_columns}) -> (${found.parent_columns})`);
      }
    }
  }

  // Verify Composite FK ordered tuples (PRE-05)
  for (const cFk of EXPECTED_COMPOSITE_FKS) {
    const found = fkMap.get(cFk.conname);
    if (!found) {
      diffs.push(`Missing required composite FK: ${cFk.conname}`);
    } else {
      if (found.child_table !== cFk.childTable || found.parent_table !== cFk.parentTable) {
        diffs.push(`Composite FK ${cFk.conname} table mismatch: ${found.child_table} -> ${found.parent_table} (expected ${cFk.childTable} -> ${cFk.parentTable})`);
      }
      if (found.child_columns !== cFk.childColumns || found.parent_columns !== cFk.parentColumns) {
        diffs.push(`Composite FK ${cFk.conname} column tuple mismatch: (${found.child_columns}) -> (${found.parent_columns}) (expected (${cFk.childColumns}) -> (${cFk.parentColumns}))`);
      }
    }
  }

  // 4. Partial Unique Indexes
  const partialIdxRes = await client.query(`
    SELECT
      cl.relname AS tablename,
      idx.relname AS indexname,
      pg_get_expr(i.indpred, i.indrelid) AS predicate,
      pg_get_indexdef(i.indexrelid) AS indexdef
    FROM pg_index i
    JOIN pg_class cl ON cl.oid = i.indrelid
    JOIN pg_namespace ns ON ns.oid = cl.relnamespace
    JOIN pg_class idx ON idx.oid = i.indexrelid
    WHERE ns.nspname IN ('app', 'app_private')
      AND i.indisunique = true
      AND i.indisprimary = false
      AND i.indpred IS NOT NULL
    ORDER BY idx.relname;
  `);

  if (partialIdxRes.rows.length !== EXPECTED_PARTIAL_INDEXES.length) {
    diffs.push(`Expected ${EXPECTED_PARTIAL_INDEXES.length} partial unique indexes, found ${partialIdxRes.rows.length}`);
  }
  const foundIdxMap = new Map(partialIdxRes.rows.map((r) => [r.indexname, r]));
  for (const expectedIdx of EXPECTED_PARTIAL_INDEXES) {
    const found = foundIdxMap.get(expectedIdx.name);
    if (!found) {
      diffs.push(`Missing expected partial unique index: ${expectedIdx.name}`);
    } else {
      if (found.tablename !== expectedIdx.table) {
        diffs.push(`Index ${expectedIdx.name} on wrong table: expected ${expectedIdx.table}, got ${found.tablename}`);
      }
      if (!expectedIdx.predicatePattern.test(found.predicate || '')) {
        diffs.push(`Index ${expectedIdx.name} predicate mismatch: expected pattern ${expectedIdx.predicatePattern}, got '${found.predicate}'`);
      }
    }
  }

  // 5. Triggers: check enabled non-internal triggers (71 before 5th, or 72 after 5th with trg_assignment_history_scope_snapshot)
  const trgRes = await client.query(`
    SELECT n.nspname as schema, c.relname as table, t.tgname, t.tgenabled, p.proname as function_name
      FROM pg_trigger t
      JOIN pg_class c ON c.oid = t.tgrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_proc p ON p.oid = t.tgfoid
     WHERE n.nspname IN ('app', 'app_private')
       AND NOT t.tgisinternal
     ORDER BY n.nspname, c.relname, t.tgname;
  `);

  const expectedMinTriggers = allowPendingRepair ? 71 : 72;
  if (trgRes.rows.length < expectedMinTriggers) {
    diffs.push(`Expected at least ${expectedMinTriggers} non-internal triggers, found ${trgRes.rows.length}`);
  }
  const disabledTriggers = trgRes.rows.filter((r) => r.tgenabled !== 'O');
  if (disabledTriggers.length > 0) {
    diffs.push(`Found disabled triggers: ${disabledTriggers.map((t) => t.tgname).join(', ')}`);
  }

  const trgMap = new Map(trgRes.rows.map((r) => [r.tgname, r]));
  for (const expectedBinding of KEY_TRIGGER_FUNCTION_BINDINGS) {
    const found = trgMap.get(expectedBinding.tgname);
    if (!found) {
      diffs.push(`Missing key trigger: ${expectedBinding.tgname}`);
    } else {
      if (found.table !== expectedBinding.table) {
        diffs.push(`Trigger ${expectedBinding.tgname} bound to wrong table: expected ${expectedBinding.table}, got ${found.table}`);
      }
      if (found.function_name !== expectedBinding.func) {
        diffs.push(`Trigger ${expectedBinding.tgname} bound to wrong function: expected ${expectedBinding.func}, got ${found.function_name}`);
      }
    }
  }

  // 6. Function Definitions & Source Hashes (PRE-05)
  const fnRes = await client.query(`
    SELECT proname, prosrc
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname IN ('app', 'app_private')
       AND proname IN (
         'guard_lesson_revision_submitted_payload',
         'check_revision_review_provenance',
         'check_assessment_version_snapshot',
         'check_assessment_version_item_eligibility',
         'guard_assignment_history_scope_snapshot'
       );
  `);
  const fnMap = new Map(fnRes.rows.map((r) => [r.proname, r.prosrc]));

  if (!allowPendingRepair) {
    // Post-5th migration: must have 5th migration freeze and provenance pins
    const lrSrc = fnMap.get('guard_lesson_revision_submitted_payload') || '';
    if (!lrSrc.includes('prior_revision_id') || !lrSrc.includes('created_at')) {
      diffs.push('guard_lesson_revision_submitted_payload missing prior_revision_id or created_at freeze pin');
    }
    if (!lrSrc.includes('submitted_assignment_generation') || !lrSrc.includes('assignment_scope_snapshot')) {
      diffs.push('guard_lesson_revision_submitted_payload missing submitted generation or snapshot check');
    }

    const revSrc = fnMap.get('check_revision_review_provenance') || '';
    if (!revSrc.includes('assignment_generation') || !revSrc.includes('assignment_scope_snapshot')) {
      diffs.push('check_revision_review_provenance missing assignment_generation or assignment_scope_snapshot pin');
    }

    const verSrc = fnMap.get('check_assessment_version_snapshot') || '';
    if (!verSrc.includes('coverage_catalog') || !verSrc.includes('schema_version')) {
      diffs.push('check_assessment_version_snapshot missing coverage_catalog or schema_version pin');
    }

    const itemSrc = fnMap.get('check_assessment_version_item_eligibility') || '';
    if (!itemSrc.includes('assessment_blueprint_id') || !itemSrc.includes('coverage_tags')) {
      diffs.push('check_assessment_version_item_eligibility missing assessment_blueprint_id pin or coverage_tags envelope');
    }

    if (!fnMap.has('guard_assignment_history_scope_snapshot')) {
      diffs.push('Missing guard_assignment_history_scope_snapshot trigger function in app schema');
    }
  } else {
    // Pre-5th migration (4 applied): verify predecessor 4th migration definitions exist
    const lrSrc = fnMap.get('guard_lesson_revision_submitted_payload') || '';
    if (!lrSrc.includes('submitted_assignment_generation')) {
      diffs.push('Predecessor guard_lesson_revision_submitted_payload missing submitted_assignment_generation');
    }
  }

  // 7. Check Constraints & R7 Rules
  const chkRes = await client.query(`
    SELECT n.nspname AS schema, c.relname AS table, con.conname, pg_get_constraintdef(con.oid) AS def
      FROM pg_constraint con
      JOIN pg_class c ON c.oid = con.conrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname IN ('app', 'app_private')
       AND con.contype = 'c';
  `);
  const chkMap = new Map(chkRes.rows.map((r) => [r.conname, r.def]));

  if (!chkMap.has('assessment_results_assessment_type_nonblank_check')) {
    diffs.push('Missing assessment_results_assessment_type_nonblank_check on app.assessment_results');
  }
  if (chkMap.has('assessment_results_assessment_type_check')) {
    diffs.push('Found obsolete assessment_results_assessment_type_check enum constraint (should be dropped)');
  }
  if (!chkMap.has('lesson_attempts_completion_bounds_check')) {
    diffs.push('Missing lesson_attempts_completion_bounds_check on app.lesson_attempts');
  }
  if (!chkMap.has('learning_contexts_start_shape_check')) {
    diffs.push('Missing learning_contexts_start_shape_check on app.learning_contexts');
  }

  // Explicit R7 assertions: NOT NULL columns
  const r7ColsRes = await client.query(`
    SELECT table_name, column_name, is_nullable, data_type
      FROM information_schema.columns
     WHERE table_schema = 'app'
       AND (
         (table_name = 'courses' AND column_name = 'default_start_level_id') OR
         (table_name = 'assignment_history' AND column_name = 'created_at') OR
         (table_name = 'revision_reviews' AND column_name = 'created_at') OR
         (table_name = 'lesson_completions' AND column_name = 'created_at') OR
         (table_name = 'lesson_revisions' AND column_name IN ('topic_ids', 'skill_ids', 'purpose_tags')) OR
         (table_name = 'item_revisions' AND column_name = 'practice_skill_ids') OR
         (table_name = 'revision_reviews' AND column_name = 'feedback_item_ids')
       );
  `);

  for (const col of r7ColsRes.rows) {
    if (col.is_nullable !== 'NO') {
      diffs.push(`R7 assertion failure: column ${col.table_name}.${col.column_name} is nullable (expected NOT NULL)`);
    }
  }

  const ok = diffs.length === 0;
  const summary = ok
    ? `All 34 product tables, 34 UUID PKs, 100 FKs (including both provider and all composite tuples), 7 partial indexes, triggers, function signatures, and R7 constraints match authoritative contract.`
    : `Catalog parity failure: ${diffs.length} discrepancy items detected.`;

  return {
    ok,
    summary,
    diffs,
    details: {
      totalTables: tablesRes.rows.length,
      pksFound: pkRes.rows.length,
      fksFound: fkRes.rows.length,
      partialIndexesFound: partialIdxRes.rows.length,
      triggersFound: trgRes.rows.length,
      checkConstraintsFound: chkRes.rows.length,
      functionsInspected: fnRes.rows.length,
    },
  };
}
