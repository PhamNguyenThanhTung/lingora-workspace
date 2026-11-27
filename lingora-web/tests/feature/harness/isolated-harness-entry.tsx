import React from 'react';
import { createRoot } from 'react-dom/client';
import { LoginForm } from '../../../src/app/login/LoginForm';
import { HomeView } from '../../../src/app/home/HomeView';
import { CatalogueView } from '../../../src/app/learn/[contextId]/CatalogueView';
import { LessonPlayerView } from '../../../src/app/learn/[contextId]/[lessonId]/LessonPlayerView';
import { WritingPracticeModal } from '../../../src/app/learn/[contextId]/[lessonId]/WritingPracticeModal';
import { ReviewView } from '../../../src/app/review/ReviewView';
import { ProfileView } from '../../../src/app/profile/ProfileView';
import { QuestsView } from '../../../src/app/quests/QuestsView';
import { SectionsView } from '../../../src/app/learn/[contextId]/sections/SectionsView';
import { LearnerShell } from '../../../src/components/learner/LearnerShell';
import type { LearnerContextEnvelope } from '../../../src/server/context/dto.ts';

const MOCK_VALID_DATA: LearnerContextEnvelope['data'] = {
  learner: {
    id: '11111111-1111-4111-8111-111111111111',
    displayName: 'Nguyễn Văn Học',
    role: 'LEARNER',
    status: 'ACTIVE',
    uiLocale: 'vi',
  },
  contexts: [
    {
      id: 'ctx-1',
      status: 'ACTIVE',
      rowVersion: '1',
      startSource: 'DEFAULT',
      targetLanguage: {
        id: 'lang-1',
        code: 'en',
        names: { vi: 'Tiếng Anh', en: 'English' },
      },
      course: {
        id: 'course-1',
        names: { vi: 'Tiếng Anh Giao Tiếp Cơ Bản', en: 'Basic Conversational English' },
        isActive: true,
      },
      framework: {
        id: 'fw-1',
        code: 'CEFR',
        version: '2020',
        names: { vi: 'Khung Tham Chiếu Châu Âu', en: 'CEFR' },
      },
      selectedStartLevel: {
        id: 'lvl-1',
        code: 'A1',
        label: { vi: 'A1 Mới bắt đầu', en: 'Beginner' },
        position: 1,
      },
      workingLevel: {
        id: 'lvl-2',
        code: 'A2',
        label: { vi: 'A2 Sơ cấp', en: 'Elementary' },
        position: 2,
      },
    },
  ],
};

const MOCK_EMPTY_DATA: LearnerContextEnvelope['data'] = {
  learner: {
    id: '22222222-2222-4222-8222-222222222222',
    displayName: 'Trần Thị Mới',
    role: 'LEARNER',
    status: 'ACTIVE',
    uiLocale: 'vi',
  },
  contexts: [],
};

const MOCK_NULL_CONTEXT_DATA: LearnerContextEnvelope['data'] = {
  learner: {
    id: '11111111-1111-4111-8111-111111111111',
    displayName: 'Nguyễn Văn Học',
    role: 'LEARNER',
    status: 'ACTIVE',
    uiLocale: 'vi',
  },
  contexts: [
    {
      id: 'ctx-null-1',
      status: 'ACTIVE',
      rowVersion: '1',
      startSource: null,
      targetLanguage: {
        id: 'lang-1',
        code: 'en',
        names: { vi: 'Tiếng Anh', en: 'English' },
      },
      course: {
        id: 'course-1',
        names: { vi: 'Tiếng Anh Giao Tiếp Cơ Bản', en: 'Basic Conversational English' },
        isActive: true,
      },
      framework: {
        id: 'fw-1',
        code: 'CEFR',
        version: '2020',
        names: { vi: 'Khung Tham Chiếu Châu Âu', en: 'CEFR' },
      },
      selectedStartLevel: null,
      workingLevel: null,
    },
  ],
};

