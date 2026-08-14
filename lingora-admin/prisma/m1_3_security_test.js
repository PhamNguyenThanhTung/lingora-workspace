const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function loadLocalEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    process.env[match[1]] = value;
  }
}

loadLocalEnv();

const requiredSupabaseVariables = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
const missingSupabaseVariables = requiredSupabaseVariables.filter(name => !process.env[name]?.trim());
if (missingSupabaseVariables.length) {
  throw new Error(`M1.3-T-008 preflight blocked: missing/empty variables: ${missingSupabaseVariables.join(', ')}`);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/+$/, '');
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const avatarBucket = 'lingora-avatars';
const audioBucket = 'lingora-media';

const db = new PrismaClient();
const ids = {
  coursePublished: crypto.randomUUID(), courseDraft: crypto.randomUUID(),
  lessonPublished: crypto.randomUUID(), lessonDraft: crypto.randomUUID(),
  vocabularyPublished: crypto.randomUUID(), vocabularyDraft: crypto.randomUUID(),
  progressA: crypto.randomUUID(), progressB: crypto.randomUUID(),
  srsA: crypto.randomUUID(), srsB: crypto.randomUUID(), scenario: crypto.randomUUID(),
};
const users = {};
const objects = [];
const results = [];
const cleanupFailures = [];
const priorTestUserIds = (process.env.M13_PRIOR_TEST_USER_IDS || '').split(',').filter(id => /^[0-9a-f-]{36}$/i.test(id));
const cleanupOnly = process.env.M13_CLEANUP_ONLY === '1';

function record(id, ok, evidence) {
  results.push({ id, ok, evidence });
}
async function denied(fn) { try { await fn(); return false; } catch { return true; } }

function responseClass(status) {
  if (status >= 200 && status < 300) return '2xx';
  if (status >= 400 && status < 500) return '4xx';
  if (status >= 500) return '5xx';
  return 'other';
}

function encodedObjectPath(objectPath) {
  return objectPath.split('/').map(encodeURIComponent).join('/');
}

async function httpRequest(url, options) {
  let response;
  try {
    response = await fetch(url, { ...options, signal: AbortSignal.timeout(30000) });
  } catch {
    throw new Error('Supabase HTTP request failed');
  }
  await response.arrayBuffer();
  return { status: response.status, class: responseClass(response.status), ok: response.ok };
}

function authHeaders(token, contentType) {
  return {
    apikey: anonKey,
    Authorization: `Bearer ${token}`,
    ...(contentType ? { 'Content-Type': contentType } : {}),
  };
}

function serviceHeaders(contentType) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    ...(contentType ? { 'Content-Type': contentType } : {}),
  };
}

async function storageUpload(token, bucketId, objectPath, contentType, body) {
  return httpRequest(`${supabaseUrl}/storage/v1/object/${bucketId}/${encodedObjectPath(objectPath)}`, {
    method: 'POST', headers: { ...authHeaders(token, contentType), 'x-upsert': 'false' }, body,
  });
}

async function storageRead(token, bucketId, objectPath) {
  return httpRequest(`${supabaseUrl}/storage/v1/object/${bucketId}/${encodedObjectPath(objectPath)}`, {
    method: 'GET', headers: authHeaders(token),
  });
}

async function storageDelete(token, bucketId, objectPath) {
  return httpRequest(`${supabaseUrl}/storage/v1/object/${bucketId}`, {
    method: 'DELETE', headers: authHeaders(token, 'application/json'), body: JSON.stringify({ prefixes: [objectPath] }),
  });
}

async function serviceObjectExists(bucketId, objectPath) {
  const response = await httpRequest(`${supabaseUrl}/storage/v1/object/${bucketId}/${encodedObjectPath(objectPath)}`, {
    method: 'GET', headers: serviceHeaders(),
  });
  return response.status === 200;
}

async function serviceDeleteObjects(bucketId, objectPaths) {
  if (!objectPaths.length) return { status: 200, class: '2xx', ok: true };
  return httpRequest(`${supabaseUrl}/storage/v1/object/${bucketId}`, {
    method: 'DELETE', headers: serviceHeaders('application/json'), body: JSON.stringify({ prefixes: objectPaths }),
  });
}

async function authAdminRequest(method, suffix, body) {
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users${suffix}`, {
    method,
    headers: serviceHeaders('application/json'),
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Auth admin request failed with HTTP ${response.status}`);
  return payload;
}

async function signIn(email, password) {
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: authHeaders(anonKey, 'application/json'),
    body: JSON.stringify({ email, password }),
    signal: AbortSignal.timeout(30000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) throw new Error(`Auth sign-in failed with HTTP ${response.status}`);
  return payload.access_token;
}

