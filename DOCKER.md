# 🐳 DomMate Docker 部署指南

本指南将帮助您使用 Docker 快速部署 DomMate 域名监控平台。

## 📋 快速开始

### 方式一：使用预构建镜像（推荐）

```bash
# 1. 下载配置文件
curl -O https://raw.githubusercontent.com/yeagoo/DomMate/main/docker-compose.yml
curl -O https://raw.githubusercontent.com/yeagoo/DomMate/main/env.example

# 2. 配置环境变量
cp env.example env.production
# 编辑 env.production 文件设置您的配置

# 3. 创建数据目录
mkdir -p docker-data/{data,logs,backups,temp}

# 4. 启动服务
docker-compose up -d

# 5. 访问应用
# 打开浏览器访问 http://localhost:3001
# 默认密码：admin123
```

### 方式二：从源代码构建

```bash
# 1. 克隆仓库
git clone https://github.com/yeagoo/DomMate.git
cd DomMate

# 2. 配置环境变量
cp env.example env.production
# 编辑环境变量文件

# 3. 构建并启动
docker-compose up --build -d

# 4. 查看日志
docker-compose logs -f dommate
```

## 🔧 配置选项

### 环境变量文件

创建 `env.production` 文件并配置以下关键参数：

```bash
# 数据库路径
DATABASE_PATH=/app/data/domains.db

# 服务器配置
SERVER_PORT=3001
SERVER_HOST=0.0.0.0
NODE_ENV=production

# 安全配置 (请更改为随机字符串)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
SESSION_SECRET=your-super-secret-session-key-change-this-in-production

# 邮件配置 (可选)
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Docker Compose 变体

#### 生产环境
```bash
# 标准生产部署
docker-compose -f docker-compose.yml up -d

# 带 Nginx 反向代理
docker-compose --profile nginx up -d
```

#### 开发环境
```bash
# 开发环境 (包含调试工具)
docker-compose -f docker-compose.dev.yml up -d

# 带管理工具
docker-compose -f docker-compose.dev.yml --profile admin --profile logs up -d
```

## 📁 目录结构

```
DomMate/
├── docker-data/              # Docker 数据目录
│   ├── data/                 # 数据库文件
│   ├── logs/                 # 日志文件
│   ├── backups/             # 数据库备份
│   └── temp/                # 临时文件
├── nginx/                   # Nginx 配置
│   ├── nginx.conf
│   └── conf.d/
│       └── dommate.conf
├── ssl/                     # SSL 证书 (可选)
├── docker-compose.yml       # 生产环境配置
├── docker-compose.dev.yml   # 开发环境配置
├── Dockerfile              # Docker 构建文件
└── env.production          # 环境变量文件
```

## 🚀 部署配置

### 1. 基础部署

最简单的单容器部署：

```bash
# 创建必要目录
mkdir -p docker-data/{data,logs,backups,temp}

