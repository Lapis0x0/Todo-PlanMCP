#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import express from 'express';
import cors from 'cors';
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

export class LearningMCPServer {
  private server: Server;
  private db: DatabaseManager;
  private todoManager: TodoManager;
  private authToken: string;

  constructor() {
    // 从环境变量读取认证令牌，如果没有则使用默认值
    this.authToken = process.env.MCP_AUTH_TOKEN || 'mcp-learning-2025';
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
      // 从请求中提取 headers（如果支持的话）
      const headers = (request as any).headers;
      return await this.callTool(request.params.name, request.params.arguments || {}, headers);
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
            priority: { 
              type: 'string', 
              enum: ['high', 'medium', 'low'],
              description: '优先级' 
            },
          },
          required: ['title'],
        },
      },
      {
        name: 'todo_add_batch',
        description: '批量添加多个学习任务（适合对话开始时制定学习清单）',
        inputSchema: {
          type: 'object',
          properties: {
            todos: {
              type: 'array',
              description: '任务列表',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string', description: '任务标题' },
                  priority: { 
                    type: 'string', 
                    enum: ['high', 'medium', 'low'],
                    description: '优先级' 
                  },
                },
                required: ['title'],
              },
            },
          },
          required: ['todos'],
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


    return resources;
  }

  private getPrompts(): Prompt[] {
    return [
      {
        name: 'learning_plan',
        description: '生成学习计划',
        arguments: [
          {
            name: 'topic',
            description: '学习主题',
            required: true,
          },
          {
            name: 'duration',
            description: '学习时长（小时）',
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

  private validateAuth(headers?: Record<string, string>): boolean {
    if (!headers) return false;
    
    const authHeader = headers['x-mcp-auth'] || headers['X-MCP-Auth'];
    return authHeader === this.authToken;
  }

  private async callTool(name: string, args: any, headers?: Record<string, string>) {
    // 验证认证令牌
    if (!this.validateAuth(headers)) {
      return {
        content: [
          {
            type: 'text',
            text: '❌ 认证失败：请在请求头中添加正确的 X-MCP-Auth 令牌',
          },
        ],
      };
    }
    
    try {
      switch (name) {
        case 'todo_add':
          return await this.todoManager.addTodo(args);
        case 'todo_add_batch':
          return await this.todoManager.addTodos(args.todos);
        case 'todo_update':
          return await this.todoManager.updateTodo(args);
        case 'todo_list':
          return await this.todoManager.listTodos({});
        case 'todo_delete':
          return await this.todoManager.deleteTodo(args.id);
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
      if (uri === 'todo://completed') {
        const todos = await this.todoManager.listTodos({ status: 'completed' });
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
                text: `请为我制定一个关于"${args.topic}"的学习计划${args.duration ? `，学习周期为${args.duration}` : ''}。请包括：
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
        const todos = await this.todoManager.listTodos({});
        
        return {
          messages: [
            {
              role: 'user' as const,
              content: {
                type: 'text' as const,
                text: `请帮我回顾学习进度：

当前任务状态：
${todos.content[0].text}

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


  async start() {
    await this.db.initialize();

    const port = Number(process.env.PORT || process.env.MCP_PORT || 3000);
    const host = process.env.MCP_HOST || '0.0.0.0';
    const isHttpMode = process.env.NODE_ENV === 'production' || process.env.MCP_HTTP_MODE === 'true';

    if (isHttpMode) {
      const app = express();
      app.use(cors());
      app.use(express.json());

      // 健康检查端点（无需认证）
      app.get('/health', (_req, res) => {
        res.json({ status: 'ok', server: 'learning-mcp-server' });
      });

      // 认证中间件
      const authenticate: express.RequestHandler = (req, res, next) => {
        const token = (req.headers['x-mcp-auth'] || req.headers['X-MCP-Auth']) as string | undefined;
        if (token !== this.authToken) {
          return res.status(401).json({ error: '认证失败：请在请求头中添加正确的 X-MCP-Auth 令牌' });
        }
        next();
      };

      // MCP JSON-RPC 2.0 根端点
      app.post('/', authenticate, async (req, res) => {
        try {
          const { id, method, params } = req.body || {};
          switch (method) {
            case 'initialize': {
              // MCP 客户端握手初始化
              const clientProtocol = params?.protocolVersion;
              const protocolVersion = typeof clientProtocol === 'string' && clientProtocol.trim() !== ''
                ? clientProtocol
                : '1.0'; // 兼容常见客户端期望的版本，如不提供则回退到 1.0
              return res.json({
                jsonrpc: '2.0',
                id,
                result: {
                  protocolVersion,
                  serverInfo: { name: 'learning-mcp-server', version: '1.0.0' },
                  capabilities: { tools: {}, resources: {}, prompts: {} },
                },
              });
            }
            case 'ping': {
              return res.json({ jsonrpc: '2.0', id, result: { ok: true } });
            }
            case 'tools/list':
              return res.json({ jsonrpc: '2.0', id, result: { tools: this.getTools() } });
            case 'tools/call': {
              const result = await this.callTool(params?.name, params?.arguments || {}, req.headers as any);
              return res.json({ jsonrpc: '2.0', id, result });
            }
            case 'resources/list': {
              const resources = await this.getResources();
              return res.json({ jsonrpc: '2.0', id, result: { resources } });
            }
            case 'resources/read': {
              const result = await this.handleResourceRead(params?.uri);
              return res.json({ jsonrpc: '2.0', id, result });
            }
            case 'prompts/list':
              return res.json({ jsonrpc: '2.0', id, result: { prompts: this.getPrompts() } });
            case 'prompts/get': {
              const result = await this.handlePromptRequest(params?.name, params?.arguments || {});
              return res.json({ jsonrpc: '2.0', id, result });
            }
            default:
              return res.status(400).json({ jsonrpc: '2.0', id, error: { code: -32601, message: `Unknown method: ${method}` } });
          }
        } catch (err) {
          return res.status(500).json({ jsonrpc: '2.0', error: { code: -32603, message: (err as Error).message } });
        }
      });

      app.listen(port, host, () => {
        if (process.env.MCP_AUTH_TOKEN) {
          console.error('🔐 使用自定义认证令牌');
        } else {
          console.error('🔐 使用默认认证令牌: mcp-learning-2025');
          console.error('💡 建议设置环境变量 MCP_AUTH_TOKEN 使用自定义令牌');
        }
        console.error(`🚀 HTTP 模式已启动: http://${host}:${port}`);
      });
      return;
    }

    // 本地 CLI/STDIO 模式
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    if (process.env.MCP_AUTH_TOKEN) {
      console.error('🔐 使用自定义认证令牌');
    } else {
      console.error('🔐 使用默认认证令牌: mcp-learning-2025');
      console.error('💡 建议设置环境变量 MCP_AUTH_TOKEN 使用自定义令牌');
    }
    console.error('🚀 Learning MCP Server started (STDIO mode)');
  }
}

const server = new LearningMCPServer();
server.start().catch(console.error);
