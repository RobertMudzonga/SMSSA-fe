import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { API_BASE } from '@/lib/api';
import { AlertCircle, Loader2, Lock, Eye, Upload, FileText, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import DocumentUploadZone from '@/components/DocumentUploadZone';
import { CLIENT_UPLOADS_ENABLED } from '@/utils/documentSettings';
import { useToast } from '@/hooks/use-toast';

export default function ClientPortal() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  
  // Auth state
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  // Project data
  const [projectInfo, setProjectInfo] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [checklist, setChecklist] = useState<any[]>([]);
  
  // View state
  const [activeTab, setActiveTab] = useState<'progress' | 'documents' | 'upload'>('progress');
  const [viewingDocument, setViewingDocument] = useState<any>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    validateToken();
  }, []);

  const validateToken = async () => {
    const tokenParam = searchParams.get('token');
    
    if (!tokenParam) {
      setError('Invalid access link. Please contact your immigration consultant.');
      setLoading(false);
      return;
    }

    setToken(tokenParam);

    try {
      const resp = await fetch(`${API_BASE}/client-portal/validate?token=${encodeURIComponent(tokenParam)}`);
      const json = await resp.json().catch(() => null);
      
      if (!resp.ok) {
        if (json?.error === 'expired') {
          setError('This access link has expired. Please contact your consultant for a new link.');
        } else {
          setError('Invalid or expired access link.');
        }
        setLoading(false);
        return;
      }
      
      setProjectInfo(json.project || null);
      setRequiresPassword(json.requiresPassword === true);
      
      // If no password required, automatically proceed
      if (!json.requiresPassword) {
        setIsAuthenticated(true);
        await loadPortalData(tokenParam);
      }
      
      setLoading(false);
    } catch (err) {
      setError('An error occurred. Please try again later.');
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !password) return;
    
    setLoginLoading(true);
    setLoginError(null);
    
    try {
      const resp = await fetch(`${API_BASE}/client-portal/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      
      const json = await resp.json().catch(() => null);
      
      if (!resp.ok) {
        setLoginError(json?.error || 'Login failed. Please check your password.');
        setLoginLoading(false);
        return;
      }
      
      setIsAuthenticated(true);
      setProjectInfo(json.project || projectInfo);
      await loadPortalData(token);
    } catch (err) {
      setLoginError('An error occurred. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const loadPortalData = async (tokenParam: string) => {
    try {
      // Load progress
      const progressResp = await fetch(`${API_BASE}/client-portal/progress?token=${encodeURIComponent(tokenParam)}`);
      const progressJson = await progressResp.json().catch(() => null);
      if (progressResp.ok && progressJson) {
        setProgress(progressJson);
        setProjectInfo(progressJson.project || projectInfo);
      }
      
      // Load documents
      const docsResp = await fetch(`${API_BASE}/client-portal/documents?token=${encodeURIComponent(tokenParam)}`);
      const docsJson = await docsResp.json().catch(() => null);
      if (docsResp.ok && docsJson) {
        setDocuments(docsJson.documents || []);
      }
      
      // Load checklist
      if (progressJson?.project?.project_id) {
        const checklistResp = await fetch(`${API_BASE}/checklists/${progressJson.project.project_id}`);
        const checklistJson = await checklistResp.json().catch(() => null);
        if (checklistResp.ok && checklistJson) {
          setChecklist(checklistJson.checklist || []);
        }
      }
    } catch (err) {
      console.error('Error loading portal data:', err);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-teal-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your portal...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">{error}</p>
        </Card>
      </div>
    );
  }

  // Login screen
  if (requiresPassword && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50 p-4">
        <Card className="max-w-md w-full p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-teal-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Client Portal</h1>
            {projectInfo && (
              <p className="text-gray-600">Welcome, {projectInfo.client_name}</p>
            )}
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enter your access password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value.toUpperCase())}
                placeholder="Enter password"
                className="w-full p-3 border rounded-lg text-center text-lg tracking-widest font-mono uppercase"
                autoFocus
              />
            </div>
            
            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
                {loginError}
              </div>
            )}
            
            <Button
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-700"
              disabled={loginLoading || !password}
            >
              {loginLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Access Portal'
              )}
            </Button>
          </form>
          
          <p className="text-xs text-gray-500 text-center mt-6">
            Contact your immigration consultant if you've forgotten your password.
          </p>
        </Card>
      </div>
    );
  }

  // Main portal view
  const categories = [...new Set(checklist.map(item => item.document_category))];
  const checklistProgress = checklist.length > 0 
    ? Math.round((checklist.filter(item => item.is_received).length / checklist.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-blue-600 text-white">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold mb-1">
            {projectInfo?.project_name || 'Your Application'}
          </h1>
          <p className="text-teal-100">Welcome, {projectInfo?.client_name}</p>
        </div>
      </div>
      
      {/* Navigation Tabs */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('progress')}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'progress'
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Clock className="h-4 w-4 inline mr-2" />
              Progress
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'documents'
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Eye className="h-4 w-4 inline mr-2" />
              View Documents
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'upload'
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Upload className="h-4 w-4 inline mr-2" />
              Upload Documents
            </button>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <div className="space-y-6">
            {/* Overall Progress Card */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">Application Progress</h2>
                  <p className="text-sm text-gray-600">{projectInfo?.visa_type}</p>
                </div>
                <Badge className="text-lg px-4 py-2 bg-teal-600">
                  {progress?.project?.progress || 0}%
                </Badge>
              </div>
              <Progress value={progress?.project?.progress || 0} className="h-3 mb-2" />
              <p className="text-sm text-gray-600">
                Stage {progress?.currentStage || 1} of 6
              </p>
            </Card>
            
            {/* Stages Timeline */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Application Stages</h3>
              <div className="space-y-4">
                {(progress?.stages || []).map((stage: any, index: number) => (
                  <div
                    key={stage.number}
                    className={`flex items-start gap-4 p-4 rounded-lg ${
                      stage.number === progress?.currentStage
                        ? 'bg-teal-50 border-l-4 border-teal-600'
                        : stage.completed
                        ? 'bg-green-50'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      stage.completed
                        ? 'bg-green-500 text-white'
                        : stage.number === progress?.currentStage
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-300 text-white'
                    }`}>
                      {stage.completed ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        stage.number
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{stage.name}</h4>
                        {stage.number === progress?.currentStage && (
                          <Badge variant="secondary" className="text-xs">Current</Badge>
                        )}
                        {stage.completed && (
                          <Badge className="text-xs bg-green-500">Complete</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{stage.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            
            {/* Document Checklist Progress */}
            {checklist.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Document Collection</h3>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">
                    {checklist.filter(c => c.is_received).length} of {checklist.length} documents received
                  </span>
                  <span className="font-medium">{checklistProgress}%</span>
                </div>
                <Progress value={checklistProgress} className="h-2" />
              </Card>
            )}
          </div>
        )}
        
        {/* Documents Tab - View Only */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex gap-3">
                <Eye className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Document Viewing</p>
                  <p>Documents are displayed in view-only mode for security. Downloading and screenshots are disabled.</p>
                </div>
              </div>
            </Card>
            
            {documents.length === 0 ? (
              <Card className="p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No documents available yet.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {documents.map(doc => (
                  <Card 
                    key={doc.document_id} 
                    className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setViewingDocument(doc)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{doc.name}</h4>
                          <p className="text-sm text-gray-600">
                            {doc.document_type || 'Document'} • {(doc.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{doc.status || 'Uploaded'}</Badge>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
            
            {/* Document Viewer Modal */}
            {viewingDocument && (
              <SecureDocumentViewer
                docData={viewingDocument}
                token={token}
                onClose={() => setViewingDocument(null)}
              />
            )}
          </div>
        )}
        
        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            <Card className="p-4 bg-amber-50 border-amber-200">
              <div className="flex gap-3">
                <Upload className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Upload Required Documents</p>
                  <p>Upload your documents below. Accepted formats: PDF, JPG, PNG, DOC (max 10MB per file)</p>
                </div>
              </div>
            </Card>
            
            {categories.map(category => {
              const items = checklist.filter(item => item.document_category === category);
              const categoryReceived = items.filter(item => item.is_received).length;
              
              return (
                <Card key={category} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">{category}</h3>
                    <Badge variant={categoryReceived === items.length ? "default" : "secondary"}>
                      {categoryReceived}/{items.length} Complete
                    </Badge>
                  </div>
                  
                  <div className="space-y-4">
                    {items.map(item => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            {item.is_received ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <Upload className="h-5 w-5 text-gray-400" />
                            )}
                            <div>
                              <div className="font-medium">{item.document_name}</div>
                              {item.notes && (
                                <div className="text-xs text-blue-600 mt-1">{item.notes}</div>
                              )}
                            </div>
                          </div>
                          {item.is_received && (
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              Received
                            </Badge>
                          )}
                        </div>

                        {!item.is_received && CLIENT_UPLOADS_ENABLED && (
                          <div className="mt-3">
                            <DocumentUploadZone
                              projectId={projectInfo?.project_id}
                              projectName={projectInfo?.project_name}
                              checklistItemId={item.id}
                              documentName={item.document_name}
                              documentType={item.document_category}
                              description={item.notes}
                              clientPortalToken={token || undefined}
                              onUploadSuccess={() => loadPortalData(token || '')}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
            
            {categories.length === 0 && (
              <Card className="p-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-600">No documents required at this time.</p>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Secure Document Viewer Component
function SecureDocumentViewer({ 
  docData, 
  token,
  onClose 
}: { 
  docData: any; 
  token: string | null;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    loadDocument();
    
    // Disable right-click context menu
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    window.document.addEventListener('contextmenu', handleContextMenu);
    
    // Disable keyboard shortcuts for screenshots
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'PrintScreen' ||
        (e.ctrlKey && e.key === 'p') ||
        (e.ctrlKey && e.shiftKey && e.key === 's') ||
        (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5'))
      ) {
        e.preventDefault();
        alert('Screenshots are disabled for document security.');
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, []);

  const loadDocument = async () => {
    if (!token) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    try {
      const resp = await fetch(
        `${API_BASE}/client-portal/document/${docData.document_id}/view?token=${encodeURIComponent(token)}`
      );
      
      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        console.error('Document load failed:', resp.status, errorData);
        setError(errorData.error || 'Failed to load document');
        setLoading(false);
        return;
      }
      
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
      setLoading(false);
    } catch (err) {
      console.error('Document fetch error:', err);
      setError('Error loading document');
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/90 z-50 flex flex-col"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
        <div>
          <h3 className="font-medium">{docData.name}</h3>
          <p className="text-sm text-gray-400">{docData.document_type}</p>
        </div>
        <Button variant="ghost" onClick={onClose} className="text-white hover:bg-gray-700">
          Close
        </Button>
      </div>
      
      {/* Document Content */}
      <div 
        className="flex-1 overflow-auto flex items-center justify-center p-4"
        style={{ 
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none'
        }}
      >
        {loading && (
          <div className="text-center text-white">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
            <p>Loading document...</p>
          </div>
        )}
        
        {error && (
          <div className="text-center text-white">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p>{error}</p>
          </div>
        )}
        
        {blobUrl && !loading && !error && (
          <>
            {docData.mime_type?.startsWith('image/') ? (
              <img 
                src={blobUrl} 
                alt={docData.name}
                className="max-w-full max-h-full object-contain"
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
              />
            ) : docData.mime_type === 'application/pdf' ? (
              <iframe
                src={`${blobUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                className="w-full h-full border-0"
                title={docData.name}
              />
            ) : (
              <div className="text-center text-white">
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">{docData.name}</p>
                <p className="text-gray-400 mt-2">Preview not available for this file type</p>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Watermark */}
      <div 
        className="fixed inset-0 pointer-events-none flex items-center justify-center"
        style={{ opacity: 0.03 }}
      >
        <div className="transform rotate-[-30deg] text-white text-6xl font-bold whitespace-nowrap">
          CONFIDENTIAL • VIEW ONLY • {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}