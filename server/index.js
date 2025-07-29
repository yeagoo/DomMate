import express from 'express';
import cors from 'cors';
import whois from 'whois';
import cron from 'node-cron';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { promisify } from 'util';
import { API_CONFIG, getQueryStrategy, isApiEnabled } from './config.js';
import { queryViewDNS, queryIP2WHOIS } from './thirdPartyApis.js';
import db from './database.js';
import exportService from './exportService.js';
import scheduledExportService from './scheduledExport.js';
import emailService from './emailService.js';
import cronScheduler from './cronScheduler.js';
import authService from './authService.js';
import { setupHealthCheck } from './health-check.js';

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

// 服务静态文件 (前端构建产物)
app.use(express.static(path.join(process.cwd(), 'dist')));

// 设置健康检查端点
setupHealthCheck(app, db);

// ========== 认证相关 API ==========

// 获取登录信息（检查是否需要验证码等）
app.get('/api/auth/info', async (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const info = await authService.getLoginInfo(ipAddress);
    res.json({
      success: true,
      ...info
    });
  } catch (error) {
    console.error('获取登录信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取登录信息失败'
    });
  }
});

// 检查强制修改密码状态
app.get('/api/auth/force-password-change', async (req, res) => {
  try {
    const passwordChangeNeeded = await db.needsPasswordChange();
    res.json({
      success: true,
      forcePasswordChange: passwordChangeNeeded.required,
      reason: passwordChangeNeeded.reason
    });
  } catch (error) {
    console.error('检查强制修改密码状态失败:', error);
    res.status(500).json({
      success: false,
      message: '检查强制修改密码状态失败'
    });
  }
});

// 设置强制修改密码（管理员功能）
app.post('/api/auth/force-password-change', authService.authenticateRequest, async (req, res) => {
  try {
    const { reason } = req.body;
    await db.setForcePasswordChange(reason || '管理员要求修改密码');
    res.json({
      success: true,
      message: '已设置强制修改密码'
    });
  } catch (error) {
    console.error('设置强制修改密码失败:', error);
    res.status(500).json({
      success: false,
      message: '设置强制修改密码失败'
    });
  }
});

// 用户登录
app.post('/api/auth/login', async (req, res) => {
  try {
    const { password, captcha, captchaId } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || '';

    if (!password) {
      return res.status(400).json({
        success: false,
        message: '密码不能为空'
      });
    }

    const result = await authService.login(password, captcha, captchaId, ipAddress, userAgent);
    
    if (result.success) {
      // 设置会话Cookie（可选）
      res.cookie('sessionId', result.sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24小时
      });
    }

    res.json(result);
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({
      success: false,
      message: '登录过程中发生错误'
    });
  }
});

// 用户登出
app.post('/api/auth/logout', async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;
    const result = await authService.logout(sessionId);
    
    // 清除Cookie
    res.clearCookie('sessionId');
    
    res.json(result);
  } catch (error) {
    console.error('登出失败:', error);
    res.status(500).json({
      success: false,
      message: '登出过程中发生错误'
    });
  }
});

// 修改密码
app.post('/api/auth/change-password', async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '原密码和新密码不能为空'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: '新密码长度不能少于6位'
      });
    }

    const result = await authService.changePassword(oldPassword, newPassword, sessionId);
    res.json(result);
  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({
      success: false,
      message: '修改密码过程中发生错误'
    });
  }
});

// 验证会话状态
app.get('/api/auth/session', async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;
    const session = await authService.validateSession(sessionId);
    
    if (session) {
      res.json({
        success: true,
        valid: true,
        session: {
          id: session.session_id,
          expiresAt: session.expires_at,
          lastActivity: session.last_activity
        }
      });
    } else {
      res.json({
        success: true,
        valid: false
      });
    }
  } catch (error) {
    console.error('验证会话失败:', error);
    res.status(500).json({
      success: false,
      message: '验证会话失败'
    });
  }
});

// 获取新的验证码
app.get('/api/auth/captcha', (req, res) => {
  try {
    const captcha = authService.generateCaptchaForClient();
    res.json({
      success: true,
      captcha
    });
  } catch (error) {
    console.error('生成验证码失败:', error);
    res.status(500).json({
      success: false,
      message: '生成验证码失败'
    });
  }
});

// 应用认证中间件到所有API路由（除了认证相关的）
app.use('/api', (req, res, next) => {
  authService.authenticateRequest(req, res, next);
});

// ========== 域名相关 API ==========

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
        isImportant: false,
        notes: null,
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
    isImportant: Boolean(domain.isImportant),
    notes: domain.notes || null,
    createdAt: new Date(domain.createdAt),
    updatedAt: new Date(domain.updatedAt)
  })).sort((a, b) => {
    if (!a.expiresAt) return 1;
    if (!b.expiresAt) return -1;
    return a.expiresAt.getTime() - b.expiresAt.getTime();
  });
  
  res.json(formatted);
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

// 重新检查所有域名的到期时间
app.post('/api/domains/recheck-all', async (req, res) => {
  try {
    console.log('开始重新检查所有域名...');
    const allDomains = await db.getAllDomains();
    
    if (allDomains.length === 0) {
      return res.json({ 
        success: true, 
        message: '没有需要检查的域名',
        total: 0,
        updated: 0,
        failed: 0
      });
    }
    
    let updatedCount = 0;
    let failedCount = 0;
    const now = new Date().toISOString();
    
    console.log(`正在检查 ${allDomains.length} 个域名...`);
    
    // 并行处理所有域名，但限制并发数量
    const batchSize = 5; // 每批处理5个域名
    const batches = [];
    
    for (let i = 0; i < allDomains.length; i += batchSize) {
      batches.push(allDomains.slice(i, i + batchSize));
    }
    
    for (const batch of batches) {
      const promises = batch.map(async (domain) => {
        try {
          console.log(`重新检查域名: ${domain.domain}`);
          const whoisData = await queryDomainUnified(domain.domain);
          
          await db.updateDomain(domain.id, {
            registrar: whoisData.registrar || null,
            expiresAt: whoisData.expirationDate ? whoisData.expirationDate.toISOString() : null,
            dnsProvider: whoisData.dnsProvider || null,
            domainStatus: whoisData.status || null,
            status: whoisData.domainStatus,
            lastCheck: now
          });
          
          updatedCount++;
          console.log(`✅ ${domain.domain} 检查完成`);
        } catch (error) {
          failedCount++;
          console.error(`❌ ${domain.domain} 检查失败:`, error.message);
          
          // 更新最后检查时间，即使查询失败
          try {
            await db.updateDomain(domain.id, { lastCheck: now });
          } catch (updateError) {
            console.error(`更新最后检查时间失败:`, updateError.message);
          }
        }
      });
      
      // 等待当前批次完成
      await Promise.all(promises);
      
      // 批次之间短暂延迟，避免过度负载
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`重新检查完成: 成功 ${updatedCount} 个, 失败 ${failedCount} 个`);
    
    res.json({
      success: true,
      message: `重新检查完成: 成功 ${updatedCount} 个，失败 ${failedCount} 个`,
      total: allDomains.length,
      updated: updatedCount,
      failed: failedCount
    });
    
  } catch (error) {
    console.error('批量重新检查失败:', error);
    res.status(500).json({ error: '重新检查失败: ' + error.message });
  }
});

