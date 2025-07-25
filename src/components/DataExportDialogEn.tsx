import { DataExportDialog } from './DataExportDialog';

interface DataExportDialogEnProps {
  onExportComplete?: (result: any) => void;
}

export function DataExportDialogEn({ onExportComplete }: DataExportDialogEnProps) {
  return (
    <DataExportDialog 
      language="en" 
      onExportComplete={onExportComplete} 
    />
  );
} 