/**
 * Waggle Marketplace — Source Sync Engine
 * 
 * Fetches live package data from marketplace sources and updates
 * the local SQLite database. Supports incremental and full syncs.
 * 
 * Supported sources:
 *   - ClawHub API (https://clawhub.ai/api/v1/skills)
 *   - SkillsMP API (https://skillsmp.dev/api/v1/skills)
 *   - GitHub Organizations (anthropics, modelcontextprotocol, lobehub, cursor, etc.)
 *   - LobeHub Plugin Registry (https://chat-plugins.lobehub.com/index.json)
 *   - AITMPL Skills (https://www.aitmpl.com/api/skills)
 * 
 * Rate limits are respected per source. Default: 500 req/day for SkillsMP,
 * 100 req/min for GitHub API, unlimited for ClawHub.
 */

import { MarketplaceDB } from './db';
import type {
  MarketplacePackage,
  MarketplaceSource,
  SyncOptions,
  SyncResult,
  InstallManifest,
} from './types';

interface SyncAdapter {
  name: string;
  canSync(source: MarketplaceSource): boolean;
  sync(source: MarketplaceSource, db: MarketplaceDB): Promise<SyncResult>;
}

// ─── GitHub Adapter ─────────────────────────────────────────────────

const githubAdapter: SyncAdapter = {
  name: 'github',

  canSync(source) {
    return source.source_type === 'github_org' || source.url.includes('github.com');
  },

  async sync(source, db) {
    const result: SyncResult = { source: source.name, added: 0, updated: 0, removed: 0, errors: [] };

    try {
      // Extract org/user from URL
      const match = source.url.match(/github\.com\/([^/]+)/);
      if (!match) throw new Error(`Cannot parse GitHub URL: ${source.url}`);
      const owner = match[1];

      // Fetch repos with topic filters
      const apiUrl = source.api_endpoint || `https://api.github.com/orgs/${owner}/repos?per_page=100&sort=updated`;
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'waggle-marketplace-sync',
      };
      if (process.env.GITHUB_TOKEN) {
        headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
      }

      const response = await fetch(apiUrl, { headers });
      if (!response.ok) throw new Error(`GitHub API ${response.status}: ${response.statusText}`);

      const repos = await response.json() as any[];

      for (const repo of repos) {
        // Filter for skill/MCP/plugin repos
        const topics = repo.topics || [];
        const isSkill = topics.some((t: string) =>
          ['skill', 'agent-skill', 'claude-code', 'mcp', 'mcp-server', 'plugin'].includes(t)
        ) || repo.name.includes('skill') || repo.name.includes('mcp');

        if (!isSkill && repos.length > 20) continue; // Skip non-skill repos in large orgs

        const installType = repo.name.includes('mcp') ? 'mcp' : 
                           topics.includes('plugin') ? 'plugin' : 'skill';

        const manifest: InstallManifest = installType === 'skill'
          ? { skill_url: `https://raw.githubusercontent.com/${owner}/${repo.name}/main/SKILL.md` }
          : installType === 'mcp'
            ? { mcp_config: { name: repo.name, command: 'npx', args: ['-y', repo.full_name] } }
            : { git_url: repo.clone_url };

        const id = db.upsertPackage({
          source_id: source.id,
          name: repo.name,
          display_name: repo.name.replace(/[-_]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
          description: repo.description || `${installType} from ${owner}`,
          author: owner,
          package_type: installType === 'mcp' ? 'mcp_server' : installType,
          waggle_install_type: installType as 'skill' | 'plugin' | 'mcp',
          waggle_install_path: installType === 'skill'
            ? `skills/${repo.name}.md`
            : installType === 'plugin'
              ? `plugins/${repo.name}/`
              : `.mcp.json`,
          version: '1.0.0',
          license: repo.license?.spdx_id || null,
          repository_url: repo.html_url,
          homepage_url: repo.homepage || null,
          downloads: 0,
          stars: repo.stargazers_count || 0,
          category: installType === 'mcp' ? 'integration' : 'development',
          platforms: JSON.stringify(['claude_code', 'waggle']) as any,
          dependencies: JSON.stringify([]) as any,
          packs: JSON.stringify([]) as any,
          install_manifest: JSON.stringify(manifest) as any,
        });

        result.added++;
      }
    } catch (err) {
      result.errors.push((err as Error).message);
    }

    return result;
  },
};

