/**
 * EventsView — Wrapper around EventStream from @waggle/ui.
 */

import type { AgentStep, StepFilter } from '@waggle/ui';
import { EventStream } from '@waggle/ui';

export interface EventsViewProps {
  steps: AgentStep[];
  autoScroll: boolean;
  onToggleAutoScroll: () => void;
  filter: StepFilter;
  onFilterChange: (f: StepFilter) => void;
}

export function EventsView({
  steps,
  autoScroll,
  onToggleAutoScroll,
  filter,
  onFilterChange,
}: EventsViewProps) {
  return (
    <div style={{ height: '100%', overflow: 'hidden' }}>
      <EventStream
        steps={steps}
        autoScroll={autoScroll}
        onToggleAutoScroll={onToggleAutoScroll}
        filter={filter}
        onFilterChange={onFilterChange}
      />
    </div>
  );
}
