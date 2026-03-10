import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, AlertTriangle, Award, DollarSign, Target, Users, CheckCircle } from 'lucide-react';
import { API_BASE } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface KPIData {
  kpi_id?: number;
  employee_id: number;
  period_month: string;
  revenue: number;
  submissions: number;
  approval_rate: number;
  client_satisfaction_score: number;
  compliance: boolean;
  team_score: number;
  kpi_score: number;
  performance_label: string;
  commission: number;
  pip_flag: boolean;
  promotion_ready: boolean;
  manager_notes: string;
  reviewer_id?: number;
}

interface KPIConfig {
  role: string;
  revenue: {
    weight: number;
    target: number;
    commissionTrigger: number;
    commissionRate: number;
  };
  submissions?: {
    weight: number;
    target: number;
    approvalRate: number;
  };
  teamPerformance?: {
    weight: number;
  };
  clientSatisfaction: {
    weight: number;
    minScore: number;
  };
  compliance: {
    weight: number;
  };
  promotionScore: number;
}

interface EmployeeKPITabProps {
  employeeId: number;
  employeeName: string;
  jobPosition: string;
}

export function EmployeeKPITab({ employeeId, employeeName, jobPosition }: EmployeeKPITabProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [kpiConfig, setKpiConfig] = useState<KPIConfig | null>(null);
  const [currentKPI, setCurrentKPI] = useState<KPIData | null>(null);
  const [history, setHistory] = useState<KPIData[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  // Form state
  const [revenue, setRevenue] = useState<number>(0);
  const [submissions, setSubmissions] = useState<number>(0);
  const [approvalRate, setApprovalRate] = useState<number>(0);
  const [clientScore, setClientScore] = useState<number>(0);
  const [compliance, setCompliance] = useState<boolean>(true);
  const [teamScore, setTeamScore] = useState<number>(0);
  const [managerNotes, setManagerNotes] = useState<string>('');

  useEffect(() => {
    loadKPIData();
  }, [employeeId]);

  useEffect(() => {
    // Set default month to current month
    const now = new Date();
    const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    setSelectedMonth(defaultMonth);
  }, []);

  useEffect(() => {
    // Auto-fetch revenue when month changes
    if (selectedMonth) {
      fetchMonthlyRevenue(selectedMonth);
      // Auto-fetch team score for Senior Consultants
      if (jobPosition === 'Senior Consultant') {
        fetchTeamScore(selectedMonth);
      }
    }
  }, [selectedMonth]);

  const loadKPIData = async () => {
    setLoading(true);
    try {
      // Load KPI config
      const configRes = await fetch(`${API_BASE}/kpis/config/${encodeURIComponent(jobPosition)}`);
      if (configRes.ok) {
        const config = await configRes.json();
        setKpiConfig(config);
      }

      // Load latest KPI
      const latestRes = await fetch(`${API_BASE}/kpis/employee/${employeeId}/latest`);
      if (latestRes.ok) {
        const latest = await latestRes.json();
        if (latest) {
          setCurrentKPI(latest);
          populateFormFromKPI(latest);
        }
      }

      // Load KPI history
      const historyRes = await fetch(`${API_BASE}/kpis/employee/${employeeId}/history?limit=6`);
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistory(historyData);
      }
    } catch (err) {
      console.error('Error loading KPI data:', err);
      toast({
        title: 'Error',
        description: 'Failed to load KPI data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyRevenue = async (month: string) => {
    try {
      const monthStr = month.substring(0, 7); // YYYY-MM format
      const revenueRes = await fetch(`${API_BASE}/kpis/revenue/${employeeId}/${monthStr}`);
      if (revenueRes.ok) {
        const revenueData = await revenueRes.json();
        setRevenue(revenueData.monthly_revenue || 0);
      }
    } catch (err) {
      console.error('Error fetching monthly revenue:', err);
    }
  };

  const fetchTeamScore = async (month: string) => {
    try {
      const monthStr = month.substring(0, 7); // YYYY-MM format
      const teamRes = await fetch(`${API_BASE}/kpis/team-score/${employeeId}/${monthStr}`);
      if (teamRes.ok) {
        const teamData = await teamRes.json();
        setTeamScore(teamData.team_score || 0);
        setTeamMembers(teamData.team_members || []);
      }
    } catch (err) {
      console.error('Error fetching team score:', err);
    }
  };

  const populateFormFromKPI = (kpi: KPIData) => {
    setRevenue(Number(kpi.revenue) || 0);
    setSubmissions(Number(kpi.submissions) || 0);
    setApprovalRate(Number(kpi.approval_rate) || 0);
    setClientScore(Number(kpi.client_satisfaction_score) || 0);
    setCompliance(kpi.compliance !== false);
    setTeamScore(Number(kpi.team_score) || 0);
    setManagerNotes(kpi.manager_notes || '');
  };

  const handleSaveKPI = async () => {
    if (!selectedMonth) {
      toast({
        title: 'Error',
        description: 'Please select a period month',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        employee_id: employeeId,
        period_month: selectedMonth,
        revenue,
        submissions,
        approval_rate: approvalRate,
        client_satisfaction_score: clientScore,
        compliance,
        team_score: teamScore,
        manager_notes: managerNotes,
        reviewer_id: user?.id || null
      };

      const res = await fetch(`${API_BASE}/kpis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || ''
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Failed to save KPI');
      }

      const savedKPI = await res.json();
      setCurrentKPI(savedKPI);
      
      toast({
        title: 'Success',
        description: 'KPI data saved successfully'
      });

      // Reload data
      await loadKPIData();
    } catch (err) {
      console.error('Error saving KPI:', err);
      toast({
        title: 'Error',
        description: 'Failed to save KPI data',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `R${Number(amount).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const getPerformanceBadgeVariant = (label: string) => {
    if (label?.includes('Exceeds')) return 'default';
    if (label?.includes('Meets')) return 'secondary';
    if (label?.includes('Below') || label?.includes('Critical')) return 'destructive';
    return 'outline';
  };

  if (loading) {
    return <div className="p-6">Loading KPI data...</div>;
  }

  if (!kpiConfig) {
    return (
      <div className="p-6">
        <Alert>
          <AlertDescription>
            No KPI configuration found for job position: <strong>{jobPosition}</strong>
            <br />
            KPI tracking is available for: Immigration Support Specialist, Immigration Consultant, and Senior Consultant.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const isSeniorConsultant = kpiConfig.role === 'SENIOR_CONSULTANT';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">KPI Performance Dashboard</h3>
          <p className="text-gray-500">{employeeName} - {jobPosition}</p>
        </div>
        <Badge variant="outline" className="text-lg">
          {kpiConfig.role}
        </Badge>
      </div>

      {/* Current Performance Summary */}
      {currentKPI && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">KPI Score</span>
            </div>
            <p className="text-3xl font-bold">{Number(currentKPI.kpi_score).toFixed(1)}%</p>
            <Badge variant={getPerformanceBadgeVariant(currentKPI.performance_label)} className="mt-2">
              {currentKPI.performance_label}
            </Badge>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-600">Commission</span>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(currentKPI.commission)}</p>
            <p className="text-xs text-gray-500 mt-2">
              Earned: {formatDate(currentKPI.period_month)}
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-600">Revenue</span>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(currentKPI.revenue)}</p>
            <p className="text-xs text-gray-500 mt-2">
              Target: {formatCurrency(kpiConfig.revenue.target)}
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              {currentKPI.promotion_ready ? (
                <Award className="w-5 h-5 text-yellow-600" />
              ) : currentKPI.pip_flag ? (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
              <span className="text-sm font-medium text-gray-600">Status</span>
            </div>
            {currentKPI.promotion_ready && (
              <div className="mt-2">
                <Badge className="bg-green-600">✅ Promotion Ready</Badge>
              </div>
            )}
            {currentKPI.pip_flag && (
              <div className="mt-2">
                <Badge variant="destructive">⚠ PIP Triggered</Badge>
              </div>
            )}
            {!currentKPI.promotion_ready && !currentKPI.pip_flag && (
              <div className="mt-2">
                <Badge variant="secondary">On Track</Badge>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* PIP Alert */}
      {currentKPI?.pip_flag && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Performance Improvement Plan (PIP) Triggered</strong>
            <br />
            This employee's KPI score is below 70% or has been consistently below 80%. Immediate coaching and support recommended.
          </AlertDescription>
        </Alert>
      )}

      {/* Input Form */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold mb-4">Update KPI Metrics</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label htmlFor="period_month">Performance Period</Label>
            <Input
              id="period_month"
              type="month"
              value={selectedMonth ? selectedMonth.substring(0, 7) : ''}
              onChange={(e) => setSelectedMonth(`${e.target.value}-01`)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="revenue">
              Monthly Revenue (R) 
              <span className="text-xs text-gray-500 ml-2">
                Weight: {kpiConfig.revenue.weight}% | Target: {formatCurrency(kpiConfig.revenue.target)}
              </span>
            </Label>
            <div className="text-xs text-blue-600 mb-2">Auto-fetched from closed prospects</div>
            <Input
              id="revenue"
              type="number"
              value={revenue}
              disabled={true}
              placeholder="Auto-calculated from closed prospects"
              className="mt-1 bg-blue-50"
            />
          </div>

          {kpiConfig.submissions && (
            <>
              <div>
                <Label htmlFor="submissions">
                  Submissions 
                  <span className="text-xs text-gray-500 ml-2">
                    Weight: {kpiConfig.submissions.weight}% | Target: {kpiConfig.submissions.target}
                  </span>
                </Label>
                <Input
                  id="submissions"
                  type="number"
                  value={submissions}
                  onChange={(e) => setSubmissions(Number(e.target.value))}
                  placeholder="0"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="approval_rate">
                  Approval Rate (%) 
                  <span className="text-xs text-gray-500 ml-2">
                    Target: {kpiConfig.submissions.approvalRate}%
                  </span>
                </Label>
                <Input
                  id="approval_rate"
                  type="number"
                  step="0.1"
                  value={approvalRate}
                  onChange={(e) => setApprovalRate(Number(e.target.value))}
                  placeholder="0.0"
                  className="mt-1"
                />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="client_score">
              Client Satisfaction (1-5) 
              <span className="text-xs text-gray-500 ml-2">
                Weight: {kpiConfig.clientSatisfaction.weight}% | Min: {kpiConfig.clientSatisfaction.minScore}
              </span>
            </Label>
            <Input
              id="client_score"
              type="number"
              step="0.1"
              min="0"
              max="5"
              value={clientScore}
              onChange={(e) => setClientScore(Number(e.target.value))}
              placeholder="0.0"
              className="mt-1"
            />
          </div>

          {isSeniorConsultant && (
            <div>
              <Label htmlFor="team_score">
                Team KPI Score (%) 
                <span className="text-xs text-gray-500 ml-2">
                  Weight: {kpiConfig.teamPerformance?.weight}%
                </span>
              </Label>
              <div className="text-xs text-blue-600 mb-2">Auto-calculated from department KPI</div>
              <Input
                id="team_score"
                type="number"
                value={teamScore}
                disabled={true}
                placeholder="Auto-calculated from team members"
                className="mt-1 bg-blue-50"
              />
            </div>
          )}

          <div>
            <Label htmlFor="compliance">Compliance Status</Label>
            <Select value={compliance ? 'true' : 'false'} onValueChange={(v) => setCompliance(v === 'true')}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">✓ Compliant</SelectItem>
                <SelectItem value="false">✗ Non-Compliant</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mb-4">
          <Label htmlFor="manager_notes">Manager Notes & Feedback</Label>
          <Textarea
            id="manager_notes"
            value={managerNotes}
            onChange={(e) => setManagerNotes(e.target.value)}
            placeholder="Add coaching notes, improvement plans, achievements, or feedback..."
            className="mt-1 min-h-[100px]"
          />
        </div>

        <Button onClick={handleSaveKPI} disabled={saving} className="w-full">
          {saving ? 'Saving...' : 'Save KPI Data'}
        </Button>
      </Card>

      {/* KPI History */}
      {history.length > 0 && (
        <Card className="p-6">
          <h4 className="text-lg font-semibold mb-4">Performance History</h4>
          <div className="space-y-3">
            {history.map((kpi) => (
              <div key={kpi.kpi_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{formatDate(kpi.period_month)}</p>
                  <p className="text-sm text-gray-500">Score: {Number(kpi.kpi_score).toFixed(1)}%</p>
                </div>
                <div className="text-right">
                  <Badge variant={getPerformanceBadgeVariant(kpi.performance_label)}>
                    {kpi.performance_label}
                  </Badge>
                  <p className="text-sm text-gray-500 mt-1">
                    Commission: {formatCurrency(kpi.commission)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Team Members KPI (for Senior Consultants) */}
      {isSeniorConsultant && teamMembers.length > 0 && (
        <Card className="p-6">
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Department Team KPI
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2 px-2">Team Member</th>
                  <th className="text-right py-2 px-2">KPI Score</th>
                  <th className="text-right py-2 px-2">Revenue</th>
                  <th className="text-center py-2 px-2">Conversions</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((member) => (
                  <tr key={member.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2">{member.full_name}</td>
                    <td className="text-right py-2 px-2">
                      <Badge variant={member.kpi_score >= 80 ? 'default' : member.kpi_score >= 70 ? 'secondary' : 'destructive'}>
                        {Number(member.kpi_score).toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="text-right py-2 px-2">{formatCurrency(member.total_revenue || 0)}</td>
                    <td className="text-center py-2 px-2">{member.conversions_count || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded">
            <p className="text-sm text-gray-600">
              <strong>Team Average KPI:</strong> {Number(teamScore).toFixed(1)}% from {teamMembers.length} team member{teamMembers.length !== 1 ? 's' : ''}
            </p>
          </div>
        </Card>
      )}

      {/* KPI Configuration Reference */}
      <Card className="p-6 bg-blue-50">
        <h4 className="text-lg font-semibold mb-3">KPI Weighting & Targets</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <strong>Revenue:</strong> {kpiConfig.revenue.weight}% weight, Target: {formatCurrency(kpiConfig.revenue.target)}
            <br />
            <span className="text-xs text-gray-600">
              Commission: {(kpiConfig.revenue.commissionRate * 100).toFixed(0)}% above {formatCurrency(kpiConfig.revenue.commissionTrigger)}
            </span>
          </div>
          {kpiConfig.submissions && (
            <div>
              <strong>Submissions:</strong> {kpiConfig.submissions.weight}% weight, Target: {kpiConfig.submissions.target}
              <br />
              <span className="text-xs text-gray-600">
                Min approval rate: {kpiConfig.submissions.approvalRate}%
              </span>
            </div>
          )}
          <div>
            <strong>Client Satisfaction:</strong> {kpiConfig.clientSatisfaction.weight}% weight, Min: {kpiConfig.clientSatisfaction.minScore}/5.0
          </div>
          <div>
            <strong>Compliance:</strong> {kpiConfig.compliance.weight}% weight (Pass/Fail)
          </div>
          {kpiConfig.teamPerformance && (
            <div>
              <strong>Team Performance:</strong> {kpiConfig.teamPerformance.weight}% weight
            </div>
          )}
          <div className="col-span-2">
            <strong>Promotion Threshold:</strong> {kpiConfig.promotionScore}% overall score
            <br />
            <strong>PIP Trigger:</strong> Below 70% or consistently below 80%
          </div>
        </div>
      </Card>
    </div>
  );
}
