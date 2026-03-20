/**
 * Security middleware for the local Waggle server.
 *
 * Provides:
 * 1. Security headers (CSP, X-Content-Type-Options, X-Frame-Options)
 * 2. Simple in-memory rate limiter (sliding window, Map-based)
 * 3. Session inactivity timeout (team mode only — when CLERK_SECRET_KEY is set)
 *
 * Only applied to the local server — team server may have different needs.
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';

// ── Security Headers ────────────────────────────────────────────────────

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    "connect-src 'self' http://127.0.0.1:* ws://127.0.0.1:* https://api.anthropic.com https://generativelanguage.googleapis.com",
    "frame-ancestors 'none'",
  ].join('; '),
};

// ── Rate Limiter ────────────────────────────────────────────────────────

interface RateLimitEntry {
  /** Timestamps of requests within the current window */
  timestamps: number[];
}

export interface RateLimiterConfig {
  /** Maximum requests per window per endpoint (default: 100) */
  maxRequests?: number;
  /** Window duration in milliseconds (default: 60_000 = 1 minute) */
  windowMs?: number;
}

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private maxRequests: number;
  private windowMs: number;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: RateLimiterConfig = {}) {
    this.maxRequests = config.maxRequests ?? 100;
    this.windowMs = config.windowMs ?? 60_000;

    // Periodic cleanup of stale entries (every 2 minutes)
    this.cleanupInterval = setInterval(() => this.cleanup(), 120_000);
    // Don't block Node.js exit
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Check if a request is within the rate limit.
   * Returns { allowed: true, remaining } or { allowed: false, retryAfterMs }.
   */
  check(key: string): { allowed: true; remaining: number } | { allowed: false; retryAfterMs: number } {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    let entry = this.store.get(key);
    if (!entry) {
      entry = { timestamps: [] };
      this.store.set(key, entry);
    }

    // Remove timestamps outside the window (sliding window)
    entry.timestamps = entry.timestamps.filter(t => t > windowStart);

    if (entry.timestamps.length >= this.maxRequests) {
      // Find when the oldest request in the window will expire
      const oldestInWindow = entry.timestamps[0];
      const retryAfterMs = oldestInWindow + this.windowMs - now;
      return { allowed: false, retryAfterMs: Math.max(retryAfterMs, 1) };
    }

    entry.timestamps.push(now);
    return { allowed: true, remaining: this.maxRequests - entry.timestamps.length };
  }

  /** Remove stale entries to prevent memory leak */
  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    for (const [key, entry] of this.store) {
      entry.timestamps = entry.timestamps.filter(t => t > windowStart);
      if (entry.timestamps.length === 0) {
        this.store.delete(key);
      }
    }
  }

  /** Stop the cleanup interval (for graceful shutdown) */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

// ── Session Timeout (Team Mode Only) ────────────────────────────────────

/** Routes exempt from session timeout (health + vault for re-auth) */
const TIMEOUT_EXEMPT_PATHS = ['/health', '/api/vault'];

/** Default session inactivity timeout: 30 minutes */
const DEFAULT_SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 1_800_000

export class SessionTimeoutTracker {
  private lastActivity = new Map<string, number>();
  private timeoutMs: number;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(timeoutMs?: number) {
    this.timeoutMs = timeoutMs ?? (parseInt(process.env.WAGGLE_SESSION_TIMEOUT_MS ?? '', 10) || DEFAULT_SESSION_TIMEOUT_MS);

    // Cleanup stale entries every 2x timeout to prevent memory leak
    const cleanupPeriod = this.timeoutMs * 2;
    this.cleanupInterval = setInterval(() => this.cleanup(), cleanupPeriod);
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /** Get the configured timeout duration in milliseconds. */
  getTimeoutMs(): number {
    return this.timeoutMs;
  }

  /**
   * Check if the session for the given IP is expired.
   * Returns true if expired (last activity was more than timeoutMs ago).
   * Updates last activity timestamp on every call (resets timer).
   */
  check(ip: string): boolean {
    const now = Date.now();
    const last = this.lastActivity.get(ip);

    if (last !== undefined && (now - last) > this.timeoutMs) {
      // Expired — remove the entry so re-auth starts fresh
      this.lastActivity.delete(ip);
      return true; // expired
    }

    // Reset timer on every request
    this.lastActivity.set(ip, now);
    return false; // not expired
  }

  /** Remove entries older than 2x the timeout to prevent memory leak. */
  private cleanup(): void {
    const now = Date.now();
    const maxAge = this.timeoutMs * 2;
    for (const [ip, lastTime] of this.lastActivity) {
      if (now - lastTime > maxAge) {
        this.lastActivity.delete(ip);
      }
    }
  }

  /** Stop the cleanup interval (for graceful shutdown). */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.lastActivity.clear();
  }
}

// ── Fastify Plugin Registration ─────────────────────────────────────────

async function securityMiddlewarePlugin(
  fastify: FastifyInstance,
  opts: { rateLimiter?: RateLimiterConfig },
) {
  const limiter = new RateLimiter(opts.rateLimiter);

  // Session timeout — only enabled in team mode (when CLERK_SECRET_KEY is set)
  const isTeamMode = !!process.env.CLERK_SECRET_KEY;
  const sessionTimeout = isTeamMode ? new SessionTimeoutTracker() : null;

  // Clean up limiter and session timeout on server close
  fastify.addHook('onClose', async () => {
    limiter.destroy();
    sessionTimeout?.destroy();
  });

  // Add security headers + rate limiting + session timeout to every response
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    // ── Security headers ──
    for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
      reply.header(header, value);
    }

    // ── Session timeout (team mode only) ──
    if (sessionTimeout) {
      const requestPath = request.url.split('?')[0]; // Strip query string
      const isExempt = TIMEOUT_EXEMPT_PATHS.some(p => requestPath.startsWith(p));

      if (!isExempt) {
        const clientIp = request.ip || '127.0.0.1';
        const expired = sessionTimeout.check(clientIp);
        if (expired) {
          return reply.code(401).send({
            error: 'Session expired',
            code: 'SESSION_TIMEOUT',
          });
        }
      }
    }

    // ── Rate limiting ──
    // Key: method + route pattern (e.g., "POST /api/vault/:name/reveal")
    const key = `${request.method} ${request.routeOptions?.url ?? request.url}`;
    const result = limiter.check(key);

    reply.header('X-RateLimit-Limit', String(limiter['maxRequests']));

    if (!result.allowed) {
      reply.header('Retry-After', String(Math.ceil(result.retryAfterMs / 1000)));
      reply.header('X-RateLimit-Remaining', '0');
      return reply.code(429).send({
        error: 'Too Many Requests',
        retryAfterMs: result.retryAfterMs,
      });
    }

    reply.header('X-RateLimit-Remaining', String(result.remaining));
  });
}

// Wrap with fastify-plugin to break encapsulation — hooks apply to ALL routes
export const securityMiddleware = fp(securityMiddlewarePlugin, {
  name: 'waggle-security-middleware',
});
