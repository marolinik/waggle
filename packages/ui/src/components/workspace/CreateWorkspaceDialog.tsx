/**
 * CreateWorkspaceDialog — modal dialog for creating a new workspace.
 *
 * Fields: name (required), group (dropdown), model (optional), personality (optional).
 * When connected to a team server, shows a "Team Workspace" toggle + team selector.
 * Supports "Start blank" or "Use template" mode with 6+ pre-configured templates.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { validateWorkspaceForm } from './utils.js';

export interface TeamInfo {
  id: string;
  name: string;
  slug: string;
  role: string;
}

/** Shape of a workspace template from the server. */
export interface WorkspaceTemplate {
  id: string;
  name: string;
  description: string;
  persona: string;
  connectors: string[];
  suggestedCommands: string[];
  starterMemory: string[];
  builtIn: boolean;
}

/** Persona display icons (mirrors MissionControlView) */
const PERSONA_ICONS: Record<string, string> = {
  researcher: '\u{1F52C}',
  writer: '\u{270D}\uFE0F',
  analyst: '\u{1F4CA}',
  coder: '\u{1F4BB}',
  'project-manager': '\u{1F4CB}',
  'executive-assistant': '\u{1F4E7}',
  'sales-rep': '\u{1F3AF}',
  marketer: '\u{1F4E2}',
};

export interface CreateWorkspaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (config: {
    name: string;
    group: string;
    model?: string;
    personality?: string;
    directory?: string;
    teamId?: string;
    teamServerUrl?: string;
    teamRole?: 'owner' | 'admin' | 'member' | 'viewer';
    teamUserId?: string;
    /** Template ID if created from a template */
    templateId?: string;
    /** Connectors to set up from template */
    templateConnectors?: string[];
    /** Suggested commands from template */
    templateCommands?: string[];
    /** Starter memory entries from template */
    templateMemory?: string[];
  }) => void;
  /** Whether the user is connected to a team server */
  isTeamConnected?: boolean;
  /** Team server URL (used when creating team workspaces) */
  teamServerUrl?: string;
  /** Current user's ID on the team server */
  teamUserId?: string;
  /** Fetch available teams from the team server */
  onFetchTeams?: () => Promise<TeamInfo[]>;
  /** Base URL for the local server API (defaults to http://localhost:3333) */
  apiBaseUrl?: string;
}

const GROUP_OPTIONS = ['Work', 'Personal', 'Study', 'Custom'];

