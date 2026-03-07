import { useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import type { ChatMessage } from '../../lib/types';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4">
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
