import type { Domain } from '@/types/domain';

// 前端导出工具类
export class FrontendExportUtils {
  private static availableFields = {
    domain: '域名',
    registrar: '注册商',
    expiresAt: '到期时间', 
    dnsProvider: 'DNS提供商',
    status: '状态标识',
    lastCheck: '最后检查时间'
  };
  
  private static availableFieldsEn = {
    domain: 'Domain',
    registrar: 'Registrar',
    expiresAt: 'Expires At',
    dnsProvider: 'DNS Provider', 
    status: 'Status Badge',
    lastCheck: 'Last Check Time'
  };

  // 格式化数据
  private static formatDataForExport(domains: Domain[], selectedFields: string[], language: 'zh' | 'en' = 'zh') {
    const fieldLabels = language === 'en' ? this.availableFieldsEn : this.availableFields;
    
    return domains.map(domain => {
      const row: Record<string, string> = {};
      
      selectedFields.forEach(field => {
        const label = fieldLabels[field as keyof typeof fieldLabels] || field;
        let value = String((domain as any)[field] || '');
        
        // 格式化特殊字段
        switch (field) {
          case 'expiresAt':
            if (value && value !== 'undefined') {
              try {
                value = new Date(value).toLocaleDateString(language === 'en' ? 'en-US' : 'zh-CN');
              } catch {
                // 保持原值
              }
            }
            break;
          case 'lastCheck':
            if (value && value !== 'undefined') {
              try {
                value = new Date(value).toLocaleString(language === 'en' ? 'en-US' : 'zh-CN');
              } catch {
                // 保持原值
              }
            }
            break;
          case 'createdAt':
            if (value && value !== 'undefined') {
              try {
                value = new Date(value).toLocaleString(language === 'en' ? 'en-US' : 'zh-CN');
              } catch {
                // 保持原值
              }
            }
            break;

          case 'status':
            // 状态标识翻译
            const statusMap: Record<string, Record<string, string>> = {
              'zh': {
                'normal': '正常',
                'expiring_soon': '即将到期', 
                'expired': '已过期',
                'unknown': '未知',
                'unregistered': '未注册',
                'failed': '查询失败',
                'error': '错误',
                'pending': '待处理',
                'inactive': '未激活',
                'suspended': '已暂停',
                'transferred': '已转移'
              },
              'en': {
                'normal': 'Normal',
                'expiring_soon': 'Expiring Soon', 
                'expired': 'Expired',
                'unknown': 'Unknown',
                'unregistered': 'Unregistered',
                'failed': 'Failed',
                'error': 'Error',
                'pending': 'Pending',
                'inactive': 'Inactive',
                'suspended': 'Suspended',
                'transferred': 'Transferred'
              }
            };
            value = statusMap[language][value] || value;
            break;
        }
        
        row[label] = value;
      });
      
      return row;
    });
  }

