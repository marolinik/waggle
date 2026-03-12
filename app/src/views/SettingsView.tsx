/**
 * SettingsView — Wrapper around SettingsPanel from @waggle/ui.
 */

import type { WaggleConfig, TeamConnection } from '@waggle/ui';
import { SettingsPanel } from '@waggle/ui';

export interface SettingsViewProps {
  config: WaggleConfig | null;
  onConfigUpdate: (updates: Partial<WaggleConfig>) => void;
  onTestApiKey: (provider: string, key: string) => Promise<{ valid: boolean; error?: string }>;
  teamConnection?: TeamConnection | null;
  onTeamConnect?: (serverUrl: string, token: string) => Promise<void>;
  onTeamDisconnect?: () => Promise<void>;
}

export function SettingsView({
  config,
  onConfigUpdate,
  onTestApiKey,
  teamConnection,
  onTeamConnect,
  onTeamDisconnect,
}: SettingsViewProps) {
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
        teamConnection={teamConnection}
        onTeamConnect={onTeamConnect}
        onTeamDisconnect={onTeamDisconnect}
      />
    </div>
  );
}
