# DomMate Docker 部署指南

## 🚀 快速启动

### 方法1：使用启动脚本（推荐）

```bash
# 设置执行权限
chmod +x start.sh

# 运行启动脚本
./start.sh
```

### 方法2：npm依赖测试

```bash
# 测试npm依赖修复（推荐先运行）
chmod +x npm-fix-test.sh
./npm-fix-test.sh
```

### 方法3：快速构建测试

```bash
# 仅测试Docker构建，不启动服务
chmod +x quick-test.sh
./quick-test.sh
```

### 方法4：手动启动

```bash
# 构建并启动
docker-compose up -d --build

# 查看日志
docker-compose logs -f dommate
```

## 📋 系统要求

- Docker 20.10+
- Docker Compose 2.0+
- 端口 3001 未被占用

## 🔧 配置说明

### 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| NODE_ENV | production | 运行环境 |
| PORT | 3001 | 服务端口 |
| DATABASE_PATH | /app/data/domains.db | 数据库路径 |
| EXPORT_DIR | /app/exports | 导出目录 |
| LOG_FILE | /app/logs/dommate.log | 日志文件 |
| TZ | Asia/Shanghai | 时区设置 |

### 数据持久化

以下目录会自动创建 Docker volumes：

- `dommate_data` -> `/app/data` (数据库文件)
- `dommate_logs` -> `/app/logs` (日志文件)
- `dommate_exports` -> `/app/exports` (导出文件)

## 🌐 访问方式

- **Web界面**: http://localhost:3001
- **API接口**: http://localhost:3001/api
- **默认密码**: admin123 (首次登录需修改)

## 🛠️ 管理命令

```bash
# 查看服务状态
docker-compose ps

# 查看实时日志
docker-compose logs -f dommate

# 重启服务
docker-compose restart

# 停止服务
docker-compose stop

# 完全停止并清理
docker-compose down

# 重新构建
docker-compose up -d --build --no-cache
```

## 🔍 故障排查

### 端口占用
```bash
# 检查端口占用
netstat -tlnp | grep 3001
lsof -i :3001

# 停止占用端口的进程
sudo kill -9 $(lsof -ti:3001)
```

### 查看详细日志
```bash
# 查看构建日志
docker-compose build --no-cache

# 查看容器内部日志
docker exec dommate cat /app/logs/dommate.log

# 查看系统日志
docker-compose logs --tail=100 dommate
```

### 数据备份
```bash
# 备份数据卷
docker run --rm -v dommate_data:/data -v $(pwd):/backup alpine tar czf /backup/dommate-data-backup.tar.gz -C /data .

# 恢复数据卷
docker run --rm -v dommate_data:/data -v $(pwd):/backup alpine tar xzf /backup/dommate-data-backup.tar.gz -C /data
```

## 🏗️ 技术架构

- **前端**: Astro + React + Tailwind CSS
- **后端**: Node.js 22 + Express
- **数据库**: SQLite
- **容器**: Alpine Linux + Node.js 22

## 📊 资源使用

- **内存**: ~200MB
- **CPU**: 轻量级
- **磁盘**: ~500MB (镜像) + 数据文件

## 🔐 安全建议

1. 首次登录后立即修改默认密码
2. 定期备份数据文件
3. 使用反向代理（Nginx）配置HTTPS
4. 限制容器资源使用

## 🆘 支持

如果遇到问题，请检查：

1. Docker和Docker Compose版本
2. 端口3001是否可用
3. 磁盘空间是否充足
4. 容器日志中的错误信息

构建过程中如果出现 "Static build failed" 错误，说明前端构建有问题，请检查源代码和依赖。 