/**
 * ChatView — Composes tab bar, ChatArea, and FileDropZone.
 * Shows workspace home with catch-up prompts when no messages exist.
 * Supports slash commands.
 * Includes persona indicator in the chat header area.
 * Displays sub-agent progress and workflow suggestions via SSE.
 */

import type { Message, DroppedFile, ToolUseEvent, WorkspaceContext, SubAgentInfo } from '@waggle/ui';
import { ChatArea, FileDropZone, Tabs, WorkflowSuggestionCard } from '@waggle/ui';
import type { Tab } from '@waggle/ui';
import type { WorkflowSuggestion } from '@waggle/ui';

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
  /** Current persona (null = none) */
  currentPersona?: { id: string; name: string; icon: string } | null;
  /** Called when user clicks the persona indicator to open the switcher */
  onPersonaClick?: () => void;
  /** Active sub-agents from SSE (real-time progress) */
  subAgents?: SubAgentInfo[];
  /** Current workflow suggestion from SSE */
  workflowSuggestion?: WorkflowSuggestion | null;
  /** Called when user accepts a workflow suggestion */
  onWorkflowAccept?: (pattern: WorkflowSuggestion['pattern']) => void;
  /** Called when user dismisses a workflow suggestion */
  onWorkflowDismiss?: () => void;
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
  currentPersona,
  onPersonaClick,
  subAgents,
  workflowSuggestion,
  onWorkflowAccept,
  onWorkflowDismiss,
}: ChatViewProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Chat header: tabs + persona indicator */}
      <div className="flex items-center gap-2">
        {tabs.length > 0 && (
          <div className="flex-1 min-w-0">
            <Tabs
              tabs={tabs.map((t) => ({ id: t.id, label: t.label, icon: t.icon }))}
              activeId={activeTabId ?? ''}
              onSelect={onTabSelect}
              onClose={onTabClose}
              onAdd={onTabAdd}
            />
          </div>
        )}
        {/* Persona indicator — clickable chip in the chat header */}
        {currentPersona && onPersonaClick && (
          <button
            type="button"
            onClick={onPersonaClick}
            className="flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors cursor-pointer shrink-0 mr-2"
            title={`Persona: ${currentPersona.name} (Ctrl+Shift+P to switch)`}
          >
            <span>{currentPersona.icon}</span>
            <span className="font-medium">{currentPersona.name}</span>
          </button>
        )}
        {/* Show a subtle "no persona" button if handler exists but no persona set */}
        {!currentPersona && onPersonaClick && (
          <button
            type="button"
            onClick={onPersonaClick}
            className="flex items-center gap-1.5 rounded-full border border-transparent px-2.5 py-1 text-xs text-muted-foreground/50 hover:text-muted-foreground hover:border-border transition-colors cursor-pointer shrink-0 mr-2"
            title="Switch persona (Ctrl+Shift+P)"
          >
            <span className="text-[10px]">--</span>
            <span>Persona</span>
          </button>
        )}
      </div>
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
            scrollKey={activeTabId ?? undefined}
            subAgents={subAgents ?? []}
          />
        </FileDropZone>
      </div>

      {/* Workflow suggestion card — shown above the input area when a pattern is detected */}
      {workflowSuggestion && onWorkflowAccept && onWorkflowDismiss && (
        <WorkflowSuggestionCard
          pattern={workflowSuggestion.pattern}
          onAccept={() => onWorkflowAccept(workflowSuggestion.pattern)}
          onDismiss={onWorkflowDismiss}
        />
      )}
    </div>
  );
}
