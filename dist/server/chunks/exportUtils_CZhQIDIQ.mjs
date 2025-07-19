import { jsx, jsxs } from 'react/jsx-runtime';
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import * as LabelPrimitive from '@radix-ui/react-label';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X, Circle } from 'lucide-react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return /* @__PURE__ */ jsx(
      Comp,
      {
        className: cn(buttonVariants({ variant, size, className })),
        ref,
        ...props
      }
    );
  }
);
Button.displayName = "Button";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success: "border-transparent bg-green-500 text-white hover:bg-green-600",
        warning: "border-transparent bg-yellow-500 text-white hover:bg-yellow-600",
        error: "border-transparent bg-red-500 text-white hover:bg-red-600"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
function Badge({ className, variant, ...props }) {
  return /* @__PURE__ */ jsx("div", { className: cn(badgeVariants({ variant }), className), ...props });
}

const API_BASE_URL = "http://localhost:3001/api";
class ApiService {
  async request(endpoint, options) {
    const url = `${API_BASE_URL}${endpoint}`;
    try {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...options?.headers
        },
        ...options
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
  async getDomains() {
    return this.request("/domains");
  }
  // 导入域名
  async importDomains(domains) {
    return this.request("/domains/import", {
      method: "POST",
      body: JSON.stringify({ domains })
    });
  }
  // 切换域名通知状态
  async toggleNotifications(domainId, notifications) {
    return this.request(`/domains/${domainId}/notifications`, {
      method: "PATCH",
      body: JSON.stringify({ notifications })
    });
  }
  // 刷新单个域名信息
  async refreshDomain(domainId) {
    return this.request(`/domains/${domainId}/refresh`, {
      method: "POST"
    });
  }
  // 批量删除域名
  async deleteDomains(domainIds) {
    return this.request("/domains", {
      method: "DELETE",
      body: JSON.stringify({ domainIds })
    });
  }
  // 重新检查所有域名的到期时间
  async recheckAllDomains() {
    return this.request("/domains/recheck-all", {
      method: "POST"
    });
  }
  // 数据导出
  async exportData(exportOptions) {
    return this.request("/export", {
      method: "POST",
      body: JSON.stringify(exportOptions)
    });
  }
  // ====== 分组管理相关API ======
  // 获取所有分组
  async getGroups() {
    return this.request("/groups");
  }
  // 创建新分组
  async createGroup(groupData) {
    return this.request("/groups", {
      method: "POST",
      body: JSON.stringify(groupData)
    });
  }
  // 更新分组
  async updateGroup(id, groupData) {
    return this.request(`/groups/${id}`, {
      method: "PUT",
      body: JSON.stringify(groupData)
    });
  }
  // 删除分组
  async deleteGroup(id) {
    return this.request(`/groups/${id}`, {
      method: "DELETE"
    });
  }
  // 获取分组中的域名
  async getGroupDomains(groupId) {
    return this.request(`/groups/${groupId}/domains`);
  }
  // 获取未分组的域名
  async getUngroupedDomains() {
    return this.request("/groups/ungrouped/domains");
  }
  // 将域名添加到分组
  async addDomainToGroup(domainId, groupId) {
    return this.request(`/groups/${groupId}/domains/${domainId}`, {
      method: "POST"
    });
  }
  // 从分组中移除域名
  async removeDomainFromGroup(domainId, groupId) {
    return this.request(`/groups/${groupId}/domains/${domainId}`, {
      method: "DELETE"
    });
  }
  // 获取域名的分组信息
  async getDomainGroups(domainId) {
    return this.request(`/domains/${domainId}/groups`);
  }
  // 获取分组统计信息
  async getGroupStats() {
    return this.request("/groups/stats");
  }
  // 按分组导出数据
  async exportGroupData(groupId, exportOptions) {
    return this.request(`/groups/${groupId}/export`, {
      method: "POST",
      body: JSON.stringify(exportOptions)
    });
  }
}
const apiService = new ApiService();

const Input = React.forwardRef(
  ({ className, type, ...props }, ref) => {
    return /* @__PURE__ */ jsx(
      "input",
      {
        type,
        className: cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        ),
        ref,
        ...props
      }
    );
  }
);
Input.displayName = "Input";

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);
const Label = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  LabelPrimitive.Root,
  {
    ref,
    className: cn(labelVariants(), className),
    ...props
  }
));
Label.displayName = LabelPrimitive.Root.displayName;

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  DialogPrimitive.Overlay,
  {
    ref,
    className: cn(
      "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    ),
    ...props
  }
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;
const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(DialogPortal, { children: [
  /* @__PURE__ */ jsx(DialogOverlay, {}),
  /* @__PURE__ */ jsxs(
    DialogPrimitive.Content,
    {
      ref,
      className: cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      ),
      ...props,
      children: [
        children,
        /* @__PURE__ */ jsxs(DialogPrimitive.Close, { className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground", children: [
          /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Close" })
        ] })
      ]
    }
  )
] }));
DialogContent.displayName = DialogPrimitive.Content.displayName;
const DialogHeader = ({
  className,
  ...props
}) => /* @__PURE__ */ jsx(
  "div",
  {
    className: cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    ),
    ...props
  }
);
DialogHeader.displayName = "DialogHeader";
const DialogFooter = ({
  className,
  ...props
}) => /* @__PURE__ */ jsx(
  "div",
  {
    className: cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    ),
    ...props
  }
);
DialogFooter.displayName = "DialogFooter";
const DialogTitle = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  DialogPrimitive.Title,
  {
    ref,
    className: cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    ),
    ...props
  }
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;
const DialogDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  DialogPrimitive.Description,
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

