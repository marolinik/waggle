/**
 * ChatMessage — renders a single chat message (user, assistant, or system).
 *
 * User messages are right-aligned, assistant messages left-aligned.
 * System messages (slash command responses) are centered with muted styling.
 * Assistant messages render markdown (sanitized) with reasoning steps and tool cards.
 */

import React, { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import type { Message, ToolUseEvent } from '../../services/types.js';
import { ToolCard } from './ToolCard.js';

// Configure marked for safe rendering
marked.setOptions({
  breaks: true,
  gfm: true,
});

export interface ChatMessageProps {
  message: Message;
  onToolApprove?: (tool: ToolUseEvent) => void;
  onToolDeny?: (tool: ToolUseEvent, reason?: string) => void;
}

export function ChatMessage({ message, onToolApprove, onToolDeny }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  // Render markdown for assistant and system messages, sanitize HTML output
  const renderedContent = useMemo(() => {
    if (isUser || !message.content) return null;
    const rawHtml = marked.parse(message.content) as string;
    return DOMPurify.sanitize(rawHtml);
  }, [message.content, isUser]);

  // System messages — centered, compact, muted
  if (isSystem) {
    return (
      <div className="chat-message chat-message--system flex justify-center">
        <div
          style={{
            maxWidth: '90%',
            borderRadius: 8,
            padding: '8px 16px',
            background: 'var(--bg-tertiary, #1a1a2e)',
            border: '1px solid var(--border, #333)',
            fontSize: 13,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <div
            className="chat-message__content prose prose-invert prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: renderedContent ?? '' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`chat-message chat-message--${message.role} ${
        isUser ? 'flex justify-end' : 'flex justify-start'
      }`}
    >
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-800 text-gray-100'
        }`}
      >
        {/* Reasoning steps — shows what the agent is thinking/doing */}
        {!isUser && message.steps && message.steps.length > 0 && (
          <div className="chat-message__steps mb-2 space-y-0.5">
            {message.steps.map((step, i) => (
              <div
                key={i}
                className="chat-message__step flex items-center gap-1.5 text-xs"
                style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}
              >
                <span style={{ color: 'var(--brand)', fontSize: '8px' }}>&#9679;</span>
                {step}
              </div>
            ))}
          </div>
        )}

        {/* Message content */}
        {isUser ? (
          <div className="chat-message__content whitespace-pre-wrap">
            {message.content}
          </div>
        ) : (
          <div
            className="chat-message__content prose prose-invert prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: renderedContent ?? '' }}
          />
        )}

        {/* Inline tool use cards */}
        {message.toolUse && message.toolUse.length > 0 && (
          <div className="chat-message__tools mt-2 space-y-1">
            {message.toolUse.map((tool, i) => (
              <ToolCard
                key={`${tool.name}-${i}`}
                tool={tool}
                onApprove={onToolApprove}
                onDeny={onToolDeny}
              />
            ))}
          </div>
        )}

        {/* Timestamp */}
        <div className="chat-message__time mt-1 text-xs opacity-50">
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
