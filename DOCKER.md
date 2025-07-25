# 🐳 DomMate Docker 部署指南

## 📋 概述

DomMate 提供了完整的 Docker 容器化解决方案，支持快速部署和扩展。本指南将帮助您使用 Docker 和 Docker Compose 部署 DomMate。

## 🚀 快速开始

### 使用预构建镜像

```bash
# 拉取最新镜像
docker pull ghcr.io/yeagoo/dommate:latest

# 创建数据目录
mkdir -p ./data ./logs ./exports

# 运行容器
docker run -d \
  --name dommate \
  -p 3001:3001 \
  -v ./data:/app/data \
  -v ./logs:/app/logs \
  -v ./exports:/app/exports \
  -e NODE_ENV=production \
  ghcr.io/yeagoo/dommate:latest
```

### 使用 Docker Compose (推荐)

```bash
# 克隆项目
git clone https://github.com/yeagoo/DomMate.git
cd DomMate

# 创建环境文件
cp env.example .env

# 编辑环境配置
nano .env

# 启动服务
docker-compose up -d
```

## 📁 项目结构

```
DomMate/
├── Dockerfile                 # 生产环境镜像构建
├── .dockerignore             # Docker构建忽略文件
├── docker-compose.yml        # 生产环境编排
├── docker-compose.dev.yml    # 开发环境编排
├── env.example               # 环境变量模板
├── nginx/                    # Nginx配置文件
│   └── conf.d/
│       └── dommate.conf      # 反向代理配置
└── .github/workflows/        # CI/CD自动构建
    └── docker-build.yml
```

## ⚙️ 环境配置

### 创建环境文件

```bash
# 复制模板文件
cp env.example .env

# 生成安全密钥
openssl rand -base64 32  # 用于JWT_SECRET
openssl rand -base64 32  # 用于SESSION_SECRET
```

### 关键环境变量

```bash
# 服务器配置
SERVER_PORT=3001
NODE_ENV=production

# 安全配置
JWT_SECRET=your-super-secure-jwt-secret-key-here
SESSION_SECRET=your-super-secure-session-secret-key-here

# 数据库配置
DATABASE_PATH=/app/data/domains.db

# 邮件配置 (可选)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
```

## 🏗️ 部署方案

### 1. 单容器部署

适用于小型项目或测试环境：

```bash
docker run -d \
  --name dommate \
  --restart unless-stopped \
  -p 3001:3001 \
  -v dommate_data:/app/data \
  -v dommate_logs:/app/logs \
  -v dommate_exports:/app/exports \
  --env-file .env \
  ghcr.io/yeagoo/dommate:latest
```

### 2. Docker Compose 部署

适用于生产环境：

```yaml
# docker-compose.yml
version: '3.8'

services:
  dommate:
    image: ghcr.io/yeagoo/dommate:latest
    container_name: dommate
    restart: unless-stopped
    ports:
      - "3001:3001"
    env_file:
      - .env
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
      - ./exports:/app/exports
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/auth/info"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### 3. 带反向代理的部署

生产环境推荐配置：

```bash
# 启动完整栈
docker-compose up -d

# 包含以下服务：
# - dommate: 主应用
# - nginx: 反向代理
```

## 🔧 高级配置

### 自定义 Nginx 配置

编辑 `nginx/conf.d/dommate.conf`：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://dommate:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### SSL/HTTPS 配置

1. 获取 SSL 证书：

```bash
# 使用 Let's Encrypt
certbot certonly --webroot -w /var/www/html -d your-domain.com
```

2. 更新 Nginx 配置以启用 HTTPS

3. 重启 Nginx 容器：

```bash
docker-compose restart nginx
```

### 资源限制

在 `docker-compose.yml` 中设置资源限制：

```yaml
services:
  dommate:
    # ...
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '1.0'
        reservations:
          memory: 256M
          cpus: '0.5'
```

## 📊 监控和日志

### 查看日志

```bash
# 查看容器日志
docker-compose logs -f dommate

# 查看应用日志
docker exec -it dommate tail -f /app/logs/dommate.log

# 查看 Nginx 日志
docker-compose logs -f nginx
```

### 健康检查

```bash
# 检查容器状态
docker-compose ps

# 手动健康检查
curl -f http://localhost:3001/api/auth/info
```

### 监控指标

容器会暴露以下监控端点：

- Health Check: `GET /api/auth/info`
- Metrics: `GET /api/metrics` (如果启用)

## 💾 数据管理

### 数据备份

```bash
# 备份数据卷
docker run --rm \
  -v dommate_data:/data \
  -v $(pwd)/backup:/backup \
  alpine tar czf /backup/dommate-backup-$(date +%Y%m%d).tar.gz -C /data .

