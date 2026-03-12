/**
 * ChatMessage — renders a single chat message (user, assistant, or system).
 *
 * User messages are right-aligned, assistant messages left-aligned.
 * System messages (slash command responses) are centered with muted styling.
 * Assistant messages render markdown (sanitized) with a unified event trail
 * (interleaved reasoning steps and tool cards), collapsed by default.
 */

import React, { useMemo, useState, useCallback } from 'react';
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
  const [trailExpanded, setTrailExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (!message.content) return;
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => { /* clipboard not available */ });
  }, [message.content]);

  // Render markdown for assistant and system messages, sanitize HTML output
  // Content is sanitized with DOMPurify before rendering
  const renderedContent = useMemo(() => {
    if (isUser || !message.content) return null;
    const rawHtml = marked.parse(message.content) as string;
    return DOMPurify.sanitize(rawHtml);
  }, [message.content, isUser]);

  const hasSteps = message.steps && message.steps.length > 0;
  const hasTools = message.toolUse && message.toolUse.length > 0;
  const hasTrail = hasSteps || hasTools;

  // Check if any tool needs attention (pending approval or still running)
  const hasActiveTools = message.toolUse?.some(
    t => t.status === 'pending_approval' || t.status === 'running',
  );

  // Auto-expand if there's a tool needing approval
  const showTrail = trailExpanded || hasActiveTools;

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
          {/* Content sanitized with DOMPurify */}
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
        {/* Message content */}
        {isUser ? (
          <div className="chat-message__content whitespace-pre-wrap">
            {message.content}
          </div>
        ) : (
          /* Content sanitized with DOMPurify */
          <div
            className="chat-message__content prose prose-invert prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: renderedContent ?? '' }}
          />
        )}

        {/* Unified event trail — steps + tool cards */}
        {!isUser && hasTrail && (
          <div className="chat-message__trail mt-2">
            {/* Trail toggle header */}
            <button
              onClick={() => setTrailExpanded(prev => !prev)}
              className="chat-message__trail-toggle flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 mb-1"
            >
              <span style={{ fontSize: 8 }}>{showTrail ? '\u25BC' : '\u25B6'}</span>
              <span>
                {message.toolUse?.length ?? 0} tool{(message.toolUse?.length ?? 0) !== 1 ? 's' : ''}
                {hasSteps ? ` \u00B7 ${message.steps!.length} step${message.steps!.length !== 1 ? 's' : ''}` : ''}
              </span>
              {hasActiveTools && (
                <span className="text-blue-400 animate-pulse">{'\u25CF'}</span>
              )}
            </button>

            {/* Expanded trail content */}
            {showTrail && (
              <div className="chat-message__trail-content space-y-1">
                {/* Reasoning steps — compact */}
                {hasSteps && (
                  <div className="chat-message__steps space-y-0.5">
                    {message.steps!.map((step, i) => (
                      <div
                        key={i}
                        className="chat-message__step flex items-center gap-1.5 text-xs"
                        style={{ color: 'var(--text-muted, #888)', fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        <span style={{ color: 'var(--brand, #7c3aed)', fontSize: '8px' }}>{'\u25CF'}</span>
                        {step}
                      </div>
                    ))}
                  </div>
                )}

                {/* Tool cards */}
                {hasTools && (
                  <div className="chat-message__tools space-y-1">
                    {message.toolUse!.map((tool, i) => (
                      <ToolCard
                        key={`${tool.name}-${i}`}
                        tool={tool}
                        onApprove={onToolApprove}
                        onDeny={onToolDeny}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Timestamp + copy button */}
        <div className="chat-message__time mt-1 text-xs opacity-50 flex items-center gap-2">
          <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
          {!isUser && message.content && (
            <button
              onClick={handleCopy}
              className="chat-message__copy hover:opacity-100 opacity-60 transition-opacity"
              title="Copy message"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'inherit',
                fontSize: '11px',
                padding: '0 2px',
              }}
            >
              {copied ? '\u2713 Copied' : '\u2398 Copy'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
