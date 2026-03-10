interface StatusBadgeProps {
  status?: string | null;
  type?: 'prospect' | 'project' | 'document' | 'payment';
}

export default function StatusBadge({ status, type = 'prospect' }: StatusBadgeProps) {
  const getColors = () => {
    const normalized = String(status || '').toLowerCase();
    if (normalized === 'prospect' || normalized === 'pending') return 'bg-gray-100 text-gray-700';
    if (normalized === 'lead' || normalized === 'in-progress') return 'bg-blue-100 text-blue-700';
    if (normalized === 'paid' || normalized === 'active') return 'bg-green-100 text-green-700';
    if (normalized === 'completed' || normalized === 'signed') return 'bg-teal-100 text-teal-700';
    if (normalized === 'on hold') return 'bg-orange-100 text-orange-700';
    if (normalized === 'rejected' || normalized === 'cancelled') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getColors()}`}>
      {status || 'Unknown'}
    </span>
  );
}
