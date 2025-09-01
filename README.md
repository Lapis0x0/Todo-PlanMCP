# Todo&Plan MCP Server

一个基于 Model Context Protocol (MCP) 的简洁任务管理服务器，专注于任务管理和学习进度跟踪。

## 🌟 功能特性

- ✅ **任务管理**：创建、更新、删除任务
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
    "todo-plan-manager": {
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
    "todo-plan-manager": {
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

### GitHub Actions 自动构建

项目已配置 GitHub Actions，每次推送代码会自动构建 Docker 镜像：

1. **Fork 这个仓库**到你的 GitHub 账号
2. **推送代码**触发自动构建
3. **镜像发布**到 GitHub Container Registry

### VPS 部署步骤

#### 1. 准备 VPS 环境
```bash
# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 创建数据目录
sudo mkdir -p /opt/learning-mcp/data
sudo chmod 755 /opt/learning-mcp/data
```

#### 2. 部署服务
```bash
# 设置认证令牌
export MCP_AUTH_TOKEN="my-simple-token"

# 拉取并运行容器
docker pull ghcr.io/你的GitHub用户名/todo-planmcp:latest

docker run -d \
  --name learning-mcp \
  --restart unless-stopped \
  -p 3000:3000 \
  -e MCP_AUTH_TOKEN="$MCP_AUTH_TOKEN" \
  -v /opt/learning-mcp/data:/app/data \
  ghcr.io/你的GitHub用户名/todo-planmcp:latest
```


### 🔐 安全认证配置

#### 服务器端
```bash
# 设置认证令牌（任意字符串）
export MCP_AUTH_TOKEN="my-simple-token"

# 或在 docker-compose.yml 中设置
environment:
  - MCP_AUTH_TOKEN=my-simple-token
```

#### 手机客户端
在支持自定义请求头的 chatbot 软件中添加：
```
X-MCP-Auth: my-simple-token
```

### 📱 手机访问配置

连接远程服务器（需要支持自定义请求头的客户端）：

```json
{
  "url": "http://你的VPS-IP:3000",
  "headers": {
    "X-MCP-Auth": "my-simple-token",
    "Content-Type": "application/json"
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

## 🚀 GitHub Actions 自动部署

### 配置步骤

1. **Fork 仓库**到你的 GitHub 账号
2. **设置 Secrets**（可选）：
   - 进入仓库 Settings → Secrets and variables → Actions
   - 添加 `DOCKER_TOKEN` 用于自定义镜像名称

3. **推送代码**触发自动构建：
```bash
git add .
git commit -m "deploy: 更新配置"
git push origin main
```

4. **查看构建状态**：
   - 进入 Actions 标签页
   - 查看 "Build and Push Docker Image" 工作流
   - 构建完成后镜像会发布到 `ghcr.io/你的用户名/todo-planmcp:latest`

### 自动化流程
```
代码推送 → GitHub Actions → Docker 构建 → 镜像发布 → VPS 部署
```

### 构建产物
- **Docker 镜像**：`ghcr.io/你的用户名/todo-planmcp:latest`
- **多架构支持**：linux/amd64, linux/arm64
- **自动标签**：latest + git commit hash

## 🐳 Docker 部署详解

### 快速部署（推荐）
```bash
# 一键部署脚本
wget -O deploy.sh https://raw.githubusercontent.com/你的用户名/Todo-PlanMCP/main/deploy/quick-deploy.sh
chmod +x deploy.sh
./deploy.sh
```

### 手动部署
```bash
# 1. 设置认证令牌
export MCP_AUTH_TOKEN="my-simple-token"

# 2. 创建 docker-compose.yml
cat > docker-compose.yml << EOF
version: '3.8'
services:
  learning-mcp:
    image: ghcr.io/你的用户名/todo-planmcp:latest
    container_name: learning-mcp
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - MCP_AUTH_TOKEN=my-simple-token
    volumes:
      - ./data:/app/data
EOF

# 3. 启动服务
docker-compose up -d

# 4. 查看日志
docker-compose logs -f
```

### 服务管理
```bash
# 查看状态
docker ps

# 查看日志
docker logs learning-mcp

# 重启服务
docker restart learning-mcp

# 更新镜像
docker pull ghcr.io/你的用户名/todo-planmcp:latest
docker-compose up -d

# 备份数据
tar -czf learning-mcp-backup-$(date +%Y%m%d).tar.gz data/
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

## 🔄 部署架构对比

| 特性 | 本地运行 | 远程部署 |
|------|----------|----------|
| **客户端** | Cherry Studio, Claude Desktop | 手机 chatbot 软件 |
| **响应速度** | ⚡ 即时 | 🌐 网络延迟 |
| **数据安全** | 🔒 完全私密 | 🛡️ 需要认证 |
| **设备访问** | 💻 单设备 | 📱 多设备同步 |
| **部署难度** | 🟢 简单 | 🟡 中等 |
| **维护成本** | 🟢 无 | 🟡 需要 VPS |

## 📚 相关文档

- [🔒 安全部署指南](security-guide.md)
- [🛠️ VPS 部署指南](deploy/vps-setup.md)
- [🤖 Agent 系统提示词模板](system-prompt-template.md)
- [⚙️ Cherry Studio 配置示例](cherry-studio-config.json)

## 💡 使用提示

- **认证令牌**：在环境变量中设置任意字符串作为 `MCP_AUTH_TOKEN`
- **手机访问**：在 chatbot 软件中添加请求头 `X-MCP-Auth`
- **数据备份**：定期备份 `data/` 目录中的 SQLite 文件

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
