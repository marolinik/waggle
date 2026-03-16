/**
 * Waggle Marketplace — Database Access Layer
 * 
 * SQLite database interface for the marketplace catalog.
 * Uses better-sqlite3 (same driver Waggle core uses for .mind files).
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import { homedir } from 'os';
import type {
  MarketplacePackage,
  MarketplaceSource,
  MarketplacePack,
  Installation,
  SearchOptions,
  SearchResult,
} from './types';

const DEFAULT_DB_PATH = join(homedir(), '.waggle', 'marketplace.db');

export class MarketplaceDB {
  private db: Database.Database;

  constructor(dbPath: string = DEFAULT_DB_PATH) {
    this.db = new Database(dbPath, { readonly: false });
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
  }

  // ─── Package Queries ──────────────────────────────────────────────

  /**
   * Search packages using FTS5 full-text search + faceted filtering.
   */
  search(options: SearchOptions = {}): SearchResult {
    const { query, type, category, pack, source, limit = 50, offset = 0 } = options;
    const conditions: string[] = [];
    const params: Record<string, unknown> = {};

    // Full-text search via FTS5
    let baseQuery: string;
    if (query) {
      baseQuery = `
        SELECT p.* FROM packages p
        INNER JOIN packages_fts fts ON p.id = fts.rowid
        WHERE packages_fts MATCH @query
      `;
      params.query = query;
    } else {
      baseQuery = `SELECT p.* FROM packages p WHERE 1=1`;
    }

    // Faceted filters
    if (type) {
      conditions.push(`p.waggle_install_type = @type`);
      params.type = type;
    }
    if (category) {
      conditions.push(`p.category = @category`);
      params.category = category;
    }
    if (pack) {
      conditions.push(`EXISTS (
        SELECT 1 FROM pack_packages pp 
        INNER JOIN packs pk ON pk.id = pp.pack_id
        WHERE pp.package_id = p.id AND pk.slug = @pack
      )`);
      params.pack = pack;
    }
    if (source) {
      conditions.push(`EXISTS (
        SELECT 1 FROM sources s 
        WHERE s.id = p.source_id AND s.name = @source
      )`);
      params.source = source;
    }

    const whereClause = conditions.length > 0
      ? ` AND ${conditions.join(' AND ')}`
      : '';

    // Get total count
    const countQuery = baseQuery.replace('SELECT p.*', 'SELECT COUNT(*) as total') + whereClause;
    const total = (this.db.prepare(countQuery).get(params) as { total: number }).total;

    // Get packages
    const fullQuery = baseQuery + whereClause + ` ORDER BY p.downloads DESC, p.stars DESC LIMIT @limit OFFSET @offset`;
    params.limit = limit;
    params.offset = offset;
    const packages = this.db.prepare(fullQuery).all(params) as MarketplacePackage[];

    // Parse JSON fields
    const parsed = packages.map(p => this.parsePackageJson(p));

    // Build facets (on unfiltered result set)
    const facets = this.buildFacets(baseQuery + whereClause, params);

    return { packages: parsed, total, facets };
  }

  /**
   * Get a single package by ID.
   */
  getPackage(id: number): MarketplacePackage | null {
    const row = this.db.prepare('SELECT * FROM packages WHERE id = ?').get(id) as MarketplacePackage | undefined;
    return row ? this.parsePackageJson(row) : null;
  }

  /**
   * Get a single package by name.
   */
  getPackageByName(name: string): MarketplacePackage | null {
    const row = this.db.prepare('SELECT * FROM packages WHERE name = ?').get(name) as MarketplacePackage | undefined;
    return row ? this.parsePackageJson(row) : null;
  }

  /**
   * Get all packages in a given pack.
   */
  getPacksBySlug(slug: string): { pack: MarketplacePack; packages: MarketplacePackage[] } | null {
    const pack = this.db.prepare('SELECT * FROM packs WHERE slug = ?').get(slug) as MarketplacePack | undefined;
    if (!pack) return null;

    const packages = this.db.prepare(`
      SELECT p.*, pp.is_core FROM packages p
      INNER JOIN pack_packages pp ON pp.package_id = p.id
      WHERE pp.pack_id = ?
      ORDER BY pp.is_core DESC, p.downloads DESC
    `).all(pack.id) as (MarketplacePackage & { is_core: boolean })[];

    return {
      pack: { ...pack, connectors_needed: JSON.parse(pack.connectors_needed as unknown as string || '[]') },
      packages: packages.map(p => this.parsePackageJson(p)),
    };
  }

  /**
   * List all available packs.
   */
  listPacks(): MarketplacePack[] {
    const rows = this.db.prepare('SELECT * FROM packs ORDER BY priority, display_name').all() as MarketplacePack[];
    return rows.map(p => ({
      ...p,
      connectors_needed: JSON.parse(p.connectors_needed as unknown as string || '[]'),
    }));
  }

  /**
   * List all sources.
   */
  listSources(): MarketplaceSource[] {
    return this.db.prepare('SELECT * FROM sources ORDER BY total_packages DESC').all() as MarketplaceSource[];
  }

  // ─── Installation Tracking ────────────────────────────────────────

  /**
   * Record a successful installation.
   */
  recordInstallation(
    packageId: number,
    version: string,
    installPath: string,
    config: Record<string, unknown> = {},
  ): Installation {
    const stmt = this.db.prepare(`
      INSERT INTO installations (package_id, installed_version, installed_at, install_path, status, config)
      VALUES (?, ?, datetime('now'), ?, 'installed', ?)
    `);
    const result = stmt.run(packageId, version, installPath, JSON.stringify(config));
    return this.getInstallation(result.lastInsertRowid as number)!;
  }

  /**
   * Get installation by ID.
   */
  getInstallation(id: number): Installation | null {
    const row = this.db.prepare('SELECT * FROM installations WHERE id = ?').get(id) as Installation | undefined;
    if (!row) return null;
    return { ...row, config: JSON.parse(row.config as unknown as string || '{}') };
  }

  /**
   * Get all active installations.
   */
  listInstallations(): (Installation & { package: MarketplacePackage })[] {
    const rows = this.db.prepare(`
      SELECT i.*, p.name as pkg_name, p.display_name as pkg_display_name,
             p.waggle_install_type, p.category
      FROM installations i
      INNER JOIN packages p ON p.id = i.package_id
      WHERE i.status = 'installed'
      ORDER BY i.installed_at DESC
    `).all() as any[];
    return rows;
  }

  /**
   * Check if a package is already installed.
   */
  isInstalled(packageId: number): boolean {
    const row = this.db.prepare(
      `SELECT 1 FROM installations WHERE package_id = ? AND status = 'installed'`
    ).get(packageId);
    return !!row;
  }

  /**
   * Mark an installation as uninstalled.
   */
  markUninstalled(packageId: number): void {
    this.db.prepare(
      `UPDATE installations SET status = 'uninstalled' WHERE package_id = ? AND status = 'installed'`
    ).run(packageId);
  }

  // ─── Upsert (for sync) ───────────────────────────────────────────

  /**
   * Insert or update a package (used by sync scripts).
   */
  upsertPackage(pkg: Partial<MarketplacePackage> & { name: string; source_id: number }): number {
    const existing = this.db.prepare('SELECT id FROM packages WHERE name = ? AND source_id = ?')
      .get(pkg.name, pkg.source_id) as { id: number } | undefined;

    if (existing) {
      const sets: string[] = [];
      const params: Record<string, unknown> = { id: existing.id };
      for (const [key, value] of Object.entries(pkg)) {
        if (key === 'id' || key === 'name' || key === 'source_id') continue;
        sets.push(`${key} = @${key}`);
        params[key] = typeof value === 'object' ? JSON.stringify(value) : value;
      }
      sets.push(`updated_at = datetime('now')`);
      this.db.prepare(`UPDATE packages SET ${sets.join(', ')} WHERE id = @id`).run(params);
      return existing.id;
    } else {
      const cols = Object.keys(pkg);
      const vals = cols.map(c => `@${c}`);
      const params: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(pkg)) {
        params[key] = typeof value === 'object' ? JSON.stringify(value) : value;
      }
      const result = this.db.prepare(
        `INSERT INTO packages (${cols.join(', ')}) VALUES (${vals.join(', ')})`
      ).run(params);
      return result.lastInsertRowid as number;
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────

  private parsePackageJson(pkg: MarketplacePackage): MarketplacePackage {
    return {
      ...pkg,
      install_manifest: typeof pkg.install_manifest === 'string'
        ? JSON.parse(pkg.install_manifest)
        : pkg.install_manifest,
      platforms: typeof pkg.platforms === 'string'
        ? JSON.parse(pkg.platforms)
        : pkg.platforms || [],
      dependencies: typeof pkg.dependencies === 'string'
        ? JSON.parse(pkg.dependencies)
        : pkg.dependencies || [],
      packs: typeof pkg.packs === 'string'
        ? JSON.parse(pkg.packs)
        : pkg.packs || [],
    };
  }

  private buildFacets(baseQuery: string, params: Record<string, unknown>) {
    const facetQuery = baseQuery.replace(
      /SELECT p\.\*/,
      `SELECT p.waggle_install_type, p.category, s.name as source_name`
    ).replace(
      /FROM packages p/,
      `FROM packages p LEFT JOIN sources s ON s.id = p.source_id`
    );

    const rows = this.db.prepare(facetQuery).all(params) as {
      waggle_install_type: string;
      category: string;
      source_name: string;
    }[];

    const types: Record<string, number> = {};
    const categories: Record<string, number> = {};
    const sources: Record<string, number> = {};

    for (const row of rows) {
      types[row.waggle_install_type] = (types[row.waggle_install_type] || 0) + 1;
      categories[row.category] = (categories[row.category] || 0) + 1;
      if (row.source_name) sources[row.source_name] = (sources[row.source_name] || 0) + 1;
    }

    return { types, categories, sources };
  }

  /**
   * Close the database connection.
   */
  close(): void {
    this.db.close();
  }
}
