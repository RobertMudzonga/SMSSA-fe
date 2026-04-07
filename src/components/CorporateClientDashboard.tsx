import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Building2, Users, Mail, Copy, Check, Briefcase, Trash2, Edit2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import CorporateClientWorkView from './CorporateClientWorkView';
import CreateCorporateClientModal from './CreateCorporateClientModal';

interface CorporateClient {
  corporate_id: number;
  name: string;
  contact_person_name: string;
  contact_person_email: string;
  primary_contact_id: number | null;
  access_token: string;
  sharepoint_folder_url?: string;
  total_cases?: number;
}

export default function CorporateClientDashboard() {
  const { toast } = useToast();
  const { isSuperAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [selectedCorporate, setSelectedCorporate] = useState<CorporateClient | null>(null);
  const [corporates, setCorporates] = useState<CorporateClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingCorporate, setEditingCorporate] = useState<CorporateClient | null>(null);
  const [editSharePointUrl, setEditSharePointUrl] = useState('');

  // Fetch corporate clients
  useEffect(() => {
    fetchCorporates();
  }, []);

  const fetchCorporates = async () => {
    try {
      setLoading(true);
      const response = await apiFetch(`/corporate-clients`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch corporate clients');
      }

      const data = await response.json();
      setCorporates(data.corporate_clients || []);
    } catch (error) {
      console.error('Error fetching corporate clients:', error);
      toast({
        title: 'Error',
        description: 'Failed to load corporate clients',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCorporate = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingId(id);
      const response = await apiFetch(`/corporate-clients/${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to delete corporate client');
      }

      toast({
        title: 'Success',
        description: `${name} has been deleted successfully`,
      });

      setCorporates(prev => prev.filter(c => c.corporate_id !== id));
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete corporate client',
        variant: 'destructive'
      });
      console.error('Error deleting corporate client:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const copyToClipboard = (token: string) => {
    const url = `${window.location.origin}/corporate-dashboard?token=${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    toast({
      title: 'Link Copied',
      description: 'Direct dashboard access link copied to clipboard.',
    });
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleEditSharePointUrl = (corp: CorporateClient) => {
    setEditingCorporate(corp);
    setEditSharePointUrl(corp.sharepoint_folder_url || '');
  };

  const handleSaveSharePointUrl = async () => {
    if (!editingCorporate) return;

    try {
      const response = await apiFetch(`/corporate-clients/${editingCorporate.corporate_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sharepoint_folder_url: editSharePointUrl })
      });

      if (!response.ok) {
        throw new Error('Failed to update SharePoint URL');
      }

      toast({
        title: 'Success',
        description: 'SharePoint URL updated successfully',
      });

      setCorporates(prev => prev.map(c => 
        c.corporate_id === editingCorporate.corporate_id 
          ? { ...c, sharepoint_folder_url: editSharePointUrl }
          : c
      ));

      setEditingCorporate(null);
      setEditSharePointUrl('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update SharePoint URL',
        variant: 'destructive'
      });
    }
  };

  return (
    <>
      {editingCorporate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">Edit SharePoint Link</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Corporate: {editingCorporate.name}
                </label>
                <Input
                  type="url"
                  value={editSharePointUrl}
                  onChange={(e) => setEditSharePointUrl(e.target.value)}
                  placeholder="https://yourorganization.sharepoint.com/sites/corporate/Shared%20Documents"
                  className="w-full"
                />
                <p className="text-xs text-gray-600 mt-2">
                  Enter the SharePoint folder URL where clients will upload documents
                </p>
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingCorporate(null);
                    setEditSharePointUrl('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-teal-600 hover:bg-teal-700"
                  onClick={handleSaveSharePointUrl}
                >
                  Save
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
      {selectedCorporate ? (
        <CorporateClientWorkView
          corporateClient={{
            id: selectedCorporate.corporate_id,
            name: selectedCorporate.name,
            contact: selectedCorporate.contact_person_name || '',
            email: selectedCorporate.contact_person_email
          }}
          onBack={() => setSelectedCorporate(null)}
        />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Corporate Management</h1>
              <p className="text-gray-500 mt-1">Manage corporate accounts and generate dashboard access links.</p>
            </div>
            {isSuperAdmin && (
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="gap-2 bg-teal-600 hover:bg-teal-700"
              >
                <Plus className="h-4 w-4" />
                Create Corporate
              </Button>
            )}
          </div>

          <div className="flex gap-4 items-center bg-white p-4 rounded-xl border shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by company name or contact..." 
                className="pl-10 bg-gray-50 border-gray-200"
              />
            </div>
            <Button variant="outline" className="gap-2">
              Filter
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading corporate clients...</p>
            </div>
          ) : corporates.length === 0 ? (
            <Card className="p-8 bg-slate-50 border-dashed border-2 text-center">
              <div className="max-w-md mx-auto">
                <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h4 className="font-semibold text-gray-900">No Corporate Clients</h4>
                <p className="text-sm text-gray-600 mt-2">
                  {isSuperAdmin
                    ? 'Create your first corporate client to get started.'
                    : 'No corporate clients have been created yet.'}
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {corporates
                .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(corp => (
                  <Card key={corp.corporate_id} className="p-5 hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-700">
                          <Building2 className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">{corp.name}</h3>
                          <div className="flex gap-4 mt-1">
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                              <Users className="h-3 w-3" /> {corp.total_cases || 0} Cases
                            </span>
                            {corp.contact_person_name && (
                              <span className="text-sm text-gray-500 flex items-center gap-1">
                                <Mail className="h-3 w-3" /> {corp.contact_person_name}
                              </span>
                            )}
                          </div>
                          {corp.sharepoint_folder_url && (
                            <div className="mt-2 flex items-center gap-2">
                              <a 
                                href={corp.sharepoint_folder_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-700 underline flex items-center gap-1"
                              >
                                SharePoint Folder <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="hidden lg:block bg-gray-50 p-2 rounded-md border text-xs font-mono text-gray-400 max-w-[150px] truncate">
                          {`${window.location.origin}/corp...`}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-2"
                          onClick={() => copyToClipboard(corp.access_token)}
                        >
                          {copiedToken === corp.access_token ? (
                            <><Check className="h-4 w-4 text-green-500" /> Copied</>
                          ) : (
                            <><Copy className="h-4 w-4" /> Copy Link</>
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-2 text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                          onClick={() => setSelectedCorporate(corp)}
                        >
                          <Briefcase className="h-4 w-4" />
                          Manage Cases
                        </Button>
                        {isSuperAdmin && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => handleEditSharePointUrl(corp)}
                          >
                            <Edit2 className="h-4 w-4" />
                            SharePoint Link
                          </Button>
                        )}
                        {isSuperAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteCorporate(corp.corporate_id, corp.name)}
                            disabled={deletingId === corp.corporate_id}
                          >
                            <Trash2 className="h-4 w-4" />
                            {deletingId === corp.corporate_id ? 'Deleting...' : 'Delete'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          )}

          {!loading && corporates.length > 0 && (
            <Card className="p-8 bg-slate-50 border-dashed border-2 text-center">
              <div className="max-w-md mx-auto">
                <h4 className="font-semibold text-gray-900">Access Management</h4>
                <p className="text-sm text-gray-600 mt-2">
                  Corporate dashboards are multi-tenant and secure. Each company receives a unique URL and access token. They cannot view data from other organizations or individual portals.
                </p>
              </div>
            </Card>
          )}
        </div>
      )}

      <CreateCorporateClientModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchCorporates}
      />
    </>
  );
}
