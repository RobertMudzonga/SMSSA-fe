import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Plus, Clock, AlertCircle, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AddPaymentRequestModal from './AddPaymentRequestModal';
import { useAuth } from '@/contexts/AuthContext';

interface PaymentRequest {
  payment_request_id: number;
  requested_by: number;
  requester_name: string;
  amount: string;
  description: string;
  due_date: string;
  is_urgent: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  approved_by?: number;
  approved_by_name?: string;
  approved_at?: string;
  paid_by?: number;
  paid_by_name?: string;
  paid_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

interface PaymentRequestsViewProps {
  paymentRequests: PaymentRequest[];
  onAddPaymentRequest: (data: any) => void;
  onApprove: (id: number) => void;
  onReject: (id: number, reason: string) => void;
  onMarkPaid: (id: number) => void;
  onDelete: (id: number) => void;
}

export default function PaymentRequestsView({
  paymentRequests,
  onAddPaymentRequest,
  onApprove,
  onReject,
  onMarkPaid,
  onDelete,
}: PaymentRequestsViewProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRequester, setFilterRequester] = useState<string>('all');
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();

  // Get unique requesters for the filter dropdown
  const uniqueRequesters = Array.from(
    new Map(
      paymentRequests.map(pr => [pr.requester_name, pr.requested_by])
    ).entries()
  ).map(([name, id]) => ({ name, id })).sort((a, b) => a.name.localeCompare(b.name));

  const filteredRequests = paymentRequests.filter(pr => {
    const statusMatch = filterStatus === 'all' || pr.status === filterStatus;
    const requesterMatch = filterRequester === 'all' || pr.requester_name === filterRequester;
    return statusMatch && requesterMatch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge className="bg-blue-100 text-blue-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'paid':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Paid</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatCurrency = (amount: string) => {
    return `R${parseFloat(amount).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleReject = (id: number) => {
    if (!rejectionReason.trim()) {
      toast({ title: 'Rejection reason required', variant: 'destructive' });
      return;
    }
    onReject(id, rejectionReason);
    setRejectingId(null);
    setRejectionReason('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Payment Requests</h2>
        <div className="flex items-center gap-3">
          <select
            value={filterRequester}
            onChange={(e) => setFilterRequester(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Requesters</option>
            {uniqueRequesters.map(requester => (
              <option key={requester.id} value={requester.name}>
                {requester.name}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
            <option value="rejected">Rejected</option>
          </select>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {paymentRequests.filter(pr => pr.status === 'pending').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-blue-600">
                {paymentRequests.filter(pr => pr.status === 'approved').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Paid</p>
              <p className="text-2xl font-bold text-green-600">
                {paymentRequests.filter(pr => pr.status === 'paid').length}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(
                  paymentRequests
                    .filter(pr => pr.status === 'pending' || pr.status === 'approved')
                    .reduce((sum, pr) => sum + parseFloat(pr.amount), 0)
                    .toString()
                )}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Payment Requests Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested By</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No payment requests found
                </td>
              </tr>
            ) : (
              filteredRequests.map((pr) => (
                <tr key={pr.payment_request_id} className={pr.is_urgent ? 'bg-red-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(pr.status)}
                      {pr.is_urgent && <AlertCircle className="w-4 h-4 text-red-600" />}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold">
                    {formatCurrency(pr.amount)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <p className="text-sm text-gray-900">{pr.description}</p>
                      {pr.rejection_reason && (
                        <p className="text-xs text-red-600 mt-1">Reason: {pr.rejection_reason}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pr.requester_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(pr.due_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      {isAdmin && pr.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => onApprove(pr.payment_request_id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setRejectingId(pr.payment_request_id)}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {isAdmin && pr.status === 'approved' && (
                        <Button
                          size="sm"
                          onClick={() => onMarkPaid(pr.payment_request_id)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Mark Paid
                        </Button>
                      )}
                      {(pr.status === 'pending' || isAdmin) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onDelete(pr.payment_request_id)}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Rejection Modal */}
      {rejectingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Reject Payment Request</h3>
            <textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
              rows={4}
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setRejectingId(null);
                  setRejectionReason('');
                }}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => handleReject(rejectingId)}>
                Reject
              </Button>
            </div>
          </div>
        </div>
      )}

      <AddPaymentRequestModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={onAddPaymentRequest}
      />
    </div>
  );
}
