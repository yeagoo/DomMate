import fs from 'fs';
import path from 'path';
import createCsvWriter from 'csv-writer';
import PDFDocument from 'pdfkit';

class ExportService {
  constructor() {
    this.availableFields = {
      domain: '域名',
      registrar: '注册商',
      expiresAt: '到期时间', 
      dnsProvider: 'DNS提供商',
      domainStatus: '域名状态',
      status: '状态标识',
      lastCheck: '最后检查',
      notifications: '通知状态',
      createdAt: '创建时间'
    };
    
    this.availableFieldsEn = {
      domain: 'Domain',
      registrar: 'Registrar',
      expiresAt: 'Expires At',
      dnsProvider: 'DNS Provider', 
      domainStatus: 'Domain Status',
      status: 'Status Badge',
      lastCheck: 'Last Check',
      notifications: 'Notifications',
      createdAt: 'Created At'
    };
  }

  // 格式化数据用于导出
  formatDataForExport(domains, selectedFields, language = 'zh') {
    const fieldLabels = language === 'en' ? this.availableFieldsEn : this.availableFields;
    
    return domains.map(domain => {
      const exportItem = {};
      
      selectedFields.forEach(field => {
        let value = domain[field];
        
        // 格式化特殊字段
        switch (field) {
          case 'expiresAt':
            value = value ? new Date(value).toLocaleDateString(language === 'en' ? 'en-US' : 'zh-CN') : '未知';
            break;
          case 'lastCheck':
            value = value ? new Date(value).toLocaleDateString(language === 'en' ? 'en-US' : 'zh-CN') + ' ' + new Date(value).toLocaleTimeString() : '未检查';
            break;
          case 'createdAt':
            value = value ? new Date(value).toLocaleDateString(language === 'en' ? 'en-US' : 'zh-CN') : '未知';
            break;
          case 'notifications':
            value = value ? (language === 'en' ? 'Enabled' : '已启用') : (language === 'en' ? 'Disabled' : '已禁用');
            break;
          case 'status':
            const statusMap = language === 'en' ? {
              'normal': 'Normal',
              'expiring': 'Expiring',
              'expired': 'Expired', 
              'failed': 'Failed',
              'unregistered': 'Unregistered'
            } : {
              'normal': '正常',
              'expiring': '即将到期',
              'expired': '已过期',
              'failed': '查询失败',
              'unregistered': '未注册'
            };
            value = statusMap[value] || value;
            break;
          default:
            value = value || (language === 'en' ? 'Unknown' : '未知');
        }
        
        exportItem[fieldLabels[field]] = value;
      });
      
      return exportItem;
    });
  }

  // CSV导出
  async exportToCSV(domains, selectedFields, options = {}) {
    const { filename = 'domains', language = 'zh' } = options;
    const exportPath = path.join(process.cwd(), 'exports');
    
    // 确保导出目录存在
    if (!fs.existsSync(exportPath)) {
      fs.mkdirSync(exportPath, { recursive: true });
    }
    
    const filePath = path.join(exportPath, `${filename}_${Date.now()}.csv`);
    const fieldLabels = language === 'en' ? this.availableFieldsEn : this.availableFields;
    
    // 创建CSV头部
    const header = selectedFields.map(field => ({
      id: fieldLabels[field],
      title: fieldLabels[field]
    }));
    
    const csvWriter = createCsvWriter.createObjectCsvWriter({
      path: filePath,
      header: header,
      encoding: 'utf8',
      // 添加BOM以支持Excel中文显示
      append: false
    });
    
    // 格式化数据
    const formattedData = this.formatDataForExport(domains, selectedFields, language);
    
    // 写入CSV文件
    await csvWriter.writeRecords(formattedData);
    
    // 添加BOM标记支持Excel
    const content = fs.readFileSync(filePath);
    const bom = Buffer.from('\uFEFF', 'utf8');
    const withBom = Buffer.concat([bom, content]);
    fs.writeFileSync(filePath, withBom);
    
    return {
      filePath,
      filename: path.basename(filePath),
      size: fs.statSync(filePath).size
    };
  }

