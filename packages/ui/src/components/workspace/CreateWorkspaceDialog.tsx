/**
 * CreateWorkspaceDialog — modal dialog for creating a new workspace.
 *
 * Fields: name (required), group (dropdown), model (optional), personality (optional).
 */

import React, { useState } from 'react';
import { validateWorkspaceForm } from './utils.js';

export interface CreateWorkspaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (config: {
    name: string;
    group: string;
    model?: string;
    personality?: string;
    directory?: string;
  }) => void;
}

const GROUP_OPTIONS = ['Work', 'Personal', 'Study', 'Custom'];

export function CreateWorkspaceDialog({ isOpen, onClose, onSubmit }: CreateWorkspaceDialogProps) {
  const [name, setName] = useState('');
  const [group, setGroup] = useState('Personal');
  const [model, setModel] = useState('');
  const [personality, setPersonality] = useState('');
  const [directory, setDirectory] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateWorkspaceForm(name);
    if (validationError) {
      setError(validationError);
      return;
    }
    onSubmit({
      name: name.trim(),
      group,
      model: model.trim() || undefined,
      personality: personality.trim() || undefined,
      directory: directory.trim() || undefined,
    });
    // Reset form
    setName('');
    setGroup('Personal');
    setModel('');
    setPersonality('');
    setDirectory('');
    setError(null);
  };

  return (
    <div className="create-workspace-dialog fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-gray-900 p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-gray-100">Create Workspace</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Name */}
          <div>
            <label className="mb-1 block text-sm text-gray-400" htmlFor="ws-name">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              id="ws-name"
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(null); }}
              className="w-full rounded bg-gray-800 px-3 py-2 text-sm text-gray-100 outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="My Workspace"
              autoFocus
            />
            {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
          </div>

          {/* Group */}
          <div>
            <label className="mb-1 block text-sm text-gray-400" htmlFor="ws-group">
              Group
            </label>
            <select
              id="ws-group"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              className="w-full rounded bg-gray-800 px-3 py-2 text-sm text-gray-100 outline-none focus:ring-1 focus:ring-blue-500"
            >
              {GROUP_OPTIONS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Directory */}
          <div>
            <label className="mb-1 block text-sm text-gray-400" htmlFor="ws-directory">
              Working Directory <span className="text-gray-600">(where files are generated)</span>
            </label>
            <input
              id="ws-directory"
              type="text"
              value={directory}
              onChange={(e) => setDirectory(e.target.value)}
              className="w-full rounded bg-gray-800 px-3 py-2 text-sm text-gray-100 outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="C:\Users\You\Documents\my-project"
            />
            <p className="mt-1 text-xs text-gray-500">Agent reads/writes files here. Leave empty to use home directory.</p>
          </div>

          {/* Model */}
          <div>
            <label className="mb-1 block text-sm text-gray-400" htmlFor="ws-model">
              Model <span className="text-gray-600">(optional)</span>
            </label>
            <input
              id="ws-model"
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full rounded bg-gray-800 px-3 py-2 text-sm text-gray-100 outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="claude-sonnet-4-20250514"
            />
          </div>

          {/* Personality */}
          <div>
            <label className="mb-1 block text-sm text-gray-400" htmlFor="ws-personality">
              Personality <span className="text-gray-600">(optional)</span>
            </label>
            <textarea
              id="ws-personality"
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              className="w-full rounded bg-gray-800 px-3 py-2 text-sm text-gray-100 outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="You are a helpful assistant..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
