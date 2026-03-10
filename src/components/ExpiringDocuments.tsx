import { useState, useEffect } from 'react';
import { AlertTriangle, Download, Calendar, Trash2, Eye } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { API_BASE } from '@/lib/api';
import DocumentPreviewModal from './DocumentPreviewModal';

interface ExpiringDocument {
  document_id: number;
  project_id: number;
  project_name: string;
  name: string;
  document_type: string;
  expiry_date: string;
  days_until_expiry: number;
  uploaded_by: string;
  created_at: string;
}

interface ExpiringDocumentsProps {
  projectId?: number;
}

export default function ExpiringDocuments({ projectId }: ExpiringDocumentsProps) {
  const [documents, setDocuments] = useState<ExpiringDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [previewDocId, setPreviewDocId] = useState<number | null>(null);
  const [previewDocName, setPreviewDocName] = useState('');
  const [previewDocMime, setPreviewDocMime] = useState<string | undefined>();
  const { toast } = useToast();

  useEffect(() => {
    loadExpiringDocuments();
  }, [days, projectId]);

  const loadExpiringDocuments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ days: String(days) });
      if (projectId) params.append('project_id', String(projectId));
      
      const response = await fetch(`/api/documents/expiring?${params}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      } else {
        toast({ title: 'Failed to load expiring documents', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error loading expiring documents:', error);
      toast({ title: 'Error loading expiring documents', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const downloadDocument = async (docId: number) => {
    const base = /^https?:\/\//i.test(API_BASE) ? API_BASE.replace(/\/$/, '') : '';
    window.open(`${base}/api/documents/${docId}/download`, '_blank');
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      const base = /^https?:\/\//i.test(API_BASE) ? API_BASE.replace(/\/$/, '') : '';
      const res = await fetch(`${base}/api/documents/${docId}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Document deleted successfully' });
        setDocuments(documents.filter(d => d.document_id !== docId));
      } else {
        toast({ title: 'Failed to delete document', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast({ title: 'Error deleting document', variant: 'destructive' });
    }
  };

  const handlePreviewDocument = (docId: number, name: string) => {
    setPreviewDocId(docId);
    setPreviewDocName(name);
    setPreviewDocMime('application/pdf');
  };

  const getUrgencyBadge = (daysUntil: number) => {
    if (daysUntil <= 7) return <Badge variant="destructive">Urgent - {daysUntil} days</Badge>;
    if (daysUntil <= 30) return <Badge className="bg-orange-500">Warning - {daysUntil} days</Badge>;
    return <Badge variant="secondary">{daysUntil} days</Badge>;
  };

  if (loading) {
    return <Card className="p-6">Loading expiring documents...</Card>;
  }

  if (documents.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-600">
          <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-400" />
          <p>No documents expiring in the next {days} days</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <h3 className="font-semibold text-lg">Expiring Documents</h3>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="px-3 py-1 border rounded-lg text-sm"
        >
          <option value="7">Next 7 days</option>
          <option value="30">Next 30 days</option>
          <option value="60">Next 60 days</option>
          <option value="90">Next 90 days</option>
        </select>
      </div>

      <div className="space-y-3">
        {documents.map((doc) => (
          <div 
            key={doc.document_id}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
          >
            <div className="flex-1">
              <div className="font-medium">{doc.name}</div>
              <div className="text-sm text-gray-600">
                {doc.project_name} • {doc.document_type}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Expires: {new Date(doc.expiry_date).toLocaleDateString()}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getUrgencyBadge(doc.days_until_expiry)}
              <Button
                size="sm"
                variant="outline"
                onClick={() => handlePreviewDocument(doc.document_id, doc.name)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => downloadDocument(doc.document_id)}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDeleteDocument(doc.document_id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
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
