import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Plus, Calendar, FileText, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';

interface Submission {
  submission_id: number;
  project_id?: number;
  project_name: string;
  submission_type: string;
  submission_date: string;
  submitted_by: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  notes?: string;
  scheduled_for_date?: string;
  client_name?: string;
  created_at: string;
  updated_at: string;
}

interface SubmissionsViewProps {
  submissions: Submission[];
  projects: any[];
  onAddSubmission: (data: any) => void;
  onUpdateSubmission: (id: number, data: any) => void;
  onDeleteSubmission: (id: number) => void;
  onRefresh?: () => void;
}

const SUBMISSION_TYPES = [
  'Johannesburg',
  'Pretoria',
  'Durban',
  'Bloemfontein',
  'George',
  'Kimberley',
  'Nelspruit',
  'Polokwane',
  'Port Elizabeth',
  'Cape Town',
  'DTI',
  'Home Affairs',
  'Prohibitions appeal',
  'Overstay Appeals',
  'Sheriff',
  'High Court',
  'E-visa portal',
  'Consulate'
];

export default function SubmissionsView({
  submissions,
  projects,
  onAddSubmission,
  onUpdateSubmission,
  onDeleteSubmission,
  onRefresh,
}: SubmissionsViewProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [formData, setFormData] = useState({
    project_id: '',
    project_name: '',
    submission_type: '',
    submission_date: '',
    scheduled_for_date: '',
    notes: '',
    client_name: '',
  });
  const { toast } = useToast();
  const { user } = useAuth();

  // Get unique submission types from existing submissions
  const uniqueTypes = Array.from(new Set(submissions.map(s => s.submission_type))).sort();

  const filteredSubmissions = submissions.filter(s => {
    const statusMatch = filterStatus === 'all' || s.status === filterStatus;
    const typeMatch = filterType === 'all' || s.submission_type === filterType;
    const searchMatch = !searchTerm || 
      s.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.submission_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    return statusMatch && typeMatch && searchMatch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Calendar className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'submitted':
        return <Badge className="bg-blue-100 text-blue-800"><CheckCircle className="w-3 h-3 mr-1" />Submitted</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'Application': 'bg-blue-100 text-blue-800',
      'Documentation': 'bg-purple-100 text-purple-800',
      'Payment': 'bg-green-100 text-green-800',
      'Status Update': 'bg-orange-100 text-orange-800',
      'Review': 'bg-pink-100 text-pink-800',
      'Compliance': 'bg-red-100 text-red-800',
      'Report': 'bg-indigo-100 text-indigo-800',
      'Other': 'bg-gray-100 text-gray-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const isDateUpcoming = (dateString: string) => {
    const submissionDate = new Date(dateString);
    const today = new Date();
    const daysUntil = Math.ceil((submissionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil >= 0 && daysUntil <= 7;
  };

  const handleOpenAddModal = () => {
    setFormData({
      project_id: '',
      project_name: '',
      submission_type: '',
      submission_date: '',
      scheduled_for_date: '',
      notes: '',
      client_name: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (submission: Submission) => {
    setSelectedSubmission(submission);
    setFormData({
      project_id: submission.project_id?.toString() || '',
      project_name: submission.project_name,
      submission_type: submission.submission_type,
      submission_date: submission.submission_date,
      scheduled_for_date: submission.scheduled_for_date || '',
      notes: submission.notes || '',
      client_name: submission.client_name || '',
    });
    setIsEditModalOpen(true);
  };

  const handleProjectSelect = (e: any) => {
    const projectId = e.target.value;
    const project = projects.find(p => p.project_id === parseInt(projectId) || p.id === parseInt(projectId));
    if (project) {
      setFormData(prev => ({
        ...prev,
        project_id: projectId,
        project_name: project.project_name || project.name || '',
        client_name: project.client_name || '',
      }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.project_name || !formData.submission_type || !formData.submission_date) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in project name, submission center, and submission date.',
        variant: 'destructive',
      });
      return;
    }

    const submissionData = {
      ...formData,
      submitted_by: user?.name || user?.email || 'Unknown',
      status: 'pending',
    };

    try {
      if (selectedSubmission) {
        await onUpdateSubmission(selectedSubmission.submission_id, submissionData);
        toast({ title: 'Submission updated successfully' });
        setIsEditModalOpen(false);
      } else {
        await onAddSubmission(submissionData);
        toast({ title: 'Submission created successfully' });
        setIsAddModalOpen(false);
      }
      setSelectedSubmission(null);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to save submission',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this submission?')) {
      onDeleteSubmission(id);
      toast({ title: 'Submission deleted' });
    }
  };

  const handleStatusChange = (submission: Submission, newStatus: string) => {
    onUpdateSubmission(submission.submission_id, { ...submission, status: newStatus });
    toast({ title: `Submission marked as ${newStatus}` });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Project Submissions</h2>
        <Button onClick={handleOpenAddModal} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          New Submission
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search by project name or client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Centers</option>
            {SUBMISSION_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Submissions</p>
              <p className="text-2xl font-bold text-gray-900">{submissions.length}</p>
            </div>
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {submissions.filter(s => s.status === 'pending').length}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Submitted</p>
              <p className="text-2xl font-bold text-blue-600">
                {submissions.filter(s => s.status === 'submitted').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">
                {submissions.filter(s => s.status === 'approved').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Center</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Submission Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Submitted By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p>No submissions found</p>
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map(submission => (
                  <tr key={submission.submission_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{submission.project_name}</p>
                        {submission.client_name && (
                          <p className="text-xs text-gray-500">{submission.client_name}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={getTypeColor(submission.submission_type)}>
                        {submission.submission_type}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-gray-900 font-medium">{formatDate(submission.submission_date)}</p>
                        {isDateUpcoming(submission.submission_date) && submission.status === 'pending' && (
                          <div className="flex items-center mt-1 text-orange-600 text-xs">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            This week
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(submission.status)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{submission.submitted_by}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <select
                          value={submission.status}
                          onChange={(e) => handleStatusChange(submission, e.target.value)}
                          className="text-xs px-2 py-1 border border-gray-300 rounded"
                        >
                          <option value="pending">Pending</option>
                          <option value="submitted">Submitted</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                        <button
                          onClick={() => handleOpenEditModal(submission)}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(submission.submission_id)}
                          className="text-red-600 hover:text-red-900 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Submission Modal */}
      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
          setSelectedSubmission(null);
        }
      }}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {selectedSubmission ? 'Edit Submission' : 'New Submission'}
            </DialogTitle>
            <DialogDescription>
              {selectedSubmission ? 'Update submission details' : 'Create a new project submission'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 overflow-y-auto flex-1">
            {/* Project Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Link to Project (Optional)
              </label>
              <select
                value={formData.project_id}
                onChange={handleProjectSelect}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select a project or enter manually below</option>
                {projects.map(project => (
                  <option key={project.project_id || project.id} value={project.project_id || project.id}>
                    {project.project_name || project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Project Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name *
              </label>
              <input
                type="text"
                value={formData.project_name}
                onChange={(e) => setFormData(prev => ({ ...prev, project_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Enter project name"
              />
            </div>

            {/* Client Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Name
              </label>
              <input
                type="text"
                value={formData.client_name}
                onChange={(e) => setFormData(prev => ({ ...prev, client_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Enter client name"
              />
            </div>

            {/* Submission Center */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Submission Center *
              </label>
              <select
                value={formData.submission_type}
                onChange={(e) => setFormData(prev => ({ ...prev, submission_type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select a center</option>
                {SUBMISSION_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Submission Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Submission Date *
              </label>
              <input
                type="date"
                value={formData.submission_date}
                onChange={(e) => setFormData(prev => ({ ...prev, submission_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            {/* Scheduled For Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scheduled For Date
              </label>
              <input
                type="date"
                value={formData.scheduled_for_date}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduled_for_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Add any additional notes"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
                setSelectedSubmission(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
              {selectedSubmission ? 'Update' : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
