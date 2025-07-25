# Contributing to DomMate

首先，感谢您考虑为 DomMate 做出贡献！正是像您这样的人们让 DomMate 成为如此出色的工具。

## 🤝 我们欢迎的贡献类型

我们欢迎各种形式的贡献：

- 🐛 **Bug 报告**：发现问题并报告给我们
- 💡 **功能建议**：提出新功能的想法
- 📖 **文档改进**：改善项目文档
- 🔧 **代码贡献**：修复 bug 或实现新功能
- 🌐 **翻译**：帮助我们支持更多语言
- 📝 **测试**：编写或改进测试用例

## 📋 在开始之前

### 报告 Bug

在报告 bug 之前，请：

1. 检查 [GitHub Issues](https://github.com/yeagoo/DomMate/issues) 确保该问题尚未被报告
2. 使用最新版本确认问题仍然存在
3. 收集以下信息：
   - 操作系统和版本
   - Node.js 版本
   - 浏览器类型和版本
   - 详细的重现步骤
   - 实际结果和期望结果
   - 相关的错误日志

### 建议新功能

在建议新功能之前，请：

1. 检查 [GitHub Issues](https://github.com/yeagoo/DomMate/issues) 和 [Discussions](https://github.com/yeagoo/DomMate/discussions) 确保该建议尚未提出
2. 考虑该功能是否对大多数用户有用
3. 详细描述功能的用途和实现方式

## 🚀 开发流程

### 环境设置

1. **Fork 仓库**
   ```bash
   # 在 GitHub 上 fork 仓库，然后克隆您的 fork
   git clone https://github.com/YOUR_USERNAME/DomMate.git
   cd DomMate
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **设置开发环境**
   ```bash
   # 启动后端服务
   node server/index.js
   
   # 在新终端中启动前端
   npm run dev
   ```

4. **创建功能分支**
   ```bash
   git checkout -b feature/your-feature-name
   # 或者
   git checkout -b fix/your-bug-fix
   ```

### 开发规范

#### 代码风格

- **前端**：使用 TypeScript + React，遵循 ESLint 配置
- **后端**：使用 ES6+ 语法，保持代码清晰和注释完整
- **命名规范**：
  - 变量和函数：camelCase
  - 组件：PascalCase
  - 常量：UPPER_SNAKE_CASE
  - 文件名：kebab-case 或 PascalCase（组件）

#### 提交信息规范

使用清晰的提交信息：

```bash
# 好的提交信息示例
git commit -m "feat: 添加域名批量导入功能"
git commit -m "fix: 修复邮件通知发送失败问题"
git commit -m "docs: 更新 API 文档"
git commit -m "style: 调整登录页面布局"
git commit -m "refactor: 重构域名状态检查逻辑"
git commit -m "test: 添加用户认证测试用例"
```

提交类型：
- `feat`: 新功能
- `fix`: 错误修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变更

### 测试

在提交之前请确保：

1. **运行现有测试**
   ```bash
   npm test
   ```

2. **测试您的更改**
   ```bash
   # 测试认证系统
   ./test-force-password-change.sh
   
   # 测试密码管理
   ./password-admin-tool.sh
   ```

3. **手动测试**
   - 确保前端界面正常工作
   - 验证 API 端点正确响应
   - 测试中英文界面切换

### 代码审查清单

在提交 Pull Request 之前，请检查：

- [ ] 代码遵循项目的编码规范
- [ ] 添加了必要的测试
- [ ] 所有测试都通过
- [ ] 文档已更新（如果需要）
- [ ] 没有遗留的 console.log 或调试代码
- [ ] 代码中有适当的注释
- [ ] 兼容现有的 API

## 📝 Pull Request 流程

1. **确保您的分支是最新的**
   ```bash
   git checkout main
   git pull upstream main
   git checkout your-feature-branch
   git rebase main
   ```

2. **创建 Pull Request**
   - 提供清晰的标题和描述
   - 引用相关的 Issue（如果有）
   - 包含测试结果的截图（如果适用）
   - 列出破坏性更改（如果有）

3. **Pull Request 模板**
   ```markdown
   ## 更改描述
   简要描述您的更改内容和原因。
   
   ## 更改类型
   - [ ] Bug 修复
   - [ ] 新功能
   - [ ] 破坏性更改
   - [ ] 文档更新
   
   ## 测试
   - [ ] 手动测试通过
   - [ ] 自动化测试通过
   - [ ] 添加了新的测试用例
   
   ## 检查清单
   - [ ] 代码遵循项目规范
   - [ ] 自我审查代码
   - [ ] 添加了必要的注释
   - [ ] 更新了相关文档
   ```

## 🔄 代码审查过程

1. **自动检查**：PR 会自动运行 CI/CD 检查
2. **代码审查**：维护者会审查您的代码
3. **反馈处理**：根据反馈进行必要的修改
4. **合并**：通过审查后，代码将被合并到主分支

## 🌐 国际化贡献

如果您想帮助翻译 DomMate：

1. 检查 `src/i18n/` 目录中现有的语言文件
2. 创建新的语言文件或改进现有翻译
3. 更新语言选择器以包含新语言
4. 测试新语言的显示效果

## 📚 文档贡献

文档改进包括：

- 修正拼写错误和语法问题
- 改进现有文档的清晰度
- 添加缺失的信息
- 创建教程或指南
- 改进代码注释

## 🎯 优先事项

我们特别欢迎以下类型的贡献：

1. **性能优化**：提高应用性能
2. **安全改进**：增强安全性
3. **用户体验**：改善界面和交互
4. **移动端适配**：改善移动设备支持
5. **API 文档**：完善 API 文档

## 💡 获取帮助

如果您需要帮助：

- 📖 查看 [项目文档](https://github.com/yeagoo/DomMate/wiki)
- 💬 在 [Discussions](https://github.com/yeagoo/DomMate/discussions) 中提问
- 📧 发送邮件至 support@dommate.com
- 🐛 查看现有的 [Issues](https://github.com/yeagoo/DomMate/issues)

## 🏆 贡献者

感谢所有为 DomMate 做出贡献的人！您的名字将出现在我们的贡献者列表中。

## 📄 许可证

通过向此仓库贡献代码，您同意您的贡献将根据 [MIT 许可证](LICENSE) 进行许可。

---

再次感谢您的贡献！�� 

*最后更新：2024年7月* 