async function createUser(label, malicious = false) {
  const email = `m13-${label}-${crypto.randomUUID()}@example.invalid`;
  const metadata = malicious ? { display_name: 'Learner A', role: 'ADMIN', streak_count: 999 } : { display_name: label };
  const password = `M13!${crypto.randomBytes(24).toString('base64url')}`;
  const created = await authAdminRequest('POST', '', { email, password, email_confirm: true, user_metadata: metadata });
  const id = created.id || created.user?.id;
  if (!id) throw new Error('Auth admin create user returned no user id');
  const token = await signIn(email, password);
  return { id, email, token };
}

async function actor(userId, role, fn) {
  return db.$transaction(async tx => {
    await tx.$executeRawUnsafe(`SET LOCAL ROLE ${role}`);
    if (userId) {
      await tx.$executeRawUnsafe(`SELECT set_config('request.jwt.claim.sub', '${userId}', true)`);
      await tx.$executeRawUnsafe(`SELECT set_config('request.jwt.claim.role', 'authenticated', true)`);
    }
    return fn(tx);
  });
}

async function setup() {
  await db.$executeRawUnsafe(`INSERT INTO public.languages(code,name,native_name,is_learnable,is_ui_locale) VALUES ('vi','Vietnamese','Tiếng Việt',false,true) ON CONFLICT (code) DO NOTHING`);
  await db.$executeRawUnsafe(`INSERT INTO public.languages(code,name,native_name,is_learnable,is_ui_locale) VALUES ('en','English','English',true,true) ON CONFLICT (code) DO NOTHING`);
  users.a = await createUser('learner-a', true);
  users.b = await createUser('learner-b');
  users.admin = await createUser('admin');
  await db.$executeRawUnsafe(`UPDATE public.profiles SET role='ADMIN'::public."Role" WHERE id='${users.admin.id}'::uuid`);

  await db.$executeRawUnsafe(`INSERT INTO public.courses(id,language_code,cefr,order_index,is_published,created_at,updated_at) VALUES ('${ids.coursePublished}','en','A1',910001,true,now(),now()),('${ids.courseDraft}','en','A1',910002,false,now(),now())`);
  await db.$executeRawUnsafe(`INSERT INTO public.lessons(id,course_id,order_index,is_published,created_at,updated_at) VALUES ('${ids.lessonPublished}','${ids.coursePublished}',1,true,now(),now()),('${ids.lessonDraft}','${ids.courseDraft}',1,false,now(),now())`);
  await db.$executeRawUnsafe(`INSERT INTO public.vocabularies(id,language_code,term,normalized_term,created_at,updated_at) VALUES ('${ids.vocabularyPublished}','en','M13 Published','m13-published-${ids.vocabularyPublished}',now(),now()),('${ids.vocabularyDraft}','en','M13 Draft','m13-draft-${ids.vocabularyDraft}',now(),now())`);
  await db.$executeRawUnsafe(`INSERT INTO public.lesson_vocabulary(lesson_id,vocabulary_id,order_index) VALUES ('${ids.lessonPublished}','${ids.vocabularyPublished}',1),('${ids.lessonDraft}','${ids.vocabularyDraft}',1)`);
  await db.$executeRawUnsafe(`INSERT INTO public.user_progress(id,user_id,lesson_id,status,updated_at) VALUES ('${ids.progressA}','${users.a.id}','${ids.lessonPublished}','IN_PROGRESS',now()),('${ids.progressB}','${users.b.id}','${ids.lessonPublished}','IN_PROGRESS',now())`);
  await db.$executeRawUnsafe(`INSERT INTO public.user_vocab_srs(id,user_id,vocabulary_id,interval_days,next_review_at,created_at) VALUES ('${ids.srsA}','${users.a.id}','${ids.vocabularyPublished}',2,now(),now()),('${ids.srsB}','${users.b.id}','${ids.vocabularyPublished}',2,now(),now())`);
  await db.$executeRawUnsafe(`INSERT INTO public.chat_scenarios(id,code,is_published,system_prompt,created_at) VALUES ('${ids.scenario}','m13-${ids.scenario}',true,'test',now())`);
}

