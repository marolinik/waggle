/**
 * OnboardingWizard — 4-step first-run setup flow.
 *
 * Steps: Name → API Key → Workspace → Ready.
 * Manages onboarding state and delegates rendering to individual step components.
 */

import React, { useState } from 'react';
import { NameStep } from './steps/NameStep.js';
import { ApiKeyStep } from './steps/ApiKeyStep.js';
import { WorkspaceStep } from './steps/WorkspaceStep.js';
import { ReadyStep } from './steps/ReadyStep.js';
import {
  ONBOARDING_STEPS,
  getNextStep,
  getPrevStep,
  isStepComplete,
} from './utils.js';
import type { OnboardingData } from './utils.js';

export interface OnboardingWizardProps {
  /**
   * Called when the user completes all 4 onboarding steps.
   * The caller is responsible for performing setup actions:
   * - Save API keys to config (via WaggleService.updateConfig)
   * - Create the first workspace (via WaggleService.createWorkspace)
   * personal.mind creation and LiteLLM startup are handled by the agent service on first launch.
   * Use the useOnboardingSetup hook to handle these automatically.
   */
  onComplete: (data: OnboardingData) => void;
  onTestApiKey?: (provider: string, key: string) => Promise<{ valid: boolean; error?: string }>;
  initialStep?: string;
}

export function OnboardingWizard({ onComplete, onTestApiKey, initialStep }: OnboardingWizardProps) {
  const validInitialStep =
    initialStep && ONBOARDING_STEPS.some((s) => s.id === initialStep)
      ? initialStep
      : 'name';
  const [currentStep, setCurrentStep] = useState(validInitialStep);
  const [data, setData] = useState<OnboardingData>({
    name: '',
    providers: {},
    workspaceName: '',
    workspaceGroup: 'Work',
  });

  const stepIndex = ONBOARDING_STEPS.findIndex((s) => s.id === currentStep);
  const stepConfig = ONBOARDING_STEPS[stepIndex];

  const goNext = () => {
    const next = getNextStep(currentStep);
    if (next) setCurrentStep(next);
  };

  const goBack = () => {
    const prev = getPrevStep(currentStep);
    if (prev) setCurrentStep(prev);
  };

  const handleComplete = () => {
    onComplete(data);
  };

  return (
    <div className="onboarding-wizard flex min-h-screen flex-col items-center justify-center" style={{ background: 'var(--bg, #0a0a12)' }}>
      {/* Progress indicator — amber for completed steps */}
      <div className="mb-8 flex gap-2">
        {ONBOARDING_STEPS.map((step, i) => (
          <div
            key={step.id}
            className="h-2 w-8 rounded-full transition-colors"
            style={{
              background: i <= stepIndex ? 'var(--primary, #d4a843)' : 'var(--surface-3, #22222e)',
            }}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="w-full max-w-xl">
        {currentStep === 'name' && (
          <NameStep
            name={data.name}
            onChange={(name) => setData((d) => ({ ...d, name }))}
            onContinue={goNext}
          />
        )}

        {currentStep === 'apiKey' && (
          <ApiKeyStep
            providers={data.providers}
            onChange={(providers) => setData((d) => ({ ...d, providers }))}
            onTestApiKey={onTestApiKey}
            onContinue={goNext}
          />
        )}

        {currentStep === 'workspace' && (
          <WorkspaceStep
            workspaceName={data.workspaceName}
            workspaceGroup={data.workspaceGroup}
            onChangeName={(workspaceName) => setData((d) => ({ ...d, workspaceName }))}
            onChangeGroup={(workspaceGroup) => setData((d) => ({ ...d, workspaceGroup }))}
            onContinue={goNext}
          />
        )}

        {currentStep === 'ready' && (
          <ReadyStep
            name={data.name}
            onComplete={handleComplete}
          />
        )}
      </div>

      {/* Back button (hidden on first step) */}
      {stepIndex > 0 && (
        <button
          type="button"
          onClick={goBack}
          className="mt-4 text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          &larr; Back
        </button>
      )}
    </div>
  );
}
