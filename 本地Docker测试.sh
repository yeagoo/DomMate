#!/bin/bash

# DomMate 本地Docker构建和测试脚本

set -e

echo "🧪 ================================="
echo "🚀 DomMate 本地Docker构建测试"
echo "🧪 ================================="

# 配置
IMAGE_NAME="dommate-local"
CONTAINER_NAME="dommate-test"
PORT="3001"
VOLUME_NAME="dommate-test-data"

# 函数：清理资源
cleanup() {
    echo "🧹 清理测试资源..."
    docker stop $CONTAINER_NAME 2>/dev/null || true
    docker rm $CONTAINER_NAME 2>/dev/null || true
    docker volume rm $VOLUME_NAME 2>/dev/null || true
    echo "✅ 清理完成"
}

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
        return 0
    else
        echo "   ❌ 失败"
        return 1
    fi
}

# 函数：显示容器日志
show_logs() {
    echo "📋 最新容器日志："
    echo "================================"
    docker logs $CONTAINER_NAME --tail 20
    echo "================================"
}

# 捕获中断信号以进行清理
trap cleanup EXIT

# 步骤1：检查Docker环境
echo "🔍 检查Docker环境..."
if ! docker --version > /dev/null 2>&1; then
    echo "❌ Docker未安装或未启动"
    exit 1
fi

echo "✅ Docker环境正常"
docker --version

# 步骤2：清理现有资源
cleanup

# 步骤3：检查必要文件
echo "📁 检查必要文件..."
required_files=("Dockerfile" "package.json" "server/index.js")

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ 缺少必要文件: $file"
        exit 1
    fi
done

echo "✅ 必要文件检查完成"

# 步骤4：构建Docker镜像
echo "🏗️ 开始构建Docker镜像..."
echo "📊 镜像名称: $IMAGE_NAME"

# 显示构建进度
docker build -t $IMAGE_NAME . --progress=plain

if [ $? -eq 0 ]; then
    echo "✅ Docker镜像构建成功！"
else
    echo "❌ Docker镜像构建失败"
    exit 1
fi

# 步骤5：显示镜像信息
echo "📦 镜像信息："
docker images | grep $IMAGE_NAME

# 步骤6：创建测试volume
echo "💾 创建数据卷..."
docker volume create $VOLUME_NAME

# 步骤7：启动容器
echo "🚀 启动测试容器..."
docker run -d \
    --name $CONTAINER_NAME \
    -p $PORT:$PORT \
    -v $VOLUME_NAME:/app/data \
    -e NODE_ENV=production \
    -e DATABASE_PATH=/app/data/domains.db \
    -e BACKUP_DIR=/app/data/backups \
    $IMAGE_NAME

if [ $? -eq 0 ]; then
    echo "✅ 容器启动成功"
else
    echo "❌ 容器启动失败"
    show_logs
    exit 1
fi

# 步骤8：等待应用启动
echo "⏳ 等待应用完全启动..."
sleep 15

# 检查容器是否仍在运行
if ! docker ps | grep -q $CONTAINER_NAME; then
    echo "❌ 容器已停止运行"
    show_logs
    exit 1
fi

# 步骤9：等待健康检查
if wait_for_service "http://localhost:$PORT/health" 12; then
    echo "✅ 健康检查通过"
else
    echo "❌ 健康检查失败"
    show_logs
    exit 1
fi

# 步骤10：功能测试
echo ""
echo "🧪 开始功能测试..."

# 测试基础端点
test_results=()

if test_endpoint "http://localhost:$PORT/health" "健康检查端点"; then
    test_results+=("✅ 健康检查")
else
    test_results+=("❌ 健康检查")
fi

if test_endpoint "http://localhost:$PORT/" "前端主页"; then
    test_results+=("✅ 前端主页")
else
    test_results+=("❌ 前端主页")
fi

if test_endpoint "http://localhost:$PORT/en" "英文版页面"; then
    test_results+=("✅ 英文版页面")
else
    test_results+=("❌ 英文版页面")
fi

if test_endpoint "http://localhost:$PORT/api/auth/info" "认证API"; then
    test_results+=("✅ 认证API")
else
    test_results+=("❌ 认证API")
fi

# 步骤11：检查前端资源
echo ""
echo "📦 检查前端构建产物..."
if docker exec $CONTAINER_NAME ls -la /app/dist/index.html > /dev/null 2>&1; then
    echo "✅ 前端构建产物存在"
    frontend_files=$(docker exec $CONTAINER_NAME ls /app/dist/ | wc -l)
    echo "📊 前端文件数量: $frontend_files"
else
    echo "❌ 前端构建产物缺失"
fi

# 步骤12：检查数据持久化
echo ""
echo "💾 检查数据持久化..."
if docker exec $CONTAINER_NAME ls -la /app/data/ > /dev/null 2>&1; then
    echo "✅ 数据目录存在"
    echo "📁 数据目录内容："
    docker exec $CONTAINER_NAME ls -la /app/data/
else
    echo "❌ 数据目录不存在"
fi

# 步骤13：检查服务状态
echo ""
echo "📊 服务状态检查..."
echo "🐳 容器状态："
docker ps --filter "name=$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "💽 数据卷状态："
docker volume inspect $VOLUME_NAME --format "{{.Name}}: {{.Mountpoint}}"

# 步骤14：显示测试结果
echo ""
echo "📋 测试结果汇总："
echo "================================"
for result in "${test_results[@]}"; do
    echo "$result"
done
echo "================================"

# 步骤15：显示访问信息
echo ""
echo "🌐 本地访问地址："
echo "   主页: http://localhost:$PORT"
echo "   英文版: http://localhost:$PORT/en"
echo "   健康检查: http://localhost:$PORT/health"
echo "   API信息: http://localhost:$PORT/api/auth/info"

# 步骤16：显示有用命令
echo ""
echo "💡 有用的调试命令："
echo "   查看日志: docker logs $CONTAINER_NAME"
echo "   查看实时日志: docker logs -f $CONTAINER_NAME"
echo "   进入容器: docker exec -it $CONTAINER_NAME sh"
echo "   检查进程: docker exec $CONTAINER_NAME ps aux"
echo "   检查端口: docker exec $CONTAINER_NAME netstat -tulpn"

# 步骤17：询问是否保持运行
echo ""
read -p "🤔 是否保持容器运行以便手动测试？(y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "✅ 容器将继续运行，可以手动测试"
    echo "📋 手动停止命令: docker stop $CONTAINER_NAME"
    echo "🧹 完全清理命令: docker stop $CONTAINER_NAME && docker rm $CONTAINER_NAME && docker volume rm $VOLUME_NAME"
    
    # 取消自动清理
    trap - EXIT
    
    show_logs
    
    echo ""
    echo "🎉 本地测试完成！容器正在运行中..."
else
    echo "🛑 即将清理测试资源..."
    show_logs
fi

echo ""
echo "🎊 ================================="
echo "✅ DomMate 本地Docker测试完成！"
echo "🎊 =================================" 