# 备份数据库
docker exec dommate sqlite3 /app/data/domains.db ".backup /app/data/backup.db"
```

### 数据恢复

```bash
# 恢复数据卷
docker run --rm \
  -v dommate_data:/data \
  -v $(pwd)/backup:/backup \
  alpine tar xzf /backup/dommate-backup-20240101.tar.gz -C /data

# 恢复数据库
docker cp backup.db dommate:/app/data/domains.db
docker-compose restart dommate
```

### 数据迁移

```bash
# 导出数据
docker exec dommate node -e "
const db = require('./server/database.js');
db.exportData('./exports/migration.json');
"

# 导入数据到新实例
docker exec new_dommate node -e "
const db = require('./server/database.js');
db.importData('./exports/migration.json');
"
```

## 🔄 更新和维护

### 更新镜像

```bash
# 拉取最新镜像
docker-compose pull

# 重启服务
docker-compose up -d

# 清理旧镜像
docker image prune -f
```

### 版本回滚

```bash
# 使用特定版本
docker-compose down
docker-compose up -d --build dommate:v1.5.0
```

### 定期维护

```bash
# 清理日志文件
docker exec dommate find /app/logs -name "*.log" -mtime +30 -delete

# 清理导出文件
docker exec dommate find /app/exports -name "*.csv" -mtime +7 -delete

# 数据库优化
docker exec dommate sqlite3 /app/data/domains.db "VACUUM;"
```

## 🛠️ 开发环境

### 本地开发

```bash
# 使用开发配置
docker-compose -f docker-compose.dev.yml up -d

# 包含开发工具
docker-compose -f docker-compose.dev.yml --profile tools up -d

# 邮件测试
docker-compose -f docker-compose.dev.yml --profile mail-testing up -d
```

### 热重载开发

```bash
# 挂载源代码进行开发
docker-compose -f docker-compose.dev.yml up -d

# 查看开发日志
docker-compose -f docker-compose.dev.yml logs -f dommate_dev
```

## 🚨 故障排除

### 常见问题

1. **端口占用**
   ```bash
   # 检查端口使用
   netstat -tlnp | grep :3001
   
   # 更改端口映射
   # 在 docker-compose.yml 中修改端口
   ```

2. **权限问题**
   ```bash
   # 修复文件权限
   sudo chown -R 1000:1000 ./data ./logs ./exports
   ```

3. **数据库锁定**
   ```bash
   # 重启容器
   docker-compose restart dommate
   ```

4. **内存不足**
   ```bash
   # 检查内存使用
   docker stats dommate
   
   # 增加内存限制
   # 在 docker-compose.yml 中调整 memory 限制
   ```

### 调试技巧

```bash
# 进入容器调试
docker exec -it dommate sh

# 查看环境变量
docker exec dommate env

# 测试网络连接
docker exec dommate curl -f http://localhost:3001/api/auth/info

# 查看磁盘使用
docker exec dommate df -h
```

## 📈 性能优化

### 容器优化

1. 使用多阶段构建减少镜像大小
2. 设置合适的资源限制
3. 启用健康检查
4. 使用 Alpine Linux 基础镜像

### 网络优化

1. 使用 Nginx 反向代理
2. 启用 gzip 压缩
3. 设置合适的缓存头
4. 使用 CDN 加速静态资源

### 存储优化

1. 使用命名卷而非绑定挂载
2. 定期清理日志和临时文件
3. 数据库定期 VACUUM 操作
4. 合理设置日志轮转

## 🔐 安全建议

1. **更新密钥**: 定期更新 JWT 和 Session 密钥
2. **网络隔离**: 使用 Docker 网络隔离服务
3. **最小权限**: 容器以非 root 用户运行
4. **SSL 终止**: 在反向代理层处理 SSL
5. **安全扫描**: 定期扫描镜像漏洞

## 📞 支持

如果在 Docker 部署过程中遇到问题：

- 📖 查看 [GitHub Issues](https://github.com/yeagoo/DomMate/issues)
- 💬 参与 [GitHub Discussions](https://github.com/yeagoo/DomMate/discussions)
- 📧 发送邮件至 support@dommate.com

---

**🎉 恭喜！您已成功部署 DomMate！**

现在可以通过 `http://localhost:3001` 访问您的域名监控平台了。 