// ─── ClawHub Adapter ────────────────────────────────────────────────

const clawhubAdapter: SyncAdapter = {
  name: 'clawhub',

  canSync(source) {
    return source.name === 'clawhub' || source.url.includes('clawhub.ai');
  },

  async sync(source, db) {
    const result: SyncResult = { source: source.name, added: 0, updated: 0, removed: 0, errors: [] };

    try {
      const apiBase = source.api_endpoint || 'https://clawhub.ai/api/v1';
      let page = 1;
      const perPage = 50;
      let hasMore = true;

      while (hasMore && page <= 10) { // Cap at 500 skills per sync
        const url = `${apiBase}/skills?page=${page}&per_page=${perPage}&sort=downloads`;
        const response = await fetch(url, {
          headers: { 'User-Agent': 'waggle-marketplace-sync' },
        });

        if (!response.ok) {
          result.errors.push(`ClawHub API page ${page}: ${response.status}`);
          break;
        }

        const data = await response.json() as any;
        const skills = data.skills || data.data || data;

        if (!Array.isArray(skills) || skills.length === 0) {
          hasMore = false;
          break;
        }

        for (const skill of skills) {
          const manifest: InstallManifest = {
            skill_url: skill.raw_url || skill.download_url || `${apiBase}/skills/${skill.id || skill.slug}/raw`,
          };

          db.upsertPackage({
            source_id: source.id,
            name: skill.slug || skill.name?.toLowerCase().replace(/\s+/g, '-'),
            display_name: skill.name || skill.title,
            description: skill.description || '',
            author: skill.author || skill.creator || 'community',
            package_type: 'skill',
            waggle_install_type: 'skill',
            waggle_install_path: `skills/${skill.slug || skill.name?.toLowerCase().replace(/\s+/g, '-')}.md`,
            version: skill.version || '1.0.0',
            license: skill.license || 'MIT',
            repository_url: skill.repository_url || null,
            homepage_url: skill.homepage || `https://clawhub.ai/skills/${skill.slug || skill.id}`,
            downloads: skill.downloads || skill.download_count || 0,
            stars: skill.stars || skill.likes || 0,
            rating: skill.rating || 0,
            rating_count: skill.rating_count || 0,
            category: skill.category || 'general',
            platforms: JSON.stringify(skill.platforms || ['claude_code', 'waggle']) as any,
            dependencies: JSON.stringify(skill.dependencies || []) as any,
            packs: JSON.stringify([]) as any,
            install_manifest: JSON.stringify(manifest) as any,
          });

          result.added++;
        }

        hasMore = skills.length === perPage;
        page++;
      }
    } catch (err) {
      result.errors.push((err as Error).message);
    }

    return result;
  },
};

// ─── SkillsMP Adapter ───────────────────────────────────────────────

