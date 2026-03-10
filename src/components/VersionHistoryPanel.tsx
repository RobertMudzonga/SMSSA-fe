import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { API_BASE } from '@/lib/api';
import { Button } from './ui/button';
import { Clock, Download, Trash2, FileText } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

interface DocumentVersion {
  version_id: number;
  version_number: number;
  name: string;
  size: number;
  mime_type?: string;
  uploaded_by?: string;
  created_at: string;
  change_description?: string;
}

interface VersionHistoryPanelProps {
  documentId: number;
  onRestore?: (versionId: number) => Promise<void>;
}

export default function VersionHistoryPanel({
  documentId,
  onRestore,
}: VersionHistoryPanelProps) {
  const { toast } = useToast();
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<number | null>(null);

  useEffect(() => {
    fetchVersions();
  }, [documentId]);

  const fetchVersions = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/documents/${documentId}/versions`);
      if (!response.ok) throw new Error('Failed to fetch versions');
      const data = await response.json();
      setVersions(data.sort((a: any, b: any) => b.version_number - a.version_number));
    } catch (error) {
      console.error('Error fetching versions:', error);
      toast({ title: 'Error fetching version history', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDownloadVersion = async (versionId: number, versionName: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/documents/${versionId}/download`);
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = versionName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      toast({ title: 'Download failed', variant: 'destructive' });
    }
  };

  const handleRestoreVersion = async (versionId: number) => {
    if (!confirm('Restore this version? The current version will be saved as a new version.')) {
      return;
    }

    setRestoring(versionId);
    try {
      if (onRestore) {
        await onRestore(versionId);
        toast({ title: 'Version restored successfully' });
        await fetchVersions();
      }
    } catch (error) {
      console.error('Restore error:', error);
      toast({ title: 'Failed to restore version', variant: 'destructive' });
    } finally {
      setRestoring(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <FileText className="w-12 h-12 text-gray-300 mb-3" />
        <p className="text-gray-500">No version history available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {versions.map((version, index) => (
        <div key={version.version_id} className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-gray-900">
                  Version {version.version_number}
                </span>
                {index === 0 && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    Current
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(version.created_at)}
              </p>
              {version.uploaded_by && (
                <p className="text-xs text-gray-500 mt-1">By {version.uploaded_by}</p>
              )}
            </div>
            <span className="text-xs text-gray-500 text-right whitespace-nowrap ml-4">
              {formatFileSize(version.size)}
            </span>
          </div>

          {version.change_description && (
            <div className="bg-gray-50 rounded p-2 mb-3">
              <p className="text-xs text-gray-600">{version.change_description}</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => handleDownloadVersion(version.version_id, version.name)}
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
            {index !== 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRestoreVersion(version.version_id)}
                disabled={restoring === version.version_id}
              >
                {restoring === version.version_id ? 'Restoring...' : 'Restore'}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
