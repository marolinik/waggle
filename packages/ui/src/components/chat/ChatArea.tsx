/**
 * ChatArea — main chat container component.
 *
 * Renders a scrollable list of ChatMessage components with a ChatInput at the bottom.
 * Auto-scrolls to bottom on new messages. Supports slash commands.
 *
 * When no messages exist and workspace context is available, shows the
 * "Workspace Now" block with summary, suggested prompts, and recent threads.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { Message, ToolUseEvent, WorkspaceContext } from '../../services/types.js';
import { ChatMessage } from './ChatMessage.js';
import { ChatInput, CLIENT_COMMANDS, type SlashCommand } from './ChatInput.js';

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
}

export function ChatArea({ messages, isLoading, onSendMessage, onSlashCommand, onFileSelect, onToolApprove, onToolDeny, workspaceContext, onThreadSelect, workspaceName, scrollKey }: ChatAreaProps) {
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
    <div className="chat-area">
      {/* Messages list */}
      <div
        ref={scrollRef}
        className="chat-area__messages"
      >
        {/* Workspace Home — shown when entering a workspace with no messages */}
        {showWorkspaceHome && (
          <div className="chat-area__workspace-home">
            {workspaceContext.stats.memoryCount > 0 && workspaceContext.stats.sessionCount > 1 && (
              <div className="chat-area__welcome-back">
                Welcome back — here's where things stand.
              </div>
            )}
            <div className="chat-area__workspace-header">
              <div className="chat-area__workspace-icon">
                <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
                  <path d="M24 4L6 14v20l18 10 18-10V14L24 4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" opacity="0.3"/>
                  <path d="M24 14l-10 6v12l10 6 10-6V20l-10-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" opacity="0.6"/>
                  <circle cx="24" cy="26" r="3" fill="currentColor" opacity="0.4"/>
                </svg>
              </div>
              <h2 className="chat-area__workspace-name">{workspaceContext.workspace.name}</h2>
              {workspaceContext.workspace.group && (
                <span className="chat-area__workspace-group">{workspaceContext.workspace.group}</span>
              )}
              <span className="chat-area__workspace-stats">
                {workspaceContext.stats.memoryCount > 0
                  ? `${workspaceContext.stats.memoryCount} memories · ${workspaceContext.stats.sessionCount} sessions${workspaceContext.stats.fileCount ? ` · ${workspaceContext.stats.fileCount} files` : ''}`
                  : 'No memories yet'}
                {workspaceContext.workspace.model && ` · ${workspaceContext.workspace.model}`}
              </span>
              {workspaceContext.lastActive && (
                <span className="chat-area__last-active">
                  Last active: {formatRelativeTime(workspaceContext.lastActive)}
                </span>
              )}
            </div>

            {/* Summary */}
            <div className="chat-area__workspace-summary">
              {workspaceContext.summary}
            </div>

            {/* Recent decisions */}
            {workspaceContext.recentDecisions?.length > 0 && (
              <div className="chat-area__recent-decisions">
                <h3>Recent decisions</h3>
                <ul>
                  {workspaceContext.recentDecisions.slice(0, 3).map((decision, i) => (
                    <li key={i}>
                      <span className="chat-area__decision-text">{decision.content}</span>
                      <span className="chat-area__decision-date">{decision.date}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Progress items — tasks, completions, blockers */}
            {workspaceContext.progressItems && workspaceContext.progressItems.length > 0 && (
              <div className="chat-area__progress-items">
                {workspaceContext.progressItems.some(p => p.type === 'blocker') && (
                  <>
                    <h3>Blockers</h3>
                    <ul>
                      {workspaceContext.progressItems.filter(p => p.type === 'blocker').slice(0, 3).map((item, i) => (
                        <li key={`b-${i}`} className="chat-area__progress-blocker">
                          <span className="chat-area__progress-icon" title="Blocker">&#x25A0;</span>
                          <span className="chat-area__progress-text">{item.content}</span>
                          <span className="chat-area__decision-date">{item.date}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {workspaceContext.progressItems.some(p => p.type === 'task') && (
                  <>
                    <h3>Open items</h3>
                    <ul>
                      {workspaceContext.progressItems.filter(p => p.type === 'task').slice(0, 3).map((item, i) => (
                        <li key={`t-${i}`} className="chat-area__progress-task">
                          <span className="chat-area__progress-icon" title="Task">&#x25CB;</span>
                          <span className="chat-area__progress-text">{item.content}</span>
                          <span className="chat-area__decision-date">{item.date}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {workspaceContext.progressItems.some(p => p.type === 'completed') && (
                  <>
                    <h3>Recently completed</h3>
                    <ul>
                      {workspaceContext.progressItems.filter(p => p.type === 'completed').slice(0, 3).map((item, i) => (
                        <li key={`c-${i}`} className="chat-area__progress-completed">
                          <span className="chat-area__progress-icon" title="Done">&#x25CF;</span>
                          <span className="chat-area__progress-text">{item.content}</span>
                          <span className="chat-area__decision-date">{item.date}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}

            {/* Recent threads */}
            {workspaceContext.recentThreads.length > 0 && (
              <div className="chat-area__recent-threads">
                <h3>Recent threads</h3>
                <ul>
                  {workspaceContext.recentThreads.slice(0, 3).map(thread => (
                    <li
                      key={thread.id}
                      className={onThreadSelect ? 'chat-area__thread-clickable' : undefined}
                      onClick={onThreadSelect ? () => onThreadSelect(thread.id) : undefined}
                    >
                      {thread.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Key memories */}
            {workspaceContext.recentMemories?.length > 0 && (
              <div className="chat-area__recent-memories">
                <h3>Key memories</h3>
                <ul>
                  {workspaceContext.recentMemories.slice(0, 3).map((memory, i) => (
                    <li key={i}>
                      <span className={`chat-area__memory-importance chat-area__memory-importance--${memory.importance}`}>
                        {memory.importance === 'critical' ? '\u25C6' : memory.importance === 'important' ? '\u25C7' : '\u25CB'}
                      </span>
                      <span className="chat-area__memory-text">{memory.content}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Onboarding hints — shown only for empty workspaces */}
            {workspaceContext.stats.memoryCount === 0 && workspaceContext.recentThreads.length === 0 && (
              <div className="chat-area__onboarding-hints">
                <div className="chat-area__onboarding-hint">
                  <span className="chat-area__onboarding-icon">&#x25C8;</span>
                  <span>Conversations build <strong>memory</strong> — your agent gets smarter over time</span>
                </div>
                <div className="chat-area__onboarding-hint">
                  <span className="chat-area__onboarding-icon">&#x25C8;</span>
                  <span>Each workspace has its own context, decisions, and history</span>
                </div>
                <div className="chat-area__onboarding-hint">
                  <span className="chat-area__onboarding-icon">&#x25C8;</span>
                  <span>Start a conversation below to begin</span>
                </div>
              </div>
            )}

            {/* Suggested prompts — clickable chips */}
            <div className="chat-area__suggested-prompts">
              {workspaceContext.suggestedPrompts.map((prompt, i) => (
                <button
                  key={i}
                  className="chat-area__prompt-chip"
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
          <div className="chat-area__empty">
            <div className="chat-area__empty-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <path d="M24 4L6 14v20l18 10 18-10V14L24 4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" opacity="0.3"/>
                <path d="M24 14l-10 6v12l10 6 10-6V20l-10-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" opacity="0.6"/>
                <circle cx="24" cy="26" r="3" fill="currentColor" opacity="0.4"/>
              </svg>
            </div>
            {workspaceName ? (
              <div className="chat-area__empty-title">{workspaceName}</div>
            ) : (
              <div className="chat-area__empty-title">What can I help you with?</div>
            )}
            <div className="chat-area__empty-hint">Type a message or use <span>/help</span> for commands</div>
            <div className="chat-area__suggestion-chips">
              {getContextualSuggestions(workspaceName).map((suggestion, i) => (
                <button
                  key={i}
                  className="chat-area__suggestion-chip"
                  onClick={() => onSendMessage(suggestion)}
                  disabled={isLoading}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            onToolApprove={onToolApprove}
            onToolDeny={onToolDeny}
          />
        ))}
        {isLoading && (
          <div className="chat-area__loading">
            <div className="chat-area__loading-indicator">
              <span className="chat-area__loading-dot" />
              <span className="chat-area__loading-dot" />
              <span className="chat-area__loading-dot" />
            </div>
          </div>
        )}
      </div>

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
