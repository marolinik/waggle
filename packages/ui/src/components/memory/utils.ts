/**
 * Shared utility functions for memory components.
 */

import type { Frame } from '../../services/types.js';

// ── Types ───────────────────────────────────────────────────────────

export interface FrameFilters {
  types?: string[];
  importance?: string[];
  dateFrom?: string;
  dateTo?: string;
  source?: 'personal' | 'workspace' | 'all';
}

export interface MemoryStats {
  totalFrames: number;
  entities: number;
  relations: number;
  mindFileSize?: number;
}

export interface FrameTypeOption {
  value: string;
  label: string;
}

// ── Constants ───────────────────────────────────────────────────────

export const FRAME_TYPES: FrameTypeOption[] = [
  { value: 'I', label: 'I-Frame' },
  { value: 'P', label: 'P-Frame' },
  { value: 'B', label: 'B-Frame' },
];

const ICON_MAP: Record<string, string> = {
  I: 'keyframe',
  P: 'prediction',
  B: 'bidirectional',
};

const IMPORTANCE_MAP: Record<string, { label: string; color: string }> = {
  high: { label: 'High', color: 'red' },
  medium: { label: 'Medium', color: 'yellow' },
  low: { label: 'Low', color: 'gray' },
};

const IMPORTANCE_ORDER: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

// ── Functions ───────────────────────────────────────────────────────

/**
 * Map frame type to icon name.
 * I = keyframe, P = prediction, B = bidirectional, unknown = frame.
 */
export function getFrameTypeIcon(frameType: string): string {
  return ICON_MAP[frameType] ?? 'frame';
}

/**
 * Map frame type to display label.
 */
export function getFrameTypeLabel(frameType: string): string {
  return `${frameType}-Frame`;
}

/**
 * Map importance level to badge display config.
 */
export function getImportanceBadge(importance: string): { label: string; color: string } {
  return IMPORTANCE_MAP[importance] ?? { label: importance, color: 'blue' };
}

/**
 * Return the first N lines of content.
 */
export function truncateContent(content: string, lines: number): string {
  if (!content) return '';
  const parts = content.split('\n');
  return parts.slice(0, lines).join('\n');
}

/**
 * Format a timestamp as relative time ("2 min ago", "yesterday", etc.).
 */
export function formatTimestamp(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHrs < 24) return diffHrs === 1 ? '1 hour ago' : `${diffHrs} hours ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  // Older than a week — return formatted date
  const d = new Date(timestamp);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Apply filters to a list of frames.
 */
export function filterFrames(frames: Frame[], filters: FrameFilters): Frame[] {
  let result = frames;

  if (filters.types && filters.types.length > 0) {
    result = result.filter((f) => filters.types!.includes(f.frameType));
  }

  if (filters.importance && filters.importance.length > 0) {
    result = result.filter((f) => filters.importance!.includes(f.importance));
  }

  if (filters.source && filters.source !== 'all') {
    result = result.filter((f) => f.source === filters.source);
  }

  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom).getTime();
    result = result.filter((f) => new Date(f.timestamp).getTime() >= from);
  }

  if (filters.dateTo) {
    const to = new Date(filters.dateTo).getTime();
    result = result.filter((f) => new Date(f.timestamp).getTime() <= to);
  }

  return result;
}

/**
 * Sort frames by time (newest first), importance, or search score.
 * Returns a new array — does not mutate the input.
 */
export function sortFrames(frames: Frame[], sortBy: 'time' | 'importance' | 'score'): Frame[] {
  const copy = [...frames];

  switch (sortBy) {
    case 'time':
      return copy.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    case 'importance':
      return copy.sort((a, b) => (IMPORTANCE_ORDER[a.importance] ?? 99) - (IMPORTANCE_ORDER[b.importance] ?? 99));
    case 'score':
      return copy.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
    default:
      return copy;
  }
}
