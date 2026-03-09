/**
 * SettingsPanel — tabbed settings container component.
 *
 * Renders a tabbed interface with General, API Keys, Models, Permissions, and Advanced tabs.
 */

import React, { useState } from 'react';
import type { WaggleConfig } from '../../services/types.js';
import { SETTINGS_TABS } from './utils.js';
import { ApiKeySection } from './ApiKeySection.js';
import { ModelSection } from './ModelSection.js';
import { PermissionSection } from './PermissionSection.js';
import { ThemeSection } from './ThemeSection.js';
import { AdvancedSection } from './AdvancedSection.js';

export interface SettingsPanelProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  config: WaggleConfig;
  onConfigUpdate: (config: Partial<WaggleConfig>) => void;
  onTestApiKey?: (provider: string, key: string) => Promise<{ valid: boolean; error?: string }>;
  onRestartLiteLLM?: () => Promise<void>;
}

export function SettingsPanel({
  activeTab: controlledTab,
  onTabChange,
  config,
  onConfigUpdate,
  onTestApiKey,
  onRestartLiteLLM,
}: SettingsPanelProps) {
  const [internalTab, setInternalTab] = useState('general');
  const [yoloMode, setYoloMode] = useState(true);
  const [externalGates, setExternalGates] = useState<string[]>([]);
  const activeTab = controlledTab ?? internalTab;

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
        {activeTab === 'api-keys' && (
          <ApiKeySection
            config={config}
            onConfigUpdate={onConfigUpdate}
            onTestApiKey={onTestApiKey}
          />
        )}
        {activeTab === 'models' && (
          <ModelSection config={config} onConfigUpdate={onConfigUpdate} />
        )}
        {activeTab === 'permissions' && (
          <PermissionSection
            yoloMode={yoloMode}
            onYoloModeChange={setYoloMode}
            externalGates={externalGates}
            onExternalGatesChange={setExternalGates}
          />
        )}
        {activeTab === 'advanced' && (
          <AdvancedSection
            config={config}
            onConfigUpdate={onConfigUpdate}
            onRestartLiteLLM={onRestartLiteLLM}
          />
        )}
      </div>
    </div>
  );
}
