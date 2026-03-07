import type { MindDB } from './db.js';

export type AwarenessCategory = 'task' | 'action' | 'pending' | 'flag';

export interface AwarenessItem {
  id: number;
  category: AwarenessCategory;
  content: string;
  priority: number;
  created_at: string;
  expires_at: string | null;
}

type AwarenessUpdate = Partial<Pick<AwarenessItem, 'content' | 'priority' | 'expires_at'>>;

const MAX_ITEMS = 10;

export class AwarenessLayer {
  private db: MindDB;

  constructor(db: MindDB) {
    this.db = db;
  }

  add(category: AwarenessCategory, content: string, priority = 0, expires_at?: string): AwarenessItem {
    const raw = this.db.getDatabase();
    const result = raw.prepare(`
      INSERT INTO awareness (category, content, priority, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(category, content, priority, expires_at ?? null);
    return raw.prepare('SELECT * FROM awareness WHERE id = ?').get(result.lastInsertRowid) as AwarenessItem;
  }

  remove(id: number): void {
    this.db.getDatabase().prepare('DELETE FROM awareness WHERE id = ?').run(id);
  }

  update(id: number, changes: AwarenessUpdate): AwarenessItem {
    const fields = Object.entries(changes).filter(([, v]) => v !== undefined);
    if (fields.length === 0) {
      return this.db.getDatabase().prepare('SELECT * FROM awareness WHERE id = ?').get(id) as AwarenessItem;
    }
    const sets = fields.map(([k]) => `${k} = ?`).join(', ');
    const values = fields.map(([, v]) => v);
    const raw = this.db.getDatabase();
    raw.prepare(`UPDATE awareness SET ${sets} WHERE id = ?`).run(...values, id);
    return raw.prepare('SELECT * FROM awareness WHERE id = ?').get(id) as AwarenessItem;
  }

  getAll(): AwarenessItem[] {
    return this.db.getDatabase().prepare(`
      SELECT * FROM awareness
      WHERE expires_at IS NULL OR expires_at > datetime('now')
      ORDER BY priority DESC
      LIMIT ?
    `).all(MAX_ITEMS) as AwarenessItem[];
  }

  getByCategory(category: AwarenessCategory): AwarenessItem[] {
    return this.db.getDatabase().prepare(`
      SELECT * FROM awareness
      WHERE category = ? AND (expires_at IS NULL OR expires_at > datetime('now'))
      ORDER BY priority DESC
      LIMIT ?
    `).all(category, MAX_ITEMS) as AwarenessItem[];
  }

  clear(): void {
    this.db.getDatabase().prepare('DELETE FROM awareness').run();
  }

  clearCategory(category: AwarenessCategory): void {
    this.db.getDatabase().prepare('DELETE FROM awareness WHERE category = ?').run(category);
  }

  toContext(): string {
    const items = this.getAll();
    if (items.length === 0) return 'No active awareness items.';

    const grouped = new Map<string, AwarenessItem[]>();
    for (const item of items) {
      const list = grouped.get(item.category) ?? [];
      list.push(item);
      grouped.set(item.category, list);
    }

    const sections: string[] = [];
    const labels: Record<AwarenessCategory, string> = {
      task: 'Active Tasks',
      action: 'Recent Actions',
      pending: 'Pending Items',
      flag: 'Context Flags',
    };

    for (const [cat, label] of Object.entries(labels)) {
      const catItems = grouped.get(cat);
      if (catItems && catItems.length > 0) {
        sections.push(`${label}:\n${catItems.map(i => `- ${i.content}`).join('\n')}`);
      }
    }

    return sections.join('\n\n');
  }
}
