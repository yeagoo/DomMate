import { c as createComponent, d as renderComponent, r as renderTemplate } from '../chunks/astro/server_B-ZIt8ph.mjs';
import 'kleur/colors';
import { $ as $$LayoutEn } from '../chunks/LayoutEn_PX-ZJiKS.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { A as AuthWrapper } from '../chunks/AuthWrapper_DS0O-dGF.mjs';
import { B as Button, I as Input, a as Badge } from '../chunks/label_CWvTMChO.mjs';
import { D as Dialog, a as DialogTrigger, b as DialogContent, c as DialogHeader, d as DialogTitle, e as DialogDescription, f as apiService } from '../chunks/exportUtils_Dnz8QcP6.mjs';
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent, d as Table, e as TableHeader, f as TableRow, g as TableHead, C as Checkbox, h as TableBody, i as TableCell, B as BatchGroupDialog, D as DomainInfoDialog, j as DataExportDialog } from '../chunks/DataExportDialog_CSfVbozk.mjs';
import { T as Textarea } from '../chunks/textarea_CKytwyUR.mjs';
import { Plus, Download, Filter, Tag, Search, FolderPlus, Trash2, ArrowUpDown, Star, AlertTriangle, Circle, AlertCircle, XCircle, Clock, CheckCircle2, RefreshCw } from 'lucide-react';
export { renderers } from '../renderers.mjs';

function DomainImportDialogEn({ onImport, isLoading = false }) {
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
      "Add Domains"
    ] }) }),
    /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-[600px]", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { children: "Import Domains" }),
        /* @__PURE__ */ jsx(DialogDescription, { children: "Choose an import method to batch add domains for monitoring" })
      ] }),
      /* @__PURE__ */ jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, className: "w-full", children: [
        /* @__PURE__ */ jsxs(TabsList, { className: "grid w-full grid-cols-3", children: [
          /* @__PURE__ */ jsx(TabsTrigger, { value: "lines", children: "Line by Line" }),
          /* @__PURE__ */ jsx(TabsTrigger, { value: "file", children: "File Import" }),
          /* @__PURE__ */ jsx(TabsTrigger, { value: "string", children: "String Import" })
        ] }),
        /* @__PURE__ */ jsx(TabsContent, { value: "lines", className: "space-y-4", children: /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: "Domain List (one per line)" }),
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
          /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: "Upload File" }),
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
                  "Download Template"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Supports CSV and TXT formats. For CSV files, ensure domains are in the first column." })
        ] }) }),
        /* @__PURE__ */ jsx(TabsContent, { value: "string", className: "space-y-4", children: /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: "Domain String (comma separated)" }),
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
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setOpen(false), children: "Cancel" }),
        /* @__PURE__ */ jsx(Button, { onClick: handleImport, disabled: isLoading, children: isLoading ? "Importing..." : "Import Domains" })
      ] })
    ] })
  ] });
}

