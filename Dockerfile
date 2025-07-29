# ==========================================
# DomMate - 专业域名监控平台 Dockerfile
# 基于 Node.js 22 的多阶段构建
# ==========================================

# ==========================================
# 阶段1: 前端构建
# ==========================================
FROM node:22-alpine AS frontend-builder

# 设置工作目录
WORKDIR /app

# 复制包管理文件
COPY package*.json ./

# 安装依赖
RUN npm cache clean --force && \
    npm install --legacy-peer-deps

# 复制源码
COPY . .

# 构建前端 - 多层回退策略
RUN echo "🏗️ 开始构建前端..." && \
    (echo "尝试标准构建..." && npm run build) || \
    (echo "标准构建失败，尝试跳过类型检查..." && npm run build --skip-type-check) || \
    (echo "跳过类型检查失败，尝试rollup修复..." && \
     rm -rf node_modules/@rollup/ node_modules/rollup && \
     npm install @rollup/rollup-linux-x64-musl --optional --legacy-peer-deps && \
     npm run build) || \
    (echo "Rollup修复失败，完全重新安装..." && \
     rm -rf node_modules package-lock.json && \
     npm install --legacy-peer-deps && \
     npm run build) && \
    echo "✅ 前端构建完成！"

# 验证构建产物
RUN ls -la dist/ && \
    echo "📦 前端构建产物验证完成"

# ==========================================
# 阶段2: 生产环境
# ==========================================
FROM node:22-alpine AS production

# 设置环境变量
ENV NODE_ENV=production \
    SERVER_HOST=0.0.0.0 \
    SERVER_PORT=3001 \
    DATABASE_PATH=/app/data/domains.db \
    BACKUP_DIR=/app/data/backups

# 安装系统依赖
RUN apk add --no-cache \
    curl \
    ca-certificates \
    tini \
    sqlite && \
    rm -rf /var/cache/apk/*

# 创建应用用户和组
RUN addgroup -g 1001 -S dommate && \
    adduser -S dommate -u 1001 -G dommate

# 设置工作目录
WORKDIR /app

# 复制package文件并安装生产依赖
COPY package*.json ./
RUN npm ci --only=production --no-audit --no-fund && \
    npm cache clean --force

# 创建必要目录并设置权限 - 简化版本
RUN mkdir -p /app/data /app/logs /app/backups /app/temp/exports && \
    chown -R dommate:dommate /app && \
    chmod -R 755 /app

# 复制构建好的前端文件
COPY --from=frontend-builder --chown=dommate:dommate /app/dist ./dist

# 复制后端文件
COPY --chown=dommate:dommate ./server ./server
COPY --chown=dommate:dommate ./public ./public
COPY --chown=dommate:dommate ./domain-config.js ./
COPY --chown=dommate:dommate ./env.example ./.env.example

# 复制脚本文件
COPY --chown=dommate:dommate ./password-admin-tool.sh ./
COPY --chown=dommate:dommate ./test-force-password-change.sh ./
RUN chmod +x /app/password-admin-tool.sh /app/test-force-password-change.sh 2>/dev/null || true

# 创建简化的启动脚本 - 直接内嵌，避免权限问题
RUN cat > /app/entrypoint.sh << 'EOF'
#!/bin/sh
set -e

echo "🚀 DomMate 容器启动中..."
echo "📊 Node.js 版本: $(node --version)"
echo "📊 运行用户: $(whoami)"

# 确保数据目录存在（使用当前用户权限）
echo "📁 确保数据目录存在..."
mkdir -p /app/data/backups 2>/dev/null || {
    echo "⚠️  以root权限创建数据目录..."
    sudo mkdir -p /app/data/backups
    sudo chown -R dommate:dommate /app/data
}

# 检查目录权限
if [ -w "/app/data" ]; then
    echo "✅ 数据目录权限正常"
else
    echo "⚠️  数据目录权限不足，尝试修复..."
    sudo chown -R dommate:dommate /app/data 2>/dev/null || echo "权限修复失败，继续启动..."
fi

# 显示环境信息
echo "⚙️ 环境配置:"
echo "  • 数据库路径: ${DATABASE_PATH}"
echo "  • 备份目录: ${BACKUP_DIR}"
echo "  • 服务端口: ${SERVER_PORT}"

# 检查前端构建产物
if [ -f "/app/dist/index.html" ]; then
    echo "✅ 前端构建产物存在"
else
    echo "❌ 前端构建产物缺失，检查dist目录..."
    ls -la /app/dist/ 2>/dev/null || echo "dist目录不存在"
fi

echo "🎯 启动DomMate应用..."
exec "$@"
EOF

# 设置启动脚本权限
RUN chmod +x /app/entrypoint.sh && \
    chown dommate:dommate /app/entrypoint.sh

# 安装sudo以支持权限修复（可选）
RUN apk add --no-cache sudo && \
    echo "dommate ALL=(ALL) NOPASSWD: /bin/mkdir, /bin/chown" > /etc/sudoers.d/dommate

# 切换到应用用户
USER dommate

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:${SERVER_PORT}/health || exit 1

# 暴露端口
EXPOSE 3001

# 使用tini作为init进程
ENTRYPOINT ["/sbin/tini", "--", "/app/entrypoint.sh"]

# 启动应用
CMD ["node", "server/index.js"] 