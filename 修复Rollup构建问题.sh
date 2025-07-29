#!/bin/bash

# Rollup 构建问题修复脚本

echo "🔧 =================================="
echo "🚀 Rollup 构建问题修复脚本"
echo "🔧 =================================="

echo ""
echo "📋 问题分析:"
echo "   ❌ GitHub Actions中无法找到 @rollup/rollup-linux-x64-gnu"
echo "   ❌ 平台不匹配 (想要musl但实际是glibc)"
echo "   ❌ npm可选依赖bug导致构建失败"

echo ""
echo "🎯 修复方案:"

echo ""
echo "1️⃣ 清理和重新安装依赖"
echo "   rm -rf node_modules package-lock.json"
echo "   npm cache clean --force"
echo "   npm install --legacy-peer-deps --no-optional"

echo ""
echo "2️⃣ 手动安装正确的Rollup平台依赖"
echo "   npm install @rollup/rollup-linux-x64-gnu --save-dev --legacy-peer-deps"

echo ""
echo "3️⃣ 使用环境变量fallback"
echo "   ROLLUP_NO_NATIVE=1 npm run build"

echo ""
echo "💡 立即修复 (在本地执行):"

# 修复本地Rollup问题
if [ -d "node_modules" ]; then
    echo "🔧 开始修复本地Rollup依赖..."
    
    # 备份package-lock.json
    if [ -f "package-lock.json" ]; then
        cp package-lock.json package-lock.json.backup
        echo "✅ 已备份 package-lock.json"
    fi
    
    # 清理Rollup相关依赖
    echo "🧹 清理Rollup依赖..."
    rm -rf node_modules/@rollup/
    rm -rf node_modules/rollup/
    
    # 重新安装正确的依赖
    echo "📦 重新安装Rollup依赖..."
    npm install @rollup/rollup-linux-x64-gnu --save-dev --legacy-peer-deps || {
        echo "⚠️ 无法安装原生依赖，将使用JavaScript fallback"
    }
    
    echo "✅ 本地修复完成"
else
    echo "ℹ️ 未找到node_modules目录，跳过本地修复"
fi

echo ""
echo "🎉 修复完成后测试:"
echo "   npm run build"
echo "   # 如果仍然失败，使用:"
echo "   ROLLUP_NO_NATIVE=1 npm run build"

echo ""
echo "📚 GitHub Actions 将自动应用以下修复:"
echo "   ✅ 清理npm缓存"
echo "   ✅ 使用 --no-optional 避免平台冲突"
echo "   ✅ 手动安装正确的平台依赖"
echo "   ✅ 多级fallback构建策略"
echo "   ✅ ROLLUP_NO_NATIVE 环境变量备选方案"

echo ""
echo "🌐 修复后重新推送即可触发成功构建!" 