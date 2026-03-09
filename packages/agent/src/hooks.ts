export type HookEvent =
  | 'pre:tool'
  | 'post:tool'
  | 'session:start'
  | 'session:end'
  | 'pre:response'
  | 'post:response';

export interface HookContext {
  toolName?: string;
  args?: Record<string, unknown>;
  result?: string;
  sessionId?: string;
  content?: string;
  [key: string]: unknown;
}

export interface HookResult {
  cancelled: boolean;
  reason?: string;
}

type HookFn = (ctx: HookContext) => Promise<{ cancel?: boolean; reason?: string } | void> | { cancel?: boolean; reason?: string } | void;

export class HookRegistry {
  private hooks = new Map<HookEvent, Set<HookFn>>();

  on(event: HookEvent, fn: HookFn): () => void {
    if (!this.hooks.has(event)) this.hooks.set(event, new Set());
    this.hooks.get(event)!.add(fn);
    return () => { this.hooks.get(event)?.delete(fn); };
  }

  async fire(event: HookEvent, ctx: HookContext): Promise<HookResult> {
    const fns = this.hooks.get(event);
    if (!fns || fns.size === 0) return { cancelled: false };

    for (const fn of fns) {
      try {
        const result = await fn(ctx);
        if (result?.cancel) {
          return { cancelled: true, reason: result.reason };
        }
      } catch {
        // Hook errors are non-fatal — log but continue
      }
    }
    return { cancelled: false };
  }
}
