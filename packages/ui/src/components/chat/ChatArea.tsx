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
    <div className="chat-area flex h-full flex-col bg-gray-900">
      {/* Messages list */}
      <div
        ref={scrollRef}
        className="chat-area__messages flex-1 overflow-y-auto p-4 space-y-3"
      >
        {messages.length === 0 && (
          <div className="chat-area__empty flex h-full items-center justify-center text-gray-500">
            Start a conversation...
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
          <div className="chat-area__loading flex justify-start">
            <div className="rounded-lg bg-gray-800 px-4 py-2 text-gray-400">
              Thinking...
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
