import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import * as React from 'react';
import { useState, useEffect } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { j as cn, f as apiService, D as Dialog, b as DialogContent, c as DialogHeader, d as DialogTitle, e as DialogDescription, L as Label, g as DialogFooter, B as Button, I as Input, i as Badge, a as DialogTrigger, R as RadioGroup, h as RadioGroupItem, F as FrontendExportUtils } from './exportUtils_CZhQIDIQ.mjs';
import { Check, FolderPlus, Users, Loader2, Filter, Tag, Search, Trash2, ArrowUpDown, AlertTriangle, Circle, AlertCircle, XCircle, Clock, CheckCircle2, Bell, BellOff, RefreshCw, Download, FileSpreadsheet, FileText, FileJson } from 'lucide-react';

const Tabs = TabsPrimitive.Root;
const TabsList = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  TabsPrimitive.List,
  {
    ref,
    className: cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    ),
    ...props
  }
));
TabsList.displayName = TabsPrimitive.List.displayName;
const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  TabsPrimitive.Trigger,
  {
    ref,
    className: cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    ),
    ...props
  }
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;
const TabsContent = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  TabsPrimitive.Content,
  {
    ref,
    className: cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    ),
    ...props
  }
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

const Textarea = React.forwardRef(
  ({ className, ...props }, ref) => {
    return /* @__PURE__ */ jsx(
      "textarea",
      {
        className: cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        ),
        ref,
        ...props
      }
    );
  }
);
Textarea.displayName = "Textarea";

const Table = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", { className: "relative w-full overflow-auto", children: /* @__PURE__ */ jsx(
  "table",
  {
    ref,
    className: cn("w-full caption-bottom text-sm", className),
    ...props
  }
) }));
Table.displayName = "Table";
const TableHeader = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("thead", { ref, className: cn("[&_tr]:border-b", className), ...props }));
TableHeader.displayName = "TableHeader";
const TableBody = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "tbody",
  {
    ref,
    className: cn("[&_tr:last-child]:border-0", className),
    ...props
  }
));
TableBody.displayName = "TableBody";
const TableFooter = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "tfoot",
  {
    ref,
    className: cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    ),
    ...props
  }
));
TableFooter.displayName = "TableFooter";
const TableRow = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "tr",
  {
    ref,
    className: cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    ),
    ...props
  }
));
TableRow.displayName = "TableRow";
const TableHead = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "th",
  {
    ref,
    className: cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    ),
    ...props
  }
));
TableHead.displayName = "TableHead";
const TableCell = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "td",
  {
    ref,
    className: cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className),
    ...props
  }
));
TableCell.displayName = "TableCell";
const TableCaption = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "caption",
  {
    ref,
    className: cn("mt-4 text-sm text-muted-foreground", className),
    ...props
  }
));
TableCaption.displayName = "TableCaption";

function Checkbox({ checked = false, onChange, disabled = false, className = "" }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: `
        h-4 w-4 rounded-sm border-2 border-gray-300 flex items-center justify-center cursor-pointer
        transition-colors duration-200
        ${checked ? "bg-blue-600 border-blue-600" : "bg-white hover:border-blue-400"}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${className}
      `,
      onClick: () => !disabled && onChange?.(!checked),
      children: checked && /* @__PURE__ */ jsx(Check, { className: "h-3 w-3 text-white" })
    }
  );
}

