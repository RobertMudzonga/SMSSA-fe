import { TrendingUp, Users, Target } from 'lucide-react';

interface PipelineStatsProps {
  prospects: any[];
}

export default function PipelineStats({ prospects }: PipelineStatsProps) {
  // Exclude explicitly lost deals from pipeline calculations
  const isLost = (p: any) => p.status && String(p.status).toLowerCase() === 'lost';

  // Consider a deal "won" if its pipeline stage indicates acceptance/invoice or status explicitly set to 'won'
  const wonStages = ['quote_accepted', 'engagement_sent', 'invoice_sent'];
  const isWon = (p: any) => wonStages.includes(p.pipeline_stage) || (p.status && String(p.status).toLowerCase() === 'won');

  // Pipeline members: all deals that are not lost
  const pipelineMembers = prospects.filter(p => !isLost(p));
  const totalPipelineDeals = pipelineMembers.length;

  // Total pipeline value is sum of quote amounts for all deals in the pipeline (excluding lost)
  const totalPipelineValue = pipelineMembers.reduce((sum, p) => sum + (Number(p.quote_amount) || 0), 0);

  // Avg deal size across the pipeline (excluding lost)
  const avgDealSize = totalPipelineDeals > 0 ? totalPipelineValue / totalPipelineDeals : 0;

  const wonDeals = pipelineMembers.filter(p => isWon(p)).length;
  const conversionRate = totalPipelineDeals > 0 ? (wonDeals / totalPipelineDeals) * 100 : 0;

  const activeLeads = pipelineMembers.filter(p => !isWon(p)).length;

  const stats = [
    { label: 'Total Pipeline Value', value: `ZAR ${totalPipelineValue.toLocaleString()}`, icon: Target, color: 'bg-green-100 text-green-600' },
    { label: 'Active Leads', value: activeLeads, icon: Users, color: 'bg-blue-100 text-blue-600' },
    { label: 'Avg Deal Size', value: `ZAR ${avgDealSize > 0 ? avgDealSize.toFixed(2) : '0.00'}`, icon: TrendingUp, color: 'bg-purple-100 text-purple-600' },
    { label: 'Conversion Rate', value: `${conversionRate.toFixed(1)}%`, icon: TrendingUp, color: 'bg-teal-100 text-teal-600' }

  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
            <div className={`p-3 rounded-lg ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
