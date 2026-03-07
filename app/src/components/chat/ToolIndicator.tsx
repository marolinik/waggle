import type { ToolUseEvent } from '../../lib/types';

interface ToolIndicatorProps {
  tool: ToolUseEvent;
}

export function ToolIndicator({ tool }: ToolIndicatorProps) {
  return (
    <div className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1">
      {tool.status === 'running' ? '\u27F3' : tool.status === 'done' ? '\u2713' : '\u2717'}
      {tool.name}
      {tool.result && <span className="ml-1 opacity-70">&mdash; {tool.result}</span>}
    </div>
  );
}
