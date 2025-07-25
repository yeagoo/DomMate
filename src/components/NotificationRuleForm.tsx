import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Plus, X, Loader2, Info } from 'lucide-react';
import emailApi from '@/lib/emailApi';
import type { 
  NotificationRule, 
  CreateNotificationRuleRequest, 
  EmailConfig, 
  EmailTemplate 
} from '@/types/email';

interface NotificationRuleFormProps {
  rule?: NotificationRule;
  onSave: (rule: NotificationRule) => void;
  onCancel: () => void;
  language?: 'zh' | 'en';
}

export function NotificationRuleForm({ rule, onSave, onCancel, language = 'zh' }: NotificationRuleFormProps) {
  const [formData, setFormData] = useState<CreateNotificationRuleRequest>({
    name: '',
    type: 'expiry_reminder',
    days: 7,
    scheduleHour: 8,
    scheduleMinute: 0,
    scheduleWeekday: 1, // 默认周一
    emailConfigId: '',
    templateId: '',
    recipients: [''],
    isActive: true
  });

  const [configs, setConfigs] = useState<EmailConfig[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const labels = language === 'en' ? {
    title: rule ? 'Edit Notification Rule' : 'Add Notification Rule',
    description: 'Configure automatic email notification rules',
    name: 'Rule Name',
    namePlaceholder: 'e.g., Weekly Domain Expiry Alert',
    type: 'Notification Type',
    expiryReminder: 'Domain Expiry Reminder',
    dailySummary: 'Daily Summary Report',
    weeklySummary: 'Weekly Summary Report',
    days: 'Days Before/After Expiry',
    daysDesc: 'Positive number = days before expiry, negative = days after expiry',
    daysBeforeExpiry: 'Days Before Expiry',
    daysAfterExpiry: 'Days After Expiry',
    scheduleTime: 'Send Time',
    scheduleTimeDesc: 'When to send the notification',
    hour: 'Hour',
    minute: 'Minute',
    scheduleWeekday: 'Day of Week',
    weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    emailConfig: 'Email Configuration',
    template: 'Email Template',
    recipients: 'Recipients',
    recipientsDesc: 'Email addresses to receive notifications',
    addRecipient: 'Add Recipient',
    removeRecipient: 'Remove',
    isActive: 'Enable Rule',
    activeDesc: 'Whether this rule is active and should send notifications',
    save: 'Save Rule',
    cancel: 'Cancel',
    saving: 'Saving...',
    required: 'This field is required',
    invalidEmail: 'Please enter a valid email address',
    invalidNumber: 'Please enter a valid number',
    selectConfig: 'Please select an email configuration',
    selectTemplate: 'Please select an email template',
    atLeastOneRecipient: 'At least one recipient is required',
    schedulePreview: 'Schedule Preview'
  } : {
    title: rule ? '编辑通知规则' : '添加通知规则',
    description: '配置自动邮件通知规则',
    name: '规则名称',
    namePlaceholder: '例如：每周域名到期提醒',
    type: '通知类型',
    expiryReminder: '域名到期提醒',
    dailySummary: '每日汇总报告',
    weeklySummary: '每周汇总报告',
    days: '到期前后天数',
    daysDesc: '正数=到期前天数，负数=到期后天数',
    daysBeforeExpiry: '到期前天数',
    daysAfterExpiry: '到期后天数',
    scheduleTime: '发送时间',
    scheduleTimeDesc: '通知的发送时间',
    hour: '小时',
    minute: '分钟',
    scheduleWeekday: '星期几',
    weekdays: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
    emailConfig: '邮件配置',
    template: '邮件模板',
    recipients: '收件人',
    recipientsDesc: '接收通知的邮箱地址',
    addRecipient: '添加收件人',
    removeRecipient: '删除',
    isActive: '启用规则',
    activeDesc: '是否启用此规则并发送通知',
    save: '保存规则',
    cancel: '取消',
    saving: '保存中...',
    required: '此字段为必填项',
    invalidEmail: '请输入有效的邮箱地址',
    invalidNumber: '请输入有效的数字',
    selectConfig: '请选择邮件配置',
    selectTemplate: '请选择邮件模板',
    atLeastOneRecipient: '至少需要一个收件人',
    schedulePreview: '调度预览'
  };

  useEffect(() => {
    loadConfigs();
    loadTemplates();
    
    if (rule) {
      setFormData({
        name: rule.name,
        type: rule.type,
        days: rule.days || 7,
        scheduleHour: rule.scheduleHour || 8,
        scheduleMinute: rule.scheduleMinute || 0,
        scheduleWeekday: rule.scheduleWeekday || 1,
        emailConfigId: rule.emailConfigId,
        templateId: rule.templateId,
        recipients: rule.recipients,
        isActive: rule.isActive
      });
    }
  }, [rule]);

  const loadConfigs = async () => {
    try {
      const data = await emailApi.getEmailConfigs();
      setConfigs(data.filter(c => c.isActive));
    } catch (error) {
      console.error('加载邮件配置失败:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const data = await emailApi.getEmailTemplates();
      setTemplates(data.filter(t => t.isActive));
    } catch (error) {
      console.error('加载邮件模板失败:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = labels.required;
    }

    if (!formData.emailConfigId) {
      newErrors.emailConfig = labels.selectConfig;
    }

    if (!formData.templateId) {
      newErrors.template = labels.selectTemplate;
    }

    if (formData.type === 'expiry_reminder' && (!formData.days || formData.days < 1)) {
      newErrors.days = labels.required;
    }

    // 验证收件人
    const validRecipients = formData.recipients.filter(r => r.trim());
    if (validRecipients.length === 0) {
      newErrors.recipients = labels.atLeastOneRecipient;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      for (let i = 0; i < validRecipients.length; i++) {
        if (!emailRegex.test(validRecipients[i])) {
          newErrors[`recipient_${i}`] = labels.invalidEmail;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CreateNotificationRuleRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 清除相关错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleRecipientChange = (index: number, value: string) => {
    const newRecipients = [...formData.recipients];
    newRecipients[index] = value;
    setFormData(prev => ({ ...prev, recipients: newRecipients }));
    
    // 清除相关错误
    if (errors[`recipient_${index}`]) {
      setErrors(prev => ({ ...prev, [`recipient_${index}`]: '' }));
    }
  };

  const addRecipient = () => {
    setFormData(prev => ({
      ...prev,
      recipients: [...prev.recipients, '']
    }));
  };

  const removeRecipient = (index: number) => {
    if (formData.recipients.length > 1) {
      const newRecipients = formData.recipients.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, recipients: newRecipients }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      // 过滤掉空的收件人
      const cleanedData = {
        ...formData,
        recipients: formData.recipients.filter(r => r.trim()),
        days: formData.type === 'expiry_reminder' ? formData.days : undefined
      };

      let savedRule: NotificationRule;

      if (rule) {
        // 更新现有规则
        await emailApi.updateNotificationRule(rule.id, cleanedData);
        savedRule = await emailApi.getNotificationRule(rule.id);
      } else {
        // 创建新规则
        savedRule = await emailApi.createNotificationRule(cleanedData);
      }

      onSave(savedRule);
    } catch (error) {
      console.error('保存规则失败:', error);
      alert(language === 'zh' ? '保存规则失败，请重试' : 'Failed to save rule, please try again');
    } finally {
      setLoading(false);
    }
  };

  // 根据类型过滤模板
  const getFilteredTemplates = () => {
    if (formData.type === 'expiry_reminder') {
      return templates.filter(t => t.type === 'reminder');
    } else {
      return templates.filter(t => t.type === 'summary');
    }
  };

  // 生成调度描述
  const getScheduleDescription = () => {
    const hour = (formData.scheduleHour || 8).toString().padStart(2, '0');
    const minute = (formData.scheduleMinute || 0).toString().padStart(2, '0');
    const timeStr = `${hour}:${minute}`;
    
    switch (formData.type) {
      case 'daily_summary':
        return language === 'zh' 
          ? `每天 ${timeStr} 发送日报`
          : `Daily at ${timeStr}`;
      
      case 'weekly_summary':
        const weekdayName = labels.weekdays[formData.scheduleWeekday || 1];
        return language === 'zh'
          ? `每${weekdayName} ${timeStr} 发送周报`
          : `Weekly on ${weekdayName} at ${timeStr}`;
      
      case 'expiry_reminder':
        const daysDesc = formData.days 
          ? formData.days > 0 
            ? (language === 'zh' ? `到期前${formData.days}天` : `${formData.days} days before expiry`)
            : (language === 'zh' ? `到期后${Math.abs(formData.days)}天` : `${Math.abs(formData.days)} days after expiry`)
          : (language === 'zh' ? '到期前7天' : '7 days before expiry');
        return language === 'zh'
          ? `每天 ${timeStr} 检查并发送${daysDesc}的提醒`
          : `Daily at ${timeStr} check and send ${daysDesc} reminders`;
      
      default:
        return language === 'zh' ? '无效的调度配置' : 'Invalid schedule configuration';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{labels.title}</CardTitle>
        <CardDescription>{labels.description}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 规则名称 */}
          <div className="space-y-2">
            <Label htmlFor="name">{labels.name}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder={labels.namePlaceholder}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.name}
              </p>
            )}
          </div>

          {/* 通知类型 */}
          <div className="space-y-2">
            <Label>{labels.type}</Label>
            <div className="grid grid-cols-1 gap-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="expiry_reminder"
                  checked={formData.type === 'expiry_reminder'}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm">{labels.expiryReminder}</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="daily_summary"
                  checked={formData.type === 'daily_summary'}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm">{labels.dailySummary}</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="weekly_summary"
                  checked={formData.type === 'weekly_summary'}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm">{labels.weeklySummary}</span>
              </label>
            </div>
          </div>

          {/* 提前天数（仅到期提醒时显示） */}
          {formData.type === 'expiry_reminder' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="days">{labels.days}</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-500">{labels.daysBeforeExpiry}</Label>
                    <Input
                      type="number"
                      min="1"
                      max="365"
                      value={formData.days && formData.days > 0 ? formData.days : 7}
                      onChange={(e) => handleInputChange('days', parseInt(e.target.value))}
                      placeholder="7"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">{labels.daysAfterExpiry}</Label>
                    <Input
                      type="number"
                      min="1"
                      max="365"
                      value={formData.days && formData.days < 0 ? Math.abs(formData.days) : ''}
                      onChange={(e) => handleInputChange('days', -parseInt(e.target.value || '0'))}
                      placeholder="0"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">{labels.daysDesc}</p>
                {errors.days && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.days}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 发送时间配置 */}
          <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
            <div className="space-y-2">
              <Label>{labels.scheduleTime}</Label>
              <p className="text-xs text-gray-500">{labels.scheduleTimeDesc}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hour">{labels.hour} (0-23)</Label>
                <select
                  id="hour"
                  value={formData.scheduleHour || 8}
                  onChange={(e) => handleInputChange('scheduleHour', parseInt(e.target.value))}
                  className="w-full p-2 border rounded-md border-gray-300"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {i.toString().padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minute">{labels.minute} (0-59)</Label>
                <select
                  id="minute"
                  value={formData.scheduleMinute || 0}
                  onChange={(e) => handleInputChange('scheduleMinute', parseInt(e.target.value))}
                  className="w-full p-2 border rounded-md border-gray-300"
                >
                  {Array.from({ length: 12 }, (_, i) => i * 5).map(minute => (
                    <option key={minute} value={minute}>
                      :{minute.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 周几选择（仅周报时显示） */}
            {formData.type === 'weekly_summary' && (
              <div className="space-y-2">
                <Label htmlFor="weekday">{labels.scheduleWeekday}</Label>
                <select
                  id="weekday"
                  value={formData.scheduleWeekday || 1}
                  onChange={(e) => handleInputChange('scheduleWeekday', parseInt(e.target.value))}
                  className="w-full p-2 border rounded-md border-gray-300"
                >
                  {labels.weekdays.map((day, index) => (
                    <option key={index} value={index}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 调度预览 */}
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">{labels.schedulePreview}</p>
                  <p className="text-xs text-blue-600 mt-1">
                    {getScheduleDescription()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 邮件配置 */}
          <div className="space-y-2">
            <Label htmlFor="emailConfig">{labels.emailConfig}</Label>
            <select
              id="emailConfig"
              value={formData.emailConfigId}
              onChange={(e) => handleInputChange('emailConfigId', e.target.value)}
              className={`w-full p-2 border rounded-md ${errors.emailConfig ? 'border-red-500' : 'border-gray-300'}`}
            >
              <option value="">{language === 'zh' ? '请选择邮件配置' : 'Select email configuration'}</option>
              {configs.map((config) => (
                <option key={config.id} value={config.id}>
                  {config.name} ({config.fromEmail})
                </option>
              ))}
            </select>
            {errors.emailConfig && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.emailConfig}
              </p>
            )}
          </div>

          {/* 邮件模板 */}
          <div className="space-y-2">
            <Label htmlFor="template">{labels.template}</Label>
            <select
              id="template"
              value={formData.templateId}
              onChange={(e) => handleInputChange('templateId', e.target.value)}
              className={`w-full p-2 border rounded-md ${errors.template ? 'border-red-500' : 'border-gray-300'}`}
            >
              <option value="">{language === 'zh' ? '请选择邮件模板' : 'Select email template'}</option>
              {getFilteredTemplates().map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} ({template.language})
                </option>
              ))}
            </select>
            {errors.template && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.template}
              </p>
            )}
          </div>

          {/* 收件人 */}
          <div className="space-y-2">
            <Label>{labels.recipients}</Label>
            <p className="text-xs text-gray-500">{labels.recipientsDesc}</p>
            
            {formData.recipients.map((recipient, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  type="email"
                  value={recipient}
                  onChange={(e) => handleRecipientChange(index, e.target.value)}
                  placeholder={`${language === 'zh' ? '邮箱地址' : 'Email address'} ${index + 1}`}
                  className={errors[`recipient_${index}`] ? 'border-red-500' : ''}
                />
                {formData.recipients.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeRecipient(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addRecipient}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              {labels.addRecipient}
            </Button>
            
            {errors.recipients && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.recipients}
              </p>
            )}
          </div>

          {/* 启用规则 */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="space-y-1">
              <Label>{labels.isActive}</Label>
              <p className="text-xs text-gray-500">{labels.activeDesc}</p>
            </div>
                         <Switch
               checked={Boolean(formData.isActive)}
               onCheckedChange={(checked: boolean) => handleInputChange('isActive', checked)}
             />
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {labels.saving}
                </>
              ) : (
                labels.save
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              {labels.cancel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 