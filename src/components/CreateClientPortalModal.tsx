import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { X, Copy, Check, Loader2, ExternalLink, Mail, Lock, Calendar, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { API_BASE } from '@/lib/api';

interface CreateClientPortalModalProps {
  projectId?: string;
  caseId?: number;
  projectName: string;
  clientName?: string;
  clientEmail?: string;
  entityType?: 'project' | 'legal_case';
  onClose: () => void;
}

export default function CreateClientPortalModal({
  projectId,
  caseId,
  projectName,
  clientName,
  clientEmail,
  entityType = 'project',
  onClose
}: CreateClientPortalModalProps) {
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [portalData, setPortalData] = useState<{
    portalUrl: string;
    password: string;
    expires_at: string;
  } | null>(null);
  const [copied, setCopied] = useState<'url' | 'password' | 'all' | null>(null);
  const [expiryDays, setExpiryDays] = useState(90);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const userEmail = localStorage.getItem('userEmail') || '';
      
      // Determine which endpoint to use based on entity type
      const endpoint = entityType === 'legal_case' 
        ? `${API_BASE}/functions/generate-legal-case-access`
        : `${API_BASE}/functions/generate-client-access`;
      
      const body = entityType === 'legal_case'
        ? { caseId, clientEmail, expiryDays }
        : { projectId, clientEmail, expiryDays };
      
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail
        },
        body: JSON.stringify(body)
      });
      
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'Failed to generate portal access');
      }

      setPortalData({
        portalUrl: data.portalUrl,
        password: data.password,
        expires_at: data.expires_at
      });
      setGenerated(true);
      toast({ title: 'Client portal created successfully!' });
    } catch (err) {
      console.error('Error generating portal:', err);
      toast({ 
        title: 'Failed to generate portal', 
        description: String(err),
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: 'url' | 'password' | 'all') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      toast({ title: 'Copied to clipboard!' });
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  const copyAll = () => {
    if (!portalData) return;
    const entityLabel = entityType === 'legal_case' ? 'Legal Case' : 'Application';
    const text = `Client Portal Access for ${projectName}

Portal Link: ${portalData.portalUrl}
Password: ${portalData.password}
Expires: ${new Date(portalData.expires_at).toLocaleDateString()}

Instructions:
1. Open the portal link in your browser
2. Enter the password when prompted
3. You can view your ${entityLabel.toLowerCase()} progress and documents
4. Upload any required documents directly through the portal`;
    copyToClipboard(text, 'all');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg bg-white rounded-xl shadow-xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Create Client Portal</h2>
              <p className="text-sm text-gray-600">{projectName}</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {!generated ? (
            /* Generation Form */
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">This will generate a secure portal link</p>
                    <p>The client will be able to:</p>
                    <ul className="list-disc list-inside mt-1 space-y-0.5">
                      <li>View {entityType === 'legal_case' ? 'case' : 'application'} progress</li>
                      <li>View documents (no download)</li>
                      <li>Upload required documents</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {clientName && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Client</label>
                    <p className="text-gray-900">{clientName}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Link Validity (days)
                  </label>
                  <select
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(Number(e.target.value))}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value={30}>30 days</option>
                    <option value={60}>60 days</option>
                    <option value={90}>90 days (recommended)</option>
                    <option value={180}>180 days</option>
                    <option value={365}>1 year</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button 
                  onClick={handleGenerate} 
                  disabled={loading}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Generate Portal Access
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            /* Success - Show Credentials */
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800 font-medium">
                  <Check className="h-5 w-5" />
                  Portal access created successfully!
                </div>
              </div>

              {/* Portal URL */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <ExternalLink className="h-4 w-4" />
                  Portal Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={portalData?.portalUrl || ''}
                    className="flex-1 p-2 bg-gray-100 border rounded-lg text-sm font-mono"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(portalData?.portalUrl || '', 'url')}
                    className="shrink-0"
                  >
                    {copied === 'url' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Lock className="h-4 w-4" />
                  Password
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={portalData?.password || ''}
                    className="flex-1 p-3 bg-amber-50 border-2 border-amber-200 rounded-lg text-lg font-mono font-bold tracking-wider text-center"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(portalData?.password || '', 'password')}
                    className="shrink-0"
                  >
                    {copied === 'password' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-red-600 font-medium">
                  ⚠️ Save this password now! It cannot be retrieved later.
                </p>
              </div>

              {/* Expiry */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                Expires: {portalData?.expires_at && new Date(portalData.expires_at).toLocaleDateString()}
              </div>

              {/* Actions */}
              <div className="border-t pt-4 space-y-3">
                <Button
                  className="w-full bg-teal-600 hover:bg-teal-700"
                  onClick={copyAll}
                >
                  {copied === 'all' ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy All Details
                    </>
                  )}
                </Button>
                
                {clientEmail && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      const subject = encodeURIComponent(`Your Client Portal Access - ${projectName}`);
                      const body = encodeURIComponent(`Dear ${clientName || 'Client'},

Your client portal for viewing your application progress is now ready.

Portal Link: ${portalData?.portalUrl}
Password: ${portalData?.password}

What you can do in the portal:
• View your application progress and status
• View submitted documents
• Upload required documents

This link expires on ${portalData?.expires_at ? new Date(portalData.expires_at).toLocaleDateString() : 'N/A'}.

Best regards`);
                      window.open(`mailto:${clientEmail}?subject=${subject}&body=${body}`);
                    }}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Email to Client
                  </Button>
                )}
                
                <Button variant="outline" className="w-full" onClick={onClose}>
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
