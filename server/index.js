import express from 'express';
import cors from 'cors';
import whois from 'whois';
import cron from 'node-cron';
import fs from 'fs/promises';
import { promisify } from 'util';
import { API_CONFIG, getQueryStrategy, isApiEnabled } from './config.js';
import { queryViewDNS, queryIP2WHOIS } from './thirdPartyApis.js';
import db from './database.js';

const app = express();
const PORT = process.env.PORT || 3001;

// SQLite数据库配置在database.js中

const whoisAsync = promisify(whois.lookup);

// 域名格式验证
function isValidDomain(domain) {
  // 基本域名格式验证
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
  if (!domainRegex.test(domain)) {
    return false;
  }
  
  // 检查长度限制
  if (domain.length > 253) {
    return false;
  }
  
  // 检查每个标签的长度
  const labels = domain.split('.');
  for (const label of labels) {
    if (label.length === 0 || label.length > 63) {
      return false;
    }
  }
  
  return true;
}

// 带重试机制的WHOIS查询
async function whoisWithRetry(domain, maxRetries = 3, timeout = 15000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`WHOIS查询尝试 ${attempt}/${maxRetries}: ${domain}`);
      
      // 设置超时
      const result = await Promise.race([
        whoisAsync(domain),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('查询超时')), timeout)
        )
      ]);
      
      if (!result || result.trim().length === 0) {
        throw new Error('WHOIS服务器返回空结果');
      }
      
      return result;
    } catch (error) {
      console.log(`尝试 ${attempt} 失败: ${error.message}`);
      
      if (attempt === maxRetries) {
        throw new Error(`经过${maxRetries}次尝试后仍然失败: ${error.message}`);
      }
      
      // 指数退避延迟
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      console.log(`等待 ${delay}ms 后重试...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// 中间件
app.use(cors());
app.use(express.json());

// 清理和转换域名状态
function cleanDomainStatus(rawStatus) {
  if (!rawStatus) return null;
  
  // 处理多个状态的情况
  const statuses = rawStatus.split('\n').map(s => s.trim()).filter(s => s);
  const cleanedStatuses = [];
  
  for (const status of statuses) {
    // 移除URL和括号内容
    let cleanStatus = status.replace(/\s*\(https?:\/\/[^)]*\)/g, '');
    cleanStatus = cleanStatus.replace(/^Domain Status:\s*/i, '').trim();
    
    // 转换为中文描述
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
      // 保留清理后的原始状态，但限制长度
      chineseStatus = cleanStatus.length > 20 ? cleanStatus.substring(0, 20) + '...' : cleanStatus;
    }
    
    if (chineseStatus && !cleanedStatuses.includes(chineseStatus)) {
      cleanedStatuses.push(chineseStatus);
    }
  }
  
  // 返回最多3个主要状态，用逗号分隔
  return cleanedStatuses.slice(0, 3).join(', ') || null;
}

// 根据Name Server推断DNS提供商
function inferDnsProvider(nameServers) {
  if (!nameServers || nameServers.length === 0) return null;
  
  // 检查所有name servers，按优先级匹配
  const allNs = nameServers.map(ns => ns.toLowerCase()).join(' ');
  
  // 常见DNS提供商匹配规则（按优先级排序）
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
  
  // 如果无法识别，返回第一个name server的域名部分
  const firstNs = nameServers[0].toLowerCase();
  const domain = firstNs.split('.').slice(-2).join('.');
  return domain.charAt(0).toUpperCase() + domain.slice(1);
}

// 统一域名查询接口（支持多种查询方式）
async function queryDomainUnified(domain) {
  console.log(`\n=== 开始查询域名: ${domain} ===`);
  
  // 规范化域名格式
  const normalizedDomain = domain.toLowerCase().trim();
  
  // 验证域名格式
  if (!isValidDomain(normalizedDomain)) {
    throw new Error('无效的域名格式');
  }
  
  // 获取该域名的查询策略
  const strategy = getQueryStrategy(normalizedDomain);
  console.log(`[策略] 查询顺序: ${strategy.join(' -> ')}`);
  
  let lastError = null;
  
  // 按策略顺序尝试不同的查询方法
  for (const apiType of strategy) {
    if (!isApiEnabled(apiType)) {
      console.log(`[跳过] ${apiType} - API未启用或缺少配置`);
      continue;
    }
    
    try {
      console.log(`[尝试] 使用 ${apiType} 查询 ${normalizedDomain}`);
      
      let result = null;
      
      switch (apiType) {
        case 'standard':
          result = await queryDomainStandard(normalizedDomain);
          break;
        case 'viewdns':
          result = await queryViewDNS(normalizedDomain);
          // 添加查询间隔
          await new Promise(resolve => setTimeout(resolve, API_CONFIG.viewDNS.rateLimit));
          break;
        case 'ip2whois':
          result = await queryIP2WHOIS(normalizedDomain);
          // 添加查询间隔
          await new Promise(resolve => setTimeout(resolve, API_CONFIG.ip2whois.rateLimit));
          break;
        default:
          console.log(`[警告] 未知的API类型: ${apiType}`);
          continue;
      }
      
      if (result && result.success) {
        console.log(`[成功] 使用 ${apiType} 成功查询到域名信息`);
        console.log(`[结果] 注册商: ${result.registrar}, 状态: ${result.domainStatus}, DNS: ${result.dnsProvider}`);
        return result;
      }
      
    } catch (error) {
      console.error(`[失败] ${apiType} 查询失败: ${error.message}`);
      lastError = error;
      
      // 如果不允许回退，直接抛出错误
      if (!API_CONFIG.strategy.allowFallback) {
        throw error;
      }
      
      // 继续尝试下一个API
      continue;
    }
  }
  
  // 所有方法都失败了
  throw new Error(lastError ? lastError.message : '所有查询方法都失败了');
}

// 标准WHOIS查询功能（原queryDomain函数重命名）
async function queryDomainStandard(domain) {
  try {
    // 注意：domain已经在上层函数中规范化和验证过了
    const normalizedDomain = domain;
    
    // 使用重试机制查询
    const result = await whoisWithRetry(normalizedDomain);
    
    // 添加调试日志
    console.log(`\n=== WHOIS 查询: ${domain} ===`);
    console.log('原始数据前20行:');
    console.log(result.split('\n').slice(0, 20).join('\n'));
    console.log('========================\n');
    
    // 解析 WHOIS 数据
    const lines = result.split('\n');
    let registrar = '';
    let expirationDate = null;
    let statusLines = [];
    let nameServers = [];
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase().trim();
      const originalLine = line.trim();
      
      // 提取注册商 - 避免匹配到其他字段
      if ((lowerLine.includes('registrar:') && !lowerLine.includes('registration')) || 
          lowerLine.includes('registrar name:') ||
          lowerLine.includes('sponsoring registrar:')) {
        const colonIndex = originalLine.indexOf(':');
        const regValue = originalLine.substring(colonIndex + 1)?.trim() || '';
        if (regValue && !registrar) { // 只取第一个匹配的
          registrar = regValue;
        }
      }
      
      // 提取Name Server
      if (lowerLine.includes('name server:') || 
          lowerLine.includes('nameserver:') ||
          lowerLine.includes('nserver:') ||
          lowerLine.includes('dns:')) {
        const colonIndex = originalLine.indexOf(':');
        const nsValue = originalLine.substring(colonIndex + 1)?.trim();
        if (nsValue && !nameServers.includes(nsValue)) {
          nameServers.push(nsValue);
        }
      }
      
      // 收集所有域名状态行
      if (lowerLine.includes('domain status:') || 
          (lowerLine.includes('status:') && !lowerLine.includes('dnssec'))) {
        const statusValue = originalLine.split(':')[1]?.trim();
        if (statusValue) {
          statusLines.push(statusValue);
        }
      }
      
      // 提取到期时间 - 支持更多格式
      if (lowerLine.includes('expiry date:') || 
          lowerLine.includes('expiration date:') || 
          lowerLine.includes('expires on:') ||
          lowerLine.includes('registry expiry date:') ||
          lowerLine.includes('expires:') ||
          lowerLine.includes('expire:') ||
          lowerLine.includes('expiration time:') ||
          lowerLine.includes('paid-till:') ||
          lowerLine.includes('domain expiration date:') ||
          lowerLine.includes('registrar registration expiration date:') ||
          lowerLine.startsWith('expires') ||
          lowerLine.startsWith('expiry') ||
          lowerLine.startsWith('registrar registration expiration date:')) {
        
        // 找到第一个冒号后的所有内容（处理时间格式中的冒号）
        const colonIndex = originalLine.indexOf(':');
        let dateStr = originalLine.substring(colonIndex + 1)?.trim();
        if (dateStr) {
          console.log(`找到日期字段: ${originalLine}`);
          console.log(`提取的日期字符串: "${dateStr}"`);
          
          // 清理日期字符串 - 移除额外的文本
          dateStr = dateStr.replace(/\s*\([^)]*\)/g, ''); // 移除括号内容
          dateStr = dateStr.replace(/\s*(UTC|GMT|PST|EST|CST).*$/i, ''); // 移除时区信息
          dateStr = dateStr.trim();
          
          console.log(`清理后的日期字符串: "${dateStr}"`);
          
          // 尝试解析不同格式的日期
          let parsedDate = new Date(dateStr);
          
          // 如果标准解析失败，尝试其他格式
          if (isNaN(parsedDate.getTime())) {
            // 尝试替换格式，如 DD-MM-YYYY -> MM/DD/YYYY
            if (dateStr.match(/^\d{2}-\d{2}-\d{4}/)) {
              const parts = dateStr.split('-');
              dateStr = `${parts[1]}/${parts[0]}/${parts[2]}`;
              parsedDate = new Date(dateStr);
            }
            // 尝试 YYYY.MM.DD 格式
            else if (dateStr.match(/^\d{4}\.\d{2}\.\d{2}/)) {
              dateStr = dateStr.replace(/\./g, '-');
              parsedDate = new Date(dateStr);
            }
          }
          
          if (!isNaN(parsedDate.getTime())) {
            expirationDate = parsedDate;
            console.log(`成功解析日期: ${expirationDate}`);
          } else {
            console.log(`日期解析失败: "${dateStr}"`);
          }
        }
      }
    }
    
    // 检查是否为未注册域名
    const lowerResult = result.toLowerCase();
    const isUnregistered = 
      lowerResult.includes('no match for domain') ||
      lowerResult.includes('this query returned 0 objects') ||
      lowerResult.includes('does not have any data for') ||
      lowerResult.includes('domain not found') ||
      lowerResult.includes('not found') ||
      lowerResult.includes('no data found') ||
      (lowerResult.includes('iana whois server') && lowerResult.includes('returned 0 objects'));
    
    // 推断DNS提供商
    const dnsProvider = inferDnsProvider(nameServers);
    
    // 清理域名状态
    const cleanedStatus = cleanDomainStatus(statusLines.join('\n'));
    
    console.log(`Name Servers: [${nameServers.join(', ')}]`);
    console.log(`推断的DNS提供商: ${dnsProvider}`);
    console.log(`原始状态: [${statusLines.join(', ')}]`);
    console.log(`清理后状态: ${cleanedStatus}`);
    console.log(`是否未注册: ${isUnregistered}`);
    
    // 计算状态 - 改进逻辑
    let domainStatus = 'normal';
    
    if (isUnregistered) {
      domainStatus = 'unregistered';
    } else if (expirationDate) {
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
    } else {
      // 如果找不到到期时间，但有其他信息，标记为查询失败
      if (!registrar && !cleanedStatus) {
        domainStatus = 'failed';
      }
    }
    
    console.log(`最终结果: 注册商=${registrar}, 到期时间=${expirationDate}, DNS提供商=${dnsProvider}, 域名状态=${cleanedStatus}, 状态=${domainStatus}`);
    
    return {
      domain,
      registrar,
      expirationDate,
      status: cleanedStatus,
      domainStatus,
      nameServers,
      dnsProvider,
      success: true,
      source: 'Standard WHOIS'
    };
  } catch (error) {
    console.error(`WHOIS query failed for ${domain}:`, error.message);
    return {
      domain,
      success: false,
      error: error.message,
      domainStatus: 'failed'
    };
  }
}

// API 路由
app.post('/api/domains/import', async (req, res) => {
  const { domains } = req.body;
  
  if (!Array.isArray(domains)) {
    return res.status(400).json({ error: '域名列表必须是数组' });
  }
  
  const results = [];
  const errors = [];
  
  for (const domainName of domains) {
    try {
      // 清理域名输入
      const cleanDomainName = domainName.trim().toLowerCase();
      if (!cleanDomainName) {
        errors.push(`空域名: 请输入有效的域名`);
        continue;
      }
      
      // 检查域名是否已存在
      const existing = await db.getDomainByName(cleanDomainName);
      if (existing) {
        errors.push(`${cleanDomainName}: 域名已存在`);
        continue;
      }
      
      // 查询域名信息
      const whoisData = await queryDomainUnified(cleanDomainName);
      
      // 检查查询是否成功
      if (!whoisData.success) {
        throw new Error(whoisData.error || '域名查询失败');
      }
      

      
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const now = new Date().toISOString();
      
      const newDomain = {
        id,
        domain: cleanDomainName,
        registrar: whoisData.registrar || null,
        expiresAt: whoisData.expirationDate ? whoisData.expirationDate.toISOString() : null,
        dnsProvider: whoisData.dnsProvider || null,
        domainStatus: whoisData.status || null,
        status: whoisData.domainStatus,
        lastCheck: now,
        notifications: true,
        createdAt: now,
        updatedAt: now
      };
      
      // 添加到数据库
      await db.addDomain(newDomain);
      
      results.push({
        ...newDomain,
        expiresAt: whoisData.expirationDate,
        lastCheck: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
    } catch (error) {
      console.error(`导入域名 ${domainName} 失败:`, error);
      
      // 根据错误类型提供更具体的错误信息
      let errorMessage = '';
      if (error.message.includes('无效的域名格式')) {
        errorMessage = '域名格式不正确';
      } else if (error.message.includes('查询超时')) {
        errorMessage = 'WHOIS查询超时，请稍后重试';
      } else if (error.message.includes('WHOIS服务器返回空结果')) {
        errorMessage = '该域名可能不存在或WHOIS服务暂不可用';
      } else if (error.message.includes('经过') && error.message.includes('次尝试')) {
        errorMessage = '网络连接不稳定，查询失败';
      } else {
        errorMessage = `查询失败: ${error.message}`;
      }
      
      errors.push(`${domainName}: ${errorMessage}`);
    }
  }
  
  res.json({
    success: results,
    errors,
    total: domains.length
  });
});

app.get('/api/domains', async (req, res) => {
  const domains = await db.getAllDomains();
  
  const formatted = domains.map(domain => ({
    id: domain.id,
    domain: domain.domain,
    registrar: domain.registrar,
    expiresAt: domain.expiresAt ? new Date(domain.expiresAt) : null,
    dnsProvider: domain.dnsProvider,
    domainStatus: domain.domainStatus,
    status: domain.status,
    lastCheck: domain.lastCheck ? new Date(domain.lastCheck) : null,
    notifications: Boolean(domain.notifications),
    createdAt: new Date(domain.createdAt),
    updatedAt: new Date(domain.updatedAt)
  })).sort((a, b) => {
    if (!a.expiresAt) return 1;
    if (!b.expiresAt) return -1;
    return a.expiresAt.getTime() - b.expiresAt.getTime();
  });
  
  res.json(formatted);
});

app.patch('/api/domains/:id/notifications', async (req, res) => {
  const { id } = req.params;
  const { notifications } = req.body;
  
  const domain = await db.getDomainById(id);
  
  if (!domain) {
    return res.status(404).json({ error: '域名未找到' });
  }
  
  await db.updateDomain(id, {
    notifications: Boolean(notifications)
  });
  
  res.json({ success: true });
});

app.post('/api/domains/:id/refresh', async (req, res) => {
  const { id } = req.params;
  
  const domain = await db.getDomainById(id);
  
  if (!domain) {
    return res.status(404).json({ error: '域名未找到' });
  }
  
  const whoisData = await queryDomainUnified(domain.domain);
  const now = new Date().toISOString();
  
  await db.updateDomain(id, {
    registrar: whoisData.registrar || null,
    expiresAt: whoisData.expirationDate ? whoisData.expirationDate.toISOString() : null,
    dnsProvider: whoisData.dnsProvider || null,
    domainStatus: whoisData.status || null,
    status: whoisData.domainStatus,
    lastCheck: now
  });
  
  res.json({ success: true });
});

// 定时任务 - 每天凌晨 2 点执行
cron.schedule('0 2 * * *', async () => {
  console.log('开始定时更新域名信息...');
  
  const domains = await db.getAllDomains();
  
  for (const domain of domains) {
    try {
      const whoisData = await queryDomainUnified(domain.domain);
      const now = new Date().toISOString();
      
      await db.updateDomain(domain.id, {
        registrar: whoisData.registrar || null,
        expiresAt: whoisData.expirationDate ? whoisData.expirationDate.toISOString() : null,
        dnsProvider: whoisData.dnsProvider || null,
        domainStatus: whoisData.status || null,
        status: whoisData.domainStatus,
        lastCheck: now
      });
      
      console.log(`已更新域名 ${domain.domain}`);
      
      // 避免请求过快，每个域名间隔 1 秒
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`更新域名 ${domain.domain} 失败:`, error.message);
    }
  }
  
  // 批量更新域名状态
  await db.updateDomainStatuses();
  console.log('定时更新完成');
});

app.listen(PORT, async () => {
  await db.init();
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`API 地址: http://localhost:${PORT}/api`);
}); 