import type {
  EmailConfig,
  EmailTemplate,
  NotificationRule,
  NotificationLog,
  EmailStats,
  TemplatePreview,
  CreateEmailConfigRequest,
  UpdateEmailConfigRequest,
  CreateEmailTemplateRequest,
  UpdateEmailTemplateRequest,
  CreateNotificationRuleRequest,
  UpdateNotificationRuleRequest,
  SendTestEmailRequest,
  TemplatePreviewRequest,
  TestEmailResult,
  EmailSendResult
} from '@/types/email';

// 使用动态API基础URL，兼容开发和生产环境
const API_BASE = typeof window !== 'undefined' 
  ? (window.location.origin + '/api/email')  // 浏览器环境：使用当前域名
  : '/api/email';  // 服务器端渲染：使用相对路径

class EmailApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // 邮件配置相关API
  async getEmailConfigs(): Promise<EmailConfig[]> {
    return this.request('/configs');
  }

  async getEmailConfig(id: string): Promise<EmailConfig> {
    return this.request(`/configs/${id}`);
  }

  async createEmailConfig(data: CreateEmailConfigRequest): Promise<EmailConfig> {
    return this.request('/configs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEmailConfig(id: string, data: UpdateEmailConfigRequest): Promise<void> {
    await this.request(`/configs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEmailConfig(id: string): Promise<void> {
    await this.request(`/configs/${id}`, {
      method: 'DELETE',
    });
  }

  async testEmailConfig(id: string): Promise<TestEmailResult> {
    return this.request(`/configs/${id}/test`, {
      method: 'POST',
    });
  }

  // 邮件模板相关API
  async getEmailTemplates(type?: string, language?: string): Promise<EmailTemplate[]> {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (language) params.append('language', language);
    
    const query = params.toString();
    return this.request(`/templates${query ? '?' + query : ''}`);
  }

  async getEmailTemplate(id: string): Promise<EmailTemplate> {
    return this.request(`/templates/${id}`);
  }

  async createEmailTemplate(data: CreateEmailTemplateRequest): Promise<EmailTemplate> {
    return this.request('/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEmailTemplate(id: string, data: UpdateEmailTemplateRequest): Promise<void> {
    await this.request(`/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEmailTemplate(id: string): Promise<void> {
    await this.request(`/templates/${id}`, {
      method: 'DELETE',
    });
  }

  async previewEmailTemplate(id: string, data: TemplatePreviewRequest): Promise<TemplatePreview> {
    return this.request(`/templates/${id}/preview`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async previewCustomEmailTemplate(subject: string, htmlContent: string, templateData: Record<string, any> = {}): Promise<{ rendered: { subject: string; html: string; text?: string } }> {
    return this.request('/templates/preview-custom', {
      method: 'POST',
      body: JSON.stringify({ subject, htmlContent, templateData }),
    });
  }

  // 通知规则相关API
  async getNotificationRules(): Promise<NotificationRule[]> {
    return this.request('/rules');
  }

  async getNotificationRule(id: string): Promise<NotificationRule> {
    return this.request(`/rules/${id}`);
  }

  async createNotificationRule(data: CreateNotificationRuleRequest): Promise<NotificationRule> {
    return this.request('/rules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateNotificationRule(id: string, data: UpdateNotificationRuleRequest): Promise<void> {
    await this.request(`/rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteNotificationRule(ruleId: string): Promise<void> {
    await this.request(`/rules/${ruleId}`, { method: 'DELETE' });
  }

  // 立即触发通知规则
  async triggerNotificationRule(ruleId: string): Promise<{ success: boolean; results: any[] }> {
    return this.request(`/rules/${ruleId}/trigger`, { method: 'POST' });
  }

  // 通知日志相关API
  async getNotificationLogs(limit: number = 50, offset: number = 0): Promise<NotificationLog[]> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    return this.request(`/logs?${params.toString()}`);
  }

  async retryFailedEmails(): Promise<{ results: EmailSendResult[] }> {
    return this.request('/retry', {
      method: 'POST',
    });
  }

  // 测试邮件发送
  async sendTestEmail(data: SendTestEmailRequest): Promise<TestEmailResult> {
    return this.request('/send-test', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // 获取邮件统计
  async getEmailStats(): Promise<EmailStats> {
    return this.request('/stats');
  }
}

// 创建单例实例
export const emailApi = new EmailApiClient();
export default emailApi; 