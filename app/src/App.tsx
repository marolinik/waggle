/**
 * App.tsx — Main Waggle desktop application.
 *
 * Uses @waggle/ui components with the LocalAdapter service.
 * Layout: AppShell with Sidebar (workspace tree), ChatArea, and StatusBar.
 */

import { useState } from 'react';
import {
  ThemeProvider,
  AppShell,
  Sidebar,
  StatusBar,
  ChatArea,
  WorkspaceTree,
  LocalAdapter,
  useChat,
  useWorkspaces,
} from '@waggle/ui';
import { ServiceProvider, useService } from './providers/ServiceProvider';

const adapter = new LocalAdapter({ baseUrl: 'http://127.0.0.1:3333' });

function WaggleApp() {
  const service = useService();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const {
    workspaces,
    activeWorkspace,
    setActiveWorkspace,
  } = useWorkspaces({ service });

  const {
    messages,
    isLoading,
    sendMessage,
  } = useChat({
    service,
    workspace: activeWorkspace?.id ?? 'default',
  });

  return (
    <AppShell
      sidebar={
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((prev) => !prev)}
        >
          <WorkspaceTree
            workspaces={workspaces}
            activeId={activeWorkspace?.id}
            onSelect={setActiveWorkspace}
          />
        </Sidebar>
      }
      content={
        <ChatArea
          messages={messages}
          isLoading={isLoading}
          onSendMessage={sendMessage}
        />
      }
      statusBar={
        <StatusBar
          model={activeWorkspace?.model ?? 'claude-3.5-sonnet'}
          workspace={activeWorkspace?.name ?? 'Default'}
          tokens={0}
          cost={0}
          mode="local"
        />
      }
    />
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