  // 生成CSV内容
  static generateCSV(domains: Domain[], selectedFields: string[], language: 'zh' | 'en' = 'zh'): string {
    const formattedData = this.formatDataForExport(domains, selectedFields, language);
    
    if (formattedData.length === 0) {
      return '';
    }
    
    // 获取表头
    const headers = Object.keys(formattedData[0]);
    
    // 生成CSV内容
    const csvContent = [
      // 表头行
      headers.map(header => `"${header.replace(/"/g, '""')}"`).join(','),
      // 数据行
      ...formattedData.map(row => 
        headers.map(header => `"${String(row[header] || '').replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');
    
    // 添加BOM以支持Excel中文显示
    return '\ufeff' + csvContent;
  }

  // 生成JSON内容
  static generateJSON(domains: Domain[], selectedFields: string[], language: 'zh' | 'en' = 'zh', includeMetadata = true): string {
    const exportData: any = {};
    
    if (includeMetadata) {
      exportData.metadata = {
        exportDate: new Date().toISOString(),
        exportedBy: 'DomainFlow',
        totalRecords: domains.length,
        selectedFields,
        language,
        version: '1.0'
      };
    }
    
    // 如果选择了所有字段，导出完整数据
    if (selectedFields.length === Object.keys(this.availableFields).length) {
      exportData.domains = domains;
    } else {
      // 否则只导出选择的字段
      exportData.domains = domains.map(domain => {
        const filtered: any = {};
        selectedFields.forEach(field => {
          filtered[field] = (domain as any)[field];
        });
        return filtered;
      });
    }
    
    return JSON.stringify(exportData, null, 2);
  }

  // 生成HTML表格用于PDF打印
  static generateHTMLTable(domains: Domain[], selectedFields: string[], language: 'zh' | 'en' = 'zh', title?: string): string {
    const formattedData = this.formatDataForExport(domains, selectedFields, language);
    const reportTitle = title || (language === 'en' ? 'Domain Monitoring Report' : '域名监控报告');
    const exportInfo = language === 'en' 
      ? `Export Date: ${new Date().toLocaleString('en-US')} | Total Records: ${domains.length}`
      : `导出时间: ${new Date().toLocaleString('zh-CN')} | 记录总数: ${domains.length}`;
    
    if (formattedData.length === 0) {
      return `<h1>${reportTitle}</h1><p>${language === 'en' ? 'No data to export' : '没有数据可导出'}</p>`;
    }
    
    const headers = Object.keys(formattedData[0]);
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${reportTitle}</title>
  <style>
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { text-align: center; color: #333; margin-bottom: 10px; }
    .info { text-align: center; color: #666; margin-bottom: 20px; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; font-weight: bold; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    .print-btn { 
      background: #007bff; color: white; border: none; 
      padding: 10px 20px; border-radius: 4px; cursor: pointer; 
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">${language === 'en' ? 'Print as PDF' : '打印为PDF'}</button>
  <h1>${reportTitle}</h1>
  <div class="info">${exportInfo}</div>
  <table>
    <thead>
      <tr>${headers.map(header => `<th>${header}</th>`).join('')}</tr>
    </thead>
    <tbody>
      ${formattedData.map(row => 
        `<tr>${headers.map(header => `<td>${row[header] || ''}</td>`).join('')}</tr>`
      ).join('')}
    </tbody>
  </table>
</body>
</html>`;
  }

  // 下载文件
  static downloadFile(content: string | Uint8Array, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 清理blob URL
    window.URL.revokeObjectURL(url);
  }

  // 在新窗口中打开HTML内容用于打印
  static openPrintWindow(htmlContent: string) {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // 等待内容加载完成后自动打印
      printWindow.addEventListener('load', () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      });
    } else {
      alert('打印窗口被阻止，请允许弹窗后重试');
    }
  }

  // 导出CSV文件
  static async exportToCSV(domains: Domain[], selectedFields: string[], filename = 'domains', language: 'zh' | 'en' = 'zh') {
    const csvContent = this.generateCSV(domains, selectedFields, language);
    const fullFilename = `${filename}_${Date.now()}.csv`;
    
    this.downloadFile(csvContent, fullFilename, 'text/csv;charset=utf-8');
    
    return {
      success: true,
      filename: fullFilename,
      size: new Blob([csvContent]).size,
      totalRecords: domains.length,
      selectedFields: selectedFields.length
    };
  }

  // 导出JSON文件
  static async exportToJSON(domains: Domain[], selectedFields: string[], filename = 'domains', language: 'zh' | 'en' = 'zh') {
    const jsonContent = this.generateJSON(domains, selectedFields, language, true);
    const fullFilename = `${filename}_${Date.now()}.json`;
    
    this.downloadFile(jsonContent, fullFilename, 'application/json');
    
    return {
      success: true,
      filename: fullFilename,
      size: new Blob([jsonContent]).size,
      totalRecords: domains.length,
      selectedFields: selectedFields.length
    };
  }

  // 导出PDF（通过HTML打印）
  static async exportToPDF(domains: Domain[], selectedFields: string[], filename = 'domains', language: 'zh' | 'en' = 'zh', title?: string) {
    const htmlContent = this.generateHTMLTable(domains, selectedFields, language, title);
    this.openPrintWindow(htmlContent);
    
    return {
      success: true,
      filename: `${filename}_${Date.now()}.pdf`,
      size: htmlContent.length,
      totalRecords: domains.length,
      selectedFields: selectedFields.length,
      note: language === 'en' ? 'Please use browser print dialog to save as PDF' : '请使用浏览器打印对话框另存为PDF'
    };
  }

  // 统一导出接口
  static async export(
    format: 'csv' | 'pdf' | 'json',
    domains: Domain[], 
    selectedFields: string[], 
    filename = 'domains', 
    language: 'zh' | 'en' = 'zh',
    options: { title?: string } = {}
  ) {
    switch (format) {
      case 'csv':
        return this.exportToCSV(domains, selectedFields, filename, language);
      case 'pdf':
        return this.exportToPDF(domains, selectedFields, filename, language, options.title);
      case 'json':
        return this.exportToJSON(domains, selectedFields, filename, language);
      default:
        throw new Error(`不支持的导出格式: ${format}`);
    }
  }
} 