import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import { Ticket, TrendingUp, Users, Activity } from 'lucide-react';

const Overview = () => {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({ total: 0, open: 0, closed: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      const { data } = await supabase.from('tickets').select('status');
      if (data) {
        const total = data.length;
        const closed = data.filter(t => t.status === 'done' || t.status === 'closed').length;
        const open = total - closed;
        setStats({ total, open, closed });
      }
    };
    fetchStats();
  }, [user]);

  const statCards = [
    { label: 'Total Tickets', value: stats.total.toString(), icon: Ticket, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Open Tickets', value: stats.open.toString(), icon: Activity, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: 'Closed Tickets', value: stats.closed.toString(), icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/10' }, // Reusing Users icon for now or checklucide
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
           <p className="text-slate-400">Welcome back, {user?.email?.split('@')[0]}</p>
        </div>
        
        {/* Subscription Status Banner */}
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-900/50 border border-white/5 backdrop-blur-sm shadow-xl">
          <span className={`w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor] ${['active', 'trialing'].includes(profile?.status || '') ? 'bg-emerald-500 text-emerald-500' : 'bg-yellow-500 text-yellow-500'}`}></span>
          <span className="text-sm font-medium text-slate-300">
             {profile?.subscription_tier?.toUpperCase() || 'FREE'} <span className="text-slate-500">Plan</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="group relative bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 hover:bg-slate-800/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/50">
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} ring-1 ring-white/5`}>
                  <Icon size={22} />
                </div>
              </div>
              <div className="relative z-10">
                 <p className="text-slate-400 text-sm font-medium mb-1">{stat.label}</p>
                 <h3 className="text-3xl font-bold text-white tracking-tight">{stat.value}</h3>
              </div>
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.bg.replace('/10', '/5')} to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none`} />
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Quick Actions - Full width if Activity gone? Or centered? User requested removal of fake stats. */}
        <div className="lg:col-span-1 bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-8">
          <h3 className="text-lg font-bold text-white mb-6">Quick Actions</h3>
          <div className="space-y-3">
             <button className="w-full text-left px-4 py-3.5 rounded-xl bg-primary hover:bg-blue-600 text-white transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 text-sm font-medium flex items-center justify-between group">
               New Ticket
               <Ticket size={16} className="group-hover:rotate-12 transition-transform" />
             </button>
             <button className="w-full text-left px-4 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all border border-white/5 hover:border-white/10 text-sm font-medium flex items-center justify-between group">
               Invite Member
               <Users size={16} className="group-hover:scale-110 transition-transform" />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
