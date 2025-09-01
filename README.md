# Learning MCP Server

一个基于 Model Context Protocol (MCP) 的简洁学习管理服务器，专注于任务管理和学习进度跟踪。

## 🌟 功能特性

- ✅ **任务管理**：创建、更新、删除学习任务
- ✅ **批量操作**：一次性添加多个任务
- ✅ **进度跟踪**：任务状态和完成进度管理
- ✅ **优先级管理**：高/中/低优先级分类
- ✅ **持久化存储**：SQLite 数据库本地存储
- ✅ **跨平台支持**：本地运行 + 远程部署

## 🚀 快速开始

### 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 编译项目
npm run build

# 3. 测试功能
npx tsx test-final.ts
```

## 📱 客户端配置

### Cherry Studio（本地）

首先，你需要先克隆这个仓库到本地，然后到仓库目录下运行`npm install`和`npm run build`

然后在 Cherry Studio 的 MCP 配置中添加：

```json
{
  "mcpServers": {
    "learning-manager": {
      "command": "node",
      "args": ["/Users/你的用户名/Documents/Git/Todo&PlanMCP/dist/index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### Claude Desktop

1. 找到配置文件：
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

2. 添加服务器配置：

```json
{
  "mcpServers": {
    "learning-manager": {
      "command": "node",
      "args": ["/absolute/path/to/Todo-PlanMCP/dist/index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

## 🐳 Docker 部署

### 自动化部署流程

1. **推送代码到 GitHub** → GitHub Actions 自动构建 Docker 镜像
2. **VPS 拉取镜像** → 运行容器提供远程访问

### VPS 部署

```bash
# 拉取最新镜像
docker pull ghcr.io/你的GitHub用户名/todo-planmcp:latest

# 运行容器
docker run -d \
  --name learning-mcp \
  --restart unless-stopped \
  -p 3000:3000 \
  -v /opt/learning-mcp/data:/app/data \
  ghcr.io/你的GitHub用户名/todo-planmcp:latest
```

### 手机客户端配置

连接远程服务器：

```json
{
  "mcpServers": {
    "learning-manager": {
      "type": "sse",
      "url": "http://你的VPS-IP:3000"
    }
  }
}
```

## 🛠️ 可用工具

| 工具 | 描述 | 参数 |
|------|------|------|
| `todo_add` | 添加单个任务 | `title`, `priority` |
| `todo_add_batch` | 批量添加任务 | `todos[]` |
| `todo_list` | 查看任务列表 | `status?` |
| `todo_update` | 更新任务 | `id`, `status?`, `progress?` |
| `todo_delete` | 删除任务 | `id` |
| `summary_generate` | 生成学习总结 | `period?` |

## 📋 使用示例

### 基础任务管理
```
# 添加单个任务
请使用 todo_add 工具创建一个"学习 React Hooks"的高优先级任务

# 批量添加任务
请使用 todo_add_batch 工具批量创建以下任务：
- 学习 TypeScript 基础
- 练习算法题
- 阅读设计模式

# 查看任务列表
请调用 todo_list 工具显示我当前的学习任务

# 更新任务进度
请使用 todo_update 工具将任务1的状态改为"进行中"，进度设为30%
```

### Agent 对话开始模板
```
Agent: 让我先了解一下你当前的学习任务...
[调用 todo_list 工具]
Agent: 我看到你目前有3个进行中的任务，建议我们先完成...
```

## 🗂️ 项目结构

```
├── src/
│   ├── index.ts      # MCP 服务器主文件
│   ├── database.ts   # 数据库管理
│   └── todo.ts       # 任务管理
├── .github/workflows/
│   └── docker-build.yml  # GitHub Actions 自动构建
├── deploy/
│   └── vps-setup.md      # VPS 部署指南
├── Dockerfile            # Docker 镜像构建
├── docker-compose.yml    # 本地 Docker 测试
└── system-prompt-template.md  # Agent 系统提示词模板
```

## 🔄 部署选项

### 本地运行
- ✅ **桌面客户端**：Cherry Studio、Claude Desktop
- ✅ **即时响应**：本地进程，无网络延迟
- ✅ **数据私密**：所有数据存储在本地

### 远程部署
- ✅ **全球访问**：手机、平板等移动设备
- ✅ **数据同步**：多设备共享学习进度
- ✅ **自动化部署**：GitHub Actions + Docker

## 📚 相关文档

- [VPS 部署指南](deploy/vps-setup.md)
- [Agent 系统提示词模板](system-prompt-template.md)
- [Cherry Studio 配置示例](cherry-studio-config.json)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
