import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { API_BASE } from '@/lib/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Download, Share2, Lock, Unlock, Trash2, Save, X, FileText, User, Calendar, Shield } from 'lucide-react';

interface Document {
  document_id: number;
  name: string;
  size: number;
  created_at: string;
  updated_at: string;
  status: string;
  unique_doc_id: string;
  description?: string;
  document_type?: string;
  uploaded_by?: string;
  checked_out_by?: string;
  checked_out_at?: string;
  project_name?: string;
}

interface DocumentProfile {
  profile_id?: number;
  document_id: number;
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  content_summary?: string;
  language?: string;
  pages?: number;
  created_date?: string;
  classification?: string;
  retention_period_months?: number;
  template_variables?: any;
}

interface DocumentProfilePanelProps {
  document: Document;
  onShare?: () => void;
  onVersionHistory?: () => void;
  onCheckOut?: () => void;
  onDelete?: () => void;
  isReadOnly?: boolean;
}

export default function DocumentProfilePanel({
  document,
  onShare,
  onVersionHistory,
  onCheckOut,
  onDelete,
  isReadOnly = false,
}: DocumentProfilePanelProps) {
  const { toast } = useToast();
  const [profile, setProfile] = useState<DocumentProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    subject: '',
    keywords: '',
    content_summary: '',
    language: 'en',
    pages: '',
    created_date: '',
    classification: 'internal',
    retention_period_months: '',
  });

  useEffect(() => {
    fetchProfile();
  }, [document.document_id]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/documents/${document.document_id}/profile`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setFormData({
          title: data.title || '',
          author: data.author || '',
          subject: data.subject || '',
          keywords: data.keywords || '',
          content_summary: data.content_summary || '',
          language: data.language || 'en',
          pages: data.pages?.toString() || '',
          created_date: data.created_date || '',
          classification: data.classification || 'internal',
          retention_period_months: data.retention_period_months?.toString() || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/api/documents/${document.document_id}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          pages: formData.pages ? parseInt(formData.pages) : null,
          retention_period_months: formData.retention_period_months
            ? parseInt(formData.retention_period_months)
            : null,
        }),
      });

      if (!response.ok) throw new Error('Failed to save profile');

      const updatedProfile = await response.json();
      setProfile(updatedProfile.profile);
      setEditing(false);
      toast({ title: 'Profile saved successfully' });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({ title: 'Failed to save profile', variant: 'destructive' });
    } finally {
      setSaving(false);
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
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

  return (
    <div className="space-y-4">
      {/* Document Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900">{document.name}</h2>
              </div>
              <p className="text-xs text-gray-500 font-mono">{document.unique_doc_id}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(document.status)}`}>
              {document.status.replace(/_/g, ' ')}
            </span>
            <span className="text-xs text-gray-500">{formatFileSize(document.size)}</span>
          </div>

          {document.description && (
            <div>
              <label className="text-xs font-medium text-gray-500">Description</label>
              <p className="text-sm text-gray-700 mt-1">{document.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-3 border-t">
            <div>
              <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                <User className="w-3 h-3" />
                Uploaded By
              </label>
              <p className="text-sm text-gray-700 mt-1">{document.uploaded_by || 'Unknown'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Date
              </label>
              <p className="text-sm text-gray-700 mt-1">{formatDate(document.created_at)}</p>
            </div>
          </div>

          {document.checked_out_by && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
              <p className="text-xs font-medium text-yellow-800 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Checked Out
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                Checked out by {document.checked_out_by}
              </p>
              {document.checked_out_at && (
                <p className="text-xs text-yellow-600 mt-1">
                  {formatDate(document.checked_out_at)}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Profile */}
      {!editing && profile ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle>Profile Information</CardTitle>
            {!isReadOnly && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditing(true)}
              >
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {profile.title && (
              <div>
                <label className="text-xs font-medium text-gray-500">Title</label>
                <p className="text-sm text-gray-700">{profile.title}</p>
              </div>
            )}
            {profile.author && (
              <div>
                <label className="text-xs font-medium text-gray-500">Author</label>
                <p className="text-sm text-gray-700">{profile.author}</p>
              </div>
            )}
            {profile.subject && (
              <div>
                <label className="text-xs font-medium text-gray-500">Subject</label>
                <p className="text-sm text-gray-700">{profile.subject}</p>
              </div>
            )}
            {profile.keywords && (
              <div>
                <label className="text-xs font-medium text-gray-500">Keywords</label>
                <p className="text-sm text-gray-700">{profile.keywords}</p>
              </div>
            )}
            {profile.classification && (
              <div>
                <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Classification
                </label>
                <p className="text-sm text-gray-700 capitalize">{profile.classification}</p>
              </div>
            )}
            {profile.content_summary && (
              <div>
                <label className="text-xs font-medium text-gray-500">Summary</label>
                <p className="text-sm text-gray-700">{profile.content_summary}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : editing ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle>Edit Profile</CardTitle>
            <button onClick={() => setEditing(false)}>
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Document title"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Author</label>
                <Input
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="Author name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Subject</label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Subject"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Keywords</label>
              <Input
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                placeholder="Comma-separated keywords"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Summary</label>
              <Textarea
                value={formData.content_summary}
                onChange={(e) => setFormData({ ...formData, content_summary: e.target.value })}
                placeholder="Document summary"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Classification</label>
                <Select value={formData.classification} onValueChange={(value) => 
                  setFormData({ ...formData, classification: value })
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="confidential">Confidential</SelectItem>
                    <SelectItem value="restricted">Restricted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Language</label>
                <Select value={formData.language} onValueChange={(value) =>
                  setFormData({ ...formData, language: value })
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Pages</label>
                <Input
                  type="number"
                  value={formData.pages}
                  onChange={(e) => setFormData({ ...formData, pages: e.target.value })}
                  placeholder="Number of pages"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Retention (months)</label>
                <Input
                  type="number"
                  value={formData.retention_period_months}
                  onChange={(e) => setFormData({ ...formData, retention_period_months: e.target.value })}
                  placeholder="Retention period in months"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex-1 gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditing(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Actions */}
      {!isReadOnly && (
        <div className="grid grid-cols-2 gap-2">
          {onVersionHistory && (
            <Button variant="outline" size="sm" onClick={onVersionHistory}>
              Versions
            </Button>
          )}
          {onCheckOut && (
            <Button variant="outline" size="sm" onClick={onCheckOut}>
              {document.status === 'available' ? 'Check Out' : 'Check In'}
            </Button>
          )}
          {onShare && (
            <Button variant="outline" size="sm" onClick={onShare} className="gap-2">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          )}
          {onDelete && (
            <Button variant="destructive" size="sm" onClick={onDelete} className="gap-2">
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
