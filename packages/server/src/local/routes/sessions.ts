import type { FastifyPluginAsync } from 'fastify';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { assertSafeSegment } from './validate.js';

export interface SessionInfo {
  id: string;
  title: string;
  summary: string | null;
  messageCount: number;
  lastActive: string;
  created: string;
}

/**
 * Generate a heuristic summary from session messages.
 * No LLM needed — extracts topic from first user message, counts exchanges,
 * and detects decisions/actions from message content.
 */
function generateSessionSummary(messageLines: string[]): string | null {
  if (messageLines.length < 4) return null; // Too short to summarize

  const messages: Array<{ role: string; content: string }> = [];
  for (const line of messageLines.slice(0, 30)) { // Cap at 30 messages for performance
    try {
      const parsed = JSON.parse(line);
      if (parsed.role && parsed.content) {
        messages.push({ role: parsed.role, content: parsed.content });
      }
    } catch {
      // skip
    }
  }

  if (messages.length < 2) return null;

  // Find the most substantive user message (skip greetings/short messages)
  const greetingPattern = /^(hi|hello|hey|yo|sup|thanks|thank you|ok|okay|yes|no|sure|cool|great|nice|good)\b/i;
  const userMessages = messages.filter(m => m.role === 'user');

  let topic = '';

  // Try to find a substantive user message (>15 chars, not a greeting)
  const substantive = userMessages.find(m =>
    m.content.length > 15 && !greetingPattern.test(m.content.trim())
  );

  if (substantive) {
    const firstSentence = substantive.content.split(/[.!?\n]/)[0]?.trim() ?? '';
    topic = firstSentence.length > 80 ? firstSentence.slice(0, 77) + '...' : firstSentence;
  } else if (userMessages.length > 0) {
    // Fall back to first user message
    const firstSentence = userMessages[0].content.split(/[.!?\n]/)[0]?.trim() ?? '';
    topic = firstSentence.length > 80 ? firstSentence.slice(0, 77) + '...' : firstSentence;
  }

  // Extract key topics from assistant responses (look for bold terms, headings)
  const assistantMsgs = messages.filter(m => m.role === 'assistant');
  const topicTerms: string[] = [];
  for (const msg of assistantMsgs.slice(0, 5)) {
    // Extract bold terms (** wrapped)
    const boldMatches = msg.content.match(/\*\*([^*]{3,30})\*\*/g);
    if (boldMatches) {
      for (const m of boldMatches.slice(0, 2)) {
        const term = m.replace(/\*\*/g, '').trim();
        if (term.length > 2 && term.length < 30 && !topicTerms.includes(term)) {
          topicTerms.push(term);
        }
      }
    }
    if (topicTerms.length >= 3) break;
  }

  // Count exchanges
  const totalMessages = messages.length;

  // Detect activity types
  const allContent = messages.map(m => m.content).join(' ');
  const activities: string[] = [];

  const decisionPatterns = [
    /\b(?:decided|decision|let'?s go with|we(?:'ll| will) use|agreed)\b/i,
    /\blet'?s (?:proceed|move forward|do that)\b/i,
  ];
  if (decisionPatterns.some(p => p.test(allContent))) activities.push('decisions');

  if (/(?:created|wrote|edited|generated)\s+(?:file|document)/i.test(allContent)) activities.push('files');
  if (/(?:searched|found|researched|looked up)/i.test(allContent)) activities.push('research');
  if (/(?:draft|wrote|composed|prepared)\b/i.test(allContent) && assistantMsgs.some(m => m.content.length > 500)) {
    activities.push('drafting');
  }

  // Build summary
  const parts: string[] = [];

  // Primary: topic or extracted terms
  if (topic && !greetingPattern.test(topic)) {
    parts.push(topic);
  } else if (topicTerms.length > 0) {
    parts.push(topicTerms.slice(0, 3).join(', '));
  } else if (topic) {
    parts.push(topic);
  }

  // Secondary: activity + count
  const meta: string[] = [];
  meta.push(`${totalMessages} messages`);
  if (activities.length > 0) meta.push(activities.join(', '));

  parts.push(meta.join(' · '));

  return parts.join(' — ') || null;
}

/**
 * Read session metadata from a JSONL file.
 * Each line is a JSON message: {"role":"user","content":"...","timestamp":"..."}
 * Lazy-generates summaries for sessions with 4+ messages.
 */
