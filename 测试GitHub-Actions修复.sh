#!/bin/bash

# 🧪 测试GitHub Actions Rollup修复
echo "🧪 测试DomMate前端构建修复"
echo "============================"

# 检测系统环境
echo "🔍 系统信息:"
echo "- OS: $(uname -s)"
echo "- Architecture: $(uname -m)"
echo "- Node.js: $(node --version)"
echo "- npm: $(npm --version)"

# 检测libc类型
if ldd --version 2>/dev/null | grep -q "GNU libc"; then
    echo "- Libc: glibc"
    ROLLUP_PKG="@rollup/rollup-linux-x64-gnu"
elif ldd --version 2>/dev/null | grep -q "musl"; then
    echo "- Libc: musl"  
    ROLLUP_PKG="@rollup/rollup-linux-x64-musl"
else
    echo "- Libc: 未知"
    ROLLUP_PKG="@rollup/rollup-linux-x64-gnu"
fi

echo "- 推荐Rollup: $ROLLUP_PKG"
echo ""

# 测试构建
echo "🏗️ 开始构建测试..."

# 第一次尝试
echo "📋 尝试1: 标准构建"
if npm run build 2>/dev/null; then
    echo "✅ 标准构建成功"
    echo "📁 构建产物:"
    ls -la dist/ | head -10
    exit 0
fi

echo "❌ 标准构建失败"

# 第二次尝试：修复rollup
echo "📋 尝试2: 修复rollup依赖"
rm -rf node_modules/@rollup/ node_modules/rollup 2>/dev/null || true
npm install $ROLLUP_PKG --optional --legacy-peer-deps --no-audit 2>/dev/null

if npm run build 2>/dev/null; then
    echo "✅ rollup修复后构建成功"
    echo "📁 构建产物:"
    ls -la dist/ | head -10
    exit 0
fi

echo "❌ rollup修复失败"
echo "💡 建议使用完整的修复脚本或Docker构建"

exit 1 