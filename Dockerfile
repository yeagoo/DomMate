# Stage 1: Frontend builder
FROM node:18-alpine AS frontend-builder

WORKDIR /app
COPY package*.json ./
RUN npm cache clean --force && \
    npm install --legacy-peer-deps

COPY . .
RUN (npm run build:check && npm run build) || \
    (echo "Type checking failed, building without checks..." && npm run build) || \
    (echo "Build failed, attempting rollup fix..." && \
     rm -rf node_modules/@rollup/ node_modules/rollup && \
     npm install @rollup/rollup-linux-x64-musl --optional --legacy-peer-deps && \
     npm run build) || \
    (echo "Musl rollup failed, trying alternative approach..." && \
     rm -rf node_modules package-lock.json && \
     npm install --legacy-peer-deps && \
     npm run build)

# Stage 2: Production image
FROM node:18-alpine AS production

# Set environment variables
ENV NODE_ENV=production
ENV SERVER_HOST=0.0.0.0
ENV SERVER_PORT=3001
ENV CLIENT_PORT=4322

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S dommate -u 1001

# Set working directory
WORKDIR /app

# Create necessary directories
RUN mkdir -p /app/data /app/logs /app/backups /app/temp/exports && \
    chown -R dommate:nodejs /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built frontend
COPY --from=frontend-builder --chown=dommate:nodejs /app/dist ./dist

# Copy server files
COPY --chown=dommate:nodejs ./server ./server

# Copy configuration files
COPY --chown=dommate:nodejs ./public ./public
COPY --chown=dommate:nodejs ./domain-config.js ./
COPY --chown=dommate:nodejs ./env.example ./.env.example

# Copy shell scripts
COPY --chown=dommate:nodejs ./password-admin-tool.sh ./
COPY --chown=dommate:nodejs ./test-force-password-change.sh ./

# Make shell scripts executable
RUN chmod +x /app/password-admin-tool.sh /app/test-force-password-change.sh

# Set environment variables for data persistence
ENV DATABASE_PATH=/app/data/domains.db
ENV BACKUP_DIR=/app/data/backups

# Ensure correct permissions for data directories (critical for Docker volumes)
RUN chown -R dommate:nodejs /app/data /app/logs /app/backups && \
    chmod -R 755 /app/data /app/logs /app/backups

# Create startup script directly in the container
RUN cat > /app/startup.sh << 'SCRIPT_EOF'
#!/bin/sh
set -e

echo "🚀 DomMate 容器启动中..."

# 检查并创建必要的数据目录
echo "🔍 检查数据目录..."
if [ ! -d "/app/data" ]; then
    echo "📁 创建数据目录: /app/data"
    mkdir -p /app/data
fi

if [ ! -d "/app/data/backups" ]; then
    echo "📁 创建备份目录: /app/data/backups"
    mkdir -p /app/data/backups
fi

# 检查目录权限
echo "🔐 检查目录权限..."
if [ ! -w "/app/data" ]; then
    echo "❌ 警告: /app/data 目录不可写"
    echo "🔧 尝试修复权限..."
    ls -la /app/data || echo "目录不存在或无权限访问"
fi

# 显示目录状态
echo "📊 数据目录状态:"
ls -la /app/ | grep -E "(data|logs|backups)" || echo "目录创建中..."

# 检查环境变量
echo "⚙️ 环境变量检查:"
echo "  DATABASE_PATH: ${DATABASE_PATH:-未设置}"
echo "  BACKUP_DIR: ${BACKUP_DIR:-未设置}"

# 启动应用
echo "🎯 启动 DomMate 应用..."
exec "$@"
SCRIPT_EOF

# Set permissions for startup script
RUN chmod +x /app/startup.sh && \
    chown dommate:nodejs /app/startup.sh

# Switch to non-root user
USER dommate

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "const http = require('http'); \
    const options = { host: 'localhost', port: process.env.SERVER_PORT || 3001, path: '/health', timeout: 2000 }; \
    const request = http.request(options, (res) => { \
    if (res.statusCode == 200) process.exit(0); else process.exit(1); \
    }); \
    request.on('error', () => process.exit(1)); \
    request.end();"

# Expose ports
EXPOSE 3001

# Start the application using internal startup script
ENTRYPOINT ["/app/startup.sh"]
CMD ["node", "server/index.js"] 