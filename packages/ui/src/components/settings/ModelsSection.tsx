/**
 * ModelsSection -- combined model selection + API key management.
 *
 * Merges content from ModelSection (default model selector, model cards) and
 * ApiKeySection (per-provider API key inputs with test connection).
 * Displayed in the "Models & Providers" settings tab.
 */

import React, { useState } from 'react';
import type { WaggleConfig } from '../../services/types.js';
import { SUPPORTED_PROVIDERS, getCostTier, getSpeedTier, validateProviderConfig } from './utils.js';

export interface ModelsSectionProps {
  config: WaggleConfig;
  onConfigUpdate: (config: Partial<WaggleConfig>) => void;
  onTestApiKey?: (provider: string, key: string) => Promise<{ valid: boolean; error?: string }>;
}

interface ProviderStatus {
  testing: boolean;
  valid?: boolean;
  error?: string;
}

export function ModelsSection({ config, onConfigUpdate, onTestApiKey }: ModelsSectionProps) {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [statuses, setStatuses] = useState<Record<string, ProviderStatus>>({});

  // Collect all available models from configured providers
  const allModels = SUPPORTED_PROVIDERS.flatMap((provider) =>
    provider.models.map((model) => ({
      name: model,
      provider: provider.id,
      providerName: provider.name,
      cost: getCostTier(model),
      speed: getSpeedTier(model),
    })),
  );

  const toggleReveal = (providerId: string) => {
    setRevealed((prev) => ({ ...prev, [providerId]: !prev[providerId] }));
  };

  const handleKeyChange = (providerId: string, apiKey: string) => {
    const providers = { ...config.providers };
    providers[providerId] = {
      ...providers[providerId],
      apiKey,
      models: providers[providerId]?.models ?? [],
    };
    onConfigUpdate({ providers });
  };

  const handleTest = async (providerId: string) => {
    const key = config.providers[providerId]?.apiKey ?? '';
    const clientValidation = validateProviderConfig(providerId, key);
    if (!clientValidation.valid) {
      setStatuses((prev) => ({
        ...prev,
        [providerId]: { testing: false, valid: false, error: clientValidation.error },
      }));
      return;
    }

    setStatuses((prev) => ({ ...prev, [providerId]: { testing: true } }));

    if (onTestApiKey) {
      const result = await onTestApiKey(providerId, key);
      setStatuses((prev) => ({
        ...prev,
        [providerId]: { testing: false, valid: result.valid, error: result.error },
      }));
    }
  };

  return (
    <div className="models-section space-y-6">
      <h2 className="text-lg font-semibold">Models & Providers</h2>

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

      {/* Model cards */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-300">Available Models</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {allModels.map((model) => (
            <div
              key={model.name}
              className={`rounded-lg border p-3 cursor-pointer transition-colors ${
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

      {/* API Keys per provider */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-300">API Keys</h3>
        <p className="text-xs text-gray-400">
          Configure API keys for your LLM providers. Keys are stored locally and never sent to Waggle servers.
        </p>

        {SUPPORTED_PROVIDERS.map((provider) => {
          const key = config.providers[provider.id]?.apiKey ?? '';
          const isRevealed = revealed[provider.id] ?? false;
          const status = statuses[provider.id];

          return (
            <div key={provider.id} className="rounded-lg border border-gray-700 p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">{provider.name}</label>
                {status && !status.testing && (
                  <span className={`text-sm ${status.valid ? 'text-green-400' : 'text-red-400'}`}>
                    {status.valid ? '\u2713 Connected' : `\u2717 ${status.error ?? 'Failed'}`}
                  </span>
                )}
                {status?.testing && (
                  <span className="text-sm text-yellow-400">Testing...</span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type={isRevealed ? 'text' : 'password'}
                  value={key}
                  onChange={(e) => handleKeyChange(provider.id, e.target.value)}
                  placeholder={`Enter ${provider.name} API key`}
                  className="flex-1 rounded bg-gray-800 px-3 py-2 text-sm text-gray-100 border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
                <button
                  onClick={() => toggleReveal(provider.id)}
                  className="rounded bg-gray-700 px-3 py-2 text-sm text-gray-300 hover:bg-gray-600"
                >
                  {isRevealed ? 'Hide' : 'Show'}
                </button>
                <button
                  onClick={() => handleTest(provider.id)}
                  disabled={!key || status?.testing}
                  className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Test
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
