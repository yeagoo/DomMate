import { useState, useEffect } from 'react';
import { Mail, Settings, MessageSquare, Bell, Activity, AlertCircle, CheckCircle, Clock, ArrowLeft, Plus, Edit, Trash2, Send } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmailConfigForm } from './EmailConfigForm';
import { EmailTemplateForm } from './EmailTemplateForm';
import { NotificationRuleForm } from './NotificationRuleForm';
import emailApi from '@/lib/emailApi';
import type { EmailStats, EmailConfig, EmailTemplate, NotificationRule, NotificationLog } from '@/types/email';

interface EmailDashboardProps {
  language?: 'zh' | 'en';
}

type ViewMode = 'dashboard' | 'configs' | 'templates' | 'rules' | 'logs' | 'add-config' | 'edit-config' | 'add-template' | 'edit-template' | 'add-rule' | 'edit-rule';

export function EmailDashboard({ language = 'zh' }: EmailDashboardProps) {
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  // 视图状态
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  
  // 数据状态
  const [configs, setConfigs] = useState<EmailConfig[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  
  // 编辑状态
  const [editingConfig, setEditingConfig] = useState<EmailConfig | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [editingRule, setEditingRule] = useState<NotificationRule | null>(null);
  
  // 立即发送状态
  const [triggeringRuleId, setTriggeringRuleId] = useState<string | null>(null);

  const labels = language === 'en' ? {
    title: 'Email Notification System',
    description: 'Manage SMTP configs, templates, rules and monitor email delivery',
    overview: 'System Overview',
    configs: 'Email Configs',
    templates: 'Email Templates', 
    rules: 'Notification Rules',
    todayStats: "Today's Stats",
    sent: 'Sent',
    failed: 'Failed',
    total: 'Total',
    active: 'Active',
    manageConfigs: 'Manage Configs',
    manageTemplates: 'Manage Templates',
    manageRules: 'Manage Rules',
    viewLogs: 'View Logs',
    retryFailed: 'Retry Failed',
    retrying: 'Retrying...',
    loadingStats: 'Loading statistics...',
    errorLoading: 'Failed to load statistics',
    retrySuccess: 'Failed emails retried successfully',
    backToDashboard: 'Back to Dashboard'
  } : {
    title: '邮件通知系统',
    description: '管理SMTP配置、邮件模板、通知规则并监控邮件发送状态',
    overview: '系统概览',
    configs: '邮件配置',
    templates: '邮件模板',
    rules: '通知规则', 
    todayStats: '今日统计',
    sent: '已发送',
    failed: '发送失败',
    total: '总数',
    active: '活跃',
    manageConfigs: '管理配置',
    manageTemplates: '管理模板',
    manageRules: '管理规则',
    viewLogs: '查看日志',
    retryFailed: '重试失败邮件',
    retrying: '重试中...',
    loadingStats: '加载统计信息中...',
    errorLoading: '加载统计信息失败',
    retrySuccess: '失败邮件重试成功',
    backToDashboard: '返回主页'
  };

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await emailApi.getEmailStats();
      setStats(data);
    } catch (err) {
      console.error('加载邮件统计失败:', err);
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  const loadConfigs = async () => {
    try {
      const data = await emailApi.getEmailConfigs();
      setConfigs(data);
    } catch (err) {
      console.error('加载邮件配置失败:', err);
    }
  };

  const loadTemplates = async () => {
    try {
      const data = await emailApi.getEmailTemplates();
      setTemplates(data);
    } catch (err) {
      console.error('加载邮件模板失败:', err);
    }
  };

  const loadRules = async () => {
    try {
      const data = await emailApi.getNotificationRules();
      setRules(data);
    } catch (err) {
      console.error('加载通知规则失败:', err);
    }
  };

  const loadLogs = async () => {
    try {
      const data = await emailApi.getNotificationLogs(50, 0);
      setLogs(data);
    } catch (err) {
      console.error('加载通知记录失败:', err);
    }
  };

  const handleRetryFailed = async () => {
    try {
      setRetrying(true);
      const result = await emailApi.retryFailedEmails();
      const successCount = result.results.filter(r => r.success).length;
      
      if (successCount > 0) {
        alert(`${labels.retrySuccess}: ${successCount}封邮件`);
        loadStats(); // 刷新统计
      } else {
        alert(language === 'zh' ? '没有需要重试的邮件' : 'No failed emails to retry');
      }
    } catch (err) {
      console.error('重试失败邮件出错:', err);
      alert(language === 'zh' ? '重试失败邮件时出错' : 'Error retrying failed emails');
    } finally {
      setRetrying(false);
    }
  };

  // 视图切换处理函数
  const handleViewChange = async (view: ViewMode) => {
    setCurrentView(view);
    
    // 根据视图加载相应数据
    switch (view) {
      case 'configs':
        await loadConfigs();
        break;
      case 'templates':
        await loadTemplates();
        break;
      case 'rules':
        await loadRules();
        break;
      case 'logs':
        await loadLogs();
        break;
      default:
        break;
    }
  };

  // 渲染不同的视图
  const renderCurrentView = () => {
    if (currentView === 'dashboard') {
      return renderDashboard();
    }
    
    return (
      <div className="space-y-6">
        {/* 返回按钮 */}
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => setCurrentView('dashboard')} 
            variant="outline" 
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {labels.backToDashboard}
          </Button>
        </div>
        
        {/* 各种管理视图 */}
        {currentView === 'configs' && renderConfigsView()}
        {currentView === 'templates' && renderTemplatesView()}
        {currentView === 'rules' && renderRulesView()}
        {currentView === 'logs' && renderLogsView()}
        {currentView === 'add-config' && renderConfigForm()}
        {currentView === 'edit-config' && renderConfigForm(editingConfig)}
        {currentView === 'add-template' && renderTemplateForm()}
        {currentView === 'edit-template' && renderTemplateForm(editingTemplate)}
        {currentView === 'add-rule' && renderRuleForm()}
        {currentView === 'edit-rule' && renderRuleForm(editingRule)}
      </div>
    );
  };

  // 渲染邮件配置视图
  const renderConfigsView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{labels.manageConfigs}</h2>
        <Button onClick={() => setCurrentView('add-config')}>
          <Plus className="h-4 w-4 mr-2" />
          {language === 'zh' ? '添加配置' : 'Add Config'}
        </Button>
      </div>
      
      {configs.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">
              {language === 'zh' ? '暂无邮件配置，请添加SMTP配置' : 'No email configs found, please add SMTP configuration'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {configs.map((config) => (
            <Card key={config.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">{config.name}</h3>
                    <p className="text-sm text-gray-500">{config.host}:{config.port}</p>
                    <p className="text-xs text-gray-400">{config.fromEmail}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={config.isActive ? 'default' : 'secondary'}>
                      {config.isActive ? (language === 'zh' ? '活跃' : 'Active') : (language === 'zh' ? '未激活' : 'Inactive')}
                    </Badge>
                    {config.isDefault && (
                      <Badge variant="outline">
                        {language === 'zh' ? '默认' : 'Default'}
                      </Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingConfig(config);
                        setCurrentView('edit-config');
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleConfigDelete(config.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // 渲染邮件模板视图
  const renderTemplatesView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{labels.manageTemplates}</h2>
        <Button onClick={() => setCurrentView('add-template')}>
          <Plus className="h-4 w-4 mr-2" />
          {language === 'zh' ? '添加模板' : 'Add Template'}
        </Button>
      </div>
      
      {templates.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">
              {language === 'zh' ? '暂无邮件模板，请添加模板' : 'No email templates found, please add a template'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{template.name}</h3>
                    <p className="text-sm text-gray-500">
                      {language === 'zh' ? '类型' : 'Type'}: {template.type} | 
                      {language === 'zh' ? '语言' : 'Language'}: {template.language}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{template.subject}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={template.isActive ? 'default' : 'secondary'}>
                      {template.isActive ? (language === 'zh' ? '活跃' : 'Active') : (language === 'zh' ? '未激活' : 'Inactive')}
                    </Badge>
                    {template.isDefault && (
                      <Badge variant="outline">
                        {language === 'zh' ? '默认' : 'Default'}
                      </Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingTemplate(template);
                        setCurrentView('edit-template');
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTemplateDelete(template.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // 渲染通知规则视图
  const renderRulesView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{labels.manageRules}</h2>
        <Button onClick={() => setCurrentView('add-rule')}>
          <Plus className="h-4 w-4 mr-2" />
          {language === 'zh' ? '添加规则' : 'Add Rule'}
        </Button>
      </div>
      
      {rules.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">
              {language === 'zh' ? '暂无通知规则，请添加规则配置' : 'No notification rules found, please add rule configuration'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {rules.map((rule) => (
            <Card key={rule.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">{rule.name}</h3>
                    <p className="text-sm text-gray-500">
                      {language === 'zh' ? '类型' : 'Type'}: {rule.type}
                      {rule.days && ` | ${language === 'zh' ? '提前天数' : 'Days'}: ${rule.days}`}
                    </p>
                    <p className="text-xs text-gray-400">
                      {language === 'zh' ? '收件人' : 'Recipients'}: {rule.recipients.join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                      {rule.isActive ? (language === 'zh' ? '活跃' : 'Active') : (language === 'zh' ? '未激活' : 'Inactive')}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingRule(rule);
                        setCurrentView('edit-rule');
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRuleDelete(rule.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRuleTrigger(rule.id, rule.name)}
                      disabled={triggeringRuleId === rule.id || !rule.isActive}
                      title={language === 'zh' ? '立即发送' : 'Send Now'}
                    >
                      {triggeringRuleId === rule.id ? (
                        <Clock className="h-3 w-3 animate-spin" />
                      ) : (
                        <Send className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // 渲染通知日志视图
  const renderLogsView = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{labels.viewLogs}</h2>
      
      {logs.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">
              {language === 'zh' ? '暂无通知记录' : 'No notification logs found'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {logs.map((log) => (
            <Card key={log.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">{log.subject}</h4>
                    <p className="text-xs text-gray-500">{log.recipient}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant={
                    log.status === 'sent' ? 'default' : 
                    log.status === 'failed' ? 'destructive' : 'secondary'
                  }>
                    {log.status === 'sent' ? (language === 'zh' ? '已发送' : 'Sent') : 
                     log.status === 'failed' ? (language === 'zh' ? '发送失败' : 'Failed') : 
                     language === 'zh' ? '等待中' : 'Pending'}
                  </Badge>
                </div>
                {log.errorMessage && (
                  <p className="text-xs text-red-500 mt-2">{log.errorMessage}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // 渲染主仪表盘
  const renderDashboard = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">{labels.loadingStats}</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600 mb-4">{labels.errorLoading}</p>
            <Button onClick={loadStats} variant="outline">
              {language === 'zh' ? '重试' : 'Retry'}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{labels.title}</h1>
            <p className="text-gray-600 mt-1">{labels.description}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleRetryFailed} disabled={retrying} variant="outline" size="sm">
              <Activity className="h-4 w-4 mr-2" />
              {retrying ? labels.retrying : labels.retryFailed}
            </Button>
            <Button onClick={loadStats} variant="outline" size="sm">
              <Clock className="h-4 w-4 mr-2" />
              {language === 'zh' ? '刷新' : 'Refresh'}
            </Button>
          </div>
        </div>

        {stats && (
          <>
            {/* 系统概览 */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">{labels.overview}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 邮件配置 */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{labels.configs}</CardTitle>
                    <Settings className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.configs.total}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">
                        {labels.active}: {stats.configs.active}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* 邮件模板 */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{labels.templates}</CardTitle>
                    <MessageSquare className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.templates.total}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">
                        {labels.active}: {stats.templates.active}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* 通知规则 */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{labels.rules}</CardTitle>
                    <Bell className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.rules.total}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">
                        {labels.active}: {stats.rules.active}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* 今日统计 */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{labels.todayStats}</CardTitle>
                    <Mail className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span className="text-green-600 font-medium">{stats.todayStats.sent}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 text-red-500" />
                        <span className="text-red-600 font-medium">{stats.todayStats.failed}</span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {labels.sent} / {labels.failed}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* 快速操作 */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">
                {language === 'zh' ? '快速操作' : 'Quick Actions'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Settings className="h-4 w-4 text-blue-600" />
                      {labels.manageConfigs}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {language === 'zh' ? 'SMTP服务器配置管理' : 'Manage SMTP server configurations'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleViewChange('configs')}
                    >
                      {language === 'zh' ? '进入管理' : 'Manage'}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <MessageSquare className="h-4 w-4 text-green-600" />
                      {labels.manageTemplates}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {language === 'zh' ? '邮件模板内容管理' : 'Manage email template content'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleViewChange('templates')}
                    >
                      {language === 'zh' ? '进入管理' : 'Manage'}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Bell className="h-4 w-4 text-orange-600" />
                      {labels.manageRules}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {language === 'zh' ? '通知触发规则配置' : 'Configure notification trigger rules'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleViewChange('rules')}
                    >
                      {language === 'zh' ? '进入管理' : 'Manage'}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Activity className="h-4 w-4 text-purple-600" />
                      {labels.viewLogs}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {language === 'zh' ? '查看邮件发送记录' : 'View email delivery logs'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleViewChange('logs')}
                    >
                      {language === 'zh' ? '查看日志' : 'View Logs'}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* 系统状态 */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">
                {language === 'zh' ? '系统状态' : 'System Status'}
              </h2>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>{language === 'zh' ? '邮件系统运行正常' : 'Email system is running normally'}</span>
                    </div>
                    <div className="text-gray-500">
                      {new Date().toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    );
  };

  // 处理配置保存
  const handleConfigSave = (config: EmailConfig) => {
    // 更新配置列表
    setConfigs(prev => {
      const existing = prev.find(c => c.id === config.id);
      if (existing) {
        return prev.map(c => c.id === config.id ? config : c);
      } else {
        return [...prev, config];
      }
    });
    
    // 刷新统计数据
    loadStats();
    
    // 返回配置列表视图
    setCurrentView('configs');
    setEditingConfig(null);
  };

  // 处理模板保存
  const handleTemplateSave = (template: EmailTemplate) => {
    // 更新模板列表
    setTemplates(prev => {
      const existing = prev.find(t => t.id === template.id);
      if (existing) {
        return prev.map(t => t.id === template.id ? template : t);
      } else {
        return [...prev, template];
      }
    });
    
    // 刷新统计数据
    loadStats();
    
    // 返回模板列表视图
    setCurrentView('templates');
    setEditingTemplate(null);
  };

  // 处理规则保存
  const handleRuleSave = (rule: NotificationRule) => {
    // 更新规则列表
    setRules(prev => {
      const existing = prev.find(r => r.id === rule.id);
      if (existing) {
        return prev.map(r => r.id === rule.id ? rule : r);
      } else {
        return [...prev, rule];
      }
    });
    
    // 刷新统计数据
    loadStats();
    
    // 返回规则列表视图
    setCurrentView('rules');
    setEditingRule(null);
  };

  // 处理删除配置
  const handleConfigDelete = async (configId: string) => {
    if (!confirm(language === 'zh' ? '确定要删除这个配置吗？' : 'Are you sure you want to delete this configuration?')) {
      return;
    }

    try {
      await emailApi.deleteEmailConfig(configId);
      setConfigs(prev => prev.filter(c => c.id !== configId));
      loadStats();
    } catch (error) {
      console.error('删除配置失败:', error);
      alert(language === 'zh' ? '删除配置失败' : 'Failed to delete configuration');
    }
  };

  // 处理删除模板
  const handleTemplateDelete = async (templateId: string) => {
    if (!confirm(language === 'zh' ? '确定要删除这个模板吗？' : 'Are you sure you want to delete this template?')) {
      return;
    }

    try {
      await emailApi.deleteEmailTemplate(templateId);
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      loadStats();
    } catch (error) {
      console.error('删除模板失败:', error);
      alert(language === 'zh' ? '删除模板失败' : 'Failed to delete template');
    }
  };

  // 处理删除规则
  const handleRuleDelete = async (ruleId: string) => {
    if (!confirm(language === 'zh' ? '确定要删除这个规则吗？' : 'Are you sure you want to delete this rule?')) {
      return;
    }

    try {
      await emailApi.deleteNotificationRule(ruleId);
      setRules(prev => prev.filter(r => r.id !== ruleId));
      loadStats();
    } catch (error) {
      console.error('删除规则失败:', error);
      alert(language === 'zh' ? '删除规则失败' : 'Failed to delete rule');
    }
  };

  // 处理立即发送规则
  const handleRuleTrigger = async (ruleId: string, ruleName: string) => {
    setTriggeringRuleId(ruleId);
    
    try {
      const result = await emailApi.triggerNotificationRule(ruleId);
      
      if (result.success) {
        const successCount = result.results.filter(r => r.success).length;
        const failCount = result.results.filter(r => !r.success).length;
        
        const message = language === 'zh' 
          ? `规则"${ruleName}"执行完成！\n成功发送: ${successCount} 封\n发送失败: ${failCount} 封`
          : `Rule "${ruleName}" executed!\nSent successfully: ${successCount}\nFailed to send: ${failCount}`;
          
        alert(message);
        
        // 刷新统计数据
        loadStats();
      } else {
        throw new Error('触发规则失败');
      }
    } catch (error) {
      console.error('立即发送失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      alert(language === 'zh' ? `立即发送失败: ${errorMessage}` : `Failed to send immediately: ${errorMessage}`);
    } finally {
      setTriggeringRuleId(null);
    }
  };

  // 渲染配置表单
  const renderConfigForm = (config?: EmailConfig | null) => (
    <EmailConfigForm
      config={config || undefined}
      onSave={handleConfigSave}
      onCancel={() => {
        setCurrentView('configs');
        setEditingConfig(null);
      }}
      language={language}
    />
  );

  // 渲染模板表单
  const renderTemplateForm = (template?: EmailTemplate | null) => (
    <EmailTemplateForm
      template={template || undefined}
      onSave={handleTemplateSave}
      onCancel={() => {
        setCurrentView('templates');
        setEditingTemplate(null);
      }}
      language={language}
    />
  );

  // 渲染规则表单
  const renderRuleForm = (rule?: NotificationRule | null) => (
    <NotificationRuleForm
      rule={rule || undefined}
      onSave={handleRuleSave}
      onCancel={() => {
        setCurrentView('rules');
        setEditingRule(null);
      }}
      language={language}
    />
  );

  return (
    <div className="space-y-6">
      {renderCurrentView()}
    </div>
  );
} 

export default EmailDashboard; 