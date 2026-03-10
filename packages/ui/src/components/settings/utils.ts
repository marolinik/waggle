/**
 * Settings utility functions and constants.
 */

// ── Provider Definitions ────────────────────────────────────────────

export interface ProviderConfig {
  id: string;
  name: string;
  keyPrefix: string | null;
  models: string[];
}

export const SUPPORTED_PROVIDERS: ProviderConfig[] = [
  {
    id: 'anthropic',
    name: 'Anthropic',
    keyPrefix: 'sk-ant-',
    models: [
      'claude-opus-4-20250514',
      'claude-sonnet-4-20250514',
      'claude-haiku-3-20250307',
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    keyPrefix: 'sk-',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  },
  {
    id: 'google',
    name: 'Google',
    keyPrefix: null,
    models: ['gemini-2.0-flash', 'gemini-2.0-pro', 'gemini-1.5-pro'],
  },
  {
    id: 'mistral',
    name: 'Mistral',
    keyPrefix: null,
    models: ['mistral-large', 'mistral-medium', 'mistral-small'],
  },
  {
    id: 'custom',
    name: 'Custom (OpenAI-compatible)',
    keyPrefix: null,
    models: [],
  },
];

// ── Tab Definitions ─────────────────────────────────────────────────

export interface SettingsTab {
  id: string;
  label: string;
}

export const SETTINGS_TABS: SettingsTab[] = [
  { id: 'general', label: 'General' },
  { id: 'api-keys', label: 'API Keys' },
  { id: 'models', label: 'Models' },
  { id: 'skills', label: 'Skills & Plugins' },
  { id: 'permissions', label: 'Permissions' },
  { id: 'advanced', label: 'Advanced' },
];

// ── Utility Functions ───────────────────────────────────────────────

/**
 * Masks an API key, showing only the last 4 characters.
 * Keys of 4 characters or fewer are returned as-is.
 */
export function maskApiKey(key: string): string {
  if (key.length <= 4) return key;
  return '\u2022'.repeat(key.length - 4) + key.slice(-4);
}

/**
 * Returns a human-readable display name for a provider ID.
 */
export function getProviderDisplayName(provider: string): string {
  const found = SUPPORTED_PROVIDERS.find((p) => p.id === provider);
  return found ? found.name : provider;
}

/**
 * Returns the expected API key prefix for a provider, or null if none.
 */
export function getProviderKeyPrefix(provider: string): string | null {
  const found = SUPPORTED_PROVIDERS.find((p) => p.id === provider);
  return found ? found.keyPrefix : null;
}

// ── Model Classification ────────────────────────────────────────────

const COST_MAP: Record<string, '$' | '$$' | '$$$'> = {
  'claude-opus-4-20250514': '$$$',
  'gpt-4o': '$$$',
  'gpt-4-turbo': '$$$',
  'gemini-2.0-pro': '$$$',
  'mistral-large': '$$$',
  'claude-sonnet-4-20250514': '$$',
  'gpt-4o-mini': '$$',
  'gemini-2.0-flash': '$$',
  'gemini-1.5-pro': '$$',
  'mistral-medium': '$$',
  'claude-haiku-3-20250307': '$',
  'gpt-3.5-turbo': '$',
  'mistral-small': '$',
};

const SPEED_MAP: Record<string, 'fast' | 'medium' | 'slow'> = {
  'claude-opus-4-20250514': 'slow',
  'gpt-4o': 'slow',
  'gpt-4-turbo': 'slow',
  'gemini-2.0-pro': 'slow',
  'mistral-large': 'slow',
  'claude-sonnet-4-20250514': 'medium',
  'gpt-4o-mini': 'medium',
  'gemini-2.0-flash': 'medium',
  'gemini-1.5-pro': 'medium',
  'mistral-medium': 'medium',
  'claude-haiku-3-20250307': 'fast',
  'gpt-3.5-turbo': 'fast',
  'mistral-small': 'fast',
};

/**
 * Returns cost tier for a model name.
 */
export function getCostTier(model: string): '$' | '$$' | '$$$' {
  return COST_MAP[model] ?? '$$';
}

/**
 * Returns speed tier for a model name.
 */
export function getSpeedTier(model: string): 'fast' | 'medium' | 'slow' {
  return SPEED_MAP[model] ?? 'medium';
}

// ── Permission Gate Merging ─────────────────────────────────────────

/**
 * Merges global gates with optional workspace-specific gates.
 * Workspace gates extend the global set (union, deduplicated).
 */
export function mergeGates(globalGates: string[], workspaceGates?: string[]): string[] {
  if (!workspaceGates || workspaceGates.length === 0) return [...globalGates];
  const merged = new Set([...globalGates, ...workspaceGates]);
  return [...merged];
}

// ── Validation ──────────────────────────────────────────────────────

/**
 * Client-side validation for a provider API key before calling the API.
 */
export function validateProviderConfig(
  provider: string,
  apiKey: string,
): { valid: boolean; error?: string } {
  const trimmed = apiKey.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'API key cannot be empty' };
  }

  if (trimmed.length < 8) {
    return { valid: false, error: 'API key must be at least 8 characters' };
  }

  const prefix = getProviderKeyPrefix(provider);
  if (prefix && !trimmed.startsWith(prefix)) {
    return {
      valid: false,
      error: `${getProviderDisplayName(provider)} keys should start with ${prefix}`,
    };
  }

  return { valid: true };
}
