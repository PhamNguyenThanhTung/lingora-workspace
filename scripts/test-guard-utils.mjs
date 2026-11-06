/**
 * Test Guard Utilities for Owned Disposable Loopback PostgreSQL Environment (P1)
 *
 * Implements strict ownership, loopback boundaries, and non-destructive actor preflight.
 */

export function validateOwnedDatabaseUrl(options = {}) {
  const ownedMarker = options.ownedMarker ?? process.env.SLICE11_TEST_DATABASE_OWNED;
  if (ownedMarker !== '1') {
    throw new Error('SLICE11_TEST_DATABASE_OWNED=1 is required for safety.');
  }

  const ownedUrl = options.ownedUrl ?? process.env.SLICE11_TEST_DATABASE_URL;
  if (!ownedUrl || typeof ownedUrl !== 'string') {
    throw new Error('Explicit SLICE11_TEST_DATABASE_URL is required (generic DATABASE_URL fallback forbidden).');
  }

  let parsed;
  try {
    parsed = new URL(ownedUrl);
  } catch (err) {
    throw new Error(`Invalid database URL format: ${err.message}`);
  }

  const protocol = parsed.protocol.toLowerCase();
  if (protocol !== 'postgresql:' && protocol !== 'postgres:') {
    throw new Error(`Database URL protocol must be 'postgresql:' or 'postgres:', got '${protocol}'.`);
  }

  const hostname = parsed.hostname.toLowerCase();
  if (hostname !== '127.0.0.1' && hostname !== 'localhost') {
    throw new Error(`Refusing to run on non-loopback host '${hostname}'. Expected '127.0.0.1' or 'localhost'.`);
  }

  if (parsed.pathname !== '/slice11_test') {
    throw new Error(`Database URL must target exact database '/slice11_test', got '${parsed.pathname}'.`);
  }

  // Exact equality check against sample override if supplied
  const sampleUrl = options.sampleUrl !== undefined ? options.sampleUrl : process.env.SAMPLE_CURRICULUM_DATABASE_URL;
  if (sampleUrl && sampleUrl !== ownedUrl) {
    throw new Error(
      `Override SAMPLE_CURRICULUM_DATABASE_URL does not match owned SLICE11_TEST_DATABASE_URL. Refusing to run on mismatched cluster.`
    );
  }

  // Exact equality check against generic DATABASE_URL if supplied
  const genericUrl = options.genericUrl !== undefined ? options.genericUrl : process.env.DATABASE_URL;
  if (genericUrl && genericUrl !== ownedUrl) {
    throw new Error(
      `DATABASE_URL does not match owned SLICE11_TEST_DATABASE_URL. Refusing to run on mismatched cluster.`
    );
  }

  const portDisplay = parsed.port ? `:${parsed.port}` : '';
  const sanitized = `${parsed.protocol}//***@${parsed.hostname}${portDisplay}${parsed.pathname}`;

  return {
    ownedUrl,
    parsedUrl: parsed,
    sanitized,
  };
}

export async function preflightAndSeedActors(pgClient, actors) {
  // 1. Preflight all accounts before any mutation
  const existingAccountsRes = await pgClient.query(
    `SELECT id::text, role, status FROM app.accounts WHERE id = ANY($1::uuid[])`,
    [actors.map((a) => a.id)]
  );
  for (const row of existingAccountsRes.rows) {
    const actor = actors.find((a) => a.id.toLowerCase() === row.id.toLowerCase());
    if (!actor) continue;
    if (row.role !== actor.role || row.status !== 'ACTIVE') {
      throw new Error(
        `Actor mismatch: existing account ${actor.id} has role ${row.role} and status ${row.status}, expected ${actor.role}/ACTIVE. Refusing to overwrite.`
      );
    }
  }

  // 2. Preflight all auth users before any mutation
  const existingAuthRes = await pgClient.query(
    `SELECT id::text, email FROM auth.users WHERE id = ANY($1::uuid[])`,
    [actors.map((a) => a.id)]
  );
  for (const row of existingAuthRes.rows) {
    const actor = actors.find((a) => a.id.toLowerCase() === row.id.toLowerCase());
    if (!actor) continue;
    if (row.email !== actor.email) {
      throw new Error(
        `Actor mismatch: existing auth user ${actor.id} has email '${row.email}', expected '${actor.email}'. Refusing to overwrite.`
      );
    }
  }

  // 3. Transactionally create-if-absent with recheck after ON CONFLICT DO NOTHING
  await pgClient.query('BEGIN');
  try {
    for (const actor of actors) {
      await pgClient.query(
        `INSERT INTO auth.users (id, email) VALUES ($1::uuid, $2) ON CONFLICT (id) DO NOTHING`,
        [actor.id, actor.email]
      );
      const authCheck = await pgClient.query(
        `SELECT email FROM auth.users WHERE id = $1::uuid`,
        [actor.id]
      );
      if (!authCheck.rows.length || authCheck.rows[0].email !== actor.email) {
        throw new Error(`Failed to verify or insert auth identity for actor ${actor.id}`);
      }

      await pgClient.query(
        `INSERT INTO app.accounts (id, role, status, display_name, ui_locale, created_at, updated_at)
         VALUES ($1::uuid, $2, 'ACTIVE', $3, $4, NOW(), NOW())
         ON CONFLICT (id) DO NOTHING`,
        [actor.id, actor.role, actor.displayName, actor.uiLocale || 'vi']
      );
      const accountCheck = await pgClient.query(
        `SELECT role, status FROM app.accounts WHERE id = $1::uuid`,
        [actor.id]
      );
      if (
        !accountCheck.rows.length ||
        accountCheck.rows[0].role !== actor.role ||
        accountCheck.rows[0].status !== 'ACTIVE'
      ) {
        throw new Error(`Failed to verify or insert account for actor ${actor.id}`);
      }
    }
    await pgClient.query('COMMIT');
  } catch (err) {
    await pgClient.query('ROLLBACK').catch(() => {});
    throw err;
  }
}
