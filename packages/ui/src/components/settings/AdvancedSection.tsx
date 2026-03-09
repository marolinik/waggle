/**
 * AdvancedSection — LiteLLM status, data directory, config export/import, debug settings.
 */

import React from 'react';
import type { WaggleConfig } from '../../services/types.js';

export interface MindFileInfo {
  workspace: string;
  path: string;
  sizeBytes: number;
}

export interface AdvancedSectionProps {
  config: WaggleConfig;
  onConfigUpdate: (config: Partial<WaggleConfig>) => void;
  litellmStatus?: 'running' | 'stopped' | 'error';
  onRestartLiteLLM?: () => Promise<void>;
  dataDirectory?: string;
  onExportConfig?: () => void;
  onImportConfig?: () => void;
  mindFiles?: MindFileInfo[];
  debugLogEnabled?: boolean;
  onDebugLogToggle?: (enabled: boolean) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AdvancedSection({
  config,
  onConfigUpdate,
  litellmStatus = 'stopped',
  onRestartLiteLLM,
  dataDirectory = '~/.waggle',
  onExportConfig,
  onImportConfig,
  mindFiles = [],
  debugLogEnabled = false,
  onDebugLogToggle,
}: AdvancedSectionProps) {
  return (
    <div className="advanced-section space-y-6">
      <h2 className="text-lg font-semibold">Advanced</h2>

      {/* LiteLLM status */}
      <div className="rounded-lg border border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium">LiteLLM Proxy</h3>
            <p className="text-xs text-gray-400 mt-1">
              Model routing proxy for multi-provider support.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1 text-sm ${
                litellmStatus === 'running'
                  ? 'text-green-400'
                  : litellmStatus === 'error'
                    ? 'text-red-400'
                    : 'text-gray-400'
              }`}
            >
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  litellmStatus === 'running'
                    ? 'bg-green-400'
                    : litellmStatus === 'error'
                      ? 'bg-red-400'
                      : 'bg-gray-400'
                }`}
              />
              {litellmStatus === 'running' ? 'Running' : litellmStatus === 'error' ? 'Error' : 'Stopped'}
            </span>
            {onRestartLiteLLM && (
              <button
                onClick={onRestartLiteLLM}
                className="rounded bg-gray-700 px-3 py-1 text-sm text-gray-300 hover:bg-gray-600"
              >
                Restart
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Data directory */}
      <div className="rounded-lg border border-gray-700 p-4">
        <h3 className="text-sm font-medium">Data Directory</h3>
        <p className="mt-1 rounded bg-gray-800 px-3 py-2 text-sm text-gray-300 font-mono">
          {dataDirectory}
        </p>
      </div>

      {/* Export/Import */}
      <div className="rounded-lg border border-gray-700 p-4">
        <h3 className="text-sm font-medium mb-3">Configuration</h3>
        <div className="flex gap-2">
          {onExportConfig && (
            <button
              onClick={onExportConfig}
              className="rounded bg-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-600"
            >
              Export Config
            </button>
          )}
          {onImportConfig && (
            <button
              onClick={onImportConfig}
              className="rounded bg-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-600"
            >
              Import Config
            </button>
          )}
        </div>
      </div>

      {/* Mind file sizes */}
      {mindFiles.length > 0 && (
        <div className="rounded-lg border border-gray-700 p-4">
          <h3 className="text-sm font-medium mb-3">Mind Files</h3>
          <div className="space-y-2">
            {mindFiles.map((mf) => (
              <div key={mf.workspace} className="flex items-center justify-between text-sm">
                <span className="text-gray-300">{mf.workspace}</span>
                <span className="text-gray-400 font-mono">{formatBytes(mf.sizeBytes)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Debug log toggle */}
      <div className="rounded-lg border border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium">Debug Logging</h3>
            <p className="text-xs text-gray-400 mt-1">
              Enable verbose logging for troubleshooting.
            </p>
          </div>
          <button
            onClick={() => onDebugLogToggle?.(!debugLogEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              debugLogEnabled ? 'bg-blue-600' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                debugLogEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
