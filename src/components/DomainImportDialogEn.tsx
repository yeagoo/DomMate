import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Plus, Download } from 'lucide-react';
import type { ImportResult } from '@/types/domain';

interface DomainImportDialogEnProps {
  onImport: (domains: string[]) => Promise<ImportResult>;
  isLoading?: boolean;
}

export function DomainImportDialogEn({ onImport, isLoading = false }: DomainImportDialogEnProps) {
  const [open, setOpen] = useState(false);
  const [lineInput, setLineInput] = useState('');
  const [stringInput, setStringInput] = useState('');
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState('lines');

  const handleImport = async () => {
    let domains: string[] = [];

    switch (activeTab) {
      case 'lines':
        domains = lineInput
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);
        break;
      case 'string':
        domains = stringInput
          .split(',')
          .map(domain => domain.trim())
          .filter(domain => domain.length > 0);
        break;
      case 'file':
        if (fileInput) {
          const text = await fileInput.text();
          if (fileInput.name.endsWith('.csv')) {
            domains = text
              .split('\n')
              .slice(1)
              .map(line => line.split(',')[0])
              .map(domain => domain.trim().replace(/"/g, ''))
              .filter(domain => domain.length > 0);
          } else {
            domains = text
              .split('\n')
              .map(line => line.trim())
              .filter(line => line.length > 0);
          }
        }
        break;
    }

    if (domains.length > 0) {
      await onImport(domains);
      setOpen(false);
      setLineInput('');
      setStringInput('');
      setFileInput(null);
    }
  };

  const downloadTemplate = () => {
    const csvContent = "domain\nexample.com\ngoogle.com\ngithub.com";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'domain-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Domains
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Domains</DialogTitle>
          <DialogDescription>
            Choose an import method to batch add domains for monitoring
          </DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="lines">Line by Line</TabsTrigger>
            <TabsTrigger value="file">File Import</TabsTrigger>
            <TabsTrigger value="string">String Import</TabsTrigger>
          </TabsList>
          
          <TabsContent value="lines" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Domain List (one per line)</label>
              <Textarea
                placeholder="example.com&#10;google.com&#10;github.com"
                value={lineInput}
                onChange={(e) => setLineInput(e.target.value)}
                rows={8}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="file" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Upload File</label>
              <div className="flex items-center space-x-2">
                <Input
                  type="file"
                  accept=".csv,.txt"
                  onChange={(e) => setFileInput(e.target.files?.[0] || null)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={downloadTemplate}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Supports CSV and TXT formats. For CSV files, ensure domains are in the first column.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="string" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Domain String (comma separated)</label>
              <Input
                placeholder="example.com, google.com, github.com"
                value={stringInput}
                onChange={(e) => setStringInput(e.target.value)}
              />
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={isLoading}>
            {isLoading ? 'Importing...' : 'Import Domains'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 