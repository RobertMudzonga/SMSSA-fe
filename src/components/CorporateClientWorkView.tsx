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
  ArrowLeft,
  Calendar,
  Users,
  Briefcase,
  Scale,
  DollarSign
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { API_BASE } from '@/lib/api';
import CaseFormModal from './CaseFormModal';
import ProjectFormModal from './ProjectFormModal';
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

interface Project {
  project_id: number;
  project_name: string;
  client_name: string;
  client_email: string;
  case_type: string;
  priority: string;
  status: string;
  assigned_user_id: number | null;
  project_manager_id: number | null;
  project_manager_name?: string;
  payment_amount: number | null;
  start_date: string | null;
  created_at: string;
  updated_at: string;
}

interface CorporateClient {
  id: number;
  name: string;
  contact: string;
  email?: string;
  employees?: number;
}

export default function CorporateClientWorkView({
  corporateClient,
  onBack
}: {
  corporateClient: CorporateClient;
  onBack: () => void;
}) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'all' | 'cases' | 'projects'>('all');
  const [cases, setCases] = useState<Case[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCaseFormModal, setShowCaseFormModal] = useState(false);
  const [showProjectFormModal, setShowProjectFormModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const token = localStorage.getItem('token');

  // Fetch cases and projects
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [casesRes, projectsRes] = await Promise.all([
          fetch(`${API_BASE}/api/legal-cases?corporate_client_id=${corporateClient.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }),
          fetch(`${API_BASE}/api/projects?corporate_client_id=${corporateClient.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        ]);

        if (casesRes.ok) {
          const casesData = await casesRes.json();
          setCases(casesData.cases || casesData || []);
        }

        if (projectsRes.ok) {
          const projectsData = await projectsRes.json();
          setProjects(projectsData || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load work items. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshKey, token, corporateClient.id]);

  const handleAddCase = () => {
    setSelectedCase(null);
    setShowCaseFormModal(true);
  };

  const handleEditCase = (caseItem: Case) => {
    setSelectedCase(caseItem);
    setShowCaseFormModal(true);
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

  const handleAddProject = () => {
    setSelectedProject(null);
    setShowProjectFormModal(true);
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setShowProjectFormModal(true);
  };

  const handleDeleteProject = async (projectId: number) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;

    try {
      const response = await fetch(`${API_BASE}/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to delete project');

      toast({
        title: 'Success',
        description: 'Project deleted successfully.'
      });

      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete project. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleFormClose = () => {
    setShowCaseFormModal(false);
    setShowProjectFormModal(false);
    setSelectedCase(null);
    setSelectedProject(null);
    setRefreshKey(prev => prev + 1);
  };

  // Filter items based on search and status
  const filteredCases = cases.filter(c => {
    const matchesSearch = 
      c.case_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.case_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.client_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || c.case_status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const filteredProjects = projects.filter(p => {
    const matchesSearch = 
      p.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.client_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const displayItems = activeTab === 'all' 
    ? [...filteredCases, ...filteredProjects]
    : activeTab === 'cases'
    ? filteredCases
    : filteredProjects;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'pending_approval':
        return 'bg-blue-100 text-blue-800';
      case 'closed':
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'lost':
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'settled':
        return 'bg-green-100 text-green-800';
      case 'appealing':
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

  const isCase = (item: any): item is Case => 'case_id' in item;
  const isProject = (item: any): item is Project => 'project_id' in item;

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
            {corporateClient.name} - Visa & Legal Work
          </h1>
          <p className="text-gray-500 mt-1">Manage projects and legal cases</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">Total Work Items</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{cases.length + projects.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Projects
          </div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{projects.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Scale className="h-4 w-4" />
            Legal Cases
          </div>
          <div className="text-2xl font-bold text-purple-600 mt-1">{cases.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">Active</div>
          <div className="text-2xl font-bold text-teal-600 mt-1">
            {projects.filter(p => p.status === 'active').length + 
             cases.filter(c => c.case_status === 'active').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">Urgent Priority</div>
          <div className="text-2xl font-bold text-red-600 mt-1">
            {projects.filter(p => p.priority === 'urgent').length + 
             cases.filter(c => c.priority === 'urgent').length}
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
              placeholder="Search by name, reference, or client..."
              className="pl-10 bg-gray-50 border-gray-200"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleAddCase}
              className="gap-2 bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4" />
              Add Legal Case
            </Button>
            <Button
              onClick={handleAddProject}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Project
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'all'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            All ({cases.length + projects.length})
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'projects'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Projects ({projects.length})
          </button>
          <button
            onClick={() => setActiveTab('cases')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'cases'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Legal Cases ({cases.length})
          </button>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Status Filter
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="completed">Completed</option>
              <option value="closed">Closed</option>
              <option value="settled">Settled</option>
              <option value="on_hold">On Hold</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Work Items List */}
      <div className="space-y-3">
        {loading ? (
          <Card className="p-8 text-center text-gray-500">
            Loading work items...
          </Card>
        ) : displayItems.length === 0 ? (
          <Card className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No work items found</p>
            <p className="text-gray-400 text-sm mt-1">
              Create a new project or legal case to get started.
            </p>
          </Card>
        ) : (
          displayItems.map((item) => (
            isCase(item) ? (
              <Card key={`case-${item.case_id}`} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Scale className="h-4 w-4 text-purple-600" />
                      <h3 className="font-bold text-lg text-gray-900">{item.case_title}</h3>
                      <span className="text-xs font-mono bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        {item.case_reference}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${getStatusColor(item.case_status)}`}>
                        {item.case_status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <span>{item.client_name}</span>
                      {item.assigned_case_manager_name && <span>Manager: {item.assigned_case_manager_name}</span>}
                      {item.next_deadline && <span>Deadline: {format(new Date(item.next_deadline), 'MMM d, yyyy')}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(item.priority)}`}>
                      {item.priority.toUpperCase()}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditCase(item)}
                      className="gap-1"
                    >
                      <Edit2 className="h-4 w-4" />Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCase(item.case_id)}
                      className="gap-1 text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ) : isProject(item) ? (
              <Card key={`project-${item.project_id}`} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-blue-600" />
                      <h3 className="font-bold text-lg text-gray-900">{item.project_name}</h3>
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${getStatusColor(item.status)}`}>
                        {item.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {item.client_name}
                      </span>
                      {item.project_manager_name && (
                        <span className="flex items-center gap-1">
                          Project Manager: {item.project_manager_name}
                        </span>
                      )}
                      {item.start_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {format(new Date(item.start_date), 'MMM d, yyyy')}
                        </span>
                      )}
                      {item.payment_amount && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" /> ${Number(item.payment_amount).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(item.priority)}`}>
                      {item.priority.toUpperCase()}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditProject(item)}
                      className="gap-1"
                    >
                      <Edit2 className="h-4 w-4" />Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteProject(item.project_id)}
                      className="gap-1 text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ) : null
          ))
        )}
      </div>

      {/* Modals */}
      {showCaseFormModal && (
        <CaseFormModal
          isOpen={showCaseFormModal}
          onClose={handleFormClose}
          case={selectedCase}
          corporateClient={corporateClient}
        />
      )}
      {showProjectFormModal && (
        <ProjectFormModal
          isOpen={showProjectFormModal}
          onClose={handleFormClose}
          project={selectedProject}
          corporateClient={corporateClient}
        />
      )}
    </div>
  );
}
