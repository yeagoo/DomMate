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
import { Search, ArrowUpDown, AlertTriangle, CheckCircle2, Clock, XCircle, Circle, AlertCircle, Trash2, FolderPlus, Tag, Filter, Star, MessageSquare, Settings } from 'lucide-react';
import { BatchGroupDialog } from './BatchGroupDialog';
import { BatchOperationDialog } from './BatchOperationDialog';
import { DomainInfoDialog } from './DomainInfoDialog';
import { apiService } from '@/lib/api';
import type { Domain, DomainStatus } from '@/types/domain';
import type { Group } from '@/types/group';

interface DomainTableProps {
  domains: Domain[];
  onRefreshDomain: (domainId: string) => void;
  onDeleteDomains?: (domainIds: string[]) => void;
  onGroupOperationSuccess?: () => void;
  language?: 'zh' | 'en';
}

const statusConfig = {
  normal: { icon: CheckCircle2, label: '正常', variant: 'success' as const, color: 'text-white' },
  expiring: { icon: Clock, label: '即将到期', variant: 'warning' as const, color: 'text-white' },
  expired: { icon: XCircle, label: '已过期', variant: 'error' as const, color: 'text-white' },
  failed: { icon: AlertCircle, label: '查询失败', variant: 'secondary' as const, color: 'text-gray-600' },
  unregistered: { icon: Circle, label: '未注册', variant: 'outline' as const, color: 'text-blue-600' },
};

const renderStatusLabel = (status: keyof typeof statusConfig) => {
  const config = statusConfig[status];
  const Icon = config.icon;
  return (
    <div className="flex items-center gap-1 min-w-[80px] justify-center">
      <Icon className={`h-3 w-3 ${config.color}`} />
      <span>{config.label}</span>
    </div>
  );
};

