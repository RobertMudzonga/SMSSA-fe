import { useState } from 'react';
import { Download, CheckSquare, Square } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';

interface Document {
  document_id: number;
  name: string;
  document_type: string;
  size: number;
}

interface BulkDownloadProps {
  documents: Document[];
  projectName?: string;
}

export default function BulkDownload({ documents, projectName }: BulkDownloadProps) {
  const [selectedDocs, setSelectedDocs] = useState<Set<number>>(new Set());
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();

  const toggleDocument = (docId: number) => {
    const newSet = new Set(selectedDocs);
    if (newSet.has(docId)) {
      newSet.delete(docId);
    } else {
      newSet.add(docId);
    }
    setSelectedDocs(newSet);
  };

  const toggleAll = () => {
    if (selectedDocs.size === documents.length) {
      setSelectedDocs(new Set());
    } else {
      setSelectedDocs(new Set(documents.map(d => d.document_id)));
    }
  };

  const handleBulkDownload = async () => {
    if (selectedDocs.size === 0) {
      toast({ title: 'No documents selected', variant: 'destructive' });
      return;
    }

    setDownloading(true);
    try {
      const response = await fetch('/api/documents/bulk-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_ids: Array.from(selectedDocs) })
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName || 'documents'}_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({ title: 'Documents downloaded successfully' });
      setSelectedDocs(new Set());
    } catch (error) {
      console.error('Bulk download error:', error);
      toast({ title: 'Download failed', variant: 'destructive' });
    } finally {
      setDownloading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const totalSize = documents
    .filter(d => selectedDocs.has(d.document_id))
    .reduce((sum, d) => sum + (d.size || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAll}
          >
            {selectedDocs.size === documents.length ? (
              <CheckSquare className="h-4 w-4 mr-2" />
            ) : (
              <Square className="h-4 w-4 mr-2" />
            )}
            {selectedDocs.size === documents.length ? 'Deselect All' : 'Select All'}
          </Button>
          <span className="text-sm text-gray-600">
            {selectedDocs.size} of {documents.length} selected
            {selectedDocs.size > 0 && ` (${formatFileSize(totalSize)})`}
          </span>
        </div>
        <Button
          onClick={handleBulkDownload}
          disabled={selectedDocs.size === 0 || downloading}
        >
          <Download className="h-4 w-4 mr-2" />
          {downloading ? 'Downloading...' : 'Download Selected'}
        </Button>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {documents.map(doc => (
          <div
            key={doc.document_id}
            onClick={() => toggleDocument(doc.document_id)}
            className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
              selectedDocs.has(doc.document_id) ? 'bg-teal-50 border-teal-300' : 'hover:bg-gray-50'
            }`}
          >
            {selectedDocs.has(doc.document_id) ? (
              <CheckSquare className="h-5 w-5 text-teal-600 flex-shrink-0" />
            ) : (
              <Square className="h-5 w-5 text-gray-400 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{doc.name}</div>
              <div className="text-sm text-gray-600">
                {doc.document_type} • {formatFileSize(doc.size || 0)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
