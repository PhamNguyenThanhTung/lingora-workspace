import type { PrismaClient } from '../../../generated/product-client/index.js';
import {
  createLesson,
  assignLesson,
  saveTeacherLessonDraft,
  submitTeacherLesson,
  approveReview,
  publishReview,
  activateLesson,
} from '../lessons/index.ts';
import { canonicalJsonStringify } from '../lessons/content.ts';

export interface SampleActorIds {
  adminId: string;
  teacherId: string;
}

export interface SampleA1Result {
  alreadyProvisioned: boolean;
  courseId: string;
  unitId: string;
  lessonIds: string[];
}

export const SAMPLE_A1_CONSTANTS = {
  courseId: '00000000-0000-0000-0000-000000000030',
  unitId: '00000000-0000-0000-0000-000000000040',
  lesson1Id: '00000000-0000-0000-0000-000000000050',
  lesson2Id: '00000000-0000-0000-0000-000000000051',
  lesson3Id: '00000000-0000-0000-0000-000000000052',
};

const SAMPLE_LESSONS_DATA = [
  {
    id: SAMPLE_A1_CONSTANTS.lesson1Id,
    position: 1,
    title: { vi: 'Bài 1: Chào hỏi cơ bản', en: 'Lesson 1: Basic Greetings' },
    contentBlocks: [
      {
        type: 'paragraph',
        text: 'Chào hỏi là bước đầu tiên và quan trọng nhất khi giao tiếp bằng tiếng Anh. Trong tiếng Anh, có nhiều cách chào hỏi khác nhau tùy theo mức độ thân mật và thời gian trong ngày.',
      },
      {
        type: 'paragraph',
        text: "Các lời chào phổ biến nhất bao gồm: 'Hello' (thông dụng nhất), 'Hi' (thân mật), 'Good morning' (chào buổi sáng), 'Good afternoon' (chào buổi chiều), và 'Good evening' (chào buổi tối).",
      },
      {
        type: 'paragraph',
        text: "Khi tạm biệt, chúng ta thường dùng 'Goodbye' hoặc 'See you later'. Khi gặp ai đó lần đầu tiên, câu chào lịch sự thường là 'Nice to meet you'.",
      },
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
          meaningLabels: { vi: 'Xin chào', en: 'Greeting' },
          example: 'Hello, my name is John.',
        },
      },
      {
        position: 2,
        isCore: true,
        create: {
          canonicalForm: 'Morning',
          senseKey: 'time-of-day',
          phonetic: 'ˈmɔː.nɪŋ',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Buổi sáng', en: 'The early part of the day' },
          example: 'Good morning, how are you?',
        },
      },
      {
        position: 3,
        isCore: true,
        create: {
          canonicalForm: 'Goodbye',
          senseKey: 'farewell',
          phonetic: 'ɡʊdˈbaɪ',
          partOfSpeech: 'interjection',
          meaningLabels: { vi: 'Tạm biệt', en: 'Farewell' },
          example: 'Goodbye, see you tomorrow.',
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
          explanation: "'Good morning' có nghĩa là chào buổi sáng, được dùng từ lúc thức dậy đến khoảng 12 giờ trưa.",
        },
      },
      {
        position: 2,
        isCore: true,
        type: 'FILL_BLANK' as const,
        promptData: {
          prompt: 'Điền từ còn thiếu vào câu chào lịch sự khi lần đầu gặp mặt:',
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
          prompt: 'Sắp xếp các từ sau thành câu hỏi thăm sức khỏe thông dụng:',
          tokens: [
            { id: 't1', text: 'How' },
            { id: 't2', text: 'are' },
            { id: 't3', text: 'you?' },
          ],
        },
        gradingData: { correctOrder: ['t1', 't2', 't3'] },
        feedbackData: {
          explanation: "'How are you?' là câu hỏi 'Bạn có khỏe không?' theo đúng trật tự từ trong tiếng Anh.",
        },
      },
    ],
  },
  {
    id: SAMPLE_A1_CONSTANTS.lesson2Id,
    position: 2,
    title: { vi: 'Bài 2: Giới thiệu bản thân', en: 'Lesson 2: Self Introductions' },
    contentBlocks: [
      {
        type: 'paragraph',
        text: "Sau lời chào, việc giới thiệu bản thân giúp mọi người hiểu nhau hơn. Cấu trúc cơ bản nhất để nói tên là: 'My name is [Tên]' hoặc 'I am [Tên]'.",
      },
      {
        type: 'paragraph',
        text: "Để nói về quốc gia hoặc nơi mình đến, chúng ta dùng cấu trúc 'I come from [Quốc gia]' hoặc 'I am from [Quốc gia]'. Ví dụ: 'I am from Vietnam'.",
      },
      {
        type: 'paragraph',
        text: "Khi nói về nghề nghiệp, chú ý dùng mạo từ 'a' hoặc 'an' trước danh từ số ít chỉ nghề nghiệp. Ví dụ: 'I am a student' hoặc 'I am an engineer'.",
      },
    ],
    vocabulary: [
      {
        position: 1,
        isCore: true,
        create: {
          canonicalForm: 'Name',
          senseKey: 'identity',
          phonetic: 'neɪm',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Tên', en: 'A word by which a person is known' },
          example: 'What is your name?',
        },
      },
      {
        position: 2,
        isCore: true,
        create: {
          canonicalForm: 'Student',
          senseKey: 'occupation-learner',
          phonetic: 'ˈstjuː.dənt',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Học sinh, sinh viên', en: 'A person who is studying' },
          example: 'She is a student at university.',
        },
      },
      {
        position: 3,
        isCore: true,
        create: {
          canonicalForm: 'Country',
          senseKey: 'nation',
          phonetic: 'ˈkʌn.tri',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Quốc gia, đất nước', en: 'A nation with its own government' },
          example: 'Vietnam is a beautiful country.',
        },
      },
    ],
    exercises: [
      {
        position: 1,
        isCore: true,
        type: 'MCQ' as const,
        promptData: {
          prompt: 'Câu nào dưới đây dùng đúng mạo từ khi giới thiệu nghề nghiệp?',
          options: [
            { id: 'opt-2-1', text: 'I am a student.' },
            { id: 'opt-2-2', text: 'I am student.' },
            { id: 'opt-2-3', text: 'I am an student.' },
          ],
        },
        gradingData: { correctOptionId: 'opt-2-1' },
        feedbackData: {
          explanation: "Danh từ số ít bắt đầu bằng phụ âm 'student' cần mạo từ 'a', nên 'I am a student' là chính xác.",
        },
      },
      {
        position: 2,
        isCore: true,
        type: 'GRAMMAR' as const,
        promptData: {
          prompt: 'Viết câu hoàn chỉnh để giới thiệu quê hương (Vietnam) của bạn theo cấu trúc:',
          sourceSentence: 'Vietnam (quê hương)',
          targetPattern: 'Subject + To Be + From + Country',
        },
        gradingData: {
          acceptedAnswers: [
            'I am from Vietnam.',
            "I'm from Vietnam.",
            'I am from Vietnam',
            "I'm from Vietnam",
          ],
          caseSensitive: false,
        },
        feedbackData: {
          explanation: "Cấu trúc 'Subject + To Be + From + Country' với chủ ngữ 'I' tạo thành câu hoàn chỉnh: 'I am from Vietnam.'",
        },
      },
      {
        position: 3,
        isCore: true,
        type: 'REORDER' as const,
        promptData: {
          prompt: 'Sắp xếp các từ thành câu giới thiệu tên hoàn chỉnh:',
          tokens: [
            { id: 't2-1', text: 'My' },
            { id: 't2-2', text: 'name' },
            { id: 't2-3', text: 'is' },
            { id: 't2-4', text: 'Alex.' },
          ],
        },
        gradingData: { correctOrder: ['t2-1', 't2-2', 't2-3', 't2-4'] },
        feedbackData: {
          explanation: "'My name is Alex.' là cấu trúc chuẩn để giới thiệu tên mình.",
        },
      },
    ],
  },
  {
    id: SAMPLE_A1_CONSTANTS.lesson3Id,
    position: 3,
    title: { vi: 'Bài 3: Thói quen hàng ngày', en: 'Lesson 3: Daily Routines' },
    contentBlocks: [
      {
        type: 'paragraph',
        text: 'Để mô tả các hoạt động diễn ra thường xuyên mỗi ngày, chúng ta sử dụng thì hiện tại đơn (Present Simple).',
      },
      {
        type: 'paragraph',
        text: "Các hoạt động phổ biến gồm có: 'wake up' (thức dậy), 'have breakfast' (ăn sáng), 'go to school/work' (đi học/đi làm), và 'go to sleep' (đi ngủ).",
      },
      {
        type: 'paragraph',
        text: "Khi chủ ngữ là ngôi thứ ba số ít (he, she, it), động từ thường thêm '-s' hoặc '-es'. Ví dụ: 'He wakes up at 6 AM' nhưng 'I wake up at 6 AM'.",
      },
    ],
    vocabulary: [
      {
        position: 1,
        isCore: true,
        create: {
          canonicalForm: 'Breakfast',
          senseKey: 'morning-meal',
          phonetic: 'ˈbrek.fəst',
          partOfSpeech: 'noun',
          meaningLabels: { vi: 'Bữa ăn sáng', en: 'The first meal of the day' },
          example: 'I have breakfast at 7 o’clock.',
        },
      },
      {
        position: 2,
        isCore: true,
        create: {
          canonicalForm: 'Sleep',
          senseKey: 'rest',
          phonetic: 'sliːp',
          partOfSpeech: 'verb',
          meaningLabels: { vi: 'Ngủ', en: 'To rest in sleep' },
          example: 'Children need to sleep eight hours a day.',
        },
      },
      {
        position: 3,
        isCore: true,
        create: {
          canonicalForm: 'Work',
          senseKey: 'labor',
          phonetic: 'wɜːk',
          partOfSpeech: 'verb',
          meaningLabels: { vi: 'Làm việc', en: 'To perform work' },
          example: 'They work from Monday to Friday.',
        },
      },
    ],
    exercises: [
      {
        position: 1,
        isCore: true,
        type: 'FILL_BLANK' as const,
        promptData: {
          prompt: 'Chia động từ phù hợp cho ngôi thứ ba số ít trong thì hiện tại đơn:',
          sentence: 'She ____ (wake) up early every morning.',
        },
        gradingData: { acceptedAnswers: ['wakes'], caseSensitive: false },
        feedbackData: {
          explanation: "Với chủ ngữ ngôi thứ ba số ít 'She', động từ 'wake' được thêm 's' thành 'wakes' (đi kèm 'up' tạo thành cụm 'wakes up').",
        },
      },
      {
        position: 2,
        isCore: true,
        type: 'MCQ' as const,
        promptData: {
          prompt: "Cụm từ nào có nghĩa là 'ăn bữa sáng'?",
          options: [
            { id: 'opt-3-1', text: 'have breakfast' },
            { id: 'opt-3-2', text: 'make breakfast' },
            { id: 'opt-3-3', text: 'sleep breakfast' },
          ],
        },
        gradingData: { correctOptionId: 'opt-3-1' },
        feedbackData: {
          explanation: "Collocation chuẩn trong tiếng Anh là 'have breakfast'.",
        },
      },
      {
        position: 3,
        isCore: true,
        type: 'REORDER' as const,
        promptData: {
          prompt: 'Sắp xếp các từ thành câu mô tả thói quen:',
          tokens: [
            { id: 't3-1', text: 'I' },
            { id: 't3-2', text: 'read' },
            { id: 't3-3', text: 'books' },
            { id: 't3-4', text: 'every' },
            { id: 't3-5', text: 'night.' },
          ],
        },
        gradingData: { correctOrder: ['t3-1', 't3-2', 't3-3', 't3-4', 't3-5'] },
        feedbackData: {
          explanation: "'I read books every night.' biểu đạt hành động lặp đi lặp lại hàng đêm.",
        },
      },
    ],
  },
];

