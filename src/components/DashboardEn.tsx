import { useState, useEffect } from 'react';
import { DomainImportDialogEn } from './DomainImportDialogEn';
import { DomainTableEn } from './DomainTableEn';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { apiService } from '@/lib/api';
import type { Domain, ImportResult } from '@/types/domain';

export default function DashboardEn() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // 初始化加载域名数据
  useEffect(() => {
    const loadDomains = async () => {
      try {
        const domainData = await apiService.getDomains();
        setDomains(domainData);
      } catch (error) {
        console.error('Failed to load domains:', error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadDomains();
  }, []);

  const handleImport = async (domainNames: string[]): Promise<ImportResult> => {
    setIsLoading(true);
    
    try {
      const result = await apiService.importDomains(domainNames);
      
      // 刷新域名列表
      const updatedDomains = await apiService.getDomains();
      setDomains(updatedDomains);
      
      return result;
    } catch (error) {
      console.error('Failed to import domains:', error);
      return {
        success: [],
        errors: [`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        total: domainNames.length
      };
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleNotifications = async (domainId: string) => {
    const domain = domains.find(d => d.id === domainId);
    if (!domain) return;

    try {
      await apiService.toggleNotifications(domainId, !domain.notifications);
      
      // 更新本地状态
      setDomains(prev => prev.map(d => 
        d.id === domainId 
          ? { ...d, notifications: !d.notifications }
          : d
      ));
    } catch (error) {
      console.error('Failed to toggle notifications:', error);
    }
  };

  const handleRefreshDomain = async (domainId: string) => {
    try {
      await apiService.refreshDomain(domainId);
      
      // 刷新域名列表以获取最新数据
      const updatedDomains = await apiService.getDomains();
      setDomains(updatedDomains);
    } catch (error) {
      console.error('Failed to refresh domain:', error);
    }
  };

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    try {
      // 刷新所有域名数据
      const updatedDomains = await apiService.getDomains();
      setDomains(updatedDomains);
    } catch (error) {
      console.error('Failed to refresh domains:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const stats = {
    total: domains.length,
    normal: domains.filter(d => d.status === 'normal').length,
    expiring: domains.filter(d => d.status === 'expiring').length,
    expired: domains.filter(d => d.status === 'expired').length,
    failed: domains.filter(d => d.status === 'failed').length,
  };

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading domain data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Total Domains</div>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">{stats.normal}</div>
          <div className="text-sm text-muted-foreground">Normal</div>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-2xl font-bold text-yellow-600">{stats.expiring}</div>
          <div className="text-sm text-muted-foreground">Expiring</div>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
          <div className="text-sm text-muted-foreground">Expired</div>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-2xl font-bold text-gray-600">{stats.failed}</div>
          <div className="text-sm text-muted-foreground">Failed</div>
        </div>
      </div>

      {/* 操作栏 */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Domain List</h2>
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={handleRefreshAll}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh All'}
          </Button>
          <DomainImportDialogEn 
            onImport={handleImport}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* 域名表格 */}
      <DomainTableEn
        domains={domains}
        onToggleNotifications={handleToggleNotifications}
        onRefreshDomain={handleRefreshDomain}
      />
    </div>
  );
} 