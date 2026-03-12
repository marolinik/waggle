import fs from 'node:fs';
import path from 'node:path';
import type { FastifyPluginAsync } from 'fastify';
import { MindDB } from '@waggle/core';
import { assertSafeSegment } from './validate.js';
import { extractProgressItems, type ProgressItem } from './sessions.js';
import { readFileRegistry, type FileRegistryEntry } from './ingest.js';

/**
 * A6: Compose a structured workspace summary — the "return reward moment."
 * Produces a narrative summary with: what this workspace is about, recent state, key decisions.
 */
function composeWorkspaceSummary(
  frames: Array<{ content: string; importance: string; created_at: string }>,
  memoryCount: number,
  decisions: Array<{ content: string; created_at: string }>,
  sessionCount: number,
): string {
  const parts: string[] = [];

  // ── What this workspace is about (from important/critical frames) ──
  const important = frames.filter(f => f.importance === 'critical' || f.importance === 'important');
  const workContextFrames = frames.filter(f =>
    f.content.toLowerCase().includes('project') ||
    f.content.toLowerCase().includes('workspace') ||
    f.content.toLowerCase().includes('working on'),
  );

  // Find the best "about" frame
  const aboutFrame = important[0] ?? workContextFrames[0] ?? frames[0];
  const aboutLine = aboutFrame.content.split('\n')[0].replace(/\.\s*$/, '').trim();
  const aboutText = aboutLine.length > 140 ? aboutLine.slice(0, 137) + '...' : aboutLine;
  if (aboutText.length > 10) {
    parts.push(aboutText + '.');
  }

  // ── Current state (activity level + recency) ──
  const mostRecent = frames[0]?.created_at?.slice(0, 10) ?? '';
  const now = new Date();
  const lastDate = mostRecent ? new Date(mostRecent) : null;
  const daysSince = lastDate ? Math.floor((now.getTime() - lastDate.getTime()) / (86400 * 1000)) : 0;

  if (daysSince === 0) {
    parts.push(`Active today with ${memoryCount} memories across ${sessionCount} session${sessionCount !== 1 ? 's' : ''}.`);
  } else if (daysSince === 1) {
    parts.push(`Last active yesterday. ${memoryCount} memories across ${sessionCount} session${sessionCount !== 1 ? 's' : ''}.`);
  } else if (daysSince <= 7) {
    parts.push(`Last active ${daysSince} days ago. ${memoryCount} memories across ${sessionCount} session${sessionCount !== 1 ? 's' : ''}.`);
  } else {
    parts.push(`Last active ${mostRecent}. ${memoryCount} memories across ${sessionCount} session${sessionCount !== 1 ? 's' : ''}.`);
  }

  // D1: Decisions and topics are rendered separately by the UI (ChatArea recentDecisions list),
  // so we omit them from the narrative summary to avoid duplication.

  return parts.join(' ');
}

