import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { API_BASE } from '@/lib/api';

interface Project {
  project_id: number;
  project_name: string;
  client_name: string;
  client_email: string;
  visa_type_id: number | null;
  case_type: string;
  priority: string;
  status: string;
  assigned_user_id: number | null;
  project_manager_id: number | null;
  payment_amount: number | null;
  start_date: string | null;
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

interface VisaType {
  visa_type_id: number;
  name: string;
  description: string;
}

const CASE_TYPES = ['work_permit', 'business_visa', 'temporary_residence', 'relative_sponsorship', 'study_permit'];
const PROJECT_STATUSES = ['active', 'pending_approval', 'completed', 'on_hold', 'rejected'];
const PRIORITIES = [
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' }
];

export default function ProjectFormModal({
  isOpen,
  onClose,
  project: projectData,
  corporateClient
}: {
  isOpen: boolean;
  onClose: () => void;
  project?: Project | null;
  corporateClient: CorporateClient;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [visaTypes, setVisaTypes] = useState<VisaType[]>([]);

  const [formData, setFormData] = useState({
    project_name: '',
    client_name: '',
    client_email: '',
    visa_type_id: '',
    case_type: '',
    priority: 'medium',
    status: 'active',
    assigned_user_id: '',
    project_manager_id: '',
    payment_amount: '',
    start_date: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const token = localStorage.getItem('token');

  // Fetch employees and visa types
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [empRes, visaRes] = await Promise.all([
          fetch(`${API_BASE}/api/employees`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }),
          fetch(`${API_BASE}/api/visa-types`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        ]);

        if (empRes.ok) {
          const empData = await empRes.json();
          setEmployees(empData || []);
        }

        if (visaRes.ok) {
          const visaData = await visaRes.json();
          setVisaTypes(visaData?.visa_types || visaData || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen, token]);

  // Populate form when editing project
  useEffect(() => {
    if (projectData) {
      setFormData({
        project_name: projectData.project_name || '',
        client_name: projectData.client_name || '',
        client_email: projectData.client_email || '',
        visa_type_id: projectData.visa_type_id?.toString() || '',
        case_type: projectData.case_type || '',
        priority: projectData.priority || 'medium',
        status: projectData.status || 'active',
        assigned_user_id: projectData.assigned_user_id?.toString() || '',
        project_manager_id: projectData.project_manager_id?.toString() || '',
        payment_amount: projectData.payment_amount?.toString() || '',
        start_date: projectData.start_date ? projectData.start_date.split('T')[0] : '',
        notes: ''
      });
    } else {
      setFormData({
        project_name: '',
        client_name: '',
        client_email: '',
        visa_type_id: '',
        case_type: '',
        priority: 'medium',
        status: 'active',
        assigned_user_id: '',
        project_manager_id: '',
        payment_amount: '',
        start_date: '',
        notes: ''
      });
    }
    setErrors({});
  }, [projectData, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.project_name.trim()) {
      newErrors.project_name = 'Project name is required';
    }

    if (!formData.client_name.trim()) {
      newErrors.client_name = 'Client name is required';
    }

    if (!formData.client_email.trim()) {
      newErrors.client_email = 'Client email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.client_email)) {
      newErrors.client_email = 'Invalid email format';
    }

    if (!formData.case_type.trim()) {
      newErrors.case_type = 'Visa type is required';
    }

    if (formData.payment_amount && isNaN(parseFloat(formData.payment_amount))) {
      newErrors.payment_amount = 'Payment amount must be a valid number';
    }

    if (formData.start_date && new Date(formData.start_date) > new Date()) {
      newErrors.start_date = 'Start date cannot be in the future';
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

      const url = projectData
        ? `${API_BASE}/api/projects/${projectData.project_id}`
        : `${API_BASE}/api/projects`;

      const method = projectData ? 'PATCH' : 'POST';

      const payload = {
        project_name: formData.project_name,
        client_name: formData.client_name,
        client_email: formData.client_email,
        visa_type_id: formData.visa_type_id ? parseInt(formData.visa_type_id) : null,
        case_type: formData.case_type,
        priority: formData.priority,
        status: formData.status,
        assigned_user_id: formData.assigned_user_id ? parseInt(formData.assigned_user_id) : null,
        project_manager_id: formData.project_manager_id ? parseInt(formData.project_manager_id) : null,
        payment_amount: formData.payment_amount ? parseFloat(formData.payment_amount) : null,
        start_date: formData.start_date || null,
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
        throw new Error(error.message || 'Failed to save project');
      }

      toast({
        title: 'Success',
        description: projectData
          ? 'Project updated successfully.'
          : 'Project created successfully.'
      });

      onClose();
    } catch (error) {
      console.error('Error saving project:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save project. Please try again.',
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
            {projectData ? 'Edit Project' : 'Add New Project'}
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

          {/* Project Name & Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name *
              </label>
              <Input
                value={formData.project_name}
                onChange={(e) =>
                  setFormData({ ...formData, project_name: e.target.value })
                }
                placeholder="e.g., Work Permit Application"
                className={errors.project_name ? 'border-red-500' : ''}
              />
              {errors.project_name && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.project_name}
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

          {/* Client Name & Visa Type */}
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
                Visa Type *
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
                <option value="">Select visa type...</option>
                {CASE_TYPES.map(type => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, ' ').toUpperCase()}
                  </option>
                ))}
              </select>
              {errors.case_type && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.case_type}
                </p>
              )}
            </div>
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                {PROJECT_STATUSES.map(status => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, ' ').toUpperCase()}
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

          {/* Assignment & Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Manager
              </label>
              <select
                value={formData.project_manager_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    project_manager_id: e.target.value
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="">Select a project manager...</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id.toString()}>
                    {emp.full_name} ({emp.department})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) =>
                  setFormData({ ...formData, start_date: e.target.value })
                }
                className={errors.start_date ? 'border-red-500' : ''}
              />
              {errors.start_date && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.start_date}
                </p>
              )}
            </div>
          </div>

          {/* Payment Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Amount
            </label>
            <Input
              type="number"
              step="0.01"
              value={formData.payment_amount}
              onChange={(e) =>
                setFormData({ ...formData, payment_amount: e.target.value })
              }
              placeholder="0.00"
              className={errors.payment_amount ? 'border-red-500' : ''}
            />
            {errors.payment_amount && (
              <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {errors.payment_amount}
              </p>
            )}
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
                  {projectData ? 'Update Project' : 'Create Project'}
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
