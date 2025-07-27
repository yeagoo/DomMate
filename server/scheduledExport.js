import cron from 'node-cron';
import db from './database.js';
import exportService from './exportService.js';
import fs from 'fs';
import path from 'path';

class ScheduledExportService {
  constructor() {
    this.jobs = new Map();
    this.defaultExportConfig = {
      format: 'json',
      selectedFields: ['domain', 'registrar', 'expiresAt', 'dnsProvider', 'domainStatus', 'status', 'lastCheck'],
      language: 'zh',
      enabled: false,
      schedule: '0 2 * * 0', // 每周日凌晨2点
      filename: 'domains_backup'
    };
    this.configFile = path.join(process.cwd(), 'export-schedule-config.json');
    this.loadConfig();
  }

  // 加载配置
  loadConfig() {
    try {
      if (fs.existsSync(this.configFile)) {
        const config = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
        this.scheduleConfig = { ...this.defaultExportConfig, ...config };
      } else {
        this.scheduleConfig = { ...this.defaultExportConfig };
        this.saveConfig();
      }
      
      // 如果配置启用了定期导出，启动任务
      if (this.scheduleConfig.enabled) {
        this.startScheduledExport();
      }
      
      console.log('✅ 定期导出配置加载完成:', this.scheduleConfig.enabled ? '已启用' : '已禁用');
    } catch (error) {
      console.error('❌ 加载定期导出配置失败:', error.message);
      this.scheduleConfig = { ...this.defaultExportConfig };
    }
  }

  // 保存配置
  saveConfig() {
    try {
      fs.writeFileSync(this.configFile, JSON.stringify(this.scheduleConfig, null, 2), 'utf8');
    } catch (error) {
      console.error('❌ 保存定期导出配置失败:', error.message);
    }
  }

  // 获取当前配置
  getConfig() {
    return { ...this.scheduleConfig };
  }

  // 更新配置
  updateConfig(newConfig) {
    const oldConfig = { ...this.scheduleConfig };
    this.scheduleConfig = { ...this.scheduleConfig, ...newConfig };
    
    try {
      // 验证cron表达式
      if (newConfig.schedule && !cron.validate(newConfig.schedule)) {
        throw new Error('无效的cron表达式');
      }

      // 如果状态或计划发生变化，重新安排任务
      if (oldConfig.enabled !== this.scheduleConfig.enabled || 
          oldConfig.schedule !== this.scheduleConfig.schedule) {
        this.stopScheduledExport();
        if (this.scheduleConfig.enabled) {
          this.startScheduledExport();
        }
      }

      this.saveConfig();
      
      console.log('✅ 定期导出配置已更新:', this.scheduleConfig.enabled ? '已启用' : '已禁用');
      return { success: true, message: '配置更新成功' };
      
    } catch (error) {
      // 恢复旧配置
      this.scheduleConfig = oldConfig;
      console.error('❌ 更新定期导出配置失败:', error.message);
      return { success: false, message: error.message };
    }
  }

  // 启动定期导出任务
  startScheduledExport() {
    this.stopScheduledExport(); // 先停止现有任务
    
    try {
      const task = cron.schedule(this.scheduleConfig.schedule, async () => {
        await this.performScheduledExport();
      }, {
        scheduled: false, // 手动启动
        timezone: 'Asia/Shanghai'
      });
      
      this.jobs.set('main', task);
      task.start();
      
      console.log(`✅ 定期导出任务已启动, 计划: ${this.scheduleConfig.schedule}`);
      return true;
    } catch (error) {
      console.error('❌ 启动定期导出任务失败:', error.message);
      return false;
    }
  }

  // 停止定期导出任务
  stopScheduledExport() {
    if (this.jobs.has('main')) {
      const task = this.jobs.get('main');
      task.stop();
      task.destroy();
      this.jobs.delete('main');
      console.log('🛑 定期导出任务已停止');
    }
  }

