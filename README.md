# Todo & Plan MCP Server

一个基于 Model Context Protocol (MCP) 的简洁任务管理服务器，专注于任务管理和学习进度跟踪。

## 🌟 功能特性

- ✅ **任务管理**: 创建、更新、删除任务
- ✅ **批量操作**: 一次性添加多个任务
- ✅ **进度跟踪**: 任务状态和完成进度管理
- ✅ **优先级管理**: 高/中/低优先级分类
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
4.  **部署镜像**: 构建成功后，镜像会发布到 `ghcr.io/你的GitHub用户名/todo-planmcp:latest`。您可以使用此镜像在任何支持 Docker 的服务器上进行部署。

#### 部署方式二：手动部署到 VPS

您也可以在自己的 VPS 上手动部署服务。

1.  **准备环境**: 确保您的服务器已安装 Docker。
    ```bash
    # 安装 Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    ```

2.  **部署服务**:
    ```bash
    # 1. 创建目录
    mkdir Todo-Plan-MCP
    cd Todo-Plan-MCP
    
    # 2. 创建 docker-compose.yml 文件
    cat > docker-compose.yml << EOF
    version: '3.8'
    services:
      todo-plan-mcp:
        image: ghcr.io/你的GitHub用户名/todo-planmcp:latest # 使用您自己的镜像地址
        container_name: todo-plan-mcp
        restart: unless-stopped
        ports:
          - "3000:3000"
        environment:
          - MCP_AUTH_TOKEN=your-secret-token # 设置您的认证令牌
        volumes:
          - ./data:/app/data # 持久化数据
    EOF

    # 2. 启动服务
    docker-compose up -d
    ```

## ⚙️ 配置

### 安全认证

为保护您的服务，建议启用认证。

-   **服务器端**: 在启动 Docker 容器时，通过环境变量 `MCP_AUTH_TOKEN` 设置一个安全的认证令牌。
    ```yaml
    environment:
      - MCP_AUTH_TOKEN=your-secret-token
    ```
-   **客户端**: 在客户端 (如手机 App) 的请求头中添加 `X-MCP-Auth`，其值与服务器端设置的令牌保持一致。
    ```json
    "headers": {
      "X-MCP-Auth": "your-secret-token"
    }
    ```

### 客户端连接

#### 本地客户端 (Cherry Studio / Claude Desktop)

在客户端的 MCP 配置文件中添加本地命令启动。

```json
{
  "mcpServers": {
    "todo-plan-manager": {
      "command": "node",
      "args": ["/path/to/your/Todo&PlanMCP/dist/index.js"] // 请使用绝对路径（本地以 STDIO 模式运行，不要设置 NODE_ENV=production）
    }
  }
}
```

或者添加远程mcp实例

```json
{
  "mcpServers": {
    "todo-plan-manager": {
      "type": "streamableHttp",
      "url": "http://your-vps-ip:3000",
      "headers": {
        "X-MCP-Auth": "your-secret-token"
      }
    }
  }
}
```

> 提示：
> - 本地（STDIO 模式）请勿设置 `NODE_ENV=production` 或 `MCP_HTTP_MODE=true`，否则会改为 HTTP 模式，导致本地客户端无法通过 STDIO 连接。
> - 远程（HTTP 模式）请确保服务端已暴露 3000 端口，并在客户端正确设置 `X-MCP-Auth` 头部。

#### 远程客户端 (手机 App)

配置 URL 和认证头以连接到您的远程服务器。

```json
{
  "mcpServers": {
    "todo-plan-manager": {
      "type": "streamableHttp",
      "url": "http://your-vps-ip:3000",
      "headers": {
        "X-MCP-Auth": "your-secret-token"
      }
    }
  }
}
```

## 🛠️ API 参考

| 工具 | 描述 | 参数 |
| :--- | :--- | :--- |
| `todo_add` | 添加单个任务 | `title`, `priority` |
| `todo_add_batch` | 批量添加任务 | `todos[]` |
| `todo_list` | 查看任务列表 | `status?` |
| `todo_update` | 更新任务 | `id`, `status?`, `progress?` |
| `todo_delete` | 删除任务 | `id` |

## 📋 使用示例

```
# 添加任务
> 请使用 todo_add 工具创建一个"学习 React Hooks"的高优先级任务

# 查看任务
> 请调用 todo_list 工具显示我当前的学习任务

# 更新任务
> 请使用 todo_update 工具将任务1的状态改为"进行中"，进度设为30%
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
