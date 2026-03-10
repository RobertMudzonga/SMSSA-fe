import React, { useState } from 'react';
import { formatForDateInput } from '@/utils/formatDate';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { X, Calendar, Tag, Clock, User, MessageSquare } from 'lucide-react';
import { API_BASE } from '@/lib/api';

// Note entry interface
interface NoteEntry {
  timestamp: string;
  user_id: number | null;
  user_name: string;
  content: string;
  type?: 'user' | 'system';
}

// Parse notes string into structured entries
function parseNotes(notesString: string | null | undefined): NoteEntry[] {
  if (!notesString) return [];
  
  const entries: NoteEntry[] = [];
  const parts = notesString.split('---NOTE_ENTRY---');
  
  // First part might be legacy plain text notes
  if (parts[0] && parts[0].trim()) {
    // Parse old-style notes with [timestamp] format
    const legacyLines = parts[0].split('\n').filter(line => line.trim());
    for (const line of legacyLines) {
      const match = line.match(/^\[(\d{4}-\d{2}-\d{2}T[\d:\.Z]+|\d+\/\d+\/\d+,?\s*[\d:]+\s*(AM|PM)?)\]\s*(.+)$/i);
      if (match) {
        entries.push({
          timestamp: match[1],
          user_id: null,
          user_name: 'Unknown',
          content: match[3],
          type: match[3].includes('MARKED AS LOST') || match[3].includes('RECOVERED') ? 'system' : 'user'
        });
      } else if (line.trim()) {
        // Plain text without timestamp
        entries.push({
          timestamp: '',
          user_id: null,
          user_name: 'Unknown',
          content: line.trim(),
          type: 'user'
        });
      }
    }
  }
  
  // Parse structured note entries
  for (let i = 1; i < parts.length; i++) {
    try {
      const entry = JSON.parse(parts[i]);
      entries.push(entry);
    } catch (e) {
      // If parsing fails, treat as plain text
      if (parts[i].trim()) {
        entries.push({
          timestamp: new Date().toISOString(),
          user_id: null,
          user_name: 'Unknown',
          content: parts[i].trim(),
          type: 'user'
        });
      }
    }
  }
  
  return entries;
}

// Format timestamp for display
function formatTimestamp(timestamp: string): string {
  if (!timestamp) return '';
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return timestamp;
  }
}

interface Prospect {
  id: string | number;
  name?: string;
  first_name?: string;
  last_name?: string;
  deal_name?: string;
  email?: string;
  phone?: string;
  lead_source?: string;
  source?: string;
  assigned_to?: number | string;
  quote_sent_date?: string;
  quote_amount?: number | string;
  professional_fees?: number | string;
  deposit_amount?: number | string;
  expected_closing_date?: string;
  expected_payment_date?: string;
  forecast_amount?: number | string;
  forecast_probability?: number;
  notes?: string;
}

interface ProspectUpdate {
  deal_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  source?: string;
  assigned_to?: number | string;
  professional_fees?: number | string | null;
  deposit_amount?: number | string | null;
  expected_closing_date?: string | null;
  expected_payment_date?: string | null;
  forecast_amount?: number | null;
  forecast_probability?: number;
  notes?: string;
  quote_amount?: number | null;
  quote_sent_date?: string | null;
}

interface Employee {
  id: number | string;
  full_name: string;
  work_email?: string;
}

interface ProspectTag {
  tag_id: number;
  name: string;
}

interface ProspectDetailModalProps {
  prospect: Prospect;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, data: ProspectUpdate) => Promise<boolean>;
  onDelete?: (id: string) => Promise<void> | void;
  onMarkLost?: (id: string, reason?: string) => void;
  onSetTags?: (id: string, tagIds: number[]) => void;
}

