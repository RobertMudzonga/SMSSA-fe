import { useState, useCallback } from 'react';
import { Upload, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { CLIENT_UPLOADS_ENABLED } from '@/utils/documentSettings';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface DocumentUploadZoneProps {
  projectId?: string;
  projectName?: string;
  checklistItemId: string;
  documentName: string;
  documentType?: string;
  description?: string;
  clientPortalToken?: string;
  onUploadSuccess: () => void;
}

export default function DocumentUploadZone({ 
  projectId, 
  projectName,
  checklistItemId, 
  documentName,
  documentType,
  description,
  clientPortalToken,
  onUploadSuccess 
}: DocumentUploadZoneProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const uploadFile = async (file: File) => {
    setUploading(true);
    setUploadResult(null);

    try {
      // Use client portal endpoint if token is available, otherwise use regular endpoint
      const endpoint = clientPortalToken ? '/api/client-portal/upload' : '/api/documents/upload';
      
      const fd = new FormData();
      fd.append('file', file);
      
      if (clientPortalToken) {
        // For client portal, use token
        fd.append('client_portal_token', clientPortalToken);
      } else {
        // For regular users, support both project ID and project name
        if (projectName) {
          fd.append('project_name', projectName);
        } else if (projectId) {
          fd.append('project_id', String(projectId));
        }
      }
      
      if (checklistItemId) fd.append('checklist_item_id', String(checklistItemId));
      if (documentType) fd.append('document_type', documentType);
      if (description) fd.append('description', description);

      const headers: Record<string,string> = {};
      if (user && user.email) headers['x-user-email'] = user.email;

      const res = await fetch(endpoint, { method: 'POST', body: fd, headers });
      const ct = res.headers.get('content-type') || '';
      let json: any = null;
      if (ct.includes('application/json')) json = await res.json(); else { const t = await res.text(); try { json = JSON.parse(t); } catch { json = { error: t }; } }

      if (!res.ok) {
        throw new Error(json?.error || `Upload failed: ${res.status}`);
      }

      setUploadResult(json || { uploadStatus: 'approved' });
      // trigger parent refresh if backend confirms document creation
      if (json && (json.document || json.uploadStatus === 'approved')) {
        setTimeout(() => onUploadSuccess(), 1500);
      }
    } catch (error: any) {
      setUploadResult({ 
        uploadStatus: 'rejected', 
        validationNotes: error.message 
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  }, [projectId, projectName, checklistItemId, clientPortalToken]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const notifyManager = async () => {
    try {
      const headers: Record<string,string> = { 'Content-Type': 'application/json' };
      const storedEmail = window.localStorage.getItem('userEmail');
      if (storedEmail) headers['x-user-email'] = storedEmail;
      const res = await fetch(`/api/checklists/${checklistItemId}`, { method: 'PATCH', headers, body: JSON.stringify({ reminder_sent_date: new Date().toISOString() }) });
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(t || 'Notify failed');
      }
      toast({ title: 'Project manager notified', description: 'A reminder has been sent to the project manager.' });
    } catch (err: any) {
      console.error('Notify error', err);
      toast({ title: 'Notification failed', variant: 'destructive' });
    }
  };

  if (!CLIENT_UPLOADS_ENABLED) {
    return (
      <Card className="p-4">
        <div className="mb-3">
          <h4 className="font-medium text-sm">{documentName}</h4>
        </div>
        <div className="text-sm text-gray-700 mb-3">Uploads are disabled. Please notify your project manager to mark this document as received once submitted offline.</div>
        <div className="flex gap-2">
          <Button onClick={notifyManager}>Notify Project Manager</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="mb-3">
        <h4 className="font-medium text-sm">{documentName}</h4>
      </div>

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive ? 'border-teal-500 bg-teal-50' : 'border-gray-300'
        }`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            <p className="text-sm text-gray-600">Uploading...</p>
          </div>
        ) : uploadResult ? (
          <div className="flex flex-col items-center gap-2">
            {uploadResult.uploadStatus === 'approved' ? (
              <>
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                <p className="text-sm font-medium text-green-600">Upload Successful!</p>
              </>
            ) : (
              <>
                <XCircle className="h-8 w-8 text-red-600" />
                <p className="text-sm font-medium text-red-600">Upload Failed</p>
                <p className="text-xs text-gray-600">{uploadResult.validationNotes}</p>
              </>
            )}
          </div>
        ) : (
          <>
            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600 mb-2">Drag & drop or click to upload</p>
            <p className="text-xs text-gray-500">PDF, JPG, PNG, DOC (max 10MB)</p>
            <input
              type="file"
              onChange={handleChange}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              className="hidden"
              id={`file-${checklistItemId}`}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => document.getElementById(`file-${checklistItemId}`)?.click()}
            >
              Select File
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}