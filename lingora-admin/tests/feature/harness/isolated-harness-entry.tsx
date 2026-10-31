import ActivateTeacherPage from '../../../src/app/activate-teacher/page';
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AppShell } from '../../../src/components/AppShell';
import { LanguagesCatalog } from '../../../src/components/LanguagesCatalog';
import { FrameworksCatalog } from '../../../src/components/FrameworksCatalog';
import { LevelsCatalog } from '../../../src/components/LevelsCatalog';
import { CoursesCatalog } from '../../../src/components/CoursesCatalog';
import { UnitsCatalog } from '../../../src/components/UnitsCatalog';
import { TeachersCatalog } from '../../../src/components/TeachersCatalog';
import { LessonsCatalog } from '../../../src/components/LessonsCatalog';
import { TeacherLessonsCatalog } from '../../../src/components/TeacherLessonsCatalog';
import { LessonDraftEditor } from '../../../src/components/LessonDraftEditor';
import { ReviewDetailView } from '../../../src/components/ReviewDetailView';
import { ReviewQueueCatalog } from '../../../src/components/ReviewQueueCatalog';
import { AssessmentCatalog } from '../../../src/components/AssessmentCatalog';
import { TeacherHoldingView } from '../../../src/app/holding/TeacherHoldingView';
import { AccessDeniedView } from '../../../src/components/AccessDeniedView';
import { ServiceUnavailableView } from '../../../src/components/ServiceUnavailableView';
import { DeleteBlockedModal } from '../../../src/components/DeleteBlockedModal';
import { SessionLostModal } from '../../../src/components/SessionLostModal';
import { saveDraft, loadDraft } from '../../../src/components/draftStorage';
import type { LanguageDto } from '../../../src/server/languages';

if (typeof window !== 'undefined') {
  (window as any).saveDraft = saveDraft;
  (window as any).loadDraft = loadDraft;
}
import type { FrameworkDto } from '../../../src/server/frameworks';
import type { LevelDto } from '../../../src/server/levels';
import type { CourseDto } from '../../../src/server/courses';
import type { UnitDto } from '../../../src/server/units';
import type { TeacherDto } from '../../../src/server/teachers';
import type { LessonSummaryDto, LessonDetailDto, TeacherOptionDto } from '../../../src/server/lessons';

const MOCK_ADMIN = {
  id: '00000000-0000-4000-8000-000000000001',
  role: 'ADMIN',
  status: 'ACTIVE',
  displayName: 'Nguyễn Quản Trị',
};

const MOCK_TEACHERS: TeacherDto[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'teacher.lan@lingora.edu.vn',
    displayName: 'Nguyễn Thị Lan',
    role: 'TEACHER',
    status: 'ACTIVE',
    createdAt: '2026-10-28T08:00:00.000Z',
    activatedAt: '2026-10-28T09:00:00.000Z',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    email: 'teacher.minh@lingora.edu.vn',
    displayName: 'Trần Văn Minh',
    role: 'TEACHER',
    status: 'DISABLED',
    createdAt: '2026-10-27T10:00:00.000Z',
    activatedAt: '2026-10-27T11:00:00.000Z',
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    email: 'teacher.hoa@lingora.edu.vn',
    displayName: 'Lê Thị Hoa',
    role: 'TEACHER',
    status: 'PENDING',
    createdAt: '2026-10-29T14:00:00.000Z',
    activatedAt: null,
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    email: null,
    displayName: 'Giáo viên Chưa Xác Thực',
    role: 'TEACHER',
    status: 'ACTIVE',
    createdAt: '2026-10-26T14:00:00.000Z',
    activatedAt: null,
  },
];

