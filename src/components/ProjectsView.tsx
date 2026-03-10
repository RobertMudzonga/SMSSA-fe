import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import ProjectCard from './ProjectCard';
import CreateProjectModal from './CreateProjectModal';
import ImportProjectsModal from './ImportProjectsModal';
import GanttChart from './GanttChart';
import { LayoutGrid, BarChart3, Search } from 'lucide-react';
import ProjectsKanbanView from './ProjectsKanbanView';

interface ProjectsViewProps {
  projects: any[];
  onCreateProject: (data: any) => void;
  onProjectClick: (projectId: string) => void;
  onRefresh?: () => void;
  employees?: any[];
}

export default function ProjectsView({ projects, onCreateProject, onProjectClick, onRefresh, employees = [] }: ProjectsViewProps) {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterVisaType, setFilterVisaType] = useState('all');
  const [filterProjectManager, setFilterProjectManager] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'gantt' | 'kanban'>('grid');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importPreviewOpen, setImportPreviewOpen] = useState(false);
  const [importPreviewRows, setImportPreviewRows] = useState<any[]>([]);
  const [importingFile, setImportingFile] = useState<File | null>(null);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());


  const safeProjects = Array.isArray(projects) ? projects : [];

  // Extract unique visa types and project managers from projects
  const uniqueVisaTypes = Array.from(new Set(safeProjects.map(p => p?.case_type).filter(Boolean))).sort();
  const uniqueProjectManagers = Array.from(new Set(safeProjects.map(p => p?.project_manager_name).filter(Boolean))).sort();

  // Listen for stage-updated events and trigger a refresh if provided
  useEffect(() => {
    const handler = (e: any) => {
      try {
        if (typeof onRefresh === 'function') onRefresh();
      } catch (err) {}
    };
    window.addEventListener('project:stage-updated', handler);
    const delHandler = (e: any) => {
      try { if (typeof onRefresh === 'function') onRefresh(); } catch (err) {}
    };
    window.addEventListener('project:deleted', delHandler);
    return () => {
      window.removeEventListener('project:stage-updated', handler);
      window.removeEventListener('project:deleted', delHandler);
    };
  }, [onRefresh]);

  const filteredProjects = safeProjects.filter(p => {
    const name = (p && (p.project_name || p.name || ''));
    const clientName = (p && (p.client_name || '')).toString();
    const clientEmail = (p && (p.client_email || '')).toString();
    const status = (p && (p.status || '')).toString();
    const caseType = (p && (p.case_type || '')).toString();
    const managerName = (p && (p.project_manager_name || '')).toString();
    
    const matchesSearch = searchTerm ? (
      name.toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      clientName.toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      clientEmail.toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      caseType.toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      managerName.toLowerCase().includes((searchTerm || '').toLowerCase())
    ) : true;
    const matchesStatus = filterStatus === 'all' || status.toLowerCase() === filterStatus.toLowerCase();
    const matchesVisaType = filterVisaType === 'all' || caseType === filterVisaType;
    const matchesManager = filterProjectManager === 'all' || managerName === filterProjectManager;
    
    return matchesSearch && matchesStatus && matchesVisaType && matchesManager;
  });

  // Selection functions
  const toggleProjectSelection = (projectId: string) => {
    const newSelected = new Set(selectedProjects);
    if (newSelected.has(projectId)) {
      newSelected.delete(projectId);
    } else {
      newSelected.add(projectId);
    }
    setSelectedProjects(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedProjects.size === filteredProjects.length && filteredProjects.length > 0) {
      setSelectedProjects(new Set());
    } else {
      const allIds = new Set(
        filteredProjects.map((p, idx) => String(p?.project_id || p?.id || p?.projectId || idx))
      );
      setSelectedProjects(allIds);
    }
  };

  const isAllSelected = filteredProjects.length > 0 && selectedProjects.size === filteredProjects.length;
  const isIndeterminate = selectedProjects.size > 0 && selectedProjects.size < filteredProjects.length;

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

  const handleDeleteAll = async () => {
    if (selectedProjects.size === 0) {
      toast({ title: 'No projects selected', variant: 'destructive' });
      return;
    }

    if (!confirm(`Delete ${selectedProjects.size} project${selectedProjects.size !== 1 ? 's' : ''}? This cannot be undone.`)) {
      return;
    }

    try {
      const projectIds = Array.from(selectedProjects);
      let successCount = 0;
      let failureCount = 0;

      for (const projectId of projectIds) {
        try {
          const res = await fetch(`/projects/${projectId}`, { method: 'DELETE' });
          const json = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(json?.error || `Delete failed: ${res.status}`);
          successCount++;
        } catch (err) {
          console.error(`Failed to delete project ${projectId}:`, err);
          failureCount++;
        }
      }

      setSelectedProjects(new Set());
      if (typeof onRefresh === 'function') onRefresh();

      if (failureCount === 0) {
        toast({ title: `Successfully deleted ${successCount} project${successCount !== 1 ? 's' : ''}` });
      } else {
        toast({
          title: `Deletion complete with errors`,
          description: `Deleted: ${successCount}, Failed: ${failureCount}`,
          variant: 'destructive'
        });
      }
    } catch (err) {
      console.error('Delete all failed:', err);
      toast({ title: 'Failed to delete projects', description: String(err), variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
        <div className="flex gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 rounded flex items-center gap-2 ${viewMode === 'grid' ? 'bg-white shadow' : ''}`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="text-sm">Grid</span>
            </button>
            <button
              onClick={() => setViewMode('gantt')}
              className={`px-3 py-2 rounded flex items-center gap-2 ${viewMode === 'gantt' ? 'bg-white shadow' : ''}`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm">Timeline</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-2 rounded flex items-center gap-2 ${viewMode === 'kanban' ? 'bg-white shadow' : ''}`}
            >
              <span className="text-sm">Kanban</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportToCsv('projects.csv', filteredProjects)}
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
                const fd = new FormData();
                fd.append('file', f);
                fd.append('target', 'projects');
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
                    const sheetKeys = Object.keys(json.result.mappedRows);
                    if (sheetKeys.length > 0) {
                      const mapped = json.result.mappedRows[sheetKeys[0]].projects || [];
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
              onClick={() => setIsImportModalOpen(true)}
              className="px-3 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Import
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              Create Project
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects by name, client, email, case type, or manager..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        
        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="submitted">Submitted</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={filterVisaType}
            onChange={(e) => setFilterVisaType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All Visa Types</option>
            {uniqueVisaTypes.map((visaType) => (
              <option key={visaType} value={visaType}>{visaType}</option>
            ))}
          </select>
          <select
            value={filterProjectManager}
            onChange={(e) => setFilterProjectManager(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All Project Managers</option>
            {uniqueProjectManagers.map((manager) => (
              <option key={manager} value={manager}>{manager}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="select-all"
            checked={isAllSelected}
            ref={(el) => {
              if (el) el.indeterminate = isIndeterminate;
            }}
            onChange={toggleSelectAll}
            className="w-5 h-5 cursor-pointer accent-teal-600"
          />
          <label htmlFor="select-all" className="cursor-pointer font-medium text-gray-700">
            Select All
          </label>
        </div>
        {selectedProjects.size > 0 && (
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600 font-medium">
              {selectedProjects.size} project{selectedProjects.size !== 1 ? 's' : ''} selected
            </div>
            <button
              onClick={handleDeleteAll}
              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete All
            </button>
          </div>
        )}
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project, idx) => {
            const projectId = String(project?.project_id || project?.id || project?.projectId || idx);
            // Use project_id for React key to ensure uniqueness (project_name can be null/duplicate)
            const uniqueKey = `project-${projectId}`;
            return (
              <ProjectCard 
                key={uniqueKey}
                project={project}
                onClick={() => onProjectClick(projectId)}
                isSelected={selectedProjects.has(projectId)}
                onSelectionChange={(selected) => {
                  if (selected) {
                    const newSelected = new Set(selectedProjects);
                    newSelected.add(projectId);
                    setSelectedProjects(newSelected);
                  } else {
                    const newSelected = new Set(selectedProjects);
                    newSelected.delete(projectId);
                    setSelectedProjects(newSelected);
                  }
                }}
              />
            );
          })}
        </div>
      ) : viewMode === 'gantt' ? (
        <GanttChart projects={filteredProjects} />
      ) : (
        <ProjectsKanbanView projects={filteredProjects} onProjectClick={onProjectClick} onRefresh={onCreateProject as any} />
      )}


      <CreateProjectModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(data) => {
          onCreateProject(data);
          setIsModalOpen(false);
        }}
        employees={employees}
      />
      
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
                fd.append('target', 'projects');
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
                    if (typeof onRefresh === 'function') onRefresh();
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

      <ImportProjectsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          if (typeof onRefresh === 'function') onRefresh();
          setIsImportModalOpen(false);
        }}
      />
      
    </div>
  );
}

