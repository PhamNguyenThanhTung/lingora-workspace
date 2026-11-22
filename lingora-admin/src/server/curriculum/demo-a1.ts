import type { PrismaClient } from '../../../generated/product-client/index.js';
import {
  createLesson,
  assignLesson,
  saveTeacherLessonDraft,
  submitTeacherLesson,
  approveReview,
  publishReview,
  requestChangesReview,
} from '../lessons/index.ts';
import { createReviewComment } from '../lessons/comments.ts';

export interface DemoActorIds {
  adminId: string;
  teacherAId: string;
  teacherBId: string;
}

export class ActorCollisionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ActorCollisionError';
  }
}

export class CurriculumCollisionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CurriculumCollisionError';
  }
}

export class TargetSafetyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TargetSafetyError';
  }
}

export interface DatabaseTargetSafetyResult {
  isSafe: boolean;
  targetType: 'LOCAL_DISPOSABLE' | 'ALLOWLISTED_REMOTE_DEV';
  host: string;
  port: string;
  database: string;
  projectRef?: string;
  error?: string;
}

export function verifyDatabaseTarget(
  databaseUrl: string,
  options?: {
    allowRemoteDevTarget?: string;
    nodeEnv?: string;
    lingoraEnv?: string;
  }
): DatabaseTargetSafetyResult {
  const nodeEnv = options?.nodeEnv ?? process.env.NODE_ENV;
  const lingoraEnv = options?.lingoraEnv ?? process.env.LINGORA_ENV;

  if (nodeEnv === 'production' || lingoraEnv === 'production') {
    throw new TargetSafetyError(
      `CRITICAL SAFETY GUARD: Detected production environment (NODE_ENV=${nodeEnv}, LINGORA_ENV=${lingoraEnv}). Demo fixtures must NOT be seeded into production databases.`
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(databaseUrl);
  } catch (err: any) {
    throw new TargetSafetyError(`Invalid DATABASE_URL format: ${err.message}`);
  }

  if (!['postgresql:', 'postgres:'].includes(parsed.protocol)) {
    throw new TargetSafetyError('Only PostgreSQL database URLs are supported.');
  }

  const host = parsed.hostname;
  const port = parsed.port || '5432';
  const database = parsed.pathname;

  const lowerHost = host.toLowerCase();
  const lowerPath = database.toLowerCase();

  // Case 7: Reject production-like database URLs even with NODE_ENV=development
  if (
    lowerHost.includes('prod') ||
    lowerHost.includes('production') ||
    lowerPath.includes('prod') ||
    lowerPath.includes('production') ||
    parsed.searchParams.get('environment') === 'production'
  ) {
    throw new TargetSafetyError(
      `CRITICAL SAFETY GUARD: Production-like target detected in database URL (${host}${database}). Demo fixtures must NOT be seeded into production databases.`
    );
  }

  const isLoopback = ['localhost', '127.0.0.1', '::1'].includes(lowerHost);
  if (isLoopback) {
    return {
      isSafe: true,
      targetType: 'LOCAL_DISPOSABLE',
      host,
      port,
      database,
    };
  }

  // Remote Target: Must strictly match trusted official Supabase domain suffix
  const isDirectSupabase = lowerHost.endsWith('.supabase.co');
  const isPoolerSupabase = lowerHost.endsWith('.pooler.supabase.com');

  if (!isDirectSupabase && !isPoolerSupabase) {
    throw new TargetSafetyError(
      `SAFETY GUARD REJECTED: Remote host '${host}' is not a trusted Supabase domain (*.supabase.co or *.pooler.supabase.com). Arbitrary hostnames or substring matches are strictly denied.`
    );
  }

  const knownDevProjectRef = 'sncfyvpzwedqgwfpffkh';
  let targetProjectRef: string | undefined;

  if (isDirectSupabase) {
    // Direct host must strictly match [db.]<projectRef>.supabase.co
    const directMatch = lowerHost.match(/^(?:db\.)?([a-z0-9]+)\.supabase\.co$/);
    if (!directMatch) {
      throw new TargetSafetyError(
        `SAFETY GUARD REJECTED: Remote host '${host}' does not conform to trusted Supabase direct domain format.`
      );
    }
    targetProjectRef = directMatch[1];
  } else if (isPoolerSupabase) {
    // Pooler requires username in format postgres.<projectRef>
    const username = decodeURIComponent(parsed.username || '');
    const poolerUserMatch = username.match(/^postgres\.([a-z0-9]+)$/);
    if (!poolerUserMatch) {
      throw new TargetSafetyError(
        `SAFETY GUARD REJECTED: Supabase pooler requires username format 'postgres.<projectRef>'.`
      );
    }
    targetProjectRef = poolerUserMatch[1];
  }

  // Cross-check: If username contains postgres.<ref>, verify it does not conflict with host
  const rawUsername = decodeURIComponent(parsed.username || '');
  if (rawUsername.startsWith('postgres.')) {
    const userRef = rawUsername.slice('postgres.'.length);
    if (targetProjectRef && userRef !== targetProjectRef) {
      throw new TargetSafetyError(
        `SAFETY GUARD REJECTED: Username project ref '${userRef}' does not match host project ref '${targetProjectRef}'.`
      );
    }
  }

  if (targetProjectRef !== knownDevProjectRef) {
    throw new TargetSafetyError(
      `SAFETY GUARD REJECTED: Target database project ref '${targetProjectRef || 'unknown'}' is not allowlisted DEV target '${knownDevProjectRef}'.`
    );
  }

  const explicitOptIn =
    options?.allowRemoteDevTarget ||
    process.env.LINGORA_ALLOW_DEMO_SEED_TARGET;

  if (explicitOptIn !== knownDevProjectRef) {
    throw new TargetSafetyError(
      `SAFETY GUARD REJECTED: Target database is remote DEV database '${targetProjectRef}'. ` +
      `Explicit opt-in is required to seed a remote DEV database. ` +
      `Please provide LINGORA_ALLOW_DEMO_SEED_TARGET=${knownDevProjectRef}`
    );
  }

  return {
    isSafe: true,
    targetType: 'ALLOWLISTED_REMOTE_DEV',
    host,
    port,
    database,
    projectRef: targetProjectRef,
  };
}

export async function assertActorSafe(
  prisma: PrismaClient,
  actor: { id: string; expectedRole: 'ADMIN' | 'TEACHER'; displayName: string; email: string }
): Promise<void> {
  // Preflight 1: Check app.accounts
  const existingAccount = await prisma.account.findUnique({
    where: { id: actor.id },
  });

  // Preflight 2: Check auth.users by ID and by email
  const authUsersWithId = await prisma.$queryRawUnsafe<Array<{ id: string; email: string | null }>>(
    `SELECT id::text, email FROM auth.users WHERE id = $1::uuid`,
    actor.id
  );

  const authUsersWithEmail = await prisma.$queryRawUnsafe<Array<{ id: string; email: string | null }>>(
    `SELECT id::text, email FROM auth.users WHERE lower(email) = lower($1)`,
    actor.email
  );

  const authUserById = authUsersWithId[0];
  const authUserByEmail = authUsersWithEmail[0];

  // Case: Auth identity collision (another auth user already owns this email)
  if (authUserByEmail && authUserByEmail.id !== actor.id) {
    throw new ActorCollisionError(
      `ACTOR COLLISION: Auth identity collision. An auth user with email "${actor.email}" already exists with a different ID (${authUserByEmail.id} vs expected ${actor.id}). Refusing to overwrite.`
    );
  }

  // Case: Auth user with this ID exists but has a different email
  if (authUserById && authUserById.email?.toLowerCase() !== actor.email.toLowerCase()) {
    throw new ActorCollisionError(
      `ACTOR COLLISION: Auth user with ID ${actor.id} already exists with a conflicting email ("${authUserById.email}" vs expected "${actor.email}"). Refusing to overwrite.`
    );
  }

  if (existingAccount) {
    // Validate role
    if (existingAccount.role !== actor.expectedRole) {
      throw new ActorCollisionError(
        `ACTOR COLLISION: Account with ID ${actor.id} already exists with role "${existingAccount.role}" (expected "${actor.expectedRole}"). Refusing to overwrite existing user.`
      );
    }
    // Validate status
    if (existingAccount.status !== 'ACTIVE') {
      throw new ActorCollisionError(
        `ACTOR COLLISION: Account with ID ${actor.id} already exists with status "${existingAccount.status}" (expected "ACTIVE"). Refusing to overwrite existing user.`
      );
    }
    if (!authUserById || authUserById.email?.toLowerCase() !== actor.email.toLowerCase()) {
      throw new ActorCollisionError(`Cannot verify auth ownership of existing account ${actor.id}.`);
    }
    return;
  }

}

export async function provisionDemoActors(
  prisma: PrismaClient,
  actors: Array<{ id: string; expectedRole: 'ADMIN' | 'TEACHER'; displayName: string; email: string }>
): Promise<void> {
  for (const actor of actors) await assertActorSafe(prisma, actor);
  await prisma.$transaction(async tx => {
    for (const actor of actors) {
      await tx.$executeRawUnsafe(
        `INSERT INTO auth.users (id, email) VALUES ($1::uuid, $2) ON CONFLICT (id) DO NOTHING`,
        actor.id, actor.email
      );
      await tx.$executeRawUnsafe(
        `INSERT INTO app.accounts (id, role, status, display_name, ui_locale, created_at, updated_at)
         VALUES ($1::uuid, $2, 'ACTIVE', $3, 'vi', NOW(), NOW()) ON CONFLICT (id) DO NOTHING`,
        actor.id, actor.expectedRole, actor.displayName
      );
      await assertActorSafe(tx as PrismaClient, actor);
    }
  });
}

export interface DemoA1Result {
  alreadyProvisioned: boolean;
  courseId: string;
  courseName: string;
  unitIds: string[];
  lessonIds: string[];
  counts: {
    courses: number;
    units: number;
    lessons: number;
    activePublishedRevisions: number;
    totalRevisions: number;
    vocabularyConcepts: number;
    vocabularyLinks: number;
    exercises: number;
    listeningItems: number;
    reviewComments: number;
  };
}

export const DEMO_A1_CONSTANTS = {
  courseId: 'e0000000-0000-4000-8000-000000000001',
  unit1Id: 'e0000000-0000-4000-8000-000000000011',
  unit2Id: 'e0000000-0000-4000-8000-000000000012',
  unit3Id: 'e0000000-0000-4000-8000-000000000013',
  lesson1Id: 'e0000000-0000-4000-8000-000000000021',
  lesson2Id: 'e0000000-0000-4000-8000-000000000022',
  lesson3Id: 'e0000000-0000-4000-8000-000000000023',
  lesson4Id: 'e0000000-0000-4000-8000-000000000024',
  lesson5Id: 'e0000000-0000-4000-8000-000000000025',
  lesson6Id: 'e0000000-0000-4000-8000-000000000026',
  lesson7Id: 'e0000000-0000-4000-8000-000000000027',
  lesson8Id: 'e0000000-0000-4000-8000-000000000028',
  lesson9Id: 'e0000000-0000-4000-8000-000000000029',
  teacherAId: 'e0000000-0000-4000-8000-00000000000a',
  teacherBId: 'e0000000-0000-4000-8000-00000000000b',
  audioLesson3Url: 'https://sncfyvpzwedqgwfpffkh.supabase.co/storage/v1/object/public/lingora-media/audio/unit1-lesson3-age-phone.mp3',
  audioLesson5Url: 'https://sncfyvpzwedqgwfpffkh.supabase.co/storage/v1/object/public/lingora-media/audio/unit2-lesson5-routine.mp3',
  audioLesson8Url: 'https://sncfyvpzwedqgwfpffkh.supabase.co/storage/v1/object/public/lingora-media/audio/unit3-lesson8-directions.mp3',
  // Backward compatibility aliases:
  audioEmmaUrl: 'https://sncfyvpzwedqgwfpffkh.supabase.co/storage/v1/object/public/lingora-media/audio/unit1-lesson3-age-phone.mp3',
  audioRoutineUrl: 'https://sncfyvpzwedqgwfpffkh.supabase.co/storage/v1/object/public/lingora-media/audio/unit2-lesson5-routine.mp3',
  audioDirectionsUrl: 'https://sncfyvpzwedqgwfpffkh.supabase.co/storage/v1/object/public/lingora-media/audio/unit3-lesson8-directions.mp3',
};

export const DEMO_COURSE_SPEC = {
  id: DEMO_A1_CONSTANTS.courseId,
  names: {
    vi: 'Tiếng Anh A1 — Giao tiếp hằng ngày',
    en: 'English A1 — Everyday Communication',
  },
  languageId: '00000000-0000-0000-0000-000000000001',
  frameworkId: '00000000-0000-0000-0000-000000000010',
  defaultStartLevelId: '00000000-0000-0000-0000-000000000021',
  isActive: true,
};

export const DEMO_UNITS_SPEC = [
  {
    id: DEMO_A1_CONSTANTS.unit1Id,
    courseId: DEMO_A1_CONSTANTS.courseId,
    levelId: DEMO_COURSE_SPEC.defaultStartLevelId,
    code: 'ENG-A1-U01',
    position: 1,
    names: { vi: 'Bắt đầu giao tiếp', en: 'Unit 1: Getting Started' },
    teacherKey: 'teacherA' as const,
  },
  {
    id: DEMO_A1_CONSTANTS.unit2Id,
    courseId: DEMO_A1_CONSTANTS.courseId,
    levelId: DEMO_COURSE_SPEC.defaultStartLevelId,
    code: 'ENG-A1-U02',
    position: 2,
    names: { vi: 'Cuộc sống hằng ngày', en: 'Unit 2: Daily Life' },
    teacherKey: 'teacherA' as const,
  },
  {
    id: DEMO_A1_CONSTANTS.unit3Id,
    courseId: DEMO_A1_CONSTANTS.courseId,
    levelId: DEMO_COURSE_SPEC.defaultStartLevelId,
    code: 'ENG-A1-U03',
    position: 3,
    names: { vi: 'Giao tiếp thực tế', en: 'Unit 3: Everyday Situations' },
    teacherKey: 'teacherB' as const,
  },
];

// Helper to construct canonical text blocks
function textBlock(blockKey: string, position: number, runs: Array<{ text: string; bold?: boolean; italic?: boolean }>) {
  return {
    blockKey,
    type: 'TEXT' as const,
    position,
    schemaVersion: 1 as const,
    content: {
      nodes: [
        {
          type: 'paragraph' as const,
          runs,
        },
      ],
    },
  };
}

function headingBlock(blockKey: string, position: number, level: 2 | 3 | 4, text: string) {
  return {
    blockKey,
    type: 'HEADING' as const,
    position,
    schemaVersion: 1 as const,
    content: { level, text },
  };
}

function vocabularyBlock(blockKey: string, position: number) {
  return {
    blockKey,
    type: 'VOCABULARY' as const,
    position,
    schemaVersion: 1 as const,
    content: { selection: 'lesson' as const },
  };
}

function grammarBlock(
  blockKey: string,
  position: number,
  title: string,
  explanation: string,
  examples: Array<{ text: string; translation?: string; explanation?: string }>
) {
  return {
    blockKey,
    type: 'GRAMMAR' as const,
    position,
    schemaVersion: 1 as const,
    content: { title, explanation, examples },
  };
}

function exampleBlock(blockKey: string, position: number, text: string, translation?: string) {
  return {
    blockKey,
    type: 'EXAMPLE' as const,
    position,
    schemaVersion: 1 as const,
    content: { text, translation },
  };
}

function dialogueBlock(
  blockKey: string,
  position: number,
  lines: Array<{ speaker: string; text: string; translation?: string }>
) {
  return {
    blockKey,
    type: 'DIALOGUE' as const,
    position,
    schemaVersion: 1 as const,
    content: { lines },
  };
}

function calloutBlock(
  blockKey: string,
  position: number,
  tone: 'note' | 'tip' | 'info' | 'warning' | 'caution' | 'important',
  title: string,
  text: string
) {
  return {
    blockKey,
    type: 'CALLOUT' as const,
    position,
    schemaVersion: 1 as const,
    content: {
      tone,
      title,
      document: {
        nodes: [
          {
            type: 'paragraph' as const,
            runs: [{ text }],
          },
        ],
      },
    },
  };
}

function mediaBlock(blockKey: string, position: number, url: string, caption?: string) {
  return {
    blockKey,
    type: 'MEDIA' as const,
    position,
    schemaVersion: 1 as const,
    content: {
      kind: 'audio' as const,
      url,
      caption: caption || null,
    },
  };
}

function dividerBlock(blockKey: string, position: number) {
  return {
    blockKey,
    type: 'DIVIDER' as const,
    position,
    schemaVersion: 1 as const,
    content: {},
  };
}

export const DEMO_LESSONS_DATA = [
  // ---------------------------------------------------------------------------
  // UNIT 1: GETTING STARTED (Teacher A: Nguyễn Minh Anh)
  // ---------------------------------------------------------------------------
  // Lesson 1: Hello! Tôi là... (Hello! My name is...)
  {
    id: DEMO_A1_CONSTANTS.lesson1Id,
    unitId: DEMO_A1_CONSTANTS.unit1Id,
    position: 1,
    teacherKey: 'teacherA' as const,
    title: { vi: 'Hello! Tôi là...', en: 'Lesson 1: Hello! My name is...' },
    blocks: [
      headingBlock('l1-b1', 1, 2, 'Chào hỏi và giới thiệu bản thân'),
      textBlock('l1-b2', 2, [
        {
          text: 'Chào hỏi là bước đầu tiên và quan trọng nhất khi giao tiếp bằng tiếng Anh. Trong bài học này, chúng ta sẽ học cách chào hỏi lịch sự, giới thiệu tên của mình và làm quen với bạn mới.',
        },
      ]),
      vocabularyBlock('l1-b3', 3),
      grammarBlock(
        'l1-b4',
        4,
        'Đại từ nhân xưng và Động từ To Be ở hiện tại',
        "Trong tiếng Anh, 'I' (tôi) đi với động từ to be 'am' (viết tắt là I'm). Để giới thiệu tên, bạn dùng cấu trúc 'I am + [Tên]' hoặc 'My name is + [Tên]'. Khi gặp ai đó lần đầu tiên, câu chào lịch sự chuẩn mực là 'Nice to meet you'.",
        [
          { text: 'I am Mai.', translation: 'Tôi là Mai.', explanation: 'Giới thiệu tên trực tiếp.' },
          { text: 'My name is Nam.', translation: 'Tên tôi là Nam.', explanation: 'Cách giới thiệu tên lịch sự và thông dụng.' },
          { text: 'Nice to meet you.', translation: 'Rất vui được gặp bạn.', explanation: 'Dùng khi chào hỏi lúc mới làm quen.' },
        ]
      ),
      exampleBlock('l1-b5', 5, 'Nice to meet you. My name is Mai.', 'Rất vui được gặp bạn. Tên tôi là Mai.'),
      dialogueBlock('l1-b6', 6, [
        { speaker: 'Mai', text: "Hello! I'm Mai. What's your name?", translation: 'Xin chào! Tôi là Mai. Tên bạn là gì?' },
        { speaker: 'Nam', text: 'Hi Mai. My name is Nam.', translation: 'Chào Mai. Tên tôi là Nam.' },
        { speaker: 'Mai', text: 'Nice to meet you.', translation: 'Rất vui được gặp bạn.' },
        { speaker: 'Nam', text: 'Nice to meet you too.', translation: 'Tôi cũng rất vui được gặp bạn.' },
      ]),
      calloutBlock(
        'l1-b7',
        7,
        'tip',
        'Mẹo giao tiếp',
        "Khi gặp ai đó lần đầu tiên, hãy luôn mỉm cười và nói 'Nice to meet you'. Đây là câu chào tiêu chuẩn trong mọi tình huống giao tiếp tiếng Anh."
      ),
      dividerBlock('l1-b8', 8),
    ],
    vocabulary: [
      {
        position: 1,
        isCore: true,
        create: {
          canonicalForm: 'Hello',
          senseKey: 'greeting',
          phonetic: 'həˈləʊ',
          partOfSpeech: 'interjection',
          meaningLabels: { vi: 'Xin chào', en: 'Hello' },
          example: 'Hello! My name is Mai.',
        },
      },
      {
        position: 2,
        isCore: true,
        create: {
          canonicalForm: 'Hi',
          senseKey: 'greeting-informal',
          phonetic: 'haɪ',
          partOfSpeech: 'interjection',
          meaningLabels: { vi: 'Chào (thân mật)', en: 'Hi (informal)' },
          example: 'Hi Nam, nice to meet you.',
        },
      },
      {
        position: 3,
        isCore: true,
        create: {
          canonicalForm: 'Good morning',
          senseKey: 'greeting-morning',
          phonetic: 'ɡʊd ˈmɔːnɪŋ',
          partOfSpeech: 'phrase',
          meaningLabels: { vi: 'Chào buổi sáng', en: 'Good morning' },
          example: 'Good morning, teacher.',
        },
      },
      {
        position: 4,
        isCore: true,
        create: {
          canonicalForm: 'Goodbye',
          senseKey: 'farewell',
          phonetic: 'ɡʊdˈbaɪ',
          partOfSpeech: 'interjection',
          meaningLabels: { vi: 'Tạm biệt', en: 'Goodbye' },
          example: 'Goodbye, see you tomorrow.',
        },
      },
      {
        position: 5,
        isCore: true,
        create: {
          canonicalForm: 'Name',
          senseKey: 'identity-name',
          phonetic: 'neɪm',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Tên', en: 'Name' },
          example: 'What is your name?',
        },
      },
      {
        position: 6,
        isCore: true,
        create: {
          canonicalForm: 'My',
          senseKey: 'possessive-my',
          phonetic: 'maɪ',
          partOfSpeech: 'determiner',
          meaningLabels: { vi: 'Của tôi', en: 'My' },
          example: 'My name is Mai.',
        },
      },
      {
        position: 7,
        isCore: true,
        create: {
          canonicalForm: 'Your',
          senseKey: 'possessive-your',
          phonetic: 'jɔːr',
          partOfSpeech: 'determiner',
          meaningLabels: { vi: 'Của bạn', en: 'Your' },
          example: 'What is your name?',
        },
      },
      {
        position: 8,
        isCore: true,
        create: {
          canonicalForm: 'I',
          senseKey: 'pronoun-first-person',
          phonetic: 'aɪ',
          partOfSpeech: 'pronoun',
          meaningLabels: { vi: 'Tôi', en: 'I' },
          example: 'I am a student.',
        },
      },
      {
        position: 9,
        isCore: true,
        create: {
          canonicalForm: 'You',
          senseKey: 'pronoun-second-person',
          phonetic: 'juː',
          partOfSpeech: 'pronoun',
          meaningLabels: { vi: 'Bạn', en: 'You' },
          example: 'How are you today?',
        },
      },
      {
        position: 10,
        isCore: true,
        create: {
          canonicalForm: 'Meet',
          senseKey: 'social-meet',
          phonetic: 'miːt',
          partOfSpeech: 'verb',
          meaningLabels: { vi: 'Gặp, làm quen', en: 'To meet' },
          example: 'Nice to meet you.',
        },
      },
      {
        position: 11,
        isCore: true,
        create: {
          canonicalForm: 'Nice',
          senseKey: 'pleasant',
          phonetic: 'naɪs',
          partOfSpeech: 'adjective',
          meaningLabels: { vi: 'Tốt, vui vẻ, đẹp', en: 'Pleasant' },
          example: 'It is nice to meet you.',
        },
      },
      {
        position: 12,
        isCore: true,
        create: {
          canonicalForm: 'Thanks',
          senseKey: 'gratitude',
          phonetic: 'θæŋks',
          partOfSpeech: 'interjection',
          meaningLabels: { vi: 'Cảm ơn', en: 'Thanks' },
          example: 'Thanks for your help.',
        },
      },
    ],
    exercises: [
      {
        position: 1,
        isCore: true,
        type: 'MCQ' as const,
        promptData: {
          prompt: 'Từ nào sau đây dùng để chào một người vào buổi sáng?',
          options: [
            { id: 'opt-1-1', text: 'Good morning' },
            { id: 'opt-1-2', text: 'Good night' },
            { id: 'opt-1-3', text: 'Goodbye' },
          ],
        },
        gradingData: { correctOptionId: 'opt-1-1' },
        feedbackData: {
          explanation: "'Good morning' có nghĩa là chào buổi sáng, dùng từ khi thức dậy đến khoảng 12 giờ trưa.",
        },
      },
      {
        position: 2,
        isCore: true,
        type: 'FILL_BLANK' as const,
        promptData: {
          prompt: 'Điền từ còn thiếu vào câu chào lịch sự khi gặp mặt:',
          sentence: 'Nice to ____ you.',
        },
        gradingData: { acceptedAnswers: ['meet', 'see'], caseSensitive: false },
        feedbackData: {
          explanation: "'Nice to meet you' có nghĩa là 'Rất vui được gặp bạn', là mẫu câu chuẩn mực khi làm quen.",
        },
      },
      {
        position: 3,
        isCore: true,
        type: 'REORDER' as const,
        promptData: {
          prompt: 'Sắp xếp các từ sau thành câu hỏi tên người khác:',
          tokens: [
            { id: 't1-1', text: 'What' },
            { id: 't1-2', text: 'is' },
            { id: 't1-3', text: 'your' },
            { id: 't1-4', text: 'name?' },
          ],
        },
        gradingData: { correctOrder: ['t1-1', 't1-2', 't1-3', 't1-4'] },
        feedbackData: {
          explanation: "'What is your name?' là câu hỏi tên đúng trật tự ngữ pháp trong tiếng Anh.",
        },
      },
      {
        position: 4,
        isCore: true,
        type: 'MCQ' as const,
        promptData: {
          prompt: "Từ 'Thanks' trong tiếng Anh có nghĩa là gì?",
          options: [
            { id: 'opt-1-4', text: 'Cảm ơn' },
            { id: 'opt-1-5', text: 'Tạm biệt' },
            { id: 'opt-1-6', text: 'Xin chào' },
          ],
        },
        gradingData: { correctOptionId: 'opt-1-4' },
        feedbackData: {
          explanation: "'Thanks' là cách nói ngắn gọn, thân mật của 'Thank you' mang nghĩa 'Cảm ơn'.",
        },
      },
      {
        position: 5,
        isCore: true,
        type: 'GRAMMAR' as const,
        promptData: {
          prompt: "Dùng cấu trúc 'I + am + Name' để giới thiệu bạn tên là Mai:",
          sourceSentence: 'Mai (tên của bạn)',
          targetPattern: 'I + am + Name',
        },
        gradingData: {
          acceptedAnswers: ['I am Mai.', "I'm Mai.", 'I am Mai', "I'm Mai"],
          caseSensitive: false,
        },
        feedbackData: {
          explanation: "Cấu trúc 'I am Mai' hoặc viết tắt 'I'm Mai' dùng để tự giới thiệu tên mình.",
        },
      },
      {
        position: 6,
        isCore: true,
        type: 'REORDER' as const,
        promptData: {
          prompt: 'Sắp xếp các từ thành câu chào mừng lịch sự:',
          tokens: [
            { id: 't1-5', text: 'Nice' },
            { id: 't1-6', text: 'to' },
            { id: 't1-7', text: 'meet' },
            { id: 't1-8', text: 'you.' },
          ],
        },
        gradingData: { correctOrder: ['t1-5', 't1-6', 't1-7', 't1-8'] },
        feedbackData: {
          explanation: "'Nice to meet you.' là câu chào chuẩn mực khi mới làm quen.",
        },
      },
    ],
  },

  // Lesson 2: Bạn đến từ đâu? (Where are you from?)
  {
    id: DEMO_A1_CONSTANTS.lesson2Id,
    unitId: DEMO_A1_CONSTANTS.unit1Id,
    position: 2,
    teacherKey: 'teacherA' as const,
    title: { vi: 'Bạn đến từ đâu?', en: 'Lesson 2: Where are you from?' },
    blocks: [
      headingBlock('l2-b1', 1, 2, 'Hỏi và nói về quê quán, quốc tịch'),
      textBlock('l2-b2', 2, [
        {
          text: "Sau khi chào hỏi và biết tên nhau, chủ đề tiếp theo thường là quê quán và nơi bạn đang sinh sống. Chúng ta sẽ cùng học cấu trúc 'Where are you from?' và cách trả lời về quốc gia của mình.",
        },
      ]),
      vocabularyBlock('l2-b3', 3),
      grammarBlock(
        'l2-b4',
        4,
        'Cấu trúc hỏi và trả lời quê quán',
        "Câu hỏi quê quán: 'Where are you from?'. Câu trả lời: 'I am from + [Tên quốc gia]'. Nếu muốn nói nơi đang sống: 'I live in + [Tên thành phố]'. Chú ý chia động từ to be theo ngôi: I am, You are, He/She is.",
        [
          { text: 'Where are you from? - I am from Vietnam.', translation: 'Bạn đến từ đâu? - Tôi đến từ Việt Nam.' },
          { text: 'I live in London. I am an English student.', translation: 'Tôi sống ở Luân Đôn. Tôi là một học sinh người Anh.' },
          { text: 'He is from Japan. He lives in Tokyo.', translation: 'Anh ấy đến từ Nhật Bản. Anh ấy sống ở Tokyo.' },
        ]
      ),
      exampleBlock('l2-b5', 5, 'I am from Vietnam. I live in Hanoi.', 'Tôi đến từ Việt Nam. Tôi sống ở Hà Nội.'),
      dialogueBlock('l2-b6', 6, [
        { speaker: 'Nam', text: 'Where are you from, Anna?', translation: 'Bạn đến từ đâu vậy Anna?' },
        { speaker: 'Anna', text: "I'm from England. I live in London. What about you?", translation: 'Tôi đến từ nước Anh. Tôi sống ở Luân Đôn. Còn bạn?' },
        { speaker: 'Nam', text: "I'm from Vietnam. I live in Hanoi.", translation: 'Tôi đến từ Việt Nam. Tôi sống ở Hà Nội.' },
      ]),
      calloutBlock(
        'l2-b7',
        7,
        'info',
        'Đoạn văn đọc hiểu (Reading Profile)',
        'Hello. My name is Anna. I am from England. I live in London. I am an English student. I love Vietnam and Vietnamese food.'
      ),
      dividerBlock('l2-b8', 8),
    ],
    vocabulary: [
      {
        position: 1,
        isCore: true,
        create: {
          canonicalForm: 'Country',
          senseKey: 'nation',
          phonetic: 'ˈkʌntri',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Quốc gia, đất nước', en: 'Country' },
          example: 'Vietnam is a beautiful country.',
        },
      },
      {
        position: 2,
        isCore: true,
        create: {
          canonicalForm: 'City',
          senseKey: 'urban-center',
          phonetic: 'ˈsɪti',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Thành phố', en: 'City' },
          example: 'Hanoi is a big city.',
        },
      },
      {
        position: 3,
        isCore: true,
        create: {
          canonicalForm: 'From',
          senseKey: 'origin',
          phonetic: 'frɒm',
          partOfSpeech: 'preposition',
          meaningLabels: { vi: 'Đến từ, từ', en: 'From' },
          example: 'I am from Vietnam.',
        },
      },
      {
        position: 4,
        isCore: true,
        create: {
          canonicalForm: 'Vietnam',
          senseKey: 'country-vietnam',
          phonetic: 'ˌvjɛtˈnɑːm',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Việt Nam', en: 'Vietnam' },
          example: 'I live in Vietnam.',
        },
      },
      {
        position: 5,
        isCore: true,
        create: {
          canonicalForm: 'Vietnamese',
          senseKey: 'nationality-vietnamese',
          phonetic: 'ˌvjɛtnəˈmiːz',
          partOfSpeech: 'adjective',
          meaningLabels: { vi: 'Người Việt Nam / Tiếng Việt', en: 'Vietnamese' },
          example: 'She is Vietnamese.',
        },
      },
      {
        position: 6,
        isCore: true,
        create: {
          canonicalForm: 'Japan',
          senseKey: 'country-japan',
          phonetic: 'dʒəˈpæn',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Nhật Bản', en: 'Japan' },
          example: 'He is from Japan.',
        },
      },
      {
        position: 7,
        isCore: true,
        create: {
          canonicalForm: 'Japanese',
          senseKey: 'nationality-japanese',
          phonetic: 'ˌdʒæpəˈniːz',
          partOfSpeech: 'adjective',
          meaningLabels: { vi: 'Người Nhật / Tiếng Nhật', en: 'Japanese' },
          example: 'He speaks Japanese.',
        },
      },
      {
        position: 8,
        isCore: true,
        create: {
          canonicalForm: 'Korea',
          senseKey: 'country-korea',
          phonetic: 'kəˈriːə',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Hàn Quốc', en: 'Korea' },
          example: 'They come from Korea.',
        },
      },
      {
        position: 9,
        isCore: true,
        create: {
          canonicalForm: 'Korean',
          senseKey: 'nationality-korean',
          phonetic: 'kəˈriːən',
          partOfSpeech: 'adjective',
          meaningLabels: { vi: 'Người Hàn / Tiếng Hàn', en: 'Korean' },
          example: 'She is Korean.',
        },
      },
      {
        position: 10,
        isCore: true,
        create: {
          canonicalForm: 'England',
          senseKey: 'country-england',
          phonetic: 'ˈɪŋɡlənd',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Nước Anh', en: 'England' },
          example: 'Anna is from England.',
        },
      },
      {
        position: 11,
        isCore: true,
        create: {
          canonicalForm: 'English',
          senseKey: 'language-english',
          phonetic: 'ˈɪŋɡlɪʃ',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Tiếng Anh / Người Anh', en: 'English' },
          example: 'I learn English every day.',
        },
      },
      {
        position: 12,
        isCore: true,
        create: {
          canonicalForm: 'Live',
          senseKey: 'reside',
          phonetic: 'lɪv',
          partOfSpeech: 'verb',
          meaningLabels: { vi: 'Sống, cư trú', en: 'To live' },
          example: 'I live in Hanoi.',
        },
      },
    ],
    exercises: [
      {
        position: 1,
        isCore: true,
        type: 'MCQ' as const,
        promptData: {
          prompt: 'Dựa vào đoạn văn đọc hiểu trong bài học, Anna đến từ quốc gia nào?',
          options: [
            { id: 'opt-2-1', text: 'England' },
            { id: 'opt-2-2', text: 'Japan' },
            { id: 'opt-2-3', text: 'Korea' },
          ],
        },
        gradingData: { correctOptionId: 'opt-2-1' },
        feedbackData: {
          explanation: "Trong bài đọc có câu: 'I am from England', do đó Anna đến từ nước Anh.",
        },
      },
      {
        position: 2,
        isCore: true,
        type: 'FILL_BLANK' as const,
        promptData: {
          prompt: 'Điền tên quốc gia vào câu: Tôi đến từ Việt Nam.',
          sentence: 'I am from ____.',
        },
        gradingData: { acceptedAnswers: ['Vietnam', 'Viet Nam'], caseSensitive: false },
        feedbackData: {
          explanation: "'Vietnam' là tên quốc gia tiếng Anh của Việt Nam.",
        },
      },
      {
        position: 3,
        isCore: true,
        type: 'REORDER' as const,
        promptData: {
          prompt: 'Sắp xếp các từ thành câu hỏi quê quán:',
          tokens: [
            { id: 't2-1', text: 'Where' },
            { id: 't2-2', text: 'are' },
            { id: 't2-3', text: 'you' },
            { id: 't2-4', text: 'from?' },
          ],
        },
        gradingData: { correctOrder: ['t2-1', 't2-2', 't2-3', 't2-4'] },
        feedbackData: {
          explanation: "'Where are you from?' là câu hỏi quê quán chuẩn trong tiếng Anh.",
        },
      },
      {
        position: 4,
        isCore: true,
        type: 'GRAMMAR' as const,
        promptData: {
          prompt: 'Viết câu hoàn chỉnh nói bạn đến từ nước Anh theo mẫu:',
          sourceSentence: 'England (nước Anh)',
          targetPattern: 'Subject + To Be + From + Country',
        },
        gradingData: {
          acceptedAnswers: [
            'I am from England.',
            "I'm from England.",
            'I am from England',
            "I'm from England",
          ],
          caseSensitive: false,
        },
        feedbackData: {
          explanation: "Cấu trúc chuẩn: 'I am from England.'",
        },
      },
      {
        position: 5,
        isCore: true,
        type: 'MCQ' as const,
        promptData: {
          prompt: "Trong câu 'I live in London', từ 'live' có nghĩa là gì?",
          options: [
            { id: 'opt-2-4', text: 'Sống, cư trú' },
            { id: 'opt-2-5', text: 'Đi du lịch' },
            { id: 'opt-2-6', text: 'Học tập' },
          ],
        },
        gradingData: { correctOptionId: 'opt-2-4' },
        feedbackData: {
          explanation: "Động từ 'live' có nghĩa là sinh sống hoặc cư trú tại một địa điểm.",
        },
      },
      {
        position: 6,
        isCore: true,
        type: 'FILL_BLANK' as const,
        promptData: {
          prompt: 'Điền từ vào câu: Anna is an ____ student.',
          sentence: 'Anna is an ____ student.',
        },
        gradingData: { acceptedAnswers: ['English'], caseSensitive: false },
        feedbackData: {
          explanation: "Trong bài đọc: 'I am an English student' (Tôi là một học sinh người Anh).",
        },
      },
    ],
  },

  // Lesson 3: Tuổi và số điện thoại (Age and Phone Numbers)
  {
    id: DEMO_A1_CONSTANTS.lesson3Id,
    unitId: DEMO_A1_CONSTANTS.unit1Id,
    position: 3,
    teacherKey: 'teacherA' as const,
    title: { vi: 'Tuổi và số điện thoại', en: 'Lesson 3: Age and Phone Numbers' },
    blocks: [
      headingBlock('l3-b1', 1, 2, 'Học đếm số, hỏi tuổi và trao đổi số điện thoại'),
      textBlock('l3-b2', 2, [
        {
          text: 'Các con số xuất hiện liên tục trong đời sống hằng ngày: từ tuổi tác, số điện thoại, giá tiền đến số nhà. Bài học này sẽ giúp bạn làm quen với các con số cơ bản và cách đọc số điện thoại.',
        },
      ]),
      vocabularyBlock('l3-b3', 3),
      grammarBlock(
        'l3-b4',
        4,
        'Cấu trúc hỏi tuổi và số điện thoại',
        "Hỏi tuổi: 'How old are you?'. Trả lời: 'I am + [Số tuổi] + years old'. Hỏi số điện thoại: 'What is your phone number?'. Khi đọc số điện thoại, ta đọc từng chữ số một.",
        [
          { text: 'How old are you? - I am twenty years old.', translation: 'Bạn bao nhiêu tuổi? - Tôi hai mươi tuổi.' },
          { text: 'What is your phone number? - My phone number is 0912 345 678.', translation: 'Số điện thoại của bạn là gì? - Số điện thoại của tôi là 0912 345 678.' },
        ]
      ),
      exampleBlock('l3-b5', 5, 'My phone number is 0912 345 678.', 'Số điện thoại của tôi là 0912 345 678.'),
      dialogueBlock('l3-b6', 6, [
        { speaker: 'Anna', text: 'How old are you, Nam?', translation: 'Bạn bao nhiêu tuổi rồi Nam?' },
        { speaker: 'Nam', text: 'I am twenty years old. And you?', translation: 'Tôi hai mươi tuổi. Còn bạn?' },
        { speaker: 'Anna', text: 'I am twenty years old too. What is your phone number?', translation: 'Tôi cũng hai mươi tuổi. Số điện thoại của bạn là gì?' },
        { speaker: 'Nam', text: 'My phone number is 0912 345 678.', translation: 'Số của tôi là 0912 345 678.' },
      ]),
      mediaBlock(
        'l3-b7',
        7,
        DEMO_A1_CONSTANTS.audioLesson3Url,
        'Luyện nghe: Tuổi và số điện thoại liên hệ'
      ),
      calloutBlock(
        'l3-b8',
        8,
        'note',
        'Lưu ý khi đọc số điện thoại',
        "Trong tiếng Anh, số 0 trong dãy số điện thoại thường được đọc là 'zero' hoặc 'oh'. Các số giống nhau đứng cạnh nhau có thể đọc là 'double'."
      ),
      dividerBlock('l3-b9', 9),
    ],
    vocabulary: [
      {
        position: 1,
        isCore: true,
        create: {
          canonicalForm: 'Zero',
          senseKey: 'number-0',
          phonetic: 'ˈzɪərəʊ',
          partOfSpeech: 'number',
          meaningLabels: { vi: 'Số không (0)', en: 'Zero' },
          example: 'My phone number starts with zero.',
        },
      },
      {
        position: 2,
        isCore: true,
        create: {
          canonicalForm: 'One',
          senseKey: 'number-1',
          phonetic: 'wʌn',
          partOfSpeech: 'number',
          meaningLabels: { vi: 'Số một (1)', en: 'One' },
          example: 'I have one brother.',
        },
      },
      {
        position: 3,
        isCore: true,
        create: {
          canonicalForm: 'Two',
          senseKey: 'number-2',
          phonetic: 'tuː',
          partOfSpeech: 'number',
          meaningLabels: { vi: 'Số hai (2)', en: 'Two' },
          example: 'I have two sisters.',
        },
      },
      {
        position: 4,
        isCore: true,
        create: {
          canonicalForm: 'Three',
          senseKey: 'number-3',
          phonetic: 'θriː',
          partOfSpeech: 'number',
          meaningLabels: { vi: 'Số ba (3)', en: 'Three' },
          example: 'There are three books on the table.',
        },
      },
      {
        position: 5,
        isCore: true,
        create: {
          canonicalForm: 'Four',
          senseKey: 'number-4',
          phonetic: 'fɔːr',
          partOfSpeech: 'number',
          meaningLabels: { vi: 'Số bốn (4)', en: 'Four' },
          example: 'We are in room number four.',
        },
      },
      {
        position: 6,
        isCore: true,
        create: {
          canonicalForm: 'Five',
          senseKey: 'number-5',
          phonetic: 'faɪv',
          partOfSpeech: 'number',
          meaningLabels: { vi: 'Số năm (5)', en: 'Five' },
          example: 'It is five o’clock.',
        },
      },
      {
        position: 7,
        isCore: true,
        create: {
          canonicalForm: 'Age',
          senseKey: 'years-lived',
          phonetic: 'eɪdʒ',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Tuổi tác', en: 'Age' },
          example: 'What is your age?',
        },
      },
      {
        position: 8,
        isCore: true,
        create: {
          canonicalForm: 'Old',
          senseKey: 'age-description',
          phonetic: 'əʊld',
          partOfSpeech: 'adjective',
          meaningLabels: { vi: 'Tuổi, già', en: 'Old' },
          example: 'How old are you?',
        },
      },
      {
        position: 9,
        isCore: true,
        create: {
          canonicalForm: 'Phone',
          senseKey: 'telephone',
          phonetic: 'fəʊn',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Điện thoại', en: 'Phone' },
          example: 'What is your phone number?',
        },
      },
      {
        position: 10,
        isCore: true,
        create: {
          canonicalForm: 'Number',
          senseKey: 'digit',
          phonetic: 'ˈnʌmbər',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Con số, số điện thoại', en: 'Number' },
          example: 'My phone number is 0912 345 678.',
        },
      },
    ],
    exercises: [
      {
        position: 1,
        isCore: true,
        type: 'LISTENING' as const,
        promptData: {
          prompt: 'Nghe đoạn âm thanh và cho biết số điện thoại của người nói là số nào?',
          audioUrl: DEMO_A1_CONSTANTS.audioLesson3Url,
          options: [
            { id: 'opt-3-1', text: '0912 345 678' },
            { id: 'opt-3-2', text: '0988 123 456' },
            { id: 'opt-3-3', text: '0905 678 910' },
          ],
        },
        gradingData: {
          correctOptionId: 'opt-3-1',
          transcript: 'Hello, my name is Nam. I am twenty years old. My phone number is 0912 345 678.',
        },
        feedbackData: {
          explanation: "Người nói trong đoạn băng phát âm: 'Hello, my name is Nam. I am twenty years old. My phone number is 0912 345 678.'",
        },
      },
      {
        position: 2,
        isCore: true,
        type: 'MCQ' as const,
        promptData: {
          prompt: "Câu nào sau đây là câu trả lời phù hợp cho câu hỏi 'How old are you?'?",
          options: [
            { id: 'opt-3-4', text: 'I am twenty years old.' },
            { id: 'opt-3-5', text: 'I am from Vietnam.' },
            { id: 'opt-3-6', text: 'My name is Nam.' },
          ],
        },
        gradingData: { correctOptionId: 'opt-3-4' },
        feedbackData: {
          explanation: "'How old are you?' hỏi về tuổi, câu trả lời phù hợp là 'I am twenty years old.'",
        },
      },
      {
        position: 3,
        isCore: true,
        type: 'FILL_BLANK' as const,
        promptData: {
          prompt: 'Điền từ vào câu giới thiệu số điện thoại:',
          sentence: 'My phone ____ is 0912 345 678.',
        },
        gradingData: { acceptedAnswers: ['number'], caseSensitive: false },
        feedbackData: {
          explanation: "Cụm từ chuẩn là 'phone number' (số điện thoại).",
        },
      },
      {
        position: 4,
        isCore: true,
        type: 'REORDER' as const,
        promptData: {
          prompt: 'Sắp xếp các từ thành câu hỏi tuổi:',
          tokens: [
            { id: 't3-1', text: 'How' },
            { id: 't3-2', text: 'old' },
            { id: 't3-3', text: 'are' },
            { id: 't3-4', text: 'you?' },
          ],
        },
        gradingData: { correctOrder: ['t3-1', 't3-2', 't3-3', 't3-4'] },
        feedbackData: {
          explanation: "'How old are you?' là câu hỏi tuổi chuẩn xác.",
        },
      },
      {
        position: 5,
        isCore: true,
        type: 'GRAMMAR' as const,
        promptData: {
          prompt: 'Viết câu hoàn chỉnh: Bạn 20 tuổi theo cấu trúc:',
          sourceSentence: 'twenty (20 tuổi)',
          targetPattern: 'Subject + To Be + Number + Years old',
        },
        gradingData: {
          acceptedAnswers: [
            'I am twenty years old.',
            "I'm twenty years old.",
            'I am twenty years old',
            "I'm twenty years old",
          ],
          caseSensitive: false,
        },
        feedbackData: {
          explanation: "Cấu trúc trả lời tuổi: 'I am twenty years old.'",
        },
      },
      {
        position: 6,
        isCore: true,
        type: 'MCQ' as const,
        promptData: {
          prompt: "Từ 'five' trong tiếng Anh chỉ con số nào?",
          options: [
            { id: 'opt-3-7', text: '5' },
            { id: 'opt-3-8', text: '4' },
            { id: 'opt-3-9', text: '3' },
          ],
        },
        gradingData: { correctOptionId: 'opt-3-7' },
        feedbackData: {
          explanation: "'five' có nghĩa là số 5.",
        },
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // UNIT 2: DAILY LIFE (Teacher A: Nguyễn Minh Anh)
  // ---------------------------------------------------------------------------
  // Lesson 4: Một ngày của tôi (My Daily Routine)
  {
    id: DEMO_A1_CONSTANTS.lesson4Id,
    unitId: DEMO_A1_CONSTANTS.unit2Id,
    position: 1,
    teacherKey: 'teacherA' as const,
    title: { vi: 'Một ngày của tôi', en: 'Lesson 4: My Daily Routine' },
    blocks: [
      headingBlock('l4-b1', 1, 2, 'Mô tả các hoạt động thường ngày'),
      textBlock('l4-b2', 2, [
        {
          text: 'Thì hiện tại đơn (Present Simple) là một trong những điểm ngữ pháp nền tảng quan trọng nhất trong tiếng Anh. Chúng ta sử dụng thì này để kể về những thói quen lặp đi lặp lại và lịch trình làm việc mỗi ngày.',
        },
      ]),
      vocabularyBlock('l4-b3', 3),
      grammarBlock(
        'l4-b4',
        4,
        'Thì Hiện tại đơn khẳng định',
        "Với chủ ngữ số nhiều hoặc 'I/You', động từ giữ nguyên dạng nguyên thể. Ví dụ: 'I wake up at seven', 'They study English'. Khi chủ ngữ là ngôi thứ ba số ít (he/she), động từ thêm 's' hoặc 'es'.",
        [
          { text: "I wake up at seven o'clock.", translation: 'Tôi thức dậy vào lúc bảy giờ.' },
          { text: 'I study English in the evening.', translation: 'Tôi học tiếng Anh vào buổi tối.' },
          { text: 'He goes to school by bus.', translation: 'Cậu ấy đi học bằng xe buýt.' },
        ]
      ),
      exampleBlock('l4-b5', 5, 'I have breakfast with my family every morning.', 'Tôi ăn sáng cùng gia đình mỗi buổi sáng.'),
      calloutBlock(
        'l4-b6',
        6,
        'info',
        'Đoạn văn đọc hiểu (Daily Routine Reading: 95 từ)',
        'Every day, David wakes up at seven o’clock in the morning. He gets up and washes his face. At seven thirty, he has breakfast with bread, eggs, and hot tea. At eight o’clock, David goes to school by bus. He studies English and math with his friends. At twelve o’clock, he has lunch at school. In the afternoon, he goes home at five o’clock. In the evening, David has dinner with his parents, reads books, and goes to sleep at ten o’clock.'
      ),
      dialogueBlock('l4-b7', 7, [
        { speaker: 'Mai', text: 'What time do you wake up every day, David?', translation: 'Bạn thức dậy lúc mấy giờ mỗi ngày vậy David?' },
        { speaker: 'David', text: "I wake up at seven o'clock. Then I have breakfast and go to school.", translation: 'Tôi thức dậy lúc bảy giờ. Sau đó tôi ăn sáng rồi đi học.' },
        { speaker: 'Mai', text: 'Do you study English in the evening?', translation: 'Buổi tối bạn có học tiếng Anh không?' },
        { speaker: 'David', text: 'Yes, I study English for one hour every evening.', translation: 'Có, tôi học tiếng Anh một tiếng mỗi tối.' },
      ]),
      dividerBlock('l4-b8', 8),
    ],
    vocabulary: [
      {
        position: 1,
        isCore: true,
        create: {
          canonicalForm: 'Wake up',
          senseKey: 'routine-wake',
          phonetic: 'weɪk ʌp',
          partOfSpeech: 'verb',
          meaningLabels: { vi: 'Thức giấc', en: 'To wake up' },
          example: "I wake up at seven o'clock.",
        },
      },
      {
        position: 2,
        isCore: true,
        create: {
          canonicalForm: 'Get up',
          senseKey: 'routine-get-up',
          phonetic: 'ɡet ʌp',
          partOfSpeech: 'verb',
          meaningLabels: { vi: 'Rời giường, dậy', en: 'To get out of bed' },
          example: 'I get up early every morning.',
        },
      },
      {
        position: 3,
        isCore: true,
        create: {
          canonicalForm: 'Breakfast',
          senseKey: 'morning-meal',
          phonetic: 'ˈbrekfəst',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Bữa sáng', en: 'Breakfast' },
          example: 'I eat breakfast at seven thirty.',
        },
      },
      {
        position: 4,
        isCore: true,
        create: {
          canonicalForm: 'Go',
          senseKey: 'move-travel',
          phonetic: 'ɡəʊ',
          partOfSpeech: 'verb',
          meaningLabels: { vi: 'Đi', en: 'To go' },
          example: 'I go to school by bus.',
        },
      },
      {
        position: 5,
        isCore: true,
        create: {
          canonicalForm: 'Work',
          senseKey: 'occupation-work',
          phonetic: 'wɜːk',
          partOfSpeech: 'verb',
          meaningLabels: { vi: 'Làm việc / Công việc', en: 'To work / Work' },
          example: 'He works at a hospital.',
        },
      },
      {
        position: 6,
        isCore: true,
        create: {
          canonicalForm: 'Study',
          senseKey: 'learn-study',
          phonetic: 'ˈstʌdi',
          partOfSpeech: 'verb',
          meaningLabels: { vi: 'Học tập, nghiên cứu', en: 'To study' },
          example: 'I study English every evening.',
        },
      },
      {
        position: 7,
        isCore: true,
        create: {
          canonicalForm: 'School',
          senseKey: 'institution-school',
          phonetic: 'skuːl',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Trường học', en: 'School' },
          example: 'She goes to school every day.',
        },
      },
      {
        position: 8,
        isCore: true,
        create: {
          canonicalForm: 'Lunch',
          senseKey: 'midday-meal',
          phonetic: 'lʌntʃ',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Bữa trưa', en: 'Lunch' },
          example: 'We have lunch at twelve o’clock.',
        },
      },
      {
        position: 9,
        isCore: true,
        create: {
          canonicalForm: 'Home',
          senseKey: 'residence-home',
          phonetic: 'həʊm',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Nhà', en: 'Home' },
          example: 'I go home at five in the afternoon.',
        },
      },
      {
        position: 10,
        isCore: true,
        create: {
          canonicalForm: 'Dinner',
          senseKey: 'evening-meal',
          phonetic: 'ˈdɪnər',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Bữa tối', en: 'Dinner' },
          example: 'We have dinner together.',
        },
      },
      {
        position: 11,
        isCore: true,
        create: {
          canonicalForm: 'Sleep',
          senseKey: 'rest-sleep',
          phonetic: 'sliːp',
          partOfSpeech: 'verb',
          meaningLabels: { vi: 'Ngủ', en: 'To sleep' },
          example: 'I sleep eight hours every night.',
        },
      },
    ],
    exercises: [
      {
        position: 1,
        isCore: true,
        type: 'MCQ' as const,
        promptData: {
          prompt: 'Dựa vào bài đọc hiểu, David thức dậy vào lúc mấy giờ?',
          options: [
            { id: 'opt-4-1', text: "At seven o'clock" },
            { id: 'opt-4-2', text: "At eight o'clock" },
            { id: 'opt-4-3', text: "At six o'clock" },
          ],
        },
        gradingData: { correctOptionId: 'opt-4-1' },
        feedbackData: {
          explanation: "Bài đọc nêu rõ: 'Every day, David wakes up at seven o'clock in the morning.'",
        },
      },
      {
        position: 2,
        isCore: true,
        type: 'FILL_BLANK' as const,
        promptData: {
          prompt: 'Điền từ chỉ bữa sáng: Tôi ăn sáng vào lúc bảy giờ.',
          sentence: 'I have ____ at seven in the morning.',
        },
        gradingData: { acceptedAnswers: ['breakfast'], caseSensitive: false },
        feedbackData: {
          explanation: "Cụm từ chuẩn là 'have breakfast' (ăn sáng).",
        },
      },
      {
        position: 3,
        isCore: true,
        type: 'REORDER' as const,
        promptData: {
          prompt: 'Sắp xếp các từ thành câu thói quen hàng ngày:',
          tokens: [
            { id: 't4-1', text: 'I' },
            { id: 't4-2', text: 'study' },
            { id: 't4-3', text: 'English' },
            { id: 't4-4', text: 'every' },
            { id: 't4-5', text: 'day.' },
          ],
        },
        gradingData: { correctOrder: ['t4-1', 't4-2', 't4-3', 't4-4', 't4-5'] },
        feedbackData: {
          explanation: "'I study English every day.' là câu đúng trật tự từ.",
        },
      },
      {
        position: 4,
        isCore: true,
        type: 'GRAMMAR' as const,
        promptData: {
          prompt: 'Viết câu hoàn chỉnh theo mẫu: Tôi thức dậy lúc bảy giờ.',
          sourceSentence: 'thức dậy lúc 7 giờ',
          targetPattern: 'I + wake up + at + seven',
        },
        gradingData: {
          acceptedAnswers: [
            'I wake up at seven.',
            'I wake up at 7.',
            'I wake up at seven',
            'I wake up at 7',
          ],
          caseSensitive: false,
        },
        feedbackData: {
          explanation: "Cấu trúc: 'I wake up at seven.'",
        },
      },
      {
        position: 5,
        isCore: true,
        type: 'MCQ' as const,
        promptData: {
          prompt: "Động từ nào sau đây có nghĩa là 'đi ngủ'?",
          options: [
            { id: 'opt-4-4', text: 'sleep' },
            { id: 'opt-4-5', text: 'work' },
            { id: 'opt-4-6', text: 'study' },
          ],
        },
        gradingData: { correctOptionId: 'opt-4-4' },
        feedbackData: {
          explanation: "'sleep' có nghĩa là ngủ.",
        },
      },
      {
        position: 6,
        isCore: true,
        type: 'FILL_BLANK' as const,
        promptData: {
          prompt: 'Điền từ vào câu: Cậu ấy đi học lúc tám giờ.',
          sentence: 'He goes to ____ at eight.',
        },
        gradingData: { acceptedAnswers: ['school'], caseSensitive: false },
        feedbackData: {
          explanation: "Cụm từ chuẩn: 'go to school' (đi học).",
        },
      },
    ],
  },

  // Lesson 5: Mấy giờ rồi? (What Time Is It?)
  {
    id: DEMO_A1_CONSTANTS.lesson5Id,
    unitId: DEMO_A1_CONSTANTS.unit2Id,
    position: 2,
    teacherKey: 'teacherA' as const,
    title: { vi: 'Mấy giờ rồi?', en: 'Lesson 5: What Time Is It?' },
    blocks: [
      headingBlock('l5-b1', 1, 2, 'Hỏi và nói về thời gian trong ngày'),
      textBlock('l5-b2', 2, [
        {
          text: "Biết cách hỏi giờ và nói giờ giúp bạn luôn đúng hẹn trong các buổi học, cuộc họp hay chuyến bay. Chúng ta sẽ làm quen với các mốc thời gian trong ngày và giới từ 'at' đi với thời gian.",
        },
      ]),
      vocabularyBlock('l5-b3', 3),
      grammarBlock(
        'l5-b4',
        4,
        'Cách hỏi và trả lời giờ giấc',
        "Hỏi giờ: 'What time is it?'. Trả lời giờ chẵn: 'It is + [Số giờ] + o'clock'. Giờ rưỡi: 'It is half past + [Số giờ]'. Khi nói một sự việc diễn ra vào lúc mấy giờ, dùng giới từ 'at': 'at eight o'clock'.",
        [
          { text: "What time is it? - It is eight o'clock.", translation: 'Mấy giờ rồi? - Tám giờ đúng.' },
          { text: 'The class starts at eight thirty.', translation: 'Lớp học bắt đầu lúc tám giờ ba mươi.' },
          { text: 'It is half past seven in the morning.', translation: 'Bây giờ là bảy rưỡi sáng.' },
        ]
      ),
      exampleBlock('l5-b5', 5, 'The class starts at eight thirty.', 'Lớp học bắt đầu vào lúc tám giờ ba mươi.'),
      dialogueBlock('l5-b6', 6, [
        { speaker: 'Nam', text: 'Excuse me, what time is it now?', translation: 'Xin lỗi, bây giờ là mấy giờ rồi?' },
        { speaker: 'David', text: 'It is half past seven. Are you going to school?', translation: 'Bảy rưỡi rồi. Bạn đang đi học à?' },
        { speaker: 'Nam', text: "Yes, our English class starts at eight o'clock.", translation: 'Đúng rồi, lớp tiếng Anh của chúng mình bắt đầu lúc tám giờ.' },
        { speaker: 'David', text: 'You are early today!', translation: 'Hôm nay bạn đi sớm đấy!' },
      ]),
      mediaBlock(
        'l5-b7',
        7,
        DEMO_A1_CONSTANTS.audioLesson5Url,
        'Luyện nghe: Thời gian biểu và thói quen hằng ngày'
      ),
      calloutBlock(
        'l5-b8',
        8,
        'tip',
        'Phân biệt các buổi trong ngày',
        "Dùng 'in the morning' (buổi sáng), 'in the afternoon' (buổi chiều), 'in the evening' (buổi tối), nhưng lưu ý dùng 'at night' (vào ban đêm)."
      ),
      dividerBlock('l5-b9', 9),
    ],
    vocabulary: [
      {
        position: 1,
        isCore: true,
        create: {
          canonicalForm: 'Morning',
          senseKey: 'time-morning',
          phonetic: 'ˈmɔːnɪŋ',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Buổi sáng', en: 'Morning' },
          example: 'I wake up early in the morning.',
        },
      },
      {
        position: 2,
        isCore: true,
        create: {
          canonicalForm: 'Afternoon',
          senseKey: 'time-afternoon',
          phonetic: 'ˌɑːftəˈnuːn',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Buổi chiều', en: 'Afternoon' },
          example: 'Good afternoon, everyone.',
        },
      },
      {
        position: 3,
        isCore: true,
        create: {
          canonicalForm: 'Evening',
          senseKey: 'time-evening',
          phonetic: 'ˈiːvnɪŋ',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Buổi tối', en: 'Evening' },
          example: 'I read books in the evening.',
        },
      },
      {
        position: 4,
        isCore: true,
        create: {
          canonicalForm: 'Night',
          senseKey: 'time-night',
          phonetic: 'naɪt',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Đêm', en: 'Night' },
          example: 'Good night, see you tomorrow.',
        },
      },
      {
        position: 5,
        isCore: true,
        create: {
          canonicalForm: "O'clock",
          senseKey: 'time-oclock',
          phonetic: 'əˈklɒk',
          partOfSpeech: 'adverb',
          meaningLabels: { vi: 'Đúng giờ (giờ chẵn)', en: "O'clock" },
          example: "It is seven o'clock.",
        },
      },
      {
        position: 6,
        isCore: true,
        create: {
          canonicalForm: 'Half past',
          senseKey: 'time-half-past',
          phonetic: 'hɑːf pɑːst',
          partOfSpeech: 'phrase',
          meaningLabels: { vi: 'Rưỡi, qua ba mươi phút', en: 'Half past' },
          example: 'It is half past eight.',
        },
      },
      {
        position: 7,
        isCore: true,
        create: {
          canonicalForm: 'Today',
          senseKey: 'present-day',
          phonetic: 'təˈdeɪ',
          partOfSpeech: 'adverb',
          meaningLabels: { vi: 'Hôm nay', en: 'Today' },
          example: 'Today is a sunny day.',
        },
      },
      {
        position: 8,
        isCore: true,
        create: {
          canonicalForm: 'Tomorrow',
          senseKey: 'next-day',
          phonetic: 'təˈmɒrəʊ',
          partOfSpeech: 'adverb',
          meaningLabels: { vi: 'Ngày mai', en: 'Tomorrow' },
          example: 'See you tomorrow at school.',
        },
      },
      {
        position: 9,
        isCore: true,
        create: {
          canonicalForm: 'Early',
          senseKey: 'time-early',
          phonetic: 'ˈɜːli',
          partOfSpeech: 'adjective',
          meaningLabels: { vi: 'Sớm', en: 'Early' },
          example: 'I wake up early today.',
        },
      },
      {
        position: 10,
        isCore: true,
        create: {
          canonicalForm: 'Late',
          senseKey: 'time-late',
          phonetic: 'leɪt',
          partOfSpeech: 'adjective',
          meaningLabels: { vi: 'Muộn, trễ', en: 'Late' },
          example: 'Do not be late for class.',
        },
      },
    ],
    exercises: [
      {
        position: 1,
        isCore: true,
        type: 'LISTENING' as const,
        promptData: {
          prompt: 'Nghe đoạn âm thanh và cho biết người nói thức dậy lúc mấy giờ?',
          audioUrl: DEMO_A1_CONSTANTS.audioLesson5Url,
          options: [
            { id: 'opt-5-1', text: 'At seven' },
            { id: 'opt-5-2', text: 'At eight' },
            { id: 'opt-5-3', text: 'At six' },
          ],
        },
        gradingData: {
          correctOptionId: 'opt-5-1',
          transcript: 'I wake up at seven o clock. I go to school at eight o clock.',
        },
        feedbackData: {
          explanation: "Người nói trong đoạn băng phát âm: 'I wake up at seven o clock. I go to school at eight o clock.'",
        },
      },
      {
        position: 2,
        isCore: true,
        type: 'MCQ' as const,
        promptData: {
          prompt: 'Câu nào dưới đây dùng đúng để hỏi giờ trong tiếng Anh?',
          options: [
            { id: 'opt-5-4', text: 'What time is it?' },
            { id: 'opt-5-5', text: 'Where are you?' },
            { id: 'opt-5-6', text: 'How are you?' },
          ],
        },
        gradingData: { correctOptionId: 'opt-5-4' },
        feedbackData: {
          explanation: "'What time is it?' là câu hỏi giờ thông dụng nhất.",
        },
      },
      {
        position: 3,
        isCore: true,
        type: 'FILL_BLANK' as const,
        promptData: {
          prompt: 'Điền giới từ chỉ mốc thời gian: Lớp học bắt đầu lúc tám rưỡi.',
          sentence: 'The class starts ____ eight thirty.',
        },
        gradingData: { acceptedAnswers: ['at'], caseSensitive: false },
        feedbackData: {
          explanation: "Đi với giờ giấc cụ thể, ta dùng giới từ 'at'.",
        },
      },
      {
        position: 4,
        isCore: true,
        type: 'REORDER' as const,
        promptData: {
          prompt: 'Sắp xếp các từ thành câu trả lời giờ:',
          tokens: [
            { id: 't5-1', text: 'It' },
            { id: 't5-2', text: 'is' },
            { id: 't5-3', text: 'eight' },
            { id: 't5-4', text: "o'clock." },
          ],
        },
        gradingData: { correctOrder: ['t5-1', 't5-2', 't5-3', 't5-4'] },
        feedbackData: {
          explanation: "'It is eight o'clock.' biểu đạt tám giờ đúng.",
        },
      },
      {
        position: 5,
        isCore: true,
        type: 'GRAMMAR' as const,
        promptData: {
          prompt: "Viết câu: 'Bây giờ là bảy rưỡi' theo cấu trúc:",
          sourceSentence: 'seven (7 giờ rưỡi)',
          targetPattern: 'It is + half past + Hour',
        },
        gradingData: {
          acceptedAnswers: [
            'It is half past seven.',
            "It's half past seven.",
            'It is half past seven',
            "It's half past seven",
          ],
          caseSensitive: false,
        },
        feedbackData: {
          explanation: "Cấu trúc: 'It is half past seven.'",
        },
      },
      {
        position: 6,
        isCore: true,
        type: 'MCQ' as const,
        promptData: {
          prompt: "Từ nào sau đây chỉ 'buổi chiều'?",
          options: [
            { id: 'opt-5-7', text: 'afternoon' },
            { id: 'opt-5-8', text: 'morning' },
            { id: 'opt-5-9', text: 'night' },
          ],
        },
        gradingData: { correctOptionId: 'opt-5-7' },
        feedbackData: {
          explanation: "'afternoon' là buổi chiều (từ sau 12h trưa đến chiều tối).",
        },
      },
    ],
  },

  // Lesson 6: Gia đình tôi (My Family)
  {
    id: DEMO_A1_CONSTANTS.lesson6Id,
    unitId: DEMO_A1_CONSTANTS.unit2Id,
    position: 3,
    teacherKey: 'teacherA' as const,
    title: { vi: 'Gia đình tôi', en: 'Lesson 6: My Family' },
    blocks: [
      headingBlock('l6-b1', 1, 2, 'Giới thiệu các thành viên trong gia đình'),
      textBlock('l6-b2', 2, [
        {
          text: "Gia đình là chủ đề quen thuộc và ấm áp trong giao tiếp. Chúng ta sẽ học từ vựng về các thành viên trong gia đình và các tính từ sở hữu như 'my', 'his', 'her'.",
        },
      ]),
      vocabularyBlock('l6-b3', 3),
      grammarBlock(
        'l6-b4',
        4,
        'Tính từ sở hữu: My, Your, His, Her',
        "Tính từ sở hữu đứng trước danh từ để chỉ sự sở hữu: 'my' (của tôi), 'your' (của bạn), 'his' (của anh ấy), 'her' (của cô ấy). Cấu trúc giới thiệu: 'This is my + [thành viên]. His/Her name is [tên]'.",
        [
          { text: 'This is my mother. Her name is Mary.', translation: 'Đây là mẹ tôi. Tên bà ấy là Mary.' },
          { text: 'I have one brother and one sister.', translation: 'Tôi có một người anh trai và một người chị gái.' },
        ]
      ),
      exampleBlock('l6-b5', 5, 'My parents are very kind and friendly.', 'Bố mẹ tôi rất tốt bụng và thân thiện.'),
      calloutBlock(
        'l6-b6',
        6,
        'info',
        'Đoạn văn đọc hiểu (Family Reading Profile)',
        'My name is David. I have a happy family in London. My father is a doctor. His name is John. My mother is a teacher. Her name is Mary. I have one brother and one sister. My brother is ten years old, and my sister is a university student. We love our family very much.'
      ),
      dialogueBlock('l6-b7', 7, [
        { speaker: 'Anna', text: 'Do you have a big family, David?', translation: 'Gia đình bạn có đông người không David?' },
        { speaker: 'David', text: 'Yes, I live with my parents, one brother, and one sister.', translation: 'Có, mình sống cùng bố mẹ, một người anh trai và một người chị gái.' },
        { speaker: 'Anna', text: 'What does your father do?', translation: 'Bố bạn làm nghề gì?' },
        { speaker: 'David', text: 'My father is a doctor at a hospital.', translation: 'Bố mình là bác sĩ ở một bệnh viện.' },
      ]),
      calloutBlock(
        'l6-b8',
        8,
        'tip',
        'Luyện nói (Speaking Practice Prompt)',
        "Hãy luyện nói to bằng tiếng Anh: Hãy giới thiệu 2 người thân trong gia đình bạn bằng cấu trúc: 'This is my [thành viên]. His/Her name is [tên]. He/She is [nghề nghiệp hoặc tuổi].'"
      ),
      dividerBlock('l6-b9', 9),
    ],
    vocabulary: [
      {
        position: 1,
        isCore: true,
        create: {
          canonicalForm: 'Family',
          senseKey: 'relatives-family',
          phonetic: 'ˈfæməli',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Gia đình', en: 'Family' },
          example: 'I love my family.',
        },
      },
      {
        position: 2,
        isCore: true,
        create: {
          canonicalForm: 'Mother',
          senseKey: 'parent-mother',
          phonetic: 'ˈmʌðər',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Mẹ', en: 'Mother' },
          example: 'My mother is a teacher.',
        },
      },
      {
        position: 3,
        isCore: true,
        create: {
          canonicalForm: 'Father',
          senseKey: 'parent-father',
          phonetic: 'ˈfɑːðər',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Bố, cha', en: 'Father' },
          example: 'My father is an engineer.',
        },
      },
      {
        position: 4,
        isCore: true,
        create: {
          canonicalForm: 'Parents',
          senseKey: 'father-mother',
          phonetic: 'ˈpeərənts',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Bố mẹ, cha mẹ', en: 'Parents' },
          example: 'My parents live in London.',
        },
      },
      {
        position: 5,
        isCore: true,
        create: {
          canonicalForm: 'Brother',
          senseKey: 'sibling-male',
          phonetic: 'ˈbrʌðər',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Anh/em trai', en: 'Brother' },
          example: 'I have one brother.',
        },
      },
      {
        position: 6,
        isCore: true,
        create: {
          canonicalForm: 'Sister',
          senseKey: 'sibling-female',
          phonetic: 'ˈsɪstər',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Chị/em gái', en: 'Sister' },
          example: 'My sister is a student.',
        },
      },
      {
        position: 7,
        isCore: true,
        create: {
          canonicalForm: 'Husband',
          senseKey: 'spouse-male',
          phonetic: 'ˈhʌzbənd',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Chồng', en: 'Husband' },
          example: 'Her husband is a doctor.',
        },
      },
      {
        position: 8,
        isCore: true,
        create: {
          canonicalForm: 'Wife',
          senseKey: 'spouse-female',
          phonetic: 'waɪf',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Vợ', en: 'Wife' },
          example: 'His wife is very kind.',
        },
      },
      {
        position: 9,
        isCore: true,
        create: {
          canonicalForm: 'Son',
          senseKey: 'offspring-male',
          phonetic: 'sʌn',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Con trai', en: 'Son' },
          example: 'They have a young son.',
        },
      },
      {
        position: 10,
        isCore: true,
        create: {
          canonicalForm: 'Daughter',
          senseKey: 'offspring-female',
          phonetic: 'ˈdɔːtər',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Con gái', en: 'Daughter' },
          example: 'Their daughter is five years old.',
        },
      },
      {
        position: 11,
        isCore: true,
        create: {
          canonicalForm: 'Friend',
          senseKey: 'companion',
          phonetic: 'frend',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Bạn bè', en: 'Friend' },
          example: 'Nam is my best friend.',
        },
      },
    ],
    exercises: [
      {
        position: 1,
        isCore: true,
        type: 'MCQ' as const,
        promptData: {
          prompt: 'Dựa vào đoạn văn đọc hiểu, bố của David làm nghề gì?',
          options: [
            { id: 'opt-6-1', text: 'Doctor (Bác sĩ)' },
            { id: 'opt-6-2', text: 'Teacher (Giáo viên)' },
            { id: 'opt-6-3', text: 'Student (Học sinh)' },
          ],
        },
        gradingData: { correctOptionId: 'opt-6-1' },
        feedbackData: {
          explanation: "Bài đọc có câu: 'My father is a doctor. His name is John.'",
        },
      },
      {
        position: 2,
        isCore: true,
        type: 'FILL_BLANK' as const,
        promptData: {
          prompt: 'Điền tính từ sở hữu: Đây là mẹ tôi. Tên của bà ấy là Mary.',
          sentence: 'This is my mother. ____ name is Mary.',
        },
        gradingData: { acceptedAnswers: ['Her', 'her'], caseSensitive: false },
        feedbackData: {
          explanation: "Tính từ sở hữu chỉ người nữ là 'Her'.",
        },
      },
      {
        position: 3,
        isCore: true,
        type: 'REORDER' as const,
        promptData: {
          prompt: 'Sắp xếp các từ thành câu giới thiệu gia đình:',
          tokens: [
            { id: 't6-1', text: 'This' },
            { id: 't6-2', text: 'is' },
            { id: 't6-3', text: 'my' },
            { id: 't6-4', text: 'happy' },
            { id: 't6-5', text: 'family.' },
          ],
        },
        gradingData: { correctOrder: ['t6-1', 't6-2', 't6-3', 't6-4', 't6-5'] },
        feedbackData: {
          explanation: "'This is my happy family.' là trật tự câu hoàn chỉnh.",
        },
      },
      {
        position: 4,
        isCore: true,
        type: 'GRAMMAR' as const,
        promptData: {
          prompt: "Viết câu: 'Đây là anh trai tôi' theo cấu trúc:",
          sourceSentence: 'brother (anh trai)',
          targetPattern: 'This is + my + FamilyMember',
        },
        gradingData: {
          acceptedAnswers: [
            'This is my brother.',
            'This is my brother',
          ],
          caseSensitive: false,
        },
        feedbackData: {
          explanation: "Cấu trúc: 'This is my brother.'",
        },
      },
      {
        position: 5,
        isCore: true,
        type: 'MCQ' as const,
        promptData: {
          prompt: "Từ 'parents' trong tiếng Anh có nghĩa là gì?",
          options: [
            { id: 'opt-6-4', text: 'Bố mẹ, cha mẹ' },
            { id: 'opt-6-5', text: 'Con cái' },
            { id: 'opt-6-6', text: 'Anh chị em' },
          ],
        },
        gradingData: { correctOptionId: 'opt-6-4' },
        feedbackData: {
          explanation: "'parents' nghĩa là bố mẹ (cha mẹ).",
        },
      },
      {
        position: 6,
        isCore: true,
        type: 'FILL_BLANK' as const,
        promptData: {
          prompt: 'Điền từ vào câu: Tôi có một người chị gái và một người anh trai.',
          sentence: 'I have one ____ and one brother.',
        },
        gradingData: { acceptedAnswers: ['sister'], caseSensitive: false },
        feedbackData: {
          explanation: "'sister' nghĩa là chị hoặc em gái.",
        },
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // UNIT 3: EVERYDAY SITUATIONS (Teacher B: Trần Thu Hà)
  // ---------------------------------------------------------------------------
  // Lesson 7: Gọi món (Ordering Food)
  {
    id: DEMO_A1_CONSTANTS.lesson7Id,
    unitId: DEMO_A1_CONSTANTS.unit3Id,
    position: 1,
    teacherKey: 'teacherB' as const,
    title: { vi: 'Gọi món', en: 'Lesson 7: Ordering Food' },
    blocks: [
      headingBlock('l7-b1', 1, 2, 'Gọi món và đồ uống tại nhà hàng'),
      textBlock('l7-b2', 2, [
        {
          text: 'Khi đi du lịch hoặc ăn uống tại nhà hàng nước ngoài, việc biết cách gọi món một cách lịch sự là kỹ năng vô cùng thiết thực. Bài học này sẽ trang bị cho bạn những mẫu câu thông dụng nhất.',
        },
      ]),
      vocabularyBlock('l7-b3', 3),
      grammarBlock(
        'l7-b4',
        4,
        "Mẫu câu gọi món lịch sự với 'I would like' và 'Can I have'",
        "Để gọi món một cách lịch sự, dùng 'I would like + [Món ăn/Đồ uống], please' (viết tắt là I'd like) hoặc 'Can I have + [Món ăn/Đồ uống], please?'. Hãy luôn nhớ thêm từ 'please' ở cuối câu.",
        [
          { text: 'I would like a cup of coffee, please.', translation: 'Làm ơn cho tôi một tách cà phê.' },
          { text: 'Can I have the menu, please?', translation: 'Làm ơn cho tôi xem thực đơn được không?' },
        ]
      ),
      exampleBlock('l7-b5', 5, 'Thank you very much. The food is delicious.', 'Cảm ơn bạn rất nhiều. Đồ ăn rất ngon.'),
      dialogueBlock('l7-b6', 6, [
        { speaker: 'Waiter', text: 'Good morning! Welcome to our cafe. Are you ready to order?', translation: 'Chào buổi sáng! Quý khách đã sẵn sàng gọi món chưa?' },
        { speaker: 'Customer', text: 'Yes, please. I would like a cup of hot tea and some bread.', translation: 'Vâng, làm ơn cho tôi một tách trà nóng và bánh mì.' },
        { speaker: 'Waiter', text: 'Would you like some water too?', translation: 'Quý khách có muốn dùng thêm nước lọc không?' },
        { speaker: 'Customer', text: 'Yes, a glass of water, please. Thank you.', translation: 'Vâng, cho tôi một ly nước. Cảm ơn bạn.' },
      ]),
      calloutBlock(
        'l7-b7',
        7,
        'tip',
        'Mẫu câu khi xin hóa đơn',
        "Khi dùng bữa xong, bạn có thể xin hóa đơn thanh toán bằng câu lịch sự: 'Could we have the bill, please?'."
      ),
      calloutBlock(
        'l7-b8',
        8,
        'tip',
        'Văn hóa ứng xử tại nhà hàng',
        "Nói 'Please' khi yêu cầu và 'Thank you' khi nhận đồ là thói quen giao tiếp lịch sự rất được coi trọng trong văn hóa các nước nói tiếng Anh."
      ),
      dividerBlock('l7-b9', 9),
    ],
    vocabulary: [
      {
        position: 1,
        isCore: true,
        create: {
          canonicalForm: 'Water',
          senseKey: 'drink-water',
          phonetic: 'ˈwɔːtər',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Nước uống', en: 'Water' },
          example: 'Can I have some water, please?',
        },
      },
      {
        position: 2,
        isCore: true,
        create: {
          canonicalForm: 'Coffee',
          senseKey: 'drink-coffee',
          phonetic: 'ˈkɒfi',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Cà phê', en: 'Coffee' },
          example: 'I drink coffee every morning.',
        },
      },
      {
        position: 3,
        isCore: true,
        create: {
          canonicalForm: 'Tea',
          senseKey: 'drink-tea',
          phonetic: 'tiː',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Trà', en: 'Tea' },
          example: 'Would you like hot tea?',
        },
      },
      {
        position: 4,
        isCore: true,
        create: {
          canonicalForm: 'Rice',
          senseKey: 'food-rice',
          phonetic: 'raɪs',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Cơm, gạo', en: 'Rice' },
          example: 'We eat rice every day.',
        },
      },
      {
        position: 5,
        isCore: true,
        create: {
          canonicalForm: 'Bread',
          senseKey: 'food-bread',
          phonetic: 'bred',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Bánh mì', en: 'Bread' },
          example: 'Bread and butter for breakfast.',
        },
      },
      {
        position: 6,
        isCore: true,
        create: {
          canonicalForm: 'Chicken',
          senseKey: 'food-chicken',
          phonetic: 'ˈtʃɪkɪn',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Thịt gà', en: 'Chicken' },
          example: 'I like fried chicken.',
        },
      },
      {
        position: 7,
        isCore: true,
        create: {
          canonicalForm: 'Menu',
          senseKey: 'restaurant-menu',
          phonetic: 'ˈmenjuː',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Thực đơn', en: 'Menu' },
          example: 'Can I have the menu, please?',
        },
      },
      {
        position: 8,
        isCore: true,
        create: {
          canonicalForm: 'Please',
          senseKey: 'polite-request',
          phonetic: 'pliːz',
          partOfSpeech: 'adverb',
          meaningLabels: { vi: 'Làm ơn, xin vui lòng', en: 'Please' },
          example: 'A cup of tea, please.',
        },
      },
      {
        position: 9,
        isCore: true,
        create: {
          canonicalForm: 'Thank you',
          senseKey: 'polite-gratitude',
          phonetic: 'ˈθæŋk juː',
          partOfSpeech: 'phrase',
          meaningLabels: { vi: 'Cảm ơn bạn', en: 'Thank you' },
          example: 'Thank you very much.',
        },
      },
      {
        position: 10,
        isCore: true,
        create: {
          canonicalForm: 'Want',
          senseKey: 'desire',
          phonetic: 'wɒnt',
          partOfSpeech: 'verb',
          meaningLabels: { vi: 'Muốn', en: 'To want' },
          example: 'I want a bottle of water.',
        },
      },
      {
        position: 11,
        isCore: true,
        create: {
          canonicalForm: 'Like',
          senseKey: 'preference',
          phonetic: 'laɪk',
          partOfSpeech: 'verb',
          meaningLabels: { vi: 'Thích', en: 'To like' },
          example: 'I like Vietnamese coffee.',
        },
      },
      {
        position: 12,
        isCore: true,
        create: {
          canonicalForm: 'Order',
          senseKey: 'restaurant-order',
          phonetic: 'ˈɔːdər',
          partOfSpeech: 'verb',
          meaningLabels: { vi: 'Gọi món / Đơn hàng', en: 'To order / Order' },
          example: 'Are you ready to order?',
        },
      },
    ],
    exercises: [
      {
        position: 1,
        isCore: true,
        type: 'MCQ' as const,
        promptData: {
          prompt: 'Khi muốn xin hóa đơn thanh toán tại quán ăn một cách lịch sự, câu nào sau đây là phù hợp nhất?',
          options: [
            { id: 'opt-7-1', text: 'Could we have the bill, please?' },
            { id: 'opt-7-2', text: 'Give me the bill now.' },
            { id: 'opt-7-3', text: 'I want to pay money.' },
          ],
        },
        gradingData: {
          correctOptionId: 'opt-7-1',
        },
        feedbackData: {
          explanation: "'Could we have the bill, please?' là mẫu câu lịch sự chuẩn mực để xin hóa đơn.",
        },
      },
      {
        position: 2,
        isCore: true,
        type: 'MCQ' as const,
        promptData: {
          prompt: 'Câu nào dưới đây là cách gọi cà phê lịch sự nhất?',
          options: [
            { id: 'opt-7-4', text: 'I would like a coffee, please.' },
            { id: 'opt-7-5', text: 'Give me coffee.' },
            { id: 'opt-7-6', text: 'Coffee now.' },
          ],
        },
        gradingData: { correctOptionId: 'opt-7-4' },
        feedbackData: {
          explanation: "Mẫu câu 'I would like + [món], please' là cách gọi món chuẩn mực và lịch sự.",
        },
      },
      {
        position: 3,
        isCore: true,
        type: 'FILL_BLANK' as const,
        promptData: {
          prompt: 'Điền từ xin thực đơn: Làm ơn cho tôi xem thực đơn.',
          sentence: 'Can I have the ____, please?',
        },
        gradingData: { acceptedAnswers: ['menu'], caseSensitive: false },
        feedbackData: {
          explanation: "'menu' có nghĩa là thực đơn trong nhà hàng.",
        },
      },
      {
        position: 4,
        isCore: true,
        type: 'REORDER' as const,
        promptData: {
          prompt: 'Sắp xếp các từ thành câu gọi trà:',
          tokens: [
            { id: 't7-1', text: 'I' },
            { id: 't7-2', text: 'would' },
            { id: 't7-3', text: 'like' },
            { id: 't7-4', text: 'some' },
            { id: 't7-5', text: 'tea.' },
          ],
        },
        gradingData: { correctOrder: ['t7-1', 't7-2', 't7-3', 't7-4', 't7-5'] },
        feedbackData: {
          explanation: "'I would like some tea.' có nghĩa là 'Cho tôi xin một chút trà.'",
        },
      },
      {
        position: 5,
        isCore: true,
        type: 'GRAMMAR' as const,
        promptData: {
          prompt: 'Viết câu yêu cầu một ly nước theo mẫu:',
          sourceSentence: 'water (nước uống)',
          targetPattern: 'Can I have + a glass of + water, please?',
        },
        gradingData: {
          acceptedAnswers: [
            'Can I have a glass of water, please?',
            'Can I have a glass of water, please',
            'Can I have a glass of water please',
          ],
          caseSensitive: false,
        },
        feedbackData: {
          explanation: "Cấu trúc: 'Can I have a glass of water, please?'",
        },
      },
      {
        position: 6,
        isCore: true,
        type: 'MCQ' as const,
        promptData: {
          prompt: "Từ 'chicken' trong thực đơn có nghĩa là gì?",
          options: [
            { id: 'opt-7-7', text: 'Thịt gà' },
            { id: 'opt-7-8', text: 'Thịt bò' },
            { id: 'opt-7-9', text: 'Cá' },
          ],
        },
        gradingData: { correctOptionId: 'opt-7-7' },
        feedbackData: {
          explanation: "'chicken' có nghĩa là thịt gà.",
        },
      },
    ],
  },

  // Lesson 8: Hỏi đường (Asking for Directions)
  {
    id: DEMO_A1_CONSTANTS.lesson8Id,
    unitId: DEMO_A1_CONSTANTS.unit3Id,
    position: 2,
    teacherKey: 'teacherB' as const,
    title: { vi: 'Hỏi đường', en: 'Lesson 8: Asking for Directions' },
    blocks: [
      headingBlock('l8-b1', 1, 2, 'Hỏi và chỉ đường trong thành phố'),
      textBlock('l8-b2', 2, [
        {
          text: 'Khi đặt chân đến một thành phố mới, việc biết cách hỏi đường đến các địa điểm như ngân hàng, nhà hàng hay trạm xe là rất cần thiết. Chúng ta sẽ cùng học các từ chỉ phương hướng cơ bản.',
        },
      ]),
      vocabularyBlock('l8-b3', 3),
      grammarBlock(
        'l8-b4',
        4,
        'Các mẫu câu chỉ đường cơ bản',
        "Mẫu câu mệnh lệnh chỉ đường: 'Go straight' (Đi thẳng), 'Turn left' (Rẽ trái), 'Turn right' (Rẽ phải). Khi nói về khoảng cách: 'It is near' (Nó ở gần) hoặc 'It is far' (Nó ở xa).",
        [
          { text: 'Go straight and turn left at the bank.', translation: 'Đi thẳng rồi rẽ trái ở ngân hàng.' },
          { text: 'The restaurant is near the school.', translation: 'Nhà hàng ở gần trường học.' },
        ]
      ),
      exampleBlock('l8-b5', 5, 'Excuse me, where is the nearest bus station?', 'Xin lỗi, trạm xe buýt gần nhất ở đâu vậy?'),
      dialogueBlock('l8-b6', 6, [
        { speaker: 'Tourist', text: 'Excuse me, where is the bank?', translation: 'Xin lỗi, ngân hàng ở đâu vậy ạ?' },
        { speaker: 'Local', text: 'Go straight on this street and turn right.', translation: 'Bạn đi thẳng trên con phố này rồi rẽ phải.' },
        { speaker: 'Tourist', text: 'Is it far from here?', translation: 'Nó có xa đây không?' },
        { speaker: 'Local', text: 'No, it is near. It is next to the restaurant.', translation: 'Không, gần lắm. Nó ở ngay cạnh nhà hàng.' },
        { speaker: 'Tourist', text: 'Thank you very much!', translation: 'Cảm ơn bạn rất nhiều!' },
      ]),
      mediaBlock(
        'l8-b7_media',
        7,
        DEMO_A1_CONSTANTS.audioLesson8Url,
        'Luyện nghe: Chỉ đường đến địa điểm trong thành phố'
      ),
      calloutBlock(
        'l8-b8',
        8,
        'info',
        'Mẹo hỏi đường lịch sự',
        "Hãy luôn bắt đầu câu hỏi đường bằng cụm từ 'Excuse me' (Xin lỗi / Làm phiền một chút) để thể hiện thái độ nhã nhặn và thu hút sự chú ý của người qua đường một cách lịch thiệp."
      ),
      dividerBlock('l8-b9', 9),
    ],
    vocabulary: [
      {
        position: 1,
        isCore: true,
        create: {
          canonicalForm: 'Left',
          senseKey: 'direction-left',
          phonetic: 'left',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Bên trái', en: 'Left' },
          example: 'Turn left at the bank.',
        },
      },
      {
        position: 2,
        isCore: true,
        create: {
          canonicalForm: 'Right',
          senseKey: 'direction-right',
          phonetic: 'raɪt',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Bên phải', en: 'Right' },
          example: 'Turn right at the street corner.',
        },
      },
      {
        position: 3,
        isCore: true,
        create: {
          canonicalForm: 'Straight',
          senseKey: 'direction-straight',
          phonetic: 'streɪt',
          partOfSpeech: 'adverb',
          meaningLabels: { vi: 'Thẳng', en: 'Straight' },
          example: 'Go straight ahead.',
        },
      },
      {
        position: 4,
        isCore: true,
        create: {
          canonicalForm: 'Near',
          senseKey: 'proximity-near',
          phonetic: 'nɪər',
          partOfSpeech: 'preposition',
          meaningLabels: { vi: 'Gần', en: 'Near' },
          example: 'The bank is near my house.',
        },
      },
      {
        position: 5,
        isCore: true,
        create: {
          canonicalForm: 'Far',
          senseKey: 'distance-far',
          phonetic: 'fɑːr',
          partOfSpeech: 'adjective',
          meaningLabels: { vi: 'Xa', en: 'Far' },
          example: 'Is the station far from here?',
        },
      },
      {
        position: 6,
        isCore: true,
        create: {
          canonicalForm: 'Street',
          senseKey: 'road',
          phonetic: 'striːt',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Đường phố', en: 'Street' },
          example: 'He lives on Tran Phu street.',
        },
      },
      {
        position: 7,
        isCore: true,
        create: {
          canonicalForm: 'Bank',
          senseKey: 'financial-bank',
          phonetic: 'bæŋk',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Ngân hàng', en: 'Bank' },
          example: 'Where is the nearest bank?',
        },
      },
      {
        position: 8,
        isCore: true,
        create: {
          canonicalForm: 'Restaurant',
          senseKey: 'dining-place',
          phonetic: 'ˈrestrɒnt',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Nhà hàng, quán ăn', en: 'Restaurant' },
          example: 'Let’s eat at this restaurant.',
        },
      },
      {
        position: 9,
        isCore: true,
        create: {
          canonicalForm: 'Station',
          senseKey: 'transit-station',
          phonetic: 'ˈsteɪʃn',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Nhà ga, trạm xe', en: 'Station' },
          example: 'The bus station is near.',
        },
      },
      {
        position: 10,
        isCore: true,
        create: {
          canonicalForm: 'Turn',
          senseKey: 'direction-turn',
          phonetic: 'tɜːn',
          partOfSpeech: 'verb',
          meaningLabels: { vi: 'Rẽ, quẹo', en: 'To turn' },
          example: 'Turn left here.',
        },
      },
    ],
    exercises: [
      {
        position: 1,
        isCore: true,
        type: 'LISTENING' as const,
        promptData: {
          prompt: 'Nghe đoạn âm thanh và cho biết người nói bảo rẽ hướng nào ở ngân hàng?',
          audioUrl: DEMO_A1_CONSTANTS.audioLesson8Url,
          options: [
            { id: 'opt-8-1', text: 'Turn left (Rẽ trái)' },
            { id: 'opt-8-2', text: 'Turn right (Rẽ phải)' },
            { id: 'opt-8-3', text: 'Go back (Quay lại)' },
          ],
        },
        gradingData: {
          correctOptionId: 'opt-8-1',
          transcript: 'Excuse me. Go straight and turn left at the bank.',
        },
        feedbackData: {
          explanation: "Người nói trong đoạn băng phát âm: 'Excuse me. Go straight and turn left at the bank.'",
        },
      },
      {
        position: 2,
        isCore: true,
        type: 'FILL_BLANK' as const,
        promptData: {
          prompt: 'Điền từ chỉ hướng rẽ phải: Rẽ phải ở hiệu sách.',
          sentence: 'Turn ____ at the bookstore.',
        },
        gradingData: { acceptedAnswers: ['right'], caseSensitive: false },
        feedbackData: {
          explanation: "'right' có nghĩa là bên phải ('Turn right' = rẽ phải).",
        },
      },
      {
        position: 3,
        isCore: true,
        type: 'REORDER' as const,
        promptData: {
          prompt: 'Sắp xếp các từ thành câu chỉ đường đi thẳng trên con phố này:',
          tokens: [
            { id: 't8-1', text: 'Go' },
            { id: 't8-2', text: 'straight' },
            { id: 't8-3', text: 'on' },
            { id: 't8-4', text: 'this' },
            { id: 't8-5', text: 'street.' },
          ],
        },
        gradingData: { correctOrder: ['t8-1', 't8-2', 't8-3', 't8-4', 't8-5'] },
        feedbackData: {
          explanation: "'Go straight on this street.' có nghĩa là 'Đi thẳng trên con đường này.'",
        },
      },
      {
        position: 4,
        isCore: true,
        type: 'GRAMMAR' as const,
        promptData: {
          prompt: 'Viết câu chỉ đường rẽ trái tại nhà ga:',
          sourceSentence: 'station (nhà ga)',
          targetPattern: 'Turn left + at + the station',
        },
        gradingData: {
          acceptedAnswers: [
            'Turn left at the station.',
            'Turn left at the station',
          ],
          caseSensitive: false,
        },
        feedbackData: {
          explanation: "Cấu trúc: 'Turn left at the station.'",
        },
      },
      {
        position: 5,
        isCore: true,
        type: 'MCQ' as const,
        promptData: {
          prompt: "Từ 'near' trong tiếng Anh có nghĩa là gì?",
          options: [
            { id: 'opt-8-4', text: 'Gần' },
            { id: 'opt-8-5', text: 'Xa' },
            { id: 'opt-8-6', text: 'Thẳng' },
          ],
        },
        gradingData: { correctOptionId: 'opt-8-4' },
        feedbackData: {
          explanation: "'near' có nghĩa là gần.",
        },
      },
      {
        position: 6,
        isCore: true,
        type: 'FILL_BLANK' as const,
        promptData: {
          prompt: 'Điền từ chỉ vị trí gần: Ngân hàng ở gần nhà hàng.',
          sentence: 'The bank is ____ the restaurant.',
        },
        gradingData: { acceptedAnswers: ['near'], caseSensitive: false },
        feedbackData: {
          explanation: "'near' nghĩa là ở gần.",
        },
      },
    ],
  },

  // Lesson 9: Một ngày ở Hà Nội (A Day in Hanoi)
  // Integrated review lesson! Teacher B authoring.
  {
    id: DEMO_A1_CONSTANTS.lesson9Id,
    unitId: DEMO_A1_CONSTANTS.unit3Id,
    position: 3,
    teacherKey: 'teacherB' as const,
    title: { vi: 'Một ngày ở Hà Nội', en: 'Lesson 9: A Day in Hanoi' },
    // Revision 1 blocks (before admin review comment)
    initialBlocks: [
      headingBlock('l9-b1', 1, 2, 'Một ngày trải nghiệm tại thủ đô Hà Nội'),
      textBlock('l9-b2', 2, [
        {
          text: 'Bài học này tổng hợp toàn bộ các kỹ năng giao tiếp bạn đã học từ bài 1 đến bài 8: từ chào hỏi, giới thiệu bản thân, hỏi tuổi, thời gian, mô tả thói quen đến gọi món ăn và hỏi đường đi dạo.',
        },
      ]),
      vocabularyBlock('l9-b3', 3),
      grammarBlock(
        'l9-b4',
        4,
        'Ôn tập các mẫu câu giao tiếp thường nhật',
        'Chúng ta ôn lại: Đại từ và Động từ to be (I am / You are), Thì hiện tại đơn (wake up, have breakfast, study, live), Cấu trúc gọi món (I would like...), và Chỉ đường (Go straight, turn left/right).',
        [
          { text: 'Hello! My name is Anna. I am from England and I live in Hanoi.', translation: 'Xin chào! Tôi là Anna. Tôi đến từ nước Anh và đang sống ở Hà Nội.' },
        ]
      ),
      dialogueBlock('l9-b5', 5, [
        { speaker: 'Anna', text: 'Good morning Nam! Nice to see you today.', translation: 'Chào buổi sáng Nam! Rất vui được gặp bạn hôm nay.' },
        { speaker: 'Nam', text: 'Good morning Anna! What would you like to do first?', translation: 'Chào buổi sáng Anna! Bạn muốn làm gì trước tiên?' },
        { speaker: 'Anna', text: 'I would like to visit Hoan Kiem lake and have coffee, please.', translation: 'Mình muốn đi thăm hồ Hoàn Kiếm và uống cà phê.' },
        { speaker: 'Nam', text: "Great! Let's go straight and turn left at the street corner.", translation: 'Tuyệt vời! Chúng ta hãy đi thẳng rồi rẽ trái ở góc phố nhé.' },
      ]),
      calloutBlock(
        'l9-b6',
        6,
        'info',
        'Bài đọc tổng hợp (Comprehensive A1 Reading: 165 từ)',
        'Today is a beautiful Sunday in Hanoi. Anna wakes up early at seven o’clock in the morning. She gets up and prepares for her exciting day. At seven thirty, Anna walks to a small traditional restaurant near her apartment on Tran Phu street. She orders a warm bowl of Pho and a cup of hot green tea for breakfast. The food is very fresh and delicious. At eight thirty, she meets her Vietnamese friend, Nam, near the bank. Nam says: “Good morning Anna! Nice to meet you today. Are you ready to explore the city?”. Anna smiles and replies: “Good morning Nam! Yes, I would like to see Hoan Kiem lake and drink Vietnamese coffee.” Nam guides her: “We just need to go straight on this street and turn left at the station. The lake is very near.” In the afternoon, they walk around the historic lake and enjoy the peaceful atmosphere. Anna loves Hanoi very much.'
      ),
      dividerBlock('l9-b7', 7),
    ],
    // Revision 2 blocks (adds example block after admin review comment: "Phần hướng dẫn bài tổng hợp cần có thêm ví dụ trước khi xuất bản.")
    revisedBlocks: [
      headingBlock('l9-b1', 1, 2, 'Một ngày trải nghiệm tại thủ đô Hà Nội'),
      textBlock('l9-b2', 2, [
        {
          text: 'Bài học này tổng hợp toàn bộ các kỹ năng giao tiếp bạn đã học từ bài 1 đến bài 8: từ chào hỏi, giới thiệu bản thân, hỏi tuổi, thời gian, mô tả thói quen đến gọi món ăn và hỏi đường đi dạo.',
        },
      ]),
      vocabularyBlock('l9-b3', 3),
      grammarBlock(
        'l9-b4',
        4,
        'Ôn tập các mẫu câu giao tiếp thường nhật',
        'Chúng ta ôn lại: Đại từ và Động từ to be (I am / You are), Thì hiện tại đơn (wake up, have breakfast, study, live), Cấu trúc gọi món (I would like...), và Chỉ đường (Go straight, turn left/right).',
        [
          { text: 'Hello! My name is Anna. I am from England and I live in Hanoi.', translation: 'Xin chào! Tôi là Anna. Tôi đến từ nước Anh và đang sống ở Hà Nội.' },
          { text: 'I would like a cup of Vietnamese coffee, please.', translation: 'Làm ơn cho tôi một tách cà phê Việt Nam.' },
        ]
      ),
      exampleBlock('l9-b5', 5, 'Excuse me, where is the lake? - Go straight and turn left.', 'Xin lỗi, hồ ở đâu vậy? - Đi thẳng rồi rẽ trái.'),
      calloutBlock(
        'l9-b6',
        6,
        'info',
        'Bài đọc tổng hợp (Comprehensive A1 Reading: 165 từ)',
        'Today is a beautiful Sunday in Hanoi. Anna wakes up early at seven o’clock in the morning. She gets up and prepares for her exciting day. At seven thirty, Anna walks to a small traditional restaurant near her apartment on Tran Phu street. She orders a warm bowl of Pho and a cup of hot green tea for breakfast. The food is very fresh and delicious. At eight thirty, she meets her Vietnamese friend, Nam, near the bank. Nam says: “Good morning Anna! Nice to meet you today. Are you ready to explore the city?”. Anna smiles and replies: “Good morning Nam! Yes, I would like to see Hoan Kiem lake and drink Vietnamese coffee.” Nam guides her: “We just need to go straight on this street and turn left at the station. The lake is very near.” In the afternoon, they walk around the historic lake and enjoy the peaceful atmosphere. Anna loves Hanoi very much.'
      ),
      dialogueBlock('l9-b7', 7, [
        { speaker: 'Anna', text: 'Good morning Nam! Nice to see you today.', translation: 'Chào buổi sáng Nam! Rất vui được gặp bạn hôm nay.' },
        { speaker: 'Nam', text: 'Good morning Anna! What would you like to do first?', translation: 'Chào buổi sáng Anna! Bạn muốn làm gì trước tiên?' },
        { speaker: 'Anna', text: 'I would like to visit Hoan Kiem lake and have coffee, please.', translation: 'Mình muốn đi thăm hồ Hoàn Kiếm và uống cà phê.' },
        { speaker: 'Nam', text: "Great! Let's go straight and turn left at the street corner.", translation: 'Tuyệt vời! Chúng ta hãy đi thẳng rồi rẽ trái ở góc phố nhé.' },
      ]),
      calloutBlock(
        'l9-b8',
        8,
        'tip',
        'Thực hành phản xạ (Review Practice Prompt)',
        'Hãy thử tóm tắt lại ngày của Anna bằng 3 câu đơn giản: 1. Anna thức dậy lúc mấy giờ? 2. Cô ấy ăn gì cho bữa sáng? 3. Cô ấy và Nam đi đâu vào buổi chiều?'
      ),
      dividerBlock('l9-b9', 9),
    ],
    // Vocabulary for Lesson 9 reuses core concepts
    vocabulary: [
      {
        position: 1,
        isCore: true,
        create: {
          canonicalForm: 'Hello',
          senseKey: 'greeting',
          phonetic: 'həˈləʊ',
          partOfSpeech: 'interjection',
          meaningLabels: { vi: 'Xin chào', en: 'Hello' },
          example: 'Hello Hanoi!',
        },
      },
      {
        position: 2,
        isCore: true,
        create: {
          canonicalForm: 'Vietnam',
          senseKey: 'country-vietnam',
          phonetic: 'ˌvjɛtˈnɑːm',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Việt Nam', en: 'Vietnam' },
          example: 'Anna is living in Vietnam.',
        },
      },
      {
        position: 3,
        isCore: true,
        create: {
          canonicalForm: 'Morning',
          senseKey: 'time-morning',
          phonetic: 'ˈmɔːnɪŋ',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Buổi sáng', en: 'Morning' },
          example: 'Good morning everyone.',
        },
      },
      {
        position: 4,
        isCore: true,
        create: {
          canonicalForm: 'Breakfast',
          senseKey: 'morning-meal',
          phonetic: 'ˈbrekfəst',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Bữa sáng', en: 'Breakfast' },
          example: 'Anna has breakfast on Tran Phu street.',
        },
      },
      {
        position: 5,
        isCore: true,
        create: {
          canonicalForm: 'Coffee',
          senseKey: 'drink-coffee',
          phonetic: 'ˈkɒfi',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Cà phê', en: 'Coffee' },
          example: 'I like Vietnamese coffee.',
        },
      },
      {
        position: 6,
        isCore: true,
        create: {
          canonicalForm: 'Street',
          senseKey: 'road',
          phonetic: 'striːt',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Đường phố', en: 'Street' },
          example: 'Tran Phu street is very lively.',
        },
      },
      {
        position: 7,
        isCore: true,
        create: {
          canonicalForm: 'Bank',
          senseKey: 'financial-bank',
          phonetic: 'bæŋk',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Ngân hàng', en: 'Bank' },
          example: 'Anna meets Nam near the bank.',
        },
      },
      {
        position: 8,
        isCore: true,
        create: {
          canonicalForm: 'Straight',
          senseKey: 'direction-straight',
          phonetic: 'streɪt',
          partOfSpeech: 'adverb',
          meaningLabels: { vi: 'Thẳng', en: 'Straight' },
          example: 'Go straight to the lake.',
        },
      },
      {
        position: 9,
        isCore: true,
        create: {
          canonicalForm: 'Friend',
          senseKey: 'companion',
          phonetic: 'frend',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Bạn bè', en: 'Friend' },
          example: 'Nam is Anna’s Vietnamese friend.',
        },
      },
      {
        position: 10,
        isCore: true,
        create: {
          canonicalForm: 'Meet',
          senseKey: 'social-meet',
          phonetic: 'miːt',
          partOfSpeech: 'verb',
          meaningLabels: { vi: 'Gặp, làm quen', en: 'To meet' },
          example: 'Nice to meet you today.',
        },
      },
    ],
    // Exercises: 8 items for Lesson 9!
    exercises: [
      {
        position: 1,
        isCore: true,
        type: 'MCQ' as const,
        promptData: {
          prompt: 'Dựa vào bài đọc tổng hợp, Anna ăn gì cho bữa sáng ở Hà Nội?',
          options: [
            { id: 'opt-9-1', text: 'Pho and hot green tea' },
            { id: 'opt-9-2', text: 'Bread and butter' },
            { id: 'opt-9-3', text: 'Rice and chicken' },
          ],
        },
        gradingData: { correctOptionId: 'opt-9-1' },
        feedbackData: {
          explanation: "Bài đọc nêu rõ: 'She orders a warm bowl of Pho and a cup of hot green tea for breakfast.'",
        },
      },
      {
        position: 2,
        isCore: true,
        type: 'MCQ' as const,
        promptData: {
          prompt: 'Anna và Nam đi đâu vào buổi chiều?',
          options: [
            { id: 'opt-9-4', text: 'Hoan Kiem lake' },
            { id: 'opt-9-5', text: 'The airport' },
            { id: 'opt-9-6', text: 'The bank' },
          ],
        },
        gradingData: { correctOptionId: 'opt-9-4' },
        feedbackData: {
          explanation: "Trong bài đọc: 'In the afternoon, they walk around the historic lake and enjoy the peaceful atmosphere.'",
        },
      },
      {
        position: 3,
        isCore: true,
        type: 'FILL_BLANK' as const,
        promptData: {
          prompt: 'Điền từ chào hỏi khi gặp bạn: Rất vui được gặp bạn hôm nay!',
          sentence: 'Nice to ____ you today!',
        },
        gradingData: { acceptedAnswers: ['meet', 'see'], caseSensitive: false },
        feedbackData: {
          explanation: "'Nice to meet you' hoặc 'Nice to see you' là lời chào vui mừng khi gặp bạn bè.",
        },
      },
      {
        position: 4,
        isCore: true,
        type: 'FILL_BLANK' as const,
        promptData: {
          prompt: 'Điền giới từ thức dậy: Anna wakes ____ at seven o’clock.',
          sentence: 'Anna wakes ____ at seven o’clock.',
        },
        gradingData: { acceptedAnswers: ['up'], caseSensitive: false },
        feedbackData: {
          explanation: "Cụm động từ thức giấc là 'wake up'.",
        },
      },
      {
        position: 5,
        isCore: true,
        type: 'REORDER' as const,
        promptData: {
          prompt: 'Sắp xếp câu hỏi quê quán quen thuộc:',
          tokens: [
            { id: 't9-1', text: 'Where' },
            { id: 't9-2', text: 'are' },
            { id: 't9-3', text: 'you' },
            { id: 't9-4', text: 'from?' },
          ],
        },
        gradingData: { correctOrder: ['t9-1', 't9-2', 't9-3', 't9-4'] },
        feedbackData: {
          explanation: "'Where are you from?' là câu hỏi quê quán.",
        },
      },
      {
        position: 6,
        isCore: true,
        type: 'REORDER' as const,
        promptData: {
          prompt: 'Sắp xếp câu gọi cà phê lịch sự:',
          tokens: [
            { id: 't9-5', text: 'I' },
            { id: 't9-6', text: 'would' },
            { id: 't9-7', text: 'like' },
            { id: 't9-8', text: 'a' },
            { id: 't9-9', text: 'coffee,' },
            { id: 't9-10', text: 'please.' },
          ],
        },
        gradingData: { correctOrder: ['t9-5', 't9-6', 't9-7', 't9-8', 't9-9', 't9-10'] },
        feedbackData: {
          explanation: "'I would like a coffee, please.' là cách gọi đồ uống lịch sự.",
        },
      },
      {
        position: 7,
        isCore: true,
        type: 'GRAMMAR' as const,
        promptData: {
          prompt: 'Viết câu giới thiệu bạn đến từ nước Anh:',
          sourceSentence: 'England (nước Anh)',
          targetPattern: 'Subject + To Be + From + Country',
        },
        gradingData: {
          acceptedAnswers: [
            'I am from England.',
            "I'm from England.",
            'I am from England',
            "I'm from England",
          ],
          caseSensitive: false,
        },
        feedbackData: {
          explanation: "Cấu trúc: 'I am from England.'",
        },
      },
      {
        position: 8,
        isCore: true,
        type: 'GRAMMAR' as const,
        promptData: {
          prompt: "Viết câu chỉ đường: 'Đi thẳng rồi rẽ trái':",
          sourceSentence: 'chỉ đường',
          targetPattern: 'Go straight and + turn left',
        },
        gradingData: {
          acceptedAnswers: [
            'Go straight and turn left.',
            'Go straight and turn left',
            'go straight and turn left.',
          ],
          caseSensitive: false,
        },
        feedbackData: {
          explanation: "Cấu trúc chỉ đường: 'Go straight and turn left.'",
        },
      },
    ],
  },
];

/**
 * Main idempotent provisioner for the complete Demo English A1 Course.
 */
async function resolveVocabularyInput(
  prisma: any,
  languageId: string,
  vocabList: any[]
): Promise<any[]> {
  const resolved = [];
  for (const item of vocabList) {
    if (item.create) {
      const norm = item.create.canonicalForm.normalize('NFC').trim().toLowerCase();
      const sense = item.create.senseKey.trim();
      const existingConcept = await prisma.vocabularyConcept.findFirst({
        where: {
          languageId,
          normalizedForm: norm,
          senseKey: sense,
        },
      });
      if (existingConcept) {
        resolved.push({
          vocabularyId: existingConcept.id,
          position: item.position,
          isCore: item.isCore ?? true,
        });
        continue;
      }
    }
    resolved.push(item);
  }
  return resolved;
}

export const DEMO_LESSONS_SPEC = DEMO_LESSONS_DATA;

export async function assertCurriculumSafe(
  prisma: PrismaClient,
  actors: DemoActorIds = { adminId: '5650336e-550c-413d-b2a8-4afa2e4d9160', teacherAId: DEMO_A1_CONSTANTS.teacherAId, teacherBId: DEMO_A1_CONSTANTS.teacherBId }
): Promise<void> {
  const courseId = DEMO_A1_CONSTANTS.courseId;
  const existingCourse = await prisma.course.findUnique({ where: { id: courseId } });
  if (existingCourse) {
    const existingNames = existingCourse.names as Record<string, string> | null;
    if (
      existingCourse.languageId !== DEMO_COURSE_SPEC.languageId ||
      existingCourse.frameworkId !== DEMO_COURSE_SPEC.frameworkId ||
      existingCourse.defaultStartLevelId !== DEMO_COURSE_SPEC.defaultStartLevelId ||
      (!existingNames || existingNames.vi !== DEMO_COURSE_SPEC.names.vi || existingNames.en !== DEMO_COURSE_SPEC.names.en)
    ) {
      throw new CurriculumCollisionError(
        `CURRICULUM COLLISION: Course ${courseId} exists with mismatched metadata (languageId: ${existingCourse.languageId}, frameworkId: ${existingCourse.frameworkId}). Refusing to overwrite.`
      );
    }
  }

  for (const u of DEMO_UNITS_SPEC) {
    const existingById = await prisma.unit.findUnique({ where: { id: u.id } });
    if (existingById) {
      const existingNames = existingById.names as Record<string, string> | null;
      if (
        existingById.courseId !== courseId ||
        existingById.position !== u.position ||
        existingById.levelId !== u.levelId ||
        existingById.code !== u.code ||
        (!existingNames || existingNames.vi !== u.names.vi || existingNames.en !== u.names.en)
      ) {
        throw new CurriculumCollisionError(
          `CURRICULUM COLLISION: Unit ${u.id} exists with mismatched metadata (course: ${existingById.courseId}, position: ${existingById.position}, code: ${existingById.code}). Refusing to overwrite.`
        );
      }
    }

    const existingByPosition = await prisma.unit.findFirst({
      where: {
        courseId,
        levelId: u.levelId,
        position: u.position,
      },
    });
    if (existingByPosition && existingByPosition.id !== u.id) {
      throw new CurriculumCollisionError(
        `CURRICULUM COLLISION: Unit at position ${u.position} in course ${courseId} already exists with different ID ${existingByPosition.id} (expected ${u.id}). Refusing to overwrite.`
      );
    }
  }

  // Preflight check for existing lessons: ensure isRequired is true and ordering matches
  for (const lDef of DEMO_LESSONS_DATA) {
    const existingLesson = await prisma.lesson.findFirst({
      where: {
        unitId: lDef.unitId,
        position: lDef.position,
      },
      include: { assignment: true, revisions: true },
    });
    const teacherId = lDef.teacherKey === 'teacherA' ? actors.teacherAId : actors.teacherBId;
    if (existingLesson && (
      !existingLesson.assignment || existingLesson.assignment.currentTeacherId !== teacherId ||
      existingLesson.assignment.createdBy !== actors.adminId ||
      existingLesson.revisions.some(revision => {
        const title = revision.title as Record<string, string> | null;
        return revision.createdBy !== teacherId || !title ||
          title.vi !== lDef.title.vi || title.en !== lDef.title.en;
      })
    )) {
      throw new CurriculumCollisionError(`Lesson ${existingLesson.id} has unrelated assignment or revision metadata.`);
    }
    if (existingLesson && existingLesson.isRequired !== true) {
      throw new CurriculumCollisionError(
        `CURRICULUM COLLISION: Lesson at unit ${lDef.unitId} position ${lDef.position} exists with isRequired=false (fixture expects true). Refusing to overwrite.`
      );
    }
  }
}

export async function checkDemoA1FullIntegrity(
  prisma: PrismaClient
): Promise<{ isComplete: boolean; reason?: string; stats?: any }> {
  const courseId = DEMO_A1_CONSTANTS.courseId;
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      units: {
        orderBy: { position: 'asc' },
        include: {
          lessons: {
            orderBy: { position: 'asc' },
            include: {
              activeRevision: {
                include: {
                  vocabularyLinks: true,
                  exercises: {
                    include: {
                      itemRevision: {
                        include: { gradingSecret: true },
                      },
                    },
                  },
                },
              },
              revisions: {
                orderBy: { revisionNo: 'asc' },
                include: {
                  reviewComments: true,
                  reviews: true,
                },
              },
              assignment: {
                include: { currentTeacher: true, history: true },
              },
            },
          },
        },
      },
    },
  });

  if (!course) return { isComplete: false, reason: 'Course not found' };
  if (course.id !== courseId) return { isComplete: false, reason: `Course ID mismatch (${course.id} vs ${courseId})` };
  if (!course.isActive) return { isComplete: false, reason: 'Course is not active' };
  if (course.units.length !== 3) return { isComplete: false, reason: `Expected 3 units, got ${course.units.length}` };

  const totalLessons = course.units.reduce((acc, u) => acc + u.lessons.length, 0);
  if (totalLessons !== 9) return { isComplete: false, reason: `Expected 9 lessons, got ${totalLessons}` };

  for (let uIdx = 0; uIdx < course.units.length; uIdx++) {
    const unit = course.units[uIdx];
    const expectedUnitSpec = DEMO_UNITS_SPEC[uIdx];
    if (unit.position !== uIdx + 1) {
      return { isComplete: false, reason: `Unit at index ${uIdx} has position ${unit.position} (expected ${uIdx + 1})` };
    }
    if (unit.id !== expectedUnitSpec.id) {
      return { isComplete: false, reason: `Unit at position ${unit.position} has ID ${unit.id} (expected ${expectedUnitSpec.id})` };
    }
    if (unit.code !== expectedUnitSpec.code) {
      return { isComplete: false, reason: `Unit at position ${unit.position} has code ${unit.code} (expected ${expectedUnitSpec.code})` };
    }
    if (unit.lessons.length !== 3) {
      return { isComplete: false, reason: `Unit ${unit.position} has ${unit.lessons.length} lessons (expected 3)` };
    }
    for (let lIdx = 0; lIdx < unit.lessons.length; lIdx++) {
      const l = unit.lessons[lIdx];
      if (l.position !== lIdx + 1) {
        return { isComplete: false, reason: `Unit ${unit.position} lesson at index ${lIdx} has position ${l.position} (expected ${lIdx + 1})` };
      }
      if (l.isRequired !== true) {
        return { isComplete: false, reason: `Lesson ${l.id} (Unit ${unit.position}, Lesson ${l.position}) isRequired is ${l.isRequired} (expected true)` };
      }
      if (l.availability !== 'AVAILABLE') return { isComplete: false, reason: `Lesson ${l.id} availability is not AVAILABLE` };
      if (!l.activeRevisionId) return { isComplete: false, reason: `Lesson ${l.id} has no activeRevisionId` };
      if (l.activeRevision?.status !== 'PUBLISHED') return { isComplete: false, reason: `Lesson ${l.id} activeRevision is not PUBLISHED` };
      if (!l.assignment?.currentTeacherId) return { isComplete: false, reason: `Lesson ${l.id} is unassigned` };
      if (unit.position <= 2 && l.assignment.currentTeacherId !== DEMO_A1_CONSTANTS.teacherAId) {
        return { isComplete: false, reason: `Unit ${unit.position} Lesson ${l.position} not assigned to Teacher A` };
      }
      if (unit.position === 3 && l.assignment.currentTeacherId !== DEMO_A1_CONSTANTS.teacherBId) {
        return { isComplete: false, reason: `Unit 3 Lesson ${l.position} not assigned to Teacher B` };
      }
    }
  }

  // Check Lesson 9 multi-revision cycle & review provenance
  const unit3 = course.units[2];
  const lesson9 = unit3.lessons[2];
  if (lesson9.revisions.length < 2) {
    return { isComplete: false, reason: `Lesson 9 has ${lesson9.revisions.length} revisions (expected at least 2)` };
  }
  const rev1 = lesson9.revisions.find(r => r.revisionNo === 1);
  const rev2 = lesson9.revisions.find(r => r.revisionNo === 2);
  if (!rev1 || rev1.status !== 'CHANGES_REQUESTED') {
    return { isComplete: false, reason: `Lesson 9 Rev 1 status is not CHANGES_REQUESTED (${rev1?.status})` };
  }
  if (!rev2 || rev2.status !== 'PUBLISHED') {
    return { isComplete: false, reason: `Lesson 9 Rev 2 status is not PUBLISHED (${rev2?.status})` };
  }
  if (lesson9.activeRevisionId !== rev2.id) {
    return { isComplete: false, reason: `Lesson 9 activeRevisionId is not Rev 2 (${lesson9.activeRevisionId} vs ${rev2.id})` };
  }
  if (rev1.reviewComments.length === 0) {
    return { isComplete: false, reason: 'Lesson 9 Rev 1 has no review comments' };
  }

  // Check review action provenance
  const rev1Actions = new Set(rev1.reviews.map(r => r.action));
  if (!rev1Actions.has('SUBMIT') || !rev1Actions.has('REQUEST_CHANGES')) {
    return { isComplete: false, reason: 'Lesson 9 Rev 1 missing SUBMIT or REQUEST_CHANGES reviews' };
  }
  const rev2Actions = new Set(rev2.reviews.map(r => r.action));
  if (!rev2Actions.has('SUBMIT') || !rev2Actions.has('APPROVE') || !rev2Actions.has('PUBLISH')) {
    return { isComplete: false, reason: 'Lesson 9 Rev 2 missing SUBMIT, APPROVE, or PUBLISH reviews' };
  }

  // Count exercises and breakdown by type
  let totalExercises = 0;
  let totalListening = 0;
  let totalMcq = 0;
  let totalFillBlank = 0;
  let totalReorder = 0;
  let totalGrammar = 0;
  let totalVocabLinks = 0;

  for (const u of course.units) {
    for (const l of u.lessons) {
      totalVocabLinks += l.activeRevision?.vocabularyLinks.length || 0;
      for (const ex of l.activeRevision?.exercises || []) {
        totalExercises++;
        const type = ex.itemRevision?.type;
        if (type === 'LISTENING') totalListening++;
        else if (type === 'MCQ') totalMcq++;
        else if (type === 'FILL_BLANK') totalFillBlank++;
        else if (type === 'REORDER') totalReorder++;
        else if (type === 'GRAMMAR') totalGrammar++;
      }
    }
  }

  if (totalExercises !== 56) {
    return { isComplete: false, reason: `Total exercises is ${totalExercises} (expected 56)` };
  }
  if (totalListening !== 3) {
    return { isComplete: false, reason: `Total listening exercises is ${totalListening} (expected 3)` };
  }
  if (totalMcq !== 18) {
    return { isComplete: false, reason: `Total MCQ exercises is ${totalMcq} (expected 18)` };
  }
  if (totalFillBlank !== 14) {
    return { isComplete: false, reason: `Total FILL_BLANK exercises is ${totalFillBlank} (expected 14)` };
  }
  if (totalReorder !== 11) {
    return { isComplete: false, reason: `Total REORDER exercises is ${totalReorder} (expected 11)` };
  }
  if (totalGrammar !== 10) {
    return { isComplete: false, reason: `Total GRAMMAR exercises is ${totalGrammar} (expected 10)` };
  }
  if (totalVocabLinks < 88) {
    return { isComplete: false, reason: `Total vocab links is ${totalVocabLinks} (expected >= 88)` };
  }

  // Audio refs & leak check
  const l3 = course.units[0].lessons[2];
  const l5 = course.units[1].lessons[1];
  const l7 = course.units[2].lessons[0];
  const l8 = course.units[2].lessons[1];

  const l3Listening = l3.activeRevision?.exercises.find(e => e.itemRevision?.type === 'LISTENING');
  if (!l3Listening || (l3Listening.itemRevision?.promptData as { audioUrl?: string } | null)?.audioUrl !== DEMO_A1_CONSTANTS.audioLesson3Url) {
    return { isComplete: false, reason: 'Lesson 3 listening exercise audioUrl mismatch' };
  }

  const l5Listening = l5.activeRevision?.exercises.find(e => e.itemRevision?.type === 'LISTENING');
  if (!l5Listening || (l5Listening.itemRevision?.promptData as { audioUrl?: string } | null)?.audioUrl !== DEMO_A1_CONSTANTS.audioLesson5Url) {
    return { isComplete: false, reason: 'Lesson 5 listening exercise audioUrl mismatch' };
  }

  const l8Listening = l8.activeRevision?.exercises.find(e => e.itemRevision?.type === 'LISTENING');
  if (!l8Listening || (l8Listening.itemRevision?.promptData as { audioUrl?: string } | null)?.audioUrl !== DEMO_A1_CONSTANTS.audioLesson8Url) {
    return { isComplete: false, reason: 'Lesson 8 listening exercise audioUrl mismatch' };
  }

  // Lesson 7 must NOT have listening exercise or audio
  const l7Listening = l7.activeRevision?.exercises.find(e => e.itemRevision?.type === 'LISTENING');
  if (l7Listening) {
    return { isComplete: false, reason: 'Lesson 7 must not have listening exercise' };
  }

  return {
    isComplete: true,
    stats: {
      totalUnits: 3,
      totalLessons: 9,
      totalRevisions: course.units.reduce((acc, u) => acc + u.lessons.reduce((lacc, l) => lacc + l.revisions.length, 0), 0),
      totalExercises,
      totalVocabLinks,
      totalListening,
    },
  };
}

export async function provisionDemoA1Course(
  prisma: PrismaClient,
  actors: DemoActorIds,
  options?: {
    stopBeforeLesson9RequestChanges?: boolean;
  }
): Promise<DemoA1Result> {
  const courseId = DEMO_A1_CONSTANTS.courseId;

  // 0. Safety assertions
  await assertCurriculumSafe(prisma, actors);

  // 1. Verify English language exists
  const langEn = await prisma.language.findUnique({
    where: { id: DEMO_COURSE_SPEC.languageId },
  });
  if (!langEn || !langEn.isLearnable) {
    throw new Error(`Demo course requires learnable English language (${DEMO_COURSE_SPEC.languageId}).`);
  }

  // 2. Verify CEFR framework & A1 level exist
  const framework = await prisma.framework.findUnique({
    where: { id: DEMO_COURSE_SPEC.frameworkId },
  });
  if (!framework) {
    throw new Error(`Demo course requires CEFR framework (${DEMO_COURSE_SPEC.frameworkId}).`);
  }

  const levelA1 = await prisma.level.findUnique({
    where: { id: DEMO_COURSE_SPEC.defaultStartLevelId },
  });
  if (!levelA1) {
    throw new Error(`Demo course requires A1 level (${DEMO_COURSE_SPEC.defaultStartLevelId}).`);
  }

  // 3. Verify Actors exist and are active
  const adminAccount = await prisma.account.findUnique({
    where: { id: actors.adminId },
    select: { id: true, role: true, status: true },
  });
  if (!adminAccount || adminAccount.role !== 'ADMIN' || adminAccount.status !== 'ACTIVE') {
    throw new Error(`Demo course requires active ADMIN account: ${actors.adminId}`);
  }

  const teacherA = await prisma.account.findUnique({
    where: { id: actors.teacherAId },
    select: { id: true, role: true, status: true },
  });
  if (!teacherA || teacherA.role !== 'TEACHER' || teacherA.status !== 'ACTIVE') {
    throw new Error(`Demo course requires active TEACHER account for Teacher A: ${actors.teacherAId}`);
  }

  const teacherB = await prisma.account.findUnique({
    where: { id: actors.teacherBId },
    select: { id: true, role: true, status: true },
  });
  if (!teacherB || teacherB.role !== 'TEACHER' || teacherB.status !== 'ACTIVE') {
    throw new Error(`Demo course requires active TEACHER account for Teacher B: ${actors.teacherBId}`);
  }

  const teacherMap = {
    teacherA: actors.teacherAId,
    teacherB: actors.teacherBId,
  };

  // 4. Ensure Course exists
  let course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    course = await prisma.course.create({
      data: {
        id: DEMO_COURSE_SPEC.id,
        languageId: DEMO_COURSE_SPEC.languageId,
        frameworkId: DEMO_COURSE_SPEC.frameworkId,
        defaultStartLevelId: DEMO_COURSE_SPEC.defaultStartLevelId,
        names: DEMO_COURSE_SPEC.names,
        isActive: DEMO_COURSE_SPEC.isActive,
        curriculumGeneration: 1n,
        coverageCatalogGeneration: 1n,
        gateConfig: {},
        practiceConfig: {},
        coverageCatalog: {},
      },
    });
    console.log(`[demo-a1] Created Course: ${course.id} (${DEMO_COURSE_SPEC.names.vi})`);
  } else {
    if (!course.isActive) {
      await prisma.course.update({
        where: { id: course.id },
        data: { isActive: true },
      });
    }
    console.log(`[demo-a1] Verified Course: ${course.id}`);
  }

  // 5. Ensure Units 1, 2, 3 exist
  for (const u of DEMO_UNITS_SPEC) {
    await prisma.unit.upsert({
      where: {
        courseId_levelId_position: {
          courseId: u.courseId,
          levelId: u.levelId,
          position: u.position,
        },
      },
      update: {
        names: u.names,
      },
      create: {
        id: u.id,
        courseId: u.courseId,
        levelId: u.levelId,
        code: u.code,
        position: u.position,
        names: u.names,
      },
    });
    console.log(`[demo-a1] Verified Unit ${u.position}: ${u.id} (${u.names.vi})`);
  }

  // 6. Check existing lessons to determine if already provisioned
  const existingLessons = await prisma.lesson.findMany({
    where: {
      unit: { courseId },
    },
    include: {
      activeRevision: {
        include: {
          exercises: true,
          vocabularyLinks: true,
        },
      },
      revisions: true,
    },
  });

  const integrity = await checkDemoA1FullIntegrity(prisma);
  if (integrity.isComplete) {
    console.log('[demo-a1] All curriculum, provenance, exercises, vocabulary, and audio checks PASS. Idempotent check PASS.');
    const totalVocabLinks = existingLessons.reduce((acc, l) => acc + (l.activeRevision?.vocabularyLinks.length || 0), 0);
    const totalExercises = existingLessons.reduce((acc, l) => acc + (l.activeRevision?.exercises.length || 0), 0);
    const uniqueVocab = await prisma.vocabularyConcept.count({
      where: { languageId: DEMO_COURSE_SPEC.languageId },
    });
    const reviewComments = await prisma.revisionReviewComment.count({
      where: { lessonRevision: { lesson: { unit: { courseId } } } },
    });
    const totalRevisions = await prisma.lessonRevision.count({
      where: { lesson: { unit: { courseId } } },
    });

    return {
      alreadyProvisioned: true,
      courseId,
      courseName: DEMO_COURSE_SPEC.names.vi,
      unitIds: DEMO_UNITS_SPEC.map((u) => u.id),
      lessonIds: existingLessons.map((l) => l.id),
      counts: {
        courses: 1,
        units: 3,
        lessons: 9,
        activePublishedRevisions: 9,
        totalRevisions,
        vocabularyConcepts: uniqueVocab,
        vocabularyLinks: totalVocabLinks,
        exercises: totalExercises,
        listeningItems: 3,
        reviewComments,
      },
    };
  }

  // 7. Provision each lesson step-by-step
  for (const lessonDef of DEMO_LESSONS_DATA) {
    const teacherId = teacherMap[lessonDef.teacherKey];
    console.log(`[demo-a1] Provisioning Lesson ${lessonDef.position} (${lessonDef.title.vi}) in Unit ${lessonDef.unitId}...`);

    // Check if this lesson already exists in unit
    let lesson = await prisma.lesson.findFirst({
      where: {
        unitId: lessonDef.unitId,
        position: lessonDef.position,
      },
      include: {
        assignment: {
          include: { history: true },
        },
        revisions: { orderBy: { revisionNo: 'desc' } },
        activeRevision: true,
      },
    });

    if (lesson?.availability === 'AVAILABLE' && lesson.activeRevisionId && lesson.activeRevision?.status === 'PUBLISHED') {
      if (lesson.isRequired !== true) {
        console.log(`[demo-a1] Lesson ${lesson.id} isRequired is false. Updating to true...`);
        await prisma.lesson.update({
          where: { id: lesson.id },
          data: { isRequired: true },
        });
      }
      console.log(`[demo-a1] Lesson ${lessonDef.id} is already published. Skipping.`);
      continue;
    }

    // Step A: Create lesson if absent
    if (!lesson) {
      const createRes = await createLesson(
        actors.adminId,
        courseId,
        lessonDef.unitId,
        {
          position: lessonDef.position,
          isRequired: true,
        },
        prisma
      );
      if (createRes.status !== 201 || !createRes.data?.data) {
        throw new Error(`Failed to create lesson ${lessonDef.id}: ${JSON.stringify(createRes)}`);
      }
      lesson = await prisma.lesson.findUniqueOrThrow({
        where: { id: createRes.data.data.id },
        include: {
          assignment: { include: { history: true } },
          revisions: { orderBy: { revisionNo: 'desc' } },
          activeRevision: true,
        },
      });
      console.log(`[demo-a1] Created planned lesson ${lesson.id}`);
    }

    // Step B: Assign lesson if not assigned
    if (!lesson.assignment) {
      const assignRes = await assignLesson(
        actors.adminId,
        courseId,
        lessonDef.unitId,
        lesson.id,
        {
          teacherId,
          expectedRowVersion: lesson.rowVersion.toString(),
        },
        prisma
      );
      if (assignRes.status !== 200) {
        throw new Error(`Failed to assign lesson ${lesson.id}: ${JSON.stringify(assignRes)}`);
      }
      lesson = await prisma.lesson.findUniqueOrThrow({
        where: { id: lesson.id },
        include: {
          assignment: { include: { history: true } },
          revisions: { orderBy: { revisionNo: 'desc' } },
          activeRevision: true,
        },
      });
      console.log(`[demo-a1] Assigned lesson ${lesson.id} to teacher ${teacherId}`);
    }

    // Handle Lesson 9 with realistic review comment workflow
    if ((lessonDef.id === DEMO_A1_CONSTANTS.lesson9Id || (lessonDef.position === 3 && lessonDef.unitId === DEMO_UNITS_SPEC[2].id)) && 'revisedBlocks' in lessonDef) {
      const resolvedVocab = await resolveVocabularyInput(prisma, DEMO_COURSE_SPEC.languageId, lessonDef.vocabulary);

      const lesson9WithRevs = await prisma.lesson.findUniqueOrThrow({
        where: { id: lesson.id },
        include: { revisions: { orderBy: { revisionNo: 'asc' } } },
      });
      const rev1 = lesson9WithRevs.revisions.find(r => r.revisionNo === 1);
      const rev2 = lesson9WithRevs.revisions.find(r => r.revisionNo === 2);

      let rev1Id = rev1?.id;
      let rev1RowVersion: string | bigint | undefined = rev1?.rowVersion;

      // 1. Save Revision 1 (Teacher B) if not created yet
      if (!rev1) {
        console.log(`[demo-a1] Lesson 9: Saving Revision 1 by Teacher B...`);
        const lessonBeforeDraft1 = await prisma.lesson.findUniqueOrThrow({ where: { id: lesson.id } });
        const draft1Res = await saveTeacherLessonDraft(
          teacherId,
          lesson.id,
          {
            title: lessonDef.title,
            blocks: lessonDef.initialBlocks,
            vocabulary: resolvedVocab,
            exercises: lessonDef.exercises,
            expectedRevisionId: null,
            expectedRowVersion: lessonBeforeDraft1.rowVersion.toString(),
          },
          prisma
        );
        if (draft1Res.status !== 200 || !draft1Res.data?.data?.highestRevision) {
          throw new Error(`Failed to save draft 1 for lesson 9: ${JSON.stringify(draft1Res)}`);
        }
        const createdRev1 = draft1Res.data.data.highestRevision;
        rev1Id = createdRev1.id;
        rev1RowVersion = createdRev1.rowVersion;
      }

      // 2. Submit Revision 1 (Teacher B) if still in DRAFT
      const rev1Fresh = await prisma.lessonRevision.findUniqueOrThrow({ where: { id: rev1Id! } });
      if (rev1Fresh.status === 'DRAFT') {
        console.log(`[demo-a1] Lesson 9: Submitting Revision 1...`);
        const lessonBeforeSubmit1 = await prisma.lesson.findUniqueOrThrow({ where: { id: lesson.id } });
        const submit1Res = await submitTeacherLesson(
          teacherId,
          lesson.id,
          {
            revisionId: rev1Id!,
            expectedLessonRowVersion: lessonBeforeSubmit1.rowVersion.toString(),
            expectedRevisionRowVersion: rev1Fresh.rowVersion.toString(),
          },
          prisma
        );
        if (submit1Res.status !== 200 || !submit1Res.data?.submissionId) {
          throw new Error(`Failed to submit revision 1 for lesson 9: ${JSON.stringify(submit1Res)}`);
        }
      }

      // 3. Admin creates review comment and requests changes on Revision 1 if IN_REVIEW
      const rev1AfterSubmit = await prisma.lessonRevision.findUniqueOrThrow({ where: { id: rev1Id! } });
      if (rev1AfterSubmit.status === 'IN_REVIEW') {
        const sub1 = await prisma.revisionReview.findFirstOrThrow({
          where: { lessonRevisionId: rev1Id!, action: 'SUBMIT' },
          orderBy: { occurredAt: 'desc' },
        });

        const commentBody = 'Phần hướng dẫn bài tổng hợp cần có thêm ví dụ trước khi xuất bản.';
        const existingComment = await prisma.revisionReviewComment.findFirst({
          where: {
            lessonRevisionId: rev1Id!,
            body: commentBody,
          },
        });
        if (!existingComment) {
          console.log(`[demo-a1] Lesson 9: Admin adding review comment...`);
          const commentRes = await createReviewComment(
            actors.adminId,
            rev1Id!,
            {
              body: commentBody,
            },
            prisma,
            lesson.id
          );
          if (commentRes.status !== 201) {
            throw new Error(`Failed to create review comment for lesson 9: ${JSON.stringify(commentRes)}`);
          }
        }

        if (options?.stopBeforeLesson9RequestChanges) {
          console.log(`[demo-a1] SIMULATION CHECKPOINT: Interrupted after Admin comment, STOP before requestChanges.`);
          return {
            alreadyProvisioned: false,
            courseId,
            courseName: DEMO_COURSE_SPEC.names.vi,
            unitIds: DEMO_UNITS_SPEC.map((u) => u.id),
            lessonIds: [],
            counts: {
              courses: 1,
              units: 3,
              lessons: 8,
              activePublishedRevisions: 8,
              totalRevisions: 9,
              vocabularyConcepts: 80,
              vocabularyLinks: 80,
              exercises: 50,
              listeningItems: 3,
              reviewComments: 1,
            },
          };
        }

        console.log(`[demo-a1] Lesson 9: Admin requesting changes...`);
        const freshRev1ForChanges = await prisma.lessonRevision.findUniqueOrThrow({ where: { id: rev1Id! } });
        const reqChangesRes = await requestChangesReview(
          actors.adminId,
          sub1.id,
          {
            expectedRevisionRowVersion: freshRev1ForChanges.rowVersion.toString(),
            comment: commentBody,
          },
          prisma
        );
        if (reqChangesRes.status !== 200) {
          throw new Error(`Failed to request changes for lesson 9: ${JSON.stringify(reqChangesRes)}`);
        }
      }

      // 4. Teacher B saves Revision 2 with additional example
      let rev2Id = rev2?.id;
      let rev2RowVersion: string | bigint | undefined = rev2?.rowVersion;

      if (!rev2) {
        console.log(`[demo-a1] Lesson 9: Teacher B updating draft to create Revision 2...`);
        const lessonBeforeDraft2 = await prisma.lesson.findUniqueOrThrow({ where: { id: lesson.id } });
        const draft2Res = await saveTeacherLessonDraft(
          teacherId,
          lesson.id,
          {
            title: lessonDef.title,
            blocks: lessonDef.revisedBlocks,
            vocabulary: resolvedVocab,
            exercises: lessonDef.exercises,
            expectedRevisionId: rev1Id!,
            expectedRowVersion: lessonBeforeDraft2.rowVersion.toString(),
          },
          prisma
        );
        if (draft2Res.status !== 200 || !draft2Res.data?.data?.highestRevision) {
          throw new Error(`Failed to save draft 2 for lesson 9: ${JSON.stringify(draft2Res)}`);
        }
        const createdRev2 = draft2Res.data.data.highestRevision;
        rev2Id = createdRev2.id;
        rev2RowVersion = createdRev2.rowVersion;
      }

      // 5. Teacher B submits Revision 2 if DRAFT
      const rev2Fresh = await prisma.lessonRevision.findUniqueOrThrow({ where: { id: rev2Id! } });
      if (rev2Fresh.status === 'DRAFT') {
        console.log(`[demo-a1] Lesson 9: Submitting Revision 2...`);
        const lessonBeforeSubmit2 = await prisma.lesson.findUniqueOrThrow({ where: { id: lesson.id } });
        const submit2Res = await submitTeacherLesson(
          teacherId,
          lesson.id,
          {
            revisionId: rev2Id!,
            expectedLessonRowVersion: lessonBeforeSubmit2.rowVersion.toString(),
            expectedRevisionRowVersion: rev2Fresh.rowVersion.toString(),
          },
          prisma
        );
        if (submit2Res.status !== 200 || !submit2Res.data?.submissionId) {
          throw new Error(`Failed to submit revision 2 for lesson 9: ${JSON.stringify(submit2Res)}`);
        }
      }

      const sub2 = await prisma.revisionReview.findFirstOrThrow({
        where: { lessonRevisionId: rev2Id!, action: 'SUBMIT' },
        orderBy: { occurredAt: 'desc' },
      });

      // 6. Admin approves Revision 2 if IN_REVIEW
      const rev2AfterSubmit = await prisma.lessonRevision.findUniqueOrThrow({ where: { id: rev2Id! } });
      if (rev2AfterSubmit.status === 'IN_REVIEW') {
        console.log(`[demo-a1] Lesson 9: Admin approving Revision 2...`);
        const approveRes = await approveReview(
          actors.adminId,
          sub2.id,
          {
            expectedRevisionRowVersion: rev2AfterSubmit.rowVersion.toString(),
          },
          prisma
        );
        if (approveRes.status !== 200) {
          throw new Error(`Failed to approve revision 2 for lesson 9: ${JSON.stringify(approveRes)}`);
        }
      }

      // 7. Admin publishes Revision 2 if APPROVED
      const rev2AfterApprove = await prisma.lessonRevision.findUniqueOrThrow({ where: { id: rev2Id! } });
      if (rev2AfterApprove.status === 'APPROVED') {
        console.log(`[demo-a1] Lesson 9: Admin publishing Revision 2 (makeAvailable: true)...`);
        const lessonBeforePublish = await prisma.lesson.findUniqueOrThrow({ where: { id: lesson.id } });
        const publishRes = await publishReview(
          actors.adminId,
          sub2.id,
          {
            expectedRevisionRowVersion: rev2AfterApprove.rowVersion.toString(),
            expectedLessonRowVersion: lessonBeforePublish.rowVersion.toString(),
            makeAvailable: true,
          },
          prisma
        );
        if (publishRes.status !== 200) {
          throw new Error(`Failed to publish revision 2 for lesson 9: ${JSON.stringify(publishRes)}`);
        }
      }
      console.log(`[demo-a1] Lesson 9 published successfully with 2 revisions and review comments!`);
    } else {
      // Lessons 1-8 standard flow: Draft -> Submit -> Approve -> Publish
      const resolvedVocab = await resolveVocabularyInput(prisma, DEMO_COURSE_SPEC.languageId, lessonDef.vocabulary);
      const existingLessonWithRevs = await prisma.lesson.findUniqueOrThrow({
        where: { id: lesson.id },
        include: {
          revisions: { orderBy: { revisionNo: 'desc' }, take: 1 },
        },
      });
      const highestRev = existingLessonWithRevs.revisions[0] || null;

      let revisionId: string;
      let revRowVersion: string | bigint;

      if (!highestRev) {
        // 1. Save draft
        const lessonBeforeDraft = await prisma.lesson.findUniqueOrThrow({ where: { id: lesson.id } });
        const draftRes = await saveTeacherLessonDraft(
          teacherId,
          lesson.id,
          {
            title: lessonDef.title,
            blocks: lessonDef.blocks,
            vocabulary: resolvedVocab,
            exercises: lessonDef.exercises,
            expectedRevisionId: null,
            expectedRowVersion: lessonBeforeDraft.rowVersion.toString(),
          },
          prisma
        );
        if (draftRes.status !== 200 || !draftRes.data?.data?.highestRevision) {
          throw new Error(`Failed to save draft for lesson ${lesson.id}: ${JSON.stringify(draftRes)}`);
        }
        const rev = draftRes.data.data.highestRevision;
        revisionId = rev.id;
        if (rev.rowVersion == null) throw new Error(`Revision missing rowVersion`);
        revRowVersion = rev.rowVersion;
      } else if (highestRev.status === 'DRAFT') {
        // Update existing draft
        const lessonBeforeDraft = await prisma.lesson.findUniqueOrThrow({ where: { id: lesson.id } });
        const draftRes = await saveTeacherLessonDraft(
          teacherId,
          lesson.id,
          {
            title: lessonDef.title,
            blocks: lessonDef.blocks,
            vocabulary: resolvedVocab,
            exercises: lessonDef.exercises,
            expectedRevisionId: highestRev.id,
            expectedRowVersion: lessonBeforeDraft.rowVersion.toString(),
          },
          prisma
        );
        if (draftRes.status !== 200 || !draftRes.data?.data?.highestRevision) {
          throw new Error(`Failed to update draft for lesson ${lesson.id}: ${JSON.stringify(draftRes)}`);
        }
        const rev = draftRes.data.data.highestRevision;
        revisionId = rev.id;
        if (rev.rowVersion == null) throw new Error(`Revision missing rowVersion`);
        revRowVersion = rev.rowVersion;
      } else {
        revisionId = highestRev.id;
        revRowVersion = highestRev.rowVersion;
      }

      // 2. Submit draft (if in DRAFT status)
      let submissionId: string;
      const revBeforeSubmit = await prisma.lessonRevision.findUniqueOrThrow({ where: { id: revisionId } });
      if (revBeforeSubmit.status === 'DRAFT') {
        const lessonBeforeSubmit = await prisma.lesson.findUniqueOrThrow({ where: { id: lesson.id } });
        const submitRes = await submitTeacherLesson(
          teacherId,
          lesson.id,
          {
            revisionId,
            expectedLessonRowVersion: lessonBeforeSubmit.rowVersion.toString(),
            expectedRevisionRowVersion: revBeforeSubmit.rowVersion.toString(),
          },
          prisma
        );
        if (submitRes.status !== 200 || !submitRes.data?.submissionId) {
          throw new Error(`Failed to submit lesson ${lesson.id}: ${JSON.stringify(submitRes)}`);
        }
        submissionId = submitRes.data.submissionId;
      } else {
        const latestReview = await prisma.revisionReview.findFirstOrThrow({
          where: { lessonRevisionId: revisionId, action: 'SUBMIT' },
          orderBy: { occurredAt: 'desc' },
        });
        submissionId = latestReview.id;
      }

      // 3. Approve draft (if in IN_REVIEW status)
      const revAfterSubmit = await prisma.lessonRevision.findUniqueOrThrow({ where: { id: revisionId } });
      if (revAfterSubmit.status === 'IN_REVIEW') {
        const approveRes = await approveReview(
          actors.adminId,
          submissionId,
          {
            expectedRevisionRowVersion: revAfterSubmit.rowVersion.toString(),
          },
          prisma
        );
        if (approveRes.status !== 200) {
          throw new Error(`Failed to approve lesson ${lesson.id}: ${JSON.stringify(approveRes)}`);
        }
      }

      // 4. Publish draft (if in APPROVED status)
      const revAfterApprove = await prisma.lessonRevision.findUniqueOrThrow({ where: { id: revisionId } });
      if (revAfterApprove.status === 'APPROVED') {
        const lessonBeforePublish = await prisma.lesson.findUniqueOrThrow({ where: { id: lesson.id } });
        const publishRes = await publishReview(
          actors.adminId,
          submissionId,
          {
            expectedRevisionRowVersion: revAfterApprove.rowVersion.toString(),
            expectedLessonRowVersion: lessonBeforePublish.rowVersion.toString(),
            makeAvailable: true,
          },
          prisma
        );
        if (publishRes.status !== 200) {
          throw new Error(`Failed to publish lesson ${lesson.id}: ${JSON.stringify(publishRes)}`);
        }
      }
      console.log(`[demo-a1] Lesson ${lessonDef.position} published successfully!`);
    }
  }

  // 8. Gather final counts
  const finalLessons = await prisma.lesson.findMany({
    where: { unit: { courseId } },
    include: {
      activeRevision: {
        include: {
          exercises: true,
          vocabularyLinks: true,
        },
      },
      revisions: true,
    },
  });

  const totalVocabLinks = finalLessons.reduce((acc, l) => acc + (l.activeRevision?.vocabularyLinks.length || 0), 0);
  const totalExercises = finalLessons.reduce((acc, l) => acc + (l.activeRevision?.exercises.length || 0), 0);
  const uniqueVocab = await prisma.vocabularyConcept.count({
    where: { languageId: DEMO_COURSE_SPEC.languageId },
  });
  const reviewComments = await prisma.revisionReviewComment.count({
    where: { lessonRevision: { lesson: { unit: { courseId } } } },
  });
  const totalRevisions = await prisma.lessonRevision.count({
    where: { lesson: { unit: { courseId } } },
  });

  return {
    alreadyProvisioned: false,
    courseId,
    courseName: DEMO_COURSE_SPEC.names.vi,
    unitIds: DEMO_UNITS_SPEC.map((u) => u.id),
    lessonIds: finalLessons.map((l) => l.id),
    counts: {
      courses: 1,
      units: 3,
      lessons: 9,
      activePublishedRevisions: finalLessons.filter((l) => l.activeRevision?.status === 'PUBLISHED').length,
      totalRevisions,
      vocabularyConcepts: uniqueVocab,
      vocabularyLinks: totalVocabLinks,
      exercises: totalExercises,
      listeningItems: 3,
      reviewComments,
    },
  };
}
