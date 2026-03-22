/**
 * FrameTimeline — scrollable list of frame cards sorted by time.
 *
 * Each card shows type icon, timestamp, first 2 lines, importance badge, source,
 * and team attribution (author name) when present.
 */

import type { Frame } from '../../services/types.js';
import {
  getFrameTypeIcon,
  getFrameTypeLabel,
  getImportanceBadge,
  getSourceLabel,
  truncateContent,
  formatTimestamp,
  groupFramesByDate,
} from './utils.js';

export interface FrameTimelineProps {
  frames: Frame[];
  selectedId?: number;
  onSelect: (frame: Frame) => void;
}

export function FrameTimeline({ frames, selectedId, onSelect }: FrameTimelineProps) {
  if (frames.length === 0) {
    return (
      <div className="frame-timeline__empty flex flex-col items-center justify-center gap-2 p-8 text-center">
        <div className="text-sm text-muted-foreground">No memories match your filters</div>
        <div className="text-xs text-muted-foreground/60">Try adjusting the frame type or date filters above.</div>
      </div>
    );
  }

  // E4: Group frames by date period
  const dateGroups = groupFramesByDate(frames);

  return (
    <div className="frame-timeline flex flex-col gap-1 overflow-y-auto">
      {dateGroups.map((group) => (
        <div key={group.label}>
          <div className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider px-3 pt-3 pb-1">
            {group.label}
          </div>
          {group.frames.map((frame) => {
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
                <span className="text-xs text-muted-foreground" title={getFrameTypeLabel(frame.frameType)}>
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
              <span className="text-[10px] text-muted-foreground/60">
                {getSourceLabel(frame.source)}
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
      ))}
    </div>
  );
}
