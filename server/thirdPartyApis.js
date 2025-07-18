import fetch from 'node-fetch';
import { API_CONFIG } from './config.js';

// 等待函数
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ViewDNS.info API查询
export async function queryViewDNS(domain) {
  if (!API_CONFIG.viewDNS.enabled || !API_CONFIG.viewDNS.apiKey) {
    throw new Error('ViewDNS API未启用或缺少API密钥');
  }

  try {
    console.log(`[ViewDNS] 查询域名: ${domain}`);
    
    const url = new URL('/whois/', API_CONFIG.viewDNS.baseUrl);
    url.searchParams.append('domain', domain);
    url.searchParams.append('apikey', API_CONFIG.viewDNS.apiKey);
    url.searchParams.append('output', 'json');

    const response = await fetch(url.toString(), {
      timeout: API_CONFIG.viewDNS.timeout,
      headers: {
        'User-Agent': 'DomainFlow/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`ViewDNS API错误: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.query && data.query.error) {
      throw new Error(`ViewDNS查询错误: ${data.query.error}`);
    }

    // 解析ViewDNS返回的数据
    return parseViewDNSResponse(domain, data);
    
  } catch (error) {
    console.error(`[ViewDNS] 查询失败 ${domain}:`, error.message);
    throw error;
  }
}

// IP2WHOIS.com API查询
export async function queryIP2WHOIS(domain) {
  if (!API_CONFIG.ip2whois.enabled || !API_CONFIG.ip2whois.apiKey) {
    throw new Error('IP2WHOIS API未启用或缺少API密钥');
  }

  try {
    console.log(`[IP2WHOIS] 查询域名: ${domain}`);
    
    const url = new URL('/', API_CONFIG.ip2whois.baseUrl);
    url.searchParams.append('key', API_CONFIG.ip2whois.apiKey);
    url.searchParams.append('domain', domain);
    url.searchParams.append('format', 'json');

    const response = await fetch(url.toString(), {
      timeout: API_CONFIG.ip2whois.timeout,
      headers: {
        'User-Agent': 'DomainFlow/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`IP2WHOIS API错误: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`IP2WHOIS查询错误: ${data.error.error_message || data.error}`);
    }

    // 解析IP2WHOIS返回的数据
    return parseIP2WHOISResponse(domain, data);
    
  } catch (error) {
    console.error(`[IP2WHOIS] 查询失败 ${domain}:`, error.message);
    throw error;
  }
}

// 解析ViewDNS响应数据
function parseViewDNSResponse(domain, data) {
  const query = data.query || {};
  const response = data.response || {};
  
  // 检查是否为未注册域名
  const isUnregistered = 
    response.contents && (
      response.contents.toLowerCase().includes('no match for domain') ||
      response.contents.toLowerCase().includes('domain not found') ||
      response.contents.toLowerCase().includes('not found') ||
      response.contents.toLowerCase().includes('no data found')
    );

  if (isUnregistered) {
    return {
      domain,
      registrar: null,
      expirationDate: null,
      status: null,
      domainStatus: 'unregistered',
      nameServers: [],
      dnsProvider: null,
      success: true,
      source: 'ViewDNS'
    };
  }

  let registrar = '';
  let expirationDate = null;
  let nameServers = [];
  let statusLines = [];

  if (response.contents) {
    const lines = response.contents.split('\n');
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase().trim();
      const originalLine = line.trim();
      
      // 提取注册商
      if (lowerLine.includes('registrar:') && !lowerLine.includes('registration')) {
        const colonIndex = originalLine.indexOf(':');
        const regValue = originalLine.substring(colonIndex + 1)?.trim() || '';
        if (regValue && !registrar) {
          registrar = regValue;
        }
      }
      
      // 提取Name Server
      if (lowerLine.includes('name server:') || lowerLine.includes('nameserver:')) {
        const colonIndex = originalLine.indexOf(':');
        const nsValue = originalLine.substring(colonIndex + 1)?.trim();
        if (nsValue && !nameServers.includes(nsValue)) {
          nameServers.push(nsValue);
        }
      }
      
      // 收集域名状态
      if (lowerLine.includes('domain status:')) {
        const statusValue = originalLine.split(':')[1]?.trim();
        if (statusValue) {
          statusLines.push(statusValue);
        }
      }
      
      // 提取到期时间
      if (lowerLine.includes('expiry date:') || 
          lowerLine.includes('expiration date:') ||
          lowerLine.includes('registrar registration expiration date:')) {
        
        const colonIndex = originalLine.indexOf(':');
        let dateStr = originalLine.substring(colonIndex + 1)?.trim();
        if (dateStr) {
          dateStr = dateStr.replace(/\s*\([^)]*\)/g, '');
          const parsedDate = new Date(dateStr);
          if (!isNaN(parsedDate.getTime())) {
            expirationDate = parsedDate;
          }
        }
      }
    }
  }

  // 推断DNS提供商
  const dnsProvider = inferDnsProvider(nameServers);
  
  // 清理状态
  const cleanedStatus = cleanDomainStatus(statusLines.join('\n'));
  
  // 计算域名状态
  let domainStatus = 'normal';
  if (expirationDate) {
    const now = new Date();
    const diffTime = expirationDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 30) {
      domainStatus = 'normal';
    } else if (diffDays > 0) {
      domainStatus = 'expiring';
    } else {
      domainStatus = 'expired';
    }
  } else if (!registrar && !cleanedStatus) {
    domainStatus = 'failed';
  }

  return {
    domain,
    registrar: registrar || null,
    expirationDate,
    status: cleanedStatus,
    domainStatus,
    nameServers,
    dnsProvider,
    success: true,
    source: 'ViewDNS'
  };
}

// 解析IP2WHOIS响应数据
function parseIP2WHOISResponse(domain, data) {
  // 检查是否为未注册域名
  if (data.status === 'UNREGISTERED' || 
      (data.domain_name && data.domain_name.toLowerCase().includes('not found'))) {
    return {
      domain,
      registrar: null,
      expirationDate: null,
      status: null,
      domainStatus: 'unregistered',
      nameServers: [],
      dnsProvider: null,
      success: true,
      source: 'IP2WHOIS'
    };
  }

  let expirationDate = null;
  if (data.expire_date) {
    const parsedDate = new Date(data.expire_date);
    if (!isNaN(parsedDate.getTime())) {
      expirationDate = parsedDate;
    }
  }

  // 处理name servers
  let nameServers = [];
  if (data.nameservers) {
    nameServers = Array.isArray(data.nameservers) ? data.nameservers : [data.nameservers];
    nameServers = nameServers.filter(ns => ns && typeof ns === 'string');
  }

  // 推断DNS提供商
  const dnsProvider = inferDnsProvider(nameServers);
  
  // 处理域名状态
  let statusText = '';
  if (data.status) {
    statusText = Array.isArray(data.status) ? data.status.join(', ') : data.status;
  }
  const cleanedStatus = cleanDomainStatus(statusText);
  
  // 计算域名状态
  let domainStatus = 'normal';
  if (expirationDate) {
    const now = new Date();
    const diffTime = expirationDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 30) {
      domainStatus = 'normal';
    } else if (diffDays > 0) {
      domainStatus = 'expiring';
    } else {
      domainStatus = 'expired';
    }
  } else if (!data.registrar && !cleanedStatus) {
    domainStatus = 'failed';
  }

  return {
    domain,
    registrar: data.registrar || null,
    expirationDate,
    status: cleanedStatus,
    domainStatus,
    nameServers,
    dnsProvider,
    success: true,
    source: 'IP2WHOIS'
  };
}

