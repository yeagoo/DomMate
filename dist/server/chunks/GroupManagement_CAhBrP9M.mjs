import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText, FileJson, Loader2, Plus, Settings, Folder, Edit, Trash2 } from 'lucide-react';
import { D as Dialog, b as DialogContent, c as DialogHeader, d as DialogTitle, e as DialogDescription, L as Label, I as Input, g as DialogFooter, B as Button, f as apiService, R as RadioGroup, h as RadioGroupItem, F as FrontendExportUtils, i as Badge } from './exportUtils_CZhQIDIQ.mjs';
import { C as Card, a as CardHeader, b as CardTitle, c as CardDescription, d as CardContent } from './card_cJStKITS.mjs';

const GROUP_COLORS = [
  "#6B7280",
  // 灰色 - 默认
  "#EF4444",
  // 红色 - 重要
  "#10B981",
  // 绿色 - 开发
  "#3B82F6",
  // 蓝色
  "#8B5CF6",
  // 紫色
  "#F59E0B",
  // 黄色
  "#EC4899",
  // 粉色
  "#06B6D4",
  // 青色
  "#84CC16",
  // 石灰色
  "#F97316"
  // 橙色
];

function CreateGroupDialog({ open, onClose, onSuccess, language = "zh" }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(GROUP_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const labels = language === "en" ? {
    title: "Create New Group",
    description: "Create a new group to organize your domains",
    name: "Group Name",
    namePlaceholder: "Enter group name",
    nameRequired: "Group name is required",
    desc: "Description",
    descPlaceholder: "Enter description (optional)",
    color: "Color",
    cancel: "Cancel",
    create: "Create",
    creating: "Creating...",
    success: "Group created successfully",
    error: "Failed to create group"
  } : {
    title: "创建新分组",
    description: "创建新的分组来组织您的域名",
    name: "分组名称",
    namePlaceholder: "请输入分组名称",
    nameRequired: "分组名称不能为空",
    desc: "描述",
    descPlaceholder: "请输入描述（可选）",
    color: "颜色",
    cancel: "取消",
    create: "创建",
    creating: "创建中...",
    success: "分组创建成功",
    error: "创建分组失败"
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert(labels.nameRequired);
      return;
    }
    try {
      setLoading(true);
      await apiService.createGroup({
        name: name.trim(),
        description: description.trim(),
        color
      });
      alert(labels.success);
      onSuccess();
      handleClose();
    } catch (error) {
      console.error("创建分组失败:", error);
      alert(`${labels.error}: ${error.message || "未知错误"}`);
    } finally {
      setLoading(false);
    }
  };
  const handleClose = () => {
    setName("");
    setDescription("");
    setColor(GROUP_COLORS[0]);
    setLoading(false);
    onClose();
  };
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange: handleClose, children: /* @__PURE__ */ jsx(DialogContent, { className: "sm:max-w-md", children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsx(DialogTitle, { children: labels.title }),
      /* @__PURE__ */ jsx(DialogDescription, { children: labels.description })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-4 py-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "name", children: labels.name }),
        /* @__PURE__ */ jsx(
          Input,
          {
            id: "name",
            value: name,
            onChange: (e) => setName(e.target.value),
            placeholder: labels.namePlaceholder,
            maxLength: 50,
            required: true
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "description", children: labels.desc }),
        /* @__PURE__ */ jsx(
          Input,
          {
            id: "description",
            value: description,
            onChange: (e) => setDescription(e.target.value),
            placeholder: labels.descPlaceholder,
            maxLength: 200
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { children: labels.color }),
        /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: GROUP_COLORS.map((colorOption) => /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: `w-8 h-8 rounded-full border-2 transition-all ${color === colorOption ? "border-gray-900 scale-110" : "border-gray-300 hover:border-gray-500"}`,
            style: { backgroundColor: colorOption },
            onClick: () => setColor(colorOption)
          },
          colorOption
        )) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { children: language === "en" ? "Preview" : "预览" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 p-3 border rounded-lg bg-gray-50", children: [
          /* @__PURE__ */ jsx(
            "div",
            {
              className: "w-4 h-4 rounded-full",
              style: { backgroundColor: color }
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsx("div", { className: "font-medium", children: name || labels.namePlaceholder }),
            description && /* @__PURE__ */ jsx("div", { className: "text-sm text-gray-600", children: description })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsx(
        Button,
        {
          type: "button",
          variant: "outline",
          onClick: handleClose,
          disabled: loading,
          children: labels.cancel
        }
      ),
      /* @__PURE__ */ jsx(Button, { type: "submit", disabled: loading || !name.trim(), children: loading ? labels.creating : labels.create })
    ] })
  ] }) }) });
}