export async function provisionSampleA1Curriculum(
  db: PrismaClient,
  actors: SampleActorIds
): Promise<SampleA1Result> {
  const courseId = SAMPLE_A1_CONSTANTS.courseId;
  const unitId = SAMPLE_A1_CONSTANTS.unitId;

  // 1. Verify parent course and unit exist
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { id: true, isActive: true, languageId: true },
  });
  if (!course || !course.isActive) {
    throw new Error(`Sample curriculum requires active course ${courseId}. Ensure canonical seed is applied.`);
  }

  const unit = await db.unit.findUnique({
    where: { id: unitId },
    select: { id: true, courseId: true },
  });
  if (!unit || unit.courseId !== courseId) {
    throw new Error(`Sample curriculum requires unit ${unitId} in course ${courseId}.`);
  }

  // Verify supplied staff actors are valid and active (R2: active staff validation upfront)
  const adminAccount = await db.account.findUnique({
    where: { id: actors.adminId },
    select: { id: true, role: true, status: true },
  });
  if (!adminAccount || adminAccount.role !== 'ADMIN' || adminAccount.status !== 'ACTIVE') {
    throw new Error(`Sample curriculum requires active ADMIN account: ${actors.adminId}`);
  }

  const teacherAccount = await db.account.findUnique({
    where: { id: actors.teacherId },
    select: { id: true, role: true, status: true },
  });
  if (!teacherAccount || teacherAccount.role !== 'TEACHER' || teacherAccount.status !== 'ACTIVE') {
    throw new Error(`Sample curriculum requires active TEACHER account: ${actors.teacherId}`);
  }

  // 2. Preflight global vocabulary identities for all proposed sample words across all slots (R2)
  for (const sampleLesson of SAMPLE_LESSONS_DATA) {
    for (const v of sampleLesson.vocabulary) {
      const normalizedForm = v.create.canonicalForm.trim().toLowerCase();
      const senseKey = v.create.senseKey?.trim() || '';
      const existingVocab = await db.vocabularyConcept.findUnique({
        where: {
          languageId_normalizedForm_senseKey: {
            languageId: course.languageId,
            normalizedForm,
            senseKey,
          },
        },
      });
      if (existingVocab) {
        const meaningMatch = canonicalJsonStringify(existingVocab.meaningLabels) === canonicalJsonStringify(v.create.meaningLabels);
        const phoneticMatch = (existingVocab.phonetic ?? null) === (v.create.phonetic ?? null);
        const posMatch = (existingVocab.partOfSpeech ?? null) === (v.create.partOfSpeech ?? null);
        const exMatch = (existingVocab.example ?? null) === (v.create.example ?? null);
        const formMatch = existingVocab.canonicalForm === v.create.canonicalForm;
        if (!meaningMatch || !phoneticMatch || !posMatch || !exMatch || !formMatch) {
          throw new Error(
            `SAMPLE_CURRICULUM_CONFLICT: Conflicting global vocabulary concept for word '${v.create.canonicalForm}' (sense: '${senseKey}'). Refusing to overwrite or corrupt concept.`
          );
        }
      }
    }
  }

  // 3. Read-only deep semantic preflight across every existing slot in the unit (R2)
  const existingLessons = await db.lesson.findMany({
    where: { unitId },
    include: {
      assignment: {
        include: {
          currentTeacher: true,
          history: {
            orderBy: { sequenceNo: 'asc' },
          },
        },
      },
      revisions: {
        orderBy: { revisionNo: 'asc' },
        include: {
          exercises: {
            orderBy: { position: 'asc' },
            include: {
              item: true,
              itemRevision: {
                include: {
                  gradingSecret: true,
                  _count: {
                    select: {
                      mediaBindings: true,
                      assessmentVersionItems: true,
                      provenanceVersionItems: true,
                    },
                  },
                },
              },
            },
          },
          vocabularyLinks: {
            orderBy: { position: 'asc' },
            include: {
              vocabulary: true,
            },
          },
          reviews: {
            orderBy: { occurredAt: 'asc' },
          },
        },
      },
      activeRevision: true,
    },
  });

  // Check unexpected lessons outside positions 1..3
  const unexpectedLessons = existingLessons.filter((l) => l.position < 1 || l.position > 3);
  if (unexpectedLessons.length > 0) {
    throw new Error(
      `SAMPLE_CURRICULUM_CONFLICT: Unit contains unexpected lessons outside positions 1..3: ${unexpectedLessons.map((l) => l.id).join(', ')}`
    );
  }

  type SlotPlan =
    | { type: 'CREATE_FULL'; sampleLesson: (typeof SAMPLE_LESSONS_DATA)[0] }
    | { type: 'RESUME_CANONICAL_SKELETON'; lesson: (typeof existingLessons)[0]; sampleLesson: (typeof SAMPLE_LESSONS_DATA)[0] }
    | { type: 'RESUME_ASSIGNED'; lesson: (typeof existingLessons)[0]; sampleLesson: (typeof SAMPLE_LESSONS_DATA)[0] }
    | { type: 'RESUME_DRAFT'; lesson: (typeof existingLessons)[0]; revision: (typeof existingLessons)[0]['revisions'][0]; sampleLesson: (typeof SAMPLE_LESSONS_DATA)[0] }
    | { type: 'RESUME_IN_REVIEW'; lesson: (typeof existingLessons)[0]; revision: (typeof existingLessons)[0]['revisions'][0]; submissionId: string; sampleLesson: (typeof SAMPLE_LESSONS_DATA)[0] }
    | { type: 'RESUME_APPROVED'; lesson: (typeof existingLessons)[0]; revision: (typeof existingLessons)[0]['revisions'][0]; submissionId: string; sampleLesson: (typeof SAMPLE_LESSONS_DATA)[0] }
    | { type: 'RESUME_ACTIVATE'; lesson: (typeof existingLessons)[0]; revision: (typeof existingLessons)[0]['revisions'][0]; sampleLesson: (typeof SAMPLE_LESSONS_DATA)[0] }
    | { type: 'NOOP_COMPLETED'; lesson: (typeof existingLessons)[0]; revision: (typeof existingLessons)[0]['revisions'][0]; sampleLesson: (typeof SAMPLE_LESSONS_DATA)[0] };

  const plans: SlotPlan[] = [];

  for (const sampleLesson of SAMPLE_LESSONS_DATA) {
    const pos = sampleLesson.position;
    const existing = existingLessons.find((l) => l.position === pos);

    if (!existing) {
      plans.push({ type: 'CREATE_FULL', sampleLesson });
      continue;
    }

    if (!existing.isRequired) {
      throw new Error(`SAMPLE_CURRICULUM_CONFLICT: Lesson at position ${pos} has isRequired=false.`);
    }

    // A. Slot has NO revisions
    if (!existing.revisions || existing.revisions.length === 0) {
      if (existing.activeRevisionId !== null) {
        throw new Error(`SAMPLE_CURRICULUM_CONFLICT: Lesson at position ${pos} has activeRevisionId without revisions.`);
      }

      if (!existing.assignment) {
        if (pos === 1 && existing.id === SAMPLE_A1_CONSTANTS.lesson1Id && existing.availability === 'PLANNED') {
          plans.push({ type: 'RESUME_CANONICAL_SKELETON', lesson: existing, sampleLesson });
          continue;
        }
        throw new Error(
          `SAMPLE_CURRICULUM_CONFLICT: Lesson at position ${pos} (id: ${existing.id}) is an unauthored non-canonical skeleton whose origin cannot be established.`
        );
      }

      // Has assignment: verify full initial assignment provenance
      const asgn = existing.assignment;
      const createdByMatch = asgn.createdBy.toLowerCase() === actors.adminId.toLowerCase();
      const teacherMatch = asgn.currentTeacherId.toLowerCase() === actors.teacherId.toLowerCase();
      const scopeGenMatch = (asgn.scopeGeneration ?? 1n).toString() === '1';
      const hist = asgn.history || [];
      const historyValid =
        hist.length === 1 &&
        hist[0].sequenceNo === 1 &&
        hist[0].nextTeacherId.toLowerCase() === actors.teacherId.toLowerCase() &&
        (hist[0].changedBy || (hist[0] as any).createdBy || '').toLowerCase() === actors.adminId.toLowerCase();

      if (!createdByMatch || !teacherMatch || !scopeGenMatch || !historyValid) {
        throw new Error(
          `SAMPLE_CURRICULUM_CONFLICT: Assignment provenance mismatch for lesson at position ${pos}.`
        );
      }

      plans.push({ type: 'RESUME_ASSIGNED', lesson: existing, sampleLesson });
      continue;
    }

    // B. Slot has revisions: must have exactly 1 revision and revisionNo === 1
    if (existing.revisions.length !== 1 || existing.revisions[0].revisionNo !== 1) {
      throw new Error(
        `SAMPLE_CURRICULUM_CONFLICT: Lesson at position ${pos} has extra or successor revisions (count: ${existing.revisions.length}, revisionNo: ${existing.revisions[0].revisionNo}).`
      );
    }

    const rev = existing.revisions[0];

    // Title comparison: must match full locale map exactly
    if (canonicalJsonStringify(rev.title) !== canonicalJsonStringify(sampleLesson.title)) {
      const activeTitle = rev.title as Record<string, string> | null;
      const titleDisplay = activeTitle?.vi || activeTitle?.en || JSON.stringify(activeTitle);
      throw new Error(
        `SAMPLE_CURRICULUM_CONFLICT: Lesson at position ${pos} title '${titleDisplay}' does not match sample definition.`
      );
    }

    // Content blocks comparison: order and texts must match exactly
    if (canonicalJsonStringify(rev.contentBlocks) !== canonicalJsonStringify(sampleLesson.contentBlocks)) {
      throw new Error(
        `SAMPLE_CURRICULUM_CONFLICT: Lesson at position ${pos} contentBlocks do not match sample definition.`
      );
    }

    // Topic / skill / purpose empty
    if (
      (rev.topicIds && rev.topicIds.length > 0) ||
      (rev.skillIds && rev.skillIds.length > 0) ||
      (rev.purposeTags && rev.purposeTags.length > 0)
    ) {
      throw new Error(
        `SAMPLE_CURRICULUM_CONFLICT: Lesson at position ${pos} contains unexpected topic/skill/purpose metadata.`
      );
    }

    // Check absence of unsupported children or student attempts
    const c = (rev as any)._count || {};
    if ((c.mediaBindings ?? 0) > 0 || (c.assessmentVersionItems ?? 0) > 0 || (c.attempts ?? 0) > 0) {
      throw new Error(
        `SAMPLE_CURRICULUM_CONFLICT: Lesson at position ${pos} contains unsupported children or student attempts.`
      );
    }

    // Exercises comparison: count, order, promptData, gradingData, feedbackData
    const exList = rev.exercises || [];
    if (exList.length !== sampleLesson.exercises.length) {
      throw new Error(
        `SAMPLE_CURRICULUM_CONFLICT: Lesson at position ${pos} exercises count mismatch (expected ${sampleLesson.exercises.length}, got ${exList.length}).`
      );
    }

    for (let i = 0; i < sampleLesson.exercises.length; i++) {
      const expectedEx = sampleLesson.exercises[i];
      const actualEx = exList[i];
      if (!actualEx || actualEx.position !== expectedEx.position || actualEx.isCore !== true) {
        throw new Error(
          `SAMPLE_CURRICULUM_CONFLICT: Lesson at position ${pos} exercise position or isCore mismatch at index ${i}.`
        );
      }

      const ir = actualEx.itemRevision;
      if (!ir || ir.type !== expectedEx.type) {
        throw new Error(
          `SAMPLE_CURRICULUM_CONFLICT: Lesson at position ${pos} exercise ${expectedEx.position} type mismatch.`
        );
      }

      if (canonicalJsonStringify(ir.promptData) !== canonicalJsonStringify(expectedEx.promptData)) {
        throw new Error(
          `SAMPLE_CURRICULUM_CONFLICT: Lesson at position ${pos} exercise ${expectedEx.position} promptData mismatch.`
        );
      }

      const secret = ir.gradingSecret;
      if (!secret || canonicalJsonStringify(secret.gradingData) !== canonicalJsonStringify(expectedEx.gradingData)) {
        throw new Error(
          `SAMPLE_CURRICULUM_CONFLICT: Lesson at position ${pos} exercise ${expectedEx.position} gradingData mismatch.`
        );
      }

      const expectedFeedback = expectedEx.feedbackData || {};
      const actualFeedback = secret.feedbackData || {};
      if (canonicalJsonStringify(actualFeedback) !== canonicalJsonStringify(expectedFeedback)) {
        throw new Error(
          `SAMPLE_CURRICULUM_CONFLICT: Lesson at position ${pos} exercise ${expectedEx.position} feedbackData explanation mismatch.`
        );
      }

      if (actualEx.item?.origin !== 'PRACTICE') {
        throw new Error(
          `SAMPLE_CURRICULUM_CONFLICT: Lesson at position ${pos} exercise ${expectedEx.position} origin is not PRACTICE.`
        );
      }

      if (ir.schemaVersion !== 1 || secret.schemaVersion !== 1 || ir.isDraftOmitted) {
        throw new Error(
          `SAMPLE_CURRICULUM_CONFLICT: Lesson at position ${pos} exercise ${expectedEx.position} schemaVersion or draftOmitted invalid.`
        );
      }

      if (actualEx.lessonRevisionId !== rev.id || ir.authoringLessonRevisionId !== rev.id) {
        throw new Error(
          `SAMPLE_CURRICULUM_CONFLICT: Lesson at position ${pos} exercise ${expectedEx.position} link mismatch.`
        );
      }

      if (
        ir.createdBy.toLowerCase() !== actors.teacherId.toLowerCase() ||
        ir.creationAssignmentEpisodeId !== rev.creationAssignmentEpisodeId
      ) {
        throw new Error(
          `SAMPLE_CURRICULUM_CONFLICT: Lesson at position ${pos} exercise ${expectedEx.position} authorship mismatch.`
        );
      }
    }

    // Vocabulary links comparison: count, order, displaySnapshot, concept
    const vocabList = rev.vocabularyLinks || [];
    if (vocabList.length !== sampleLesson.vocabulary.length) {
      throw new Error(
        `SAMPLE_CURRICULUM_CONFLICT: Lesson at position ${pos} vocabulary count mismatch (expected ${sampleLesson.vocabulary.length}, got ${vocabList.length}).`
      );
    }

    for (let i = 0; i < sampleLesson.vocabulary.length; i++) {
      const expectedV = sampleLesson.vocabulary[i];
      const actualV = vocabList[i];
      if (!actualV || actualV.position !== expectedV.position || actualV.isCore !== true) {
        throw new Error(
          `SAMPLE_CURRICULUM_CONFLICT: Lesson at position ${pos} vocabulary link position or isCore mismatch at index ${i}.`
        );
      }

      const snap = actualV.displaySnapshot as any;
      if (
        !snap ||
        snap.schemaVersion !== 1 ||
        snap.canonicalForm !== expectedV.create.canonicalForm ||
        (snap.senseKey || '') !== (expectedV.create.senseKey || '') ||
        canonicalJsonStringify(snap.meaningLabels) !== canonicalJsonStringify(expectedV.create.meaningLabels)
      ) {
        throw new Error(
          `SAMPLE_CURRICULUM_CONFLICT: Lesson at position ${pos} vocabulary displaySnapshot mismatch for '${expectedV.create.canonicalForm}'.`
        );
      }

      const conc = actualV.vocabulary;
      if (
        !conc ||
        conc.canonicalForm !== expectedV.create.canonicalForm ||
        conc.normalizedForm !== expectedV.create.canonicalForm.trim().toLowerCase() ||
        (conc.senseKey || '') !== (expectedV.create.senseKey || '') ||
        canonicalJsonStringify(conc.meaningLabels) !== canonicalJsonStringify(expectedV.create.meaningLabels) ||
        (conc.phonetic ?? null) !== (expectedV.create.phonetic ?? null) ||
        (conc.partOfSpeech ?? null) !== (expectedV.create.partOfSpeech ?? null) ||
        (conc.example ?? null) !== (expectedV.create.example ?? null)
      ) {
        throw new Error(
          `SAMPLE_CURRICULUM_CONFLICT: Lesson at position ${pos} vocabulary concept mismatch for '${expectedV.create.canonicalForm}'.`
        );
      }
    }

    // Assignment & author provenance
    if (
      !existing.assignment ||
      existing.assignment.createdBy.toLowerCase() !== actors.adminId.toLowerCase() ||
      existing.assignment.currentTeacherId.toLowerCase() !== actors.teacherId.toLowerCase() ||
      rev.createdBy.toLowerCase() !== actors.teacherId.toLowerCase() ||
      rev.lastEditedBy.toLowerCase() !== actors.teacherId.toLowerCase()
    ) {
      throw new Error(
        `SAMPLE_CURRICULUM_CONFLICT: Lesson at position ${pos} assignment or revision author mismatch.`
      );
    }

    // Workflow state validation & review record consistency
    const revReviews = (rev.reviews || []) as any[];
    const submitReview = revReviews.find((r) => r.action === 'SUBMIT');
    const approveReviewEvent = revReviews.find((r) => r.action === 'APPROVE');
    const publishReviewEvent = revReviews.find((r) => r.action === 'PUBLISH');

    if (rev.status === 'DRAFT') {
      if (
        rev.submittedBy ||
        rev.submittedAt ||
        rev.approvedBy ||
        rev.publishedBy ||
        existing.activeRevisionId ||
        existing.availability !== 'PLANNED'
      ) {
        throw new Error(`SAMPLE_CURRICULUM_CONFLICT: Lesson at position ${pos} draft has inconsistent workflow fields.`);
      }
      plans.push({ type: 'RESUME_DRAFT', lesson: existing, revision: rev, sampleLesson });
    } else if (rev.status === 'IN_REVIEW') {
      if (
        !rev.submittedBy ||
        rev.submittedBy.toLowerCase() !== actors.teacherId.toLowerCase() ||
        !rev.submittedAt ||
        rev.approvedBy ||
        rev.publishedBy ||
        existing.activeRevisionId ||
        existing.availability !== 'PLANNED' ||
        !submitReview
      ) {
        throw new Error(`SAMPLE_CURRICULUM_CONFLICT: Lesson at position ${pos} in-review has inconsistent workflow fields.`);
      }
      plans.push({
        type: 'RESUME_IN_REVIEW',
        lesson: existing,
        revision: rev,
        submissionId: submitReview.id,
        sampleLesson,
      });
    } else if (rev.status === 'APPROVED') {
      if (
        !rev.submittedBy ||
        !rev.approvedBy ||
        rev.approvedBy.toLowerCase() !== actors.adminId.toLowerCase() ||
        rev.publishedBy ||
        existing.activeRevisionId ||
        existing.availability !== 'PLANNED' ||
        !submitReview ||
        !approveReviewEvent
      ) {
        throw new Error(`SAMPLE_CURRICULUM_CONFLICT: Lesson at position ${pos} approved has inconsistent workflow fields.`);
      }
      plans.push({
        type: 'RESUME_APPROVED',
        lesson: existing,
        revision: rev,
        submissionId: submitReview.id,
        sampleLesson,
      });
    } else if (rev.status === 'PUBLISHED') {
      if (
        !rev.submittedBy ||
        !rev.approvedBy ||
        !rev.publishedBy ||
        rev.publishedBy.toLowerCase() !== actors.adminId.toLowerCase() ||
        existing.activeRevisionId !== rev.id ||
        !submitReview ||
        !approveReviewEvent ||
        !publishReviewEvent
      ) {
        throw new Error(`SAMPLE_CURRICULUM_CONFLICT: Lesson at position ${pos} published has inconsistent workflow fields.`);
      }
      if (existing.availability === 'PLANNED') {
        plans.push({ type: 'RESUME_ACTIVATE', lesson: existing, revision: rev, sampleLesson });
      } else if (existing.availability === 'AVAILABLE') {
        plans.push({ type: 'NOOP_COMPLETED', lesson: existing, revision: rev, sampleLesson });
      } else {
        throw new Error(`SAMPLE_CURRICULUM_CONFLICT: Lesson at position ${pos} has unsupported availability '${existing.availability}'.`);
      }
    } else {
      throw new Error(`SAMPLE_CURRICULUM_CONFLICT: Lesson at position ${pos} has unsupported revision status '${rev.status}'.`);
    }
  }

  // 4. Idempotency short-circuit: all 3 lessons are already completed matching trio
  if (plans.every((p) => p.type === 'NOOP_COMPLETED')) {
    const sorted = existingLessons
      .filter((l) => SAMPLE_LESSONS_DATA.some((s) => s.position === l.position))
      .sort((a, b) => a.position - b.position);
    return {
      alreadyProvisioned: true,
      courseId,
      unitId,
      lessonIds: sorted.map((l) => l.id),
    };
  }

  // 5. Execute narrow transitions following documented resume policy
  const provisionedLessonIds: string[] = [];

  for (const plan of plans) {
    let lessonId: string;

    if (plan.type === 'NOOP_COMPLETED') {
      provisionedLessonIds.push(plan.lesson.id);
      continue;
    }

    if (plan.type === 'CREATE_FULL') {
      const createRes = await createLesson(
        actors.adminId,
        courseId,
        unitId,
        { position: plan.sampleLesson.position, isRequired: true },
        db
      );
      if ((createRes.status !== 201 && createRes.status !== 200) || !createRes.data?.data) {
        throw new Error(`Failed to create lesson at position ${plan.sampleLesson.position}: ${createRes.error?.message}`);
      }
      lessonId = createRes.data.data.id;

      let lRow = await db.lesson.findUnique({ where: { id: lessonId } });
      if (!lRow) throw new Error(`Lesson ${lessonId} not found after creation.`);

      const assignRes = await assignLesson(
        actors.adminId,
        courseId,
        unitId,
        lessonId,
        { teacherId: actors.teacherId, expectedRowVersion: lRow.rowVersion.toString() },
        db
      );
      if (assignRes.status !== 200) {
        throw new Error(`Failed to assign lesson ${lessonId}: ${assignRes.error?.message}`);
      }

      lRow = await db.lesson.findUnique({ where: { id: lessonId } });
      const draftRes = await saveTeacherLessonDraft(
        actors.teacherId,
        lessonId,
        {
          title: plan.sampleLesson.title,
          contentBlocks: plan.sampleLesson.contentBlocks,
          changeSummary: 'Provisioned sample A1 curriculum content',
          expectedRowVersion: lRow!.rowVersion.toString(),
          exercises: plan.sampleLesson.exercises,
          vocabulary: plan.sampleLesson.vocabulary,
        },
        db
      );
      if (draftRes.status !== 200 || !draftRes.data?.data?.highestRevision) {
        throw new Error(`Failed to save draft for lesson ${lessonId}: ${draftRes.error?.message}`);
      }
      const rev = draftRes.data.data.highestRevision;

      lRow = await db.lesson.findUnique({ where: { id: lessonId } });
      const submitRes = await submitTeacherLesson(
        actors.teacherId,
        lessonId,
        {
          revisionId: rev.id,
          expectedLessonRowVersion: lRow!.rowVersion.toString(),
          expectedRevisionRowVersion: (rev.rowVersion ?? 1n).toString(),
        },
        db
      );
      if (submitRes.status !== 200 || !submitRes.data?.submissionId) {
        throw new Error(`Failed to submit lesson ${lessonId}: ${submitRes.error?.message}`);
      }
      const submissionId = submitRes.data.submissionId;

      const revRow = await db.lessonRevision.findUnique({ where: { id: rev.id } });
      const approveRes = await approveReview(
        actors.adminId,
        submissionId,
        { expectedRevisionRowVersion: revRow!.rowVersion.toString() },
        db
      );
      if (approveRes.status !== 200) {
        throw new Error(`Failed to approve lesson ${lessonId}: ${approveRes.error?.message}`);
      }

      lRow = await db.lesson.findUnique({ where: { id: lessonId } });
      const revRow2 = await db.lessonRevision.findUnique({ where: { id: rev.id } });
      const pubRes = await publishReview(
        actors.adminId,
        submissionId,
        {
          expectedLessonRowVersion: lRow!.rowVersion.toString(),
          expectedRevisionRowVersion: revRow2!.rowVersion.toString(),
          makeAvailable: true,
        },
        db
      );
      if (pubRes.status !== 200) {
        throw new Error(`Failed to publish lesson ${lessonId}: ${pubRes.error?.message}`);
      }

      lRow = await db.lesson.findUnique({ where: { id: lessonId } });
      if (lRow!.availability !== 'AVAILABLE') {
        await activateLesson(
          actors.adminId,
          courseId,
          unitId,
          lessonId,
          { expectedRowVersion: lRow!.rowVersion.toString() },
          db
        );
      }
      provisionedLessonIds.push(lessonId);
      continue;
    }

    if (plan.type === 'RESUME_CANONICAL_SKELETON') {
      lessonId = plan.lesson.id;
      let lRow = await db.lesson.findUnique({ where: { id: lessonId } });
      const assignRes = await assignLesson(
        actors.adminId,
        courseId,
        unitId,
        lessonId,
        { teacherId: actors.teacherId, expectedRowVersion: lRow!.rowVersion.toString() },
        db
      );
      if (assignRes.status !== 200) {
        throw new Error(`Failed to assign lesson ${lessonId}: ${assignRes.error?.message}`);
      }

      lRow = await db.lesson.findUnique({ where: { id: lessonId } });
      const draftRes = await saveTeacherLessonDraft(
        actors.teacherId,
        lessonId,
        {
          title: plan.sampleLesson.title,
          contentBlocks: plan.sampleLesson.contentBlocks,
          changeSummary: 'Provisioned sample A1 curriculum content',
          expectedRowVersion: lRow!.rowVersion.toString(),
          exercises: plan.sampleLesson.exercises,
          vocabulary: plan.sampleLesson.vocabulary,
        },
        db
      );
      if (draftRes.status !== 200 || !draftRes.data?.data?.highestRevision) {
        throw new Error(`Failed to save draft for lesson ${lessonId}: ${draftRes.error?.message}`);
      }
      const rev = draftRes.data.data.highestRevision;

      lRow = await db.lesson.findUnique({ where: { id: lessonId } });
      const submitRes = await submitTeacherLesson(
        actors.teacherId,
        lessonId,
        {
          revisionId: rev.id,
          expectedLessonRowVersion: lRow!.rowVersion.toString(),
          expectedRevisionRowVersion: (rev.rowVersion ?? 1n).toString(),
        },
        db
      );
      if (submitRes.status !== 200 || !submitRes.data?.submissionId) {
        throw new Error(`Failed to submit lesson ${lessonId}: ${submitRes.error?.message}`);
      }
      const submissionId = submitRes.data.submissionId;

      const revRow = await db.lessonRevision.findUnique({ where: { id: rev.id } });
      const approveRes = await approveReview(
        actors.adminId,
        submissionId,
        { expectedRevisionRowVersion: revRow!.rowVersion.toString() },
        db
      );
      if (approveRes.status !== 200) {
        throw new Error(`Failed to approve lesson ${lessonId}: ${approveRes.error?.message}`);
      }

      lRow = await db.lesson.findUnique({ where: { id: lessonId } });
      const revRow2 = await db.lessonRevision.findUnique({ where: { id: rev.id } });
      const pubRes = await publishReview(
        actors.adminId,
        submissionId,
        {
          expectedLessonRowVersion: lRow!.rowVersion.toString(),
          expectedRevisionRowVersion: revRow2!.rowVersion.toString(),
          makeAvailable: true,
        },
        db
      );
      if (pubRes.status !== 200) {
        throw new Error(`Failed to publish lesson ${lessonId}: ${pubRes.error?.message}`);
      }

      lRow = await db.lesson.findUnique({ where: { id: lessonId } });
      if (lRow!.availability !== 'AVAILABLE') {
        await activateLesson(
          actors.adminId,
          courseId,
          unitId,
          lessonId,
          { expectedRowVersion: lRow!.rowVersion.toString() },
          db
        );
      }
      provisionedLessonIds.push(lessonId);
      continue;
    }

    if (plan.type === 'RESUME_ASSIGNED') {
      lessonId = plan.lesson.id;
      let lRow = await db.lesson.findUnique({ where: { id: lessonId } });
      const draftRes = await saveTeacherLessonDraft(
        actors.teacherId,
        lessonId,
        {
          title: plan.sampleLesson.title,
          contentBlocks: plan.sampleLesson.contentBlocks,
          changeSummary: 'Provisioned sample A1 curriculum content',
          expectedRowVersion: lRow!.rowVersion.toString(),
          exercises: plan.sampleLesson.exercises,
          vocabulary: plan.sampleLesson.vocabulary,
        },
        db
      );
      if (draftRes.status !== 200 || !draftRes.data?.data?.highestRevision) {
        throw new Error(`Failed to save draft for lesson ${lessonId}: ${draftRes.error?.message}`);
      }
      const rev = draftRes.data.data.highestRevision;

      lRow = await db.lesson.findUnique({ where: { id: lessonId } });
      const submitRes = await submitTeacherLesson(
        actors.teacherId,
        lessonId,
        {
          revisionId: rev.id,
          expectedLessonRowVersion: lRow!.rowVersion.toString(),
          expectedRevisionRowVersion: (rev.rowVersion ?? 1n).toString(),
        },
        db
      );
      if (submitRes.status !== 200 || !submitRes.data?.submissionId) {
        throw new Error(`Failed to submit lesson ${lessonId}: ${submitRes.error?.message}`);
      }
      const submissionId = submitRes.data.submissionId;

      const revRow = await db.lessonRevision.findUnique({ where: { id: rev.id } });
      const approveRes = await approveReview(
        actors.adminId,
        submissionId,
        { expectedRevisionRowVersion: revRow!.rowVersion.toString() },
        db
      );
      if (approveRes.status !== 200) {
        throw new Error(`Failed to approve lesson ${lessonId}: ${approveRes.error?.message}`);
      }

      lRow = await db.lesson.findUnique({ where: { id: lessonId } });
      const revRow2 = await db.lessonRevision.findUnique({ where: { id: rev.id } });
      const pubRes = await publishReview(
        actors.adminId,
        submissionId,
        {
          expectedLessonRowVersion: lRow!.rowVersion.toString(),
          expectedRevisionRowVersion: revRow2!.rowVersion.toString(),
          makeAvailable: true,
        },
        db
      );
      if (pubRes.status !== 200) {
        throw new Error(`Failed to publish lesson ${lessonId}: ${pubRes.error?.message}`);
      }

      lRow = await db.lesson.findUnique({ where: { id: lessonId } });
      if (lRow!.availability !== 'AVAILABLE') {
        await activateLesson(
          actors.adminId,
          courseId,
          unitId,
          lessonId,
          { expectedRowVersion: lRow!.rowVersion.toString() },
          db
        );
      }
      provisionedLessonIds.push(lessonId);
      continue;
    }

    if (plan.type === 'RESUME_DRAFT') {
      lessonId = plan.lesson.id;
      // Never call saveTeacherLessonDraft on existing revision!
      let lRow = await db.lesson.findUnique({ where: { id: lessonId } });
      let rRow = await db.lessonRevision.findUnique({ where: { id: plan.revision.id } });
      const submitRes = await submitTeacherLesson(
        actors.teacherId,
        lessonId,
        {
          revisionId: plan.revision.id,
          expectedLessonRowVersion: lRow!.rowVersion.toString(),
          expectedRevisionRowVersion: rRow!.rowVersion.toString(),
        },
        db
      );
      if (submitRes.status !== 200 || !submitRes.data?.submissionId) {
        throw new Error(`Failed to submit lesson ${lessonId}: ${submitRes.error?.message}`);
      }
      const submissionId = submitRes.data.submissionId;

      rRow = await db.lessonRevision.findUnique({ where: { id: plan.revision.id } });
      const approveRes = await approveReview(
        actors.adminId,
        submissionId,
        { expectedRevisionRowVersion: rRow!.rowVersion.toString() },
        db
      );
      if (approveRes.status !== 200) {
        throw new Error(`Failed to approve lesson ${lessonId}: ${approveRes.error?.message}`);
      }

      lRow = await db.lesson.findUnique({ where: { id: lessonId } });
      rRow = await db.lessonRevision.findUnique({ where: { id: plan.revision.id } });
      const pubRes = await publishReview(
        actors.adminId,
        submissionId,
        {
          expectedLessonRowVersion: lRow!.rowVersion.toString(),
          expectedRevisionRowVersion: rRow!.rowVersion.toString(),
          makeAvailable: true,
        },
        db
      );
      if (pubRes.status !== 200) {
        throw new Error(`Failed to publish lesson ${lessonId}: ${pubRes.error?.message}`);
      }

      lRow = await db.lesson.findUnique({ where: { id: lessonId } });
      if (lRow!.availability !== 'AVAILABLE') {
        await activateLesson(
          actors.adminId,
          courseId,
          unitId,
          lessonId,
          { expectedRowVersion: lRow!.rowVersion.toString() },
          db
        );
      }
      provisionedLessonIds.push(lessonId);
      continue;
    }

    if (plan.type === 'RESUME_IN_REVIEW') {
      lessonId = plan.lesson.id;
      let rRow = await db.lessonRevision.findUnique({ where: { id: plan.revision.id } });
      const approveRes = await approveReview(
        actors.adminId,
        plan.submissionId,
        { expectedRevisionRowVersion: rRow!.rowVersion.toString() },
        db
      );
      if (approveRes.status !== 200) {
        throw new Error(`Failed to approve lesson ${lessonId}: ${approveRes.error?.message}`);
      }

      let lRow = await db.lesson.findUnique({ where: { id: lessonId } });
      rRow = await db.lessonRevision.findUnique({ where: { id: plan.revision.id } });
      const pubRes = await publishReview(
        actors.adminId,
        plan.submissionId,
        {
          expectedLessonRowVersion: lRow!.rowVersion.toString(),
          expectedRevisionRowVersion: rRow!.rowVersion.toString(),
          makeAvailable: true,
        },
        db
      );
      if (pubRes.status !== 200) {
        throw new Error(`Failed to publish lesson ${lessonId}: ${pubRes.error?.message}`);
      }

      lRow = await db.lesson.findUnique({ where: { id: lessonId } });
      if (lRow!.availability !== 'AVAILABLE') {
        await activateLesson(
          actors.adminId,
          courseId,
          unitId,
          lessonId,
          { expectedRowVersion: lRow!.rowVersion.toString() },
          db
        );
      }
      provisionedLessonIds.push(lessonId);
      continue;
    }

    if (plan.type === 'RESUME_APPROVED') {
      lessonId = plan.lesson.id;
      let lRow = await db.lesson.findUnique({ where: { id: lessonId } });
      let rRow = await db.lessonRevision.findUnique({ where: { id: plan.revision.id } });
      const pubRes = await publishReview(
        actors.adminId,
        plan.submissionId,
        {
          expectedLessonRowVersion: lRow!.rowVersion.toString(),
          expectedRevisionRowVersion: rRow!.rowVersion.toString(),
          makeAvailable: true,
        },
        db
      );
      if (pubRes.status !== 200) {
        throw new Error(`Failed to publish lesson ${lessonId}: ${pubRes.error?.message}`);
      }

      lRow = await db.lesson.findUnique({ where: { id: lessonId } });
      if (lRow!.availability !== 'AVAILABLE') {
        await activateLesson(
          actors.adminId,
          courseId,
          unitId,
          lessonId,
          { expectedRowVersion: lRow!.rowVersion.toString() },
          db
        );
      }
      provisionedLessonIds.push(lessonId);
      continue;
    }

    if (plan.type === 'RESUME_ACTIVATE') {
      lessonId = plan.lesson.id;
      const lRow = await db.lesson.findUnique({ where: { id: lessonId } });
      if (lRow!.availability !== 'AVAILABLE') {
        const actRes = await activateLesson(
          actors.adminId,
          courseId,
          unitId,
          lessonId,
          { expectedRowVersion: lRow!.rowVersion.toString() },
          db
        );
        if (actRes.status !== 200) {
          throw new Error(`Failed to activate lesson ${lessonId}: ${actRes.error?.message}`);
        }
      }
      provisionedLessonIds.push(lessonId);
      continue;
    }
  }

  return {
    alreadyProvisioned: false,
    courseId,
    unitId,
    lessonIds: provisionedLessonIds,
  };
}