// 辅助函数：清理域名状态（复用主文件中的逻辑）
function cleanDomainStatus(rawStatus) {
  if (!rawStatus) return null;
  
  const statuses = rawStatus.split('\n').map(s => s.trim()).filter(s => s);
  const cleanedStatuses = [];
  
  for (const status of statuses) {
    let cleanStatus = status.replace(/\s*\(https?:\/\/[^)]*\)/g, '');
    cleanStatus = cleanStatus.replace(/^Domain Status:\s*/i, '').trim();
    
    let chineseStatus = '';
    if (cleanStatus.toLowerCase().includes('clienttransferprohibited')) {
      chineseStatus = '禁止转移';
    } else if (cleanStatus.toLowerCase().includes('clientupdateprohibited')) {
      chineseStatus = '禁止更新';
    } else if (cleanStatus.toLowerCase().includes('clientdeleteprohibited')) {
      chineseStatus = '禁止删除';
    } else if (cleanStatus.toLowerCase().includes('servertransferprohibited')) {
      chineseStatus = '服务器禁止转移';
    } else if (cleanStatus.toLowerCase().includes('serverupdateprohibited')) {
      chineseStatus = '服务器禁止更新';
    } else if (cleanStatus.toLowerCase().includes('serverdeleteprohibited')) {
      chineseStatus = '服务器禁止删除';
    } else if (cleanStatus.toLowerCase().includes('inactive')) {
      chineseStatus = '非活跃状态';
    } else if (cleanStatus.toLowerCase().includes('ok')) {
      chineseStatus = '正常';
    } else if (cleanStatus.toLowerCase().includes('active')) {
      chineseStatus = '活跃';
    } else if (cleanStatus.toLowerCase().includes('locked')) {
      chineseStatus = '已锁定';
    } else if (cleanStatus.toLowerCase().includes('expired')) {
      chineseStatus = '已过期';
    } else if (cleanStatus.toLowerCase().includes('pending')) {
      chineseStatus = '待处理';
    } else {
      chineseStatus = cleanStatus.length > 20 ? cleanStatus.substring(0, 20) + '...' : cleanStatus;
    }
    
    if (chineseStatus && !cleanedStatuses.includes(chineseStatus)) {
      cleanedStatuses.push(chineseStatus);
    }
  }
  
  return cleanedStatuses.slice(0, 3).join(', ') || null;
}

