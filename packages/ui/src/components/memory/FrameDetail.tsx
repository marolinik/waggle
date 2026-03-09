/**
 * FrameDetail — detail panel for a selected memory frame.
 *
 * Shows full content, frame type, importance, timestamp, source,
 * and any related metadata.
 */

import React from 'react';
import type { Frame } from '../../services/types.js';
import { getFrameTypeIcon, getFrameTypeLabel, getImportanceBadge, formatTimestamp } from './utils.js';

export interface FrameDetailProps {
  frame: Frame;
}

export function FrameDetail({ frame }: FrameDetailProps) {
  const badge = getImportanceBadge(frame.importance);
  const icon = getFrameTypeIcon(frame.frameType);
  const label = getFrameTypeLabel(frame.frameType);

  return (
    <div className="frame-detail flex flex-col gap-3 rounded-lg bg-gray-800 p-4">
      {/* Header */}
      <div className="frame-detail__header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="frame-detail__icon text-lg" title={icon}>
            {icon === 'keyframe' ? '◆' : icon === 'prediction' ? '▶' : icon === 'bidirectional' ? '◀▶' : '■'}
          </span>
          <span className="frame-detail__type text-sm font-medium text-gray-300">
            {label}
          </span>
        </div>
        <span
          className="frame-detail__importance rounded px-2 py-0.5 text-xs font-medium"
          style={{ color: badge.color === 'red' ? '#f87171' : badge.color === 'yellow' ? '#fbbf24' : badge.color === 'gray' ? '#9ca3af' : '#60a5fa' }}
        >
          {badge.label}
        </span>
      </div>

      {/* Metadata */}
      <div className="frame-detail__meta flex gap-4 text-xs text-gray-500">
        <span>ID: {frame.id}</span>
        <span>{formatTimestamp(frame.timestamp)}</span>
        <span className="capitalize">{frame.source}</span>
        {frame.score !== undefined && (
          <span>Score: {frame.score.toFixed(2)}</span>
        )}
      </div>

      {/* Content */}
      <div className="frame-detail__content whitespace-pre-wrap rounded bg-gray-900 p-3 text-sm text-gray-200">
        {frame.content}
      </div>

      {/* GOP / Session */}
      {(frame.gop || frame.sessionId) && (
        <div className="frame-detail__session flex gap-4 text-xs text-gray-500">
          {frame.gop && <span>GOP: {frame.gop}</span>}
          {frame.sessionId && <span>Session: {frame.sessionId}</span>}
        </div>
      )}

      {/* Entities */}
      {frame.entities && frame.entities.length > 0 && (
        <div className="frame-detail__entities">
          <span className="text-xs font-medium text-gray-400">Entities</span>
          <div className="mt-1 flex flex-wrap gap-1">
            {frame.entities.map((entity) => (
              <span
                key={entity}
                className="rounded bg-gray-700 px-2 py-0.5 text-xs text-gray-300"
              >
                {entity}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Linked Frames */}
      {frame.linkedFrames && frame.linkedFrames.length > 0 && (
        <div className="frame-detail__linked">
          <span className="text-xs font-medium text-gray-400">Linked Frames</span>
          <div className="mt-1 flex flex-wrap gap-1">
            {frame.linkedFrames.map((linkedId) => (
              <span
                key={linkedId}
                className="rounded bg-blue-900 px-2 py-0.5 text-xs text-blue-300"
              >
                #{linkedId}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