async function run() {
  let missingViEvidence = {};
  const missingViUserId = crypto.randomUUID();
  await db.$executeRawUnsafe(`INSERT INTO public.languages(code,name,native_name,is_learnable,is_ui_locale) VALUES ('vi','Vietnamese','Tiếng Việt',false,true) ON CONFLICT (code) DO NOTHING`);
  try {
    await db.$transaction(async tx => {
      await tx.$executeRawUnsafe(`DELETE FROM public.languages WHERE code='vi'`);
      await tx.$executeRawUnsafe(`INSERT INTO auth.users(id,aud,role,email,created_at,updated_at) VALUES ('${missingViUserId}'::uuid,'authenticated','authenticated','m13-missing-vi-${missingViUserId}@example.invalid',now(),now())`);
    });
  } catch { missingViEvidence.failed = true; }
  const missingCounts = await db.$queryRawUnsafe(`SELECT (SELECT count(*)::int FROM auth.users WHERE id='${missingViUserId}'::uuid) auth_count,(SELECT count(*)::int FROM public.profiles WHERE id='${missingViUserId}'::uuid) profile_count,(SELECT count(*)::int FROM public.languages WHERE code='vi') vi_count`);
  missingViEvidence = { ...missingViEvidence, ...missingCounts[0] };
  record('M1.3-T-001A', missingViEvidence.failed && missingViEvidence.auth_count === 0 && missingViEvidence.profile_count === 0 && missingViEvidence.vi_count === 1, missingViEvidence);

  await setup();
  const profiles = await db.$queryRawUnsafe(`SELECT id,role::text role,display_name,streak_count FROM public.profiles WHERE id IN ('${users.a.id}'::uuid,'${users.b.id}'::uuid,'${users.admin.id}'::uuid)`);
  const pa = profiles.find(x => x.id === users.a.id);
  record('M1.3-T-001', profiles.length === 3 && pa.role === 'LEARNER' && pa.streak_count === 0 && pa.display_name === 'Learner A', profiles);

  const newEmail = `m13-updated-${crypto.randomUUID()}@example.invalid`;
  await db.$executeRawUnsafe(`UPDATE auth.users SET email='${newEmail}' WHERE id='${users.a.id}'::uuid`);
  const synced = await db.$queryRawUnsafe(`SELECT email FROM public.profiles WHERE id='${users.a.id}'::uuid`);
  record('M1.3-T-002', synced[0].email === newEmail, { synchronized: synced[0].email === newEmail });

  record('M1.3-T-003', await denied(() => actor(null, 'anon', tx => tx.$queryRawUnsafe(`SELECT * FROM public.languages LIMIT 1`))), 'anonymous public-table read denied');

  const isolation = await actor(users.a.id, 'authenticated', async tx => ({ profiles: await tx.$queryRawUnsafe(`SELECT id FROM public.profiles`), progress: await tx.$queryRawUnsafe(`SELECT id FROM public.user_progress`), srs: await tx.$queryRawUnsafe(`SELECT id FROM public.user_vocab_srs`) }));
  record('M1.3-T-004', isolation.profiles.length === 1 && isolation.profiles[0].id === users.a.id && isolation.progress.length === 1 && isolation.srs.length === 1, isolation);

  await actor(users.a.id, 'authenticated', tx => tx.$executeRawUnsafe(`UPDATE public.profiles SET display_name='Learner A Updated',daily_goal_min=20,timezone='Asia/Ho_Chi_Minh' WHERE id='${users.a.id}'::uuid`));
  const roleDenied = await denied(() => actor(users.a.id, 'authenticated', tx => tx.$executeRawUnsafe(`UPDATE public.profiles SET role='ADMIN'::public."Role" WHERE id='${users.a.id}'::uuid`)));
  const timezoneDenied = await denied(() => actor(users.a.id, 'authenticated', tx => tx.$executeRawUnsafe(`UPDATE public.profiles SET timezone='Not/AZone' WHERE id='${users.a.id}'::uuid`)));
  record('M1.3-T-005', roleDenied && timezoneDenied, { roleDenied, timezoneDenied });

  const visible = await actor(users.a.id, 'authenticated', async tx => ({ courses: await tx.$queryRawUnsafe(`SELECT id FROM public.courses WHERE id IN ('${ids.coursePublished}'::uuid,'${ids.courseDraft}'::uuid)`), lessons: await tx.$queryRawUnsafe(`SELECT id FROM public.lessons WHERE id IN ('${ids.lessonPublished}'::uuid,'${ids.lessonDraft}'::uuid)`), vocabulary: await tx.$queryRawUnsafe(`SELECT id FROM public.vocabularies WHERE id IN ('${ids.vocabularyPublished}'::uuid,'${ids.vocabularyDraft}'::uuid)`) }));
  record('M1.3-T-006', visible.courses.length === 1 && visible.lessons.length === 1 && visible.vocabulary.length === 1, visible);

  const learnerMutationAffected = await actor(users.a.id, 'authenticated', tx => tx.$executeRawUnsafe(`UPDATE public.courses SET is_published=false WHERE id='${ids.coursePublished}'::uuid`));
  const learnerMutationState = await db.$queryRawUnsafe(`SELECT is_published FROM public.courses WHERE id='${ids.coursePublished}'::uuid`);
  const adminCourse = await actor(users.admin.id, 'authenticated', tx => tx.$queryRawUnsafe(`SELECT id FROM public.courses WHERE id='${ids.courseDraft}'::uuid`));
  const adminLearnerData = await actor(users.admin.id, 'authenticated', tx => tx.$queryRawUnsafe(`SELECT id FROM public.user_progress WHERE user_id='${users.a.id}'::uuid`));
  record('M1.3-T-007', learnerMutationAffected === 0 && learnerMutationState[0].is_published && adminCourse.length === 1 && adminLearnerData.length === 0, { learnerMutationAffected, learnerMutationState, adminCourse: adminCourse.length, adminLearnerData: adminLearnerData.length });

  const avatar = `profiles/${users.a.id}/avatar-${crypto.randomUUID()}.png`;
  const avatarReplacement = `profiles/${users.a.id}/avatar-${crypto.randomUUID()}.webp`;
  const avatarAtLimit = `profiles/${users.a.id}/limit-${crypto.randomUUID()}.png`;
  const wrongOwnerAvatar = `profiles/${users.b.id}/wrong-owner-${crypto.randomUUID()}.png`;
  const invalidPathAvatar = `profiles/${users.a.id}/nested/invalid-${crypto.randomUUID()}.png`;
  const invalidMimeAvatar = `profiles/${users.a.id}/invalid-${crypto.randomUUID()}.gif`;
  const oversizedAvatar = `profiles/${users.a.id}/oversized-${crypto.randomUUID()}.png`;
  const anonymousAudioAttempt = `vocabulary/${ids.vocabularyPublished}/anonymous-${crypto.randomUUID()}.mp3`;
  const invalidAudioMime = `vocabulary/${ids.vocabularyPublished}/invalid-${crypto.randomUUID()}.png`;
  const learnerAudioAttempt = `vocabulary/${ids.vocabularyPublished}/learner-${crypto.randomUUID()}.mp3`;
  const publishedAudio = `vocabulary/${ids.vocabularyPublished}/published-${crypto.randomUUID()}.mp3`;
  const draftAudio = `vocabulary/${ids.vocabularyDraft}/draft-${crypto.randomUUID()}.wav`;
  for (const objectPath of [avatar, avatarReplacement, avatarAtLimit, wrongOwnerAvatar, invalidPathAvatar, invalidMimeAvatar, oversizedAvatar]) objects.push({ bucket: avatarBucket, path: objectPath });
  for (const objectPath of [anonymousAudioAttempt, invalidAudioMime, learnerAudioAttempt, publishedAudio, draftAudio]) objects.push({ bucket: audioBucket, path: objectPath });

  record('M1.3-T-008-PREFLIGHT', true, { requiredVariables: requiredSupabaseVariables.length, allNonEmpty: true, secretValuesPrinted: false });

  const bucketRows = await db.$queryRawUnsafe(`SELECT id,public,file_size_limit,allowed_mime_types FROM storage.buckets WHERE id IN ('${avatarBucket}','${audioBucket}') ORDER BY id`);
  const bucketState = Object.fromEntries(bucketRows.map(row => [row.id, row]));
  const storagePolicyDefinitions = await db.$queryRawUnsafe(`SELECT policyname,qual,with_check FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname LIKE 'lingora_%' ORDER BY policyname`);
  const avatarPoliciesUseAvatarBucket = storagePolicyDefinitions.filter(row => row.policyname.startsWith('lingora_avatar_')).every(row => `${row.qual || ''} ${row.with_check || ''}`.includes(avatarBucket));
  const audioPoliciesUseAudioBucket = storagePolicyDefinitions.filter(row => row.policyname.startsWith('lingora_vocabulary_audio_')).every(row => `${row.qual || ''} ${row.with_check || ''}`.includes(audioBucket));
  record('M1.3-T-008-SIZE-PREFLIGHT', bucketRows.length === 2
    && !bucketState[avatarBucket].public && Number(bucketState[avatarBucket].file_size_limit) === 5242880
    && JSON.stringify(bucketState[avatarBucket].allowed_mime_types) === JSON.stringify(['image/jpeg', 'image/png', 'image/webp'])
    && !bucketState[audioBucket].public && Number(bucketState[audioBucket].file_size_limit) === 10485760
    && JSON.stringify(bucketState[audioBucket].allowed_mime_types) === JSON.stringify(['audio/mpeg', 'audio/wav'])
    && storagePolicyDefinitions.length === 6 && avatarPoliciesUseAvatarBucket && audioPoliciesUseAudioBucket, {
    buckets: bucketRows.map(row => ({ id: row.id, public: row.public, fileSizeLimit: String(row.file_size_limit), allowedMimeTypes: row.allowed_mime_types })),
    storagePolicyCount: storagePolicyDefinitions.length, avatarPoliciesUseAvatarBucket, audioPoliciesUseAudioBucket,
  });

  const avatarUpload = await storageUpload(users.a.token, avatarBucket, avatar, 'image/png', Buffer.from('lingora-avatar-a'));
  const avatarExistsAfterUpload = await serviceObjectExists(avatarBucket, avatar);
  const avatarRead = await storageRead(users.a.token, avatarBucket, avatar);
  const replacementUpload = await storageUpload(users.a.token, avatarBucket, avatarReplacement, 'image/webp', Buffer.from('lingora-avatar-a-v2'));
  const replacementExists = await serviceObjectExists(avatarBucket, avatarReplacement);
  record('M1.3-T-008-HTTP-AVATAR-POSITIVE', avatarUpload.ok && avatarExistsAfterUpload && avatarRead.ok && replacementUpload.ok && replacementExists, {
    upload: avatarUpload, read: avatarRead, replacementUpload, beforeUploadExists: false, afterUploadExists: avatarExistsAfterUpload, replacementExists,
  });

  const learnerBRead = await storageRead(users.b.token, avatarBucket, avatar);
  const learnerBDelete = await storageDelete(users.b.token, avatarBucket, avatar);
  const avatarExistsAfterLearnerBDelete = await serviceObjectExists(avatarBucket, avatar);
  const wrongOwnerUpload = await storageUpload(users.a.token, avatarBucket, wrongOwnerAvatar, 'image/png', Buffer.from('wrong-owner'));
  const wrongOwnerExists = await serviceObjectExists(avatarBucket, wrongOwnerAvatar);
  record('M1.3-T-008-HTTP-AVATAR-AUTHZ', !learnerBRead.ok && (!learnerBDelete.ok || avatarExistsAfterLearnerBDelete) && avatarExistsAfterLearnerBDelete && !wrongOwnerUpload.ok && !wrongOwnerExists, {
    learnerBRead, learnerBDelete, avatarExistsAfterLearnerBDelete, wrongOwnerUpload, wrongOwnerExists,
  });

  const atLimitUpload = await storageUpload(users.a.token, avatarBucket, avatarAtLimit, 'image/png', Buffer.alloc(5242880, 1));
  const atLimitExists = await serviceObjectExists(avatarBucket, avatarAtLimit);
  const invalidPathUpload = await storageUpload(users.a.token, avatarBucket, invalidPathAvatar, 'image/png', Buffer.from('invalid-path'));
  const invalidMimeUpload = await storageUpload(users.a.token, avatarBucket, invalidMimeAvatar, 'image/gif', Buffer.from('invalid-mime'));
  const oversizedUpload = await storageUpload(users.a.token, avatarBucket, oversizedAvatar, 'image/png', Buffer.alloc(5242881, 1));
  const overwriteUpload = await storageUpload(users.a.token, avatarBucket, avatar, 'image/png', Buffer.from('overwrite-attempt'));
  const validationExistence = {
    invalidPath: await serviceObjectExists(avatarBucket, invalidPathAvatar),
    invalidMime: await serviceObjectExists(avatarBucket, invalidMimeAvatar),
    oversized: await serviceObjectExists(avatarBucket, oversizedAvatar),
    originalAfterOverwrite: await serviceObjectExists(avatarBucket, avatar),
  };
  record('M1.3-T-008-AVATAR-BOUNDARY', atLimitUpload.ok && atLimitExists && !oversizedUpload.ok && !validationExistence.oversized, {
    approvedBytes: 5242880, approvedUpload: atLimitUpload, approvedExists: atLimitExists,
    rejectedBytes: 5242881, rejectedUpload: oversizedUpload, rejectedExists: validationExistence.oversized,
  });
  record('M1.3-T-008-HTTP-VALIDATION', !invalidPathUpload.ok && !invalidMimeUpload.ok && !oversizedUpload.ok && !overwriteUpload.ok && !validationExistence.invalidPath && !validationExistence.invalidMime && !validationExistence.oversized && validationExistence.originalAfterOverwrite, {
    invalidPathUpload, invalidMimeUpload, oversizedUpload, overwriteUpload, existence: validationExistence,
  });

  const anonymousRead = await storageRead(anonKey, avatarBucket, avatar);
  const anonymousUpload = await storageUpload(anonKey, avatarBucket, avatarReplacement, 'image/webp', Buffer.from('anonymous'));
  const anonymousDelete = await storageDelete(anonKey, avatarBucket, avatar);
  const anonymousAudioUpload = await storageUpload(anonKey, audioBucket, anonymousAudioAttempt, 'audio/mpeg', Buffer.from('anonymous'));
  const avatarExistsAfterAnonymousDelete = await serviceObjectExists(avatarBucket, avatar);
  record('M1.3-T-008-HTTP-ANON', !anonymousRead.ok && !anonymousUpload.ok && (!anonymousDelete.ok || avatarExistsAfterAnonymousDelete) && avatarExistsAfterAnonymousDelete && !anonymousAudioUpload.ok, {
    avatarRead: anonymousRead, avatarUpload: anonymousUpload, avatarDelete: anonymousDelete, avatarStillExists: avatarExistsAfterAnonymousDelete, audioUpload: anonymousAudioUpload,
  });

  const publishedAudioUpload = await httpRequest(`${supabaseUrl}/storage/v1/object/${audioBucket}/${encodedObjectPath(publishedAudio)}`, {
    method: 'POST', headers: { ...serviceHeaders('audio/mpeg'), 'x-upsert': 'false' }, body: Buffer.alloc(10485760, 1),
  });
  const draftAudioUpload = await httpRequest(`${supabaseUrl}/storage/v1/object/${audioBucket}/${encodedObjectPath(draftAudio)}`, {
    method: 'POST', headers: { ...serviceHeaders('audio/wav'), 'x-upsert': 'false' }, body: Buffer.from('draft-audio'),
  });
  const invalidAudioMimeUpload = await httpRequest(`${supabaseUrl}/storage/v1/object/${audioBucket}/${encodedObjectPath(invalidAudioMime)}`, {
    method: 'POST', headers: { ...serviceHeaders('image/png'), 'x-upsert': 'false' }, body: Buffer.from('invalid-audio-mime'),
  });
  const learnerAudioUpload = await storageUpload(users.a.token, audioBucket, learnerAudioAttempt, 'audio/mpeg', Buffer.from('learner-audio'));
  const learnerAudioDelete = await storageDelete(users.a.token, audioBucket, publishedAudio);
  const publishedAudioAfterLearnerDelete = await serviceObjectExists(audioBucket, publishedAudio);
  const invalidAudioMimeExists = await serviceObjectExists(audioBucket, invalidAudioMime);
  record('M1.3-T-008-HTTP-AUDIO-WRITE', publishedAudioUpload.ok && draftAudioUpload.ok && !learnerAudioUpload.ok && (!learnerAudioDelete.ok || publishedAudioAfterLearnerDelete) && publishedAudioAfterLearnerDelete, {
    servicePublishedUpload: publishedAudioUpload, serviceDraftUpload: draftAudioUpload, learnerUpload: learnerAudioUpload, learnerDelete: learnerAudioDelete, publishedObjectStillExists: publishedAudioAfterLearnerDelete,
  });
  record('M1.3-T-008-AUDIO-BOUNDARY', publishedAudioUpload.ok && publishedAudioAfterLearnerDelete && !invalidAudioMimeUpload.ok && !invalidAudioMimeExists, {
    approvedBytes: 10485760, approvedUpload: publishedAudioUpload, approvedExists: publishedAudioAfterLearnerDelete,
    invalidMimeUpload: invalidAudioMimeUpload, invalidMimeExists: invalidAudioMimeExists,
  });

  const publishedAudioRead = await storageRead(users.a.token, audioBucket, publishedAudio);
  const draftAudioRead = await storageRead(users.a.token, audioBucket, draftAudio);
  const anonymousAudioRead = await storageRead(anonKey, audioBucket, publishedAudio);
  const anonymousAudioDelete = await storageDelete(anonKey, audioBucket, publishedAudio);
  const publishedAudioAfterAnonymousDelete = await serviceObjectExists(audioBucket, publishedAudio);
  record('M1.3-T-008-HTTP-AUDIO-READ', publishedAudioRead.ok && !draftAudioRead.ok && !anonymousAudioRead.ok && (!anonymousAudioDelete.ok || publishedAudioAfterAnonymousDelete) && publishedAudioAfterAnonymousDelete, {
    published: publishedAudioRead, draft: draftAudioRead, anonymousRead: anonymousAudioRead, anonymousDelete: anonymousAudioDelete, publishedObjectStillExists: publishedAudioAfterAnonymousDelete,
  });

  const avatarDelete = await storageDelete(users.a.token, avatarBucket, avatar);
  const avatarAbsentAfterDelete = !(await serviceObjectExists(avatarBucket, avatar));
  const replacementDelete = await storageDelete(users.a.token, avatarBucket, avatarReplacement);
  const replacementAbsentAfterDelete = !(await serviceObjectExists(avatarBucket, avatarReplacement));
  const limitDelete = await storageDelete(users.a.token, avatarBucket, avatarAtLimit);
  const limitAbsentAfterDelete = !(await serviceObjectExists(avatarBucket, avatarAtLimit));
  const audioDelete = await serviceDeleteObjects(audioBucket, [publishedAudio, draftAudio]);
  const audioAbsentAfterDelete = !(await serviceObjectExists(audioBucket, publishedAudio)) && !(await serviceObjectExists(audioBucket, draftAudio));
  record('M1.3-T-008-CLEANUP-HTTP', avatarDelete.ok && avatarAbsentAfterDelete && replacementDelete.ok && replacementAbsentAfterDelete && limitDelete.ok && limitAbsentAfterDelete && audioDelete.ok && audioAbsentAfterDelete, {
    avatarDelete, avatarAbsentAfterDelete, replacementDelete, replacementAbsentAfterDelete, limitDelete, limitAbsentAfterDelete, serviceAudioDelete: audioDelete, audioAbsentAfterDelete,
  });

  const storagePolicyRows = await db.$queryRawUnsafe(`SELECT policyname FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname LIKE 'lingora_%' ORDER BY policyname`);
  record('M1.3-T-008-DB', storagePolicyRows.length === 6, { storagePolicies: storagePolicyRows.map(row => row.policyname), count: storagePolicyRows.length });

  const before = await db.$queryRawUnsafe(`SELECT interval_days,review_count,lapse_count FROM public.user_vocab_srs WHERE id='${ids.srsA}'::uuid`);
  await actor(users.a.id, 'authenticated', tx => tx.$executeRawUnsafe(`SELECT public.record_review('${ids.srsA}'::uuid,true,0.8,4)`));
  const after = await db.$queryRawUnsafe(`SELECT interval_days,review_count,lapse_count FROM public.user_vocab_srs WHERE id='${ids.srsA}'::uuid`);
  const reviewLogs = await db.$queryRawUnsafe(`SELECT interval_days FROM public.review_logs WHERE srs_card_id='${ids.srsA}'::uuid`);
  record('M1.3-T-009', before[0].interval_days === 2 && after[0].interval_days === 4 && after[0].review_count === 1 && reviewLogs.length === 1 && reviewLogs[0].interval_days === 2, { before, after, reviewLogs });

  const beforeInvalid = await db.$queryRawUnsafe(`SELECT (SELECT count(*)::int FROM public.review_logs WHERE srs_card_id='${ids.srsA}'::uuid) logs,review_count,interval_days FROM public.user_vocab_srs WHERE id='${ids.srsA}'::uuid`);
  const nonOwnerDenied = await denied(() => actor(users.b.id, 'authenticated', tx => tx.$executeRawUnsafe(`SELECT public.record_review('${ids.srsA}'::uuid,true,0.5,2)`)));
  const invalidDenied = await denied(() => actor(users.a.id, 'authenticated', tx => tx.$executeRawUnsafe(`SELECT public.record_review('${ids.srsA}'::uuid,true,1.5,2)`)));
  const afterInvalid = await db.$queryRawUnsafe(`SELECT (SELECT count(*)::int FROM public.review_logs WHERE srs_card_id='${ids.srsA}'::uuid) logs,review_count,interval_days FROM public.user_vocab_srs WHERE id='${ids.srsA}'::uuid`);
  record('M1.3-T-010', nonOwnerDenied && invalidDenied && JSON.stringify(beforeInvalid) === JSON.stringify(afterInvalid), { nonOwnerDenied, invalidDenied, beforeInvalid, afterInvalid });

  await Promise.all([actor(users.a.id, 'authenticated', tx => tx.$executeRawUnsafe(`SELECT public.record_review('${ids.srsA}'::uuid,true,0.7,5)`)), actor(users.a.id, 'authenticated', tx => tx.$executeRawUnsafe(`SELECT public.record_review('${ids.srsA}'::uuid,false,0.6,6)`))]);
  const concurrencyState = await db.$queryRawUnsafe(`SELECT review_count,lapse_count FROM public.user_vocab_srs WHERE id='${ids.srsA}'::uuid`);
  const concurrencyLogs = await db.$queryRawUnsafe(`SELECT count(*)::int count FROM public.review_logs WHERE srs_card_id='${ids.srsA}'::uuid`);
  record('M1.3-T-011', concurrencyState[0].review_count === 3 && concurrencyState[0].lapse_count === 1 && concurrencyLogs[0].count === 3, { concurrencyState, concurrencyLogs, retry: 'ambiguous timeout automatic retry forbidden' });

  const streak1 = await db.$queryRawUnsafe(`SELECT streak_count,last_qualifying_activity_date FROM public.profiles WHERE id='${users.a.id}'::uuid`);
  await actor(users.a.id, 'authenticated', tx => tx.$executeRawUnsafe(`SELECT public.record_review('${ids.srsA}'::uuid,true,0.9,7)`));
  const streak2 = await db.$queryRawUnsafe(`SELECT streak_count,last_qualifying_activity_date FROM public.profiles WHERE id='${users.a.id}'::uuid`);
  record('M1.3-T-012', streak1[0].streak_count === streak2[0].streak_count && String(streak1[0].last_qualifying_activity_date) === String(streak2[0].last_qualifying_activity_date), { streak1, streak2 });

  const audit = await db.$queryRawUnsafe(`SELECT p.proname,p.prosecdef,p.proconfig,has_function_privilege('anon',p.oid,'EXECUTE') anon_exec FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN ('record_review','handle_auth_user_change','is_admin','prepare_chat_message_insert') ORDER BY p.proname`);
  const directSrsDenied = await denied(() => actor(users.a.id, 'authenticated', tx => tx.$executeRawUnsafe(`UPDATE public.user_vocab_srs SET interval_days=99 WHERE id='${ids.srsA}'::uuid`)));
  record('M1.3-T-013', audit.every(x => x.prosecdef && x.proconfig.includes('search_path=""') && !x.anon_exec) && directSrsDenied, { audit, directSrsDenied });
  const failed = results.filter(result => !result.ok);
  console.log(JSON.stringify({ results, summary: { passed: results.length - failed.length, failed: failed.map(result => result.id) } }, null, 2));
  if (failed.length) throw new Error(`Security test failures: ${failed.map(result => result.id).join(', ')}`);
}

