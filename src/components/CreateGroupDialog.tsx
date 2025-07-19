import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { apiService } from '@/lib/api';
import { GROUP_COLORS, type GroupColor } from '@/types/group';

interface CreateGroupDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  language?: 'zh' | 'en';
}

export function CreateGroupDialog({ open, onClose, onSuccess, language = 'zh' }: CreateGroupDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<GroupColor>(GROUP_COLORS[0]);
  const [loading, setLoading] = useState(false);

  const labels = language === 'en' ? {
    title: 'Create New Group',
    description: 'Create a new group to organize your domains',
    name: 'Group Name',
    namePlaceholder: 'Enter group name',
    nameRequired: 'Group name is required',
    desc: 'Description',
    descPlaceholder: 'Enter description (optional)',
    color: 'Color',
    cancel: 'Cancel',
    create: 'Create',
    creating: 'Creating...',
    success: 'Group created successfully',
    error: 'Failed to create group'
  } : {
    title: '创建新分组',
    description: '创建新的分组来组织您的域名',
    name: '分组名称',
    namePlaceholder: '请输入分组名称',
    nameRequired: '分组名称不能为空',
    desc: '描述',
    descPlaceholder: '请输入描述（可选）',
    color: '颜色',
    cancel: '取消',
    create: '创建',
    creating: '创建中...',
    success: '分组创建成功',
    error: '创建分组失败'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert(labels.nameRequired);
      return;
    }

    try {
      setLoading(true);
      await apiService.createGroup({
        name: name.trim(),
        description: description.trim(),
        color
      });
      
      alert(labels.success);
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('创建分组失败:', error);
      alert(`${labels.error}: ${error.message || '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setColor(GROUP_COLORS[0]);
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{labels.title}</DialogTitle>
            <DialogDescription>{labels.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 分组名称 */}
            <div className="space-y-2">
              <Label htmlFor="name">{labels.name}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={labels.namePlaceholder}
                maxLength={50}
                required
              />
            </div>

            {/* 描述 */}
            <div className="space-y-2">
              <Label htmlFor="description">{labels.desc}</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={labels.descPlaceholder}
                maxLength={200}
              />
            </div>

            {/* 颜色选择 */}
            <div className="space-y-2">
              <Label>{labels.color}</Label>
              <div className="flex flex-wrap gap-2">
                {GROUP_COLORS.map((colorOption) => (
                  <button
                    key={colorOption}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      color === colorOption 
                        ? 'border-gray-900 scale-110' 
                        : 'border-gray-300 hover:border-gray-500'
                    }`}
                    style={{ backgroundColor: colorOption }}
                    onClick={() => setColor(colorOption)}
                  />
                ))}
              </div>
            </div>

            {/* 预览 */}
            <div className="space-y-2">
              <Label>{language === 'en' ? 'Preview' : '预览'}</Label>
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <div className="flex-1">
                  <div className="font-medium">{name || labels.namePlaceholder}</div>
                  {description && (
                    <div className="text-sm text-gray-600">{description}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={loading}
            >
              {labels.cancel}
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? labels.creating : labels.create}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 