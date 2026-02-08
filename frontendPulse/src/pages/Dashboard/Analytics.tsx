import { Clock } from 'lucide-react';
import { useState } from 'react';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import PageHeader from '../../components/common/PageHeader';
import SubscriptionGate from '../../components/ui/SubscriptionGate';

// Components
import VolumeTrends from './components/Analytics/VolumeTrends';
import DistributionPieChart from './components/Analytics/DistributionPieChart';
import StatusDistribution from './components/Analytics/StatusDistribution';
import TeamWorkload from './components/Analytics/TeamWorkload';
import AnalyticsCustomizer from './components/Analytics/AnalyticsCustomizer';
import ActivityHeatmap from './components/Analytics/ActivityHeatmap';
import AnalyticsOverview from './components/Analytics/AnalyticsOverview';

// Hooks
import { useAnalyticsData, type TimeRange } from './hooks/useAnalyticsData';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6'];

const Analytics = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [activeWidgets, setActiveWidgets] = useState<Record<string, boolean>>({
    volume: true, priority: true, status: true, type: true, workload: true, heatmap: true
  });
  const [showCustomizer, setShowCustomizer] = useState(false);
  
  const { data, loading, refresh } = useAnalyticsData(timeRange);

  if (loading && !data) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen font-sans">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const toggleWidget = (id: string) => setActiveWidgets(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="p-6 max-w-[1600px] mx-auto min-h-screen font-sans selection:bg-primary/30 space-y-8 animate-in fade-in duration-700">
      <Breadcrumbs />

      <PageHeader title="Intelligence Analytics" description="Data-driven insights into your support ecosystem.">
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-lg shadow-sm mr-2">
                {(['7d', '30d', 'all'] as const).map((range) => (
                    <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] rounded-md transition-all active:scale-95 ${
                            timeRange === range ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5"
                        }`}
                    >
                        {range}
                    </button>
                ))}
            </div>

            <button onClick={refresh} className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-500 rounded-lg transition-all border border-slate-200 dark:border-white/5 active:scale-95 group shadow-sm" title="Refresh data">
                <Clock size={16} className={`${loading ? "animate-spin" : "group-hover:rotate-180"} transition-transform duration-500`} />
            </button>

            <AnalyticsCustomizer showCustomizer={showCustomizer} setShowCustomizer={setShowCustomizer} activeWidgets={activeWidgets} toggleWidget={toggleWidget} />
        </div>
      </PageHeader>

      <AnalyticsOverview data={data} timeRange={timeRange} />

      <SubscriptionGate 
        tier="pro"
        featureName="Intelligence Analytics"
        description="Unlock advanced analytics, growth trends, and priority distribution insights to scale your operations."
        features={[
          "Priority Analytics & Trends",
          "Custom Team Roles",
          "Multi-Team Management",
          "Growth & Velocity Tracking",
          "Enhanced API Access"
        ]}
      >
        <div className="grid lg:grid-cols-2 gap-8">
          {activeWidgets.volume && <VolumeTrends data={data?.daily_trends || []} />}
          {activeWidgets.priority && <DistributionPieChart title="Priority Distribution" data={data ? Object.entries(data.by_priority).map(([name, value]) => ({ name, value })) : []} colors={COLORS} />}
          {activeWidgets.type && <DistributionPieChart title="Ticket Type Breakdown" data={data ? Object.entries(data.by_type).map(([name, value]) => ({ name, value })) : []} colors={COLORS} innerRadius={70} paddingAngle={8} colorOffset={3} />}
          {activeWidgets.status && <StatusDistribution data={data ? Object.entries(data.by_status).map(([name, value]) => ({ name, value })) : []} />}
          {activeWidgets.workload && <TeamWorkload data={data?.workload || []} />}
          {activeWidgets.heatmap && data && <ActivityHeatmap data={data.heatmap} />}
        </div>
      </SubscriptionGate>
    </div>
  );
};

export default Analytics;
