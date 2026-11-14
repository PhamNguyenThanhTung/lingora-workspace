import React from 'react';
import { createRoot } from 'react-dom/client';
import { OnboardingWizardView } from '../../../src/app/onboarding/OnboardingWizardView';
import type { LearnerDto } from '../../../src/server/context/dto.ts';

const learner: LearnerDto = {
  id: '33333333-3333-4333-8333-333333333333',
  displayName: 'Test Onboarding Learner',
  role: 'LEARNER',
  status: 'ACTIVE',
  uiLocale: 'vi',
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<OnboardingWizardView learner={learner} />);
}
