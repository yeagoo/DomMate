import { useState, useEffect } from 'react';
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
import { Search, ArrowUpDown, AlertTriangle, CheckCircle2, Clock, XCircle, Circle, AlertCircle, Trash2, FolderPlus, Tag, Filter, Star, MessageSquare } from 'lucide-react';
import { BatchGroupDialog } from './BatchGroupDialog';
import { DomainInfoDialog } from './DomainInfoDialog';
import { apiService } from '@/lib/api';
import type { Domain } from '@/types/domain';
import type { Group } from '@/types/group';

interface DomainTableEnProps {
  domains: Domain[];
  onRefreshDomain: (domainId: string) => void;
  onDeleteDomains?: (domainIds: string[]) => void;
  onGroupOperationSuccess?: () => void;
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

export function DomainTableEn({ 
  domains, 
  onRefreshDomain, 
  onDeleteDomains, 
  onGroupOperationSuccess 
}: DomainTableEnProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Domain>('expiresAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(new Set());
  const [batchGroupDialogOpen, setBatchGroupDialogOpen] = useState(false);
  
  // 内联编辑备注功能
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteValue, setEditingNoteValue] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  
  // 域名详情弹窗
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [showDomainInfo, setShowDomainInfo] = useState(false);
  
  // 分组筛选相关状态
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupDomains, setGroupDomains] = useState<Domain[]>([]);
  const [ungroupedDomains, setUngroupedDomains] = useState<Domain[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  // 加载分组数据
  useEffect(() => {
    loadGroups();
  }, []);

  // 当选择的分组改变时，加载相应的域名数据
  useEffect(() => {
    if (selectedGroupId === null) {
      // 显示所有域名
      return;
    } else if (selectedGroupId === 'ungrouped') {
      // 加载未分组域名
      loadUngroupedDomains();
    } else {
      // 加载特定分组的域名
      loadGroupDomains(selectedGroupId);
    }
  }, [selectedGroupId]);

  const loadGroups = async () => {
    setLoadingGroups(true);
    try {
      const groupsData = await apiService.getGroups();
      setGroups(groupsData);
    } catch (error) {
      console.error('Failed to load groups:', error);
    } finally {
      setLoadingGroups(false);
    }
  };

  const loadGroupDomains = async (groupId: string) => {
    try {
      const domainsData = await apiService.getGroupDomains(groupId);
      setGroupDomains(domainsData);
    } catch (error) {
      console.error('Failed to load group domains:', error);
    }
  };

  const loadUngroupedDomains = async () => {
    try {
      const domainsData = await apiService.getUngroupedDomains();
      setUngroupedDomains(domainsData);
    } catch (error) {
      console.error('Failed to load ungrouped domains:', error);
    }
  };

  // 获取当前要显示的域名列表
  const getDisplayDomains = () => {
    if (selectedGroupId === null) {
      return domains; // 显示所有域名
    } else if (selectedGroupId === 'ungrouped') {
      return ungroupedDomains; // 显示未分组域名
    } else {
      return groupDomains; // 显示特定分组的域名
    }
  };

  const displayDomains = getDisplayDomains();

  const filteredDomains = displayDomains.filter(domain =>
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

  const handleBatchGroupSuccess = () => {
    setSelectedDomains(new Set());
    setBatchGroupDialogOpen(false);
    onGroupOperationSuccess?.();
    // 重新加载当前视图的域名数据
    if (selectedGroupId === 'ungrouped') {
      loadUngroupedDomains();
    } else if (selectedGroupId !== null) {
      loadGroupDomains(selectedGroupId);
    }
  };

  const handleGroupFilterChange = (groupId: string | null) => {
    setSelectedGroupId(groupId);
    setSelectedDomains(new Set()); // 清空选择
  };

  // 内联编辑备注功能
  const handleEditNote = (domainId: string, currentNotes: string) => {
    setEditingNoteId(domainId);
    setEditingNoteValue(currentNotes || '');
  };

  const handleSaveNote = async (domainId: string) => {
    if (savingNote) return;
    
    setSavingNote(true);
    try {
      await apiService.updateDomainNotes(domainId, editingNoteValue);
      
      // 刷新域名数据以获取最新状态
      if (onGroupOperationSuccess) {
        onGroupOperationSuccess();
      }
      
      // 重置编辑状态
      setEditingNoteId(null);
      setEditingNoteValue('');
    } catch (error) {
      console.error('Failed to update notes:', error);
      // 这里可以添加错误提示
    } finally {
      setSavingNote(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingNoteValue('');
  };

  const handleNoteKeyDown = (e: React.KeyboardEvent, domainId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveNote(domainId);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  // 域名详情处理函数
  const handleShowDomainInfo = (domain: Domain) => {
    setSelectedDomain(domain);
    setShowDomainInfo(true);
  };

  const handleCloseDomainInfo = () => {
    setShowDomainInfo(false);
    setSelectedDomain(null);
  };

  // 获取当前选择的分组信息
  const getCurrentGroupInfo = () => {
    if (selectedGroupId === null) {
      return { name: 'All Domains', color: '#6B7280' };
    } else if (selectedGroupId === 'ungrouped') {
      return { name: 'Ungrouped', color: '#6B7280' };
    } else {
      const group = groups.find(g => g.id === selectedGroupId);
      return group ? { name: group.name, color: group.color } : { name: 'Unknown Group', color: '#6B7280' };
    }
  };

  const currentGroupInfo = getCurrentGroupInfo();

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
      {/* Group Filter Tags */}
      <div className="flex flex-wrap gap-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Filter className="h-4 w-4" />
          <span>Filter by Group:</span>
        </div>
        
        {/* All Domains Tag */}
        <Button
          variant={selectedGroupId === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleGroupFilterChange(null)}
          className="flex items-center gap-1 h-8"
        >
          <Tag className="h-3 w-3" />
          All Groups ({domains.length})
        </Button>

        {/* Ungrouped Tag */}
        <Button
          variant={selectedGroupId === 'ungrouped' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleGroupFilterChange('ungrouped')}
          className="flex items-center gap-1 h-8"
          disabled={loadingGroups}
        >
          <Tag className="h-3 w-3" />
          Ungrouped ({ungroupedDomains.length})
        </Button>

        {/* Group Tags */}
        {groups.map((group) => (
          <Button
            key={group.id}
            variant={selectedGroupId === group.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleGroupFilterChange(group.id)}
            className="flex items-center gap-1 h-8 relative"
            style={{
              backgroundColor: selectedGroupId === group.id ? group.color : undefined,
              borderColor: group.color,
            }}
            disabled={loadingGroups}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: group.color }}
            />
            {group.name} ({group.domainCount || 0})
          </Button>
        ))}
      </div>

      {/* Current Filter Status */}
      {selectedGroupId !== null && (
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-600 dark:text-blue-400">
              Showing: 
            </span>
            <div className="flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: currentGroupInfo.color }}
              />
              <span className="font-medium text-blue-700 dark:text-blue-300">
                {currentGroupInfo.name}
              </span>
              <span className="text-sm text-blue-600 dark:text-blue-400">
                ({filteredDomains.length} domains)
              </span>
            </div>
          </div>
        </div>
      )}

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
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setBatchGroupDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <FolderPlus className="h-4 w-4" />
              Group Operations ({selectedDomains.size})
            </Button>
            {onDeleteDomains && (
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
                className="text-center cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('domain')}
              >
                <div className="flex items-center justify-center gap-1">
                  Domain
                  <ArrowUpDown className="h-4 w-4 opacity-50" />
                </div>
              </TableHead>
              <TableHead 
                className="text-center cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('registrar')}
              >
                <div className="flex items-center justify-center gap-1">
                  Registrar
                  <ArrowUpDown className="h-4 w-4 opacity-50" />
                </div>
              </TableHead>
              <TableHead 
                className="text-center cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('expiresAt')}
              >
                <div className="flex items-center justify-center gap-1">
                  Expires At
                  <ArrowUpDown className="h-4 w-4 opacity-50" />
                </div>
              </TableHead>
              <TableHead className="text-center">DNS Provider</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 text-center"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center justify-center gap-1">
                  Status Label
                  <ArrowUpDown className="h-4 w-4 opacity-50" />
                </div>
              </TableHead>
              <TableHead className="text-center">Last Check</TableHead>
              <TableHead className="text-center">Notes</TableHead>
              <TableHead className="text-center">Actions</TableHead>
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
                <TableCell className="font-medium text-center">
                  {domain.isImportant ? (
                    <span className="flex items-center justify-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500" />
                      <span>{domain.domain}</span>
                    </span>
                  ) : (
                    <span>{domain.domain}</span>
                  )}
                </TableCell>
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
                <TableCell className="text-center">
                  <Badge variant={statusConfig[domain.status].variant}>
                    {renderStatusLabel(domain.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground text-center">
                  {getTimeAgo(domain.lastCheck)}
                </TableCell>
                <TableCell className="text-center max-w-[120px]">
                  {editingNoteId === domain.id ? (
                    // 编辑模式
                    <div className="flex items-center gap-2">
                      <Input
                        value={editingNoteValue}
                        onChange={(e) => setEditingNoteValue(e.target.value)}
                        onKeyDown={(e) => handleNoteKeyDown(e, domain.id)}
                        onBlur={() => handleSaveNote(domain.id)}
                        placeholder="Enter notes..."
                        className="h-8 text-xs"
                        disabled={savingNote}
                        autoFocus
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancelEdit}
                        className="h-6 w-6 p-0"
                        disabled={savingNote}
                      >
                        ×
                      </Button>
                    </div>
                  ) : (
                    // 显示模式
                    <div 
                      className="cursor-pointer hover:bg-muted/30 rounded px-2 py-1 min-h-[32px] flex items-center justify-center"
                      onClick={() => handleEditNote(domain.id, domain.notes || '')}
                      title={domain.notes ? `${domain.notes} (Click to edit)` : 'Click to add notes'}
                    >
                      {domain.notes ? (
                        <span className="text-sm text-blue-600 truncate max-w-[100px]" title={domain.notes}>
                          {domain.notes.length > 6 ? `${domain.notes.substring(0, 6)}...` : domain.notes}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">+ Add notes</span>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShowDomainInfo(domain)}
                    className="text-xs px-2 h-7"
                  >
                    More Info
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

      {/* Batch Group Operations Dialog */}
      <BatchGroupDialog
        open={batchGroupDialogOpen}
        onClose={() => setBatchGroupDialogOpen(false)}
        selectedDomains={Array.from(selectedDomains)}
        domains={domains}
        onSuccess={handleBatchGroupSuccess}
        language="en"
      />

      {/* Domain Information Dialog */}
      <DomainInfoDialog
        open={showDomainInfo}
        onClose={handleCloseDomainInfo}
        domain={selectedDomain}
        language="en"
      />
    </div>
  );
} 