// 批量删除域名
app.delete('/api/domains', async (req, res) => {
  try {
    const { domainIds } = req.body;
    
    if (!domainIds || !Array.isArray(domainIds) || domainIds.length === 0) {
      return res.status(400).json({ error: '域名ID列表不能为空' });
    }
    
    console.log(`批量删除域名请求: ${domainIds.length} 个域名`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const domainId of domainIds) {
      try {
        const domain = await db.getDomainById(domainId);
        if (domain) {
          await db.deleteDomain(domainId);
          console.log(`✅ 删除域名成功: ${domain.domain}`);
          successCount++;
        } else {
          console.log(`❌ 域名不存在: ${domainId}`);
          failCount++;
        }
      } catch (error) {
        console.error(`❌ 删除域名失败: ${domainId}`, error);
        failCount++;
      }
    }
    
    res.json({
      success: true,
      message: `批量删除完成: 成功 ${successCount} 个，失败 ${failCount} 个`,
      successCount,
      failCount
    });
    
  } catch (error) {
    console.error('批量删除域名错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取可用导出字段
app.get('/api/export/fields', (req, res) => {
  const language = req.query.language || 'zh';
  const fields = exportService.getAvailableFields(language);
  res.json({ fields });
});

// 数据导出API
app.post('/api/export', async (req, res) => {
  try {
    const { 
      format = 'csv', 
      selectedFields = [], 
      filename = 'domains',
      language = 'zh',
      options = {}
    } = req.body;
    
    // 验证参数
    if (!['csv', 'pdf', 'json'].includes(format)) {
      return res.status(400).json({ error: '不支持的导出格式' });
    }
    
    if (!Array.isArray(selectedFields) || selectedFields.length === 0) {
      return res.status(400).json({ error: '请选择要导出的字段' });
    }
    
    // 获取所有域名数据
    const domains = await db.getAllDomains();
    
    if (domains.length === 0) {
      return res.status(400).json({ error: '没有可导出的数据' });
    }
    
    console.log(`开始导出数据: 格式=${format}, 字段=${selectedFields.length}个, 域名=${domains.length}个`);
    
    let result;
    
    switch (format) {
      case 'csv':
        result = await exportService.exportToCSV(domains, selectedFields, { filename, language, ...options });
        break;
      case 'pdf':
        const title = language === 'en' ? 'Domain Monitoring Report' : '域名监控报告';
        result = await exportService.exportToPDF(domains, selectedFields, { filename, language, title, ...options });
        break;
      case 'json':
        result = await exportService.exportToJSON(domains, selectedFields, { filename, language, ...options });
        break;
    }
    
    console.log(`导出完成: ${result.filename} (${result.size} bytes)`);
    
    res.json({
      success: true,
      message: '导出成功',
      file: {
        filename: result.filename,
        size: result.size,
        format: format,
        totalRecords: domains.length,
        selectedFields: selectedFields.length
      }
    });
    
  } catch (error) {
    console.error('数据导出失败:', error);
    res.status(500).json({ error: '导出失败: ' + error.message });
  }
});

// 下载导出文件
app.get('/api/export/download/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), 'exports', filename);
    
    // 安全检查：确保文件存在且在exports目录内
    if (!fsSync.existsSync(filePath) || !filePath.startsWith(path.join(process.cwd(), 'exports'))) {
      return res.status(404).json({ error: '文件不存在' });
    }
    
    // 设置下载响应头
    const extension = path.extname(filename);
    let mimeType = 'application/octet-stream';
    
    switch (extension) {
      case '.csv':
        mimeType = 'text/csv; charset=utf-8';
        break;
      case '.pdf':
        mimeType = 'application/pdf';
        break;
      case '.json':
        mimeType = 'application/json';
        break;
    }
    
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Cache-Control', 'no-cache');
    
    const fileStream = fsSync.createReadStream(filePath);
    fileStream.pipe(res);
    
    fileStream.on('error', (error) => {
      console.error('文件下载错误:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: '文件下载失败' });
      }
    });
    
    fileStream.on('end', () => {
      console.log(`文件下载完成: ${filename}`);
    });
    
  } catch (error) {
    console.error('下载请求处理失败:', error);
    res.status(500).json({ error: '下载失败: ' + error.message });
  }
});

// 获取导出历史记录
app.get('/api/export/history', async (req, res) => {
  try {
    const exportPath = path.join(process.cwd(), 'exports');
    
    if (!fsSync.existsSync(exportPath)) {
      return res.json({ files: [] });
    }
    
    const files = fsSync.readdirSync(exportPath);
    const fileInfo = files.map(filename => {
      const filePath = path.join(exportPath, filename);
      const stats = fsSync.statSync(filePath);
      const extension = path.extname(filename);
      
      return {
        filename,
        size: stats.size,
        createdAt: stats.mtime.toISOString(),
        format: extension.slice(1), // 去掉点号
        humanSize: formatFileSize(stats.size)
      };
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // 按时间倒序
    
    res.json({ files: fileInfo });
    
  } catch (error) {
    console.error('获取导出历史失败:', error);
    res.status(500).json({ error: '获取历史记录失败: ' + error.message });
  }
});

// 清理旧的导出文件
app.post('/api/export/cleanup', async (req, res) => {
  try {
    exportService.cleanupOldExports();
    res.json({ success: true, message: '清理完成' });
  } catch (error) {
    console.error('清理导出文件失败:', error);
    res.status(500).json({ error: '清理失败: ' + error.message });
  }
});

// 获取定期导出配置
app.get('/api/export/schedule', (req, res) => {
  try {
    const status = scheduledExportService.getStatus();
    res.json(status);
  } catch (error) {
    console.error('获取定期导出配置失败:', error);
    res.status(500).json({ error: '获取配置失败: ' + error.message });
  }
});

// 更新定期导出配置
app.post('/api/export/schedule', (req, res) => {
  try {
    const result = scheduledExportService.updateConfig(req.body);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('更新定期导出配置失败:', error);
    res.status(500).json({ error: '更新配置失败: ' + error.message });
  }
});

// 手动触发定期导出
app.post('/api/export/schedule/trigger', async (req, res) => {
  try {
    await scheduledExportService.triggerManualExport();
    res.json({ success: true, message: '手动导出已触发' });
  } catch (error) {
    console.error('手动触发导出失败:', error);
    res.status(500).json({ error: '触发失败: ' + error.message });
  }
});

// 获取导出历史记录（包括定期导出）
app.get('/api/export/history/scheduled', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const history = scheduledExportService.getExportHistory(limit);
    res.json({ history });
  } catch (error) {
    console.error('获取定期导出历史失败:', error);
    res.status(500).json({ error: '获取历史失败: ' + error.message });
  }
});

// 验证cron表达式
app.post('/api/export/schedule/validate-cron', (req, res) => {
  try {
    const { expression } = req.body;
    if (!expression) {
      return res.status(400).json({ error: 'Cron表达式不能为空' });
    }
    
    const isValid = scheduledExportService.validateCronExpression(expression);
    res.json({ valid: isValid });
  } catch (error) {
    res.json({ valid: false, error: error.message });
  }
});

// ====== 分组管理API ======

// 获取所有分组
app.get('/api/groups', async (req, res) => {
  try {
    const groups = await db.getAllGroups();
    res.json(groups);
  } catch (error) {
    console.error('获取分组失败:', error);
    res.status(500).json({ error: '获取分组失败: ' + error.message });
  }
});

// 创建新分组
app.post('/api/groups', async (req, res) => {
  try {
    const { name, description, color } = req.body;
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: '分组名称不能为空' });
    }
    
    const groupData = {
      name: name.trim(),
      description: description || '',
      color: color || '#3B82F6'
    };
    
    const newGroup = await db.createGroup(groupData);
    res.status(201).json(newGroup);
  } catch (error) {
    console.error('创建分组失败:', error);
    if (error.message.includes('UNIQUE constraint')) {
      res.status(400).json({ error: '分组名称已存在' });
    } else {
      res.status(500).json({ error: '创建分组失败: ' + error.message });
    }
  }
});

