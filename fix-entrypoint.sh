#!/bin/bash
echo "🔧 第十四阶段修复：Docker构建文件缺失问题"
echo "================================================"

# 设置文件权限
chmod +x docker-entrypoint.sh
echo "✅ 设置docker-entrypoint.sh可执行权限"

# 检查文件状态
echo "📁 文件状态:"
ls -la docker-entrypoint.sh

# 添加到git
git add docker-entrypoint.sh
echo "✅ 添加docker-entrypoint.sh到git"

# 提交更改
git commit -m "🔧 第十四阶段修复：添加缺失的Docker启动脚本

- 重新添加 docker-entrypoint.sh 到git仓库
- 修复 GitHub Actions 构建失败问题
- 确保Docker容器启动脚本正确包含在构建中
- 解决 'docker-entrypoint.sh: not found' 错误

这是第十四阶段修复：解决Docker构建文件缺失问题
前十三阶段：CI/CD + Express + Astro + API + 认证 + 持久化 + 权限修复
第十四阶段：Docker构建文件缺失修复，确保所有必需文件被正确包含"

# 推送到远程仓库
git push origin main
echo "✅ 推送修复到GitHub"

echo ""
echo "🎉 第十四阶段修复完成！"
echo "现在GitHub Actions应该能够成功构建Docker镜像" 