async function cleanup() {
  try {
    const remainingPaths = [];
    for (const object of objects) if (await serviceObjectExists(object.bucket, object.path)) remainingPaths.push(object);
    for (const bucketId of [avatarBucket, audioBucket]) {
      const bucketPaths = remainingPaths.filter(object => object.bucket === bucketId).map(object => object.path);
      if (!bucketPaths.length) continue;
      const cleanupResponse = await serviceDeleteObjects(bucketId, bucketPaths);
      if (!cleanupResponse.ok) cleanupFailures.push(`Storage cleanup HTTP ${cleanupResponse.status}`);
    }
    for (const object of objects) if (await serviceObjectExists(object.bucket, object.path)) cleanupFailures.push(`Storage object remained: ${object.bucket}/${object.path.split('/')[0]}/<test-object>`);
  } catch (error) { cleanupFailures.push(`Storage cleanup error: ${error.message}`); }
  await db.$executeRawUnsafe(`DELETE FROM public.review_logs WHERE srs_card_id IN ('${ids.srsA}'::uuid,'${ids.srsB}'::uuid)`);
  await db.$executeRawUnsafe(`DELETE FROM public.user_vocab_srs WHERE id IN ('${ids.srsA}'::uuid,'${ids.srsB}'::uuid)`);
  await db.$executeRawUnsafe(`DELETE FROM public.user_progress WHERE id IN ('${ids.progressA}'::uuid,'${ids.progressB}'::uuid)`);
  await db.$executeRawUnsafe(`DELETE FROM public.lesson_vocabulary WHERE lesson_id IN ('${ids.lessonPublished}'::uuid,'${ids.lessonDraft}'::uuid)`);
  await db.$executeRawUnsafe(`DELETE FROM public.vocabularies WHERE id IN ('${ids.vocabularyPublished}'::uuid,'${ids.vocabularyDraft}'::uuid)`);
  await db.$executeRawUnsafe(`DELETE FROM public.lessons WHERE id IN ('${ids.lessonPublished}'::uuid,'${ids.lessonDraft}'::uuid)`);
  await db.$executeRawUnsafe(`DELETE FROM public.courses WHERE id IN ('${ids.coursePublished}'::uuid,'${ids.courseDraft}'::uuid)`);
  await db.$executeRawUnsafe(`DELETE FROM public.chat_scenarios WHERE id='${ids.scenario}'::uuid`);
  const discoveredTestUsers = await db.$queryRawUnsafe(`SELECT id FROM auth.users WHERE email LIKE 'm13-%@example.invalid'`);
  const testUserIds = [...new Set([...Object.values(users).map(user => user?.id), ...priorTestUserIds, ...discoveredTestUsers.map(user => user.id)].filter(Boolean))];
  if (testUserIds.length) {
    const sqlUserIdTexts = testUserIds.map(userId => `'${userId}'`).join(',');
    const ownedObjects = await db.$queryRawUnsafe(`SELECT bucket_id,name FROM storage.objects WHERE owner_id IN (${sqlUserIdTexts})`);
    if (ownedObjects.length) {
      for (const bucketId of [...new Set(ownedObjects.map(object => object.bucket_id))]) {
        const deleteResponse = await serviceDeleteObjects(bucketId, ownedObjects.filter(object => object.bucket_id === bucketId).map(object => object.name));
        if (!deleteResponse.ok) cleanupFailures.push(`Owned object cleanup HTTP ${deleteResponse.status}`);
      }
    }
  }
  for (const userId of testUserIds) {
    try { await authAdminRequest('DELETE', `/${userId}`, { should_soft_delete: false }); }
    catch {
      try {
        await db.$executeRawUnsafe(`DELETE FROM public.profiles WHERE id='${userId}'::uuid`);
        await db.$executeRawUnsafe(`DELETE FROM auth.users WHERE id='${userId}'::uuid`);
      }
      catch { cleanupFailures.push('Exact test identity cleanup failed'); }
    }
  }
  if (testUserIds.length) {
    const sqlUserIds = testUserIds.map(userId => `'${userId}'::uuid`).join(',');
    const sqlUserIdTexts = testUserIds.map(userId => `'${userId}'`).join(',');
    const residue = await db.$queryRawUnsafe(`SELECT (SELECT count(*)::int FROM auth.users WHERE id IN (${sqlUserIds})) auth_count,(SELECT count(*)::int FROM public.profiles WHERE id IN (${sqlUserIds})) profile_count,(SELECT count(*)::int FROM storage.objects WHERE owner_id IN (${sqlUserIdTexts})) object_count`);
    if (residue[0].auth_count || residue[0].profile_count || residue[0].object_count) cleanupFailures.push('Exact test identity residue remained');
  }
  if (cleanupFailures.length) throw new Error(`Cleanup failures: ${cleanupFailures.join('; ')}`);
  return { authUsers: 0, profiles: 0, ownedObjects: 0 };
}

async function main() {
  if (cleanupOnly) {
    try { console.log(JSON.stringify({ cleanup: await cleanup() })); } catch (error) { console.error(error.message); process.exitCode = 1; }
    return;
  }
  let runFailure;
  let cleanupFailure;
  try { await run(); } catch (error) { runFailure = error; }
  try { await cleanup(); } catch (error) { cleanupFailure = error; }
  if (runFailure) console.error(runFailure.message);
  if (cleanupFailure) console.error(cleanupFailure.message);
  if (runFailure || cleanupFailure) process.exitCode = 1;
}

main().finally(() => db.$disconnect());
