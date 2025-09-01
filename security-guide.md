# 🔒 VPS 部署安全指南

## 🎯 简单认证方案

### **自定义请求头认证**
使用 `X-MCP-Auth` 请求头作为简单的认证机制：

```bash
# 设置自定义令牌
export MCP_AUTH_TOKEN="你的超级秘密令牌123"
```

### **客户端配置**
在手机 chatbot 软件中添加自定义请求头：
```
X-MCP-Auth: 你的超级秘密令牌123
```

## ⚠️ 安全风险评估

### **低风险**（可接受）
- **功能有限**：只能管理 Todo，无法执行系统命令
- **数据隔离**：SQLite 本地存储，不连接外部系统
- **简单认证**：基础的令牌验证

### **中等风险**（需防护）
- **端口暴露**：3000 端口直接暴露到公网
- **无 HTTPS**：数据传输可能被窃听
- **令牌泄露**：如果令牌被截获可能被滥用

### **高风险**（必须避免）
- **无防火墙**：服务器完全开放
- **弱密码**：使用简单的认证令牌
- **无监控**：无法发现异常访问

## 🛡️ 推荐防护措施

### **1. 基础防护**
```bash
# 防火墙配置
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw deny 3000  # 禁止直接访问

# 只允许你的 IP
sudo ufw allow from YOUR_HOME_IP to any port 3000
```

### **2. Nginx 反向代理**
```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    location /mcp/ {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        
        # 限制请求大小
        client_max_body_size 1M;
        
        # 速率限制
        limit_req zone=mcp burst=10 nodelay;
    }
}
```

### **3. Docker 安全配置**
```yaml
# docker-compose.yml 安全版本
version: '3.8'
services:
  mcp-server:
    build: .
    environment:
      - MCP_AUTH_TOKEN=${MCP_AUTH_TOKEN}
    volumes:
      - ./data:/app/data:rw
    ports:
      - "127.0.0.1:3000:3000"  # 只绑定本地
    restart: unless-stopped
    security_opt:
      - no-new-privileges:true
    user: "1000:1000"  # 非 root 用户
```

## 📱 手机客户端配置示例

### **支持自定义请求头的 App**
- **HTTP Shortcuts**
- **Tasker + HTTP Request**
- **自定义 API 客户端**

### **配置示例**
```json
{
  "url": "https://your-domain.com/mcp",
  "headers": {
    "X-MCP-Auth": "你的超级秘密令牌123",
    "Content-Type": "application/json"
  }
}
```

## 🔍 风险等级评估

| 场景 | 风险等级 | 说明 |
|------|----------|------|
| 本地使用 | 🟢 低 | 完全安全，无网络暴露 |
| VPS + 认证 + 防火墙 | 🟡 中 | 基本安全，适合个人使用 |
| 公网直接暴露 | 🔴 高 | 不推荐，容易被攻击 |

## 💡 最佳实践建议

1. **使用强令牌**：至少 32 位随机字符
2. **定期更换**：每月更换认证令牌
3. **监控日志**：定期检查访问日志
4. **备份数据**：定期备份 SQLite 文件
5. **更新系统**：保持 VPS 系统更新

## 🚀 快速部署命令

```bash
# 生成强令牌
export MCP_AUTH_TOKEN=$(openssl rand -hex 32)

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```
