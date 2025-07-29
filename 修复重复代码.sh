#!/bin/bash

# 修复server/index.js中的重复代码

echo "🔧 修复server/index.js中的重复代码..."

# 备份原文件
cp server/index.js server/index.js.backup

# 删除从第2433行开始的重复代码
sed -i '2433,$d' server/index.js

echo "✅ 重复代码已清理"
echo "📋 备份文件: server/index.js.backup"

# 验证文件
echo "🔍 文件行数: $(wc -l < server/index.js)"
echo "📄 文件末尾:"
tail -5 server/index.js 