import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Eye, Loader2, Info } from 'lucide-react';
import emailApi from '@/lib/emailApi';
import type { EmailTemplate, CreateEmailTemplateRequest } from '@/types/email';

interface EmailTemplateFormProps {
  template?: EmailTemplate;
  onSave: (template: EmailTemplate) => void;
  onCancel: () => void;
  language?: 'zh' | 'en';
}

export function EmailTemplateForm({ template, onSave, onCancel, language = 'zh' }: EmailTemplateFormProps) {
  const [formData, setFormData] = useState<CreateEmailTemplateRequest>({
    name: '',
    type: 'reminder',
    language: 'zh',
    subject: '',
    htmlContent: '',
    isActive: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<string>('');

  const labels = language === 'en' ? {
    title: template ? 'Edit Email Template' : 'Add Email Template',
    description: 'Create and customize email templates for notifications',
    name: 'Template Name',
    namePlaceholder: 'e.g., Domain Expiry Alert',
    type: 'Template Type',
    reminder: 'Expiry Reminder',
    summary: 'Summary Report',
    templateLang: 'Template Language',
    chinese: 'Chinese',
    english: 'English',
    subject: 'Email Subject',
    subjectPlaceholder: 'Domain {{domain}} expires in {{days}} days',
    content: 'Email Content',
    contentPlaceholder: 'Enter email template content using Handlebars syntax...',
    isActive: 'Enable Template',
    activeDesc: 'Whether this template is active and available for use',
    preview: 'Preview Template',
    hidePreview: 'Hide Preview',
    save: 'Save Template',
    cancel: 'Cancel',
    saving: 'Saving...',
    previewing: 'Generating Preview...',
    required: 'This field is required',
    variables: 'Available Variables',
    variablesDesc: 'You can use these variables in your template:'
  } : {
    title: template ? '编辑邮件模板' : '添加邮件模板',
    description: '创建和自定义用于通知的邮件模板',
    name: '模板名称',
    namePlaceholder: '例如：域名到期提醒',
    type: '模板类型',
    reminder: '到期提醒',
    summary: '汇总报告',
    templateLang: '模板语言',
    chinese: '中文',
    english: '英文',
    subject: '邮件主题',
    subjectPlaceholder: '域名 {{domain}} 将在 {{days}} 天后到期',
    content: '邮件内容',
    contentPlaceholder: '使用Handlebars语法输入邮件模板内容...',
    isActive: '启用模板',
    activeDesc: '是否启用此模板并可以使用',
    preview: '预览模板',
    hidePreview: '隐藏预览',
    save: '保存模板',
    cancel: '取消',
    saving: '保存中...',
    previewing: '生成预览中...',
    required: '此字段为必填项',
    variables: '可用变量',
    variablesDesc: '你可以在模板中使用这些变量：'
  };

  // 根据模板类型定义可用变量
  const getAvailableVariables = () => {
    if (formData.type === 'reminder') {
      return [
        '{{domain}} - 域名',
        '{{days}} - 剩余天数',
        '{{expiryDate}} - 到期日期',
        '{{status}} - 域名状态',
        '{{registrar}} - 注册商',
        '{{nameservers}} - DNS服务器'
      ];
    } else {
      return [
        '{{totalDomains}} - 总域名数',
        '{{expiringSoon}} - 即将到期数量',
        '{{expired}} - 已过期数量',
        '{{active}} - 活跃域名数',
        '{{date}} - 报告日期',
        '{{domains}} - 域名列表'
      ];
    }
  };

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        type: template.type,
        language: template.language,
        subject: template.subject,
        htmlContent: template.htmlContent,
        isActive: template.isActive
      });
    }
  }, [template]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = labels.required;
    }

    if (!formData.subject.trim()) {
      newErrors.subject = labels.required;
    }

    if (!formData.htmlContent.trim()) {
      newErrors.htmlContent = labels.required;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CreateEmailTemplateRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 清除相关错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // 类型改变时清除预览
    if (field === 'type' && showPreview) {
      setShowPreview(false);
      setPreviewData('');
    }
  };

  const handlePreview = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setShowPreview(true);

    try {
      // 创建预览数据
      const sampleData = formData.type === 'reminder' ? {
        domain: 'example.com',
        days: 7,
        expiryDate: '2024-02-01',
        status: '活跃',
        registrar: 'Example Registrar',
        nameservers: ['ns1.example.com', 'ns2.example.com']
      } : {
        totalDomains: 25,
        expiringSoon: 3,
        expired: 1,
        active: 21,
        date: new Date().toLocaleDateString(),
        domains: ['example.com', 'test.com', 'demo.org']
      };

                    // 调用预览API
        const response = await emailApi.previewCustomEmailTemplate(
          formData.subject,
          formData.htmlContent,
          sampleData
        );

        setPreviewData(response.rendered.html);

    } catch (error) {
      console.error('预览失败:', error);
      alert(language === 'zh' ? '预览生成失败，请检查模板语法' : 'Preview failed, please check template syntax');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      let savedTemplate: EmailTemplate;

      if (template) {
        // 更新现有模板
        await emailApi.updateEmailTemplate(template.id, formData);
        savedTemplate = await emailApi.getEmailTemplate(template.id);
      } else {
        // 创建新模板
        savedTemplate = await emailApi.createEmailTemplate(formData);
      }

      onSave(savedTemplate);
    } catch (error) {
      console.error('保存模板失败:', error);
      alert(language === 'zh' ? '保存模板失败，请重试' : 'Failed to save template, please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>{labels.title}</CardTitle>
          <CardDescription>{labels.description}</CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 模板名称和类型 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="space-y-2">
                <Label>{labels.type}</Label>
                <div className="flex gap-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="reminder"
                      checked={formData.type === 'reminder'}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm">{labels.reminder}</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="summary"
                      checked={formData.type === 'summary'}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm">{labels.summary}</span>
                  </label>
                </div>
              </div>
            </div>

            {/* 模板语言 */}
            <div className="space-y-2">
              <Label>{labels.templateLang}</Label>
              <div className="flex gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    value="zh"
                    checked={formData.language === 'zh'}
                    onChange={(e) => handleInputChange('language', e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm">{labels.chinese}</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    value="en"
                    checked={formData.language === 'en'}
                    onChange={(e) => handleInputChange('language', e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm">{labels.english}</span>
                </label>
              </div>
            </div>

            {/* 邮件主题 */}
            <div className="space-y-2">
              <Label htmlFor="subject">{labels.subject}</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                placeholder={labels.subjectPlaceholder}
                className={errors.subject ? 'border-red-500' : ''}
              />
              {errors.subject && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.subject}
                </p>
              )}
            </div>

            {/* 邮件内容 */}
            <div className="space-y-2">
              <Label htmlFor="content">{labels.content}</Label>
                             <Textarea
                 id="content"
                 value={formData.htmlContent}
                 onChange={(e) => handleInputChange('htmlContent', e.target.value)}
                 placeholder={labels.contentPlaceholder}
                 className={`min-h-[200px] ${errors.htmlContent ? 'border-red-500' : ''}`}
               />
               {errors.htmlContent && (
                 <p className="text-sm text-red-500 flex items-center gap-1">
                   <AlertCircle className="h-3 w-3" />
                   {errors.htmlContent}
                 </p>
               )}
            </div>

            {/* 可用变量提示 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-blue-800">{labels.variables}</p>
                  <p className="text-xs text-blue-600">{labels.variablesDesc}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                    {getAvailableVariables().map((variable, index) => (
                      <code key={index} className="text-xs bg-blue-100 px-2 py-1 rounded">
                        {variable}
                      </code>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 启用模板 */}
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
                type="button"
                variant="outline"
                onClick={() => showPreview ? setShowPreview(false) : handlePreview()}
                disabled={loading}
                className="flex-1"
              >
                {loading && showPreview ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {labels.previewing}
                  </>
                ) : showPreview ? (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    {labels.hidePreview}
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    {labels.preview}
                  </>
                )}
              </Button>
              
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading && !showPreview ? (
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

      {/* 预览窗口 */}
      {showPreview && previewData && (
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>
              {language === 'zh' ? '模板预览' : 'Template Preview'}
            </CardTitle>
            <CardDescription>
              {language === 'zh' ? '这是使用示例数据生成的模板预览' : 'This is a template preview generated with sample data'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="border rounded-lg p-4 bg-gray-50">
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: previewData }}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 