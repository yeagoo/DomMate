#!/bin/bash

echo "🔧 第十四阶段修复：Docker构建文件缺失问题"
echo "============================================="
echo ""

# 检查当前目录
echo "📍 当前目录: $(pwd)"
echo ""

# 检查docker-entrypoint.sh文件
if [ -f "docker-entrypoint.sh" ]; then
    echo "✅ docker-entrypoint.sh 文件存在"
    ls -la docker-entrypoint.sh
else
    echo "❌ docker-entrypoint.sh 文件不存在"
    exit 1
fi
echo ""

# 设置可执行权限
echo "🔧 设置文件权限..."
chmod +x docker-entrypoint.sh
echo "✅ 权限设置完成"
echo ""

# 检查git状态
echo "🔍 检查git状态..."
git status --porcelain docker-entrypoint.sh
if [ $? -eq 0 ]; then
    echo "✅ git状态检查正常"
else
    echo "❌ git状态检查失败"
    exit 1
fi
echo ""

# 添加文件到git
echo "📝 添加文件到git..."
git add docker-entrypoint.sh
if [ $? -eq 0 ]; then
    echo "✅ 文件添加成功"
else
    echo "❌ 文件添加失败"
    exit 1
fi
echo ""

# 检查暂存状态
echo "🔍 检查暂存状态..."
git status --cached docker-entrypoint.sh 
echo ""

# 提交更改
echo "💾 提交更改..."
git commit -m "🔧 第十四阶段修复：添加缺失的Docker启动脚本

- 重新添加 docker-entrypoint.sh 到git仓库
- 修复 GitHub Actions 构建失败问题  
- 确保Docker容器启动脚本正确包含在构建中
- 解决 'docker-entrypoint.sh: not found' 错误

这是第十四阶段修复：解决Docker构建文件缺失问题
前十三阶段：CI/CD + Express + Astro + API + 认证 + 持久化 + 权限修复
第十四阶段：Docker构建文件缺失修复，确保所有必需文件被正确包含"

if [ $? -eq 0 ]; then
    echo "✅ 提交成功"
else
    echo "❌ 提交失败"
    exit 1
fi
echo ""

# 推送到GitHub
echo "🚀 推送到GitHub..."
git push origin main
if [ $? -eq 0 ]; then
    echo "✅ 推送成功"
else
    echo "❌ 推送失败"
    exit 1
fi
echo ""

echo "🎉 第十四阶段修复完成！"
echo "========================================="
echo ""
echo "✅ 修复结果："
echo "  - docker-entrypoint.sh 已添加到git仓库"
echo "  - 修复已提交并推送到GitHub"
echo "  - GitHub Actions构建应该恢复正常"
echo ""
echo "🔍 验证步骤："
echo "  1. 访问: https://github.com/yeagoo/dommate/actions"
echo "  2. 确认最新构建成功（绿色✅）"  
echo "  3. 等待Docker镜像构建完成"
echo "  4. 执行容器重新部署"
echo ""
echo "🐳 重新部署命令："
echo "  docker stop dommate && docker rm dommate"
echo "  docker pull ghcr.io/yeagoo/dommate:latest"
echo "  docker run -d --name dommate -p 3001:3001 -v dommate-data:/app/data ghcr.io/yeagoo/dommate:latest"
echo ""
echo "🎊 DomMate 十四阶段修复即将完成！" 