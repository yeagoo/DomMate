#!/bin/bash

# DomMate 启动脚本
# Node.js 22 版本

set -e

echo "🚀 DomMate 启动脚本"
echo "===================="

# 检查Docker和Docker Compose
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose 未安装，请先安装Docker Compose"
    exit 1
fi

# 显示系统信息
echo "✅ Docker 版本: $(docker --version)"
echo "✅ Docker Compose 版本: $(docker-compose --version)"
echo "✅ Node.js 22 (在容器中)"

# 停止现有容器
echo ""
echo "🛑 停止现有容器..."
docker-compose down 2>/dev/null || true

# 清理旧的镜像（可选）
read -p "是否清理旧的构建镜像？(y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧹 清理旧镜像..."
    docker system prune -f
fi

# 构建并启动
echo ""
echo "🔨 构建镜像..."
docker-compose build --no-cache

echo ""
echo "🚀 启动服务..."
docker-compose up -d

# 等待服务启动
echo ""
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo ""
echo "📊 服务状态:"
docker-compose ps

# 检查日志
echo ""
echo "📋 启动日志:"
docker-compose logs --tail=20 dommate

# 健康检查
echo ""
echo "🔍 健康检查..."
sleep 5

if curl -s http://localhost:3001/api/auth/info > /dev/null; then
    echo "✅ 服务启动成功！"
    echo ""
    echo "🌐 访问地址: http://localhost:3001"
    echo "🔑 默认密码: admin123"
    echo "📚 首次登录需要修改密码"
    echo ""
    echo "🔧 管理命令:"
    echo "  查看日志: docker-compose logs -f dommate"
    echo "  停止服务: docker-compose down"
    echo "  重启服务: docker-compose restart"
    echo "  查看状态: docker-compose ps"
else
    echo "❌ 服务启动失败！"
    echo ""
    echo "🔍 故障排查:"
    echo "  查看详细日志: docker-compose logs dommate"
    echo "  检查端口占用: netstat -tlnp | grep 3001"
    echo "  重新构建: docker-compose build --no-cache"
    exit 1
fi 