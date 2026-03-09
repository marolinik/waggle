import type { FastifyPluginAsync } from 'fastify';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export interface SessionInfo {
  id: string;
  title: string;
  messageCount: number;
  lastActive: string;
  created: string;
}

/**
 * Read session metadata from a JSONL file.
 * Each line is a JSON message: {"role":"user","content":"...","timestamp":"..."}
 */
function readSessionMeta(filePath: string, sessionId: string): SessionInfo {
  const content = fs.readFileSync(filePath, 'utf-8').trim();
  const lines = content ? content.split('\n').filter(l => l.trim()) : [];
  const stat = fs.statSync(filePath);

  let title = sessionId;
  let messageLines = lines;

  // Check for metadata line (first line with type: "meta")
  if (lines.length > 0) {
    try {
      const first = JSON.parse(lines[0]);
      if (first.type === 'meta') {
        if (first.title) {
          title = first.title;
        }
        // Exclude meta line from message count
        messageLines = lines.slice(1);
      }
    } catch {
      // Not JSON — treat all lines as messages
    }
  }

  // If no meta title, derive from first message content
  if (title === sessionId && messageLines.length > 0) {
    try {
      const firstMsg = JSON.parse(messageLines[0]);
      if (firstMsg.content) {
        title = firstMsg.content.length > 50
          ? firstMsg.content.slice(0, 50) + '...'
          : firstMsg.content;
      }
    } catch {
      // Keep default title
    }
  }

  return {
    id: sessionId,
    title,
    messageCount: messageLines.length,
    lastActive: stat.mtime.toISOString(),
    created: stat.birthtime.toISOString(),
  };
}

