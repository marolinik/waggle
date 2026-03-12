/**
 * ChatArea — main chat container component.
 *
 * Renders a scrollable list of ChatMessage components with a ChatInput at the bottom.
 * Auto-scrolls to bottom on new messages. Supports slash commands.
 *
 * When no messages exist and workspace context is available, shows the
 * "Workspace Now" block with summary, suggested prompts, and recent threads.
 */

import React, { useRef, useEffect } from 'react';
import type { Message, ToolUseEvent, WorkspaceContext } from '../../services/types.js';
import { ChatMessage } from './ChatMessage.js';
import { ChatInput } from './ChatInput.js';

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
}

export function ChatArea({ messages, isLoading, onSendMessage, onSlashCommand, onFileSelect, onToolApprove, onToolDeny, workspaceContext, onThreadSelect }: ChatAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
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

        {/* Fallback empty state — only when no workspace context */}
        {messages.length === 0 && !workspaceContext && (
          <div className="chat-area__empty">
            <div className="chat-area__empty-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <path d="M24 4L6 14v20l18 10 18-10V14L24 4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" opacity="0.3"/>
                <path d="M24 14l-10 6v12l10 6 10-6V20l-10-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" opacity="0.6"/>
                <circle cx="24" cy="26" r="3" fill="currentColor" opacity="0.4"/>
              </svg>
            </div>
            <div className="chat-area__empty-title">What can I help you with?</div>
            <div className="chat-area__empty-hint">Type a message or use <span>/help</span> for commands</div>
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
      />
    </div>
  );
}
