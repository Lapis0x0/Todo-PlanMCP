#!/bin/bash

# MCP 学习管理服务器启动脚本

echo "🚀 启动 MCP 学习管理服务器..."

# 检查是否已经编译
if [ ! -d "dist" ]; then
    echo "📦 首次运行，正在编译..."
    npm run build
fi

# 启动服务器
echo "✅ 服务器已启动"
echo "📝 可用工具："
echo "  - add_todo: 添加任务"
echo "  - update_todo: 更新任务"
echo "  - list_todos: 列出任务"
echo "  - delete_todo: 删除任务"
echo "  - create_note: 创建笔记"
echo "  - update_note: 更新笔记"
echo "  - list_notes: 列出笔记"
echo "  - search_notes: 搜索笔记"
echo ""
echo "按 Ctrl+C 停止服务器"

# 启动 MCP 服务器
node dist/index.js
