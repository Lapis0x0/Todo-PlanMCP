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
