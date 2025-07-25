// 分组相关的TypeScript类型定义

export interface Group {
  id: string;
  name: string;
  description: string;
  color: string;
  domainCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GroupStats extends Group {
  normalCount: number;
  expiringCount: number;
  expiredCount: number;
  failedCount: number;
}

export interface CreateGroupData {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateGroupData {
  name: string;
  description?: string;
  color?: string;
}

export interface GroupExportData {
  format: 'csv' | 'pdf' | 'json';
  selectedFields: string[];
  filename?: string;
  language?: 'zh' | 'en';
  options?: any;
}

export interface DragDropResult {
  source: {
    droppableId: string;
    index: number;
  };
  destination: {
    droppableId: string;
    index: number;
  } | null;
  draggableId: string;
  type: string;
}

// 分组管理的操作结果
export interface GroupActionResult {
  success: boolean;
  message?: string;
  group?: Group;
  error?: string;
}

// 分组域名操作结果
export interface GroupDomainActionResult {
  success: boolean;
  added?: boolean;
  removed?: boolean;
  error?: string;
}

// 预定义的分组颜色
export const GROUP_COLORS = [
  '#6B7280', // 灰色 - 默认
  '#EF4444', // 红色 - 重要
  '#10B981', // 绿色 - 开发
  '#3B82F6', // 蓝色
  '#8B5CF6', // 紫色
  '#F59E0B', // 黄色
  '#EC4899', // 粉色
  '#06B6D4', // 青色
  '#84CC16', // 石灰色
  '#F97316', // 橙色
] as const;

export type GroupColor = typeof GROUP_COLORS[number]; 