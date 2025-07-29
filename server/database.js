import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 数据库文件路径 - 存储在 /app/data 目录以实现数据持久化
const DB_PATH = process.env.DATABASE_PATH || join(__dirname, '..', 'data', 'domains.db');

class DomainDatabase {
  constructor() {
    this.db = null;
  }

  // 初始化数据库连接
  async init() {
    return new Promise((resolve, reject) => {
      // 确保数据目录存在
      const dataDir = dirname(DB_PATH);
      console.log(`🔍 数据库路径: ${DB_PATH}`);
      console.log(`🔍 数据目录: ${dataDir}`);
      
      if (!existsSync(dataDir)) {
        try {
          mkdirSync(dataDir, { recursive: true });
          console.log(`✅ 数据目录创建成功: ${dataDir}`);
        } catch (err) {
          console.error(`❌ 数据目录创建失败: ${err.message}`);
          console.error(`📋 错误详情: ${err.stack}`);
          reject(err);
          return;
        }
      } else {
        console.log(`✅ 数据目录已存在: ${dataDir}`);
      }

      // 检查目录权限
      try {
        // 尝试写入测试文件来检查权限
        const testFile = join(dataDir, '.write-test');
        writeFileSync(testFile, 'test');
        unlinkSync(testFile);
        console.log(`✅ 数据目录权限正常: ${dataDir}`);
      } catch (err) {
        console.error(`❌ 数据目录权限不足: ${err.message}`);
        console.error(`🔧 请检查目录权限: ls -la ${dirname(dataDir)}`);
        reject(new Error(`数据目录权限不足: ${dataDir} - ${err.message}`));
        return;
      }

      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error('❌ 数据库连接失败:', err.message);
          console.error('📋 错误代码:', err.code || 'UNKNOWN');
          console.error('📋 错误编号:', err.errno || 'UNKNOWN');
          console.error('🔧 建议解决方案:');
          console.error('   1. 检查数据目录权限: ls -la /app/data');
          console.error('   2. 检查磁盘空间: df -h');
          console.error('   3. 检查用户权限: whoami && id');
          reject(err);
        } else {
          console.log('✅ SQLite数据库连接成功');
          console.log(`📍 数据库文件位置: ${DB_PATH}`);
          
          this.db.serialize(async () => {
            try {
              // 创建基础表
              await this.createTable();
              
              // 迁移数据库表结构（添加新字段）
              await this.migrateDatabase();
              
              // 初始化认证配置
              await this.initializeAuthConfig();
              
              resolve();
            } catch (error) {
              console.error('数据库初始化失败:', error);
              reject(error);
            }
          });
        }
      });
    });
  }

  // 数据库表结构迁移
  async migrateDatabase() {
    return new Promise(async (resolve, reject) => {
      try {
        const alterStatements = [];

        // 检查domains表的新字段
        await new Promise((resolveCheck, rejectCheck) => {
          this.db.all("PRAGMA table_info(domains)", (err, columns) => {
            if (err) {
              rejectCheck(err);
              return;
            }

            const columnNames = columns.map(col => col.name);
            
            if (!columnNames.includes('isImportant')) {
              alterStatements.push('ALTER TABLE domains ADD COLUMN isImportant BOOLEAN DEFAULT 0');
            }
            
            if (!columnNames.includes('notes')) {
              alterStatements.push('ALTER TABLE domains ADD COLUMN notes TEXT');
            }

            resolveCheck();
          });
        });

        // 检查notification_rules表是否有新的调度字段
        await new Promise((resolveCheck, rejectCheck) => {
          this.db.all("PRAGMA table_info(notification_rules)", (err, columns) => {
            if (err) {
              rejectCheck(err);
              return;
            }

            const columnNames = columns.map(col => col.name);
            
            if (!columnNames.includes('scheduleHour')) {
              alterStatements.push('ALTER TABLE notification_rules ADD COLUMN scheduleHour INTEGER DEFAULT 8');
            }
            
            if (!columnNames.includes('scheduleMinute')) {
              alterStatements.push('ALTER TABLE notification_rules ADD COLUMN scheduleMinute INTEGER DEFAULT 0');
            }
            
            if (!columnNames.includes('scheduleWeekday')) {
              alterStatements.push('ALTER TABLE notification_rules ADD COLUMN scheduleWeekday INTEGER');
            }
            
            if (!columnNames.includes('cronExpression')) {
              alterStatements.push('ALTER TABLE notification_rules ADD COLUMN cronExpression TEXT');
            }

            resolveCheck();
          });
        });

        if (alterStatements.length > 0) {
          console.log('🔄 检测到数据库表结构更新，开始迁移...');
          
          // 执行所有ALTER语句
          let completedCount = 0;
          const totalCount = alterStatements.length;

          for (const statement of alterStatements) {
            await new Promise((resolveAlter, rejectAlter) => {
              this.db.run(statement, (err) => {
                if (err) {
                  console.error(`表结构更新失败:`, err);
                  rejectAlter(err);
                  return;
                }

                completedCount++;
                console.log(`✅ 字段更新 ${completedCount}/${totalCount} 完成`);
                resolveAlter();
              });
            });
          }

          // 所有字段添加完成，更新现有记录的cron表达式
          await this.updateExistingRulesCron();
          console.log('✅ 数据库表结构迁移完成');
        } else {
          console.log('✅ 数据库表结构已是最新版本');
        }

        resolve();
      } catch (error) {
        console.error('数据库迁移失败:', error);
        reject(error);
      }
    });
  }

  // 更新现有规则的cron表达式
  async updateExistingRulesCron() {
    return new Promise((resolve, reject) => {
      // 获取所有没有cron表达式的规则
      const selectSQL = `
        SELECT id, type, scheduleHour, scheduleMinute, scheduleWeekday 
        FROM notification_rules 
        WHERE cronExpression IS NULL OR cronExpression = ''
      `;

      this.db.all(selectSQL, (err, rules) => {
        if (err) {
          reject(err);
          return;
        }

        if (rules.length === 0) {
          resolve();
          return;
        }

        console.log(`🔄 更新 ${rules.length} 个现有规则的cron表达式...`);

        let completedCount = 0;
        rules.forEach(rule => {
          const cronExpression = this.generateCronExpression(
            rule.type,
            rule.scheduleHour || 8,
            rule.scheduleMinute || 0,
            rule.scheduleWeekday || 1
          );

          const updateSQL = 'UPDATE notification_rules SET cronExpression = ? WHERE id = ?';
          
          this.db.run(updateSQL, [cronExpression, rule.id], (err) => {
            if (err) {
              console.error(`更新规则 ${rule.id} 的cron表达式失败:`, err);
            } else {
              console.log(`✅ 更新规则 ${rule.id} 的cron表达式: ${cronExpression}`);
            }

            completedCount++;
            if (completedCount === rules.length) {
              resolve();
            }
          });
        });
      });
    });
  }

  // 创建domains表和分组相关表
  async createTable() {
    const createDomainsTableSQL = `
      CREATE TABLE IF NOT EXISTS domains (
        id TEXT PRIMARY KEY,
        domain TEXT UNIQUE NOT NULL,
        registrar TEXT,
        expiresAt TEXT,
        dnsProvider TEXT,
        domainStatus TEXT,
        status TEXT DEFAULT 'normal' CHECK(status IN ('normal', 'expiring', 'expired', 'failed', 'unregistered')),
        lastCheck TEXT,
        isImportant BOOLEAN DEFAULT 0,
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `;

    const createGroupsTableSQL = `
      CREATE TABLE IF NOT EXISTS groups (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        color TEXT DEFAULT '#3B82F6',
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `;

    const createDomainGroupsTableSQL = `
      CREATE TABLE IF NOT EXISTS domain_groups (
        id TEXT PRIMARY KEY,
        domainId TEXT NOT NULL,
        groupId TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (domainId) REFERENCES domains (id) ON DELETE CASCADE,
        FOREIGN KEY (groupId) REFERENCES groups (id) ON DELETE CASCADE,
        UNIQUE(domainId, groupId)
      )
    `;

    // 邮件配置表
    const createEmailConfigsTableSQL = `
      CREATE TABLE IF NOT EXISTS email_configs (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        host TEXT NOT NULL,
        port INTEGER NOT NULL,
        secure BOOLEAN DEFAULT 1,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        fromEmail TEXT NOT NULL,
        fromName TEXT,
        isDefault BOOLEAN DEFAULT 0,
        isActive BOOLEAN DEFAULT 1,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `;

    // 邮件模板表
    const createEmailTemplatesTableSQL = `
      CREATE TABLE IF NOT EXISTS email_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('reminder', 'summary')),
        language TEXT NOT NULL DEFAULT 'zh' CHECK(language IN ('zh', 'en')),
        subject TEXT NOT NULL,
        htmlContent TEXT NOT NULL,
        textContent TEXT,
        variables TEXT, -- JSON格式存储可用变量
        isDefault BOOLEAN DEFAULT 0,
        isActive BOOLEAN DEFAULT 1,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `;

    // 通知规则表
    const createNotificationRulesTableSQL = `
      CREATE TABLE IF NOT EXISTS notification_rules (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('expiry_reminder', 'daily_summary', 'weekly_summary')),
        days INTEGER, -- 提醒天数（到期提醒：正数=到期前，负数=到期后）
        scheduleHour INTEGER DEFAULT 8, -- 发送小时（0-23）
        scheduleMinute INTEGER DEFAULT 0, -- 发送分钟（0-59）
        scheduleWeekday INTEGER, -- 周几发送（weekly_summary：0=周日，1=周一...6=周六）
        cronExpression TEXT, -- 自动生成的cron表达式
        isActive BOOLEAN DEFAULT 1,
        emailConfigId TEXT,
        templateId TEXT,
        recipients TEXT NOT NULL, -- JSON格式存储邮件接收者列表
        lastRun TEXT,
        nextRun TEXT,
        runCount INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (emailConfigId) REFERENCES email_configs (id) ON DELETE SET NULL,
        FOREIGN KEY (templateId) REFERENCES email_templates (id) ON DELETE SET NULL
      )
    `;

    // 通知记录表
    const createNotificationLogsTableSQL = `
      CREATE TABLE IF NOT EXISTS notification_logs (
        id TEXT PRIMARY KEY,
        ruleId TEXT NOT NULL,
        domainIds TEXT, -- JSON格式存储相关域名ID列表
        recipient TEXT NOT NULL,
        subject TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('pending', 'sent', 'failed', 'retry')),
        errorMessage TEXT,
        sentAt TEXT,
        retryCount INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (ruleId) REFERENCES notification_rules (id) ON DELETE CASCADE
      )
    `;

    // 认证配置表 - 存储访问密码等配置
    this.db.run(`
      CREATE TABLE IF NOT EXISTS auth_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('❌ auth_config表创建失败:', err.message);
      } else {
        console.log('✅ auth_config表创建成功');
      }
    });

    // 会话表 - 存储用户登录会话
    this.db.run(`
      CREATE TABLE IF NOT EXISTS auth_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT UNIQUE NOT NULL,
        ip_address TEXT NOT NULL,
        user_agent TEXT,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_activity DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('❌ auth_sessions表创建失败:', err.message);
      } else {
        console.log('✅ auth_sessions表创建成功');
      }
    });

    // 登录尝试记录表 - 防暴力破解
    this.db.run(`
      CREATE TABLE IF NOT EXISTS login_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip_address TEXT NOT NULL,
        success BOOLEAN NOT NULL DEFAULT 0,
        captcha_required BOOLEAN NOT NULL DEFAULT 0,
        attempt_time DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('❌ login_attempts表创建失败:', err.message);
      } else {
        console.log('✅ login_attempts表创建成功');
      }
    });

    return new Promise((resolve, reject) => {
      // 创建domains表
      this.db.run(createDomainsTableSQL, (err) => {
        if (err) {
          console.error('创建domains表失败:', err.message);
          reject(err);
          return;
        }
        console.log('✅ domains表创建成功');

        // 创建groups表
        this.db.run(createGroupsTableSQL, (err) => {
          if (err) {
            console.error('创建groups表失败:', err.message);
            reject(err);
            return;
          }
          console.log('✅ groups表创建成功');

          // 创建domain_groups关联表
          this.db.run(createDomainGroupsTableSQL, (err) => {
            if (err) {
              console.error('创建domain_groups表失败:', err.message);
              reject(err);
              return;
            }
            console.log('✅ domain_groups表创建成功');
            
            // 创建email_configs表
            this.db.run(createEmailConfigsTableSQL, (err) => {
              if (err) {
                console.error('创建email_configs表失败:', err.message);
                reject(err);
                return;
              }
              console.log('✅ email_configs表创建成功');
              
              // 创建email_templates表
              this.db.run(createEmailTemplatesTableSQL, (err) => {
                if (err) {
                  console.error('创建email_templates表失败:', err.message);
                  reject(err);
                  return;
                }
                console.log('✅ email_templates表创建成功');
                
                // 创建notification_rules表
                this.db.run(createNotificationRulesTableSQL, (err) => {
                  if (err) {
                    console.error('创建notification_rules表失败:', err.message);
                    reject(err);
                    return;
                  }
                  console.log('✅ notification_rules表创建成功');
                  
                  // 创建notification_logs表
                  this.db.run(createNotificationLogsTableSQL, (err) => {
                    if (err) {
                      console.error('创建notification_logs表失败:', err.message);
                      reject(err);
                      return;
                    }
                    console.log('✅ notification_logs表创建成功');
                    
                    // 创建默认分组和默认邮件配置
                    this.createDefaultGroups()
                      .then(() => this.createDefaultEmailTemplates())
                      .then(resolve)
                      .catch(reject);
                  });
                });
              });
            });
          });
        });
      });
    });
  }

  // 创建默认分组
  async createDefaultGroups() {
    const defaultGroups = [
      {
        id: 'default',
        name: '默认分组',
        description: '未分组的域名',
        color: '#6B7280'
      },
      {
        id: 'important',
        name: '重要域名',
        description: '核心业务域名',
        color: '#EF4444'
      },
      {
        id: 'development',
        name: '开发测试',
        description: '开发和测试环境域名',
        color: '#10B981'
      }
    ];

    for (const group of defaultGroups) {
      await this.addGroupIfNotExists(group);
    }
  }

  // 添加分组（如果不存在）
  async addGroupIfNotExists(groupData) {
    const { id, name, description, color } = groupData;
    const now = new Date().toISOString();

    const insertSQL = `
      INSERT OR IGNORE INTO groups (id, name, description, color, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
      this.db.run(insertSQL, [id, name, description, color, now, now], function(err) {
        if (err) {
          console.error('创建默认分组失败:', err.message);
          reject(err);
        } else {
          if (this.changes > 0) {
            console.log(`✅ 默认分组"${name}"创建成功`);
          }
          resolve();
        }
      });
    });
  }

  // 创建默认邮件模板
  async createDefaultEmailTemplates() {
    const defaultTemplates = [
      {
        id: 'reminder_zh_7days',
        name: '7天到期提醒（中文）',
        type: 'reminder',
        language: 'zh',
        subject: '域名到期提醒 - {{domain}} 将于 {{days}} 天后到期',
        htmlContent: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              .email-container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
              .header { background: #3B82F6; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background: #f9fafb; }
              .domain-info { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; }
              .warning { color: #EF4444; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="email-container">
              <div class="header">
                <h1>DomMate 域名到期提醒</h1>
              </div>
              <div class="content">
                <p>您好，</p>
                <p class="warning">您的域名即将到期，请及时续费！</p>
                <div class="domain-info">
                  <h3>域名信息</h3>
                  <p><strong>域名:</strong> {{domain}}</p>
                  <p><strong>注册商:</strong> {{registrar}}</p>
                  <p><strong>到期时间:</strong> {{expiryDate}}</p>
                  <p><strong>剩余天数:</strong> <span class="warning">{{days}} 天</span></p>
                </div>
                <p>请尽快登录注册商续费您的域名，避免业务中断。</p>
              </div>
            </div>
          </body>
          </html>
        `,
        textContent: '域名到期提醒\n\n您的域名 {{domain}} 将于 {{days}} 天后到期，请及时续费。\n\n域名信息：\n- 域名: {{domain}}\n- 注册商: {{registrar}}\n- 到期时间: {{expiryDate}}\n- 剩余天数: {{days}} 天',
        variables: JSON.stringify(['domain', 'registrar', 'expiryDate', 'days']),
        isDefault: true,
        isActive: true
      },
      {
        id: 'reminder_en_7days',
        name: '7-Day Expiry Reminder (English)',
        type: 'reminder',
        language: 'en',
        subject: 'Domain Expiry Notice - {{domain}} expires in {{days}} days',
        htmlContent: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              .email-container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
              .header { background: #3B82F6; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background: #f9fafb; }
              .domain-info { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; }
              .warning { color: #EF4444; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="email-container">
              <div class="header">
                <h1>DomMate Domain Expiry Notice</h1>
              </div>
              <div class="content">
                <p>Hello,</p>
                <p class="warning">Your domain is about to expire. Please renew it soon!</p>
                <div class="domain-info">
                  <h3>Domain Information</h3>
                  <p><strong>Domain:</strong> {{domain}}</p>
                  <p><strong>Registrar:</strong> {{registrar}}</p>
                  <p><strong>Expiry Date:</strong> {{expiryDate}}</p>
                  <p><strong>Days Remaining:</strong> <span class="warning">{{days}} days</span></p>
                </div>
                <p>Please login to your registrar to renew your domain as soon as possible.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        textContent: 'Domain Expiry Notice\n\nYour domain {{domain}} expires in {{days}} days. Please renew it soon.\n\nDomain Information:\n- Domain: {{domain}}\n- Registrar: {{registrar}}\n- Expiry Date: {{expiryDate}}\n- Days Remaining: {{days}} days',
        variables: JSON.stringify(['domain', 'registrar', 'expiryDate', 'days']),
        isDefault: true,
        isActive: true
      },
      {
        id: 'summary_zh_daily',
        name: '每日汇总报告（中文）',
        type: 'summary',
        language: 'zh',
        subject: 'DomMate 域名监控日报 - {{date}}',
        htmlContent: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              .email-container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
              .header { background: #3B82F6; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background: #f9fafb; }
              .stats { display: flex; justify-content: space-around; margin: 20px 0; }
              .stat-item { text-align: center; background: white; padding: 15px; border-radius: 6px; flex: 1; margin: 0 5px; }
              .stat-number { font-size: 24px; font-weight: bold; color: #3B82F6; }
              .domain-list { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; }
              .expiring { color: #EF4444; }
              .expired { color: #DC2626; background: #FEE2E2; padding: 2px 6px; border-radius: 4px; }
            </style>
          </head>
          <body>
            <div class="email-container">
              <div class="header">
                <h1>DomMate 域名监控日报</h1>
                <p>{{date}}</p>
              </div>
              <div class="content">
                <div class="stats">
                  <div class="stat-item">
                    <div class="stat-number">{{totalDomains}}</div>
                    <div>总域名数</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-number expiring">{{expiringDomains}}</div>
                    <div>即将到期</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-number" style="color: #EF4444;">{{expiredDomains}}</div>
                    <div>已过期</div>
                  </div>
                </div>
                {{#if expiringSoon}}
                <div class="domain-list">
                  <h3>近期到期域名</h3>
                  {{#each expiringSoon}}
                  <p>• {{domain}} - 剩余 {{days}} 天</p>
                  {{/each}}
                </div>
                {{/if}}
                {{#if expiredDomains}}
                <div class="domain-list">
                  <h3>已过期域名</h3>
                  {{#each expiredList}}
                  <p class="expired">• {{domain}} - 已过期 {{days}} 天</p>
                  {{/each}}
                </div>
                {{/if}}
              </div>
            </div>
          </body>
          </html>
        `,
        textContent: 'DomMate 域名监控日报 - {{date}}\n\n统计信息：\n- 总域名数: {{totalDomains}}\n- 即将到期: {{expiringDomains}}\n- 已过期: {{expiredDomains}}\n\n{{#if expiringSoon}}近期到期域名：\n{{#each expiringSoon}}• {{domain}} - 剩余 {{days}} 天\n{{/each}}{{/if}}',
        variables: JSON.stringify(['date', 'totalDomains', 'expiringDomains', 'expiredDomains', 'expiringSoon', 'expiredList']),
        isDefault: true,
        isActive: true
      }
    ];

    for (const template of defaultTemplates) {
      await this.addEmailTemplateIfNotExists(template);
    }
  }

  // 添加邮件模板（如果不存在）
  async addEmailTemplateIfNotExists(templateData) {
    const {
      id, name, type, language, subject, htmlContent, textContent,
      variables, isDefault, isActive
    } = templateData;
    const now = new Date().toISOString();

    const insertSQL = `
      INSERT OR IGNORE INTO email_templates (
        id, name, type, language, subject, htmlContent, textContent,
        variables, isDefault, isActive, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
      this.db.run(insertSQL, [
        id, name, type, language, subject, htmlContent, textContent,
        variables, isDefault ? 1 : 0, isActive ? 1 : 0, now, now
      ], function(err) {
        if (err) {
          console.error('创建默认邮件模板失败:', err.message);
          reject(err);
        } else {
          if (this.changes > 0) {
            console.log(`✅ 默认邮件模板"${name}"创建成功`);
          }
          resolve();
        }
      });
    });
  }

  // 添加域名
  async addDomain(domainData) {
    const {
      id,
      domain,
      registrar,
      expiresAt,
      dnsProvider,
      domainStatus,
      status,
      lastCheck,
      isImportant,
      notes,
      createdAt,
      updatedAt
    } = domainData;

    const insertSQL = `
      INSERT INTO domains (
        id, domain, registrar, expiresAt, dnsProvider, domainStatus, 
        status, lastCheck, isImportant, notes, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
      this.db.run(insertSQL, [
        id, domain, registrar, expiresAt, dnsProvider, domainStatus,
        status, lastCheck, isImportant ? 1 : 0, notes || null, createdAt, updatedAt
      ], function(err) {
        if (err) {
          console.error('添加域名失败:', err.message);
          reject(err);
        } else {
          console.log(`✅ 域名 ${domain} 添加成功`);
          resolve({ ...domainData, rowId: this.lastID });
        }
      });
    });
  }

  // 获取所有域名
  async getAllDomains() {
    const selectSQL = `SELECT * FROM domains ORDER BY createdAt DESC`;

    return new Promise((resolve, reject) => {
      this.db.all(selectSQL, [], (err, rows) => {
        if (err) {
          console.error('获取域名列表失败:', err.message);
          reject(err);
        } else {
          // 转换数据类型
          const domains = rows.map(row => ({
            ...row,
            isImportant: Boolean(row.isImportant),
            notes: row.notes || null,
            expiresAt: row.expiresAt || null,
            lastCheck: row.lastCheck || null
          }));
          resolve(domains);
        }
      });
    });
  }

  // 根据ID获取域名
  async getDomainById(id) {
    const selectSQL = `SELECT * FROM domains WHERE id = ?`;

    return new Promise((resolve, reject) => {
      this.db.get(selectSQL, [id], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve({
            ...row,
            isImportant: Boolean(row.isImportant),
            notes: row.notes || null
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  // 根据域名获取记录
  async getDomainByName(domain) {
    const selectSQL = `SELECT * FROM domains WHERE domain = ?`;

    return new Promise((resolve, reject) => {
      this.db.get(selectSQL, [domain], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve({
            ...row,
            isImportant: Boolean(row.isImportant),
            notes: row.notes || null
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  // 更新域名信息
  async updateDomain(id, updateData) {
    const fields = [];
    const values = [];

    // 动态构建更新字段
    for (const [key, value] of Object.entries(updateData)) {
      if (key !== 'id') {
        fields.push(`${key} = ?`);
        if (key === 'isImportant') {
          values.push(value ? 1 : 0);
        } else {
          values.push(value);
        }
      }
    }

    // 添加updatedAt
    fields.push('updatedAt = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const updateSQL = `UPDATE domains SET ${fields.join(', ')} WHERE id = ?`;

    return new Promise((resolve, reject) => {
      this.db.run(updateSQL, values, function(err) {
        if (err) {
          console.error('更新域名失败:', err.message);
          reject(err);
        } else {
          console.log(`✅ 域名 ${id} 更新成功`);
          resolve({ changes: this.changes });
        }
      });
    });
  }

  // 删除域名
  async deleteDomain(id) {
    const deleteSQL = `DELETE FROM domains WHERE id = ?`;

    return new Promise((resolve, reject) => {
      this.db.run(deleteSQL, [id], function(err) {
        if (err) {
          console.error('删除域名失败:', err.message);
          reject(err);
        } else {
          console.log(`✅ 域名 ${id} 删除成功`);
          resolve({ changes: this.changes });
        }
      });
    });
  }

  // 获取域名统计信息
  async getDomainStats() {
    const statsSQL = `
      SELECT 
        status,
        COUNT(*) as count
      FROM domains 
      GROUP BY status
    `;

    return new Promise((resolve, reject) => {
      this.db.all(statsSQL, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const stats = {
            total: 0,
            normal: 0,
            expiring: 0,
            expired: 0,
            failed: 0,
            unregistered: 0
          };

          rows.forEach(row => {
            stats[row.status] = row.count;
            stats.total += row.count;
          });

          resolve(stats);
        }
      });
    });
  }

  // ====== 分组管理相关方法 ======

  // 获取所有分组
  async getAllGroups() {
    const selectSQL = `
      SELECT g.*, 
             COUNT(dg.domainId) as domainCount
      FROM groups g
      LEFT JOIN domain_groups dg ON g.id = dg.groupId
      GROUP BY g.id, g.name, g.description, g.color, g.createdAt, g.updatedAt
      ORDER BY g.createdAt ASC
    `;

    return new Promise((resolve, reject) => {
      this.db.all(selectSQL, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // 创建新分组
  async createGroup(groupData) {
    const { name, description, color } = groupData;
    const id = 'group_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();

    const insertSQL = `
      INSERT INTO groups (id, name, description, color, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
      this.db.run(insertSQL, [id, name, description, color, now, now], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id,
            name,
            description,
            color,
            createdAt: now,
            updatedAt: now,
            domainCount: 0
          });
        }
      });
    });
  }

  // 更新分组
  async updateGroup(id, groupData) {
    const { name, description, color } = groupData;
    const updatedAt = new Date().toISOString();

    const updateSQL = `
      UPDATE groups 
      SET name = ?, description = ?, color = ?, updatedAt = ?
      WHERE id = ?
    `;

    return new Promise((resolve, reject) => {
      this.db.run(updateSQL, [name, description, color, updatedAt, id], function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('分组不存在'));
        } else {
          resolve({ id, name, description, color, updatedAt });
        }
      });
    });
  }

  // 删除分组
  async deleteGroup(id) {
    // 检查是否为默认分组
    if (['default', 'important', 'development'].includes(id)) {
      throw new Error('无法删除系统默认分组');
    }

    const deleteSQL = `DELETE FROM groups WHERE id = ?`;

    return new Promise((resolve, reject) => {
      this.db.run(deleteSQL, [id], function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('分组不存在'));
        } else {
          resolve({ success: true, deletedCount: this.changes });
        }
      });
    });
  }

  // 将域名添加到分组
  async addDomainToGroup(domainId, groupId) {
    const id = 'dg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const createdAt = new Date().toISOString();

    const insertSQL = `
      INSERT OR IGNORE INTO domain_groups (id, domainId, groupId, createdAt)
      VALUES (?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
      this.db.run(insertSQL, [id, domainId, groupId, createdAt], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ success: true, added: this.changes > 0 });
        }
      });
    });
  }

  // 从分组中移除域名
  async removeDomainFromGroup(domainId, groupId) {
    const deleteSQL = `
      DELETE FROM domain_groups 
      WHERE domainId = ? AND groupId = ?
    `;

    return new Promise((resolve, reject) => {
      this.db.run(deleteSQL, [domainId, groupId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ success: true, removed: this.changes > 0 });
        }
      });
    });
  }

  // 获取分组中的域名
  async getDomainsByGroup(groupId) {
    const selectSQL = `
      SELECT d.*
      FROM domains d
      INNER JOIN domain_groups dg ON d.id = dg.domainId
      WHERE dg.groupId = ?
      ORDER BY d.domain ASC
    `;

    return new Promise((resolve, reject) => {
      this.db.all(selectSQL, [groupId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // 获取未分组的域名
  async getUngroupedDomains() {
    const selectSQL = `
      SELECT d.*
      FROM domains d
      LEFT JOIN domain_groups dg ON d.id = dg.domainId
      WHERE dg.domainId IS NULL
      ORDER BY d.domain ASC
    `;

    return new Promise((resolve, reject) => {
      this.db.all(selectSQL, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // 获取域名的分组信息
  async getDomainGroups(domainId) {
    const selectSQL = `
      SELECT g.*
      FROM groups g
      INNER JOIN domain_groups dg ON g.id = dg.groupId
      WHERE dg.domainId = ?
      ORDER BY g.name ASC
    `;

    return new Promise((resolve, reject) => {
      this.db.all(selectSQL, [domainId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // 获取分组统计信息
  async getGroupStats() {
    const statsSQL = `
      SELECT 
        g.id,
        g.name,
        g.color,
        COUNT(dg.domainId) as domainCount,
        COUNT(CASE WHEN d.status = 'normal' THEN 1 END) as normalCount,
        COUNT(CASE WHEN d.status = 'expiring' THEN 1 END) as expiringCount,
        COUNT(CASE WHEN d.status = 'expired' THEN 1 END) as expiredCount,
        COUNT(CASE WHEN d.status = 'failed' THEN 1 END) as failedCount
      FROM groups g
      LEFT JOIN domain_groups dg ON g.id = dg.groupId
      LEFT JOIN domains d ON dg.domainId = d.id
      GROUP BY g.id, g.name, g.color
      ORDER BY g.name ASC
    `;

    return new Promise((resolve, reject) => {
      this.db.all(statsSQL, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // 获取即将到期的域名 (90天内)
  async getExpiringDomains(days = 90) {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + days);
    
    const selectSQL = `
      SELECT * FROM domains 
      WHERE expiresAt IS NOT NULL 
      AND datetime(expiresAt) <= datetime(?)
      AND status = 'normal'
      ORDER BY expiresAt ASC
    `;

    return new Promise((resolve, reject) => {
      this.db.all(selectSQL, [thresholdDate.toISOString()], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const domains = rows.map(row => ({
            ...row,
            isImportant: Boolean(row.isImportant),
            notes: row.notes || null
          }));
          resolve(domains);
        }
      });
    });
  }

  // 批量更新域名状态
  async updateDomainStatuses() {
    const now = new Date();
    const expiring90Days = new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000));

    // 更新已过期的域名
    const updateExpiredSQL = `
      UPDATE domains 
      SET status = 'expired', updatedAt = ?
      WHERE datetime(expiresAt) <= datetime(?) 
      AND status NOT IN ('failed', 'unregistered')
    `;

    // 更新即将到期的域名 (90天内)
    const updateExpiringSQL = `
      UPDATE domains 
      SET status = 'expiring', updatedAt = ?
      WHERE datetime(expiresAt) > datetime(?) 
      AND datetime(expiresAt) <= datetime(?) 
      AND status NOT IN ('failed', 'unregistered', 'expired')
    `;

    const currentTime = now.toISOString();

    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run(updateExpiredSQL, [currentTime, currentTime], (err) => {
          if (err) {
            console.error('更新过期域名状态失败:', err);
            reject(err);
            return;
          }
        });

        this.db.run(updateExpiringSQL, [currentTime, currentTime, expiring90Days.toISOString()], function(err) {
          if (err) {
            console.error('更新即将到期域名状态失败:', err);
            reject(err);
          } else {
            console.log('✅ 域名状态批量更新完成');
            resolve();
          }
        });
      });
    });
  }

  // 关闭数据库连接
  close() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('关闭数据库连接失败:', err.message);
          } else {
            console.log('✅ 数据库连接已关闭');
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  // ===============================
  // 邮件配置相关操作
  // ===============================

  // 获取所有邮件配置
  async getAllEmailConfigs() {
    const sql = `SELECT * FROM email_configs ORDER BY isDefault DESC, createdAt ASC`;
    
    return new Promise((resolve, reject) => {
      this.db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // 将boolean字段转换为真正的boolean值
          const configs = rows.map(row => ({
            ...row,
            secure: Boolean(row.secure),
            isDefault: Boolean(row.isDefault),
            isActive: Boolean(row.isActive)
          }));
          resolve(configs);
        }
      });
    });
  }

  // 根据ID获取邮件配置
  async getEmailConfigById(id) {
    const sql = `SELECT * FROM email_configs WHERE id = ?`;
    
    return new Promise((resolve, reject) => {
      this.db.get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else if (!row) {
          resolve(null);
        } else {
          resolve({
            ...row,
            secure: Boolean(row.secure),
            isDefault: Boolean(row.isDefault),
            isActive: Boolean(row.isActive)
          });
        }
      });
    });
  }

  // 添加邮件配置
  async addEmailConfig(configData) {
    const {
      id, name, host, port, secure, username, password,
      fromEmail, fromName, isDefault, isActive
    } = configData;
    const now = new Date().toISOString();

    // 如果设置为默认配置，先取消其他配置的默认状态
    if (isDefault) {
      await this.unsetDefaultEmailConfig();
    }

    const insertSQL = `
      INSERT INTO email_configs (
        id, name, host, port, secure, username, password,
        fromEmail, fromName, isDefault, isActive, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
      this.db.run(insertSQL, [
        id, name, host, port, secure ? 1 : 0, username, password,
        fromEmail, fromName, isDefault ? 1 : 0, isActive ? 1 : 0, now, now
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ ...configData, createdAt: now, updatedAt: now });
        }
      });
    });
  }

  // 更新邮件配置
  async updateEmailConfig(id, updateData) {
    const { isDefault } = updateData;
    const now = new Date().toISOString();

    // 如果设置为默认配置，先取消其他配置的默认状态
    if (isDefault) {
      await this.unsetDefaultEmailConfig();
    }

    const setClause = [];
    const params = [];

    Object.keys(updateData).forEach(key => {
      if (key !== 'id') {
        setClause.push(`${key} = ?`);
        if (key === 'secure' || key === 'isDefault' || key === 'isActive') {
          params.push(updateData[key] ? 1 : 0);
        } else {
          params.push(updateData[key]);
        }
      }
    });

    setClause.push('updatedAt = ?');
    params.push(now, id);

    const updateSQL = `UPDATE email_configs SET ${setClause.join(', ')} WHERE id = ?`;

    return new Promise((resolve, reject) => {
      this.db.run(updateSQL, params, function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('邮件配置不存在'));
        } else {
          resolve({ success: true });
        }
      });
    });
  }

  // 删除邮件配置
  async deleteEmailConfig(id) {
    const deleteSQL = `DELETE FROM email_configs WHERE id = ?`;

    return new Promise((resolve, reject) => {
      this.db.run(deleteSQL, [id], function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('邮件配置不存在'));
        } else {
          resolve({ success: true, deletedCount: this.changes });
        }
      });
    });
  }

  // 取消所有配置的默认状态
  async unsetDefaultEmailConfig() {
    const updateSQL = `UPDATE email_configs SET isDefault = 0`;
    
    return new Promise((resolve, reject) => {
      this.db.run(updateSQL, [], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // 获取默认邮件配置
  async getDefaultEmailConfig() {
    const sql = `SELECT * FROM email_configs WHERE isDefault = 1 AND isActive = 1 LIMIT 1`;
    
    return new Promise((resolve, reject) => {
      this.db.get(sql, [], (err, row) => {
        if (err) {
          reject(err);
        } else if (!row) {
          resolve(null);
        } else {
          resolve({
            ...row,
            secure: Boolean(row.secure),
            isDefault: Boolean(row.isDefault),
            isActive: Boolean(row.isActive)
          });
        }
      });
    });
  }

  // ===============================
  // 邮件模板相关操作
  // ===============================

  // 获取所有邮件模板
  async getAllEmailTemplates() {
    const sql = `
      SELECT * FROM email_templates 
      ORDER BY isDefault DESC, type, language, createdAt ASC
    `;
    
    return new Promise((resolve, reject) => {
      this.db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const templates = rows.map(row => ({
            ...row,
            isDefault: Boolean(row.isDefault),
            isActive: Boolean(row.isActive),
            variables: row.variables ? JSON.parse(row.variables) : []
          }));
          resolve(templates);
        }
      });
    });
  }

  // 根据类型和语言获取邮件模板
  async getEmailTemplatesByTypeAndLanguage(type, language) {
    const sql = `
      SELECT * FROM email_templates 
      WHERE type = ? AND language = ? AND isActive = 1
      ORDER BY isDefault DESC, createdAt ASC
    `;
    
    return new Promise((resolve, reject) => {
      this.db.all(sql, [type, language], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const templates = rows.map(row => ({
            ...row,
            isDefault: Boolean(row.isDefault),
            isActive: Boolean(row.isActive),
            variables: row.variables ? JSON.parse(row.variables) : []
          }));
          resolve(templates);
        }
      });
    });
  }

  // 根据ID获取邮件模板
  async getEmailTemplateById(id) {
    const sql = `SELECT * FROM email_templates WHERE id = ?`;
    
    return new Promise((resolve, reject) => {
      this.db.get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else if (!row) {
          resolve(null);
        } else {
          resolve({
            ...row,
            isDefault: Boolean(row.isDefault),
            isActive: Boolean(row.isActive),
            variables: row.variables ? JSON.parse(row.variables) : []
          });
        }
      });
    });
  }

  // 添加邮件模板
  async addEmailTemplate(templateData) {
    const {
      id, name, type, language, subject, htmlContent, textContent,
      variables, isDefault, isActive
    } = templateData;
    const now = new Date().toISOString();

    const insertSQL = `
      INSERT INTO email_templates (
        id, name, type, language, subject, htmlContent, textContent,
        variables, isDefault, isActive, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
      this.db.run(insertSQL, [
        id, name, type, language, subject, htmlContent, textContent,
        JSON.stringify(variables || []), isDefault ? 1 : 0, isActive ? 1 : 0, now, now
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ ...templateData, createdAt: now, updatedAt: now });
        }
      });
    });
  }

  // 更新邮件模板
  async updateEmailTemplate(id, updateData) {
    const now = new Date().toISOString();

    const setClause = [];
    const params = [];

    Object.keys(updateData).forEach(key => {
      if (key !== 'id') {
        setClause.push(`${key} = ?`);
        if (key === 'variables') {
          params.push(JSON.stringify(updateData[key] || []));
        } else if (key === 'isDefault' || key === 'isActive') {
          params.push(updateData[key] ? 1 : 0);
        } else {
          params.push(updateData[key]);
        }
      }
    });

    setClause.push('updatedAt = ?');
    params.push(now, id);

    const updateSQL = `UPDATE email_templates SET ${setClause.join(', ')} WHERE id = ?`;

    return new Promise((resolve, reject) => {
      this.db.run(updateSQL, params, function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('邮件模板不存在'));
        } else {
          resolve({ success: true });
        }
      });
    });
  }

  // 删除邮件模板
  async deleteEmailTemplate(id) {
    const deleteSQL = `DELETE FROM email_templates WHERE id = ?`;

    return new Promise((resolve, reject) => {
      this.db.run(deleteSQL, [id], function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('邮件模板不存在'));
        } else {
          resolve({ success: true, deletedCount: this.changes });
        }
      });
    });
  }

  // ===============================
  // 通知规则相关操作
  // ===============================

  // 获取所有通知规则
  async getAllNotificationRules() {
    const sql = `
      SELECT nr.*, ec.name as emailConfigName, et.name as templateName
      FROM notification_rules nr
      LEFT JOIN email_configs ec ON nr.emailConfigId = ec.id
      LEFT JOIN email_templates et ON nr.templateId = et.id
      ORDER BY nr.isActive DESC, nr.createdAt ASC
    `;
    
    return new Promise((resolve, reject) => {
      this.db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const rules = rows.map(row => ({
            ...row,
            isActive: Boolean(row.isActive),
            recipients: row.recipients ? JSON.parse(row.recipients) : []
          }));
          resolve(rules);
        }
      });
    });
  }

  // 根据ID获取通知规则
  async getNotificationRuleById(id) {
    const sql = `
      SELECT nr.*, ec.name as emailConfigName, et.name as templateName
      FROM notification_rules nr
      LEFT JOIN email_configs ec ON nr.emailConfigId = ec.id
      LEFT JOIN email_templates et ON nr.templateId = et.id
      WHERE nr.id = ?
    `;
    
    return new Promise((resolve, reject) => {
      this.db.get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else if (!row) {
          resolve(null);
        } else {
          resolve({
            ...row,
            isActive: Boolean(row.isActive),
            recipients: row.recipients ? JSON.parse(row.recipients) : []
          });
        }
      });
    });
  }

  // 添加通知规则
  async addNotificationRule(ruleData) {
    const {
      id, name, type, days, scheduleHour, scheduleMinute, scheduleWeekday,
      isActive, emailConfigId, templateId, recipients
    } = ruleData;
    const now = new Date().toISOString();

    // 生成cron表达式
    const cronExpression = this.generateCronExpression(type, scheduleHour, scheduleMinute, scheduleWeekday);

    const insertSQL = `
      INSERT INTO notification_rules (
        id, name, type, days, scheduleHour, scheduleMinute, scheduleWeekday,
        cronExpression, isActive, emailConfigId, templateId,
        recipients, runCount, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `;

    return new Promise((resolve, reject) => {
      this.db.run(insertSQL, [
        id, name, type, days || null, scheduleHour || 8, scheduleMinute || 0, 
        scheduleWeekday || null, cronExpression, isActive ? 1 : 0, 
        emailConfigId, templateId, JSON.stringify(recipients || []), now, now
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ 
            ...ruleData, 
            cronExpression,
            runCount: 0, 
            createdAt: now, 
            updatedAt: now 
          });
        }
      });
    });
  }

  // 更新通知规则
  async updateNotificationRule(id, updates) {
    // 生成新的cron表达式
    let cronExpression = null;
    if (updates.type || updates.scheduleHour !== undefined || 
        updates.scheduleMinute !== undefined || updates.scheduleWeekday !== undefined) {
      
      // 先获取当前规则
      return new Promise((resolve, reject) => {
        this.db.get(
          'SELECT * FROM notification_rules WHERE id = ?', 
          [id], 
          (err, currentRule) => {
            if (err) {
              reject(err);
              return;
            }
            if (!currentRule) {
              reject(new Error('通知规则不存在'));
              return;
            }

            // 合并更新数据
            const mergedData = {
              type: updates.type || currentRule.type,
              scheduleHour: updates.scheduleHour !== undefined ? updates.scheduleHour : currentRule.scheduleHour,
              scheduleMinute: updates.scheduleMinute !== undefined ? updates.scheduleMinute : currentRule.scheduleMinute,
              scheduleWeekday: updates.scheduleWeekday !== undefined ? updates.scheduleWeekday : currentRule.scheduleWeekday
            };

            // 生成新的cron表达式
            cronExpression = this.generateCronExpression(
              mergedData.type,
              mergedData.scheduleHour,
              mergedData.scheduleMinute,
              mergedData.scheduleWeekday
            );

            // 执行更新
            this.performUpdate(id, updates, cronExpression, resolve, reject);
          }
        );
      });
    } else {
      // 直接更新，不需要重新生成cron表达式
      return new Promise((resolve, reject) => {
        this.performUpdate(id, updates, null, resolve, reject);
      });
    }
  }

  // 执行更新操作
  performUpdate(id, updates, cronExpression, resolve, reject) {
    const fields = [];
    const values = [];

    // 构建更新字段
    const updateableFields = [
      'name', 'type', 'days', 'scheduleHour', 'scheduleMinute', 
      'scheduleWeekday', 'isActive', 'emailConfigId', 'templateId', 'recipients'
    ];

    updateableFields.forEach(field => {
      if (updates[field] !== undefined) {
        fields.push(`${field} = ?`);
        if (field === 'recipients') {
          values.push(JSON.stringify(updates[field]));
        } else if (field === 'isActive') {
          values.push(updates[field] ? 1 : 0);
        } else {
          values.push(updates[field]);
        }
      }
    });

    // 如果有新的cron表达式，也要更新
    if (cronExpression) {
      fields.push('cronExpression = ?');
      values.push(cronExpression);
    }

    // 更新时间
    fields.push('updatedAt = ?');
    values.push(new Date().toISOString());

    if (fields.length === 1) { // 只有updatedAt
      resolve();
      return;
    }

    const updateSQL = `UPDATE notification_rules SET ${fields.join(', ')} WHERE id = ?`;
    values.push(id);

    this.db.run(updateSQL, values, function(err) {
      if (err) {
        console.error('更新通知规则失败:', err);
        reject(err);
      } else {
        resolve();
      }
    });
  }

  // 生成cron表达式
  generateCronExpression(type, hour = 8, minute = 0, weekday = 1) {
    // 验证参数范围
    hour = Math.max(0, Math.min(23, hour));
    minute = Math.max(0, Math.min(59, minute));
    weekday = Math.max(0, Math.min(6, weekday));

    switch (type) {
      case 'daily_summary':
        // 每日在指定时间发送
        return `${minute} ${hour} * * *`;
      
      case 'weekly_summary':
        // 每周在指定星期的指定时间发送
        return `${minute} ${hour} * * ${weekday}`;
      
      case 'expiry_reminder':
        // 到期提醒每天在指定时间检查
        return `${minute} ${hour} * * *`;
      
      default:
        // 默认每天8点
        return `0 8 * * *`;
    }
  }

  // 删除通知规则
  async deleteNotificationRule(id) {
    const deleteSQL = `DELETE FROM notification_rules WHERE id = ?`;

    return new Promise((resolve, reject) => {
      this.db.run(deleteSQL, [id], function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('通知规则不存在'));
        } else {
          resolve({ success: true, deletedCount: this.changes });
        }
      });
    });
  }

  // 获取活跃的通知规则
  async getActiveNotificationRules() {
    const sql = `
      SELECT nr.*, ec.name as emailConfigName, et.name as templateName
      FROM notification_rules nr
      LEFT JOIN email_configs ec ON nr.emailConfigId = ec.id
      LEFT JOIN email_templates et ON nr.templateId = et.id
      WHERE nr.isActive = 1
      ORDER BY nr.type, nr.days
    `;
    
    return new Promise((resolve, reject) => {
      this.db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const rules = rows.map(row => ({
            ...row,
            isActive: Boolean(row.isActive),
            recipients: row.recipients ? JSON.parse(row.recipients) : []
          }));
          resolve(rules);
        }
      });
    });
  }

  // 更新通知规则的运行信息
  async updateNotificationRuleRunInfo(id, lastRun, nextRun) {
    const now = new Date().toISOString();
    const updateSQL = `
      UPDATE notification_rules 
      SET lastRun = ?, nextRun = ?, runCount = runCount + 1, updatedAt = ?
      WHERE id = ?
    `;

    return new Promise((resolve, reject) => {
      this.db.run(updateSQL, [lastRun, nextRun, now, id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ success: true });
        }
      });
    });
  }

  // ===============================
  // 通知记录相关操作
  // ===============================

  // 获取通知记录
  async getNotificationLogs(limit = 100, offset = 0) {
    const sql = `
      SELECT nl.*, nr.name as ruleName, nr.type as ruleType
      FROM notification_logs nl
      LEFT JOIN notification_rules nr ON nl.ruleId = nr.id
      ORDER BY nl.createdAt DESC
      LIMIT ? OFFSET ?
    `;
    
    return new Promise((resolve, reject) => {
      this.db.all(sql, [limit, offset], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const logs = rows.map(row => ({
            ...row,
            domainIds: row.domainIds ? JSON.parse(row.domainIds) : []
          }));
          resolve(logs);
        }
      });
    });
  }

  // 添加通知记录
  async addNotificationLog(logData) {
    const {
      id, ruleId, domainIds, recipient, subject, status, errorMessage, sentAt, retryCount
    } = logData;
    const now = new Date().toISOString();

    const insertSQL = `
      INSERT INTO notification_logs (
        id, ruleId, domainIds, recipient, subject, status,
        errorMessage, sentAt, retryCount, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
      this.db.run(insertSQL, [
        id, ruleId, JSON.stringify(domainIds || []), recipient, subject,
        status, errorMessage, sentAt, retryCount || 0, now
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ ...logData, createdAt: now });
        }
      });
    });
  }

  // 更新通知记录状态
  async updateNotificationLogStatus(id, status, errorMessage = null, sentAt = null) {
    const updateSQL = `
      UPDATE notification_logs 
      SET status = ?, errorMessage = ?, sentAt = ?, 
          retryCount = CASE WHEN status = 'retry' THEN retryCount + 1 ELSE retryCount END
      WHERE id = ?
    `;

    return new Promise((resolve, reject) => {
      this.db.run(updateSQL, [status, errorMessage, sentAt, id], function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('通知记录不存在'));
        } else {
          resolve({ success: true });
        }
      });
    });
  }

  // 获取失败的通知记录（用于重试）
  async getFailedNotificationLogs(retryLimit = 3) {
    const sql = `
      SELECT * FROM notification_logs 
      WHERE status IN ('failed', 'retry') AND retryCount < ?
      ORDER BY createdAt ASC
    `;
    
    return new Promise((resolve, reject) => {
      this.db.all(sql, [retryLimit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const logs = rows.map(row => ({
            ...row,
            domainIds: row.domainIds ? JSON.parse(row.domainIds) : []
          }));
          resolve(logs);
        }
      });
    });
  }

  // 获取到期时间分布数据
  async getExpiryDistribution() {
    const sql = `
      SELECT 
        CASE 
          WHEN expiresAt IS NULL OR expiresAt = '' THEN '未知'
          WHEN julianday(expiresAt) - julianday('now') < 0 THEN '已过期'
          WHEN julianday(expiresAt) - julianday('now') <= 30 THEN '30天内'
          WHEN julianday(expiresAt) - julianday('now') <= 90 THEN '31-90天'
          WHEN julianday(expiresAt) - julianday('now') <= 180 THEN '91-180天'
          WHEN julianday(expiresAt) - julianday('now') <= 365 THEN '181-365天'
          ELSE '1年以上'
        END as period,
        COUNT(*) as count
      FROM domains 
      GROUP BY 1
      ORDER BY 
        CASE 
          WHEN period = '已过期' THEN 1
          WHEN period = '30天内' THEN 2
          WHEN period = '31-90天' THEN 3
          WHEN period = '91-180天' THEN 4
          WHEN period = '181-365天' THEN 5
          WHEN period = '1年以上' THEN 6
          ELSE 7
        END
    `;

    return new Promise((resolve, reject) => {
      this.db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // 获取注册商统计数据
  async getRegistrarStats() {
    const sql = `
      SELECT 
        COALESCE(registrar, '未知') as name,
        COUNT(*) as value,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM domains), 1) as percentage
      FROM domains 
      GROUP BY registrar
      ORDER BY value DESC
      LIMIT 10
    `;

    return new Promise((resolve, reject) => {
      this.db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // 为每个注册商分配颜色
          const colors = [
            '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1',
            '#d084d0', '#82d982', '#ffb347', '#ff6b6b', '#4ecdc4'
          ];
          const result = rows.map((row, index) => ({
            ...row,
            fill: colors[index % colors.length]
          }));
          resolve(result);
        }
      });
    });
  }

  // 获取月度到期趋势
  async getMonthlyExpiryTrend() {
    const sql = `
      SELECT 
        strftime('%Y-%m', expiresAt) as month,
        COUNT(*) as count
      FROM domains 
      WHERE expiresAt IS NOT NULL AND expiresAt != ''
        AND julianday(expiresAt) >= julianday('now', '-12 months')
        AND julianday(expiresAt) <= julianday('now', '+12 months')
      GROUP BY month
      ORDER BY month
    `;

    return new Promise((resolve, reject) => {
      this.db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // 格式化月份显示
          const result = rows.map(row => ({
            month: row.month,
            monthDisplay: this.formatMonth(row.month),
            count: row.count
          }));
          resolve(result);
        }
      });
    });
  }

  // 获取域名状态变化历史（模拟数据，实际应该从历史表获取）
  async getStatusHistory() {
    const sql = `
      SELECT 
        status,
        COUNT(*) as count
      FROM domains
      GROUP BY status
    `;

    return new Promise((resolve, reject) => {
      this.db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // 生成最近7天的模拟历史数据
          const result = [];
          const today = new Date();
          
          for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const dayData = {
              date: dateStr,
              normal: rows.find(r => r.status === 'normal')?.count || 0,
              expiring: Math.max(0, (rows.find(r => r.status === 'expiring')?.count || 0) - Math.floor(Math.random() * 3)),
              expired: rows.find(r => r.status === 'expired')?.count || 0,
              failed: rows.find(r => r.status === 'failed')?.count || 0
            };
            result.push(dayData);
          }
          
          resolve(result);
        }
      });
    });
  }

  // 获取成本统计（模拟数据，需要实际成本字段）
  async getCostStats() {
    const sql = `
      SELECT 
        registrar,
        COUNT(*) as domainCount,
        -- 这里使用模拟价格，实际应该从域名表中的cost字段获取
        CASE registrar
          WHEN 'GoDaddy Inc.' THEN COUNT(*) * 12.99
          WHEN 'Namecheap, Inc.' THEN COUNT(*) * 10.99  
          WHEN 'Alibaba Cloud Computing Ltd. d/b/a HiChina' THEN COUNT(*) * 8.99
          WHEN 'DNSPod, Inc.' THEN COUNT(*) * 9.99
          ELSE COUNT(*) * 11.99
        END as totalCost
      FROM domains 
      WHERE registrar IS NOT NULL AND registrar != ''
      GROUP BY registrar
      ORDER BY totalCost DESC
    `;

    return new Promise((resolve, reject) => {
      this.db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const totalCost = rows.reduce((sum, row) => sum + row.totalCost, 0);
          const result = {
            byRegistrar: rows,
            totalCost: totalCost,
            averageCost: rows.length > 0 ? totalCost / rows.reduce((sum, row) => sum + row.domainCount, 0) : 0
          };
          resolve(result);
        }
      });
    });
  }

  // 辅助方法：格式化月份
  formatMonth(monthStr) {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const monthNames = [
      '1月', '2月', '3月', '4月', '5月', '6月',
      '7月', '8月', '9月', '10月', '11月', '12月'
    ];
    return `${year}年${monthNames[parseInt(month) - 1]}`;
  }

  // ========== 认证相关方法 ==========

  // 获取或设置访问密码
  async setAuthConfig(key, value) {
    const sql = `
      INSERT OR REPLACE INTO auth_config (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `;
    
    return new Promise((resolve, reject) => {
      this.db.run(sql, [key, value], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  // 获取认证配置
  async getAuthConfig(key) {
    const sql = `SELECT value FROM auth_config WHERE key = ?`;
    
    return new Promise((resolve, reject) => {
      this.db.get(sql, [key], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row ? row.value : null);
        }
      });
    });
  }

  // 创建新会话
  async createSession(sessionId, ipAddress, userAgent, expiresAt) {
    const sql = `
      INSERT INTO auth_sessions (session_id, ip_address, user_agent, expires_at)
      VALUES (?, ?, ?, ?)
    `;
    
    return new Promise((resolve, reject) => {
      this.db.run(sql, [sessionId, ipAddress, userAgent, expiresAt], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  // 验证会话
  async validateSession(sessionId) {
    const sql = `
      SELECT * FROM auth_sessions 
      WHERE session_id = ? AND expires_at > CURRENT_TIMESTAMP
    `;
    
    return new Promise((resolve, reject) => {
      this.db.get(sql, [sessionId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          if (row) {
            // 更新最后活动时间
            this.updateSessionActivity(sessionId).catch(console.error);
          }
          resolve(row || null);
        }
      });
    });
  }

  // 更新会话活动时间
  async updateSessionActivity(sessionId) {
    const sql = `
      UPDATE auth_sessions 
      SET last_activity = CURRENT_TIMESTAMP 
      WHERE session_id = ?
    `;
    
    return new Promise((resolve, reject) => {
      this.db.run(sql, [sessionId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  // 删除会话（登出）
  async deleteSession(sessionId) {
    const sql = `DELETE FROM auth_sessions WHERE session_id = ?`;
    
    return new Promise((resolve, reject) => {
      this.db.run(sql, [sessionId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  // 清理过期会话
  async cleanupExpiredSessions() {
    const sql = `DELETE FROM auth_sessions WHERE expires_at <= CURRENT_TIMESTAMP`;
    
    return new Promise((resolve, reject) => {
      this.db.run(sql, [], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  // 记录登录尝试
  async recordLoginAttempt(ipAddress, success, captchaRequired = false) {
    const sql = `
      INSERT INTO login_attempts (ip_address, success, captcha_required)
      VALUES (?, ?, ?)
    `;
    
    return new Promise((resolve, reject) => {
      this.db.run(sql, [ipAddress, success, captchaRequired], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  // 获取最近登录失败次数
  async getRecentFailedAttempts(ipAddress, minutesAgo = 15) {
    const sql = `
      SELECT COUNT(*) as count 
      FROM login_attempts 
      WHERE ip_address = ? 
        AND success = 0 
        AND attempt_time > datetime('now', '-${minutesAgo} minutes')
    `;
    
    return new Promise((resolve, reject) => {
      this.db.get(sql, [ipAddress], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row ? row.count : 0);
        }
      });
    });
  }

  // 检查是否需要验证码
  async shouldRequireCaptcha(ipAddress) {
    const failedAttempts = await this.getRecentFailedAttempts(ipAddress);
    return failedAttempts >= 3; // 3次失败后需要验证码
  }

  // 初始化默认认证配置
  async initializeAuthConfig() {
    try {
      // 检查是否已经有访问密码配置
      const existingPassword = await this.getAuthConfig('access_password');
      if (!existingPassword) {
        // 设置默认密码（建议用户首次登录后修改）
        const crypto = await import('crypto');
        const defaultPassword = 'admin123'; // 默认密码
        const hashedPassword = crypto.createHash('sha256').update(defaultPassword).digest('hex');
        await this.setAuthConfig('access_password', hashedPassword);
        
        // 标记为强制修改密码（首次使用默认密码）
        await this.setAuthConfig('force_password_change', 'true');
        await this.setAuthConfig('password_created_at', new Date().toISOString());
        console.log('✅ 已设置默认访问密码: admin123 (首次登录需强制修改)');
      }

      // 设置会话过期时间（24小时）
      const sessionExpiry = await this.getAuthConfig('session_expiry_hours');
      if (!sessionExpiry) {
        await this.setAuthConfig('session_expiry_hours', '24');
      }

      // 设置最大登录失败次数
      const maxFailedAttempts = await this.getAuthConfig('max_failed_attempts');
      if (!maxFailedAttempts) {
        await this.setAuthConfig('max_failed_attempts', '5');
      }

      // 设置密码过期天数（0表示不过期）
      const passwordExpireDays = await this.getAuthConfig('password_expire_days');
      if (!passwordExpireDays) {
        await this.setAuthConfig('password_expire_days', '0'); // 默认不过期
      }

      // 设置强制修改密码的原因
      const forceChangeReason = await this.getAuthConfig('force_change_reason');
      if (!forceChangeReason) {
        await this.setAuthConfig('force_change_reason', '');
      }

    } catch (error) {
      console.error('❌ 初始化认证配置失败:', error);
      throw error;
    }
  }

  // 检查是否需要强制修改密码
  async needsPasswordChange() {
    try {
      // 检查强制修改标记
      const forceChange = await this.getAuthConfig('force_password_change');
      if (forceChange === 'true') {
        return {
          required: true,
          reason: await this.getAuthConfig('force_change_reason') || '首次登录需要修改默认密码'
        };
      }

      // 检查密码是否过期
      const expireDays = await this.getAuthConfig('password_expire_days');
      if (expireDays && parseInt(expireDays) > 0) {
        const passwordCreatedAt = await this.getAuthConfig('password_created_at');
        if (passwordCreatedAt) {
          const createdDate = new Date(passwordCreatedAt);
          const expireDate = new Date(createdDate.getTime() + parseInt(expireDays) * 24 * 60 * 60 * 1000);
          
          if (new Date() > expireDate) {
            return {
              required: true,
              reason: `密码已过期 (${expireDays}天)，请修改密码`
            };
          }
        }
      }

      return { required: false, reason: '' };
    } catch (error) {
      console.error('❌ 检查密码修改需求失败:', error);
      return { required: false, reason: '' };
    }
  }

  // 设置强制修改密码
  async setForcePasswordChange(reason = '') {
    try {
      await this.setAuthConfig('force_password_change', 'true');
      await this.setAuthConfig('force_change_reason', reason);
      console.log('✅ 已设置强制修改密码标记:', reason);
    } catch (error) {
      console.error('❌ 设置强制修改密码失败:', error);
      throw error;
    }
  }

  // 清除强制修改密码标记
  async clearForcePasswordChange() {
    try {
      await this.setAuthConfig('force_password_change', 'false');
      await this.setAuthConfig('force_change_reason', '');
      await this.setAuthConfig('password_created_at', new Date().toISOString());
      console.log('✅ 已清除强制修改密码标记');
    } catch (error) {
      console.error('❌ 清除强制修改密码失败:', error);
      throw error;
    }
  }
}

// 创建单例实例
const db = new DomainDatabase();

export default db; 