/**
 * SettingsPanel -- tabbed settings container component.
 *
 * Renders a tabbed interface with General, Models & Providers, Vault & Credentials,
 * Permissions, Team, and Advanced tabs.
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { WaggleConfig, TeamConnection } from '../../services/types.js';
import { SETTINGS_TABS } from './utils.js';
import { ModelsSection } from './ModelsSection.js';
import { PermissionSection } from './PermissionSection.js';
import { ThemeSection } from './ThemeSection.js';
import { AdvancedSection } from './AdvancedSection.js';
import { TeamSection } from './TeamSection.js';
import { VaultSection } from './VaultSection.js';
import { BackupSection } from './BackupSection.js';

export interface SettingsPanelProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  config: WaggleConfig;
  onConfigUpdate: (config: Partial<WaggleConfig>) => void;
  onTestApiKey?: (provider: string, key: string) => Promise<{ valid: boolean; error?: string }>;
  teamConnection?: TeamConnection | null;
  onTeamConnect?: (serverUrl: string, token: string) => Promise<void>;
  onTeamDisconnect?: () => Promise<void>;
}

interface PermissionsData {
  yoloMode: boolean;
  externalGates: string[];
  workspaceOverrides: Record<string, string[]>;
}

export function SettingsPanel({
  activeTab: controlledTab,
  onTabChange,
  config,
  onConfigUpdate,
  onTestApiKey,
  teamConnection,
  onTeamConnect,
  onTeamDisconnect,
}: SettingsPanelProps) {
  const [internalTab, setInternalTab] = useState('general');
  const [yoloMode, setYoloMode] = useState(false);
  const [externalGates, setExternalGates] = useState<string[]>([]);
  const activeTab = controlledTab ?? internalTab;

  // Load permissions from server
  useEffect(() => {
    let cancelled = false;
    async function loadPermissions() {
      try {
        const res = await fetch('http://127.0.0.1:3333/api/settings/permissions');
        if (res.ok) {
          const data = (await res.json()) as PermissionsData;
          if (!cancelled) {
            setYoloMode(data.yoloMode);
            setExternalGates(data.externalGates);
          }
        }
      } catch {
        // Use defaults on error
      }
    }
    loadPermissions();
    return () => { cancelled = true; };
  }, []);

  // Save permissions to server
  const savePermissions = useCallback(async (yolo: boolean, gates: string[]) => {
    try {
      await fetch('http://127.0.0.1:3333/api/settings/permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ yoloMode: yolo, externalGates: gates, workspaceOverrides: {} }),
      });
    } catch {
      // Silent failure — permissions will be retried on next save
    }
  }, []);

  const handleYoloModeChange = useCallback((enabled: boolean) => {
    setYoloMode(enabled);
    savePermissions(enabled, externalGates);
  }, [externalGates, savePermissions]);

  const handleExternalGatesChange = useCallback((gates: string[]) => {
    setExternalGates(gates);
    savePermissions(yoloMode, gates);
  }, [yoloMode, savePermissions]);

  const handleTabChange = (tab: string) => {
    setInternalTab(tab);
    onTabChange?.(tab);
  };

  return (
    <div className="settings-panel flex h-full flex-col bg-gray-900 text-gray-100">
      {/* Tab bar */}
      <div className="settings-panel__tabs flex border-b border-gray-700 px-4">
        {SETTINGS_TABS.map((tab) => (
          <button
            key={tab.id}
            className={`settings-panel__tab px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            onClick={() => handleTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="settings-panel__content flex-1 overflow-y-auto p-6">
        {activeTab === 'general' && (
          <ThemeSection config={config} onConfigUpdate={onConfigUpdate} />
        )}
        {activeTab === 'models' && (
          <ModelsSection
            config={config}
            onConfigUpdate={onConfigUpdate}
            onTestApiKey={onTestApiKey}
          />
        )}
        {activeTab === 'vault' && (
          <VaultSection />
        )}
        {activeTab === 'permissions' && (
          <PermissionSection
            yoloMode={yoloMode}
            onYoloModeChange={handleYoloModeChange}
            externalGates={externalGates}
            onExternalGatesChange={handleExternalGatesChange}
          />
        )}
        {activeTab === 'team' && onTeamConnect && onTeamDisconnect && (
          <TeamSection
            teamConnection={teamConnection ?? null}
            onConnect={onTeamConnect}
            onDisconnect={onTeamDisconnect}
          />
        )}
        {activeTab === 'backup' && (
          <BackupSection />
        )}
        {activeTab === 'advanced' && (
          <AdvancedSection
            config={config}
            onConfigUpdate={onConfigUpdate}
          />
        )}
      </div>
    </div>
  );
}
