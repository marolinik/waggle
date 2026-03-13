import fs from 'node:fs';
import path from 'node:path';
import { MindDB } from '@waggle/core';
import { extractProgressItems, type ProgressItem } from './sessions.js';

// ── Types ──────────────────────────────────────────────────────────────

export interface WorkspaceNowBlock {
  workspaceName: string;
  summary: string;           // 2-4 sentences max
  recentDecisions: string[]; // max 3, one line each
  activeThreads: string[];   // max 3, title + last active
  progressItems: string[];   // max 5, formatted as "type: content"
  nextActions: string[];     // max 3, derived from progress/decisions
}

// ── Workspace Manager interface (minimal, passed via opts) ─────────────

interface WsManagerLike {
  get: (id: string) => { id: string; name: string; [k: string]: unknown } | null;
  getMindPath: (id: string) => string;
}

// ── Summary builder (mirrors composeWorkspaceSummary from workspaces.ts) ──

function buildCompactSummary(
  frames: Array<{ content: string; importance: string; created_at: string }>,
  memoryCount: number,
  sessionCount: number,
): string {
  const parts: string[] = [];

  // What this workspace is about (from important/critical frames)
  const important = frames.filter(f => f.importance === 'critical' || f.importance === 'important');
  const workContextFrames = frames.filter(f =>
    f.content.toLowerCase().includes('project') ||
    f.content.toLowerCase().includes('workspace') ||
    f.content.toLowerCase().includes('working on'),
  );

  const aboutFrame = important[0] ?? workContextFrames[0] ?? frames[0];
  if (aboutFrame) {
    const aboutLine = aboutFrame.content.split('\n')[0].replace(/\.\s*$/, '').trim();
    const aboutText = aboutLine.length > 140 ? aboutLine.slice(0, 137) + '...' : aboutLine;
    if (aboutText.length > 10) {
      parts.push(aboutText + '.');
    }
  }

  // Current state (activity level + recency)
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

  return parts.join(' ');
}

// ── Decision extraction (mirrors workspaces.ts pattern) ────────────────

function extractDecisions(
  raw: ReturnType<MindDB['getDatabase']>,
  max: number,
): string[] {
  const decisionFrames = raw.prepare(
    `SELECT content, created_at FROM memory_frames
     WHERE importance != 'deprecated' AND importance != 'temporary'
       AND (content LIKE 'Decision%' OR content LIKE '%decided%'
         OR content LIKE '%decision made%' OR content LIKE '%chose %'
         OR content LIKE '%selected %' OR content LIKE '%agreed %'
         OR importance = 'critical')
     ORDER BY id DESC LIMIT ?`
  ).all(max + 2) as Array<{ content: string; created_at: string }>;

  return decisionFrames.slice(0, max).map(f => {
    const firstLine = f.content.split('\n')[0];
    const sentenceMatch = firstLine.match(/^(.+?\.\s)(?=[A-Z])/);
    const text = sentenceMatch
      ? sentenceMatch[1].trim()
      : (firstLine.length > 150 ? firstLine.slice(0, 147) + '...' : firstLine);
    return text.replace(/\.\s*$/, '');
  });
}

// ── Thread extraction (from session JSONL files) ───────────────────────

function extractActiveThreads(sessionsDir: string, max: number): string[] {
  if (!fs.existsSync(sessionsDir)) return [];

  const files = fs.readdirSync(sessionsDir).filter(f => f.endsWith('.jsonl'));
  const sessionMeta: Array<{ title: string; mtime: number }> = [];

  for (const file of files) {
    const filePath = path.join(sessionsDir, file);
    const sessionId = file.replace('.jsonl', '');
    try {
      const stat = fs.statSync(filePath);
      const content = fs.readFileSync(filePath, 'utf-8').trim();
      const lines = content ? content.split('\n').filter(l => l.trim()) : [];

      let title = sessionId;
      if (lines.length > 0) {
        try {
          const first = JSON.parse(lines[0]);
          if (first.type === 'meta' && first.title) title = first.title;
          else if (first.content) title = first.content.slice(0, 50);
        } catch { /* use default */ }
      }
      if (title === sessionId && lines.length > 1) {
        try {
          const msg = JSON.parse(lines[1]);
          if (msg.content) title = msg.content.slice(0, 50);
        } catch { /* use default */ }
      }

      sessionMeta.push({ title, mtime: stat.mtimeMs });
    } catch { /* skip */ }
  }

  sessionMeta.sort((a, b) => b.mtime - a.mtime);

  return sessionMeta.slice(0, max).map(s => {
    const ago = formatRelativeTime(s.mtime);
    const label = s.title.length > 60 ? s.title.slice(0, 57) + '...' : s.title;
    return `${label} (${ago})`;
  });
}

function formatRelativeTime(mtimeMs: number): string {
  const diffMs = Date.now() - mtimeMs;
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return mins <= 1 ? 'just now' : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'yesterday' : `${days}d ago`;
}

// ── Next-action derivation ─────────────────────────────────────────────

