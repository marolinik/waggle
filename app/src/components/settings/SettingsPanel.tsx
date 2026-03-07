import { useState, useEffect } from 'react';
import { ipc } from '../../lib/ipc';
import { McpServerList } from './McpServerList';

interface SettingsPanelProps {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('claude-sonnet-4-6');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    ipc.getSettings().then((settings) => {
      if (settings.apiKey) setApiKey(settings.apiKey as string);
      if (settings.model) setModel(settings.model as string);
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    await ipc.setSettings('apiKey', apiKey);
    await ipc.setSettings('model', model);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col h-full p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Settings</h2>
        <button
          onClick={onClose}
          className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
        >
          ✕
        </button>
      </div>

      <div className="space-y-6 max-w-lg">
        <div>
          <label className="block text-sm font-medium mb-2">API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            className="w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--secondary))] px-4 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))]"
          />
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
            Your Anthropic API key. Stored locally, never sent anywhere except Anthropic.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Model</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--secondary))] px-4 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))]"
          >
            <option value="claude-opus-4-6">Claude Opus 4.6</option>
            <option value="claude-sonnet-4-6">Claude Sonnet 4.6</option>
            <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5</option>
          </select>
        </div>

        <button
          onClick={handleSave}
          className="rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--primary-foreground))] hover:opacity-90"
        >
          {saved ? 'Saved!' : 'Save Settings'}
        </button>

        <hr className="border-[hsl(var(--border))]" />

        <McpServerList />
      </div>
    </div>
  );
}
