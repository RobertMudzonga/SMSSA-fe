import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Upload, Loader2, CheckCircle, AlertTriangle, ExternalLink, FolderOpen } from 'lucide-react';
import { API_BASE } from '@/lib/api';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  caseId: number;
  caseName?: string;
  token?: string;
  sharepointFolderUrl?: string;
}

export default function DocumentUploadModal({
  isOpen,
  onClose,
  onSuccess,
  caseId,
  caseName,
  token,
  sharepointFolderUrl
}: DocumentUploadModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    document_name: '',
    document_type: '',
    description: ''
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select at least one file');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      setUploadProgress(0);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);
        uploadFormData.append('legal_case_id', String(caseId));

        if (formData.document_name) {
          uploadFormData.append('document_name', formData.document_name);
        }
        if (formData.document_type) {
          uploadFormData.append('document_type', formData.document_type);
        }
        if (formData.description) {
          uploadFormData.append('description', formData.description);
        }

        const response = await fetch(`${API_BASE}/api/documents/upload`, {
          method: 'POST',
          body: uploadFormData
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to upload ${file.name}`);
        }

        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }

      setSuccess(true);
      setFiles([]);
      setFormData({ document_name: '', document_type: '', description: '' });
      
      // Auto close after 2 seconds
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err) {
      console.error('Error uploading documents:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload documents');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // If SharePoint URL is configured, show that instead
  if (sharepointFolderUrl) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Upload Documents</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3 items-start">
                <FolderOpen className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Upload to SharePoint</h3>
                  <p className="text-sm text-blue-800 mb-4">
                    Please upload your supporting documents directly to our Microsoft SharePoint folder. This ensures secure and organized document management.
                  </p>
                  {caseName && (
                    <p className="text-xs text-blue-700 mb-3">
                      <strong>Case:</strong> {caseName}
                    </p>
                  )}
                  <a
                    href={sharepointFolderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open SharePoint Folder
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
              <p className="font-medium mb-2">Tips:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Organize your files in folders by document type</li>
                <li>Use clear file names (e.g., "Passport_2024")</li>
                <li>Supported formats: PDF, JPG, PNG, DOC, DOCX</li>
                <li>Maximum file size: 10MB per file</li>
              </ul>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Close
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // If no SharePoint URL configured, show configuration warning
  if (!sharepointFolderUrl) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Upload Documents</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex gap-3 items-start">
                <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-900 mb-2">Document Upload Not Available</h3>
                  <p className="text-sm text-yellow-800">
                    The SharePoint folder link has not been configured for this corporate account yet. Please contact your administrator to set up the document upload link.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Close
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Show success screen after upload
  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="max-w-md w-full p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Documents Uploaded Successfully</h3>
          <p className="text-gray-600 mb-4">Your documents have been added to this case.</p>
        </Card>
      </div>
    );
  }

  // Default: Show upload form
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold">Upload Supporting Documents</h2>
              {caseName && (
                <p className="text-sm text-gray-600 mt-1">Case: {caseName}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              disabled={loading}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div className="text-red-700 text-sm">{error}</div>
            </div>
          )}

          <div className="space-y-4">
            {/* Drag and Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                dragActive
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-300 bg-gray-50 hover:border-gray-400'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="font-medium text-gray-700">Drag and drop files here</p>
              <p className="text-sm text-gray-600">or click to select files</p>
              <p className="text-xs text-gray-500 mt-2">Max 10MB per file</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                disabled={loading}
              />
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Selected Files ({files.length})
                </p>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white p-2 rounded border"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="ml-2 text-gray-400 hover:text-red-600"
                        disabled={loading}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Document Details */}
            <div className="space-y-4 border-t pt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document Type
                </label>
                <select
                  value={formData.document_type}
                  onChange={(e) =>
                    setFormData({ ...formData, document_type: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2 text-sm"
                  disabled={loading}
                >
                  <option value="">Select a type...</option>
                  <option value="passport">Passport</option>
                  <option value="visa">Visa Documents</option>
                  <option value="birth_certificate">Birth Certificate</option>
                  <option value="marriage_certificate">Marriage Certificate</option>
                  <option value="employment_letter">Employment Letter</option>
                  <option value="bank_statement">Bank Statement</option>
                  <option value="police_clearance">Police Clearance</option>
                  <option value="medical_report">Medical Report</option>
                  <option value="appeal_draft">Appeal Draft</option>
                  <option value="court_document">Court Document</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document Name (Optional)
                </label>
                <input
                  type="text"
                  value={formData.document_name}
                  onChange={(e) =>
                    setFormData({ ...formData, document_name: e.target.value })
                  }
                  placeholder="e.g., Passport Copy"
                  className="w-full border rounded px-3 py-2 text-sm"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Add any notes about these documents..."
                  className="w-full border rounded px-3 py-2 text-sm"
                  rows={2}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Progress Bar */}
            {loading && uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Uploading...</span>
                  <span className="font-medium text-indigo-600">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleUpload}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={loading || files.length === 0}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload {files.length > 0 ? `(${files.length})` : ''}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