const RadioGroup = React.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsx(
    RadioGroupPrimitive.Root,
    {
      className: cn("grid gap-2", className),
      ...props,
      ref
    }
  );
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;
const RadioGroupItem = React.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsx(
    RadioGroupPrimitive.Item,
    {
      ref,
      className: cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      ),
      ...props,
      children: /* @__PURE__ */ jsx(RadioGroupPrimitive.Indicator, { className: "flex items-center justify-center", children: /* @__PURE__ */ jsx(Circle, { className: "h-2.5 w-2.5 fill-current text-current" }) })
    }
  );
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

class FrontendExportUtils {
  static availableFields = {
    domain: "域名",
    registrar: "注册商",
    expiresAt: "到期时间",
    dnsProvider: "DNS提供商",
    status: "状态标识",
    lastCheck: "最后检查时间"
  };
  static availableFieldsEn = {
    domain: "Domain",
    registrar: "Registrar",
    expiresAt: "Expires At",
    dnsProvider: "DNS Provider",
    status: "Status Badge",
    lastCheck: "Last Check Time"
  };
  // 格式化数据
  static formatDataForExport(domains, selectedFields, language = "zh") {
    const fieldLabels = language === "en" ? this.availableFieldsEn : this.availableFields;
    return domains.map((domain) => {
      const row = {};
      selectedFields.forEach((field) => {
        const label = fieldLabels[field] || field;
        let value = String(domain[field] || "");
        switch (field) {
          case "expiresAt":
            if (value && value !== "undefined") {
              try {
                value = new Date(value).toLocaleDateString(language === "en" ? "en-US" : "zh-CN");
              } catch {
              }
            }
            break;
          case "lastCheck":
            if (value && value !== "undefined") {
              try {
                value = new Date(value).toLocaleString(language === "en" ? "en-US" : "zh-CN");
              } catch {
              }
            }
            break;
          case "createdAt":
            if (value && value !== "undefined") {
              try {
                value = new Date(value).toLocaleString(language === "en" ? "en-US" : "zh-CN");
              } catch {
              }
            }
            break;
          case "status":
            const statusMap = {
              "zh": {
                "normal": "正常",
                "expiring_soon": "即将到期",
                "expired": "已过期",
                "unknown": "未知",
                "unregistered": "未注册",
                "failed": "查询失败",
                "error": "错误",
                "pending": "待处理",
                "inactive": "未激活",
                "suspended": "已暂停",
                "transferred": "已转移"
              },
              "en": {
                "normal": "Normal",
                "expiring_soon": "Expiring Soon",
                "expired": "Expired",
                "unknown": "Unknown",
                "unregistered": "Unregistered",
                "failed": "Failed",
                "error": "Error",
                "pending": "Pending",
                "inactive": "Inactive",
                "suspended": "Suspended",
                "transferred": "Transferred"
              }
            };
            value = statusMap[language][value] || value;
            break;
        }
        row[label] = value;
      });
      return row;
    });
  }
  // 生成CSV内容
  static generateCSV(domains, selectedFields, language = "zh") {
    const formattedData = this.formatDataForExport(domains, selectedFields, language);
    if (formattedData.length === 0) {
      return "";
    }
    const headers = Object.keys(formattedData[0]);
    const csvContent = [
      // 表头行
      headers.map((header) => `"${header.replace(/"/g, '""')}"`).join(","),
      // 数据行
      ...formattedData.map(
        (row) => headers.map((header) => `"${String(row[header] || "").replace(/"/g, '""')}"`).join(",")
      )
    ].join("\n");
    return "\uFEFF" + csvContent;
  }
  // 生成JSON内容
  static generateJSON(domains, selectedFields, language = "zh", includeMetadata = true) {
    const exportData = {};
    if (includeMetadata) {
      exportData.metadata = {
        exportDate: (/* @__PURE__ */ new Date()).toISOString(),
        exportedBy: "DomainFlow",
        totalRecords: domains.length,
        selectedFields,
        language,
        version: "1.0"
      };
    }
    if (selectedFields.length === Object.keys(this.availableFields).length) {
      exportData.domains = domains;
    } else {
      exportData.domains = domains.map((domain) => {
        const filtered = {};
        selectedFields.forEach((field) => {
          filtered[field] = domain[field];
        });
        return filtered;
      });
    }
    return JSON.stringify(exportData, null, 2);
  }
  // 生成HTML表格用于PDF打印
  static generateHTMLTable(domains, selectedFields, language = "zh", title) {
    const formattedData = this.formatDataForExport(domains, selectedFields, language);
    const reportTitle = title || (language === "en" ? "Domain Monitoring Report" : "域名监控报告");
    const exportInfo = language === "en" ? `Export Date: ${(/* @__PURE__ */ new Date()).toLocaleString("en-US")} | Total Records: ${domains.length}` : `导出时间: ${(/* @__PURE__ */ new Date()).toLocaleString("zh-CN")} | 记录总数: ${domains.length}`;
    if (formattedData.length === 0) {
      return `<h1>${reportTitle}</h1><p>${language === "en" ? "No data to export" : "没有数据可导出"}</p>`;
    }
    const headers = Object.keys(formattedData[0]);
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${reportTitle}</title>
  <style>
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { text-align: center; color: #333; margin-bottom: 10px; }
    .info { text-align: center; color: #666; margin-bottom: 20px; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; font-weight: bold; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    .print-btn { 
      background: #007bff; color: white; border: none; 
      padding: 10px 20px; border-radius: 4px; cursor: pointer; 
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">${language === "en" ? "Print as PDF" : "打印为PDF"}</button>
  <h1>${reportTitle}</h1>
  <div class="info">${exportInfo}</div>
  <table>
    <thead>
      <tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr>
    </thead>
    <tbody>
      ${formattedData.map(
      (row) => `<tr>${headers.map((header) => `<td>${row[header] || ""}</td>`).join("")}</tr>`
    ).join("")}
    </tbody>
  </table>
</body>
</html>`;
  }
  // 下载文件
  static downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
  // 在新窗口中打开HTML内容用于打印
  static openPrintWindow(htmlContent) {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.addEventListener("load", () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      });
    } else {
      alert("打印窗口被阻止，请允许弹窗后重试");
    }
  }
  // 导出CSV文件
  static async exportToCSV(domains, selectedFields, filename = "domains", language = "zh") {
    const csvContent = this.generateCSV(domains, selectedFields, language);
    const fullFilename = `${filename}_${Date.now()}.csv`;
    this.downloadFile(csvContent, fullFilename, "text/csv;charset=utf-8");
    return {
      success: true,
      filename: fullFilename,
      size: new Blob([csvContent]).size,
      totalRecords: domains.length,
      selectedFields: selectedFields.length
    };
  }
  // 导出JSON文件
  static async exportToJSON(domains, selectedFields, filename = "domains", language = "zh") {
    const jsonContent = this.generateJSON(domains, selectedFields, language, true);
    const fullFilename = `${filename}_${Date.now()}.json`;
    this.downloadFile(jsonContent, fullFilename, "application/json");
    return {
      success: true,
      filename: fullFilename,
      size: new Blob([jsonContent]).size,
      totalRecords: domains.length,
      selectedFields: selectedFields.length
    };
  }
  // 导出PDF（通过HTML打印）
  static async exportToPDF(domains, selectedFields, filename = "domains", language = "zh", title) {
    const htmlContent = this.generateHTMLTable(domains, selectedFields, language, title);
    this.openPrintWindow(htmlContent);
    return {
      success: true,
      filename: `${filename}_${Date.now()}.pdf`,
      size: htmlContent.length,
      totalRecords: domains.length,
      selectedFields: selectedFields.length,
      note: language === "en" ? "Please use browser print dialog to save as PDF" : "请使用浏览器打印对话框另存为PDF"
    };
  }
  // 统一导出接口
  static async export(format, domains, selectedFields, filename = "domains", language = "zh", options = {}) {
    switch (format) {
      case "csv":
        return this.exportToCSV(domains, selectedFields, filename, language);
      case "pdf":
        return this.exportToPDF(domains, selectedFields, filename, language, options.title);
      case "json":
        return this.exportToJSON(domains, selectedFields, filename, language);
      default:
        throw new Error(`不支持的导出格式: ${format}`);
    }
  }
}

export { Button as B, Dialog as D, FrontendExportUtils as F, Input as I, Label as L, RadioGroup as R, DialogTrigger as a, DialogContent as b, DialogHeader as c, DialogTitle as d, DialogDescription as e, apiService as f, DialogFooter as g, RadioGroupItem as h, Badge as i, cn as j };
