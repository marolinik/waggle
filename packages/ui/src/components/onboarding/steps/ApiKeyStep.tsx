/**
 * ApiKeyStep — second onboarding step: configure at least one API key.
 */

import { useState } from 'react';
import { getProviderSignupUrl } from '../utils.js';

export interface ApiKeyStepProps {
  providers: Record<string, { apiKey: string; valid: boolean }>;
  onChange: (providers: Record<string, { apiKey: string; valid: boolean }>) => void;
  onTestApiKey?: (provider: string, key: string) => Promise<{ valid: boolean; error?: string }>;
  onContinue: () => void;
}

const PROVIDER_OPTIONS = [
  { id: 'anthropic', label: 'Anthropic' },
  { id: 'openai', label: 'OpenAI' },
  { id: 'google', label: 'Google' },
  { id: 'other', label: 'Other' },
];

export function ApiKeyStep({ providers, onChange, onTestApiKey, onContinue }: ApiKeyStepProps) {
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [keyInput, setKeyInput] = useState('');
  const [testing, setTesting] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  const hasValidProvider = Object.values(providers).some((p) => p.valid);

  const handleSelectProvider = (id: string) => {
    setActiveProvider(id);
    setKeyInput(providers[id]?.apiKey ?? '');
    setTestError(null);
  };

  const handleTestConnection = async () => {
    if (!activeProvider || !keyInput.trim()) return;

    if (onTestApiKey) {
      setTesting(true);
      setTestError(null);
      try {
        const result = await onTestApiKey(activeProvider, keyInput.trim());
        onChange({
          ...providers,
          [activeProvider]: { apiKey: keyInput.trim(), valid: result.valid },
        });
        if (!result.valid) {
          setTestError(result.error ?? 'Invalid API key');
        }
      } catch {
        setTestError('Connection test failed');
        onChange({
          ...providers,
          [activeProvider]: { apiKey: keyInput.trim(), valid: false },
        });
      } finally {
        setTesting(false);
      }
    }
  };

  return (
    <div className="api-key-step flex flex-col items-center gap-6 p-8">
      <h2 className="text-2xl font-semibold text-foreground">
        To talk to AI models, I need at least one API key.
      </h2>

      {/* Provider cards */}
      <div className="flex flex-wrap justify-center gap-3">
        {PROVIDER_OPTIONS.map((p) => {
          const isValid = providers[p.id]?.valid;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelectProvider(p.id)}
              className={`rounded-lg border px-5 py-3 text-sm font-medium transition-colors ${
                activeProvider === p.id
                  ? 'border-primary bg-primary/10 text-primary/70'
                  : isValid
                    ? 'border-green-500 bg-green-900/20 text-green-300'
                    : 'border-border bg-card text-muted-foreground hover:border-border'
              }`}
            >
              {p.label} {isValid && '\u2713'}
            </button>
          );
        })}
      </div>

      {/* Key input (shown when a provider is selected) */}
      {activeProvider && (
        <div className="flex w-full max-w-md flex-col gap-3">
          <input
            type="password"
            value={keyInput}
            onChange={(e) => { setKeyInput(e.target.value); setTestError(null); }}
            className="w-full rounded-lg bg-card px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
            placeholder="Paste your API key here"
            autoFocus
          />

          <div className="flex items-center gap-3">
            {onTestApiKey ? (
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={!keyInput.trim() || testing}
                className="rounded bg-secondary px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </button>
            ) : (
              <span className="text-xs text-yellow-400">Key validation unavailable</span>
            )}

            <a
              href={getProviderSignupUrl(activeProvider)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:text-primary/70"
            >
              Don&apos;t have one?
            </a>
          </div>

          {testError && <p className="text-xs text-red-400">{testError}</p>}
          {providers[activeProvider]?.valid && (
            <p className="text-xs text-green-400">Connected successfully!</p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onContinue}
        disabled={!hasValidProvider}
        className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-40"
      >
        Continue &rarr;
      </button>
    </div>
  );
}
