#!/bin/bash

# DomMate 构建测试脚本
# 用于验证Docker构建和前端文件生成

set -e

echo "🧪 DomMate 构建测试"
echo "=================="

# 清理之前的构建
echo "🧹 清理之前的构建..."
docker-compose down 2>/dev/null || true
docker system prune -f

# 构建镜像
echo ""
echo "🔨 构建Docker镜像..."
if docker-compose build --no-cache; then
    echo "✅ Docker镜像构建成功"
else
    echo "❌ Docker镜像构建失败"
    exit 1
fi

# 临时启动容器检查文件
echo ""
echo "🔍 检查前端文件..."
CONTAINER_ID=$(docker run -d --name dommate-test $(docker-compose images -q dommate) tail -f /dev/null)

# 检查前端文件是否存在
if docker exec $CONTAINER_ID test -f /app/dist/index.html; then
    echo "✅ index.html 存在"
    SIZE=$(docker exec $CONTAINER_ID stat -f%z /app/dist/index.html 2>/dev/null || docker exec $CONTAINER_ID stat -c%s /app/dist/index.html)
    echo "📏 index.html 大小: $SIZE bytes"
else
    echo "❌ index.html 不存在"
fi

if docker exec $CONTAINER_ID test -d /app/dist/_astro; then
    echo "✅ _astro 目录存在"
    COUNT=$(docker exec $CONTAINER_ID ls -1 /app/dist/_astro | wc -l)
    echo "📁 _astro 文件数量: $COUNT"
else
    echo "❌ _astro 目录不存在"
fi

# 检查后端文件
if docker exec $CONTAINER_ID test -f /app/server/index.js; then
    echo "✅ 后端文件存在"
else
    echo "❌ 后端文件不存在"
fi

# 清理测试容器
echo ""
echo "🧹 清理测试容器..."
docker rm -f $CONTAINER_ID

# 启动完整服务测试
echo ""
echo "🚀 启动完整服务测试..."
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动 (30秒)..."
sleep 30

# 健康检查
echo ""
echo "🏥 健康检查..."
if curl -s -f http://localhost:3001/api/auth/info; then
    echo "✅ API 健康检查通过"
else
    echo "❌ API 健康检查失败"
fi

# 检查前端访问
echo ""
echo "🌐 前端访问测试..."
if curl -s -I http://localhost:3001/ | grep -q "200 OK"; then
    echo "✅ 前端页面访问正常"
else
    echo "❌ 前端页面访问失败"
fi

# 显示日志
echo ""
echo "📋 服务日志 (最近20行):"
echo "------------------------"
docker-compose logs --tail=20 dommate

echo ""
echo "🎉 测试完成！"
echo ""
echo "🌐 访问地址: http://localhost:3001"
echo "🔑 默认密码: admin123"
echo ""
echo "停止服务: docker-compose down" 