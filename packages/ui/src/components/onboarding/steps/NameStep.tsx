/**
 * NameStep — first onboarding step: Welcome + name.
 * Direction D: Inter for headings, amber accents, warm welcome.
 */

import React from 'react';
import { validateName } from '../utils.js';

export interface NameStepProps {
  name: string;
  onChange: (name: string) => void;
  onContinue: () => void;
}

export function NameStep({ name, onChange, onContinue }: NameStepProps) {
  const validation = validateName(name);
  const canContinue = validation.valid;
  const showError = name.length > 0 && !validation.valid;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canContinue) {
      onContinue();
    }
  };

  return (
    <div className="name-step flex flex-col items-center gap-6 p-8">
      <div className="text-center mb-2">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-primary mb-2">
          Your AI Operating System
        </div>
        <h2 className="text-2xl font-bold text-foreground -tracking-wide m-0">
          Welcome to Waggle
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          Persistent memory. Workspace-native. Built for knowledge work.
        </p>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-1">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          What should I call you?
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="bg-card border border-border rounded-[10px] px-4 py-3 text-base text-center text-foreground outline-none font-inherit transition-colors duration-200 focus:border-primary"
          placeholder="Your name"
          autoFocus
        />
        {showError && validation.error && (
          <p className="text-xs text-center text-destructive mt-1">
            {validation.error}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onContinue}
        disabled={!canContinue}
        className={`border-none rounded-[10px] px-7 py-2.5 text-sm font-semibold transition-all duration-150 ${
          canContinue
            ? 'bg-primary text-primary-foreground cursor-pointer'
            : 'bg-muted text-muted-foreground cursor-not-allowed'
        }`}
      >
        Continue &rarr;
      </button>
    </div>
  );
}
