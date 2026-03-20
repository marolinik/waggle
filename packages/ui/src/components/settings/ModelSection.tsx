/**
 * ModelSection — default model selection and model cards.
 *
 * Shows a default model dropdown and model cards with name, provider, cost tier, and speed indicator.
 */

import React from 'react';
import type { WaggleConfig } from '../../services/types.js';
import { SUPPORTED_PROVIDERS, getCostTier, getSpeedTier, getProviderDisplayName } from './utils.js';

export interface ModelSectionProps {
  config: WaggleConfig;
  onConfigUpdate: (config: Partial<WaggleConfig>) => void;
  workspaceModel?: string;
  onWorkspaceModelChange?: (model: string) => void;
}

export function ModelSection({
  config,
  onConfigUpdate,
  workspaceModel,
  onWorkspaceModelChange,
}: ModelSectionProps) {
  // Collect all available models from configured providers
  const allModels = SUPPORTED_PROVIDERS.flatMap((provider) =>
    provider.models.map((model) => ({
      name: model.id,
      displayName: model.displayName,
      provider: provider.id,
      providerName: provider.name,
      cost: getCostTier(model.id),
      speed: getSpeedTier(model.id),
    })),
  );

  return (
    <div className="model-section space-y-6">
      <h2 className="text-lg font-semibold">Models</h2>

      {/* Default model selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">Default Model</label>
        <select
          value={config.defaultModel}
          onChange={(e) => onConfigUpdate({ defaultModel: e.target.value })}
          className="w-full rounded bg-gray-800 px-3 py-2 text-sm text-gray-100 border border-gray-600 focus:border-blue-500 focus:outline-none"
        >
          {allModels.map((m) => (
            <option key={m.name} value={m.name}>
              {m.name} ({m.providerName})
            </option>
          ))}
        </select>
      </div>

      {/* Per-workspace override */}
      {onWorkspaceModelChange && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Workspace Override</label>
          <select
            value={workspaceModel ?? ''}
            onChange={(e) => onWorkspaceModelChange(e.target.value)}
            className="w-full rounded bg-gray-800 px-3 py-2 text-sm text-gray-100 border border-gray-600 focus:border-blue-500 focus:outline-none"
          >
            <option value="">Use default ({config.defaultModel})</option>
            {allModels.map((m) => (
              <option key={m.name} value={m.name}>
                {m.name} ({m.providerName})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Model cards */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-300">Available Models</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {allModels.map((model) => (
            <div
              key={model.name}
              className={`model-section__card rounded-lg border p-3 cursor-pointer transition-colors ${
                config.defaultModel === model.name
                  ? 'border-blue-500 bg-gray-800'
                  : 'border-gray-700 bg-gray-850 hover:border-gray-500'
              }`}
              onClick={() => onConfigUpdate({ defaultModel: model.name })}
            >
              <div className="text-sm font-medium text-gray-100">{model.name}</div>
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                <span>{model.providerName}</span>
                <span className="text-yellow-400">{model.cost}</span>
                <span
                  className={
                    model.speed === 'fast'
                      ? 'text-green-400'
                      : model.speed === 'slow'
                        ? 'text-red-400'
                        : 'text-yellow-400'
                  }
                >
                  {model.speed}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
