import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { API_BASE } from '@/lib/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Lock, Unlock, AlertCircle } from 'lucide-react';

interface Document {
  document_id: number;
  name: string;
  status: string;
  checked_out_by?: string;
}

interface CheckInOutModalProps {
  document: Document;
  onSuccess?: () => void;
}

export default function CheckInOutModal({
  document,
  onSuccess,
}: CheckInOutModalProps) {
  const { toast } = useToast();
  const [userName, setUserName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const isCheckedOut = document.status === 'checked_out';

  const handleSubmit = async () => {
    if (!userName.trim()) {
      toast({ title: 'Please enter your name', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const endpoint = isCheckedOut ? 'check-in' : 'check-out';
      const response = await fetch(
        `${API_BASE}/api/documents/${document.document_id}/${endpoint}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            [isCheckedOut ? 'checked_in_by' : 'checked_out_by']: userName.trim(),
            ...(dueDate && !isCheckedOut && { due_date: dueDate }),
            ...(notes && { notes }),
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Operation failed');
      }

      toast({
        title: isCheckedOut ? 'Document checked in successfully' : 'Document checked out successfully',
      });

      onSuccess?.();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: isCheckedOut ? 'Failed to check in document' : 'Failed to check out document',
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Info Box */}
      {isCheckedOut && document.checked_out_by && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-900">
                Currently Checked Out
              </p>
              <p className="text-sm text-yellow-800 mt-1">
                This document is checked out by <strong>{document.checked_out_by}</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            {isCheckedOut ? (
              <>
                <Unlock className="w-5 h-5" />
                Check In Document
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                Check Out Document
              </>
            )}
          </h3>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600">
              <strong>Document:</strong> {document.name}
            </p>
          </div>
        </div>

        <div>
          <Label htmlFor="userName" className="text-sm font-medium text-gray-700">
            Your Name
          </Label>
          <Input
            id="userName"
            type="text"
            placeholder="Enter your name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="mt-2"
            autoFocus
          />
        </div>

        {!isCheckedOut && (
          <div>
            <Label htmlFor="dueDate" className="text-sm font-medium text-gray-700">
              Check-in Due Date (Optional)
            </Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              Set a date for when you plan to return this document
            </p>
          </div>
        )}

        <div>
          <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
            Notes (Optional)
          </Label>
          <Textarea
            id="notes"
            placeholder={
              isCheckedOut
                ? 'Add any notes about the return condition...'
                : 'Add any notes about why you\'re checking out this document...'
            }
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-2"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-4 border-t">
        <Button
          onClick={handleSubmit}
          disabled={loading || !userName.trim()}
          className="flex-1"
        >
          {loading ? (
            <>Loading...</>
          ) : isCheckedOut ? (
            <>
              <Unlock className="w-4 h-4 mr-2" />
              Check In
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 mr-2" />
              Check Out
            </>
          )}
        </Button>
      </div>

      <p className="text-xs text-gray-500 text-center">
        {isCheckedOut
          ? 'Checking in will mark this document as available for others'
          : 'Checking out will lock this document for exclusive access'}
      </p>
    </div>
  );
}
