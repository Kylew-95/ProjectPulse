import { Clock, Ticket as TicketIcon, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import PageHeader from '../../components/common/PageHeader';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import PremiumGate from '../../components/ui/PremiumGate';
import type { Ticket } from '../../types/ticket';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6'];

interface AnalyticsData {
  total: number;
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  by_type: Record<string, number>;
  urgency_avg: number;
  daily_trends: { date: string; count: number }[];
}

const Analytics = () => {
  const { user, profile } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: tickets, error } = await supabase
        .from('tickets')
        .select('id, status, priority, type, urgency_score, created_at')
        .returns<Ticket[]>();

      if (error) throw error;

      // Client-side Aggregation
      const stats: AnalyticsData = {
        total: tickets?.length || 0,
        by_status: {},
        by_priority: {},
        by_type: {},
        urgency_avg: 0,
        daily_trends: []
      };

      if (!tickets || tickets.length === 0) {
        setData(stats);
        setLoading(false);
        return;
      }

      let totalUrgency = 0;
      const trendsMap: Record<string, number> = {};

      tickets.forEach(t => {
        // Status
        const status = (t.status || 'open').toLowerCase();
        stats.by_status[status] = (stats.by_status[status] || 0) + 1;

        // Priority
        const priority = (t.priority || 'medium').toLowerCase();
        stats.by_priority[priority] = (stats.by_priority[priority] || 0) + 1;

        // Type (fix: use 'type' field or default)
        // Note: usage of 't.type' requires ensuring it exists in schema/types, assuming it does based on db schema
        const type = ((t as Ticket).type || 'support').toLowerCase();
        stats.by_type[type] = (stats.by_type[type] || 0) + 1;

        // Urgency
        totalUrgency += (t.urgency_score || 0);

        // Daily Trends
        const date = t.created_at.substring(0, 10); // YYYY-MM-DD
        trendsMap[date] = (trendsMap[date] || 0) + 1;
      });

      stats.urgency_avg = totalUrgency / tickets.length;

      // Transform trends map to sorted array (last 7 days logic could be added or just show all/recent)
      // Showing all sorted by date
      stats.daily_trends = Object.entries(trendsMap)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-7); // Keep last 7 days for the chart

      setData(stats);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (profile && !['enterprise', 'super_admin'].includes(profile.subscription_tier || '')) {
        setForbidden(true);
        setLoading(false);
        return;
    }
    
    fetchData();

    // Subscribe to real-time changes to tickets to refresh analytics
    const channel = supabase
      .channel('analytics-realtime')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'tickets' }, 
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData, profile]);

  const statusData = data ? Object.entries(data.by_status).map(([name, value]) => ({ name, value })) : [];
  const priorityData = data ? Object.entries(data.by_priority).map(([name, value]) => ({ name, value })) : [];

  if (loading && !data) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (forbidden || (profile && !['enterprise', 'super_admin'].includes(profile.subscription_tier || ''))) {
    return (
      <PremiumGate 
        title="Enterprise Intelligence"
        description="Unlock advanced analytics, growth trends, and priority distribution insights to scale your operations."
        features={[
            "Real-time Growth Analytics",
            "Priority Distribution Mapping",
            "Urgency Score Correlation",
            "Custom Trend Reports",
            "Team Efficiency Metrics"
        ]}
      />
    );
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto min-h-screen font-sans selection:bg-primary/30 space-y-8 animate-in fade-in duration-700">
      <Breadcrumbs />

      <PageHeader 
        title="Intelligence Analytics" 
        description="Data-driven insights into your support ecosystem."
      >
        <button 
            onClick={fetchData}
            className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-500 rounded-lg transition-all border border-slate-200 dark:border-white/5 active:scale-95 group shadow-sm"
            title="Refresh data"
        >
            <Clock size={16} className={`${loading ? "animate-spin" : "group-hover:rotate-180"} transition-transform duration-500`} />
        </button>
      </PageHeader>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
            <div className="flex items-center gap-4 mb-2">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                    <TicketIcon size={20} />
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Tickets</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{data?.total || 0}</h2>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
            <div className="flex items-center gap-4 mb-2">
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
                    <AlertCircle size={20} />
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Avg Urgency</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{data?.urgency_avg.toFixed(1) || 0}</h2>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
            <div className="flex items-center gap-4 mb-2">
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                    <CheckCircle2 size={20} />
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Ratio</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                {data ? (((data.by_status['open'] || 0) / data.total) * 100).toFixed(0) : 0}%
            </h2>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
            <div className="flex items-center gap-4 mb-2">
                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                    <TrendingUp size={20} />
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Growth</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                +{data?.daily_trends[data.daily_trends.length - 1]?.count || 0} today
            </h2>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Daily Trends Chart */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Volume Trends (7 Days)</h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data?.daily_trends}>
                        <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                        <XAxis dataKey="date" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                            itemStyle={{ color: '#6366f1' }}
                        />
                        <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Priority Breakdown Chart */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Priority Distribution</h3>
            <div className="h-[300px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={priorityData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {priorityData.map((_entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2 ml-4">
                    {priorityData.map((entry, index) => (
                        <div key={entry.name} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                            <span className="text-xs font-medium text-slate-500 capitalize">{entry.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Status Distribution Chart */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm lg:col-span-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Status Distribution</h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                        <XAxis 
                            dataKey="name" 
                            stroke="#888" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false} 
                            tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                        />
                        <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                            cursor={{ fill: '#88888810' }}
                        />
                        <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
