import { DatabaseManager } from './database.js';

export interface Note {
  id?: number;
  content: string;
  agent?: string;
  created_at?: string;
  updated_at?: string;
}

export class NoteManager {
  constructor(private db: DatabaseManager) {}

  private buildMarkdown(notes: any[]): string {
    if (!notes || notes.length === 0) {
      return '（暂无笔记）';
    }
    const lines: string[] = [];
    // 分组按 agent
    const groups = new Map<string, any[]>();
    for (const n of notes) {
      const key = n.agent || 'default';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(n);
    }
    for (const [agent, arr] of groups.entries()) {
      lines.push(`## Agent: ${agent}`);
      for (const n of arr) {
        const ts = n.updated_at || n.created_at || '';
        lines.push(`- [#${n.id}] (${ts})`);
        lines.push('');
        lines.push(n.content);
        lines.push('');
      }
      lines.push('');
    }
    return lines.join('\n');
  }

  async addNote(note: Note) {
    const database = this.db.getDb();
    const stmt = database.prepare(
      `INSERT INTO notes (content, agent) VALUES (?, ?)`
    );
    const result = stmt.run(note.content, note.agent || 'default');

    const newNote = database.prepare('SELECT * FROM notes WHERE id = ?').get(result.lastInsertRowid) as any;

    return {
      content: [
        {
          type: 'text',
          text: `✅ 笔记已添加\n\nID: ${newNote.id}\nAgent: ${newNote.agent || 'default'}\n内容:\n\n${newNote.content}`,
        },
      ],
    };
  }

  async listNotes(filters: { agent?: string } = {}) {
    const database = this.db.getDb();

    let query = 'SELECT * FROM notes';
    const params: any[] = [];
    if (filters.agent) {
      query += ' WHERE agent = ?';
      params.push(filters.agent);
    }
    query += ' ORDER BY updated_at DESC, created_at DESC';

    const stmt = database.prepare(query);
    const rows = stmt.all(...params);

    const md = this.buildMarkdown(rows);
    return {
      content: [
        {
          type: 'text',
          text: md,
        },
      ],
    };
  }

  async updateNote(params: { id: number; content?: string; agent?: string }) {
    const database = this.db.getDb();

    const updates: string[] = [];
    const values: any[] = [];

    const allowedFields = ['content', 'agent'];
    for (const field of allowedFields) {
      if ((params as any)[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push((params as any)[field]);
      }
    }

    if (updates.length === 0) {
      return {
        content: [
          { type: 'text', text: '⚠️ 未提供需要更新的字段' },
        ],
      };
    }

    values.push(params.id);
    const sql = `UPDATE notes SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    const stmt = database.prepare(sql);
    const result = stmt.run(...values);

    if (result.changes === 0) {
      return { content: [{ type: 'text', text: `❌ 未找到该笔记（ID=${params.id})` }] };
    }

    const updated = database.prepare('SELECT * FROM notes WHERE id = ?').get(params.id) as any;
    return {
      content: [
        {
          type: 'text',
          text: `✅ 笔记已更新\n\nID: ${updated.id}\nAgent: ${updated.agent || 'default'}\n内容:\n\n${updated.content}`,
        },
      ],
    };
  }

  async deleteNote(id: number) {
    const database = this.db.getDb();
    const stmt = database.prepare('DELETE FROM notes WHERE id = ?');
    const result = stmt.run(id);
    if (result.changes === 0) {
      return { content: [{ type: 'text', text: `❌ 未找到该笔记（ID=${id})` }] };
    }
    return { content: [{ type: 'text', text: `🗑️ 已删除笔记（ID=${id}）` }] };
  }
}