export function DomainTable({ 
  domains, 
  onRefreshDomain, 
  onDeleteDomains, 
  onGroupOperationSuccess,
  language = 'zh'
}: DomainTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Domain>('expiresAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(new Set());
  const [batchGroupDialogOpen, setBatchGroupDialogOpen] = useState(false);
  const [batchOperationDialogOpen, setBatchOperationDialogOpen] = useState(false);
  
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
    if (onGroupOperationSuccess) {
      onGroupOperationSuccess();
    }
    
    // 重新加载当前视图的数据
    if (selectedGroupId === 'ungrouped') {
      loadUngroupedDomains();
    } else if (selectedGroupId && selectedGroupId !== null) {
      loadGroupDomains(selectedGroupId);
    }
  };

  const handleBatchOperationSuccess = () => {
    setSelectedDomains(new Set());
    setBatchOperationDialogOpen(false);
    if (onGroupOperationSuccess) {
      onGroupOperationSuccess();
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
      console.error('更新备注失败:', error);
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
      return { name: '全部域名', color: '#6B7280' };
    } else if (selectedGroupId === 'ungrouped') {
      return { name: '未分组', color: '#6B7280' };
    } else {
      const group = groups.find(g => g.id === selectedGroupId);
      return group ? { name: group.name, color: group.color } : { name: '未知分组', color: '#6B7280' };
    }
  };

  const currentGroupInfo = getCurrentGroupInfo();

  const labels = language === 'en' ? {
    searchPlaceholder: 'Search domains or registrars...',
    domain: 'Domain',
    registrar: 'Registrar', 
    registeredAt: 'Registered',
    expiresAt: 'Expires',
    status: 'Status',
    actions: 'Actions',
    deleteSelected: 'Delete Selected',
    groupOperation: 'Group Operations',
    allGroups: 'All Groups',
    ungrouped: 'Ungrouped',
    filterByGroup: 'Filter by Group',
    dnsProvider: 'DNS Provider',
    domainStatus: 'Domain Status',
    statusLabel: 'Status Label',
    lastCheck: 'Last Check',
    batchOperations: 'Batch Operations',
    important: 'Important',
    notes: 'Notes'
  } : {
    searchPlaceholder: '搜索域名或注册商...',
    domain: '域名',
    registrar: '注册商',
    registeredAt: '注册时间',
    expiresAt: '到期时间',
    status: '状态',
    actions: '操作',
    deleteSelected: '删除选中',
    groupOperation: '分组操作',
    allGroups: '所有分组',
    ungrouped: '未分组',
    filterByGroup: '按分组筛选',
    dnsProvider: 'DNS提供商',
    domainStatus: '域名状态',
    statusLabel: '状态标识',
    lastCheck: '最后检查',
    batchOperations: '批量操作',
    important: '重要性',
    notes: '备注'
  };

  const isAllSelected = sortedDomains.length > 0 && selectedDomains.size === sortedDomains.length;
  const isIndeterminate = selectedDomains.size > 0 && selectedDomains.size < sortedDomains.length;

  const formatDate = (date: Date | undefined) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('zh-CN', {
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
      text = `${diffDays} 天后`;
      if (diffDays <= 7) {
        className = 'text-red-600 font-semibold';
        warning = true;
      } else if (diffDays <= 30) {
        className = 'text-red-600';
      } else if (diffDays <= 90) {
        className = 'text-orange-600';
      }
    } else if (diffDays === 0) {
      text = '今天';
      className = 'text-red-600 font-semibold';
      warning = true;
    } else {
      text = `${Math.abs(diffDays)} 天前`;
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
      return `${diffDays} 天前`;
    } else if (diffHours > 0) {
      return `${diffHours} 小时前`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} 分钟前`;
    } else {
      return '刚刚';
    }
  };

  return (
    <div className="space-y-4">
      {/* 分组筛选标签 */}
      <div className="flex flex-wrap gap-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Filter className="h-4 w-4" />
          <span>{labels.filterByGroup}:</span>
        </div>
        
        {/* 全部域名标签 */}
        <Button
          variant={selectedGroupId === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleGroupFilterChange(null)}
          className="flex items-center gap-1 h-8"
        >
          <Tag className="h-3 w-3" />
          {labels.allGroups} ({domains.length})
        </Button>

        {/* 未分组标签 */}
        <Button
          variant={selectedGroupId === 'ungrouped' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleGroupFilterChange('ungrouped')}
          className="flex items-center gap-1 h-8"
          disabled={loadingGroups}
        >
          <Tag className="h-3 w-3" />
          {labels.ungrouped} ({ungroupedDomains.length})
        </Button>

        {/* 分组标签 */}
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

      {/* 当前筛选状态显示 */}
      {selectedGroupId !== null && (
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-600 dark:text-blue-400">
              正在显示: 
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
                ({filteredDomains.length} 个域名)
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={labels.searchPlaceholder}
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
              {labels.groupOperation} ({selectedDomains.size})
            </Button>
            <Button
              variant="outline"
              onClick={() => setBatchOperationDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              {labels.batchOperations} ({selectedDomains.size})
            </Button>
            {onDeleteDomains && (
              <Button
                variant="destructive"
                onClick={handleDeleteSelected}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {labels.deleteSelected} ({selectedDomains.size})
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
                className="cursor-pointer hover:bg-muted/50 text-center"
                onClick={() => handleSort('domain')}
              >
                <div className="flex items-center justify-center">
                  {labels.domain}
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="text-center">{labels.registrar}</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 text-center min-w-[140px]"
                onClick={() => handleSort('expiresAt')}
              >
                <div className="flex items-center justify-center">
                  {labels.expiresAt}
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="text-center">{labels.dnsProvider}</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 text-center"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center justify-center">
                  {labels.statusLabel}
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="text-center">{labels.lastCheck}</TableHead>
              <TableHead className="text-center">{labels.notes}</TableHead>
              <TableHead className="text-center">操作</TableHead>
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
                <TableCell className="text-center min-w-[140px]">
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
                        placeholder={language === 'en' ? 'Enter notes...' : '输入备注...'}
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
                      title={domain.notes ? `${domain.notes} (点击编辑)` : '点击添加备注'}
                    >
                      {domain.notes ? (
                        <span className="text-sm text-blue-600 truncate max-w-[100px]" title={domain.notes}>
                          {domain.notes.length > 6 ? `${domain.notes.substring(0, 6)}...` : domain.notes}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">+ 添加备注</span>
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
                    更多信息
                  </Button>
                </TableCell>

              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {sortedDomains.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm ? '没有找到匹配的域名' : '暂无域名数据'}
        </div>
      )}

      {/* 批量分组操作对话框 */}
      <BatchGroupDialog
        open={batchGroupDialogOpen}
        onClose={() => setBatchGroupDialogOpen(false)}
        selectedDomains={Array.from(selectedDomains)}
        domains={domains}
        onSuccess={handleBatchGroupSuccess}
        language={language}
      />
      
      {/* 批量操作对话框 */}
      <BatchOperationDialog
        open={batchOperationDialogOpen}
        onClose={() => setBatchOperationDialogOpen(false)}
        selectedDomains={Array.from(selectedDomains)}
        domains={domains}
        onSuccess={() => {
          setSelectedDomains(new Set());
          setBatchOperationDialogOpen(false);
          if (onGroupOperationSuccess) {
            onGroupOperationSuccess();
          }
        }}
        language={language}
      />

      {/* 域名详情弹窗 */}
      <DomainInfoDialog
        open={showDomainInfo}
        onClose={handleCloseDomainInfo}
        domain={selectedDomain}
        language={language}
      />
    </div>
  );
} 