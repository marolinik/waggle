/**
 * App.tsx — Main Waggle desktop application.
 *
 * Full desktop experience wiring all @waggle/ui components:
 * - Chat with file drop, session tabs, tool cards, approval gates
 * - Sidebar with workspace tree, navigation icons, workspace creation
 * - Settings panel with config management
 * - Memory browser with search, frame timeline, frame detail
 * - Event stream with step cards
 * - Onboarding wizard on first run
 * - File preview modal
 * - Keyboard shortcuts
 */

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import type { Message, WaggleConfig, WorkspaceContext, Frame, OnboardingData, FileEntry, DroppedFile, TeamMessage, WorkspaceMicroStatus } from '@waggle/ui';
import {
  ThemeProvider,
  useTheme,
  AppShell,
  StatusBar,
  CreateWorkspaceDialog,
  Modal,
  OnboardingWizard,
  FilePreview,
  LocalAdapter,
  useChat,
  useWorkspaces,
  useTabs,
  useMemory,
  useEvents,
  useSessions,
  useOnboardingSetup,
  useApprovalGate,
  useTeamPresence,
  useTeamActivity,
  useNotifications,
  useSubAgentStatus,
  ToastContainer,
  matchesNamedShortcut,
  categorizeFile,
} from '@waggle/ui';
import type { Toast, PersonaOption, OfflineStatus } from '@waggle/ui';
import { ServiceProvider, useService } from './providers/ServiceProvider';
import { AppSidebar } from './components/AppSidebar';
import { ContextPanel } from './components/ContextPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ChatView } from './views/ChatView';
import { GlobalSearch } from './components/GlobalSearch';
import type { GlobalSearchResultType } from './components/GlobalSearch';
import { KeyboardShortcutsHelp } from './components/KeyboardShortcutsHelp';
import { PersonaSwitcher } from './components/PersonaSwitcher';
import { getServerBaseUrl } from './lib/ipc';

// ── Code-split views (loaded on demand) ─────────────────────────────────
const SettingsView = React.lazy(() => import('./views/SettingsView'));
const MemoryView = React.lazy(() => import('./views/MemoryView'));
const EventsView = React.lazy(() => import('./views/EventsView'));
const CapabilitiesView = React.lazy(() => import('./views/CapabilitiesView'));
const CockpitView = React.lazy(() => import('./views/CockpitView'));
const MissionControlView = React.lazy(() => import('./views/MissionControlView'));

const SERVER_BASE = getServerBaseUrl();
const adapter = new LocalAdapter({ baseUrl: SERVER_BASE });

/** Derive a stable hue (0-360) from a workspace name for visual identity */
function workspaceHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return ((hash % 360) + 360) % 360;
}

/** Convert raw model IDs to friendly display names */
function friendlyModelName(model: string): string {
  if (model.includes('opus')) return 'Claude Opus';
  if (model.includes('sonnet')) return 'Claude Sonnet';
  if (model.includes('haiku')) return 'Claude Haiku';
  if (model.includes('gpt-4o')) return 'GPT-4o';
  if (model.includes('gpt-4')) return 'GPT-4';
  if (model.includes('gpt-3')) return 'GPT-3.5';
  // Return last segment if it's a path-like ID
  const parts = model.split('/');
  return parts[parts.length - 1];
}

type AppView = 'chat' | 'memory' | 'events' | 'capabilities' | 'cockpit' | 'mission-control' | 'settings';

