import React from 'react';
import { createRoot } from 'react-dom/client';
import { LoginForm } from '../../../src/app/login/LoginForm';
import { HomeView } from '../../../src/app/home/HomeView';
import { CatalogueView } from '../../../src/app/learn/[contextId]/CatalogueView';
import { LessonPlayerView } from '../../../src/app/learn/[contextId]/[lessonId]/LessonPlayerView';
import { WritingPracticeModal } from '../../../src/app/learn/[contextId]/[lessonId]/WritingPracticeModal';
import { ReviewView } from '../../../src/app/review/ReviewView';
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
      levelCode: 'A2',
      requiredProgress: { requiredDone: 0, requiredTotal: 0 },
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
      levelCode: null,
      requiredProgress: { requiredDone: 0, requiredTotal: 0 },
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

function HarnessRoot() {
  const bootstrap = document.getElementById('production-page');
  if (bootstrap) {
    const page = JSON.parse(bootstrap.textContent || '{}');
    if (page.kind === 'login') return <LoginForm {...page.props} />;
    if (page.kind === 'home') return <HomeView {...page.props} />;
    if (page.kind === 'catalogue') return <CatalogueView {...page.props} />;
    if (page.kind === 'lessonPlayer') return <LessonPlayerView {...page.props} />;
    if (page.kind === 'writingPractice') return <WritingPracticeModal {...page.props} />;
    if (page.kind === 'review') return <ReviewView {...page.props} />;
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
      return <HomeView data={MOCK_VALID_DATA} />;
    case 'home-null-context':
      return <HomeView data={MOCK_NULL_CONTEXT_DATA} />;
    case 'home-empty':
      return <HomeView data={MOCK_EMPTY_DATA} />;
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
