import { useState, useEffect } from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiService } from '@/lib/api';
import type { Group } from '@/types/group';

interface GroupSelectorProps {
  value?: string;
  onValueChange: (groupId: string) => void;
  placeholder?: string;
  disabled?: boolean;
  includeRemoveOption?: boolean;
  language?: 'zh' | 'en';
}

export function GroupSelector({ 
  value, 
  onValueChange, 
  placeholder,
  disabled = false,
  includeRemoveOption = false,
  language = 'zh'
}: GroupSelectorProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const labels = language === 'en' ? {
    loading: 'Loading groups...',
    noGroups: 'No groups available',
    removeFromGroups: '📤 Remove from all groups'
  } : {
    loading: '加载分组中...',
    noGroups: '暂无分组',
    removeFromGroups: '📤 从所有分组移除'
  };

  useEffect(() => {
    loadGroups();
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

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder={labels.loading} />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select 
      value={value} 
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder || (language === 'en' ? 'Select a group' : '选择分组')} />
      </SelectTrigger>
      <SelectContent>
        {includeRemoveOption && (
          <SelectItem value="__remove__">
            {labels.removeFromGroups}
          </SelectItem>
        )}
        {groups.length === 0 ? (
          <SelectItem value="" disabled>
            {labels.noGroups}
          </SelectItem>
        ) : (
          groups.map((group) => (
            <SelectItem key={group.id} value={group.id}>
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: group.color }}
                />
                <span>{group.name}</span>
                {group.domainCount > 0 && (
                  <span className="text-xs text-muted-foreground ml-1">
                    ({group.domainCount})
                  </span>
                )}
              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
} 