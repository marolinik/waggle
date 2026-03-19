import { useRef, useEffect, useCallback } from 'react';
import { MessageBubble } from './MessageBubble';
import type { ChatMessage } from '../../lib/types';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  /** Session ID for scroll position persistence */
  sessionId?: string;
}

/** Scroll positions keyed by session ID */
const scrollPositions = new Map<string, number>();

export function MessageList({ messages, isLoading, sessionId }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevMessageCount = useRef(messages.length);
  const isInitialMount = useRef(true);

  // Restore scroll position on session switch
  useEffect(() => {
    if (!containerRef.current || !sessionId) return;

    const saved = scrollPositions.get(sessionId);
    if (saved !== undefined && isInitialMount.current) {
      containerRef.current.scrollTop = saved;
    }
    isInitialMount.current = false;

    return () => {
      // Save scroll position when unmounting / switching away
      if (containerRef.current && sessionId) {
        scrollPositions.set(sessionId, containerRef.current.scrollTop);
      }
    };
  }, [sessionId]);

  // Auto-scroll to bottom only on NEW messages (not on session restore)
  useEffect(() => {
    if (messages.length > prevMessageCount.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessageCount.current = messages.length;
  }, [messages]);

  // Save scroll position on scroll (debounced via passive listener)
  const handleScroll = useCallback(() => {
    if (containerRef.current && sessionId) {
      scrollPositions.set(sessionId, containerRef.current.scrollTop);
    }
  }, [sessionId]);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto p-4" onScroll={handleScroll}>
      <div className="max-w-3xl mx-auto">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-[hsl(var(--muted-foreground))]">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Waggle</h2>
              <p className="text-sm">Your AI agent swarm. Send a message to begin.</p>
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-[hsl(var(--secondary))] rounded-lg px-4 py-3 text-sm text-[hsl(var(--muted-foreground))]">
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