function deriveNextActions(
  decisions: string[],
  progress: ProgressItem[],
  max: number,
): string[] {
  const actions: string[] = [];

  // Blockers become immediate next actions
  for (const p of progress) {
    if (p.type === 'blocker' && actions.length < max) {
      actions.push(`Resolve: ${p.content}`);
    }
  }

  // Open tasks
  for (const p of progress) {
    if (p.type === 'task' && actions.length < max) {
      actions.push(p.content);
    }
  }

  // If we still have room and there are decisions, suggest review
  if (actions.length < max && decisions.length > 0 && progress.length === 0) {
    actions.push('Review recent decisions and determine next steps');
  }

  return actions.slice(0, max);
}

// ── Main builder ───────────────────────────────────────────────────────

export function buildWorkspaceNowBlock(opts: {
  dataDir: string;
  workspaceId: string;
  wsManager: WsManagerLike;
  activateWorkspaceMind: (id: string) => boolean;
}): WorkspaceNowBlock | null {
  const { dataDir, workspaceId, wsManager, activateWorkspaceMind } = opts;

  const ws = wsManager.get(workspaceId);
  if (!ws) return null;

  const mindPath = wsManager.getMindPath(workspaceId);
  if (!fs.existsSync(mindPath)) {
    // No mind file — workspace exists but has no meaningful data
    return null;
  }

  // Activate workspace mind (ensures it's ready)
  activateWorkspaceMind(workspaceId);

  let summary = '';
  let decisions: string[] = [];
  let wsDb: MindDB | null = null;

  try {
    wsDb = new MindDB(mindPath);
    const raw = wsDb.getDatabase();

    const memoryCount = (raw.prepare('SELECT COUNT(*) as cnt FROM memory_frames').get() as { cnt: number }).cnt;
    if (memoryCount === 0) {
      wsDb.close();
      return null;
    }

    // Get recent important frames (same query as workspaces.ts context endpoint)
    const frames = raw.prepare(
      `SELECT content, importance, created_at FROM memory_frames
       WHERE importance != 'deprecated' AND importance != 'temporary'
       ORDER BY CASE importance
         WHEN 'critical' THEN 1 WHEN 'important' THEN 2
         WHEN 'normal' THEN 3 ELSE 4 END,
       id DESC LIMIT 8`
    ).all() as Array<{ content: string; importance: string; created_at: string }>;

    // Session count from filesystem
    const sessDir = path.join(dataDir, 'workspaces', workspaceId, 'sessions');
    const sessCount = fs.existsSync(sessDir)
      ? fs.readdirSync(sessDir).filter(f => f.endsWith('.jsonl')).length
      : 0;

    if (frames.length > 0) {
      summary = buildCompactSummary(frames, memoryCount, sessCount);
    }

    // Extract decisions (cap at 3 for the now-block)
    decisions = extractDecisions(raw, 3);

    wsDb.close();
    wsDb = null;
  } catch {
    // If mind DB fails, close and return null
    if (wsDb) {
      try { wsDb.close(); } catch { /* ignore */ }
    }
    return null;
  }

  // Extract active threads from session files (cap at 3)
  const sessionsDir = path.join(dataDir, 'workspaces', workspaceId, 'sessions');
  const activeThreads = extractActiveThreads(sessionsDir, 3);

  // Extract progress items (cap at 5)
  let rawProgress: ProgressItem[] = [];
  if (fs.existsSync(sessionsDir)) {
    try {
      rawProgress = extractProgressItems(sessionsDir, 5);
    } catch { /* non-blocking */ }
  }
  const progressItems = rawProgress.slice(0, 5).map(p => `[${p.type}] ${p.content}`);

  // Derive next actions (cap at 3)
  const nextActions = deriveNextActions(decisions, rawProgress, 3);

  return {
    workspaceName: ws.name as string,
    summary,
    recentDecisions: decisions,
    activeThreads,
    progressItems,
    nextActions,
  };
}

// ── Formatter (for system prompt injection) ────────────────────────────

export function formatWorkspaceNowPrompt(block: WorkspaceNowBlock): string {
  const sections: string[] = [];

  sections.push(`# Workspace Now — ${block.workspaceName}`);
  sections.push('');

  if (block.summary) {
    sections.push(block.summary);
    sections.push('');
  }

  if (block.recentDecisions.length > 0) {
    sections.push('## Recent Decisions');
    for (const d of block.recentDecisions) {
      sections.push(`- ${d}`);
    }
    sections.push('');
  }

  if (block.activeThreads.length > 0) {
    sections.push('## Active Threads');
    for (const t of block.activeThreads) {
      sections.push(`- ${t}`);
    }
    sections.push('');
  }

  if (block.progressItems.length > 0) {
    sections.push('## Progress');
    for (const p of block.progressItems) {
      sections.push(`- ${p}`);
    }
    sections.push('');
  }

  if (block.nextActions.length > 0) {
    sections.push('## Likely Next Actions');
    for (const a of block.nextActions) {
      sections.push(`- ${a}`);
    }
    sections.push('');
  }

  // Trim trailing blank line but ensure single newline at end
  return sections.join('\n').trimEnd();
}
