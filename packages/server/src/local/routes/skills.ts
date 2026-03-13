import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import type { FastifyPluginAsync } from 'fastify';
import { PluginManager, getStarterSkillsDir, listStarterSkills } from '@waggle/sdk';
import { loadSkills, SkillRecommender } from '@waggle/agent';

/** Capability family definitions — user-job-first grouping */
const SKILL_FAMILIES: Record<string, { family: string; label: string }> = {
  'draft-memo':          { family: 'writing', label: 'Writing & Docs' },
  'compare-docs':        { family: 'writing', label: 'Writing & Docs' },
  'extract-actions':     { family: 'writing', label: 'Writing & Docs' },
  'research-synthesis':  { family: 'research', label: 'Research & Analysis' },
  'explain-concept':     { family: 'research', label: 'Research & Analysis' },
  'research-team':       { family: 'research', label: 'Research & Analysis' },
  'decision-matrix':     { family: 'decision', label: 'Decision Support' },
  'risk-assessment':     { family: 'decision', label: 'Decision Support' },
  'retrospective':       { family: 'decision', label: 'Decision Support' },
  'daily-plan':          { family: 'planning', label: 'Planning & Organization' },
  'task-breakdown':      { family: 'planning', label: 'Planning & Organization' },
  'plan-execute':        { family: 'planning', label: 'Planning & Organization' },
  'catch-up':            { family: 'communication', label: 'Communication' },
  'status-update':       { family: 'communication', label: 'Communication' },
  'meeting-prep':        { family: 'communication', label: 'Communication' },
  'code-review':         { family: 'code', label: 'Code & Engineering' },
  'review-pair':         { family: 'code', label: 'Code & Engineering' },
  'brainstorm':          { family: 'creative', label: 'Creative & Ideation' },
};

/** Multi-agent workflow skills */
const WORKFLOW_SKILLS = new Set(['research-team', 'review-pair', 'plan-execute']);

/**
 * Skills & plugins routes — manage agent extensions.
 * Skills: markdown files in ~/.waggle/skills/ that extend the system prompt.
 * Plugins: structured packages in ~/.waggle/plugins/ with manifests.
 */
