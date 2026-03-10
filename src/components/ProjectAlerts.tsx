import { AlertCircle, Clock } from 'lucide-react';
import { isProjectBehindSchedule, calculateExpectedDates } from '@/utils/progressCalculations';

interface ProjectAlertsProps {
  projects: any[];
}

export default function ProjectAlerts({ projects }: ProjectAlertsProps) {
  const behindSchedule = projects.filter(p => isProjectBehindSchedule(p));

  if (behindSchedule.length === 0) {
    return null;
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="w-5 h-5 text-red-600" />
        <h3 className="font-semibold text-red-900">Projects Behind Schedule ({behindSchedule.length})</h3>
      </div>
      
      <div className="space-y-2">
        {behindSchedule.map(project => {
          const dates = calculateExpectedDates(project.project_type, new Date(project.start_date));
          return (
            <div key={project.id} className="flex items-center justify-between bg-white p-3 rounded border border-red-100">
              <div>
                <p className="font-medium text-gray-900">{project.project_name}</p>
                <p className="text-sm text-gray-600">{project.project_type}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-red-600">
                <Clock className="w-4 h-4" />
                <span>Expected: {dates?.expectedCompletion.toLocaleDateString()}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
