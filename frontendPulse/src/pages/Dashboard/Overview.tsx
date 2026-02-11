import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import { Ticket, Activity, ShieldCheck, TrendingUp } from 'lucide-react';
import CommandHeader from './components/Overview/CommandHeader';
import PremiumStatCard from './components/Overview/PremiumStatCard';
import AISuggestions from './components/Overview/AISuggestions';
import CreateTicketModal from '../../components/tickets/CreateTicketModal';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Container from '../../components/ui/Container';
import { useAnalyticsData } from './hooks/useAnalyticsData';


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
  const { data: analytics, refresh: refreshAnalytics } = useAnalyticsData('7d');
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [initialTicketData, setInitialTicketData] = useState<{ title?: string; description?: string } | null>(null);
  const [userTeams, setUserTeams] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    // Analytics is already fetched by the hook

    const channel = supabase
      .channel('overview-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => refreshAnalytics())
      .subscribe();

    const fetchUserTeams = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('team_members')
        .select('team_id, teams(id, name)')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error fetching user teams:', error);
        return;
      }

      const teams = data?.map(m => {
        const t = Array.isArray(m.teams) ? m.teams[0] : m.teams;
        return { id: (t as { id: string }).id, name: (t as { name: string }).name };
      }) || [];

      setUserTeams(teams);
    };

    fetchUserTeams();

    return () => { supabase.removeChannel(channel); };
  }, [refreshAnalytics, user?.id, user?.email, user]);

  const handleCreateTicketFromSuggestion = (suggestion: { content: string; type: string }) => {
    let title = 'Strategic Insight Implementation';
    if (suggestion.type === 'feature_request') title = 'Feature Request Implementation';
    if (suggestion.type === 'user_need') title = 'User Pain Point Resolution';

    setInitialTicketData({
      title,
      description: suggestion.content
    });
    setIsTicketModalOpen(true);
  };


  const totalOps = analytics?.total || 0;
  const activeIssues = analytics?.active_issues || 0;
  const closedIssues = totalOps - activeIssues;
  const avgUrgency = analytics?.urgency_avg || 0;

  const resolutionRate = totalOps > 0 ? (closedIssues / totalOps) * 100 : 0;
  const globalLoad = Math.min(avgUrgency * 10, 100);

  const successRateColor = resolutionRate >= 70 ? "#10b981" : resolutionRate >= 40 ? "#f59e0b" : "#ef4444";
  const successRateTrend = resolutionRate >= 70 ? "High" : resolutionRate >= 40 ? "Mid" : "Low";

  // Trend formatting
  const formatTrend = (val: number | null | undefined) => {
    if (val === null || val === undefined) return undefined;
    const prefix = val >= 0 ? '↑' : '↓';
    return `${prefix} ${Math.abs(val).toFixed(0)}%`;
  };

  return (
    <Container size="full" className="relative p-4 md:p-10 min-h-screen overflow-hidden">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
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
              value={totalOps} 
              icon={Ticket} 
              color="#3b82f6" 
              trend={formatTrend(analytics?.trends.total)}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <PremiumStatCard 
              title="Active Issues" 
              value={activeIssues} 
              icon={Activity} 
              color="#f59e0b" 
              trend={formatTrend(analytics?.trends.active)}
              trendIsPositive={false} // Active issues going up is generally NOT positive in this context
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <PremiumStatCard 
              title="Success Rate" 
              value={`${resolutionRate.toFixed(0)}%`} 
              icon={ShieldCheck} 
              color={successRateColor}
              trend={successRateTrend}
            />
          </motion.div>
        </div>

        <motion.div variants={itemVariants} className="grid lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 p-8 shadow-sm">
             <div className="flex justify-between items-center mb-8">
                <div className="space-y-1">
                   <h2 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">System Intelligence</h2>
                   <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Monitoring automated urgency scoring and team analytics.</p>
                </div>
                <TrendingUp size={18} className="text-slate-400" />
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 group hover:border-blue-500/30 transition-colors">
                   <Badge variant="slate" size="xs" className="mb-4">Utility Load</Badge>
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
                   <Badge variant="slate" size="xs" className="mb-4">Resolution Velocity</Badge>
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
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <AISuggestions 
            guildId={(profile?.discord_guild_id ?? null) as string | null} 
            onCreateTicket={handleCreateTicketFromSuggestion}
          />
        </motion.div>

        {isTicketModalOpen && (
          <CreateTicketModal
            onClose={() => {
              setIsTicketModalOpen(false);
              setInitialTicketData(null);
            }}
            onTicketCreated={() => {
              refreshAnalytics();
              setIsTicketModalOpen(false);
              setInitialTicketData(null);
            }}
            teamId={userTeams[0]?.id || null}
            userTeams={userTeams}
            initialData={initialTicketData || undefined}
          />
        )}
      </motion.div>
    </Container>
  );
};

export default Overview;
