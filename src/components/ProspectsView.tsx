import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import PipelineColumn from './PipelineColumn';
import PipelineStats from './PipelineStats';
import AddProspectModal from './AddProspectModal';
import ProspectDetailModal from './ProspectDetailModal';
import { LayoutGrid, List, Search } from 'lucide-react';
import { API_BASE } from '../lib/api';

interface ProspectsViewProps {
  prospects: any[];
  onAddProspect: (data: any) => void;
  onUpdateProspect: (id: string, data: any) => Promise<boolean>;
  onMoveStage: (prospectId: string, toStage: string) => Promise<any>;
  onScheduleFollowUp: (prospectId: string, type: string, date: string) => void;
  onDeleteProspect?: (id: string) => void;
  onMarkProspectLost?: (id: string, reason?: string) => void;
  onSetProspectTags?: (id: string, tagIds: number[]) => void;
  onOpenProject?: (projectId: string) => void;
}

interface Employee {
  employee_id?: number;
  id?: number;
  first_name?: string;
  last_name?: string;
  full_name?: string;
}

const PIPELINE_STAGES = [
  { key: 'opportunity', label: 'Opportunity' },
  { key: 'quote_requested', label: 'Quote Requested' },
  { key: 'quote_sent', label: 'Quote Sent' },
  { key: 'first_follow_up', label: 'First Follow-up' },
  { key: 'second_follow_up', label: 'Second Follow-up' },
  { key: 'mid_month_follow_up', label: 'Mid-Month' },
  { key: 'month_end_follow_up', label: 'Month-End' },
  { key: 'next_month_follow_up', label: 'Next Month' },
  { key: 'discount_requested', label: 'Discount Requested' },
  { key: 'quote_accepted', label: 'Quote Accepted' },
  { key: 'engagement_sent', label: 'Engagement Sent' },
  { key: 'invoice_sent', label: 'Invoice Sent' },
  { key: 'payment_date_confirmed', label: 'Payment Date Confirmed' },
  { key: 'won', label: 'Won' }
];