  // PDF导出
  async exportToPDF(domains, selectedFields, options = {}) {
    const { filename = 'domains', language = 'zh', title = 'Domain Monitoring Report' } = options;
    const exportPath = path.join(process.cwd(), 'exports');
    
    if (!fs.existsSync(exportPath)) {
      fs.mkdirSync(exportPath, { recursive: true });
    }
    
    const filePath = path.join(exportPath, `${filename}_${Date.now()}.pdf`);
    const fieldLabels = language === 'en' ? this.availableFieldsEn : this.availableFields;
    
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ 
        margin: 50,
        size: 'A4',
        info: {
          Title: title,
          Subject: 'Domain Monitoring Report',
          Author: 'DomainFlow'
        }
      });
      
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);
      
      try {
        // 标题
        doc.fontSize(20).font('Helvetica-Bold').text(title, { align: 'center' });
        doc.fontSize(10).text(`${language === 'en' ? 'Generated on' : '生成时间'}: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown(2);
        
        // 统计信息
        const stats = this.generateStats(domains, language);
        doc.fontSize(12).font('Helvetica-Bold').text(language === 'en' ? 'Summary Statistics:' : '统计摘要:', { underline: true });
        doc.moveDown(0.5);
        
        Object.entries(stats).forEach(([key, value]) => {
          doc.fontSize(10).font('Helvetica').text(`${key}: ${value}`, { indent: 20 });
        });
        
        doc.moveDown(2);
        
        // 表格标题
        doc.fontSize(12).font('Helvetica-Bold').text(language === 'en' ? 'Domain Details:' : '域名详情:', { underline: true });
        doc.moveDown(1);
        
        // 表格数据
        const formattedData = this.formatDataForExport(domains, selectedFields, language);
        
        if (formattedData.length > 0) {
          const headers = selectedFields.map(field => fieldLabels[field]);
          const columnWidths = this.calculateColumnWidths(headers, formattedData);
          
          // 绘制表格头部
          this.drawTableHeader(doc, headers, columnWidths);
          
          // 绘制表格内容
          let currentY = doc.y;
          formattedData.forEach((row, index) => {
            // 检查是否需要新页面
            if (currentY > 700) {
              doc.addPage();
              currentY = 100;
              this.drawTableHeader(doc, headers, columnWidths);
            }
            
            this.drawTableRow(doc, row, headers, columnWidths, index % 2 === 0);
            currentY = doc.y;
          });
        }
        
        // 页脚
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);
          doc.fontSize(8).text(
            `${language === 'en' ? 'Page' : '第'} ${i + 1} ${language === 'en' ? 'of' : '页，共'} ${pages.count} ${language === 'en' ? '' : '页'} | DomainFlow`, 
            50, 
            doc.page.height - 50, 
            { align: 'center' }
          );
        }
        
        doc.end();
        
        stream.on('finish', () => {
          resolve({
            filePath,
            filename: path.basename(filePath),
            size: fs.statSync(filePath).size
          });
        });
        
      } catch (error) {
        reject(error);
      }
    });
  }

  // JSON导出
  async exportToJSON(domains, selectedFields, options = {}) {
    const { filename = 'domains', language = 'zh', includeMetadata = true } = options;
    const exportPath = path.join(process.cwd(), 'exports');
    
    if (!fs.existsSync(exportPath)) {
      fs.mkdirSync(exportPath, { recursive: true });
    }
    
    const filePath = path.join(exportPath, `${filename}_${Date.now()}.json`);
    
    const exportData = {
      metadata: includeMetadata ? {
        exportDate: new Date().toISOString(),
        exportedBy: 'DomainFlow',
        totalRecords: domains.length,
        selectedFields,
        language,
        version: '1.0'
      } : null,
      domains: selectedFields.length === Object.keys(this.availableFields).length 
        ? domains // 如果选择了所有字段，导出完整数据
        : domains.map(domain => {
            const filtered = {};
            selectedFields.forEach(field => {
              filtered[field] = domain[field];
            });
            return filtered;
          })
    };
    
    fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2), 'utf8');
    
    return {
      filePath,
      filename: path.basename(filePath),
      size: fs.statSync(filePath).size
    };
  }

  // 生成统计信息
  generateStats(domains, language = 'zh') {
    const stats = {};
    const labels = language === 'en' ? {
      total: 'Total Domains',
      normal: 'Normal',
      expiring: 'Expiring Soon', 
      expired: 'Expired',
      failed: 'Query Failed',
      unregistered: 'Unregistered'
    } : {
      total: '域名总数',
      normal: '正常',
      expiring: '即将到期',
      expired: '已过期', 
      failed: '查询失败',
      unregistered: '未注册'
    };
    
    stats[labels.total] = domains.length;
    stats[labels.normal] = domains.filter(d => d.status === 'normal').length;
    stats[labels.expiring] = domains.filter(d => d.status === 'expiring').length;
    stats[labels.expired] = domains.filter(d => d.status === 'expired').length;
    stats[labels.failed] = domains.filter(d => d.status === 'failed').length;
    stats[labels.unregistered] = domains.filter(d => d.status === 'unregistered').length;
    
    return stats;
  }

  // 计算表格列宽
  calculateColumnWidths(headers, data) {
    const availableWidth = 495; // A4页面宽度减去边距
    const columnCount = headers.length;
    const baseWidth = availableWidth / columnCount;
    
    // 简单的平均分配，可以后续优化为基于内容长度的智能分配
    return new Array(columnCount).fill(baseWidth);
  }

  // 绘制表格头部
  drawTableHeader(doc, headers, columnWidths) {
    let x = 50;
    const y = doc.y;
    
    // 背景色
    doc.rect(50, y, 495, 20).fill('#f0f0f0');
    
    // 恢复文本颜色
    doc.fill('#000000');
    
    headers.forEach((header, index) => {
      doc.fontSize(9).font('Helvetica-Bold').text(
        header, 
        x + 5, 
        y + 5, 
        { 
          width: columnWidths[index] - 10,
          ellipsis: true
        }
      );
      x += columnWidths[index];
    });
    
    doc.y = y + 25;
  }

  // 绘制表格行
  drawTableRow(doc, rowData, headers, columnWidths, isEven = false) {
    let x = 50;
    const y = doc.y;
    
    // 交替行背景色
    if (isEven) {
      doc.rect(50, y, 495, 18).fill('#f9f9f9');
      doc.fill('#000000');
    }
    
    headers.forEach((header, index) => {
      const value = String(rowData[header] || '');
      doc.fontSize(8).font('Helvetica').text(
        value,
        x + 5,
        y + 3,
        {
          width: columnWidths[index] - 10,
          ellipsis: true
        }
      );
      x += columnWidths[index];
    });
    
    doc.y = y + 20;
  }

  // 获取可用字段
  getAvailableFields(language = 'zh') {
    return language === 'en' ? this.availableFieldsEn : this.availableFields;
  }

  // 清理旧的导出文件（保留最近7天）
  cleanupOldExports() {
    const exportPath = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportPath)) return;
    
    const files = fs.readdirSync(exportPath);
    const now = Date.now();
    const weekAgo = now - (7 * 24 * 60 * 60 * 1000); // 7天前
    
    files.forEach(file => {
      const filePath = path.join(exportPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime.getTime() < weekAgo) {
        fs.unlinkSync(filePath);
        console.log(`已删除过期导出文件: ${file}`);
      }
    });
  }
}

export default new ExportService(); 