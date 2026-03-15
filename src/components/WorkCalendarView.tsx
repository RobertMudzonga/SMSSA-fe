import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight, Download, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { API_BASE } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CalendarItem {
  id: number;
  employee_id: number;
  employee_name: string;
  title: string;
  details?: string | null;
  requested_for_date: string;
  status: string;
  created_by_name?: string | null;
}

interface EmployeeOption {
  id: number;
  full_name: string;
  is_active?: boolean;
}

interface WorkCalendarViewProps {
  employees: EmployeeOption[];
}

export default function WorkCalendarView({ employees }: WorkCalendarViewProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [viewMode, setViewMode] = useState<'biweekly' | 'monthly'>('biweekly');
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [requestedForDate, setRequestedForDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [employeeId, setEmployeeId] = useState<string>(user?.employee_id ? String(user.employee_id) : '');

  useEffect(() => {
    if (!employeeId && user?.employee_id) {
      setEmployeeId(String(user.employee_id));
    }
  }, [employeeId, user?.employee_id]);

  const activeEmployees = useMemo(() => {
    return (employees || []).filter((employee) => employee?.is_active !== false);
  }, [employees]);

  const range = useMemo(() => {
    if (viewMode === 'monthly') {
      const monthStart = startOfMonth(anchorDate);
      const monthEnd = endOfMonth(anchorDate);
      return {
        start: startOfWeek(monthStart, { weekStartsOn: 1 }),
        end: endOfWeek(monthEnd, { weekStartsOn: 1 }),
      };
    }

    const biweeklyStart = startOfWeek(anchorDate, { weekStartsOn: 1 });
    return {
      start: biweeklyStart,
      end: addDays(biweeklyStart, 13),
    };
  }, [anchorDate, viewMode]);

  const days = useMemo(
    () => eachDayOfInterval({ start: range.start, end: range.end }),
    [range.end, range.start]
  );

  const itemsByDate = useMemo(() => {
    const grouped = new Map<string, CalendarItem[]>();
    for (const item of items) {
      const key = item.requested_for_date;
      const existing = grouped.get(key) || [];
      existing.push(item);
      grouped.set(key, existing);
    }
    return grouped;
  }, [items]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const start = format(range.start, 'yyyy-MM-dd');
      const end = format(range.end, 'yyyy-MM-dd');
      const response = await fetch(`${API_BASE}/work-calendar/items?start=${start}&end=${end}`);
      const data = response.ok ? await response.json() : [];
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch calendar items:', error);
      toast({ title: 'Failed to load calendar items', variant: 'destructive' });
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [range.end, range.start, toast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const shiftPeriod = (direction: 'prev' | 'next') => {
    if (viewMode === 'monthly') {
      setAnchorDate((prev) => (direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)));
      return;
    }

    setAnchorDate((prev) => addDays(prev, direction === 'prev' ? -14 : 14));
  };

  const resetForm = () => {
    setTitle('');
    setDetails('');
    setRequestedForDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const handleAddItem = async () => {
    if (!title.trim()) {
      toast({ title: 'Request title is required', variant: 'destructive' });
      return;
    }

    if (!employeeId) {
      toast({ title: 'Please select an employee', variant: 'destructive' });
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/work-calendar/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          details: details.trim() || null,
          requested_for_date: requestedForDate,
          status: 'pending',
          employee_id: Number(employeeId),
          created_by_employee_id: user?.employee_id || null,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error || 'Failed to add request');
      }

      toast({ title: 'Request added to calendar' });
      resetForm();
      fetchItems();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to add request';
      console.error('Failed to add calendar item:', error);
      toast({ title: message, variant: 'destructive' });
    }
  };

  const handleDeleteItem = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE}/work-calendar/items/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete item');
      toast({ title: 'Request removed' });
      fetchItems();
    } catch (error) {
      console.error('Failed to delete calendar item:', error);
      toast({ title: 'Failed to delete request', variant: 'destructive' });
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`${API_BASE}/work-calendar/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          view: viewMode,
          startDate: format(range.start, 'yyyy-MM-dd'),
          endDate: format(range.end, 'yyyy-MM-dd'),
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error || 'Failed to export Excel');
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition') || '';
      const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
      const filename = filenameMatch?.[1] || `work-calendar-${viewMode}.xlsx`;

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({ title: 'Calendar exported to Excel' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to export calendar';
      console.error('Failed to export calendar:', error);
      toast({ title: message, variant: 'destructive' });
    }
  };

  const titleText =
    viewMode === 'monthly'
      ? format(anchorDate, 'MMMM yyyy')
      : `${format(range.start, 'dd MMM yyyy')} - ${format(range.end, 'dd MMM yyyy')}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-teal-600" />
            Work Calendar
          </h1>
          <p className="text-sm text-slate-600">Employees can add requests and track what needs to be done.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={viewMode} onValueChange={(value: 'biweekly' | 'monthly') => setViewMode(value)}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="biweekly">Bi-weekly view</SelectItem>
              <SelectItem value="monthly">Monthly view</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Request</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="calendar-title">Request</Label>
              <Input
                id="calendar-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Example: Follow up on permit application"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="calendar-date">Requested for date</Label>
              <Input
                id="calendar-date"
                type="date"
                value={requestedForDate}
                onChange={(event) => setRequestedForDate(event.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label>Employee</Label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {activeEmployees.map((employee) => (
                    <SelectItem key={employee.id} value={String(employee.id)}>
                      {employee.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button className="w-full" onClick={handleAddItem}>
                <Plus className="mr-2 h-4 w-4" />
                Add To Calendar
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="calendar-details">Details (optional)</Label>
            <Textarea
              id="calendar-details"
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder="Add extra context for this request"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <CardTitle>{titleText}</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => shiftPeriod('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => setAnchorDate(new Date())}>Today</Button>
              <Button variant="outline" size="icon" onClick={() => shiftPeriod('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-7 border rounded-md overflow-hidden">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayName) => (
              <div key={dayName} className="bg-slate-100 px-2 py-2 text-xs font-semibold text-slate-700 border-b">
                {dayName}
              </div>
            ))}

            {days.map((day) => {
              const key = format(day, 'yyyy-MM-dd');
              const dayItems = itemsByDate.get(key) || [];
              return (
                <div
                  key={key}
                  className={`min-h-28 border-b border-r p-2 ${
                    isSameDay(day, new Date()) ? 'bg-teal-50' : ''
                  } ${viewMode === 'monthly' && !isSameMonth(day, anchorDate) ? 'bg-slate-50 text-slate-400' : ''}`}
                >
                  <div className="text-xs font-semibold mb-1">{format(day, 'd')}</div>
                  <div className="space-y-1">
                    {dayItems.map((item) => (
                      <div key={item.id} className="rounded border bg-white px-2 py-1 text-[11px] leading-tight">
                        <div className="flex items-start justify-between gap-1">
                          <div className="font-medium text-slate-900">{item.title}</div>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-slate-400 hover:text-red-600"
                            title="Delete request"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="text-slate-500">{item.employee_name || 'Unassigned'}</div>
                      </div>
                    ))}
                    {!dayItems.length && <div className="text-[11px] text-slate-400">No requests</div>}
                  </div>
                </div>
              );
            })}
          </div>

          {loading && <div className="text-sm text-slate-500 mt-3">Loading calendar items...</div>}
        </CardContent>
      </Card>

      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Requests In This View</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {items.map((item) => {
              const parsed = parseISO(item.requested_for_date);
              return (
                <div key={item.id} className="rounded border p-3 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-medium text-slate-900">{item.title}</div>
                    <div className="text-sm text-slate-600">
                      {format(parsed, 'dd MMM yyyy')} • {item.employee_name || 'Unassigned'} • {item.status}
                    </div>
                    {item.details && <div className="text-sm text-slate-500">{item.details}</div>}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteItem(item.id)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
