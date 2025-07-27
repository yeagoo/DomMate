#!/bin/bash

# 快速Docker构建测试
# 仅测试构建阶段，不启动完整服务

set -e

echo "🔧 快速Docker构建测试"
echo "===================="

# 检查Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装"
    exit 1
fi

echo "✅ Docker 版本: $(docker --version)"

# 清理之前的构建
echo ""
echo "🧹 清理之前的构建..."
docker image rm dommate_dommate 2>/dev/null || true
docker system prune -f 2>/dev/null || true

# 仅构建镜像，不启动
echo ""
echo "🔨 构建Docker镜像..."
if docker-compose build dommate; then
    echo "✅ Docker镜像构建成功！"
    
    # 显示镜像信息
    echo ""
    echo "📊 镜像信息:"
    docker images | grep dommate
    
    # 快速测试镜像内容
    echo ""
    echo "🔍 快速验证镜像内容..."
    IMAGE_ID=$(docker images -q dommate_dommate | head -n1)
    
    if [ -n "$IMAGE_ID" ]; then
        # 检查前端文件
        if docker run --rm $IMAGE_ID test -f /app/dist/index.html; then
            echo "✅ 前端文件存在"
        else
            echo "❌ 前端文件缺失"
        fi
        
        # 检查后端文件
        if docker run --rm $IMAGE_ID test -f /app/server/index.js; then
            echo "✅ 后端文件存在"
        else
            echo "❌ 后端文件缺失"
        fi
        
        # 检查Node.js版本
        NODE_VERSION=$(docker run --rm $IMAGE_ID node --version)
        echo "✅ Node.js版本: $NODE_VERSION"
        
        if [[ "$NODE_VERSION" == v22* ]]; then
            echo "✅ Node.js 22 确认"
        else
            echo "⚠️  Node.js版本不是22"
        fi
        
        # 检查用户
        USER_INFO=$(docker run --rm $IMAGE_ID whoami)
        echo "✅ 运行用户: $USER_INFO"
        
    else
        echo "❌ 无法获取镜像ID"
        exit 1
    fi
    
    echo ""
    echo "🎉 构建测试完成！"
    echo ""
    echo "现在可以运行完整测试:"
    echo "  ./test-build.sh"
    echo ""
    echo "或直接启动服务:"
    echo "  ./start.sh"
    
else
    echo "❌ Docker镜像构建失败！"
    echo ""
    echo "查看详细错误信息:"
    echo "  docker-compose build --no-cache dommate"
    exit 1
fi 