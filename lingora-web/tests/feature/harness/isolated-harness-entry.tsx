import React from 'react';
import { createRoot } from 'react-dom/client';
import { LoginForm } from '../../../src/app/login/LoginForm';
import { HomeView } from '../../../src/app/home/HomeView';
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

function HarnessRoot() {
  const bootstrap = document.getElementById('production-page');
  if (bootstrap) {
    const page = JSON.parse(bootstrap.textContent || '{}');
    return page.kind === 'login' ? <LoginForm {...page.props} /> : <HomeView {...page.props} />;
  }
  const params = new URLSearchParams(window.location.search);
  const state = params.get('state') || 'login';

  switch (state) {
    case 'login':
      return <LoginForm />;
    case 'home-valid':
      return <HomeView data={MOCK_VALID_DATA} />;
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
    default:
      return <div>Trạng thái không xác định: {state}</div>;
  }
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<HarnessRoot />);
}
