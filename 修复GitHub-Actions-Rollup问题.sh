#!/bin/bash

# 🔧 修复GitHub Actions Rollup构建问题
# 适用于本地开发和CI/CD环境

set -e

echo "🚀 DomMate Rollup构建问题修复脚本"
echo "=================================="

# 检测系统信息
echo "🔍 检测系统环境..."
echo "- 操作系统: $(uname -s)"
echo "- 架构: $(uname -m)"
echo "- Node.js版本: $(node --version)"
echo "- npm版本: $(npm --version)"

# 检测libc类型
if ldd --version 2>/dev/null | grep -q "GNU libc"; then
    LIBC_TYPE="glibc"
    ROLLUP_PACKAGE="@rollup/rollup-linux-x64-gnu"
elif ldd --version 2>/dev/null | grep -q "musl"; then
    LIBC_TYPE="musl"
    ROLLUP_PACKAGE="@rollup/rollup-linux-x64-musl"
else
    echo "⚠️  无法检测libc类型，默认使用glibc"
    LIBC_TYPE="glibc"
    ROLLUP_PACKAGE="@rollup/rollup-linux-x64-gnu"
fi

echo "- Libc类型: $LIBC_TYPE"
echo "- 推荐Rollup包: $ROLLUP_PACKAGE"
echo ""

# 函数：清理rollup模块
cleanup_rollup() {
    echo "🧹 清理现有rollup模块..."
    rm -rf node_modules/@rollup/ node_modules/rollup 2>/dev/null || true
    echo "✅ rollup模块清理完成"
}

# 函数：安装特定rollup包
install_rollup() {
    local package=$1
    echo "📦 安装 $package ..."
    npm install "$package" --optional --legacy-peer-deps --no-audit || {
        echo "❌ 安装 $package 失败"
        return 1
    }
    echo "✅ $package 安装成功"
}

# 函数：测试构建
test_build() {
    echo "🏗️ 测试前端构建..."
    if npm run build; then
        echo "✅ 构建成功"
        return 0
    else
        echo "❌ 构建失败"
        return 1
    fi
}

# 函数：完全重新安装
full_reinstall() {
    echo "🔄 执行完全重新安装..."
    rm -rf node_modules package-lock.json
    npm cache clean --force
    
    echo "📦 重新安装依赖..."
    npm install --legacy-peer-deps --no-audit --no-fund
    
    echo "🔧 安装正确的rollup版本..."
    install_rollup "$ROLLUP_PACKAGE"
}

# 主修复流程
echo "🚀 开始修复流程..."
echo ""

# 第一步：尝试标准构建
echo "📋 步骤1: 测试标准构建"
if test_build; then
    echo "🎉 标准构建已成功，无需修复"
    exit 0
fi

# 第二步：清理并安装正确的rollup
echo ""
echo "📋 步骤2: 清理并安装正确的rollup"
cleanup_rollup
install_rollup "$ROLLUP_PACKAGE"

if test_build; then
    echo "🎉 rollup修复成功！"
    exit 0
fi

# 第三步：完全重新安装
echo ""
echo "📋 步骤3: 完全重新安装依赖"
full_reinstall

if test_build; then
    echo "🎉 完全重新安装后构建成功！"
    exit 0
fi

# 第四步：尝试其他rollup包
echo ""
echo "📋 步骤4: 尝试其他rollup包"
if [ "$LIBC_TYPE" = "glibc" ]; then
    OTHER_ROLLUP="@rollup/rollup-linux-x64-musl"
else
    OTHER_ROLLUP="@rollup/rollup-linux-x64-gnu"
fi

cleanup_rollup
echo "🔧 尝试安装 $OTHER_ROLLUP ..."
install_rollup "$OTHER_ROLLUP" || true

if test_build; then
    echo "🎉 使用备选rollup包构建成功！"
    exit 0
fi

# 第五步：诊断和建议
echo ""
echo "💥 所有修复尝试都失败了"
echo "📋 诊断信息:"
echo "- Node modules目录: $([ -d "node_modules" ] && echo "存在" || echo "不存在")"
echo "- Rollup相关模块:"
find node_modules -name "*rollup*" -type d 2>/dev/null | head -5 || echo "  未找到rollup模块"

echo ""
echo "🔧 建议操作:"
echo "1. 确保系统架构与Node.js版本兼容"
echo "2. 尝试更新Node.js到最新LTS版本"
echo "3. 检查网络连接和npm注册表设置"
echo "4. 考虑使用Docker构建环境"

echo ""
echo "📞 如需帮助，请查看："
echo "- GitHub Issues: https://github.com/yeagoo/DomMate/issues"
echo "- Rollup文档: https://rollupjs.org/troubleshooting/"

exit 1 