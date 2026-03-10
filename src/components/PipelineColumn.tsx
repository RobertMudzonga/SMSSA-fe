import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import PipelineProspectCard from './PipelineProspectCard';

interface PipelineColumnProps {
  stage: string;
  title: string;
  prospects: any[];
  onProspectClick: (prospect: any) => void;
  onMoveStage: (prospectId: string, toStage: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function PipelineColumn({ 
  stage, 
  title, 
  prospects, 
  onProspectClick,
  onMoveStage,
  isCollapsed = false,
  onToggleCollapse
}: PipelineColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const stageProspects = useMemo(() => 
    prospects.filter(p => p.pipeline_stage === stage),
    [prospects, stage]
  );

  const totalValue = useMemo(() => 
    stageProspects.reduce((sum, p) => sum + (p.quote_amount || 0), 0),
    [stageProspects]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const prospectId = e.dataTransfer.getData('prospectId');
    const fromStage = e.dataTransfer.getData('fromStage');
    
    if (prospectId && fromStage !== stage) {
      await onMoveStage(prospectId, stage);
    }
  };

  return (
    <div 
      className={`flex-shrink-0 ${isCollapsed ? 'w-24' : 'w-80'} bg-gray-50 rounded-lg p-4 transition-all duration-300 ${isDragOver && !isCollapsed ? 'bg-teal-50 ring-2 ring-teal-400' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <h3 className={`font-semibold text-gray-900 ${isCollapsed ? 'truncate text-xs' : ''}`}>{title}</h3>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {!isCollapsed && (
            <>
              <span className="px-2 py-1 bg-teal-100 text-teal-700 rounded text-sm font-medium whitespace-nowrap">
                {stageProspects.length}
              </span>
              {totalValue > 0 && (
                <span className="text-xs text-gray-600 whitespace-nowrap">
                  R{(totalValue / 1000).toFixed(0)}k
                </span>
              )}
            </>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse?.();
            }}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? (
              <ChevronUp className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            )}
          </button>
        </div>
      </div>
      
      {!isCollapsed && (
        <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto">
          {stageProspects.map(prospect => (
            <PipelineProspectCard
              key={prospect.id}
              prospect={prospect}
              onClick={() => onProspectClick(prospect)}
              onMoveStage={onMoveStage}
              currentStage={stage}
            />
          ))}
        </div>
      )}
      
      {isCollapsed && stageProspects.length > 0 && (
        <div className="text-center text-xs font-semibold text-teal-700 bg-teal-50 rounded px-2 py-1">
          {stageProspects.length}
        </div>
      )}
    </div>
  );
}
