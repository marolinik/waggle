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
  AppShell,
  Sidebar,
  StatusBar,
  ChatArea,
  WorkspaceTree,
  CreateWorkspaceDialog,
  Tabs,
  Modal,
  SettingsPanel,
  OnboardingWizard,
  MemoryBrowser,
  EventStream,
  SessionList,
  FilePreview,
  FileDropZone,
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

const adapter = new LocalAdapter({ baseUrl: 'http://127.0.0.1:3333' });

type AppView = 'chat' | 'settings' | 'memory' | 'events';

function WaggleApp() {
  const service = useService();

  // ── View state ────────────────────────────────────────────────────
  const [currentView, setCurrentView] = useState<AppView>('chat');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
  const [messages, setMessages] = useState<Message[]>([]);
  const {
    messages: chatMessages,
    isLoading,
    sendMessage,
  } = useChat({
    service,
    workspace: activeWorkspace?.id ?? 'default',
    session: activeSessionId ?? undefined,
  });

  // Sync chatMessages into local state for approval gate
  useEffect(() => {
    setMessages(chatMessages);
  }, [chatMessages]);

  // ── Approval gate (side-effect: listens for approval_required events) ──
  const _approvalGate = useApprovalGate({
    service,
    setMessages,
  });
  void _approvalGate;

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
        // If no providers configured, show onboarding
        const hasProviders = cfg.providers && Object.keys(cfg.providers).length > 0;
        if (!hasProviders) {
          setShowOnboarding(true);
        }
      })
      .catch(() => {
        // If config fetch fails, show onboarding
        setShowOnboarding(true);
      });
  }, [service]);

  const handleOnboardingComplete = useCallback(async (data: OnboardingData) => {
    const result = await performSetup(data);
    if (result.success) {
      setShowOnboarding(false);
      // Reload config
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
  }, [service]);

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
    // Include dropped file names in the next message
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

  // ── Navigation icons for sidebar bottom ───────────────────────────
  const navIconStyle = (view: AppView) => ({
    background: currentView === view ? 'rgba(59, 130, 246, 0.2)' : 'none',
    border: 'none',
    color: currentView === view ? '#60a5fa' : 'var(--waggle-text, #e0e0e0)',
    cursor: 'pointer' as const,
    padding: sidebarCollapsed ? '10px 0' : '8px 12px',
    width: '100%',
    textAlign: 'left' as const,
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    borderRadius: '4px',
    transition: 'background 0.15s',
  });

  const sidebarBottomItems = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '0 4px' }}>
      <button
        style={navIconStyle('chat')}
        onClick={() => setCurrentView('chat')}
        title="Chat"
      >
        {sidebarCollapsed ? '\uD83D\uDCAC' : '\uD83D\uDCAC Chat'}
      </button>
      <button
        style={navIconStyle('memory')}
        onClick={() => setCurrentView('memory')}
        title="Memory"
      >
        {sidebarCollapsed ? '\uD83E\uDDE0' : '\uD83E\uDDE0 Memory'}
      </button>
      <button
        style={navIconStyle('events')}
        onClick={() => setCurrentView('events')}
        title="Events"
      >
        {sidebarCollapsed ? '\uD83D\uDCCB' : '\uD83D\uDCCB Events'}
      </button>
      <button
        style={navIconStyle('settings')}
        onClick={() => setCurrentView('settings')}
        title="Settings"
      >
        {sidebarCollapsed ? '\u2699\uFE0F' : '\u2699\uFE0F Settings'}
      </button>
      <button
        style={{
          ...navIconStyle('chat'),
          background: 'none',
          color: '#60a5fa',
          marginTop: '4px',
          borderTop: '1px solid var(--waggle-border, #333)',
          paddingTop: '8px',
        }}
        onClick={() => setShowCreateWorkspace(true)}
        title="Create Workspace"
      >
        {sidebarCollapsed ? '+' : '+ New Workspace'}
      </button>
    </div>
  );

  // ── Session context panel (right side, visible in chat view) ───────
  const sessionContextPanel = currentView === 'chat' ? (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        padding: '12px',
        borderBottom: '1px solid var(--waggle-border, #333)',
        fontSize: '13px',
        fontWeight: 600,
        color: 'var(--waggle-text, #e0e0e0)',
      }}>
        Sessions
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <SessionList
          grouped={groupedSessions}
          activeSessionId={activeSessionId ?? undefined}
          onSelectSession={(id) => {
            selectSession(id);
            if (activeWorkspace) {
              openTab(id, activeWorkspace.id, 'Session');
            }
          }}
          onCreateSession={() => {
            createSession().then((s) => {
              if (activeWorkspace) {
                openTab(s.id, activeWorkspace.id, s.title ?? 'New Chat');
              }
            });
          }}
          onDeleteSession={deleteSession}
          onRenameSession={renameSession}
        />
      </div>
    </div>
  ) : undefined;

  // ── Main content area ─────────────────────────────────────────────
  const renderContent = () => {
    switch (currentView) {
      case 'chat':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Tab bar */}
            {tabs.length > 0 && (
              <Tabs
                tabs={tabs.map((t) => ({ id: t.id, label: t.title, icon: t.workspaceIcon }))}
                activeId={activeTabId ?? ''}
                onSelect={handleTabSelect}
                onClose={handleTabClose}
                onAdd={handleNewTab}
              />
            )}
            {/* Chat with file drop zone */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <FileDropZone onDrop={handleFileDrop} disabled={isLoading}>
                <ChatArea
                  messages={messages}
                  isLoading={isLoading}
                  onSendMessage={sendMessage}
                />
              </FileDropZone>
            </div>
          </div>
        );

      case 'settings':
        return config ? (
          <SettingsPanel
            config={config}
            onConfigUpdate={handleConfigUpdate}
            onTestApiKey={(provider, key) => service.testApiKey(provider, key)}
          />
        ) : (
          <div style={{ padding: 24, color: '#999' }}>Loading settings...</div>
        );

      case 'memory':
        return (
          <MemoryBrowser
            frames={frames}
            selectedFrame={selectedFrame}
            onSelectFrame={setSelectedFrame}
            onSearch={memorySearch}
            filters={memoryFilters}
            onFiltersChange={setMemoryFilters}
            stats={memoryStats ?? undefined}
            loading={memoryLoading}
          />
        );

      case 'events':
        return (
          <EventStream
            steps={steps}
            autoScroll={autoScroll}
            onToggleAutoScroll={toggleAutoScroll}
            filter={eventFilter}
            onFilterChange={setEventFilter}
          />
        );
    }
  };

  // ── Agent status for status bar ───────────────────────────────────
  const [agentTokens, setAgentTokens] = useState(0);
  const [agentCost, setAgentCost] = useState(0);

  useEffect(() => {
    const poll = setInterval(() => {
      service.getAgentStatus().then((status) => {
        setAgentTokens(status.tokensUsed);
        setAgentCost(status.estimatedCost);
      }).catch(() => {
        // Ignore status poll errors
      });
    }, 5000);
    return () => clearInterval(poll);
  }, [service]);

  return (
    <>
      <AppShell
        sidebar={
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed((prev) => !prev)}
            bottomItems={sidebarBottomItems}
          >
            <WorkspaceTree
              workspaces={workspaces}
              activeId={activeWorkspace?.id}
              onSelect={setActiveWorkspace}
            />
          </Sidebar>
        }
        content={renderContent()}
        contextPanel={sessionContextPanel}
        statusBar={
          <StatusBar
            model={activeWorkspace?.model ?? 'claude-sonnet-4-20250514'}
            workspace={activeWorkspace?.name ?? 'Default'}
            tokens={agentTokens}
            cost={agentCost}
            mode="local"
          />
        }
      />

      {/* Onboarding overlay */}
      {showOnboarding && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          background: '#0a0a1a',
        }}>
          <OnboardingWizard
            onComplete={handleOnboardingComplete}
            onTestApiKey={(provider, key) => service.testApiKey(provider, key)}
          />
        </div>
      )}

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
