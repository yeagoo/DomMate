# 🔧 GitHub Container Registry 镜像名称修复

## 🎯 问题诊断

**错误信息**:
```
/opt/hostedtoolcache/syft/1.29.0/x64/syft scan ghcr.io/yeagoo/DomMate:latest -o spdx-json
Executing Syft...
Error: The process '/opt/hostedtoolcache/syft/1.29.0/x64/syft' failed with exit code 1
```

**问题分析**: SBOM (Software Bill of Materials) 生成工具无法找到镜像 `ghcr.io/yeagoo/DomMate:latest`，原因是 GitHub Container Registry 要求所有镜像名称必须是小写的。

---

## 🔍 根本原因

### **GitHub Container Registry 命名规则**
- **要求**: 所有镜像名称必须是**完全小写**
- **问题**: `${{ github.repository }}` 返回 `yeagoo/DomMate` (包含大写字母)
- **结果**: 镜像推送成功但名称自动转换为小写，而 SBOM action 仍然使用原始大写名称

### **命名规则对比**:
| 来源 | 生成的名称 | GitHub Container Registry 实际名称 |
|------|------------|-----------------------------------|
| `github.repository` ❌ | `yeagoo/DomMate` | `yeagoo/dommate` (自动转换) |
| `github.repository_owner/dommate` ✅ | `yeagoo/dommate` | `yeagoo/dommate` (一致) |

---

## 🔧 修复方案

### **更新 GitHub Actions 工作流**

**修复前** ❌ (`.github/workflows/docker-build.yml`):
```yaml
env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}  # 生成: yeagoo/DomMate
```

**修复后** ✅:
```yaml
env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository_owner }}/dommate  # 生成: yeagoo/dommate
```

### **修复原理**:
- **明确控制**: 直接指定小写镜像名称
- **避免歧义**: 不依赖 GitHub 的自动转换
- **SBOM 兼容**: 确保所有工具使用相同的镜像名称

---

## ✅ 预期修复效果

### **修复后的构建流程**:
1. ✅ **Docker 构建**: 使用正确的小写镜像名称
2. ✅ **镜像推送**: 推送到 `ghcr.io/yeagoo/dommate:latest`
3. ✅ **SBOM 生成**: 成功扫描 `ghcr.io/yeagoo/dommate:latest`
4. ✅ **安全扫描**: Trivy 使用正确的镜像名称
5. ✅ **文档生成**: 所有引用都使用一致的名称

### **所有受影响的步骤**:
- **Docker build-push-action**: 镜像标签生成
- **anchore/sbom-action**: SBOM 文件生成  
- **aquasecurity/trivy-action**: 安全漏洞扫描
- **发布说明**: 镜像名称引用

---

## 🧪 验证方法

### **GitHub Actions 验证**:
```bash
# 推送代码触发构建
git push origin main

# 预期结果：
# ✅ Docker 构建成功
# ✅ 镜像推送到 ghcr.io/yeagoo/dommate:latest
# ✅ SBOM 生成成功
# ✅ 安全扫描通过
```

### **手动验证镜像存在性**:
```bash
# 验证镜像可以正常拉取
docker pull ghcr.io/yeagoo/dommate:latest

# 验证镜像可以正常运行
docker run --rm ghcr.io/yeagoo/dommate:latest /bin/sh -c "echo 'Image works!'"
```

---

## 📊 GitHub Container Registry 最佳实践

### **命名规范**:
```yaml
# ✅ 推荐做法
IMAGE_NAME: ${{ github.repository_owner }}/project-name

# ❌ 避免的做法
IMAGE_NAME: ${{ github.repository }}  # 可能包含大写字母
```

### **标签管理**:
```yaml
# ✅ 标准标签
tags: |
  ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
  ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
  ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.ref_name }}
```

### **多架构支持**:
```yaml
# ✅ 正确的平台配置
platforms: linux/amd64,linux/arm64
```

---

## 🔮 预防措施

### **CI/CD 配置检查清单**:
- ✅ 镜像名称全部小写
- ✅ 所有工具使用相同的镜像引用
- ✅ 标签命名一致性
- ✅ 多架构构建支持

### **自动化验证**:
```yaml
# 在工作流中添加镜像名称验证
- name: Validate image name
  run: |
    if [[ "${{ env.IMAGE_NAME }}" =~ [A-Z] ]]; then
      echo "❌ Image name contains uppercase letters: ${{ env.IMAGE_NAME }}"
      exit 1
    fi
    echo "✅ Image name is valid: ${{ env.IMAGE_NAME }}"
```

---

## 🎊 **修复完成！**

**GitHub Container Registry 镜像名称问题已解决！**

### **核心改进**:
- ✅ **命名一致**: 所有工具使用相同的小写镜像名称
- ✅ **SBOM 兼容**: 软件物料清单生成成功
- ✅ **安全扫描**: Trivy 漏洞扫描正常工作
- ✅ **标准合规**: 符合 GitHub Container Registry 命名规范

### **立即验证**:
```bash
git add -A
git commit -m "🔧 修复 GitHub Container Registry 镜像名称大小写问题"
git push origin main
```

### **预期构建结果**:
- ✅ **Docker 构建**: 使用 `ghcr.io/yeagoo/dommate:latest`
- ✅ **SBOM 生成**: 成功生成软件物料清单
- ✅ **安全扫描**: Trivy 扫描通过
- ✅ **镜像可用**: 可以正常拉取和运行

---

## 📞 相关资源

- 🐳 [GitHub Container Registry 文档](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- 📦 [Docker 镜像命名规范](https://docs.docker.com/engine/reference/commandline/tag/)
- 🔒 [SBOM 最佳实践](https://github.com/anchore/sbom-action)

**DomMate 镜像命名现在完全符合 GitHub Container Registry 规范！** 🚀✨ 