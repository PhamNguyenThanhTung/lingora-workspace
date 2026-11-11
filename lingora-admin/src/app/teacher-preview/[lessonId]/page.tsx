import { notFound } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { LessonDraftEditor } from '@/components/LessonDraftEditor';
import type { TeacherLessonDetailDto } from '@/server/lessons';

const demoLessonId = '00000000-0000-4000-8000-000000000101';
const demoTeacherId = '00000000-0000-4000-8000-000000000501';
const demoRevisionId = '00000000-0000-4000-8000-000000000601';

const demoAccount = {
  id: demoTeacherId,
  role: 'TEACHER',
  status: 'ACTIVE',
  displayName: 'Giáo viên minh họa',
};

const demoLesson: TeacherLessonDetailDto = {
  id: demoLessonId,
  unitId: '00000000-0000-4000-8000-000000000201',
  position: 1,
  isRequired: true,
  availability: 'AVAILABLE',
  rowVersion: '1',
  courseContext: {
    id: '00000000-0000-4000-8000-000000000301',
    languageId: '00000000-0000-4000-8000-000000000701',
    names: { vi: 'Tiếng Anh giao tiếp', en: 'Everyday English' },
  },
  unitContext: {
    id: '00000000-0000-4000-8000-000000000201',
    code: 'A1-U1',
    names: { vi: 'Chào hỏi cơ bản', en: 'Basic greetings' },
  },
  assignment: {
    id: '00000000-0000-4000-8000-000000000401',
    currentTeacher: { id: demoTeacherId, displayName: demoAccount.displayName, status: 'ACTIVE' },
    generation: '1',
  },
  highestRevision: {
    id: demoRevisionId,
    revisionNo: 1,
    author: { id: demoTeacherId, displayName: demoAccount.displayName },
    createdAt: '2026-11-01T00:00:00.000Z',
    changeSummary: 'Bản nháp minh họa',
    status: 'DRAFT',
    rowVersion: '1',
  },
  isEditable: false,
  editabilityReason: 'Đây là bản xem trước local, không thể lưu thay đổi.',
  currentDraft: {
    title: { vi: 'Lời chào đầu tiên', en: 'First greetings' },
    contentBlocks: [
      { type: 'paragraph', text: 'Dùng “Hello” khi gặp ai đó. Bạn có thể đáp lại bằng “Hi” hoặc “Hello”.' },
      { type: 'paragraph', text: 'Hỏi thăm: “How are you?” — “I’m fine, thank you.”' },
    ],
  },
  revisions: [
    {
      id: demoRevisionId,
      revisionNo: 1,
      author: { id: demoTeacherId, displayName: demoAccount.displayName },
      createdAt: '2026-11-01T00:00:00.000Z',
      changeSummary: 'Bản nháp minh họa',
      status: 'DRAFT',
      rowVersion: '1',
    },
  ],
  exercises: [
    {
      id: '00000000-0000-4000-8000-000000000801',
      itemId: '00000000-0000-4000-8000-000000000802',
      itemRevisionId: '00000000-0000-4000-8000-000000000803',
      position: 1,
      isCore: true,
      type: 'MCQ',
      promptData: { prompt: 'Chọn câu đáp phù hợp với “How are you?”' },
      gradingData: { correctOptionId: 'fine' },
      feedbackData: { explanation: '“I’m fine, thank you” là câu đáp tự nhiên.' },
    },
  ],
  vocabulary: [
    {
      id: '00000000-0000-4000-8000-000000000901',
      vocabularyId: '00000000-0000-4000-8000-000000000902',
      position: 1,
      isCore: true,
      displaySnapshot: {
        schemaVersion: 1,
        languageId: '00000000-0000-4000-8000-000000000701',
        canonicalForm: 'hello',
        senseKey: 'greeting',
        meaningLabels: { vi: 'xin chào', en: 'hello' },
        phonetic: '/həˈloʊ/',
        partOfSpeech: 'interjection',
        example: 'Hello, Anna!',
      },
    },
  ],
  latestFeedback: null,
};

export default async function TeacherLessonPreviewPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  if (process.env.NODE_ENV !== 'development' || lessonId !== demoLessonId) notFound();

  return (
    <AppShell account={demoAccount}>
      <LessonDraftEditor initialLesson={demoLesson} account={demoAccount} previewOnly />
    </AppShell>
  );
}
