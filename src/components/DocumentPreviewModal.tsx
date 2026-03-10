import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { API_BASE } from '@/lib/api';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  documentId: number;
  documentName: string;
  mimeType?: string;
  onClose: () => void;
}

export default function DocumentPreviewModal({
  isOpen,
  documentId,
  documentName,
  mimeType,
  onClose
}: DocumentPreviewModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buildUrl = (id: number) => {
    const base = /^https?:\/\//i.test(API_BASE) ? API_BASE.replace(/\/$/, '') : '';
    return `${base}/api/documents/${id}/download`;
  };

  // Detect file type from filename if mimeType is not available
  const getFileExtension = () => {
    const parts = documentName.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  };

  // Determine if we can preview and what type of preview
  const getPreviewType = () => {
    // Check by MIME type first
    if (mimeType) {
      if (mimeType.startsWith('image/')) return 'image';
      if (mimeType === 'application/pdf') return 'pdf';
      if (mimeType.includes('word') || mimeType.includes('document')) return 'word';
      if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'excel';
      if (mimeType.includes('text') || mimeType === 'text/plain') return 'text';
    }

    // Fall back to file extension
    const ext = getFileExtension();
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
    const docExts = ['doc', 'docx', 'txt', 'odt'];
    const sheetExts = ['xlsx', 'xls', 'csv', 'ods'];
    const pdfExts = ['pdf'];

    if (imageExts.includes(ext)) return 'image';
    if (pdfExts.includes(ext)) return 'pdf';
    if (docExts.includes(ext)) return 'word';
    if (sheetExts.includes(ext)) return 'excel';

    return null;
  };

  useEffect(() => {
    if (isOpen) {
      setLoading(false);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const previewUrl = buildUrl(documentId);
  const previewType = getPreviewType();
  const ext = getFileExtension();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-4 border-b flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">{documentName}</h3>
            <p className="text-xs text-gray-500">{mimeType || `File type: .${ext}`}</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={previewUrl}
              download
              className="inline-flex items-center gap-1 px-3 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              <Download className="h-4 w-4" />
              Download
            </a>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-900 p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {!previewType ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">
                Preview not available for .{ext} files
              </p>
              <p className="text-gray-500 text-sm mb-6">
                This file type cannot be previewed in the browser. Click the button below to download and open it with your default application.
              </p>
              <a
                href={previewUrl}
                download
                className="inline-block px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                Download File
              </a>
            </div>
          ) : previewType === 'image' ? (
            <div className="text-center">
              <img
                src={previewUrl}
                alt={documentName}
                className="max-w-full h-auto mx-auto"
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setError('Failed to load image');
                }}
              />
              {error && <p className="text-red-600 mt-4">{error}</p>}
            </div>
          ) : previewType === 'pdf' ? (
            <div className="bg-gray-100">
              <object
                data={previewUrl}
                type="application/pdf"
                className="w-full h-[600px] border-0"
                onLoad={() => setLoading(false)}
              >
                <div className="bg-white p-6 text-center">
                  <p className="text-gray-600 mb-4">
                    PDF preview is loading...
                  </p>
                  <p className="text-gray-500 text-sm mb-6">
                    If the preview doesn't load, click below to download the PDF.
                  </p>
                  <a
                    href={previewUrl}
                    download
                    className="inline-block px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                  >
                    Download PDF
                  </a>
                </div>
              </object>
              {error && <p className="text-red-600 p-4">{error}</p>}
            </div>
          ) : previewType === 'word' ? (
            <div className="bg-gray-100">
              <div className="bg-white p-4 text-center">
                <p className="text-gray-600 mb-4">
                  Preview for Word documents is limited. Download to view the full formatting.
                </p>
                <a
                  href={previewUrl}
                  download
                  className="inline-block px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  Download {'.docx' === ('.' + ext) ? 'Word' : 'Document'}
                </a>
              </div>
              <iframe
                src={`https://docs.google.com/gviz/viewer?url=${encodeURIComponent(previewUrl)}&embedded=true`}
                className="w-full h-[600px] border-0"
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setError('Failed to load preview');
                }}
              />
            </div>
          ) : previewType === 'excel' ? (
            <div className="bg-white p-6 text-center">
              <p className="text-gray-600 mb-4">
                Excel files cannot be previewed in the browser. Download to view the spreadsheet.
              </p>
              <a
                href={previewUrl}
                download
                className="inline-block px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                Download Spreadsheet
              </a>
            </div>
          ) : previewType === 'text' ? (
            <div className="bg-gray-50 p-4 rounded">
              <iframe
                src={previewUrl}
                className="w-full h-[600px] border border-gray-200 rounded"
                onLoad={() => setLoading(false)}
              />
            </div>
          ) : null}

          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin">
                <div className="h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full" />
              </div>
              <p className="text-gray-600 mt-4">Loading preview...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
