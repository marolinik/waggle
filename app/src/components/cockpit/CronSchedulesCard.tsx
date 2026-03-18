import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { CronSchedule } from './types';
import { formatTime } from './helpers';

interface CronSchedulesCardProps {
  schedules: CronSchedule[];
  schedulesLoading: boolean;
  togglingId: number | null;
  triggeringId: number | null;
  onToggle: (id: number, currentEnabled: boolean) => void;
  onTrigger: (id: number) => void;
}

export function CronSchedulesCard({
  schedules,
  schedulesLoading,
  togglingId,
  triggeringId,
  onToggle,
  onTrigger,
}: CronSchedulesCardProps) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold tracking-wide">Cron Schedules</CardTitle>
      </CardHeader>
      <CardContent>
        {schedulesLoading ? (
          <p className="text-xs text-muted-foreground py-2">Loading schedules...</p>
        ) : schedules.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">
            No schedules configured. Create one via the agent or API.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {schedules.map((s) => (
              <div
                key={s.id}
                className="rounded-md border border-border bg-white/[0.02] p-2"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        'size-2 rounded-full shrink-0',
                        s.enabled ? 'bg-green-500' : 'bg-muted-foreground'
                      )}
                    />
                    <span className="text-xs font-semibold">{s.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      className={cn(
                        'text-[10px] font-medium px-2 py-0.5 rounded',
                        s.enabled
                          ? 'bg-green-500/15 text-green-500'
                          : 'bg-red-500/10 text-red-500',
                        togglingId === s.id && 'opacity-50 cursor-default'
                      )}
                      onClick={() => onToggle(s.id, s.enabled)}
                      disabled={togglingId === s.id}
                    >
                      {s.enabled ? 'ON' : 'OFF'}
                    </button>
                    <button
                      className={cn(
                        'text-[10px] font-medium px-2 py-0.5 rounded border border-border',
                        triggeringId === s.id
                          ? 'bg-muted text-muted-foreground cursor-default'
                          : 'bg-transparent text-muted-foreground hover:bg-muted'
                      )}
                      onClick={() => onTrigger(s.id)}
                      disabled={triggeringId === s.id}
                    >
                      {triggeringId === s.id ? 'Running...' : 'Trigger'}
                    </button>
                  </div>
                </div>
                <div className="flex gap-4 text-[11px] text-muted-foreground">
                  <span>cron: {s.cronExpr}</span>
                  <span>type: {s.jobType}</span>
                </div>
                <div className="flex gap-4 mt-0.5 text-[11px] text-muted-foreground">
                  <span>last: {formatTime(s.lastRunAt)}</span>
                  <span>next: {formatTime(s.nextRunAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
