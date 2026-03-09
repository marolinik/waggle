/**
 * ThemeSection — light/dark mode toggle and general settings.
 *
 * Displayed in the "General" tab. Uses existing ThemeContext for theme management.
 */

import React from 'react';
import type { WaggleConfig } from '../../services/types.js';

export interface ThemeSectionProps {
  config: WaggleConfig;
  onConfigUpdate: (config: Partial<WaggleConfig>) => void;
}

export function ThemeSection({ config, onConfigUpdate }: ThemeSectionProps) {
  return (
    <div className="theme-section space-y-6">
      <h2 className="text-lg font-semibold">General</h2>

      {/* Theme toggle */}
      <div className="rounded-lg border border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium">Theme</h3>
            <p className="text-xs text-gray-400 mt-1">
              Switch between light and dark mode.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm ${config.theme === 'light' ? 'text-yellow-400' : 'text-gray-500'}`}>
              Light
            </span>
            <button
              onClick={() =>
                onConfigUpdate({ theme: config.theme === 'dark' ? 'light' : 'dark' })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.theme === 'dark' ? 'bg-blue-600' : 'bg-gray-400'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm ${config.theme === 'dark' ? 'text-blue-400' : 'text-gray-500'}`}>
              Dark
            </span>
          </div>
        </div>
      </div>

      {/* Autostart */}
      <div className="rounded-lg border border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium">Launch on Startup</h3>
            <p className="text-xs text-gray-400 mt-1">
              Automatically start Waggle when you log in.
            </p>
          </div>
          <button
            onClick={() => onConfigUpdate({ autostart: !config.autostart })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              config.autostart ? 'bg-blue-600' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                config.autostart ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Global hotkey */}
      <div className="rounded-lg border border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium">Global Hotkey</h3>
            <p className="text-xs text-gray-400 mt-1">
              Keyboard shortcut to show/hide Waggle.
            </p>
          </div>
          <input
            type="text"
            value={config.globalHotkey}
            onChange={(e) => onConfigUpdate({ globalHotkey: e.target.value })}
            className="w-40 rounded bg-gray-800 px-3 py-2 text-sm text-center text-gray-100 border border-gray-600 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
