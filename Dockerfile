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

# List build output for debugging
RUN echo "=== Frontend Build Output ===" && \
    ls -la ./dist/ && \
    echo "=== Build Complete ==="

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

# Create non-root user (let system assign available UID/GID)
RUN addgroup -S dommate && \
    adduser -D -S -G dommate -s /bin/sh dommate

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

# Verify frontend build
RUN echo "=== Verifying Frontend Build ===" && \
    ls -la ./dist && \
    if [ -f "./dist/index.html" ]; then \
        echo "✅ Frontend build found"; \
        echo "Index.html size: $(stat -c%s ./dist/index.html) bytes"; \
    else \
        echo "❌ Frontend build missing index.html"; \
        echo "Available files in dist:"; \
        find ./dist -type f | head -10; \
    fi

# Create necessary directories with proper ownership
RUN mkdir -p /app/data /app/logs /app/exports /app/data/backups && \
    chown -R dommate:dommate /app && \
    chmod -R 755 /app/data /app/logs /app/exports && \
    chmod -R 775 /app/data

# Set proper permissions for volumes (will be overridden by mount, but good practice)
RUN mkdir -p /app/data-template /app/logs-template /app/exports-template && \
    chown dommate:dommate /app/data-template /app/logs-template /app/exports-template && \
    chmod 755 /app/data-template /app/logs-template /app/exports-template

# Copy startup script
COPY <<EOF /app/entrypoint.sh
#!/bin/sh
set -e

echo "Starting DomMate as user: \$(whoami)"
echo "Working directory: \$(pwd)"

# Handle Volume mount permissions (common Docker issue)
echo "Handling volume permissions..."

# Create directories if they don't exist (suppress errors for existing)
mkdir -p /app/data /app/logs /app/exports /app/data/backups 2>/dev/null || true

# Try to fix permissions if possible (fail silently if not)
if [ -w /app/data ]; then
    chmod 755 /app/data 2>/dev/null || true
    chmod 755 /app/data/backups 2>/dev/null || true
fi

if [ -w /app/logs ]; then
    chmod 755 /app/logs 2>/dev/null || true  
fi

if [ -w /app/exports ]; then
    chmod 755 /app/exports 2>/dev/null || true
fi

# Verify directory permissions
echo "Directory permissions:"
ls -la /app/data 2>/dev/null || echo "Cannot read /app/data directory"

# Check frontend files
echo "Checking frontend files:"
if [ -f "/app/dist/index.html" ]; then
    echo "✅ Frontend index.html found"
    ls -la /app/dist/ | head -5
    echo "Checking _astro directory:"
    if [ -d "/app/dist/_astro" ]; then
        echo "✅ _astro directory found"
        ls -la /app/dist/_astro/ | head -3
    else
        echo "❌ _astro directory missing"
    fi
else  
    echo "❌ Frontend index.html NOT found"
    echo "Available files in /app:"
    ls -la /app/ | head -10
fi

# Log startup information
echo "NODE_ENV: \$NODE_ENV"
echo "PORT: \$PORT"
echo "DATABASE_PATH: \$DATABASE_PATH"

# Start application directly (user already switched via USER directive)
echo "Starting Node.js application..."
exec node server/index.js
EOF

# Make startup script executable
RUN chmod +x /app/entrypoint.sh

# Switch to non-root user
USER dommate

# Verify user and permissions
RUN whoami && ls -la /app && ls -la /app/data

# Expose ports
EXPOSE 3001

# Environment variables
ENV NODE_ENV=production \
    PORT=3001 \
    SERVER_PORT=3001 \
    DATABASE_PATH=/app/data/domains.db \
    EXPORT_DIR=/app/exports \
    LOG_FILE=/app/logs/dommate.log \
    DATABASE_BACKUP_DIR=/app/data/backups

# Health check - allow more time for startup and database initialization
HEALTHCHECK --interval=30s --timeout=15s --start-period=120s --retries=5 \
    CMD curl -f http://localhost:3001/api/auth/info || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start the application
CMD ["/app/entrypoint.sh"]

# Volume mounts for persistent data
VOLUME ["/app/data", "/app/logs", "/app/exports"] 