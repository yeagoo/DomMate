import nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import db from './database.js';

class EmailService {
  constructor() {
    this.transportCache = new Map();
  }

  // 获取或创建SMTP传输器
  async getTransporter(configId = null) {
    let config;
    
    if (configId) {
      config = await db.getEmailConfigById(configId);
    } else {
      config = await db.getDefaultEmailConfig();
    }

    if (!config) {
      throw new Error('未找到可用的邮件配置');
    }

    const cacheKey = config.id;
    
    // 检查缓存
    if (this.transportCache.has(cacheKey)) {
      const cachedTransport = this.transportCache.get(cacheKey);
      
      // 验证连接是否有效
      try {
        await cachedTransport.verify();
        return cachedTransport;
      } catch (error) {
        // 连接失效，删除缓存
        this.transportCache.delete(cacheKey);
      }
    }

    // 创建新的传输器
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.username,
        pass: config.password,
      },
      pool: true, // 使用连接池
      maxConnections: 5,
      maxMessages: 100,
    });

    // 验证连接
    try {
      await transporter.verify();
      this.transportCache.set(cacheKey, transporter);
      return transporter;
    } catch (error) {
      throw new Error(`SMTP连接失败: ${error.message}`);
    }
  }

  // 渲染邮件模板
  renderTemplate(template, data) {
    try {
      // 注册 Handlebars 辅助函数
      Handlebars.registerHelper('if', function(conditional, options) {
        if (conditional) {
          return options.fn(this);
        } else {
          return options.inverse(this);
        }
      });

      Handlebars.registerHelper('each', function(context, options) {
        if (!context || context.length === 0) {
          return options.inverse(this);
        }
        
        let ret = '';
        for (let i = 0; i < context.length; i++) {
          ret += options.fn(context[i]);
        }
        return ret;
      });

      const subjectTemplate = Handlebars.compile(template.subject);
      const htmlTemplate = Handlebars.compile(template.htmlContent);
      const textTemplate = template.textContent ? 
        Handlebars.compile(template.textContent) : null;

      return {
        subject: subjectTemplate(data),
        html: htmlTemplate(data),
        text: textTemplate ? textTemplate(data) : null
      };
    } catch (error) {
      throw new Error(`模板渲染失败: ${error.message}`);
    }
  }

  // 发送单封邮件
  async sendEmail(emailData) {
    const {
      configId,
      templateId,
      recipient,
      templateData,
      overrideSubject,
      overrideHtml,
      overrideText
    } = emailData;

    try {
      // 获取邮件配置
      let config;
      if (configId) {
        config = await db.getEmailConfigById(configId);
      } else {
        config = await db.getDefaultEmailConfig();
      }

      if (!config) {
        throw new Error('未找到可用的邮件配置');
      }

      // 获取邮件模板
      let renderedEmail;
      if (templateId) {
        const template = await db.getEmailTemplateById(templateId);
        if (!template) {
          throw new Error('邮件模板不存在');
        }
        renderedEmail = this.renderTemplate(template, templateData || {});
      } else {
        // 使用自定义内容
        renderedEmail = {
          subject: overrideSubject || '无标题',
          html: overrideHtml || '',
          text: overrideText || null
        };
      }

      // 获取传输器
      const transporter = await this.getTransporter(config.id);

      // 构建邮件选项
      const mailOptions = {
        from: {
          name: config.fromName || 'DomainFlow',
          address: config.fromEmail
        },
        to: recipient,
        subject: renderedEmail.subject,
        html: renderedEmail.html,
        text: renderedEmail.text,
      };

      // 发送邮件
      const info = await transporter.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: info.messageId,
        response: info.response
      };
    } catch (error) {
      throw new Error(`邮件发送失败: ${error.message}`);
    }
  }

  // 批量发送邮件
  async sendBulkEmails(emailsData) {
    const results = [];
    
    for (const emailData of emailsData) {
      try {
        const result = await this.sendEmail(emailData);
        results.push({
          recipient: emailData.recipient,
          success: true,
          messageId: result.messageId
        });
      } catch (error) {
        results.push({
          recipient: emailData.recipient,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }

  // 测试邮件配置
  async testEmailConfig(configId) {
    try {
      const config = await db.getEmailConfigById(configId);
      if (!config) {
        throw new Error('邮件配置不存在');
      }

      const transporter = await this.getTransporter(configId);
      
      // 发送测试邮件
      const testEmailOptions = {
        from: {
          name: config.fromName || 'DomainFlow',
          address: config.fromEmail
        },
        to: config.fromEmail, // 发送给自己
        subject: 'DomainFlow 邮件配置测试',
        html: `
          <h2>邮件配置测试成功</h2>
          <p>这是来自 DomainFlow 的测试邮件。</p>
          <p><strong>配置名称:</strong> ${config.name}</p>
          <p><strong>SMTP服务器:</strong> ${config.host}:${config.port}</p>
          <p><strong>发送时间:</strong> ${new Date().toLocaleString('zh-CN')}</p>
          <p>如果您收到这封邮件，说明邮件配置正常工作。</p>
        `,
        text: `DomainFlow 邮件配置测试\n\n这是来自 DomainFlow 的测试邮件。\n配置名称: ${config.name}\nSMTP服务器: ${config.host}:${config.port}\n发送时间: ${new Date().toLocaleString('zh-CN')}\n\n如果您收到这封邮件，说明邮件配置正常工作。`
      };

      const info = await transporter.sendMail(testEmailOptions);
      
      return {
        success: true,
        messageId: info.messageId,
        message: '测试邮件发送成功'
      };
    } catch (error) {
      throw new Error(`邮件配置测试失败: ${error.message}`);
    }
  }

  // 预览邮件模板
  async previewTemplate(templateId, templateData = {}) {
    try {
      const template = await db.getEmailTemplateById(templateId);
      if (!template) {
        throw new Error('邮件模板不存在');
      }

      // 如果没有提供测试数据，使用默认测试数据
      const defaultData = this.getDefaultTemplateData(template.type);
      const finalData = { ...defaultData, ...templateData };

      const rendered = this.renderTemplate(template, finalData);
      
      return {
        template: {
          id: template.id,
          name: template.name,
          type: template.type,
          language: template.language
        },
        data: finalData,
        rendered: rendered
      };
    } catch (error) {
      throw new Error(`模板预览失败: ${error.message}`);
    }
  }

  // 预览自定义邮件模板内容
  async previewCustomTemplate(subject, htmlContent, templateData = {}) {
    try {
      // 创建临时模板对象
      const tempTemplate = {
        subject: subject,
        htmlContent: htmlContent,
        textContent: null
      };

      const rendered = this.renderTemplate(tempTemplate, templateData);
      
      return {
        rendered: rendered
      };
    } catch (error) {
      throw new Error(`自定义模板预览失败: ${error.message}`);
    }
  }

  // 获取模板类型的默认测试数据
  getDefaultTemplateData(templateType) {
    const now = new Date();
    const expiryDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    switch (templateType) {
      case 'reminder':
        return {
          domain: 'example.com',
          registrar: '阿里云',
          expiryDate: expiryDate.toLocaleDateString('zh-CN'),
          days: 7
        };
        
      case 'summary':
        return {
          date: now.toLocaleDateString('zh-CN'),
          totalDomains: 15,
          expiringDomains: 3,
          expiredDomains: 1,
          expiringSoon: [
            { domain: 'example1.com', days: 7 },
            { domain: 'example2.com', days: 15 },
            { domain: 'example3.com', days: 30 }
          ],
          expiredList: [
            { domain: 'expired-example.com', days: 2 }
          ]
        };
        
      default:
        return {};
    }
  }

  // 获取即将到期的域名
  async getExpiringDomains(days = 30) {
    try {
      const domains = await db.getAllDomains();
      const now = new Date();
      const checkDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      
      return domains.filter(domain => {
        if (!domain.expiresAt) return false;
        
        const expiryDate = new Date(domain.expiresAt);
        return expiryDate <= checkDate && expiryDate > now;
      }).map(domain => ({
        ...domain,
        daysUntilExpiry: Math.ceil((new Date(domain.expiresAt) - now) / (24 * 60 * 60 * 1000))
      }));
    } catch (error) {
      throw new Error(`获取即将到期域名失败: ${error.message}`);
    }
  }

  // 获取已过期的域名
  async getExpiredDomains() {
    try {
      const domains = await db.getAllDomains();
      const now = new Date();
      
      return domains.filter(domain => {
        if (!domain.expiresAt) return false;
        
        const expiryDate = new Date(domain.expiresAt);
        return expiryDate < now;
      }).map(domain => ({
        ...domain,
        daysSinceExpiry: Math.ceil((now - new Date(domain.expiresAt)) / (24 * 60 * 60 * 1000))
      }));
    } catch (error) {
      throw new Error(`获取已过期域名失败: ${error.message}`);
    }
  }

  // 发送到期提醒邮件
  async sendExpiryReminders(days = [7, 30, 90]) {
    const results = [];
    
    try {
      // 获取活跃的到期提醒规则
      const rules = await db.getActiveNotificationRules();
      const reminderRules = rules.filter(rule => 
        rule.type === 'expiry_reminder' && days.includes(rule.days)
      );

      for (const rule of reminderRules) {
        try {
          // 获取即将到期的域名
          const expiringDomains = await this.getExpiringDomains(rule.days);
          const domainsForThisRule = expiringDomains.filter(domain => 
            domain.daysUntilExpiry <= rule.days && domain.daysUntilExpiry > (rule.days - 1)
          );

          if (domainsForThisRule.length === 0) {
            continue;
          }

          // 为每个接收者发送邮件
          for (const recipient of rule.recipients) {
            for (const domain of domainsForThisRule) {
              const logId = 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
              
              try {
                // 发送邮件
                const emailResult = await this.sendEmail({
                  configId: rule.emailConfigId,
                  templateId: rule.templateId,
                  recipient: recipient,
                  templateData: {
                    domain: domain.domain,
                    registrar: domain.registrar || '未知',
                    expiryDate: new Date(domain.expiresAt).toLocaleDateString('zh-CN'),
                    days: domain.daysUntilExpiry
                  }
                });

                // 记录发送成功
                await db.addNotificationLog({
                  id: logId,
                  ruleId: rule.id,
                  domainIds: [domain.id],
                  recipient: recipient,
                  subject: `域名到期提醒 - ${domain.domain}`,
                  status: 'sent',
                  sentAt: new Date().toISOString(),
                  retryCount: 0
                });

                results.push({
                  rule: rule.name,
                  recipient: recipient,
                  domain: domain.domain,
                  success: true,
                  messageId: emailResult.messageId
                });

              } catch (error) {
                // 记录发送失败
                await db.addNotificationLog({
                  id: logId,
                  ruleId: rule.id,
                  domainIds: [domain.id],
                  recipient: recipient,
                  subject: `域名到期提醒 - ${domain.domain}`,
                  status: 'failed',
                  errorMessage: error.message,
                  retryCount: 0
                });

                results.push({
                  rule: rule.name,
                  recipient: recipient,
                  domain: domain.domain,
                  success: false,
                  error: error.message
                });
              }
            }
          }

          // 更新规则运行信息
          const now = new Date().toISOString();
          const nextRun = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24小时后
          await db.updateNotificationRuleRunInfo(rule.id, now, nextRun);

        } catch (error) {
          console.error(`处理提醒规则 ${rule.name} 失败:`, error.message);
        }
      }

    } catch (error) {
      console.error('发送到期提醒邮件失败:', error.message);
    }

    return results;
  }

  // 发送汇总报告
  async sendSummaryReports(type = 'daily') {
    const results = [];
    
    try {
      // 获取活跃的汇总报告规则
      const rules = await db.getActiveNotificationRules();
      const summaryRules = rules.filter(rule => rule.type === `${type}_summary`);

      for (const rule of summaryRules) {
        try {
          // 获取统计数据
          const allDomains = await db.getAllDomains();
          const expiringDomains = await this.getExpiringDomains(30);
          const expiredDomains = await this.getExpiredDomains();

          const summaryData = {
            date: new Date().toLocaleDateString('zh-CN'),
            totalDomains: allDomains.length,
            expiringDomains: expiringDomains.length,
            expiredDomains: expiredDomains.length,
            expiringSoon: expiringDomains.slice(0, 10).map(d => ({
              domain: d.domain,
              days: d.daysUntilExpiry
            })),
            expiredList: expiredDomains.slice(0, 10).map(d => ({
              domain: d.domain,
              days: d.daysSinceExpiry
            }))
          };

          // 为每个接收者发送汇总报告
          for (const recipient of rule.recipients) {
            const logId = 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            try {
              // 发送邮件
              const emailResult = await this.sendEmail({
                configId: rule.emailConfigId,
                templateId: rule.templateId,
                recipient: recipient,
                templateData: summaryData
              });

              // 记录发送成功
              await db.addNotificationLog({
                id: logId,
                ruleId: rule.id,
                domainIds: [],
                recipient: recipient,
                subject: `DomainFlow 域名监控${type === 'daily' ? '日报' : '周报'}`,
                status: 'sent',
                sentAt: new Date().toISOString(),
                retryCount: 0
              });

              results.push({
                rule: rule.name,
                recipient: recipient,
                type: type,
                success: true,
                messageId: emailResult.messageId
              });

            } catch (error) {
              // 记录发送失败
              await db.addNotificationLog({
                id: logId,
                ruleId: rule.id,
                domainIds: [],
                recipient: recipient,
                subject: `DomainFlow 域名监控${type === 'daily' ? '日报' : '周报'}`,
                status: 'failed',
                errorMessage: error.message,
                retryCount: 0
              });

              results.push({
                rule: rule.name,
                recipient: recipient,
                type: type,
                success: false,
                error: error.message
              });
            }
          }

          // 更新规则运行信息
          const now = new Date().toISOString();
          const nextRun = type === 'daily' ? 
            new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : 
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
          await db.updateNotificationRuleRunInfo(rule.id, now, nextRun);

        } catch (error) {
          console.error(`处理汇总规则 ${rule.name} 失败:`, error.message);
        }
      }

    } catch (error) {
      console.error(`发送${type}汇总报告失败:`, error.message);
    }

    return results;
  }

  // 重试失败的邮件
  async retryFailedEmails() {
    const results = [];
    
    try {
      const failedLogs = await db.getFailedNotificationLogs(3);
      
      for (const log of failedLogs) {
        try {
          // 获取规则信息
          const rule = await db.getNotificationRuleById(log.ruleId);
          if (!rule || !rule.isActive) {
            continue;
          }

          // 重新发送邮件
          let emailResult;
          if (rule.type === 'expiry_reminder' && log.domainIds.length > 0) {
            // 重新获取域名信息
            const domain = await db.getDomainById(log.domainIds[0]);
            if (domain) {
              emailResult = await this.sendEmail({
                configId: rule.emailConfigId,
                templateId: rule.templateId,
                recipient: log.recipient,
                templateData: {
                  domain: domain.domain,
                  registrar: domain.registrar || '未知',
                  expiryDate: new Date(domain.expiresAt).toLocaleDateString('zh-CN'),
                  days: Math.ceil((new Date(domain.expiresAt) - new Date()) / (24 * 60 * 60 * 1000))
                }
              });
            }
          } else {
            // 汇总报告重试
            const allDomains = await db.getAllDomains();
            const expiringDomains = await this.getExpiringDomains(30);
            const expiredDomains = await this.getExpiredDomains();

            emailResult = await this.sendEmail({
              configId: rule.emailConfigId,
              templateId: rule.templateId,
              recipient: log.recipient,
              templateData: {
                date: new Date().toLocaleDateString('zh-CN'),
                totalDomains: allDomains.length,
                expiringDomains: expiringDomains.length,
                expiredDomains: expiredDomains.length,
                expiringSoon: expiringDomains.slice(0, 10),
                expiredList: expiredDomains.slice(0, 10)
              }
            });
          }

          if (emailResult) {
            // 更新为发送成功
            await db.updateNotificationLogStatus(
              log.id, 
              'sent', 
              null, 
              new Date().toISOString()
            );

            results.push({
              logId: log.id,
              recipient: log.recipient,
              success: true,
              messageId: emailResult.messageId
            });
          }

        } catch (error) {
          // 更新重试状态
          await db.updateNotificationLogStatus(
            log.id, 
            'retry', 
            error.message
          );

          results.push({
            logId: log.id,
            recipient: log.recipient,
            success: false,
            error: error.message,
            retryCount: log.retryCount + 1
          });
        }
      }

    } catch (error) {
      console.error('重试失败邮件时出错:', error.message);
    }

    return results;
  }

  // 清理传输器缓存
  clearTransporterCache() {
    for (const [key, transporter] of this.transportCache) {
      try {
        transporter.close();
      } catch (error) {
        console.error(`关闭传输器 ${key} 时出错:`, error.message);
      }
    }
    this.transportCache.clear();
  }

  // 关闭服务
  async close() {
    this.clearTransporterCache();
  }
}

// 创建单例实例
const emailService = new EmailService();

export default emailService; 