// 辅助函数：推断DNS提供商（复用主文件中的逻辑）
function inferDnsProvider(nameServers) {
  if (!nameServers || nameServers.length === 0) return null;
  
  const allNs = nameServers.map(ns => ns.toLowerCase()).join(' ');
  
  if (allNs.includes('cloudflare')) return 'Cloudflare';
  if (allNs.includes('azure-dns') || allNs.includes('azure')) return 'Azure DNS';
  if (allNs.includes('amazonaws') || allNs.includes('awsdns')) return 'Amazon Route 53';
  if (allNs.includes('googledomains') || allNs.includes('google')) return 'Google Domains';
  if (allNs.includes('nsone')) return 'NS1';
  if (allNs.includes('dnspod')) return 'DNSPod';
  if (allNs.includes('aliyun') || allNs.includes('aliyu')) return '阿里云DNS';
  if (allNs.includes('cloudns')) return 'ClouDNS';
  if (allNs.includes('namecheap')) return 'Namecheap';
  if (allNs.includes('godaddy')) return 'GoDaddy';
  if (allNs.includes('digitalocean')) return 'DigitalOcean';
  if (allNs.includes('linode')) return 'Linode';
  if (allNs.includes('hostgator')) return 'HostGator';
  if (allNs.includes('bluehost')) return 'Bluehost';
  if (allNs.includes('squarespace')) return 'Squarespace';
  if (allNs.includes('wix')) return 'Wix';
  if (allNs.includes('shopify')) return 'Shopify';
  if (allNs.includes('github')) return 'GitHub Pages';
  if (allNs.includes('netlify')) return 'Netlify';
  if (allNs.includes('vercel')) return 'Vercel';
  
  const firstNs = nameServers[0].toLowerCase();
  const domain = firstNs.split('.').slice(-2).join('.');
  return domain.charAt(0).toUpperCase() + domain.slice(1);
} 