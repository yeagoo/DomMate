# ==========================================
# DomMate - Node.js 22 Alpine版 Dockerfile
# 基于官方Node.js 22 Alpine镜像
# ==========================================

FROM node:22-alpine

# 设置环境变量
ENV NODE_ENV=production
ENV SERVER_HOST=0.0.0.0
ENV SERVER_PORT=3001
ENV DATABASE_PATH=/app/data/domains.db
ENV BACKUP_DIR=/app/data/backups

# 安装额外依赖
RUN apk add --no-cache \
    sqlite \
    curl \
    bash \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# 创建应用用户
RUN addgroup -g 1001 -S dommate && \
    adduser -S dommate -u 1001 -G dommate

# 设置工作目录
WORKDIR /app

# 创建必要目录
RUN mkdir -p /app/data /app/logs /app/backups /app/temp/exports && \
    chown -R dommate:dommate /app

# 复制package文件
COPY --chown=dommate:dommate package*.json ./

# 设置npm配置并安装依赖
RUN npm config set registry https://registry.npmmirror.com/ || \
    npm config set registry https://registry.npm.taobao.org/ || \
    echo "使用默认registry" && \
    npm cache clean --force && \
    npm install --production --legacy-peer-deps --no-audit --no-fund && \
    npm cache clean --force

# 复制应用文件
COPY --chown=dommate:dommate server/ ./server/
COPY --chown=dommate:dommate dist/ ./dist/
COPY --chown=dommate:dommate public/ ./public/
COPY --chown=dommate:dommate domain-config.js ./
COPY --chown=dommate:dommate env.example ./.env.example

# 创建启动脚本
RUN cat > /app/entrypoint.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 DomMate 容器启动中..."
echo "📊 Node.js 版本: $(node --version)"
echo "📊 npm 版本: $(npm --version)"
echo "📊 系统架构: $(uname -m)"
echo "📊 Alpine 版本: $(cat /etc/alpine-release)"
echo "📊 运行用户: $(whoami)"

# 确保数据目录存在
echo "📁 确保数据目录存在..."
mkdir -p /app/data/backups

# 检查目录权限
if [ -w "/app/data" ]; then
    echo "✅ 数据目录权限正常"
else
    echo "⚠️ 数据目录权限不足，尝试修复..."
    chmod -R 755 /app/data 2>/dev/null || echo "权限修复失败，继续启动..."
fi

# 显示环境信息
echo "⚙️ 环境配置:"
echo "  • 数据库路径: ${DATABASE_PATH}"
echo "  • 备份目录: ${BACKUP_DIR}"
echo "  • 服务端口: ${SERVER_PORT}"
echo "  • Node环境: ${NODE_ENV}"

# 检查前端构建产物
if [ -f "/app/dist/index.html" ]; then
    echo "✅ 前端构建产物存在"
    echo "📊 前端文件数量: $(ls /app/dist/ | wc -l)"
    ls -la /app/dist/
else
    echo "❌ 前端构建产物缺失"
fi

# 检查server目录
if [ -f "/app/server/index.js" ]; then
    echo "✅ 后端服务文件存在"
else
    echo "❌ 后端服务文件缺失"
fi

# 检查node_modules
if [ -d "/app/node_modules" ]; then
    echo "✅ Node.js依赖存在"
    echo "📦 依赖包数量: $(ls /app/node_modules/ | wc -l)"
else
    echo "❌ Node.js依赖缺失"
fi

echo "🎯 启动DomMate应用..."
exec "$@"
EOF

# 设置权限
RUN chmod +x /app/entrypoint.sh && \
    chown dommate:dommate /app/entrypoint.sh && \
    chown -R dommate:dommate /app

# 切换用户
USER dommate

# 暴露端口
EXPOSE 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:${SERVER_PORT}/health || exit 1

# 启动应用
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["node", "server/index.js"] 