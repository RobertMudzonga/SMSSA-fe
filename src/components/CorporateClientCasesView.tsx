import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Filter, 
  Download,
  ChevronRight,
  ArrowLeft,
  MapPin,
  Calendar,
  Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { API_BASE } from '@/lib/api';
import CaseFormModal from './CaseFormModal';
import { format } from 'date-fns';

interface Case {
  case_id: number;
  case_reference: string;
  case_type: string;
  case_title: string;
  case_status: string;
  client_name: string;
  client_email: string;
  assigned_case_manager_id: number | null;
  assigned_case_manager_name?: string;
  priority: string;
  current_step: number;
  next_deadline: string | null;
  created_at: string;
  updated_at: string;
  step_history: Array<any>;
  workflow_data: Record<string, any>;
}

interface CorporateClient {
  id: number;
  name: string;
  contact: string;
  email?: string;
  employees?: number;
}

export default function CorporateClientCasesView({
  corporateClient,
  onBack
}: {
  corporateClient: CorporateClient;
  onBack: () => void;
}) {
  const { toast } = useToast();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const token = localStorage.getItem('token');

  // Fetch cases for this corporate client
  useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoading(true);
        
        // For now, fetch all legal cases - in production, filter by corporate client
        // This would be: GET /api/legal-cases?corporate_id=${corporateClient.id}
        const response = await fetch(`${API_BASE}/api/legal-cases`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) throw new Error('Failed to fetch cases');
        
        const data = await response.json();
        setCases(data.cases || data || []);
      } catch (error) {
        console.error('Error fetching cases:', error);
        toast({
          title: 'Error',
          description: 'Failed to load cases. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, [refreshKey, token]);

  const handleAddCase = () => {
    setSelectedCase(null);
    setShowFormModal(true);
  };

  const handleEditCase = (caseItem: Case) => {
    setSelectedCase(caseItem);
    setShowFormModal(true);
  };

  const handleDeleteCase = async (caseId: number) => {
    if (!window.confirm('Are you sure you want to delete this case?')) return;

    try {
      const response = await fetch(`${API_BASE}/api/legal-cases/${caseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to delete case');

      toast({
        title: 'Success',
        description: 'Case deleted successfully.'
      });

      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting case:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete case. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleFormClose = () => {
    setShowFormModal(false);
    setSelectedCase(null);
    setRefreshKey(prev => prev + 1);
  };

  // Filter and search cases
  const filteredCases = cases.filter(c => {
    const matchesSearch = 
      c.case_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.case_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.client_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || c.case_status === filterStatus;
    const matchesType = filterType === 'all' || c.case_type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      case 'lost':
        return 'bg-red-100 text-red-800';
      case 'settled':
        return 'bg-green-100 text-green-800';
      case 'appealing':
        return 'bg-purple-100 text-purple-800';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-blue-600 bg-blue-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="h-4 w-4" />;
      case 'closed':
        return <CheckCircle className="h-4 w-4" />;
      case 'lost':
        return <AlertCircle className="h-4 w-4" />;
      case 'settled':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getCaseTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      overstay_appeal: 'Overstay Appeal',
      prohibited_persons: 'Prohibited Persons',
      high_court_expedition: 'High Court',
      appeals_8_4: 'Section 8(4) Appeal',
      appeals_8_6: 'Section 8(6) Appeal'
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Corporate Clients
          </Button>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {corporateClient.name} - Cases Management
          </h1>
          <p className="text-gray-500 mt-1">Manage and track all ongoing cases</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">Total Cases</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{cases.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">Active Cases</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {cases.filter(c => c.case_status === 'active').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">Urgent Priority</div>
          <div className="text-2xl font-bold text-red-600 mt-1">
            {cases.filter(c => c.priority === 'urgent').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">Overdue Deadlines</div>
          <div className="text-2xl font-bold text-orange-600 mt-1">
            {cases.filter(c => c.next_deadline && new Date(c.next_deadline) < new Date()).length}
          </div>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border shadow-sm space-y-4">
        <div className="flex gap-4 flex-col md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by case reference, title, or client..."
              className="pl-10 bg-gray-50 border-gray-200"
            />
          </div>
          <Button
            onClick={handleAddCase}
            className="gap-2 bg-teal-600 hover:bg-teal-700 self-stretch md:self-auto"
          >
            <Plus className="h-4 w-4" />
            Add New Case
          </Button>
        </div>

        <div className="flex gap-4 flex-col md:flex-row">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
              <option value="settled">Settled</option>
              <option value="lost">Lost</option>
              <option value="appealing">Appealing</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Case Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
            >
              <option value="all">All Types</option>
              <option value="overstay_appeal">Overstay Appeal</option>
              <option value="prohibited_persons">Prohibited Persons</option>
              <option value="high_court_expedition">High Court</option>
              <option value="appeals_8_4">Section 8(4) Appeal</option>
              <option value="appeals_8_6">Section 8(6) Appeal</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cases List */}
      <div className="space-y-3">
        {loading ? (
          <Card className="p-8 text-center text-gray-500">
            Loading cases...
          </Card>
        ) : filteredCases.length === 0 ? (
          <Card className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No cases found</p>
            <p className="text-gray-400 text-sm mt-1">
              {cases.length === 0 ? 'Create a new case to get started.' : 'Try adjusting your filters.'}
            </p>
          </Card>
        ) : (
          filteredCases.map(caseItem => (
            <Card key={caseItem.case_id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* Left Content */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="pt-1">
                      {getStatusIcon(caseItem.case_status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-lg text-gray-900">
                          {caseItem.case_title}
                        </h3>
                        <span className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {caseItem.case_reference}
                        </span>
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${getStatusColor(caseItem.case_status)}`}>
                          {caseItem.case_status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {getCaseTypeLabel(caseItem.case_type)}
                      </p>
                    </div>
                  </div>

                  {/* Case Details */}
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Users className="h-4 w-4" />
                      {caseItem.client_name}
                    </div>
                    {caseItem.assigned_case_manager_name && (
                      <div className="flex items-center gap-1 text-gray-600">
                        <Users className="h-4 w-4" />
                        Assigned: {caseItem.assigned_case_manager_name}
                      </div>
                    )}
                    {caseItem.next_deadline && (
                      <div className={`flex items-center gap-1 ${
                        new Date(caseItem.next_deadline) < new Date() ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        <Calendar className="h-4 w-4" />
                        {format(new Date(caseItem.next_deadline), 'MMM d, yyyy')}
                      </div>
                    )}
                  </div>

                  {/* Step Progress */}
                  {caseItem.step_history && caseItem.step_history.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs font-medium text-gray-600 mb-1">
                        Progress: Step {caseItem.current_step} of {caseItem.step_history.length}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-teal-600 h-2 rounded-full"
                          style={{
                            width: `${(caseItem.current_step / caseItem.step_history.length) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Content - Priority & Actions */}
                <div className="flex items-center gap-2 md:flex-col md:items-end">
                  <div className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(caseItem.priority)}`}>
                    {caseItem.priority.toUpperCase()}
                  </div>

                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditCase(caseItem)}
                      className="gap-1"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCase(caseItem.case_id)}
                      className="gap-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Case Form Modal */}
      {showFormModal && (
        <CaseFormModal
          isOpen={showFormModal}
          onClose={handleFormClose}
          case={selectedCase}
          corporateClient={corporateClient}
        />
      )}
    </div>
  );
}
