/**
 * ChatView — Composes tab bar, ChatArea, and FileDropZone.
 * Shows a branded empty state when no messages exist.
 */

import type { Message, DroppedFile } from '@waggle/ui';
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
  onFileDrop: (files: DroppedFile[]) => void;
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
  onFileDrop,
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
          />
        </FileDropZone>
      </div>
    </div>
  );
}