function BatchGroupDialog({
  open,
  onClose,
  selectedDomains,
  domains,
  onSuccess,
  language = "zh"
}) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [operation, setOperation] = useState("add");
  const labels = language === "en" ? {
    title: "Batch Group Operations",
    description: `Manage group membership for ${selectedDomains.length} selected domains`,
    operation: "Operation",
    addToGroup: "Add to Group",
    removeFromGroups: "Remove from Groups",
    selectGroup: "Select a group",
    selectedDomains: "Selected Domains",
    cancel: "Cancel",
    apply: "Apply",
    processing: "Processing...",
    loadingGroups: "Loading groups...",
    noGroups: "No groups available",
    success: "Operation completed successfully",
    error: "Operation failed",
    removeAllGroups: "Remove from all groups"
  } : {
    title: "批量分组操作",
    description: `管理选中的 ${selectedDomains.length} 个域名的分组`,
    operation: "操作类型",
    addToGroup: "添加到分组",
    removeFromGroups: "从分组移除",
    selectGroup: "选择分组",
    selectedDomains: "选中的域名",
    cancel: "取消",
    apply: "应用",
    processing: "处理中...",
    loadingGroups: "加载分组中...",
    noGroups: "暂无分组",
    success: "操作成功完成",
    error: "操作失败",
    removeAllGroups: "从所有分组移除"
  };
  useEffect(() => {
    if (open) {
      loadGroups();
      setSelectedGroupId("");
      setOperation("add");
    }
  }, [open]);
  const loadGroups = async () => {
    try {
      setLoading(true);
      const data = await apiService.getGroups();
      setGroups(data);
    } catch (error) {
      console.error("获取分组失败:", error);
    } finally {
      setLoading(false);
    }
  };
  const getSelectedDomainNames = () => {
    return selectedDomains.map((id) => {
      const domain = domains.find((d) => d.id === id);
      return domain?.domain || id;
    });
  };
  const handleApply = async () => {
    if (!selectedGroupId && operation === "add") {
      alert(language === "en" ? "Please select a group" : "请选择一个分组");
      return;
    }
    setProcessing(true);
    try {
      if (operation === "add") {
        for (const domainId of selectedDomains) {
          await apiService.addDomainToGroup(domainId, selectedGroupId);
        }
        const groupName = groups.find((g) => g.id === selectedGroupId)?.name;
        alert(`✅ ${labels.success}
已将 ${selectedDomains.length} 个域名添加到"${groupName}"分组`);
      } else if (operation === "remove") {
        for (const domainId of selectedDomains) {
          const domainGroups = await apiService.getDomainGroups(domainId);
          for (const group of domainGroups) {
            await apiService.removeDomainFromGroup(domainId, group.id);
          }
        }
        alert(`✅ ${labels.success}
已将 ${selectedDomains.length} 个域名从所有分组中移除`);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("批量分组操作失败:", error);
      alert(`❌ ${labels.error}
${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setProcessing(false);
    }
  };
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange: onClose, children: /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-md", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxs(DialogTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(FolderPlus, { className: "h-5 w-5" }),
        labels.title
      ] }),
      /* @__PURE__ */ jsx(DialogDescription, { children: labels.description })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-4 py-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsx(Label, { className: "text-base font-medium", children: labels.operation }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-3 p-3 border rounded-lg", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "radio",
                id: "add-operation",
                name: "operation",
                value: "add",
                checked: operation === "add",
                onChange: (e) => e.target.checked && setOperation("add"),
                className: "w-4 h-4"
              }
            ),
            /* @__PURE__ */ jsxs("label", { htmlFor: "add-operation", className: "flex items-center gap-2 cursor-pointer flex-1", children: [
              /* @__PURE__ */ jsx(FolderPlus, { className: "h-4 w-4 text-green-600" }),
              /* @__PURE__ */ jsx("span", { children: labels.addToGroup })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-3 p-3 border rounded-lg", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "radio",
                id: "remove-operation",
                name: "operation",
                value: "remove",
                checked: operation === "remove",
                onChange: (e) => e.target.checked && setOperation("remove"),
                className: "w-4 h-4"
              }
            ),
            /* @__PURE__ */ jsxs("label", { htmlFor: "remove-operation", className: "flex items-center gap-2 cursor-pointer flex-1", children: [
              /* @__PURE__ */ jsx(Users, { className: "h-4 w-4 text-red-600" }),
              /* @__PURE__ */ jsx("span", { children: labels.removeFromGroups })
            ] })
          ] })
        ] })
      ] }),
      operation === "add" && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { className: "text-base font-medium", children: labels.selectGroup }),
        loading ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 p-3 border rounded-lg text-gray-500", children: [
          /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }),
          labels.loadingGroups
        ] }) : groups.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-3 border rounded-lg text-gray-500", children: labels.noGroups }) : /* @__PURE__ */ jsx("div", { className: "space-y-1 max-h-48 overflow-y-auto border rounded-lg p-2", children: groups.map((group) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: `flex items-center space-x-3 p-2 rounded cursor-pointer hover:bg-gray-50 ${selectedGroupId === group.id ? "bg-blue-50 border-blue-200" : ""}`,
            onClick: () => setSelectedGroupId(group.id),
            children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "radio",
                  name: "group",
                  value: group.id,
                  checked: selectedGroupId === group.id,
                  onChange: () => setSelectedGroupId(group.id),
                  className: "w-4 h-4"
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-1", children: [
                /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: "w-3 h-3 rounded-full",
                    style: { backgroundColor: group.color }
                  }
                ),
                /* @__PURE__ */ jsx("span", { className: "font-medium", children: group.name }),
                group.domainCount > 0 && /* @__PURE__ */ jsxs("span", { className: "text-xs text-gray-500", children: [
                  "(",
                  group.domainCount,
                  " ",
                  language === "en" ? "domains" : "个域名",
                  ")"
                ] })
              ] }),
              selectedGroupId === group.id && /* @__PURE__ */ jsx(Check, { className: "h-4 w-4 text-blue-600" })
            ]
          },
          group.id
        )) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { className: "text-base font-medium", children: labels.selectedDomains }),
        /* @__PURE__ */ jsx("div", { className: "max-h-32 overflow-y-auto border rounded-lg p-3 bg-gray-50", children: /* @__PURE__ */ jsx("div", { className: "space-y-1", children: getSelectedDomainNames().map((domain, index) => /* @__PURE__ */ jsxs("div", { className: "text-sm text-gray-700", children: [
          "• ",
          domain
        ] }, index)) }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsx(
        Button,
        {
          variant: "outline",
          onClick: onClose,
          disabled: processing,
          children: labels.cancel
        }
      ),
      /* @__PURE__ */ jsx(
        Button,
        {
          onClick: handleApply,
          disabled: processing || operation === "add" && !selectedGroupId,
          className: "gap-2",
          children: processing ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }),
            labels.processing
          ] }) : labels.apply
        }
      )
    ] })
  ] }) });
}

const statusConfig = {
  normal: { icon: CheckCircle2, label: "正常", variant: "success", color: "text-white" },
  expiring: { icon: Clock, label: "即将到期", variant: "warning", color: "text-white" },
  expired: { icon: XCircle, label: "已过期", variant: "error", color: "text-white" },
  failed: { icon: AlertCircle, label: "查询失败", variant: "secondary", color: "text-gray-600" },
  unregistered: { icon: Circle, label: "未注册", variant: "outline", color: "text-blue-600" }
};
const renderStatusLabel = (status) => {
  const config = statusConfig[status];
  const Icon = config.icon;
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 min-w-[80px] justify-center", children: [
    /* @__PURE__ */ jsx(Icon, { className: `h-3 w-3 ${config.color}` }),
    /* @__PURE__ */ jsx("span", { children: config.label })
  ] });
};
function DomainTable({
  domains,
  onToggleNotifications,
  onRefreshDomain,
  onDeleteDomains,
  onGroupOperationSuccess,
  language = "zh"
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("expiresAt");
  const [sortDirection, setSortDirection] = useState("asc");
  const [selectedDomains, setSelectedDomains] = useState(/* @__PURE__ */ new Set());
  const [batchGroupDialogOpen, setBatchGroupDialogOpen] = useState(false);
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [groupDomains, setGroupDomains] = useState([]);
  const [ungroupedDomains, setUngroupedDomains] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  useEffect(() => {
    loadGroups();
  }, []);
  useEffect(() => {
    if (selectedGroupId === null) {
      return;
    } else if (selectedGroupId === "ungrouped") {
      loadUngroupedDomains();
    } else {
      loadGroupDomains(selectedGroupId);
    }
  }, [selectedGroupId]);
  const loadGroups = async () => {
    setLoadingGroups(true);
    try {
      const groupsData = await apiService.getGroups();
      setGroups(groupsData);
    } catch (error) {
      console.error("Failed to load groups:", error);
    } finally {
      setLoadingGroups(false);
    }
  };
  const loadGroupDomains = async (groupId) => {
    try {
      const domainsData = await apiService.getGroupDomains(groupId);
      setGroupDomains(domainsData);
    } catch (error) {
      console.error("Failed to load group domains:", error);
    }
  };
  const loadUngroupedDomains = async () => {
    try {
      const domainsData = await apiService.getUngroupedDomains();
      setUngroupedDomains(domainsData);
    } catch (error) {
      console.error("Failed to load ungrouped domains:", error);
    }
  };
  const getDisplayDomains = () => {
    if (selectedGroupId === null) {
      return domains;
    } else if (selectedGroupId === "ungrouped") {
      return ungroupedDomains;
    } else {
      return groupDomains;
    }
  };
  const displayDomains = getDisplayDomains();
  const filteredDomains = displayDomains.filter(
    (domain) => domain.domain.toLowerCase().includes(searchTerm.toLowerCase()) || domain.registrar?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const sortedDomains = [...filteredDomains].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    if (aValue === void 0 || bValue === void 0) return 0;
    let comparison = 0;
    if (aValue < bValue) comparison = -1;
    if (aValue > bValue) comparison = 1;
    return sortDirection === "desc" ? -comparison : comparison;
  });
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };
  const handleSelectDomain = (domainId, checked) => {
    const newSelected = new Set(selectedDomains);
    if (checked) {
      newSelected.add(domainId);
    } else {
      newSelected.delete(domainId);
    }
    setSelectedDomains(newSelected);
  };
  const handleSelectAll = (checked) => {
    if (checked) {
      const allIds = new Set(sortedDomains.map((domain) => domain.id));
      setSelectedDomains(allIds);
    } else {
      setSelectedDomains(/* @__PURE__ */ new Set());
    }
  };
  const handleDeleteSelected = () => {
    if (selectedDomains.size > 0 && onDeleteDomains) {
      onDeleteDomains(Array.from(selectedDomains));
      setSelectedDomains(/* @__PURE__ */ new Set());
    }
  };
  const handleBatchGroupSuccess = () => {
    setSelectedDomains(/* @__PURE__ */ new Set());
    setBatchGroupDialogOpen(false);
    onGroupOperationSuccess?.();
    if (selectedGroupId === "ungrouped") {
      loadUngroupedDomains();
    } else if (selectedGroupId !== null) {
      loadGroupDomains(selectedGroupId);
    }
  };
  const handleGroupFilterChange = (groupId) => {
    setSelectedGroupId(groupId);
    setSelectedDomains(/* @__PURE__ */ new Set());
  };
  const getCurrentGroupInfo = () => {
    if (selectedGroupId === null) {
      return { name: labels.allDomainsGroup, color: "#6B7280" };
    } else if (selectedGroupId === "ungrouped") {
      return { name: labels.ungroupedGroup, color: "#6B7280" };
    } else {
      const group = groups.find((g) => g.id === selectedGroupId);
      return group ? { name: group.name, color: group.color } : { name: labels.unknownGroup, color: "#6B7280" };
    }
  };
  const currentGroupInfo = getCurrentGroupInfo();
  const labels = language === "en" ? {
    searchPlaceholder: "Search domains or registrars...",
    domain: "Domain",
    registrar: "Registrar",
    expiresAt: "Expires",
    actions: "Actions",
    deleteSelected: "Delete Selected",
    groupOperation: "Group Operations",
    allGroups: "All Groups",
    ungrouped: "Ungrouped",
    filterByGroup: "Filter by Group",
    dnsProvider: "DNS Provider",
    domainStatus: "Domain Status",
    statusLabel: "Status Label",
    lastCheck: "Last Check",
    notificationStatus: "Notification Status",
    allDomainsGroup: "All Domains",
    ungroupedGroup: "Ungrouped",
    currentlyShowing: "Currently showing:",
    domainsCount: "domains",
    unknownGroup: "Unknown Group"
  } : {
    searchPlaceholder: "搜索域名或注册商...",
    domain: "域名",
    registrar: "注册商",
    expiresAt: "到期时间",
    actions: "操作",
    deleteSelected: "删除选中",
    groupOperation: "分组操作",
    allGroups: "全部分组",
    ungrouped: "未分组",
    filterByGroup: "按分组筛选",
    dnsProvider: "DNS 提供商",
    domainStatus: "域名状态",
    statusLabel: "状态标识",
    lastCheck: "最后检查",
    notificationStatus: "通知状态",
    allDomainsGroup: "全部域名",
    ungroupedGroup: "未分组",
    currentlyShowing: "正在显示:",
    domainsCount: "个域名",
    unknownGroup: "未知分组"
  };
  const isAllSelected = sortedDomains.length > 0 && selectedDomains.size === sortedDomains.length;
  const isIndeterminate = selectedDomains.size > 0 && selectedDomains.size < sortedDomains.length;
  const formatDate = (date) => {
    if (!date) return "-";
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date(date));
  };
  const formatRelativeTime = (date) => {
    if (!date) return { text: "-", className: "", warning: false };
    const now = /* @__PURE__ */ new Date();
    const target = new Date(date);
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
    let text = "";
    let className = "";
    let warning = false;
    if (diffDays > 0) {
      text = `${diffDays} 天后`;
      if (diffDays <= 7) {
        className = "text-red-600 font-semibold";
        warning = true;
      } else if (diffDays <= 30) {
        className = "text-red-600";
      } else if (diffDays <= 90) {
        className = "text-orange-600";
      }
    } else if (diffDays === 0) {
      text = "今天";
      className = "text-red-600 font-semibold";
      warning = true;
    } else {
      text = `${Math.abs(diffDays)} 天前`;
      className = "text-gray-500";
    }
    return { text, className, warning };
  };
  const getTimeAgo = (date) => {
    if (!date) return "-";
    const now = /* @__PURE__ */ new Date();
    const target = new Date(date);
    const diffTime = now.getTime() - target.getTime();
    const diffMinutes = Math.floor(diffTime / (1e3 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays > 0) {
      return `${diffDays} 天前`;
    } else if (diffHours > 0) {
      return `${diffHours} 小时前`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} 分钟前`;
    } else {
      return "刚刚";
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400", children: [
        /* @__PURE__ */ jsx(Filter, { className: "h-4 w-4" }),
        /* @__PURE__ */ jsxs("span", { children: [
          labels.filterByGroup,
          ":"
        ] })
      ] }),
      /* @__PURE__ */ jsxs(
        Button,
        {
          variant: selectedGroupId === null ? "default" : "outline",
          size: "sm",
          onClick: () => handleGroupFilterChange(null),
          className: "flex items-center gap-1 h-8",
          children: [
            /* @__PURE__ */ jsx(Tag, { className: "h-3 w-3" }),
            labels.allGroups,
            " (",
            domains.length,
            ")"
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        Button,
        {
          variant: selectedGroupId === "ungrouped" ? "default" : "outline",
          size: "sm",
          onClick: () => handleGroupFilterChange("ungrouped"),
          className: "flex items-center gap-1 h-8",
          disabled: loadingGroups,
          children: [
            /* @__PURE__ */ jsx(Tag, { className: "h-3 w-3" }),
            labels.ungrouped,
            " (",
            ungroupedDomains.length,
            ")"
          ]
        }
      ),
      groups.map((group) => /* @__PURE__ */ jsxs(
        Button,
        {
          variant: selectedGroupId === group.id ? "default" : "outline",
          size: "sm",
          onClick: () => handleGroupFilterChange(group.id),
          className: "flex items-center gap-1 h-8 relative",
          style: {
            backgroundColor: selectedGroupId === group.id ? group.color : void 0,
            borderColor: group.color
          },
          disabled: loadingGroups,
          children: [
            /* @__PURE__ */ jsx(
              "div",
              {
                className: "w-2 h-2 rounded-full",
                style: { backgroundColor: group.color }
              }
            ),
            group.name,
            " (",
            group.domainCount || 0,
            ")"
          ]
        },
        group.id
      ))
    ] }),
    selectedGroupId !== null && /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(Tag, { className: "h-4 w-4 text-blue-600" }),
      /* @__PURE__ */ jsx("span", { className: "text-sm text-blue-600 dark:text-blue-400", children: labels.currentlyShowing }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            className: "w-2 h-2 rounded-full",
            style: { backgroundColor: currentGroupInfo.color }
          }
        ),
        /* @__PURE__ */ jsx("span", { className: "font-medium text-blue-700 dark:text-blue-300", children: currentGroupInfo.name }),
        /* @__PURE__ */ jsxs("span", { className: "text-sm text-blue-600 dark:text-blue-400", children: [
          "(",
          filteredDomains.length,
          " ",
          labels.domainsCount,
          ")"
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
        /* @__PURE__ */ jsx(Search, { className: "absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            placeholder: labels.searchPlaceholder,
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value),
            className: "pl-8"
          }
        )
      ] }),
      selectedDomains.size > 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "outline",
            onClick: () => setBatchGroupDialogOpen(true),
            className: "flex items-center gap-2",
            children: [
              /* @__PURE__ */ jsx(FolderPlus, { className: "h-4 w-4" }),
              labels.groupOperation,
              " (",
              selectedDomains.size,
              ")"
            ]
          }
        ),
        onDeleteDomains && /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "destructive",
            onClick: handleDeleteSelected,
            className: "flex items-center gap-2",
            children: [
              /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" }),
              labels.deleteSelected,
              " (",
              selectedDomains.size,
              ")"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "rounded-md border", children: /* @__PURE__ */ jsxs(Table, { children: [
      /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableHead, { className: "text-center w-12", children: /* @__PURE__ */ jsx(
          Checkbox,
          {
            checked: isAllSelected,
            onChange: handleSelectAll,
            className: isIndeterminate ? "opacity-60" : ""
          }
        ) }),
        /* @__PURE__ */ jsx(
          TableHead,
          {
            className: "cursor-pointer hover:bg-muted/50 text-center",
            onClick: () => handleSort("domain"),
            children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center", children: [
              labels.domain,
              /* @__PURE__ */ jsx(ArrowUpDown, { className: "ml-2 h-4 w-4" })
            ] })
          }
        ),
        /* @__PURE__ */ jsx(TableHead, { className: "text-center", children: labels.registrar }),
        /* @__PURE__ */ jsx(
          TableHead,
          {
            className: "cursor-pointer hover:bg-muted/50 text-center min-w-[140px]",
            onClick: () => handleSort("expiresAt"),
            children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center", children: [
              labels.expiresAt,
              /* @__PURE__ */ jsx(ArrowUpDown, { className: "ml-2 h-4 w-4" })
            ] })
          }
        ),
        /* @__PURE__ */ jsx(TableHead, { className: "text-center", children: labels.dnsProvider }),
        /* @__PURE__ */ jsx(TableHead, { className: "text-center", children: labels.domainStatus }),
        /* @__PURE__ */ jsx(TableHead, { className: "text-center", children: labels.statusLabel }),
        /* @__PURE__ */ jsx(TableHead, { className: "text-center", children: labels.lastCheck }),
        /* @__PURE__ */ jsx(TableHead, { children: labels.notificationStatus }),
        /* @__PURE__ */ jsx(TableHead, { children: labels.actions })
      ] }) }),
      /* @__PURE__ */ jsx(TableBody, { children: sortedDomains.map((domain) => {
        const timeInfo = formatRelativeTime(domain.expiresAt);
        return /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(TableCell, { className: "text-center w-12", children: /* @__PURE__ */ jsx(
            Checkbox,
            {
              checked: selectedDomains.has(domain.id),
              onChange: (checked) => handleSelectDomain(domain.id, checked)
            }
          ) }),
          /* @__PURE__ */ jsx(TableCell, { className: "font-medium text-center", children: domain.domain }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-center", children: domain.registrar || "-" }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-center min-w-[140px]", children: /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx("div", { className: "whitespace-nowrap", children: formatDate(domain.expiresAt) }),
            timeInfo && /* @__PURE__ */ jsxs("div", { className: `text-xs ${timeInfo.className || "text-muted-foreground"} flex items-center justify-center gap-1`, children: [
              timeInfo.warning && /* @__PURE__ */ jsx(AlertTriangle, { className: "h-3 w-3 text-red-600" }),
              timeInfo.text
            ] })
          ] }) }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-center", children: domain.dnsProvider || "-" }),
          /* @__PURE__ */ jsx(TableCell, { className: "max-w-[200px] truncate text-center", children: domain.domainStatus || "-" }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-center", children: /* @__PURE__ */ jsx(Badge, { variant: statusConfig[domain.status].variant, children: renderStatusLabel(domain.status) }) }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-sm text-muted-foreground text-center", children: getTimeAgo(domain.lastCheck) }),
          /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(
            Button,
            {
              variant: "ghost",
              size: "sm",
              onClick: () => onToggleNotifications(domain.id),
              children: domain.notifications ? /* @__PURE__ */ jsx(Bell, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx(BellOff, { className: "h-4 w-4" })
            }
          ) }),
          /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(
            Button,
            {
              variant: "ghost",
              size: "sm",
              onClick: () => onRefreshDomain(domain.id),
              children: /* @__PURE__ */ jsx(RefreshCw, { className: "h-4 w-4" })
            }
          ) })
        ] }, domain.id);
      }) })
    ] }) }),
    sortedDomains.length === 0 && /* @__PURE__ */ jsx("div", { className: "text-center py-8 text-muted-foreground", children: searchTerm ? "没有找到匹配的域名" : selectedGroupId !== null ? "此分组暂无域名" : "暂无域名数据" }),
    /* @__PURE__ */ jsx(
      BatchGroupDialog,
      {
        open: batchGroupDialogOpen,
        onClose: () => setBatchGroupDialogOpen(false),
        selectedDomains: Array.from(selectedDomains),
        domains,
        onSuccess: handleBatchGroupSuccess,
        language
      }
    )
  ] });
}

