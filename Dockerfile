# ================================
# DomMate - Production Dockerfile
# ================================

# Build stage for frontend
FROM node:18-alpine AS frontend-builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies for building
RUN npm cache clean --force && \
    rm -rf node_modules package-lock.json && \
    npm install --silent

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# ================================
# Production stage
# ================================
FROM node:18-alpine AS production

# Metadata
LABEL maintainer="DomMate Team <support@dommate.com>"
LABEL description="Professional Domain Expiration Monitoring Platform"
LABEL version="2.0.0"
LABEL org.opencontainers.image.source="https://github.com/yeagoo/DomMate"
LABEL org.opencontainers.image.documentation="https://github.com/yeagoo/DomMate/blob/main/README.md"
LABEL org.opencontainers.image.licenses="MIT"

# Install system dependencies
RUN apk add --no-cache \
    dumb-init \
    tzdata \
    curl \
    su-exec \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -S dommate && \
    adduser -u 1000 -D -S -G dommate -s /bin/sh dommate

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm cache clean --force && \
    rm -rf node_modules package-lock.json && \
    npm install --only=production --silent && \
    npm cache clean --force

# Copy built frontend from build stage
COPY --from=frontend-builder /app/dist ./dist

# Copy backend source code
COPY server ./server
COPY public ./public
COPY domain-config.js ./
COPY env.example ./

# Create necessary directories
RUN mkdir -p /app/data /app/logs /app/exports /app/data/backups && \
    chown -R dommate:dommate /app

# Copy startup script
COPY <<EOF /app/entrypoint.sh
#!/bin/sh
set -e

# Create directories if they don't exist
mkdir -p /app/data /app/logs /app/exports /app/data/backups

# Set proper permissions
chown -R dommate:dommate /app/data /app/logs /app/exports

# Set timezone if TZ is provided
if [ -n "\$TZ" ]; then
    ln -snf /usr/share/zoneinfo/\$TZ /etc/localtime
    echo \$TZ > /etc/timezone
fi

# Change to non-root user and start application
exec su-exec dommate node server/index.js
EOF

# Make startup script executable
RUN chmod +x /app/entrypoint.sh

# Switch to non-root user
USER dommate

# Expose ports
EXPOSE 3001

# Environment variables
ENV NODE_ENV=production \
    SERVER_PORT=3001 \
    DATABASE_PATH=/app/data/domains.db \
    EXPORT_DIR=/app/exports \
    LOG_FILE=/app/logs/dommate.log \
    DATABASE_BACKUP_DIR=/app/data/backups

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3001/api/auth/info || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start the application
CMD ["/app/entrypoint.sh"]

# Volume mounts for persistent data
VOLUME ["/app/data", "/app/logs", "/app/exports"] 