const skillsmpAdapter: SyncAdapter = {
  name: 'skillsmp',

  canSync(source) {
    return source.name === 'skillsmp' || source.url.includes('skillsmp.dev');
  },

  async sync(source, db) {
    const result: SyncResult = { source: source.name, added: 0, updated: 0, removed: 0, errors: [] };

    try {
      const apiBase = source.api_endpoint || 'https://skillsmp.dev/api/v1';
      let page = 1;
      const perPage = 100;
      let hasMore = true;

      while (hasMore && page <= 5) { // Cap at 500, SkillsMP has daily rate limits
        const url = `${apiBase}/skills?page=${page}&limit=${perPage}&sort=installs`;
        const response = await fetch(url, {
          headers: { 'User-Agent': 'waggle-marketplace-sync' },
        });

        if (!response.ok) {
          if (response.status === 429) {
            result.errors.push('SkillsMP rate limit reached (500 req/day). Try again tomorrow.');
            break;
          }
          result.errors.push(`SkillsMP API page ${page}: ${response.status}`);
          break;
        }

        const data = await response.json() as any;
        const skills = data.skills || data.data || data;

        if (!Array.isArray(skills) || skills.length === 0) {
          hasMore = false;
          break;
        }

        for (const skill of skills) {
          const manifest: InstallManifest = {
            skill_url: skill.raw_url || `${apiBase}/skills/${skill.id}/content`,
          };

          db.upsertPackage({
            source_id: source.id,
            name: skill.slug || skill.id,
            display_name: skill.name || skill.title,
            description: skill.description || '',
            author: skill.author || 'community',
            package_type: 'skill',
            waggle_install_type: 'skill',
            waggle_install_path: `skills/${skill.slug || skill.id}.md`,
            version: skill.version || '1.0.0',
            license: 'MIT',
            repository_url: skill.repository_url || null,
            homepage_url: `https://skillsmp.dev/skills/${skill.slug || skill.id}`,
            downloads: skill.installs || skill.downloads || 0,
            stars: skill.likes || skill.stars || 0,
            category: skill.category || 'general',
            platforms: JSON.stringify(['claude_code', 'codex', 'cursor', 'waggle']) as any,
            dependencies: JSON.stringify([]) as any,
            packs: JSON.stringify([]) as any,
            install_manifest: JSON.stringify(manifest) as any,
          });

          result.added++;
        }

        hasMore = skills.length === perPage;
        page++;

        // Respect rate limits
        await new Promise(r => setTimeout(r, 200));
      }
    } catch (err) {
      result.errors.push((err as Error).message);
    }

    return result;
  },
};

// ─── LobeHub Adapter ────────────────────────────────────────────────

const lobehubAdapter: SyncAdapter = {
  name: 'lobehub',

  canSync(source) {
    return source.name === 'lobehub_plugins' || source.url.includes('lobehub');
  },

  async sync(source, db) {
    const result: SyncResult = { source: source.name, added: 0, updated: 0, removed: 0, errors: [] };

    try {
      const indexUrl = source.api_endpoint || 'https://chat-plugins.lobehub.com/index.json';
      const response = await fetch(indexUrl);
      if (!response.ok) throw new Error(`LobeHub index: ${response.status}`);

      const data = await response.json() as any;
      const plugins = data.plugins || data;

      if (!Array.isArray(plugins)) throw new Error('Unexpected LobeHub response format');

      for (const plugin of plugins.slice(0, 200)) { // Cap for initial sync
        const manifest: InstallManifest = {
          plugin_manifest: {
            name: plugin.identifier || plugin.name,
            version: plugin.version || '1.0.0',
            description: plugin.description || '',
            skills: [],
            mcpServers: plugin.api ? [{
              name: plugin.identifier,
              command: 'npx',
              args: ['-y', `@lobehub/${plugin.identifier}`],
            }] : [],
          },
        };

        db.upsertPackage({
          source_id: source.id,
          name: plugin.identifier || plugin.name?.toLowerCase().replace(/\s+/g, '-'),
          display_name: plugin.name || plugin.identifier,
          description: plugin.description || '',
          author: plugin.author || 'lobehub',
          package_type: 'plugin',
          waggle_install_type: 'plugin',
          waggle_install_path: `plugins/${plugin.identifier}/`,
          version: plugin.version || '1.0.0',
          license: 'MIT',
          repository_url: `https://github.com/lobehub/lobe-chat-plugins/tree/main/plugins/${plugin.identifier}`,
          homepage_url: plugin.homepage || `https://lobehub.com/plugins/${plugin.identifier}`,
          downloads: plugin.installs || 0,
          stars: 0,
          category: plugin.category || 'integration',
          platforms: JSON.stringify(['lobehub', 'waggle']) as any,
          dependencies: JSON.stringify([]) as any,
          packs: JSON.stringify([]) as any,
          install_manifest: JSON.stringify(manifest) as any,
        });

        result.added++;
      }
    } catch (err) {
      result.errors.push((err as Error).message);
    }

    return result;
  },
};

