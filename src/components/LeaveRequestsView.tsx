import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE } from '../lib/api';
import LeaveBalanceCounter from './LeaveBalanceCounter';

interface LeaveRequest {
  id?: string;
  request_id?: string;
  employee_id?: string;
  employee_name?: string;
  leave_type?: string;
  start_date?: string;
  end_date?: string;
  reason?: string;
  status?: string;
  created_at?: string;
  approved_by?: string;
  comments?: string;
  days_requested?: number | string;
  days_paid?: number | string;
  days_unpaid?: number | string;
  is_fully_paid?: boolean;
}

// Helper function to safely format numeric values
const formatDays = (value: number | string | undefined | null, defaultValue = 'N/A') => {
  if (value === undefined || value === null || value === '') return defaultValue;
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(numValue) ? defaultValue : numValue.toFixed(1);
};

export default function LeaveRequestsView() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    leave_type: 'annual',
    start_date: '',
    end_date: '',
    reason: ''
  });
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    loadLeaveRequests();
  }, []);

  const loadLeaveRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/leave-requests`);
      const data = res.ok ? await res.json() : [];
      setLeaveRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading leave requests:', err);
      toast({ title: 'Error loading leave requests', variant: 'destructive' });
      setLeaveRequests([]);
    }
    setLoading(false);
  };

  const createLeaveRequest = async () => {
    if (!formData.leave_type || !formData.start_date || !formData.end_date) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const email = user?.email || window.localStorage.getItem('userEmail');
      if (email) headers['x-user-email'] = email;

      const res = await fetch(`${API_BASE}/leave-requests`, {
        method: 'POST',
        headers,
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error?.error || 'Failed to create leave request');
      }

      toast({ title: 'Leave request submitted successfully' });
      setFormData({ leave_type: 'annual', start_date: '', end_date: '', reason: '' });
      setIsModalOpen(false);
      loadLeaveRequests();
    } catch (err) {
      console.error('Error creating leave request:', err);
      toast({ title: 'Error', description: String(err), variant: 'destructive' });
    }
  };

  const updateLeaveRequestStatus = async (requestId: string, status: string) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const email = user?.email || window.localStorage.getItem('userEmail');
      if (email) headers['x-user-email'] = email;

      const res = await fetch(`${API_BASE}/leave-requests/${requestId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status })
      });

      if (!res.ok) {
        throw new Error('Failed to update leave request status');
      }

      toast({ title: 'Leave request updated' });
      loadLeaveRequests();
    } catch (err) {
      console.error('Error updating leave request:', err);
      toast({ title: 'Error', description: String(err), variant: 'destructive' });
    }
  };

  const deleteLeaveRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to delete this leave request?')) {
      return;
    }

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const email = user?.email || window.localStorage.getItem('userEmail');
      if (email) headers['x-user-email'] = email;

      const res = await fetch(`${API_BASE}/leave-requests/${requestId}`, {
        method: 'DELETE',
        headers
      });

      if (!res.ok) {
        throw new Error('Failed to delete leave request');
      }

      toast({ title: 'Leave request deleted' });
      loadLeaveRequests();
    } catch (err) {
      console.error('Error deleting leave request:', err);
      toast({ title: 'Error', description: String(err), variant: 'destructive' });
    }
  };

  const getStatusBadgeColor = (status?: string) => {
    switch ((status || '').toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRequests = leaveRequests.filter(r => 
    filterStatus === 'all' || (r.status || '').toLowerCase() === filterStatus.toLowerCase()
  );

  if (loading) {
    return <div className="p-6">Loading leave requests...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Leave Requests</h2>
          <p className="text-gray-600">Manage employee leave requests</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>Request Leave</Button>
      </div>

      {/* Leave Balance Counter */}
      <LeaveBalanceCounter />

      <div className="flex gap-2">
        {['all', 'pending', 'approved', 'rejected'].map(status => (
          <Button
            key={status}
            variant={filterStatus === status ? 'default' : 'outline'}
            onClick={() => setFilterStatus(status)}
            className="capitalize"
          >
            {status}
          </Button>
        ))}
      </div>

      {isModalOpen && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold mb-4">Request Leave</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Leave Type *</label>
                <select
                  className="w-full p-2 border rounded mt-1"
                  value={formData.leave_type}
                  onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                >
                  <option value="annual">Annual</option>
                  <option value="sick">Sick Leave</option>
                  <option value="personal">Personal Leave</option>
                  <option value="maternity">Maternity Leave</option>
                  <option value="paternity">Paternity Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                </select>
              </div>
              <div />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Start Date *</label>
                <input
                  type="date"
                  className="w-full p-2 border rounded mt-1"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">End Date *</label>
                <input
                  type="date"
                  className="w-full p-2 border rounded mt-1"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Reason</label>
              <textarea
                className="w-full p-2 border rounded mt-1"
                rows={3}
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Enter reason for leave..."
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button onClick={createLeaveRequest}>Submit Request</Button>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <Card className="p-6 text-center text-gray-500">
            No leave requests found
          </Card>
        ) : (
          filteredRequests.map((request) => (
            <Card key={request.id || request.request_id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{request.employee_name || 'Unknown Employee'}</h3>
                  <p className="text-sm text-gray-600">{request.leave_type || 'Leave'}</p>
                </div>
                <Badge className={getStatusBadgeColor(request.status)}>
                  {request.status || 'Pending'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                <div>
                  <p className="text-gray-600">Start Date</p>
                  <p className="font-medium">{request.start_date ? new Date(request.start_date).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600">End Date</p>
                  <p className="font-medium">{request.end_date ? new Date(request.end_date).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Days Requested</p>
                  <p className="font-medium">{formatDays(request.days_requested)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Paid / Unpaid</p>
                  <p className={`font-medium text-sm ${request.is_fully_paid ? 'text-green-600' : 'text-orange-600'}`}>
                    {formatDays(request.days_paid, '0')} / {formatDays(request.days_unpaid, '0')}
                  </p>
                </div>
              </div>

              {request.reason && (
                <div className="mb-3">
                  <p className="text-sm text-gray-600">Reason:</p>
                  <p className="text-sm">{request.reason}</p>
                </div>
              )}

              {request.comments && (
                <div className="mb-3 p-2 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600">Comments:</p>
                  <p className="text-sm">{request.comments}</p>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                {isAdmin && (request.status || '').toLowerCase() === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => updateLeaveRequestStatus(request.id || request.request_id || '', 'approved')}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => updateLeaveRequestStatus(request.id || request.request_id || '', 'rejected')}
                    >
                      Reject
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-auto"
                  onClick={() => deleteLeaveRequest(request.id || request.request_id || '')}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
