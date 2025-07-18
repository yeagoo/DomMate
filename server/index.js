import express from 'express';
import cors from 'cors';
import whois from 'whois';
import cron from 'node-cron';
import fs from 'fs/promises';
import { promisify } from 'util';

const app = express();
const PORT = process.env.PORT || 3001;

// 数据文件路径
const DATA_FILE = 'domains.json';

// 初始化数据文件
async function initDataFile() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2));
  }
}

// 读取域名数据
async function readDomains() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// 写入域名数据
async function writeDomains(domains) {
  await fs.writeFile(DATA_FILE, JSON.stringify(domains, null, 2));
}

const whoisAsync = promisify(whois.lookup);

// 中间件
app.use(cors());
app.use(express.json());

// WHOIS 查询功能
async function queryDomain(domain) {
  try {
    const result = await whoisAsync(domain);
    
    // 解析 WHOIS 数据
    const lines = result.split('\n');
    let registrar = '';
    let expirationDate = null;
    let status = '';
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      // 提取注册商
      if (lowerLine.includes('registrar:') || lowerLine.includes('registrar name:')) {
        registrar = line.split(':')[1]?.trim() || '';
      }
      
      // 提取到期时间
      if (lowerLine.includes('expiry date:') || 
          lowerLine.includes('expiration date:') || 
          lowerLine.includes('expires on:')) {
        const dateStr = line.split(':')[1]?.trim();
        if (dateStr) {
          expirationDate = new Date(dateStr);
        }
      }
      
      // 提取状态
      if (lowerLine.includes('domain status:')) {
        status = line.split(':')[1]?.trim() || '';
      }
    }
    
    // 计算状态
    let domainStatus = 'failed';
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
    }
    
    return {
      domain,
      registrar,
      expirationDate,
      status,
      domainStatus,
      success: true
    };
  } catch (error) {
    console.error(`WHOIS query failed for ${domain}:`, error.message);
    return {
      domain,
      success: false,
      error: error.message
    };
  }
}

// API 路由
app.post('/api/domains/import', async (req, res) => {
  const { domains } = req.body;
  
  if (!Array.isArray(domains)) {
    return res.status(400).json({ error: '域名列表必须是数组' });
  }
  
  const existingDomains = await readDomains();
  const results = [];
  const errors = [];
  
  for (const domainName of domains) {
    try {
      // 检查域名是否已存在
      const existing = existingDomains.find(d => d.domain === domainName);
      if (existing) {
        errors.push(`${domainName}: 域名已存在`);
        continue;
      }
      
      // 查询域名信息
      const whoisData = await queryDomain(domainName);
      
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const now = new Date().toISOString();
      
      const newDomain = {
        id,
        domain: domainName,
        registrar: whoisData.registrar || null,
        expiresAt: whoisData.expirationDate ? whoisData.expirationDate.toISOString() : null,
        dnsProvider: null,
        domainStatus: whoisData.status || null,
        status: whoisData.domainStatus,
        lastCheck: now,
        notifications: true,
        createdAt: now,
        updatedAt: now
      };
      
      existingDomains.push(newDomain);
      
      results.push({
        ...newDomain,
        expiresAt: whoisData.expirationDate,
        lastCheck: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
    } catch (error) {
      errors.push(`${domainName}: ${error.message}`);
    }
  }
  
  await writeDomains(existingDomains);
  
  res.json({
    success: results,
    errors,
    total: domains.length
  });
});

app.get('/api/domains', async (req, res) => {
  const domains = await readDomains();
  
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
  
  const domains = await readDomains();
  const domainIndex = domains.findIndex(d => d.id === id);
  
  if (domainIndex === -1) {
    return res.status(404).json({ error: '域名未找到' });
  }
  
  domains[domainIndex].notifications = Boolean(notifications);
  domains[domainIndex].updatedAt = new Date().toISOString();
  
  await writeDomains(domains);
  
  res.json({ success: true });
});

app.post('/api/domains/:id/refresh', async (req, res) => {
  const { id } = req.params;
  
  const domains = await readDomains();
  const domainIndex = domains.findIndex(d => d.id === id);
  
  if (domainIndex === -1) {
    return res.status(404).json({ error: '域名未找到' });
  }
  
  const domain = domains[domainIndex];
  const whoisData = await queryDomain(domain.domain);
  const now = new Date().toISOString();
  
  domains[domainIndex] = {
    ...domain,
    registrar: whoisData.registrar || null,
    expiresAt: whoisData.expirationDate ? whoisData.expirationDate.toISOString() : null,
    domainStatus: whoisData.status || null,
    status: whoisData.domainStatus,
    lastCheck: now,
    updatedAt: now
  };
  
  await writeDomains(domains);
  
  res.json({ success: true });
});

// 定时任务 - 每天凌晨 2 点执行
cron.schedule('0 2 * * *', async () => {
  console.log('开始定时更新域名信息...');
  
  const domains = await readDomains();
  
  for (let i = 0; i < domains.length; i++) {
    const domain = domains[i];
    try {
      const whoisData = await queryDomain(domain.domain);
      const now = new Date().toISOString();
      
      domains[i] = {
        ...domain,
        registrar: whoisData.registrar || null,
        expiresAt: whoisData.expirationDate ? whoisData.expirationDate.toISOString() : null,
        domainStatus: whoisData.status || null,
        status: whoisData.domainStatus,
        lastCheck: now,
        updatedAt: now
      };
      
      console.log(`已更新域名 ${domain.domain}`);
      
      // 避免请求过快，每个域名间隔 1 秒
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`更新域名 ${domain.domain} 失败:`, error.message);
    }
  }
  
  await writeDomains(domains);
  console.log('定时更新完成');
});

app.listen(PORT, async () => {
  await initDataFile();
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`API 地址: http://localhost:${PORT}/api`);
}); 