/**
 * ToolCard — collapsible card showing tool execution status.
 *
 * Collapsed by default. Click to expand and see input/output.
 * Color-coded: green (success), red (denied/error), yellow (pending approval).
 * Shows inline approval gate when a tool requires user confirmation.
 */

import React, { useState } from 'react';
import type { ToolUseEvent } from '../../services/types.js';
import { getToolStatusColor, formatDuration } from './utils.js';
import { ApprovalGate } from './ApprovalGate.js';

export interface ToolCardProps {
  tool: ToolUseEvent;
  onApprove?: (tool: ToolUseEvent) => void;
  onDeny?: (tool: ToolUseEvent, reason?: string) => void;
}

const COLOR_CLASSES: Record<string, string> = {
  green: 'border-green-600 bg-green-950',
  red: 'border-red-600 bg-red-950',
  yellow: 'border-yellow-600 bg-yellow-950',
};

const BADGE_CLASSES: Record<string, string> = {
  green: 'bg-green-700 text-green-100',
  red: 'bg-red-700 text-red-100',
  yellow: 'bg-yellow-700 text-yellow-100',
};

function getStatusLabel(tool: ToolUseEvent): string {
  if (tool.requiresApproval && tool.approved === undefined) return 'Pending';
  if (tool.approved === false) return 'Denied';
  return 'Done';
}

export function ToolCard({ tool, onApprove, onDeny }: ToolCardProps) {
  const [expanded, setExpanded] = useState(false);
  const color = getToolStatusColor(tool);
  const isPendingApproval = tool.requiresApproval && tool.approved === undefined;

  return (
    <div
      className={`tool-card rounded border ${COLOR_CLASSES[color] ?? ''} text-sm`}
    >
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="tool-card__header flex w-full items-center gap-2 px-3 py-1.5 text-left text-gray-200"
      >
        <span className="tool-card__chevron text-xs">
          {expanded ? '\u25BC' : '\u25B6'}
        </span>
        <span className="tool-card__name font-mono font-medium">
          {tool.name}
        </span>
        <span
          className={`tool-card__badge rounded px-1.5 py-0.5 text-xs ${
            BADGE_CLASSES[color] ?? ''
          }`}
        >
          {getStatusLabel(tool)}
        </span>
        {tool.duration !== undefined && (
          <span className="tool-card__duration ml-auto text-xs text-gray-400">
            {formatDuration(tool.duration)}
          </span>
        )}
      </button>

      {/* Inline approval gate — shown when tool needs confirmation */}
      {isPendingApproval && onApprove && onDeny && (
        <div className="tool-card__approval px-3 py-2">
          <ApprovalGate
            tool={tool}
            onApprove={() => onApprove(tool)}
            onDeny={(reason) => onDeny(tool, reason)}
          />
        </div>
      )}

      {/* Body — visible when expanded */}
      {expanded && (
        <div className="tool-card__body border-t border-gray-700 px-3 py-2">
          <div className="mb-1 text-xs font-semibold text-gray-400">Input</div>
          <pre className="tool-card__input mb-2 overflow-x-auto whitespace-pre-wrap text-xs text-gray-300">
            {JSON.stringify(tool.input, null, 2)}
          </pre>
          {tool.result !== undefined && (
            <>
              <div className="mb-1 text-xs font-semibold text-gray-400">
                Output
              </div>
              <pre className="tool-card__output overflow-x-auto whitespace-pre-wrap text-xs text-gray-300">
                {tool.result}
              </pre>
            </>
          )}
        </div>
      )}
    </div>
  );
}
