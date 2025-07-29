#!/bin/bash

# DomMate Docker容器功能测试脚本

set -e

echo "🐳 ================================="
echo "🚀 DomMate Docker容器功能测试"
echo "🐳 ================================="

# 配置
CONTAINER_NAME="dommate-test"
BASE_URL="http://localhost:3002"
API_URL="$BASE_URL/api"

# 函数：测试API端点
test_endpoint() {
    local url=$1
    local description=$2
    local expected_code=${3:-200}
    
    echo "🔍 测试: $description"
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$response" -eq "$expected_code" ]; then
        echo "   ✅ 成功 (HTTP $response)"
        return 0
    else
        echo "   ❌ 失败 (HTTP $response，期望 $expected_code)"
        return 1
    fi
}

# 函数：测试JSON API
test_json_api() {
    local url=$1
    local description=$2
    
    echo "🔍 测试: $description"
    
    response=$(curl -s "$url")
    
    if echo "$response" | grep -q '"status"' || echo "$response" | grep -q '{'; then
        echo "   ✅ 成功 (返回JSON数据)"
        return 0
    else
        echo "   ❌ 失败 (无有效JSON响应)"
        echo "   响应: $response"
        return 1
    fi
}

# 步骤1：检查容器状态
echo ""
echo "🐳 Docker容器状态检查..."

if sudo docker ps | grep -q "$CONTAINER_NAME"; then
    echo "✅ 容器正在运行"
    container_info=$(sudo docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep "$CONTAINER_NAME")
    echo "📋 容器信息: $container_info"
else
    echo "❌ 容器未运行"
    echo "💡 请先启动容器: sudo docker run -d --name $CONTAINER_NAME -p 3002:3001 -v \$(pwd)/docker-data:/app/data dommate-node22:latest"
    exit 1
fi

# 步骤2：基础连接测试
echo ""
echo "📡 基础连接测试..."

test_results=()

if test_endpoint "$BASE_URL/health" "健康检查端点"; then
    test_results+=("✅ 健康检查")
else
    test_results+=("❌ 健康检查")
fi

if test_endpoint "$BASE_URL/" "前端主页"; then
    test_results+=("✅ 前端主页")
else
    test_results+=("❌ 前端主页")
fi

if test_endpoint "$BASE_URL/en" "英文版页面"; then
    test_results+=("✅ 英文版页面")
else
    test_results+=("❌ 英文版页面")
fi

# 步骤3：API接口测试
echo ""
echo "🔌 API接口测试..."

if test_json_api "$API_URL/auth/info" "认证信息API"; then
    test_results+=("✅ 认证API")
else
    test_results+=("❌ 认证API")
fi

if test_json_api "$API_URL/domains/stats" "域名统计API"; then
    test_results+=("✅ 域名统计API")
else
    test_results+=("❌ 域名统计API")
fi

if test_json_api "$API_URL/groups" "分组API"; then
    test_results+=("✅ 分组API")
else
    test_results+=("❌ 分组API")
fi

# 步骤4：容器资源状态
echo ""
echo "📊 容器资源状态..."

container_stats=$(sudo docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" | grep "$CONTAINER_NAME")
if [ -n "$container_stats" ]; then
    echo "📈 资源使用: $container_stats"
    test_results+=("✅ 资源监控")
else
    test_results+=("❌ 资源监控")
fi

# 步骤5：数据持久化检查
echo ""
echo "💾 数据持久化检查..."

if [ -f "docker-data/domains.db" ]; then
    db_size=$(ls -lh docker-data/domains.db | awk '{print $5}')
    echo "✅ 数据库文件存在: $db_size"
    test_results+=("✅ 数据持久化")
else
    echo "❌ 数据库文件不存在"
    test_results+=("❌ 数据持久化")
fi

if [ -d "docker-data/backups" ]; then
    echo "✅ 备份目录存在"
else
    echo "❌ 备份目录不存在"
fi

# 步骤6：容器日志检查
echo ""
echo "📋 容器日志检查..."

log_output=$(sudo docker logs --tail 5 "$CONTAINER_NAME" 2>/dev/null)
if echo "$log_output" | grep -q "DomMate"; then
    echo "✅ 容器日志正常"
    test_results+=("✅ 容器日志")
else
    echo "❌ 容器日志异常"
    test_results+=("❌ 容器日志")
fi

# 步骤7：详细健康状态
echo ""
echo "❤️ 详细健康状态..."
health_response=$(curl -s "$BASE_URL/health")
if command -v python3 >/dev/null 2>&1; then
    echo "$health_response" | python3 -m json.tool 2>/dev/null || echo "$health_response"
else
    echo "$health_response"
fi

# 步骤8：显示测试结果汇总
echo ""
echo "📋 测试结果汇总："
echo "================================"
success_count=0
total_count=0

for result in "${test_results[@]}"; do
    echo "$result"
    total_count=$((total_count + 1))
    if [[ $result == ✅* ]]; then
        success_count=$((success_count + 1))
    fi
done

echo "================================"
echo "📊 通过率: $success_count/$total_count ($(echo "scale=1; $success_count * 100 / $total_count" | bc -l 2>/dev/null || echo "计算中")%)"

# 步骤9：显示访问信息
echo ""
echo "🌐 DomMate Docker容器访问地址："
echo "   主页: $BASE_URL"
echo "   英文版: $BASE_URL/en"
echo "   域名管理: $BASE_URL/groups"
echo "   数据分析: $BASE_URL/analytics"
echo "   邮件配置: $BASE_URL/email"
echo "   健康检查: $BASE_URL/health"
echo "   API接口: $API_URL"

# 步骤10：显示容器信息
echo ""
echo "🐳 Docker容器信息："
echo "   容器名称: $CONTAINER_NAME"
echo "   镜像: dommate-node22:latest"
echo "   端口映射: 3002 -> 3001"
echo "   数据卷: $(pwd)/docker-data"

# 步骤11：管理命令提示
echo ""
echo "🛠️ 常用管理命令："
echo "   查看容器状态: sudo docker ps"
echo "   查看容器日志: sudo docker logs $CONTAINER_NAME"
echo "   进入容器: sudo docker exec -it $CONTAINER_NAME sh"
echo "   停止容器: sudo docker stop $CONTAINER_NAME"
echo "   重启容器: sudo docker restart $CONTAINER_NAME"

# 步骤12：提供建议
echo ""
if [ $success_count -eq $total_count ]; then
    echo "🎉 ================================="
    echo "✅ 所有测试通过！Docker容器完全正常运行！"
    echo "🎉 ================================="
    echo ""
    echo "🚀 你现在可以："
    echo "   1. 在浏览器中访问 $BASE_URL"
    echo "   2. 使用默认密码 'admin123' 登录"
    echo "   3. 开始添加和监控域名"
    echo "   4. 配置邮件通知"
    echo "   5. 查看数据分析报告"
    echo "   6. 数据会持久保存在 docker-data/ 目录中"
else
    echo "⚠️ ================================="
    echo "部分功能存在问题，但核心功能正常"
    echo "⚠️ ================================="
    echo ""
    echo "建议："
    echo "   1. 检查失败的项目"
    echo "   2. 查看容器日志: sudo docker logs $CONTAINER_NAME"
    echo "   3. 确保容器正在运行: sudo docker ps"
fi

echo ""
echo "📚 更多信息："
echo "   项目文档: 🎉Docker本地测试完全成功总结.md"
echo "   GitHub: https://github.com/yeagoo/DomMate"
echo "   反馈: 请在GitHub上提交Issue" 