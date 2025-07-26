# DomMate - 专业域名监控平台

<div align="center">
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/database-SQLite-blue.svg)](https://www.sqlite.org/)
[![GitHub Stars](https://img.shields.io/github/stars/yeagoo/DomMate.svg)](https://github.com/yeagoo/DomMate)

**专业的域名到期监控解决方案**

[🌐 官方网站](https://dommate.com) | [📖 English Documentation](./README.md) | [🚀 在线演示](https://demo.dommate.com)

![DomMate Logo](./public/logo.svg)

</div>

## 🌟 关于 DomMate

**DomMate** 是一个功能强大的域名监控平台，专为个人和企业用户设计，提供全方位的域名管理和到期监控服务。凭借直观的界面和强大的后端，DomMate 确保您永远不会错过关键的域名续费。

## ✨ 核心功能

### 🔍 智能监控
- **自动域名到期跟踪**: 实时监控域名到期日期
- **批量操作**: 高效管理数百个域名
- **WHOIS集成**: 自动获取域名信息
- **自定义检查间隔**: 灵活的监控计划

### 📧 高级通知
- **多渠道警报**: 可自定义模板的邮件通知
- **智能调度**: 每日、每周和自定义通知规则
- **通知历史**: 完整的警报审计跟踪
- **模板自定义**: 个性化邮件模板

### 📊 分析与洞察
- **综合仪表板**: 可视化域名组合概览
- **到期分析**: 详细的统计和趋势
- **导出功能**: CSV、JSON、Excel导出选项
- **报告工具**: 定时报告和数据可视化

### 🏷️ 组织工具
- **域名分组**: 灵活的分类系统
- **标签系统**: 用星级标记重要域名
- **备注和评论**: 为每个域名添加详细备注
- **搜索和过滤**: 高级搜索和过滤选项

### 🔐 安全认证
- **用户认证**: 具有会话管理的安全登录
- **验证码保护**: 防止暴力破解攻击
- **密码策略**: 强制密码更改和安全规则
- **会话管理**: 基于令牌的安全认证

### 🌐 多语言支持
- **双语界面**: 完整的中英文支持
- **国际化**: 为其他语言做好i18n准备
- **本地化内容**: 特定文化的日期和时间格式

## 🚀 快速开始

### 🐳 Docker 部署 (推荐)

最简单快速的部署方式，一条命令即可启动：

```bash
# 使用官方镜像快速启动
docker run -d \
  --name dommate \
  -p 3001:3001 \
  -v dommate-data:/app/data \
  -v dommate-logs:/app/logs \
  -v dommate-exports:/app/exports \
  ghcr.io/yeagoo/dommate:latest

# 等待几秒钟让服务启动，然后访问
# http://localhost:3001
```

**使用 Docker Compose (推荐生产环境)：**

```yaml
# docker-compose.yml
version: '3.8'
services:
  dommate:
    image: ghcr.io/yeagoo/dommate:latest
    container_name: dommate
    ports:
      - "3001:3001"
    volumes:
      - dommate-data:/app/data
      - dommate-logs:/app/logs
      - dommate-exports:/app/exports
    environment:
      - NODE_ENV=production
      - TZ=Asia/Shanghai  # 设置时区
    restart: unless-stopped

volumes:
  dommate-data:
  dommate-logs:
  dommate-exports:
```

```bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f dommate
```

### 📦 传统安装方式

如果您偏好源码安装：

#### 环境要求

- **Node.js** >= 16.0.0
- **npm** >= 7.0.0
- **Git** (用于克隆仓库)

#### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/yeagoo/DomMate.git
cd DomMate

# 安装依赖
npm install

# 启动后端服务器
node server/index.js

# 在新终端中启动前端
npm run dev
```

### 🎯 首次访问

1. **打开浏览器** 并导航到 `http://localhost:3001` (Docker) 或 `http://localhost:4322` (源码安装)
2. **登录** 使用默认密码: `admin123`
3. **立即更改密码** 以确保安全
4. **开始添加域名** 进行监控

### ⚡ 快速测试

```bash
# 检查服务状态
curl http://localhost:3001/api/auth/info

# 预期返回
{"requiresAuth": true, "hasUsers": true}
```

## 📦 项目结构

```
DomMate/
├── server/                    # 后端API服务器
│   ├── index.js              # 主服务器文件
│   ├── database.js           # SQLite数据库操作
│   ├── authService.js        # 认证服务
│   ├── emailService.js       # 邮件通知服务
│   └── exportService.js      # 数据导出服务
├── src/                      # 前端源代码
│   ├── components/           # React组件
│   ├── layouts/              # Astro布局
│   ├── pages/                # 应用页面
│   ├── lib/                  # 工具库
│   └── i18n/                 # 国际化
├── public/                   # 静态资源
└── docs/                     # 文档
```

## 🛠️ 技术栈

- **前端**: Astro + React + TypeScript + Tailwind CSS
- **后端**: Node.js + Express.js
- **数据库**: SQLite
- **认证**: JWT + 会话管理
- **邮件**: 支持模板的SMTP
- **API**: RESTful API设计

## 🔧 配置

### 环境变量

在根目录创建 `.env` 文件:

```bash
# 数据库配置
DATABASE_PATH=./domain.db

# 服务器端口
SERVER_PORT=3001
CLIENT_PORT=4322

# 邮件配置 (可选)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password

# 安全设置
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret
```

### 邮件设置

在应用程序中配置SMTP设置:

1. 导航到 **邮件通知系统**
2. 添加您的SMTP配置
3. 测试连接
4. 设置通知规则

## 📚 API 文档

### 认证端点

```bash
# 登录
POST /api/auth/login
Content-Type: application/json
{
  "password": "your-password",
  "captcha": "captcha-value"
}

# 更改密码
POST /api/auth/change-password
X-Session-Id: session-token
{
  "oldPassword": "old-password",
  "newPassword": "new-password"
}

# 退出登录
POST /api/auth/logout
X-Session-Id: session-token
```

### 域名管理

```bash
# 获取所有域名
GET /api/domains
X-Session-Id: session-token

# 添加域名
POST /api/domains
X-Session-Id: session-token
{
  "domain": "example.com",
  "groupId": 1,
  "isImportant": false,
  "notes": "可选备注"
}

# 更新域名备注
PATCH /api/domains/:id/notes
X-Session-Id: session-token
{
  "notes": "更新的备注"
}

# 批量操作
POST /api/domains/batch-important
X-Session-Id: session-token
{
  "domainIds": [1, 2, 3],
  "isImportant": true
}
```

### 导出API

```bash
# 导出域名
POST /api/export/domains
X-Session-Id: session-token
{
  "format": "json",
  "fields": ["domain", "expiresAt", "status"],
  "language": "zh"
}
```

## 🐳 生产部署

### 自定义 Docker 构建

如果您需要修改源码并构建自己的镜像：

```bash
# 克隆仓库
git clone https://github.com/yeagoo/DomMate.git
cd DomMate

# 构建自定义镜像
docker build -t dommate-custom:latest .

# 运行自定义镜像
docker run -d \
  --name dommate-custom \
  -p 3001:3001 \
  -v dommate-data:/app/data \
  dommate-custom:latest
```

### PM2 部署 (源码部署)

```bash
# 安装PM2
npm install -g pm2

# 启动后端服务
pm2 start server/index.js --name dommate-api

# 启动前端服务
pm2 start "npm run dev" --name dommate-web

# 保存PM2配置
pm2 save
pm2 startup
```

### 生产构建

```bash
# 构建生产版本
npm run build

# 使用静态服务器提供服务
npm run preview
```

### Docker 健康检查

Docker镜像内置健康检查，可以监控服务状态：

```bash
# 检查容器健康状态
docker ps

# 查看健康检查详情
docker inspect dommate --format='{{.State.Health}}'

# 查看健康检查日志
docker logs dommate
```

## 🧪 测试

```bash
# 运行后端测试
npm test

# 运行集成测试
npm run test:integration

# 测试认证系统
./test-force-password-change.sh

# 测试密码管理
./password-admin-tool.sh
```

## 🔒 安全功能

- **密码加密**: SHA-256哈希
- **会话管理**: 安全的基于令牌的会话
- **暴力破解保护**: 登录尝试限制
- **验证码验证**: 数学挑战系统
- **强制密码更改**: 安全策略执行
- **SQL注入防护**: 参数化查询
- **XSS保护**: 输入清理

## 🌍 国际化

DomMate 支持多种语言:

- **英语**: 完整的界面支持
- **中文**: 完整的本地化
- **可扩展**: 易于添加新语言

添加新语言的步骤:
1. 在 `src/i18n/` 中创建新的翻译文件
2. 更新语言选择器
3. 添加日期/时间本地化

## 🤝 贡献

我们欢迎社区的贡献！

### 如何贡献

1. **Fork** 仓库
2. **创建** 功能分支 (`git checkout -b feature/amazing-feature`)
3. **提交** 您的更改 (`git commit -m 'Add amazing feature'`)
4. **推送** 到分支 (`git push origin feature/amazing-feature`)
5. **打开** Pull Request

### 开发指南

- 遵循现有的代码风格
- 编写全面的测试
- 更新文档
- 使用有意义的提交消息

### 报告问题

- 使用 [GitHub Issues](https://github.com/yeagoo/DomMate/issues) 页面
- 提供详细的重现步骤
- 包含系统信息
- 附加相关日志

## 📄 许可证

本项目采用 **MIT 许可证** - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🏆 奖项与认可

- ⭐ GitHub 趋势推荐
- 🚀 Product Hunt 每日推荐
- 💎 月度开源项目

## 🙏 致谢

- **贡献者**: 感谢所有为这个项目做出贡献的人
- **依赖库**: 基于出色的开源项目构建
- **社区**: 感谢反馈和支持

## 💡 使用技巧

### 最佳实践

1. **定期备份**: 定期备份您的域名数据
2. **分组管理**: 使用分组功能组织您的域名
3. **设置提醒**: 配置合适的到期提醒时间
4. **监控状态**: 定期检查域名状态和WHOIS信息

### 高级用法

- 使用批量操作快速管理多个域名
- 设置自定义邮件模板
- 利用导出功能备份数据
- 配置多种通知规则

## 🔧 故障排除

### 常见问题

**Q: 启动时遇到端口冲突怎么办？**
A: 检查端口占用并终止相关进程，或修改配置文件中的端口设置。

**Q: 邮件通知无法发送？**
A: 检查SMTP配置，确保邮箱密码正确，防火墙允许SMTP端口。

**Q: 忘记登录密码？**
A: 使用 `./password-admin-tool.sh` 重置密码。

**Q: 数据库损坏如何恢复？**
A: 从备份恢复，或删除数据库文件让系统重新创建。

### 性能优化

- 定期清理过期的通知日志
- 对大量域名使用批量操作
- 配置合适的检查间隔
- 监控系统资源使用情况

---

<div align="center">
**⭐ 如果这个项目对您有帮助，请给我们一个 Star！ ⭐**

[🌐 dommate.com](https://dommate.com) 

</div> 