import { useState, useEffect } from 'react';
import { DomainImportDialog } from './DomainImportDialog';
import { DomainTable } from './DomainTable';
import { DataExportDialog } from './DataExportDialog';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { apiService } from '@/lib/api';
import type { Domain, ImportResult } from '@/types/domain';

export default function Dashboard() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRechecking, setIsRechecking] = useState(false);
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

  const handleRefreshDomain = async (domainId: string) => {
    try {
      await apiService.refreshDomain(domainId);
      
      // 刷新整个列表以获取最新数据
      const updatedDomains = await apiService.getDomains();
      setDomains(updatedDomains);
    } catch (error) {
      console.error('Failed to refresh domain:', error);
    }
  };

  const handleDeleteDomains = async (domainIds: string[]) => {
    try {
      await apiService.deleteDomains(domainIds);
      
      // 刷新整个列表
      const updatedDomains = await apiService.getDomains();
      setDomains(updatedDomains);
    } catch (error) {
      console.error('Failed to delete domains:', error);
    }
  };

  const handleRecheckAll = async () => {
    setIsRechecking(true);
    try {
      await apiService.recheckAllDomains();
      
      // 刷新域名列表以获取最新数据
      const updatedDomains = await apiService.getDomains();
      setDomains(updatedDomains);
    } catch (error) {
      console.error('Failed to recheck all domains:', error);
    } finally {
      setIsRechecking(false);
    }
  };

  const handleRefreshData = async () => {
    try {
      const updatedDomains = await apiService.getDomains();
      setDomains(updatedDomains);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  };

  // 计算统计数据
  const stats = domains.reduce((acc, domain) => {
    acc.total += 1;
    if (domain.status === 'normal') acc.normal += 1;
    else if (domain.status === 'expiring') acc.expiring += 1;
    else if (domain.status === 'expired') acc.expired += 1;
    else if (domain.status === 'failed') acc.failed += 1;
    return acc;
  }, { total: 0, normal: 0, expiring: 0, expired: 0, failed: 0 });

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">正在加载域名数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和操作按钮 */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">域名列表</h1>
          <p className="text-muted-foreground mt-2">管理和监控您的域名到期时间</p>
        </div>
        
        {/* 操作按钮 */}
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={handleRecheckAll}
            disabled={isRechecking}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRechecking ? 'animate-spin' : ''}`} />
            {isRechecking ? '重新检查中...' : '重新检查'}
          </Button>
          <DataExportDialog 
            language="zh"
            onExportComplete={(result) => {
              console.log('导出完成:', result);
            }}
          />
          <DomainImportDialog 
            onImport={handleImport}
            isLoading={isLoading}
          />
        </div>
      </div>

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

      {/* 域名表格 */}
      <div>
        <DomainTable
          domains={domains}
          onRefreshDomain={handleRefreshDomain}
          onDeleteDomains={handleDeleteDomains}
          onGroupOperationSuccess={handleRefreshData}
          language="zh"
        />
      </div>
    </div>
  );
} 