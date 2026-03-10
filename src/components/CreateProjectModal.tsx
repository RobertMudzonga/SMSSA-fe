import { useState, useEffect } from 'react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  clientId?: string;
  employees?: Array<{ id: number; full_name: string; work_email?: string }>;
}

export default function CreateProjectModal({ isOpen, onClose, onSubmit, clientId, employees = [] }: CreateProjectModalProps) {
  const [formData, setFormData] = useState({
    project_name: '',
    client_name: '',
    client_email: '',
    case_type: 'Work Visa',
    priority: 'medium',
    start_date: '',
    payment_amount: '',
    project_manager_id: '' as number | '',
    project_manager_id_2: '' as number | ''
  });

  function formatForDateInput(value: string | Date | null) {
    if (!value) return '';
    const d = (value instanceof Date) ? value : new Date(value);
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  useEffect(() => {
    // Only prefill when modal is open and a clientId is provided
    if (!isOpen || !clientId) return;

    (async () => {
      try {
        // Try prospects endpoint first (may return professional_fees and deposit_amount)
        let res = await fetch('/api/prospects');
        if (res.ok) {
          const prospects = await res.json();
          const match = prospects.find((p: any) => String(p.prospect_id || p.id || p.prospectId) === String(clientId) || String(p.lead_id) === String(clientId));
          if (match) {
            const professionalFees = parseFloat(match.professional_fees || match.professionalFees || 0) || 0;
            const deposit = parseFloat(match.deposit_amount || match.depositAmount || 0) || 0;
            const remaining = Math.max(0, professionalFees - deposit);
            setFormData(fd => ({ ...fd, client_name: match.name || `${match.first_name || ''} ${match.last_name || ''}`.trim(), client_email: match.email || '', payment_amount: remaining ? String(remaining) : fd.payment_amount, start_date: fd.start_date || new Date().toISOString().split('T')[0] }));
            return;
          }
        }

        // Fall back to leads endpoint
        res = await fetch(`/api/leads`);
        if (res.ok) {
          const leads = await res.json();
          const matchLead = leads.find((l: any) => String(l.lead_id || l.id) === String(clientId));
          if (matchLead) {
            setFormData(fd => ({ ...fd, client_name: `${matchLead.first_name || ''} ${matchLead.last_name || ''}`.trim(), client_email: matchLead.email || '', start_date: fd.start_date || new Date().toISOString().split('T')[0] }));
          }
        }
      } catch (err) {
        // ignore prefill errors
        console.warn('Prefill project modal failed:', err);
      }
    })();
  }, [clientId, isOpen]);

  // Keep hooks stable; only conditionally render after hooks are declared.
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, client_id: clientId, project_manager_id: formData.project_manager_id || null, project_manager_id_2: formData.project_manager_id_2 || null });
    setFormData({ project_name: '', client_name: '', client_email: '', case_type: 'Work Visa', priority: 'medium', start_date: '', payment_amount: '', project_manager_id: '', project_manager_id_2: '' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Create New Project</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Project Name"
            value={formData.project_name}
            onChange={(e) => setFormData({...formData, project_name: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
          <input
            type="text"
            placeholder="Client Name"
            value={formData.client_name}
            onChange={(e) => setFormData({...formData, client_name: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
          <input
            type="email"
            placeholder="Client Email"
            value={formData.client_email}
            onChange={(e) => setFormData({...formData, client_email: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
          <input
            type="date"
            placeholder="Start Date"
            value={formatForDateInput(formData.start_date)}
            onChange={(e) => setFormData({...formData, start_date: e.target.value ? formatForDateInput(e.target.value) : ''})}
            className="w-full px-3 py-2 border rounded-lg"
          />
          <input
            type="number"
            placeholder="Payment Amount"
            value={formData.payment_amount}
            onChange={(e) => setFormData({...formData, payment_amount: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
          />

          <select
            value={formData.project_manager_id}
            onChange={(e) => setFormData({ ...formData, project_manager_id: e.target.value ? Number(e.target.value) : '' })}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="">Select Project Manager 1 (optional)</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.full_name} {emp.work_email ? `- ${emp.work_email}` : ''}
              </option>
            ))}
          </select>

          <select
            value={formData.project_manager_id_2}
            onChange={(e) => setFormData({ ...formData, project_manager_id_2: e.target.value ? Number(e.target.value) : '' })}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="">Select Project Manager 2 (optional)</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.full_name} {emp.work_email ? `- ${emp.work_email}` : ''}
              </option>
            ))}
          </select>

          <select
            value={formData.case_type}
            onChange={(e) => setFormData({...formData, case_type: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option>Visitors Visa 11(1)</option>
            <option>Visitors Visa Extension</option>
            <option>Critical Skills Work Visa</option>
            <option>Critical Skills Visa - Zim Submission</option>
            <option>Accompanying Dependent (Spouse)</option>
            <option>Spouse Visa</option>
            <option>General Work Visa</option>
            <option>Waiver Application</option>
            <option>Visitor's Visa Section 11(1)</option>
            <option>Visitor's Visa Section 11(1)(b)(ii)</option>
            <option>Visitor's Visa Section 11(1)(b)(iii)</option>
            <option>Visitor's Visa Section 11(1)(b)(iv)</option>
            <option>Visitor's Visa Section 11(2)</option>
            <option>Relatives Visa</option>
            <option>Study Visa</option>
            <option>Retired Person Visa</option>
            <option>Business Visa</option>
            <option>Appeal i.t.o. section 8(4) & 8(6)</option>
            <option>Permanent Residence Permit</option>
            <option>Overstay Appeal</option>
            <option>Legalisation (Good Cause)</option>
            <option>Prohibition Upliftment</option>
            <option>Proof of Permanent Residence</option>
            <option>Citizenship</option>

          </select>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({...formData, priority: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}
