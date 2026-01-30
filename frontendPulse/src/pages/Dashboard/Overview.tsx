import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import { Ticket, Users, Activity, ExternalLink, ShieldCheck } from 'lucide-react';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import PageHeader from '../../components/common/PageHeader';

const Overview = () => {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({ total: 0, open: 0, closed: 0, avgUrgency: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      setLoading(true);
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
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  const resolutionRate = stats.total > 0 ? (stats.closed / stats.total) * 100 : 0;
  const globalLoad = Math.min(stats.avgUrgency * 10, 100); // Scale avg urgency (0-10) to 0-100%

  const statCards = [
    { label: 'Total Operations', value: stats.total.toString(), icon: Ticket, color: 'text-primary', bg: 'bg-primary/5' },
    { label: 'Active Issues', value: stats.open.toString(), icon: Activity, color: 'text-amber-500', bg: 'bg-amber-500/5' },
    { label: 'Completed Units', value: stats.closed.toString(), icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/5' }, 
  ];

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700">
      <Breadcrumbs />
      
      <PageHeader 
        title="Command Center" 
        description={
            <>
              Welcome back, <span className="text-slate-900 dark:text-slate-100 font-bold">{user?.user_metadata.name?.split(' ')[0]}</span>
            </>
        }
      >
        <div className="flex items-center p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-xl shadow-sm">
           <div className="flex items-center gap-3 px-4 py-2">
              <div className="relative">
                 <div className={`w-2.5 h-2.5 rounded-full ${['active', 'trialing'].includes(profile?.status || '') ? 'bg-emerald-500' : 'bg-amber-500'}`} aria-hidden="true" />
                 <div className={`absolute inset-0 w-2.5 h-2.5 rounded-full animate-ping ${['active', 'trialing'].includes(profile?.status || '') ? 'bg-emerald-500' : 'bg-amber-500'} opacity-20`} />
              </div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                 Pulse <span className="text-slate-900 dark:text-slate-100 underline decoration-blue-500/40 underline-offset-4">{profile?.subscription_tier || 'Free'}</span>
              </span>
           </div>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="group relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} border border-slate-200 dark:border-white/10`}>
                  <Icon size={22} aria-hidden="true" />
                </div>
              </div>
              <div className="space-y-1">
                 <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest opacity-60">{stat.label}</p>
                 <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{stat.value}</h2>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-2xl p-8 shadow-sm">
           <div className="flex justify-between items-start mb-8">
              <div className="space-y-2">
                 <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">System Intelligence</h2>
                 <p className="text-slate-500 dark:text-slate-400 text-sm font-medium opacity-70">Automated urgency scoring and team analytics.</p>
              </div>
              <button className="p-2 hover:bg-slate-50 dark:hover:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-500 dark:text-slate-400 transition-all">
                 <ExternalLink size={18} aria-hidden="true" />
              </button>
           </div>
           
           <div className="grid grid-cols-2 gap-4">
              <div className="p-5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl">
                 <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 opacity-50">Global Load</div>
                 <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {loading ? '...' : `${globalLoad.toFixed(1)}%`}
                 </div>
              </div>
              <div className="p-5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl">
                 <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 opacity-50">Resolution Rate</div>
                 <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {loading ? '...' : `${resolutionRate.toFixed(1)}%`}
                 </div>
              </div>
           </div>
        </div>

        <div className="lg:col-span-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-2xl p-8 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-6">Quick Actions</h2>
          <div className="space-y-3">
             <button className="w-full flex items-center justify-between px-5 py-4 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.01] transition-all active:scale-95 group">
               Deploy New Ticket
               <Ticket size={18} aria-hidden="true" className="group-hover:rotate-12 transition-transform" />
             </button>
             <button className="w-full flex items-center justify-between px-5 py-4 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 font-bold text-sm hover:bg-slate-50 dark:hover:bg-white/10 transition-all active:scale-95 group">
               Onboard Specialist
               <Users size={18} aria-hidden="true" className="group-hover:scale-110 transition-transform" />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