export const skillRoutes: FastifyPluginAsync = async (server) => {
  const waggleHome = path.join(os.homedir(), '.waggle');
  const skillsDir = path.join(waggleHome, 'skills');
  const pluginsDir = path.join(waggleHome, 'plugins');

  // Ensure directories exist
  if (!fs.existsSync(skillsDir)) fs.mkdirSync(skillsDir, { recursive: true });
  if (!fs.existsSync(pluginsDir)) fs.mkdirSync(pluginsDir, { recursive: true });

  const pluginManager = new PluginManager(pluginsDir);

  // ── Skills ────────────────────────────────────────────────────────

  // POST /api/skills/starter-pack — install starter skills
  server.post('/api/skills/starter-pack', async () => {
    const { installStarterSkills } = await import('@waggle/sdk');
    const installed = installStarterSkills(skillsDir);

    // Reload skills into agent state
    server.agentState.skills.length = 0;
    server.agentState.skills.push(...loadSkills(waggleHome));

    return { ok: true, installed, count: installed.length };
  });

  // GET /api/skills/starter-pack/catalog — browse starter skills with state
  server.get('/api/skills/starter-pack/catalog', async () => {
    const starterDir = getStarterSkillsDir();
    const starterNames = listStarterSkills(); // returns sorted array of names without .md

    // Determine installed skill names (files in ~/.waggle/skills/)
    const installedNames = new Set<string>();
    if (fs.existsSync(skillsDir)) {
      for (const f of fs.readdirSync(skillsDir)) {
        if (f.endsWith('.md')) installedNames.add(f.replace(/\.md$/, ''));
      }
    }

    // Determine active skill names (loaded in agentState)
    const activeNames = new Set(server.agentState.skills.map(s => s.name));

    // Build skill entries
    const skills = starterNames.map(id => {
      // Parse the .md file for name and description
      const filePath = path.join(starterDir, `${id}.md`);
      let name = id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      let description = '';

      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        // First # heading = name
        const titleLine = lines.find(l => l.startsWith('# '));
        if (titleLine) {
          name = titleLine.replace(/^#\s+/, '').replace(/\s*—.*$/, '').trim();
        }

        // First non-empty, non-heading paragraph = description
        let foundTitle = false;
        for (const line of lines) {
          if (line.startsWith('# ')) { foundTitle = true; continue; }
          if (!foundTitle) continue;
          const trimmed = line.trim();
          if (trimmed === '' || trimmed.startsWith('#') || trimmed.startsWith('---')) continue;
          description = trimmed;
          break;
        }
      } catch { /* use defaults */ }

      // Determine state
      let state: 'active' | 'installed' | 'available' = 'available';
      if (activeNames.has(id)) {
        state = 'active';
      } else if (installedNames.has(id)) {
        state = 'installed';
      }

      const familyInfo = SKILL_FAMILIES[id] ?? { family: 'other', label: 'Other' };

      return {
        id,
        name,
        description,
        family: familyInfo.family,
        familyLabel: familyInfo.label,
        state,
        isWorkflow: WORKFLOW_SKILLS.has(id),
      };
    });

    // Extract unique families (ordered)
    const familyOrder = ['writing', 'research', 'decision', 'planning', 'communication', 'code', 'creative'];
    const seenFamilies = new Set<string>();
    const families = familyOrder
      .filter(fid => {
        const hasSkills = skills.some(s => s.family === fid);
        if (hasSkills && !seenFamilies.has(fid)) {
          seenFamilies.add(fid);
          return true;
        }
        return false;
      })
      .map(fid => {
        const skill = skills.find(s => s.family === fid)!;
        return { id: fid, label: skill.familyLabel };
      });

    return { skills, families };
  });

  // POST /api/skills/starter-pack/:id — install a single starter skill
  server.post<{
    Params: { id: string };
  }>('/api/skills/starter-pack/:id', async (request, reply) => {
    const { id } = request.params;

    // Prevent path traversal
    if (id.includes('..') || id.includes('/') || id.includes('\\')) {
      return reply.status(400).send({ error: 'Invalid skill ID' });
    }

    // Verify skill exists in starter pack
    const starterDir = getStarterSkillsDir();
    const sourcePath = path.join(starterDir, `${id}.md`);
    if (!fs.existsSync(sourcePath)) {
      return reply.status(404).send({ error: `Starter skill "${id}" not found` });
    }

    // Check if already installed
    const targetPath = path.join(skillsDir, `${id}.md`);
    if (fs.existsSync(targetPath)) {
      return reply.status(409).send({ error: `Skill "${id}" is already installed` });
    }

    // Copy skill file
    fs.copyFileSync(sourcePath, targetPath);

    // Reload skills into agent state
    server.agentState.skills.length = 0;
    server.agentState.skills.push(...loadSkills(waggleHome));

    // Determine new state (should be active after reload)
    const isActive = server.agentState.skills.some(s => s.name === id);

    return {
      ok: true,
      skill: {
        id,
        name: id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        state: isActive ? 'active' : 'installed',
      },
    };
  });

  // GET /api/skills — list all installed skills
  server.get('/api/skills', async () => {
    const skills = loadSkills(waggleHome);
    return {
      skills: skills.map(s => ({
        name: s.name,
        length: s.content.length,
        preview: s.content.slice(0, 200),
      })),
      count: skills.length,
      directory: skillsDir,
    };
  });

  // GET /api/skills/suggestions — contextual skill recommendations
  server.get<{
    Querystring: { context: string; topN?: string };
  }>('/api/skills/suggestions', async (request, reply) => {
    const { context, topN } = request.query;
    if (!context) {
      return reply.status(400).send({ error: 'context query parameter is required' });
    }

    const skills = loadSkills(waggleHome);
    const recommender = new SkillRecommender({
      getSkills: () => skills,
    });

    const suggestions = recommender.recommend(context, topN ? parseInt(topN, 10) : 3);
    return { suggestions, count: suggestions.length };
  });

  // GET /api/skills/:name — get full skill content
  server.get<{
    Params: { name: string };
  }>('/api/skills/:name', async (request, reply) => {
    const { name } = request.params;
    // Prevent path traversal
    if (name.includes('..') || name.includes('/') || name.includes('\\')) {
      return reply.status(400).send({ error: 'Invalid skill name' });
    }
    const filePath = path.join(skillsDir, `${name}.md`);
    if (!fs.existsSync(filePath)) {
      return reply.status(404).send({ error: 'Skill not found' });
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return { name, content };
  });

  // POST /api/skills — create a new skill
  server.post<{
    Body: { name: string; content: string };
  }>('/api/skills', async (request, reply) => {
    const { name, content } = request.body ?? {};
    if (!name || !content) {
      return reply.status(400).send({ error: 'name and content are required' });
    }
    // Prevent path traversal
    if (name.includes('..') || name.includes('/') || name.includes('\\') || name.includes(' ')) {
      return reply.status(400).send({ error: 'Invalid skill name (no spaces, slashes, or dots)' });
    }
    const filePath = path.join(skillsDir, `${name}.md`);
    fs.writeFileSync(filePath, content, 'utf-8');

    // Reload skills into agent state
    server.agentState.skills.length = 0;
    server.agentState.skills.push(...loadSkills(waggleHome));

    return { ok: true, name, path: filePath };
  });

  // PUT /api/skills/:name — update an existing skill
  server.put<{
    Params: { name: string };
    Body: { content: string };
  }>('/api/skills/:name', async (request, reply) => {
    const { name } = request.params;
    const { content } = request.body ?? {};
    if (name.includes('..') || name.includes('/') || name.includes('\\')) {
      return reply.status(400).send({ error: 'Invalid skill name' });
    }
    if (!content) {
      return reply.status(400).send({ error: 'content is required' });
    }
    const filePath = path.join(skillsDir, `${name}.md`);
    if (!fs.existsSync(filePath)) {
      return reply.status(404).send({ error: 'Skill not found' });
    }
    fs.writeFileSync(filePath, content, 'utf-8');

    // Reload skills into agent state
    server.agentState.skills.length = 0;
    server.agentState.skills.push(...loadSkills(waggleHome));

    return { ok: true, name };
  });

  // DELETE /api/skills/:name — remove a skill
  server.delete<{
    Params: { name: string };
  }>('/api/skills/:name', async (request, reply) => {
    const { name } = request.params;
    if (name.includes('..') || name.includes('/') || name.includes('\\')) {
      return reply.status(400).send({ error: 'Invalid skill name' });
    }
    const filePath = path.join(skillsDir, `${name}.md`);
    if (!fs.existsSync(filePath)) {
      return reply.status(404).send({ error: 'Skill not found' });
    }
    fs.unlinkSync(filePath);

    // Reload skills into agent state
    server.agentState.skills.length = 0;
    server.agentState.skills.push(...loadSkills(waggleHome));

    return { ok: true, name };
  });

  // ── Plugins ───────────────────────────────────────────────────────

  // GET /api/plugins — list all installed plugins
  server.get('/api/plugins', async () => {
    const plugins = pluginManager.list();
    return {
      plugins,
      count: plugins.length,
      directory: pluginsDir,
    };
  });

  // POST /api/plugins/install — install a plugin from a local directory
  server.post<{
    Body: { sourceDir: string };
  }>('/api/plugins/install', async (request, reply) => {
    const { sourceDir } = request.body ?? {};
    if (!sourceDir) {
      return reply.status(400).send({ error: 'sourceDir is required' });
    }
    try {
      pluginManager.installLocal(sourceDir);
      return { ok: true, source: sourceDir };
    } catch (err) {
      return reply.status(400).send({
        error: err instanceof Error ? err.message : 'Install failed',
      });
    }
  });

  // DELETE /api/plugins/:name — uninstall a plugin
  server.delete<{
    Params: { name: string };
  }>('/api/plugins/:name', async (request, reply) => {
    const { name } = request.params;
    if (name.includes('..') || name.includes('/') || name.includes('\\')) {
      return reply.status(400).send({ error: 'Invalid plugin name' });
    }
    try {
      pluginManager.uninstall(name);
      return { ok: true, name };
    } catch (err) {
      return reply.status(400).send({
        error: err instanceof Error ? err.message : 'Uninstall failed',
      });
    }
  });
};
