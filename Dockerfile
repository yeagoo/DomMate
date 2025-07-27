# Multi-stage Dockerfile for DomMate
# Stage 1: Build the frontend
FROM node:18-alpine AS frontend-builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the frontend
RUN npm run build

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

# Install only production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built frontend from stage 1
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

# Start the application
CMD ["node", "server/index.js"] 