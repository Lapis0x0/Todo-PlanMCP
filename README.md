# Learning MCP Server - 学习管理 MCP 服务器

一个基于 MCP (Model Context Protocol) 的学习管理服务器，让 AI Agent 能够自主维护学习任务和笔记。

## 功能特性

### 📋 任务管理
- **添加任务** (`todo_add`): 创建新的学习任务，支持设置优先级、分类、截止日期
- **更新任务** (`todo_update`): 修改任务状态、进度、内容等
- **查看任务** (`todo_list`): 按状态、分类、优先级筛选查看任务
- **删除任务** (`todo_delete`): 删除不需要的任务

### 📚 笔记管理
- **创建笔记** (`note_create`): 创建学习笔记，支持 Markdown 格式、标签、关联任务
- **更新笔记** (`note_update`): 修改或追加笔记内容
- **查看笔记** (`note_list`): 按分类、标签筛选笔记
- **搜索笔记** (`note_search`): 全文搜索笔记内容

### 📊 学习总结

## 安装

```bash
# 克隆仓库
git clone https://github.com/yourusername/Todo-PlanMCP.git
cd Todo-PlanMCP

# 安装依赖
npm install

# 编译 TypeScript
npm run build
```

## 配置

### Claude Desktop 配置

1. 找到 Claude Desktop 的配置文件：
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - Linux: `~/.config/Claude/claude_desktop_config.json`

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

3. 重启 Claude Desktop 应用

### 其他 MCP 客户端配置

参考 `mcp-config.json` 文件中的示例配置。

## 使用示例

### 创建学习任务
```
使用 todo_add 工具创建一个学习深度学习的任务，优先级高，分类为"深度学习"
```

### 添加学习笔记
```
使用 note_create 工具创建一个关于卷积神经网络的笔记，标签包括"CNN"、"计算机视觉"
```

### 查看当前进度
```
使用 todo_list 工具查看所有进行中的任务
```

### 搜索知识点
```
使用 note_search 工具搜索"反向传播"相关的笔记
```

### 生成学习计划
```
使用 learning_plan prompt 为我制定一个学习量化交易的计划
```

## 数据存储

所有数据存储在本地 SQLite 数据库中：
- 位置：`data/learning.db`
- 包含：任务、笔记、标签、学习记录等表

## 开发模式

```bash
npm run dev
```

使用 tsx 监听文件变化，自动重新加载。

## 技术栈

- TypeScript
- MCP SDK
- SQLite (数据存储)
- Marked (Markdown 解析)

## 许可证

MIT
