import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import type { FastifyPluginAsync } from 'fastify';
import { PluginManager } from '@waggle/sdk';
import { loadSkills, SkillRecommender } from '@waggle/agent';

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