# 设置权限
chmod 755 docker-data
chmod 755 docker-data/*

# 启动服务
docker-compose up -d dommate

# 检查状态
docker-compose ps
docker-compose logs dommate
```

### 2. 生产环境部署

包含 Nginx 反向代理的完整生产环境：

```bash
# 1. 准备 SSL 证书
mkdir -p ssl
# 将您的 SSL 证书文件放入 ssl 目录：
# - dommate.com.crt
# - dommate.com.key

# 2. 配置 Nginx
# 编辑 nginx/conf.d/dommate.conf 设置您的域名

# 3. 启动完整栈
docker-compose --profile nginx up -d

# 4. 配置防火墙
sudo ufw allow 80
sudo ufw allow 443
```

### 3. 高可用部署

使用多个副本和负载均衡：

```yaml
# docker-compose.ha.yml
services:
  dommate:
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
```

## 🔍 监控和维护

### 查看日志

```bash
# 查看应用日志
docker-compose logs -f dommate

# 查看 Nginx 日志
docker-compose logs -f nginx

# 查看最近 100 行日志
docker-compose logs --tail=100 dommate
```

### 健康检查

```bash
# 检查容器健康状态
docker-compose ps

# 手动健康检查
curl http://localhost:3001/health

# 详细健康信息
docker inspect --format='{{.State.Health.Status}}' dommate-app
```

### 数据备份

```bash
# 手动备份数据库
docker-compose exec dommate node -e "
const db = require('./server/database');
db.backupDatabase().then(() => console.log('Backup completed'));
"

# 定期备份 (使用 cron)
echo "0 2 * * * cd /path/to/dommate && docker-compose run --rm backup" | crontab -
```

### 更新应用

```bash
# 更新到最新版本
docker-compose pull
docker-compose up -d

# 查看更新日志
docker-compose logs -f dommate
```

## 🛠️ 故障排除

### 常见问题

#### 1. 端口冲突
```bash
# 检查端口占用
netstat -tulpn | grep :3001

# 修改端口映射
# 在 docker-compose.yml 中修改 ports: "3002:3001"
```

#### 2. 权限问题
```bash
# 设置正确权限
sudo chown -R 1001:1001 docker-data/
sudo chmod -R 755 docker-data/
```

#### 3. 内存不足
```bash
# 增加内存限制
# 在 docker-compose.yml 中修改 deploy.resources.limits.memory
```

#### 4. 数据库问题
```bash
# 重置数据库
docker-compose down
sudo rm -rf docker-data/data/*
docker-compose up -d

# 从备份恢复
cp docker-data/backups/backup_YYYYMMDD_HHMMSS.db docker-data/data/domains.db
docker-compose restart dommate
```

### 调试模式

```bash
# 启用调试模式
echo "DEBUG_MODE=true" >> env.production
echo "LOG_LEVEL=debug" >> env.production
docker-compose restart dommate

# 进入容器调试
docker-compose exec dommate /bin/sh

# 查看详细日志
docker-compose exec dommate tail -f /app/logs/dommate.log
```

## 📊 性能优化

### 1. 资源限制

```yaml
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 1G
    reservations:
      cpus: '0.5'
      memory: 256M
```

### 2. 缓存配置

```bash
# 启用 Redis 缓存 (可选)
docker run -d --name redis --network dommate-network redis:alpine
```

### 3. 数据库优化

```bash
# 定期清理日志
echo "0 3 * * 0 docker-compose exec dommate node -e \"
const db = require('./server/database');
db.cleanupLogs();
\"" | crontab -
```

## 🔐 安全配置

### 1. 网络安全

```bash
# 限制外部访问
# 在 docker-compose.yml 中仅暴露必要端口
ports:
  - "127.0.0.1:3001:3001"  # 仅本地访问
```

### 2. 容器安全

```bash
# 使用非 root 用户运行
user: "1001:1001"

# 只读根文件系统
read_only: true
tmpfs:
  - /tmp
  - /var/tmp
```

### 3. 数据加密

```bash
# 加密敏感环境变量
echo "SENSITIVE_DATA" | docker secret create db_password -
```

## 🌐 集群部署

### Docker Swarm

```bash
# 初始化 Swarm
docker swarm init

# 部署 Stack
docker stack deploy -c docker-compose.yml dommate

# 扩展服务
docker service scale dommate_dommate=3
```

### Kubernetes

```yaml
# k8s/dommate-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: dommate
spec:
  replicas: 3
  selector:
    matchLabels:
      app: dommate
  template:
    metadata:
      labels:
        app: dommate
    spec:
      containers:
      - name: dommate
        image: ghcr.io/yeagoo/dommate:latest
        ports:
        - containerPort: 3001
```

## 📞 获取帮助

- 📖 **文档**: [GitHub Wiki](https://github.com/yeagoo/DomMate/wiki)
- 🐛 **问题反馈**: [GitHub Issues](https://github.com/yeagoo/DomMate/issues)
- 💬 **讨论**: [GitHub Discussions](https://github.com/yeagoo/DomMate/discussions)
- 📧 **邮件支持**: support@dommate.com

---

**🎉 恭喜！您已成功部署 DomMate！**

访问应用：http://localhost:3001  
默认密码：`admin123` (请立即更改) 