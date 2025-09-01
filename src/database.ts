import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class DatabaseManager {
  private db: Database.Database | null = null;
  private dbPath: string;

  constructor() {
    this.dbPath = path.join(__dirname, '..', 'data', 'learning.db');
  }

  async initialize() {
    // 确保数据目录存在
    const dataDir = path.dirname(this.dbPath);
    await fs.mkdir(dataDir, { recursive: true });

    // 打开数据库连接
    this.db = new Database(this.dbPath);
    
    // 使用 DELETE 模式确保立即同步，避免多实例冲突
    this.db.pragma('journal_mode = DELETE');
    this.db.pragma('synchronous = FULL');
    this.db.pragma('locking_mode = NORMAL');

    // 创建表
    this.createTables();
    // 迁移旧表结构：移除冗余列 description, category, due_date
    this.migrateSchema();
  }

  private createTables() {
    if (!this.db) throw new Error('Database not initialized');

    // 创建任务表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        priority TEXT DEFAULT 'medium',
        agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建笔记表（简化字段）
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  private migrateSchema() {
    if (!this.db) throw new Error('Database not initialized');
    // 检查当前列信息
    const columns = this.db.prepare("PRAGMA table_info('todos')").all() as Array<{ name: string }>;
    const hasDescription = columns.some(c => c.name === 'description');
    const hasCategory = columns.some(c => c.name === 'category');
    const hasDueDate = columns.some(c => c.name === 'due_date');
    const hasProgress = columns.some(c => c.name === 'progress');
    const hasAgent = columns.some(c => c.name === 'agent');
    const needsRebuild = hasDescription || hasCategory || hasDueDate || hasProgress;

    if (needsRebuild) {
      const tx = (this.db as Database.Database).transaction(() => {
        // 建立新表（包含 agent 列）
        this.db!.exec(`
          CREATE TABLE IF NOT EXISTS todos_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            priority TEXT DEFAULT 'medium',
            agent TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // 迁移数据（保留 agent 列若存在，否则置为 NULL）
        if (hasAgent) {
          this.db!.exec(`
            INSERT INTO todos_new (id, title, status, priority, agent, created_at, updated_at)
            SELECT id, title, status, priority, agent, created_at, updated_at FROM todos
          `);
        } else {
          this.db!.exec(`
            INSERT INTO todos_new (id, title, status, priority, agent, created_at, updated_at)
            SELECT id, title, status, priority, NULL as agent, created_at, updated_at FROM todos
          `);
        }

        // 替换旧表
        this.db!.exec('DROP TABLE todos');
        this.db!.exec('ALTER TABLE todos_new RENAME TO todos');
      });

      tx();
    } else if (!hasAgent) {
      // 无需重建，但缺少 agent 列，直接增加
      this.db.exec("ALTER TABLE todos ADD COLUMN agent TEXT");
    }

    // --- 笔记表迁移：为兼容老版本，如缺列则增列 ---
    try {
      const notesCols = this.db.prepare("PRAGMA table_info('notes')").all() as Array<{ name: string }>;
      if (Array.isArray(notesCols) && notesCols.length > 0) {
        const hasNoteAgent = notesCols.some(c => c.name === 'agent');
        const hasNoteCreated = notesCols.some(c => c.name === 'created_at');
        const hasNoteUpdated = notesCols.some(c => c.name === 'updated_at');
        const hasNoteTitle = notesCols.some(c => c.name === 'title');
        const hasNoteContent = notesCols.some(c => c.name === 'content');

        // 先补缺列，保证后续迁移 SELECT 可引用这些列
        if (!hasNoteAgent) {
          this.db.exec("ALTER TABLE notes ADD COLUMN agent TEXT");
        }
        if (!hasNoteCreated) {
          this.db.exec("ALTER TABLE notes ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP");
        }
        if (!hasNoteUpdated) {
          this.db.exec("ALTER TABLE notes ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP");
        }

        // 若存在旧版 title 列（且可能设置了 NOT NULL），重建为新结构并迁移数据
        if (hasNoteTitle) {
          const txNotes = (this.db as Database.Database).transaction(() => {
            this.db!.exec(`
              CREATE TABLE IF NOT EXISTS notes_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                content TEXT NOT NULL,
                agent TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
              )
            `);

            // 选择迁移内容表达式
            let contentExpr = "''";
            if (hasNoteContent && hasNoteTitle) {
              contentExpr = "CASE WHEN content IS NULL OR content='' THEN COALESCE(title, '') ELSE content END";
            } else if (hasNoteContent) {
              contentExpr = "COALESCE(content, '')";
            } else if (hasNoteTitle) {
              contentExpr = "COALESCE(title, '')";
            }

            this.db!.exec(`
              INSERT INTO notes_new (id, content, agent, created_at, updated_at)
              SELECT id,
                     ${contentExpr} AS content,
                     agent,
                     COALESCE(created_at, CURRENT_TIMESTAMP),
                     COALESCE(updated_at, CURRENT_TIMESTAMP)
              FROM notes
            `);

            this.db!.exec('DROP TABLE notes');
            this.db!.exec('ALTER TABLE notes_new RENAME TO notes');
          });
          txNotes();
        }
      }
    } catch (e) {
      // 忽略迁移异常，避免影响主流程
    }
  }

  getDb(): Database.Database {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
