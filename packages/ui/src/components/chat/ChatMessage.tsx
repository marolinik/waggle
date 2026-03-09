/**
 * ChatMessage — renders a single chat message (user or assistant).
 *
 * User messages are right-aligned, assistant messages left-aligned.
 * Tool use events are rendered inline via ToolCard.
 */

import React from 'react';
import type { Message } from '../../services/types.js';
import { ToolCard } from './ToolCard.js';

export interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

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
        {/* Message content — raw text for now (markdown renderer added later) */}
        <div className="chat-message__content whitespace-pre-wrap">
          {message.content}
        </div>

        {/* Inline tool use cards */}
        {message.toolUse && message.toolUse.length > 0 && (
          <div className="chat-message__tools mt-2 space-y-1">
            {message.toolUse.map((tool, i) => (
              <ToolCard key={`${tool.name}-${i}`} tool={tool} />
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
