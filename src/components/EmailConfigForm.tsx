import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Check, Loader2 } from 'lucide-react';
import emailApi from '@/lib/emailApi';
import type { EmailConfig, CreateEmailConfigRequest } from '@/types/email';

interface EmailConfigFormProps {
  config?: EmailConfig;
  onSave: (config: EmailConfig) => void;
  onCancel: () => void;
  language?: 'zh' | 'en';
}

export function EmailConfigForm({ config, onSave, onCancel, language = 'zh' }: EmailConfigFormProps) {
  const [formData, setFormData] = useState<CreateEmailConfigRequest>({
    name: '',
    host: '',
    port: 587,
    secure: false,
    username: '',
    password: '',
    fromEmail: '',
    fromName: '',
    isDefault: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const labels = language === 'en' ? {
    title: config ? 'Edit Email Configuration' : 'Add Email Configuration',
    description: 'Configure SMTP server settings for sending emails',
    name: 'Configuration Name',
    namePlaceholder: 'e.g., Gmail SMTP',
    host: 'SMTP Server',
    hostPlaceholder: 'smtp.gmail.com',
    port: 'Port',
    secure: 'Use SSL/TLS',
    secureDesc: 'Enable secure connection (recommended for port 465)',
    username: 'Username',
    usernamePlaceholder: 'your-email@gmail.com',
    password: 'Password',
    passwordPlaceholder: 'Your email password or app password',
    fromEmail: 'From Email',
    fromEmailPlaceholder: 'noreply@yourdomain.com',
    fromName: 'From Name',
    fromNamePlaceholder: 'DomainFlow Notifications',
    isDefault: 'Set as Default',
    defaultDesc: 'Use this configuration as the default for sending emails',
    testConnection: 'Test Connection',
    testing: 'Testing...',
    save: 'Save Configuration',
    cancel: 'Cancel',
    saving: 'Saving...',
    testSuccess: 'Connection test successful!',
    testFailed: 'Connection test failed',
    required: 'This field is required',
    invalidEmail: 'Please enter a valid email address',
    invalidPort: 'Port must be between 1 and 65535'
  } : {
    title: config ? '编辑邮件配置' : '添加邮件配置',
    description: '配置用于发送邮件的SMTP服务器设置',
    name: '配置名称',
    namePlaceholder: '例如：Gmail SMTP',
    host: 'SMTP服务器',
    hostPlaceholder: 'smtp.gmail.com',
    port: '端口',
    secure: '使用SSL/TLS',
    secureDesc: '启用安全连接（端口465建议开启）',
    username: '用户名',
    usernamePlaceholder: 'your-email@gmail.com',
    password: '密码',
    passwordPlaceholder: '您的邮箱密码或应用专用密码',
    fromEmail: '发件人邮箱',
    fromEmailPlaceholder: 'noreply@yourdomain.com',
    fromName: '发件人名称',
    fromNamePlaceholder: 'DomainFlow 通知',
    isDefault: '设为默认',
    defaultDesc: '将此配置设为发送邮件的默认配置',
    testConnection: '测试连接',
    testing: '测试中...',
    save: '保存配置',
    cancel: '取消',
    saving: '保存中...',
    testSuccess: '连接测试成功！',
    testFailed: '连接测试失败',
    required: '此字段为必填项',
    invalidEmail: '请输入有效的邮箱地址',
    invalidPort: '端口号必须在1-65535之间'
  };

  useEffect(() => {
    if (config) {
      setFormData({
        name: config.name,
        host: config.host,
        port: config.port,
        secure: config.secure,
        username: config.username,
        password: '****', // 不显示真实密码
        fromEmail: config.fromEmail,
        fromName: config.fromName,
        isDefault: config.isDefault
      });
    }
  }, [config]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = labels.required;
    }

    if (!formData.host.trim()) {
      newErrors.host = labels.required;
    }

    if (!formData.port || formData.port < 1 || formData.port > 65535) {
      newErrors.port = labels.invalidPort;
    }

    if (!formData.username.trim()) {
      newErrors.username = labels.required;
    }

    if (!formData.password.trim() || (config && formData.password === '****')) {
      newErrors.password = labels.required;
    }

    if (!formData.fromEmail.trim()) {
      newErrors.fromEmail = labels.required;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.fromEmail)) {
        newErrors.fromEmail = labels.invalidEmail;
      }
    }

    // 验证用户名是否为邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.username && !emailRegex.test(formData.username)) {
      newErrors.username = labels.invalidEmail;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CreateEmailConfigRequest, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 清除相关错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // 清除测试结果
    if (testResult) {
      setTestResult(null);
    }
  };

  const handleTestConnection = async () => {
    if (!validateForm()) return;

    setTesting(true);
    setTestResult(null);

    try {
      // 先保存配置（如果是新配置）或更新配置
      let configId = config?.id;
      
      if (!configId) {
        // 创建临时配置用于测试
        const tempConfig = await emailApi.createEmailConfig(formData);
        configId = tempConfig.id;
      } else {
        // 更新现有配置
        await emailApi.updateEmailConfig(configId, formData);
      }

      // 测试连接
      const result = await emailApi.testEmailConfig(configId);
      
      setTestResult({
        success: result.success,
        message: result.success ? labels.testSuccess : result.message || labels.testFailed
      });

    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : labels.testFailed
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      let savedConfig: EmailConfig;

      if (config) {
        // 更新现有配置
        const updateData: any = { ...formData };
        if (updateData.password === '****') {
          delete updateData.password; // 不更新密码
        }
        await emailApi.updateEmailConfig(config.id, updateData);
        // 重新获取配置以确保数据准确性
        savedConfig = await emailApi.getEmailConfig(config.id);
      } else {
        // 创建新配置
        savedConfig = await emailApi.createEmailConfig(formData);
      }

      onSave(savedConfig);
    } catch (error) {
      console.error('保存配置失败:', error);
      alert(language === 'zh' ? '保存配置失败，请重试' : 'Failed to save configuration, please try again');
    } finally {
      setLoading(false);
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
          {/* 配置名称 */}
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

          {/* SMTP服务器和端口 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="host">{labels.host}</Label>
              <Input
                id="host"
                value={formData.host}
                onChange={(e) => handleInputChange('host', e.target.value)}
                placeholder={labels.hostPlaceholder}
                className={errors.host ? 'border-red-500' : ''}
              />
              {errors.host && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.host}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="port">{labels.port}</Label>
              <Input
                id="port"
                type="number"
                value={formData.port}
                onChange={(e) => handleInputChange('port', parseInt(e.target.value))}
                className={errors.port ? 'border-red-500' : ''}
              />
              {errors.port && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.port}
                </p>
              )}
            </div>
          </div>

          {/* SSL/TLS开关 */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="space-y-1">
              <Label>{labels.secure}</Label>
              <p className="text-xs text-gray-500">{labels.secureDesc}</p>
            </div>
            <Switch
              checked={formData.secure}
              onCheckedChange={(checked) => handleInputChange('secure', checked)}
            />
          </div>

          {/* 用户名 */}
          <div className="space-y-2">
            <Label htmlFor="username">{labels.username}</Label>
            <Input
              id="username"
              type="email"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              placeholder={labels.usernamePlaceholder}
              className={errors.username ? 'border-red-500' : ''}
            />
            {errors.username && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.username}
              </p>
            )}
          </div>

          {/* 密码 */}
          <div className="space-y-2">
            <Label htmlFor="password">{labels.password}</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder={labels.passwordPlaceholder}
              className={errors.password ? 'border-red-500' : ''}
            />
            {errors.password && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.password}
              </p>
            )}
          </div>

          {/* 发件人信息 */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fromEmail">{labels.fromEmail}</Label>
              <Input
                id="fromEmail"
                type="email"
                value={formData.fromEmail}
                onChange={(e) => handleInputChange('fromEmail', e.target.value)}
                placeholder={labels.fromEmailPlaceholder}
                className={errors.fromEmail ? 'border-red-500' : ''}
              />
              {errors.fromEmail && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.fromEmail}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fromName">{labels.fromName}</Label>
              <Input
                id="fromName"
                value={formData.fromName}
                onChange={(e) => handleInputChange('fromName', e.target.value)}
                placeholder={labels.fromNamePlaceholder}
              />
            </div>
          </div>

          {/* 设为默认 */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="space-y-1">
              <Label>{labels.isDefault}</Label>
              <p className="text-xs text-gray-500">{labels.defaultDesc}</p>
            </div>
            <Switch
              checked={formData.isDefault || false}
              onCheckedChange={(checked) => handleInputChange('isDefault', checked)}
            />
          </div>

          {/* 测试结果 */}
          {testResult && (
            <div className={`p-3 rounded-lg flex items-center gap-2 ${
              testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              {testResult.success ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-sm ${
                testResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {testResult.message}
              </span>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={testing || loading}
              className="flex-1"
            >
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {labels.testing}
                </>
              ) : (
                labels.testConnection
              )}
            </Button>
            
            <Button
              type="submit"
              disabled={loading || testing}
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
              disabled={loading || testing}
            >
              {labels.cancel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 

export default EmailConfigForm; 