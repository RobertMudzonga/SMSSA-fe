import StatusBadge from './StatusBadge';

interface DocumentCardProps {
  document: {
    id: string;
    document_name: string;
    document_type: string;
    status: string;
    created_at: string;
    signature_required: boolean;
    file_size?: number;
  };
  onDownload: () => void;
  onSign?: () => void;
}



export default function DocumentCard({ document, onDownload, onSign }: DocumentCardProps) {
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{document.document_name}</h3>
          <p className="text-sm text-gray-600">{document.document_type}</p>
        </div>
        <StatusBadge status={document.status} type="document" />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{formatFileSize(document.file_size)}</span>
        <div className="flex gap-2">
          <button onClick={onDownload} className="text-sm text-teal-600 hover:text-teal-700 font-medium">
            Download
          </button>
          {document.signature_required && document.status !== 'signed' && onSign && (
            <button onClick={onSign} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Sign
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