export default function ProspectDetailModal({ 
  prospect, 
  isOpen, 
  onClose, 
  onUpdate,
  onDelete,
  onMarkLost,
  onSetTags
}: ProspectDetailModalProps) {
  const { user } = useAuth();
  const [notes, setNotes] = useState('');
  const [newComment, setNewComment] = useState('');
  const [contactName, setContactName] = useState(prospect?.name || '');
  const [dealName, setDealName] = useState(prospect?.deal_name || '');
  const [email, setEmail] = useState(prospect?.email || '');
  const [phone, setPhone] = useState(prospect?.phone || '');
  const [source, setSource] = useState(prospect?.lead_source || prospect?.source || '');
  const [salesperson, setSalesperson] = useState(prospect?.assigned_to || '');
  const [employeesList, setEmployeesList] = useState<Employee[]>([]);
  const [employeesError, setEmployeesError] = useState<string | null>(null);
  const [quoteDate, setQuoteDate] = useState(formatForDateInput(prospect?.quote_sent_date || ''));
  const [dealValue, setDealValue] = useState(prospect?.quote_amount || '');
  const [professionalFees, setProfessionalFees] = useState(prospect?.professional_fees || '');
  const [depositAmount, setDepositAmount] = useState(prospect?.deposit_amount || '');
  const [expectedClosingDate, setExpectedClosingDate] = useState(formatForDateInput(prospect?.expected_closing_date || ''));
  const [expectedPaymentDate, setExpectedPaymentDate] = useState(formatForDateInput(prospect?.expected_payment_date || ''));
  const [forecastAmount, setForecastAmount] = useState(prospect?.forecast_amount || '');
  const [forecastProbability, setForecastProbability] = useState(prospect?.forecast_probability || 50);
  const [availableTags, setAvailableTags] = useState<ProspectTag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const { toast } = useToast();

  // initialize fields when prospect changes
  React.useEffect(() => {
    if (!prospect) return;
    setContactName(prospect?.name || `${prospect?.first_name || ''} ${prospect?.last_name || ''}`.trim());
    setDealName(prospect?.deal_name || '');
    setEmail(prospect?.email || '');
    setPhone(prospect?.phone || '');
    setSource(prospect?.lead_source || prospect?.source || '');
    setSalesperson(prospect?.assigned_to || '');
    setQuoteDate(formatForDateInput(prospect?.quote_sent_date || ''));
    setDealValue(prospect?.quote_amount || '');
    setProfessionalFees(prospect?.professional_fees || '');
    setDepositAmount(prospect?.deposit_amount || '');
    setExpectedClosingDate(formatForDateInput(prospect?.expected_closing_date || ''));
    setExpectedPaymentDate(formatForDateInput(prospect?.expected_payment_date || ''));
    setForecastAmount(prospect?.forecast_amount || '');
    setForecastProbability(prospect?.forecast_probability || 50);
    setNotes(prospect?.notes || '');
    // fetch available tags and selected tags
    (async () => {
      try {
        const tagsResp = await fetch('/api/prospects/tags');
        if (tagsResp.ok) {
          const tagsJson = await tagsResp.json();
          setAvailableTags(tagsJson || []);
        }
        const currentTagsResp = await fetch(`/api/prospects/${prospect.id}/tags`);
        if (currentTagsResp.ok) {
          const cur = await currentTagsResp.json();
          setSelectedTagIds((cur as ProspectTag[]).map(t => t.tag_id));
        }

        // fetch employees for salesperson dropdown
        try {
          const empResp = await fetch('/api/employees');
          if (empResp.ok) {
            const emps = await empResp.json();
            setEmployeesList(emps || []);
            setEmployeesError(null);
          } else {
            const text = await empResp.text().catch(() => 'Failed to fetch employees');
            const msg = `Employees API returned ${empResp.status}: ${text}`;
            console.error(msg);
            setEmployeesError(msg);
            setEmployeesList([]);
          }
        } catch (err) {
          console.error('Error fetching employees for salesperson list:', err);
          setEmployeesError(String(err));
          setEmployeesList([]);
        }

            // No folder/document tasks here; documents are managed in DocumentsView
      } catch (err) {
        console.error('Error fetching tags:', err);
      }
    })();
  }, [prospect]);

  const handleSaveDetails = () => {
    (async () => {
      const [first_name, ...rest] = (contactName || '').trim().split(' ');
      const last_name = rest.join(' ');
      try {
        const success = await onUpdate(String(prospect.id), {
          deal_name: dealName,
          first_name,
          last_name,
          email,
          phone,
          source,
          assigned_to: salesperson,
          professional_fees: professionalFees || null,
          deposit_amount: depositAmount || null,
          expected_closing_date: expectedClosingDate || null,
          expected_payment_date: expectedPaymentDate || null,
          forecast_amount: forecastAmount ? Number(forecastAmount) : null,
          forecast_probability: Number(forecastProbability) || 50,
          notes,
          quote_amount: dealValue ? Number(dealValue) : null,
          quote_sent_date: quoteDate || null
        });
        if (success) {
          toast({ title: 'Details saved' });
        }
      } catch (err) {
        console.error('Error saving details:', err);
        toast({ title: 'Failed to save details', variant: 'destructive' });
      }
    })();
  };

  const handleSetTags = () => {
    if (onSetTags) onSetTags(String(prospect.id), selectedTagIds);
  };

  const handleMarkLost = () => {
    if (onMarkLost) onMarkLost(String(prospect.id), 'Marked lost from UI');
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const response = await fetch(`${API_BASE}/prospects/${prospect.id}/comment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: newComment,
          user_id: user?.id || null,
          user_name: user?.full_name || user?.email || 'Unknown User'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      const updatedProspect = await response.json();
      setNotes(updatedProspect.notes || '');
      setNewComment('');
      toast({ title: 'Comment added successfully' });
    } catch (err) {
      console.error('Error adding comment:', err);
      toast({ title: 'Failed to add comment', variant: 'destructive' });
    }
  };

  const handleDelete = () => {
    if (onDelete) setConfirmOpen(true);
  };

  const [confirmOpen, setConfirmOpen] = useState(false);

  // Documents are handled in DocumentsView; remove folder/file UI from prospect modal

  if (!isOpen || !prospect) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-none md:rounded-lg w-full h-full md:w-auto md:max-w-2xl md:max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{prospect.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Details */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deal Name</label>
                  <input value={dealName} onChange={e => setDealName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                  <input value={contactName} onChange={e => setContactName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                <input value={source} onChange={e => setSource(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Salesperson</label>
                  {employeesError && (
                    <div className="mb-2 p-2 bg-red-50 border border-red-200 text-red-800 rounded flex items-center justify-between">
                      <div className="text-sm">Unable to load employees: {employeesError}</div>
                      <button onClick={async () => {
                        setEmployeesError(null);
                        try {
                          const r = await fetch('/api/employees');
                          if (r.ok) {
                            setEmployeesList(await r.json());
                            setEmployeesError(null);
                          } else {
                            const t = await r.text().catch(() => 'Failed');
                            setEmployeesError(`Status ${r.status}: ${t}`);
                          }
                        } catch (err) {
                          setEmployeesError(String(err));
                        }
                      }} className="ml-4 px-2 py-1 bg-white border rounded text-sm">Retry</button>
                    </div>
                  )}
                  <select value={String(salesperson || '')} onChange={e => setSalesperson(e.target.value ? Number(e.target.value) : '')} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="">Unassigned</option>
                  {employeesList.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.full_name} {emp.work_email ? `• ${emp.work_email}` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quote Sent Date</label>
                <input type="date" value={quoteDate} onChange={e => setQuoteDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deal Value</label>
                <input type="number" value={dealValue} onChange={e => setDealValue(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Professional Fees</label>
                <input type="number" value={professionalFees} onChange={e => setProfessionalFees(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deposit Amount</label>
                <input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Closing Date</label>
                <input type="date" value={expectedClosingDate} onChange={e => setExpectedClosingDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Payment Date</label>
                <input type="date" value={expectedPaymentDate} onChange={e => setExpectedPaymentDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Forecast Amount (R)</label>
                <input type="number" step="0.01" value={forecastAmount} onChange={e => setForecastAmount(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Win Probability (%)</label>
                <div className="flex items-center gap-2">
                  <input type="range" min="0" max="100" value={forecastProbability} onChange={e => setForecastProbability(Number(e.target.value))} className="flex-1" />
                  <span className="text-sm font-semibold text-gray-700 w-12 text-right">{forecastProbability}%</span>
                </div>
              </div>
            </div>
              {/* Documents moved to DocumentsView */}
            <div className="mt-4 flex gap-2">
              <button onClick={handleSaveDetails} className="px-4 py-2 bg-teal-600 text-white rounded-lg">Save Details</button>
              <button onClick={handleSetTags} className="px-4 py-2 bg-sky-600 text-white rounded-lg">Save Tags</button>
              <button onClick={handleMarkLost} className="px-4 py-2 bg-yellow-600 text-white rounded-lg">Mark Lost</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg">Delete</button>
            </div>
          </div>

          {/* Notes & History */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Notes & History
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3 max-h-64 overflow-y-auto mb-4">
              {parseNotes(notes).length > 0 ? (
                parseNotes(notes).map((note, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded-lg border ${
                      note.type === 'system' 
                        ? 'bg-amber-50 border-amber-200' 
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      {note.timestamp && (
                        <>
                          <Clock className="w-3 h-3" />
                          <span>{formatTimestamp(note.timestamp)}</span>
                        </>
                      )}
                      {note.user_name && (
                        <>
                          <span className="text-gray-300">•</span>
                          <User className="w-3 h-3" />
                          <span className="font-medium text-gray-600">{note.user_name}</span>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-gray-700">{note.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic">No notes yet</p>
              )}
            </div>
            
            {/* Add Comment Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Add Comment</label>
              <textarea 
                value={newComment} 
                onChange={e => setNewComment(e.target.value)} 
                placeholder="Add a note or comment about this prospect..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
                rows={3}
              />
              <button 
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Comment
              </button>
            </div>
          </div>

          {/* Tags */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Tags
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Tags</label>
              <select multiple value={selectedTagIds.map(String)} onChange={(e) => {
                const opts = Array.from(e.target.selectedOptions).map(o => parseInt(o.value, 10));
                setSelectedTagIds(opts);
              }} className="w-full h-36 px-3 py-2 border border-gray-300 rounded-lg">
                {availableTags.map(t => (
                  <option key={t.tag_id} value={t.tag_id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      {/* Delete confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm delete</DialogTitle>
            <DialogDescription>Are you sure you want to delete this prospect? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <div className="flex gap-2 justify-end">
              <button className="px-3 py-1 rounded bg-gray-100" onClick={() => setConfirmOpen(false)}>Cancel</button>
              <button className="px-3 py-1 rounded bg-red-600 text-white" onClick={async () => {
                try {
                  await onDelete?.(String(prospect.id));
                  toast({ title: 'Prospect deleted' });
                  setConfirmOpen(false);
                  onClose();
                } catch (err) {
                  console.error('Failed to delete prospect', err);
                  toast({ title: 'Delete failed', description: String(err), variant: 'destructive' });
                }
              }}>Delete</button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
