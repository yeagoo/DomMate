import { c as createComponent, d as renderComponent, r as renderTemplate } from '../chunks/astro/server_B-ZIt8ph.mjs';
import 'kleur/colors';
import { $ as $$LayoutEn } from '../chunks/LayoutEn_CjN-98WB.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { D as Dialog, a as DialogTrigger, B as Button, b as DialogContent, c as DialogHeader, d as DialogTitle, e as DialogDescription, I as Input, f as apiService } from '../chunks/exportUtils_CZhQIDIQ.mjs';
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent, d as Textarea, D as DataExportDialog, e as DomainTable } from '../chunks/DataExportDialog_D_1LFlcA.mjs';
import { Plus, Download, RefreshCw } from 'lucide-react';
import '../chunks/card_cJStKITS.mjs';
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
  const handleToggleNotifications = async (domainId) => {
    const domain = domains.find((d) => d.id === domainId);
    if (!domain) return;
    try {
      await apiService.toggleNotifications(domainId, !domain.notifications);
      setDomains((prev) => prev.map(
        (d) => d.id === domainId ? { ...d, notifications: !d.notifications } : d
      ));
    } catch (error) {
      console.error("Failed to toggle notifications:", error);
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
      const result = await apiService.deleteDomains(domainIds);
      if (result.success) {
        console.log(result.message);
        setDomains((prev) => prev.filter((domain) => !domainIds.includes(domain.id)));
      }
    } catch (error) {
      console.error("Failed to delete domains:", error);
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
  const handleRecheckAll = async () => {
    setIsRechecking(true);
    try {
      const result = await apiService.recheckAllDomains();
      console.log(result.message);
      const updatedDomains = await apiService.getDomains();
      setDomains(updatedDomains);
    } catch (error) {
      console.error("Failed to recheck domains:", error);
    } finally {
      setIsRechecking(false);
    }
  };
  const stats = {
    total: domains.length,
    normal: domains.filter((d) => d.status === "normal").length,
    expiring: domains.filter((d) => d.status === "expiring").length,
    expired: domains.filter((d) => d.status === "expired").length,
    failed: domains.filter((d) => d.status === "failed").length
  };
  if (isInitialLoading) {
    return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center min-h-[400px]", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx(RefreshCw, { className: "h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Loading domain data..." })
    ] }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
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
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold tracking-tight", children: "Domain List" }),
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
    /* @__PURE__ */ jsx(
      DomainTable,
      {
        domains,
        onToggleNotifications: handleToggleNotifications,
        onRefreshDomain: handleRefreshDomain,
        onDeleteDomains: handleDeleteDomains,
        onGroupOperationSuccess: handleRefreshData,
        language: "en"
      }
    )
  ] });
}

const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "LayoutEn", $$LayoutEn, { "title": "DomainFlow - Domain Monitoring Platform" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "DashboardEn", DashboardEn, { "client:load": true, "client:component-hydration": "load", "client:component-path": "/home/ivmm/domain/src/components/DashboardEn.tsx", "client:component-export": "default" })} ` })} `;
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
