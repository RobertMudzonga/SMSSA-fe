import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import DocumentCard from './DocumentCard';
import UploadDocumentModal from './UploadDocumentModal';
import ExpiringDocuments from './ExpiringDocuments';
import BulkDownload from './BulkDownload';
import DocumentVersionHistory from './DocumentVersionHistory';
import { CLIENT_UPLOADS_ENABLED } from '@/utils/documentSettings';
import useProjectFolders from '@/hooks/useProjectFolders';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { API_BASE } from '@/lib/api';import DocumentPreviewModal from './DocumentPreviewModal';
import { Trash2, Eye } from 'lucide-react';
interface DocumentsViewProps {
  documents: any[];
  onUploadDocument: (data: any) => void;
  onDownload: (doc: any) => void;
  onSign: (doc: any) => void;
}

export default function DocumentsView({ documents, onUploadDocument, onDownload, onSign }: DocumentsViewProps) {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [selectedDocForVersions, setSelectedDocForVersions] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [previewDocId, setPreviewDocId] = useState<number | null>(null);
  const [previewDocName, setPreviewDocName] = useState('');
  const [previewDocMime, setPreviewDocMime] = useState<string | undefined>();

  const {
    projects,
    folders,
    folderDocuments,
    selectedProjectId,
    setSelectedProjectId,
    selectedFolderId,
    setSelectedFolderId,
    fetchFoldersForProject,
    fetchDocsForFolder,
    setFolderDocuments,
    loadingProjects,
    loadingFolders,
    loadingDocs,
    error
  } = useProjectFolders();

  const buildDownloadUrl = (id: number | string) => {
    const base = /^https?:\/\//i.test(API_BASE) ? API_BASE.replace(/\/$/, '') : '';
    return `${base}/api/documents/${id}/download`;
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      const base = /^https?:\/\//i.test(API_BASE) ? API_BASE.replace(/\/$/, '') : '';
      const res = await fetch(`${base}/api/documents/${docId}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Document deleted successfully' });
        if (selectedFolderId) fetchDocsForFolder(selectedFolderId);
      } else {
        toast({ title: 'Failed to delete document', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast({ title: 'Error deleting document', variant: 'destructive' });
    }
  };

  const handlePreviewDocument = (docId: number, name: string, mime?: string) => {
    setPreviewDocId(docId);
    setPreviewDocName(name);
    setPreviewDocMime(mime);
  };

  const filteredDocuments = documents.filter(d => {
    const matchesSearch = d.document_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || d.document_type === filterType;
    return matchesSearch && matchesType;
  });
  

  const handleFolderFileUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (selectedFolderId) fd.append('folder_id', String(selectedFolderId));
      // include user email header if available
      const storedEmail = window.localStorage.getItem('userEmail');
      const headers: Record<string,string> = {};
      if (storedEmail) headers['x-user-email'] = storedEmail;
      const res = await fetch('/api/documents/upload', { method: 'POST', body: fd, headers });
      if (res.ok) {
        // try to read returned document and optimistically add to list
        const json = await res.json().catch(() => null);
        if (json) {
          setFolderDocuments(prev => [json, ...prev]);
        } else {
          // fallback: refresh
          await fetchDocsForFolder(selectedFolderId);
        }
        toast({ title: 'Upload successful' });
      } else {
        const err = await res.json().catch(() => null);
        toast({ title: 'Upload failed', description: (err?.error || res.statusText), variant: 'destructive' });
      }
    } catch (err) {
      console.error('Upload failed:', err);
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Documents</h2>
        {CLIENT_UPLOADS_ENABLED ? (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            Upload Document
          </button>
        ) : (
          <div className="text-sm text-gray-600 px-4 py-2">Document uploads are disabled; project managers will mark documents received via the checklist.</div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Documents</TabsTrigger>
          <TabsTrigger value="expiring">Expiring Soon</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Download</TabsTrigger>
          <TabsTrigger value="folders">Folders</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
            />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Types</option>
              <option value="Passport">Passport</option>
              <option value="Birth Certificate">Birth Certificate</option>
              <option value="Police Clearance">Police Clearance</option>
              <option value="Medical Report">Medical Report</option>
              <option value="Employment Letter">Employment Letter</option>
              <option value="Bank Statement">Bank Statement</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map(doc => (
              <div key={doc.id}>
                <DocumentCard 
                  document={doc}
                  onDownload={() => onDownload(doc)}
                  onSign={() => onSign && onSign(doc)}
                />
                <button
                  onClick={() => setSelectedDocForVersions(Number(doc.id))}
                  className="text-xs text-teal-600 hover:underline mt-1"
                >
                  View versions
                </button>
              </div>
            ))}
          </div>

          {selectedDocForVersions && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <div className="sticky top-0 bg-white p-4 border-b flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Document Versions</h3>
                  <button
                    onClick={() => setSelectedDocForVersions(null)}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    ✕
                  </button>
                </div>
                <div className="p-4">
                  <DocumentVersionHistory 
                    documentId={selectedDocForVersions}
                    onNewVersion={() => {
                      // Refresh documents list
                      setSelectedDocForVersions(null);
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="expiring" className="space-y-4">
          <ExpiringDocuments projectId={selectedProjectId ? Number(selectedProjectId) : undefined} />
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          <BulkDownload 
            documents={filteredDocuments.map(d => ({
              document_id: Number(d.id),
              name: d.document_name,
              document_type: d.document_type,
              size: d.file_size || 0
            }))}
            projectName={projects.find(p => p.project_id === selectedProjectId)?.name}
          />
        </TabsContent>

        <TabsContent value="folders" className="space-y-4">
          <div className="border rounded-lg p-4 bg-white">
            <h3 className="font-semibold mb-3">Project Folders</h3>
            <div className="flex gap-2 items-center mb-3">
              <select className="px-3 py-2 border rounded flex-1" value={selectedProjectId} onChange={(e) => { setSelectedProjectId(e.target.value); fetchFoldersForProject(e.target.value); }}>
                <option value="">(Select project)</option>
                {loadingProjects && <option value="">Loading projects...</option>}
                {projects.map(p => (
                  <option key={p.project_id} value={p.project_id}>{p.name} ({p.project_id})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Folders</label>
              {loadingFolders && <div className="text-sm text-gray-500">Loading folders...</div>}
              {(!loadingFolders && folders.length === 0) && <div className="text-sm text-gray-500">No folders loaded.</div>}
              {folders.length > 0 && (
                <select value={String(selectedFolderId || '')} onChange={(e) => { const val = e.target.value ? parseInt(e.target.value, 10) : null; setSelectedFolderId(val); fetchDocsForFolder(val); }} className="w-full px-3 py-2 border rounded">
                  <option value="">(Select folder)</option>
                  {folders.map(f => <option key={f.folder_id} value={f.folder_id}>{f.name}</option>)}
                </select>
              )}
              {error && <div className="text-sm text-red-600 mt-2">{error}</div>}
            </div>
            {CLIENT_UPLOADS_ENABLED ? (
              <div className="mt-3">
                <label className="block text-sm text-gray-600 mb-2">Upload File to Folder</label>
                <input type="file" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFolderFileUpload(file); }} />
                {uploading && <div className="text-sm text-gray-500 mt-2">Uploading...</div>}
              </div>
            ) : null}
            <div className="mt-4">
              <h4 className="font-medium">Files in folder</h4>
              <ul className="mt-2 space-y-2">
                {loadingDocs && <li className="text-sm text-gray-500">Loading files...</li>}
                {!loadingDocs && folderDocuments.length === 0 && <li className="text-sm text-gray-500">No files</li>}
                {folderDocuments.map(d => (
                  <li key={d.document_id || d.document_id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <div className="text-sm flex-1">{d.name || d.document_name} <span className="text-xs text-gray-400">({d.size || d.file_size} bytes)</span></div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePreviewDocument(d.document_id, d.name || d.document_name, d.mime_type)}
                        className="text-sky-600 text-sm hover:text-sky-700 inline-flex items-center gap-1"
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                        Preview
                      </button>
                      <a className="text-sky-600 text-sm hover:text-sky-700" href={buildDownloadUrl(d.document_id || d.document_id)}>Download</a>
                      <button
                        onClick={() => handleDeleteDocument(d.document_id)}
                        className="text-red-600 text-sm hover:text-red-700 inline-flex items-center gap-1"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <UploadDocumentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async (data) => {
          const res = await onUploadDocument(data);
          if (res && res.error) {
            toast({ title: 'Upload failed', description: res.error?.message || 'Failed to save document record', variant: 'destructive' });
          } else {
            setIsModalOpen(false);
            if (String(data.project_id) === String(selectedProjectId)) {
              fetchFoldersForProject(selectedProjectId);
            }
          }
        }}
        projectId={selectedProjectId}
      />

      <DocumentPreviewModal
        isOpen={previewDocId !== null}
        documentId={previewDocId || 0}
        documentName={previewDocName}
        mimeType={previewDocMime}
        onClose={() => setPreviewDocId(null)}
      />
    </div>
  );
}
