/**
 * ChatArea — main chat container component.
 *
 * Renders a scrollable list of ChatMessage components with a ChatInput at the bottom.
 * Auto-scrolls to bottom on new messages. Supports slash commands.
 */

import React, { useRef, useEffect } from 'react';
import type { Message, ToolUseEvent } from '../../services/types.js';
import { ChatMessage } from './ChatMessage.js';
import { ChatInput } from './ChatInput.js';

export interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onSlashCommand?: (command: string, args: string) => void;
  onToolApprove?: (tool: ToolUseEvent) => void;
  onToolDeny?: (tool: ToolUseEvent, reason?: string) => void;
}

export function ChatArea({ messages, isLoading, onSendMessage, onSlashCommand, onToolApprove, onToolDeny }: ChatAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="chat-area">
      {/* Messages list */}
      <div
        ref={scrollRef}
        className="chat-area__messages"
      >
        {messages.length === 0 && (
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
        disabled={isLoading}
        placeholder="Type a message... (/ for commands)"
      />
    </div>
  );
}
