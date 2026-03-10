import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Upload, AlertCircle } from 'lucide-react';

interface ImportProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ImportProjectsModal({ isOpen, onClose, onSuccess }: ImportProjectsModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [dryRun, setDryRun] = useState(true);
  const { toast } = useToast();

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      toast({ title: 'File selected', description: selectedFile.name });
    }
  };

  const handlePreview = async () => {
    if (!file) {
      toast({ title: 'Please select a file', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('target', 'projects');
      formData.append('dryRun', 'true');

      const response = await fetch(`${API_BASE}/api/import`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Import failed');
      }

      const result = await response.json();
      setPreview(result.result);
      toast({ title: 'Preview generated', description: `Found ${result.result.projects} projects` });
    } catch (err) {
      console.error('Preview failed:', err);
      toast({ 
        title: 'Preview failed', 
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({ title: 'Please select a file', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('target', 'projects');
      formData.append('dryRun', 'false');

      const response = await fetch(`${API_BASE}/api/import`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Import failed');
      }

      const result = await response.json();
      toast({ 
        title: 'Import successful', 
        description: `${result.result.projects} projects imported` 
      });
      
      setFile(null);
      setPreview(null);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Import failed:', err);
      toast({ 
        title: 'Import failed', 
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Projects</DialogTitle>
          <DialogDescription>
            Upload an Excel file to import projects. Stage column will be automatically mapped to project status.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Stage Mapping Reference */}
          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
            <div className="font-semibold text-blue-900 mb-2">Stage to Status Mapping:</div>
            <div className="text-blue-800 grid grid-cols-2 gap-1 text-xs">
              <div>• "New Client" → new</div>
              <div>• "Submitted" → submitted</div>
              <div>• "Completed" → completed</div>
              <div>• "On Hold" → on_hold</div>
              <div>• "Archived" → archived</div>
              <div>• "Pending" → pending</div>
            </div>
          </div>

          {/* File Input */}
          <div className="space-y-2">
            <label className="block">
              <div className="text-sm font-medium text-gray-700 mb-2">Excel File</div>
              <Input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                disabled={loading}
                className="cursor-pointer"
              />
            </label>
            <p className="text-xs text-gray-500">
              Supported formats: Excel (.xlsx, .xls) or CSV. 
              Column names: Project Name, Client Name, Project Manager, Stage
            </p>
          </div>

          {/* Preview Results */}
          {preview && (
            <div className="bg-gray-50 border rounded p-3 text-sm">
              <div className="font-semibold mb-2">Preview Results:</div>
              <div className="space-y-1 text-gray-700">
                {preview.projects > 0 && (
                  <>
                    <div>✓ Projects to import: {preview.projects}</div>
                    {preview.mappedRows && Object.entries(preview.mappedRows).map(([sheet, data]: any) => (
                      <div key={sheet} className="text-xs text-gray-600">
                        Sheet "{sheet}": {data.projects?.length || 0} rows
                      </div>
                    ))}
                  </>
                )}
                {preview.projects === 0 && (
                  <div className="text-orange-600 flex gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>No projects found in file. Check column names.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dry Run Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="dryRun"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              disabled={loading}
              className="rounded"
            />
            <label htmlFor="dryRun" className="text-sm cursor-pointer">
              Preview only (no changes to database)
            </label>
          </div>
        </div>

        <DialogFooter className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePreview}
            disabled={loading || !file}
            variant="secondary"
          >
            <Upload className="w-4 h-4 mr-2" />
            {loading ? 'Processing...' : 'Preview'}
          </Button>
          {preview && preview.projects > 0 && (
            <Button
              onClick={handleImport}
              disabled={loading}
            >
              {loading ? 'Importing...' : 'Import Projects'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
