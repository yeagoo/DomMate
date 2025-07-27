#!/bin/bash

# Docker卷权限修复脚本
# 用于解决DomMate容器数据持久化问题

echo "🔧 DomMate Docker卷权限修复脚本"
echo "================================"

# 定义卷名
VOLUMES=("dommate-data" "dommate-logs" "dommate-exports")

echo "📋 检查Docker卷状态..."

# 检查卷是否存在
for volume in "${VOLUMES[@]}"; do
    if docker volume inspect "$volume" >/dev/null 2>&1; then
        echo "✅ 卷 $volume 存在"
        
        # 获取卷的挂载点
        MOUNT_POINT=$(docker volume inspect "$volume" --format '{{ .Mountpoint }}')
        echo "   挂载点: $MOUNT_POINT"
        
        # 检查权限
        if [ -d "$MOUNT_POINT" ]; then
            CURRENT_OWNER=$(stat -c "%u:%g" "$MOUNT_POINT" 2>/dev/null || echo "unknown")
            echo "   当前所有者: $CURRENT_OWNER"
        fi
    else
        echo "❌ 卷 $volume 不存在"
    fi
done

echo ""
echo "🔧 修复权限..."

# 方法1: 使用临时容器修复权限
echo "方法1: 使用临时容器修复权限"
for volume in "${VOLUMES[@]}"; do
    echo "正在修复 $volume..."
    docker run --rm \
        -v "$volume":/data \
        --user root \
        alpine:latest \
        sh -c "chown -R 1000:1000 /data && chmod -R 755 /data"
    
    if [ $? -eq 0 ]; then
        echo "✅ $volume 权限修复成功"
    else
        echo "❌ $volume 权限修复失败"
    fi
done

echo ""
echo "🔍 验证修复结果..."

# 验证权限
for volume in "${VOLUMES[@]}"; do
    echo "检查 $volume:"
    docker run --rm \
        -v "$volume":/data \
        alpine:latest \
        ls -la /data
done

echo ""
echo "📝 建议的Docker运行命令:"
echo "docker run -d --name dommate -p 3001:3001 \\"
echo "  --user 1000:1000 --init \\"
echo "  -v dommate-data:/app/data \\"
echo "  -v dommate-logs:/app/logs \\"
echo "  -v dommate-exports:/app/exports \\"
echo "  -e DATABASE_PATH=/app/data/domains.db \\"
echo "  -e EXPORT_DIR=/app/exports \\"
echo "  -e LOG_FILE=/app/logs/dommate.log \\"
echo "  -e TZ=Asia/Shanghai \\"
echo "  ghcr.io/yeagoo/dommate:latest"

echo ""
echo "📝 或使用Docker Compose:"
echo "docker-compose up -d"

echo ""
echo "✅ 权限修复完成！"
echo "请重启DomMate容器以应用更改："
echo "docker stop dommate && docker rm dommate"
echo "然后使用上面的命令重新运行容器" 