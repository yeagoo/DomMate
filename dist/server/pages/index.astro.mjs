import { c as createComponent, d as renderComponent, r as renderTemplate } from '../chunks/astro/server_B-ZIt8ph.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_BH0Ldx9t.mjs';
import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { A as AuthWrapper } from '../chunks/AuthWrapper_DS0O-dGF.mjs';
import { B as Button, I as Input, L as Label, a as Badge } from '../chunks/label_CWvTMChO.mjs';
import { D as Dialog, a as DialogTrigger, b as DialogContent, c as DialogHeader, d as DialogTitle, e as DialogDescription, g as DialogFooter, f as apiService } from '../chunks/exportUtils_Dnz8QcP6.mjs';
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent, d as Table, e as TableHeader, f as TableRow, g as TableHead, C as Checkbox, h as TableBody, i as TableCell, B as BatchGroupDialog, D as DomainInfoDialog, j as DataExportDialog } from '../chunks/DataExportDialog_CSfVbozk.mjs';
import { T as Textarea } from '../chunks/textarea_CKytwyUR.mjs';
import { Plus, Download, Users, Star, StarOff, MessageSquare, Check, AlertCircle, Loader2, Filter, Tag, Search, FolderPlus, Settings, Trash2, ArrowUpDown, AlertTriangle, Circle, XCircle, Clock, CheckCircle2, RefreshCw } from 'lucide-react';
export { renderers } from '../renderers.mjs';

function DomainImportDialog({ onImport, isLoading = false }) {
  const [open, setOpen] = useState(false);
  const [lineInput, setLineInput] = useState("");
  const [stringInput, setStringInput] = useState("");
  const [fileInput, setFileInput] = useState(null);
  const [activeTab, setActiveTab] = useState("lines");
  const handleImport = async () => {
    let domains = [];
    switch (activeTab) {
      case "lines":
        domains = lineInput.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
        break;
      case "string":
        domains = stringInput.split(",").map((domain) => domain.trim()).filter((domain) => domain.length > 0);
        break;
      case "file":
        if (fileInput) {
          const text = await fileInput.text();
          if (fileInput.name.endsWith(".csv")) {
            domains = text.split("\n").slice(1).map((line) => line.split(",")[0]).map((domain) => domain.trim().replace(/"/g, "")).filter((domain) => domain.length > 0);
          } else {
            domains = text.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
          }
        }
        break;
    }
    if (domains.length > 0) {
      await onImport(domains);
      setOpen(false);
      setLineInput("");
      setStringInput("");
      setFileInput(null);
    }
  };
  const downloadTemplate = () => {
    const csvContent = "domain\nexample.com\ngoogle.com\ngithub.com";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "domain-template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };
  return /* @__PURE__ */ jsxs(Dialog, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { children: [
      /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4 mr-2" }),
      "添加域名"
    ] }) }),
    /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-[600px]", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { children: "导入域名" }),
        /* @__PURE__ */ jsx(DialogDescription, { children: "选择导入方式来批量添加需要监控的域名" })
      ] }),
      /* @__PURE__ */ jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, className: "w-full", children: [
        /* @__PURE__ */ jsxs(TabsList, { className: "grid w-full grid-cols-3", children: [
          /* @__PURE__ */ jsx(TabsTrigger, { value: "lines", children: "按行粘贴" }),
          /* @__PURE__ */ jsx(TabsTrigger, { value: "file", children: "文件导入" }),
          /* @__PURE__ */ jsx(TabsTrigger, { value: "string", children: "字符串导入" })
        ] }),
        /* @__PURE__ */ jsx(TabsContent, { value: "lines", className: "space-y-4", children: /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: "域名列表（每行一个）" }),
          /* @__PURE__ */ jsx(
            Textarea,
            {
              placeholder: "example.com\ngoogle.com\ngithub.com",
              value: lineInput,
              onChange: (e) => setLineInput(e.target.value),
              rows: 8
            }
          )
        ] }) }),
        /* @__PURE__ */ jsx(TabsContent, { value: "file", className: "space-y-4", children: /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: "上传文件" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "file",
                accept: ".csv,.txt",
                onChange: (e) => setFileInput(e.target.files?.[0] || null)
              }
            ),
            /* @__PURE__ */ jsxs(
              Button,
              {
                type: "button",
                variant: "outline",
                size: "sm",
                onClick: downloadTemplate,
                children: [
                  /* @__PURE__ */ jsx(Download, { className: "h-4 w-4 mr-2" }),
                  "下载模板"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "支持 CSV 和 TXT 格式。CSV 文件请确保域名在第一列。" })
        ] }) }),
        /* @__PURE__ */ jsx(TabsContent, { value: "string", className: "space-y-4", children: /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: "域名字符串（逗号分隔）" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              placeholder: "example.com, google.com, github.com",
              value: stringInput,
              onChange: (e) => setStringInput(e.target.value)
            }
          )
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-end space-x-2", children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setOpen(false), children: "取消" }),
        /* @__PURE__ */ jsx(Button, { onClick: handleImport, disabled: isLoading, children: isLoading ? "导入中..." : "导入域名" })
      ] })
    ] })
  ] });
}

