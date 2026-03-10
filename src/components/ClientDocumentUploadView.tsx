import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { AlertCircle, CheckCircle2, Upload } from 'lucide-react';
import DocumentUploadZone from './DocumentUploadZone';
import { CLIENT_UPLOADS_ENABLED } from '@/utils/documentSettings';
import { useToast } from '@/hooks/use-toast';

interface ClientDocumentUploadViewProps {
  projectId?: string;
  projectName?: string;
  clientName: string;
  clientPortalToken?: string;
}

export default function ClientDocumentUploadView({ 
  projectId, 
  projectName,
  clientName,
  clientPortalToken
}: ClientDocumentUploadViewProps) {
  const [checklist, setChecklist] = useState<any[]>([]);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      const projRes = await fetch(`/api/projects/${projectId}`);
      const projJson = projRes.ok ? await projRes.json() : null;
      const projectData = projJson ? projJson.project || projJson : null;

      const res = await fetch(`/api/checklists/${projectId}`);
      const json = await res.json().catch(() => null);
      const checklistData = json && json.ok ? json.checklist : [];

      setProject(projectData);
      setChecklist(checklistData || []);
    } catch (err) {
      console.error('Failed to load client portal data via API:', err);
      setProject(null);
      setChecklist([]);
    }
    setLoading(false);
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const categories = [...new Set(checklist.map(item => item.document_category))];
  const receivedCount = checklist.filter(item => item.is_received).length;
  const progress = checklist.length > 0 ? Math.round((receivedCount / checklist.length) * 100) : 0;

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-teal-600 to-blue-600 text-white p-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Document Upload Portal</h1>
          <p className="text-teal-100">Welcome, {clientName}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Your Progress</h2>
              <p className="text-sm text-gray-600">{project?.visa_type}</p>
            </div>
            <Badge className="text-lg px-4 py-2">{progress}%</Badge>
          </div>
          <Progress value={progress} className="h-3" />
          <p className="text-sm text-gray-600 mt-2">
            {receivedCount} of {checklist.length} documents received
          </p>
        </Card>

        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              Upload your documents below. Accepted formats: PDF, JPG, PNG, DOC (max 10MB per file)
            </div>
          </div>
        </Card>

        <div className="space-y-6">
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
                    <div key={item.id}>
                      <div 
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3 flex-1">
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

                      {!item.is_received && (
                        <div className="mt-3">
                          {CLIENT_UPLOADS_ENABLED ? (
                            <DocumentUploadZone
                              projectId={projectId}
                              projectName={projectName}
                              checklistItemId={item.id}
                              documentName={item.document_name}
                              documentType={item.document_category}
                              description={item.notes}
                              clientPortalToken={clientPortalToken}
                              onUploadSuccess={loadData}
                            />
                          ) : (
                            <div className="p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-700">Uploads are disabled. Please submit the document to your project manager offline.</div>
                                <button className="px-3 py-1 bg-teal-600 text-white rounded" onClick={async () => {
                                  try {
                                    const headers: Record<string,string> = { 'Content-Type': 'application/json' };
                                    if (user && user.email) headers['x-user-email'] = user.email;
                                    const res = await fetch(`/api/checklists/${item.id}/notify`, { method: 'PATCH', headers, body: JSON.stringify({}) });
                                    const ct = res.headers.get('content-type') || '';
                                    let json: any = null;
                                    if (ct.includes('application/json')) json = await res.json(); else { const t = await res.text(); try { json = JSON.parse(t); } catch { json = { error: t }; } }
                                    if (!res.ok) throw new Error(json?.error || `Notify failed: ${res.status}`);
                                    toast({ title: 'Project manager notified', description: 'A reminder has been sent.' });
                                  } catch (err) {
                                    console.error(err);
                                    toast({ title: 'Notification failed', variant: 'destructive' });
                                  }
                                }}>Notify PM</button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}