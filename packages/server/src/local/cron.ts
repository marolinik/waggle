/**
 * LocalScheduler — lightweight cron tick loop for Solo mode.
 *
 * Polls CronStore for due schedules and executes them via an injected
 * executor function. Includes a concurrency guard to prevent overlapping
 * ticks when jobs run longer than the tick interval.
 *
 * Part of Wave 1.1 — Solo Cron Service.
 */

import type { CronStore, CronSchedule } from '@waggle/core';

/** Function that executes a cron job. Injected to keep the scheduler generic and testable. */
export type JobExecutor = (schedule: CronSchedule) => Promise<void>;

export class LocalScheduler {
  private store: CronStore;
  private executor: JobExecutor;
  private timer: NodeJS.Timeout | null = null;
  private ticking = false;

  constructor(store: CronStore, executor: JobExecutor) {
    this.store = store;
    this.executor = executor;
  }

  /** Start the tick loop. Default interval is 60 seconds. */
  start(intervalMs: number = 60_000): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      this.tick().catch(() => {});
    }, intervalMs);
  }

  /** Stop the tick loop. */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** Whether the scheduler timer is currently running. */
  isRunning(): boolean {
    return this.timer !== null;
  }

  /**
   * Execute one tick: find all due schedules and run them.
   * Returns the count of successfully executed jobs.
   *
   * Concurrency guard: if a previous tick is still running, returns 0 immediately.
   */
  async tick(): Promise<number> {
    if (this.ticking) return 0;
    this.ticking = true;
    let executed = 0;
    try {
      const due = this.store.getDue();
      for (const schedule of due) {
        try {
          await this.executor(schedule);
          this.store.markRun(schedule.id);
          executed++;
        } catch {
          // Job failed — will retry on next tick
        }
      }
    } finally {
      this.ticking = false;
    }
    return executed;
  }
}
