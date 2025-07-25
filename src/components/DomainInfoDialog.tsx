import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Calendar, Globe, Shield, Building, Clock, Star, FileText } from 'lucide-react';
import type { Domain, DomainStatus } from '@/types/domain';
import { useState } from 'react';

interface DomainInfoDialogProps {
  domain: Domain | null;
  open: boolean;
  onClose: () => void;
  language?: 'zh' | 'en';
}

export function DomainInfoDialog({ domain, open, onClose, language = 'zh' }: DomainInfoDialogProps) {
  const [copied, setCopied] = useState(false);

  if (!domain) return null;

  const labels = language === 'en' ? {
    title: 'Domain Information',
    basicInfo: 'Basic Information',
    domainName: 'Domain Name',
    registrar: 'Registrar', 
    registeredAt: 'Registered At',
    expiresAt: 'Expires At',
    lastUpdated: 'Last Updated',
    technicalInfo: 'Technical Information',
    dnsProvider: 'DNS Provider',
    domainStatus: 'Domain Status',
    status: 'Status',
    additionalInfo: 'Additional Information',
    isImportant: 'Important',
    notes: 'Notes',
    lastCheck: 'Last Check',
    createdAt: 'Added At',
    copy: 'Copy',
    copied: 'Copied!',
    yes: 'Yes',
    no: 'No',
    none: 'None',
    unknown: 'Unknown'
  } : {
    title: '域名信息',
    basicInfo: '基本信息',
    domainName: '域名',
    registrar: '注册商',
    registeredAt: '注册时间',
    expiresAt: '到期时间',
    lastUpdated: '最后更新',
    technicalInfo: '技术信息',
    dnsProvider: 'DNS 提供商',
    domainStatus: '域名状态',
    status: '状态',
    additionalInfo: '附加信息',
    isImportant: '重要域名',
    notes: '备注',
    lastCheck: '最后检查',
    createdAt: '添加时间',
    copy: '复制',
    copied: '已复制！',
    yes: '是',
    no: '否',
    none: '无',
    unknown: '未知'
  };

  const statusConfig: Record<DomainStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string, color: string }> = {
    normal: { variant: 'default', label: language === 'en' ? 'Normal' : '正常', color: 'text-green-600' },
    expiring: { variant: 'destructive', label: language === 'en' ? 'Expiring' : '即将到期', color: 'text-orange-600' },
    expired: { variant: 'destructive', label: language === 'en' ? 'Expired' : '已过期', color: 'text-red-600' },
    failed: { variant: 'outline', label: language === 'en' ? 'Check Failed' : '检查失败', color: 'text-gray-600' },
    unregistered: { variant: 'secondary', label: language === 'en' ? 'Unregistered' : '未注册', color: 'text-blue-600' }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return labels.unknown;
    const d = new Date(date);
    return d.toLocaleString(language === 'en' ? 'en-US' : 'zh-CN');
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const InfoRow = ({ icon: Icon, label, value, copyable = false }: { 
    icon: any, 
    label: string, 
    value: string | null | undefined, 
    copyable?: boolean 
  }) => (
    <div className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-700">{label}</div>
        <div className="text-sm text-gray-900 break-words flex items-center gap-2">
          <span>{value || labels.none}</span>
          {copyable && value && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(value)}
              className="h-6 w-6 p-0"
              title={labels.copy}
            >
              <Copy className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {labels.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* 基本信息 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Building className="h-4 w-4" />
              {labels.basicInfo}
            </h3>
            <div className="space-y-1">
              <InfoRow 
                icon={Globe} 
                label={labels.domainName} 
                value={domain.domain} 
                copyable 
              />
              <InfoRow 
                icon={Building} 
                label={labels.registrar} 
                value={domain.registrar} 
              />
              <InfoRow 
                icon={Calendar} 
                label={labels.expiresAt} 
                value={formatDate(domain.expiresAt)} 
              />
              <InfoRow 
                icon={Clock} 
                label={labels.lastUpdated} 
                value={formatDate(domain.updatedAt)} 
              />
            </div>
          </div>

          {/* 技术信息 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {labels.technicalInfo}
            </h3>
            <div className="space-y-1">
              <InfoRow 
                icon={Globe} 
                label={labels.dnsProvider} 
                value={domain.dnsProvider} 
              />
              <InfoRow 
                icon={Shield} 
                label={labels.domainStatus} 
                value={domain.domainStatus} 
              />
              <div className="flex items-start gap-3 py-2 border-b border-gray-100">
                <Shield className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-700">{labels.status}</div>
                  <div className="mt-1">
                    <Badge variant={statusConfig[domain.status].variant}>
                      {statusConfig[domain.status].label}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 附加信息 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {labels.additionalInfo}
            </h3>
            <div className="space-y-1">
              <div className="flex items-start gap-3 py-2 border-b border-gray-100">
                <Star className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-700">{labels.isImportant}</div>
                  <div className="text-sm text-gray-900 flex items-center gap-2">
                    {domain.isImportant ? (
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        {labels.yes}
                      </span>
                    ) : (
                      <span>{labels.no}</span>
                    )}
                  </div>
                </div>
              </div>
              <InfoRow 
                icon={FileText} 
                label={labels.notes} 
                value={domain.notes || labels.none} 
              />
              <InfoRow 
                icon={Clock} 
                label={labels.lastCheck} 
                value={formatDate(domain.lastCheck)} 
              />
              <InfoRow 
                icon={Calendar} 
                label={labels.createdAt} 
                value={formatDate(domain.createdAt)} 
              />
            </div>
          </div>
        </div>

        {/* 复制成功提示 */}
        {copied && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-3 py-2 rounded-md text-sm">
            {labels.copied}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 