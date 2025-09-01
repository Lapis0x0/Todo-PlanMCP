import { DatabaseManager } from './database.js';
import { marked } from 'marked';

export interface Note {
  id?: number;
  title: string;
  content: string;
  category?: string;
  todo_id?: number;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

export class NoteManager {
  constructor(private db: DatabaseManager) {}

  async createNote(note: Note) {
    const database = this.db.getDb();
    
    // 开始事务
    const transaction = database.transaction(() => {
    
      // 插入笔记
      const stmt = database.prepare(
        `INSERT INTO notes (title, content, category, todo_id)
         VALUES (?, ?, ?, ?)`
      );
      
      const result = stmt.run(
        note.title,
        note.content,
        note.category || null,
        note.todo_id || null
      );
      
      const noteId = result.lastInsertRowid;
      
      // 处理标签
      if (note.tags && note.tags.length > 0) {
        for (const tagName of note.tags) {
          // 插入或获取标签ID
          database.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)').run(tagName);
          
          const tag = database.prepare('SELECT id FROM tags WHERE name = ?').get(tagName) as any;
          
          // 创建笔记-标签关联
          database.prepare('INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?)').run(noteId, tag.id);
        }
      }
      
      return noteId;
    });
    
    try {
      const noteId = transaction();
      const newNote = database.prepare('SELECT * FROM notes WHERE id = ?').get(noteId) as any;
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ 笔记已创建：\n\n**${newNote.title}**\n- ID: ${newNote.id}\n${newNote.category ? `- 分类: ${newNote.category}\n` : ''}${note.tags ? `- 标签: ${note.tags.join(', ')}\n` : ''}${newNote.todo_id ? `- 关联任务: ${newNote.todo_id}\n` : ''}\n\n内容预览：\n${newNote.content.substring(0, 200)}${newNote.content.length > 200 ? '...' : ''}`,
          },
        ],
      };
    } catch (error) {
      throw error;
    }
  }

  async updateNote(params: { id: number; title?: string; content?: string; append?: boolean }) {
    const database = this.db.getDb();
    
    const existingNote = database.prepare('SELECT * FROM notes WHERE id = ?').get(params.id) as any;
    
    if (!existingNote) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ 未找到ID为 ${params.id} 的笔记`,
          },
        ],
      };
    }
    
    const updates: string[] = [];
    const values: any[] = [];
    
    if (params.title) {
      updates.push('title = ?');
      values.push(params.title);
    }
    
    if (params.content) {
      updates.push('content = ?');
      if (params.append) {
        values.push(existingNote.content + '\n\n' + params.content);
      } else {
        values.push(params.content);
      }
    }
    
    if (updates.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: '⚠️ 没有提供要更新的内容',
          },
        ],
      };
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(params.id);
    
    const stmt = database.prepare(`UPDATE notes SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...values);
    
    const updatedNote = database.prepare('SELECT * FROM notes WHERE id = ?').get(params.id) as any;
    
    return {
      content: [
        {
          type: 'text',
          text: `✅ 笔记已更新：\n\n**${updatedNote.title}**\n- ID: ${updatedNote.id}\n- 更新时间: ${updatedNote.updated_at}\n${params.append ? '- 模式: 追加内容\n' : ''}\n\n内容预览：\n${updatedNote.content.substring(0, 200)}${updatedNote.content.length > 200 ? '...' : ''}`,
        },
      ],
    };
  }

  async listNotes(filters: { category?: string; tag?: string; todo_id?: number } = {}) {
    const database = this.db.getDb();
    
    let query = `
      SELECT DISTINCT n.*, GROUP_CONCAT(t.name) as tags
      FROM notes n
      LEFT JOIN note_tags nt ON n.id = nt.note_id
      LEFT JOIN tags t ON nt.tag_id = t.id
      WHERE 1=1
    `;
    const params: any[] = [];
    
    if (filters.category) {
      query += ' AND n.category = ?';
      params.push(filters.category);
    }
    
    if (filters.todo_id) {
      query += ' AND n.todo_id = ?';
      params.push(filters.todo_id);
    }
    
    if (filters.tag) {
      query += ' AND n.id IN (SELECT note_id FROM note_tags nt JOIN tags t ON nt.tag_id = t.id WHERE t.name = ?)';
      params.push(filters.tag);
    }
    
    query += ' GROUP BY n.id ORDER BY n.updated_at DESC';
    
    const stmt = database.prepare(query);
    const notes = stmt.all(...params) as any[];
    
    if (notes.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: '📚 暂无笔记',
          },
        ],
      };
    }
    
    let markdown = '# 📚 笔记列表\n\n';
    
    // 按分类分组
    const categories = new Map<string, any[]>();
    for (const note of notes) {
      const cat = note.category || '未分类';
      if (!categories.has(cat)) {
        categories.set(cat, []);
      }
      categories.get(cat)!.push(note);
    }
    
    for (const [category, categoryNotes] of categories) {
      markdown += `## 📁 ${category}\n\n`;
      
      for (const note of categoryNotes) {
        markdown += `### [${note.id}] ${note.title}\n\n`;
        
        if (note.tags) {
          markdown += `🏷️ **标签**: ${note.tags}\n\n`;
        }
        
        if (note.todo_id) {
          markdown += `🔗 **关联任务**: #${note.todo_id}\n\n`;
        }
        
        // 内容预览
        const preview = note.content.substring(0, 300);
        markdown += `${preview}${note.content.length > 300 ? '...' : ''}\n\n`;
        
        markdown += `📅 创建: ${note.created_at} | 更新: ${note.updated_at}\n\n---\n\n`;
      }
    }
    
    return {
      content: [
        {
          type: 'text',
          text: markdown,
        },
      ],
    };
  }

  async searchNotes(query: string) {
    const database = this.db.getDb();
    
    const stmt = database.prepare(
      `SELECT n.*, GROUP_CONCAT(t.name) as tags
       FROM notes n
       LEFT JOIN note_tags nt ON n.id = nt.note_id
       LEFT JOIN tags t ON nt.tag_id = t.id
       WHERE n.title LIKE ? OR n.content LIKE ?
       GROUP BY n.id
       ORDER BY 
         CASE 
           WHEN n.title LIKE ? THEN 1
           ELSE 2
         END,
         n.updated_at DESC`
    );
    const notes = stmt.all(`%${query}%`, `%${query}%`, `%${query}%`) as any[];
    
    if (notes.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `🔍 未找到包含 "${query}" 的笔记`,
          },
        ],
      };
    }
    
    let markdown = `# 🔍 搜索结果: "${query}"\n\n找到 ${notes.length} 条相关笔记\n\n`;
    
    for (const note of notes) {
      markdown += `## [${note.id}] ${note.title}\n\n`;
      
      if (note.category) {
        markdown += `📁 **分类**: ${note.category}\n`;
      }
      
      if (note.tags) {
        markdown += `🏷️ **标签**: ${note.tags}\n`;
      }
      
      markdown += '\n';
      
      // 高亮搜索关键词的上下文
      const content = note.content;
      const index = content.toLowerCase().indexOf(query.toLowerCase());
      if (index !== -1) {
        const start = Math.max(0, index - 50);
        const end = Math.min(content.length, index + query.length + 150);
        const excerpt = content.substring(start, end);
        markdown += `...${excerpt}...\n\n`;
      } else {
        markdown += `${content.substring(0, 200)}${content.length > 200 ? '...' : ''}\n\n`;
      }
      
      markdown += `---\n\n`;
    }
    
    return {
      content: [
        {
          type: 'text',
          text: markdown,
        },
      ],
    };
  }

  async getCategories(): Promise<string[]> {
    const database = this.db.getDb();
    const stmt = database.prepare('SELECT DISTINCT category FROM notes WHERE category IS NOT NULL ORDER BY category');
    const result = stmt.all() as any[];
    return result.map(r => r.category);
  }

  async getNoteById(id: number) {
    const database = this.db.getDb();
    
    const stmt = database.prepare(
      `SELECT n.*, GROUP_CONCAT(t.name) as tags
       FROM notes n
       LEFT JOIN note_tags nt ON n.id = nt.note_id
       LEFT JOIN tags t ON nt.tag_id = t.id
       WHERE n.id = ?
       GROUP BY n.id`
    );
    const note = stmt.get(id) as any;
    
    if (!note) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ 未找到ID为 ${id} 的笔记`,
          },
        ],
      };
    }
    
    let markdown = `# ${note.title}\n\n`;
    
    if (note.category) {
      markdown += `📁 **分类**: ${note.category}\n`;
    }
    
    if (note.tags) {
      markdown += `🏷️ **标签**: ${note.tags}\n`;
    }
    
    if (note.todo_id) {
      markdown += `🔗 **关联任务**: #${note.todo_id}\n`;
    }
    
    markdown += `\n---\n\n${note.content}\n\n---\n\n`;
    markdown += `📅 创建时间: ${note.created_at}\n`;
    markdown += `📝 最后更新: ${note.updated_at}`;
    
    return {
      content: [
        {
          type: 'text',
          text: markdown,
        },
      ],
    };
  }
}