function WaggleApp() {
  const service = useService();
  const { toggleTheme } = useTheme();

  // ── View state ────────────────────────────────────────────────────
  const [currentView, setCurrentView] = useState<AppView>('chat');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [contextPanelOpen] = useState(true);
  const [previewFile, setPreviewFile] = useState<FileEntry | null>(null);
  const [config, setConfig] = useState<WaggleConfig | null>(null);
  // F6: Global search state
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  // Keyboard shortcuts help overlay
  const [showHelp, setShowHelp] = useState(false);
  // Persona switcher dialog state
  const [showPersonaSwitcher, setShowPersonaSwitcher] = useState(false);

  // ── Workspaces ────────────────────────────────────────────────────
  const {
    workspaces,
    activeWorkspace,
    setActiveWorkspace,
    createWorkspace,
    updateWorkspace,
  } = useWorkspaces({ service });

  // ── Team presence (I4) ───────────────────────────────────────────
  const { members: teamMembers } = useTeamPresence({
    teamId: activeWorkspace?.teamId,
    service,
  });
  const { items: teamActivity, loading: teamActivityLoading } = useTeamActivity({
    teamId: activeWorkspace?.teamId,
  });

  // ── Team messages (Wave 2.4) ────────────────────────────────────
  const [teamMessages, setTeamMessages] = useState<TeamMessage[]>([]);
  useEffect(() => {
    const teamId = activeWorkspace?.teamId;
    if (!teamId) { setTeamMessages([]); return; }

    const fetchMessages = async () => {
      try {
        const res = await fetch(`${SERVER_BASE}/api/team/messages?workspaceId=${teamId}`);
        if (res.ok) {
          const data = await res.json();
          setTeamMessages(data.messages ?? []);
        }
      } catch { /* silent */ }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 30_000);
    return () => clearInterval(interval);
  }, [activeWorkspace?.teamId]);

  // ── Agent personas (for workspace creation) ────────────────────
  const [personas, setPersonas] = useState<PersonaOption[]>([]);
  useEffect(() => {
    fetch(`${SERVER_BASE}/api/personas`)
      .then(r => r.ok ? r.json() as Promise<{ personas: PersonaOption[] }> : null)
      .then(data => { if (data?.personas) setPersonas(data.personas); })
      .catch(() => { /* personas are optional — degrade gracefully */ });
  }, []);

  // ── Notifications + Toasts ──────────────────────────────────────
  const { notifications } = useNotifications(SERVER_BASE);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // ── Sub-agent status + Workflow suggestions (via SSE) ──────────
  const { subAgents, workflowSuggestion, dismissSuggestion } = useSubAgentStatus(
    SERVER_BASE,
    activeWorkspace?.id,
  );

  const handleWorkflowAccept = useCallback(async (pattern: { name: string; description: string; steps: string[]; tools: string[]; category: string }) => {
    try {
      await fetch(`${SERVER_BASE}/api/skills/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: pattern.name,
          description: pattern.description,
          steps: pattern.steps,
          tools: pattern.tools,
          category: pattern.category,
        }),
      });
      dismissSuggestion();
      setToasts(prev => [{
        id: `wf-${Date.now()}`,
        category: 'agent',
        title: 'Skill saved',
        body: `"${pattern.name}" is now a reusable skill.`,
        createdAt: Date.now(),
      }, ...prev]);
    } catch {
      setToasts(prev => [{
        id: `wf-err-${Date.now()}`,
        category: 'agent',
        title: 'Failed to save skill',
        body: 'Could not create skill from workflow pattern.',
        createdAt: Date.now(),
      }, ...prev]);
    }
  }, [dismissSuggestion]);

  // Convert focused notifications to toasts
  useEffect(() => {
    if (notifications.length === 0) return;
    const latest = notifications[0];
    if (document.hasFocus()) {
      setToasts(prev => [{
        id: `${Date.now()}-${Math.random()}`,
        title: latest.title,
        body: latest.body,
        category: latest.category,
        actionUrl: latest.actionUrl,
        createdAt: Date.now(),
      }, ...prev].slice(0, 10));
    }
  }, [notifications]);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── Tray event listeners (Tauri only) ─────────────────────────
  useEffect(() => {
    if (!('__TAURI_INTERNALS__' in window)) return;

    const listeners: Array<() => void> = [];

    (async () => {
      const eventModule = '@tauri-apps/' + 'api/event';
      const { listen } = await import(/* @vite-ignore */ eventModule);

      listeners.push(await listen('waggle://pause-agents', () => {
        console.log('[waggle] Pause agents toggled via tray');
      }));

      listeners.push(await listen('waggle://navigate', (event: any) => {
        const path = event.payload as string;
        console.log('[waggle] Navigate via tray:', path);
      }));

      listeners.push(await listen('waggle://quit', async () => {
        try {
          const coreModule = '@tauri-apps/' + 'api/core';
          const { invoke } = await import(/* @vite-ignore */ coreModule);
          await invoke('stop_service');
        } catch {}
        try {
          const processModule = '@tauri-apps/' + 'plugin-process';
          const { exit } = await import(/* @vite-ignore */ processModule);
          await exit(0);
        } catch {
          window.close();
        }
      }));

      listeners.push(await listen('waggle://service-status', (event: any) => {
        const payload = event.payload as { status: string };
        console.log('[waggle] Service status:', payload.status);
      }));

      listeners.push(await listen('waggle://service-restart-needed', async () => {
        try {
          const coreModule2 = '@tauri-apps/' + 'api/core';
          const { invoke } = await import(/* @vite-ignore */ coreModule2);
          await invoke('ensure_service');
        } catch {}
      }));
    })();

    return () => {
      listeners.forEach(unlisten => unlisten());
    };
  }, []);

  // ── Sessions ──────────────────────────────────────────────────────
  const {
    grouped: groupedSessions,
    activeSessionId,
    selectSession,
    createSession,
    deleteSession,
    renameSession,
    searchResults,
    searchLoading,
    searchSessions: doSearchSessions,
    clearSearch,
    exportSession,
  } = useSessions({
    service,
    workspaceId: activeWorkspace?.id ?? 'default',
  });

  // ── F7: Workspace micro-status for sidebar indicators ────────────
  const [workspaceMicroStatus, setWorkspaceMicroStatus] = useState<Record<string, WorkspaceMicroStatus>>({});

  useEffect(() => {
    if (workspaces.length === 0) return;

    const fetchMicroStatus = async () => {
      const status: Record<string, WorkspaceMicroStatus> = {};
      await Promise.allSettled(
        workspaces.map(async (ws) => {
          try {
            const res = await fetch(`${SERVER_BASE}/api/workspaces/${ws.id}/context`);
            if (res.ok) {
              const ctx = await res.json();
              status[ws.id] = {
                memoryCount: ctx.stats?.memoryCount ?? 0,
                lastActive: ctx.lastActive ?? ws.created,
              };
            }
          } catch {
            // Silent — workspace stats unavailable
          }
        })
      );
      setWorkspaceMicroStatus(status);
    };

    fetchMicroStatus();
  }, [workspaces]);

  // ── Workspace context (catch-up / return reward) ────────────────
  const [workspaceContext, setWorkspaceContext] = useState<WorkspaceContext | null>(null);
  useEffect(() => {
    if (!activeWorkspace?.id) {
      setWorkspaceContext(null);
      return;
    }
    // Fetch workspace context whenever workspace changes
    service.getWorkspaceContext(activeWorkspace.id)
      .then(setWorkspaceContext)
      .catch(() => setWorkspaceContext(null));
  }, [activeWorkspace?.id, service]);

  // ── Chat (with workspace directory and file preview) ──────────────
  const handleFileCreated = useCallback((filePath: string, action: 'write' | 'edit' | 'generate') => {
    // Auto-show file preview when agent creates/writes files
    const wsDir = activeWorkspace?.directory;
    const fullPath = wsDir ? `${wsDir}/${filePath}` : filePath;
    const parts = fullPath.replace(/\\/g, '/').split('/');
    const fileName = parts[parts.length - 1] || fullPath;
    const ext = fileName.includes('.') ? fileName.slice(fileName.lastIndexOf('.') + 1) : '';
    setPreviewFile({
      path: fullPath,
      name: fileName,
      extension: ext,
      content: `File ${action === 'generate' ? 'generated' : action === 'edit' ? 'edited' : 'written'}: ${fullPath}`,
      action: action === 'edit' ? 'edit' : 'write',
      timestamp: new Date().toISOString(),
    });
  }, [activeWorkspace?.directory]);

  const {
    messages,
    setMessages,
    isLoading,
    sendMessage,
  } = useChat({
    service,
    workspace: activeWorkspace?.id ?? 'default',
    session: activeSessionId ?? undefined,
    workspacePath: activeWorkspace?.directory,
    onFileCreated: handleFileCreated,
  });

  // ── F7: Update active workspace agent status in micro-status ──
  useEffect(() => {
    if (!activeWorkspace?.id) return;
    setWorkspaceMicroStatus(prev => {
      const existing = prev[activeWorkspace.id] ?? {};
      if (existing.isAgentActive === isLoading) return prev;
      return { ...prev, [activeWorkspace.id]: { ...existing, isAgentActive: isLoading } };
    });
  }, [activeWorkspace?.id, isLoading]);

  // ── Approval gate (listens for WebSocket-based approval events) ──
  useApprovalGate({ service, setMessages });

  // C2: Check for pending approvals on startup (reconnection scenario)
  useEffect(() => {
    const checkPending = async () => {
      try {
        const res = await fetch(`${SERVER_BASE}/api/approval/pending`);
        if (res.ok) {
          const data = await res.json() as { pending: Array<{ requestId: string; toolName: string; input: Record<string, unknown> }> };
          if (data.pending?.length > 0) {
            // Surface pending approvals as tool cards
            for (const p of data.pending) {
              setMessages(prev => [
                ...prev,
                {
                  id: `approval-${p.requestId}`,
                  role: 'assistant' as const,
                  content: '',
                  timestamp: new Date().toISOString(),
                  toolUse: [{
                    name: p.toolName,
                    input: p.input,
                    requiresApproval: true,
                    status: 'pending_approval' as const,
                    requestId: p.requestId,
                  }],
                },
              ]);
            }
          }
        }
      } catch { /* server not ready yet */ }
    };
    checkPending();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToolApprove = useCallback((tool: { requestId?: string }) => {
    if (tool.requestId) {
      service.approveAction(tool.requestId);
      // Update message UI to reflect approval
      setMessages(prev => prev.map(msg => {
        if (!msg.toolUse) return msg;
        return {
          ...msg,
          toolUse: msg.toolUse.map(t =>
            t.requestId === tool.requestId ? { ...t, approved: true } : t
          ),
        };
      }));
    }
  }, [service, setMessages]);

  const handleToolDeny = useCallback((tool: { requestId?: string }, reason?: string) => {
    if (tool.requestId) {
      service.denyAction(tool.requestId, reason);
      // Update message UI to reflect denial
      setMessages(prev => prev.map(msg => {
        if (!msg.toolUse) return msg;
        return {
          ...msg,
          toolUse: msg.toolUse.map(t =>
            t.requestId === tool.requestId
              ? { ...t, approved: false, result: reason ? `Denied: ${reason}` : 'Denied by user' }
              : t
          ),
        };
      }));
    }
  }, [service, setMessages]);

  // ── Agent status for status bar (declared early for slash commands) ──
  const [agentTokens, setAgentTokens] = useState(0);
  const [agentCost, setAgentCost] = useState(0);
  const [agentModel, setAgentModel] = useState('claude-sonnet-4-6');
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  // ── PM-6: Offline state ────────────────────────────────────────
  const [offlineStatus, setOfflineStatus] = useState<OfflineStatus>({ offline: false, since: null, queuedMessages: 0 });

  useEffect(() => {
    const fetchOfflineStatus = async () => {
      try {
        const res = await fetch(`${SERVER_BASE}/api/offline/status`);
        if (res.ok) {
          setOfflineStatus(await res.json() as OfflineStatus);
        }
      } catch {
        setOfflineStatus(prev => prev.offline ? prev : { offline: true, since: new Date().toISOString(), queuedMessages: prev.queuedMessages });
      }
    };
    fetchOfflineStatus();
    const interval = setInterval(fetchOfflineStatus, 15_000);
    return () => clearInterval(interval);
  }, []);

  // ── Slash commands ──────────────────────────────────────────────
  const addSystemMessage = useCallback((content: string) => {
    const msg: Message = {
      id: `sys-${Date.now()}`,
      role: 'system',
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, msg]);
  }, []);

  const handleSlashCommand = useCallback(async (command: string, args: string) => {
    const baseUrl = SERVER_BASE;
    try {
      switch (command) {
        case '/model': {
          if (!args) {
            addSystemMessage(`Current model: **${agentModel}**`);
          } else {
            await fetch(`${baseUrl}/api/agent/model`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ model: args }),
            });
            setAgentModel(args);
            addSystemMessage(`Switched to model: **${args}**`);
          }
          break;
        }
        case '/models': {
          const res = await fetch(`${baseUrl}/api/litellm/models`);
          if (res.ok) {
            const data = await res.json() as { models: string[] };
            const list = data.models.length > 0
              ? data.models.map(m => `- ${m}${m === agentModel ? ' **(active)**' : ''}`).join('\n')
              : 'No models available. Check LiteLLM configuration.';
            addSystemMessage(`**Available Models:**\n${list}`);
          } else {
            addSystemMessage('Failed to fetch models. Is LiteLLM running?');
          }
          break;
        }
        case '/cost': {
          const res = await fetch(`${baseUrl}/api/agent/cost`);
          if (res.ok) {
            const data = await res.json() as { summary: string };
            addSystemMessage(`**Cost:** ${data.summary}`);
          }
          break;
        }
        case '/clear': {
          setMessages([]);
          const sessionId = activeSessionId ?? activeWorkspace?.id ?? 'default';
          await fetch(`${baseUrl}/api/chat/history?session=${sessionId}`, { method: 'DELETE' });
          addSystemMessage('Conversation cleared.');
          break;
        }
        case '/identity': {
          const res = await fetch(`${baseUrl}/api/mind/identity`);
          if (res.ok) {
            const data = await res.json() as { identity: string };
            addSystemMessage(`**Identity:**\n${data.identity}`);
          }
          break;
        }
        case '/awareness': {
          const res = await fetch(`${baseUrl}/api/mind/awareness`);
          if (res.ok) {
            const data = await res.json() as { awareness: string };
            addSystemMessage(`**Awareness:**\n${data.awareness}`);
          }
          break;
        }
        case '/skills': {
          const res = await fetch(`${baseUrl}/api/skills`);
          if (res.ok) {
            const data = await res.json() as { skills: Array<{ name: string; length: number }>; count: number; directory: string };
            if (data.count === 0) {
              addSystemMessage(`No skills loaded. Add .md files to ${data.directory}`);
            } else {
              const list = data.skills.map(s => `- **${s.name}** (${s.length} chars)`).join('\n');
              addSystemMessage(`**Loaded Skills (${data.count}):**\n${list}\n\nDirectory: ${data.directory}`);
            }
          }
          break;
        }
        case '/git': {
          addSystemMessage('Git tools are available via the agent. Ask the agent to check git status.');
          break;
        }
        case '/help': {
          addSystemMessage(
            '**Available Commands:**\n\n' +
            '| Command | Description |\n' +
            '|---------|-------------|\n' +
            '| `/model [name]` | Show or switch the active LLM model |\n' +
            '| `/models` | List all available models |\n' +
            '| `/cost` | Show token usage and cost summary |\n' +
            '| `/clear` | Clear conversation history |\n' +
            '| `/identity` | Show agent identity |\n' +
            '| `/awareness` | Show agent self-awareness state |\n' +
            '| `/skills` | List loaded skills |\n' +
            '| `/git` | Git tool info |\n' +
            '| `/help` | Show this help message |\n\n' +
            '**Workflow Commands** (processed by agent):\n\n' +
            '| Command | Description |\n' +
            '|---------|-------------|\n' +
            '| `/research [topic]` | Deep research on a topic |\n' +
            '| `/draft [type]` | Draft a document |\n' +
            '| `/review [item]` | Review code or content |\n' +
            '| `/spawn [task]` | Spawn a sub-agent |\n' +
            '| `/plan [goal]` | Create a structured plan |\n\n' +
            'Other commands are sent to the server command registry.',
          );
          break;
        }
        default: {
          // Workflow commands that need LLM → send as regular agent message
          const llmCommands = ['/research', '/draft', '/review', '/spawn', '/plan'];
          if (llmCommands.includes(command)) {
            // Send the full command text as a user message so the agent handles it
            // with full workspace context + skills
            const fullText = args ? `${command} ${args}` : command;
            sendMessage(fullText);
            break;
          }

          // All other commands → try server command execution route
          const fullCommand = args ? `${command} ${args}` : command;
          const cmdRes = await fetch(`${baseUrl}/api/commands/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              command: fullCommand,
              workspaceId: activeWorkspace?.id,
            }),
          });
          if (cmdRes.ok) {
            const data = await cmdRes.json() as { result: string };
            addSystemMessage(data.result);
          } else {
            addSystemMessage(`Unknown command: ${command}. Type /help for available commands.`);
          }
          break;
        }
      }
    } catch (err) {
      addSystemMessage(`Command failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [agentModel, activeSessionId, activeWorkspace?.id, addSystemMessage, sendMessage]);

  // ── Tabs ──────────────────────────────────────────────────────────
  const {
    tabs,
    activeTabId,
    openTab,
    closeTab,
    switchTab,
    canAddTab,
  } = useTabs();

  // ── Memory ────────────────────────────────────────────────────────
  const {
    frames,
    loading: memoryLoading,
    error: memoryError,
    search: memorySearch,
    filters: memoryFilters,
    setFilters: setMemoryFilters,
    stats: memoryStats,
  } = useMemory({
    service,
    workspaceId: activeWorkspace?.id,
  });
  const [selectedFrame, setSelectedFrame] = useState<Frame | undefined>(undefined);

  // ── Events ────────────────────────────────────────────────────────
  const {
    steps,
    autoScroll,
    toggleAutoScroll,
    filter: eventFilter,
    setFilter: setEventFilter,
  } = useEvents({ service });

  // ── Onboarding ────────────────────────────────────────────────────
  const { performSetup } = useOnboardingSetup({ service });

  // Check if onboarding is needed on mount
  useEffect(() => {
    service.getConfig()
      .then((cfg) => {
        setConfig(cfg);
        const hasProviders = cfg.providers && Object.keys(cfg.providers).length > 0;
        if (!hasProviders) {
          setShowOnboarding(true);
        }
      })
      .catch(() => {
        setShowOnboarding(true);
      });
  }, [service]);

  const handleOnboardingComplete = useCallback(async (data: OnboardingData) => {
    const result = await performSetup(data);
    if (result.success) {
      setShowOnboarding(false);
      try {
        const cfg = await service.getConfig();
        setConfig(cfg);
      } catch {
        // Config will be loaded next time
      }

      // B4: Save basic personal style preferences to personal mind via a chat message
      // This seeds the personal memory so draft-from-context has style data from day 1
      try {
        const userName = data.name;
        if (userName) {
          await fetch(`${SERVER_BASE}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: `My name is ${userName}. I prefer concise, direct responses. Save this to my personal memory.`,
              workspace: 'default',
            }),
          });
        }
      } catch { /* non-blocking */ }
    }
  }, [performSetup, service]);

  const handleConfigUpdate = useCallback(async (updates: Partial<WaggleConfig>) => {
    await service.updateConfig(updates);
    setConfig((prev) => prev ? { ...prev, ...updates } : null);
    // If theme changed, toggle the ThemeProvider context too
    if (updates.theme) {
      toggleTheme();
    }
  }, [service, toggleTheme]);

  // ── Keyboard shortcuts ────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (matchesNamedShortcut(e, 'closeModal')) {
        if (previewFile) {
          setPreviewFile(null);
        } else if (showCreateWorkspace) {
          setShowCreateWorkspace(false);
        }
      }
      if (matchesNamedShortcut(e, 'toggleWorkspace')) {
        e.preventDefault();
        setSidebarCollapsed((prev) => !prev);
      }
      if (matchesNamedShortcut(e, 'newTab')) {
        e.preventDefault();
        handleNewTab();
      }
      // F6: Ctrl+K (or Cmd+K) — Global search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setGlobalSearchOpen((prev) => !prev);
      }
      // G2: Ctrl+1-9 quick-switch workspaces
      if (e.ctrlKey && !e.shiftKey && !e.altKey && e.key >= '1' && e.key <= '9') {
        const idx = parseInt(e.key, 10) - 1;
        if (idx < workspaces.length) {
          e.preventDefault();
          setActiveWorkspace(workspaces[idx].id);
        }
      }
      // Cmd+N — create workspace
      if (matchesNamedShortcut(e, 'newWorkspace')) {
        e.preventDefault();
        setShowCreateWorkspace(true);
      }
      // Cmd+, — open settings
      if (matchesNamedShortcut(e, 'openSettings')) {
        e.preventDefault();
        setCurrentView('settings');
      }
      // Cmd+/ — show help overlay
      if (matchesNamedShortcut(e, 'showHelp')) {
        e.preventDefault();
        setShowHelp(prev => !prev);
      }
      // Ctrl+Shift+P — switch persona
      if (matchesNamedShortcut(e, 'switchPersona')) {
        e.preventDefault();
        setShowPersonaSwitcher(prev => !prev);
      }
      // Ctrl+Shift+1-7 — switch views
      const viewMap: Record<string, AppView> = {
        switchView1: 'chat',
        switchView2: 'memory',
        switchView3: 'events',
        switchView4: 'capabilities',
        switchView5: 'cockpit',
        switchView6: 'mission-control',
        switchView7: 'settings',
      };
      for (const [shortcutName, view] of Object.entries(viewMap)) {
        if (matchesNamedShortcut(e, shortcutName)) {
          e.preventDefault();
          setCurrentView(view);
          break;
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [previewFile, showCreateWorkspace, workspaces, setActiveWorkspace]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Tab management ────────────────────────────────────────────────
  const handleNewTab = useCallback(() => {
    if (!canAddTab || !activeWorkspace) return;
    createSession().then((session) => {
      openTab(session.id, activeWorkspace.id, session.title ?? 'New Chat');
    });
  }, [canAddTab, activeWorkspace, createSession, openTab]);

  const handleTabSelect = useCallback((tabId: string) => {
    switchTab(tabId);
    const tab = tabs.find((t) => t.id === tabId);
    if (tab) {
      selectSession(tab.sessionId);
    }
  }, [switchTab, tabs, selectSession]);

  const handleTabClose = useCallback((tabId: string) => {
    closeTab(tabId);
  }, [closeTab]);

  // ── File drop — read, upload to ingest API, send context to agent ──
  const handleFileDrop = useCallback(async (files: DroppedFile[]) => {
    // Files with content can be ingested via the API
    const filesWithContent = files.filter((f) => f.content);
    if (filesWithContent.length === 0) {
      // Fallback: no content read, just send names
      const summary = files.map((f) => `[File: ${f.name}]`).join(', ');
      sendMessage(`I've dropped these files: ${summary}`);
      return;
    }

    try {
      const response = await fetch(`${SERVER_BASE}/api/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: filesWithContent.map((f) => ({ name: f.name, content: f.content })),
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Upload failed' }));
        sendMessage(`File upload failed: ${(err as Record<string, unknown>).error ?? 'Unknown error'}`);
        return;
      }

      const data = await response.json() as {
        files: Array<{ name: string; type: string; summary: string; content?: string }>;
      };

      // Build a rich context message for the agent with file contents
      const parts = data.files.map((f) => {
        if ((f.type === 'text' || f.type === 'document' || f.type === 'spreadsheet') && f.content) {
          const preview = f.content.length > 4000
            ? f.content.slice(0, 4000) + '\n... (truncated)'
            : f.content;
          const lang = f.type === 'spreadsheet' ? 'csv' : '';
          return `**${f.name}** (${f.summary}):\n\`\`\`${lang}\n${preview}\n\`\`\``;
        }
        if (f.type === 'csv' && f.content) {
          const preview = f.content.length > 4000
            ? f.content.slice(0, 4000) + '\n... (truncated)'
            : f.content;
          return `**${f.name}** (${f.summary}):\n\`\`\`csv\n${preview}\n\`\`\``;
        }
        if (f.type === 'image' && f.content) {
          // C5: Pass full data URI for vision-capable models, not truncated
          // The agent loop handles token counting; the model needs the full image
          return `**${f.name}** — ${f.summary}\n![${f.name}](${f.content})`;
        }
        if (f.type === 'archive' && f.content) {
          return `**${f.name}** (${f.summary}):\n\`\`\`\n${f.content}\n\`\`\``;
        }
        return `**${f.name}** — ${f.summary}`;
      });

      // Also set the first text-like file as preview in context panel
      const textFile = data.files.find((f) =>
        (f.type === 'text' || f.type === 'csv' || f.type === 'document' || f.type === 'spreadsheet') && f.content
      );
      if (textFile && textFile.content) {
        const tfName = textFile.name;
        const tfExt = tfName.includes('.') ? tfName.slice(tfName.lastIndexOf('.') + 1) : '';
        setPreviewFile({
          path: tfName,
          name: tfName,
          extension: tfExt,
          content: textFile.content,
          action: 'read',
          timestamp: new Date().toISOString(),
        });
      }

      sendMessage(
        `I've uploaded ${data.files.length} file(s). Here's the content:\n\n` +
        parts.join('\n\n')
      );
    } catch (err) {
      sendMessage(`File upload error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [sendMessage]);

  // ── File select via + button — convert raw File[] to DroppedFile[] and reuse handleFileDrop ──
  const handleFileSelect = useCallback(async (files: File[]) => {
    const droppedFiles: DroppedFile[] = [];
    for (const file of files) {
      const df = categorizeFile(file.name, file.size);
      // Read as base64
      const b64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Strip the data:...;base64, prefix
          const base64 = result.includes(',') ? result.split(',')[1] : result;
          resolve(base64);
        };
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
      });
      if (b64) {
        df.content = b64;
        droppedFiles.push(df);
      }
    }
    if (droppedFiles.length > 0) {
      handleFileDrop(droppedFiles);
    }
  }, [handleFileDrop]);

  // ── Team connection state ─────────────────────────────────────────
  const [teamConnection, setTeamConnection] = useState<import('@waggle/ui').TeamConnection | null>(null);

  // Check team status on mount
  useEffect(() => {
    adapter.getTeamStatus()
      .then((tc) => setTeamConnection(tc))
      .catch(() => {});
  }, []);

  const handleTeamConnect = useCallback(async (serverUrl: string, token: string) => {
    const tc = await adapter.connectTeam(serverUrl, token);
    setTeamConnection(tc);
  }, []);

  const handleTeamDisconnect = useCallback(async () => {
    await adapter.disconnectTeam();
    setTeamConnection(null);
  }, []);

  const handleFetchTeams = useCallback(async () => {
    return adapter.listTeams();
  }, []);

  // ── Workspace creation ────────────────────────────────────────────
  const handleCreateWorkspace = useCallback(async (wsConfig: {
    name: string;
    group: string;
    model?: string;
    personality?: string;
    directory?: string;
    teamId?: string;
    teamServerUrl?: string;
    teamRole?: 'owner' | 'admin' | 'member' | 'viewer';
    teamUserId?: string;
    templateId?: string;
    templateConnectors?: string[];
    templateCommands?: string[];
    templateMemory?: string[];
  }) => {
    await createWorkspace(wsConfig);
    setShowCreateWorkspace(false);
  }, [createWorkspace]);

  // ── Session selection from context panel ──────────────────────────
  const handleSessionSelect = useCallback((id: string) => {
    selectSession(id);
    if (activeWorkspace) {
      openTab(id, activeWorkspace.id, 'Session');
    }
  }, [selectSession, activeWorkspace, openTab]);

  const handleCreateSessionFromPanel = useCallback(() => {
    createSession().then((s) => {
      if (activeWorkspace) {
        openTab(s.id, activeWorkspace.id, s.title ?? 'New Chat');
      }
    });
  }, [createSession, activeWorkspace, openTab]);

  // ── Agent status polling ─────────────────────────────────────────
  useEffect(() => {
    // Initial fetch
    service.getAgentStatus().then((status) => {
      setAgentTokens(status.tokensUsed);
      setAgentCost(status.estimatedCost);
      setAgentModel(status.model);
    }).catch(() => {});

    // Fetch available models for the picker
    fetch(`${SERVER_BASE}/api/litellm/models`)
      .then(r => r.ok ? r.json() as Promise<{ models: string[] }> : null)
      .then(data => { if (data?.models) setAvailableModels(data.models); })
      .catch(() => {});

    const poll = setInterval(() => {
      service.getAgentStatus().then((status) => {
        setAgentTokens(status.tokensUsed);
        setAgentCost(status.estimatedCost);
        setAgentModel(status.model);
      }).catch(() => {
        // Ignore status poll errors
      });
    }, 30000); // Poll every 30s — cost/tokens don't change rapidly
    return () => clearInterval(poll);
  }, [service]);

  // ── Model selection ──────────────────────────────────────────────
  const handleModelSelect = useCallback(async (newModel: string) => {
    try {
      await fetch(`${SERVER_BASE}/api/agent/model`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: newModel }),
      });
      setAgentModel(newModel);
      addSystemMessage(`Switched to model: **${newModel}**`);
    } catch {
      addSystemMessage('Failed to switch model.');
    }
  }, [addSystemMessage]);

  // ── Persona switching (mid-conversation) ─────────────────────────
  const currentPersona = personas.find(p => p.id === activeWorkspace?.personaId) ?? null;

  const handlePersonaSwitch = useCallback(async (personaId: string | null) => {
    if (!activeWorkspace?.id) return;
    try {
      // Update workspace config via hook (calls PUT /api/workspaces/:id and updates local state)
      await updateWorkspace(activeWorkspace.id, { personaId: personaId ?? undefined });
      const personaName = personaId
        ? personas.find(p => p.id === personaId)?.name ?? personaId
        : 'Default';
      addSystemMessage(`Switched persona to **${personaName}**. Messages preserved — the next response will use the new persona.`);
    } catch {
      addSystemMessage('Failed to switch persona.');
    }
  }, [activeWorkspace?.id, updateWorkspace, personas, addSystemMessage]);

  // ── F5: Settings tab state (lifted for ContextPanel) ───────────────
  const [settingsTab, setSettingsTab] = useState('general');

  // ── F6: Global search handler ──────────────────────────────────────
  const handleGlobalSearchSelect = useCallback((type: GlobalSearchResultType, id: string) => {
    switch (type) {
      case 'workspace': {
        const ws = workspaces.find(w => w.id === id);
        if (ws) setActiveWorkspace(ws.id);
        setCurrentView('chat');
        break;
      }
      case 'command': {
        // Send the command as if typed in chat
        handleSlashCommand(id, '');
        setCurrentView('chat');
        break;
      }
      case 'settings': {
        setSettingsTab(id);
        setCurrentView('settings');
        break;
      }
    }
  }, [workspaces, setActiveWorkspace, handleSlashCommand, setSettingsTab]);

  // ── F5: Event filter state for context panel ──────────────────────
  const [eventFilters, setEventFilters] = useState<Record<string, boolean>>({
    'Tool Call': true,
    'Memory': true,
    'Search': true,
    'File': true,
    'Response': true,
  });

  // ── F5: Cockpit health refresh (calls fetchHealth in CockpitView) ──
  const handleRefreshHealth = useCallback(() => {
    // Trigger a re-fetch by toggling a key; CockpitView manages its own
    // fetch logic, but we can call the health endpoint from here too
    fetch(`${SERVER_BASE}/health`).catch(() => {});
  }, []);

  // ── Should context panel show? ────────────────────────────────────
  const showContextPanel = contextPanelOpen;

  // ── Render ────────────────────────────────────────────────────────

  if (showOnboarding) {
    return (
      <div className="fixed inset-0 z-[1000] bg-background">
        <OnboardingWizard
          onComplete={handleOnboardingComplete}
          onTestApiKey={(provider, key) => service.testApiKey(provider, key)}
        />
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <AppShell
        sidebar={
          <AppSidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed((prev) => !prev)}
            workspaces={workspaces}
            activeWorkspaceId={activeWorkspace?.id}
            onSelectWorkspace={setActiveWorkspace}
            currentView={currentView}
            onViewChange={setCurrentView}
            onCreateWorkspace={() => setShowCreateWorkspace(true)}
            onOpenSearch={() => setGlobalSearchOpen(true)}
            microStatus={workspaceMicroStatus}
          />
        }
        content={
          <div
            key={activeWorkspace?.id ?? 'none'}
            className="workspace-transition h-full overflow-hidden"
            style={{ '--workspace-hue': activeWorkspace ? workspaceHue(activeWorkspace.name) : 220 } as React.CSSProperties}
          >
            {currentView === 'chat' && (
              <ErrorBoundary viewName="Chat">
                <ChatView
                  tabs={tabs.map((t) => ({ id: t.id, label: t.title, icon: t.workspaceIcon }))}
                  activeTabId={activeTabId}
                  onTabSelect={handleTabSelect}
                  onTabClose={handleTabClose}
                  onTabAdd={handleNewTab}
                  messages={messages}
                  isLoading={isLoading}
                  onSendMessage={sendMessage}
                  onSlashCommand={handleSlashCommand}
                  onFileDrop={handleFileDrop}
                  onFileSelect={handleFileSelect}
                  onToolApprove={handleToolApprove}
                  onToolDeny={handleToolDeny}
                  workspaceContext={workspaceContext}
                  onThreadSelect={handleSessionSelect}
                  workspaceName={activeWorkspace?.name}
                  currentPersona={currentPersona}
                  onPersonaClick={() => setShowPersonaSwitcher(true)}
                  subAgents={subAgents}
                  workflowSuggestion={workflowSuggestion}
                  onWorkflowAccept={handleWorkflowAccept}
                  onWorkflowDismiss={dismissSuggestion}
                />
              </ErrorBoundary>
            )}
            {currentView === 'settings' && (
              <ErrorBoundary viewName="Settings">
                <Suspense fallback={<div className="flex items-center justify-center h-full text-muted-foreground">Loading...</div>}>
                  <SettingsView
                    config={config}
                    onConfigUpdate={handleConfigUpdate}
                    onTestApiKey={(provider, key) => service.testApiKey(provider, key)}
                    teamConnection={teamConnection}
                    onTeamConnect={handleTeamConnect}
                    onTeamDisconnect={handleTeamDisconnect}
                    activeTab={settingsTab}
                    onTabChange={setSettingsTab}
                  />
                </Suspense>
              </ErrorBoundary>
            )}
            {currentView === 'memory' && (
              <ErrorBoundary viewName="Memory">
                <Suspense fallback={<div className="flex items-center justify-center h-full text-muted-foreground">Loading...</div>}>
                  <MemoryView
                    frames={frames}
                    selectedFrame={selectedFrame}
                    onSelectFrame={setSelectedFrame}
                    onSearch={memorySearch}
                    filters={memoryFilters}
                    onFiltersChange={setMemoryFilters}
                    stats={memoryStats ?? undefined}
                    loading={memoryLoading}
                    error={memoryError}
                    onRetry={() => memorySearch('')}
                  />
                </Suspense>
              </ErrorBoundary>
            )}
            {currentView === 'events' && (
              <ErrorBoundary viewName="Events">
                <Suspense fallback={<div className="flex items-center justify-center h-full text-muted-foreground">Loading...</div>}>
                  <EventsView
                    steps={steps}
                    autoScroll={autoScroll}
                    onToggleAutoScroll={toggleAutoScroll}
                    filter={eventFilter}
                    onFilterChange={setEventFilter}
                  />
                </Suspense>
              </ErrorBoundary>
            )}
            {currentView === 'capabilities' && (
              <ErrorBoundary viewName="Capabilities">
                <Suspense fallback={<div className="flex items-center justify-center h-full text-muted-foreground">Loading...</div>}>
                  <CapabilitiesView />
                </Suspense>
              </ErrorBoundary>
            )}
            {currentView === 'cockpit' && (
              <ErrorBoundary viewName="Cockpit">
                <Suspense fallback={<div className="flex items-center justify-center h-full text-muted-foreground">Loading...</div>}>
                  <CockpitView />
                </Suspense>
              </ErrorBoundary>
            )}
            {currentView === 'mission-control' && (
              <ErrorBoundary viewName="Mission Control">
                <Suspense fallback={<div className="flex items-center justify-center h-full text-muted-foreground">Loading...</div>}>
                  <MissionControlView />
                </Suspense>
              </ErrorBoundary>
            )}
          </div>
        }
        contextPanel={
          showContextPanel ? (
            <ContextPanel
              currentView={currentView}
              groupedSessions={groupedSessions}
              activeSessionId={activeSessionId ?? undefined}
              onSelectSession={handleSessionSelect}
              onCreateSession={handleCreateSessionFromPanel}
              onDeleteSession={deleteSession}
              onRenameSession={renameSession}
              selectedFrame={selectedFrame}
              previewFile={previewFile}
              onClosePreview={() => setPreviewFile(null)}
              recentMemories={workspaceContext?.recentMemories}
              onExportSession={exportSession}
              onSearchSessions={doSearchSessions}
              searchResults={searchResults}
              searchLoading={searchLoading}
              onClearSearch={clearSearch}
              teamMembers={teamMembers}
              teamActivity={teamActivity}
              teamActivityLoading={teamActivityLoading}
              teamMessages={teamMessages}
              onRefreshHealth={handleRefreshHealth}
              settingsTab={settingsTab}
              eventFilters={eventFilters}
              onEventFiltersChange={setEventFilters}
            />
          ) : undefined
        }
        statusBar={
          <StatusBar
            model={friendlyModelName(agentModel)}
            workspace={activeWorkspace?.name ?? 'Default'}
            tokens={agentTokens}
            cost={agentCost}
            mode="local"
            availableModels={availableModels}
            onModelSelect={handleModelSelect}
            offlineStatus={offlineStatus}
          />
        }
      />

      {/* F6: Global search */}
      <GlobalSearch
        open={globalSearchOpen}
        onClose={() => setGlobalSearchOpen(false)}
        onSelect={handleGlobalSearchSelect}
        workspaces={workspaces}
      />

      {/* Keyboard shortcuts help overlay */}
      <KeyboardShortcutsHelp
        open={showHelp}
        onClose={() => setShowHelp(false)}
      />

      {/* Persona switcher dialog (Ctrl+Shift+P) */}
      <PersonaSwitcher
        open={showPersonaSwitcher}
        onClose={() => setShowPersonaSwitcher(false)}
        onSelect={handlePersonaSwitch}
        currentPersonaId={activeWorkspace?.personaId ?? null}
        personas={personas}
      />

      {/* Create workspace modal */}
      <CreateWorkspaceDialog
        isOpen={showCreateWorkspace}
        onClose={() => setShowCreateWorkspace(false)}
        onSubmit={handleCreateWorkspace}
        isTeamConnected={teamConnection !== null}
        teamServerUrl={teamConnection?.serverUrl}
        teamUserId={teamConnection?.userId}
        onFetchTeams={handleFetchTeams}
      />

      {/* File preview modal — B6: with "Open" button via Tauri shell */}
      {previewFile && (
        <Modal
          isOpen={true}
          onClose={() => setPreviewFile(null)}
          title={previewFile.path}
        >
          <FilePreview
            file={previewFile}
            onOpenInApp={async (filePath) => {
              try {
                const mod = '@tauri-apps/' + 'plugin-opener';
                const { open } = await import(/* @vite-ignore */ mod);
                await open(filePath);
              } catch {
                // Fallback: try to open via shell command
                try {
                  const { invoke } = await import('@tauri-apps/api/core');
                  await invoke('open_path', { path: filePath });
                } catch {
                  // Last resort: copy path to clipboard
                  navigator.clipboard?.writeText(filePath);
                }
              }
            }}
            onCopyPath={(filePath) => {
              navigator.clipboard?.writeText(filePath);
            }}
          />
        </Modal>
      )}
    </>
  );
}

export function App() {
  return (
    <ErrorBoundary viewName="Waggle">
      <ThemeProvider defaultTheme="dark">
        <ServiceProvider adapter={adapter}>
          <WaggleApp />
        </ServiceProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
