import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Bell, BellOff, ArrowUpDown, AlertTriangle, CheckCircle2, Clock, XCircle, Circle, AlertCircle, Trash2 } from 'lucide-react';
import type { Domain } from '@/types/domain';

interface DomainTableEnProps {
  domains: Domain[];
  onToggleNotifications: (domainId: string) => void;
  onRefreshDomain: (domainId: string) => void;
  onDeleteDomains?: (domainIds: string[]) => void;
}

const statusConfig = {
  normal: { icon: CheckCircle2, label: 'Normal', variant: 'success' as const, color: 'text-white' },
  expiring: { icon: Clock, label: 'Expiring', variant: 'warning' as const, color: 'text-white' },
  expired: { icon: XCircle, label: 'Expired', variant: 'error' as const, color: 'text-white' },
  failed: { icon: AlertCircle, label: 'Query Failed', variant: 'secondary' as const, color: 'text-gray-600' },
  unregistered: { icon: Circle, label: 'Unregistered', variant: 'outline' as const, color: 'text-blue-600' },
};

const renderStatusLabel = (status: keyof typeof statusConfig) => {
  const config = statusConfig[status];
  const Icon = config.icon;
  return (
    <div className="flex items-center gap-1 min-w-[100px] justify-center">
      <Icon className={`h-3 w-3 ${config.color}`} />
      <span>{config.label}</span>
    </div>
  );
};

// 域名状态中英文翻译映射
const translateDomainStatus = (chineseStatus: string): string => {
  const statusMap: Record<string, string> = {
    '正常': 'OK',
    '禁止转移': 'Transfer Prohibited',
    '禁止更新': 'Update Prohibited', 
    '禁止删除': 'Delete Prohibited',
    '服务器禁止转移': 'Server Transfer Prohibited',
    '服务器禁止更新': 'Server Update Prohibited',
    '服务器禁止删除': 'Server Delete Prohibited',
    '非活跃状态': 'Inactive',
    '活跃': 'Active',
    '已锁定': 'Locked',
    '已过期': 'Expired',
    '待处理': 'Pending'
  };

  // 处理逗号分隔的多个状态
  if (chineseStatus.includes(',')) {
    return chineseStatus.split(',')
      .map(status => status.trim())
      .map(status => statusMap[status] || status)
      .join(', ');
  }

  return statusMap[chineseStatus] || chineseStatus;
};

export function DomainTableEn({ domains, onToggleNotifications, onRefreshDomain, onDeleteDomains }: DomainTableEnProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Domain>('expiresAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(new Set());

  const filteredDomains = domains.filter(domain =>
    domain.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
    domain.registrar?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedDomains = [...filteredDomains].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue === undefined || bValue === undefined) return 0;
    
    let comparison = 0;
    if (aValue < bValue) comparison = -1;
    if (aValue > bValue) comparison = 1;
    
    return sortDirection === 'desc' ? -comparison : comparison;
  });

  const handleSort = (field: keyof Domain) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectDomain = (domainId: string, checked: boolean) => {
    const newSelected = new Set(selectedDomains);
    if (checked) {
      newSelected.add(domainId);
    } else {
      newSelected.delete(domainId);
    }
    setSelectedDomains(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(sortedDomains.map(domain => domain.id));
      setSelectedDomains(allIds);
    } else {
      setSelectedDomains(new Set());
    }
  };

  const handleDeleteSelected = () => {
    if (selectedDomains.size > 0 && onDeleteDomains) {
      onDeleteDomains(Array.from(selectedDomains));
      setSelectedDomains(new Set());
    }
  };

  const isAllSelected = sortedDomains.length > 0 && selectedDomains.size === sortedDomains.length;
  const isIndeterminate = selectedDomains.size > 0 && selectedDomains.size < sortedDomains.length;

  const formatDate = (date: Date | undefined) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(date));
  };

  const formatRelativeTime = (date: Date | undefined) => {
    if (!date) return { text: '-', className: '', warning: false };
    const now = new Date();
    const target = new Date(date);
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let text = '';
    let className = '';
    let warning = false;
    
    if (diffDays > 0) {
      text = `in ${diffDays} days`;
      if (diffDays <= 7) {
        className = 'text-red-600 font-semibold';
        warning = true;
      } else if (diffDays <= 30) {
        className = 'text-red-600';
      } else if (diffDays <= 90) {
        className = 'text-orange-600';
      }
    } else if (diffDays === 0) {
      text = 'today';
      className = 'text-red-600 font-semibold';
      warning = true;
    } else {
      text = `${Math.abs(diffDays)} days ago`;
      className = 'text-gray-500';
    }
    
    return { text, className, warning };
  };

  const getTimeAgo = (date: Date | undefined) => {
    if (!date) return '-';
    const now = new Date();
    const target = new Date(date);
    const diffTime = now.getTime() - target.getTime();
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays} days ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hours ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minutes ago`;
    } else {
      return 'just now';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search domains or registrars..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        {selectedDomains.size > 0 && (
          <Button
            variant="destructive"
            onClick={handleDeleteSelected}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete Selected ({selectedDomains.size})
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center w-12">
                <Checkbox
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  className={isIndeterminate ? 'opacity-60' : ''}
                />
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 text-center"
                onClick={() => handleSort('domain')}
              >
                <div className="flex items-center justify-center">
                  Domain
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="text-center">Registrar</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 text-center min-w-[120px]"
                onClick={() => handleSort('expiresAt')}
              >
                <div className="flex items-center justify-center">
                  <span className="whitespace-nowrap">Expires At</span>
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="text-center">DNS Provider</TableHead>
              <TableHead className="text-center">Domain Status</TableHead>
              <TableHead className="text-center">Status Badge</TableHead>
              <TableHead className="text-center">Last Check</TableHead>
              <TableHead>Notifications</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedDomains.map((domain) => (
              <TableRow key={domain.id}>
                <TableCell className="text-center w-12">
                  <Checkbox
                    checked={selectedDomains.has(domain.id)}
                    onChange={(checked) => handleSelectDomain(domain.id, checked)}
                  />
                </TableCell>
                <TableCell className="font-medium text-center">{domain.domain}</TableCell>
                <TableCell className="text-center">{domain.registrar || '-'}</TableCell>
                <TableCell className="text-center min-w-[120px]">
                  <div className="space-y-1">
                    <div className="whitespace-nowrap">{formatDate(domain.expiresAt)}</div>
                    {domain.expiresAt && (() => {
                      const timeInfo = formatRelativeTime(domain.expiresAt);
                      return (
                        <div className={`text-xs ${timeInfo.className || 'text-muted-foreground'} flex items-center justify-center gap-1`}>
                          {timeInfo.warning && <AlertTriangle className="h-3 w-3 text-red-600" />}
                          {timeInfo.text}
                        </div>
                      );
                    })()}
                  </div>
                </TableCell>
                <TableCell className="text-center">{domain.dnsProvider || '-'}</TableCell>
                <TableCell className="max-w-[200px] truncate text-center">
                  {domain.domainStatus ? translateDomainStatus(domain.domainStatus) : '-'}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={statusConfig[domain.status].variant}>
                    {renderStatusLabel(domain.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground text-center">
                  {getTimeAgo(domain.lastCheck)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onToggleNotifications(domain.id)}
                  >
                    {domain.notifications ? (
                      <Bell className="h-4 w-4" />
                    ) : (
                      <BellOff className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {sortedDomains.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm ? 'No matching domains found' : 'No domain data'}
        </div>
      )}
    </div>
  );
} 