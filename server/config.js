// API配置文件
export const API_CONFIG = {
  // ViewDNS.info API配置
  viewDNS: {
    enabled: false, // 设置为true启用
    apiKey: process.env.VIEWDNS_API_KEY || '', // 从环境变量获取API密钥
    baseUrl: 'https://api.viewdns.info',
    timeout: 10000,
    rateLimit: 1000 // 请求间隔(ms)
  },
  
  // IP2WHOIS.com API配置
  ip2whois: {
    enabled: false, // 设置为true启用
    apiKey: process.env.IP2WHOIS_API_KEY || '', // 从环境变量获取API密钥
    baseUrl: 'https://api.ip2whois.com/v2',
    timeout: 10000,
    rateLimit: 1000 // 请求间隔(ms)
  },
  
  // 查询策略配置
  strategy: {
    // 优先级顺序：1=最高优先级
    fallbackOrder: ['standard', 'viewdns', 'ip2whois'],
    
    // 是否允许回退到第三方API
    allowFallback: true,
    
    // 针对特定TLD使用特定API
    tldPreferences: {
      // 示例：对这些ccTLD优先使用第三方API
      'cn': ['ip2whois', 'viewdns', 'standard'],
      'ru': ['viewdns', 'ip2whois', 'standard'],
      'tk': ['viewdns', 'ip2whois', 'standard'],
      'ml': ['viewdns', 'ip2whois', 'standard'],
      'ga': ['viewdns', 'ip2whois', 'standard'],
      'cf': ['viewdns', 'ip2whois', 'standard']
    }
  }
};

// 获取域名的查询策略
export function getQueryStrategy(domain) {
  const tld = domain.split('.').pop().toLowerCase();
  
  if (API_CONFIG.strategy.tldPreferences[tld]) {
    return API_CONFIG.strategy.tldPreferences[tld];
  }
  
  return API_CONFIG.strategy.fallbackOrder;
}

// 检查API是否可用
export function isApiEnabled(apiName) {
  switch (apiName) {
    case 'viewdns':
      return API_CONFIG.viewDNS.enabled && API_CONFIG.viewDNS.apiKey;
    case 'ip2whois':
      return API_CONFIG.ip2whois.enabled && API_CONFIG.ip2whois.apiKey;
    case 'standard':
      return true;
    default:
      return false;
  }
} 