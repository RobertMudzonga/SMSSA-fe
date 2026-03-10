import { useMemo } from 'react';
import { calculateExpectedDates } from '@/utils/progressCalculations';
import { AlertCircle } from 'lucide-react';

interface GanttChartProps {
  projects: any[];
}

export default function GanttChart({ projects }: GanttChartProps) {
  const activeProjects = projects.filter(p => p.status !== 'completed' && p.start_date);

  const chartData = useMemo(() => {
    if (activeProjects.length === 0) return null;

    const allDates = activeProjects.map(p => {
      const dates = calculateExpectedDates(p.project_type, new Date(p.start_date));
      return dates ? [new Date(p.start_date), dates.expectedCompletion] : [];
    }).flat();

    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
    const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));

    return { minDate, maxDate, totalDays };
  }, [activeProjects]);

  if (!chartData || activeProjects.length === 0) {
    return <div className="text-center py-12 text-gray-500">No active projects with start dates</div>;
  }

  const { minDate, totalDays } = chartData;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 overflow-x-auto">
      <h3 className="text-lg font-semibold mb-4">Project Timeline (Gantt Chart)</h3>
      
      <div className="min-w-[800px]">
        {activeProjects.map(project => {
          const dates = calculateExpectedDates(project.project_type, new Date(project.start_date));
          if (!dates) return null;

          const startOffset = Math.floor((new Date(project.start_date).getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
          const compWidth = (dates.compilationDays / totalDays) * 100;
          const procWidth = (dates.processingDays / totalDays) * 100;
          const startPos = (startOffset / totalDays) * 100;

          return (
            <div key={project.id} className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium w-48 truncate">{project.project_name}</span>
                <span className="text-xs text-gray-500">{project.project_type}</span>
              </div>
              
              <div className="relative h-10 bg-gray-100 rounded">
                <div 
                  className="absolute h-full bg-blue-500 rounded-l"
                  style={{ left: `${startPos}%`, width: `${compWidth}%` }}
                  title="Compilation Phase"
                />
                <div 
                  className="absolute h-full bg-teal-500 rounded-r"
                  style={{ left: `${startPos + compWidth}%`, width: `${procWidth}%` }}
                  title="Processing Phase"
                />
              </div>
              
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Start: {new Date(project.start_date).toLocaleDateString()}</span>
                <span>Expected: {dates.expectedCompletion.toLocaleDateString()}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-6 mt-6 pt-4 border-t">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="text-sm">Compilation</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-teal-500 rounded"></div>
          <span className="text-sm">Processing</span>
        </div>
      </div>
    </div>
  );
}