// 更新分组
app.put('/api/groups/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color } = req.body;
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: '分组名称不能为空' });
    }
    
    const groupData = {
      name: name.trim(),
      description: description || '',
      color: color || '#3B82F6'
    };
    
    const updatedGroup = await db.updateGroup(id, groupData);
    res.json(updatedGroup);
  } catch (error) {
    console.error('更新分组失败:', error);
    if (error.message === '分组不存在') {
      res.status(404).json({ error: '分组不存在' });
    } else if (error.message.includes('UNIQUE constraint')) {
      res.status(400).json({ error: '分组名称已存在' });
    } else {
      res.status(500).json({ error: '更新分组失败: ' + error.message });
    }
  }
});

// 删除分组
app.delete('/api/groups/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.deleteGroup(id);
    res.json(result);
  } catch (error) {
    console.error('删除分组失败:', error);
    if (error.message === '分组不存在') {
      res.status(404).json({ error: '分组不存在' });
    } else if (error.message.includes('无法删除系统默认分组')) {
      res.status(400).json({ error: '无法删除系统默认分组' });
    } else {
      res.status(500).json({ error: '删除分组失败: ' + error.message });
    }
  }
});

// 获取分组中的域名
app.get('/api/groups/:id/domains', async (req, res) => {
  try {
    const { id } = req.params;
    const domains = await db.getDomainsByGroup(id);
    
    const formatted = domains.map(domain => ({
      id: domain.id,
      domain: domain.domain,
      registrar: domain.registrar,
      expiresAt: domain.expiresAt ? new Date(domain.expiresAt) : null,
      dnsProvider: domain.dnsProvider,
      domainStatus: domain.domainStatus,
      status: domain.status,
      lastCheck: domain.lastCheck ? new Date(domain.lastCheck) : null,
      isImportant: Boolean(domain.isImportant),
      notes: domain.notes || null,
      createdAt: new Date(domain.createdAt),
      updatedAt: new Date(domain.updatedAt)
    }));
    
    res.json(formatted);
  } catch (error) {
    console.error('获取分组域名失败:', error);
    res.status(500).json({ error: '获取分组域名失败: ' + error.message });
  }
});

// 获取未分组的域名
app.get('/api/groups/ungrouped/domains', async (req, res) => {
  try {
    const domains = await db.getUngroupedDomains();
    
    const formatted = domains.map(domain => ({
      id: domain.id,
      domain: domain.domain,
      registrar: domain.registrar,
      expiresAt: domain.expiresAt ? new Date(domain.expiresAt) : null,
      dnsProvider: domain.dnsProvider,
      domainStatus: domain.domainStatus,
      status: domain.status,
      lastCheck: domain.lastCheck ? new Date(domain.lastCheck) : null,
      isImportant: Boolean(domain.isImportant),
      notes: domain.notes || null,
      createdAt: new Date(domain.createdAt),
      updatedAt: new Date(domain.updatedAt)
    }));
    
    res.json(formatted);
  } catch (error) {
    console.error('获取未分组域名失败:', error);
    res.status(500).json({ error: '获取未分组域名失败: ' + error.message });
  }
});

// 将域名添加到分组
app.post('/api/groups/:groupId/domains/:domainId', async (req, res) => {
  try {
    const { groupId, domainId } = req.params;
    const result = await db.addDomainToGroup(domainId, groupId);
    res.json(result);
  } catch (error) {
    console.error('添加域名到分组失败:', error);
    res.status(500).json({ error: '添加域名到分组失败: ' + error.message });
  }
});

