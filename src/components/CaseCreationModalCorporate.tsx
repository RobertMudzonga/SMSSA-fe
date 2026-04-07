import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Loader2 } from 'lucide-react';
import { API_BASE } from '@/lib/api';

interface CaseCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  token: string;
  corporateClientId: number;
  companyName?: string;
}

const CASE_TYPES = [
  { value: 'overstay_appeal', label: 'Overstay Appeal' },
  { value: 'prohibited_persons', label: 'Prohibited Persons (V-list)' },
  { value: 'high_court_expedition', label: 'High Court Expedition' },
  { value: 'appeals_8_4', label: 'Section 8(4) Appeal' },
  { value: 'appeals_8_6', label: 'Section 8(6) Appeal' }
];

export default function CaseCreationModal({
  isOpen,
  onClose,
  onSuccess,
  token,
  corporateClientId,
  companyName
}: CaseCreationModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    case_type: 'overstay_appeal',
    case_title: '',
    client_name: '',
    client_email: '',
    client_phone: '',
    notes: '',
    priority: 'medium'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.case_title.trim() || !formData.client_name.trim()) {
      setError('Case Name and Client Name are required');
      return;
    }

    try {
      setLoading(true);

      // Create the case
      const casePayload = {
        ...formData,
        corporate_client_id: corporateClientId
      };

      const caseResponse = await fetch(`${API_BASE}/api/legal-cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(casePayload)
      });

      if (!caseResponse.ok) {
        const errorData = await caseResponse.json();
        throw new Error(errorData.error || 'Failed to create case');
      }

      const caseResult = await caseResponse.json();
      const caseId = caseResult.newCase?.case_id || caseResult.case_id;

      // Create associated project
      const projectPayload = {
        project_name: formData.case_title,
        client_name: formData.client_name,
        client_email: formData.client_email || '',
        case_type: formData.case_type,
        priority: formData.priority,
        corporate_client_id: corporateClientId,
        status: 'Active',
        description: formData.notes || `Project for case: ${formData.case_title}`
      };

      const projectResponse = await fetch(`${API_BASE}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectPayload)
      });

      if (!projectResponse.ok) {
        const errorData = await projectResponse.json();
        console.error('Failed to create associated project:', errorData);
        // Don't fail the whole operation if project creation fails - case was already created
      }
      
      // Reset form
      setFormData({
        case_type: 'overstay_appeal',
        case_title: '',
        client_name: '',
        client_email: '',
        client_phone: '',
        notes: '',
        priority: 'medium'
      });

      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Error creating case:', err);
      setError(err instanceof Error ? err.message : 'Failed to create case');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Open a New Case</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              disabled={loading}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-blue-700 text-sm">
            ℹ️ Creating a case will automatically create an associated project for tracking.
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company
              </label>
              <div className="bg-gray-50 px-3 py-2 rounded border text-gray-700 text-sm">
                {companyName || 'Corporate Client'}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Case Type *
                </label>
                <select
                  value={formData.case_type}
                  onChange={(e) => setFormData({ ...formData, case_type: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm"
                  disabled={loading}
                >
                  {CASE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm"
                  disabled={loading}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Case Name/Title *
              </label>
              <textarea
                value={formData.case_title}
                onChange={(e) => setFormData({ ...formData, case_title: e.target.value })}
                placeholder="Enter a descriptive case name (e.g., 'John Smith Overstay Appeal - DHA')"
                className="w-full border rounded px-3 py-2 text-sm"
                rows={2}
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Name *
                </label>
                <input
                  type="text"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  placeholder="Full name"
                  className="w-full border rounded px-3 py-2 text-sm"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Email
                </label>
                <input
                  type="email"
                  value={formData.client_email}
                  onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                  placeholder="client@example.com"
                  className="w-full border rounded px-3 py-2 text-sm"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client Phone
              </label>
              <input
                type="tel"
                value={formData.client_phone}
                onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                placeholder="+27 123 456 7890"
                className="w-full border rounded px-3 py-2 text-sm"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes / Service Required
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Describe what services are needed (e.g., Document review, Legal representation, Appeal preparation, etc.)"
                className="w-full border rounded px-3 py-2 text-sm"
                rows={3}
                disabled={loading}
              />
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Case'
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
