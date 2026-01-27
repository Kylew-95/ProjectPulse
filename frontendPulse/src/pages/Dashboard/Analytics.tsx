import { BarChart2, ArrowUpRight } from 'lucide-react';

const Analytics = () => {
    // Placeholder data - in real app fetch from backend
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Analytics</h1>

      <div className="bg-surface p-12 rounded-xl border border-slate-800 flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
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