// 从分组中移除域名
app.delete('/api/groups/:groupId/domains/:domainId', async (req, res) => {
  try {
    const { groupId, domainId } = req.params;
    const result = await db.removeDomainFromGroup(domainId, groupId);
    res.json(result);
  } catch (error) {
    console.error('从分组移除域名失败:', error);
    res.status(500).json({ error: '从分组移除域名失败: ' + error.message });
  }
});

// 获取域名的分组信息
app.get('/api/domains/:id/groups', async (req, res) => {
  try {
    const { id } = req.params;
    const groups = await db.getDomainGroups(id);
    res.json(groups);
  } catch (error) {
    console.error('获取域名分组信息失败:', error);
    res.status(500).json({ error: '获取域名分组信息失败: ' + error.message });
  }
});

// 获取分组统计信息
app.get('/api/groups/stats', async (req, res) => {
  try {
    const stats = await db.getGroupStats();
    res.json(stats);
  } catch (error) {
    console.error('获取分组统计失败:', error);
    res.status(500).json({ error: '获取分组统计失败: ' + error.message });
  }
});

// 按分组导出数据
app.post('/api/groups/:id/export', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      format = 'csv', 
      selectedFields = [], 
      filename,
      language = 'zh',
      options = {}
    } = req.body;
    
    // 验证参数
    if (!['csv', 'pdf', 'json'].includes(format)) {
      return res.status(400).json({ error: '不支持的导出格式' });
    }
    
    if (!Array.isArray(selectedFields) || selectedFields.length === 0) {
      return res.status(400).json({ error: '请选择要导出的字段' });
    }
    
    // 获取分组信息
    const groups = await db.getAllGroups();
    const group = groups.find(g => g.id === id);
    if (!group) {
      return res.status(404).json({ error: '分组不存在' });
    }
    
    // 获取分组中的域名数据
    let domains;
    if (id === 'ungrouped') {
      domains = await db.getUngroupedDomains();
    } else {
      domains = await db.getDomainsByGroup(id);
    }
    
    if (domains.length === 0) {
      return res.status(400).json({ error: '该分组没有可导出的域名数据' });
    }
    
    const exportFilename = filename || `${group.name}_domains`;
    
    console.log(`开始按分组导出数据: 分组=${group.name}, 格式=${format}, 字段=${selectedFields.length}个, 域名=${domains.length}个`);
    
    let result;
    
    switch (format) {
      case 'csv':
        result = await exportService.exportToCSV(domains, selectedFields, { filename: exportFilename, language, ...options });
        break;
      case 'pdf':
        const title = language === 'en' ? `${group.name} Domain Report` : `${group.name} 域名报告`;
        result = await exportService.exportToPDF(domains, selectedFields, { filename: exportFilename, language, title, ...options });
        break;
      case 'json':
        result = await exportService.exportToJSON(domains, selectedFields, { filename: exportFilename, language, ...options });
        break;
    }
    
    console.log(`分组导出完成: ${result.filename} (${result.size} bytes)`);
    
    res.json({
      success: true,
      message: `${group.name} 分组导出成功`,
      file: {
        filename: result.filename,
        size: result.size,
        format: format,
        totalRecords: domains.length,
        selectedFields: selectedFields.length,
        groupName: group.name
      }
    });
    
  } catch (error) {
    console.error('分组数据导出失败:', error);
    res.status(500).json({ error: '导出失败: ' + error.message });
  }
});

// 文件大小格式化辅助函数
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ===============================
// 邮件系统 API 路由
// ===============================

// 邮件配置相关 API

// 获取所有邮件配置
app.get('/api/email/configs', async (req, res) => {
  try {
    const configs = await db.getAllEmailConfigs();
    // 隐藏敏感信息
    const safeConfigs = configs.map(config => ({
      ...config,
      password: '****'
    }));
    res.json(safeConfigs);
  } catch (error) {
    console.error('获取邮件配置失败:', error);
    res.status(500).json({ error: '获取邮件配置失败: ' + error.message });
  }
});

// 根据ID获取邮件配置
app.get('/api/email/configs/:id', async (req, res) => {
  try {
    const config = await db.getEmailConfigById(req.params.id);
    if (!config) {
      return res.status(404).json({ error: '邮件配置不存在' });
    }
    
    // 隐藏密码
    config.password = '****';
    res.json(config);
  } catch (error) {
    console.error('获取邮件配置失败:', error);
    res.status(500).json({ error: '获取邮件配置失败: ' + error.message });
  }
});

// 添加邮件配置
app.post('/api/email/configs', async (req, res) => {
  try {
    const { name, host, port, secure, username, password, fromEmail, fromName, isDefault } = req.body;

    if (!name || !host || !port || !username || !password || !fromEmail) {
      return res.status(400).json({ error: '缺少必需字段' });
    }

    const configData = {
      id: 'email_config_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      name,
      host,
      port: parseInt(port),
      secure: Boolean(secure),
      username,
      password,
      fromEmail,
      fromName: fromName || name,
      isDefault: Boolean(isDefault),
      isActive: true
    };

    const newConfig = await db.addEmailConfig(configData);
    
    // 隐藏密码
    newConfig.password = '****';
    res.json(newConfig);
  } catch (error) {
    console.error('添加邮件配置失败:', error);
    res.status(500).json({ error: '添加邮件配置失败: ' + error.message });
  }
});

// 更新邮件配置
app.put('/api/email/configs/:id', async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // 如果密码是****，则不更新密码字段
    if (updateData.password === '****') {
      delete updateData.password;
    }

    await db.updateEmailConfig(req.params.id, updateData);
    res.json({ success: true });
  } catch (error) {
    console.error('更新邮件配置失败:', error);
    res.status(500).json({ error: '更新邮件配置失败: ' + error.message });
  }
});

