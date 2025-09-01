#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ReadResourceRequestSchema,
  Tool,
  Resource,
  Prompt,
  TextContent,
  ImageContent,
  EmbeddedResource,
} from '@modelcontextprotocol/sdk/types.js';
import { DatabaseManager } from './database.js';
import { TodoManager } from './todo.js';
import { NoteManager } from './notes.js';

class LearningMCPServer {
  private server: Server;
  private db: DatabaseManager;
  private todoManager: TodoManager;
  private noteManager: NoteManager;

  constructor() {
    this.server = new Server(
      {
        name: 'learning-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    this.db = new DatabaseManager();
    this.todoManager = new TodoManager(this.db);
    this.noteManager = new NoteManager(this.db);

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.getTools(),
    }));

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: await this.getResources(),
    }));

    // List available prompts
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => ({
      prompts: this.getPrompts(),
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      return await this.handleToolCall(request.params.name, request.params.arguments || {});
    });

    // Handle resource reads
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      return await this.handleResourceRead(request.params.uri);
    });

    // Handle prompt requests
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      return await this.handlePromptRequest(request.params.name, request.params.arguments || {});
    });
  }

  private getTools(): Tool[] {
    return [
      {
        name: 'todo_add',
        description: '添加新的学习任务',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: '任务标题' },
            description: { type: 'string', description: '任务描述' },
            priority: { 
              type: 'string', 
              enum: ['high', 'medium', 'low'],
              description: '优先级' 
            },
            category: { type: 'string', description: '分类（如：民法、深度学习等）' },
            due_date: { type: 'string', description: '截止日期 (YYYY-MM-DD)' },
          },
          required: ['title'],
        },
      },
      {
        name: 'todo_update',
        description: '更新任务状态或内容',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'number', description: '任务ID' },
            title: { type: 'string', description: '新标题' },
            description: { type: 'string', description: '新描述' },
            status: { 
              type: 'string',
              enum: ['pending', 'in_progress', 'completed', 'archived'],
              description: '任务状态'
            },
            priority: { 
              type: 'string',
              enum: ['high', 'medium', 'low'],
              description: '优先级'
            },
            progress: { type: 'number', description: '进度百分比 (0-100)' },
          },
          required: ['id'],
        },
      },
      {
        name: 'todo_list',
        description: '列出所有任务或按条件筛选',
        inputSchema: {
          type: 'object',
          properties: {
            status: { type: 'string', description: '筛选状态' },
            category: { type: 'string', description: '筛选分类' },
            priority: { type: 'string', description: '筛选优先级' },
          },
        },
      },
      {
        name: 'todo_delete',
        description: '删除任务',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'number', description: '任务ID' },
          },
          required: ['id'],
        },
      },
      {
        name: 'note_create',
        description: '创建新笔记',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: '笔记标题' },
            content: { type: 'string', description: '笔记内容（支持Markdown）' },
            category: { type: 'string', description: '分类' },
            tags: { 
              type: 'array',
              items: { type: 'string' },
              description: '标签列表'
            },
            todo_id: { type: 'number', description: '关联的任务ID' },
          },
          required: ['title', 'content'],
        },
      },
      {
        name: 'note_update',
        description: '更新笔记内容',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'number', description: '笔记ID' },
            title: { type: 'string', description: '新标题' },
            content: { type: 'string', description: '新内容' },
            append: { type: 'boolean', description: '是否追加到现有内容' },
          },
          required: ['id'],
        },
      },
      {
        name: 'note_list',
        description: '列出笔记',
        inputSchema: {
          type: 'object',
          properties: {
            category: { type: 'string', description: '筛选分类' },
            tag: { type: 'string', description: '筛选标签' },
            todo_id: { type: 'number', description: '筛选关联的任务' },
          },
        },
      },
      {
        name: 'note_search',
        description: '搜索笔记内容',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: '搜索关键词' },
          },
          required: ['query'],
        },
      },
      {
        name: 'summary_generate',
        description: '生成学习总结',
        inputSchema: {
          type: 'object',
          properties: {
            category: { type: 'string', description: '学习分类' },
            period: { type: 'string', description: '时间范围（如：today, week, month）' },
          },
        },
      },
    ];
  }

  private async getResources(): Promise<Resource[]> {
    const resources: Resource[] = [];
    
    // 添加任务清单资源
    resources.push({
      uri: 'todo://current',
      name: '当前任务清单',
      description: '查看所有未完成的学习任务',
      mimeType: 'text/markdown',
    });

    // 添加笔记资源
    const categories = await this.noteManager.getCategories();
    for (const category of categories) {
      resources.push({
        uri: `notes://category/${category}`,
        name: `${category} 笔记`,
        description: `查看 ${category} 分类下的所有笔记`,
        mimeType: 'text/markdown',
      });
    }

    return resources;
  }

  private getPrompts(): Prompt[] {
    return [
      {
        name: 'learning_plan',
        description: '生成学习计划',
        arguments: [
          {
            name: 'subject',
            description: '学习主题',
            required: true,
          },
          {
            name: 'duration',
            description: '学习周期（如：1周、1个月）',
            required: false,
          },
        ],
      },
      {
        name: 'review_progress',
        description: '回顾学习进度',
        arguments: [
          {
            name: 'category',
            description: '学习分类',
            required: false,
          },
        ],
      },
    ];
  }

  private async handleToolCall(name: string, args: any) {
    try {
      switch (name) {
        case 'todo_add':
          return await this.todoManager.addTodo(args);
        case 'todo_update':
          return await this.todoManager.updateTodo(args);
        case 'todo_list':
          return await this.todoManager.listTodos(args);
        case 'todo_delete':
          return await this.todoManager.deleteTodo(args.id);
        case 'note_create':
          return await this.noteManager.createNote(args);
        case 'note_update':
          return await this.noteManager.updateNote(args);
        case 'note_list':
          return await this.noteManager.listNotes(args);
        case 'note_search':
          return await this.noteManager.searchNotes(args.query);
        case 'summary_generate':
          return await this.generateSummary(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async handleResourceRead(uri: string) {
    try {
      if (uri === 'todo://current') {
        const todos = await this.todoManager.listTodos({ status: 'pending' });
        return {
          contents: [
            {
              uri,
              mimeType: 'text/markdown',
              text: todos.content[0].text,
            },
          ],
        };
      }

      if (uri.startsWith('notes://category/')) {
        const category = uri.replace('notes://category/', '');
        const notes = await this.noteManager.listNotes({ category });
        return {
          contents: [
            {
              uri,
              mimeType: 'text/markdown',
              text: notes.content[0].text,
            },
          ],
        };
      }

      throw new Error(`Unknown resource: ${uri}`);
    } catch (error) {
      return {
        contents: [
          {
            uri,
            mimeType: 'text/plain',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async handlePromptRequest(name: string, args: any) {
    switch (name) {
      case 'learning_plan':
        return {
          messages: [
            {
              role: 'user' as const,
              content: {
                type: 'text' as const,
                text: `请为我制定一个关于"${args.subject}"的学习计划${args.duration ? `，学习周期为${args.duration}` : ''}。请包括：
1. 学习目标
2. 阶段划分
3. 每个阶段的重点内容
4. 建议的学习资源
5. 评估方式

请使用 todo_add 工具将计划中的任务添加到任务清单中。`,
              },
            },
          ],
        };
      
      case 'review_progress':
        const todos = await this.todoManager.listTodos(args.category ? { category: args.category } : {});
        const notes = await this.noteManager.listNotes(args.category ? { category: args.category } : {});
        
        return {
          messages: [
            {
              role: 'user' as const,
              content: {
                type: 'text' as const,
                text: `请帮我回顾${args.category ? `"${args.category}"的` : ''}学习进度：

当前任务状态：
${todos.content[0].text}

已有笔记：
${notes.content[0].text}

请分析：
1. 已完成的内容
2. 正在进行的任务
3. 待开始的任务
4. 学习效果评估
5. 下一步建议`,
              },
            },
          ],
        };
      
      default:
        throw new Error(`Unknown prompt: ${name}`);
    }
  }

  private async generateSummary(args: { category?: string; period?: string }) {
    const todos = await this.todoManager.listTodos(args.category ? { category: args.category } : {});
    const notes = await this.noteManager.listNotes(args.category ? { category: args.category } : {});
    
    let summary = `# 学习总结\n\n`;
    if (args.category) {
      summary += `**分类**: ${args.category}\n`;
    }
    if (args.period) {
      summary += `**时间范围**: ${args.period}\n`;
    }
    summary += `\n## 任务完成情况\n\n${todos.content[0].text}\n\n`;
    summary += `## 学习笔记\n\n${notes.content[0].text}`;

    return {
      content: [
        {
          type: 'text',
          text: summary,
        },
      ],
    };
  }

  async start() {
    await this.db.initialize();
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Learning MCP Server started');
  }
}

const server = new LearningMCPServer();
server.start().catch(console.error);
