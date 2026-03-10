import StatusBadge from './StatusBadge';

interface ProspectCardProps {
  prospect: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    source: string;
    status: string;
    country_of_interest?: string;
    visa_type?: string;
    created_at: string;
  };
  onClick: () => void;
}

export default function ProspectCard({ prospect, onClick }: ProspectCardProps) {
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{prospect.name}</h3>
          <p className="text-sm text-gray-600">{prospect.email}</p>
        </div>
        <StatusBadge status={prospect.status} type="prospect" />
      </div>
      <div className="space-y-1 text-sm">
        <p className="text-gray-600">Source: <span className="font-medium">{prospect.source}</span></p>
        {prospect.visa_type && (
          <p className="text-gray-600">Visa: <span className="font-medium">{prospect.visa_type}</span></p>
        )}
      </div>
    </div>
  );
}
