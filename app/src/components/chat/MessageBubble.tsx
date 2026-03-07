import type { ChatMessage } from '../../lib/types';
import { ToolIndicator } from './ToolIndicator';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 text-sm whitespace-pre-wrap ${
          isUser
            ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
            : isSystem
            ? 'bg-red-900/30 text-red-300 border border-red-800'
            : 'bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))]'
        }`}
      >
        {message.content}
        {message.toolUse && message.toolUse.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.toolUse.map((tool, i) => (
              <ToolIndicator key={i} tool={tool} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
