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
  /** F5: Controlled active tab for ContextPanel sync */
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function SettingsView({
  config,
  onConfigUpdate,
  onTestApiKey,
  teamConnection,
  onTeamConnect,
  onTeamDisconnect,
  activeTab,
  onTabChange,
}: SettingsViewProps) {
  if (!config) {
    return (
      <div className="p-6 text-muted-foreground/40">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden">
      <SettingsPanel
        config={config}
        onConfigUpdate={onConfigUpdate}
        onTestApiKey={onTestApiKey}
        teamConnection={teamConnection}
        onTeamConnect={onTeamConnect}
        onTeamDisconnect={onTeamDisconnect}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />
    </div>
  );
}