const statusConfig = {
  normal: { icon: CheckCircle2, label: "Normal", variant: "success", color: "text-white" },
  expiring: { icon: Clock, label: "Expiring", variant: "warning", color: "text-white" },
  expired: { icon: XCircle, label: "Expired", variant: "error", color: "text-white" },
  failed: { icon: AlertCircle, label: "Query Failed", variant: "secondary", color: "text-gray-600" },
  unregistered: { icon: Circle, label: "Unregistered", variant: "outline", color: "text-blue-600" }
};
const renderStatusLabel = (status) => {
  const config = statusConfig[status];
  const Icon = config.icon;
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 min-w-[100px] justify-center", children: [
    /* @__PURE__ */ jsx(Icon, { className: `h-3 w-3 ${config.color}` }),
    /* @__PURE__ */ jsx("span", { children: config.label })
  ] });
};
function DomainTableEn({
  domains,
  onRefreshDomain,
  onDeleteDomains,
  onGroupOperationSuccess
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("expiresAt");
  const [sortDirection, setSortDirection] = useState("asc");
  const [selectedDomains, setSelectedDomains] = useState(/* @__PURE__ */ new Set());
  const [batchGroupDialogOpen, setBatchGroupDialogOpen] = useState(false);
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
      console.error("Failed to update notes:", error);
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
      return { name: "All Domains", color: "#6B7280" };
    } else if (selectedGroupId === "ungrouped") {
      return { name: "Ungrouped", color: "#6B7280" };
    } else {
      const group = groups.find((g) => g.id === selectedGroupId);
      return group ? { name: group.name, color: group.color } : { name: "Unknown Group", color: "#6B7280" };
    }
  };
  const currentGroupInfo = getCurrentGroupInfo();
  const isAllSelected = sortedDomains.length > 0 && selectedDomains.size === sortedDomains.length;
  const isIndeterminate = selectedDomains.size > 0 && selectedDomains.size < sortedDomains.length;
  const formatDate = (date) => {
    if (!date) return "-";
    return new Intl.DateTimeFormat("en-US", {
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
      text = `in ${diffDays} days`;
      if (diffDays <= 7) {
        className = "text-red-600 font-semibold";
        warning = true;
      } else if (diffDays <= 30) {
        className = "text-red-600";
      } else if (diffDays <= 90) {
        className = "text-orange-600";
      }
    } else if (diffDays === 0) {
      text = "today";
      className = "text-red-600 font-semibold";
      warning = true;
    } else {
      text = `${Math.abs(diffDays)} days ago`;
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
      return `${diffDays} days ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hours ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minutes ago`;
    } else {
      return "just now";
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400", children: [
        /* @__PURE__ */ jsx(Filter, { className: "h-4 w-4" }),
        /* @__PURE__ */ jsx("span", { children: "Filter by Group:" })
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
            "All Groups (",
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
            "Ungrouped (",
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
      /* @__PURE__ */ jsx("span", { className: "text-sm text-blue-600 dark:text-blue-400", children: "Showing:" }),
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
          " domains)"
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
        /* @__PURE__ */ jsx(Search, { className: "absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            placeholder: "Search domains or registrars...",
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
              "Group Operations (",
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
              "Delete Selected (",
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
            className: "text-center cursor-pointer hover:bg-muted/50",
            onClick: () => handleSort("domain"),
            children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-1", children: [
              "Domain",
              /* @__PURE__ */ jsx(ArrowUpDown, { className: "h-4 w-4 opacity-50" })
            ] })
          }
        ),
        /* @__PURE__ */ jsx(
          TableHead,
          {
            className: "text-center cursor-pointer hover:bg-muted/50",
            onClick: () => handleSort("registrar"),
            children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-1", children: [
              "Registrar",
              /* @__PURE__ */ jsx(ArrowUpDown, { className: "h-4 w-4 opacity-50" })
            ] })
          }
        ),
        /* @__PURE__ */ jsx(
          TableHead,
          {
            className: "text-center cursor-pointer hover:bg-muted/50",
            onClick: () => handleSort("expiresAt"),
            children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-1", children: [
              "Expires At",
              /* @__PURE__ */ jsx(ArrowUpDown, { className: "h-4 w-4 opacity-50" })
            ] })
          }
        ),
        /* @__PURE__ */ jsx(TableHead, { className: "text-center", children: "DNS Provider" }),
        /* @__PURE__ */ jsx(
          TableHead,
          {
            className: "cursor-pointer hover:bg-muted/50 text-center",
            onClick: () => handleSort("status"),
            children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-1", children: [
              "Status Label",
              /* @__PURE__ */ jsx(ArrowUpDown, { className: "h-4 w-4 opacity-50" })
            ] })
          }
        ),
        /* @__PURE__ */ jsx(TableHead, { className: "text-center", children: "Last Check" }),
        /* @__PURE__ */ jsx(TableHead, { className: "text-center", children: "Notes" }),
        /* @__PURE__ */ jsx(TableHead, { className: "text-center", children: "Actions" })
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
        /* @__PURE__ */ jsx(TableCell, { className: "text-center min-w-[120px]", children: /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
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
                placeholder: "Enter notes...",
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
              title: domain.notes ? `${domain.notes} (Click to edit)` : "Click to add notes",
              children: domain.notes ? /* @__PURE__ */ jsx("span", { className: "text-sm text-blue-600 truncate max-w-[100px]", title: domain.notes, children: domain.notes.length > 6 ? `${domain.notes.substring(0, 6)}...` : domain.notes }) : /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-xs", children: "+ Add notes" })
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
            children: "More Info"
          }
        ) })
      ] }, domain.id)) })
    ] }) }),
    sortedDomains.length === 0 && /* @__PURE__ */ jsx("div", { className: "text-center py-8 text-muted-foreground", children: searchTerm ? "No matching domains found" : "No domain data" }),
    /* @__PURE__ */ jsx(
      BatchGroupDialog,
      {
        open: batchGroupDialogOpen,
        onClose: () => setBatchGroupDialogOpen(false),
        selectedDomains: Array.from(selectedDomains),
        domains,
        onSuccess: handleBatchGroupSuccess,
        language: "en"
      }
    ),
    /* @__PURE__ */ jsx(
      DomainInfoDialog,
      {
        open: showDomainInfo,
        onClose: handleCloseDomainInfo,
        domain: selectedDomain,
        language: "en"
      }
    )
  ] });
}

