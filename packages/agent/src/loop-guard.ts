import { createHash } from 'node:crypto';

export interface LoopGuardConfig {
  maxRepeats?: number;
}

export class LoopGuard {
  private maxRepeats: number;
  private lastHash: string | null = null;
  private consecutiveCount = 0;

  constructor(config: LoopGuardConfig = {}) {
    this.maxRepeats = config.maxRepeats ?? 3;
  }

  check(toolName: string, args: Record<string, unknown>): boolean {
    const hash = createHash('sha256')
      .update(toolName + ':' + JSON.stringify(args))
      .digest('hex');

    if (hash === this.lastHash) {
      this.consecutiveCount++;
    } else {
      this.lastHash = hash;
      this.consecutiveCount = 1;
    }

    return this.consecutiveCount <= this.maxRepeats;
  }

  reset(): void {
    this.lastHash = null;
    this.consecutiveCount = 0;
  }
}