/** Minimal learner-home payload around the context-only mocks, so the shell has everything it shows. */
function homeDto(data: LearnerContextEnvelope['data']): any {
  return {
    ...data,
    selectedContextId: data.contexts[0]?.id ?? null,
    plan: null,
    continueLearning: null,
    path: [],
    pathStatus: null,
    pathMessage: null,
    reviewDue: 0,
    gamificationStatus: 'AVAILABLE',
    dailyProgress: { dailyGoalMinutes: 10, completedLessonsToday: 0, reviewsCompletedToday: 0 },
    streak: { currentStreak: 3, longestStreak: 7, activeDays: ['2026-11-26', '2026-11-27'], todayCompleted: true, today: '2026-11-27' },
    totalXp: 120,
    totalGems: 5,
    quests: [],
    recentAchievement: null,
  };
}

function jaPathData(): any {
  const base = homeDto(MOCK_VALID_DATA);
  const ctx = { ...MOCK_VALID_DATA.contexts[0], id: 'ctx-ja', targetLanguage: { id: 'lang-ja', code: 'ja', names: { vi: 'Tiếng Nhật', en: 'Japanese' } } };
  const node = (n: number, state: string, unit: number, title: string, required = true) => ({
    lessonId: `l${n}`, title, unitTitle: unit === 1 ? 'ひらがな' : 'Chào hỏi', unitPosition: unit,
    state, score: state === 'COMPLETED' ? 90 : null, position: n, isRequired: required, href: `/learn/ctx-ja/l${n}`,
  });
  const path = [
    node(1, 'COMPLETED', 1, 'Bài 1: あいうえお'),
    node(2, 'CURRENT', 1, 'Bài 2: かきくけこ'),
    node(3, 'AVAILABLE', 1, 'Bài 3: Tùy chọn', false),
    node(4, 'LOCKED', 2, 'Bài 4: こんにちは'),
    node(5, 'LOCKED', 2, 'Bài 5: ありがとう'),
  ];
  return {
    ...base,
    contexts: [ctx],
    selectedContextId: 'ctx-ja',
    path,
    pathStatus: 'READY',
    continueLearning: { lessonId: 'l2', title: 'Bài 2: かきくけこ', unitTitle: 'ひらがな', href: '/learn/ctx-ja/l2', status: 'READY' },
  };
}

function framed(data: LearnerContextEnvelope['data'], active: 'home' | 'profile', view: React.ReactNode) {
  return (
    <LearnerShell shell={homeDto(data)} active={active}>
      {view}
    </LearnerShell>
  );
}

function renderPage(page: any) {
  if (page.kind === 'login') return <LoginForm {...page.props} />;
  if (page.kind === 'home') return <HomeView {...page.props} />;
  if (page.kind === 'catalogue') return <CatalogueView {...page.props} />;
  if (page.kind === 'lessonPlayer') return <LessonPlayerView {...page.props} />;
  if (page.kind === 'writingPractice') return <WritingPracticeModal {...page.props} />;
  if (page.kind === 'review') return <ReviewView {...page.props} />;
  if (page.kind === 'profile') return <ProfileView {...page.props} />;
  if (page.kind === 'quests') return <QuestsView {...page.props} />;
  if (page.kind === 'sections') return <SectionsView {...page.props} />;
  return null;
}

