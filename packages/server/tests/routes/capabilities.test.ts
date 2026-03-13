import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { MindDB, SessionStore, FrameStore } from '@waggle/core';
import { buildLocalServer } from '../../src/local/index.js';
import type { FastifyInstance } from 'fastify';

describe('Capabilities Route', () => {
  let server: FastifyInstance;
  let tmpDir: string;

  beforeAll(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'waggle-caps-test-'));

    // Create personal.mind (required by buildLocalServer)
    const personalPath = path.join(tmpDir, 'personal.mind');
    const mind = new MindDB(personalPath);
    const sessions = new SessionStore(mind);
    const frames = new FrameStore(mind);
    const s1 = sessions.create('test');
    frames.createIFrame(s1.gop_id, 'Test content', 'normal');
    mind.close();

    server = await buildLocalServer({ dataDir: tmpDir });
  });

  afterAll(async () => {
    await server.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('GET /api/capabilities/status returns 200', async () => {
    const res = await server.inject({ method: 'GET', url: '/api/capabilities/status' });
    expect(res.statusCode).toBe(200);
  });

  it('returns correct structure with empty arrays when no plugins/MCP/commands', async () => {
    const res = await server.inject({ method: 'GET', url: '/api/capabilities/status' });
    const body = JSON.parse(res.body);

    expect(body).toHaveProperty('plugins');
    expect(body).toHaveProperty('mcpServers');
    expect(body).toHaveProperty('skills');
    expect(body).toHaveProperty('tools');
    expect(body).toHaveProperty('commands');

    expect(Array.isArray(body.plugins)).toBe(true);
    expect(Array.isArray(body.mcpServers)).toBe(true);
    expect(Array.isArray(body.skills)).toBe(true);
    expect(Array.isArray(body.commands)).toBe(true);
    expect(body.plugins).toEqual([]);
    expect(body.mcpServers).toEqual([]);
    expect(body.commands).toEqual([]);
  });

  it('tools summary has count, native, plugin, mcp fields', async () => {
    const res = await server.inject({ method: 'GET', url: '/api/capabilities/status' });
    const body = JSON.parse(res.body);

    expect(body.tools).toHaveProperty('count');
    expect(body.tools).toHaveProperty('native');
    expect(body.tools).toHaveProperty('plugin');
    expect(body.tools).toHaveProperty('mcp');
    expect(typeof body.tools.count).toBe('number');
    expect(typeof body.tools.native).toBe('number');
    expect(body.tools.plugin).toBe(0);
    expect(body.tools.mcp).toBe(0);
  });

  it('native tool count equals total when no plugins or MCP', async () => {
    const res = await server.inject({ method: 'GET', url: '/api/capabilities/status' });
    const body = JSON.parse(res.body);

    expect(body.tools.native).toBe(body.tools.count);
    expect(body.tools.count).toBeGreaterThan(0); // at least some native tools exist
  });

  it('returns plugin data when pluginRuntimeManager is present', async () => {
    // Mock a pluginRuntimeManager on agentState
    const mockManager = {
      getPluginStates: () => ({ 'test-plugin': 'active', 'other-plugin': 'disabled' }),
      getAllTools: () => [
        { name: 'test-plugin:tool1' },
        { name: 'test-plugin:tool2' },
      ],
      getAllSkills: () => ['test-plugin:summarize'],
    };

    (server.agentState as Record<string, unknown>).pluginRuntimeManager = mockManager;

    const res = await server.inject({ method: 'GET', url: '/api/capabilities/status' });
    const body = JSON.parse(res.body);

    expect(body.plugins).toHaveLength(2);
    expect(body.plugins[0].name).toBe('test-plugin');
    expect(body.plugins[0].state).toBe('active');
    expect(body.plugins[0].tools).toBe(2);
    expect(body.plugins[0].skills).toBe(1);

    expect(body.plugins[1].name).toBe('other-plugin');
    expect(body.plugins[1].state).toBe('disabled');
    expect(body.plugins[1].tools).toBe(0);

    expect(body.tools.plugin).toBe(2);

    // Cleanup
    (server.agentState as Record<string, unknown>).pluginRuntimeManager = null;
  });

  it('returns MCP data when mcpRuntime is present', async () => {
    const mockMcp = {
      getServerStates: () => ({ 'fs-server': 'ready', 'db-server': 'error' }),
      getAllTools: () => [
        { name: 'fs-server:readFile' },
        { name: 'fs-server:writeFile' },
        { name: 'db-server:query' },
      ],
      getHealthy: () => [{ config: { name: 'fs-server' } }],
    };

    (server.agentState as Record<string, unknown>).mcpRuntime = mockMcp;

    const res = await server.inject({ method: 'GET', url: '/api/capabilities/status' });
    const body = JSON.parse(res.body);

    expect(body.mcpServers).toHaveLength(2);

    const fsServer = body.mcpServers.find((s: { name: string }) => s.name === 'fs-server');
    expect(fsServer).toBeDefined();
    expect(fsServer.state).toBe('ready');
    expect(fsServer.healthy).toBe(true);
    expect(fsServer.tools).toBe(2);

    const dbServer = body.mcpServers.find((s: { name: string }) => s.name === 'db-server');
    expect(dbServer).toBeDefined();
    expect(dbServer.state).toBe('error');
    expect(dbServer.healthy).toBe(false);
    expect(dbServer.tools).toBe(1);

    expect(body.tools.mcp).toBe(3);

    // Cleanup
    (server.agentState as Record<string, unknown>).mcpRuntime = null;
  });

  it('returns command data when commandRegistry is present', async () => {
    const mockRegistry = {
      list: () => [
        { name: 'help', description: 'Show help', usage: '/help', aliases: [], handler: async () => '' },
        { name: 'model', description: 'Switch model', usage: '/model <name>', aliases: ['m'], handler: async () => '' },
      ],
    };

    (server.agentState as Record<string, unknown>).commandRegistry = mockRegistry;

    const res = await server.inject({ method: 'GET', url: '/api/capabilities/status' });
    const body = JSON.parse(res.body);

    expect(body.commands).toHaveLength(2);
    expect(body.commands[0]).toEqual({ name: 'help', description: 'Show help', usage: '/help' });
    expect(body.commands[1]).toEqual({ name: 'model', description: 'Switch model', usage: '/model <name>' });

    // Cleanup
    (server.agentState as Record<string, unknown>).commandRegistry = null;
  });

  it('tool count breakdown is correct with both plugins and MCP', async () => {
    const mockManager = {
      getPluginStates: () => ({ 'p1': 'active' }),
      getAllTools: () => [{ name: 'p1:t1' }, { name: 'p1:t2' }, { name: 'p1:t3' }],
      getAllSkills: () => [],
    };

    const mockMcp = {
      getServerStates: () => ({ 's1': 'ready' }),
      getAllTools: () => [{ name: 's1:read' }, { name: 's1:write' }],
      getHealthy: () => [{ config: { name: 's1' } }],
    };

    (server.agentState as Record<string, unknown>).pluginRuntimeManager = mockManager;
    (server.agentState as Record<string, unknown>).mcpRuntime = mockMcp;

    const res = await server.inject({ method: 'GET', url: '/api/capabilities/status' });
    const body = JSON.parse(res.body);

    const totalNative = server.agentState.allTools.length;
    const nativeCount = totalNative - 3 - 2;
    expect(body.tools.native).toBe(nativeCount);
    expect(body.tools.plugin).toBe(3);
    expect(body.tools.mcp).toBe(2);
    expect(body.tools.count).toBe(nativeCount + 3 + 2);

    // Cleanup
    (server.agentState as Record<string, unknown>).pluginRuntimeManager = null;
    (server.agentState as Record<string, unknown>).mcpRuntime = null;
  });
});
