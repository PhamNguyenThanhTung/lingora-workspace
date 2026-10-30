import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

/** Disposable stateful provider/Prisma double: transactions roll back DB, never external Auth. */
export function teachersFixture() {
  const state = { users: new Map(), accounts: new Map(), requests: new Map(), audits: [] };
  const fail = {};
  const calls = { create: 0, invite: 0, delete: [], password: 0, business: 0 };
  const matches = (row, where) => Object.entries(where).every(([k, v]) =>
    v && typeof v === 'object' && 'not' in v ? row[k] !== v.not : row[k] === v);
  const changed = (row, data) => Object.entries(data).forEach(([k, v]) => {
    row[k] = v && typeof v === 'object' && 'increment' in v ? row[k] + BigInt(v.increment) : v;
  });
  const db = {
    provisioningRequest: {
      findUnique: async ({ where }) => structuredClone([...state.requests.values()].find(r => matches(r, where)) || null),
      create: async ({ data }) => {
        if (fail.ledgerCreate) throw new Error('ledger unavailable');
        if ([...state.requests.values()].some(r => r.normalizedEmail === data.normalizedEmail)) throw Object.assign(new Error('duplicate'), { code: 'P2002' });
        const row = { id: randomUUID(), authUserId: null, rowVersion: 1n, lastErrorCode: null, ...data };
        state.requests.set(row.id, row); return structuredClone(row);
      },
      updateMany: async ({ where, data }) => {
        if ((data.state === 'IDENTITY_CREATED' && fail.track) || (data.state === 'READY' && fail.ready)
          || (data.state === 'FAILED_RETRYABLE' && fail.ledgerFailureWrite)) throw new Error('ledger failed');
        if (data.state === 'READY' && fail.zeroReady) return { count: 0 };
        if (data.state === 'REQUESTED' && fail.claim) return { count: 0 };
        let count = 0;
        for (const row of state.requests.values()) if (matches(row, where)) { changed(row, data); count++; }
        return { count };
      },
    },
    account: {
      findUnique: async ({ where }) => structuredClone(state.accounts.get(where.id) || null),
      create: async ({ data }) => {
        if (fail.accountCreate) throw new Error('account unavailable');
        assert.ok(state.users.has(data.id), 'Account FK must reference an Auth identity');
        if (state.accounts.has(data.id)) throw new Error('duplicate PK');
        const row = { rowVersion: 1n, createdAt: new Date('2026-10-30T02:00:00Z'), activatedAt: null, ...data };
        state.accounts.set(row.id, row); return structuredClone(row);
      },
      deleteMany: async ({ where }) => {
        if (fail.accountDelete) throw new Error('referenced Account cannot be removed');
        let count = 0;
        for (const [id, row] of state.accounts) if (matches(row, where)) { state.accounts.delete(id); count++; }
        return { count };
      },
    },
    auditEvent: { create: async ({ data }) => {
      if (fail.audit) throw new Error('audit failed');
      assert.ok(['ACCOUNT', 'VERIFIED_AUTH_SUBJECT', 'SYSTEM'].includes(data.actorKind), 'actual DB audit actor kind constraint');
      assert.ok(!JSON.stringify(data.safeContext || {}).includes('@'), 'email must not be persisted in audit context');
      state.audits.push(data); return data;
    } },
    $queryRaw: async (strings, ...args) => {
      calls.business++;
      const q = strings.join('?');
      if (q.includes('FROM auth.users')) return [...state.users.values()].filter(u => u.email.toLowerCase() === args[0]).map(u => ({ id: u.id }));
      if (q.includes('FOR UPDATE') && !q.includes('a.role')) return [];
      if (q.includes('FROM app.accounts')) {
        const rows = [...state.accounts.values()].filter(a => args.length ? a.id === args[0] : !q.includes("WHERE a.role = 'TEACHER'") || a.role === 'TEACHER');
        return rows.map(a => {
          const user = state.users.get(a.id);
          const request = [...state.requests.values()].find(r => r.authUserId === a.id);
          return { ...structuredClone(a), authId: user?.id || null, email: user?.email || null,
            emailConfirmedAt: user?.email_confirmed_at || null, provisioningState: request?.state, requestedRole: request?.requestedRole };
        });
      }
      throw new Error('Unexpected query: ' + q);
    },
    $executeRaw: async (strings, ...args) => {
      calls.business++;
      const q = strings.join('?');
      if (q.includes('UPDATE app.accounts')) {
        const activation = q.includes("status = 'ACTIVE'");
        const [status, id, expected] = activation ? ['ACTIVE', args[0], 'PENDING'] : args;
        const row = state.accounts.get(id);
        if (!row || row.role !== 'TEACHER' || row.status !== expected || (activation ? fail.zeroActivation : fail.zeroStatus)) return 0;
        row.status = status; row.rowVersion++;
        if (activation) row.activatedAt = new Date();
        return 1;
      }
      if (q.includes('INSERT INTO app_private.audit_events')) {
        if (fail.audit) throw new Error('audit unavailable');
        assert.ok(!q.includes("'STAFF'"), 'DB rejects STAFF audit actor kind');
        state.audits.push({ actorKind: q.includes("'VERIFIED_AUTH_SUBJECT'") ? 'VERIFIED_AUTH_SUBJECT' : 'ACCOUNT', targetId: args[0] });
        return 1;
      }
      throw new Error('Unexpected statement: ' + q);
    },
  };
  let tail = Promise.resolve();
  db.$transaction = async fn => {
    const previous = tail; let release; tail = new Promise(r => { release = r; });
    await previous;
    const saved = structuredClone({ accounts: state.accounts, requests: state.requests, audits: state.audits });
    try { return await fn(db); }
    catch (error) { Object.assign(state, saved); throw error; }
    finally { release(); }
  };
  const provider = { auth: { admin: {
    getUserById: async id => {
      if (fail.inspect) throw new Error('provider offline');
      const user = state.users.get(id);
      return user ? { data: { user: structuredClone(user) }, error: null } : { data: null, error: { status: 404 } };
    },
    createUser: async data => {
      calls.create++;
      assert.equal(data.password, undefined); assert.equal(data.email_confirm, false);
      if (fail.create) return { data: null, error: { status: 503, message: 'private-provider-canary' } };
      if ([...state.users.values()].some(u => u.email.toLowerCase() === data.email)) return { data: null, error: { code: 'email_exists' } };
      const user = { ...data, email_confirmed_at: null };
      state.users.set(user.id, user);
      if (fail.createTimeout) throw new Error('timeout after provider commit');
      return { data: { user: structuredClone(user) }, error: null };
    },
    inviteUserByEmail: async (email, options) => {
      calls.invite++; calls.redirect = options.redirectTo;
      if (fail.invite) return { data: null, error: { status: 503, message: 'SMTP private-provider-canary' } };
      const user = [...state.users.values()].find(u => u.email === email);
      return { data: { user: fail.inviteMismatch ? { id: randomUUID() } : structuredClone(user) }, error: null };
    },
    deleteUser: async id => {
      calls.delete.push(id);
      if (fail.deleteAuth) return { error: { status: 503 } };
      assert.equal(state.accounts.has(id), false, 'Account FK must be released before Auth deletion');
      assert.equal([...state.requests.values()].some(r => r.authUserId === id), false, 'Provisioning FK must be released before Auth deletion');
      state.users.delete(id); return { error: null };
    },
  } } };
  const session = id => ({ auth: {
    getUser: async () => ({ data: { user: state.users.get(id) || null }, error: null }),
    updateUser: async () => {
      calls.password++;
      if (fail.password) return { error: { message: 'password private-provider-canary' } };
      if (fail.passwordThrow) throw new Error('ambiguous provider timeout');
      return { error: null };
    },
  } });
  return { db, provider, state, fail, calls, session };
}
