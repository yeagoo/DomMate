# DomainFlow - 域名监控平台

一个极简美学、支持多种导入方式的域名到期自动监控平台。

## 功能特性

- 🎯 **多种导入方式**：支持按行粘贴、文件导入、字符串导入
- 📊 **直观仪表盘**：清晰显示域名状态，包含统计图表
- 🔔 **智能状态标识**：正常、即将到期、已过期、查询失败
- ⚡ **自动化监控**：定时 WHOIS 查询，保持信息最新
- 🌐 **国际化支持**：中英文双语界面
- 🎨 **现代 UI**：基于 shadcn/ui，支持暗黑模式

## 技术栈

- **前端**: Astro + React + TypeScript
- **UI组件**: shadcn/ui + Tailwind CSS
- **后端**: Node.js + Express
- **数据存储**: JSON 文件
- **WHOIS查询**: whois 包
- **定时任务**: node-cron

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
# 启动前端开发服务器
npm run dev

# 启动后端API服务器（新终端窗口）
npm run server:dev
```

### 构建生产版本

```bash
npm run build
```

## 项目结构

```
├── src/
│   ├── components/          # React组件
│   │   ├── ui/             # shadcn/ui基础组件
│   │   ├── Dashboard.tsx   # 主仪表盘
│   │   ├── DomainImportDialog.tsx  # 域名导入对话框
│   │   └── DomainTable.tsx # 域名表格
│   ├── layouts/            # Astro布局
│   ├── pages/              # Astro页面
│   ├── styles/             # 样式文件
│   ├── types/              # TypeScript类型定义
│   └── i18n/               # 国际化文件
├── server/                 # Node.js后端
│   └── index.js           # 主服务器文件
├── public/                # 静态资源
└── domains.json           # 域名数据存储（自动生成）
```

## API 接口

### 获取域名列表
```
GET /api/domains
```

### 导入域名
```
POST /api/domains/import
Body: { "domains": ["example.com", "google.com"] }
```

### 切换通知状态
```
PATCH /api/domains/:id/notifications
Body: { "notifications": true }
```

### 刷新域名信息
```
POST /api/domains/:id/refresh
```

## 自动化任务

系统每天凌晨2点自动更新所有域名的WHOIS信息。可以通过修改 `server/index.js` 中的 cron 表达式来调整时间：

```javascript
// 每天凌晨2点执行
cron.schedule('0 2 * * *', async () => {
  // 更新逻辑
});
```

## 开发说明

### 添加新的UI组件

项目使用 shadcn/ui 组件库。添加新组件：

1. 将组件代码放入 `src/components/ui/` 目录
2. 确保导入 `@/lib/utils` 中的 `cn` 函数
3. 使用 TypeScript 进行类型定义

### 修改数据存储

当前使用 JSON 文件存储。如需升级到数据库：

1. 安装数据库相关依赖（如 better-sqlite3）
2. 修改 `server/index.js` 中的数据操作函数
3. 更新数据模型

## 部署

### 前端部署

```bash
npm run build
# 部署 dist/ 目录到静态托管服务
```

### 后端部署

```bash
# 使用PM2或类似工具
pm2 start server/index.js --name domainflow-api
```

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License 