function BatchOperationDialog({
  open,
  onClose,
  selectedDomains,
  domains,
  onSuccess,
  language = "zh"
}) {
  const [processing, setProcessing] = useState(false);
  const [operation, setOperation] = useState("mark-important");
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState(null);
  const labels = language === "en" ? {
    title: "Batch Operations",
    description: `Perform operations on ${selectedDomains.length} selected domains`,
    operation: "Operation Type",
    markImportant: "Mark as Important",
    unmarkImportant: "Unmark as Important",
    addNotes: "Add Notes",
    clearNotes: "Clear Notes",
    notesLabel: "Notes Content",
    notesPlaceholder: "Enter notes for selected domains...",
    selectedDomains: "Selected Domains",
    cancel: "Cancel",
    apply: "Apply",
    processing: "Processing...",
    success: "Operation completed successfully",
    error: "Operation failed",
    close: "Close"
  } : {
    title: "批量操作",
    description: `对选中的 ${selectedDomains.length} 个域名执行操作`,
    operation: "操作类型",
    markImportant: "标记为重要",
    unmarkImportant: "取消重要标记",
    addNotes: "添加备注",
    clearNotes: "清除备注",
    notesLabel: "备注内容",
    notesPlaceholder: "为选中的域名输入备注...",
    selectedDomains: "选中的域名",
    cancel: "取消",
    apply: "应用",
    processing: "处理中...",
    success: "操作成功完成",
    error: "操作失败",
    close: "关闭"
  };
  const resetDialog = () => {
    setOperation("mark-important");
    setNotes("");
    setResult(null);
  };
  const handleClose = () => {
    resetDialog();
    onClose();
  };
  const handleApply = async () => {
    if (operation === "add-notes" && !notes.trim()) {
      return;
    }
    setProcessing(true);
    setResult(null);
    try {
      let response;
      if (operation === "mark-important" || operation === "unmark-important") {
        const isImportant = operation === "mark-important";
        response = await apiService.batchMarkImportant(selectedDomains, isImportant);
      } else if (operation === "add-notes" || operation === "clear-notes") {
        const notesContent = operation === "add-notes" ? notes.trim() : "";
        response = await apiService.batchAddNotes(selectedDomains, notesContent);
      }
      if (response?.success) {
        setResult({ success: true, message: response.message });
        onSuccess();
        setTimeout(() => {
          handleClose();
        }, 2e3);
      } else {
        setResult({ success: false, message: response?.message || labels.error });
      }
    } catch (error) {
      console.error("批量操作失败:", error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : labels.error
      });
    } finally {
      setProcessing(false);
    }
  };
  const getSelectedDomainNames = () => {
    return selectedDomains.map((id) => domains.find((d) => d.id === id)?.domain).filter(Boolean).slice(0, 5);
  };
  const selectedDomainNames = getSelectedDomainNames();
  const hasMoreDomains = selectedDomains.length > 5;
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange: handleClose, children: /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-md", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxs(DialogTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Users, { className: "h-5 w-5" }),
        labels.title
      ] }),
      /* @__PURE__ */ jsx(DialogDescription, { children: labels.description })
    ] }),
    !result && /* @__PURE__ */ jsxs("div", { className: "space-y-4 py-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsx(Label, { className: "text-base font-medium", children: labels.operation }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-3 p-3 border rounded-lg", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "radio",
                id: "mark-important",
                name: "operation",
                value: "mark-important",
                checked: operation === "mark-important",
                onChange: (e) => e.target.checked && setOperation("mark-important"),
                className: "w-4 h-4"
              }
            ),
            /* @__PURE__ */ jsxs("label", { htmlFor: "mark-important", className: "flex items-center gap-2 cursor-pointer flex-1", children: [
              /* @__PURE__ */ jsx(Star, { className: "h-4 w-4 text-yellow-500" }),
              /* @__PURE__ */ jsx("span", { children: labels.markImportant })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-3 p-3 border rounded-lg", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "radio",
                id: "unmark-important",
                name: "operation",
                value: "unmark-important",
                checked: operation === "unmark-important",
                onChange: (e) => e.target.checked && setOperation("unmark-important"),
                className: "w-4 h-4"
              }
            ),
            /* @__PURE__ */ jsxs("label", { htmlFor: "unmark-important", className: "flex items-center gap-2 cursor-pointer flex-1", children: [
              /* @__PURE__ */ jsx(StarOff, { className: "h-4 w-4 text-gray-500" }),
              /* @__PURE__ */ jsx("span", { children: labels.unmarkImportant })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-3 p-3 border rounded-lg", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "radio",
                id: "add-notes",
                name: "operation",
                value: "add-notes",
                checked: operation === "add-notes",
                onChange: (e) => e.target.checked && setOperation("add-notes"),
                className: "w-4 h-4"
              }
            ),
            /* @__PURE__ */ jsxs("label", { htmlFor: "add-notes", className: "flex items-center gap-2 cursor-pointer flex-1", children: [
              /* @__PURE__ */ jsx(MessageSquare, { className: "h-4 w-4 text-blue-500" }),
              /* @__PURE__ */ jsx("span", { children: labels.addNotes })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-3 p-3 border rounded-lg", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "radio",
                id: "clear-notes",
                name: "operation",
                value: "clear-notes",
                checked: operation === "clear-notes",
                onChange: (e) => e.target.checked && setOperation("clear-notes"),
                className: "w-4 h-4"
              }
            ),
            /* @__PURE__ */ jsxs("label", { htmlFor: "clear-notes", className: "flex items-center gap-2 cursor-pointer flex-1", children: [
              /* @__PURE__ */ jsx(MessageSquare, { className: "h-4 w-4 text-red-500" }),
              /* @__PURE__ */ jsx("span", { children: labels.clearNotes })
            ] })
          ] })
        ] })
      ] }),
      operation === "add-notes" && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "notes", className: "text-base font-medium", children: labels.notesLabel }),
        /* @__PURE__ */ jsx(
          Textarea,
          {
            id: "notes",
            value: notes,
            onChange: (e) => setNotes(e.target.value),
            placeholder: labels.notesPlaceholder,
            className: "min-h-[80px]"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { className: "text-base font-medium", children: labels.selectedDomains }),
        /* @__PURE__ */ jsx("div", { className: "p-3 bg-muted rounded-lg max-h-32 overflow-y-auto", children: /* @__PURE__ */ jsxs("div", { className: "text-sm space-y-1", children: [
          selectedDomainNames.map((domain) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "w-2 h-2 bg-blue-500 rounded-full" }),
            /* @__PURE__ */ jsx("span", { children: domain })
          ] }, domain)),
          hasMoreDomains && /* @__PURE__ */ jsx("div", { className: "text-muted-foreground italic", children: language === "en" ? `... and ${selectedDomains.length - 5} more` : `... 还有 ${selectedDomains.length - 5} 个` })
        ] }) })
      ] })
    ] }),
    result && /* @__PURE__ */ jsx("div", { className: "py-4", children: /* @__PURE__ */ jsxs("div", { className: `flex items-center gap-3 p-4 rounded-lg ${result.success ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`, children: [
      result.success ? /* @__PURE__ */ jsx(Check, { className: "h-5 w-5 text-green-600" }) : /* @__PURE__ */ jsx(AlertCircle, { className: "h-5 w-5 text-red-600" }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "font-medium", children: result.success ? labels.success : labels.error }),
        /* @__PURE__ */ jsx("p", { className: "text-sm mt-1", children: result.message })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(DialogFooter, { children: !result ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: handleClose, children: labels.cancel }),
      /* @__PURE__ */ jsxs(
        Button,
        {
          onClick: handleApply,
          disabled: processing || operation === "add-notes" && !notes.trim(),
          children: [
            processing && /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 mr-2 animate-spin" }),
            labels.apply
          ]
        }
      )
    ] }) : /* @__PURE__ */ jsx(Button, { onClick: handleClose, variant: "outline", children: labels.close }) })
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
  const [batchOperationDialogOpen, setBatchOperationDialogOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteValue, setEditingNoteValue] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [showDomainInfo, setShowDomainInfo] = useState(false);
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
    if (onGroupOperationSuccess) {
      onGroupOperationSuccess();
    }
    if (selectedGroupId === "ungrouped") {
      loadUngroupedDomains();
    } else if (selectedGroupId && selectedGroupId !== null) {
      loadGroupDomains(selectedGroupId);
    }
  };
  const handleGroupFilterChange = (groupId) => {
    setSelectedGroupId(groupId);
    setSelectedDomains(/* @__PURE__ */ new Set());
  };
  const handleEditNote = (domainId, currentNotes) => {
    setEditingNoteId(domainId);
    setEditingNoteValue(currentNotes || "");
  };
  const handleSaveNote = async (domainId) => {
    if (savingNote) return;
    setSavingNote(true);
    try {
      await apiService.updateDomainNotes(domainId, editingNoteValue);
      if (onGroupOperationSuccess) {
        onGroupOperationSuccess();
      }
      setEditingNoteId(null);
      setEditingNoteValue("");
    } catch (error) {
      console.error("更新备注失败:", error);
    } finally {
      setSavingNote(false);
    }
  };
  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingNoteValue("");
  };
  const handleNoteKeyDown = (e, domainId) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveNote(domainId);
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancelEdit();
    }
  };
  const handleShowDomainInfo = (domain) => {
    setSelectedDomain(domain);
    setShowDomainInfo(true);
  };
  const handleCloseDomainInfo = () => {
    setShowDomainInfo(false);
    setSelectedDomain(null);
  };
  const getCurrentGroupInfo = () => {
    if (selectedGroupId === null) {
      return { name: "全部域名", color: "#6B7280" };
    } else if (selectedGroupId === "ungrouped") {
      return { name: "未分组", color: "#6B7280" };
    } else {
      const group = groups.find((g) => g.id === selectedGroupId);
      return group ? { name: group.name, color: group.color } : { name: "未知分组", color: "#6B7280" };
    }
  };
  const currentGroupInfo = getCurrentGroupInfo();
  const labels = language === "en" ? {
    searchPlaceholder: "Search domains or registrars...",
    domain: "Domain",
    registrar: "Registrar",
    expiresAt: "Expires",
    deleteSelected: "Delete Selected",
    groupOperation: "Group Operations",
    allGroups: "All Groups",
    ungrouped: "Ungrouped",
    filterByGroup: "Filter by Group",
    dnsProvider: "DNS Provider",
    statusLabel: "Status Label",
    lastCheck: "Last Check",
    batchOperations: "Batch Operations",
    notes: "Notes"
  } : {
    searchPlaceholder: "搜索域名或注册商...",
    domain: "域名",
    registrar: "注册商",
    expiresAt: "到期时间",
    deleteSelected: "删除选中",
    groupOperation: "分组操作",
    allGroups: "所有分组",
    ungrouped: "未分组",
    filterByGroup: "按分组筛选",
    dnsProvider: "DNS提供商",
    statusLabel: "状态标识",
    lastCheck: "最后检查",
    batchOperations: "批量操作",
    notes: "备注"
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
      /* @__PURE__ */ jsx("span", { className: "text-sm text-blue-600 dark:text-blue-400", children: "正在显示:" }),
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
          " 个域名)"
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
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "outline",
            onClick: () => setBatchOperationDialogOpen(true),
            className: "flex items-center gap-2",
            children: [
              /* @__PURE__ */ jsx(Settings, { className: "h-4 w-4" }),
              labels.batchOperations,
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
        /* @__PURE__ */ jsx(
          TableHead,
          {
            className: "cursor-pointer hover:bg-muted/50 text-center",
            onClick: () => handleSort("status"),
            children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center", children: [
              labels.statusLabel,
              /* @__PURE__ */ jsx(ArrowUpDown, { className: "ml-2 h-4 w-4" })
            ] })
          }
        ),
        /* @__PURE__ */ jsx(TableHead, { className: "text-center", children: labels.lastCheck }),
        /* @__PURE__ */ jsx(TableHead, { className: "text-center", children: labels.notes }),
        /* @__PURE__ */ jsx(TableHead, { className: "text-center", children: "操作" })
      ] }) }),
      /* @__PURE__ */ jsx(TableBody, { children: sortedDomains.map((domain) => /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableCell, { className: "text-center w-12", children: /* @__PURE__ */ jsx(
          Checkbox,
          {
            checked: selectedDomains.has(domain.id),
            onChange: (checked) => handleSelectDomain(domain.id, checked)
          }
        ) }),
        /* @__PURE__ */ jsx(TableCell, { className: "font-medium text-center", children: domain.isImportant ? /* @__PURE__ */ jsxs("span", { className: "flex items-center justify-center gap-1", children: [
          /* @__PURE__ */ jsx(Star, { className: "h-3 w-3 text-yellow-500" }),
          /* @__PURE__ */ jsx("span", { children: domain.domain })
        ] }) : /* @__PURE__ */ jsx("span", { children: domain.domain }) }),
        /* @__PURE__ */ jsx(TableCell, { className: "text-center", children: domain.registrar || "-" }),
        /* @__PURE__ */ jsx(TableCell, { className: "text-center min-w-[140px]", children: /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("div", { className: "whitespace-nowrap", children: formatDate(domain.expiresAt) }),
          domain.expiresAt && (() => {
            const timeInfo = formatRelativeTime(domain.expiresAt);
            return /* @__PURE__ */ jsxs("div", { className: `text-xs ${timeInfo.className || "text-muted-foreground"} flex items-center justify-center gap-1`, children: [
              timeInfo.warning && /* @__PURE__ */ jsx(AlertTriangle, { className: "h-3 w-3 text-red-600" }),
              timeInfo.text
            ] });
          })()
        ] }) }),
        /* @__PURE__ */ jsx(TableCell, { className: "text-center", children: domain.dnsProvider || "-" }),
        /* @__PURE__ */ jsx(TableCell, { className: "text-center", children: /* @__PURE__ */ jsx(Badge, { variant: statusConfig[domain.status].variant, children: renderStatusLabel(domain.status) }) }),
        /* @__PURE__ */ jsx(TableCell, { className: "text-sm text-muted-foreground text-center", children: getTimeAgo(domain.lastCheck) }),
        /* @__PURE__ */ jsx(TableCell, { className: "text-center max-w-[120px]", children: editingNoteId === domain.id ? (
          // 编辑模式
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(
              Input,
              {
                value: editingNoteValue,
                onChange: (e) => setEditingNoteValue(e.target.value),
                onKeyDown: (e) => handleNoteKeyDown(e, domain.id),
                onBlur: () => handleSaveNote(domain.id),
                placeholder: language === "en" ? "Enter notes..." : "输入备注...",
                className: "h-8 text-xs",
                disabled: savingNote,
                autoFocus: true
              }
            ),
            /* @__PURE__ */ jsx(
              Button,
              {
                size: "sm",
                variant: "ghost",
                onClick: handleCancelEdit,
                className: "h-6 w-6 p-0",
                disabled: savingNote,
                children: "×"
              }
            )
          ] })
        ) : (
          // 显示模式
          /* @__PURE__ */ jsx(
            "div",
            {
              className: "cursor-pointer hover:bg-muted/30 rounded px-2 py-1 min-h-[32px] flex items-center justify-center",
              onClick: () => handleEditNote(domain.id, domain.notes || ""),
              title: domain.notes ? `${domain.notes} (点击编辑)` : "点击添加备注",
              children: domain.notes ? /* @__PURE__ */ jsx("span", { className: "text-sm text-blue-600 truncate max-w-[100px]", title: domain.notes, children: domain.notes.length > 6 ? `${domain.notes.substring(0, 6)}...` : domain.notes }) : /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-xs", children: "+ 添加备注" })
            }
          )
        ) }),
        /* @__PURE__ */ jsx(TableCell, { className: "text-center", children: /* @__PURE__ */ jsx(
          Button,
          {
            variant: "ghost",
            size: "sm",
            onClick: () => handleShowDomainInfo(domain),
            className: "text-xs px-2 h-7",
            children: "更多信息"
          }
        ) })
      ] }, domain.id)) })
    ] }) }),
    sortedDomains.length === 0 && /* @__PURE__ */ jsx("div", { className: "text-center py-8 text-muted-foreground", children: searchTerm ? "没有找到匹配的域名" : "暂无域名数据" }),
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
    ),
    /* @__PURE__ */ jsx(
      BatchOperationDialog,
      {
        open: batchOperationDialogOpen,
        onClose: () => setBatchOperationDialogOpen(false),
        selectedDomains: Array.from(selectedDomains),
        domains,
        onSuccess: () => {
          setSelectedDomains(/* @__PURE__ */ new Set());
          setBatchOperationDialogOpen(false);
          if (onGroupOperationSuccess) {
            onGroupOperationSuccess();
          }
        },
        language
      }
    ),
    /* @__PURE__ */ jsx(
      DomainInfoDialog,
      {
        open: showDomainInfo,
        onClose: handleCloseDomainInfo,
        domain: selectedDomain,
        language
      }
    )
  ] });
}

