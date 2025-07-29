#!/bin/bash

# DomMate 部署测试脚本
# 用于验证Docker容器是否正确运行

set -e

echo "🧪 ================================="
echo "🚀 DomMate 部署测试脚本"
echo "🧪 ================================="

# 配置
CONTAINER_NAME="dommate"
IMAGE_NAME="ghcr.io/yeagoo/dommate:latest"
PORT="3001"
VOLUME_NAME="dommate-data"

# 函数：等待服务启动
wait_for_service() {
    local url=$1
    local max_attempts=$2
    local attempt=1
    
    echo "⏳ 等待服务启动..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$url" > /dev/null 2>&1; then
            echo "✅ 服务已启动！"
            return 0
        fi
        
        echo "   尝试 $attempt/$max_attempts - 等待中..."
        sleep 5
        attempt=$((attempt + 1))
    done
    
    echo "❌ 服务启动超时"
    return 1
}

# 函数：测试API端点
test_endpoint() {
    local url=$1
    local description=$2
    
    echo "🔍 测试: $description"
    
    if curl -f -s "$url" > /dev/null 2>&1; then
        echo "   ✅ 成功"
    else
        echo "   ❌ 失败"
        return 1
    fi
}

# 步骤1：清理现有容器（如果存在）
echo "🧹 清理现有部署..."
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

# 步骤2：拉取最新镜像
echo "📦 拉取最新镜像..."
docker pull $IMAGE_NAME

# 步骤3：创建volume（如果不存在）
echo "💾 准备数据卷..."
docker volume create $VOLUME_NAME 2>/dev/null || true

# 步骤4：启动容器
echo "🚀 启动DomMate容器..."
docker run -d \
  --name $CONTAINER_NAME \
  -p $PORT:$PORT \
  -v $VOLUME_NAME:/app/data \
  $IMAGE_NAME

# 步骤5：等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查容器状态
if ! docker ps | grep -q $CONTAINER_NAME; then
    echo "❌ 容器启动失败！"
    echo "📋 容器日志："
    docker logs $CONTAINER_NAME
    exit 1
fi

echo "✅ 容器启动成功！"

# 步骤6：等待健康检查通过
if wait_for_service "http://localhost:$PORT/health" 12; then
    echo "✅ 健康检查通过"
else
    echo "❌ 健康检查失败"
    echo "📋 容器日志："
    docker logs $CONTAINER_NAME --tail 20
    exit 1
fi

# 步骤7：测试各个端点
echo ""
echo "🔍 测试API端点..."

test_endpoint "http://localhost:$PORT/health" "健康检查端点"
test_endpoint "http://localhost:$PORT/" "前端主页"
test_endpoint "http://localhost:$PORT/en" "英文版页面"
test_endpoint "http://localhost:$PORT/api/auth/info" "认证信息API"

# 步骤8：显示容器信息
echo ""
echo "📊 部署信息："
echo "   容器名称: $CONTAINER_NAME"
echo "   镜像版本: $IMAGE_NAME"
echo "   访问端口: $PORT"
echo "   数据卷: $VOLUME_NAME"

# 步骤9：显示访问信息
echo ""
echo "🌐 访问地址："
echo "   主页: http://localhost:$PORT"
echo "   英文版: http://localhost:$PORT/en"
echo "   健康检查: http://localhost:$PORT/health"

# 步骤10：显示容器状态
echo ""
echo "📋 容器状态："
docker ps --filter "name=$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 步骤11：显示日志示例
echo ""
echo "📄 最新日志（最后10行）："
docker logs $CONTAINER_NAME --tail 10

echo ""
echo "🎉 ================================="
echo "✅ DomMate 部署测试完成！"
echo "🎉 ================================="
echo ""
echo "💡 有用的命令："
echo "   查看日志: docker logs $CONTAINER_NAME"
echo "   停止容器: docker stop $CONTAINER_NAME"
echo "   重启容器: docker restart $CONTAINER_NAME"
echo "   进入容器: docker exec -it $CONTAINER_NAME sh"
echo "   清理部署: docker stop $CONTAINER_NAME && docker rm $CONTAINER_NAME"
echo ""
echo "📚 更多信息请查看: https://github.com/yeagoo/DomMate" 