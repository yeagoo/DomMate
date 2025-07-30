#!/bin/bash
# PaaS平台权限快速修复脚本

echo "🔧 PaaS平台权限自动修复开始..."

# 尝试多种权限修复方法
fix_permissions() {
    # 方法1: 直接创建
    if mkdir -p /app/data/backups 2>/dev/null; then
        echo "✅ 方法1成功: 直接创建目录"
        return 0
    fi
    
    # 方法2: 使用sudo
    if command -v sudo >/dev/null && sudo mkdir -p /app/data/backups 2>/dev/null; then
        sudo chown -R $(whoami) /app/data 2>/dev/null || sudo chmod -R 777 /app/data
        echo "✅ 方法2成功: sudo权限修复"
        return 0
    fi
    
    # 方法3: 使用临时目录
    echo "⚠️ 方法1和2失败，使用临时目录..."
    export DATABASE_PATH="/tmp/domains.db"
    export BACKUP_DIR="/tmp/backups"
    mkdir -p /tmp/backups
    echo "✅ 方法3成功: 临时目录模式"
    echo "📁 数据库路径: $DATABASE_PATH"
    echo "📁 备份目录: $BACKUP_DIR"
    return 0
}

# 执行修复
fix_permissions

# 启动应用
echo "🚀 启动DomMate应用..."
exec node server/index.js 