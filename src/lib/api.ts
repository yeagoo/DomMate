import type { Domain, ImportResult } from '@/types/domain';

const API_BASE_URL = 'http://localhost:3001/api';

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${url}`, error);
      throw error;
    }
  }

  // 获取所有域名
  async getDomains(): Promise<Domain[]> {
    return this.request<Domain[]>('/domains');
  }

  // 导入域名
  async importDomains(domains: string[]): Promise<ImportResult> {
    return this.request<ImportResult>('/domains/import', {
      method: 'POST',
      body: JSON.stringify({ domains }),
    });
  }

  // 切换域名通知状态
  async toggleNotifications(domainId: string, notifications: boolean): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/domains/${domainId}/notifications`, {
      method: 'PATCH',
      body: JSON.stringify({ notifications }),
    });
  }

  // 刷新单个域名信息
  async refreshDomain(domainId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/domains/${domainId}/refresh`, {
      method: 'POST',
    });
  }

  // 批量删除域名
  async deleteDomains(domainIds: string[]): Promise<{ success: boolean; message: string; successCount: number; failCount: number }> {
    return this.request<{ success: boolean; message: string; successCount: number; failCount: number }>('/domains', {
      method: 'DELETE',
      body: JSON.stringify({ domainIds }),
    });
  }

  // 重新检查所有域名的到期时间
  async recheckAllDomains(): Promise<{ success: boolean; message: string; total: number; updated: number; failed: number }> {
    return this.request<{ success: boolean; message: string; total: number; updated: number; failed: number }>('/domains/recheck-all', {
      method: 'POST',
    });
  }

  // 数据导出
  async exportData(exportOptions: {
    format: 'csv' | 'pdf' | 'json';
    selectedFields: string[];
    filename?: string;
    language?: string;
    options?: any;
  }): Promise<{ success: boolean; message: string; file: any }> {
    return this.request<{ success: boolean; message: string; file: any }>('/export', {
      method: 'POST',
      body: JSON.stringify(exportOptions),
    });
  }
}

export const apiService = new ApiService(); 