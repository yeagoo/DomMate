import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Download, FileText, FileSpreadsheet, FileJson, Loader2 } from 'lucide-react';
import { apiService } from '@/lib/api';
import { FrontendExportUtils } from '@/lib/exportUtils';
import type { Group } from '@/types/group';

interface GroupExportDialogProps {
  open: boolean;
  group: Group;
  onClose: () => void;
  language?: 'zh' | 'en';
}

export function GroupExportDialog({ open, group, onClose, language = 'zh' }: GroupExportDialogProps) {
  const [format, setFormat] = useState<'csv' | 'pdf' | 'json'>('csv');
  const [filename, setFilename] = useState('');
  const [loading, setLoading] = useState(false);

  const labels = language === 'en' ? {
    title: `Export Group: ${group.name}`,
    description: `Export ${group.domainCount} domains from this group`,
    format: 'Export Format',
    filename: 'File Name',
    export: 'Export',
    exporting: 'Exporting...',
    cancel: 'Cancel',
    csvDesc: 'Excel compatible spreadsheet',
    pdfDesc: 'Professional formatted report',
    jsonDesc: 'Complete data backup',
    filenameHelp: 'File name (without extension)',
    exportSuccess: 'Group export completed successfully',
    exportError: 'Group export failed',
    noDomains: 'This group has no domains to export',
    clientExport: 'Client-side Export',
    clientExportDesc: 'Faster processing, no server storage required'
  } : {
    title: `导出分组: ${group.name}`,
    description: `导出该分组中的 ${group.domainCount} 个域名`,
    format: '导出格式',
    filename: '文件名',
    export: '导出',
    exporting: '导出中...',
    cancel: '取消',
    csvDesc: 'Excel兼容的电子表格',
    pdfDesc: '专业格式的报告',
    jsonDesc: '完整数据备份',
    filenameHelp: '文件名（不含扩展名）',
    exportSuccess: '分组导出成功完成',
    exportError: '分组导出失败',
    noDomains: '该分组没有域名可导出',
    clientExport: '前端导出',
    clientExportDesc: '处理更快，无需服务器存储空间'
  };

  // 初始化文件名
  useEffect(() => {
    if (open && group) {
      setFilename(`${group.name}_domains`);
    }
  }, [open, group]);

  const handleExport = async () => {
    if (group.domainCount === 0) {
      alert(labels.noDomains);
      return;
    }

    setLoading(true);
    
    try {
      // 获取分组中的域名数据
      console.log(`获取分组域名数据: ${group.name}`);
      const domains = await apiService.getGroupDomains(group.id);
      
      if (domains.length === 0) {
        alert(labels.noDomains);
        return;
      }
      
      // 所有可用字段
      const allFields = ['domain', 'registrar', 'expiresAt', 'dnsProvider', 'status', 'lastCheck'];
      
      // 使用前端导出工具
      console.log(`开始前端分组导出: 格式=${format}, 字段=${allFields.length}个, 域名=${domains.length}个`);
      
      const result = await FrontendExportUtils.export(
        format,
        domains,
        allFields,
        filename.trim() || `${group.name}_domains`,
        language,
        {
          title: language === 'en' ? `${group.name} Domain Report` : `${group.name} 域名报告`
        }
      );
      
      if (result.success) {
        console.log(labels.exportSuccess, result);
        
        // 显示成功消息
        setTimeout(() => {
          let message = `✅ ${labels.exportSuccess}\n\n`;
          message += `分组：${group.name}\n`;
          message += `文件：${result.filename}\n`;
          message += `记录数：${result.totalRecords}\n`;
          message += `字段数：${result.selectedFields}`;
          
          if (format === 'pdf' && (result as any).note) {
            message += `\n\n💡 ${(result as any).note}`;
          }
          
          alert(message);
        }, 100);
        
        onClose();
      }
      
    } catch (error) {
      console.error(labels.exportError, error);
      alert(`❌ ${labels.exportError}\n\n错误详情：${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  const formatIcons = {
    csv: FileSpreadsheet,
    pdf: FileText,
    json: FileJson
  };

  const FormatIcon = formatIcons[format];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
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

          {/* 分组信息 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: group.color }}
              />
              <span className="text-sm font-medium text-blue-800">{group.name}</span>
            </div>
            <p className="text-sm text-blue-700">
              📋 {language === 'en' 
                ? `Will export ${group.domainCount} domains from this group`
                : `将导出该分组中的 ${group.domainCount} 个域名`
              }
            </p>
          </div>

          {/* 前端导出优势提示 */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-800">
                {labels.clientExport}
              </span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              ⚡ {labels.clientExportDesc}
            </p>
          </div>

          {/* 文件名设置 */}
          <div className="space-y-2">
            <Label htmlFor="filename" className="text-base font-medium">{labels.filename}</Label>
            <Input
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder={`${group.name}_domains`}
            />
            <p className="text-sm text-muted-foreground">{labels.filenameHelp}</p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={loading}
          >
            {labels.cancel}
          </Button>
          <Button 
            onClick={handleExport}
            disabled={loading || group.domainCount === 0}
            className="gap-2"
          >
            {loading ? (
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