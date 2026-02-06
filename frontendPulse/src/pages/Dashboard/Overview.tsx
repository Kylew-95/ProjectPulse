import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import { Ticket, Activity, ShieldCheck, TrendingUp } from 'lucide-react';
import CommandHeader from './components/Overview/CommandHeader';
import PremiumStatCard from './components/Overview/PremiumStatCard';

const Overview = () => {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({ total: 0, open: 0, closed: 0, avgUrgency: 0 });

  const fetchStats = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await supabase.from('tickets').select('status, urgency_score');
      if (data) {
        const total = data.length;
        const closed = data.filter(t => t.status === 'done' || t.status === 'closed').length;
        const open = total - closed;
        const avgUrgency = total > 0 
          ? data.reduce((acc, t) => acc + (t.urgency_score || 0), 0) / total 
          : 0;
        
        setStats({ total, open, closed, avgUrgency });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [user]);

  useEffect(() => {
    const initFetch = async () => {
      await fetchStats();
    };
    initFetch();

    const channel = supabase
      .channel('overview-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => fetchStats())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchStats]);

  const resolutionRate = stats.total > 0 ? (stats.closed / stats.total) * 100 : 0;
  const globalLoad = Math.min(stats.avgUrgency * 10, 100);

  return (
    <div className="max-w-[1400px] mx-auto p-6 md:p-10 animate-in fade-in duration-500">
      <CommandHeader 
        userName={profile?.full_name || user?.user_metadata.full_name || 'User'} 
        plan={profile?.subscription_tier || 'Starter'} 
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <PremiumStatCard 
          title="Total Operations" 
          value={stats.total} 
          icon={Ticket} 
          color="#3b82f6" 
          trend="↑ 12%"
        />
        <PremiumStatCard 
          title="Active Issues" 
          value={stats.open} 
          icon={Activity} 
          color="#f59e0b" 
          trend="↓ 5%"
          trendIsPositive={false}
        />
        <PremiumStatCard 
          title="Success Rate" 
          value={`${resolutionRate.toFixed(0)}%`} 
          icon={ShieldCheck} 
          color="#10b981" 
          trend="Optimal"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-sm">
           <div className="flex justify-between items-center mb-8">
              <div className="space-y-1">
                 <h2 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">System Intelligence</h2>
                 <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Monitoring automated urgency scoring and team analytics.</p>
              </div>
              <TrendingUp size={18} className="text-slate-400" />
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Utility Load</p>
                 <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-3xl font-semibold text-slate-900 dark:text-white">{globalLoad.toFixed(1)}</span>
                    <span className="text-sm font-medium text-slate-500">%</span>
                 </div>
                 <div className="h-1.5 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${globalLoad}%` }}></div>
                 </div>
              </div>

              <div className="p-6 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Resolution Velocity</p>
                 <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-3xl font-semibold text-slate-900 dark:text-white">{resolutionRate.toFixed(1)}</span>
                    <span className="text-sm font-medium text-slate-500">%</span>
                 </div>
                 <div className="h-1.5 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${resolutionRate}%` }}></div>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default Overview;