function Dashboard() {
  const [domains, setDomains] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRechecking, setIsRechecking] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  useEffect(() => {
    const loadDomains = async () => {
      try {
        const domainData = await apiService.getDomains();
        setDomains(domainData);
      } catch (error) {
        console.error("Failed to load domains:", error);
      } finally {
        setIsInitialLoading(false);
      }
    };
    loadDomains();
  }, []);
  const handleImport = async (domainNames) => {
    setIsLoading(true);
    try {
      const result = await apiService.importDomains(domainNames);
      const updatedDomains = await apiService.getDomains();
      setDomains(updatedDomains);
      return result;
    } catch (error) {
      console.error("Failed to import domains:", error);
      return {
        success: [],
        errors: [`Import failed: ${error instanceof Error ? error.message : "Unknown error"}`],
        total: domainNames.length
      };
    } finally {
      setIsLoading(false);
    }
  };
  const handleRefreshDomain = async (domainId) => {
    try {
      await apiService.refreshDomain(domainId);
      const updatedDomains = await apiService.getDomains();
      setDomains(updatedDomains);
    } catch (error) {
      console.error("Failed to refresh domain:", error);
    }
  };
  const handleDeleteDomains = async (domainIds) => {
    try {
      await apiService.deleteDomains(domainIds);
      const updatedDomains = await apiService.getDomains();
      setDomains(updatedDomains);
    } catch (error) {
      console.error("Failed to delete domains:", error);
    }
  };
  const handleRecheckAll = async () => {
    setIsRechecking(true);
    try {
      await apiService.recheckAllDomains();
      const updatedDomains = await apiService.getDomains();
      setDomains(updatedDomains);
    } catch (error) {
      console.error("Failed to recheck all domains:", error);
    } finally {
      setIsRechecking(false);
    }
  };
  const handleRefreshData = async () => {
    try {
      const updatedDomains = await apiService.getDomains();
      setDomains(updatedDomains);
    } catch (error) {
      console.error("Failed to refresh data:", error);
    }
  };
  const stats = domains.reduce((acc, domain) => {
    acc.total += 1;
    if (domain.status === "normal") acc.normal += 1;
    else if (domain.status === "expiring") acc.expiring += 1;
    else if (domain.status === "expired") acc.expired += 1;
    else if (domain.status === "failed") acc.failed += 1;
    return acc;
  }, { total: 0, normal: 0, expiring: 0, expired: 0, failed: 0 });
  if (isInitialLoading) {
    return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center min-h-[400px]", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx(RefreshCw, { className: "h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "正在加载域名数据..." })
    ] }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-gray-200 pb-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold tracking-tight", children: "域名列表" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-2", children: "管理和监控您的域名到期时间" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-4", children: [
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "outline",
            onClick: handleRecheckAll,
            disabled: isRechecking,
            children: [
              /* @__PURE__ */ jsx(RefreshCw, { className: `h-4 w-4 mr-2 ${isRechecking ? "animate-spin" : ""}` }),
              isRechecking ? "重新检查中..." : "重新检查"
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          DataExportDialog,
          {
            language: "zh",
            onExportComplete: (result) => {
              console.log("导出完成:", result);
            }
          }
        ),
        /* @__PURE__ */ jsx(
          DomainImportDialog,
          {
            onImport: handleImport,
            isLoading
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-5 gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-card p-4 rounded-lg border", children: [
        /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold", children: stats.total }),
        /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "总域名数" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-card p-4 rounded-lg border", children: [
        /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-green-600", children: stats.normal }),
        /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "正常" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-card p-4 rounded-lg border", children: [
        /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-yellow-600", children: stats.expiring }),
        /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "即将到期" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-card p-4 rounded-lg border", children: [
        /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-red-600", children: stats.expired }),
        /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "已过期" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-card p-4 rounded-lg border", children: [
        /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-gray-600", children: stats.failed }),
        /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "查询失败" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(
      DomainTable,
      {
        domains,
        onRefreshDomain: handleRefreshDomain,
        onDeleteDomains: handleDeleteDomains,
        onGroupOperationSuccess: handleRefreshData,
        language: "zh"
      }
    ) })
  ] });
}

const DashboardWithAuth = ({ language = "zh" }) => {
  return /* @__PURE__ */ jsx(AuthWrapper, { language, children: /* @__PURE__ */ jsx(Dashboard, {}) });
};

const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "DomMate - \u57DF\u540D\u76D1\u63A7\u5E73\u53F0" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "DashboardWithAuth", DashboardWithAuth, { "client:load": true, "language": "zh", "client:component-hydration": "load", "client:component-path": "/home/ivmm/domain/src/components/DashboardWithAuth.tsx", "client:component-export": "default" })} ` })} `;
}, "/home/ivmm/domain/src/pages/index.astro", void 0);

const $$file = "/home/ivmm/domain/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
