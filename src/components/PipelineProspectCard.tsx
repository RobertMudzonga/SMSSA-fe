import { Calendar, Mail, Phone, GripHorizontal } from 'lucide-react';
import { useState } from 'react';

interface PipelineProspectCardProps {
  prospect: any;
  onClick: () => void;
  onMoveStage: (prospectId: string, toStage: string) => void;
  currentStage: string;
}

const STAGE_ORDER = [
  'opportunity', 'quote_requested', 'quote_sent', 'first_follow_up',
  'second_follow_up', 'mid_month_follow_up', 'month_end_follow_up',
  'next_month_follow_up', 'discount_requested', 'quote_accepted',
  'engagement_sent', 'invoice_sent', 'payment_date_confirmed', 'won'
];

export default function PipelineProspectCard({ 
  prospect, 
  onClick, 
  onMoveStage,
  currentStage 
}: PipelineProspectCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const currentIndex = STAGE_ORDER.indexOf(currentStage);
  const canMoveForward = currentIndex < STAGE_ORDER.length - 1;
  const canMoveBack = currentIndex > 0;

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('prospectId', prospect.id);
    e.dataTransfer.setData('fromStage', currentStage);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div 
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start gap-2 mb-2">
        <GripHorizontal className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
        <div className="cursor-pointer flex-1 min-w-0" onClick={onClick}>
          <h4 className="font-semibold text-gray-900 mb-2">{prospect.name}</h4>
          
          <div className="space-y-1 text-sm text-gray-600 mb-3">
            {prospect.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{prospect.email}</span>
              </div>
            )}
            {prospect.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-3 h-3 flex-shrink-0" />
                <span>{prospect.phone}</span>
              </div>
            )}
            {prospect.quote_amount && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">R</span>
                <span className="font-medium">{Number(prospect.quote_amount).toLocaleString()}</span>
              </div>
            )}
            {prospect.next_follow_up_date && (
              <div className="flex items-center gap-2">
                <Calendar className="w-3 h-3 flex-shrink-0" />
                <span>{new Date(prospect.next_follow_up_date).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {prospect.lead_source && (
            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
              {prospect.lead_source}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
        {canMoveBack && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveStage(prospect.id, STAGE_ORDER[currentIndex - 1]);
            }}
            className="flex-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            ← Back
          </button>
        )}
        {canMoveForward && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveStage(prospect.id, STAGE_ORDER[currentIndex + 1]);
            }}
            className="flex-1 px-2 py-1 text-xs bg-teal-600 text-white rounded hover:bg-teal-700"
          >
            Next →
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMoveStage(prospect.id, 'won');
          }}
          className="flex-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
        >
          Won
        </button>
      </div>
    </div>
  );
}
