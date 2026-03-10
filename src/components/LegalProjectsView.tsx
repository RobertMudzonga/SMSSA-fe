import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { API_BASE } from '@/lib/api';
import { Plus, ChevronRight, Clock, AlertCircle, CheckCircle2, Scale, FileText, Users, Trash2, Upload, Download, File, Search, FileDown, FileUp, Filter, Pencil, Square, CheckSquare, Link } from 'lucide-react';
import CreateClientPortalModal from './CreateClientPortalModal';

// Types
interface LegalCase {
  case_id: number;
  case_reference: string;
  case_type: 'overstay_appeal' | 'prohibited_persons' | 'high_court_expedition' | 'appeals_8_4' | 'appeals_8_6';
  case_title: string;
  case_status: 'active' | 'closed' | 'lost' | 'settled' | 'appealing' | 'on_hold';
  client_name: string;
  client_email?: string;
  client_phone?: string;
  assigned_case_manager_id?: number;
  assigned_case_manager_name?: string;
  assigned_paralegal_id?: number;
  assigned_paralegal_name?: string;
  current_step: number;
  current_step_name: string;
  step_history: StepHistoryEntry[];
  workflow_data: any;
  appeal_count: number;
  parent_case_id?: number;
  created_at: string;
  updated_at: string;
  started_at?: string;
  closed_at?: string;
  next_deadline?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;
}

interface StepHistoryEntry {
  step_id: number;
  step_name: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  started_at?: string;
  completed_at?: string;
  notes?: string;
}

interface Document {
  document_id: number;
  name: string;
  mime_type: string;
  size: number;
  document_type?: string;
  description?: string;
  uploaded_by?: string;
  created_at: string;
  expiry_date?: string;
  unique_doc_id?: string;
  status?: string;
}

const CASE_TYPE_LABELS: Record<string, string> = {
  overstay_appeal: 'Overstay Appeal',
  prohibited_persons: 'Prohibited Persons (V-list)',
  high_court_expedition: 'High Court/Expedition',
  appeals_8_4: 'Appeals 8(4)',
  appeals_8_6: 'Appeals 8(6)'
};

const VFS_CENTERS = [
  'Johannesburg',
  'Cape Town',
  'Durban',
  'Pretoria',
  'Port Elizabeth',
  'Bloemfontein',
  'Nelspruit',
  'Polokwane'
];

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-blue-100 text-blue-800',
  closed: 'bg-green-100 text-green-800',
  lost: 'bg-red-100 text-red-800',
  settled: 'bg-purple-100 text-purple-800',
  appealing: 'bg-orange-100 text-orange-800',
  on_hold: 'bg-gray-100 text-gray-800'
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700'
};

