import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface PremiumStatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  trend?: string;
  trendIsPositive?: boolean;
}

const PremiumStatCard: React.FC<PremiumStatCardProps> = ({ title, value, icon: Icon, color, trend, trendIsPositive = true }) => {
  return (
    <div className="group relative overflow-hidden rounded-xl p-6 transition-all duration-200 hover:border-slate-300 dark:hover:border-white/20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 transition-colors group-hover:bg-slate-100 dark:group-hover:bg-white/10" style={{ color: color }}>
          <Icon size={20} />
        </div>
        {trend && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${trendIsPositive ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
            {trend}
          </span>
        )}
      </div>
      
      <div className="space-y-1">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">{title}</p>
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">{value}</h2>
      </div>
    </div>
  );
};

export default PremiumStatCard;
