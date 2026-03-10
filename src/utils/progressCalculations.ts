import { visaTimelines } from './visaTimelines';

export function parseTimeRange(timeStr: string): { min: number; max: number; unit: 'days' | 'weeks' | 'months' | 'years' } {
  const cleaned = timeStr.toLowerCase().trim();
  
  if (cleaned.startsWith('<')) {
    const num = parseInt(cleaned.replace('<', ''));
    return { min: 0, max: num, unit: cleaned.includes('day') ? 'days' : 'weeks' };
  }
  
  if (cleaned.startsWith('>')) {
    const num = parseInt(cleaned.replace('>', ''));
    return { min: num, max: num * 1.5, unit: cleaned.includes('year') ? 'years' : 'months' };
  }
  
  const match = cleaned.match(/(\d+)\s*[-–]\s*(\d+)\s*(day|week|month|year)/);
  if (match) {
    return { 
      min: parseInt(match[1]), 
      max: parseInt(match[2]), 
      unit: match[3] + 's' as any 
    };
  }
  
  return { min: 0, max: 0, unit: 'days' };
}

export function convertToDays(value: number, unit: string): number {
  switch (unit) {
    case 'days': return value;
    case 'weeks': return value * 7;
    case 'months': return value * 30;
    case 'years': return value * 365;
    default: return value;
  }
}

export function calculateExpectedDates(projectType: string, startDate: Date) {
  const timeline = visaTimelines[projectType];
  if (!timeline) return null;
  
  const comp = parseTimeRange(timeline.compilation);
  const proc = parseTimeRange(timeline.processing);
  
  const compilationDays = convertToDays((comp.min + comp.max) / 2, comp.unit);
  const processingDays = convertToDays((proc.min + proc.max) / 2, proc.unit);
  
  const compilationEnd = new Date(startDate);
  compilationEnd.setDate(compilationEnd.getDate() + compilationDays);
  
  const expectedCompletion = new Date(compilationEnd);
  expectedCompletion.setDate(expectedCompletion.getDate() + processingDays);
  
  return {
    compilationEnd,
    expectedCompletion,
    compilationDays,
    processingDays,
    totalDays: compilationDays + processingDays
  };
}

export function calculateProgress(project: any): number {
  if (!project.start_date) return 0;
  
  // Use case_type from database (project_type is an alias)
  const projectType = project.project_type || project.case_type;
  if (!projectType) return 0;
  
  const dates = calculateExpectedDates(projectType, new Date(project.start_date));
  if (!dates) return 0;
  
  const now = new Date();
  const start = new Date(project.start_date);
  const daysPassed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  return Math.min(100, Math.max(0, (daysPassed / dates.totalDays) * 100));
}

export function isProjectBehindSchedule(project: any): boolean {
  if (!project.start_date || project.status === 'completed') return false;
  
  const actualProgress = calculateProgress(project);
  const expectedProgress = project.progress || 0;
  
  return actualProgress > expectedProgress + 10;
}
