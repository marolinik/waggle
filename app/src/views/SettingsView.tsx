/**
 * SettingsView — Wrapper around SettingsPanel from @waggle/ui.
 */

import type { WaggleConfig } from '@waggle/ui';
import { SettingsPanel } from '@waggle/ui';

export interface SettingsViewProps {
  config: WaggleConfig | null;
  onConfigUpdate: (updates: Partial<WaggleConfig>) => void;
  onTestApiKey: (provider: string, key: string) => Promise<{ valid: boolean; error?: string }>;
}

export function SettingsView({ config, onConfigUpdate, onTestApiKey }: SettingsViewProps) {
  if (!config) {
    return (
      <div style={{ padding: 24, color: 'var(--text-dim)' }}>
        Loading settings...
      </div>
    );
  }

  return (
    <div style={{ height: '100%', overflow: 'hidden' }}>
      <SettingsPanel
        config={config}
        onConfigUpdate={onConfigUpdate}
        onTestApiKey={onTestApiKey}
      />
    </div>
  );
}
