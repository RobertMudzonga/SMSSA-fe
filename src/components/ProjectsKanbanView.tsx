import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

interface ProjectsKanbanViewProps {
  projects: any[];
  onProjectClick?: (id: string) => void;
  onRefresh?: () => void;
}

const STAGE_COLUMNS: { key: string; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'on_hold', label: 'On Hold' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'completed', label: 'Completed' }
];

function mapProjectToColumn(project: any) {
  // Prefer explicit status, otherwise infer from current_stage/current_stage_id
  const status = (project.status || project.current_stage || project.current_stage_id || '').toString().toLowerCase();
  if (status === 'cancelled' || status === 'canceled' || status === 'cancel' || status === '-1') return 'cancelled';
  if (status === 'completed' || status === '6' || status === 'done') return 'completed';
  if (status === 'in-progress' || status === 'in_progress' || status === '3') return 'in_progress';
  if (status === 'on-hold' || status === 'on_hold') return 'on_hold';
  if (status === 'active' || status === '1' || status === '2') return 'active';
  return 'active';
}

export default function ProjectsKanbanView({ projects, onProjectClick, onRefresh }: ProjectsKanbanViewProps) {
  const [stages, setStages] = useState<any[]>([]);
  const columns: Record<string, any[]> = { active: [], in_progress: [], on_hold: [], cancelled: [], completed: [] };
  for (const p of projects) {
    const col = mapProjectToColumn(p);
    columns[col].push(p);
  }

  // For projects we use a fixed set of project tasks (1..6). No prospect stages.
  useEffect(() => {
    const tasks = [
      { stage_id: 1, name: '1. New Client' },
      { stage_id: 2, name: '2. Document Preparation' },
      { stage_id: 3, name: '3. Submission' },
      { stage_id: 4, name: '4. Submission Status' },
      { stage_id: 5, name: '5. Tracking' },
      { stage_id: 6, name: '6. Completed' }
    ];
    setStages(tasks as any[]);
  }, []);

  const applyStageToProject = async (projectId: number | string, stageId: number) => {
    try {
      // Update current_stage (task) and let backend set status/progress as needed
      const resp = await fetch(`/api/projects/${projectId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_stage: stageId })
      });
      if (resp.ok) {
        if (onRefresh) onRefresh();
      } else {
        const err = await resp.json().catch(() => null);
        alert(`Failed to update stage: ${err?.error || resp.status}`);
      }
    } catch (err) {
      alert('Network error updating stage');
    }
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const fromId = result.source.droppableId;
    const toId = result.destination.droppableId;
    if (fromId === toId) return; // no-op

    // Ask user to pick a stage for the destination column
    // Map destination column to a project status.
    const statusMap: Record<string,string> = {
      active: 'Active',
      submitted: 'Submitted',
      on_hold: 'On Hold',
      cancelled: 'Cancelled',
      completed: 'Completed'
    };

    const statusToSet = statusMap[toId] || 'Active';

    // determine which project was moved
    const projIndex = result.source.index;
    const project = columns[fromId][projIndex];
    if (!project) return;

    try {
      const resp = await fetch(`/api/projects/${project.project_id || project.id}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusToSet })
      });
      if (resp.ok) {
        if (onRefresh) onRefresh();
      } else {
        const err = await resp.json().catch(() => null);
        alert(`Failed to update status: ${err?.error || resp.status}`);
      }
    } catch (err) {
      alert('Network error updating status');
    }
  };

  return (
    <div className="w-full">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {STAGE_COLUMNS.map(col => (
            <Droppable droppableId={col.key} key={col.key}>
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="bg-white rounded border p-3 flex flex-col">
                  <div className="font-semibold mb-2">{col.label} <span className="text-sm text-gray-500">({columns[col.key].length})</span></div>
                  <div className="flex-1 space-y-2 overflow-y-auto max-h-[60vh]">
                    {columns[col.key].map((project: any, idx: number) => (
                      <Draggable key={project.project_id || project.id} draggableId= {String(project.project_id || project.id)} index={idx}>
                        {(dr) => (
                          <div ref={dr.innerRef} {...dr.draggableProps} {...dr.dragHandleProps} className="p-3 border rounded bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">{project.project_name || project.name || `Project ${project.project_id || project.id}`}</div>
                                <div className="text-sm text-gray-500">{project.client_name || project.company || ''}</div>
                              </div>
                              <div className="flex flex-col items-end">
                                <button onClick={() => onProjectClick?.(String(project.project_id || project.id))} className="text-xs px-2 py-1 bg-white border rounded">Open</button>
                                <div className="mt-2">
                                  <select
                                    value={project.current_stage || ''}
                                    onChange={(e) => applyStageToProject(String(project.project_id || project.id), Number(e.target.value))}
                                    className="text-xs px-2 py-1 bg-white border rounded"
                                  >
                                    <option value="">Set stage</option>
                                    {stages.map(s => (
                                      <option key={s.stage_id} value={s.stage_id}>{s.name}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
