/**
 * FrameTimeline — scrollable list of frame cards sorted by time.
 *
 * Each card shows type icon, timestamp, first 2 lines, importance badge, source,
 * and team attribution (author name) when present.
 */

import React from 'react';
import type { Frame } from '../../services/types.js';
import {
  getFrameTypeIcon,
  getImportanceBadge,
  truncateContent,
  formatTimestamp,
} from './utils.js';

export interface FrameTimelineProps {
  frames: Frame[];
  selectedId?: number;
  onSelect: (frame: Frame) => void;
}

export function FrameTimeline({ frames, selectedId, onSelect }: FrameTimelineProps) {
  if (frames.length === 0) {
    return (
      <div className="frame-timeline__empty flex items-center justify-center p-8 text-muted-foreground">
        No memory frames found
      </div>
    );
  }

  return (
    <div className="frame-timeline flex flex-col gap-1 overflow-y-auto">
      {frames.map((frame) => {
        const isSelected = frame.id === selectedId;
        const badge = getImportanceBadge(frame.importance);
        const icon = getFrameTypeIcon(frame.frameType);
        const preview = truncateContent(frame.content, 2);

        return (
          <button
            key={`${frame.source ?? 'default'}-${frame.id}`}
            className={`frame-timeline__card flex flex-col gap-1 rounded px-3 py-2 text-left transition-colors ${
              isSelected
                ? 'bg-primary/15 border border-primary/50'
                : 'bg-card/50 hover:bg-card border border-transparent'
            }`}
            onClick={() => onSelect(frame)}
          >
            {/* Top row: icon + timestamp + importance */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground" title={icon}>
                  {icon === 'keyframe' ? '◆' : icon === 'prediction' ? '▶' : icon === 'bidirectional' ? '◀▶' : '■'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatTimestamp(frame.timestamp)}
                </span>
              </div>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                  badge.color === 'red' ? 'text-red-400' : badge.color === 'yellow' ? 'text-amber-400' : badge.color === 'gray' ? 'text-muted-foreground' : 'text-primary'
                }`}
              >
                {badge.label}
              </span>
            </div>

            {/* Preview */}
            <div className="text-xs text-muted-foreground line-clamp-2">
              {preview}
            </div>

            {/* Source badge + attribution */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground/60 capitalize">
                {frame.source}
              </span>
              {frame.authorName && (
                <span
                  className="frame-timeline__author text-[10px] text-primary"
                  title={`Added by ${frame.authorName}`}
                >
                  by {frame.authorName}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
