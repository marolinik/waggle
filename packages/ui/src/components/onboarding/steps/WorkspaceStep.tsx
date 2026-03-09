/**
 * WorkspaceStep — third onboarding step: create first workspace.
 */

import React, { useState } from 'react';

export interface WorkspaceStepProps {
  workspaceName: string;
  workspaceGroup: string;
  onChangeName: (name: string) => void;
  onChangeGroup: (group: string) => void;
  onContinue: () => void;
}

const GROUP_OPTIONS = ['Work', 'Personal', 'Study', 'Custom'];

export function WorkspaceStep({
  workspaceName,
  workspaceGroup,
  onChangeName,
  onChangeGroup,
  onContinue,
}: WorkspaceStepProps) {
  const fixedGroups = ['Work', 'Personal', 'Study'];
  const isCustom = !fixedGroups.includes(workspaceGroup);
  const [customGroup, setCustomGroup] = useState(isCustom ? workspaceGroup : '');
  const canContinue = workspaceName.trim().length > 0;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canContinue) {
      onContinue();
    }
  };

  const handleGroupSelect = (group: string) => {
    if (group === 'Custom') {
      onChangeGroup(customGroup || 'Custom');
    } else {
      onChangeGroup(group);
    }
  };

  return (
    <div className="workspace-step flex flex-col items-center gap-6 p-8">
      <h2 className="text-2xl font-semibold text-gray-100">
        Let's create your first workspace.
      </h2>

      <div className="flex w-full max-w-sm flex-col gap-4">
        {/* Workspace name */}
        <div>
          <label className="mb-1 block text-sm text-gray-400" htmlFor="onboard-ws-name">
            Workspace name
          </label>
          <input
            id="onboard-ws-name"
            type="text"
            value={workspaceName}
            onChange={(e) => onChangeName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full rounded-lg bg-gray-800 px-4 py-3 text-sm text-gray-100 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Marketing"
            autoFocus
          />
        </div>

        {/* Group selector */}
        <div>
          <label className="mb-2 block text-sm text-gray-400">Group</label>
          <div className="flex flex-wrap gap-2">
            {GROUP_OPTIONS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => handleGroupSelect(g)}
                className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                  workspaceGroup === g ||
                  (g === 'Custom' && !GROUP_OPTIONS.slice(0, 3).includes(workspaceGroup))
                    ? 'border-blue-500 bg-blue-900/30 text-blue-300'
                    : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-500'
                }`}
              >
                {g === 'Custom' ? 'Custom...' : g}
              </button>
            ))}
          </div>

          {/* Custom group input */}
          {!GROUP_OPTIONS.slice(0, 3).includes(workspaceGroup) && (
            <input
              type="text"
              value={customGroup}
              onChange={(e) => {
                setCustomGroup(e.target.value);
                onChangeGroup(e.target.value || 'Custom');
              }}
              className="mt-2 w-full rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-100 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Custom group name"
            />
          )}
        </div>
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
