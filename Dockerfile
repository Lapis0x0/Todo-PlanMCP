# 使用官方 Node.js 运行时作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY dist/ ./dist/
COPY src/ ./src/

# 创建数据目录
RUN mkdir -p /app/data

# 设置数据目录权限
RUN chmod 755 /app/data

# 暴露端口（如果需要 HTTP 接口）
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production
ENV DATA_PATH=/app/data

# 启动命令
CMD ["node", "dist/index.js"]
