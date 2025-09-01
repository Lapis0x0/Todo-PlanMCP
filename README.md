# Todo & Plan MCP Server

一个基于 Model Context Protocol (MCP) 的简洁任务管理服务器，专注于任务管理和学习进度跟踪。

## 🌟 功能特性

- ✅ **任务管理**: 创建、更新、删除任务
- ✅ **批量操作**: 一次性添加多个任务
- ✅ **状态管理**: 任务状态流转（pending / in_progress / completed / archived）
- ✅ **优先级管理**: 高/中/低优先级分类
- ✅ **多 Agent 支持**: 通过可选 `agent` 字段隔离不同 Agent 的任务列表
- ✅ **持久化存储**: SQLite 数据库本地存储
- ✅ **跨平台支持**: 本地运行 + 远程部署

## 🚀 快速开始

本指南将帮助您在本地或远程服务器上设置和运行此项目。

### 1. 本地开发

在您的本地机器上运行服务器。

1.  **安装依赖**
    ```bash
    npm install
    ```

2.  **编译项目**
    ```bash
    npm run build
    ```

3.  **运行测试 (可选)**
    ```bash
    npx tsx test-final.ts
    ```

### 2. 远程部署 (Docker)

我们推荐使用 Docker 进行远程部署，它提供了稳定和可移植的运行环境。

#### 部署方式一：使用 GitHub Actions 自动部署 (推荐)

每次您推送代码到 `main` 分支时，GitHub Actions 会自动构建并发布 Docker 镜像到 GitHub Container Registry (ghcr.io)。

1.  **Fork 本仓库** 到您的 GitHub 账户。
2.  **推送代码**: 对代码进行任何修改后，推送到您自己仓库的 `main` 分支。
    ```bash
    git push origin main
    ```
3.  **检查构建**: 在仓库的 `Actions` 标签页下，您可以看到 `Build and Push Docker Image` 工作流的运行状态。
4.  **部署镜像**: 构建成功后，镜像会发布到 `ghcr.io/你的GitHub用户名/todo-planmcp`。我们推荐使用 `:main` 标签，因为它总是对应 `main` 分支的最新代码。 `:latest` 标签仅在特定条件下更新，可能不是最新的。

#### 部署方式二：手动部署到 VPS

您也可以在自己的 VPS 上手动部署服务。

1.  **准备环境**: 确保您的服务器已安装 Docker 和 Docker Compose。
    ```bash
    # 安装 Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    # 安装 Docker Compose
    sudo apt-get update && sudo apt-get install -y docker-compose-plugin
    ```

2.  **创建 `docker-compose.yml`**:
    在您的服务器上创建一个目录，并在其中创建 `docker-compose.yml` 文件。
    ```bash
    mkdir -p /opt/todo-plan-mcp && cd /opt/todo-plan-mcp
    ```
    ```yaml
    # docker-compose.yml
    version: '3.8'
    services:
      todo-plan-mcp:
        # 推荐使用 :main 标签来获取最新的稳定构建
        image: ghcr.io/lapis0x0/todo-planmcp:main
        container_name: todo-plan-mcp
        restart: unless-stopped
        ports:
          - "3002:3000"
        environment:
          # 必须：用于客户端认证的安全令牌
          - MCP_AUTH_TOKEN=your-secret-token
          # 可选：确保服务在 HTTP 模式下运行
          - NODE_ENV=production
          - MCP_HOST=0.0.0.0
          - MCP_PORT=3000
        volumes:
          # 将数据库文件持久化到宿主机
          - ./data:/app/data
        healthcheck:
          # 检查服务是否仍在运行
          test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
          interval: 1m30s
          timeout: 10s
          retries: 3
    ```

3.  **启动服务**:
    ```bash
    docker compose up -d
    ```

4.  **更新服务**:
    当您想更新到最新版本时，执行以下命令：
    ```bash
    # 拉取最新的镜像
    docker compose pull
    # 强制重新创建容器以应用更新
    docker compose up -d --force-recreate
    ```

### 3. 快速验证

