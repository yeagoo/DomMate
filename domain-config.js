// DomMate 域名配置
export const domainConfig = {
  // 官方域名
  officialDomain: 'dommate.com',
  
  // 相关域名
  relatedDomains: [
    'dommate.com',
    'www.dommate.com',
    'api.dommate.com',
    'docs.dommate.com',
    'support.dommate.com'
  ],
  
  // 品牌信息
  brandInfo: {
    name: 'DomMate',
    fullName: 'DomMate - 域名监控平台',
    description: '专业的域名到期监控解决方案',
    version: '2.0.0',
    author: 'DomMate Team',
    license: 'MIT'
  },
  
  // 联系信息
  contact: {
    website: 'https://dommate.com',
    support: 'support@dommate.com',
    github: 'https://github.com/dommate/dommate',
    docs: 'https://docs.dommate.com'
  },
  
  // 默认设置
  defaults: {
    checkInterval: 24, // 小时
    alertDays: [30, 7, 1], // 提前多少天提醒
    timezone: 'Asia/Shanghai',
    language: 'zh-CN'
  }
};

// 导出为CommonJS格式（用于Node.js）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { domainConfig };
} 