export default function ProspectsView({ 
  prospects, 
  onAddProspect, 
  onUpdateProspect,
  onMoveStage,
  onOpenProject,
  onScheduleFollowUp,
  onDeleteProspect,
  onMarkProspectLost,
  onSetProspectTags
}: ProspectsViewProps) {
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'pipeline' | 'list'>('pipeline');
  const [autoMode, setAutoMode] = useState(true); // if true, auto-switch based on viewport width
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedSalesperson, setSelectedSalesperson] = useState<number | null>(null);
  const [collapsedStages, setCollapsedStages] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importPreviewOpen, setImportPreviewOpen] = useState(false);
  const [importPreviewRows, setImportPreviewRows] = useState<any[]>([]);
  const [importingFile, setImportingFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const res = await fetch(`${API_BASE}/employees`);
      const data = res.ok ? await res.json() : [];
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading employees:', err);
    }
  };

  const filteredProspects = prospects.filter(p => {
    const matchesSalesperson = selectedSalesperson ? p.assigned_to === selectedSalesperson : true;
    const matchesSearch = searchTerm ? (
      (p.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.last_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.deal_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.source || '').toLowerCase().includes(searchTerm.toLowerCase())
    ) : true;
    return matchesSalesperson && matchesSearch;
  });

  function exportToCsv(filename: string, rows: any[]) {
    if (!rows || rows.length === 0) {
      toast({ title: 'No data to export' });
      return;
    }
    
    const keys = Object.keys(rows[0]);
    
    // Create HTML table format that Excel will parse correctly
    let html = '<table><thead><tr>';
    
    // Add header row
    for (const key of keys) {
      const escapedKey = String(key).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      html += `<th>${escapedKey}</th>`;
    }
    html += '</tr></thead><tbody>';
    
    // Add data rows
    for (const row of rows) {
      html += '<tr>';
      for (const key of keys) {
        const value = row[key];
        const escapedValue = String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        html += `<td>${escapedValue}</td>`;
      }
      html += '</tr>';
    }
    html += '</tbody></table>';
    
    // Create blob with HTML content (Excel recognizes this format)
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename.replace('.csv', '.xls'));
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  useEffect(() => {
    // decide initial mode based on viewport width
    const applyMode = () => {
      if (!autoMode) return;
      const w = window.innerWidth;
      // treat widths < 768px as mobile -> list view
      setViewMode(w < 768 ? 'list' : 'pipeline');
    };
    applyMode();
    const onResize = () => applyMode();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [autoMode]);

  // Wrapper to handle confirmation + toast when marking won
  const [confirmWonOpen, setConfirmWonOpen] = useState(false);
  const [confirmingProspectId, setConfirmingProspectId] = useState<string | null>(null);

  const openConfirmWon = (prospectId: string) => {
    setConfirmingProspectId(prospectId);
    setConfirmWonOpen(true);
  };

  const performMarkWon = async () => {
    const prospectId = confirmingProspectId;
    setConfirmWonOpen(false);
    setConfirmingProspectId(null);
    if (!prospectId) return;
    try {
      const result = await onMoveStage(prospectId, 'closed_won');
      if (result && result.autoCreatedProject) {
        const ap = result.autoCreatedProject;
        if (typeof onOpenProject === 'function' && ap.projectId) {
          toast({
            title: 'Project created',
            description: `Project ID: ${ap.projectId} • ${ap.folderName || 'Folder created'}`,
            action: (
              <button
                onClick={() => onOpenProject(String(ap.projectId))}
                className="px-3 py-1 bg-white text-sm rounded"
              >
                Open project
              </button>
            ),
          });
          return;
        }
        toast({ title: 'Project created', description: `Project ID: ${ap.projectId} • ${ap.folderName || 'Folder created'}` });
      } else {
        toast({ title: 'Prospect marked as won.' });
      }
    } catch (err) {
      console.error('Error marking won:', err);
      toast({ title: 'Failed to mark prospect as won', variant: 'destructive' });
    }
  };

  const wrappedMoveStage = async (prospectId: string, toStage: string) => {
    // For pipeline interactions, send the stage change immediately.
    // The tabular view still uses the explicit confirm modal via openConfirmWon.
    await onMoveStage(prospectId, toStage);
  };

  const toggleStageCollapse = (stageKey: string) => {
    const newCollapsed = new Set(collapsedStages);
    if (newCollapsed.has(stageKey)) {
      newCollapsed.delete(stageKey);
    } else {
      newCollapsed.add(stageKey);
    }
    setCollapsedStages(newCollapsed);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Sales Pipeline</h2>
      </div>

      <PipelineStats prospects={filteredProspects} />

      <div className="flex flex-col gap-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search prospects by name, company, email, or source..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => { setViewMode('pipeline'); setAutoMode(false); }}
              className={`px-3 py-1 rounded ${viewMode === 'pipeline' ? 'bg-white shadow' : ''}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setViewMode('list'); setAutoMode(false); }}
              className={`px-3 py-1 rounded ${viewMode === 'list' ? 'bg-white shadow' : ''}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-2 items-center flex-wrap">
            <label className="text-sm font-medium text-gray-700">Filter by Salesperson:</label>
            <select
              value={selectedSalesperson || ''}
              onChange={(e) => setSelectedSalesperson(e.target.value ? parseInt(e.target.value) : null)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Salespersons</option>
              {employees.map(emp => {
                const empId = emp.employee_id || emp.id;
                const empName = emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim();
                return (
                  <option key={empId} value={empId}>
                    {empName}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex items-center gap-2">
          <button
            onClick={() => exportToCsv('prospects.csv', filteredProspects)}
            className="px-3 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            Export
          </button>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setImportingFile(f);
              // First perform a dry-run to preview mapping
              const fd = new FormData();
              fd.append('file', f);
              fd.append('target', 'prospects');
              fd.append('dryRun', 'true');
              try {
                const res = await fetch('/api/import', { method: 'POST', body: fd });
                let json;
                const ct = res.headers.get('content-type') || '';
                if (ct.includes('application/json')) {
                  json = await res.json();
                } else {
                  const txt = await res.text();
                  try { json = JSON.parse(txt); } catch { json = { error: txt }; }
                }
                if (res.ok && json && json.result && json.result.mappedRows) {
                  // pick the first sheet key
                  const sheetKeys = Object.keys(json.result.mappedRows);
                  if (sheetKeys.length > 0) {
                    const mapped = json.result.mappedRows[sheetKeys[0]].prospects || [];
                    setImportPreviewRows(mapped || []);
                    setImportPreviewOpen(true);
                  } else {
                    toast({ title: 'No mapped rows returned', variant: 'destructive' });
                  }
                } else {
                  toast({ title: 'Dry-run failed', description: json.error || 'Server error', variant: 'destructive' });
                }
              } catch (err) {
                console.error(err);
                toast({ title: 'Dry-run failed', variant: 'destructive' });
              }
              (e.target as HTMLInputElement).value = '';
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            Import
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            Add Prospect
          </button>
        </div>
      </div>
      </div>

      {viewMode === 'pipeline' ? (

        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {PIPELINE_STAGES.map(stage => (
              <PipelineColumn
                key={stage.key}
                stage={stage.key}
                title={stage.label}
                prospects={filteredProspects}
                onProspectClick={setSelectedProspect}
                onMoveStage={wrappedMoveStage}
                isCollapsed={collapsedStages.has(stage.key)}
                onToggleCollapse={() => toggleStageCollapse(stage.key)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quote</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProspects.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 cursor-pointer" onClick={() => setSelectedProspect(p)}>{p.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <select
                        value={p.pipeline_stage}
                        onChange={(e) => wrappedMoveStage(p.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                      >
                        {PIPELINE_STAGES.map(stage => (
                          <option key={stage.key} value={stage.key}>
                            {stage.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer" onClick={() => setSelectedProspect(p)}>
                      {p.quote_amount ? `R${Number(p.quote_amount).toLocaleString()}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex gap-2">
                        <button onClick={() => openConfirmWon(p.id)} className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">Mark Won</button>
                        <button onClick={() => setSelectedProspect(p)} className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200">Details</button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      <AddProspectModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={onAddProspect}
      />

      <ProspectDetailModal
        prospect={selectedProspect}
        isOpen={!!selectedProspect}
        onClose={() => setSelectedProspect(null)}
        onUpdate={onUpdateProspect}
        onScheduleFollowUp={onScheduleFollowUp}
        onDelete={onDeleteProspect}
        onMarkLost={onMarkProspectLost}
        onSetTags={onSetProspectTags}
      />

      <Dialog open={confirmWonOpen} onOpenChange={setConfirmWonOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm</DialogTitle>
            <DialogDescription>Mark this prospect as WON and convert to a project?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <div className="flex gap-2 justify-end">
              <button className="px-3 py-1 rounded bg-gray-100" onClick={() => setConfirmWonOpen(false)}>Cancel</button>
              <button className="px-3 py-1 rounded bg-green-600 text-white" onClick={performMarkWon}>Mark Won</button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={importPreviewOpen} onOpenChange={setImportPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Import Preview</DialogTitle>
            <DialogDescription>Preview of mapped rows (first 50). Confirm to run actual import.</DialogDescription>
          </DialogHeader>
          <div className="mt-4 max-h-80 overflow-auto">
            {importPreviewRows.length === 0 ? (
              <div className="text-sm text-gray-600">No rows to preview.</div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    {Object.keys(importPreviewRows[0]).map(k => (
                      <th key={k} className="px-2 py-1 text-left font-medium text-gray-600">{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {importPreviewRows.slice(0,50).map((r, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {Object.keys(importPreviewRows[0]).map(k => (
                        <td key={k} className="px-2 py-1">{String(r[k] ?? '')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <DialogFooter>
            <div className="flex gap-2 justify-end">
              <button className="px-3 py-1 rounded bg-gray-100" onClick={() => { setImportPreviewOpen(false); setImportPreviewRows([]); setImportingFile(null); }}>Cancel</button>
              <button className="px-3 py-1 rounded bg-teal-600 text-white" onClick={async () => {
                if (!importingFile) return;
                const fd = new FormData();
                fd.append('file', importingFile);
                fd.append('target', 'prospects');
                try {
                  const res = await fetch('/api/import', { method: 'POST', body: fd });
                  let json;
                  const ct = res.headers.get('content-type') || '';
                  if (ct.includes('application/json')) {
                    json = await res.json();
                  } else {
                    const txt = await res.text();
                    try { json = JSON.parse(txt); } catch { json = { error: txt }; }
                  }
                  if (res.ok) {
                    toast({ title: 'Import complete', description: JSON.stringify(json.result) });
                    setImportPreviewOpen(false);
                    setImportPreviewRows([]);
                    setImportingFile(null);
                  } else {
                    toast({ title: 'Import failed', description: json.error || 'Server error', variant: 'destructive' });
                  }
                } catch (err) {
                  console.error(err);
                  toast({ title: 'Import failed', variant: 'destructive' });
                }
              }}>Confirm Import</button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
