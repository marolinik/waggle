import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { buildLocalServer } from '../src/local/index.js';
import type { FastifyInstance } from 'fastify';

describe('Workspace & Session API', () => {
  let server: FastifyInstance;
  let dataDir: string;
  let workspaceId: string;

  beforeAll(async () => {
    // Create isolated temp dir for tests
    dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'waggle-ws-api-'));

    // Write a minimal config.json so WaggleConfig doesn't error
    fs.writeFileSync(
      path.join(dataDir, 'config.json'),
      JSON.stringify({ defaultModel: 'test/model', providers: {} }),
      'utf-8'
    );

    // Create personal.mind as empty file (MindDB will init schema)
    // Don't create it — let MultiMind handle it
    server = await buildLocalServer({ dataDir, port: 0 });
  });

  afterAll(async () => {
    await server.close();
    // Clean up temp dir
    fs.rmSync(dataDir, { recursive: true, force: true });
  });

  // First, create a workspace to use for session tests
  it('creates a workspace for session tests', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/api/workspaces',
      payload: { name: 'Session Test WS', group: 'Test' },
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.id).toBeTruthy();
    workspaceId = body.id;
  });

  // --- Session Tests ---

  it('lists sessions (empty initially)', async () => {
    const res = await server.inject({
      method: 'GET',
      url: `/api/workspaces/${workspaceId}/sessions`,
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(0);
  });

  let sessionId: string;

  it('creates a session', async () => {
    const res = await server.inject({
      method: 'POST',
      url: `/api/workspaces/${workspaceId}/sessions`,
      payload: { title: 'My First Chat' },
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.id).toMatch(/^session-/);
    expect(body.title).toBe('My First Chat');
    expect(body.messageCount).toBe(0);
    expect(body.lastActive).toBeTruthy();
    expect(body.created).toBeTruthy();
    sessionId = body.id;
  });

  it('creates a session without title (uses id as title)', async () => {
    const res = await server.inject({
      method: 'POST',
      url: `/api/workspaces/${workspaceId}/sessions`,
      payload: {},
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.title).toMatch(/^session-/);
  });

  it('lists sessions (shows created sessions)', async () => {
    const res = await server.inject({
      method: 'GET',
      url: `/api/workspaces/${workspaceId}/sessions`,
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.length).toBe(2);
    // Should find our named session
    const named = body.find((s: { title: string }) => s.title === 'My First Chat');
    expect(named).toBeTruthy();
    expect(named.messageCount).toBe(0);
  });

  it('reads session metadata including message count', async () => {
    // Append messages to the session JSONL file (meta line already exists from creation)
    const sessionPath = path.join(
      dataDir, 'workspaces', workspaceId, 'sessions', `${sessionId}.jsonl`
    );
    // Read existing meta line
    const existing = fs.readFileSync(sessionPath, 'utf-8');
    const messages = [
      JSON.stringify({ role: 'user', content: 'Hello there', timestamp: new Date().toISOString() }),
      JSON.stringify({ role: 'assistant', content: 'Hi! How can I help?', timestamp: new Date().toISOString() }),
    ];
    fs.writeFileSync(sessionPath, existing + messages.join('\n') + '\n', 'utf-8');

    const res = await server.inject({
      method: 'GET',
      url: `/api/workspaces/${workspaceId}/sessions`,
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    const session = body.find((s: { id: string }) => s.id === sessionId);
    expect(session).toBeTruthy();
    expect(session.messageCount).toBe(2);
    // Title should come from meta line (set during creation)
    expect(session.title).toBe('My First Chat');
  });

  it('deletes a session', async () => {
    const res = await server.inject({
      method: 'DELETE',
      url: `/api/sessions/${sessionId}?workspace=${workspaceId}`,
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.deleted).toBe(true);

    // Verify it's gone
    const listRes = await server.inject({
      method: 'GET',
      url: `/api/workspaces/${workspaceId}/sessions`,
    });
    const sessions = JSON.parse(listRes.body);
    const deleted = sessions.find((s: { id: string }) => s.id === sessionId);
    expect(deleted).toBeUndefined();
  });

  it('returns 404 when deleting non-existent session', async () => {
    const res = await server.inject({
      method: 'DELETE',
      url: `/api/sessions/nonexistent-session?workspace=${workspaceId}`,
    });
    expect(res.statusCode).toBe(404);
  });

  it('returns 404 for sessions of non-existent workspace', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/api/workspaces/nonexistent-ws/sessions',
    });
    expect(res.statusCode).toBe(404);
  });

  // --- Knowledge Graph Tests ---

  it('returns knowledge graph (empty for fresh mind)', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/api/memory/graph',
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('entities');
    expect(body).toHaveProperty('relations');
    expect(Array.isArray(body.entities)).toBe(true);
    expect(Array.isArray(body.relations)).toBe(true);
  });

  it('returns knowledge graph for workspace mind', async () => {
    const res = await server.inject({
      method: 'GET',
      url: `/api/memory/graph?workspace=${workspaceId}`,
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('entities');
    expect(body).toHaveProperty('relations');
  });

  it('returns 404 for knowledge graph of non-existent workspace', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/api/memory/graph?workspace=nonexistent',
    });
    expect(res.statusCode).toBe(404);
  });

  // --- API Key Test Endpoint ---

  it('validates OpenAI key format (valid)', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/api/settings/test-key',
      payload: { provider: 'openai', apiKey: 'sk-1234567890abcdefghij' },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.valid).toBe(true);
  });

  it('validates OpenAI key format (invalid prefix)', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/api/settings/test-key',
      payload: { provider: 'openai', apiKey: 'bad-key-1234567890' },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.valid).toBe(false);
    expect(body.error).toMatch(/sk-/);
  });

  it('validates Anthropic key format (valid)', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/api/settings/test-key',
      payload: { provider: 'anthropic', apiKey: 'sk-ant-1234567890abcdefg' },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.valid).toBe(true);
  });

  it('validates Anthropic key format (invalid)', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/api/settings/test-key',
      payload: { provider: 'anthropic', apiKey: 'sk-1234567890abcdefg' },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.valid).toBe(false);
    expect(body.error).toMatch(/sk-ant-/);
  });

  it('rejects test-key request without provider or apiKey', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/api/settings/test-key',
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });

  it('validates unknown provider key (just length check)', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/api/settings/test-key',
      payload: { provider: 'some-provider', apiKey: 'abcdefghij' },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.valid).toBe(true);
  });
});
