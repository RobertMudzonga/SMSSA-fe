import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { NotificationBell } from './NotificationBell';
import Sidebar from './Sidebar';
import DashboardView from './DashboardView';
import ProspectsView from './ProspectsView';
import ProjectsView from './ProjectsView';
import DocumentManagement from './DocumentManagement';
import ClientPortalView from './ClientPortalView';
import { EmployeesView } from './EmployeesView';
import DocumentChecklistView from './DocumentChecklistView';
import TemplateLibraryView from './TemplateLibraryView';
import DatabaseHealthDashboard from './DatabaseHealthDashboard';
import { AnalyticsView } from './AnalyticsView';
import ProjectView from './ProjectView';
import LeadsView from './LeadsView';
import LostView from './LostView';
import PaymentRequestsView from './PaymentRequestsView';
import LeaveRequestsView from './LeaveRequestsView';
import ForecastView from './ForecastView';
import SubmissionsView from './SubmissionsView';
import LegalProjectsView from './LegalProjectsView';
import { API_BASE } from '../lib/api';

export default function AppLayout() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [prospects, setProspects] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [employeesLoadError, setEmployeesLoadError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [selectedProjectForChecklist, setSelectedProjectForChecklist] = useState<string | null>(null);
  const [paymentRequests, setPaymentRequests] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadData = async () => {
    // Fetch prospects from backend API
    try {
      const prospectsResponse = await fetch(`${API_BASE}/prospects`);
      const prospectsData = prospectsResponse.ok ? await prospectsResponse.json() : [];
      setProspects(prospectsData || []);
    } catch (error) {
      console.error('Error fetching prospects:', error);
      setProspects([]);
    }
    // Fetch projects via backend
    let projectsData = [];
    try {
      const r = await fetch(`${API_BASE}/projects`);
      projectsData = r.ok ? await r.json() : [];
    } catch (err) {
      console.error('Error fetching projects from backend:', err);
      projectsData = [];
    }
    let employeesData = [];
    try {
      const resp = await fetch(`${API_BASE}/employees`);
      if (resp.ok) {
        employeesData = await resp.json();
        setEmployeesLoadError(null);
      } else {
        const text = await resp.text().catch(() => 'Failed to fetch employees');
        const msg = `Employees API returned ${resp.status}: ${text}`;
        console.error(msg);
        setEmployeesLoadError(msg);
        employeesData = [];
      }
    } catch (err) {
      console.error('Error fetching employees from backend:', err);
      setEmployeesLoadError(String(err));
      employeesData = [];
    }
    // Fetch payment requests
    let paymentRequestsData = [];
    try {
      const r = await fetch(`${API_BASE}/payment-requests`);
      paymentRequestsData = r.ok ? await r.json() : [];
    } catch (err) {
      console.error('Error fetching payment requests:', err);
      paymentRequestsData = [];
    }
    // Fetch submissions
    let submissionsData = [];
    try {
      const r = await fetch(`${API_BASE}/submissions`);
      submissionsData = r.ok ? await r.json() : [];
    } catch (err) {
      console.error('Error fetching submissions:', err);
      submissionsData = [];
    }
    // Derive project metrics per employee (in-progress/completed)
    const projectStatsByManager: Record<string, { inProgress: number; completed: number }> = {};
    projectsData.forEach((p: any) => {
      const managerId = p?.project_manager_id;
      if (!managerId) return;
      const status = (p?.status || '').toString().toLowerCase();
      const isCompleted = status === 'completed' || status === 'complete' || status === 'submitted';
      const key = String(managerId);
      if (!projectStatsByManager[key]) projectStatsByManager[key] = { inProgress: 0, completed: 0 };
      if (isCompleted) projectStatsByManager[key].completed += 1; else projectStatsByManager[key].inProgress += 1;
    });
    const enrichedEmployees = (employeesData || []).map((emp: any) => {
      const stats = projectStatsByManager[String(emp.id)] || { inProgress: 0, completed: 0 };
      return {
        ...emp,
        projects_in_progress: stats.inProgress,
        projects_completed: stats.completed,
        performance_rating: emp.performance_rating ?? null
      };
    });
    // For now, metrics/goals/reviews are loaded later or empty
    setProjects(projectsData || []);
    setDocuments([]);
    setEmployees(enrichedEmployees || []);
    setMetrics([]);
    setGoals([]);
    setReviews([]);
    setPaymentRequests(paymentRequestsData || []);
    setSubmissions(submissionsData || []);
  };

  const handleAddProspect = async (data: any) => {
    console.log('[handleAddProspect] Called with data:', data);
    try {
      console.log('[handleAddProspect] Sending POST to:', `${API_BASE}/prospects`);
      const response = await fetch(`${API_BASE}/prospects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      console.log('[handleAddProspect] Response status:', response.status);
      if (response.ok) {
        await loadData();
        console.log('[handleAddProspect] Successfully added prospect');
        return;
      }

      const errorData = await response.json().catch(() => null);
      console.error('Error adding prospect:', errorData);
      throw new Error(errorData?.error || 'Failed to add prospect');
    } catch (error: any) {
      console.error('Error adding prospect:', error);
      toast({ title: 'Failed to add prospect', description: error?.message || 'Please check your connection.', variant: 'destructive' });
      throw error; // allow modal to catch and show toast
    }
  };

  const handleUpdateProspect = async (id: string, data: any) => {
    try {
      const response = await fetch(`${API_BASE}/prospects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const respJson = await response.json().catch(() => null);
      console.debug('Update prospect response:', response.status, respJson);
      if (response.ok) {
        await loadData();
        return true;
      } else {
        console.error('Failed to update prospect:', respJson);
        toast({ title: 'Failed to update prospect', description: (respJson?.error || respJson?.detail || 'Unknown'), variant: 'destructive' });
        return false;
      }
    } catch (err) {
      console.error('Error updating prospect:', err);
      toast({ title: 'Failed to update prospect', variant: 'destructive' });
      return false;
    }
  };

  const handleEditEmployee = async (id: string, data: any) => {
    if (!isAdmin) {
      toast({ title: 'Permission denied', description: 'Only admins may edit employees', variant: 'destructive' });
      console.warn('Only admins may edit employees');
      return { error: { message: 'Only admins may edit employees' } };
    }
    try {
      const resp = await fetch(`${API_BASE}/employees/${id}`, { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(data) 
      });
      if (resp.ok) {
        await loadData();
        toast({ title: 'Employee updated' });
        return { ok: true };
      }
      const err = await resp.json().catch(() => null);
      console.error('Failed to update employee:', err);
      toast({ title: 'Failed to update employee', description: err?.error || 'Unknown', variant: 'destructive' });
      return { error: err };
    } catch (err) {
      console.error('Error updating employee:', err);
      toast({ title: 'Failed to update employee', description: String(err), variant: 'destructive' });
      return { error: err };
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!isAdmin) {
      toast({ title: 'Permission denied', description: 'Only admins may delete employees', variant: 'destructive' });
      console.warn('Only admins may delete employees');
      return { error: { message: 'Only admins may delete employees' } };
    }
    try {
      const resp = await fetch(`${API_BASE}/employees/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: false }) });
      if (resp.ok) {
        await loadData();
        toast({ title: 'Employee removed' });
        return { ok: true };
      }
      const err = await resp.json().catch(() => null);
      console.error('Failed to delete employee:', err);
      toast({ title: 'Failed to delete employee', description: err?.error || 'Unknown', variant: 'destructive' });
      return { error: err };
    } catch (err) {
      console.error('Error deleting employee:', err);
      toast({ title: 'Failed to delete employee', description: String(err), variant: 'destructive' });
      return { error: err };
    }
  };

  const handleSetProspectTags = async (id: string, tagIds: number[]) => {
    try {
      const response = await fetch(`${API_BASE}/prospects/${id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag_ids: tagIds })
      });
      if (response.ok) loadData();
      else {
        const err = await response.json();
        console.error('Failed to set tags:', err);
        toast({ title: 'Failed to set prospect tags', variant: 'destructive' });
      }
    } catch (err) {
      console.error('Error setting prospect tags:', err);
      toast({ title: 'Failed to set prospect tags', variant: 'destructive' });
    }
  };

  const handleMarkProspectLost = async (id: string, reason = 'Marked lost by user') => {
    try {
      const response = await fetch(`${API_BASE}/prospects/${id}/lost`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          reason,
          user_id: user?.id || null,
          user_name: user?.full_name || user?.email || 'Unknown User'
        })
      });
      if (response.ok) {
        toast({ title: 'Prospect marked as lost' });
        await loadData();
        return { ok: true };
      }
      const err = await response.json().catch(() => null);
      console.error('Failed to mark prospect lost:', err);
      toast({ title: 'Failed to mark lost', description: err?.error || 'Unknown', variant: 'destructive' });
      return { error: err };
    } catch (err) {
      console.error('Error marking prospect lost:', err);
      toast({ title: 'Failed to mark lost', description: String(err), variant: 'destructive' });
      return { error: err };
    }
  };

  const handleDeleteProspect = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE}/prospects/${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast({ title: 'Prospect deleted' });
        await loadData();
        return { ok: true };
      }
      const err = await response.json().catch(() => null);
      console.error('Failed to delete prospect:', err);
      toast({ title: 'Failed to delete prospect', description: err?.error || 'Unknown', variant: 'destructive' });
      return { error: err };
    } catch (err) {
      console.error('Error deleting prospect:', err);
      toast({ title: 'Failed to delete prospect', description: String(err), variant: 'destructive' });
      return { error: err };
    }
  };

  const handleMoveStage = async (prospectId: string, toStage: string) => {
    try {
      console.debug('[handleMoveStage] request', { prospectId, toStage });
      // Map stage strings to stage IDs
      const stageMapping = {
        'opportunity': 1,
        'quote_requested': 2,
        'quote_sent': 3,
        'first_follow_up': 4,
        'second_follow_up': 5,
        'mid_month_follow_up': 6,
        'month_end_follow_up': 7,
        'next_month_follow_up': 8,
        'discount_requested': 9,
        'quote_accepted': 10,
        'engagement_sent': 11,
        'invoice_sent': 12,
        'payment_date_confirmed': 13,
        'won': 14,
        'closed_won': 14
      };
      // determine stage id
      let stage_id = stageMapping[toStage as keyof typeof stageMapping];
      if (!stage_id) {
        console.error('Invalid stage:', toStage);
        return null;
      }

      const response = await fetch(`${API_BASE}/prospects/${prospectId}/stage`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stage_id }),
      });

      const respJson = await response.json().catch(() => null);
      if (response.ok) {
        console.debug('[handleMoveStage] success', respJson);
        loadData();
        return respJson;
      } else {
        console.error('Error moving stage:', respJson);
        toast({ title: 'Failed to move stage', description: respJson?.error || 'Unknown error', variant: 'destructive' });
        return respJson;
      }
    } catch (error) {
      console.error('Error moving stage:', error);
      toast({ title: 'Failed to move stage', description: 'Please check your connection.', variant: 'destructive' });
      return null;
    }
  };

  const handleScheduleFollowUp = async (prospectId: string, type: string, date: string) => {
    try {
      const storedEmail = window.localStorage.getItem('userEmail') || '';
      const res = await fetch(`${API_BASE}/prospects/${prospectId}/followup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': storedEmail },
        body: JSON.stringify({ followUpType: type, scheduledDate: date })
      });
      if (!res.ok) console.error('Schedule follow-up failed', await res.text());
      loadData();
    } catch (error) {
      console.error('Error scheduling follow-up:', error);
    }
  };

  const handleCreateProject = async (data: any) => {
    try {
      const storedEmail = window.localStorage.getItem('userEmail') || '';
      const res = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': storedEmail },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => 'failed');
        console.error('Create project failed', res.status, txt);
        toast({ title: 'Failed to create project', description: txt, variant: 'destructive' });
        return;
      }
      await loadData();
      toast({ title: 'Project created successfully' });
    } catch (err) {
      console.error('Error creating project via backend:', err);
      toast({ title: 'Failed to create project', description: String(err), variant: 'destructive' });
    }
  };

  const handleUploadDocument = async (data: any) => {
    // If the upload endpoint already returned a created document, accept it
    if (data && (data.document_id || data.id)) {
      await loadData();
      return data;
    }

    // Otherwise fallback to creating a document record via backend API
    try {
      const payload = {
        document_name: data.document_name,
        document_type: data.document_type,
        project_id: data.project_id ?? null,
        signature_required: data.signature_required ?? false,
        file_url: data.file_path || data.file_url || null,
        file_size: data.file_size ?? 0,
        file_type: data.file_type || null,
        status: 'pending'
      };
      const storedEmail = window.localStorage.getItem('userEmail');
      const headers: Record<string,string> = { 'Content-Type': 'application/json' };
      if (storedEmail) headers['x-user-email'] = storedEmail;
      const res = await fetch('/api/documents/record', { method: 'POST', headers, body: JSON.stringify(payload) });
      const ct = res.headers.get('content-type') || '';
      let json: any = null;
      if (ct.includes('application/json')) json = await res.json(); else { const t = await res.text(); try { json = JSON.parse(t); } catch { json = { error: t }; } }
      if (!res.ok) return { error: json || 'failed' };
      await loadData();
      return json;
    } catch (err) {
      return { error: err };
    }
  };

  const handleAddEmployee = async (data?: { full_name: string; work_email: string; job_position?: string; department?: string | null; manager_id?: number | null }) => {
    // Prefer using the AddEmployeeModal form. If no data is provided,
    // switch to the Employees tab and prompt the user to use the form.
    if (!data) {
      setActiveTab('employees');
      toast({ title: 'Use the Add Employee form', description: 'Open Employees → Add Employee to create a new account' });
      return { error: 'no_form_data' };
    }

    // Basic validation (same rules as the modal)
    try {
      const { full_name: fullName, work_email: workEmail } = data as any;
      if (!fullName || !workEmail) {
        toast({ title: 'Missing fields', description: 'Please provide name and work email', variant: 'destructive' });
        return { error: 'missing_fields' };
      }
      const allowedDomain = '@immigrationspecialists.co.za';
      if (!workEmail.includes('@') || !workEmail.toLowerCase().endsWith(allowedDomain)) {
        toast({ title: 'Invalid email', description: `Work email must be a ${allowedDomain} address`, variant: 'destructive' });
        return { error: 'invalid_email' };
      }

      try {
        const resp = await fetch(`${API_BASE}/employees`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: fullName,
            work_email: workEmail.toLowerCase(),
            job_position: data.job_position || 'Staff',
            department: data.department ?? null,
            manager_id: data.manager_id ?? null
          })
        });
        const respJson = await resp.json().catch(() => null);
        if (!resp.ok) {
          console.error('Failed to add employee (backend):', respJson);
          toast({ title: 'Failed to add employee', description: respJson?.error || respJson?.message || 'Unknown', variant: 'destructive' });
          return { error: respJson };
        }
        toast({ title: 'Employee added', description: respJson?.full_name || fullName });
        await loadData();
        return respJson;
      } catch (err) {
        console.error('Error adding employee via backend:', err);
        toast({ title: 'Failed to add employee', description: String(err), variant: 'destructive' });
        return { error: err };
      }
    } catch (err) {
      console.error('Error validating employee data:', err);
      toast({ title: 'Failed to add employee', description: String(err), variant: 'destructive' });
      return { error: err };
    }
  };

  const handleCalculateMetrics = async (employeeId: string) => {
    try {
      const today = new Date();
      const periodStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const periodEnd = today.toISOString().split('T')[0];
      const storedEmail = window.localStorage.getItem('userEmail') || '';
      const res = await fetch(`${API_BASE}/employees/${employeeId}/metrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': storedEmail },
        body: JSON.stringify({ periodStart, periodEnd })
      });
      if (!res.ok) console.error('Calculate metrics failed', await res.text());
      loadData();
    } catch (error) {
      console.error('Error calculating metrics:', error);
    }
  };

  const handleAddPaymentRequest = async (data: any) => {
    try {
      const response = await fetch(`${API_BASE}/payment-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await loadData();
        toast({ title: 'Payment request submitted' });
        return;
      }

      const errorData = await response.json().catch(() => null);
      console.error('Error adding payment request:', errorData);
      throw new Error(errorData?.error || 'Failed to add payment request');
    } catch (error: any) {
      console.error('Error adding payment request:', error);
      toast({ title: 'Failed to add payment request', description: error?.message, variant: 'destructive' });
      throw error;
    }
  };

  const handleApprovePaymentRequest = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE}/payment-requests/${id}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved_by: user?.employee_id }),
      });

      if (response.ok) {
        await loadData();
        toast({ title: 'Payment request approved' });
      } else {
        const errorData = await response.json().catch(() => null);
        toast({ title: 'Failed to approve', description: errorData?.error, variant: 'destructive' });
      }
    } catch (error: any) {
      console.error('Error approving payment request:', error);
      toast({ title: 'Failed to approve', variant: 'destructive' });
    }
  };

  const handleRejectPaymentRequest = async (id: number, reason: string) => {
    try {
      const response = await fetch(`${API_BASE}/payment-requests/${id}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved_by: user?.employee_id, rejection_reason: reason }),
      });

      if (response.ok) {
        await loadData();
        toast({ title: 'Payment request rejected' });
      } else {
        const errorData = await response.json().catch(() => null);
        toast({ title: 'Failed to reject', description: errorData?.error, variant: 'destructive' });
      }
    } catch (error: any) {
      console.error('Error rejecting payment request:', error);
      toast({ title: 'Failed to reject', variant: 'destructive' });
    }
  };

  const handleMarkPaymentPaid = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE}/payment-requests/${id}/mark-paid`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paid_by: user?.employee_id }),
      });

      if (response.ok) {
        await loadData();
        toast({ title: 'Payment marked as paid' });
      } else {
        const errorData = await response.json().catch(() => null);
        toast({ title: 'Failed to mark as paid', description: errorData?.error, variant: 'destructive' });
      }
    } catch (error: any) {
      console.error('Error marking payment as paid:', error);
      toast({ title: 'Failed to mark as paid', variant: 'destructive' });
    }
  };

  const handleDeletePaymentRequest = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE}/payment-requests/${id}`, { method: 'DELETE' });

      if (response.ok) {
        await loadData();
        toast({ title: 'Payment request deleted' });
      } else {
        const errorData = await response.json().catch(() => null);
        toast({ title: 'Failed to delete', description: errorData?.error, variant: 'destructive' });
      }
    } catch (error: any) {
      console.error('Error deleting payment request:', error);
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  const handleAddSubmission = async (data: any) => {
    try {
      const response = await fetch(`${API_BASE}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        await loadData();
        toast({ title: 'Submission created successfully' });
        return;
      }
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || 'Failed to create submission');
    } catch (error: any) {
      console.error('Error creating submission:', error);
      toast({ title: 'Failed to create submission', description: error?.message, variant: 'destructive' });
    }
  };

  const handleUpdateSubmission = async (id: number, data: any) => {
    try {
      const response = await fetch(`${API_BASE}/submissions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        await loadData();
        toast({ title: 'Submission updated successfully' });
        return;
      }
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || 'Failed to update submission');
    } catch (error: any) {
      console.error('Error updating submission:', error);
      toast({ title: 'Failed to update submission', description: error?.message, variant: 'destructive' });
    }
  };

  const handleDeleteSubmission = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE}/submissions/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await loadData();
        toast({ title: 'Submission deleted successfully' });
        return;
      }
      const errorData = await response.json().catch(() => null);
      toast({ title: 'Failed to delete', description: errorData?.error, variant: 'destructive' });
    } catch (error: any) {
      console.error('Error deleting submission:', error);
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  const projectsRevenue = projects.reduce((sum, p) => {
    const amount = p.payment_amount ? parseFloat(p.payment_amount) : 0;
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  const projectsRevenueReceived = projects.reduce((sum, p) => {
    const received = p.payment_received ? parseFloat(p.payment_received) : 0;
    return sum + (isNaN(received) ? 0 : received);
  }, 0);

  // Get prospects revenue - sum of forecast_amount where stage is 14 (won)
  const prospectsRevenue = prospects.reduce((sum, p) => {
    // Won prospects have current_stage_id = 14 or status = 'won'
    const isWon = p.current_stage_id === 14 || (p.status && p.status.toLowerCase() === 'won');
    if (isWon) {
      const amount = p.forecast_amount ? parseFloat(p.forecast_amount) : 0;
      return sum + (isNaN(amount) ? 0 : amount);
    }
    return sum;
  }, 0);

  const stats = {
    totalProspects: prospects.length,
    activeProjects: projects.filter(p => {
      const s = (p && p.status) ? p.status.toString().toLowerCase() : '';
      return s !== 'completed' && s !== 'complete' && s !== 'submitted';
    }).length,
    submittedProjects: projects.filter(p => {
      const s = (p && p.status) ? p.status.toString().toLowerCase() : '';
      return s === 'submitted';
    }).length,
    pendingDocuments: documents.filter(d => d.status === 'pending').length,
    projectsRevenue,
    projectsRevenueReceived,
    prospectsRevenue,
    totalRevenue: projectsRevenueReceived + prospectsRevenue
  };

  const clientData = {
    name: 'John Doe',
    email: 'john@example.com',
    project: projects[0],
    documents: documents.slice(0, 3),
    activities: [
      { description: 'Document uploaded', created_at: new Date().toISOString() },
      { description: 'Case status updated', created_at: new Date().toISOString() }
    ]
  };

  return (
    <NotificationProvider employeeId={user?.employee_id}>
      <div className="flex min-h-screen bg-gray-50 w-full h-screen">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 overflow-auto md:ml-64 w-full">
          <div className="p-4 md:p-8">
          {/* Mobile top bar */}
          <div className="md:hidden flex items-center justify-between mb-4">
            <button onClick={() => setIsSidebarOpen(true)} className="px-3 py-2 bg-white rounded shadow">
              ☰
            </button>
            <h1 className="text-lg font-semibold">ImmigratePro</h1>
            <NotificationBell employeeId={user?.employee_id} />
          </div>

          {/* Desktop header actions */}
          <div className="hidden md:flex items-center justify-end gap-3 mb-4">
            {user ? (
              <>
                <NotificationBell employeeId={user?.employee_id} />
                <div className="text-sm text-gray-700">{user.email}</div>
                <button onClick={async () => { await logout(); toast({ title: 'Logged out' }); navigate('/login'); }} className="px-3 py-1 bg-white border rounded">Sign out</button>
              </>
            ) : (
              <button onClick={() => navigate('/login')} className="px-3 py-1 bg-white border rounded">Sign in</button>
            )}
          </div>
        {employeesLoadError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded flex items-center justify-between">
            <div>
              <strong>Employees API error:</strong>&nbsp;{employeesLoadError}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setEmployeesLoadError(null); loadData(); }} className="px-3 py-1 bg-white border rounded">Retry</button>
            </div>
          </div>
        )}
        {activeTab === 'dashboard' && <DashboardView stats={stats} />}
        {activeTab === 'prospects' && (
          <ProspectsView 
            prospects={prospects} 
            onAddProspect={handleAddProspect} 
            onUpdateProspect={handleUpdateProspect}
            onMoveStage={handleMoveStage}
            onOpenProject={(projectId: string) => { setActiveTab('projects'); setSelectedProjectForChecklist(projectId); }}
            onScheduleFollowUp={handleScheduleFollowUp}
            onDeleteProspect={handleDeleteProspect}
            onMarkProspectLost={handleMarkProspectLost}
            onSetProspectTags={handleSetProspectTags}
          />
        )}

        {activeTab === 'forecast' && <ForecastView />}

        {activeTab === 'projects' && !selectedProjectForChecklist && (
          <ProjectsView 
            projects={projects} 
            onCreateProject={handleCreateProject} 
            onProjectClick={setSelectedProjectForChecklist}
            employees={employees}
            onRefresh={loadData}
          />
        )}
        {activeTab === 'projects' && selectedProjectForChecklist && (
          <ProjectView
            projectId={selectedProjectForChecklist}
            onClose={() => setSelectedProjectForChecklist(null)}
            onDataChange={loadData}
          />
        )}

        {activeTab === 'employees' && (
          <EmployeesView 
            employees={employees}
            metrics={metrics}
            goals={goals}
            reviews={reviews}
            onAddEmployee={handleAddEmployee}
            onEditEmployee={handleEditEmployee}
            onCalculateMetrics={handleCalculateMetrics}
            onDeleteEmployee={handleDeleteEmployee}
          />
        )}
        {activeTab === 'documents' && <DocumentManagement />}
        {activeTab === 'templates' && <TemplateLibraryView />}
        {activeTab === 'analytics' && <AnalyticsView />}
        {activeTab === 'client-portal' && <ClientPortalView clientData={clientData} />}
        {activeTab === 'database-health' && <DatabaseHealthDashboard />}
        {activeTab === 'leads' && <LeadsView />}
        {activeTab === 'lost' && <LostView />}
        {activeTab === 'leave-requests' && <LeaveRequestsView />}
        {activeTab === 'payment-requests' && (
          <PaymentRequestsView
            paymentRequests={paymentRequests}
            onAddPaymentRequest={handleAddPaymentRequest}
            onApprove={handleApprovePaymentRequest}
            onReject={handleRejectPaymentRequest}
            onMarkPaid={handleMarkPaymentPaid}
            onDelete={handleDeletePaymentRequest}
          />
        )}
        {activeTab === 'submissions' && (
          <SubmissionsView
            submissions={submissions}
            projects={projects}
            onAddSubmission={handleAddSubmission}
            onUpdateSubmission={handleUpdateSubmission}
            onDeleteSubmission={handleDeleteSubmission}
            onRefresh={loadData}
          />
        )}
        {activeTab === 'legal-projects' && <LegalProjectsView />}
          </div>
        </main>
      </div>
    </NotificationProvider>
  );
}
