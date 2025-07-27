import { useState, useEffect } from 'react';
import { Plus, Folder, Settings, Trash2, Edit, BarChart3, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiService } from '@/lib/api';
import type { Group, GroupStats } from '@/types/group';
import { CreateGroupDialog } from './CreateGroupDialog';
import { EditGroupDialog } from './EditGroupDialog';
import { GroupExportDialog } from './GroupExportDialog';

interface GroupManagementProps {
  language?: 'zh' | 'en';
}

export function GroupManagement({ language = 'zh' }: GroupManagementProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupStats, setGroupStats] = useState<GroupStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [exportingGroup, setExportingGroup] = useState<Group | null>(null);

  const labels = language === 'en' ? {
    title: 'Group Management',
    description: 'Organize and manage your domain groups',
    createGroup: 'Create Group',
    editGroup: 'Edit Group',
    deleteGroup: 'Delete Group',
    exportGroup: 'Export Group',
    viewStats: 'View Statistics',
    domains: 'domains',
    noDomains: 'No domains',
    defaultGroups: 'System Groups',
    customGroups: 'Custom Groups',
    loading: 'Loading groups...',
    deleteConfirm: 'Are you sure you want to delete this group? This action cannot be undone.',
    deleteSuccess: 'Group deleted successfully',
    deleteError: 'Failed to delete group',
    systemGroupError: 'Cannot delete system default groups'
  } : {
    title: '分组管理',
    description: '组织和管理您的域名分组',
    createGroup: '创建分组',
    editGroup: '编辑分组',
    deleteGroup: '删除分组',
    exportGroup: '导出分组',
    viewStats: '查看统计',
    domains: '个域名',
    noDomains: '暂无域名',
    defaultGroups: '系统分组',
    customGroups: '自定义分组',
    loading: '加载分组中...',
    deleteConfirm: '确定要删除这个分组吗？此操作不可撤销。',
    deleteSuccess: '分组删除成功',
    deleteError: '删除分组失败',
    systemGroupError: '无法删除系统默认分组'
  };

  useEffect(() => {
    loadGroups();
    loadGroupStats();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const data = await apiService.getGroups();
      setGroups(data);
    } catch (error) {
      console.error('获取分组失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGroupStats = async () => {
    try {
      const stats = await apiService.getGroupStats();
      setGroupStats(stats);
    } catch (error) {
      console.error('获取分组统计失败:', error);
    }
  };

  const handleDeleteGroup = async (group: Group) => {
    // 检查是否为系统默认分组
    const systemGroups = ['default', 'important', 'development'];
    if (systemGroups.includes(group.id)) {
      alert(labels.systemGroupError);
      return;
    }

    if (confirm(labels.deleteConfirm)) {
      try {
        await apiService.deleteGroup(group.id);
        alert(labels.deleteSuccess);
        loadGroups();
        loadGroupStats();
      } catch (error: any) {
        console.error('删除分组失败:', error);
        alert(`${labels.deleteError}: ${error.message || '未知错误'}`);
      }
    }
  };

  const handleGroupCreated = () => {
    loadGroups();
    loadGroupStats();
    setCreateDialogOpen(false);
  };

  const handleGroupUpdated = () => {
    loadGroups();
    loadGroupStats();
    setEditingGroup(null);
  };

  // 分离系统分组和自定义分组
  const systemGroups = groups.filter(g => ['default', 'important', 'development'].includes(g.id));
  const customGroups = groups.filter(g => !['default', 'important', 'development'].includes(g.id));

  // 获取分组的统计信息
  const getGroupStatsById = (groupId: string) => {
    return groupStats.find(s => s.id === groupId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">{labels.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{labels.title}</h1>
          <p className="text-gray-600">{labels.description}</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          {labels.createGroup}
        </Button>
      </div>

      {/* 系统分组 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-800">{labels.defaultGroups}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {systemGroups.map((group) => {
            const stats = getGroupStatsById(group.id);
            return (
              <GroupCard
                key={group.id}
                group={group}
                stats={stats}
                isSystemGroup={true}
                language={language}
                labels={labels}
                onEdit={() => setEditingGroup(group)}
                onDelete={() => handleDeleteGroup(group)}
                onExport={() => setExportingGroup(group)}
              />
            );
          })}
        </div>
      </div>

      {/* 自定义分组 */}
      {customGroups.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Folder className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-800">{labels.customGroups}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customGroups.map((group) => {
              const stats = getGroupStatsById(group.id);
              return (
                <GroupCard
                  key={group.id}
                  group={group}
                  stats={stats}
                  isSystemGroup={false}
                  language={language}
                  labels={labels}
                  onEdit={() => setEditingGroup(group)}
                  onDelete={() => handleDeleteGroup(group)}
                  onExport={() => setExportingGroup(group)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* 对话框 */}
      <CreateGroupDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={handleGroupCreated}
        language={language}
      />

      {editingGroup && (
        <EditGroupDialog
          open={true}
          group={editingGroup}
          onClose={() => setEditingGroup(null)}
          onSuccess={handleGroupUpdated}
          language={language}
        />
      )}

      {exportingGroup && (
        <GroupExportDialog
          open={true}
          group={exportingGroup}
          onClose={() => setExportingGroup(null)}
          language={language}
        />
      )}
    </div>
  );
}

// 分组卡片组件
interface GroupCardProps {
  group: Group;
  stats?: GroupStats;
  isSystemGroup: boolean;
  language: 'zh' | 'en';
  labels: any;
  onEdit: () => void;
  onDelete: () => void;
  onExport: () => void;
}

function GroupCard({ group, stats, isSystemGroup, language, labels, onEdit, onDelete, onExport }: GroupCardProps) {
  const statusCounts = {
    normal: stats?.normalCount || 0,
    expiring: stats?.expiringCount || 0,
    expired: stats?.expiredCount || 0,
    failed: stats?.failedCount || 0,
  };

  return (
    <Card className="relative group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div 
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: group.color }}
            />
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg truncate">{group.name}</CardTitle>
              {group.description && (
                <CardDescription className="text-sm truncate">
                  {group.description}
                </CardDescription>
              )}
            </div>
          </div>
          
          {/* 操作按钮 */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Edit className="h-3 w-3" />
            </Button>
            {group.domainCount > 0 && (
              <Button variant="ghost" size="sm" onClick={onExport}>
                <Download className="h-3 w-3" />
              </Button>
            )}
            {!isSystemGroup && (
              <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-600 hover:text-red-700">
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* 域名数量 */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{language === 'en' ? 'Domains' : '域名数量'}</span>
            <Badge variant="secondary">
              {group.domainCount > 0 ? `${group.domainCount} ${labels.domains}` : labels.noDomains}
            </Badge>
          </div>

          {/* 状态统计 */}
          {group.domainCount > 0 && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              {statusCounts.normal > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-green-600">{language === 'en' ? 'Normal' : '正常'}</span>
                  <span className="font-medium">{statusCounts.normal}</span>
                </div>
              )}
              {statusCounts.expiring > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-yellow-600">{language === 'en' ? 'Expiring' : '即将到期'}</span>
                  <span className="font-medium">{statusCounts.expiring}</span>
                </div>
              )}
              {statusCounts.expired > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-red-600">{language === 'en' ? 'Expired' : '已过期'}</span>
                  <span className="font-medium">{statusCounts.expired}</span>
                </div>
              )}
              {statusCounts.failed > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{language === 'en' ? 'Failed' : '失败'}</span>
                  <span className="font-medium">{statusCounts.failed}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 