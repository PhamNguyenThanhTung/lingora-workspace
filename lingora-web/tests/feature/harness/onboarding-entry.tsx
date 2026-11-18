import React from 'react';
import { createRoot } from 'react-dom/client';
import { OnboardingWizardView } from '../../../src/app/onboarding/OnboardingWizardView';
import type { LearnerDto, LearningContextSummaryDto } from '../../../src/server/context/dto.ts';

const learner: LearnerDto = {
  id: '33333333-3333-4333-8333-333333333333',
  displayName: 'Test Onboarding Learner',
  role: 'LEARNER',
  status: 'ACTIVE',
  uiLocale: 'vi',
};

const existingContexts: LearningContextSummaryDto[] = new URLSearchParams(window.location.search).has('owned-ja')
  ? [{
      id: 'ctx-ja-owned',
      status: 'ACTIVE',
      rowVersion: '1',
      startSource: 'DEFAULT',
      targetLanguage: { id: 'lang-ja', code: 'ja', names: { vi: 'Tiếng Nhật', en: 'Japanese' } },
      course: { id: 'course-ja', names: { vi: 'Tiếng Nhật Cơ Bản' }, isActive: true },
      framework: { id: 'fw-ja', code: 'JLPT', version: '1', names: { vi: 'JLPT' } },
      selectedStartLevel: null,
      workingLevel: null,
    }]
  : [];

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<OnboardingWizardView learner={learner} existingContexts={existingContexts} />);
}