function DataExportDialog({ language = "zh", onExportComplete }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [format, setFormat] = useState("csv");
  const [filename, setFilename] = useState("domains");
  const labels = language === "en" ? {
    title: "Export Data",
    description: "Choose format and filename for data export",
    format: "Export Format",
    filename: "File Name",
    export: "Export",
    exporting: "Exporting...",
    cancel: "Cancel",
    csvDesc: "Excel compatible spreadsheet",
    pdfDesc: "Professional formatted report (Print to PDF)",
    jsonDesc: "Complete data backup",
    filenameHelp: "File name (without extension)",
    exportSuccess: "Export completed successfully",
    exportError: "Export failed",
    allFields: "All 6 domain fields will be exported (Domain, Registrar, Expires At, DNS Provider, Status Badge, Last Check Time)",
    loadingDomains: "Loading domain data...",
    noData: "No domain data available"
  } : {
    title: "导出数据",
    description: "选择导出格式和文件名",
    format: "导出格式",
    filename: "文件名",
    export: "导出",
    exporting: "导出中...",
    cancel: "取消",
    csvDesc: "Excel兼容的电子表格",
    pdfDesc: "专业格式的报告（打印为PDF）",
    jsonDesc: "完整数据备份",
    filenameHelp: "文件名（不含扩展名）",
    exportSuccess: "导出成功完成",
    exportError: "导出失败",
    allFields: "将导出全部6个域名字段（域名、注册商、到期时间、DNS提供商、状态标识、最后检查时间）",
    loadingDomains: "正在加载域名数据...",
    noData: "没有可用的域名数据"
  };
  const handleExport = async () => {
    setIsLoading(true);
    try {
      console.log(labels.loadingDomains);
      const domains = await apiService.getDomains();
      if (domains.length === 0) {
        alert(`⚠️ ${labels.noData}`);
        return;
      }
      const allFields = ["domain", "registrar", "expiresAt", "dnsProvider", "status", "lastCheck"];
      console.log(`开始前端导出: 格式=${format}, 字段=${allFields.length}个, 域名=${domains.length}个`);
      const result = await FrontendExportUtils.export(
        format,
        domains,
        allFields,
        filename.trim() || "domains",
        language,
        {
          title: language === "en" ? "Domain Monitoring Report" : "域名监控报告"
        }
      );
      if (result.success) {
        onExportComplete?.(result);
        console.log(labels.exportSuccess, result);
        setOpen(false);
        setTimeout(() => {
          let message = `✅ ${labels.exportSuccess}

`;
          message += `文件：${result.filename}
`;
          message += `记录数：${result.totalRecords}
`;
          message += `字段数：${result.selectedFields} (域名、注册商、到期时间、DNS提供商、状态标识、最后检查时间)`;
          if (format === "pdf" && result.note) {
            message += `

💡 ${result.note}`;
          }
          alert(message);
        }, 100);
      }
    } catch (error) {
      console.error(labels.exportError, error);
      alert(`❌ ${labels.exportError}

错误详情：${error instanceof Error ? error.message : "未知错误"}

请检查网络连接或刷新页面重试。`);
    } finally {
      setIsLoading(false);
    }
  };
  const formatIcons = {
    csv: FileSpreadsheet,
    pdf: FileText,
    json: FileJson
  };
  const FormatIcon = formatIcons[format];
  return /* @__PURE__ */ jsxs(Dialog, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "outline", className: "gap-2", children: [
      /* @__PURE__ */ jsx(Download, { className: "h-4 w-4" }),
      language === "en" ? "Export Data" : "导出数据"
    ] }) }),
    /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-lg", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxs(DialogTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Download, { className: "h-5 w-5" }),
          labels.title
        ] }),
        /* @__PURE__ */ jsx(DialogDescription, { children: labels.description })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-base font-medium", children: labels.format }),
          /* @__PURE__ */ jsxs(
            RadioGroup,
            {
              value: format,
              onValueChange: (value) => setFormat(value),
              className: "space-y-2",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50", children: [
                  /* @__PURE__ */ jsx(RadioGroupItem, { value: "csv", id: "csv" }),
                  /* @__PURE__ */ jsx(FileSpreadsheet, { className: "h-5 w-5 text-green-600" }),
                  /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                    /* @__PURE__ */ jsx(Label, { htmlFor: "csv", className: "font-medium cursor-pointer", children: "CSV" }),
                    /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: labels.csvDesc })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50", children: [
                  /* @__PURE__ */ jsx(RadioGroupItem, { value: "pdf", id: "pdf" }),
                  /* @__PURE__ */ jsx(FileText, { className: "h-5 w-5 text-red-600" }),
                  /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                    /* @__PURE__ */ jsx(Label, { htmlFor: "pdf", className: "font-medium cursor-pointer", children: "PDF" }),
                    /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: labels.pdfDesc })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50", children: [
                  /* @__PURE__ */ jsx(RadioGroupItem, { value: "json", id: "json" }),
                  /* @__PURE__ */ jsx(FileJson, { className: "h-5 w-5 text-blue-600" }),
                  /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                    /* @__PURE__ */ jsx(Label, { htmlFor: "json", className: "font-medium cursor-pointer", children: "JSON" }),
                    /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: labels.jsonDesc })
                  ] })
                ] })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-green-50 border border-green-200 rounded-lg p-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "w-2 h-2 bg-green-500 rounded-full" }),
            /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-green-800", children: language === "en" ? "Client-side Export" : "前端导出" })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-green-700 mt-1", children: [
            "📋 ",
            labels.allFields,
            /* @__PURE__ */ jsx("br", {}),
            language === "en" ? "⚡ Faster processing, no server storage required" : "⚡ 处理更快，无需服务器存储空间"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "filename", className: "text-base font-medium", children: labels.filename }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "filename",
              value: filename,
              onChange: (e) => setFilename(e.target.value),
              placeholder: language === "en" ? "domains" : "域名列表"
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: labels.filenameHelp })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { className: "gap-2", children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "outline",
            onClick: () => setOpen(false),
            disabled: isLoading,
            children: labels.cancel
          }
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            onClick: handleExport,
            disabled: isLoading,
            className: "gap-2",
            children: isLoading ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }),
              labels.exporting
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(FormatIcon, { className: "h-4 w-4" }),
              labels.export
            ] })
          }
        )
      ] })
    ] })
  ] });
}

export { DataExportDialog as D, Tabs as T, TabsList as a, TabsTrigger as b, TabsContent as c, Textarea as d, DomainTable as e };
