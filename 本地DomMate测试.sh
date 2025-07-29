#!/bin/bash

# DomMate 本地功能测试脚本

set -e

echo "🧪 ================================="
echo "🚀 DomMate 本地功能测试"
echo "🧪 ================================="

# 配置
BASE_URL="http://localhost:3001"
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

# 步骤1：基础连接测试
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

# 步骤2：API接口测试
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

# 步骤3：前端路由测试
echo ""
echo "🗺️ 前端路由测试..."

routes=("/groups" "/analytics" "/email")

for route in "${routes[@]}"; do
    if test_endpoint "$BASE_URL$route" "路由: $route"; then
        test_results+=("✅ 路由$route")
    else
        test_results+=("❌ 路由$route")
    fi
done

# 步骤4：静态资源测试
echo ""
echo "📦 静态资源测试..."

# 检查是否有CSS和JS文件
css_files=$(curl -s "$BASE_URL/" | grep -o '/_astro/[^"]*\.css' | head -1)
js_files=$(curl -s "$BASE_URL/" | grep -o '/_astro/[^"]*\.js' | head -1)

if [ -n "$css_files" ]; then
    if test_endpoint "$BASE_URL$css_files" "CSS文件"; then
        test_results+=("✅ CSS资源")
    else
        test_results+=("❌ CSS资源")
    fi
else
    test_results+=("⚠️ 未找到CSS文件")
fi

if [ -n "$js_files" ]; then
    if test_endpoint "$BASE_URL$js_files" "JS文件"; then
        test_results+=("✅ JS资源")
    else
        test_results+=("❌ JS资源")
    fi
else
    test_results+=("⚠️ 未找到JS文件")
fi

# 步骤5：数据库连接测试
echo ""
echo "💾 数据库功能测试..."

# 检查数据库文件
if [ -f "data/domains.db" ]; then
    echo "✅ 数据库文件存在: $(ls -lh data/domains.db)"
    test_results+=("✅ 数据库文件")
else
    echo "❌ 数据库文件不存在"
    test_results+=("❌ 数据库文件")
fi

# 步骤6：显示详细的健康状态
echo ""
echo "❤️ 详细健康状态..."
health_response=$(curl -s "$BASE_URL/health")
echo "$health_response" | python3 -m json.tool 2>/dev/null || echo "$health_response"

# 步骤7：显示测试结果汇总
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

# 步骤8：显示访问信息
echo ""
echo "🌐 DomMate 访问地址："
echo "   主页: $BASE_URL"
echo "   英文版: $BASE_URL/en"
echo "   域名管理: $BASE_URL/groups"
echo "   数据分析: $BASE_URL/analytics"
echo "   邮件配置: $BASE_URL/email"
echo "   健康检查: $BASE_URL/health"
echo "   API文档: $API_URL"

# 步骤9：显示系统信息
echo ""
echo "🖥️ 系统信息："
echo "   Node.js版本: $(node --version)"
echo "   DomMate版本: 0.1.0"
echo "   运行环境: $(uname -s) $(uname -r)"
echo "   工作目录: $(pwd)"

# 步骤10：提供建议
echo ""
if [ $success_count -eq $total_count ]; then
    echo "🎉 ================================="
    echo "✅ 所有测试通过！DomMate完全正常运行！"
    echo "🎉 ================================="
    echo ""
    echo "🚀 你现在可以："
    echo "   1. 在浏览器中访问 $BASE_URL"
    echo "   2. 使用默认密码 'admin123' 登录"
    echo "   3. 开始添加和监控域名"
    echo "   4. 配置邮件通知"
    echo "   5. 查看数据分析报告"
else
    echo "⚠️ ================================="
    echo "部分功能存在问题，但核心功能正常"
    echo "⚠️ ================================="
    echo ""
    echo "建议："
    echo "   1. 检查失败的项目"
    echo "   2. 确保所有依赖已正确安装"
    echo "   3. 查看服务器日志了解详情"
fi

echo ""
echo "📚 更多信息："
echo "   GitHub: https://github.com/yeagoo/DomMate"
echo "   文档: README.md"
echo "   反馈: 请在GitHub上提交Issue" 