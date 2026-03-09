/**
 * Shared utility functions for chat components.
 */

import type { ToolUseEvent } from '../../services/types.js';

/**
 * Return a color string based on tool execution status.
 * - 'yellow' if the tool requires approval and hasn't been decided yet
 * - 'red' if the tool was denied
 * - 'green' otherwise (completed successfully)
 */
export function getToolStatusColor(tool: ToolUseEvent): string {
  if (tool.requiresApproval && tool.approved === undefined) return 'yellow';
  if (tool.approved === false) return 'red';
  return 'green';
}

/**
 * Format a duration in milliseconds to a human-readable string.
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}