function readSessionMeta(filePath: string, sessionId: string): SessionInfo {
  const content = fs.readFileSync(filePath, 'utf-8').trim();
  const lines = content ? content.split('\n').filter(l => l.trim()) : [];
  const stat = fs.statSync(filePath);

  let title = sessionId;
  let summary: string | null = null;
  let messageLines = lines;
  let metaLine: Record<string, unknown> | null = null;

  // Check for metadata line (first line with type: "meta")
  if (lines.length > 0) {
    try {
      const first = JSON.parse(lines[0]);
      if (first.type === 'meta') {
        metaLine = first;
        if (first.title) {
          title = first.title;
        }
        if (first.summary) {
          summary = first.summary as string;
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

  // Lazy-generate summary for sessions with enough messages but no summary yet
  if (!summary && messageLines.length >= 4) {
    summary = generateSessionSummary(messageLines);
    // Persist summary back to meta line so we don't regenerate next time
    if (summary) {
      try {
        if (metaLine) {
          metaLine.summary = summary;
          const updatedLines = [JSON.stringify(metaLine), ...messageLines];
          fs.writeFileSync(filePath, updatedLines.join('\n') + '\n', 'utf-8');
        } else {
          // No meta line — prepend one with the summary
          const meta = { type: 'meta', title: title !== sessionId ? title : null, summary, created: stat.birthtime.toISOString() };
          const updatedLines = [JSON.stringify(meta), ...messageLines];
          fs.writeFileSync(filePath, updatedLines.join('\n') + '\n', 'utf-8');
        }
      } catch {
        // Non-critical — summary will be regenerated next time
      }
    }
  }

  return {
    id: sessionId,
    title,
    summary,
    messageCount: messageLines.length,
    lastActive: stat.mtime.toISOString(),
    created: stat.birthtime.toISOString(),
  };
}

export interface DistillableSession {
  id: string;
  summary: string;
  keyPoints: string[];
  date: string;
  filePath: string;
}

/**
 * Find sessions that have summaries but haven't been distilled into memory yet.
 * Extracts key points (decisions, preferences, corrections) from messages.
 * Returns sessions ready for distillation.
 */
export function findUndistilledSessions(sessionsDir: string): DistillableSession[] {
  if (!fs.existsSync(sessionsDir)) return [];

  const files = fs.readdirSync(sessionsDir).filter(f => f.endsWith('.jsonl'));
  const results: DistillableSession[] = [];

  for (const file of files) {
    const filePath = path.join(sessionsDir, file);
    const sessionId = file.replace('.jsonl', '');

    try {
      const content = fs.readFileSync(filePath, 'utf-8').trim();
      const lines = content.split('\n').filter(l => l.trim());
      if (lines.length === 0) continue;

      // Check meta line
      const meta = JSON.parse(lines[0]);
      if (meta.type !== 'meta') continue;
      if (meta.distilled) continue; // Already distilled
      if (!meta.summary) continue; // No summary yet (too short)

      // Extract key points from messages
      const messageLines = lines.slice(1);
      const keyPoints: string[] = [];
      const decisionPattern = /\b(?:decided|decision|let'?s go with|we(?:'ll| will) use|agreed|the plan is)\b/i;
      const preferencePattern = /\b(?:i prefer|i like|i want|call me|don'?t ever|from now on)\b/i;

      for (const line of messageLines.slice(0, 30)) {
        try {
          const msg = JSON.parse(line);
          if (!msg.content || !msg.role) continue;

          // Extract decisions from either role
          if (decisionPattern.test(msg.content)) {
            const sentences = msg.content.split(/[.!?\n]+/).filter((s: string) => decisionPattern.test(s));
            for (const s of sentences.slice(0, 2)) {
              const trimmed = s.trim().slice(0, 150);
              if (trimmed.length > 10) keyPoints.push(trimmed);
            }
          }

          // Extract user preferences
          if (msg.role === 'user' && preferencePattern.test(msg.content)) {
            const sentences = msg.content.split(/[.!?\n]+/).filter((s: string) => preferencePattern.test(s));
            for (const s of sentences.slice(0, 1)) {
              const trimmed = s.trim().slice(0, 150);
              if (trimmed.length > 10) keyPoints.push(trimmed);
            }
          }
        } catch {
          // skip malformed lines
        }
      }

      // Get the session date from meta or file stat
      const date = meta.created
        ? new Date(meta.created as string).toISOString().slice(0, 10)
        : fs.statSync(filePath).birthtime.toISOString().slice(0, 10);

      results.push({
        id: sessionId,
        summary: meta.summary as string,
        keyPoints: keyPoints.slice(0, 5), // Cap at 5 key points
        date,
        filePath,
      });
    } catch {
      // Skip unreadable files
    }
  }

  return results;
}

// ── E3: Progress item extraction from session content ─────────────────

export interface ProgressItem {
  content: string;
  type: 'task' | 'completed' | 'blocker';
  date: string;
  sessionId: string;
}

// Patterns are deliberately conservative — precision > recall.
const TASK_PATTERNS = [
  /\b(?:need to|should|TODO|must|have to|planning to|going to|will need to)\s+(.{10,120})/i,
  /\b(?:next step|next steps|action item|follow.?up)[:.\s]+(.{10,120})/i,
  /\b(?:let'?s|we should|we need to)\s+(.{10,120})/i,
];
const COMPLETED_PATTERNS = [
  /\b(?:completed|finished|done with|implemented|deployed|shipped|resolved|fixed|merged|closed)\s+(.{5,120})/i,
  /\b(?:we|I)\s+(?:completed|finished|shipped|deployed|fixed|resolved|merged)\s+(.{5,120})/i,
  /\b(?:that'?s done|all done|task complete|work complete)\b/i,
];
const BLOCKER_PATTERNS = [
  /\b(?:blocked by|stuck on|waiting for|depends on|can'?t proceed|can'?t continue)\s+(.{5,120})/i,
  /\b(?:blocker|blocking issue|impediment)[:.\s]+(.{5,120})/i,
  /\b(?:problem is|issue is|risk is)\s+(.{5,120})/i,
];

/**
 * Extract progress items (tasks, completions, blockers) from session JSONL files.
 * Scans recent sessions for heuristic patterns — no LLM needed.
 */
export function extractProgressItems(sessionsDir: string, maxSessions = 10): ProgressItem[] {
  if (!fs.existsSync(sessionsDir)) return [];

  const files = fs.readdirSync(sessionsDir).filter(f => f.endsWith('.jsonl'));
  // Sort by modification time descending — recent sessions first
  const sorted = files
    .map(f => ({ name: f, mtime: fs.statSync(path.join(sessionsDir, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, maxSessions);

  const items: ProgressItem[] = [];
  const seen = new Set<string>(); // Deduplicate by normalized content

  for (const { name: file } of sorted) {
    const filePath = path.join(sessionsDir, file);
    const sessionId = file.replace('.jsonl', '');

    try {
      const content = fs.readFileSync(filePath, 'utf-8').trim();
      const lines = content.split('\n').filter(l => l.trim());
      if (lines.length < 3) continue;

      // Get date from meta line
      let date = '';
      try {
        const meta = JSON.parse(lines[0]);
        if (meta.type === 'meta' && meta.created) {
          date = new Date(meta.created as string).toISOString().slice(0, 10);
        }
      } catch { /* skip */ }
      if (!date) {
        date = new Date(fs.statSync(filePath).birthtime).toISOString().slice(0, 10);
      }

      // Scan message lines (skip meta, cap at 40 messages for performance)
      const messageLines = lines.slice(1).slice(0, 40);

      for (const line of messageLines) {
        try {
          const msg = JSON.parse(line);
          if (!msg.content || !msg.role) continue;
          const text = msg.content as string;

          // Check for completions first (higher priority — if something is done, don't list as task)
          for (const pattern of COMPLETED_PATTERNS) {
            const match = text.match(pattern);
            if (match) {
              const extracted = (match[1] || match[0]).trim().replace(/[.!,;]+$/, '').slice(0, 120);
              const key = extracted.toLowerCase().slice(0, 50);
              if (extracted.length >= 10 && !seen.has(key)) {
                seen.add(key);
                items.push({ content: extracted, type: 'completed', date, sessionId });
              }
              break; // One match per message
            }
          }

          // Check for blockers
          for (const pattern of BLOCKER_PATTERNS) {
            const match = text.match(pattern);
            if (match) {
              const extracted = (match[1] || match[0]).trim().replace(/[.!,;]+$/, '').slice(0, 120);
              const key = extracted.toLowerCase().slice(0, 50);
              if (extracted.length >= 10 && !seen.has(key)) {
                seen.add(key);
                items.push({ content: extracted, type: 'blocker', date, sessionId });
              }
              break;
            }
          }

          // Check for tasks (only from user messages — agent shouldn't create tasks)
          if (msg.role === 'user') {
            for (const pattern of TASK_PATTERNS) {
              const match = text.match(pattern);
              if (match) {
                const extracted = (match[1] || match[0]).trim().replace(/[.!,;]+$/, '').slice(0, 120);
                const key = extracted.toLowerCase().slice(0, 50);
                if (extracted.length >= 10 && !seen.has(key)) {
                  seen.add(key);
                  items.push({ content: extracted, type: 'task', date, sessionId });
                }
                break;
              }
            }
          }
        } catch {
          // skip malformed lines
        }
      }
    } catch {
      // skip unreadable files
    }
  }

  return items;
}

/**
 * Mark a session as distilled in its JSONL meta line.
 */
export function markSessionDistilled(filePath: string): void {
  const content = fs.readFileSync(filePath, 'utf-8').trim();
  const lines = content.split('\n');
  try {
    const meta = JSON.parse(lines[0]);
    if (meta.type === 'meta') {
      meta.distilled = true;
      lines[0] = JSON.stringify(meta);
      fs.writeFileSync(filePath, lines.join('\n') + '\n', 'utf-8');
    }
  } catch {
    // Non-critical
  }
}

// ── F1: Session search ───────────────────────────────────────────────

export interface SessionSearchResult {
  sessionId: string;
  title: string;
  summary: string | null;
  matchCount: number;
  snippets: Array<{ text: string; role: string }>;
  lastActive: string;
}

/**
 * Search across all sessions in a workspace by content/summary.
 * Case-insensitive substring match on message content and meta summary.
 * Returns sessions with match snippets for quick identification.
 */
export function searchSessions(sessionsDir: string, query: string, maxResults = 20): SessionSearchResult[] {
  if (!fs.existsSync(sessionsDir)) return [];
  if (!query || query.length < 2) return [];

  const lowerQuery = query.toLowerCase();
  const files = fs.readdirSync(sessionsDir).filter(f => f.endsWith('.jsonl'));
  const results: SessionSearchResult[] = [];

  for (const file of files) {
    const filePath = path.join(sessionsDir, file);
    const sessionId = file.replace('.jsonl', '');

    try {
      const content = fs.readFileSync(filePath, 'utf-8').trim();
      const lines = content.split('\n').filter(l => l.trim());
      if (lines.length === 0) continue;

      let title = sessionId;
      let summary: string | null = null;
      let messageLines = lines;

      // Parse meta line
      try {
        const meta = JSON.parse(lines[0]);
        if (meta.type === 'meta') {
          if (meta.title) title = meta.title;
          if (meta.summary) summary = meta.summary as string;
          messageLines = lines.slice(1);
        }
      } catch { /* treat all as messages */ }

      const snippets: Array<{ text: string; role: string }> = [];
      let matchCount = 0;

      // Check summary match
      if (summary && summary.toLowerCase().includes(lowerQuery)) {
        matchCount++;
        snippets.push({ text: extractSnippet(summary, lowerQuery), role: 'summary' });
      }

      // Check message content (cap at 50 messages for performance)
      for (const line of messageLines.slice(0, 50)) {
        try {
          const msg = JSON.parse(line);
          if (!msg.content || !msg.role) continue;
          const msgContent = msg.content as string;

          if (msgContent.toLowerCase().includes(lowerQuery)) {
            matchCount++;
            if (snippets.length < 3) { // Cap snippets at 3 per session
              snippets.push({ text: extractSnippet(msgContent, lowerQuery), role: msg.role as string });
            }
          }
        } catch { /* skip malformed */ }
      }

      if (matchCount > 0) {
        const stat = fs.statSync(filePath);
        results.push({
          sessionId,
          title,
          summary,
          matchCount,
          snippets,
          lastActive: stat.mtime.toISOString(),
        });
      }
    } catch { /* skip unreadable files */ }

    if (results.length >= maxResults) break;
  }

  // Sort by match count descending, then by recency
  results.sort((a, b) => {
    if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount;
    return b.lastActive.localeCompare(a.lastActive);
  });

  return results;
}

/**
 * Extract a snippet around the first occurrence of the query in text.
 * Returns ~120 chars of context around the match.
 */
function extractSnippet(text: string, lowerQuery: string): string {
  const lowerText = text.toLowerCase();
  const idx = lowerText.indexOf(lowerQuery);
  if (idx === -1) return text.slice(0, 120);

  const start = Math.max(0, idx - 40);
  const end = Math.min(text.length, idx + lowerQuery.length + 80);
  let snippet = text.slice(start, end).replace(/\n/g, ' ');
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';
  return snippet;
}

/**
 * F3: Convert a session JSONL file to Markdown format.
 * Produces a clean document with title, date, and alternating user/assistant messages.
 */
export function exportSessionToMarkdown(filePath: string, sessionId: string): string {
  const content = fs.readFileSync(filePath, 'utf-8').trim();
  if (!content) return `# Session\n\n*Empty session*\n`;

  const lines = content.split('\n').filter(l => l.trim());
  let title = sessionId;
  let created = '';
  let summary = '';
  const messages: Array<{ role: string; content: string; timestamp?: string }> = [];

  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (parsed.type === 'meta') {
        if (parsed.title) title = parsed.title;
        if (parsed.created) created = parsed.created;
        if (parsed.summary) summary = parsed.summary;
        continue;
      }
      if (parsed.role && parsed.content) {
        messages.push({
          role: parsed.role,
          content: parsed.content,
          timestamp: parsed.timestamp,
        });
      }
    } catch { /* skip malformed lines */ }
  }

  // Fall back to first user message if no explicit title
  if (title === sessionId && messages.length > 0) {
    const firstUser = messages.find(m => m.role === 'user');
    if (firstUser) {
      const firstLine = firstUser.content.split('\n')[0].trim();
      title = firstLine.length > 80 ? firstLine.slice(0, 77) + '...' : firstLine;
    }
  }

  const parts: string[] = [];
  parts.push(`# ${title}`);
  if (created) parts.push(`\n*${new Date(created).toLocaleString()}*`);
  if (summary) parts.push(`\n> ${summary}`);
  parts.push('');

  for (const msg of messages) {
    const label = msg.role === 'user' ? '**You**' : '**Assistant**';
    const time = msg.timestamp ? ` *(${new Date(msg.timestamp).toLocaleTimeString()})*` : '';
    parts.push(`### ${label}${time}\n`);
    parts.push(msg.content);
    parts.push('');
  }

  return parts.join('\n');
}

export const sessionRoutes: FastifyPluginAsync = async (server) => {
  // GET /api/workspaces/:workspaceId/sessions — list sessions for a workspace
  server.get<{
    Params: { workspaceId: string };
  }>('/api/workspaces/:workspaceId/sessions', async (request, reply) => {
    const { workspaceId } = request.params;
    assertSafeSegment(workspaceId, 'workspaceId');

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

  // GET /api/workspaces/:workspaceId/sessions/search — search across sessions
  server.get<{
    Params: { workspaceId: string };
    Querystring: { q: string; limit?: string };
  }>('/api/workspaces/:workspaceId/sessions/search', async (request, reply) => {
    const { workspaceId } = request.params;
    assertSafeSegment(workspaceId, 'workspaceId');

    const ws = server.workspaceManager.get(workspaceId);
    if (!ws) {
      return reply.status(404).send({ error: 'Workspace not found' });
    }

    const query = request.query.q;
    if (!query || query.length < 2) {
      return reply.status(400).send({ error: 'Query must be at least 2 characters' });
    }

    const maxResults = Math.min(parseInt(request.query.limit ?? '20', 10) || 20, 50);
    const sessionsDir = path.join(
      server.localConfig.dataDir, 'workspaces', workspaceId, 'sessions'
    );

    return searchSessions(sessionsDir, query, maxResults);
  });

  // F3: GET /api/workspaces/:workspaceId/sessions/:sessionId/export — export session as markdown
  server.get<{
    Params: { workspaceId: string; sessionId: string };
  }>('/api/workspaces/:workspaceId/sessions/:sessionId/export', async (request, reply) => {
    const { workspaceId, sessionId } = request.params;
    assertSafeSegment(workspaceId, 'workspaceId');
    assertSafeSegment(sessionId, 'sessionId');

    const ws = server.workspaceManager.get(workspaceId);
    if (!ws) {
      return reply.status(404).send({ error: 'Workspace not found' });
    }

    const filePath = path.join(
      server.localConfig.dataDir, 'workspaces', workspaceId, 'sessions', `${sessionId}.jsonl`
    );
    if (!fs.existsSync(filePath)) {
      return reply.status(404).send({ error: 'Session not found' });
    }

    const markdown = exportSessionToMarkdown(filePath, sessionId);
    return reply
      .header('Content-Type', 'text/markdown; charset=utf-8')
      .send(markdown);
  });

  // POST /api/workspaces/:workspaceId/sessions — create a new session
  server.post<{
    Params: { workspaceId: string };
    Body: { title?: string };
  }>('/api/workspaces/:workspaceId/sessions', async (request, reply) => {
    const { workspaceId } = request.params;
    assertSafeSegment(workspaceId, 'workspaceId');

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
    assertSafeSegment(sessionId, 'sessionId');
    const workspaceId = request.query.workspace;
    if (workspaceId) assertSafeSegment(workspaceId, 'workspace');
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
    assertSafeSegment(sessionId, 'sessionId');
    const workspaceId = request.query.workspace;
    if (workspaceId) assertSafeSegment(workspaceId, 'workspace');

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