// 删除邮件配置
app.delete('/api/email/configs/:id', async (req, res) => {
  try {
    await db.deleteEmailConfig(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('删除邮件配置失败:', error);
    res.status(500).json({ error: '删除邮件配置失败: ' + error.message });
  }
});

// 测试邮件配置
app.post('/api/email/configs/:id/test', async (req, res) => {
  try {
    const result = await emailService.testEmailConfig(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('测试邮件配置失败:', error);
    res.status(500).json({ error: '测试邮件配置失败: ' + error.message });
  }
});

// 邮件模板相关 API

// 获取所有邮件模板
app.get('/api/email/templates', async (req, res) => {
  try {
    const { type, language } = req.query;
    
    let templates;
    if (type && language) {
      templates = await db.getEmailTemplatesByTypeAndLanguage(type, language);
    } else {
      templates = await db.getAllEmailTemplates();
    }
    
    res.json(templates);
  } catch (error) {
    console.error('获取邮件模板失败:', error);
    res.status(500).json({ error: '获取邮件模板失败: ' + error.message });
  }
});

// 根据ID获取邮件模板
app.get('/api/email/templates/:id', async (req, res) => {
  try {
    const template = await db.getEmailTemplateById(req.params.id);
    if (!template) {
      return res.status(404).json({ error: '邮件模板不存在' });
    }
    
    res.json(template);
  } catch (error) {
    console.error('获取邮件模板失败:', error);
    res.status(500).json({ error: '获取邮件模板失败: ' + error.message });
  }
});

// 添加邮件模板
app.post('/api/email/templates', async (req, res) => {
  try {
    const { name, type, language, subject, htmlContent, textContent, variables, isActive } = req.body;

    if (!name || !type || !language || !subject || !htmlContent) {
      return res.status(400).json({ error: '缺少必需字段' });
    }

    const templateData = {
      id: 'email_template_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      name,
      type,
      language,
      subject,
      htmlContent,
      textContent: textContent || '',
      variables: variables || [],
      isDefault: false,
      isActive: isActive !== false
    };

    const newTemplate = await db.addEmailTemplate(templateData);
    res.json(newTemplate);
  } catch (error) {
    console.error('添加邮件模板失败:', error);
    res.status(500).json({ error: '添加邮件模板失败: ' + error.message });
  }
});

// 更新邮件模板
app.put('/api/email/templates/:id', async (req, res) => {
  try {
    await db.updateEmailTemplate(req.params.id, req.body);
    res.json({ success: true });
  } catch (error) {
    console.error('更新邮件模板失败:', error);
    res.status(500).json({ error: '更新邮件模板失败: ' + error.message });
  }
});

// 删除邮件模板
app.delete('/api/email/templates/:id', async (req, res) => {
  try {
    await db.deleteEmailTemplate(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('删除邮件模板失败:', error);
    res.status(500).json({ error: '删除邮件模板失败: ' + error.message });
  }
});

// 预览邮件模板
app.post('/api/email/templates/:id/preview', async (req, res) => {
  try {
    const { templateData = {} } = req.body;
    const preview = await emailService.previewTemplate(req.params.id, templateData);
    res.json(preview);
  } catch (error) {
    console.error('预览邮件模板失败:', error);
    res.status(500).json({ error: '预览邮件模板失败: ' + error.message });
  }
});

// 预览自定义邮件模板内容
app.post('/api/email/templates/preview-custom', async (req, res) => {
  try {
    const { subject, htmlContent, templateData = {} } = req.body;
    const preview = await emailService.previewCustomTemplate(subject, htmlContent, templateData);
    res.json(preview);
  } catch (error) {
    console.error('预览自定义邮件模板失败:', error);
    res.status(500).json({ error: '预览自定义邮件模板失败: ' + error.message });
  }
});

// 通知规则相关 API

// 获取所有通知规则
app.get('/api/email/rules', async (req, res) => {
  try {
    const rules = await db.getAllNotificationRules();
    res.json(rules);
  } catch (error) {
    console.error('获取通知规则失败:', error);
    res.status(500).json({ error: '获取通知规则失败: ' + error.message });
  }
});

// 根据ID获取通知规则
app.get('/api/email/rules/:id', async (req, res) => {
  try {
    const rule = await db.getNotificationRuleById(req.params.id);
    if (!rule) {
      return res.status(404).json({ error: '通知规则不存在' });
    }
    
    res.json(rule);
  } catch (error) {
    console.error('获取通知规则失败:', error);
    res.status(500).json({ error: '获取通知规则失败: ' + error.message });
  }
});

// 添加通知规则
app.post('/api/email/rules', async (req, res) => {
  try {
    const { 
      name, type, days, scheduleHour, scheduleMinute, scheduleWeekday,
      emailConfigId, templateId, recipients, isActive 
    } = req.body;

    if (!name || !type || !emailConfigId || !templateId || !recipients || !recipients.length) {
      return res.status(400).json({ error: '缺少必需字段' });
    }

    // 验证邮件地址格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const email of recipients) {
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: `无效的邮件地址: ${email}` });
      }
    }

    // 验证调度参数
    const hour = scheduleHour !== undefined ? parseInt(scheduleHour) : 8;
    const minute = scheduleMinute !== undefined ? parseInt(scheduleMinute) : 0;
    const weekday = scheduleWeekday !== undefined ? parseInt(scheduleWeekday) : 1;

    if (hour < 0 || hour > 23) {
      return res.status(400).json({ error: '小时必须在0-23之间' });
    }
    if (minute < 0 || minute > 59) {
      return res.status(400).json({ error: '分钟必须在0-59之间' });
    }
    if (type === 'weekly_summary' && (weekday < 0 || weekday > 6)) {
      return res.status(400).json({ error: '星期几必须在0-6之间' });
    }

    const ruleData = {
      id: 'notification_rule_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      name,
      type,
      days: type === 'expiry_reminder' ? parseInt(days || 7) : null,
      scheduleHour: hour,
      scheduleMinute: minute,
      scheduleWeekday: type === 'weekly_summary' ? weekday : null,
      emailConfigId,
      templateId,
      recipients,
      isActive: isActive !== false
    };

    const newRule = await db.addNotificationRule(ruleData);
    
    // 如果规则是活跃的，注册动态定时任务
    if (newRule.isActive && newRule.cronExpression) {
      const taskFunction = createRuleTaskFunction(newRule);
      cronScheduler.registerDynamicTask(newRule.id, newRule.cronExpression, taskFunction);
    }
    
    res.json(newRule);
  } catch (error) {
    console.error('添加通知规则失败:', error);
    res.status(500).json({ error: '添加通知规则失败: ' + error.message });
  }
});

