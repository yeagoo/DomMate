#!/bin/sh
set -e

echo "🚀 DomMate 容器启动中..."

# 检查并创建必要的数据目录
echo "🔍 检查数据目录..."
if [ ! -d "/app/data" ]; then
    echo "📁 创建数据目录: /app/data"
    mkdir -p /app/data
fi

if [ ! -d "/app/data/backups" ]; then
    echo "📁 创建备份目录: /app/data/backups"
    mkdir -p /app/data/backups
fi

# 检查目录权限
echo "🔐 检查目录权限..."
if [ ! -w "/app/data" ]; then
    echo "❌ 警告: /app/data 目录不可写"
    echo "🔧 尝试修复权限..."
    # 这里不能直接chown，因为已经是dommate用户了
    ls -la /app/data || echo "目录不存在或无权限访问"
fi

# 显示目录状态
echo "📊 数据目录状态:"
ls -la /app/ | grep -E "(data|logs|backups)" || echo "目录创建中..."

# 检查环境变量
echo "⚙️ 环境变量检查:"
echo "  DATABASE_PATH: ${DATABASE_PATH:-未设置}"
echo "  BACKUP_DIR: ${BACKUP_DIR:-未设置}"

# 启动应用
echo "🎯 启动 DomMate 应用..."
exec "$@" 