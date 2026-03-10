import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ArrowRight, RefreshCw, Trash2, Search, Clock, User } from 'lucide-react';
import { Card } from './ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE } from '../lib/api';

interface LostLead {
  lead_id: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  email?: string;
  phone?: string;
  assigned_to_name?: string;
  notes?: string;
  updated_at?: string;
}

interface LostProspect {
  prospect_id: string;
  first_name?: string;
  last_name?: string;
  deal_name?: string;
  company?: string;
  email?: string;
  assigned_to_name?: string;
  notes?: string;
  updated_at?: string;
}

export default function LostView() {
  const { user } = useAuth();
  const [lostLeads, setLostLeads] = useState<LostLead[]>([]);
  const [lostProspects, setLostProspects] = useState<LostProspect[]>([]);
  const [loading, setLoading] = useState(false);
  const [leadsError, setLeadsError] = useState<string | null>(null);
  const [prospectsError, setProspectsError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('leads');
  const { toast } = useToast();

  useEffect(() => {
    fetchLostLeads();
    fetchLostProspects();
  }, []);

  const fetchLostLeads = async () => {
    setLoading(true);
    setLeadsError(null);
    try {
      const response = await fetch(`${API_BASE}/leads/lost/list`);
      if (response.ok) {
        const data = await response.json();
        setLostLeads(Array.isArray(data) ? data : []);
      } else {
        const errorText = await response.text().catch(() => 'Failed to fetch lost leads');
        console.error('Failed to fetch lost leads:', errorText);
        setLeadsError(errorText || 'Failed to fetch lost leads');
        setLostLeads([]);
      }
    } catch (err) {
      console.error('Error fetching lost leads:', err);
      setLeadsError(String(err));
      toast({ title: 'Failed to fetch lost leads', variant: 'destructive' });
      setLostLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLostProspects = async () => {
    setLoading(true);
    setProspectsError(null);
    try {
      const response = await fetch(`${API_BASE}/prospects/lost/list`);
      if (response.ok) {
        const data = await response.json();
        setLostProspects(Array.isArray(data) ? data : []);
      } else {
        const errorText = await response.text().catch(() => 'Failed to fetch lost prospects');
        console.error('Failed to fetch lost prospects:', errorText);
        setProspectsError(errorText || 'Failed to fetch lost prospects');
        setLostProspects([]);
      }
    } catch (err) {
      console.error('Error fetching lost prospects:', err);
      setProspectsError(String(err));
      toast({ title: 'Failed to fetch lost prospects', variant: 'destructive' });
      setLostProspects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverLead = async (leadId: string) => {
    try {
      const response = await fetch(`${API_BASE}/leads/${leadId}/recover`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id || null,
          user_name: user?.full_name || user?.email || 'Unknown User'
        }),
      });

      if (response.ok) {
        setLostLeads(lostLeads.filter(l => l.lead_id !== leadId));
        toast({ title: 'Lead recovered successfully', variant: 'default' });
      } else {
        const error = await response.json();
        toast({ title: 'Failed to recover lead', description: error.error, variant: 'destructive' });
      }
    } catch (err) {
      console.error('Error recovering lead:', err);
      toast({ title: 'Error recovering lead', variant: 'destructive' });
    }
  };

  const handleRecoverProspect = async (prospectId: string) => {
    try {
      const response = await fetch(`${API_BASE}/prospects/${prospectId}/recover`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id || null,
          user_name: user?.full_name || user?.email || 'Unknown User'
        }),
      });

      if (response.ok) {
        setLostProspects(lostProspects.filter(p => p.prospect_id !== prospectId));
        toast({ title: 'Prospect recovered successfully', variant: 'default' });
      } else {
        const error = await response.json();
        toast({ title: 'Failed to recover prospect', description: error.error, variant: 'destructive' });
      }
    } catch (err) {
      console.error('Error recovering prospect:', err);
      toast({ title: 'Error recovering prospect', variant: 'destructive' });
    }
  };

  const filteredLeads = lostLeads.filter(lead => {
    const searchLower = searchTerm.toLowerCase();
    const leadName = `${lead.first_name || ''} ${lead.last_name || ''}`.toLowerCase();
    return (
      leadName.includes(searchLower) ||
      (lead.company || '').toLowerCase().includes(searchLower) ||
      (lead.email || '').toLowerCase().includes(searchLower) ||
      (lead.phone || '').toLowerCase().includes(searchLower)
    );
  });

  const filteredProspects = lostProspects.filter(prospect => {
    const searchLower = searchTerm.toLowerCase();
    const prospectName = `${prospect.first_name || ''} ${prospect.last_name || ''}`.toLowerCase();
    return (
      prospectName.includes(searchLower) ||
      (prospect.deal_name || '').toLowerCase().includes(searchLower) ||
      (prospect.company || '').toLowerCase().includes(searchLower) ||
      (prospect.email || '').toLowerCase().includes(searchLower)
    );
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getLostReason = (notes?: string): { reason: string; user_name?: string; timestamp?: string } | null => {
    if (!notes) return null;
    
    // Try to parse new structured format first
    const parts = notes.split('---NOTE_ENTRY---');
    for (let i = parts.length - 1; i >= 0; i--) {
      if (parts[i].includes('MARKED AS LOST')) {
        try {
          const entry = JSON.parse(parts[i]);
          if (entry.content && entry.content.includes('MARKED AS LOST')) {
            return {
              reason: entry.content.replace('MARKED AS LOST: ', ''),
              user_name: entry.user_name,
              timestamp: entry.timestamp
            };
          }
        } catch {
          // Fall through to legacy parsing
        }
      }
    }
    
    // Legacy format parsing
    const lines = (notes || '').split('\n');
    const lostLine = lines.find(line => line.includes('MARKED AS LOST'));
    if (lostLine) {
      return {
        reason: lostLine.replace(/.*MARKED AS LOST: /, '').trim()
      };
    }
    return null;
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: string): string => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-ZA', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return timestamp;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Lost Records Recovery</h1>
            <p className="text-gray-600">View and recover lost leads and prospects that were marked as lost.</p>
          </div>
          <button
            onClick={() => { fetchLostLeads(); fetchLostProspects(); }}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, company, email, or phone..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>
        </div>

        <Tabs defaultValue="leads" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="leads">
              Lost Leads ({filteredLeads.length})
            </TabsTrigger>
            <TabsTrigger value="prospects">
              Lost Prospects ({filteredProspects.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leads" className="mt-6">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Loading lost leads...</p>
              </div>
            ) : leadsError ? (
              <Card className="p-6 text-center text-red-700 bg-red-50 border-red-200">
                <p className="font-medium">Unable to load lost leads</p>
                <p className="text-sm mt-2 break-words">{leadsError}</p>
              </Card>
            ) : filteredLeads.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-gray-500">No lost leads found</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredLeads.map(lead => (
                  <Card key={lead.lead_id} className="p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {lead.first_name || ''} {lead.last_name || ''}
                        </h3>
                        {lead.company && (
                          <p className="text-sm text-gray-600 mt-1">{lead.company}</p>
                        )}
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                          {lead.email && (
                            <span className="flex items-center gap-1">
                              <span>✉️</span>
                              {lead.email}
                            </span>
                          )}
                          {lead.phone && (
                            <span className="flex items-center gap-1">
                              <span>📱</span>
                              {lead.phone}
                            </span>
                          )}
                        </div>
                        {lead.assigned_to_name && (
                          <p className="text-xs text-gray-500 mt-2">
                            Assigned to: {lead.assigned_to_name}
                          </p>
                        )}
                        {getLostReason(lead.notes) && (
                          <div className="mt-2 p-2 bg-red-50 rounded border border-red-100">
                            <p className="text-xs text-red-600 italic">
                              Lost reason: {getLostReason(lead.notes)?.reason}
                            </p>
                            {getLostReason(lead.notes)?.user_name && (
                              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                <User className="w-3 h-3" />
                                <span>By: {getLostReason(lead.notes)?.user_name}</span>
                                {getLostReason(lead.notes)?.timestamp && (
                                  <>
                                    <Clock className="w-3 h-3 ml-2" />
                                    <span>{formatTimestamp(getLostReason(lead.notes)?.timestamp || '')}</span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        {lead.updated_at && (
                          <p className="text-xs text-gray-400 mt-2">
                            Updated: {formatDate(lead.updated_at)}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleRecoverLead(lead.lead_id)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Recover
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="prospects" className="mt-6">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Loading lost prospects...</p>
              </div>
            ) : prospectsError ? (
              <Card className="p-6 text-center text-red-700 bg-red-50 border-red-200">
                <p className="font-medium">Unable to load lost prospects</p>
                <p className="text-sm mt-2 break-words">{prospectsError}</p>
              </Card>
            ) : filteredProspects.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-gray-500">No lost prospects found</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredProspects.map(prospect => (
                  <Card key={prospect.prospect_id} className="p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {prospect.first_name || ''} {prospect.last_name || ''}
                        </h3>
                        {prospect.deal_name && (
                          <p className="text-sm text-teal-600 font-medium mt-1">
                            Deal: {prospect.deal_name}
                          </p>
                        )}
                        {prospect.company && (
                          <p className="text-sm text-gray-600 mt-1">{prospect.company}</p>
                        )}
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                          {prospect.email && (
                            <span className="flex items-center gap-1">
                              <span>✉️</span>
                              {prospect.email}
                            </span>
                          )}
                        </div>
                        {prospect.assigned_to_name && (
                          <p className="text-xs text-gray-500 mt-2">
                            Assigned to: {prospect.assigned_to_name}
                          </p>
                        )}
                        {getLostReason(prospect.notes) && (
                          <div className="mt-2 p-2 bg-red-50 rounded border border-red-100">
                            <p className="text-xs text-red-600 italic">
                              Lost reason: {getLostReason(prospect.notes)?.reason}
                            </p>
                            {getLostReason(prospect.notes)?.user_name && (
                              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                <User className="w-3 h-3" />
                                <span>By: {getLostReason(prospect.notes)?.user_name}</span>
                                {getLostReason(prospect.notes)?.timestamp && (
                                  <>
                                    <Clock className="w-3 h-3 ml-2" />
                                    <span>{formatTimestamp(getLostReason(prospect.notes)?.timestamp || '')}</span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        {prospect.updated_at && (
                          <p className="text-xs text-gray-400 mt-2">
                            Updated: {formatDate(prospect.updated_at)}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleRecoverProspect(prospect.prospect_id)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Recover
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
