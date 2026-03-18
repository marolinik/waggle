/**
 * Marketplace Production Routes
 *
 * Always-available API endpoints for the marketplace — search catalog,
 * list/install/uninstall packages, query packs, and run security scans.
 *
 * These replace the dev-only /_dev/marketplace/ routes with stable
 * /api/marketplace/ contracts.
 */

import type { FastifyInstance } from 'fastify';
import { MarketplaceDB, MarketplaceInstaller, MarketplaceSync, SecurityGate } from '@waggle/marketplace';
import type { InstallationType, ScanResult } from '@waggle/marketplace';
import { emitNotification } from './notifications.js';

export async function marketplaceRoutes(fastify: FastifyInstance) {
  // ── Helpers ──────────────────────────────────────────────────────────

  function getDb(): MarketplaceDB | null {
    return (fastify as any).marketplace ?? null;
  }

  function requireDb(reply: any): MarketplaceDB | null {
    const db = getDb();
    if (!db) {
      reply.code(503).send({
        error: 'Marketplace not available',
        hint: 'marketplace.db was not found or failed to load',
      });
      return null;
    }
    return db;
  }

  // ── GET /api/marketplace/search ─────────────────────────────────────
  // Search the package catalog with FTS5 + faceted filters.

  fastify.get('/api/marketplace/search', async (request, reply) => {
    const db = requireDb(reply);
    if (!db) return;

    const { query, type, category, pack, source, limit, offset } = request.query as {
      query?: string;
      type?: string;
      category?: string;
      pack?: string;
      source?: string;
      limit?: string;
      offset?: string;
    };

    const results = db.search({
      query: query || '',
      type: type as InstallationType | undefined,
      category,
      pack,
      source,
      limit: limit ? parseInt(limit, 10) : 20,
      offset: offset ? parseInt(offset, 10) : 0,
    });

    return results;
  });

  // ── GET /api/marketplace/packs ──────────────────────────────────────
  // List all capability packs.

  fastify.get('/api/marketplace/packs', async (request, reply) => {
    const db = requireDb(reply);
    if (!db) return;

    const packs = db.listPacks();
    return { packs, total: packs.length };
  });

  // ── GET /api/marketplace/packs/:slug ────────────────────────────────
  // Get pack detail with its packages.

  fastify.get('/api/marketplace/packs/:slug', async (request, reply) => {
    const db = requireDb(reply);
    if (!db) return;

    const { slug } = request.params as { slug: string };
    const result = db.getPacksBySlug(slug);

    if (!result) {
      return reply.code(404).send({ error: `Pack "${slug}" not found` });
    }

    return result;
  });

  // ── POST /api/marketplace/install ───────────────────────────────────
  // Install a package from the marketplace with SecurityGate pre-scan.
  // Severity-based gating:
  //   CRITICAL → 403 (always blocked)
  //   HIGH     → 403 unless force=true (override logged to audit)
  //   MEDIUM   → install proceeds, warnings in response
  //   LOW      → install proceeds, logged to audit trail
  //   CLEAN    → install proceeds immediately

  fastify.post('/api/marketplace/install', async (request, reply) => {
    const db = requireDb(reply);
    if (!db) return;

    const body = request.body as {
      packageId: number;
      installPath?: string;
      settings?: Record<string, string>;
      force?: boolean;
      forceInsecure?: boolean;
    };

    if (!body.packageId) {
      return reply.code(400).send({ error: 'packageId is required' });
    }

    // ── SecurityGate pre-scan (heuristics-only for now) ──────────────
    const pkg = db.getPackage(body.packageId);
    if (!pkg) {
      return reply.code(404).send({ error: `Package ID ${body.packageId} not found` });
    }

    const gate = new SecurityGate({
      enable_gen_trust_hub: false,
      enable_cisco_scanner: false,
      enable_mcp_guardian: false,
      enable_heuristics: true,
    });

    let scanResult: ScanResult | undefined;
    try {
      scanResult = await gate.scan(pkg);
    } catch {
      // Scan failure should not block installation — proceed with warning
    }

    if (scanResult) {
      const severity = scanResult.overall_severity;
      const score = scanResult.security_score;

      // CRITICAL (score 0): Always blocked — return 403
      if (severity === 'CRITICAL') {
        // Log to audit store if available
        try {
          (fastify as any).auditStore?.record({
            capabilityName: pkg.name,
            capabilityType: pkg.waggle_install_type,
            source: 'marketplace',
            riskLevel: 'critical',
            trustSource: 'security-gate',
            approvalClass: 'blocked',
            action: 'blocked',
            initiator: 'system',
            detail: `SecurityGate blocked: ${scanResult.findings.length} finding(s), severity=${severity}, score=${score}`,
          });
        } catch { /* audit failure is non-blocking */ }

        return reply.code(403).send({
          blocked: true,
          severity,
          score,
          findings: scanResult.findings,
          message: `Installation blocked: ${scanResult.findings.length} CRITICAL security finding(s) detected.`,
        });
      }

      // HIGH (score 25): Blocked unless force=true
      if (severity === 'HIGH' && !body.force) {
        try {
          (fastify as any).auditStore?.record({
            capabilityName: pkg.name,
            capabilityType: pkg.waggle_install_type,
            source: 'marketplace',
            riskLevel: 'high',
            trustSource: 'security-gate',
            approvalClass: 'blocked',
            action: 'blocked',
            initiator: 'system',
            detail: `SecurityGate blocked (HIGH): ${scanResult.findings.length} finding(s). Use force=true to override.`,
          });
        } catch { /* audit failure is non-blocking */ }

        return reply.code(403).send({
          blocked: true,
          severity,
          score,
          findings: scanResult.findings,
          message: `Installation blocked: ${scanResult.findings.length} HIGH severity finding(s). Send force=true to override.`,
        });
      }

      // HIGH with force=true: Log the override to audit trail
      if (severity === 'HIGH' && body.force) {
        try {
          (fastify as any).auditStore?.record({
            capabilityName: pkg.name,
            capabilityType: pkg.waggle_install_type,
            source: 'marketplace',
            riskLevel: 'high',
            trustSource: 'security-gate',
            approvalClass: 'force-override',
            action: 'approved',
            initiator: 'user',
            detail: `User forced install despite HIGH severity findings: ${scanResult.findings.map(f => f.title).join('; ')}`,
          });
        } catch { /* audit failure is non-blocking */ }
      }

      // MEDIUM: Log warning but proceed
      if (severity === 'MEDIUM') {
        try {
          (fastify as any).auditStore?.record({
            capabilityName: pkg.name,
            capabilityType: pkg.waggle_install_type,
            source: 'marketplace',
            riskLevel: 'medium',
            trustSource: 'security-gate',
            approvalClass: 'standard',
            action: 'approved',
            initiator: 'system',
            detail: `SecurityGate passed with warnings: ${scanResult.findings.length} MEDIUM finding(s)`,
          });
        } catch { /* audit failure is non-blocking */ }
      }

      // LOW: Log to audit trail only
      if (severity === 'LOW') {
        try {
          (fastify as any).auditStore?.record({
            capabilityName: pkg.name,
            capabilityType: pkg.waggle_install_type,
            source: 'marketplace',
            riskLevel: 'low',
            trustSource: 'security-gate',
            approvalClass: 'standard',
            action: 'approved',
            initiator: 'system',
            detail: `SecurityGate passed: ${scanResult.findings.length} LOW finding(s)`,
          });
        } catch { /* audit failure is non-blocking */ }
      }
    }

    // ── Proceed with installation ────────────────────────────────────
    const installer = new MarketplaceInstaller(db, {
      enable_gen_trust_hub: false,
      enable_cisco_scanner: false,
      enable_mcp_guardian: false,
      enable_heuristics: true,
    });
    const result = await installer.install({
      packageId: body.packageId,
      installPath: body.installPath,
      settings: body.settings,
      force: body.force,
      forceInsecure: body.forceInsecure,
    });

    // Update security status in DB after successful install
    if (result.success && scanResult) {
      try {
        const rawDb = (db as any).db;
        if (rawDb?.prepare) {
          rawDb.prepare(`
            UPDATE packages SET
              security_status = ?,
              security_score = ?
            WHERE id = ?
          `).run(
            scanResult.overall_severity.toLowerCase(),
            scanResult.security_score,
            body.packageId,
          );
        }
      } catch { /* non-blocking */ }
    }

    // Attach security scan info to the response
    const response: Record<string, unknown> = { ...result };
    if (scanResult) {
      response.security = {
        severity: scanResult.overall_severity,
        score: scanResult.security_score,
        findingsCount: scanResult.findings.length,
        findings: scanResult.findings,
        warnings: scanResult.overall_severity === 'MEDIUM'
          ? scanResult.findings.map(f => `[${f.severity}] ${f.title}`)
          : undefined,
      };
    }

    return reply.code(result.success ? 200 : 422).send(response);
  });

  // ── POST /api/marketplace/uninstall ─────────────────────────────────
  // Uninstall a previously installed package.

  fastify.post('/api/marketplace/uninstall', async (request, reply) => {
    const db = requireDb(reply);
    if (!db) return;

    const body = request.body as { packageId: number };

    if (!body.packageId) {
      return reply.code(400).send({ error: 'packageId is required' });
    }

    const installer = new MarketplaceInstaller(db);
    const result = await installer.uninstall(body.packageId);

    return reply.code(result.success ? 200 : 422).send(result);
  });

  // ── GET /api/marketplace/installed ──────────────────────────────────
  // List all currently installed packages.

  fastify.get('/api/marketplace/installed', async (request, reply) => {
    const db = requireDb(reply);
    if (!db) return;

    const installations = db.listInstallations();
    return { installations, total: installations.length };
  });

  // ── POST /api/marketplace/security-check ────────────────────────────
  // Run a security scan on a package (by ID) without installing it.

  fastify.post('/api/marketplace/security-check', async (request, reply) => {
    const db = requireDb(reply);
    if (!db) return;

    const body = request.body as { packageId: number };

    if (!body.packageId) {
      return reply.code(400).send({ error: 'packageId is required' });
    }

    const installer = new MarketplaceInstaller(db, {
      enable_gen_trust_hub: false,
      enable_cisco_scanner: false,
      enable_mcp_guardian: false,
      enable_heuristics: true,
    });

    const scanResult = await installer.scanOnly(body.packageId);

    if (!scanResult) {
      return reply.code(404).send({ error: `Package ID ${body.packageId} not found` });
    }

    return {
      packageId: body.packageId,
      severity: scanResult.overall_severity,
      score: scanResult.security_score,
      blocked: scanResult.blocked,
      enginesUsed: scanResult.engines_used,
      findingsCount: scanResult.findings.length,
      findings: scanResult.findings,
      durationMs: scanResult.scan_duration_ms,
      contentHash: scanResult.content_hash,
    };
  });

  // ── GET /api/marketplace/sources ────────────────────────────────────
  // List all marketplace sources.

  fastify.get('/api/marketplace/sources', async (request, reply) => {
    const db = requireDb(reply);
    if (!db) return;

    const sources = db.listSources();
    return { sources, total: sources.length };
  });

  // ── POST /api/marketplace/sync ──────────────────────────────────────
  // Trigger a manual sync from all configured marketplace sources.
  // In dev/local mode, external sources won't be reachable — errors are
  // captured per-source and returned gracefully.

  fastify.post('/api/marketplace/sync', async (request, reply) => {
    const db = requireDb(reply);
    if (!db) return;

    const body = (request.body ?? {}) as { sources?: string[] };

    const sync = new MarketplaceSync(db);

    try {
      const results = await sync.syncAll(body.sources ? { sources: body.sources } : {});

      const sourcesChecked = results.length;
      const packagesAdded = results.reduce((sum, r) => sum + r.added, 0);
      const packagesUpdated = results.reduce((sum, r) => sum + r.updated, 0);
      const errors = results.flatMap(r => r.errors.map(e => `[${r.source}] ${e}`));

      // Emit notification if new packages were discovered
      if (packagesAdded > 0) {
        emitNotification(fastify, {
          title: 'Marketplace sync complete',
          body: `${packagesAdded} new capability${packagesAdded === 1 ? '' : 's'} discovered`,
          category: 'agent',
          actionUrl: '/capabilities',
        });
      }

      return {
        sourcesChecked,
        packagesAdded,
        packagesUpdated,
        errors,
        details: results,
      };
    } catch (err) {
      return reply.code(500).send({
        error: 'Sync failed',
        message: (err as Error).message,
        sourcesChecked: 0,
        packagesAdded: 0,
        packagesUpdated: 0,
        errors: [(err as Error).message],
      });
    }
  });
}