function EditGroupDialog({ open, group, onClose, onSuccess, language = "zh" }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(GROUP_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const labels = language === "en" ? {
    title: "Edit Group",
    description: "Update group information",
    name: "Group Name",
    namePlaceholder: "Enter group name",
    nameRequired: "Group name is required",
    desc: "Description",
    descPlaceholder: "Enter description (optional)",
    color: "Color",
    cancel: "Cancel",
    save: "Save Changes",
    saving: "Saving...",
    success: "Group updated successfully",
    error: "Failed to update group"
  } : {
    title: "编辑分组",
    description: "更新分组信息",
    name: "分组名称",
    namePlaceholder: "请输入分组名称",
    nameRequired: "分组名称不能为空",
    desc: "描述",
    descPlaceholder: "请输入描述（可选）",
    color: "颜色",
    cancel: "取消",
    save: "保存更改",
    saving: "保存中...",
    success: "分组更新成功",
    error: "更新分组失败"
  };
  useEffect(() => {
    if (open && group) {
      setName(group.name);
      setDescription(group.description || "");
      setColor(group.color);
    }
  }, [open, group]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert(labels.nameRequired);
      return;
    }
    try {
      setLoading(true);
      await apiService.updateGroup(group.id, {
        name: name.trim(),
        description: description.trim(),
        color
      });
      alert(labels.success);
      onSuccess();
      handleClose();
    } catch (error) {
      console.error("更新分组失败:", error);
      alert(`${labels.error}: ${error.message || "未知错误"}`);
    } finally {
      setLoading(false);
    }
  };
  const handleClose = () => {
    setLoading(false);
    onClose();
  };
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange: handleClose, children: /* @__PURE__ */ jsx(DialogContent, { className: "sm:max-w-md", children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsx(DialogTitle, { children: labels.title }),
      /* @__PURE__ */ jsx(DialogDescription, { children: labels.description })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-4 py-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "name", children: labels.name }),
        /* @__PURE__ */ jsx(
          Input,
          {
            id: "name",
            value: name,
            onChange: (e) => setName(e.target.value),
            placeholder: labels.namePlaceholder,
            maxLength: 50,
            required: true
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "description", children: labels.desc }),
        /* @__PURE__ */ jsx(
          Input,
          {
            id: "description",
            value: description,
            onChange: (e) => setDescription(e.target.value),
            placeholder: labels.descPlaceholder,
            maxLength: 200
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { children: labels.color }),
        /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: GROUP_COLORS.map((colorOption) => /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: `w-8 h-8 rounded-full border-2 transition-all ${color === colorOption ? "border-gray-900 scale-110" : "border-gray-300 hover:border-gray-500"}`,
            style: { backgroundColor: colorOption },
            onClick: () => setColor(colorOption)
          },
          colorOption
        )) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { children: language === "en" ? "Preview" : "预览" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 p-3 border rounded-lg bg-gray-50", children: [
          /* @__PURE__ */ jsx(
            "div",
            {
              className: "w-4 h-4 rounded-full",
              style: { backgroundColor: color }
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsx("div", { className: "font-medium", children: name || labels.namePlaceholder }),
            description && /* @__PURE__ */ jsx("div", { className: "text-sm text-gray-600", children: description })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsx(
        Button,
        {
          type: "button",
          variant: "outline",
          onClick: handleClose,
          disabled: loading,
          children: labels.cancel
        }
      ),
      /* @__PURE__ */ jsx(Button, { type: "submit", disabled: loading || !name.trim(), children: loading ? labels.saving : labels.save })
    ] })
  ] }) }) });
}

