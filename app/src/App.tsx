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

import { useState, useEffect, useCallback } from 'react';
import type { Message, WaggleConfig, Frame, OnboardingData, FileEntry, DroppedFile } from '@waggle/ui';
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
  matchesNamedShortcut,
} from '@waggle/ui';
import { ServiceProvider, useService } from './providers/ServiceProvider';
import { AppSidebar } from './components/AppSidebar';
import { ContextPanel } from './components/ContextPanel';
import { ChatView } from './views/ChatView';
import { SettingsView } from './views/SettingsView';
import { MemoryView } from './views/MemoryView';
import { EventsView } from './views/EventsView';

const adapter = new LocalAdapter({ baseUrl: 'http://127.0.0.1:3333' });

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

type AppView = 'chat' | 'settings' | 'memory' | 'events';

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

  // ── Workspaces ────────────────────────────────────────────────────
  const {
    workspaces,
    activeWorkspace,
    setActiveWorkspace,
    createWorkspace,
  } = useWorkspaces({ service });

  // ── Sessions ──────────────────────────────────────────────────────
  const {
    grouped: groupedSessions,
    activeSessionId,
    selectSession,
    createSession,
    deleteSession,
    renameSession,
  } = useSessions({
    service,
    workspaceId: activeWorkspace?.id ?? 'default',
  });

  // ── Chat ──────────────────────────────────────────────────────────
  const {
    messages,
    setMessages,
    isLoading,
    sendMessage,
  } = useChat({
    service,
    workspace: activeWorkspace?.id ?? 'default',
    session: activeSessionId ?? undefined,
  });

  // ── Approval gate (listens for WebSocket-based approval events) ──
  useApprovalGate({ service, setMessages });

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
    const baseUrl = 'http://127.0.0.1:3333';
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
        case '/plan': {
          addSystemMessage('Plan tools are available via the agent. Ask the agent to show the plan.');
          break;
        }
        case '/git': {
          addSystemMessage('Git tools are available via the agent. Ask the agent to check git status.');
          break;
        }
        case '/help': {
          addSystemMessage(
            '**Commands:**\n' +
            '- `/model <name>` — Switch AI model\n' +
            '- `/models` — List available models\n' +
            '- `/cost` — Show token usage and cost\n' +
            '- `/clear` — Clear conversation\n' +
            '- `/identity` — Show agent identity\n' +
            '- `/awareness` — Show agent awareness\n' +
            '- `/skills` — List loaded skills\n' +
            '- `/help` — Show this help'
          );
          break;
        }
        default:
          addSystemMessage(`Unknown command: ${command}. Type /help for available commands.`);
      }
    } catch (err) {
      addSystemMessage(`Command failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [agentModel, activeSessionId, activeWorkspace?.id, addSystemMessage]);

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
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [previewFile, showCreateWorkspace]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // ── File drop ─────────────────────────────────────────────────────
  const handleFileDrop = useCallback((files: DroppedFile[]) => {
    const summary = files.map((f) => `[File: ${f.name}]`).join(', ');
    sendMessage(`I've dropped these files: ${summary}`);
  }, [sendMessage]);

  // ── Workspace creation ────────────────────────────────────────────
  const handleCreateWorkspace = useCallback(async (wsConfig: {
    name: string;
    group: string;
    model?: string;
    personality?: string;
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
    fetch('http://127.0.0.1:3333/api/litellm/models')
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
    }, 5000);
    return () => clearInterval(poll);
  }, [service]);

  // ── Model selection ──────────────────────────────────────────────
  const handleModelSelect = useCallback(async (newModel: string) => {
    try {
      await fetch('http://127.0.0.1:3333/api/agent/model', {
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

  // ── Should context panel show? ────────────────────────────────────
  const showContextPanel = contextPanelOpen && (
    currentView === 'chat' ||
    (currentView === 'memory' && selectedFrame !== undefined)
  );

  // ── Render ────────────────────────────────────────────────────────

  if (showOnboarding) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'var(--bg)',
      }}>
        <OnboardingWizard
          onComplete={handleOnboardingComplete}
          onTestApiKey={(provider, key) => service.testApiKey(provider, key)}
        />
      </div>
    );
  }

  return (
    <>
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
          />
        }
        content={
          <>
            {currentView === 'chat' && (
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
                onToolApprove={handleToolApprove}
                onToolDeny={handleToolDeny}
              />
            )}
            {currentView === 'settings' && (
              <SettingsView
                config={config}
                onConfigUpdate={handleConfigUpdate}
                onTestApiKey={(provider, key) => service.testApiKey(provider, key)}
              />
            )}
            {currentView === 'memory' && (
              <MemoryView
                frames={frames}
                selectedFrame={selectedFrame}
                onSelectFrame={setSelectedFrame}
                onSearch={memorySearch}
                filters={memoryFilters}
                onFiltersChange={setMemoryFilters}
                stats={memoryStats ?? undefined}
                loading={memoryLoading}
              />
            )}
            {currentView === 'events' && (
              <EventsView
                steps={steps}
                autoScroll={autoScroll}
                onToggleAutoScroll={toggleAutoScroll}
                filter={eventFilter}
                onFilterChange={setEventFilter}
              />
            )}
          </>
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
          />
        }
      />

      {/* Create workspace modal */}
      <CreateWorkspaceDialog
        isOpen={showCreateWorkspace}
        onClose={() => setShowCreateWorkspace(false)}
        onSubmit={handleCreateWorkspace}
      />

      {/* File preview modal */}
      {previewFile && (
        <Modal
          isOpen={true}
          onClose={() => setPreviewFile(null)}
          title={previewFile.path}
        >
          <FilePreview file={previewFile} />
        </Modal>
      )}
    </>
  );
}

export function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <ServiceProvider adapter={adapter}>
        <WaggleApp />
      </ServiceProvider>
    </ThemeProvider>
  );
}

export default App;