export function CreateWorkspaceDialog({
  isOpen,
  onClose,
  onSubmit,
  isTeamConnected = false,
  teamServerUrl,
  teamUserId,
  onFetchTeams,
  apiBaseUrl = 'http://localhost:3333',
}: CreateWorkspaceDialogProps) {
  const [name, setName] = useState('');
  const [group, setGroup] = useState('Personal');
  const [model, setModel] = useState('');
  const [personality, setPersonality] = useState('');
  const [directory, setDirectory] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Team workspace state
  const [isTeamWorkspace, setIsTeamWorkspace] = useState(false);
  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [teamsLoading, setTeamsLoading] = useState(false);

  // Template state
  const [mode, setMode] = useState<'blank' | 'template'>('blank');
  const [templates, setTemplates] = useState<WorkspaceTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkspaceTemplate | null>(null);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  // Fetch templates when dialog opens and template mode is selected
  const fetchTemplates = useCallback(async () => {
    if (templates.length > 0) return; // already loaded
    setTemplatesLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/workspace-templates`);
      if (res.ok) {
        const data = await res.json() as { templates: WorkspaceTemplate[] };
        setTemplates(data.templates);
      }
    } catch {
      // Template fetch failure is non-fatal — user can still create blank
    } finally {
      setTemplatesLoading(false);
    }
  }, [apiBaseUrl, templates.length]);

  useEffect(() => {
    if (isOpen && mode === 'template') {
      fetchTemplates();
    }
  }, [isOpen, mode, fetchTemplates]);

  // Fetch teams when team toggle is enabled
  useEffect(() => {
    if (isTeamWorkspace && isTeamConnected && onFetchTeams && teams.length === 0) {
      setTeamsLoading(true);
      onFetchTeams()
        .then((result) => {
          setTeams(result);
          if (result.length > 0 && !selectedTeamId) {
            setSelectedTeamId(result[0].id);
          }
        })
        .catch(() => {
          setError('Failed to load teams from server');
        })
        .finally(() => setTeamsLoading(false));
    }
  }, [isTeamWorkspace, isTeamConnected, onFetchTeams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply template selection — pre-fill name and personality
  const handleSelectTemplate = (template: WorkspaceTemplate) => {
    setSelectedTemplate(template);
    if (!name) {
      setName(template.name);
    }
    setGroup('Work');
    setError(null);
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateWorkspaceForm(name);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (isTeamWorkspace && !selectedTeamId) {
      setError('Please select a team');
      return;
    }

    const selectedTeam = teams.find(t => t.id === selectedTeamId);

    onSubmit({
      name: name.trim(),
      group: isTeamWorkspace ? 'Team' : group,
      model: model.trim() || undefined,
      personality: personality.trim() || undefined,
      directory: directory.trim() || undefined,
      ...(isTeamWorkspace && selectedTeam && {
        teamId: selectedTeam.id,
        teamServerUrl,
        teamRole: selectedTeam.role as 'owner' | 'admin' | 'member' | 'viewer',
        teamUserId,
      }),
      ...(selectedTemplate && {
        templateId: selectedTemplate.id,
        templateConnectors: selectedTemplate.connectors,
        templateCommands: selectedTemplate.suggestedCommands,
        templateMemory: selectedTemplate.starterMemory,
      }),
    });
    // Reset form
    setName('');
    setGroup('Personal');
    setModel('');
    setPersonality('');
    setDirectory('');
    setError(null);
    setIsTeamWorkspace(false);
    setSelectedTeamId('');
    setMode('blank');
    setSelectedTemplate(null);
  };

  return (
    <div className="create-workspace-dialog fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-gray-900 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="mb-4 text-lg font-semibold text-gray-100">Create Workspace</h2>

        {/* Mode toggle: Start blank | Use template */}
        <div className="mb-4 flex rounded bg-gray-800 p-1" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'blank'}
            onClick={() => { setMode('blank'); setSelectedTemplate(null); }}
            className={`flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === 'blank'
                ? 'bg-gray-700 text-gray-100'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Start blank
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'template'}
            onClick={() => { setMode('template'); }}
            className={`flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === 'template'
                ? 'bg-gray-700 text-gray-100'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Use template
          </button>
        </div>

        {/* Template grid (when template mode is selected) */}
        {mode === 'template' && (
          <div className="mb-4">
            {templatesLoading ? (
              <div className="py-4 text-center text-sm text-gray-500">Loading templates...</div>
            ) : templates.length === 0 ? (
              <div className="py-4 text-center text-sm text-gray-500">No templates available</div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {templates.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl)}
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      selectedTemplate?.id === tpl.id
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg" role="img" aria-label={tpl.persona}>
                        {PERSONA_ICONS[tpl.persona] || '\u{1F916}'}
                      </span>
                      <span className="text-sm font-medium text-gray-100">{tpl.name}</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-400 line-clamp-2">{tpl.description}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Selected template details */}
            {selectedTemplate && (
              <div className="mt-3 rounded border border-gray-700 bg-gray-800/30 p-3">
                <div className="mb-1 text-xs font-medium text-gray-300">Template details</div>
                <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                  <span>Persona: <span className="text-gray-200">{selectedTemplate.persona}</span></span>
                  {selectedTemplate.connectors.length > 0 && (
                    <span>Connectors: <span className="text-gray-200">{selectedTemplate.connectors.join(', ')}</span></span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {selectedTemplate.suggestedCommands.map((cmd) => (
                    <span key={cmd} className="rounded bg-gray-700 px-1.5 py-0.5 text-xs text-gray-300">{cmd}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Team workspace toggle (only when connected) */}
          {isTeamConnected && (
            <div className="flex items-center gap-3 rounded bg-gray-800/50 px-3 py-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={isTeamWorkspace}
                  onChange={(e) => {
                    setIsTeamWorkspace(e.target.checked);
                    setError(null);
                  }}
                  className="rounded border-gray-600"
                />
                Team Workspace
              </label>
              {isTeamWorkspace && (
                <span className="text-xs text-blue-400">Shared with team members</span>
              )}
            </div>
          )}

          {/* Team selector (when team workspace toggled) */}
          {isTeamWorkspace && (
            <div>
              <label className="mb-1 block text-sm text-gray-400" htmlFor="ws-team">
                Team <span className="text-red-400">*</span>
              </label>
              {teamsLoading ? (
                <div className="rounded bg-gray-800 px-3 py-2 text-sm text-gray-500">
                  Loading teams...
                </div>
              ) : teams.length === 0 ? (
                <div className="rounded bg-gray-800 px-3 py-2 text-sm text-yellow-400">
                  No teams found. Create a team on the team server first.
                </div>
              ) : (
                <select
                  id="ws-team"
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="w-full rounded bg-gray-800 px-3 py-2 text-sm text-gray-100 outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.role})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

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
              placeholder={selectedTemplate ? selectedTemplate.name : 'My Workspace'}
              autoFocus
            />
            {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
          </div>

          {/* Group (hidden when team workspace — auto-set to "Team") */}
          {!isTeamWorkspace && (
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
          )}

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
              {isTeamWorkspace ? 'Create Team Workspace' : selectedTemplate ? `Create from ${selectedTemplate.name}` : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
