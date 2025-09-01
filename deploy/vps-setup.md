# VPS 部署指南

## 自动化部署流程

### 1. GitHub Actions 自动构建
每次推送代码到 main 分支时，GitHub Actions 会：
- 自动编译 TypeScript
- 构建 Docker 镜像
- 推送到 GitHub Container Registry

### 2. VPS 拉取和运行

在你的 VPS 上执行：

```bash
# 1. 拉取最新镜像
docker pull ghcr.io/你的用户名/todo-planmcp:latest

# 2. 停止旧容器（如果存在）
docker stop learning-mcp || true
docker rm learning-mcp || true

# 3. 运行新容器
docker run -d \
  --name learning-mcp \
  --restart unless-stopped \
  -p 3000:3000 \
  -v /opt/learning-mcp/data:/app/data \
  ghcr.io/你的用户名/todo-planmcp:latest

# 4. 检查运行状态
docker logs learning-mcp
```

### 3. 手机客户端配置

在手机 Cherry Studio 中配置：

```json
{
  "mcpServers": {
    "learning-manager": {
      "type": "sse",
      "url": "http://你的VPS-IP:3000",
      "headers": {
        "Content-Type": "application/json"
      }
    }
  }
}
```

## 一键部署脚本

创建 `deploy.sh` 脚本：

```bash
#!/bin/bash
IMAGE_NAME="ghcr.io/你的用户名/todo-planmcp:latest"

echo "🚀 部署 Learning MCP Server..."

# 拉取最新镜像
docker pull $IMAGE_NAME

# 停止旧服务
docker stop learning-mcp 2>/dev/null || true
docker rm learning-mcp 2>/dev/null || true

# 启动新服务
docker run -d \
  --name learning-mcp \
  --restart unless-stopped \
  -p 3000:3000 \
  -v /opt/learning-mcp/data:/app/data \
  $IMAGE_NAME

echo "✅ 部署完成！"
echo "📱 手机可通过 http://$(curl -s ifconfig.me):3000 访问"
```

## 数据持久化

- 数据存储在 `/opt/learning-mcp/data` 目录
- 容器重启不会丢失学习数据
- 建议定期备份该目录
