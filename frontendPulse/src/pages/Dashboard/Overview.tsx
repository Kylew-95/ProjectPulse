import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import { Ticket, Activity, ShieldCheck, TrendingUp } from 'lucide-react';
import CommandHeader from './components/Overview/CommandHeader';
import PremiumStatCard from './components/Overview/PremiumStatCard';
import { motion, type Variants } from 'framer-motion';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { 
      duration: 0.6, 
      ease: [0.22, 1, 0.36, 1] 
    }
  }
};

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
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative max-w-[1400px] mx-auto p-6 md:p-10 min-h-screen overflow-hidden"
    >
      {/* Dynamic Background Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <motion.div 
          animate={{
            opacity: [0.3, 0.5, 0.3],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] left-[10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px]"
        />
        <motion.div 
          animate={{
            opacity: [0.2, 0.4, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-[20%] -right-[5%] w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px]"
        />
      </div>

      <motion.div variants={itemVariants}>
        <CommandHeader 
          userName={profile?.full_name || user?.user_metadata.full_name || 'User'} 
          plan={profile?.subscription_tier || 'Starter'} 
        />
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <motion.div variants={itemVariants}>
          <PremiumStatCard 
            title="Total Operations" 
            value={stats.total} 
            icon={Ticket} 
            color="#3b82f6" 
            trend="↑ 12%"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <PremiumStatCard 
            title="Active Issues" 
            value={stats.open} 
            icon={Activity} 
            color="#f59e0b" 
            trend="↓ 5%"
            trendIsPositive={false}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <PremiumStatCard 
            title="Success Rate" 
            value={`${resolutionRate.toFixed(0)}%`} 
            icon={ShieldCheck} 
            color="#10b981" 
            trend="Optimal"
          />
        </motion.div>
      </div>

      <motion.div variants={itemVariants} className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-sm">
           <div className="flex justify-between items-center mb-8">
              <div className="space-y-1">
                 <h2 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">System Intelligence</h2>
                 <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Monitoring automated urgency scoring and team analytics.</p>
              </div>
              <TrendingUp size={18} className="text-slate-400" />
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 group hover:border-blue-500/30 transition-colors">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Utility Load</p>
                 <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-3xl font-semibold text-slate-900 dark:text-white">{globalLoad.toFixed(1)}</span>
                    <span className="text-sm font-medium text-slate-500">%</span>
                 </div>
                 <div className="h-1.5 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${globalLoad}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full bg-blue-500"
                    ></motion.div>
                 </div>
              </div>

              <div className="p-6 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 group hover:border-emerald-500/30 transition-colors">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Resolution Velocity</p>
                 <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-3xl font-semibold text-slate-900 dark:text-white">{resolutionRate.toFixed(1)}</span>
                    <span className="text-sm font-medium text-slate-500">%</span>
                 </div>
                 <div className="h-1.5 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${resolutionRate}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full bg-emerald-500"
                    ></motion.div>
                 </div>
              </div>
           </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Overview;
