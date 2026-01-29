import { BarChart2, Clock } from 'lucide-react';
import { useState } from 'react';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import PageHeader from '../../components/common/PageHeader';

const Analytics = () => {
  const [loading, setLoading] = useState(false);

  const refreshData = () => {
    setLoading(true);
    // Simulate data fetch
    setTimeout(() => setLoading(false), 800);
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto min-h-screen font-sans selection:bg-primary/30">
      <Breadcrumbs />

      <PageHeader 
        title="Analytics" 
        description="Track your team's performance and ticket trends"
      >
        <button 
            onClick={refreshData}
            className="p-2 bg-white dark:bg-[#0f172a] hover:bg-slate-50 dark:hover:bg-white/5 text-slate-500 rounded-lg transition-all border border-slate-200 dark:border-white/5 active:scale-95 group shadow-sm"
            title="Refresh data"
        >
            <Clock size={16} className={`${loading ? "animate-spin" : "group-hover:rotate-180"} transition-transform duration-500`} />
        </button>
      </PageHeader>

      <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-12 overflow-hidden backdrop-blur-xl shadow-2xl flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-6 border border-white/5">
            <BarChart2 size={32} className="text-slate-500" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No Data Available</h3>
        <p className="text-slate-400 max-w-md">
            Analytics will appear here once you have active tickets and subscription data.
        </p>
      </div>
    </div>
  );
};

export default Analytics;