// 更新通知规则
app.put('/api/email/rules/:id', async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // 验证邮件地址格式
    if (updateData.recipients) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      for (const email of updateData.recipients) {
        if (!emailRegex.test(email)) {
          return res.status(400).json({ error: `无效的邮件地址: ${email}` });
        }
      }
    }

    // 验证调度参数
    if (updateData.scheduleHour !== undefined) {
      const hour = parseInt(updateData.scheduleHour);
      if (hour < 0 || hour > 23) {
        return res.status(400).json({ error: '小时必须在0-23之间' });
      }
      updateData.scheduleHour = hour;
    }
    
    if (updateData.scheduleMinute !== undefined) {
      const minute = parseInt(updateData.scheduleMinute);
      if (minute < 0 || minute > 59) {
        return res.status(400).json({ error: '分钟必须在0-59之间' });
      }
      updateData.scheduleMinute = minute;
    }
    
    if (updateData.scheduleWeekday !== undefined) {
      const weekday = parseInt(updateData.scheduleWeekday);
      if (weekday < 0 || weekday > 6) {
        return res.status(400).json({ error: '星期几必须在0-6之间' });
      }
      updateData.scheduleWeekday = weekday;
    }

    // 先停止现有的动态任务
    cronScheduler.stopDynamicTask(req.params.id);

    // 更新数据库
    await db.updateNotificationRule(req.params.id, updateData);
    
    // 获取更新后的规则信息
    const updatedRule = await db.getNotificationRuleById(req.params.id);
    
    // 如果规则是活跃的且有cron表达式，重新注册动态任务
    if (updatedRule && updatedRule.isActive && updatedRule.cronExpression) {
      const taskFunction = createRuleTaskFunction(updatedRule);
      cronScheduler.registerDynamicTask(updatedRule.id, updatedRule.cronExpression, taskFunction);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('更新通知规则失败:', error);
    res.status(500).json({ error: '更新通知规则失败: ' + error.message });
  }
});

// 删除通知规则
app.delete('/api/email/rules/:id', async (req, res) => {
  try {
    // 停止相关的动态任务
    cronScheduler.stopDynamicTask(req.params.id);
    
    // 删除数据库记录
    await db.deleteNotificationRule(req.params.id);
    
    res.json({ success: true });
  } catch (error) {
    console.error('删除通知规则失败:', error);
    res.status(500).json({ error: '删除通知规则失败: ' + error.message });
  }
});

// 手动触发通知规则
app.post('/api/email/rules/:id/trigger', async (req, res) => {
  try {
    const rule = await db.getNotificationRuleById(req.params.id);
    if (!rule) {
      return res.status(404).json({ error: '通知规则不存在' });
    }

    let results = [];
    
    if (rule.type === 'expiry_reminder') {
      results = await emailService.sendExpiryReminders([rule.days]);
    } else if (rule.type === 'daily_summary') {
      results = await emailService.sendSummaryReports('daily');
    } else if (rule.type === 'weekly_summary') {
      results = await emailService.sendSummaryReports('weekly');
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error('触发通知规则失败:', error);
    res.status(500).json({ error: '触发通知规则失败: ' + error.message });
  }
});

// 通知记录相关 API

// 获取通知记录
app.get('/api/email/logs', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const logs = await db.getNotificationLogs(parseInt(limit), parseInt(offset));
    res.json(logs);
  } catch (error) {
    console.error('获取通知记录失败:', error);
    res.status(500).json({ error: '获取通知记录失败: ' + error.message });
  }
});

// 重试失败的邮件
app.post('/api/email/retry', async (req, res) => {
  try {
    const results = await emailService.retryFailedEmails();
    res.json({ success: true, results });
  } catch (error) {
    console.error('重试失败邮件失败:', error);
    res.status(500).json({ error: '重试失败邮件失败: ' + error.message });
  }
});

// 发送测试邮件
app.post('/api/email/send-test', async (req, res) => {
  try {
    const { configId, templateId, recipient, templateData } = req.body;

    if (!recipient) {
      return res.status(400).json({ error: '缺少接收者邮箱' });
    }

    // 验证邮件地址格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipient)) {
      return res.status(400).json({ error: '无效的邮件地址' });
    }

    const result = await emailService.sendEmail({
      configId,
      templateId,
      recipient,
      templateData
    });

    res.json(result);
  } catch (error) {
    console.error('发送测试邮件失败:', error);
    res.status(500).json({ error: '发送测试邮件失败: ' + error.message });
  }
});

// 获取邮件统计信息
app.get('/api/email/stats', async (req, res) => {
  try {
    const [configs, templates, rules, recentLogs] = await Promise.all([
      db.getAllEmailConfigs(),
      db.getAllEmailTemplates(),
      db.getAllNotificationRules(),
      db.getNotificationLogs(10, 0)
    ]);

    const activeConfigs = configs.filter(c => c.isActive).length;
    const activeTemplates = templates.filter(t => t.isActive).length;
    const activeRules = rules.filter(r => r.isActive).length;
    
    const sentToday = recentLogs.filter(log => {
      const today = new Date().toDateString();
      const logDate = new Date(log.createdAt).toDateString();
      return logDate === today && log.status === 'sent';
    }).length;

    const failedToday = recentLogs.filter(log => {
      const today = new Date().toDateString();
      const logDate = new Date(log.createdAt).toDateString();
      return logDate === today && log.status === 'failed';
    }).length;

    res.json({
      configs: {
        total: configs.length,
        active: activeConfigs
      },
      templates: {
        total: templates.length,
        active: activeTemplates
      },
      rules: {
        total: rules.length,
        active: activeRules
      },
      todayStats: {
        sent: sentToday,
        failed: failedToday
      }
    });
  } catch (error) {
    console.error('获取邮件统计失败:', error);
    res.status(500).json({ error: '获取邮件统计失败: ' + error.message });
  }
});