// ─── Generic JSON Adapter ───────────────────────────────────────────

const genericAdapter: SyncAdapter = {
  name: 'generic',

  canSync(source) {
    return !!source.api_endpoint;
  },

  async sync(source, db) {
    const result: SyncResult = { source: source.name, added: 0, updated: 0, removed: 0, errors: [] };

    try {
      const response = await fetch(source.api_endpoint!);
      if (!response.ok) throw new Error(`API ${response.status}`);

      const data = await response.json() as any;
      const items = Array.isArray(data) ? data : data.skills || data.plugins || data.data || [];

      for (const item of items.slice(0, 100)) {
        db.upsertPackage({
          source_id: source.id,
          name: item.slug || item.name?.toLowerCase().replace(/\s+/g, '-') || `${source.name}-${result.added}`,
          display_name: item.name || item.title || item.slug,
          description: item.description || '',
          author: item.author || source.name,
          package_type: item.type || 'skill',
          waggle_install_type: item.type === 'mcp' ? 'mcp' : item.type === 'plugin' ? 'plugin' : 'skill',
          waggle_install_path: `skills/${item.slug || item.name?.toLowerCase().replace(/\s+/g, '-')}.md`,
          version: item.version || '1.0.0',
          repository_url: item.repository_url || null,
          homepage_url: item.url || null,
          downloads: item.downloads || item.installs || 0,
          stars: item.stars || item.likes || 0,
          category: item.category || 'general',
          platforms: JSON.stringify(['waggle']) as any,
          dependencies: JSON.stringify([]) as any,
          packs: JSON.stringify([]) as any,
          install_manifest: JSON.stringify({
            skill_url: item.raw_url || item.content_url,
          }) as any,
        });

        result.added++;
      }
    } catch (err) {
      result.errors.push((err as Error).message);
    }

    return result;
  },
};

// ─── Sync Engine ────────────────────────────────────────────────────

const ADAPTERS: SyncAdapter[] = [
  clawhubAdapter,
  skillsmpAdapter,
  githubAdapter,
  lobehubAdapter,
  genericAdapter, // Fallback
];

export class MarketplaceSync {
  private db: MarketplaceDB;

  constructor(db: MarketplaceDB) {
    this.db = db;
  }

  /**
   * Sync packages from all (or specified) sources.
   */
  async syncAll(options: SyncOptions = {}): Promise<SyncResult[]> {
    const sources = this.db.listSources();
    const filteredSources = options.sources
      ? sources.filter(s => options.sources!.includes(s.name))
      : sources;

    const results: SyncResult[] = [];

    for (const source of filteredSources) {
      console.log(`[sync] Syncing from ${source.display_name}...`);

      const adapter = ADAPTERS.find(a => a.canSync(source));
      if (!adapter) {
        results.push({
          source: source.name,
          added: 0,
          updated: 0,
          removed: 0,
          errors: [`No sync adapter for source type: ${source.source_type}`],
        });
        continue;
      }

      try {
        const result = await adapter.sync(source, this.db);
        results.push(result);
        console.log(`[sync] ${source.display_name}: +${result.added} added, ${result.errors.length} errors`);
      } catch (err) {
        results.push({
          source: source.name,
          added: 0,
          updated: 0,
          removed: 0,
          errors: [(err as Error).message],
        });
      }
    }

    return results;
  }
}
