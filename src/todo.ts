import { DatabaseManager } from './database.js';

export interface Todo {
  id?: number;
  title: string;
  status?: string;
  priority?: string;
  created_at?: string;
  updated_at?: string;
}

export class TodoManager {
  constructor(private db: DatabaseManager) {}

  async addTodo(todo: Todo) {
    const database = this.db.getDb();
    
    const stmt = database.prepare(
      `INSERT INTO todos (title, status, priority)
       VALUES (?, ?, ?)`
    );
    
    const result = stmt.run(
      todo.title,
      todo.status || 'pending',
      todo.priority || 'medium'
    );

    const newTodo = database.prepare('SELECT * FROM todos WHERE id = ?').get(result.lastInsertRowid) as any;

    return {
      content: [
        {
          type: 'text',
          text: `✅ 任务已创建：\n\n**${newTodo.title}**\n- ID: ${newTodo.id}\n- 优先级: ${newTodo.priority}\n- 状态: ${newTodo.status}`,
        },
      ],
    };
  }

  async addTodos(todos: Todo[]) {
    const database = this.db.getDb();
    
    const stmt = database.prepare(
      `INSERT INTO todos (title, status, priority)
       VALUES (?, ?, ?)`
    );
    
    const transaction = database.transaction((todoList: Todo[]) => {
      const results = [];
      for (const todo of todoList) {
        const result = stmt.run(
          todo.title,
          todo.status || 'pending',
          todo.priority || 'medium'
        );
        results.push(result.lastInsertRowid);
      }
      return results;
    });
    
    const insertedIds = transaction(todos);
    
    return {
      content: [
        {
          type: 'text',
          text: `✅ 批量创建了 ${todos.length} 个任务：\n\n${todos.map((todo, index) => `${index + 1}. **${todo.title}** (${todo.priority || 'medium'} 优先级)`).join('\n')}\n\n📝 使用 list_todos 查看完整列表`,
        },
      ],
    };
  }

  async updateTodo(params: { id: number; [key: string]: any }) {
    const database = this.db.getDb();
    
    const updates: string[] = [];
    const values: any[] = [];
    
    const allowedFields = ['title', 'status', 'priority'];
    
    for (const field of allowedFields) {
      if (params[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(params[field]);
      }
    }
    
    if (updates.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: '⚠️ 没有提供要更新的字段',
          },
        ],
      };
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(params.id);
    
    const stmt = database.prepare(`UPDATE todos SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...values);
    
    const updatedTodo = database.prepare('SELECT * FROM todos WHERE id = ?').get(params.id) as any;
    
    if (!updatedTodo) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ 未找到ID为 ${params.id} 的任务`,
          },
        ],
      };
    }
    
    return {
      content: [
        {
          type: 'text',
          text: `✅ 任务已更新：\n\n**${updatedTodo.title}**\n- ID: ${updatedTodo.id}\n- 优先级: ${updatedTodo.priority}\n- 状态: ${updatedTodo.status}`,
        },
      ],
    };
  }

  async listTodos(filters: { status?: string; priority?: string } = {}) {
    const database = this.db.getDb();
    
    let query = 'SELECT * FROM todos WHERE 1=1';
    const params: any[] = [];
    
    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    
    if (filters.priority) {
      query += ' AND priority = ?';
      params.push(filters.priority);
    }
    
    query += ' ORDER BY CASE priority WHEN \'high\' THEN 1 WHEN \'medium\' THEN 2 WHEN \'low\' THEN 3 END, created_at DESC';
    
    const stmt = database.prepare(query);
    const todos = stmt.all(...params);
    
    if (todos.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: '📋 暂无任务',
          },
        ],
      };
    }
    
    let markdown = '# 📋 任务清单\n\n';
    
    // 按状态分组
    const grouped = {
      pending: todos.filter((t: any) => t.status === 'pending'),
      in_progress: todos.filter((t: any) => t.status === 'in_progress'),
      completed: todos.filter((t: any) => t.status === 'completed'),
      archived: todos.filter((t: any) => t.status === 'archived'),
    };
    
    if (grouped.in_progress.length > 0) {
      markdown += '## 🚀 进行中\n\n';
      for (const todo of grouped.in_progress) {
        markdown += this.formatTodo(todo);
      }
    }
    
    if (grouped.pending.length > 0) {
      markdown += '## 📝 待处理\n\n';
      for (const todo of grouped.pending) {
        markdown += this.formatTodo(todo);
      }
    }
    
    if (grouped.completed.length > 0) {
      markdown += '## ✅ 已完成\n\n';
      for (const todo of grouped.completed) {
        markdown += this.formatTodo(todo);
      }
    }
    
    if (grouped.archived.length > 0) {
      markdown += '## 📦 已归档\n\n';
      for (const todo of grouped.archived) {
        markdown += this.formatTodo(todo);
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

  private formatTodo(todo: any): string {
    const priorityEmoji = {
      high: '🔴',
      medium: '🟡',
      low: '🟢',
    }[todo.priority as 'high' | 'medium' | 'low'] || '⚪';
    
    let formatted = `### ${priorityEmoji} [${todo.id}] ${todo.title}\n\n`;
    
    formatted += `- **状态**: ${todo.status}\n`;
    formatted += `- **优先级**: ${todo.priority}\n`;
    formatted += `- **创建时间**: ${todo.created_at}\n\n---\n\n`;
    
    return formatted;
  }

  async deleteTodo(id: number) {
    const database = this.db.getDb();
    
    const todo = database.prepare('SELECT * FROM todos WHERE id = ?').get(id) as any;
    
    if (!todo) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ 未找到ID为 ${id} 的任务`,
          },
        ],
      };
    }
    
    const stmt = database.prepare('DELETE FROM todos WHERE id = ?');
    const result = stmt.run(id);
    
    // 强制同步到磁盘
    try {
      database.pragma('wal_checkpoint(TRUNCATE)');
    } catch (e) {
      // WAL 模式可能未启用，忽略错误
    }
    
    return {
      content: [
        {
          type: 'text',
          text: `✅ 已删除任务：${todo.title} (影响行数: ${result.changes})`,
        },
      ],
    };
  }
}
