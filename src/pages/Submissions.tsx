import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import SubmissionsView from '@/components/SubmissionsView';
import AppLayout from '@/components/AppLayout';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api';

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSubmissions();
    loadProjects();
  }, []);

  const loadSubmissions = async () => {
    try {
      const response = await fetch(`${API_BASE}/submissions`);
      if (!response.ok) throw new Error('Failed to fetch submissions');
      const data = await response.json();
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading submissions:', err);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await fetch(`${API_BASE}/projects`);
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading projects:', err);
      setProjects([]);
    }
  };

  const handleAddSubmission = async (formData: any) => {
    try {
      const response = await fetch(`${API_BASE}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to create submission');
      const newSubmission = await response.json();
      setSubmissions([newSubmission, ...submissions]);
      toast({ title: 'Submission created successfully' });
    } catch (err) {
      console.error('Error creating submission:', err);
      toast({
        title: 'Error',
        description: 'Failed to create submission',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateSubmission = async (id: number, formData: any) => {
    try {
      const response = await fetch(`${API_BASE}/submissions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to update submission');
      const updatedSubmission = await response.json();
      setSubmissions(submissions.map(s => s.submission_id === id ? updatedSubmission : s));
      toast({ title: 'Submission updated successfully' });
    } catch (err) {
      console.error('Error updating submission:', err);
      toast({
        title: 'Error',
        description: 'Failed to update submission',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSubmission = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE}/submissions/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete submission');
      setSubmissions(submissions.filter(s => s.submission_id !== id));
      toast({ title: 'Submission deleted successfully' });
    } catch (err) {
      console.error('Error deleting submission:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete submission',
        variant: 'destructive',
      });
    }
  };

  return (
    <AppLayout>
      <div className="p-6">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading submissions...</p>
          </div>
        ) : (
          <SubmissionsView
            submissions={submissions}
            projects={projects}
            onAddSubmission={handleAddSubmission}
            onUpdateSubmission={handleUpdateSubmission}
            onDeleteSubmission={handleDeleteSubmission}
            onRefresh={loadSubmissions}
          />
        )}
      </div>
    </AppLayout>
  );
}
