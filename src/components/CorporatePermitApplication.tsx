import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { API_BASE } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Note {
  id?: number;
  author_name: string;
  author_role: 'manager' | 'client' | string;
  content: string;
  created_at?: string;
}

interface Step {
  id: number;
  title: string;
  completed: boolean;
  completed_by?: string | null;
  completed_at?: string | null;
  notes: Note[];
}

interface Permit {
  id?: number;
  corporate_client_id: number;
  steps: Step[];
}

const DEFAULT_STEPS = [
  'APPLICATION TO THE DEPARTMENT OF LABOUR',
  'APPLICATION TO THE DEPARTMENT OF HOME AFFAIRS FOR CORPORATE PERMIT',
  'INDIVIDUAL CORPORATE WORKER CERTIFICATE',
];

export default function CorporatePermitApplication({
  corporateClient,
  isClientPortal = false,
  sharepointUrl,
}: {
  corporateClient: { id: number; name: string };
  isClientPortal?: boolean;
  sharepointUrl?: string;
}) {
  const { toast } = useToast();
  const { user, isAdmin, hasPermission } = useAuth();
  const token = localStorage.getItem('token');

  const [permit, setPermit] = useState<Permit | null>(null);
  const isClient = isClientPortal && !isAdmin && !hasPermission('manage_corporate_permits');
  const [loading, setLoading] = useState(true);
  const [newNoteText, setNewNoteText] = useState('');
  const [addingNoteFor, setAddingNoteFor] = useState<number | null>(null);

  const canManage = isAdmin || hasPermission('manage_corporate_permits');

  useEffect(() => {
    fetchPermit();

    const handlePermitRefresh = (event: Event) => {
      const customEvent = event as CustomEvent<{ corporateClientId?: number }>;
      if (customEvent.detail?.corporateClientId && customEvent.detail.corporateClientId !== corporateClient.id) {
        return;
      }
      fetchPermit();
    };

    const handleStorageRefresh = (event: StorageEvent) => {
      if (event.key === 'smssa_permit_refresh' && event.newValue) {
        const parts = event.newValue.split('-');
        const refreshedClientId = Number(parts[parts.length - 1]);
        if (!Number.isNaN(refreshedClientId) && refreshedClientId !== corporateClient.id) {
          return;
        }
        fetchPermit();
      }
    };

    window.addEventListener('corporate-permit-refresh', handlePermitRefresh as EventListener);
    window.addEventListener('storage', handleStorageRefresh);

    return () => {
      window.removeEventListener('corporate-permit-refresh', handlePermitRefresh as EventListener);
      window.removeEventListener('storage', handleStorageRefresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [corporateClient.id]);

  const fetchPermit = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/corporate-permits?corporate_client_id=${corporateClient.id}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        // If endpoint doesn't exist or returns 404, create a local default
        throw new Error('No permit found');
      }

      const json = await res.json();
      const data = json.permit || json;
      if (data) {
        setPermit(normalizePermit(data));
      } else {
        // create default locally
        setPermit(createDefaultPermit());
      }
    } catch (err) {
      setPermit(createDefaultPermit());
    } finally {
      setLoading(false);
    }
  };

  const normalizePermit = (data: any): Permit => {
    if (!data.steps) {
      const steps: Step[] = DEFAULT_STEPS.map((t, i) => ({
        id: i + 1,
        title: t,
        completed: false,
        notes: [],
      }));
      return { id: data.id, corporate_client_id: corporateClient.id, steps };
    }

    return {
      id: data.permit_id ?? data.id,
      corporate_client_id: corporateClient.id,
      steps: data.steps.map((s: any, i: number) => ({
        id: s.permit_step_id ?? s.id ?? i + 1,
        title: s.title ?? DEFAULT_STEPS[i] ?? `Step ${i + 1}`,
        completed: !!s.completed,
        completed_by: s.completed_by ?? null,
        completed_at: s.completed_at ?? null,
        notes: (s.notes || []).map((n: any) => ({
          id: n.id,
          author_name: n.author_name || n.author || 'Unknown',
          author_role: n.author_role || 'manager',
          content: n.content,
          created_at: n.created_at,
        })),
      })),
    };
  };

  const createDefaultPermit = (): Permit => {
    const steps: Step[] = DEFAULT_STEPS.map((t, i) => ({
      id: i + 1,
      title: t,
      completed: false,
      notes: [],
    }));
    return { corporate_client_id: corporateClient.id, steps };
  };

  const toggleStep = async (index: number) => {
    if (!canManage) {
      toast({ title: 'Permission denied', description: 'Only managers can mark steps done', variant: 'destructive' });
      return;
    }

    if (!permit) return;

    const steps = [...permit.steps];
    const step = steps[index];
    step.completed = !step.completed;
    step.completed_by = step.completed ? user?.name || user?.email || 'Manager' : null;
    step.completed_at = step.completed ? new Date().toISOString() : null;

    setPermit({ ...permit, steps });

    try {
      // Attempt to persist to backend if endpoint exists
      if (permit.id) {
        await fetch(`${API_BASE}/api/corporate-permits/${permit.id}/steps/${step.id}`, {
          method: 'PATCH',
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ completed: step.completed, completed_by: step.completed_by }),
        });
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('smssa_permit_refresh', `${Date.now()}-${corporateClient.id}`);
        window.dispatchEvent(new CustomEvent('corporate-permit-refresh', { detail: { corporateClientId: corporateClient.id } }));
      }
      toast({ title: 'Updated', description: `${step.title} marked ${step.completed ? 'done' : 'not done'}` });
    } catch (err) {
      // ignore
    }
  };

  const addNote = async (stepIndex: number) => {
    if (!permit) return;
    if (!newNoteText.trim()) return;

    const authorRole = canManage ? 'manager' : 'client';
    const note: Note = {
      author_name: user?.name || user?.email || 'Unknown',
      author_role: authorRole,
      content: newNoteText.trim(),
      created_at: new Date().toISOString(),
    };

    const steps = [...permit.steps];
    steps[stepIndex].notes = [...(steps[stepIndex].notes || []), note];
    setPermit({ ...permit, steps });
    setNewNoteText('');
    setAddingNoteFor(null);

    try {
      if (permit.id) {
        await fetch(`${API_BASE}/api/corporate-permits/${permit.id}/steps/${steps[stepIndex].id}/notes`, {
          method: 'POST',
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content: note.content, author_role: note.author_role, author_name: note.author_name }),
        });
        await fetchPermit();
        if (typeof window !== 'undefined') {
          localStorage.setItem('smssa_permit_refresh', `${Date.now()}-${corporateClient.id}`);
          window.dispatchEvent(new CustomEvent('corporate-permit-refresh', { detail: { corporateClientId: corporateClient.id } }));
        }
      }
      toast({ title: 'Note added', description: 'Your note has been added' });
    } catch (err) {
      // ignore
    }
  };

  if (loading || !permit) {
    return (
      <Card className="p-6 text-center">Loading permit information...</Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-bold">Corporate Permit Application</h2>
          {isClient && (
            <p className="text-sm text-yellow-700 mt-2">Client read-only mode: you can view steps and add comments, but only managers can mark steps as done.</p>
          )}
        </div>
        {sharepointUrl && (
          <Button size="sm" variant="outline" onClick={() => window.open(sharepointUrl, '_blank')}>
            Upload documents
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {permit.steps.map((s, idx) => (
          <Card key={s.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-sm">{s.title}</h3>
                <div className="text-xs text-gray-500 mt-1">
                  {s.completed ? (
                    <span className="flex items-center gap-1 text-green-600"><CheckCircle className="h-4 w-4" /> Completed by {s.completed_by} {s.completed_at ? `on ${new Date(s.completed_at).toLocaleDateString()}` : ''}</span>
                  ) : (
                    <span className="text-yellow-600">Not completed</span>
                  )}
                </div>
              </div>

              <div>
                {canManage ? (
                  <Button size="sm" onClick={() => toggleStep(idx)} className="gap-2">
                    <CheckCircle className="h-4 w-4" /> {s.completed ? 'Undo' : 'Mark done'}
                  </Button>
                ) : (
                  <div className="text-xs text-gray-500 mt-1">Manager-only approval</div>
                )}
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Notes</h4>
                <Button size="sm" variant="ghost" onClick={() => setAddingNoteFor(idx)} className="gap-1"><MessageSquare className="h-4 w-4" /> Add note</Button>
              </div>

              <div className="mt-2 space-y-2 max-h-40 overflow-auto">
                {(s.notes || []).length === 0 ? (
                  <div className="text-xs text-gray-400">No notes yet</div>
                ) : (
                  s.notes.map((n, i) => (
                    <div key={i} className="p-2 bg-gray-50 rounded">
                      <div className="text-xs text-gray-600 font-medium">{n.author_name} <span className="text-[10px] text-gray-400">({n.author_role})</span></div>
                      <div className="text-sm text-gray-800 mt-1">{n.content}</div>
                      <div className="text-[11px] text-gray-400 mt-1">{n.created_at ? new Date(n.created_at).toLocaleString() : ''}</div>
                    </div>
                  ))
                )}
              </div>

              {addingNoteFor === idx && (
                <div className="mt-3">
                  <Textarea value={newNoteText} onChange={(e) => setNewNoteText(e.target.value)} />
                  <div className="flex gap-2 mt-2">
                    <Button onClick={() => addNote(idx)}>Save note</Button>
                    <Button variant="ghost" onClick={() => { setAddingNoteFor(null); setNewNoteText(''); }}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
