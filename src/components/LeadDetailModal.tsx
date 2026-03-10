import { useState } from 'react';
import { X, MessageSquare, Trash2, Archive, Calendar, Mail, Phone, Building, UserPlus, FileText, Clock, User } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

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

interface LeadDetailModalProps {
  lead: any;
  isOpen: boolean;
  onClose: () => void;
  onAddComment: (leadId: number, comment: string) => void;
  onMarkLost: (leadId: number, reason: string) => void;
  onDelete: (leadId: number) => void;
  onAssignEmployee?: (leadId: number, employeeId: number) => void;
  employees?: any[];
}

export default function LeadDetailModal({
  lead,
  isOpen,
  onClose,
  onAddComment,
  onMarkLost,
  onDelete,
  onAssignEmployee,
  employees = []
}: LeadDetailModalProps) {
  const [comment, setComment] = useState('');
  const [lostReason, setLostReason] = useState('');
  const [showLostDialog, setShowLostDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

  if (!isOpen || !lead) return null;

  const handleAddComment = () => {
    if (comment.trim()) {
      onAddComment(lead.lead_id, comment);
      setComment('');
    }
  };

  const handleMarkLost = () => {
    if (lostReason.trim()) {
      onMarkLost(lead.lead_id, lostReason);
      setShowLostDialog(false);
      setLostReason('');
      onClose();
    }
  };

  const handleDelete = () => {
    onDelete(lead.lead_id);
    setShowDeleteDialog(false);
    onClose();
  };

  const handleAssignEmployee = () => {
    if (selectedEmployeeId && onAssignEmployee) {
      onAssignEmployee(lead.lead_id, parseInt(selectedEmployeeId));
      setSelectedEmployeeId('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-900">
            {(() => {
              // Try to get name from first_name/last_name
              if (lead.first_name || lead.last_name) {
                return `${lead.first_name || ''} ${lead.last_name || ''}`.trim();
              }
              // Try to get full_name from form_responses
              if (lead.form_responses && Array.isArray(lead.form_responses)) {
                const fullNameResponse = lead.form_responses.find(r => 
                  r.question && r.question.toLowerCase().includes('name')
                );
                if (fullNameResponse) return fullNameResponse.answer;
              }
              // Fallback to email or 'Unknown'
              return lead.email || 'Unknown Lead';
            })()}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Lead Information */}
        <div className="p-6 space-y-6">
          {/* Contact Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="min-w-0">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Mail className="w-4 h-4 inline mr-1" />
                Email
              </label>
              <p className="text-gray-900 break-all overflow-wrap-anywhere">{lead.email || 'N/A'}</p>
            </div>
            <div className="min-w-0">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Phone className="w-4 h-4 inline mr-1" />
                Phone
              </label>
              <p className="text-gray-900 break-all">{lead.phone || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Building className="w-4 h-4 inline mr-1" />
                Company
              </label>
              <p className="text-gray-900">{lead.company || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source
              </label>
              <p className="text-gray-900">{lead.source || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FileText className="w-4 h-4 inline mr-1" />
                Ad / Form
              </label>
              <p className="text-gray-900">{lead.form_id || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <UserPlus className="w-4 h-4 inline mr-1" />
                Assigned To
              </label>
              <p className="text-gray-900">{lead.assigned_to_name || 'Unassigned'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                Created
              </label>
              <p className="text-gray-900">
                {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Updated
              </label>
              <p className="text-gray-900">
                {lead.updated_at ? new Date(lead.updated_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          {/* Form Responses Section */}
          {lead.form_responses && Array.isArray(lead.form_responses) && lead.form_responses.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Form Responses ({lead.form_responses.length})
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {lead.form_responses.map((response, index) => (
                  <div 
                    key={index} 
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">
                          Question {index + 1}
                        </p>
                        <p className="text-sm font-medium text-gray-900 mb-3 leading-relaxed">
                          {response.question}
                        </p>
                        <div className="bg-gray-50 rounded p-3 border-l-4 border-blue-500">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                            {response.answer}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Employee Assignment Section */}
          {onAssignEmployee && employees.length > 0 && (
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign to Salesperson
              </label>
              <div className="flex gap-2">
                <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a salesperson" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.filter(emp => emp.is_active).map((employee) => (
                      <SelectItem key={employee.id} value={employee.id.toString()}>
                        {employee.full_name} - {employee.job_position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleAssignEmployee} 
                  disabled={!selectedEmployeeId}
                  className="whitespace-nowrap"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Assign
                </Button>
              </div>
            </div>
          )}

          {/* Notes/History */}
          {lead.notes && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes & History
              </label>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3 max-h-64 overflow-y-auto">
                {parseNotes(lead.notes).length > 0 ? (
                  parseNotes(lead.notes).map((note, index) => (
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
            </div>
          )}

          {/* Add Comment Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MessageSquare className="w-4 h-4 inline mr-1" />
              Add Comment
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a note or comment about this lead..."
              className="w-full mb-2"
              rows={3}
            />
            <Button
              onClick={handleAddComment}
              disabled={!comment.trim()}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              Add Comment
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              onClick={() => setShowLostDialog(true)}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Archive className="w-4 h-4 mr-2" />
              Mark as Lost
            </Button>
            <Button
              onClick={() => setShowDeleteDialog(true)}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete (Duplicate)
            </Button>
          </div>
        </div>

        {/* Lost Reason Dialog */}
        {showLostDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">Mark Lead as Lost</h3>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for marking as lost:
              </label>
              <Textarea
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                placeholder="Enter the reason why this lead was lost..."
                rows={4}
                className="w-full mb-4"
              />
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowLostDialog(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleMarkLost}
                  disabled={!lostReason.trim()}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                >
                  Mark as Lost
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-4 text-red-600">Delete Lead</h3>
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete this lead? This action cannot be undone.
                Only delete leads that are confirmed duplicates.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowDeleteDialog(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete Lead
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
