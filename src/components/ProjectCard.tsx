import StatusBadge from './StatusBadge';
import { visaTimelines } from '@/utils/visaTimelines';
import { calculateExpectedDates, isProjectBehindSchedule } from '@/utils/progressCalculations';
import { Calendar, AlertCircle, FileCheck, Link2, Copy } from 'lucide-react';
import { Button } from './ui/button';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';


interface ProjectCardProps {
  project: any;
  onClick: () => void;
  isSelected?: boolean;
  onSelectionChange?: (selected: boolean) => void;
}

export default function ProjectCard({ project, onClick, isSelected = false, onSelectionChange }: ProjectCardProps) {
  const [generatingAccess, setGeneratingAccess] = useState(false);
  const [portalUrl, setPortalUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const priorityColor = {
    high: 'text-red-600',
    medium: 'text-yellow-600',
    low: 'text-green-600'
  }[project.priority] || 'text-gray-600';

  const timeline = visaTimelines[project?.case_type || project?.project_type];
  const isBehind = isProjectBehindSchedule(project);
  const expectedDates = project?.start_date ? calculateExpectedDates(project.case_type || project.project_type, new Date(project.start_date)) : null;
  const safePriority = String(project?.priority ?? '');
  const displayPriority = safePriority.toUpperCase();
  const progress = Number(project?.progress) || 0;
  // If explicit progress not provided, derive from stage/current_stage
  const stageNum = Number(project?.current_stage ?? project?.stage ?? project?.stage_number ?? 0) || 0;
  const derivedProgress = stageNum > 0 ? Math.round(((stageNum - 1) / (6 - 1)) * 100) : 0;
  const displayProgress = progress > 0 ? progress : derivedProgress;
  const paymentAmountVal = typeof project?.payment_amount !== 'undefined' && project?.payment_amount !== null ? Number(project.payment_amount) : null;
  const formattedPayment = paymentAmountVal !== null && !isNaN(paymentAmountVal) ? new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(paymentAmountVal) : null;
  
  const handleGenerateAccess = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setGeneratingAccess(true);
    const { user } = useAuth();
    try {
      const resp = await fetch('/api/functions/generate-client-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || (localStorage.getItem('userEmail') || '')
        },
        body: JSON.stringify({ projectId: project.project_id || project.id, clientEmail: project.client_email, expiryDays: 90 })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || 'Failed to generate access');
      setPortalUrl(data.portalUrl);
      navigator.clipboard.writeText(data.portalUrl);
      toast({ title: 'Client portal link copied to clipboard!' });
    } catch (error) {
      console.error('Error generating access:', error);
      toast({ title: 'Failed to generate client portal access', variant: 'destructive' });
    } finally {
      setGeneratingAccess(false);
    }
  };

  const handleDeleteProject = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const id = project.project_id || project.id;
    if (!id) return;
    if (!confirm(`Delete project ${project.project_name || `Project ${id}`}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Delete failed: ${res.status}`);
      toast({ title: 'Project deleted' });
      // notify other parts of the app to refresh
      try { window.dispatchEvent(new CustomEvent('project:deleted', { detail: { projectId: id } })); } catch (e) { window.location.reload(); }
    } catch (err) {
      console.error('Delete failed:', err);
      toast({ title: 'Failed to delete project', description: String(err), variant: 'destructive' });
    }
  };

  
  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow cursor-pointer ${isBehind ? 'border-red-300 bg-red-50' : 'border-gray-200'} ${isSelected ? 'ring-2 ring-teal-500 border-teal-500' : ''}`}
    >
      {isBehind && (
        <div className="flex items-center gap-1 text-red-600 text-xs font-medium mb-2">
          <AlertCircle className="w-3 h-3" />
          <span>Behind Schedule</span>
        </div>
      )}
      
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onSelectionChange?.(e.target.checked);
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-5 h-5 mt-0.5 cursor-pointer accent-teal-600"
          />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{project.project_name || 'Unnamed Project'}</h3>
            <p className="text-sm text-gray-600">{project.case_type || project.project_type}</p>
            {project.client_name && <p className="text-sm text-gray-600 mt-1">Client: {project.client_name}</p>}
            {project.project_manager_name && (
              <p className="text-sm text-gray-600 mt-1">Manager: {project.project_manager_name}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={project.status} type="project" />
          {/* Payment Status Indicator */}
          {project.payment_status && (
            <>
              <div className="text-xs text-gray-600 mt-1">
                {project.payment_status === 'fully_paid' && <span className="text-green-600 font-medium">✓ Paid</span>}
                {project.payment_status === 'partially_paid' && <span className="text-orange-600 font-medium">⊘ Partial</span>}
                {project.payment_status === 'pending' && <span className="text-gray-600 font-medium">○ Pending</span>}
              </div>
              {project.remaining_balance && project.remaining_balance > 0 && (
                <div className="text-xs text-gray-500">Balance: {new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(project.remaining_balance)}</div>
              )}
            </>
          )}
          {!project.payment_status && formattedPayment && (
            <>
              <div className="text-xs text-gray-600">Quote:</div>
              <div className="text-sm text-gray-700 font-medium">{formattedPayment}</div>
            </>
          )}
        </div>
      </div>
      
      <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium">{displayProgress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-teal-500 h-2 rounded-full transition-all"
            style={{ width: `${displayProgress}%` }}
          />
        </div>
      </div>

      {timeline && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Compilation:</span>
            <span className="text-gray-700 font-medium">{timeline.compilation}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Processing:</span>
            <span className="text-gray-700 font-medium">{timeline.processing}</span>
          </div>
        </div>
      )}
      
      <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <p className={`text-xs font-medium ${priorityColor}`}>
            {displayPriority} PRIORITY
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="gap-1 text-xs h-7 flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <FileCheck className="w-3 h-3" />
            Checklist
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="gap-1 text-xs h-7 flex-1"
            onClick={handleGenerateAccess}
            disabled={generatingAccess}
          >
            <Link2 className="w-3 h-3" />
            {generatingAccess ? 'Generating...' : 'Client Portal'}
          </Button>
          <button
            onClick={handleDeleteProject}
            className="px-2 text-xs h-7 rounded bg-red-600 text-white hover:bg-red-700 flex-1"
          >
            Delete
          </button>
        </div>
      </div>

    </div>
  );
}
