import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { API_BASE } from '@/lib/api';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  File,
  Upload,
  Search,
  MoreVertical,
  Share2,
  Lock,
  Unlock,
  Trash2,
  Eye,
  Download,
  Plus,
  X,
  FileText,
  Grid,
  List,
  Info,
  Clock,
  User,
  Calendar,
  Scale,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import DocumentFolderTree from './DocumentFolderTree';
import DocumentBrowser from './DocumentBrowser';
import DocumentProfilePanel from './DocumentProfilePanel';
import DocumentPreviewModal from './DocumentPreviewModal';
import VersionHistoryPanel from './VersionHistoryPanel';
import CheckInOutModal from './CheckInOutModal';
import AccessSharingModal from './AccessSharingModal';
import UploadDocumentForm from './UploadDocumentForm';

interface Project {
  project_id: number;
  project_name: string;
}

interface LegalCase {
  case_id: number;
  case_reference: string;
  case_title: string;
  case_type: string;
  case_status: string;
  client_name: string;
}

interface Document {
  document_id: number;
  name: string;
  project_id: number;
  project_name: string;
  legal_case_id?: number;
  description?: string;
  document_type?: string;
  size: number;
  created_at: string;
  updated_at: string;
  status: string;
  checked_out_by?: string;
  checked_out_at?: string;
  unique_doc_id: string;
  uploaded_by: string;
}

interface Folder {
  folder_id: number;
  folder_name: string;
  project_id: number;
  created_at: string;
}

