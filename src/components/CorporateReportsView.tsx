import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, BarChart, Calendar, ShieldAlert, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { API_BASE } from '@/lib/api';

export default function CorporateReportsView({ token }: { token: string }) {
  const { toast } = useToast();
  const [generating, setGenerating] = useState<string | null>(null);

  const downloadCSV = (data: any[], fileName: string) => {
    if (!data || data.length === 0) return;
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => 
      Object.values(obj).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerate = async (reportId: string, reportName: string) => {
    if (!token) return;
    
    setGenerating(reportId);
    try {
      let endpoint = '';
      if (reportId === 'status-summary') endpoint = '/api/corporate-dashboard/reports/summary';
      else if (reportId === 'expiring-visas') endpoint = '/api/corporate-dashboard/reports/expiring-visas';
      else if (reportId === 'document-audit') endpoint = '/api/corporate-dashboard/reports/document-audit';
      
      const response = await fetch(`${API_BASE}${endpoint}?token=${token}`);
      if (response.ok) {
        const result = await response.json();
        
        // Trigger download
        downloadCSV(result.data, reportId);
        
        toast({
          title: "Report Generated",
          description: `${reportName} has been downloaded successfully.`,
        });
      } else {
        throw new Error('Failed to generate');
      }
    } catch (err) {
      toast({
        title: "Generation Failed",
        description: "There was an error generating your report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setGenerating(null);
    }
  };

  const reports = [
    {
      id: "status-summary",
      name: "Employee Status Summary",
      description: "A comprehensive overview of all active employee immigration cases and their current progress stages.",
      icon: <BarChart className="h-8 w-8 text-blue-500" />,
      color: "from-blue-50 to-blue-100/50"
    },
    {
      id: "expiring-visas",
      name: "Expiring Visas Report",
      description: "A detailed list of visas and work permits expiring within the next 90 to 180 days.",
      icon: <Calendar className="h-8 w-8 text-amber-500" />,
      color: "from-amber-50 to-amber-100/50"
    },
    {
      id: "document-audit",
      name: "Document Audit Report",
      description: "Identifies missing, expired, or rejected documents across all active cases for compliance checking.",
      icon: <ShieldAlert className="h-8 w-8 text-rose-500" />,
      color: "from-rose-50 to-rose-100/50"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <div>
            <h2 className="text-2xl font-bold text-gray-900">Corporate Reports</h2>
            <p className="text-gray-500 mt-1">Generate and download aggregate data for your organization.</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <Card key={report.id} className="relative overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
            <div className={`p-6 bg-gradient-to-br ${report.color} border-b border-gray-100/50`}>
               <div className="bg-white/80 w-14 h-14 rounded-xl flex items-center justify-center shadow-sm mb-4">
                  {report.icon}
               </div>
               <h3 className="font-semibold text-lg text-gray-900 mb-2">{report.name}</h3>
               <p className="text-sm text-gray-600 line-clamp-3">
                 {report.description}
               </p>
            </div>
            <div className="p-4 mt-auto bg-white border-t flex justify-end">
               <Button 
                onClick={() => handleGenerate(report.id, report.name)} 
                disabled={generating === report.id}
                className="w-full gap-2 bg-slate-900 hover:bg-slate-800"
               >
                 {generating === report.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                 ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Generate Report (CSV)
                    </>
                 )}
               </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