export const workspaceRoutes: FastifyPluginAsync = async (server) => {
  // GET /api/workspaces — list all workspaces
  server.get('/api/workspaces', async () => {
    return server.workspaceManager.list();
  });

  // POST /api/workspaces — create workspace
  server.post<{
    Body: { name: string; group: string; icon?: string; model?: string; directory?: string };
  }>('/api/workspaces', async (request, reply) => {
    const { name, group, icon, model, directory } = request.body;
    if (!name || !group) {
      return reply.status(400).send({ error: 'name and group are required' });
    }
    const ws = server.workspaceManager.create({ name, group, icon, model, directory });
    return reply.status(201).send(ws);
  });

  // GET /api/workspaces/:id — get workspace by id
  server.get<{ Params: { id: string } }>('/api/workspaces/:id', async (request, reply) => {
    assertSafeSegment(request.params.id, 'id');
    const ws = server.workspaceManager.get(request.params.id);
    if (!ws) {
      return reply.status(404).send({ error: 'Workspace not found' });
    }
    return ws;
  });

  // GET /api/workspaces/:id/context — workspace catch-up context
  // Returns summary, recent threads, suggested prompts, and stats.
  // Used by the frontend to show the "Workspace Now" block on workspace open.
  server.get<{ Params: { id: string } }>('/api/workspaces/:id/context', async (request, reply) => {
    const { id } = request.params;
    assertSafeSegment(id, 'id');

    const ws = server.workspaceManager.get(id);
    if (!ws) {
      return reply.status(404).send({ error: 'Workspace not found' });
    }

    // ── Gather workspace memory context ──────────────────────
    let summary = '';
    let memoryCount = 0;
    let recentMemories: Array<{ content: string; importance: string; date: string }> = [];
    let recentDecisions: Array<{ content: string; date: string }> = [];

    const mindPath = server.workspaceManager.getMindPath(id);
    if (fs.existsSync(mindPath)) {
      try {
        // Activate workspace mind to access its data
        server.agentState.activateWorkspaceMind(id);

        // Read workspace memory stats and recent frames
        const wsDb = new MindDB(mindPath);
        const raw = wsDb.getDatabase();

        memoryCount = (raw.prepare('SELECT COUNT(*) as cnt FROM memory_frames').get() as { cnt: number }).cnt;

        // Get recent important memories for the summary
        // D2: Order by importance first (matching A3 preloaded-context fix), then recency
        const frames = raw.prepare(
          `SELECT content, importance, created_at FROM memory_frames
           WHERE importance != 'deprecated' AND importance != 'temporary'
           ORDER BY CASE importance
             WHEN 'critical' THEN 1 WHEN 'important' THEN 2
             WHEN 'normal' THEN 3 ELSE 4 END,
           id DESC LIMIT 8`
        ).all() as Array<{ content: string; importance: string; created_at: string }>;

        recentMemories = frames.map(f => ({
          content: f.content.slice(0, 200),
          importance: f.importance,
          date: f.created_at?.slice(0, 10) ?? 'unknown',
        }));

        // Extract decision-like memories (moved before summary so we can pass them)
        const decisionFrames = raw.prepare(
          `SELECT content, created_at FROM memory_frames
           WHERE importance != 'deprecated' AND importance != 'temporary'
             AND (content LIKE 'Decision%' OR content LIKE '%decided%'
               OR content LIKE '%decision made%' OR content LIKE '%chose %'
               OR content LIKE '%selected %' OR content LIKE '%agreed %'
               OR importance = 'critical')
           ORDER BY id DESC LIMIT 5`
        ).all() as Array<{ content: string; created_at: string }>;

        recentDecisions = decisionFrames.map(f => {
          const firstLine = f.content.split('\n')[0];
          const sentenceMatch = firstLine.match(/^(.+?\.\s)(?=[A-Z])/);
          const text = sentenceMatch
            ? sentenceMatch[1].trim()
            : (firstLine.length > 150 ? firstLine.slice(0, 147) + '...' : firstLine);
          return {
            content: text.replace(/\.\s*$/, ''),
            date: f.created_at?.slice(0, 10) ?? 'unknown',
          };
        });

        // A6: Build structured summary with decisions + session count
        if (frames.length > 0) {
          // Count sessions from filesystem (we'll have accurate count later, estimate here)
          const sessDir = path.join(server.localConfig.dataDir, 'workspaces', id, 'sessions');
          const sessCount = fs.existsSync(sessDir) ? fs.readdirSync(sessDir).filter(f => f.endsWith('.jsonl')).length : 0;
          summary = composeWorkspaceSummary(frames, memoryCount, decisionFrames, sessCount);
        }

        wsDb.close();
      } catch {
        // If workspace mind can't be read, continue with empty context
      }
    }

    // ── Gather session info ──────────────────────────────────
    const sessionsDir = path.join(server.localConfig.dataDir, 'workspaces', id, 'sessions');
    let sessionCount = 0;
    const recentThreads: Array<{ id: string; title: string; lastActive: string }> = [];

    if (fs.existsSync(sessionsDir)) {
      const files = fs.readdirSync(sessionsDir).filter(f => f.endsWith('.jsonl'));
      sessionCount = files.length;

      // Get recent session titles
      const sessionMeta: Array<{ id: string; title: string; mtime: number }> = [];
      for (const file of files) {
        const sessionId = file.replace('.jsonl', '');
        const filePath = path.join(sessionsDir, file);
        try {
          const stat = fs.statSync(filePath);
          const content = fs.readFileSync(filePath, 'utf-8').trim();
          const lines = content ? content.split('\n').filter(l => l.trim()) : [];

          let title = sessionId;
          // Check meta line for title
          if (lines.length > 0) {
            try {
              const first = JSON.parse(lines[0]);
              if (first.type === 'meta' && first.title) title = first.title;
              else if (first.content) title = first.content.slice(0, 50);
            } catch { /* use default */ }
          }
          // Fallback: first user message
          if (title === sessionId && lines.length > 1) {
            try {
              const msg = JSON.parse(lines[1]);
              if (msg.content) title = msg.content.slice(0, 50);
            } catch { /* use default */ }
          }

          sessionMeta.push({ id: sessionId, title, mtime: stat.mtimeMs });
        } catch { /* skip */ }
      }

      // Sort by last modified, take top 5
      sessionMeta.sort((a, b) => b.mtime - a.mtime);
      for (const s of sessionMeta.slice(0, 5)) {
        recentThreads.push({
          id: s.id,
          title: s.title,
          lastActive: new Date(s.mtime).toISOString(),
        });
      }
    }

    // ── F2: Count registered files ─────────────────────────
    const fileRegistry = readFileRegistry(server.localConfig.dataDir, id);
    const fileCount = fileRegistry.length;

    // ── E3: Extract progress items from sessions ───────────
    let progressItems: ProgressItem[] = [];
    if (fs.existsSync(sessionsDir)) {
      try {
        progressItems = extractProgressItems(sessionsDir, 8);
      } catch { /* non-blocking */ }
    }

    // ── Build contextual suggested prompts ──────────────────
    const suggestedPrompts: string[] = [];

    if (memoryCount === 0 && sessionCount === 0) {
      // Brand new workspace — action-oriented onboarding prompts
      suggestedPrompts.push('Tell me about this project so I can remember it');
      suggestedPrompts.push('Help me think through what to work on first');
      suggestedPrompts.push('What can you do in this workspace?');
    } else {
      // Workspace with history — contextual prompts
      if (recentThreads.length > 0) {
        const topThread = recentThreads[0].title;
        const resumeLabel = topThread.length > 40 ? topThread.slice(0, 37) + '...' : topThread;
        suggestedPrompts.push(`Continue: ${resumeLabel}`);
      }
      suggestedPrompts.push('Catch me up on this workspace');
      if (recentDecisions.length > 0) {
        suggestedPrompts.push('Review recent decisions and next steps');
      } else {
        suggestedPrompts.push('What matters here now?');
      }
      const hasBlockers = progressItems.some(p => p.type === 'blocker');
      const hasOpenTasks = progressItems.some(p => p.type === 'task');
      if (hasBlockers) {
        suggestedPrompts.push('What\'s blocking us right now?');
      } else if (hasOpenTasks) {
        suggestedPrompts.push('What should I do next?');
      } else {
        suggestedPrompts.push('What should I do next?');
      }
      if (ws.directory) {
        suggestedPrompts.push('What files are in this workspace?');
      } else {
        suggestedPrompts.push('Draft an update from what we know');
      }
    }

    return {
      workspace: { id: ws.id, name: ws.name, group: ws.group, model: ws.model, directory: ws.directory },
      summary: summary || `This is your ${ws.name} workspace. Everything you discuss here stays in context — decisions, research, and progress are remembered across sessions.`,
      recentThreads,
      recentDecisions,
      suggestedPrompts,
      recentMemories,
      progressItems: progressItems.slice(0, 10),
      stats: {
        memoryCount,
        sessionCount,
        fileCount,
      },
      lastActive: recentThreads[0]?.lastActive ?? ws.created,
    };
  });

  // F2: GET /api/workspaces/:id/files — list ingested files
  server.get<{ Params: { id: string } }>('/api/workspaces/:id/files', async (request, reply) => {
    const { id } = request.params;
    assertSafeSegment(id, 'id');
    const ws = server.workspaceManager.get(id);
    if (!ws) {
      return reply.status(404).send({ error: 'Workspace not found' });
    }
    const files = readFileRegistry(server.localConfig.dataDir, id);
    // Return newest first
    files.reverse();
    return { files };
  });

  // PUT /api/workspaces/:id — update workspace
  server.put<{
    Params: { id: string };
    Body: { name?: string; group?: string; icon?: string; model?: string };
  }>('/api/workspaces/:id', async (request, reply) => {
    assertSafeSegment(request.params.id, 'id');
    const existing = server.workspaceManager.get(request.params.id);
    if (!existing) {
      return reply.status(404).send({ error: 'Workspace not found' });
    }
    server.workspaceManager.update(request.params.id, request.body);
    return server.workspaceManager.get(request.params.id);
  });

  // DELETE /api/workspaces/:id — delete workspace
  server.delete<{ Params: { id: string } }>('/api/workspaces/:id', async (request, reply) => {
    assertSafeSegment(request.params.id, 'id');
    const existing = server.workspaceManager.get(request.params.id);
    if (!existing) {
      return reply.status(404).send({ error: 'Workspace not found' });
    }
    server.workspaceManager.delete(request.params.id);
    return reply.status(204).send();
  });
};
