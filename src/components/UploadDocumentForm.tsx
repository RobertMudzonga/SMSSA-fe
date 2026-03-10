import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE } from '@/lib/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Loader2 } from 'lucide-react';

interface UploadDocumentFormProps {
  projectId?: number;
  folderId?: number;
  legalCaseId?: number;
  onUpload: (document: any) => void;
  onClose: () => void;
  isUploading?: boolean;
}

export default function UploadDocumentForm({
  projectId,
  folderId,
  legalCaseId,
  onUpload,
  onClose,
  isUploading = false
}: UploadDocumentFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [fileName, setFileName] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    if (selectedFiles.length === 0) {
      setFiles([]);
      setFileName('');
      return;
    }

    setFiles(selectedFiles);
    if (selectedFiles.length === 1) {
      setFileName(selectedFiles[0].name);
    } else {
      setFileName('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (files.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please select one or more files to upload',
        variant: 'destructive'
      });
      return;
    }

    if (!projectId && !legalCaseId) {
      toast({
        title: 'No target selected',
        description: 'Please select a project or legal case first',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);

    try {
      const headers: Record<string, string> = {};
      if (user?.email) {
        headers['x-user-email'] = user.email;
      }

      if (files.length === 1) {
        const formData = new FormData();
        formData.append('file', files[0]);
        if (projectId) {
          formData.append('project_id', String(projectId));
        }
        if (legalCaseId) {
          formData.append('legal_case_id', String(legalCaseId));
        }
        if (folderId) {
          formData.append('folder_id', String(folderId));
        }
        if (fileName) {
          formData.append('document_name', fileName);
        }
        if (description) {
          formData.append('description', description);
        }

        const response = await fetch(`${API_BASE}/api/documents/upload`, {
          method: 'POST',
          body: formData,
          headers
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Upload failed with status ${response.status}`);
        }

        const data = await response.json();
        toast({
          title: 'Document uploaded successfully',
          description: `${fileName || files[0].name} has been uploaded`
        });

        onUpload(data.document || data);
      } else {
        const formData = new FormData();
        files.forEach((f) => formData.append('files', f));
        if (projectId) {
          formData.append('project_id', String(projectId));
        }
        if (legalCaseId) {
          formData.append('legal_case_id', String(legalCaseId));
        }
        if (folderId) {
          formData.append('folder_id', String(folderId));
        }
        if (description) {
          formData.append('description', description);
        }

        const response = await fetch(`${API_BASE}/api/documents/bulk-upload`, {
          method: 'POST',
          body: formData,
          headers
        });

        const data = await response.json().catch(() => null);
        if (!response.ok && response.status !== 207) {
          throw new Error(data?.error || `Upload failed with status ${response.status}`);
        }

        const uploadedDocs = data?.uploaded || [];
        uploadedDocs.forEach((doc: any) => onUpload(doc));

        const failedCount = data?.failed?.length || 0;
        if (failedCount > 0) {
          toast({
            title: 'Bulk upload completed with errors',
            description: `${uploadedDocs.length} uploaded, ${failedCount} failed`,
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Bulk upload completed',
            description: `${uploadedDocs.length} documents uploaded successfully`
          });
        }
      }

      setFiles([]);
      setFileName('');
      setDescription('');
      onClose();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload document',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* File Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Document
        </label>
        <Input
          type="file"
          onChange={handleFileChange}
          disabled={uploading}
          accept="*/*"
          multiple
          className="cursor-pointer"
        />
        {files.length > 0 && (
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p>{files.length} file{files.length > 1 ? 's' : ''} selected</p>
            {files.slice(0, 4).map((f) => (
              <p key={f.name} className="truncate">
                {f.name} ({(f.size / 1024).toFixed(2)} KB)
              </p>
            ))}
            {files.length > 4 && (
              <p className="text-gray-400">and {files.length - 4} more...</p>
            )}
          </div>
        )}
      </div>

      {/* Document Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Document Name (optional)
        </label>
        <Input
          type="text"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          placeholder={files.length > 1 ? 'Document name applies to single uploads only' : 'Enter document name'}
          disabled={uploading || files.length > 1}
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description (optional)
        </label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter document description"
          disabled={uploading}
          rows={3}
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-2 justify-end pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={uploading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={uploading || files.length === 0}
          className="gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading...
            </>
          ) : (
            files.length > 1 ? 'Upload Documents' : 'Upload Document'
          )}
        </Button>
      </div>
    </form>
  );
}
