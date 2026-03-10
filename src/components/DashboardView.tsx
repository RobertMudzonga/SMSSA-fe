import StatsCard from './StatsCard';

interface DashboardViewProps {
  stats: {
    totalProspects: number;
    activeProjects: number;
    submittedProjects: number;
    pendingDocuments: number;
    projectsRevenue: number;
    projectsRevenueReceived: number;
    prospectsRevenue: number;
    totalRevenue: number;
  };
}

export default function DashboardView({ stats }: DashboardViewProps) {
  const formatAbbreviated = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 1_000_000_000) {
      return `${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}b`;
    }
    if (absValue >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`;
    }
    if (absValue >= 1_000) {
      return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
    }
    return value.toLocaleString();
  };

  const formatCurrencyCompact = (value: number) => `R${formatAbbreviated(value)}`;
  const formatCurrencyFull = (value: number) => `R${value.toLocaleString()}`;

  return (
    <div className="space-y-6">
      <div className="relative h-64 rounded-xl overflow-hidden">
        <img 
          src="https://d64gsuwffb70l.cloudfront.net/6915a005748fa6d0fd1cc7c8_1763024990335_8f7abae7.webp"
          alt="Dashboard Hero"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 to-slate-900/50 flex items-center">
          <div className="px-8">
            <h1 className="text-4xl font-bold text-white mb-2">Welcome to ImmigratePro</h1>
            <p className="text-xl text-gray-200">Manage your immigration cases with confidence</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatsCard 
          title="Total Prospects" 
          value={stats.totalProspects}
          icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
          color="bg-blue-500"
          trend="+12% this month"
        />
        <StatsCard 
          title="Active Projects" 
          value={stats.activeProjects}
          icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
          color="bg-teal-500"
        />
        <StatsCard 
          title="Submitted Projects" 
          value={stats.submittedProjects}
          icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          color="bg-purple-500"
        />
        <StatsCard 
          title="Pending Docs" 
          value={stats.pendingDocuments}
          icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
          color="bg-yellow-500"
        />
      </div>

      {/* Revenue Cards - Separate Project and Prospect Revenue */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard 
          title="Projects Revenue" 
          value={formatCurrencyCompact(stats.projectsRevenue)}
          tooltip={formatCurrencyFull(stats.projectsRevenue)}
          icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
          color="bg-indigo-500"
        />
        <StatsCard 
          title="Projects Revenue Received" 
          value={formatCurrencyCompact(stats.projectsRevenueReceived)}
          tooltip={formatCurrencyFull(stats.projectsRevenueReceived)}
          icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m7-4a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          color="bg-green-600"
        />
        <StatsCard 
          title="Prospects Revenue" 
          value={formatCurrencyCompact(stats.prospectsRevenue)}
          tooltip={formatCurrencyFull(stats.prospectsRevenue)}
          icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
          color="bg-orange-500"
        />
        <StatsCard 
          title="Total Revenue" 
          value={formatCurrencyCompact(stats.totalRevenue)}
          tooltip={formatCurrencyFull(stats.totalRevenue)}
          icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          color="bg-green-500"
          trend="+8% this month"
        />
      </div>
    </div>
  );
}
