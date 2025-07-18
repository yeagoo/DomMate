# DomainFlow 第三方API配置指南

DomainFlow现在支持多种WHOIS查询方式，能够在标准WHOIS查询失败时自动回退到第三方API，特别适合查询冷门后缀和特殊ccTLD域名。

## 支持的API服务

### 1. ViewDNS.info API
- **用途**: 支持各种域名后缀，特别是一些冷门ccTLD
- **官网**: https://viewdns.info/
- **API文档**: https://viewdns.info/api/
- **获取API密钥**: 注册账户后在控制面板获取

### 2. IP2WHOIS.com API  
- **用途**: 专业的WHOIS查询服务，支持大部分TLD
- **官网**: https://www.ip2whois.com/
- **API文档**: https://www.ip2whois.com/developers-api
- **获取API密钥**: 注册账户后获取免费API配额

## 配置方法

### 1. 环境变量配置

在项目根目录创建 `.env` 文件：

```bash
# ViewDNS.info API配置
VIEWDNS_API_KEY=your_viewdns_api_key_here

# IP2WHOIS.com API配置  
IP2WHOIS_API_KEY=your_ip2whois_api_key_here
```

### 2. 启用API

在 `server/config.js` 文件中启用需要的API：

```javascript
export const API_CONFIG = {
  // ViewDNS.info API配置
  viewDNS: {
    enabled: true, // 改为true启用
    apiKey: process.env.VIEWDNS_API_KEY || '',
    // ... 其他配置
  },
  
  // IP2WHOIS.com API配置
  ip2whois: {
    enabled: true, // 改为true启用
    apiKey: process.env.IP2WHOIS_API_KEY || '',
    // ... 其他配置
  }
};
```

## 查询策略配置

### 1. 默认回退顺序

系统会按以下顺序尝试查询：
1. 标准WHOIS查询
2. ViewDNS.info API
3. IP2WHOIS.com API

### 2. 特定TLD优先级

对于某些特殊的顶级域名，可以配置优先使用第三方API：

```javascript
tldPreferences: {
  // 中国域名优先使用IP2WHOIS
  'cn': ['ip2whois', 'viewdns', 'standard'],
  
  // 俄罗斯域名优先使用ViewDNS  
  'ru': ['viewdns', 'ip2whois', 'standard'],
  
  // 免费域名后缀优先使用第三方API
  'tk': ['viewdns', 'ip2whois', 'standard'],
  'ml': ['viewdns', 'ip2whois', 'standard'],
  'ga': ['viewdns', 'ip2whois', 'standard'],
  'cf': ['viewdns', 'ip2whois', 'standard']
}
```

## 费用说明

### ViewDNS.info
- 免费计划：每月1000次查询
- 付费计划：$10/月起，支持更多查询

### IP2WHOIS.com  
- 免费计划：每月500次查询
- 付费计划：$8/月起，支持更多查询

## 使用建议

1. **免费使用**: 对于个人用户，两个服务的免费配额通常足够使用
2. **备份策略**: 建议同时配置两个API作为备份
3. **特殊域名**: 对于经常查询失败的特殊域名后缀，可以调整优先级配置
4. **监控用量**: 定期检查API使用量，避免超出配额

## 故障排除

### 常见问题

1. **API密钥无效**
   - 检查环境变量是否正确设置
   - 确认API密钥有效且未过期

2. **查询失败**
   - 检查网络连接
   - 确认API服务状态正常
   - 查看控制台日志获取详细错误信息

3. **配额超限**
   - 升级到付费计划
   - 或临时禁用API，使用标准WHOIS查询

### 日志分析

系统会输出详细的查询日志，格式如下：

```
=== 开始查询域名: example.com ===
[策略] 查询顺序: standard -> viewdns -> ip2whois
[尝试] 使用 standard 查询 example.com
[失败] standard 查询失败: 网络连接失败
[尝试] 使用 viewdns 查询 example.com
[成功] 使用 viewdns 成功查询到域名信息
[结果] 注册商: Example Registrar, 状态: normal, DNS: Cloudflare
```

通过日志可以了解查询过程和结果来源。 