const MOCK_LANGUAGES: LanguageDto[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    code: 'de',
    names: { vi: 'Tiếng Đức', en: 'German' },
    isLearnable: true,
    isUiLocale: false,
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    code: 'en',
    names: { vi: 'Tiếng Anh', en: 'English' },
    isLearnable: true,
    isUiLocale: true,
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    code: 'fr',
    names: { vi: 'Tiếng Pháp', en: 'French' },
    isLearnable: true,
    isUiLocale: false,
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    code: 'ja',
    names: { vi: 'Tiếng Nhật', en: 'Japanese' },
    isLearnable: true,
    isUiLocale: false,
  },
  {
    id: '55555555-5555-4555-8555-555555555555',
    code: 'ko',
    names: { vi: 'Tiếng Hàn', en: 'Korean' },
    isLearnable: true,
    isUiLocale: false,
  },
  {
    id: '66666666-6666-4666-8666-666666666666',
    code: 'vi',
    names: { vi: 'Tiếng Việt', en: 'Vietnamese' },
    isLearnable: true,
    isUiLocale: true,
  },
  {
    id: '77777777-7777-4777-8777-777777777777',
    code: 'zh-cn',
    names: { vi: 'Tiếng Trung (Giản thể)', en: 'Chinese (Simplified)' },
    isLearnable: true,
    isUiLocale: false,
  },
];

const MOCK_FRAMEWORKS: FrameworkDto[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    code: 'CEFR',
    version: '2020',
    names: { vi: 'Khung Tham chiếu Châu Âu', en: 'Common European Framework' },
    levelCount: 4,
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    code: 'ACTFL',
    version: '2024',
    names: { vi: 'Khung Năng lực ACTFL', en: 'ACTFL Proficiency Guidelines' },
    levelCount: 0,
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    code: 'HSK',
    version: '3.0',
    names: { vi: 'Chuẩn Năng lực Hán ngữ HSK' },
    levelCount: 0,
  },
  {
    id: '44444444-4444-4444-8444-444444444404',
    code: 'ILR',
    version: '2023',
    names: { vi: 'Thang đo ILR' },
    levelCount: 0,
  },
];

const MOCK_LEVELS: LevelDto[] = [
  {
    id: 'aaaa1111-1111-4111-8111-111111111111',
    frameworkId: '11111111-1111-4111-8111-111111111111',
    code: 'A1',
    label: { vi: 'Mới bắt đầu A1', en: 'Breakthrough' },
    position: 1,
  },
  {
    id: 'aaaa2222-2222-4222-8222-222222222222',
    frameworkId: '11111111-1111-4111-8111-111111111111',
    code: 'A2',
    label: { vi: 'Sơ cấp A2', en: 'Waystage' },
    position: 2,
  },
  {
    id: 'aaaa3333-3333-4333-8333-333333333333',
    frameworkId: '11111111-1111-4111-8111-111111111111',
    code: 'B1',
    label: { vi: 'Trung cấp B1', en: 'Threshold' },
    position: 3,
  },
  {
    id: 'aaaa4444-4444-4444-8444-444444444444',
    frameworkId: '11111111-1111-4111-8111-111111111111',
    code: 'B2',
    label: { vi: 'Trung cao cấp B2', en: 'Vantage' },
    position: 4,
  },
  {
    id: 'aaaa5555-5555-4555-8555-555555555404',
    frameworkId: '11111111-1111-4111-8111-111111111111',
    code: 'C2',
    label: { vi: 'Thành thạo C2', en: 'Mastery' },
    position: 6,
  },
];

const MOCK_COURSES: CourseDto[] = [
  {
    id: '33333333-3333-4333-8333-333333333030',
    languageId: '22222222-2222-4222-8222-222222222222',
    frameworkId: '11111111-1111-4111-8111-111111111111',
    defaultStartLevelId: 'aaaa1111-1111-4111-8111-111111111111',
    names: { vi: 'Tiếng Anh Giao Tiếp', en: 'Conversational English' },
    isActive: true,
    curriculumGeneration: 1,
    unitCount: 2,
    language: { id: '22222222-2222-4222-8222-222222222222', code: 'en', names: { vi: 'Tiếng Anh', en: 'English' } },
    framework: { id: '11111111-1111-4111-8111-111111111111', code: 'CEFR', version: '2020', names: { vi: 'Khung Châu Âu' } },
    defaultStartLevel: { id: 'aaaa1111-1111-4111-8111-111111111111', code: 'A1', label: { vi: 'Mới bắt đầu' }, position: 1 },
  },
  {
    id: '33333333-3333-4333-8333-333333333031',
    languageId: '66666666-6666-4666-8666-666666666666',
    frameworkId: '11111111-1111-4111-8111-111111111111',
    defaultStartLevelId: 'aaaa1111-1111-4111-8111-111111111111',
    names: { vi: 'Tiếng Việt cho người nước ngoài', en: 'Vietnamese for Expats' },
    isActive: false,
    curriculumGeneration: 1,
    unitCount: 0,
    language: { id: '66666666-6666-4666-8666-666666666666', code: 'vi', names: { vi: 'Tiếng Việt' } },
    framework: { id: '11111111-1111-4111-8111-111111111111', code: 'CEFR', version: '2020', names: { vi: 'Khung Châu Âu' } },
    defaultStartLevel: { id: 'aaaa1111-1111-4111-8111-111111111111', code: 'A1', label: { vi: 'Mới bắt đầu' }, position: 1 },
  },
];