// 创建规则任务执行函数
function createRuleTaskFunction(rule) {
  return async () => {
    console.log(`🔔 执行通知规则: ${rule.name} (${rule.type})`);
    
    try {
      let results = [];
      
      switch (rule.type) {
        case 'expiry_reminder':
          // 域名到期提醒
          const days = rule.days || 7;
          if (days > 0) {
            results = await emailService.sendExpiryReminders([days]);
          } else {
            // 到期后提醒（负数天数）
            results = await emailService.sendExpiredReminders([Math.abs(days)]);
          }
          break;
          
        case 'daily_summary':
          // 每日汇总
          results = await emailService.sendSummaryReports('daily');
          break;
          
        case 'weekly_summary':
          // 每周汇总
          results = await emailService.sendSummaryReports('weekly');
          break;
          
        default:
          console.warn(`未知的规则类型: ${rule.type}`);
          return;
      }
      
      // 更新规则执行信息
      const now = new Date().toISOString();
      await db.updateNotificationRuleRunInfo(rule.id, now, null);
      
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      console.log(`✅ 规则执行完成: ${rule.name}, 成功${successCount}封, 失败${failCount}封`);
      
    } catch (error) {
      console.error(`❌ 规则执行失败: ${rule.name}`, error.message);
    }
  };
}

// 初始化动态定时任务
async function initializeDynamicTasks() {
  console.log('🚀 初始化动态定时任务...');
  
  try {
    const rules = await db.getAllNotificationRules();
    const activeRules = rules.filter(rule => rule.isActive && rule.cronExpression);
    
    let successCount = 0;
    for (const rule of activeRules) {
      const taskFunction = createRuleTaskFunction(rule);
      if (cronScheduler.registerDynamicTask(rule.id, rule.cronExpression, taskFunction)) {
        successCount++;
      }
    }
    
    console.log(`✅ 动态任务初始化完成: ${successCount}/${activeRules.length} 个任务`);
    
  } catch (error) {
    console.error('❌ 初始化动态任务失败:', error.message);
  }
}

// ============== 定时任务 ==============

// 定时任务 - 每天上午 9 点发送域名到期提醒
cron.schedule('0 9 * * *', async () => {
  console.log('🔔 开始发送域名到期提醒...');
  try {
    const results = await emailService.sendExpiryReminders([7, 30, 90]);
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    console.log(`✅ 到期提醒发送完成: 成功${successCount}封, 失败${failCount}封`);
  } catch (error) {
    console.error('❌ 发送到期提醒失败:', error.message);
  }
});

// 定时任务 - 每天早上 8 点发送日报
cron.schedule('0 8 * * *', async () => {
  console.log('📊 开始发送每日汇总报告...');
  try {
    const results = await emailService.sendSummaryReports('daily');
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    console.log(`✅ 日报发送完成: 成功${successCount}封, 失败${failCount}封`);
  } catch (error) {
    console.error('❌ 发送日报失败:', error.message);
  }
});

// 定时任务 - 每周一早上 8:30 发送周报
cron.schedule('30 8 * * 1', async () => {
  console.log('📈 开始发送每周汇总报告...');
  try {
    const results = await emailService.sendSummaryReports('weekly');
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    console.log(`✅ 周报发送完成: 成功${successCount}封, 失败${failCount}封`);
  } catch (error) {
    console.error('❌ 发送周报失败:', error.message);
  }
});

// 定时任务 - 每小时重试失败的邮件
cron.schedule('0 * * * *', async () => {
  console.log('🔄 开始重试失败的邮件...');
  try {
    const results = await emailService.retryFailedEmails();
    if (results.length > 0) {
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      console.log(`✅ 邮件重试完成: 成功${successCount}封, 失败${failCount}封`);
    } else {
      console.log('✅ 没有需要重试的邮件');
    }
  } catch (error) {
    console.error('❌ 重试失败邮件时出错:', error.message);
  }
});

