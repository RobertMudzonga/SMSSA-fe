import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Calendar, Plus, Edit2, Trash2, Download } from 'lucide-react';
import { API_BASE } from '@/lib/api';

interface EmployeeVisa {
  visa_id: number;
  employee_name: string;
  employee_email: string;
  employee_phone: string;
  passport_number: string;
  visa_type_name: string;
  visa_expiry_date: string;
  position_title: string;
  department: string;
  status: string;
  days_until_expiry: number;
}

interface EmployeeVisasTrackerProps {
  token: string;
  corporateClientId?: number;
  onRefresh?: () => void;
}

export default function EmployeeVisasTracker({ token, corporateClientId, onRefresh }: EmployeeVisasTrackerProps) {
  const [visas, setVisas] = useState<EmployeeVisa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVisa, setEditingVisa] = useState<EmployeeVisa | null>(null);
  const [formData, setFormData] = useState<Partial<EmployeeVisa>>({
    status: 'active'
  });

  useEffect(() => {
    fetchVisas();
  }, [token, corporateClientId]);

  const fetchVisas = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (token) params.append('token', token);
      if (corporateClientId) params.append('corporate_client_id', String(corporateClientId));

      const response = await fetch(`${API_BASE}/api/employee-visas?${params}`);
      if (response.ok) {
        const data = await response.json();
        setVisas(data.visas || []);
      } else {
        setError('Failed to fetch visa records');
      }
    } catch (err) {
      console.error('Error fetching visas:', err);
      setError('Error loading visa records');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        token,
        corporate_client_id: corporateClientId
      };

      const method = editingVisa ? 'PATCH' : 'POST';
      const url = editingVisa 
        ? `${API_BASE}/api/employee-visas/${editingVisa.visa_id}`
        : `${API_BASE}/api/employee-visas`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setShowAddModal(false);
        setEditingVisa(null);
        setFormData({ status: 'active' });
        await fetchVisas();
        if (onRefresh) onRefresh();
      } else {
        alert('Failed to save visa record');
      }
    } catch (err) {
      console.error('Error saving visa:', err);
      alert('Error saving visa record');
    }
  };

  const handleDelete = async (visaId: number) => {
    if (!confirm('Are you sure you want to delete this visa record?')) return;

    try {
      const response = await fetch(`${API_BASE}/api/employee-visas/${visaId}?soft_delete=true`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchVisas();
        if (onRefresh) onRefresh();
      } else {
        alert('Failed to delete visa record');
      }
    } catch (err) {
      console.error('Error deleting visa:', err);
      alert('Error deleting visa record');
    }
  };

  const getAlertLevel = (daysUntilExpiry: number | null) => {
    if (!daysUntilExpiry) return 'info';
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 7) return 'critical';
    if (daysUntilExpiry <= 30) return 'warning';
    return 'ok';
  };

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'expired':
        return 'bg-red-50 border-red-200';
      case 'critical':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'ok':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Foreign Employee Visa Tracking</h3>
        <Button
          onClick={() => {
            setFormData({ status: 'active' });
            setEditingVisa(null);
            setShowAddModal(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {visas.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">
          <p>No foreign employees tracked yet. Click "Add Employee" to get started.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {visas.map((visa) => {
            const alertLevel = getAlertLevel(visa.days_until_expiry);
            const alertColor = getAlertColor(alertLevel);

            return (
              <Card key={visa.visa_id} className={`p-4 border-2 ${alertColor}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      {alertLevel === 'expired' && (
                        <AlertTriangle className="h-5 w-5 text-red-600 mt-1 flex-shrink-0" />
                      )}
                      {alertLevel === 'critical' && (
                        <AlertTriangle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                      )}
                      {alertLevel === 'warning' && (
                        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-1 flex-shrink-0" />
                      )}

                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{visa.employee_name}</h4>
                        <p className="text-sm text-gray-600">{visa.position_title} • {visa.department}</p>

                        <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Visa Type:</span>
                            <p className="font-medium">{visa.visa_type_name}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Passport:</span>
                            <p className="font-medium">{visa.passport_number}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Email:</span>
                            <p className="font-medium text-blue-600">{visa.employee_email}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Phone:</span>
                            <p className="font-medium">{visa.employee_phone}</p>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-600" />
                          <span className="text-sm">
                            Expiry: <strong>{new Date(visa.visa_expiry_date).toLocaleDateString()}</strong>
                          </span>
                          {visa.days_until_expiry !== null && (
                            <span className={`text-sm font-semibold ${
                              visa.days_until_expiry < 0 ? 'text-red-600' :
                              visa.days_until_expiry <= 7 ? 'text-red-600' :
                              visa.days_until_expiry <= 30 ? 'text-yellow-600' :
                              'text-green-600'
                            }`}>
                              ({visa.days_until_expiry < 0 ? 'EXPIRED' : `${visa.days_until_expiry} days`})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingVisa(visa);
                        setFormData(visa);
                        setShowAddModal(true);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(visa.visa_id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingVisa ? 'Edit Employee Visa' : 'Add Foreign Employee'}
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Employee Name *</label>
                    <input
                      type="text"
                      value={formData.employee_name || ''}
                      onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })}
                      className="w-full border rounded px-3 py-2 text-sm"
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.employee_email || ''}
                      onChange={(e) => setFormData({ ...formData, employee_email: e.target.value })}
                      className="w-full border rounded px-3 py-2 text-sm"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.employee_phone || ''}
                      onChange={(e) => setFormData({ ...formData, employee_phone: e.target.value })}
                      className="w-full border rounded px-3 py-2 text-sm"
                      placeholder="+27 123 456 7890"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Passport Number</label>
                    <input
                      type="text"
                      value={formData.passport_number || ''}
                      onChange={(e) => setFormData({ ...formData, passport_number: e.target.value })}
                      className="w-full border rounded px-3 py-2 text-sm"
                      placeholder="ZA123456789"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Position Title</label>
                    <input
                      type="text"
                      value={formData.position_title || ''}
                      onChange={(e) => setFormData({ ...formData, position_title: e.target.value })}
                      className="w-full border rounded px-3 py-2 text-sm"
                      placeholder="e.g., Senior Developer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Department</label>
                    <input
                      type="text"
                      value={formData.department || ''}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full border rounded px-3 py-2 text-sm"
                      placeholder="e.g., Engineering"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Visa Type</label>
                    <input
                      type="text"
                      value={formData.visa_type_name || ''}
                      onChange={(e) => setFormData({ ...formData, visa_type_name: e.target.value })}
                      className="w-full border rounded px-3 py-2 text-sm"
                      placeholder="e.g., Critical Skills Work Visa"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Visa Expiry Date *</label>
                    <input
                      type="date"
                      value={formData.visa_expiry_date?.split('T')[0] || ''}
                      onChange={(e) => setFormData({ ...formData, visa_expiry_date: e.target.value })}
                      className="w-full border rounded px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={formData.status || 'active'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="renewed">Renewed</option>
                    <option value="pending_renewal">Pending Renewal</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Renewal Notes</label>
                  <textarea
                    value={formData.renewal_notes || ''}
                    onChange={(e) => setFormData({ ...formData, renewal_notes: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="Add any notes about renewal or special conditions..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingVisa(null);
                    setFormData({ status: 'active' });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {editingVisa ? 'Update' : 'Add'} Employee
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
