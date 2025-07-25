import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Download, FileText, FileSpreadsheet, FileJson, Loader2 } from 'lucide-react';
import { FrontendExportUtils } from '@/lib/exportUtils';
import { apiService } from '@/lib/api';
import type { Domain } from '@/types/domain';

interface DataExportDialogProps {
  language?: 'zh' | 'en';
  onExportComplete?: (result: any) => void;
}

export function DataExportDialog({ language = 'zh', onExportComplete }: DataExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [format, setFormat] = useState<'csv' | 'pdf' | 'json'>('csv');
  const [filename, setFilename] = useState('domains');

  const labels = language === 'en' ? {
    title: 'Export Data',
    description: 'Choose format and filename for data export',
    format: 'Export Format',
    filename: 'File Name',
    export: 'Export',
    exporting: 'Exporting...',
    cancel: 'Cancel',
    csvDesc: 'Excel compatible spreadsheet',
    pdfDesc: 'Professional formatted report (Print to PDF)',
    jsonDesc: 'Complete data backup',
    filenameHelp: 'File name (without extension)',
    exportSuccess: 'Export completed successfully',
    exportError: 'Export failed',
    allFields: 'All 6 domain fields will be exported (Domain, Registrar, Expires At, DNS Provider, Status Badge, Last Check Time)',
    loadingDomains: 'Loading domain data...',
    noData: 'No domain data available'
  } : {
    title: '导出数据',
    description: '选择导出格式和文件名',
    format: '导出格式',
    filename: '文件名',
    export: '导出',
    exporting: '导出中...',
    cancel: '取消',
    csvDesc: 'Excel兼容的电子表格',
    pdfDesc: '专业格式的报告（打印为PDF）',
    jsonDesc: '完整数据备份',
    filenameHelp: '文件名（不含扩展名）',
    exportSuccess: '导出成功完成',
    exportError: '导出失败',
    allFields: '将导出全部6个域名字段（域名、注册商、到期时间、DNS提供商、状态标识、最后检查时间）',
    loadingDomains: '正在加载域名数据...',
    noData: '没有可用的域名数据'
  };

  // 处理导出
  const handleExport = async () => {
    setIsLoading(true);
    
    try {
      // 1. 获取域名数据
      console.log(labels.loadingDomains);
      const domains: Domain[] = await apiService.getDomains();
      
      if (domains.length === 0) {
        alert(`⚠️ ${labels.noData}`);
        return;
      }
      
      // 2. 所有可用字段（移除通知状态、创建时间和域名状态）
      const allFields = ['domain', 'registrar', 'expiresAt', 'dnsProvider', 'status', 'lastCheck'];
      
      // 3. 使用前端导出工具
      console.log(`开始前端导出: 格式=${format}, 字段=${allFields.length}个, 域名=${domains.length}个`);
      
      const result = await FrontendExportUtils.export(
        format,
        domains,
        allFields,
        filename.trim() || 'domains',
        language,
        {
          title: language === 'en' ? 'Domain Monitoring Report' : '域名监控报告'
        }
      );
      
      if (result.success) {
        // 调用完成回调
        onExportComplete?.(result);
        
        // 显示成功消息
        console.log(labels.exportSuccess, result);
        
        // 关闭对话框
        setOpen(false);
        
        // 用户友好的成功提示
        setTimeout(() => {
          let message = `✅ ${labels.exportSuccess}\n\n`;
          message += `文件：${result.filename}\n`;
          message += `记录数：${result.totalRecords}\n`;
          message += `字段数：${result.selectedFields} (域名、注册商、到期时间、DNS提供商、状态标识、最后检查时间)`;
          
          if (format === 'pdf' && (result as any).note) {
            message += `\n\n💡 ${(result as any).note}`;
          }
          
          alert(message);
        }, 100);
      }
      
    } catch (error) {
      console.error(labels.exportError, error);
      alert(`❌ ${labels.exportError}\n\n错误详情：${error instanceof Error ? error.message : '未知错误'}\n\n请检查网络连接或刷新页面重试。`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatIcons = {
    csv: FileSpreadsheet,
    pdf: FileText,
    json: FileJson
  };

  const FormatIcon = formatIcons[format];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          {language === 'en' ? 'Export Data' : '导出数据'}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {labels.title}
          </DialogTitle>
          <DialogDescription>
            {labels.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 导出格式选择 */}
          <div className="space-y-3">
            <Label className="text-base font-medium">{labels.format}</Label>
            <RadioGroup
              value={format}
              onValueChange={(value: 'csv' | 'pdf' | 'json') => setFormat(value)}
              className="space-y-2"
            >
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="csv" id="csv" />
                <FileSpreadsheet className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <Label htmlFor="csv" className="font-medium cursor-pointer">CSV</Label>
                  <p className="text-sm text-muted-foreground">{labels.csvDesc}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="pdf" id="pdf" />
                <FileText className="h-5 w-5 text-red-600" />
                <div className="flex-1">
                  <Label htmlFor="pdf" className="font-medium cursor-pointer">PDF</Label>
                  <p className="text-sm text-muted-foreground">{labels.pdfDesc}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="json" id="json" />
                <FileJson className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <Label htmlFor="json" className="font-medium cursor-pointer">JSON</Label>
                  <p className="text-sm text-muted-foreground">{labels.jsonDesc}</p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* 前端导出优势提示 */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-800">
                {language === 'en' ? 'Client-side Export' : '前端导出'}
              </span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              📋 {labels.allFields}<br />
              {language === 'en' 
                ? '⚡ Faster processing, no server storage required' 
                : '⚡ 处理更快，无需服务器存储空间'
              }
            </p>
          </div>

          {/* 文件名设置 */}
          <div className="space-y-2">
            <Label htmlFor="filename" className="text-base font-medium">{labels.filename}</Label>
            <Input
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder={language === 'en' ? 'domains' : '域名列表'}
            />
            <p className="text-sm text-muted-foreground">{labels.filenameHelp}</p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            {labels.cancel}
          </Button>
          <Button 
            onClick={handleExport}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {labels.exporting}
              </>
            ) : (
              <>
                <FormatIcon className="h-4 w-4" />
                {labels.export}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 