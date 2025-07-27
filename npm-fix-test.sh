#!/bin/bash

# npm依赖修复测试脚本
# 测试package.json和package-lock.json同步问题的修复

set -e

echo "🔧 npm依赖修复测试"
echo "=================="

# 检查当前package.json和package-lock.json状态
echo "📋 检查当前依赖状态..."

if [ -f "package.json" ]; then
    echo "✅ package.json 存在"
    # 检查prettier版本
    if grep -q "prettier" package.json; then
        PRETTIER_VERSION=$(grep "prettier" package.json | head -1 | sed 's/.*: *"\([^"]*\)".*/\1/')
        echo "📦 package.json prettier版本: $PRETTIER_VERSION"
    fi
else
    echo "❌ package.json 不存在"
    exit 1
fi

if [ -f "package-lock.json" ]; then
    echo "✅ package-lock.json 存在"
    # 检查lock文件中的prettier版本
    if grep -q "prettier" package-lock.json; then
        echo "📦 package-lock.json 包含prettier依赖"
    fi
else
    echo "⚠️  package-lock.json 不存在"
fi

# 测试本地npm安装（模拟Docker构建过程）
echo ""
echo "🧪 测试本地npm安装..."

# 创建临时目录进行测试
TEST_DIR="npm-test-$(date +%s)"
mkdir -p $TEST_DIR
cp package.json $TEST_DIR/
if [ -f "package-lock.json" ]; then
    cp package-lock.json $TEST_DIR/
fi

cd $TEST_DIR

echo "📁 在测试目录中: $(pwd)"

# 模拟Dockerfile中的npm安装过程
echo ""
echo "🔨 模拟Docker构建中的npm安装..."

echo "步骤1: 清理npm缓存"
npm cache clean --force

echo "步骤2: 删除node_modules和package-lock.json"
rm -rf node_modules package-lock.json

echo "步骤3: 执行npm install"
if npm install; then
    echo "✅ npm install 成功"
    
    # 检查安装结果
    if [ -d "node_modules" ]; then
        NODE_MODULES_COUNT=$(ls -1 node_modules | wc -l)
        echo "📦 安装了 $NODE_MODULES_COUNT 个包"
    fi
    
    if [ -f "package-lock.json" ]; then
        echo "✅ 生成了新的package-lock.json"
    fi
    
    # 测试构建命令
    echo ""
    echo "🏗️  测试构建命令..."
    if npm run build; then
        echo "✅ npm run build 成功"
    else
        echo "❌ npm run build 失败"
    fi
    
else
    echo "❌ npm install 失败"
    cd ..
    rm -rf $TEST_DIR
    exit 1
fi

# 清理测试目录
cd ..
rm -rf $TEST_DIR

echo ""
echo "🎉 npm依赖修复测试完成！"
echo ""
echo "✅ 修复要点："
echo "  - 清理npm缓存"
echo "  - 删除旧的package-lock.json"
echo "  - 使用npm install而不是npm ci"
echo ""
echo "现在可以测试Docker构建："
echo "  ./quick-test.sh" 