/**
 * MemoryView — Wrapper around MemoryBrowser from @waggle/ui.
 */

import type { Frame, FrameFilters, MemoryStats } from '@waggle/ui';
import { MemoryBrowser } from '@waggle/ui';

export interface MemoryViewProps {
  frames: Frame[];
  selectedFrame?: Frame;
  onSelectFrame: (frame: Frame) => void;
  onSearch: (query: string) => void;
  filters: FrameFilters;
  onFiltersChange: (filters: FrameFilters) => void;
  stats?: MemoryStats;
  loading: boolean;
}

export function MemoryView({
  frames,
  selectedFrame,
  onSelectFrame,
  onSearch,
  filters,
  onFiltersChange,
  stats,
  loading,
}: MemoryViewProps) {
  return (
    <div className="h-full overflow-hidden">
      <MemoryBrowser
        frames={frames}
        selectedFrame={selectedFrame}
        onSelectFrame={onSelectFrame}
        onSearch={onSearch}
        filters={filters}
        onFiltersChange={onFiltersChange}
        stats={stats}
        loading={loading}
      />
    </div>
  );
}