部署后，您可以使用 `curl` 快速检查服务是否正常工作。请将 `your-vps-ip` 和 `your-secret-token` 替换为您的实际值。

1.  **健康检查** (预期 HTTP 200 OK)
    ```bash
    curl -i http://your-vps-ip:3002/health
    ```

2.  **MCP Initialize** (预期返回 JSON-RPC 结果)
    ```bash
    curl -i -sS -H 'Content-Type: application/json' \
      -H 'X-MCP-Auth: your-secret-token' \
      -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"1.0"}}' \
      http://your-vps-ip:3002/
    ```

3.  **MCP Notification** (预期 HTTP 204 No Content)
    ```bash
    curl -i -sS -H 'Content-Type: application/json' \
      -H 'X-MCP-Auth: your-secret-token' \
      -d '{"jsonrpc":"2.0","method":"notifications/initialized","params":{}}' \
      http://your-vps-ip:3002/
    ```

4.  **工具列表** (预期返回 `todo_` 系列工具)
    ```bash
    curl -sS -H 'Content-Type: application/json' \
      -H 'X-MCP-Auth: your-secret-token' \
      -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
      http://your-vps-ip:3002/
    ```

## ⚙️ 客户端配置 (Cherry Studio)

### 模式一：本地开发 (STDIO)

用于本地开发和调试，客户端直接通过标准输入/输出与 `index.js` 脚本通信。

**配置:**
```json
{
  "mcpServers": {
    "todo-plan-manager-local": {
      "command": "node",
      "args": [
        "/path/to/your/Todo&PlanMCP/dist/index.js"
      ],
      "cwd": "/path/to/your/Todo&PlanMCP"
    }
  }
}
```
> **注意**: 请确保使用您项目在本地的 **绝对路径**。此模式下 **不要** 设置 `NODE_ENV=production`，否则服务会切换到 HTTP 模式。

### 模式二：远程连接 (HTTP)

用于连接已部署在服务器上的服务。

**配置:**
```json
{
  "mcpServers": {
    "todo-plan-manager-remote": {
      "type": "streamableHttp",
      "url": "http://your-vps-ip:3002",
      "headers": {
        "X-MCP-Auth": "your-secret-token"
      }
    }
  }
}
```
> **注意**: `url` 和 `X-MCP-Auth` 的值必须与您服务器的配置匹配。

## 🛠️ API 参考

| 工具 | 描述 | 参数 |
| :--- | :--- | :--- |
| `todo_add` | 添加单个任务 | `title`, `priority?`, `agent?` |
| `todo_add_batch` | 批量添加任务 | `todos[]`（每项：`title`, `priority?`, `agent?`） |
| `todo_list` | 查看任务列表 | `status?`, `priority?`, `agent?` |
| `todo_update` | 更新任务 | `id`, `title?`, `status?`, `priority?`, `agent?` |
| `todo_delete` | 删除任务 | `id` |

### 使用示例

```bash
# 添加任务（指定 Agent）
> 请使用 todo_add 工具创建一个"学习 React Hooks"的高优先级任务，agent=agent_1

# 查看任务（按 Agent / 状态过滤）
> 请调用 todo_list 工具，筛选 agent=agent_1，status=pending 的任务

# 更新任务（修改状态或优先级或 Agent）
> 请使用 todo_update 工具将任务 1 的状态改为 "in_progress"
```

## 🗂️ 项目结构

```
├── src/                # 源代码目录
│   ├── index.ts        # MCP 服务器主文件
│   ├── database.ts     # 数据库管理
│   └── todo.ts         # 任务管理逻辑
├── .github/workflows/  # GitHub Actions CI/CD
│   └── docker-build.yml
├── deploy/             # 部署相关脚本和文档
├── Dockerfile          # Docker 镜像构建文件
├── docker-compose.yml  # Docker Compose 配置文件
└── ...
```

## 🤝 贡献

欢迎通过提交 Issue 或 Pull Request 来为项目做出贡献。

## 📄 许可证

[MIT](LICENSE)
