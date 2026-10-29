import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AppShell } from '../../../src/components/AppShell';
import { LanguagesCatalog } from '../../../src/components/LanguagesCatalog';
import { TeacherHoldingView } from '../../../src/app/holding/TeacherHoldingView';
import { AccessDeniedView } from '../../../src/components/AccessDeniedView';
import { ServiceUnavailableView } from '../../../src/components/ServiceUnavailableView';
import { DeleteBlockedModal } from '../../../src/components/DeleteBlockedModal';
import { SessionLostModal } from '../../../src/components/SessionLostModal';
import { saveDraft, loadDraft, clearAllDrafts } from '../../../src/components/draftStorage';
import type { LanguageDto } from '../../../src/server/languages';

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

  // Default: populated catalogue
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
