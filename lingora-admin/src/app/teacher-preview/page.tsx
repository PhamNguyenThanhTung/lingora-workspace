import { notFound } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { TeacherLessonsCatalog } from '@/components/TeacherLessonsCatalog';
import type { LessonSummaryDto } from '@/server/lessons';

export const dynamic = 'force-dynamic';

const demoLessons: LessonSummaryDto[] = [
  {
    id: '00000000-0000-4000-8000-000000000101',
    unitId: '00000000-0000-4000-8000-000000000201',
    position: 1,
    isRequired: true,
    availability: 'AVAILABLE',
    rowVersion: '1',
    courseContext: {
      id: '00000000-0000-4000-8000-000000000301',
      names: { vi: 'Tiếng Anh giao tiếp', en: 'Everyday English' },
    },
    unitContext: {
      id: '00000000-0000-4000-8000-000000000201',
      code: 'A1-U1',
      names: { vi: 'Chào hỏi cơ bản', en: 'Basic greetings' },
    },
    assignment: {
      id: '00000000-0000-4000-8000-000000000401',
      currentTeacher: {
        id: '00000000-0000-4000-8000-000000000501',
        displayName: 'Giáo viên minh họa',
        status: 'ACTIVE',
      },
      generation: '1',
    },
    highestRevision: {
      id: '00000000-0000-4000-8000-000000000601',
      revisionNo: 1,
      author: {
        id: '00000000-0000-4000-8000-000000000501',
        displayName: 'Giáo viên minh họa',
      },
      createdAt: '2026-11-01T00:00:00.000Z',
      changeSummary: null,
      status: 'DRAFT',
    },
    isEditable: true,
    editabilityReason: null,
  },
];

export default function TeacherPreviewPage() {
  if (process.env.NODE_ENV !== 'development') notFound();

  const demoAccount = {
    id: '00000000-0000-4000-8000-000000000501',
    role: 'TEACHER',
    status: 'ACTIVE',
    displayName: 'Giáo viên minh họa',
  };

  return (
    <AppShell account={demoAccount}>
      <div className="page-content">
        <p role="note" className="page-description">
          Chế độ xem trước local — dữ liệu minh họa, không phải dữ liệu tài khoản thật.
        </p>
      </div>
      <TeacherLessonsCatalog
        initialLessons={demoLessons}
        account={demoAccount}
        lessonHrefPrefix="/teacher-preview"
      />
    </AppShell>
  );
}
