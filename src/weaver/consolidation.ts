import type { MindDB } from '../mind/db.js';
import type { FrameStore, MemoryFrame, Importance } from '../mind/frames.js';
import type { SessionStore } from '../mind/sessions.js';

const IMPORTANCE_UPGRADE: Record<string, Importance> = {
  temporary: 'normal',
  normal: 'important',
  important: 'critical',
};

export class MemoryWeaver {
  private db: MindDB;
  private frames: FrameStore;
  private sessions: SessionStore;

  constructor(db: MindDB, frames: FrameStore, sessions: SessionStore) {
    this.db = db;
    this.frames = frames;
    this.sessions = sessions;
  }

  consolidateGop(gopId: string): MemoryFrame | null {
    const state = this.frames.reconstructState(gopId);
    if (!state.iframe || state.pframes.length === 0) return null;

    // Merge I-frame + P-frames into consolidated content
    const parts = [state.iframe.content, ...state.pframes.map(p => p.content)];
    const mergedContent = parts.join('\n---\n');

    // Create new consolidated I-frame
    const consolidated = this.frames.createIFrame(gopId, mergedContent, 'normal');

    // Mark old P-frames as deprecated
    const raw = this.db.getDatabase();
    const pframeIds = state.pframes.map(p => p.id);
    const placeholders = pframeIds.map(() => '?').join(',');
    raw.prepare(
      `UPDATE memory_frames SET importance = 'deprecated' WHERE id IN (${placeholders})`
    ).run(...pframeIds);

    return consolidated;
  }

  decayFrames(): number {
    const raw = this.db.getDatabase();

    // Delete deprecated frames with zero access count
    // First get the IDs for FTS cleanup
    const toDelete = raw.prepare(
      "SELECT id FROM memory_frames WHERE importance = 'deprecated' AND access_count = 0"
    ).all() as { id: number }[];

    if (toDelete.length === 0) return 0;

    const ids = toDelete.map(r => r.id);
    const placeholders = ids.map(() => '?').join(',');

    // Delete from FTS index
    raw.prepare(
      `DELETE FROM memory_frames_fts WHERE rowid IN (${placeholders})`
    ).run(...ids);

    // Delete the frames
    const result = raw.prepare(
      `DELETE FROM memory_frames WHERE id IN (${placeholders})`
    ).run(...ids);

    return result.changes;
  }

  strengthenFrames(tempThreshold = 10, normalThreshold = 25): number {
    const raw = this.db.getDatabase();
    let upgraded = 0;

    // Upgrade temporary → normal
    const tempResult = raw.prepare(`
      UPDATE memory_frames SET importance = 'normal'
      WHERE importance = 'temporary' AND access_count >= ?
    `).run(tempThreshold);
    upgraded += tempResult.changes;

    // Upgrade normal → important
    const normalResult = raw.prepare(`
      UPDATE memory_frames SET importance = 'important'
      WHERE importance = 'normal' AND access_count >= ?
    `).run(normalThreshold);
    upgraded += normalResult.changes;

    return upgraded;
  }

  createDailySummary(gopIds: string[]): MemoryFrame | null {
    if (gopIds.length === 0) return null;

    const allContent: string[] = [];
    for (const gopId of gopIds) {
      const gopFrames = this.frames.getGopFrames(gopId);
      for (const frame of gopFrames) {
        if (frame.frame_type === 'I' || frame.frame_type === 'P') {
          allContent.push(frame.content);
        }
      }
    }

    if (allContent.length === 0) return null;

    // Create a summary session
    const summarySession = this.sessions.create('daily-summary');
    const summaryContent = allContent.join('\n---\n');
    return this.frames.createIFrame(summarySession.gop_id, summaryContent, 'important');
  }

  archiveClosedSessions(): number {
    const raw = this.db.getDatabase();
    const result = raw.prepare(
      "UPDATE sessions SET status = 'archived' WHERE status = 'closed'"
    ).run();
    return result.changes;
  }

  consolidateProject(projectId: string): MemoryFrame | null {
    const projectSessions = this.sessions.getByProject(projectId);
    const closedSessions = projectSessions.filter(s => s.status === 'closed' || s.status === 'archived');

    if (closedSessions.length === 0) return null;

    const allContent: string[] = [];
    for (const session of closedSessions) {
      const latestI = this.frames.getLatestIFrame(session.gop_id);
      if (latestI) {
        allContent.push(`[${session.gop_id}] ${latestI.content}`);
      }
    }

    if (allContent.length === 0) return null;

    const consolidationSession = this.sessions.create(projectId);
    return this.frames.createIFrame(
      consolidationSession.gop_id,
      allContent.join('\n---\n'),
      'important'
    );
  }
}
