/**
 * AdvancedSection -- data directory, config export/import, debug settings.
 *
 * LiteLLM proxy controls removed (replaced by built-in Anthropic proxy post-M4).
 */

import React, { useState, useCallback } from 'react';
import type { WaggleConfig } from '../../services/types.js';

export interface MindFileInfo {
  workspace: string;
  path: string;
  sizeBytes: number;
}

export interface AdvancedSectionProps {
  config: WaggleConfig;
  onConfigUpdate: (config: Partial<WaggleConfig>) => void;
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

      {/* Download My Data (GDPR export) */}
      <DataExportSection />

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

// ── Data Export Section (GDPR compliance) ─────────────────────────────

function DataExportSection() {
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{ sizeBytes: number } | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = useCallback(async () => {
    setExporting(true);
    setExportResult(null);
    setExportError(null);

    try {
      const res = await fetch('http://127.0.0.1:3333/api/export', {
        method: 'POST',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Export failed' }));
        throw new Error((err as { error?: string }).error || `HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const sizeBytes = blob.size;

      // Trigger browser download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const today = new Date().toISOString().slice(0, 10);
      a.download = `waggle-export-${today}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportResult({ sizeBytes });
    } catch (err) {
      setExportError((err as Error).message || 'Export failed');
    } finally {
      setExporting(false);
    }
  }, []);

  return (
    <div className="rounded-lg border border-gray-700 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Download My Data</h3>
          <p className="text-xs text-gray-400 mt-1">
            Export all your data as a ZIP file (memories, sessions, workspaces, settings).
            API keys are masked. Vault secrets are excluded.
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
            exporting
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-500'
          }`}
        >
          {exporting ? (
            <span className="flex items-center gap-2">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-white" />
              Exporting...
            </span>
          ) : (
            'Export All Data'
          )}
        </button>
      </div>
      {exportResult && (
        <p className="mt-2 text-xs text-green-400">
          Export complete — {formatBytes(exportResult.sizeBytes)}
        </p>
      )}
      {exportError && (
        <p className="mt-2 text-xs text-red-400">
          Export failed: {exportError}
        </p>
      )}
    </div>
  );
}
