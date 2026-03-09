export { OnboardingWizard } from './OnboardingWizard.js';
export type { OnboardingWizardProps } from './OnboardingWizard.js';

export { NameStep } from './steps/NameStep.js';
export type { NameStepProps } from './steps/NameStep.js';

export { ApiKeyStep } from './steps/ApiKeyStep.js';
export type { ApiKeyStepProps } from './steps/ApiKeyStep.js';

export { WorkspaceStep } from './steps/WorkspaceStep.js';
export type { WorkspaceStepProps } from './steps/WorkspaceStep.js';

export { ReadyStep } from './steps/ReadyStep.js';
export type { ReadyStepProps } from './steps/ReadyStep.js';

export {
  validateName,
  getProviderSignupUrl,
  ONBOARDING_STEPS,
  isStepComplete,
  getNextStep,
  getPrevStep,
  buildConfigFromOnboarding,
} from './utils.js';
export type { OnboardingData, OnboardingStepConfig } from './utils.js';

export { SplashScreen } from './SplashScreen.js';
export type { SplashScreenProps } from './SplashScreen.js';

export {
  STARTUP_PHASES,
  getPhaseMessage,
  getPhaseProgress,
  isStartupComplete,
  formatProgress,
} from './splash-utils.js';
export type { StartupPhaseConfig } from './splash-utils.js';