function HarnessRoot() {
  const bootstrap = document.getElementById('production-page');
  if (bootstrap) {
    const page = JSON.parse(bootstrap.textContent || '{}');
    const view = renderPage(page);
    if (view) {
      return page.frame ? (
        <LearnerShell shell={page.frame.shell} active={page.frame.active} quests={page.frame.quests}>
          {view}
        </LearnerShell>
      ) : (
        view
      );
    }
  }
  const params = new URLSearchParams(window.location.search);
  const state = params.get('state') || 'login';

  switch (state) {
    case 'login':
      return <LoginForm />;
    case 'review':
      return <ReviewView learner={{ id: '11111111-1111-4111-8111-111111111111' }} />;
    case 'writing-practice':
    case 'writing-practice-animation-only':
    case 'writing-practice-guided-only':
      return (
        <WritingPracticeModal
          contextId="ctx-1"
          lessonId="lesson-1"
          expectedPublishedRevisionId="rev-1"
          character={{
            characterId: 'char-1',
            glyph: '日',
            scriptType: 'KANJI',
            strokeCount: 4,
            meaning: 'Mặt trời, ngày',
            primaryReading: 'にち (nichi)',
            romanization: 'nichi',
            showStrokeAnimation: state !== 'writing-practice-guided-only',
            guidedWriting: state !== 'writing-practice-animation-only',
          }}
          initialStrokeData={{
            strokeVersion: 1,
            strokes: [
              { index: 1, path: 'M0.2,0.2 L0.2,0.8', points: [[0.2, 0.2], [0.2, 0.5], [0.2, 0.8]] },
              { index: 2, path: 'M0.2,0.2 L0.8,0.2 L0.8,0.8', points: [[0.2, 0.2], [0.5, 0.2], [0.8, 0.2], [0.8, 0.5], [0.8, 0.8]] },
              { index: 3, path: 'M0.2,0.5 L0.8,0.5', points: [[0.2, 0.5], [0.5, 0.5], [0.8, 0.5]] },
              { index: 4, path: 'M0.2,0.8 L0.8,0.8', points: [[0.2, 0.8], [0.5, 0.8], [0.8, 0.8]] },
            ],
          }}
          onClose={() => {}}
        />
      );
    case 'home-valid':
      return framed(MOCK_VALID_DATA, 'home', <HomeView data={homeDto(MOCK_VALID_DATA)} />);
    case 'home-null-context':
      return framed(MOCK_NULL_CONTEXT_DATA, 'home', <HomeView data={homeDto(MOCK_NULL_CONTEXT_DATA)} />);
    case 'home-empty':
      return framed(MOCK_EMPTY_DATA, 'home', <HomeView data={homeDto(MOCK_EMPTY_DATA)} />);
    case 'path-ja': {
      const data = jaPathData();
      return (
        <LearnerShell shell={data} active="home">
          <HomeView data={data} />
        </LearnerShell>
      );
    }
    case 'profile-valid':
      return framed(MOCK_VALID_DATA, 'profile', <ProfileView data={homeDto(MOCK_VALID_DATA)} />);
    case 'home-403':
      return (
        <HomeView
          errorState={{
            ok: false,
            status: 403,
            error: {
              code: 'FORBIDDEN',
              message: 'Tài khoản không thuộc phân hệ học viên.',
            },
          }}
        />
      );
    case 'home-503':
      return (
        <HomeView
          errorState={{
            ok: false,
            status: 503,
            error: {
              code: 'SERVICE_UNAVAILABLE',
              message: 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.',
            },
          }}
        />
      );
    case 'home-409':
      return (
        <HomeView
          errorState={{
            ok: false,
            status: 409,
            error: {
              code: 'CONTEXT_INCONSISTENT',
              message: 'Dữ liệu lộ trình học tập không nhất quán. Vui lòng liên hệ hỗ trợ.',
            },
          }}
        />
      );
    case 'home-404':
      return (
        <HomeView
          errorState={{
            ok: false,
            status: 404,
            error: {
              code: 'NOT_FOUND',
              message: 'Lộ trình học không tồn tại.',
            },
          }}
        />
      );
    default:
      return <div>Trạng thái không xác định: {state}</div>;
  }
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  (window as any).__refreshProductionPage = (payload: unknown) => {
    const bootstrap = document.getElementById('production-page');
    if (bootstrap) bootstrap.textContent = JSON.stringify(payload);
    root.render(<HarnessRoot />);
  };
  root.render(<HarnessRoot />);
}