export default function DocumentManagement() {
  const { toast } = useToast();
  
  // State management
  const [projects, setProjects] = useState<Project[]>([]);
  const [legalCases, setLegalCases] = useState<LegalCase[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedLegalCase, setSelectedLegalCase] = useState<LegalCase | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [activeTab, setActiveTab] = useState<'projects' | 'legal'>('projects');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showCheckInOut, setShowCheckInOut] = useState(false);
  const [showAccessSharing, setShowAccessSharing] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Fetch projects and legal cases on mount
  useEffect(() => {
    fetchProjects();
    fetchLegalCases();
  }, []);

  // Fetch folders and documents when project changes
  useEffect(() => {
    if (selectedProject) {
      fetchFolders(selectedProject.project_id);
      fetchProjectDocuments(selectedProject.project_id);
    }
  }, [selectedProject]);

  // Fetch documents when legal case changes
  useEffect(() => {
    if (selectedLegalCase) {
      fetchLegalCaseDocuments(selectedLegalCase.case_id);
    }
  }, [selectedLegalCase]);

  // Fetch folder documents when folder changes
  useEffect(() => {
    if (selectedFolder) {
      fetchFolderDocuments(selectedFolder.folder_id);
    }
  }, [selectedFolder]);

  // Filter documents based on search and status
  useEffect(() => {
    let filtered = documents;

    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.unique_doc_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(doc => doc.status === statusFilter);
    }

    setFilteredDocuments(filtered);
  }, [documents, searchTerm, statusFilter]);

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/projects`);
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      setProjects(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({ title: 'Error fetching projects', variant: 'destructive' });
      setLoading(false);
    }
  };

  const fetchLegalCases = async () => {
    try {
      const response = await fetch(`${API_BASE}/legal-cases`);
      if (!response.ok) throw new Error('Failed to fetch legal cases');
      const data = await response.json();
      setLegalCases(data.cases || []);
    } catch (error) {
      console.error('Error fetching legal cases:', error);
    }
  };

  const fetchLegalCaseDocuments = async (caseId: number) => {
    try {
      const response = await fetch(`${API_BASE}/legal-cases/${caseId}/documents`);
      if (!response.ok) throw new Error('Failed to fetch documents');
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Error fetching legal case documents:', error);
      toast({ title: 'Error fetching documents', variant: 'destructive' });
    }
  };

  const fetchFolders = async (projectId: number) => {
    try {
      const response = await fetch(`${API_BASE}/api/documents/folders/project/${projectId}`);
      if (!response.ok) throw new Error('Failed to fetch folders');
      const data = await response.json();
      setFolders(data);
      setSelectedFolder(data.length > 0 ? data[0] : null);
    } catch (error) {
      console.error('Error fetching folders:', error);
      toast({ title: 'Error fetching folders', variant: 'destructive' });
    }
  };

  const fetchProjectDocuments = async (projectId: number) => {
    try {
      const response = await fetch(`${API_BASE}/api/documents/project/${projectId}`);
      if (!response.ok) throw new Error('Failed to fetch documents');
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({ title: 'Error fetching documents', variant: 'destructive' });
    }
  };

  const fetchFolderDocuments = async (folderId: number) => {
    try {
      const response = await fetch(`${API_BASE}/api/documents/folders/${folderId}/documents`);
      if (!response.ok) throw new Error('Failed to fetch folder documents');
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching folder documents:', error);
      toast({ title: 'Error fetching documents', variant: 'destructive' });
    }
  };

  const handleUpload = async (document: any) => {
    try {
      toast({ title: 'Document uploaded successfully' });
      setShowUploadModal(false);
      
      // Refresh documents list
      if (selectedProject) {
        if (selectedFolder) {
          try {
            await fetchFolderDocuments(selectedFolder.folder_id);
          } catch (err) {
            console.error('Error refreshing folder documents:', err);
            toast({ title: 'Error refreshing documents', variant: 'destructive' });
          }
        } else {
          try {
            await fetchProjectDocuments(selectedProject.project_id);
          } catch (err) {
            console.error('Error refreshing project documents:', err);
            toast({ title: 'Error refreshing documents', variant: 'destructive' });
          }
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: 'Upload failed', variant: 'destructive' });
    }
  };

  const handleDelete = async (documentId: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await fetch(`${API_BASE}/api/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Delete failed');

      toast({ title: 'Document deleted successfully' });
      setSelectedDocument(null);
      
      if (selectedProject) {
        if (selectedFolder) {
          await fetchFolderDocuments(selectedFolder.folder_id);
        } else {
          await fetchProjectDocuments(selectedProject.project_id);
        }
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast({ title: 'Delete failed', variant: 'destructive' });
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'checked_out':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return <File className="w-5 h-5" />;
    if (mimeType.includes('pdf')) return <FileText className="w-5 h-5" />;
    if (mimeType.includes('image')) return <File className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading document management...</div>
      </div>
    );
  }

  // Show projects/legal cases view if no project or legal case selected
  if (!selectedProject && !selectedLegalCase) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white p-6">
          <h1 className="text-2xl font-bold text-gray-900">Document Management</h1>
          <p className="text-sm text-gray-500 mt-1">Select a project or legal case to manage documents</p>
        </div>

        {/* Tabs for Projects and Legal Cases */}
        <div className="flex-1 overflow-y-auto p-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'projects' | 'legal')} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="projects" className="gap-2">
                <Folder className="w-4 h-4" />
                Projects ({projects.length})
              </TabsTrigger>
              <TabsTrigger value="legal" className="gap-2">
                <Scale className="w-4 h-4" />
                Legal Cases ({legalCases.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="projects">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {projects.map((project) => (
                  <button
                    key={project.project_id}
                    onClick={() => {
                      setSelectedProject(project);
                      setSelectedLegalCase(null);
                    }}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-lg hover:border-blue-300 transition-all text-left"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Folder className="w-6 h-6 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900">{project.project_name}</h3>
                    </div>
                    <p className="text-sm text-gray-600">Click to manage documents</p>
                  </button>
                ))}
                {projects.length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    No projects found
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="legal">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {legalCases.map((legalCase) => (
                  <button
                    key={legalCase.case_id}
                    onClick={() => {
                      setSelectedLegalCase(legalCase);
                      setSelectedProject(null);
                      setFolders([]);
                      setSelectedFolder(null);
                    }}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-lg hover:border-teal-300 transition-all text-left"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-teal-100 rounded-lg">
                        <Scale className="w-6 h-6 text-teal-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{legalCase.case_title}</h3>
                        <p className="text-xs text-gray-500">{legalCase.case_reference}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        legalCase.case_status === 'active' ? 'bg-blue-100 text-blue-700' :
                        legalCase.case_status === 'closed' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {legalCase.case_status}
                      </span>
                      <span className="text-xs text-gray-500">{legalCase.client_name}</span>
                    </div>
                  </button>
                ))}
                {legalCases.length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    No legal cases found
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  // Show legal case documents view if legal case selected
  if (selectedLegalCase) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden h-full bg-gray-50">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedLegalCase(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{selectedLegalCase.case_title}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-500">{selectedLegalCase.case_reference}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    selectedLegalCase.case_status === 'active' ? 'bg-blue-100 text-blue-700' :
                    selectedLegalCase.case_status === 'closed' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {selectedLegalCase.case_status}
                  </span>
                </div>
              </div>
            </div>

            <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Document
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Upload Document to Legal Case</DialogTitle>
                </DialogHeader>
                <UploadDocumentForm
                  legalCaseId={selectedLegalCase.case_id}
                  onUpload={async () => {
                    setShowUploadModal(false);
                    await fetchLegalCaseDocuments(selectedLegalCase.case_id);
                    toast({ title: 'Document uploaded successfully' });
                  }}
                  onClose={() => setShowUploadModal(false)}
                  isUploading={uploading}
                />
              </DialogContent>
            </Dialog>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Documents List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <FileText className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">No documents found for this legal case</p>
              <Button onClick={() => setShowUploadModal(true)} className="gap-2">
                <Upload className="w-4 h-4" />
                Upload First Document
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.document_id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => setSelectedDocument(doc)}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {getFileIcon(doc.document_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{doc.name}</h3>
                      <p className="text-xs text-gray-500">{formatFileSize(doc.size)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{formatDate(doc.created_at)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`${API_BASE}/documents/${doc.document_id}/download`, '_blank');
                      }}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show folders view if project selected but no folder selected
  if (selectedFolder === null && folders.length > 0) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedProject(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{selectedProject.project_name}</h1>
                <p className="text-sm text-gray-500 mt-1">Select a folder to view documents</p>
              </div>
            </div>
          </div>
        </div>

        {/* Folders Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {folders.map((folder) => (
              <button
                key={folder.folder_id}
                onClick={() => setSelectedFolder(folder)}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-lg hover:border-blue-300 transition-all text-left"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Folder className="w-6 h-6 text-amber-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 flex-1">{folder.folder_name}</h3>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500">Created {formatDate(folder.created_at)}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedFolder(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {selectedFolder?.folder_name || 'Documents'}
              </h1>
              {selectedFolder && (
                <p className="text-sm text-gray-500 mt-1">{selectedProject?.project_name}</p>
              )}
            </div>
          </div>

          <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Upload className="w-4 h-4" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Upload Document</DialogTitle>
              </DialogHeader>
              <UploadDocumentForm
                projectId={selectedProject?.project_id}
                folderId={selectedFolder?.folder_id}
                onUpload={handleUpload}
                onClose={() => setShowUploadModal(false)}
                isUploading={uploading}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Documents</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="checked_out">Checked Out</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Documents Area */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          {filteredDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <FileText className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">No documents found</p>
              <p className="text-gray-400 text-sm mt-2">
                {searchTerm ? 'Try adjusting your search' : 'Upload a document to get started'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredDocuments.map((doc) => (
                <button
                  key={doc.document_id}
                  onClick={() => setSelectedDocument(doc)}
                  className={`bg-white rounded-lg shadow-sm border p-4 hover:shadow-lg hover:border-blue-300 transition-all text-left ${
                    selectedDocument?.document_id === doc.document_id
                      ? 'ring-2 ring-blue-500 border-blue-500'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FileText className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{doc.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{doc.unique_doc_id}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewDocument(doc);
                      }}
                      className="p-1 hover:bg-blue-100 rounded transition-colors"
                      title="Preview document"
                    >
                      <Eye className="w-4 h-4 text-blue-500" />
                    </button>
                  </div>
                  
                  <div className="mb-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${getStatusBadgeColor(doc.status)}`}>
                      {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="space-y-1 mb-3">
                    <p className="text-xs text-gray-600">{formatFileSize(doc.size)}</p>
                    <p className="text-xs text-gray-500">Uploaded {formatDate(doc.created_at)}</p>
                    {doc.uploaded_by && (
                      <p className="text-xs text-gray-500">by {doc.uploaded_by}</p>
                    )}
                  </div>
                  
                  {doc.checked_out_by && (
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Checked out by {doc.checked_out_by}
                      </p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Panels */}
      {selectedDocument && (
        <div className="w-96 border-l border-gray-200 bg-white overflow-y-auto">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="w-full justify-start border-b">
              <TabsTrigger value="info">Info</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="sharing">Sharing</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="p-4">
              <DocumentProfilePanel
                document={selectedDocument}
                onShare={() => setShowAccessSharing(true)}
                onVersionHistory={() => setShowVersionHistory(true)}
                onCheckOut={() => setShowCheckInOut(true)}
                onDelete={() => handleDelete(selectedDocument.document_id)}
              />
            </TabsContent>

            <TabsContent value="activity" className="p-4">
              <DocumentActivityLog documentId={selectedDocument.document_id} />
            </TabsContent>

            <TabsContent value="sharing" className="p-4">
              <DocumentSharingPanel documentId={selectedDocument.document_id} />
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Modals */}
      {showProfilePanel && selectedDocument && (
        <Dialog open={showProfilePanel} onOpenChange={setShowProfilePanel}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Document Profile</DialogTitle>
            </DialogHeader>
            <DocumentProfilePanel document={selectedDocument} />
          </DialogContent>
        </Dialog>
      )}

      {showVersionHistory && selectedDocument && (
        <Dialog open={showVersionHistory} onOpenChange={setShowVersionHistory}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Version History</DialogTitle>
            </DialogHeader>
            <VersionHistoryPanel documentId={selectedDocument.document_id} />
          </DialogContent>
        </Dialog>
      )}

      {showCheckInOut && selectedDocument && (
        <Dialog open={showCheckInOut} onOpenChange={setShowCheckInOut}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedDocument.status === 'available' ? 'Check Out' : 'Check In'} Document
              </DialogTitle>
            </DialogHeader>
            <CheckInOutModal
              document={selectedDocument}
              onSuccess={() => {
                setShowCheckInOut(false);
                if (selectedProject) {
                  if (selectedFolder) {
                    fetchFolderDocuments(selectedFolder.folder_id);
                  } else {
                    fetchProjectDocuments(selectedProject.project_id);
                  }
                }
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {showAccessSharing && selectedDocument && (
        <Dialog open={showAccessSharing} onOpenChange={setShowAccessSharing}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share Document</DialogTitle>
            </DialogHeader>
            <AccessSharingModal
              document={selectedDocument}
              onSuccess={() => setShowAccessSharing(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {previewDocument && (
        <DocumentPreviewModal
          isOpen={!!previewDocument}
          documentId={previewDocument.document_id}
          documentName={previewDocument.name}
          mimeType={previewDocument.document_type}
          onClose={() => setPreviewDocument(null)}
        />
      )}
    </div>
  );
}

// Grid View Component
function DocumentGridView({
  documents,
  selectedDocument,
  onSelectDocument,
  onDelete,
  onShowProfile,
  onShowVersionHistory,
  onShowCheckInOut,
  onShowAccessSharing,
  formatFileSize,
  formatDate,
  getStatusBadgeColor,
  getFileIcon,
}: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {documents.map((doc: Document) => (
        <div
          key={doc.document_id}
          className={`border rounded-lg p-4 cursor-pointer transition-all ${
            selectedDocument?.document_id === doc.document_id
              ? 'ring-2 ring-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
          onClick={() => onSelectDocument(doc)}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              {getFileIcon(doc.document_type)}
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 truncate">{doc.name}</h3>
                <p className="text-xs text-gray-500">{doc.unique_doc_id}</p>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                const menu = document.createElement('div');
                menu.className = 'absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50';
                menu.innerHTML = `
                  <button class="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">View Details</button>
                  <button class="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">Version History</button>
                  <button class="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">${doc.status === 'available' ? 'Check Out' : 'Check In'}</button>
                  <button class="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">Share</button>
                  <button class="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-red-600">Delete</button>
                `;
              }}
            >
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{doc.description}</p>

          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeColor(doc.status)}`}>
              {doc.status}
            </span>
            <span className="text-xs text-gray-500">{formatFileSize(doc.size)}</span>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-3">
            <span>{formatDate(doc.created_at)}</span>
            {doc.checked_out_by && (
              <span className="text-yellow-600 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                {doc.checked_out_by}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// List View Component
function DocumentListView({
  documents,
  selectedDocument,
  onSelectDocument,
  onDelete,
  formatFileSize,
  formatDate,
  getStatusBadgeColor,
  getFileIcon,
}: any) {
  return (
    <div className="space-y-2">
      {documents.map((doc: Document) => (
        <div
          key={doc.document_id}
          className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${
            selectedDocument?.document_id === doc.document_id
              ? 'ring-2 ring-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
          onClick={() => onSelectDocument(doc)}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {getFileIcon(doc.document_type)}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">{doc.name}</h3>
              <p className="text-xs text-gray-500">{doc.unique_doc_id}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 ml-4">
            <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${getStatusBadgeColor(doc.status)}`}>
              {doc.status}
            </span>
            <span className="text-xs text-gray-500 whitespace-nowrap">{formatFileSize(doc.size)}</span>
            <span className="text-xs text-gray-500 whitespace-nowrap">{formatDate(doc.created_at)}</span>
            {doc.checked_out_by && (
              <span className="text-xs text-yellow-600 flex items-center gap-1 whitespace-nowrap">
                <Lock className="w-3 h-3" />
                {doc.checked_out_by}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Activity Log Component
function DocumentActivityLog({ documentId }: { documentId: number }) {
  const [activities, setActivities] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    fetchActivities();
  }, [documentId]);

  const fetchActivities = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/documents/${documentId}/activity`);
      if (!response.ok) throw new Error('Failed to fetch activities');
      const data = await response.json();
      setActivities(data);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast({ title: 'Error fetching activity log', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, idx) => (
        <div key={idx} className="pb-4 border-b last:border-b-0">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="font-medium text-sm capitalize">{activity.action_type.replace(/_/g, ' ')}</span>
          </div>
          <p className="text-xs text-gray-500 ml-6">
            {new Date(activity.performed_at).toLocaleString()}
          </p>
          {activity.performed_by && (
            <p className="text-xs text-gray-600 ml-6 flex items-center gap-1">
              <User className="w-3 h-3" />
              {activity.performed_by}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// Sharing Panel Component
function DocumentSharingPanel({ documentId }: { documentId: number }) {
  const [shares, setShares] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    fetchShares();
  }, [documentId]);

  const fetchShares = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/documents/${documentId}/shares`);
      if (!response.ok) throw new Error('Failed to fetch shares');
      const data = await response.json();
      setShares(data);
    } catch (error) {
      console.error('Error fetching shares:', error);
      toast({ title: 'Error fetching shares', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {shares.filter(s => s.is_active).length === 0 ? (
        <p className="text-sm text-gray-500">No active shares</p>
      ) : (
        shares
          .filter(s => s.is_active)
          .map((share) => (
            <div key={share.share_id} className="pb-4 border-b last:border-b-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-900">{share.permission_type}</span>
                <span className="text-xs text-gray-500">{share.access_count} views</span>
              </div>
              {share.client_email && (
                <p className="text-xs text-gray-600 mb-2">{share.client_email}</p>
              )}
              {share.expires_at && (
                <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                  <Calendar className="w-3 h-3" />
                  Expires: {new Date(share.expires_at).toLocaleDateString()}
                </p>
              )}
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Created: {new Date(share.shared_at).toLocaleDateString()}
              </p>
            </div>
          ))
      )}
    </div>
  );
}