function DataExportDialogEn({ onExportComplete }) {
  return /* @__PURE__ */ jsx(
    DataExportDialog,
    {
      language: "en",
      onExportComplete
    }
  );
}

function DashboardEn() {
  const [domains, setDomains] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRechecking, setIsRechecking] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
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
  useEffect(() => {
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
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Loading domain data..." })
    ] }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-gray-200 pb-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold tracking-tight", children: "Domain List" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-2", children: "Manage and monitor your domain expiration times" })
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
              isRechecking ? "Rechecking..." : "Recheck All"
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          DataExportDialogEn,
          {
            onExportComplete: (result) => {
              console.log("Export completed:", result);
            }
          }
        ),
        /* @__PURE__ */ jsx(
          DomainImportDialogEn,
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
        /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Total Domains" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-card p-4 rounded-lg border", children: [
        /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-green-600", children: stats.normal }),
        /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Normal" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-card p-4 rounded-lg border", children: [
        /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-yellow-600", children: stats.expiring }),
        /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Expiring" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-card p-4 rounded-lg border", children: [
        /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-red-600", children: stats.expired }),
        /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Expired" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-card p-4 rounded-lg border", children: [
        /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-gray-600", children: stats.failed }),
        /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Failed" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(
      DomainTableEn,
      {
        domains,
        onRefreshDomain: handleRefreshDomain,
        onDeleteDomains: handleDeleteDomains,
        onGroupOperationSuccess: loadDomains
      }
    ) })
  ] });
}

const DashboardEnWithAuth = ({ language = "en" }) => {
  return /* @__PURE__ */ jsx(AuthWrapper, { language, children: /* @__PURE__ */ jsx(DashboardEn, {}) });
};

const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "LayoutEn", $$LayoutEn, { "title": "DomMate - Domain Monitoring Platform" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "DashboardEnWithAuth", DashboardEnWithAuth, { "client:load": true, "language": "en", "client:component-hydration": "load", "client:component-path": "/home/ivmm/domain/src/components/DashboardEnWithAuth.tsx", "client:component-export": "default" })} ` })} `;
}, "/home/ivmm/domain/src/pages/en/index.astro", void 0);

const $$file = "/home/ivmm/domain/src/pages/en/index.astro";
const $$url = "/en";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
