#!/bin/bash

# 🚀 Learning MCP Server 一键部署脚本

set -e

echo "🚀 开始部署 Learning MCP Server..."

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "📦 安装 Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "✅ Docker 安装完成，请重新登录后再次运行此脚本"
    exit 1
fi

# 检查 Docker Compose 是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "📦 安装 Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# 设置简单认证令牌
echo "🔐 设置认证令牌..."
MCP_AUTH_TOKEN="my-simple-token"
echo "📝 认证令牌: $MCP_AUTH_TOKEN"

# 创建部署目录
DEPLOY_DIR="/opt/learning-mcp"
echo "📁 创建部署目录: $DEPLOY_DIR"
sudo mkdir -p $DEPLOY_DIR/data
sudo chown $USER:$USER $DEPLOY_DIR/data

# 创建 docker-compose.yml
echo "📄 创建 Docker Compose 配置..."
cat > $DEPLOY_DIR/docker-compose.yml << EOF
version: '3.8'
services:
  learning-mcp:
    image: ghcr.io/你的GitHub用户名/todo-planmcp:latest
    container_name: learning-mcp
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - MCP_AUTH_TOKEN=my-simple-token
      - NODE_ENV=production
    volumes:
      - ./data:/app/data
EOF


# 拉取并启动服务
echo "🐳 拉取 Docker 镜像..."
cd $DEPLOY_DIR
docker-compose pull

echo "🚀 启动服务..."
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

# 检查服务状态
if docker ps | grep -q learning-mcp; then
    echo "✅ 服务启动成功！"
    echo ""
    echo "📋 部署信息："
    echo "   - 服务地址: http://127.0.0.1:3000"
    echo "   - 认证令牌: $MCP_AUTH_TOKEN"
    echo "   - 数据目录: $DEPLOY_DIR/data"
    echo "   - 配置文件: $DEPLOY_DIR/docker-compose.yml"
    echo ""
    echo "📱 手机客户端配置："
    echo "   - URL: http://你的VPS-IP:3000"
    echo "   - 请求头: X-MCP-Auth: my-simple-token"
    echo ""
    echo "🔧 管理命令："
    echo "   - 查看日志: cd $DEPLOY_DIR && docker-compose logs -f"
    echo "   - 重启服务: cd $DEPLOY_DIR && docker-compose restart"
    echo "   - 停止服务: cd $DEPLOY_DIR && docker-compose down"
    echo "   - 更新镜像: cd $DEPLOY_DIR && docker-compose pull && docker-compose up -d"
else
    echo "❌ 服务启动失败，请检查日志："
    docker-compose logs
    exit 1
fi

echo ""
echo "🎉 部署完成！"
