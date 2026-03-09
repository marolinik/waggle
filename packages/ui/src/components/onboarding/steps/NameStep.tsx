/**
 * NameStep — first onboarding step: "What should I call you?"
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
      <h2 className="text-2xl font-semibold text-gray-100">
        Hi! I'm Waggle. What should I call you?
      </h2>

      <div className="w-full max-w-sm flex flex-col gap-1">
        <input
          type="text"
          value={name}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full rounded-lg bg-gray-800 px-4 py-3 text-center text-lg text-gray-100 outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Your name"
          autoFocus
        />
        {showError && validation.error && (
          <p className="text-xs text-red-400 text-center">{validation.error}</p>
        )}
      </div>

      <button
        type="button"
        onClick={onContinue}
        disabled={!canContinue}
        className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Continue &rarr;
      </button>
    </div>
  );
}
