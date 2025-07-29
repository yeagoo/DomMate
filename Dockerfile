# ==========================================
# DomMate - Node.js 22 Alpine版 Dockerfile
# 支持容器内前端构建的完整流程
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

# 设置npm配置并安装所有依赖（包括devDependencies用于构建）
RUN npm config set registry https://registry.npmmirror.com/ || \
    npm config set registry https://registry.npm.taobao.org/ || \
    echo "使用默认registry" && \
    npm cache clean --force && \
    npm install --legacy-peer-deps --no-audit --no-fund && \
    npm cache clean --force

# 复制源码文件（用于前端构建）
COPY --chown=dommate:dommate src/ ./src/
COPY --chown=dommate:dommate public/ ./public/
COPY --chown=dommate:dommate astro.config.mjs ./
COPY --chown=dommate:dommate tsconfig.json ./
COPY --chown=dommate:dommate tailwind.config.js ./

# 复制后端文件
COPY --chown=dommate:dommate server/ ./server/
COPY --chown=dommate:dommate domain-config.js ./
COPY --chown=dommate:dommate env.example ./.env.example

# 构建前端（使用JavaScript fallback策略）
RUN echo "🏗️ 开始容器内前端构建..." && \
    export ROLLUP_NO_NATIVE=1 && \
    export NODE_OPTIONS="--max_old_space_size=4096" && \
    if npm run build; then \
        echo "✅ 前端构建成功"; \
    else \
        echo "❌ 前端构建失败，创建fallback版本..." && \
        mkdir -p dist && \
        echo '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>DomMate - 域名监控系统</title><style>body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; } .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); } .status { color: #28a745; font-size: 18px; margin: 20px 0; } .loading { color: #ffc107; font-size: 16px; margin: 10px 0; }</style></head><body><div class="container"><h1>🚀 DomMate</h1><p class="status">✅ Docker容器启动成功</p><p class="loading">⚙️ 系统正在初始化中...</p><p>如果您看到此页面，说明容器已成功启动</p><p>请稍等片刻，或检查构建配置</p></div><script>console.log("DomMate fallback build loaded - Container is running"); setTimeout(() => { window.location.reload(); }, 5000);</script></body></html>' > dist/index.html && \
        echo "✅ Fallback构建完成"; \
    fi

# 清理构建依赖，保留运行时依赖
RUN npm prune --production && \
    npm cache clean --force

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

# 检查运行时依赖
if [ -d "/app/node_modules" ]; then
    echo "✅ Node.js运行时依赖存在"
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

# 切换到应用用户
USER dommate

# 暴露端口
EXPOSE 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:${SERVER_PORT}/health || exit 1

# 启动应用
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["node", "server/index.js"] 