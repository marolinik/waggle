import type { MindDB } from './db.js';

export type FrameType = 'I' | 'P' | 'B';
export type Importance = 'critical' | 'important' | 'normal' | 'temporary' | 'deprecated';
export type FrameSource = 'user_stated' | 'tool_verified' | 'agent_inferred' | 'import' | 'system';

export interface MemoryFrame {
  id: number;
  frame_type: FrameType;
  gop_id: string;
  t: number;
  base_frame_id: number | null;
  content: string;
  importance: Importance;
  source: FrameSource;
  access_count: number;
  created_at: string;
  last_accessed: string;
}

export interface ReconstructedState {
  iframe: MemoryFrame | null;
  pframes: MemoryFrame[];
}

const IMPORTANCE_MULTIPLIERS: Record<Importance, number> = {
  critical: 2.0,
  important: 1.5,
  normal: 1.0,
  temporary: 0.7,
  deprecated: 0.3,
};

export class FrameStore {
  private db: MindDB;

  constructor(db: MindDB) {
    this.db = db;
  }

  createIFrame(gopId: string, content: string, importance: Importance = 'normal', source: FrameSource = 'user_stated'): MemoryFrame {
    const t = this.nextT(gopId);
    const raw = this.db.getDatabase();
    const result = raw.prepare(`
      INSERT INTO memory_frames (frame_type, gop_id, t, base_frame_id, content, importance, source)
      VALUES ('I', ?, ?, NULL, ?, ?, ?)
    `).run(gopId, t, content, importance, source);

    const frame = raw.prepare('SELECT * FROM memory_frames WHERE id = ?').get(result.lastInsertRowid) as MemoryFrame;
    this.indexFts(frame);
    return frame;
  }

  createPFrame(gopId: string, content: string, baseFrameId: number, importance: Importance = 'normal', source: FrameSource = 'user_stated'): MemoryFrame {
    const t = this.nextT(gopId);
    const raw = this.db.getDatabase();
    const result = raw.prepare(`
      INSERT INTO memory_frames (frame_type, gop_id, t, base_frame_id, content, importance, source)
      VALUES ('P', ?, ?, ?, ?, ?, ?)
    `).run(gopId, t, baseFrameId, content, importance, source);

    const frame = raw.prepare('SELECT * FROM memory_frames WHERE id = ?').get(result.lastInsertRowid) as MemoryFrame;
    this.indexFts(frame);
    return frame;
  }

  createBFrame(gopId: string, content: string, baseFrameId: number, referencedFrameIds: number[]): MemoryFrame {
    const t = this.nextT(gopId);
    // Store cross-references in the content as structured data
    const bContent = JSON.stringify({
      description: content,
      references: referencedFrameIds,
    });
    const raw = this.db.getDatabase();
    const result = raw.prepare(`
      INSERT INTO memory_frames (frame_type, gop_id, t, base_frame_id, content, importance)
      VALUES ('B', ?, ?, ?, ?, 'normal')
    `).run(gopId, t, baseFrameId, bContent);

    const frame = raw.prepare('SELECT * FROM memory_frames WHERE id = ?').get(result.lastInsertRowid) as MemoryFrame;
    this.indexFts(frame);
    return frame;
  }

  getById(id: number): MemoryFrame | undefined {
    return this.db.getDatabase().prepare('SELECT * FROM memory_frames WHERE id = ?').get(id) as MemoryFrame | undefined;
  }

  getLatestIFrame(gopId: string): MemoryFrame | undefined {
    return this.db.getDatabase().prepare(`
      SELECT * FROM memory_frames
      WHERE gop_id = ? AND frame_type = 'I'
      ORDER BY t DESC LIMIT 1
    `).get(gopId) as MemoryFrame | undefined;
  }

  getPFramesSinceLastI(gopId: string): MemoryFrame[] {
    const latestI = this.getLatestIFrame(gopId);
    if (!latestI) return [];
    return this.db.getDatabase().prepare(`
      SELECT * FROM memory_frames
      WHERE gop_id = ? AND frame_type = 'P' AND t > ?
      ORDER BY t ASC
    `).all(gopId, latestI.t) as MemoryFrame[];
  }

  getGopFrames(gopId: string): MemoryFrame[] {
    return this.db.getDatabase().prepare(`
      SELECT * FROM memory_frames WHERE gop_id = ? ORDER BY t ASC
    `).all(gopId) as MemoryFrame[];
  }

  reconstructState(gopId: string): ReconstructedState {
    const iframe = this.getLatestIFrame(gopId) ?? null;
    const pframes = iframe ? this.getPFramesSinceLastI(gopId) : [];
    return { iframe, pframes };
  }

  touch(id: number): void {
    this.db.getDatabase().prepare(`
      UPDATE memory_frames SET access_count = access_count + 1, last_accessed = datetime('now')
      WHERE id = ?
    `).run(id);
  }

  getImportanceMultiplier(importance: Importance): number {
    return IMPORTANCE_MULTIPLIERS[importance];
  }

  /** Get the most recent frames ordered by creation time descending. */
  getRecent(limit = 50): MemoryFrame[] {
    return this.db.getDatabase().prepare(`
      SELECT * FROM memory_frames ORDER BY id DESC LIMIT ?
    `).all(limit) as MemoryFrame[];
  }

  getBFrameReferences(bframeId: number): number[] {
    const frame = this.getById(bframeId);
    if (!frame || frame.frame_type !== 'B') return [];
    try {
      const parsed = JSON.parse(frame.content);
      return parsed.references ?? [];
    } catch {
      return [];
    }
  }

  private nextT(gopId: string): number {
    const row = this.db.getDatabase().prepare(`
      SELECT COALESCE(MAX(t), -1) + 1 AS next_t FROM memory_frames WHERE gop_id = ?
    `).get(gopId) as { next_t: number };
    return row.next_t;
  }

  private indexFts(frame: MemoryFrame): void {
    this.db.getDatabase().prepare(`
      INSERT INTO memory_frames_fts (rowid, content) VALUES (?, ?)
    `).run(frame.id, frame.content);
  }
}
