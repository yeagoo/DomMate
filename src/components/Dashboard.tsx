import { useState, useEffect } from 'react';
import { DomainImportDialog } from './DomainImportDialog';
import { DomainTable } from './DomainTable';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import type { Domain, ImportResult } from '@/types/domain';

// 模拟数据
const mockDomains: Domain[] = [
  {
    id: '1',
    domain: 'example.com',
    registrar: 'Namecheap',
    expiresAt: new Date('2024-06-15'),
    dnsProvider: 'Cloudflare',
    domainStatus: 'clientTransferProhibited',
    status: 'expiring',
    lastCheck: new Date('2024-01-15T10:30:00'),
    notifications: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    domain: 'google.com',
    registrar: 'MarkMonitor Inc.',
    expiresAt: new Date('2024-09-14'),
    dnsProvider: 'Google',
    domainStatus: 'clientDeleteProhibited clientTransferProhibited',
    status: 'normal',
    lastCheck: new Date('2024-01-15T09:15:00'),
    notifications: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '3',
    domain: 'expired-domain.com',
    registrar: 'GoDaddy',
    expiresAt: new Date('2023-12-01'),
    dnsProvider: 'GoDaddy DNS',
    domainStatus: 'pendingDelete',
    status: 'expired',
    lastCheck: new Date('2024-01-15T08:45:00'),
    notifications: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  },
];

export default function Dashboard() {
  const [domains, setDomains] = useState<Domain[]>(mockDomains);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleImport = async (domainNames: string[]): Promise<ImportResult> => {
    setIsLoading(true);
    
    // 模拟 API 调用
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const success: Domain[] = [];
    const errors: string[] = [];
    
    domainNames.forEach((domainName, index) => {
      // 简单的域名验证
      if (!/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(domainName)) {
        errors.push(`${domainName}: 无效的域名格式`);
        return;
      }
      
      // 检查是否已存在
      if (domains.some(d => d.domain === domainName)) {
        errors.push(`${domainName}: 域名已存在`);
        return;
      }
      
      success.push({
        id: Date.now().toString() + index,
        domain: domainName,
        status: 'failed', // 初始状态，需要后续查询
        notifications: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });
    
    setDomains(prev => [...prev, ...success]);
    setIsLoading(false);
    
    return { success, errors, total: domainNames.length };
  };

  const handleToggleNotifications = (domainId: string) => {
    setDomains(prev => prev.map(domain => 
      domain.id === domainId 
        ? { ...domain, notifications: !domain.notifications }
        : domain
    ));
  };

  const handleRefreshDomain = async (domainId: string) => {
    // 实际实现中会调用 WHOIS API
    console.log('Refreshing domain:', domainId);
  };

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    // 模拟批量刷新
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsRefreshing(false);
  };

  const stats = {
    total: domains.length,
    normal: domains.filter(d => d.status === 'normal').length,
    expiring: domains.filter(d => d.status === 'expiring').length,
    expired: domains.filter(d => d.status === 'expired').length,
    failed: domains.filter(d => d.status === 'failed').length,
  };

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-muted-foreground">总域名数</div>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">{stats.normal}</div>
          <div className="text-sm text-muted-foreground">正常</div>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-2xl font-bold text-yellow-600">{stats.expiring}</div>
          <div className="text-sm text-muted-foreground">即将到期</div>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
          <div className="text-sm text-muted-foreground">已过期</div>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-2xl font-bold text-gray-600">{stats.failed}</div>
          <div className="text-sm text-muted-foreground">查询失败</div>
        </div>
      </div>

      {/* 操作栏 */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">域名列表</h2>
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={handleRefreshAll}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? '刷新中...' : '刷新全部'}
          </Button>
          <DomainImportDialog 
            onImport={handleImport}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* 域名表格 */}
      <DomainTable
        domains={domains}
        onToggleNotifications={handleToggleNotifications}
        onRefreshDomain={handleRefreshDomain}
      />
    </div>
  );
} 