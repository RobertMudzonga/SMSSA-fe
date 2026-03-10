import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, FileText, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { RevenueChart } from './RevenueChart';
import { CompletionChart } from './CompletionChart';
import { EmployeePerformanceChart } from './EmployeePerformanceChart';
import { ScheduleReportModal } from './ScheduleReportModal';

export function AnalyticsView() {
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().setMonth(new Date().getMonth() - 1)));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [startDate, endDate]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { user } = useAuth();
      const resp = await fetch('/api/functions/fetch-analytics-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': user?.email || (localStorage.getItem('userEmail') || '') },
        body: JSON.stringify({ startDate: startDate.toISOString(), endDate: endDate.toISOString() })
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.error || 'Failed to fetch analytics');
      setAnalyticsData(json.data);
    } catch (error: any) {
      toast.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async () => {
    try {
      const { user } = useAuth();
      const resp = await fetch('/api/functions/generate-pdf-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': user?.email || (localStorage.getItem('userEmail') || '') },
        body: JSON.stringify({ analyticsData, startDate: format(startDate, 'yyyy-MM-dd'), endDate: format(endDate, 'yyyy-MM-dd') })
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.error || 'Failed to generate PDF');
      const blob = new Blob([json.html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url);
      toast.success('PDF report generated');
    } catch (error) {
      toast.error('Failed to generate PDF');
    }
  };

  const exportExcel = async () => {
    try {
      const { user } = useAuth();
      const resp = await fetch('/api/functions/export-excel-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': user?.email || (localStorage.getItem('userEmail') || '') },
        body: JSON.stringify({ startDate: startDate.toISOString(), endDate: endDate.toISOString() })
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.error || 'Failed to export Excel');
      const csv = convertToCSV(json.data);
      downloadCSV(csv, 'analytics-report.csv');
      toast.success('Excel report exported');
    } catch (error) {
      toast.error('Failed to export Excel');
    }
  };

  const convertToCSV = (data: any) => {
    const projects = data.projects.map((p: any) => 
      `${p.client_name},${p.visa_type},${p.status},${p.payment_amount}`
    ).join('\n');
    return `Client Name,Visa Type,Status,Payment Amount\n${projects}`;
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  if (loading || !analyticsData) {
    return <div className="p-8">Loading analytics...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline"><CalendarIcon className="mr-2 h-4 w-4" />
                {format(startDate, 'PP')} - {format(endDate, 'PP')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar mode="single" selected={startDate} onSelect={(d) => d && setStartDate(d)} />
            </PopoverContent>
          </Popover>
          <Button onClick={exportPDF}><FileText className="mr-2 h-4 w-4" />PDF</Button>
          <Button onClick={exportExcel}><Download className="mr-2 h-4 w-4" />Excel</Button>
          <Button onClick={() => setShowScheduleModal(true)}><Mail className="mr-2 h-4 w-4" />Schedule</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card><CardHeader><CardTitle>Total Revenue</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">R{Number(analyticsData.totalRevenue).toFixed(2)}</p></CardContent>
        </Card>
        <Card><CardHeader><CardTitle>Projects Completed</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{analyticsData.completionRates.completed}</p></CardContent>
        </Card>
        <Card><CardHeader><CardTitle>Client Conversion</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{analyticsData.clientAcquisition.converted}</p></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CompletionChart data={analyticsData.completionRates} />
        <RevenueChart data={analyticsData.revenueByVisa} />
      </div>

      <EmployeePerformanceChart data={analyticsData.employeePerformance} />

      {showScheduleModal && <ScheduleReportModal onClose={() => setShowScheduleModal(false)} />}
    </div>
  );
}