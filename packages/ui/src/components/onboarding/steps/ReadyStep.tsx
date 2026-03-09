/**
 * ReadyStep — final onboarding step: summary and "Start chatting" CTA.
 */

import React from 'react';

export interface ReadyStepProps {
  name: string;
  onComplete: () => void;
}

const FEATURE_HIGHLIGHTS = [
  {
    title: 'Persistent memory across sessions',
    description: 'I remember what we talked about, even after you close the app.',
  },
  {
    title: 'Organize work into workspaces',
    description: 'Keep different projects separate with their own context and settings.',
  },
  {
    title: 'Your data stays on your machine',
    description: 'Everything is stored locally in .mind files you control.',
  },
];

export function ReadyStep({ name, onComplete }: ReadyStepProps) {
  return (
    <div className="ready-step flex flex-col items-center gap-6 p-8">
      <h2 className="text-2xl font-semibold text-gray-100">
        All set{name ? `, ${name}` : ''}! I'll remember everything we talk about.
      </h2>

      {/* Feature highlight cards */}
      <div className="flex w-full max-w-lg flex-col gap-3">
        {FEATURE_HIGHLIGHTS.map((feature) => (
          <div
            key={feature.title}
            className="rounded-lg border border-gray-700 bg-gray-800/50 p-4"
          >
            <h3 className="text-sm font-medium text-gray-100">{feature.title}</h3>
            <p className="mt-1 text-xs text-gray-400">{feature.description}</p>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onComplete}
        className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-500"
      >
        Start chatting &rarr;
      </button>
    </div>
  );
}
