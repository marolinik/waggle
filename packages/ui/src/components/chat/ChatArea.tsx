/**
 * ChatArea — main chat container component.
 *
 * Renders a scrollable list of ChatMessage components with a ChatInput at the bottom.
 * Auto-scrolls to bottom on new messages. Supports slash commands.
 *
 * When no messages exist and workspace context is available, shows the
 * "Workspace Now" block with summary, suggested prompts, and recent threads.
 */

import { useRef, useEffect, useState } from 'react';
import type { Message, ToolUseEvent, WorkspaceContext } from '../../services/types.js';
import { ChatMessage } from './ChatMessage.js';
import { ChatInput, CLIENT_COMMANDS, type SlashCommand } from './ChatInput.js';
import { SubAgentProgress, type SubAgentInfo } from './SubAgentProgress.js';
import type { FeedbackRating, FeedbackReason } from './FeedbackButtons.js';

/** Scroll positions keyed by workspace/session for persistence across switches */
const scrollPositions = new Map<string, number>();

function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(isoDate).toLocaleDateString();
}

/** F7: Derive contextual suggestion chips based on workspace name */
function getContextualSuggestions(workspaceName?: string): string[] {
  if (!workspaceName) {
    return ['/help to see commands', 'Start by telling me about your project', '/research [topic]'];
  }
  const lower = workspaceName.toLowerCase();
  if (lower.includes('research')) {
    return ['/research [topic]', 'Find recent papers on...', 'Compare approaches to...'];
  }
  if (lower.includes('project') || lower.includes('dev') || lower.includes('build')) {
    return ['/catchup', 'Review project status', 'Plan next sprint'];
  }
  if (lower.includes('write') || lower.includes('draft') || lower.includes('blog') || lower.includes('content')) {
    return ['/draft [type]', 'Help me outline...', 'Review and improve my draft'];
  }
  if (lower.includes('plan') || lower.includes('strategy')) {
    return ['/plan [goal]', 'Break down this goal...', 'What should I prioritize?'];
  }
  if (lower.includes('code') || lower.includes('eng')) {
    return ['/review [file]', 'Help me debug...', 'Explain this code'];
  }
  return ['/help to see commands', 'Start by telling me about your project', '/research [topic]'];
}

export interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onSlashCommand?: (command: string, args: string) => void;
  onFileSelect?: (files: File[]) => void;
  onToolApprove?: (tool: ToolUseEvent) => void;
  onToolDeny?: (tool: ToolUseEvent, reason?: string) => void;
  /** Workspace context for the "Workspace Now" catch-up block */
  workspaceContext?: WorkspaceContext | null;
  /** Called when user clicks a recent thread to resume it */
  onThreadSelect?: (sessionId: string) => void;
  /** F7: Active workspace name for contextual empty state suggestions */
  workspaceName?: string;
  /** Session key for scroll position persistence (workspace ID or session ID) */
  scrollKey?: string;
  /** Active sub-agents for SubAgentProgress panel */
  subAgents?: SubAgentInfo[];
  /** Session ID for feedback attribution */
  sessionId?: string;
  /** Called when user submits feedback on a message (thumbs up/down) */
  onFeedback?: (messageIndex: number, rating: FeedbackRating, reason?: FeedbackReason, detail?: string) => void;
}

