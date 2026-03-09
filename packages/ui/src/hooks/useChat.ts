/**
 * useChat — React hook that manages chat state.
 *
 * Takes a WaggleService instance and returns chat state + actions.
 * Handles streaming responses and accumulating tokens into messages.
 */

import { useState, useCallback, useRef } from 'react';
import type { WaggleService, Message, ToolUseEvent, StreamEvent } from '../services/types.js';

export interface UseChatOptions {
  service: WaggleService;
  workspace: string;
  session?: string;
}

export interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  sendMessage: (text: string) => Promise<void>;
  clearMessages: () => void;
}

let messageIdCounter = 0;
function nextId(): string {
  return `msg-${Date.now()}-${++messageIdCounter}`;
}

/**
 * Core logic for processing stream events into a message.
 * Extracted so it can be tested without React.
 */
export function processStreamEvent(
  event: StreamEvent,
  current: { content: string; tools: ToolUseEvent[] },
): { content: string; tools: ToolUseEvent[] } {
  const result = { content: current.content, tools: [...current.tools] };

  switch (event.type) {
    case 'token':
      result.content += event.content ?? '';
      break;
    case 'tool': {
      const toolEvent: ToolUseEvent = {
        name: event.name ?? 'unknown',
        input: event.input ?? {},
        requiresApproval: false,
      };
      result.tools.push(toolEvent);
      break;
    }
    case 'tool_result': {
      // Update the last tool with its result
      const lastTool = result.tools[result.tools.length - 1];
      if (lastTool) {
        lastTool.result = typeof event.result === 'string'
          ? event.result
          : JSON.stringify(event.result);
      }
      break;
    }
    case 'error':
      result.content += `\n[Error: ${event.content ?? 'Unknown error'}]`;
      break;
    // 'step' and 'done' don't modify content
  }

  return result;
}

export function useChat({ service, workspace, session }: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef(false);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    // Add user message
    const userMsg: Message = {
      id: nextId(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    abortRef.current = false;

    // Create placeholder assistant message
    const assistantId = nextId();
    let accumulated = { content: '', tools: [] as ToolUseEvent[] };

    try {
      const stream = service.sendMessage(workspace, text, session);

      for await (const event of stream) {
        if (abortRef.current) break;

        accumulated = processStreamEvent(event, accumulated);

        // Update the assistant message in-place
        const assistantMsg: Message = {
          id: assistantId,
          role: 'assistant',
          content: accumulated.content,
          timestamp: new Date().toISOString(),
          toolUse: accumulated.tools.length > 0 ? accumulated.tools : undefined,
        };

        setMessages((prev) => {
          const existing = prev.findIndex((m) => m.id === assistantId);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = assistantMsg;
            return updated;
          }
          return [...prev, assistantMsg];
        });
      }
    } catch (err) {
      // Add error as assistant message
      const errorMsg: Message = {
        id: assistantId,
        role: 'assistant',
        content: `[Error: ${err instanceof Error ? err.message : 'Unknown error'}]`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => {
        const existing = prev.findIndex((m) => m.id === assistantId);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = errorMsg;
          return updated;
        }
        return [...prev, errorMsg];
      });
    } finally {
      setIsLoading(false);
    }
  }, [service, workspace, session, isLoading]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, isLoading, sendMessage, clearMessages };
}
