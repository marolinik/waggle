export type CapabilitySource = 'native' | 'skill' | 'plugin' | 'mcp' | 'subagent' | 'missing';

export interface CapabilityRoute {
  source: CapabilitySource;
  name: string;
  confidence: number;
  description: string;
  available: boolean;
  suggestion?: string;
}

export interface CapabilityRouterDeps {
  /** Currently registered tool names */
  toolNames: string[];
  /** Installed skill names and their content (for keyword matching) */
  skills: Array<{ name: string; content: string }>;
  /** Installed plugin manifests */
  plugins: Array<{
    name: string;
    description: string;
    skills?: string[];
    mcpServers?: Array<{ name: string }>;
  }>;
  /** Configured MCP server names */
  mcpServers: string[];
  /** Available sub-agent role presets */
  subAgentRoles: string[];
}

const ROLE_KEYWORDS: Record<string, string[]> = {
  researcher: ['research', 'investigate', 'find', 'lookup', 'search'],
  writer: ['write', 'draft', 'compose', 'author', 'document'],
  coder: ['code', 'implement', 'program', 'develop', 'build'],
  analyst: ['analyze', 'data', 'statistics', 'metrics', 'report'],
  reviewer: ['review', 'audit', 'check', 'inspect', 'evaluate'],
  planner: ['plan', 'strategy', 'roadmap', 'schedule', 'organize'],
};

export class CapabilityRouter {
  private deps: CapabilityRouterDeps;

  constructor(deps: CapabilityRouterDeps) {
    this.deps = deps;
  }

  resolve(query: string): CapabilityRoute[] {
    const routes: CapabilityRoute[] = [];
    const q = query.toLowerCase();

    // 1. Native tools — exact or partial match
    for (const toolName of this.deps.toolNames) {
      const tl = toolName.toLowerCase();
      if (tl === q) {
        routes.push({
          source: 'native',
          name: toolName,
          confidence: 1.0,
          description: `Native tool "${toolName}" (exact match)`,
          available: true,
        });
      } else if (tl.includes(q) || q.includes(tl)) {
        routes.push({
          source: 'native',
          name: toolName,
          confidence: 0.8,
          description: `Native tool "${toolName}" (partial match)`,
          available: true,
        });
      }
    }

    // 2. Skills — name or content keyword match
    for (const skill of this.deps.skills) {
      const nameMatch = skill.name.toLowerCase().includes(q) || q.includes(skill.name.toLowerCase());
      const contentMatch = skill.content.toLowerCase().includes(q);
      if (nameMatch || contentMatch) {
        routes.push({
          source: 'skill',
          name: skill.name,
          confidence: nameMatch ? 0.7 : 0.5,
          description: `Skill "${skill.name}" ${nameMatch ? '(name match)' : '(content match)'}`,
          available: true,
        });
      }
    }

    // 3. Plugins — description or skill list match
    for (const plugin of this.deps.plugins) {
      const descMatch = plugin.description.toLowerCase().includes(q);
      const skillMatch = plugin.skills?.some(s => s.toLowerCase().includes(q) || q.includes(s.toLowerCase()));
      if (descMatch || skillMatch) {
        routes.push({
          source: 'plugin',
          name: plugin.name,
          confidence: 0.6,
          description: `Plugin "${plugin.name}" — ${plugin.description}`,
          available: true,
        });
      }
    }

    // 4. MCP servers — name match
    for (const server of this.deps.mcpServers) {
      if (server.toLowerCase().includes(q) || q.includes(server.toLowerCase())) {
        routes.push({
          source: 'mcp',
          name: server,
          confidence: 0.5,
          description: `MCP server "${server}" may provide this capability`,
          available: true,
        });
      }
    }

    // 5. Sub-agent roles — keyword mapping
    for (const role of this.deps.subAgentRoles) {
      const keywords = ROLE_KEYWORDS[role.toLowerCase()] ?? [];
      const roleMatches = keywords.some(kw => q.includes(kw)) || q.includes(role.toLowerCase());
      if (roleMatches) {
        routes.push({
          source: 'subagent',
          name: role,
          confidence: 0.4,
          description: `Sub-agent role "${role}" can handle this type of task`,
          available: true,
        });
      }
    }

    // Sort by confidence descending
    routes.sort((a, b) => b.confidence - a.confidence);

    // 6. If nothing matched, return missing
    if (routes.length === 0) {
      routes.push({
        source: 'missing',
        name: query,
        confidence: 0,
        description: `No capability found for "${query}"`,
        available: false,
        suggestion: `Consider creating a skill for "${query}" or searching the web for a plugin that provides it.`,
      });
    }

    return routes;
  }
}
