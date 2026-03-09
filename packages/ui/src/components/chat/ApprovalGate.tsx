/**
 * ApprovalGate — inline approval dialog for external mutation tools.
 *
 * Displayed when a tool requires user approval before execution.
 */

import React from 'react';
import type { ToolUseEvent } from '../../services/types.js';

export interface ApprovalGateProps {
  tool: ToolUseEvent;
  onApprove: () => void;
  onDeny: (reason?: string) => void;
}

export function ApprovalGate({ tool, onApprove, onDeny }: ApprovalGateProps) {
  return (
    <div className="approval-gate rounded-lg border border-yellow-600 bg-yellow-950 p-3">
      {/* Header */}
      <div className="approval-gate__header mb-2 flex items-center gap-2">
        <span className="text-yellow-400 text-lg">{'\u26A0'}</span>
        <span className="font-semibold text-yellow-200">
          Approval Required
        </span>
      </div>

      {/* Tool info */}
      <div className="approval-gate__info mb-3">
        <div className="text-sm text-gray-300">
          <span className="font-mono font-medium text-yellow-300">
            {tool.name}
          </span>{' '}
          wants to execute:
        </div>
        <pre className="mt-1 overflow-x-auto rounded bg-gray-900 px-3 py-2 text-xs text-gray-300">
          {JSON.stringify(tool.input, null, 2)}
        </pre>
      </div>

      {/* Actions */}
      <div className="approval-gate__actions flex gap-2">
        <button
          onClick={onApprove}
          className="rounded bg-green-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-600"
        >
          Approve
        </button>
        <button
          onClick={() => onDeny()}
          className="rounded bg-red-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-600"
        >
          Deny
        </button>
      </div>
    </div>
  );
}
