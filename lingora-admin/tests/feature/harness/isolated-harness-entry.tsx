import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AppShell } from '../../../src/components/AppShell';
import { LanguagesCatalog } from '../../../src/components/LanguagesCatalog';
import { FrameworksCatalog } from '../../../src/components/FrameworksCatalog';
import { LevelsCatalog } from '../../../src/components/LevelsCatalog';
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

const MOCK_ADMIN = {
  id: '00000000-0000-4000-8000-000000000001',
  role: 'ADMIN',
  status: 'ACTIVE',
  displayName: 'Nguyễn Quản Trị',
};

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