export function ChatArea({ messages, isLoading, onSendMessage, onSlashCommand, onFileSelect, onToolApprove, onToolDeny, workspaceContext, onThreadSelect, workspaceName, scrollKey, subAgents, sessionId, onFeedback }: ChatAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevMessageCount = useRef(messages.length);
  const [mergedCommands, setMergedCommands] = useState<SlashCommand[] | undefined>(undefined);

  // Fetch server commands on mount and merge with client-only commands
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('http://127.0.0.1:3333/api/capabilities/status');
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;

        // Map server command format → SlashCommand format
        const serverCmds: SlashCommand[] = (data.commands ?? []).map(
          (c: { name: string; description: string; usage?: string }) => {
            const slashName = c.name.startsWith('/') ? c.name : `/${c.name}`;
            // Extract args from usage: e.g. "/catchup <topic>" → "<topic>"
            let args: string | undefined;
            if (c.usage) {
              const spaceIdx = c.usage.indexOf(' ');
              if (spaceIdx > 0) {
                args = c.usage.slice(spaceIdx + 1).trim() || undefined;
              }
            }
            return { name: slashName, description: c.description, args };
          }
        );

        // Merge: server commands take precedence, then add client-only commands not in server list
        const serverNames = new Set(serverCmds.map(c => c.name));
        const clientOnly = CLIENT_COMMANDS.filter(c => !serverNames.has(c.name));
        setMergedCommands([...serverCmds, ...clientOnly]);
      } catch {
        // Server unavailable — ChatInput will fall back to CLIENT_COMMANDS
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Restore scroll position when switching sessions
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !scrollKey) return;
    const saved = scrollPositions.get(scrollKey);
    if (saved !== undefined) {
      el.scrollTop = saved;
    } else {
      // New session — scroll to bottom
      el.scrollTop = el.scrollHeight;
    }
    return () => {
      // Save position when unmounting / switching away
      if (scrollRef.current && scrollKey) {
        scrollPositions.set(scrollKey, scrollRef.current.scrollTop);
      }
    };
  }, [scrollKey]);

  // Auto-scroll to bottom only when NEW messages arrive
  useEffect(() => {
    if (messages.length > prevMessageCount.current) {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
    prevMessageCount.current = messages.length;
  }, [messages]);

  const showWorkspaceHome = messages.length === 0 && workspaceContext;

  return (
    <div className="flex flex-col h-full">
      {/* Messages list — scrollable */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
      >
        {/* Workspace Home — shown when entering a workspace with no messages */}
        {showWorkspaceHome && (
          <div className="max-w-2xl mx-auto py-8 space-y-6">
            {workspaceContext.stats.memoryCount > 0 && workspaceContext.stats.sessionCount > 1 && (
              <div className="text-sm text-muted-foreground">
                Welcome back — here's where things stand.
              </div>
            )}
            <div className="space-y-2">
              <div className="text-muted-foreground/40">
                <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
                  <path d="M24 4L6 14v20l18 10 18-10V14L24 4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" opacity="0.3"/>
                  <path d="M24 14l-10 6v12l10 6 10-6V20l-10-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" opacity="0.6"/>
                  <circle cx="24" cy="26" r="3" fill="currentColor" opacity="0.4"/>
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-foreground">{workspaceContext.workspace.name}</h2>
              {workspaceContext.workspace.group && (
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">{workspaceContext.workspace.group}</span>
              )}
              <div className="text-sm text-muted-foreground">
                {workspaceContext.stats.memoryCount > 0
                  ? `${workspaceContext.stats.memoryCount} memories · ${workspaceContext.stats.sessionCount} sessions${workspaceContext.stats.fileCount ? ` · ${workspaceContext.stats.fileCount} files` : ''}`
                  : 'No memories yet'}
                {workspaceContext.workspace.model && ` · ${workspaceContext.workspace.model}`}
              </div>
              {workspaceContext.lastActive && (
                <div className="text-xs text-muted-foreground/60">
                  Last active: {formatRelativeTime(workspaceContext.lastActive)}
                </div>
              )}
            </div>

            {/* Summary */}
            {workspaceContext.summary && (
              <div className="text-sm text-foreground leading-relaxed bg-card border border-border rounded-lg p-4">
                {workspaceContext.summary}
              </div>
            )}

            {/* Recent decisions */}
            {workspaceContext.recentDecisions?.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Recent decisions</h3>
                <div className="space-y-1.5">
                  {workspaceContext.recentDecisions.slice(0, 3).map((decision, i) => (
                    <div key={i} className="flex items-start gap-2 bg-card border border-border rounded-lg px-4 py-2.5">
                      <span className="text-sm text-foreground leading-relaxed flex-1">{decision.content}</span>
                      <span className="text-xs text-muted-foreground/60 shrink-0">{decision.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Progress items — tasks, completions, blockers */}
            {workspaceContext.progressItems && workspaceContext.progressItems.length > 0 && (
              <div className="space-y-3">
                {workspaceContext.progressItems.some(p => p.type === 'blocker') && (
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-semibold text-destructive">Blockers</h3>
                    {workspaceContext.progressItems.filter(p => p.type === 'blocker').slice(0, 3).map((item, i) => (
                      <div key={`b-${i}`} className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-2.5">
                        <span className="text-destructive shrink-0" title="Blocker">{'\u25A0'}</span>
                        <span className="text-sm text-foreground leading-relaxed flex-1">{item.content}</span>
                        <span className="text-xs text-muted-foreground/60 shrink-0">{item.date}</span>
                      </div>
                    ))}
                  </div>
                )}
                {workspaceContext.progressItems.some(p => p.type === 'task') && (
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-semibold text-foreground">Open items</h3>
                    {workspaceContext.progressItems.filter(p => p.type === 'task').slice(0, 3).map((item, i) => (
                      <div key={`t-${i}`} className="flex items-start gap-2 bg-card border border-border rounded-lg px-4 py-2.5">
                        <span className="text-muted-foreground shrink-0" title="Task">{'\u25CB'}</span>
                        <span className="text-sm text-foreground leading-relaxed flex-1">{item.content}</span>
                        <span className="text-xs text-muted-foreground/60 shrink-0">{item.date}</span>
                      </div>
                    ))}
                  </div>
                )}
                {workspaceContext.progressItems.some(p => p.type === 'completed') && (
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-semibold text-green-500">Recently completed</h3>
                    {workspaceContext.progressItems.filter(p => p.type === 'completed').slice(0, 3).map((item, i) => (
                      <div key={`c-${i}`} className="flex items-start gap-2 bg-card border border-border rounded-lg px-4 py-2.5 opacity-70">
                        <span className="text-green-500 shrink-0" title="Done">{'\u25CF'}</span>
                        <span className="text-sm text-foreground leading-relaxed flex-1">{item.content}</span>
                        <span className="text-xs text-muted-foreground/60 shrink-0">{item.date}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Recent threads */}
            {workspaceContext.recentThreads.length > 0 && (
              <div className="space-y-1.5">
                <h3 className="text-sm font-semibold text-foreground">Recent threads</h3>
                {workspaceContext.recentThreads.slice(0, 3).map(thread => (
                  <div
                    key={thread.id}
                    className={`bg-card border border-border rounded-lg px-4 py-2.5 text-sm text-foreground ${onThreadSelect ? 'cursor-pointer hover:border-primary/30 transition-colors' : ''}`}
                    onClick={onThreadSelect ? () => onThreadSelect(thread.id) : undefined}
                  >
                    {thread.title}
                  </div>
                ))}
              </div>
            )}

            {/* Key memories */}
            {workspaceContext.recentMemories?.length > 0 && (
              <div className="space-y-1.5">
                <h3 className="text-sm font-semibold text-foreground">Key memories</h3>
                {workspaceContext.recentMemories.slice(0, 3).map((memory, i) => (
                  <div key={i} className="flex items-start gap-2 bg-card border border-border rounded-lg px-4 py-2.5">
                    <span className={`shrink-0 ${memory.importance === 'critical' ? 'text-primary' : memory.importance === 'important' ? 'text-primary/60' : 'text-muted-foreground'}`}>
                      {memory.importance === 'critical' ? '\u25C6' : memory.importance === 'important' ? '\u25C7' : '\u25CB'}
                    </span>
                    <span className="text-sm text-foreground leading-relaxed">{memory.content}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Onboarding hints — shown only for empty workspaces */}
            {workspaceContext.stats.memoryCount === 0 && workspaceContext.recentThreads.length === 0 && (
              <div className="space-y-2 bg-card border border-border rounded-lg p-4">
                {[
                  ['Conversations build ', <strong key="m">memory</strong>, ' — your agent gets smarter over time'],
                  ['Each workspace has its own context, decisions, and history'],
                  ['Start a conversation below to begin'],
                ].map((parts, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="text-primary/40">{'\u25C8'}</span>
                    <span>{parts}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Suggested prompts — clickable chips */}
            <div className="flex flex-wrap gap-2 pt-2">
              {workspaceContext.suggestedPrompts.map((prompt, i) => (
                <button
                  key={i}
                  className="px-3 py-1.5 text-sm bg-card border border-border rounded-lg text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors cursor-pointer disabled:opacity-50"
                  onClick={() => onSendMessage(prompt)}
                  disabled={isLoading}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* F7: Smart empty state — contextual suggestions based on workspace name */}
        {messages.length === 0 && !workspaceContext && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="text-muted-foreground/30">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <path d="M24 4L6 14v20l18 10 18-10V14L24 4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" opacity="0.3"/>
                <path d="M24 14l-10 6v12l10 6 10-6V20l-10-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" opacity="0.6"/>
                <circle cx="24" cy="26" r="3" fill="currentColor" opacity="0.4"/>
              </svg>
            </div>
            <div className="text-lg font-semibold text-foreground">
              {workspaceName || 'What can I help you with?'}
            </div>
            <div className="text-sm text-muted-foreground">
              Type a message or use <span className="text-primary font-mono">/help</span> for commands
            </div>
            <div className="flex flex-wrap justify-center gap-2 pt-2 max-w-lg">
              {getContextualSuggestions(workspaceName).map((suggestion, i) => (
                <button
                  key={i}
                  className="px-3 py-1.5 text-sm bg-card border border-border rounded-lg text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors cursor-pointer disabled:opacity-50"
                  onClick={() => onSendMessage(suggestion)}
                  disabled={isLoading}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, index) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            messageIndex={index}
            sessionId={sessionId}
            onToolApprove={onToolApprove}
            onToolDeny={onToolDeny}
            onFeedback={onFeedback ? (rating, reason, detail) => onFeedback(index, rating, reason, detail) : undefined}
          />
        ))}
        {isLoading && (
          <div className="flex items-center gap-1.5 px-4 py-3" role="status" aria-label="Agent is thinking">
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce" />
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
          </div>
        )}
      </div>

      {/* Sub-agent progress panel — above input, hidden when no agents */}
      <SubAgentProgress agents={subAgents ?? []} />

      {/* Input */}
      <ChatInput
        onSubmit={onSendMessage}
        onSlashCommand={onSlashCommand}
        onFileSelect={onFileSelect}
        disabled={isLoading}
        placeholder={showWorkspaceHome ? 'Ask what matters here, continue a task, or draft something...' : 'Type a message... (/ for commands)'}
        commands={mergedCommands}
      />
    </div>
  );
}
