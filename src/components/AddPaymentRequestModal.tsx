import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Employee {
  id: number;
  full_name: string;
  work_email: string;
}

interface AddPaymentRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void> | void;
}

export default function AddPaymentRequestModal({ isOpen, onClose, onSubmit }: AddPaymentRequestModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [formData, setFormData] = useState({
    requester_id: '',
    amount: '',
    description: '',
    due_date: '',
    is_urgent: false,
  });

  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
    }
  }, [isOpen]);

  const fetchEmployees = async () => {
    setIsLoadingEmployees(true);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';
      const response = await fetch(`${API_BASE}/api/employees`);
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({ title: 'Failed to load employees', variant: 'destructive' });
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!formData.requester_id || !formData.amount || !formData.description || !formData.due_date) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedEmployee = employees.find(e => e.id === parseInt(formData.requester_id));
      await Promise.resolve(onSubmit({
        ...formData,
        requester_id: parseInt(formData.requester_id),
        requested_by: user?.user_id || null,
      }));
      setFormData({ requester_id: '', amount: '', description: '', due_date: '', is_urgent: false });
      onClose();
    } catch (error: any) {
      console.error('Error adding payment request:', error);
      toast({ title: 'Failed to add payment request', description: error?.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">New Payment Request</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Requester *</label>
            <select
              required
              value={formData.requester_id}
              onChange={(e) => setFormData({ ...formData, requester_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              disabled={isLoadingEmployees}
            >
              <option value="">Select an employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name} ({emp.work_email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (R) *</label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={4}
              placeholder="What is this payment for?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
            <input
              type="date"
              required
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_urgent"
              checked={formData.is_urgent}
              onChange={(e) => setFormData({ ...formData, is_urgent: e.target.checked })}
              className="w-4 h-4 text-red-600 border-gray-300 rounded"
            />
            <label htmlFor="is_urgent" className="text-sm font-medium text-gray-700">
              Mark as urgent
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
