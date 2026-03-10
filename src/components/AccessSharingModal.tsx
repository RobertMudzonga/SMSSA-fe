import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { API_BASE } from '@/lib/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Copy, Link2, X, Eye, Download, Edit } from 'lucide-react';

interface Document {
  document_id: number;
  name: string;
}

interface Share {
  share_id: number;
  share_token: string;
  permission_type: string;
  shared_by: string;
  shared_at: string;
  expires_at?: string;
  client_email?: string;
  access_count: number;
  is_active: boolean;
}

interface AccessSharingModalProps {
  document: Document;
  onSuccess?: () => void;
}

export default function AccessSharingModal({
  document,
  onSuccess,
}: AccessSharingModalProps) {
  const { toast } = useToast();
  const [sharedBy, setSharedBy] = useState('');
  const [permissionType, setPermissionType] = useState('view');
  const [clientEmail, setClientEmail] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchShares();
  }, [document.document_id]);

  const fetchShares = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/documents/${document.document_id}/shares`);
      if (!response.ok) throw new Error('Failed to fetch shares');
      const data = await response.json();
      setShares(data.filter((s: Share) => s.is_active));
    } catch (error) {
      console.error('Error fetching shares:', error);
      toast({ title: 'Error fetching shares', variant: 'destructive' });
    }
  };

  const handleCreateShare = async () => {
    if (!sharedBy.trim()) {
      toast({ title: 'Please enter your name', variant: 'destructive' });
      return;
    }

    setCreating(true);
    try {
      const response = await fetch(`${API_BASE}/api/documents/${document.document_id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shared_by: sharedBy.trim(),
          permission_type: permissionType,
          client_email: clientEmail.trim() || null,
          expires_at: expiresAt || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to create share');

      const result = await response.json();
      toast({ title: 'Document shared successfully' });
      
      setSharedBy('');
      setPermissionType('view');
      setClientEmail('');
      setExpiresAt('');
      
      await fetchShares();
      onSuccess?.();
    } catch (error) {
      console.error('Error creating share:', error);
      toast({ title: 'Failed to create share', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeShare = async (shareId: number) => {
    if (!confirm('Revoke this share link?')) return;

    try {
      const response = await fetch(`${API_BASE}/api/documents/share/${shareId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revoked_by: 'user' }),
      });

      if (!response.ok) throw new Error('Failed to revoke share');

      toast({ title: 'Share revoked successfully' });
      await fetchShares();
    } catch (error) {
      console.error('Error revoking share:', error);
      toast({ title: 'Failed to revoke share', variant: 'destructive' });
    }
  };

  const handleCopyShareLink = (shareToken: string) => {
    const shareUrl = `${window.location.origin}/client-portal/shared/${shareToken}`;
    navigator.clipboard.writeText(shareUrl);
    toast({ title: 'Share link copied to clipboard' });
  };

  const getPermissionIcon = (type: string) => {
    switch (type) {
      case 'view':
        return <Eye className="w-4 h-4" />;
      case 'download':
        return <Download className="w-4 h-4" />;
      case 'edit':
        return <Edit className="w-4 h-4" />;
      default:
        return <Link2 className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Create Share Form */}
      <div className="border-b pb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Create Share Link</h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="sharedBy" className="text-sm font-medium text-gray-700">
              Your Name
            </Label>
            <Input
              id="sharedBy"
              type="text"
              placeholder="Enter your name"
              value={sharedBy}
              onChange={(e) => setSharedBy(e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="clientEmail" className="text-sm font-medium text-gray-700">
              Client Email (Optional)
            </Label>
            <Input
              id="clientEmail"
              type="email"
              placeholder="client@example.com"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              Restrict share to a specific email address
            </p>
          </div>

          <div>
            <Label htmlFor="permission" className="text-sm font-medium text-gray-700">
              Permission Level
            </Label>
            <Select value={permissionType} onValueChange={setPermissionType}>
              <SelectTrigger id="permission" className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    View Only
                  </div>
                </SelectItem>
                <SelectItem value="download">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Download
                  </div>
                </SelectItem>
                <SelectItem value="edit">
                  <div className="flex items-center gap-2">
                    <Edit className="w-4 h-4" />
                    Edit
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Define what the recipient can do with this document
            </p>
          </div>

          <div>
            <Label htmlFor="expiresAt" className="text-sm font-medium text-gray-700">
              Expiration Date (Optional)
            </Label>
            <Input
              id="expiresAt"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty for permanent share
            </p>
          </div>

          <Button
            onClick={handleCreateShare}
            disabled={creating || !sharedBy.trim()}
            className="w-full"
          >
            {creating ? 'Creating...' : 'Create Share Link'}
          </Button>
        </div>
      </div>

      {/* Active Shares */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">
          Active Shares ({shares.length})
        </h3>

        {shares.length === 0 ? (
          <p className="text-sm text-gray-500">No active shares yet</p>
        ) : (
          <div className="space-y-3">
            {shares.map((share) => (
              <div key={share.share_id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getPermissionIcon(share.permission_type)}
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {share.permission_type}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({share.access_count} views)
                      </span>
                    </div>
                    {share.client_email && (
                      <p className="text-xs text-gray-600 mb-1">{share.client_email}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Shared on {formatDate(share.shared_at)}
                    </p>
                    {share.expires_at && (
                      <p className="text-xs text-gray-500 mt-1">
                        Expires on {formatDate(share.expires_at)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRevokeShare(share.share_id)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => handleCopyShareLink(share.share_token)}
                >
                  <Copy className="w-4 h-4" />
                  Copy Link
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-xs text-blue-900">
          <strong>💡 Tip:</strong> Share links can be used by external clients in the client portal without requiring a login.
        </p>
      </div>
    </div>
  );
}
