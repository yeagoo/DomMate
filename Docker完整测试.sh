#!/bin/bash

# DomMate Docker 完整测试脚本
# Ubuntu 24.04 + Node.js 22 版本

set -e

echo "🐳 ================================="
echo "🚀 DomMate Docker 完整测试"
echo "🐳 ================================="

# 步骤1：查看Docker镜像
echo ""
echo "📋 步骤1：查看已构建的Docker镜像"
echo "================================"
sudo docker images | grep -E "(REPOSITORY|dommate)" || echo "没有找到DomMate镜像"

# 步骤2：清理可能存在的旧容器
echo ""
echo "🧹 步骤2：清理旧的测试容器"
echo "================================"
sudo docker rm -f dommate-ubuntu24-test 2>/dev/null || echo "没有旧容器需要清理"

# 步骤3：启动新容器
echo ""
echo "🚀 步骤3：启动DomMate容器"
echo "================================"
CONTAINER_ID=$(sudo docker run -d --name dommate-ubuntu24-test -p 3001:3001 -v dommate-data:/app/data dommate-ubuntu24:latest)

if [ $? -eq 0 ]; then
    echo "✅ 容器启动成功！"
    echo "   容器ID: ${CONTAINER_ID:0:12}"
else
    echo "❌ 容器启动失败"
    exit 1
fi

# 步骤4：等待容器启动
echo ""
echo "⏳ 步骤4：等待容器启动完成"
echo "================================"
echo "等待10秒让应用完全启动..."

for i in {10..1}; do
    echo -n "$i "
    sleep 1
done
echo ""

# 步骤5：检查容器状态
echo ""
echo "📊 步骤5：检查容器运行状态"
echo "================================"
CONTAINER_STATUS=$(sudo docker ps --filter name=dommate-ubuntu24-test --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}")

if [ -n "$CONTAINER_STATUS" ]; then
    echo "$CONTAINER_STATUS"
    echo "✅ 容器正在运行"
else
    echo "❌ 容器未在运行，检查日志..."
    sudo docker logs dommate-ubuntu24-test
    exit 1
fi

# 步骤6：查看容器日志
echo ""
echo "📝 步骤6：查看容器启动日志"
echo "================================"
sudo docker logs dommate-ubuntu24-test

# 步骤7：健康检查
echo ""
echo "❤️ 步骤7：健康检查"
echo "================================"

# 检查健康端点
echo "🔍 测试健康检查端点..."
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ 健康检查端点响应正常"
    
    # 显示健康状态详情
    echo "📊 健康状态详情："
    curl -s http://localhost:3001/health | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(f'  • 状态: {data.get(\"status\", \"未知\")}')
    print(f'  • 运行时长: {data.get(\"uptime\", \"未知\")}秒')
    print(f'  • Node.js版本: {data.get(\"version\", \"未知\")}')
    print(f'  • 内存使用: {data.get(\"memory\", {}).get(\"rss\", \"未知\")}')
    checks = data.get('checks', {})
    for name, check in checks.items():
        status = check.get('status', '未知')
        print(f'  • {name}: {status}')
except:
    print('  解析健康状态失败')
" 2>/dev/null || echo "  健康状态JSON解析失败"
else
    echo "❌ 健康检查端点无响应"
fi

# 步骤8：测试前端访问
echo ""
echo "🌐 步骤8：测试前端页面访问"
echo "================================"

if curl -s -I http://localhost:3001/ | grep -q "200 OK"; then
    echo "✅ 前端主页访问正常"
else
    echo "❌ 前端主页访问失败"
fi

if curl -s -I http://localhost:3001/en/ | grep -q "200 OK"; then
    echo "✅ 英文版页面访问正常"
else
    echo "❌ 英文版页面访问失败"
fi

# 步骤9：测试API接口
echo ""
echo "🔌 步骤9：测试API接口"
echo "================================"

# 测试域名统计API
if curl -s http://localhost:3001/api/domains/stats | grep -q "{"; then
    echo "✅ 域名统计API响应正常"
else
    echo "❌ 域名统计API响应异常"
fi

# 测试分组API
if curl -s http://localhost:3001/api/groups | grep -q "\[\]"; then
    echo "✅ 分组API响应正常"
else
    echo "❌ 分组API响应异常"
fi

# 步骤10：容器资源使用情况
echo ""
echo "📈 步骤10：容器资源使用情况"
echo "================================"
sudo docker stats dommate-ubuntu24-test --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"

# 步骤11：测试结果汇总
echo ""
echo "📋 步骤11：测试结果汇总"
echo "================================"

# 获取容器详细信息
CONTAINER_INFO=$(sudo docker inspect dommate-ubuntu24-test --format '
镜像: {{.Config.Image}}
创建时间: {{.Created}}
运行状态: {{.State.Status}}
端口映射: {{range $p, $conf := .NetworkSettings.Ports}}{{$p}} -> {{(index $conf 0).HostPort}} {{end}}
数据卷: {{range .Mounts}}{{.Source}} -> {{.Destination}} {{end}}
')

echo "$CONTAINER_INFO"

# 步骤12：访问信息
echo ""
echo "🌐 访问信息"
echo "================================"
echo "✅ DomMate 现已通过Docker容器运行！"
echo ""
echo "🔗 访问地址："
echo "   主页: http://localhost:3001"
echo "   英文版: http://localhost:3001/en/"
echo "   健康检查: http://localhost:3001/health"
echo "   API接口: http://localhost:3001/api/"
echo ""
echo "🐳 Docker管理命令："
echo "   查看日志: sudo docker logs dommate-ubuntu24-test"
echo "   停止容器: sudo docker stop dommate-ubuntu24-test"
echo "   启动容器: sudo docker start dommate-ubuntu24-test"
echo "   删除容器: sudo docker rm dommate-ubuntu24-test"
echo ""
echo "💡 技术特性："
echo "   • 基础系统: Ubuntu 24.04"
echo "   • Node.js版本: 22.17.1"
echo "   • 数据持久化: Docker Volume (dommate-data)"
echo "   • 健康检查: 内置监控"
echo "   • 架构支持: ARM64/AMD64"

echo ""
echo "🎉 ================================="
echo "✅ DomMate Docker测试完成！"
echo "🎉 =================================" 