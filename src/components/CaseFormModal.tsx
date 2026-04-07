import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { API_BASE } from '@/lib/api';

interface Case {
  case_id: number;
  case_reference: string;
  case_type: string;
  case_title: string;
  case_status: string;
  client_name: string;
  client_email: string;
  assigned_case_manager_id: number | null;
  priority: string;
  current_step: number;
  next_deadline: string | null;
  step_history: Array<any>;
  workflow_data: Record<string, any>;
}

interface CorporateClient {
  id: number;
  name: string;
}

interface Employee {
  id: number;
  full_name: string;
  email: string;
  department: string;
}

const CASE_TYPES = [
  { value: 'overstay_appeal', label: 'Overstay Appeal' },
  { value: 'prohibited_persons', label: 'Prohibited Persons (V-list)' },
  { value: 'high_court_expedition', label: 'High Court Expedition' },
  { value: 'appeals_8_4', label: 'Section 8(4) Appeal' },
  { value: 'appeals_8_6', label: 'Section 8(6) Appeal' }
];

const CASE_STATUSES = [
  'active',
  'closed',
  'lost',
  'settled',
  'appealing',
  'on_hold'
];

const PRIORITIES = [
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' }
];

export default function CaseFormModal({
  isOpen,
  onClose,
  case: caseData,
  corporateClient
}: {
  isOpen: boolean;
  onClose: () => void;
  case: Case | null;
  corporateClient: CorporateClient;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    case_type: '',
    case_title: '',
    case_status: 'active',
    client_name: '',
    client_email: '',
    assigned_case_manager_id: '',
    priority: 'medium',
    next_deadline: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const token = localStorage.getItem('token');

  // Fetch employees for assignment
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/api/employees`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) throw new Error('Failed to fetch employees');

        const data = await response.json();
        setEmployees(data || []);
      } catch (error) {
        console.error('Error fetching employees:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchEmployees();
    }
  }, [isOpen, token]);

  // Populate form when editing case
  useEffect(() => {
    if (caseData) {
      setFormData({
        case_type: caseData.case_type,
        case_title: caseData.case_title,
        case_status: caseData.case_status,
        client_name: caseData.client_name,
        client_email: caseData.client_email,
        assigned_case_manager_id: caseData.assigned_case_manager_id?.toString() || '',
        priority: caseData.priority,
        next_deadline: caseData.next_deadline ? caseData.next_deadline.split('T')[0] : '',
        notes: ''
      });
    } else {
      setFormData({
        case_type: '',
        case_title: '',
        case_status: 'active',
        client_name: '',
        client_email: '',
        assigned_case_manager_id: '',
        priority: 'medium',
        next_deadline: '',
        notes: ''
      });
    }
    setErrors({});
  }, [caseData, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.case_type.trim()) {
      newErrors.case_type = 'Case type is required';
    }

    if (!formData.case_title.trim()) {
      newErrors.case_title = 'Case title is required';
    }

    if (!formData.client_name.trim()) {
      newErrors.client_name = 'Client name is required';
    }

    if (!formData.client_email.trim()) {
      newErrors.client_email = 'Client email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.client_email)) {
      newErrors.client_email = 'Invalid email format';
    }

    if (formData.next_deadline && new Date(formData.next_deadline) < new Date()) {
      newErrors.next_deadline = 'Deadline cannot be in the past';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors below.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSubmitting(true);

      const url = caseData
        ? `${API_BASE}/api/legal-cases/${caseData.case_id}`
        : `${API_BASE}/api/legal-cases`;

      const method = caseData ? 'PATCH' : 'POST';

      const payload = {
        case_type: formData.case_type,
        case_title: formData.case_title,
        case_status: formData.case_status,
        client_name: formData.client_name,
        client_email: formData.client_email,
        assigned_case_manager_id: formData.assigned_case_manager_id
          ? parseInt(formData.assigned_case_manager_id)
          : null,
        priority: formData.priority,
        next_deadline: formData.next_deadline || null,
        corporate_client_id: corporateClient.id
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save case');
      }

      toast({
        title: 'Success',
        description: caseData
          ? 'Case updated successfully.'
          : 'Case created successfully.'
      });

      onClose();
    } catch (error) {
      console.error('Error saving case:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save case. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b bg-white">
          <h2 className="text-2xl font-bold text-gray-900">
            {caseData ? 'Edit Case' : 'Add New Case'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Corporate Client Info */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Corporate Client:</span> {corporateClient.name}
            </p>
          </div>

          {/* Case Type & Title */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Case Type *
              </label>
              <select
                value={formData.case_type}
                onChange={(e) =>
                  setFormData({ ...formData, case_type: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                  errors.case_type ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select case type...</option>
                {CASE_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.case_type && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.case_type}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Case Title *
              </label>
              <Input
                value={formData.case_title}
                onChange={(e) =>
                  setFormData({ ...formData, case_title: e.target.value })
                }
                placeholder="e.g., Overstay Appeal - XYZ Application"
                className={errors.case_title ? 'border-red-500' : ''}
              />
              {errors.case_title && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.case_title}
                </p>
              )}
            </div>
          </div>

          {/* Client Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Name *
              </label>
              <Input
                value={formData.client_name}
                onChange={(e) =>
                  setFormData({ ...formData, client_name: e.target.value })
                }
                placeholder="Full name of the client"
                className={errors.client_name ? 'border-red-500' : ''}
              />
              {errors.client_name && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.client_name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Email *
              </label>
              <Input
                type="email"
                value={formData.client_email}
                onChange={(e) =>
                  setFormData({ ...formData, client_email: e.target.value })
                }
                placeholder="Email address"
                className={errors.client_email ? 'border-red-500' : ''}
              />
              {errors.client_email && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.client_email}
                </p>
              )}
            </div>
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Case Status
              </label>
              <select
                value={formData.case_status}
                onChange={(e) =>
                  setFormData({ ...formData, case_status: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                {CASE_STATUSES.map(status => (
                  <option key={status} value={status}>
                    {status.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                {PRIORITIES.map(p => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Assignment & Deadline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign Case Manager
              </label>
              <select
                value={formData.assigned_case_manager_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    assigned_case_manager_id: e.target.value
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="">Select a case manager...</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id.toString()}>
                    {emp.full_name} ({emp.department})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Next Deadline
              </label>
              <Input
                type="date"
                value={formData.next_deadline}
                onChange={(e) =>
                  setFormData({ ...formData, next_deadline: e.target.value })
                }
                className={errors.next_deadline ? 'border-red-500' : ''}
              />
              {errors.next_deadline && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.next_deadline}
                </p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Initial Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Add any initial notes or context about this case..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1 gap-2 bg-teal-600 hover:bg-teal-700"
            >
              {submitting ? (
                <>Loading...</>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  {caseData ? 'Update Case' : 'Create Case'}
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
