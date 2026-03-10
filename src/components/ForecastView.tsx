import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE } from '../lib/api';

interface ForecastProspect {
  prospect_id?: string;
  id?: string;
  first_name?: string;
  last_name?: string;
  deal_name?: string;
  expected_closing_date?: string;
  expected_payment_date?: string;
  forecast_amount?: number;
  forecast_probability?: number;
  status?: string;
  current_stage?: string;
  assigned_to?: number;
}

interface Employee {
  employee_id?: number;
  id?: number;
  first_name?: string;
  last_name?: string;
  full_name?: string;
}

export default function ForecastView() {
  const [prospects, setProspects] = useState<ForecastProspect[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'monthly' | 'weekly'>('monthly');
  const [selectedSalesperson, setSelectedSalesperson] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadForecastData();
    loadEmployees();
    // Set default to current month
    const today = new Date();
    setSelectedMonth(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);
  }, []);

  const loadForecastData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/prospects`);
      const data = res.ok ? await res.json() : [];
      // Filter to only prospects with forecast data
      const withForecast = (Array.isArray(data) ? data : []).filter(
        p => p.expected_closing_date || p.expected_payment_date || p.forecast_amount
      );
      setProspects(withForecast);
    } catch (err) {
      console.error('Error loading forecast data:', err);
      toast({ title: 'Error loading forecast data', variant: 'destructive' });
    }
    setLoading(false);
  };

  const loadEmployees = async () => {
    try {
      const res = await fetch(`${API_BASE}/employees`);
      const data = res.ok ? await res.json() : [];
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading employees:', err);
    }
  };

  const getMonthFromDate = (dateStr?: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  const getWeekFromDate = (dateStr?: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
  };

  const getWeekLabel = (weekStr: string): string => {
    const [year, week] = weekStr.split('-W');
    const weekNum = parseInt(week);
    // Calculate start and end dates of the week
    const startOfYear = new Date(parseInt(year), 0, 1);
    const daysOffset = (weekNum - 1) * 7 - startOfYear.getDay();
    const weekStart = new Date(startOfYear);
    weekStart.setDate(startOfYear.getDate() + daysOffset);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    return `Week ${weekNum} (${weekStart.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric', year: 'numeric' })})`;
  };

  const getEmployeeName = (employeeId?: number): string => {
    if (!employeeId) return 'Unassigned';
    const emp = employees.find(e => e.employee_id === employeeId);
    return emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown';
  };

  const filteredProspects = selectedSalesperson
    ? prospects.filter(p => p.assigned_to === selectedSalesperson)
    : prospects;

  const groupedByMonth = filteredProspects.reduce((acc, prospect) => {
    const closingDate = prospect.expected_closing_date || prospect.expected_payment_date;
    const month = getMonthFromDate(closingDate);
    if (!month) return acc;
    if (!acc[month]) acc[month] = [];
    acc[month].push(prospect);
    return acc;
  }, {} as Record<string, ForecastProspect[]>);

  const groupedByWeek = filteredProspects.reduce((acc, prospect) => {
    const closingDate = prospect.expected_closing_date || prospect.expected_payment_date;
    const week = getWeekFromDate(closingDate);
    if (!week) return acc;
    if (!acc[week]) acc[week] = [];
    acc[week].push(prospect);
    return acc;
  }, {} as Record<string, ForecastProspect[]>);

  const sortedMonths = Object.keys(groupedByMonth).sort();
  const sortedWeeks = Object.keys(groupedByWeek).sort();

  const calculatePeriodTotal = (prospects: ForecastProspect[]): number => {
    return prospects.reduce((sum, p) => {
      const prob = (p.forecast_probability || 0) / 100;
      return sum + ((p.forecast_amount || 0) * prob);
    }, 0);
  };

  const calculateMonthTotal = (month: string): number => {
    return calculatePeriodTotal(groupedByMonth[month] || []);
  };

  const calculateWeekTotal = (week: string): number => {
    return calculatePeriodTotal(groupedByWeek[week] || []);
  };

  const totalRevenue = viewMode === 'monthly' 
    ? sortedMonths.reduce((sum, month) => sum + calculateMonthTotal(month), 0)
    : sortedWeeks.reduce((sum, week) => sum + calculateWeekTotal(week), 0);

  const getStatusColor = (status?: string) => {
    switch ((status || '').toLowerCase()) {
      case 'qualified':
        return 'bg-green-100 text-green-800';
      case 'won':
        return 'bg-teal-100 text-teal-800';
      case 'lost':
        return 'bg-red-100 text-red-800';
      case 'proposal sent':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="p-6">Loading forecast data...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Sales Forecast</h2>
        <p className="text-gray-600">Expected closing dates and revenue forecast</p>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('monthly')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'monthly'
                ? 'bg-teal-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Monthly View
          </button>
          <button
            onClick={() => setViewMode('weekly')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'weekly'
                ? 'bg-teal-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Weekly View
          </button>
        </div>

        <div className="flex gap-2 items-center flex-wrap">
          <label className="text-sm font-medium text-gray-700">Filter by Salesperson:</label>
          <select
            value={selectedSalesperson || ''}
            onChange={(e) => setSelectedSalesperson(e.target.value ? parseInt(e.target.value) : null)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All Salespersons</option>
            {employees.map(emp => {
              const empId = emp.employee_id || emp.id;
              const empName = emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim();
              return (
                <option key={empId} value={empId}>
                  {empName}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <p className="text-sm text-gray-600">Total Forecast</p>
          <p className="text-3xl font-bold text-blue-900">
            R {totalRevenue.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {viewMode === 'monthly' ? sortedMonths.length : sortedWeeks.length} {viewMode === 'monthly' ? 'months' : 'weeks'} with opportunities
          </p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <p className="text-sm text-gray-600">Total Opportunities</p>
          <p className="text-3xl font-bold text-green-900">{filteredProspects.length}</p>
          <p className="text-xs text-gray-500 mt-1">Prospects with forecast data</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <p className="text-sm text-gray-600">Average Probability</p>
          <p className="text-3xl font-bold text-purple-900">
            {Math.round(filteredProspects.reduce((sum, p) => sum + (p.forecast_probability || 50), 0) / Math.max(filteredProspects.length, 1))}%
          </p>
          <p className="text-xs text-gray-500 mt-1">Across all opportunities</p>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Forecast by {viewMode === 'monthly' ? 'Month' : 'Week'}</h3>
        
        {(viewMode === 'monthly' ? sortedMonths : sortedWeeks).length === 0 ? (
          <Card className="p-6 text-center text-gray-500">
            No forecast data available. Add expected closing dates to prospects to see forecast.
          </Card>
        ) : viewMode === 'monthly' ? (
          sortedMonths.map(month => {
            const monthProspects = groupedByMonth[month] || [];
            const monthTotal = calculateMonthTotal(month);
            const monthDate = new Date(`${month}-01`);
            const monthLabel = monthDate.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });

            return (
              <Card key={month} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-lg">{monthLabel}</h4>
                    <p className="text-sm text-gray-600">{monthProspects.length} opportunities</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      R {monthTotal.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500">Expected revenue</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {monthProspects.map((prospect, idx) => {
                    const prospectId = prospect.prospect_id || prospect.id;
                    const name = prospect.deal_name || `${prospect.first_name || ''} ${prospect.last_name || ''}`.trim();
                    const expectedValue = ((prospect.forecast_amount || 0) * ((prospect.forecast_probability || 50) / 100));

                    return (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex-1">
                          <p className="font-medium">{name || 'Unknown'}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge className={getStatusColor(prospect.status)}>
                              {prospect.status || 'Unknown'}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {prospect.expected_payment_date && (
                                <>Payment: {new Date(prospect.expected_payment_date).toLocaleDateString()}</>
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-semibold">R {expectedValue.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                          <p className="text-xs text-gray-500">{prospect.forecast_probability || 50}% probability</p>
                          {prospect.forecast_amount && (
                            <p className="text-xs text-gray-400">
                              (R {prospect.forecast_amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })
        ) : (
          sortedWeeks.map(week => {
            const weekProspects = groupedByWeek[week] || [];
            const weekTotal = calculateWeekTotal(week);
            const weekLabel = getWeekLabel(week);

            return (
              <Card key={week} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-lg">{weekLabel}</h4>
                    <p className="text-sm text-gray-600">{weekProspects.length} opportunities</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      R {weekTotal.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500">Expected revenue</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {weekProspects.map((prospect, idx) => {
                    const prospectId = prospect.prospect_id || prospect.id;
                    const name = prospect.deal_name || `${prospect.first_name || ''} ${prospect.last_name || ''}`.trim();
                    const expectedValue = ((prospect.forecast_amount || 0) * ((prospect.forecast_probability || 50) / 100));

                    return (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex-1">
                          <p className="font-medium">{name || 'Unknown'}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge className={getStatusColor(prospect.status)}>
                              {prospect.status || 'Unknown'}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {prospect.expected_payment_date && (
                                <>Payment: {new Date(prospect.expected_payment_date).toLocaleDateString()}</>
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-semibold">R {expectedValue.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                          <p className="text-xs text-gray-500">{prospect.forecast_probability || 50}% probability</p>
                          {prospect.forecast_amount && (
                            <p className="text-xs text-gray-400">
                              (R {prospect.forecast_amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
