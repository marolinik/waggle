/**
 * ChatView — Composes tab bar, ChatArea, and FileDropZone.
 * Shows workspace home with catch-up prompts when no messages exist.
 * Supports slash commands.
 */

import type { Message, DroppedFile, ToolUseEvent, WorkspaceContext } from '@waggle/ui';
import { ChatArea, FileDropZone, Tabs } from '@waggle/ui';
import type { Tab } from '@waggle/ui';

export interface ChatViewProps {
  tabs: Tab[];
  activeTabId: string | null;
  onTabSelect: (id: string) => void;
  onTabClose: (id: string) => void;
  onTabAdd: () => void;
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onSlashCommand?: (command: string, args: string) => void;
  onFileDrop: (files: DroppedFile[]) => void;
  onFileSelect?: (files: File[]) => void;
  onToolApprove?: (tool: ToolUseEvent) => void;
  onToolDeny?: (tool: ToolUseEvent, reason?: string) => void;
  workspaceContext?: WorkspaceContext | null;
  onThreadSelect?: (sessionId: string) => void;
  /** F7: Active workspace name for contextual empty state */
  workspaceName?: string;
}

export function ChatView({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  onTabAdd,
  messages,
  isLoading,
  onSendMessage,
  onSlashCommand,
  onFileDrop,
  onFileSelect,
  onToolApprove,
  onToolDeny,
  workspaceContext,
  onThreadSelect,
  workspaceName,
}: ChatViewProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {tabs.length > 0 && (
        <Tabs
          tabs={tabs.map((t) => ({ id: t.id, label: t.label, icon: t.icon }))}
          activeId={activeTabId ?? ''}
          onSelect={onTabSelect}
          onClose={onTabClose}
          onAdd={onTabAdd}
        />
      )}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <FileDropZone onDrop={onFileDrop} disabled={isLoading}>
          <ChatArea
            messages={messages}
            isLoading={isLoading}
            onSendMessage={onSendMessage}
            onSlashCommand={onSlashCommand}
            onFileSelect={onFileSelect}
            onToolApprove={onToolApprove}
            onToolDeny={onToolDeny}
            workspaceContext={workspaceContext}
            onThreadSelect={onThreadSelect}
            workspaceName={workspaceName}
          />
        </FileDropZone>
      </div>
    </div>
  );
}
