// 邮件配置类型
export interface EmailConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 邮件模板类型
export interface EmailTemplate {
  id: string;
  name: string;
  type: 'reminder' | 'summary';
  language: 'zh' | 'en';
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables: string[];
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 通知规则类型
export interface NotificationRule {
  id: string;
  name: string;
  type: 'expiry_reminder' | 'daily_summary' | 'weekly_summary';
  days?: number; // 提醒天数（到期提醒：正数=到期前，负数=到期后）
  scheduleHour: number; // 发送小时（0-23）
  scheduleMinute: number; // 发送分钟（0-59）
  scheduleWeekday?: number; // 周几发送（weekly_summary：0=周日，1=周一...6=周六）
  cronExpression?: string; // 自动生成的cron表达式
  isActive: boolean;
  emailConfigId: string;
  templateId: string;
  recipients: string[];
  lastRun?: string;
  nextRun?: string;
  runCount: number;
  createdAt: string;
  updatedAt: string;
  // 关联数据
  emailConfigName?: string;
  templateName?: string;
}

// 通知记录类型
export interface NotificationLog {
  id: string;
  ruleId: string;
  domainIds: string[];
  recipient: string;
  subject: string;
  status: 'pending' | 'sent' | 'failed' | 'retry';
  errorMessage?: string;
  sentAt?: string;
  retryCount: number;
  createdAt: string;
  // 关联数据
  ruleName?: string;
  ruleType?: string;
}

// 邮件统计类型
export interface EmailStats {
  configs: {
    total: number;
    active: number;
  };
  templates: {
    total: number;
    active: number;
  };
  rules: {
    total: number;
    active: number;
  };
  todayStats: {
    sent: number;
    failed: number;
  };
}

// 邮件模板预览类型
export interface TemplatePreview {
  template: {
    id: string;
    name: string;
    type: string;
    language: string;
  };
  data: Record<string, any>;
  rendered: {
    subject: string;
    html: string;
    text?: string;
  };
}

// API请求类型
export interface CreateEmailConfigRequest {
  name: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromEmail: string;
  fromName?: string;
  isDefault?: boolean;
}

export interface UpdateEmailConfigRequest extends Partial<CreateEmailConfigRequest> {}

export interface CreateEmailTemplateRequest {
  name: string;
  type: 'reminder' | 'summary';
  language: 'zh' | 'en';
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables?: string[];
  isActive?: boolean;
}

export interface UpdateEmailTemplateRequest extends Partial<CreateEmailTemplateRequest> {}

export interface CreateNotificationRuleRequest {
  name: string;
  type: 'expiry_reminder' | 'daily_summary' | 'weekly_summary';
  days?: number; // 提醒天数（到期提醒：正数=到期前，负数=到期后）
  scheduleHour: number; // 发送小时（0-23）
  scheduleMinute: number; // 发送分钟（0-59）
  scheduleWeekday?: number; // 周几发送（weekly_summary：0=周日，1=周一...6=周六）
  emailConfigId: string;
  templateId: string;
  recipients: string[];
  isActive?: boolean;
}

export interface UpdateNotificationRuleRequest extends Partial<CreateNotificationRuleRequest> {}

export interface SendTestEmailRequest {
  configId?: string;
  templateId?: string;
  recipient: string;
  templateData?: Record<string, any>;
}

export interface TemplatePreviewRequest {
  templateData?: Record<string, any>;
}

// API响应类型
export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
}

export interface TestEmailResult {
  success: boolean;
  messageId?: string;
  message?: string;
}

export interface EmailSendResult {
  rule?: string;
  recipient: string;
  domain?: string;
  success: boolean;
  messageId?: string;
  error?: string;
}

// 表单验证错误类型
export interface FormErrors {
  [key: string]: string;
} 