// 定时任务 - 每天凌晨 1 点清理过期的通知记录 (保留30天)
cron.schedule('0 1 * * *', async () => {
  console.log('🗑️  开始清理过期通知记录...');
  try {
    // 删除30天前的通知记录
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // 这里需要在database.js中添加清理方法
    // 暂时用日志记录
    console.log('✅ 通知记录清理完成 (功能待完善)');
  } catch (error) {
    console.error('❌ 清理通知记录失败:', error.message);
  }
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

// Catch-all handler: 所有非API路由都返回index.html (SPA路由支持)
app.get('*', (req, res) => {
  // 跳过API路由
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // 为前端路由返回index.html
  res.sendFile(path.join(process.cwd(), 'dist/index.html'));
});

app.listen(PORT, async () => {
  await db.init();
  await initializeDynamicTasks(); // 初始化动态定时任务
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`API 地址: http://localhost:${PORT}/api`);
  console.log(`前端地址: http://localhost:${PORT}`);
}); 

// 获取域名统计
app.get('/api/domains/stats', async (req, res) => {
  try {
    const stats = await db.getDomainStats();
    res.json(stats);
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({ error: '获取统计数据失败: ' + error.message });
  }
});

// 获取增强的仪表板数据
app.get('/api/dashboard/analytics', async (req, res) => {
  try {
    // 并行获取核心统计数据
    const [
      expiryDistribution,
      monthlyTrend,
      statusHistory
    ] = await Promise.all([
      db.getExpiryDistribution(),
      db.getMonthlyExpiryTrend(),
      db.getStatusHistory()
    ]);

    res.json({
      expiryDistribution,
      monthlyTrend,
      statusHistory
    });
  } catch (error) {
    console.error('获取仪表板数据失败:', error);
    res.status(500).json({ error: '获取仪表板数据失败: ' + error.message });
  }
}); 

// 批量标记重要
app.post('/api/domains/batch-important', async (req, res) => {
  try {
    const { domainIds, isImportant } = req.body;
    
    if (!domainIds || !Array.isArray(domainIds) || domainIds.length === 0) {
      return res.status(400).json({ error: '域名ID列表不能为空' });
    }
    
    if (typeof isImportant !== 'boolean') {
      return res.status(400).json({ error: '重要性标记必须为布尔值' });
    }
    
    console.log(`批量${isImportant ? '标记重要' : '取消重要标记'}请求: ${domainIds.length} 个域名`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const domainId of domainIds) {
      try {
        const domain = await db.getDomainById(domainId);
        if (domain) {
          await db.updateDomain(domainId, { isImportant });
          console.log(`✅ ${isImportant ? '标记重要' : '取消重要标记'}成功: ${domain.domain}`);
          successCount++;
        } else {
          console.log(`❌ 域名不存在: ${domainId}`);
          failCount++;
        }
      } catch (error) {
        console.error(`❌ ${isImportant ? '标记重要' : '取消重要标记'}失败: ${domainId}`, error);
        failCount++;
      }
    }
    
    res.json({
      success: true,
      message: `批量${isImportant ? '标记重要' : '取消重要标记'}完成: 成功 ${successCount} 个，失败 ${failCount} 个`,
      successCount,
      failCount
    });
    
  } catch (error) {
    console.error(`批量${req.body.isImportant ? '标记重要' : '取消重要标记'}错误:`, error);
    res.status(500).json({ error: error.message });
  }
});

// 批量添加备注
app.post('/api/domains/batch-notes', async (req, res) => {
  try {
    const { domainIds, notes } = req.body;
    
    if (!domainIds || !Array.isArray(domainIds) || domainIds.length === 0) {
      return res.status(400).json({ error: '域名ID列表不能为空' });
    }
    
    if (notes === undefined || notes === null) {
      return res.status(400).json({ error: '备注内容不能为空（使用空字符串清除备注）' });
    }
    
    console.log(`批量${notes ? '添加备注' : '清除备注'}请求: ${domainIds.length} 个域名`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const domainId of domainIds) {
      try {
        const domain = await db.getDomainById(domainId);
        if (domain) {
          await db.updateDomain(domainId, { notes: notes || null });
          console.log(`✅ ${notes ? '添加备注' : '清除备注'}成功: ${domain.domain}`);
          successCount++;
        } else {
          console.log(`❌ 域名不存在: ${domainId}`);
          failCount++;
        }
      } catch (error) {
        console.error(`❌ ${notes ? '添加备注' : '清除备注'}失败: ${domainId}`, error);
        failCount++;
      }
    }
    
    res.json({
      success: true,
      message: `批量${notes ? '添加备注' : '清除备注'}完成: 成功 ${successCount} 个，失败 ${failCount} 个`,
      successCount,
      failCount
    });
    
  } catch (error) {
    console.error(`批量${req.body.notes ? '添加备注' : '清除备注'}错误:`, error);
    res.status(500).json({ error: error.message });
  }
});

// 获取可用导出字段
app.get('/api/export/fields', (req, res) => {
  const language = req.query.language || 'zh';
  const fields = exportService.getAvailableFields(language);
  res.json({ fields });
});

// 更新域名备注
app.patch('/api/domains/:id/notes', async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;
  
  try {
    const domain = await db.getDomainById(id);
    
    if (!domain) {
      return res.status(404).json({ error: '域名未找到' });
    }
    
    await db.updateDomain(id, {
      notes: notes || null
    });
    
    res.json({ 
      success: true, 
      message: notes ? '备注更新成功' : '备注清空成功'
    });
  } catch (error) {
    console.error('更新域名备注失败:', error);
    res.status(500).json({ error: '更新备注失败: ' + error.message });
  }
});

// ========== 前端路由支持 ==========

// 处理前端SPA路由 - 将所有非API请求重定向到index.html
app.get('*', (req, res) => {
  // 排除API路径
  if (req.path.startsWith('/api/') || req.path.startsWith('/health')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // 检查是否请求静态资源
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.woff', '.woff2', '.ttf', '.eot'];
  const hasStaticExtension = staticExtensions.some(ext => req.path.toLowerCase().endsWith(ext));
  
  if (hasStaticExtension) {
    return res.status(404).send('Static file not found');
  }
  
  // 对于所有其他请求，返回index.html以支持前端路由
  const indexPath = path.join(process.cwd(), 'dist', 'index.html');
  
  // 检查index.html是否存在
  if (!fsSync.existsSync(indexPath)) {
    console.error('❌ 前端构建产物不存在:', indexPath);
    return res.status(500).send(`
      <html>
        <head><title>DomMate - 构建错误</title></head>
        <body>
          <h1>🔧 DomMate 启动中...</h1>
          <p>前端构建产物尚未准备就绪，请稍候片刻。</p>
          <p>如果此问题持续存在，请检查构建配置。</p>
          <script>setTimeout(() => location.reload(), 5000);</script>
        </body>
      </html>
    `);
  }
  
  res.sendFile(indexPath);
});

// ========== 服务器启动 ==========

// 启动服务器
const server = app.listen(PORT, '0.0.0.0', async () => {
  console.log('🚀 =================================');
  console.log('🎉 DomMate 服务器启动成功！');
  console.log('🚀 =================================');
  console.log(`📊 Node.js 版本: ${process.version}`);
  console.log(`🌐 服务地址: http://0.0.0.0:${PORT}`);
  console.log(`📱 本地访问: http://localhost:${PORT}`);
  console.log(`🔗 英文版本: http://localhost:${PORT}/en`);
  console.log(`❤️  健康检查: http://localhost:${PORT}/health`);
  console.log('🚀 =================================');
  
  // 初始化数据库
  try {
    await db.init();
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
  }
  
  // 初始化邮件服务
  try {
    await emailService.init();
    console.log('✅ 邮件服务初始化成功');
  } catch (error) {
    console.error('❌ 邮件服务初始化失败:', error);
  }
  
  // 启动定时任务
  try {
    cronScheduler.start();
    console.log('✅ 定时任务启动成功');
  } catch (error) {
    console.error('⚠️  定时任务启动失败:', error);
  }
  
  // 检查前端构建产物
  const distPath = path.join(process.cwd(), 'dist');
  const indexPath = path.join(distPath, 'index.html');
  
  if (fsSync.existsSync(indexPath)) {
    console.log('✅ 前端构建产物存在');
    try {
      const stats = await fs.stat(distPath);
      const files = await fs.readdir(distPath);
      console.log(`📦 前端文件数量: ${files.length}`);
    } catch (error) {
      console.log('⚠️  无法读取前端文件信息');
    }
  } else {
    console.log('❌ 前端构建产物缺失');
    console.log('🔧 请确保前端已正确构建到 dist/ 目录');
  }
  
  console.log('🎯 DomMate 已就绪，开始监控域名！');
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('🛑 收到终止信号，正在优雅关闭服务器...');
  server.close(() => {
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 收到中断信号，正在优雅关闭服务器...');
  server.close(() => {
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });
});

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('💥 未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 未处理的Promise拒绝:', reason);
  process.exit(1);
});