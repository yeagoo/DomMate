import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Star, StarOff, MessageSquare, Loader2, Users, Check, AlertCircle } from 'lucide-react';
import { apiService } from '@/lib/api';
import type { Domain } from '@/types/domain';

interface BatchOperationDialogProps {
  open: boolean;
  onClose: () => void;
  selectedDomains: string[];
  domains: Domain[];
  onSuccess: () => void;
  language?: 'zh' | 'en';
}

type OperationType = 'mark-important' | 'unmark-important' | 'add-notes' | 'clear-notes';

export function BatchOperationDialog({ 
  open, 
  onClose, 
  selectedDomains, 
  domains,
  onSuccess, 
  language = 'zh' 
}: BatchOperationDialogProps) {
  const [processing, setProcessing] = useState(false);
  const [operation, setOperation] = useState<OperationType>('mark-important');
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const labels = language === 'en' ? {
    title: 'Batch Operations',
    description: `Perform operations on ${selectedDomains.length} selected domains`,
    operation: 'Operation Type',
    markImportant: 'Mark as Important',
    unmarkImportant: 'Unmark as Important',
    addNotes: 'Add Notes',
    clearNotes: 'Clear Notes',
    notesLabel: 'Notes Content',
    notesPlaceholder: 'Enter notes for selected domains...',
    selectedDomains: 'Selected Domains',
    cancel: 'Cancel',
    apply: 'Apply',
    processing: 'Processing...',
    success: 'Operation completed successfully',
    error: 'Operation failed',
    close: 'Close'
  } : {
    title: '批量操作',
    description: `对选中的 ${selectedDomains.length} 个域名执行操作`,
    operation: '操作类型',
    markImportant: '标记为重要',
    unmarkImportant: '取消重要标记',
    addNotes: '添加备注',
    clearNotes: '清除备注',
    notesLabel: '备注内容',
    notesPlaceholder: '为选中的域名输入备注...',
    selectedDomains: '选中的域名',
    cancel: '取消',
    apply: '应用',
    processing: '处理中...',
    success: '操作成功完成',
    error: '操作失败',
    close: '关闭'
  };

  const resetDialog = () => {
    setOperation('mark-important');
    setNotes('');
    setResult(null);
  };

  const handleClose = () => {
    resetDialog();
    onClose();
  };

  const handleApply = async () => {
    if ((operation === 'add-notes' && !notes.trim())) {
      return;
    }

    setProcessing(true);
    setResult(null);

    try {
      let response;
      
      if (operation === 'mark-important' || operation === 'unmark-important') {
        const isImportant = operation === 'mark-important';
        response = await apiService.batchMarkImportant(selectedDomains, isImportant);
      } else if (operation === 'add-notes' || operation === 'clear-notes') {
        const notesContent = operation === 'add-notes' ? notes.trim() : '';
        response = await apiService.batchAddNotes(selectedDomains, notesContent);
      }

      if (response?.success) {
        setResult({ success: true, message: response.message });
        onSuccess();
        // 2秒后自动关闭
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        setResult({ success: false, message: response?.message || labels.error });
      }
    } catch (error) {
      console.error('批量操作失败:', error);
      setResult({ 
        success: false, 
        message: error instanceof Error ? error.message : labels.error 
      });
    } finally {
      setProcessing(false);
    }
  };

  const getSelectedDomainNames = () => {
    return selectedDomains
      .map(id => domains.find(d => d.id === id)?.domain)
      .filter(Boolean)
      .slice(0, 5); // 只显示前5个
  };

  const selectedDomainNames = getSelectedDomainNames();
  const hasMoreDomains = selectedDomains.length > 5;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {labels.title}
          </DialogTitle>
          <DialogDescription>
            {labels.description}
          </DialogDescription>
        </DialogHeader>

        {!result && (
          <div className="space-y-4 py-4">
            {/* 操作类型选择 */}
            <div className="space-y-3">
              <Label className="text-base font-medium">{labels.operation}</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <input
                    type="radio"
                    id="mark-important"
                    name="operation"
                    value="mark-important"
                    checked={operation === 'mark-important'}
                    onChange={(e) => e.target.checked && setOperation('mark-important')}
                    className="w-4 h-4"
                  />
                  <label htmlFor="mark-important" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span>{labels.markImportant}</span>
                  </label>
                </div>

                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <input
                    type="radio"
                    id="unmark-important"
                    name="operation"
                    value="unmark-important"
                    checked={operation === 'unmark-important'}
                    onChange={(e) => e.target.checked && setOperation('unmark-important')}
                    className="w-4 h-4"
                  />
                  <label htmlFor="unmark-important" className="flex items-center gap-2 cursor-pointer flex-1">
                    <StarOff className="h-4 w-4 text-gray-500" />
                    <span>{labels.unmarkImportant}</span>
                  </label>
                </div>

                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <input
                    type="radio"
                    id="add-notes"
                    name="operation"
                    value="add-notes"
                    checked={operation === 'add-notes'}
                    onChange={(e) => e.target.checked && setOperation('add-notes')}
                    className="w-4 h-4"
                  />
                  <label htmlFor="add-notes" className="flex items-center gap-2 cursor-pointer flex-1">
                    <MessageSquare className="h-4 w-4 text-blue-500" />
                    <span>{labels.addNotes}</span>
                  </label>
                </div>

                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <input
                    type="radio"
                    id="clear-notes"
                    name="operation"
                    value="clear-notes"
                    checked={operation === 'clear-notes'}
                    onChange={(e) => e.target.checked && setOperation('clear-notes')}
                    className="w-4 h-4"
                  />
                  <label htmlFor="clear-notes" className="flex items-center gap-2 cursor-pointer flex-1">
                    <MessageSquare className="h-4 w-4 text-red-500" />
                    <span>{labels.clearNotes}</span>
                  </label>
                </div>
              </div>
            </div>

            {/* 备注输入 */}
            {operation === 'add-notes' && (
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-base font-medium">{labels.notesLabel}</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={labels.notesPlaceholder}
                  className="min-h-[80px]"
                />
              </div>
            )}

            {/* 选中的域名预览 */}
            <div className="space-y-2">
              <Label className="text-base font-medium">{labels.selectedDomains}</Label>
              <div className="p-3 bg-muted rounded-lg max-h-32 overflow-y-auto">
                <div className="text-sm space-y-1">
                  {selectedDomainNames.map((domain) => (
                    <div key={domain} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>{domain}</span>
                    </div>
                  ))}
                  {hasMoreDomains && (
                    <div className="text-muted-foreground italic">
                      {language === 'en' ? `... and ${selectedDomains.length - 5} more` : `... 还有 ${selectedDomains.length - 5} 个`}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 结果显示 */}
        {result && (
          <div className="py-4">
            <div className={`flex items-center gap-3 p-4 rounded-lg ${
              result.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {result.success ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <div>
                <p className="font-medium">{result.success ? labels.success : labels.error}</p>
                <p className="text-sm mt-1">{result.message}</p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {!result ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                {labels.cancel}
              </Button>
              <Button 
                onClick={handleApply}
                disabled={processing || (operation === 'add-notes' && !notes.trim())}
              >
                {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {labels.apply}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose} variant="outline">
              {labels.close}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 