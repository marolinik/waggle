/**
 * MemoryBrowser — main memory browser container.
 *
 * Combines MemorySearch, FrameTimeline, FrameDetail, and memory stats footer.
 * Orchestrates search, filtering, and frame selection.
 */

import React from 'react';
import type { Frame } from '../../services/types.js';
import type { FrameFilters, MemoryStats } from './utils.js';
import { FRAME_TYPES } from './utils.js';
import { MemorySearch } from './MemorySearch.js';
import { FrameTimeline } from './FrameTimeline.js';
import { FrameDetail } from './FrameDetail.js';

export interface MemoryBrowserProps {
  frames: Frame[];
  selectedFrame?: Frame;
  onSelectFrame: (frame: Frame) => void;
  onSearch: (query: string) => void;
  filters: FrameFilters;
  onFiltersChange: (filters: FrameFilters) => void;
  stats?: MemoryStats;
  loading?: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MemoryBrowser({
  frames,
  selectedFrame,
  onSelectFrame,
  onSearch,
  filters,
  onFiltersChange,
  stats,
  loading = false,
}: MemoryBrowserProps) {
  return (
    <div className="memory-browser flex h-full flex-col bg-gray-900">
      {/* Search */}
      <div className="memory-browser__search border-b border-gray-700 p-3">
        <MemorySearch onSearch={onSearch} disabled={loading} />
      </div>

      {/* Filters */}
      <div className="memory-browser__filters flex flex-wrap gap-2 border-b border-gray-700 px-3 py-2">
        {/* Type filter chips */}
        {FRAME_TYPES.map((ft) => {
          const active = filters.types?.includes(ft.value);
          return (
            <button
              key={ft.value}
              className={`rounded px-2 py-0.5 text-xs transition-colors ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
              onClick={() => {
                const currentTypes = filters.types ?? [];
                const newTypes = active
                  ? currentTypes.filter((t) => t !== ft.value)
                  : [...currentTypes, ft.value];
                onFiltersChange({ ...filters, types: newTypes.length > 0 ? newTypes : undefined });
              }}
            >
              {ft.label}
            </button>
          );
        })}

        {/* Source filter */}
        <select
          className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-400"
          value={filters.source ?? 'all'}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              source: e.target.value as 'personal' | 'workspace' | 'all',
            })
          }
        >
          <option value="all">All sources</option>
          <option value="personal">Personal</option>
          <option value="workspace">Workspace</option>
        </select>
      </div>

      {/* Main content area */}
      <div className="memory-browser__content flex flex-1 overflow-hidden">
        {/* Timeline */}
        <div className="memory-browser__timeline w-1/2 overflow-y-auto border-r border-gray-700 p-2">
          {loading ? (
            <div className="flex items-center justify-center p-8 text-muted-foreground">
              <p className="text-sm animate-pulse">Loading memories...</p>
            </div>
          ) : frames.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-8">
              <div className="text-4xl">🧠</div>
              <h3 className="text-base font-medium text-foreground">No memories yet</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                As you chat, important context is automatically saved here.
              </p>
            </div>
          ) : (
            <FrameTimeline
              frames={frames}
              selectedId={selectedFrame?.id}
              onSelect={onSelectFrame}
            />
          )}
        </div>

        {/* Detail panel */}
        <div className="memory-browser__detail flex-1 overflow-y-auto p-3">
          {selectedFrame ? (
            <FrameDetail frame={selectedFrame} />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-500">
              Select a frame to view details
            </div>
          )}
        </div>
      </div>

      {/* Stats footer */}
      {stats && (
        <div className="memory-browser__stats flex items-center gap-4 border-t border-gray-700 px-3 py-1.5 text-xs text-gray-500">
          <span>{stats.totalFrames} frames</span>
          <span>{stats.entities} entities</span>
          <span>{stats.relations} relations</span>
          {stats.mindFileSize !== undefined && (
            <span>{formatBytes(stats.mindFileSize)}</span>
          )}
        </div>
      )}
    </div>
  );
}