export const sessionRoutes: FastifyPluginAsync = async (server) => {
  // GET /api/workspaces/:workspaceId/sessions — list sessions for a workspace
  server.get<{
    Params: { workspaceId: string };
  }>('/api/workspaces/:workspaceId/sessions', async (request, reply) => {
    const { workspaceId } = request.params;

    // Verify workspace exists
    const ws = server.workspaceManager.get(workspaceId);
    if (!ws) {
      return reply.status(404).send({ error: 'Workspace not found' });
    }

    const sessionsDir = path.join(
      server.localConfig.dataDir, 'workspaces', workspaceId, 'sessions'
    );

    if (!fs.existsSync(sessionsDir)) {
      return [];
    }

    const files = fs.readdirSync(sessionsDir).filter(f => f.endsWith('.jsonl'));
    const sessions: SessionInfo[] = [];

    for (const file of files) {
      const sessionId = file.replace('.jsonl', '');
      const filePath = path.join(sessionsDir, file);
      try {
        sessions.push(readSessionMeta(filePath, sessionId));
      } catch {
        // Skip unreadable files
      }
    }

    // Sort by lastActive descending
    sessions.sort((a, b) => b.lastActive.localeCompare(a.lastActive));

    return sessions;
  });

  // POST /api/workspaces/:workspaceId/sessions — create a new session
  server.post<{
    Params: { workspaceId: string };
    Body: { title?: string };
  }>('/api/workspaces/:workspaceId/sessions', async (request, reply) => {
    const { workspaceId } = request.params;

    // Verify workspace exists
    const ws = server.workspaceManager.get(workspaceId);
    if (!ws) {
      return reply.status(404).send({ error: 'Workspace not found' });
    }

    const sessionsDir = path.join(
      server.localConfig.dataDir, 'workspaces', workspaceId, 'sessions'
    );

    if (!fs.existsSync(sessionsDir)) {
      fs.mkdirSync(sessionsDir, { recursive: true });
    }

    const sessionId = `session-${randomUUID()}`;
    const filePath = path.join(sessionsDir, `${sessionId}.jsonl`);

    // Write metadata line as first entry (type: "meta" distinguishes from messages)
    const meta = JSON.stringify({ type: 'meta', title: request.body?.title ?? null, created: new Date().toISOString() });
    fs.writeFileSync(filePath, meta + '\n', 'utf-8');

    const now = new Date().toISOString();
    const title = request.body?.title ?? sessionId;

    const session: SessionInfo = {
      id: sessionId,
      title,
      messageCount: 0,
      lastActive: now,
      created: now,
    };

    return reply.status(201).send(session);
  });

  // PATCH /api/sessions/:sessionId — rename/update a session
  server.patch<{
    Params: { sessionId: string };
    Body: { title?: string };
    Querystring: { workspace?: string };
  }>('/api/sessions/:sessionId', async (request, reply) => {
    const { sessionId } = request.params;
    const workspaceId = request.query.workspace;
    const newTitle = request.body?.title;

    if (!newTitle) {
      return reply.status(400).send({ error: 'title is required' });
    }

    // Find session file
    let filePath: string | null = null;

    if (workspaceId) {
      const candidate = path.join(
        server.localConfig.dataDir, 'workspaces', workspaceId, 'sessions', `${sessionId}.jsonl`
      );
      if (fs.existsSync(candidate)) filePath = candidate;
    } else {
      const workspacesDir = path.join(server.localConfig.dataDir, 'workspaces');
      if (fs.existsSync(workspacesDir)) {
        const entries = fs.readdirSync(workspacesDir, { withFileTypes: true });
        for (const entry of entries) {
          if (!entry.isDirectory()) continue;
          const candidate = path.join(workspacesDir, entry.name, 'sessions', `${sessionId}.jsonl`);
          if (fs.existsSync(candidate)) {
            filePath = candidate;
            break;
          }
        }
      }
    }

    if (!filePath) {
      return reply.status(404).send({ error: 'Session not found' });
    }

    // Read existing content, update meta line
    const content = fs.readFileSync(filePath, 'utf-8').trim();
    const lines = content ? content.split('\n') : [];

    if (lines.length > 0) {
      try {
        const first = JSON.parse(lines[0]);
        if (first.type === 'meta') {
          first.title = newTitle;
          lines[0] = JSON.stringify(first);
        } else {
          // No meta line — prepend one
          lines.unshift(JSON.stringify({ type: 'meta', title: newTitle, created: new Date().toISOString() }));
        }
      } catch {
        lines.unshift(JSON.stringify({ type: 'meta', title: newTitle, created: new Date().toISOString() }));
      }
    } else {
      lines.push(JSON.stringify({ type: 'meta', title: newTitle, created: new Date().toISOString() }));
    }

    fs.writeFileSync(filePath, lines.join('\n') + '\n', 'utf-8');

    return { id: sessionId, title: newTitle };
  });

  // DELETE /api/sessions/:sessionId — delete a session
  // Need to find the session file across workspaces
  server.delete<{
    Params: { sessionId: string };
    Querystring: { workspace?: string };
  }>('/api/sessions/:sessionId', async (request, reply) => {
    const { sessionId } = request.params;
    const workspaceId = request.query.workspace;

    // If workspace is provided, look there directly
    if (workspaceId) {
      const filePath = path.join(
        server.localConfig.dataDir, 'workspaces', workspaceId, 'sessions', `${sessionId}.jsonl`
      );

      if (!fs.existsSync(filePath)) {
        return reply.status(404).send({ error: 'Session not found' });
      }

      fs.unlinkSync(filePath);
      return { deleted: true };
    }

    // Without workspace, search all workspaces for the session file
    const workspacesDir = path.join(server.localConfig.dataDir, 'workspaces');
    if (!fs.existsSync(workspacesDir)) {
      return reply.status(404).send({ error: 'Session not found' });
    }

    const entries = fs.readdirSync(workspacesDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const filePath = path.join(workspacesDir, entry.name, 'sessions', `${sessionId}.jsonl`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return { deleted: true };
      }
    }

    return reply.status(404).send({ error: 'Session not found' });
  });
};
