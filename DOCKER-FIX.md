# Docker 构建修复说明

## 🔧 修复的问题

### 1. 用户创建错误
**错误**: `addgroup: gid '1000' in use`
**修复**: 使用系统分配的UID/GID而不是强制使用1000

```dockerfile
# 修复前 (有问题)
RUN addgroup -g 1000 dommate && \
    adduser -u 1000 -G dommate -D -s /bin/sh dommate

# 修复后 (正确)
RUN addgroup -S dommate && \
    adduser -D -S -G dommate -s /bin/sh dommate
```

### 2. Node.js 版本不一致
**错误**: GitHub Actions使用Node.js 18，Dockerfile使用Node.js 22
**修复**: 统一使用Node.js 22

```yaml
# 修复前
node-version: '18'

# 修复后
node-version: '22'
```

### 3. npm依赖同步问题
**错误**: `npm ci` 因package.json和package-lock.json不同步而失败
**修复**: 使用npm install并清理锁定文件

```dockerfile
# 修复前 (有问题)
RUN npm ci --include=dev

# 修复后 (正确)
RUN npm cache clean --force && \
    rm -rf node_modules package-lock.json && \
    npm install
```

## 🧪 测试脚本

新增了四个测试脚本：

1. **npm-fix-test.sh** - npm依赖修复验证（新增）
2. **quick-test.sh** - 快速构建测试，仅验证Docker构建
3. **test-build.sh** - 完整构建和服务测试
4. **start.sh** - 用户友好的启动脚本

## 🚀 验证步骤

```bash
# 1. 设置权限
chmod +x npm-fix-test.sh quick-test.sh test-build.sh start.sh

# 2. 测试npm依赖修复
./npm-fix-test.sh

# 3. 快速构建测试
./quick-test.sh

# 4. 如果构建成功，进行完整测试
./test-build.sh

# 5. 或直接启动服务
./start.sh
```

## 📋 技术要点

- **多阶段构建**: 前端构建与生产分离
- **用户安全**: 非root用户运行
- **数据持久化**: 使用Docker volumes
- **健康检查**: 内置服务监控
- **资源优化**: Alpine Linux基础镜像

## 🎯 验证指标

构建成功后应该看到：
- ✅ Docker镜像构建成功
- ✅ 前端文件存在 (`/app/dist/index.html`)
- ✅ 后端文件存在 (`/app/server/index.js`)
- ✅ Node.js版本为 v22.x.x
- ✅ 运行用户为 dommate

## 🔍 故障排查

如果仍然遇到问题：

```bash
# 查看详细构建日志
docker-compose build --no-cache --progress=plain dommate

# 检查系统资源
docker system df
docker system prune -f

# 强制重建
docker-compose down --volumes --remove-orphans
docker system prune -af
./start.sh
```

修复完成后，GitHub Actions构建应该能够正常通过。 