function GroupExportDialog({ open, group, onClose, language = "zh" }) {
  const [format, setFormat] = useState("csv");
  const [filename, setFilename] = useState("");
  const [loading, setLoading] = useState(false);
  const labels = language === "en" ? {
    title: `Export Group: ${group.name}`,
    description: `Export ${group.domainCount} domains from this group`,
    format: "Export Format",
    filename: "File Name",
    export: "Export",
    exporting: "Exporting...",
    cancel: "Cancel",
    csvDesc: "Excel compatible spreadsheet",
    pdfDesc: "Professional formatted report",
    jsonDesc: "Complete data backup",
    filenameHelp: "File name (without extension)",
    exportSuccess: "Group export completed successfully",
    exportError: "Group export failed",
    noDomains: "This group has no domains to export",
    clientExport: "Client-side Export",
    clientExportDesc: "Faster processing, no server storage required"
  } : {
    title: `导出分组: ${group.name}`,
    description: `导出该分组中的 ${group.domainCount} 个域名`,
    format: "导出格式",
    filename: "文件名",
    export: "导出",
    exporting: "导出中...",
    cancel: "取消",
    csvDesc: "Excel兼容的电子表格",
    pdfDesc: "专业格式的报告",
    jsonDesc: "完整数据备份",
    filenameHelp: "文件名（不含扩展名）",
    exportSuccess: "分组导出成功完成",
    exportError: "分组导出失败",
    noDomains: "该分组没有域名可导出",
    clientExport: "前端导出",
    clientExportDesc: "处理更快，无需服务器存储空间"
  };
  useEffect(() => {
    if (open && group) {
      setFilename(`${group.name}_domains`);
    }
  }, [open, group]);
  const handleExport = async () => {
    if (group.domainCount === 0) {
      alert(labels.noDomains);
      return;
    }
    setLoading(true);
    try {
      console.log(`获取分组域名数据: ${group.name}`);
      const domains = await apiService.getGroupDomains(group.id);
      if (domains.length === 0) {
        alert(labels.noDomains);
        return;
      }
      const allFields = ["domain", "registrar", "expiresAt", "dnsProvider", "status", "lastCheck"];
      console.log(`开始前端分组导出: 格式=${format}, 字段=${allFields.length}个, 域名=${domains.length}个`);
      const result = await FrontendExportUtils.export(
        format,
        domains,
        allFields,
        filename.trim() || `${group.name}_domains`,
        language,
        {
          title: language === "en" ? `${group.name} Domain Report` : `${group.name} 域名报告`
        }
      );
      if (result.success) {
        console.log(labels.exportSuccess, result);
        setTimeout(() => {
          let message = `✅ ${labels.exportSuccess}

`;
          message += `分组：${group.name}
`;
          message += `文件：${result.filename}
`;
          message += `记录数：${result.totalRecords}
`;
          message += `字段数：${result.selectedFields}`;
          if (format === "pdf" && result.note) {
            message += `

💡 ${result.note}`;
          }
          alert(message);
        }, 100);
        onClose();
      }
    } catch (error) {
      console.error(labels.exportError, error);
      alert(`❌ ${labels.exportError}

错误详情：${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setLoading(false);
    }
  };
  const formatIcons = {
    csv: FileSpreadsheet,
    pdf: FileText,
    json: FileJson
  };
  const FormatIcon = formatIcons[format];
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange: onClose, children: /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-lg", children: [
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
      /* @__PURE__ */ jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
          /* @__PURE__ */ jsx(
            "div",
            {
              className: "w-3 h-3 rounded-full",
              style: { backgroundColor: group.color }
            }
          ),
          /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-blue-800", children: group.name })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-blue-700", children: [
          "📋 ",
          language === "en" ? `Will export ${group.domainCount} domains from this group` : `将导出该分组中的 ${group.domainCount} 个域名`
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-green-50 border border-green-200 rounded-lg p-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("div", { className: "w-2 h-2 bg-green-500 rounded-full" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-green-800", children: labels.clientExport })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-green-700 mt-1", children: [
          "⚡ ",
          labels.clientExportDesc
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
            placeholder: `${group.name}_domains`
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
          onClick: onClose,
          disabled: loading,
          children: labels.cancel
        }
      ),
      /* @__PURE__ */ jsx(
        Button,
        {
          onClick: handleExport,
          disabled: loading || group.domainCount === 0,
          className: "gap-2",
          children: loading ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }),
            labels.exporting
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(FormatIcon, { className: "h-4 w-4" }),
            labels.export
          ] })
        }
      )
    ] })
  ] }) });
}

function GroupManagement({ language = "zh" }) {
  const [groups, setGroups] = useState([]);
  const [groupStats, setGroupStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [exportingGroup, setExportingGroup] = useState(null);
  const labels = language === "en" ? {
    title: "Group Management",
    description: "Organize and manage your domain groups",
    createGroup: "Create Group",
    editGroup: "Edit Group",
    deleteGroup: "Delete Group",
    exportGroup: "Export Group",
    viewStats: "View Statistics",
    domains: "domains",
    noDomains: "No domains",
    defaultGroups: "System Groups",
    customGroups: "Custom Groups",
    loading: "Loading groups...",
    deleteConfirm: "Are you sure you want to delete this group? This action cannot be undone.",
    deleteSuccess: "Group deleted successfully",
    deleteError: "Failed to delete group",
    systemGroupError: "Cannot delete system default groups"
  } : {
    title: "分组管理",
    description: "组织和管理您的域名分组",
    createGroup: "创建分组",
    editGroup: "编辑分组",
    deleteGroup: "删除分组",
    exportGroup: "导出分组",
    viewStats: "查看统计",
    domains: "个域名",
    noDomains: "暂无域名",
    defaultGroups: "系统分组",
    customGroups: "自定义分组",
    loading: "加载分组中...",
    deleteConfirm: "确定要删除这个分组吗？此操作不可撤销。",
    deleteSuccess: "分组删除成功",
    deleteError: "删除分组失败",
    systemGroupError: "无法删除系统默认分组"
  };
  useEffect(() => {
    loadGroups();
    loadGroupStats();
  }, []);
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
  const loadGroupStats = async () => {
    try {
      const stats = await apiService.getGroupStats();
      setGroupStats(stats);
    } catch (error) {
      console.error("获取分组统计失败:", error);
    }
  };
  const handleDeleteGroup = async (group) => {
    const systemGroups2 = ["default", "important", "development"];
    if (systemGroups2.includes(group.id)) {
      alert(labels.systemGroupError);
      return;
    }
    if (confirm(labels.deleteConfirm)) {
      try {
        await apiService.deleteGroup(group.id);
        alert(labels.deleteSuccess);
        loadGroups();
        loadGroupStats();
      } catch (error) {
        console.error("删除分组失败:", error);
        alert(`${labels.deleteError}: ${error.message || "未知错误"}`);
      }
    }
  };
  const handleGroupCreated = () => {
    loadGroups();
    loadGroupStats();
    setCreateDialogOpen(false);
  };
  const handleGroupUpdated = () => {
    loadGroups();
    loadGroupStats();
    setEditingGroup(null);
  };
  const systemGroups = groups.filter((g) => ["default", "important", "development"].includes(g.id));
  const customGroups = groups.filter((g) => !["default", "important", "development"].includes(g.id));
  const getGroupStatsById = (groupId) => {
    return groupStats.find((s) => s.id === groupId);
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-64", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: labels.loading })
    ] }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900", children: labels.title }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: labels.description })
      ] }),
      /* @__PURE__ */ jsxs(Button, { onClick: () => setCreateDialogOpen(true), className: "gap-2", children: [
        /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
        labels.createGroup
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Settings, { className: "h-5 w-5 text-gray-500" }),
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-800", children: labels.defaultGroups })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: systemGroups.map((group) => {
        const stats = getGroupStatsById(group.id);
        return /* @__PURE__ */ jsx(
          GroupCard,
          {
            group,
            stats,
            isSystemGroup: true,
            language,
            labels,
            onEdit: () => setEditingGroup(group),
            onDelete: () => handleDeleteGroup(group),
            onExport: () => setExportingGroup(group)
          },
          group.id
        );
      }) })
    ] }),
    customGroups.length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Folder, { className: "h-5 w-5 text-gray-500" }),
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-800", children: labels.customGroups })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: customGroups.map((group) => {
        const stats = getGroupStatsById(group.id);
        return /* @__PURE__ */ jsx(
          GroupCard,
          {
            group,
            stats,
            isSystemGroup: false,
            language,
            labels,
            onEdit: () => setEditingGroup(group),
            onDelete: () => handleDeleteGroup(group),
            onExport: () => setExportingGroup(group)
          },
          group.id
        );
      }) })
    ] }),
    /* @__PURE__ */ jsx(
      CreateGroupDialog,
      {
        open: createDialogOpen,
        onClose: () => setCreateDialogOpen(false),
        onSuccess: handleGroupCreated,
        language
      }
    ),
    editingGroup && /* @__PURE__ */ jsx(
      EditGroupDialog,
      {
        open: true,
        group: editingGroup,
        onClose: () => setEditingGroup(null),
        onSuccess: handleGroupUpdated,
        language
      }
    ),
    exportingGroup && /* @__PURE__ */ jsx(
      GroupExportDialog,
      {
        open: true,
        group: exportingGroup,
        onClose: () => setExportingGroup(null),
        language
      }
    )
  ] });
}
function GroupCard({ group, stats, isSystemGroup, language, labels, onEdit, onDelete, onExport }) {
  const statusCounts = {
    normal: stats?.normalCount || 0,
    expiring: stats?.expiringCount || 0,
    expired: stats?.expiredCount || 0,
    failed: stats?.failedCount || 0
  };
  return /* @__PURE__ */ jsxs(Card, { className: "relative group hover:shadow-md transition-shadow", children: [
    /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 flex-1", children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            className: "w-4 h-4 rounded-full flex-shrink-0",
            style: { backgroundColor: group.color }
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsx(CardTitle, { className: "text-lg truncate", children: group.name }),
          group.description && /* @__PURE__ */ jsx(CardDescription, { className: "text-sm truncate", children: group.description })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity", children: [
        /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", onClick: onEdit, children: /* @__PURE__ */ jsx(Edit, { className: "h-3 w-3" }) }),
        group.domainCount > 0 && /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", onClick: onExport, children: /* @__PURE__ */ jsx(Download, { className: "h-3 w-3" }) }),
        !isSystemGroup && /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", onClick: onDelete, className: "text-red-600 hover:text-red-700", children: /* @__PURE__ */ jsx(Trash2, { className: "h-3 w-3" }) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(CardContent, { className: "pt-0", children: /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-600", children: language === "en" ? "Domains" : "域名数量" }),
        /* @__PURE__ */ jsx(Badge, { variant: "secondary", children: group.domainCount > 0 ? `${group.domainCount} ${labels.domains}` : labels.noDomains })
      ] }),
      group.domainCount > 0 && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 text-xs", children: [
        statusCounts.normal > 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("span", { className: "text-green-600", children: language === "en" ? "Normal" : "正常" }),
          /* @__PURE__ */ jsx("span", { className: "font-medium", children: statusCounts.normal })
        ] }),
        statusCounts.expiring > 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("span", { className: "text-yellow-600", children: language === "en" ? "Expiring" : "即将到期" }),
          /* @__PURE__ */ jsx("span", { className: "font-medium", children: statusCounts.expiring })
        ] }),
        statusCounts.expired > 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("span", { className: "text-red-600", children: language === "en" ? "Expired" : "已过期" }),
          /* @__PURE__ */ jsx("span", { className: "font-medium", children: statusCounts.expired })
        ] }),
        statusCounts.failed > 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("span", { className: "text-gray-600", children: language === "en" ? "Failed" : "失败" }),
          /* @__PURE__ */ jsx("span", { className: "font-medium", children: statusCounts.failed })
        ] })
      ] })
    ] }) })
  ] });
}

export { GroupManagement as G };