const MOCK_UNITS: UnitDto[] = [
  {
    id: '44444444-4444-4444-8444-444444444040',
    courseId: '33333333-3333-4333-8333-333333333030',
    levelId: 'aaaa1111-1111-4111-8111-111111111111',
    code: 'UNIT-01',
    names: { vi: 'Bài 1: Làm quen', en: 'Unit 1: Introductions' },
    position: 1,
    level: { id: 'aaaa1111-1111-4111-8111-111111111111', code: 'A1', label: { vi: 'Mới bắt đầu' }, position: 1 },
  },
  {
    id: '44444444-4444-4444-8444-444444444041',
    courseId: '33333333-3333-4333-8333-333333333030',
    levelId: 'aaaa1111-1111-4111-8111-111111111111',
    code: 'UNIT-02',
    names: { vi: 'Bài 2: Gia đình và bạn bè', en: 'Unit 2: Family & Friends' },
    position: 2,
    level: { id: 'aaaa1111-1111-4111-8111-111111111111', code: 'A1', label: { vi: 'Mới bắt đầu' }, position: 1 },
  },
];

const MOCK_TEACHER_ACCOUNT = {
  id: '11111111-1111-4111-8111-111111111111',
  role: 'TEACHER',
  status: 'ACTIVE',
  displayName: 'Nguyễn Thị Lan',
};

const MOCK_TEACHER_OPTIONS: TeacherOptionDto[] = [
  { id: '11111111-1111-4111-8111-111111111111', displayName: 'Nguyễn Thị Lan' },
  { id: '22222222-2222-4222-8222-222222222222', displayName: 'Trần Văn Minh' },
];

const MOCK_LESSONS: LessonSummaryDto[] = [
  {
    id: '55555555-5555-5555-8555-555555555001',
    unitId: '44444444-4444-4444-8444-444444444040',
    position: 1,
    isRequired: true,
    availability: 'PLANNED',
    rowVersion: '1',
    courseContext: {
      id: '33333333-3333-4333-8333-333333333030',
      names: { vi: 'Tiếng Anh Chuẩn', en: 'Core English' },
    },
    unitContext: {
      id: '44444444-4444-4444-8444-444444444040',
      code: 'UNIT-01',
      names: { vi: 'Bài 1: Làm quen' },
    },
    assignment: {
      id: '66666666-6666-6666-8666-666666666001',
      currentTeacher: {
        id: '11111111-1111-4111-8111-111111111111',
        displayName: 'Nguyễn Thị Lan',
        status: 'ACTIVE',
      },
      generation: '1',
    },
    highestRevision: null,
    isEditable: true,
    editabilityReason: null,
  },
  {
    id: '55555555-5555-5555-8555-555555555002',
    unitId: '44444444-4444-4444-8444-444444444040',
    position: 2,
    isRequired: false,
    availability: 'PLANNED',
    rowVersion: '2',
    courseContext: {
      id: '33333333-3333-4333-8333-333333333030',
      names: { vi: 'Tiếng Anh Chuẩn', en: 'Core English' },
    },
    unitContext: {
      id: '44444444-4444-4444-8444-444444444040',
      code: 'UNIT-01',
      names: { vi: 'Bài 1: Làm quen' },
    },
    assignment: {
      id: '66666666-6666-6666-8666-666666666002',
      currentTeacher: {
        id: '22222222-2222-4222-8222-222222222222',
        displayName: 'Trần Văn Minh',
        status: 'DISABLED',
      },
      generation: '2',
    },
    highestRevision: {
      id: '77777777-7777-7777-8777-777777777001',
      revisionNo: 1,
      author: {
        id: '22222222-2222-4222-8222-222222222222',
        displayName: 'Trần Văn Minh',
      },
      createdAt: '2026-10-30T10:00:00.000Z',
      changeSummary: 'Khởi tạo bài 2',
      status: 'DRAFT',
    },
    isEditable: false,
    editabilityReason: 'Tài khoản giáo viên đã bị vô hiệu hóa.',
  },
];