  // 执行定期导出
  async performScheduledExport() {
    console.log('🔄 开始执行定期导出...');
    
    try {
      // 获取所有域名数据
      const domains = await db.getAllDomains();
      
      if (domains.length === 0) {
        console.log('⚠️ 没有域名数据，跳过导出');
        return;
      }

      // 生成带时间戳的文件名
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `${this.scheduleConfig.filename}_${timestamp}`;
      
      // 执行导出
      let result;
      switch (this.scheduleConfig.format) {
        case 'csv':
          result = await exportService.exportToCSV(
            domains, 
            this.scheduleConfig.selectedFields, 
            { 
              filename, 
              language: this.scheduleConfig.language 
            }
          );
          break;
        case 'pdf':
          const title = this.scheduleConfig.language === 'en' ? 
            'Scheduled Domain Report' : '定期域名报告';
          result = await exportService.exportToPDF(
            domains, 
            this.scheduleConfig.selectedFields, 
            { 
              filename, 
              language: this.scheduleConfig.language,
              title 
            }
          );
          break;
        case 'json':
        default:
          result = await exportService.exportToJSON(
            domains, 
            this.scheduleConfig.selectedFields, 
            { 
              filename, 
              language: this.scheduleConfig.language,
              includeMetadata: true 
            }
          );
          break;
      }
      
      console.log(`✅ 定期导出完成: ${result.filename} (${this.formatFileSize(result.size)})`);
      
      // 记录导出历史
      this.recordExportHistory({
        timestamp: new Date().toISOString(),
        filename: result.filename,
        format: this.scheduleConfig.format,
        size: result.size,
        recordCount: domains.length,
        fieldCount: this.scheduleConfig.selectedFields.length,
        type: 'scheduled'
      });
      
      // 清理旧文件（可选）
      if (this.scheduleConfig.cleanupOldFiles !== false) {
        exportService.cleanupOldExports();
      }
      
    } catch (error) {
      console.error('❌ 定期导出失败:', error.message);
      
      // 记录失败历史
      this.recordExportHistory({
        timestamp: new Date().toISOString(),
        error: error.message,
        type: 'scheduled',
        success: false
      });
    }
  }

  // 记录导出历史
  recordExportHistory(record) {
    try {
      const historyFile = path.join(process.cwd(), 'export-history.json');
      let history = [];
      
      if (fs.existsSync(historyFile)) {
        try {
          history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
        } catch (e) {
          history = [];
        }
      }
      
      history.unshift(record);
      
      // 只保留最近100条记录
      if (history.length > 100) {
        history = history.slice(0, 100);
      }
      
      fs.writeFileSync(historyFile, JSON.stringify(history, null, 2), 'utf8');
    } catch (error) {
      console.error('记录导出历史失败:', error.message);
    }
  }

  // 获取导出历史
  getExportHistory(limit = 10) {
    try {
      const historyFile = path.join(process.cwd(), 'export-history.json');
      
      if (!fs.existsSync(historyFile)) {
        return [];
      }
      
      const history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
      return history.slice(0, limit);
    } catch (error) {
      console.error('获取导出历史失败:', error.message);
      return [];
    }
  }

  // 手动触发导出
  async triggerManualExport() {
    console.log('🔄 手动触发定期导出...');
    await this.performScheduledExport();
    return true;
  }

  // 获取下次执行时间
  getNextExecutionTime() {
    if (!this.scheduleConfig.enabled || !this.jobs.has('main')) {
      return null;
    }
    
    try {
      // 这是一个简单的实现，实际上cron库可能没有直接的方法获取下次执行时间
      // 可以使用其他库如 'cron-parser' 来解析
      return '下次执行时间需要额外计算'; // 占位符
    } catch (error) {
      return null;
    }
  }

  // 获取任务状态
  getStatus() {
    const isRunning = this.jobs.has('main');
    return {
      enabled: this.scheduleConfig.enabled,
      running: isRunning,
      schedule: this.scheduleConfig.schedule,
      nextExecution: this.getNextExecutionTime(),
      config: this.getConfig()
    };
  }

  // 验证cron表达式
  validateCronExpression(expression) {
    return cron.validate(expression);
  }

  // 格式化文件大小
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // 清理资源
  cleanup() {
    this.stopScheduledExport();
    this.jobs.clear();
  }
}

export default new ScheduledExportService(); 