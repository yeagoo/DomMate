import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FolderPlus, Loader2, Users, Check } from 'lucide-react';
import { apiService } from '@/lib/api';
import type { Group } from '@/types/group';
import type { Domain } from '@/types/domain';

interface BatchGroupDialogProps {
  open: boolean;
  onClose: () => void;
  selectedDomains: string[];
  domains: Domain[];
  onSuccess: () => void;
  language?: 'zh' | 'en';
}

export function BatchGroupDialog({ 
  open, 
  onClose, 
  selectedDomains, 
  domains,
  onSuccess, 
  language = 'zh' 
}: BatchGroupDialogProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [operation, setOperation] = useState<'add' | 'remove'>('add');

  const labels = language === 'en' ? {
    title: 'Batch Group Operations',
    description: `Manage group membership for ${selectedDomains.length} selected domains`,
    operation: 'Operation',
    addToGroup: 'Add to Group',
    removeFromGroups: 'Remove from Groups',
    selectGroup: 'Select a group',
    selectedDomains: 'Selected Domains',
    cancel: 'Cancel',
    apply: 'Apply',
    processing: 'Processing...',
    loadingGroups: 'Loading groups...',
    noGroups: 'No groups available',
    success: 'Operation completed successfully',
    error: 'Operation failed',
    removeAllGroups: 'Remove from all groups'
  } : {
    title: '批量分组操作',
    description: `管理选中的 ${selectedDomains.length} 个域名的分组`,
    operation: '操作类型',
    addToGroup: '添加到分组',
    removeFromGroups: '从分组移除',
    selectGroup: '选择分组',
    selectedDomains: '选中的域名',
    cancel: '取消',
    apply: '应用',
    processing: '处理中...',
    loadingGroups: '加载分组中...',
    noGroups: '暂无分组',
    success: '操作成功完成',
    error: '操作失败',
    removeAllGroups: '从所有分组移除'
  };

  useEffect(() => {
    if (open) {
      loadGroups();
      setSelectedGroupId('');
      setOperation('add');
    }
  }, [open]);

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

  const getSelectedDomainNames = () => {
    return selectedDomains.map(id => {
      const domain = domains.find(d => d.id === id);
      return domain?.domain || id;
    });
  };

  const handleApply = async () => {
    if (!selectedGroupId && operation === 'add') {
      alert(language === 'en' ? 'Please select a group' : '请选择一个分组');
      return;
    }

    setProcessing(true);
    
    try {
      if (operation === 'add') {
        // 添加到分组
        for (const domainId of selectedDomains) {
          await apiService.addDomainToGroup(domainId, selectedGroupId);
        }
        
        const groupName = groups.find(g => g.id === selectedGroupId)?.name;
        alert(`✅ ${labels.success}\n已将 ${selectedDomains.length} 个域名添加到"${groupName}"分组`);
        
      } else if (operation === 'remove') {
        // 从分组移除 (从所有分组移除)
        for (const domainId of selectedDomains) {
          // 获取该域名的所有分组
          const domainGroups = await apiService.getDomainGroups(domainId);
          // 从每个分组中移除
          for (const group of domainGroups) {
            await apiService.removeDomainFromGroup(domainId, group.id);
          }
        }
        
        alert(`✅ ${labels.success}\n已将 ${selectedDomains.length} 个域名从所有分组中移除`);
      }
      
      onSuccess();
      onClose();
      
    } catch (error) {
      console.error('批量分组操作失败:', error);
      alert(`❌ ${labels.error}\n${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5" />
            {labels.title}
          </DialogTitle>
          <DialogDescription>
            {labels.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 操作类型选择 */}
          <div className="space-y-3">
            <Label className="text-base font-medium">{labels.operation}</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <input
                  type="radio"
                  id="add-operation"
                  name="operation"
                  value="add"
                  checked={operation === 'add'}
                  onChange={(e) => e.target.checked && setOperation('add')}
                  className="w-4 h-4"
                />
                <label htmlFor="add-operation" className="flex items-center gap-2 cursor-pointer flex-1">
                  <FolderPlus className="h-4 w-4 text-green-600" />
                  <span>{labels.addToGroup}</span>
                </label>
              </div>
              
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <input
                  type="radio"
                  id="remove-operation"
                  name="operation"
                  value="remove"
                  checked={operation === 'remove'}
                  onChange={(e) => e.target.checked && setOperation('remove')}
                  className="w-4 h-4"
                />
                <label htmlFor="remove-operation" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Users className="h-4 w-4 text-red-600" />
                  <span>{labels.removeFromGroups}</span>
                </label>
              </div>
            </div>
          </div>

          {/* 分组选择 (仅在添加到分组时显示) */}
          {operation === 'add' && (
            <div className="space-y-2">
              <Label className="text-base font-medium">{labels.selectGroup}</Label>
              {loading ? (
                <div className="flex items-center gap-2 p-3 border rounded-lg text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {labels.loadingGroups}
                </div>
              ) : groups.length === 0 ? (
                <div className="p-3 border rounded-lg text-gray-500">
                  {labels.noGroups}
                </div>
              ) : (
                <div className="space-y-1 max-h-48 overflow-y-auto border rounded-lg p-2">
                  {groups.map((group) => (
                    <div
                      key={group.id}
                      className={`flex items-center space-x-3 p-2 rounded cursor-pointer hover:bg-gray-50 ${
                        selectedGroupId === group.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => setSelectedGroupId(group.id)}
                    >
                      <input
                        type="radio"
                        name="group"
                        value={group.id}
                        checked={selectedGroupId === group.id}
                        onChange={() => setSelectedGroupId(group.id)}
                        className="w-4 h-4"
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: group.color }}
                        />
                        <span className="font-medium">{group.name}</span>
                        {group.domainCount > 0 && (
                          <span className="text-xs text-gray-500">
                            ({group.domainCount} {language === 'en' ? 'domains' : '个域名'})
                          </span>
                        )}
                      </div>
                      {selectedGroupId === group.id && (
                        <Check className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 选中域名预览 */}
          <div className="space-y-2">
            <Label className="text-base font-medium">{labels.selectedDomains}</Label>
            <div className="max-h-32 overflow-y-auto border rounded-lg p-3 bg-gray-50">
              <div className="space-y-1">
                {getSelectedDomainNames().map((domain, index) => (
                  <div key={index} className="text-sm text-gray-700">
                    • {domain}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={processing}
          >
            {labels.cancel}
          </Button>
          <Button 
            onClick={handleApply}
            disabled={processing || (operation === 'add' && !selectedGroupId)}
            className="gap-2"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {labels.processing}
              </>
            ) : (
              labels.apply
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 