import { useState, useEffect } from 'react';
import { History, Download, Upload, Eye, Trash2 } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { API_BASE } from '@/lib/api';
import DocumentPreviewModal from './DocumentPreviewModal';

interface DocumentVersion {
  document_id: number;
  name: string;
  version: number;
  is_latest_version: boolean;
  uploaded_by: string;
  created_at: string;
  size: number;
  mime_type: string;
}

interface DocumentVersionHistoryProps {
  documentId: number;
  onNewVersion?: () => void;
}

export default function DocumentVersionHistory({ documentId, onNewVersion }: DocumentVersionHistoryProps) {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewDocId, setPreviewDocId] = useState<number | null>(null);
  const [previewDocName, setPreviewDocName] = useState('');
  const [previewDocMime, setPreviewDocMime] = useState<string | undefined>();
  const { toast } = useToast();

  useEffect(() => {
    loadVersions();
  }, [documentId]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/documents/${documentId}/versions`);
      if (response.ok) {
        const data = await response.json();
        setVersions(data);
      } else {
        toast({ title: 'Failed to load version history', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error loading versions:', error);
      toast({ title: 'Error loading version history', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleNewVersion = async (file: File) => {
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const storedEmail = window.localStorage.getItem('userEmail');
      const headers: Record<string, string> = {};
      if (storedEmail) headers['x-user-email'] = storedEmail;

      const response = await fetch(`/api/documents/${documentId}/new-version`, {
        method: 'POST',
        body: formData,
        headers
      });

      if (response.ok) {
        toast({ title: 'New version uploaded successfully' });
        loadVersions();
        onNewVersion?.();
      } else {
        const error = await response.json();
        toast({ 
          title: 'Upload failed', 
          description: error.detail || error.error,
          variant: 'destructive' 
        });
      }
    } catch (error) {
      console.error('Version upload error:', error);
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const downloadVersion = (versionId: number) => {
    const base = /^https?:\/\//i.test(API_BASE) ? API_BASE.replace(/\/$/, '') : '';
    window.open(`${base}/api/documents/${versionId}/download`, '_blank');
  };

  const handleDeleteVersion = async (versionId: number) => {
    if (!confirm('Are you sure you want to delete this version?')) return;
    try {
      const base = /^https?:\/\//i.test(API_BASE) ? API_BASE.replace(/\/$/, '') : '';
      const res = await fetch(`${base}/api/documents/${versionId}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Version deleted successfully' });
        loadVersions();
      } else {
        toast({ title: 'Failed to delete version', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast({ title: 'Error deleting version', variant: 'destructive' });
    }
  };

  const handlePreviewVersion = (versionId: number, name: string, mimeType: string) => {
    setPreviewDocId(versionId);
    setPreviewDocName(name);
    setPreviewDocMime(mimeType);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return <Card className="p-6">Loading version history...</Card>;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold">Version History</h3>
        </div>
        <div>
          <input
            type="file"
            id="version-upload"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleNewVersion(file);
            }}
            disabled={uploading}
          />
          <Button
            size="sm"
            onClick={() => document.getElementById('version-upload')?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Uploading...' : 'Upload New Version'}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {versions.map((version) => (
          <div
            key={version.document_id}
            className={`flex items-center justify-between p-4 border rounded-lg ${
              version.is_latest_version ? 'bg-teal-50 border-teal-200' : 'bg-gray-50'
            }`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">Version {version.version}</span>
                {version.is_latest_version && (
                  <Badge className="bg-teal-600">Current</Badge>
                )}
              </div>
              <div className="text-sm text-gray-600">{version.name}</div>
              <div className="text-xs text-gray-500 mt-1">
                {formatDate(version.created_at)} • {version.uploaded_by} • {formatFileSize(version.size)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handlePreviewVersion(version.document_id, version.name, version.mime_type)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => downloadVersion(version.document_id)}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDeleteVersion(version.document_id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {versions.length === 0 && (
        <div className="text-center text-gray-600 py-4">
          No version history available
        </div>
      )}
      
      {previewDocId && (
        <DocumentPreviewModal
          documentId={previewDocId}
          documentName={previewDocName}
          mimeType={previewDocMime}
          onClose={() => setPreviewDocId(null)}
        />
      )}
    </Card>
  );
}
