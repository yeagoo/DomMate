import type { Domain, ImportResult } from '@/types/domain';

const API_BASE_URL = '/api';

class ApiService {
  private getSessionId(): string | null {
    return localStorage.getItem('sessionId');
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const sessionId = this.getSessionId();
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(sessionId && { 'X-Session-Id': sessionId }),
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        // 如果是401认证失败，触发重新登录
        if (response.status === 401) {
          const errorData = await response.json().catch(() => ({}));
          if (errorData.requiresAuth) {
            // 清理本地会话
            localStorage.removeItem('sessionId');
            // 刷新页面到登录界面
            window.location.reload();
            return undefined as any;
          }
        }
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

  // 刷新单个域名信息
  async refreshDomain(domainId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/domains/${domainId}/refresh`, {
      method: 'POST',
    });
  }

  // 更新域名备注
  async updateDomainNotes(domainId: string, notes: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/domains/${domainId}/notes`, {
      method: 'PATCH',
      body: JSON.stringify({ notes }),
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

  // ====== 分组管理相关API ======

  // 获取所有分组
  async getGroups(): Promise<import('@/types/group').Group[]> {
    return this.request<import('@/types/group').Group[]>('/groups');
  }

  // 创建新分组
  async createGroup(groupData: import('@/types/group').CreateGroupData): Promise<import('@/types/group').Group> {
    return this.request<import('@/types/group').Group>('/groups', {
      method: 'POST',
      body: JSON.stringify(groupData),
    });
  }

  // 更新分组
  async updateGroup(id: string, groupData: import('@/types/group').UpdateGroupData): Promise<import('@/types/group').Group> {
    return this.request<import('@/types/group').Group>(`/groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(groupData),
    });
  }

  // 删除分组
  async deleteGroup(id: string): Promise<{ success: boolean; deletedCount: number }> {
    return this.request<{ success: boolean; deletedCount: number }>(`/groups/${id}`, {
      method: 'DELETE',
    });
  }

  // 获取分组中的域名
  async getGroupDomains(groupId: string): Promise<Domain[]> {
    return this.request<Domain[]>(`/groups/${groupId}/domains`);
  }

  // 获取未分组的域名
  async getUngroupedDomains(): Promise<Domain[]> {
    return this.request<Domain[]>('/groups/ungrouped/domains');
  }

  // 将域名添加到分组
  async addDomainToGroup(domainId: string, groupId: string): Promise<import('@/types/group').GroupDomainActionResult> {
    return this.request<import('@/types/group').GroupDomainActionResult>(`/groups/${groupId}/domains/${domainId}`, {
      method: 'POST',
    });
  }

  // 从分组中移除域名
  async removeDomainFromGroup(domainId: string, groupId: string): Promise<import('@/types/group').GroupDomainActionResult> {
    return this.request<import('@/types/group').GroupDomainActionResult>(`/groups/${groupId}/domains/${domainId}`, {
      method: 'DELETE',
    });
  }

  // 获取域名的分组信息
  async getDomainGroups(domainId: string): Promise<import('@/types/group').Group[]> {
    return this.request<import('@/types/group').Group[]>(`/domains/${domainId}/groups`);
  }

  // 获取分组统计信息
  async getGroupStats(): Promise<import('@/types/group').GroupStats[]> {
    return this.request<import('@/types/group').GroupStats[]>('/groups/stats');
  }

  // 按分组导出数据
  async exportGroupData(groupId: string, exportOptions: import('@/types/group').GroupExportData): Promise<{ success: boolean; message: string; file: any }> {
    return this.request<{ success: boolean; message: string; file: any }>(`/groups/${groupId}/export`, {
      method: 'POST',
      body: JSON.stringify(exportOptions),
    });
  }

  // 批量标记重要
  async batchMarkImportant(domainIds: string[], isImportant: boolean): Promise<{ success: boolean; message: string; successCount: number; failCount: number }> {
    return this.request<{ success: boolean; message: string; successCount: number; failCount: number }>('/domains/batch-important', {
      method: 'POST',
      body: JSON.stringify({ domainIds, isImportant }),
    });
  }

  // 批量添加备注
  async batchAddNotes(domainIds: string[], notes: string): Promise<{ success: boolean; message: string; successCount: number; failCount: number }> {
    return this.request<{ success: boolean; message: string; successCount: number; failCount: number }>('/domains/batch-notes', {
      method: 'POST',
      body: JSON.stringify({ domainIds, notes }),
    });
  }
}

export const apiService = new ApiService(); 