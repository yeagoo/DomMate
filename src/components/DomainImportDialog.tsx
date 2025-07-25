import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Plus, Download } from 'lucide-react';
import type { ImportResult } from '@/types/domain';

interface DomainImportDialogProps {
  onImport: (domains: string[]) => Promise<ImportResult>;
  isLoading?: boolean;
}

export function DomainImportDialog({ onImport, isLoading = false }: DomainImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [lineInput, setLineInput] = useState('');
  const [stringInput, setStringInput] = useState('');
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState('lines');

  const handleImport = async () => {
    let domains: string[] = [];

    switch (activeTab) {
      case 'lines':
        domains = lineInput
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);
        break;
      case 'string':
        domains = stringInput
          .split(',')
          .map(domain => domain.trim())
          .filter(domain => domain.length > 0);
        break;
      case 'file':
        if (fileInput) {
          const text = await fileInput.text();
          if (fileInput.name.endsWith('.csv')) {
            // 简单的 CSV 解析
            domains = text
              .split('\n')
              .slice(1) // 跳过标题行
              .map(line => line.split(',')[0])
              .map(domain => domain.trim().replace(/"/g, ''))
              .filter(domain => domain.length > 0);
          } else {
            domains = text
              .split('\n')
              .map(line => line.trim())
              .filter(line => line.length > 0);
          }
        }
        break;
    }

    if (domains.length > 0) {
      await onImport(domains);
      setOpen(false);
      // 清理输入
      setLineInput('');
      setStringInput('');
      setFileInput(null);
    }
  };

  const downloadTemplate = () => {
    const csvContent = "domain\nexample.com\ngoogle.com\ngithub.com";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'domain-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          添加域名
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>导入域名</DialogTitle>
          <DialogDescription>
            选择导入方式来批量添加需要监控的域名
          </DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="lines">按行粘贴</TabsTrigger>
            <TabsTrigger value="file">文件导入</TabsTrigger>
            <TabsTrigger value="string">字符串导入</TabsTrigger>
          </TabsList>
          
          <TabsContent value="lines" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">域名列表（每行一个）</label>
              <Textarea
                placeholder="example.com&#10;google.com&#10;github.com"
                value={lineInput}
                onChange={(e) => setLineInput(e.target.value)}
                rows={8}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="file" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">上传文件</label>
              <div className="flex items-center space-x-2">
                <Input
                  type="file"
                  accept=".csv,.txt"
                  onChange={(e) => setFileInput(e.target.files?.[0] || null)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={downloadTemplate}
                >
                  <Download className="h-4 w-4 mr-2" />
                  下载模板
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                支持 CSV 和 TXT 格式。CSV 文件请确保域名在第一列。
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="string" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">域名字符串（逗号分隔）</label>
              <Input
                placeholder="example.com, google.com, github.com"
                value={stringInput}
                onChange={(e) => setStringInput(e.target.value)}
              />
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button onClick={handleImport} disabled={isLoading}>
            {isLoading ? '导入中...' : '导入域名'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 