export default function LegalProjectsView() {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<LegalCase | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [employees, setEmployees] = useState<any[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<LegalCase | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [caseManagerFilter, setCaseManagerFilter] = useState<string>('all');
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importingCases, setImportingCases] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editCase, setEditCase] = useState<{
    case_id: number;
    case_title: string;
    client_name: string;
    client_email: string;
    client_phone: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    assigned_case_manager_id: string;
    assigned_paralegal_id: string;
    case_status: 'active' | 'closed' | 'lost' | 'settled' | 'appealing' | 'on_hold';
    notes: string;
  } | null>(null);
  const [updatingCase, setUpdatingCase] = useState(false);
  const [selectedCaseIds, setSelectedCaseIds] = useState<Set<number>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [deletingBulk, setDeletingBulk] = useState(false);
  const [showClientPortalModal, setShowClientPortalModal] = useState(false);
  const { toast } = useToast();

  // New case form state
  const [newCase, setNewCase] = useState({
    case_type: 'overstay_appeal' as const,
    case_title: '',
    client_name: '',
    client_email: '',
    client_phone: '',
    vfs_center: '',
    priority: 'medium' as const,
    assigned_case_manager_id: '',
    notes: ''
  });

  useEffect(() => {
    loadCases();
    loadStats();
    loadEmployees();
  }, []);

  const loadCases = async () => {
    try {
      const response = await fetch(`${API_BASE}/legal-cases`);
      if (response.ok) {
        const data = await response.json();
        setCases(data.cases || []);
      }
    } catch (error) {
      console.error('Error loading legal cases:', error);
      toast({ title: 'Error', description: 'Failed to load legal cases', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/legal-cases/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await fetch(`${API_BASE}/employees`);
      if (response.ok) {
        const data = await response.json();
        setEmployees(data || []);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const loadDocuments = async (caseId: number) => {
    setLoadingDocs(true);
    try {
      const response = await fetch(`${API_BASE}/legal-cases/${caseId}/documents`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleUploadDocument = async (caseId: number, file: File) => {
    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('legal_case_id', caseId.toString());
      formData.append('document_type', 'legal_case_document');
      
      const response = await fetch(`${API_BASE}/documents/upload`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Document uploaded successfully' });
        loadDocuments(caseId);
      } else {
        const error = await response.json();
        toast({ title: 'Error', description: error.error || 'Failed to upload document', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to upload document', variant: 'destructive' });
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDownloadDocument = async (documentId: number, fileName: string) => {
    try {
      const response = await fetch(`${API_BASE}/documents/${documentId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        toast({ title: 'Error', description: 'Failed to download document', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to download document', variant: 'destructive' });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleCreateCase = async () => {
    try {
      const response = await fetch(`${API_BASE}/legal-cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCase,
          vfs_center: newCase.vfs_center || null,
          assigned_case_manager_id: newCase.assigned_case_manager_id ? parseInt(newCase.assigned_case_manager_id) : null
        })
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Legal case created successfully' });
        setIsCreateDialogOpen(false);
        setNewCase({
          case_type: 'overstay_appeal',
          case_title: '',
          client_name: '',
          client_email: '',
          client_phone: '',
          vfs_center: '',
          priority: 'medium',
          assigned_case_manager_id: '',
          notes: ''
        });
        loadCases();
        loadStats();
      } else {
        const error = await response.json();
        toast({ title: 'Error', description: error.error || 'Failed to create case', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create case', variant: 'destructive' });
    }
  };

  const openEditDialog = (caseItem: LegalCase) => {
    setEditCase({
      case_id: caseItem.case_id,
      case_title: caseItem.case_title || '',
      client_name: caseItem.client_name || '',
      client_email: caseItem.client_email || '',
      client_phone: caseItem.client_phone || '',
      priority: caseItem.priority || 'medium',
      assigned_case_manager_id: caseItem.assigned_case_manager_id ? String(caseItem.assigned_case_manager_id) : 'none',
      assigned_paralegal_id: caseItem.assigned_paralegal_id ? String(caseItem.assigned_paralegal_id) : 'none',
      case_status: caseItem.case_status || 'active',
      notes: caseItem.notes || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateCase = async () => {
    if (!editCase) return;
    setUpdatingCase(true);
    try {
      const response = await fetch(`${API_BASE}/legal-cases/${editCase.case_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_title: editCase.case_title,
          client_name: editCase.client_name,
          client_email: editCase.client_email || null,
          client_phone: editCase.client_phone || null,
          priority: editCase.priority,
          assigned_case_manager_id: editCase.assigned_case_manager_id && editCase.assigned_case_manager_id !== 'none' ? parseInt(editCase.assigned_case_manager_id) : null,
          assigned_paralegal_id: editCase.assigned_paralegal_id && editCase.assigned_paralegal_id !== 'none' ? parseInt(editCase.assigned_paralegal_id) : null,
          case_status: editCase.case_status,
          notes: editCase.notes || null
        })
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Case updated successfully' });
        setIsEditDialogOpen(false);
        setEditCase(null);
        loadCases();
        loadStats();
        // Refresh selected case if it was the one being edited
        if (selectedCase?.case_id === editCase.case_id) {
          const updatedCase = await fetch(`${API_BASE}/legal-cases/${editCase.case_id}`);
          if (updatedCase.ok) {
            setSelectedCase(await updatedCase.json());
          }
        }
      } else {
        const error = await response.json();
        toast({ title: 'Error', description: error.error || 'Failed to update case', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update case', variant: 'destructive' });
    } finally {
      setUpdatingCase(false);
    }
  };

  const handleAdvanceStep = async (caseId: number) => {
    try {
      const response = await fetch(`${API_BASE}/legal-cases/${caseId}/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Case advanced to next step' });
        loadCases();
        if (selectedCase?.case_id === caseId) {
          const updatedCase = await fetch(`${API_BASE}/legal-cases/${caseId}`);
          if (updatedCase.ok) {
            setSelectedCase(await updatedCase.json());
          }
        }
      } else {
        const error = await response.json();
        toast({ title: 'Cannot Advance', description: error.error || 'Failed to advance case', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to advance case', variant: 'destructive' });
    }
  };

  const handleSetOutcome = async (caseId: number, outcome: string) => {
    try {
      const response = await fetch(`${API_BASE}/legal-cases/${caseId}/outcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome })
      });

      if (response.ok) {
        toast({ title: 'Success', description: `Outcome set to: ${outcome}` });
        loadCases();
        loadStats();
      } else {
        const error = await response.json();
        toast({ title: 'Error', description: error.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to set outcome', variant: 'destructive' });
    }
  };

  const handleTriggerAppeal = async (caseId: number) => {
    try {
      const response = await fetch(`${API_BASE}/legal-cases/${caseId}/appeal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Appeal triggered from UI' })
      });

      if (response.ok) {
        const data = await response.json();
        toast({ title: 'Appeal Created', description: `New case: ${data.appeal_case?.case_reference}` });
        loadCases();
        loadStats();
      } else {
        const error = await response.json();
        toast({ title: 'Error', description: error.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to trigger appeal', variant: 'destructive' });
    }
  };

  const handleSettlement = async (caseId: number, settled: boolean) => {
    try {
      const response = await fetch(`${API_BASE}/legal-cases/${caseId}/settlement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settlement_outcome: settled ? 'settled' : 'not_settled' })
      });

      if (response.ok) {
        toast({ title: 'Success', description: settled ? 'Case marked as settled' : 'Proceeding to High Court' });
        loadCases();
        loadStats();
      } else {
        const error = await response.json();
        toast({ title: 'Error', description: error.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to set settlement', variant: 'destructive' });
    }
  };

  const handleDeleteCase = async () => {
    if (!caseToDelete) return;
    
    try {
      const response = await fetch(`${API_BASE}/legal-cases/${caseToDelete.case_id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({ title: 'Success', description: `Case ${caseToDelete.case_reference} deleted` });
        setDeleteDialogOpen(false);
        setCaseToDelete(null);
        if (selectedCase?.case_id === caseToDelete.case_id) {
          setSelectedCase(null);
        }
        loadCases();
        loadStats();
      } else {
        const error = await response.json();
        toast({ title: 'Error', description: error.error || 'Failed to delete case', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete case', variant: 'destructive' });
    }
  };

  // Export cases to CSV
  const handleExportCSV = () => {
    const headers = ['Case Reference', 'Case Type', 'Title', 'Status', 'Client Name', 'Client Email', 'Client Phone', 'Priority', 'Case Manager', 'Current Step', 'Created Date'];
    const csvData = filteredCasesData.map(c => [
      c.case_reference,
      CASE_TYPE_LABELS[c.case_type] || c.case_type,
      c.case_title,
      c.case_status,
      c.client_name,
      c.client_email || '',
      c.client_phone || '',
      c.priority,
      c.assigned_case_manager_name || '',
      c.current_step_name || '',
      new Date(c.created_at).toLocaleDateString()
    ]);
    
    const csvContent = [headers, ...csvData].map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `legal_cases_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Export Complete', description: `Exported ${filteredCasesData.length} cases to CSV` });
  };

  // Export cases to JSON
  const handleExportJSON = () => {
    const exportData = filteredCasesData.map(c => ({
      case_type: c.case_type,
      case_title: c.case_title,
      client_name: c.client_name,
      client_email: c.client_email,
      client_phone: c.client_phone,
      priority: c.priority,
      notes: c.notes
    }));
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `legal_cases_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Export Complete', description: `Exported ${filteredCasesData.length} cases to JSON` });
  };

  // Download CSV import template
  const handleDownloadCSVTemplate = () => {
    const headers = ['case_type', 'case_title', 'client_name', 'client_email', 'client_phone', 'priority', 'case_manager', 'notes'];
    const sampleData = [
      ['overstay_appeal', 'Smith Overstay Appeal 2026', 'John Smith', 'john.smith@email.com', '+27821234567', 'high', 'Jane Manager', 'Client has been in SA for 5 years'],
      ['prohibited_persons', 'Davis V-List Removal', 'Mary Davis', 'mary.davis@email.com', '+27829876543', 'medium', '', 'Seeking removal from prohibited persons list'],
      ['high_court_expedition', 'Wilson Urgent Expedition', 'James Wilson', 'james.wilson@email.com', '+27835551234', 'urgent', 'Jane Manager', 'Urgent matter requiring expedited processing'],
      ['appeals_8_4', 'Nkosi Appeal 8(4)', 'Lindiwe Nkosi', 'lindiwe.nkosi@email.com', '+27831234567', 'high', 'Jane Manager', 'Appeal under section 8(4)'],
      ['appeals_8_6', 'Moyo Appeal 8(6)', 'Tendai Moyo', 'tendai.moyo@email.com', '+27839876543', 'medium', 'Jane Manager', 'Appeal under section 8(6)']
    ];
    
    const csvContent = [headers, ...sampleData].map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'legal_cases_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Template Downloaded', description: 'CSV import template downloaded successfully' });
  };

  // Download JSON import template
  const handleDownloadJSONTemplate = () => {
    const templateData = [
      {
        case_type: 'overstay_appeal',
        case_title: 'Smith Overstay Appeal 2026',
        client_name: 'John Smith',
        client_email: 'john.smith@email.com',
        client_phone: '+27821234567',
        priority: 'high',
        case_manager: 'Jane Manager',
        notes: 'Client has been in SA for 5 years'
      },
      {
        case_type: 'prohibited_persons',
        case_title: 'Davis V-List Removal',
        client_name: 'Mary Davis',
        client_email: 'mary.davis@email.com',
        client_phone: '+27829876543',
        priority: 'medium',
        case_manager: '',
        notes: 'Seeking removal from prohibited persons list'
      },
      {
        case_type: 'high_court_expedition',
        case_title: 'Wilson Urgent Expedition',
        client_name: 'James Wilson',
        client_email: 'james.wilson@email.com',
        client_phone: '+27835551234',
        priority: 'urgent',
        case_manager: 'Jane Manager',
        notes: 'Urgent matter requiring expedited processing'
      },
      {
        case_type: 'appeals_8_4',
        case_title: 'Nkosi Appeal 8(4)',
        client_name: 'Lindiwe Nkosi',
        client_email: 'lindiwe.nkosi@email.com',
        client_phone: '+27831234567',
        priority: 'high',
        case_manager: 'Jane Manager',
        notes: 'Appeal under section 8(4)'
      },
      {
        case_type: 'appeals_8_6',
        case_title: 'Moyo Appeal 8(6)',
        client_name: 'Tendai Moyo',
        client_email: 'tendai.moyo@email.com',
        client_phone: '+27839876543',
        priority: 'medium',
        case_manager: 'Jane Manager',
        notes: 'Appeal under section 8(6)'
      }
    ];
    
    const blob = new Blob([JSON.stringify(templateData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'legal_cases_import_template.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Template Downloaded', description: 'JSON import template downloaded successfully' });
  };

  // Import cases from JSON file
  const handleImportFile = async (file: File) => {
    setImportingCases(true);
    try {
      const text = await file.text();
      let importData: any[];
      
      if (file.name.endsWith('.json')) {
        importData = JSON.parse(text);
      } else if (file.name.endsWith('.csv')) {
        // Parse CSV
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase().replace(/ /g, '_'));
        importData = lines.slice(1).map(line => {
          const values = line.match(/"[^"]*"|[^,]+/g)?.map(v => v.replace(/^"|"$/g, '').trim()) || [];
          const obj: any = {};
          headers.forEach((h, i) => {
            if (h === 'case_reference' || h === 'title') obj.case_title = values[i];
            else if (h === 'case_type') obj.case_type = values[i]?.toLowerCase().replace(/ /g, '_').replace(/[()/-]/g, '_').replace(/__+/g, '_') || 'overstay_appeal';
            else if (h === 'client_name') obj.client_name = values[i];
            else if (h === 'client_email') obj.client_email = values[i];
            else if (h === 'client_phone') obj.client_phone = values[i];
            else if (h === 'priority') obj.priority = values[i]?.toLowerCase() || 'medium';
            else if (h === 'case_manager') obj.case_manager = values[i];
            else if (h === 'notes') obj.notes = values[i];
          });
          return obj;
        });
      } else {
        throw new Error('Unsupported file format. Please use .json or .csv files.');
      }

      if (!Array.isArray(importData) || importData.length === 0) {
        throw new Error('No valid data found in file');
      }

      let successCount = 0;
      let errorCount = 0;

      for (const item of importData) {
        // Validate case_type
        const validTypes = ['overstay_appeal', 'prohibited_persons', 'high_court_expedition', 'appeals_8_4', 'appeals_8_6'];
        let caseType = item.case_type?.toLowerCase().replace(/ /g, '_') || 'overstay_appeal';
        if (!validTypes.includes(caseType)) {
          if (caseType.includes('overstay')) caseType = 'overstay_appeal';
          else if (caseType.includes('prohibit') || caseType.includes('v_list')) caseType = 'prohibited_persons';
          else if (caseType.includes('high') || caseType.includes('court') || caseType.includes('expedition')) caseType = 'high_court_expedition';
          else if (caseType.includes('8_4') || caseType.includes('8(4)') || caseType.includes('appeals_8_4')) caseType = 'appeals_8_4';
          else if (caseType.includes('8_6') || caseType.includes('8(6)') || caseType.includes('appeals_8_6')) caseType = 'appeals_8_6';
          else caseType = 'overstay_appeal';
        }

        try {
          // Find case manager ID by name if provided
          let caseManagerId = null;
          if (item.case_manager) {
            const manager = employees.find(e => 
              e.full_name?.toLowerCase() === item.case_manager?.toLowerCase() ||
              e.full_name?.toLowerCase().includes(item.case_manager?.toLowerCase())
            );
            if (manager) caseManagerId = manager.id;
          }

          const response = await fetch(`${API_BASE}/legal-cases`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              case_type: caseType,
              case_title: item.case_title || item.title || 'Imported Case',
              client_name: item.client_name || 'Unknown Client',
              client_email: item.client_email || '',
              client_phone: item.client_phone || '',
              priority: ['low', 'medium', 'high', 'urgent'].includes(item.priority?.toLowerCase()) ? item.priority.toLowerCase() : 'medium',
              assigned_case_manager_id: caseManagerId,
              notes: item.notes || 'Imported from file'
            })
          });

          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch {
          errorCount++;
        }
      }

      setIsImportDialogOpen(false);
      loadCases();
      loadStats();
      toast({ 
        title: 'Import Complete', 
        description: `Successfully imported ${successCount} cases${errorCount > 0 ? `, ${errorCount} failed` : ''}` 
      });
    } catch (error: any) {
      toast({ title: 'Import Error', description: error.message || 'Failed to import cases', variant: 'destructive' });
    } finally {
      setImportingCases(false);
    }
  };

  // Selection handlers
  const toggleCaseSelection = (caseId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedCaseIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(caseId)) {
        newSet.delete(caseId);
      } else {
        newSet.add(caseId);
      }
      return newSet;
    });
  };

  const selectAllCases = () => {
    if (selectedCaseIds.size === filteredCases.length) {
      setSelectedCaseIds(new Set());
    } else {
      setSelectedCaseIds(new Set(filteredCases.map(c => c.case_id)));
    }
  };

  const clearSelection = () => {
    setSelectedCaseIds(new Set());
  };

  // Bulk delete handler
  const handleBulkDelete = async () => {
    if (selectedCaseIds.size === 0) return;
    setDeletingBulk(true);
    
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    console.log('Starting bulk delete for case IDs:', Array.from(selectedCaseIds));
    
    for (const caseId of selectedCaseIds) {
      try {
        const deleteUrl = `${API_BASE}/legal-cases/${caseId}`;
        console.log(`Deleting case ${caseId} at URL: ${deleteUrl}`);
        
        const response = await fetch(deleteUrl, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`Response status for case ${caseId}:`, response.status, response.ok);
        
        if (response.ok) {
          const data = await response.json().catch(() => ({}));
          console.log(`Successfully deleted case ${caseId}:`, data);
          successCount++;
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error(`Failed to delete case ${caseId}:`, response.status, errorData);
          errors.push(`Case ${caseId}: ${errorData.error || 'Unknown error'}`);
          errorCount++;
        }
      } catch (err) {
        console.error(`Error deleting case ${caseId}:`, err);
        errorCount++;
      }
    }
    
    console.log(`Bulk delete complete: ${successCount} success, ${errorCount} errors`);
    
    setBulkDeleteDialogOpen(false);
    setSelectedCaseIds(new Set());
    setSelectedCase(null);
    
    // Await the reload to ensure UI updates
    await loadCases();
    await loadStats();
    
    toast({ 
      title: 'Bulk Delete Complete', 
      description: `Deleted ${successCount} cases${errorCount > 0 ? `, ${errorCount} failed` : ''}` 
    });
    setDeletingBulk(false);
  };

  // Filter cases by status/type, search query, and case manager
  const filteredCasesData = cases.filter(c => {
    // Filter by status/type
    if (activeFilter !== 'all') {
      if (activeFilter === 'active' && c.case_status !== 'active') return false;
      if (activeFilter !== 'active' && c.case_type !== activeFilter) return false;
    }
    
    // Filter by case manager
    if (caseManagerFilter !== 'all') {
      if (!c.assigned_case_manager_id || String(c.assigned_case_manager_id) !== caseManagerFilter) return false;
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        c.case_reference?.toLowerCase().includes(query) ||
        c.case_title?.toLowerCase().includes(query) ||
        c.client_name?.toLowerCase().includes(query) ||
        c.client_email?.toLowerCase().includes(query) ||
        c.assigned_case_manager_name?.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  // For backward compatibility - using filteredCasesData
  const filteredCases = filteredCasesData;

  const getStepProgress = (c: LegalCase) => {
    const totalSteps = c.step_history?.length || 5;
    const completedSteps = c.step_history?.filter(s => s.status === 'completed').length || 0;
    return { completed: completedSteps, total: totalSteps, percentage: Math.round((completedSteps / totalSteps) * 100) };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Scale className="w-7 h-7 text-teal-600" />
            Legal Projects
          </h1>
          <p className="text-gray-500 dark:text-gray-400">Manage legal case workflows</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-teal-600 hover:bg-teal-700">
              <Plus className="w-4 h-4 mr-2" />
              New Case
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Create Legal Case</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 overflow-y-auto pr-1">
              <div className="space-y-2">
                <Label>Case Type</Label>
                <Select value={newCase.case_type} onValueChange={(v: any) => setNewCase({...newCase, case_type: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overstay_appeal">Overstay Appeal</SelectItem>
                    <SelectItem value="prohibited_persons">Prohibited Persons (V-list)</SelectItem>
                    <SelectItem value="high_court_expedition">High Court/Expedition</SelectItem>
                    <SelectItem value="appeals_8_4">Appeals 8(4)</SelectItem>
                    <SelectItem value="appeals_8_6">Appeals 8(6)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(newCase.case_type === 'appeals_8_4' || newCase.case_type === 'appeals_8_6') && (
                <div className="space-y-2">
                  <Label>VFS Center</Label>
                  <Select value={newCase.vfs_center} onValueChange={(v) => setNewCase({...newCase, vfs_center: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select VFS center" />
                    </SelectTrigger>
                    <SelectContent>
                      {VFS_CENTERS.map(center => (
                        <SelectItem key={center} value={center}>{center}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Case Title</Label>
                <Input 
                  value={newCase.case_title} 
                  onChange={(e) => setNewCase({...newCase, case_title: e.target.value})}
                  placeholder="Enter case title"
                />
              </div>
              <div className="space-y-2">
                <Label>Client Name</Label>
                <Input 
                  value={newCase.client_name} 
                  onChange={(e) => setNewCase({...newCase, client_name: e.target.value})}
                  placeholder="Enter client name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Client Email</Label>
                  <Input 
                    type="email"
                    value={newCase.client_email} 
                    onChange={(e) => setNewCase({...newCase, client_email: e.target.value})}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Client Phone</Label>
                  <Input 
                    value={newCase.client_phone} 
                    onChange={(e) => setNewCase({...newCase, client_phone: e.target.value})}
                    placeholder="+27..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={newCase.priority} onValueChange={(v: any) => setNewCase({...newCase, priority: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Case Manager</Label>
                  <Select value={newCase.assigned_case_manager_id} onValueChange={(v) => setNewCase({...newCase, assigned_case_manager_id: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select case manager" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.filter(e => e.department === 'Legal' || e.job_position?.toLowerCase().includes('manager')).map(e => (
                        <SelectItem key={e.id} value={String(e.id)}>{e.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea 
                  value={newCase.notes} 
                  onChange={(e) => setNewCase({...newCase, notes: e.target.value})}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter className="pt-3 border-t">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateCase} disabled={!newCase.case_title || !newCase.client_name}>
                Create Case
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Active</p>
                  <p className="text-2xl font-bold">{stats.by_status?.active || 0}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Overstay Appeals</p>
                  <p className="text-2xl font-bold">{stats.by_type?.overstay_appeal || 0}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Prohibited Persons</p>
                  <p className="text-2xl font-bold">{stats.by_type?.prohibited_persons || 0}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">High Court</p>
                  <p className="text-2xl font-bold">{stats.by_type?.high_court_expedition || 0}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <Scale className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search, Filter & Import/Export Toolbar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by reference, title, client name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Case Manager Filter */}
            <div className="w-full lg:w-64">
              <Select value={caseManagerFilter} onValueChange={setCaseManagerFilter}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by Case Manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Case Managers</SelectItem>
                  {employees
                    .filter(e => e.department === 'Legal' || e.job_position?.toLowerCase().includes('manager'))
                    .map(e => (
                      <SelectItem key={e.id} value={String(e.id)}>{e.full_name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Import/Export Buttons */}
            <div className="flex gap-2">
              <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <FileUp className="w-4 h-4 mr-2" />
                    Import
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Import Legal Cases</DialogTitle>
                    <DialogDescription>
                      Upload a CSV or JSON file to import legal cases. Download a template to see the required format.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4 space-y-4">
                    {/* Download Template Section */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <h4 className="text-sm font-medium mb-2">Step 1: Download Template</h4>
                      <p className="text-xs text-gray-500 mb-3">Get a template file with the correct format and sample data.</p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleDownloadCSVTemplate}>
                          <FileDown className="w-4 h-4 mr-1" />
                          CSV Template
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleDownloadJSONTemplate}>
                          <FileDown className="w-4 h-4 mr-1" />
                          JSON Template
                        </Button>
                      </div>
                    </div>
                    
                    {/* Field Reference */}
                    <div className="text-xs text-gray-500 space-y-1">
                      <p className="font-medium">Required Fields:</p>
                      <ul className="list-disc list-inside space-y-0.5 ml-2">
                        <li><span className="font-mono">case_type</span>: overstay_appeal, prohibited_persons, or high_court_expedition</li>
                        <li><span className="font-mono">case_title</span>: Title/name of the case</li>
                        <li><span className="font-mono">client_name</span>: Full name of the client</li>
                      </ul>
                      <p className="font-medium mt-2">Optional Fields:</p>
                      <ul className="list-disc list-inside space-y-0.5 ml-2">
                        <li><span className="font-mono">client_email</span>, <span className="font-mono">client_phone</span></li>
                        <li><span className="font-mono">priority</span>: low, medium, high, or urgent</li>
                        <li><span className="font-mono">case_manager</span>: Name of the case manager (must match an employee)</li>
                        <li><span className="font-mono">notes</span>: Additional case notes</li>
                      </ul>
                    </div>
                    
                    {/* Upload Section */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Step 2: Upload Your File</h4>
                      <label className="block">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-teal-500 cursor-pointer transition-colors">
                          <FileUp className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Click to select a file or drag and drop</p>
                          <p className="text-xs text-gray-400 mt-1">Supports CSV and JSON files</p>
                        </div>
                        <input
                          type="file"
                          accept=".csv,.json"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImportFile(file);
                            e.target.value = '';
                          }}
                          disabled={importingCases}
                        />
                      </label>
                    </div>
                    
                    {importingCases && (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600 mr-2"></div>
                        <span className="text-sm text-gray-600">Importing cases...</span>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              
              <Select onValueChange={(v) => v === 'csv' ? handleExportCSV() : handleExportJSON()}>
                <SelectTrigger className="w-[130px]">
                  <FileDown className="w-4 h-4 mr-2" />
                  <span>Export</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">Export as CSV</SelectItem>
                  <SelectItem value="json">Export as JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Show active filters summary */}
          {(searchQuery || caseManagerFilter !== 'all') && (
            <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
              <span>Showing {filteredCases.length} of {cases.length} cases</span>
              {searchQuery && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => setSearchQuery('')}>
                  Search: "{searchQuery}" ✕
                </Badge>
              )}
              {caseManagerFilter !== 'all' && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => setCaseManagerFilter('all')}>
                  Manager: {employees.find(e => String(e.id) === caseManagerFilter)?.full_name} ✕
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filter Tabs */}
      <Tabs value={activeFilter} onValueChange={setActiveFilter}>
        <TabsList>
          <TabsTrigger value="all">All Cases ({cases.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({cases.filter(c => c.case_status === 'active').length})</TabsTrigger>
          <TabsTrigger value="overstay_appeal">Overstay Appeal ({cases.filter(c => c.case_type === 'overstay_appeal').length})</TabsTrigger>
          <TabsTrigger value="prohibited_persons">Prohibited Persons ({cases.filter(c => c.case_type === 'prohibited_persons').length})</TabsTrigger>
          <TabsTrigger value="high_court_expedition">High Court ({cases.filter(c => c.case_type === 'high_court_expedition').length})</TabsTrigger>
          <TabsTrigger value="appeals_8_4">Appeals 8(4) ({cases.filter(c => c.case_type === 'appeals_8_4').length})</TabsTrigger>
          <TabsTrigger value="appeals_8_6">Appeals 8(6) ({cases.filter(c => c.case_type === 'appeals_8_6').length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Cases List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cases Grid */}
        <div className="lg:col-span-2 space-y-4">
          {/* Selection Bar */}
          {filteredCases.length > 0 && (
            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedCaseIds.size === filteredCases.length && filteredCases.length > 0}
                  onCheckedChange={selectAllCases}
                  aria-label="Select all cases"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedCaseIds.size > 0 
                    ? `${selectedCaseIds.size} of ${filteredCases.length} selected`
                    : `Select all (${filteredCases.length})`
                  }
                </span>
              </div>
              {selectedCaseIds.size > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearSelection}
                  >
                    Clear Selection
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setBulkDeleteDialogOpen(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete Selected ({selectedCaseIds.size})
                  </Button>
                </div>
              )}
            </div>
          )}

          {filteredCases.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Scale className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No legal cases found</p>
                <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Case
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredCases.map(c => {
              const progress = getStepProgress(c);
              const isSelected = selectedCaseIds.has(c.case_id);
              return (
                <Card 
                  key={c.case_id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${selectedCase?.case_id === c.case_id ? 'ring-2 ring-teal-500' : ''} ${isSelected ? 'bg-teal-50 dark:bg-teal-900/20 ring-1 ring-teal-200' : ''}`}
                  onClick={() => {
                    setSelectedCase(c);
                    loadDocuments(c.case_id);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="pt-0.5" onClick={(e) => toggleCaseSelection(c.case_id, e)}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => {}}
                            aria-label={`Select ${c.case_title}`}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-mono text-gray-500">{c.case_reference}</span>
                            <Badge className={STATUS_COLORS[c.case_status]}>{c.case_status}</Badge>
                            <Badge className={PRIORITY_COLORS[c.priority]}>{c.priority}</Badge>
                          </div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{c.case_title}</h3>
                          <p className="text-sm text-gray-500">{CASE_TYPE_LABELS[c.case_type]}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {c.client_name}
                            </span>
                            {c.assigned_case_manager_name && (
                              <span>Case Manager: {c.assigned_case_manager_name}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Step {c.current_step}</p>
                        <p className="text-xs text-gray-400">{c.current_step_name}</p>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{progress.completed}/{progress.total} steps ({progress.percentage}%)</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-teal-500 transition-all"
                          style={{ width: `${progress.percentage}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Case Details Panel */}
        <div className="lg:col-span-1">
          {selectedCase ? (
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>{selectedCase.case_reference}</span>
                  <Badge className={STATUS_COLORS[selectedCase.case_status]}>{selectedCase.case_status}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold">{selectedCase.case_title}</h4>
                  <p className="text-sm text-gray-500">{CASE_TYPE_LABELS[selectedCase.case_type]}</p>
                </div>

                <div className="border-t pt-4">
                  <h5 className="text-sm font-medium mb-2">Client</h5>
                  <p className="text-sm">{selectedCase.client_name}</p>
                  {selectedCase.client_email && <p className="text-sm text-gray-500">{selectedCase.client_email}</p>}
                  {selectedCase.client_phone && <p className="text-sm text-gray-500">{selectedCase.client_phone}</p>}
                </div>

                {/* Workflow Steps */}
                <div className="border-t pt-4">
                  <h5 className="text-sm font-medium mb-3">Workflow Progress</h5>
                  <div className="space-y-2">
                    {selectedCase.step_history?.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        {step.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : step.status === 'in_progress' ? (
                          <Clock className="w-4 h-4 text-blue-500" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                        )}
                        <span className={`text-sm ${step.status === 'completed' ? 'text-gray-500 line-through' : step.status === 'in_progress' ? 'font-medium' : 'text-gray-400'}`}>
                          {step.step_name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Documents Section */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-medium flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Documents ({documents.length})
                    </h5>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && selectedCase) {
                            handleUploadDocument(selectedCase.case_id, file);
                          }
                          e.target.value = '';
                        }}
                        disabled={uploadingDoc}
                      />
                      <Button variant="outline" size="sm" disabled={uploadingDoc} asChild>
                        <span>
                          <Upload className="w-3 h-3 mr-1" />
                          {uploadingDoc ? 'Uploading...' : 'Upload'}
                        </span>
                      </Button>
                    </label>
                  </div>
                  
                  {loadingDocs ? (
                    <p className="text-sm text-gray-500">Loading documents...</p>
                  ) : documents.length === 0 ? (
                    <p className="text-sm text-gray-500">No documents uploaded yet</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {documents.map(doc => (
                        <div 
                          key={doc.document_id} 
                          className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <File className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="truncate font-medium">{doc.name}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(doc.size)}</p>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDownloadDocument(doc.document_id, doc.name)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="border-t pt-4 space-y-2">
                  {selectedCase.case_status === 'active' && (
                    <>
                      <Button 
                        className="w-full" 
                        onClick={() => handleAdvanceStep(selectedCase.case_id)}
                      >
                        <ChevronRight className="w-4 h-4 mr-2" />
                        Advance to Next Step
                      </Button>

                      {/* Outcome buttons for Overstay Appeal at step 5 */}
                      {selectedCase.case_type === 'overstay_appeal' && selectedCase.current_step === 5 && (
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            className="flex-1 text-green-600 border-green-600"
                            onClick={() => handleSetOutcome(selectedCase.case_id, 'approved')}
                          >
                            Approved
                          </Button>
                          <Button 
                            variant="outline" 
                            className="flex-1 text-red-600 border-red-600"
                            onClick={() => handleSetOutcome(selectedCase.case_id, 'rejected')}
                          >
                            Rejected
                          </Button>
                        </div>
                      )}

                      {/* Outcome buttons for Prohibited Persons at step 5 */}
                      {selectedCase.case_type === 'prohibited_persons' && selectedCase.current_step === 5 && (
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            className="flex-1 text-green-600 border-green-600"
                            onClick={() => handleSetOutcome(selectedCase.case_id, 'success')}
                          >
                            Success
                          </Button>
                          <Button 
                            variant="outline" 
                            className="flex-1 text-red-600 border-red-600"
                            onClick={() => handleSetOutcome(selectedCase.case_id, 'lost')}
                          >
                            Lost
                          </Button>
                        </div>
                      )}

                      {/* Settlement buttons for High Court at step 7 */}
                      {selectedCase.case_type === 'high_court_expedition' && selectedCase.current_step === 7 && (
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            className="flex-1 text-green-600 border-green-600"
                            onClick={() => handleSettlement(selectedCase.case_id, true)}
                          >
                            Settled
                          </Button>
                          <Button 
                            variant="outline" 
                            className="flex-1 text-orange-600 border-orange-600"
                            onClick={() => handleSettlement(selectedCase.case_id, false)}
                          >
                            Not Settled
                          </Button>
                        </div>
                      )}
                    </>
                  )}

                  {/* Appeal button for lost Prohibited Persons cases */}
                  {selectedCase.case_type === 'prohibited_persons' && selectedCase.case_status === 'lost' && (
                    <Button 
                      className="w-full bg-orange-600 hover:bg-orange-700"
                      onClick={() => handleTriggerAppeal(selectedCase.case_id)}
                    >
                      Trigger Appeal
                    </Button>
                  )}

                  {/* Edit Button */}
                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={() => openEditDialog(selectedCase)}
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Case
                  </Button>

                  {/* Client Portal Button */}
                  <Button
                    variant="outline"
                    className="w-full mt-2 text-teal-600 border-teal-600 hover:bg-teal-50"
                    onClick={() => setShowClientPortalModal(true)}
                  >
                    <Link className="w-4 h-4 mr-2" />
                    Create Client Portal
                  </Button>

                  {/* Delete Button */}
                  <Button 
                    variant="outline" 
                    className="w-full text-red-600 border-red-600 hover:bg-red-50"
                    onClick={() => {
                      setCaseToDelete(selectedCase);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Case
                  </Button>
                </div>

                {/* Metadata */}
                <div className="border-t pt-4 text-xs text-gray-500">
                  <p>Created: {new Date(selectedCase.created_at).toLocaleDateString()}</p>
                  {selectedCase.next_deadline && (
                    <p className="text-orange-600">Deadline: {new Date(selectedCase.next_deadline).toLocaleDateString()}</p>
                  )}
                  {selectedCase.appeal_count > 0 && (
                    <p>Appeals: {selectedCase.appeal_count}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Scale className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Select a case to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Legal Case</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete case <strong>{caseToDelete?.case_reference}</strong>?
              This action cannot be undone and will permanently remove all case data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCaseToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCase}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCaseIds.size} Legal Cases</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedCaseIds.size} selected cases</strong>?
              This action cannot be undone and will permanently remove all case data for these cases.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingBulk}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deletingBulk}
            >
              {deletingBulk ? 'Deleting...' : `Delete ${selectedCaseIds.size} Cases`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Case Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Case Details</DialogTitle>
            <DialogDescription>
              Update case information for {editCase?.case_title}
            </DialogDescription>
          </DialogHeader>
          {editCase && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Case Title</Label>
                <Input 
                  value={editCase.case_title} 
                  onChange={(e) => setEditCase({...editCase, case_title: e.target.value})}
                  placeholder="Enter case title"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Client Name</Label>
                  <Input 
                    value={editCase.client_name} 
                    onChange={(e) => setEditCase({...editCase, client_name: e.target.value})}
                    placeholder="Enter client name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Client Email</Label>
                  <Input 
                    type="email"
                    value={editCase.client_email} 
                    onChange={(e) => setEditCase({...editCase, client_email: e.target.value})}
                    placeholder="email@example.com"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Client Phone</Label>
                  <Input 
                    value={editCase.client_phone} 
                    onChange={(e) => setEditCase({...editCase, client_phone: e.target.value})}
                    placeholder="+27..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select 
                    value={editCase.priority} 
                    onValueChange={(v: 'low' | 'medium' | 'high' | 'urgent') => setEditCase({...editCase, priority: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Case Status</Label>
                  <Select 
                    value={editCase.case_status} 
                    onValueChange={(v: 'active' | 'closed' | 'lost' | 'settled' | 'appealing' | 'on_hold') => setEditCase({...editCase, case_status: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="appealing">Appealing</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="settled">Settled</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Case Manager</Label>
                  <Select 
                    value={editCase.assigned_case_manager_id} 
                    onValueChange={(v) => setEditCase({...editCase, assigned_case_manager_id: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select case manager" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {employees
                        .filter(e => e.department === 'Legal' || e.job_position?.toLowerCase().includes('manager'))
                        .map(e => (
                          <SelectItem key={e.id} value={String(e.id)}>{e.full_name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea 
                  value={editCase.notes} 
                  onChange={(e) => setEditCase({...editCase, notes: e.target.value})}
                  placeholder="Additional notes..."
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setEditCase(null); }}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateCase} 
              disabled={updatingCase || !editCase?.case_title || !editCase?.client_name}
            >
              {updatingCase ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Client Portal Modal */}
      {showClientPortalModal && selectedCase && (
        <CreateClientPortalModal
          caseId={selectedCase.case_id}
          projectName={selectedCase.case_title || selectedCase.case_reference}
          clientName={selectedCase.client_name}
          clientEmail={selectedCase.client_email}
          entityType="legal_case"
          onClose={() => setShowClientPortalModal(false)}
        />
      )}
    </div>
  );
}