const MOCK_LESSON_DETAIL: LessonDetailDto = {
  ...MOCK_LESSONS[0],
  currentDraft: {
    title: { vi: 'Chào hỏi cơ bản', en: 'Basic Greetings' },
    contentBlocks: [
      { type: 'paragraph', text: 'Chào buổi sáng, các em!' },
      { type: 'paragraph', text: 'Hôm nay chúng ta sẽ học cách chào hỏi.' },
    ],
  },
  revisions: [
    {
      id: '77777777-7777-7777-8777-777777777001',
      revisionNo: 1,
      author: {
        id: '11111111-1111-4111-8111-111111111111',
        displayName: 'Nguyễn Thị Lan',
      },
      createdAt: '2026-10-30T09:00:00.000Z',
      changeSummary: 'Bản thảo ban đầu',
      status: 'DRAFT',
    },
  ],
};

function IsolatedHarnessApp() {
  const params = new URLSearchParams(window.location.search);
  const state = params.get('state') || 'populated-table';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (state === 'draft-recovery') {
      const existing = loadDraft(MOCK_ADMIN.id);
      if (!existing) {
        saveDraft(MOCK_ADMIN.id, {
          mode: 'create',
          code: 'es',
          vi: 'Tiếng Tây Ban Nha',
          en: 'Spanish',
          isLearnable: true,
          isUiLocale: false,
        });
      }
    }
  }, [state]);

  if (!mounted) return null;

  if (state === 'teacher-holding') {
    return (
      <TeacherHoldingView
        displayName="Trần Thị Giáo Viên"
        accountId="00000000-0000-4000-8000-000000000002"
      />
    );
  }

  if (state === 'access-denied') {
    return (
      <AccessDeniedView
        message="Tài khoản của bạn không có quyền truy cập vào phân hệ Quản lý ngôn ngữ."
      />
    );
  }

  if (state === 'service-unavailable') {
    return (
      <ServiceUnavailableView
        message="Cơ sở dữ liệu tạm thời không phản hồi. Vui lòng thử lại sau ít phút."
      />
    );
  }

  if (state === 'delete-blocked') {
    return (
      <AppShell account={MOCK_ADMIN}>
        <LanguagesCatalog
          initialLanguages={MOCK_LANGUAGES}
          account={MOCK_ADMIN}
        />
        <DeleteBlockedModal
          isOpen={true}
          blockedLanguage={MOCK_LANGUAGES[1]} // en
          onClose={() => {}}
        />
      </AppShell>
    );
  }

  if (state === 'session-lost') {
    return (
      <AppShell account={MOCK_ADMIN}>
        <LanguagesCatalog
          initialLanguages={MOCK_LANGUAGES}
          account={MOCK_ADMIN}
        />
        <SessionLostModal
          isOpen={true}
          hasSavedDraft={true}
        />
      </AppShell>
    );
  }

  if (state === 'table-loading') {
    return (
      <AppShell account={MOCK_ADMIN}>
        <LanguagesCatalog
          isLoading={true}
          account={MOCK_ADMIN}
        />
      </AppShell>
    );
  }

  if (state === 'table-fetch-error') {
    return (
      <AppShell account={MOCK_ADMIN}>
        <LanguagesCatalog
          initialError="Không thể kết nối đến máy chủ Lingora (503 Service Unavailable)."
          account={MOCK_ADMIN}
        />
      </AppShell>
    );
  }

  if (state === 'table-empty') {
    return (
      <AppShell account={MOCK_ADMIN}>
        <LanguagesCatalog
          initialLanguages={[]}
          account={MOCK_ADMIN}
        />
      </AppShell>
    );
  }

  // --- Slice 2 Frameworks States ---
  if (state === 'frameworks-populated') {
    return (
      <AppShell account={MOCK_ADMIN}>
        <FrameworksCatalog
          initialFrameworks={MOCK_FRAMEWORKS}
          account={MOCK_ADMIN}
        />
      </AppShell>
    );
  }

  if (state === 'frameworks-loading') {
    return (
      <AppShell account={MOCK_ADMIN}>
        <FrameworksCatalog
          isLoading={true}
          account={MOCK_ADMIN}
        />
      </AppShell>
    );
  }

  if (state === 'frameworks-fetch-error') {
    return (
      <AppShell account={MOCK_ADMIN}>
        <FrameworksCatalog
          initialError="Không thể kết nối đến máy chủ Lingora (503 Service Unavailable)."
          account={MOCK_ADMIN}
        />
      </AppShell>
    );
  }

  if (state === 'frameworks-empty') {
    return (
      <AppShell account={MOCK_ADMIN}>
        <FrameworksCatalog
          initialFrameworks={[]}
          account={MOCK_ADMIN}
        />
      </AppShell>
    );
  }

  // --- Slice 2 Levels States ---
  if (state === 'levels-populated') {
    return (
      <AppShell account={MOCK_ADMIN}>
        <LevelsCatalog
          framework={MOCK_FRAMEWORKS[0]}
          initialLevels={MOCK_LEVELS}
          account={MOCK_ADMIN}
        />
      </AppShell>
    );
  }

  if (state === 'levels-loading') {
    return (
      <AppShell account={MOCK_ADMIN}>
        <LevelsCatalog
          framework={MOCK_FRAMEWORKS[0]}
          isLoading={true}
          account={MOCK_ADMIN}
        />
      </AppShell>
    );
  }

  if (state === 'levels-fetch-error') {
    return (
      <AppShell account={MOCK_ADMIN}>
        <LevelsCatalog
          framework={MOCK_FRAMEWORKS[0]}
          initialError="Không thể kết nối đến máy chủ Lingora (503 Service Unavailable)."
          account={MOCK_ADMIN}
        />
      </AppShell>
    );
  }

  if (state === 'levels-empty') {
    return (
      <AppShell account={MOCK_ADMIN}>
        <LevelsCatalog
          framework={MOCK_FRAMEWORKS[0]}
          initialLevels={[]}
          account={MOCK_ADMIN}
        />
      </AppShell>
    );
  }

  if (state === 'page-framework-detail-wire') {
    const pageProps = (typeof window !== 'undefined' ? (window as any).__PAGE_PROPS__ : null) || {};
    return (
      <AppShell account={pageProps.account || MOCK_ADMIN}>
        <LevelsCatalog
          framework={pageProps.framework || MOCK_FRAMEWORKS[0]}
          initialLevels={pageProps.initialLevels || []}
          initialError={pageProps.initialError}
          account={pageProps.account || MOCK_ADMIN}
        />
      </AppShell>
    );
  }

  if (state === 'page-frameworks-wire') {
    const pageProps = (typeof window !== 'undefined' ? (window as any).__PAGE_PROPS__ : null) || {};
    return (
      <AppShell account={pageProps.account || MOCK_ADMIN}>
        <FrameworksCatalog
          initialFrameworks={pageProps.initialFrameworks || []}
          initialError={pageProps.initialError}
          account={pageProps.account || MOCK_ADMIN}
        />
      </AppShell>
    );
  }

  // --- Slice 3 Courses States ---
  if (state === 'courses-populated') {
    return (
      <AppShell account={MOCK_ADMIN}>
        <CoursesCatalog
          initialCourses={MOCK_COURSES}
          languages={MOCK_LANGUAGES}
          frameworks={MOCK_FRAMEWORKS}
          account={MOCK_ADMIN}
        />
      </AppShell>
    );
  }

  if (state === 'courses-unloaded-options') {
    return (
      <AppShell account={MOCK_ADMIN}>
        <CoursesCatalog
          initialCourses={MOCK_COURSES}
          account={MOCK_ADMIN}
        />
      </AppShell>
    );
  }

  if (state === 'courses-loading') {
    return (
      <AppShell account={MOCK_ADMIN}>
        <CoursesCatalog
          isLoading={true}
          languages={MOCK_LANGUAGES}
          frameworks={MOCK_FRAMEWORKS}
          account={MOCK_ADMIN}
        />
      </AppShell>
    );
  }

  if (state === 'courses-fetch-error') {
    return (
      <AppShell account={MOCK_ADMIN}>
        <CoursesCatalog
          initialError="Không thể kết nối đến máy chủ Lingora (503 Service Unavailable)."
          languages={MOCK_LANGUAGES}
          frameworks={MOCK_FRAMEWORKS}
          account={MOCK_ADMIN}
        />
      </AppShell>
    );
  }

  if (state === 'courses-empty') {
    return (
      <AppShell account={MOCK_ADMIN}>
        <CoursesCatalog
          initialCourses={[]}
          languages={MOCK_LANGUAGES}
          frameworks={MOCK_FRAMEWORKS}
          account={MOCK_ADMIN}
        />
      </AppShell>
    );
  }

  // --- Slice 3 Units States ---
  if (state === 'units-populated') {
    return (
      <AppShell account={MOCK_ADMIN}>
        <UnitsCatalog
          course={MOCK_COURSES[0]}
          frameworkLevels={MOCK_LEVELS}
          initialUnits={MOCK_UNITS}
          account={MOCK_ADMIN}
        />
      </AppShell>
    );
  }

  if (state === 'units-loading') {
    return (
      <AppShell account={MOCK_ADMIN}>
        <UnitsCatalog
          course={MOCK_COURSES[0]}
          frameworkLevels={MOCK_LEVELS}
          isLoading={true}
          account={MOCK_ADMIN}
        />
      </AppShell>
    );
  }

  if (state === 'units-fetch-error') {
    return (
      <AppShell account={MOCK_ADMIN}>
        <UnitsCatalog
          course={MOCK_COURSES[0]}
          frameworkLevels={MOCK_LEVELS}
          initialError="Không thể kết nối đến máy chủ Lingora (503 Service Unavailable)."
          account={MOCK_ADMIN}
        />
      </AppShell>
    );
  }

  if (state === 'units-empty') {
    return (
      <AppShell account={MOCK_ADMIN}>
        <UnitsCatalog
          course={MOCK_COURSES[0]}
          frameworkLevels={MOCK_LEVELS}
          initialUnits={[]}
          account={MOCK_ADMIN}
        />
      </AppShell>
    );
  }

  if (state === 'page-course-detail-wire') {
    const pageProps = (typeof window !== 'undefined' ? (window as any).__PAGE_PROPS__ : null) || {};
    return (
      <AppShell account={pageProps.account}>
        <UnitsCatalog
          course={pageProps.course}
          frameworkLevels={pageProps.frameworkLevels}
          initialUnits={pageProps.initialUnits}
          initialError={pageProps.initialError}
          initialLevelsError={pageProps.initialLevelsError}
          account={pageProps.account}
        />
      </AppShell>
    );
  }

  if (state === 'page-courses-wire') {
    const pageProps = (typeof window !== 'undefined' ? (window as any).__PAGE_PROPS__ : null) || {};
    return (
      <AppShell account={pageProps.account || MOCK_ADMIN}>
        <CoursesCatalog
          initialCourses={pageProps.initialCourses || []}
          languages={pageProps.languages || MOCK_LANGUAGES}
          frameworks={pageProps.frameworks || MOCK_FRAMEWORKS}
          initialError={pageProps.initialError}
          account={pageProps.account || MOCK_ADMIN}
        />
      </AppShell>
    );
  }

  if (state === 'teacher-activation') return <ActivateTeacherPage />;

  // --- Slice 4 Teachers States ---
  if (state === 'teachers-populated') {
    return (
      <AppShell account={MOCK_ADMIN}>
        <TeachersCatalog
          initialTeachers={MOCK_TEACHERS}
          account={MOCK_ADMIN}
        />
      </AppShell>
    );
  }

  if (state === 'teachers-empty') {
    return (
      <AppShell account={MOCK_ADMIN}>
        <TeachersCatalog
          initialTeachers={[]}
          account={MOCK_ADMIN}
        />
      </AppShell>
    );
  }

  if (state === 'teachers-fetch-error') {
    return (
      <AppShell account={MOCK_ADMIN}>
        <TeachersCatalog
          initialTeachers={[]}
          initialError="Không thể kết nối đến máy chủ Lingora (503 Service Unavailable)."
          account={MOCK_ADMIN}
        />
      </AppShell>
    );
  }

  if (state === 'page-teachers-wire') {
    const pageProps = (window as any).__PAGE_PROPS__;
    if (!pageProps?.account || !Array.isArray(pageProps.initialTeachers)) throw new Error('Missing production TeachersPage props');
    return <AppShell account={pageProps.account}><TeachersCatalog {...pageProps} /></AppShell>;
  }

  // --- Slice 5 Lessons States ---
  if (state === 'lessons-populated') {
    return (
      <AppShell account={MOCK_ADMIN}>
        <LessonsCatalog
          course={MOCK_COURSES[0]}
          unit={MOCK_UNITS[0]}
          initialLessons={MOCK_LESSONS}
          teacherOptions={MOCK_TEACHER_OPTIONS}
          account={MOCK_ADMIN}
        />
      </AppShell>
    );
  }

  if (state === 'lessons-empty') {
    return (
      <AppShell account={MOCK_ADMIN}>
        <LessonsCatalog
          course={MOCK_COURSES[0]}
          unit={MOCK_UNITS[0]}
          initialLessons={[]}
          teacherOptions={MOCK_TEACHER_OPTIONS}
          account={MOCK_ADMIN}
        />
      </AppShell>
    );
  }

  if (state === 'page-unit-lessons-wire') {
    const pageProps = (window as any).__PAGE_PROPS__;
    if (!pageProps?.account || !pageProps.course || !pageProps.unit) {
      throw new Error('Missing production UnitLessonsPage props');
    }
    return (
      <AppShell account={pageProps.account}>
        <LessonsCatalog {...pageProps} />
      </AppShell>
    );
  }

  if (state === 'teacher-lessons-populated') {
    return (
      <AppShell account={MOCK_TEACHER_ACCOUNT}>
        <TeacherLessonsCatalog
          initialLessons={MOCK_LESSONS}
          account={MOCK_TEACHER_ACCOUNT}
        />
      </AppShell>
    );
  }

  if (state === 'page-teacher-lessons-wire') {
    const pageProps = (window as any).__PAGE_PROPS__;
    if (!pageProps?.account) throw new Error('Missing production TeacherLessonsPage props');
    return (
      <AppShell account={pageProps.account}>
        <TeacherLessonsCatalog {...pageProps} />
      </AppShell>
    );
  }

  if (state === 'teacher-draft-editor') {
    return (
      <AppShell account={MOCK_TEACHER_ACCOUNT}>
        <LessonDraftEditor
          initialLesson={MOCK_LESSON_DETAIL}
          account={MOCK_TEACHER_ACCOUNT}
        />
      </AppShell>
    );
  }

  if (state === 'page-teacher-draft-wire') {
    const pageProps = (window as any).__PAGE_PROPS__;
    if (!pageProps?.account || !pageProps.initialLesson) {
      throw new Error('Missing production TeacherLessonDetailPage props');
    }
    return (
      <AppShell account={pageProps.account}>
        <LessonDraftEditor {...pageProps} />
      </AppShell>
    );
  }

  if (state === 'page-review-detail-wire' || state === 'page-review-approved-detail-wire') {
    const pageProps = (window as any).__PAGE_PROPS__;
    if (!pageProps?.account || !pageProps.initialDetail) {
      throw new Error('Missing production ReviewDetailPage props');
    }
    return (
      <AppShell account={pageProps.account}>
        <ReviewDetailView {...pageProps} />
      </AppShell>
    );
  }

  if (state === 'page-review-queue-wire') {
    const pageProps = (window as any).__PAGE_PROPS__;
    if (!pageProps?.account || !Array.isArray(pageProps.initialQueue)) {
      throw new Error('Missing production ReviewQueuePage props');
    }
    return (
      <AppShell account={pageProps.account}>
        <ReviewQueueCatalog {...pageProps} />
      </AppShell>
    );
  }

  if (state === 'assessment-catalog-test') {
    return <AppShell account={MOCK_ADMIN}><AssessmentCatalog /></AppShell>;
  }

  // Default: populated languages catalogue
  return (
    <AppShell account={MOCK_ADMIN}>
      <LanguagesCatalog
        initialLanguages={MOCK_LANGUAGES}
        account={MOCK_ADMIN}
      />
    </AppShell>
  );
}

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(<IsolatedHarnessApp />);
}
