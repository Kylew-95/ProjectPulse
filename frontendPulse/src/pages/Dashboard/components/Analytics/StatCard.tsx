import type { LucideIcon } from 'lucide-react';
import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  iconColorClass: string;
  bgColorClass: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
              {value}
            </h2>
            {trend?.label && (
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                {trend.label}
              </span>
            )}
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-slate-400">
          <Icon size={18} />
        </div>
      </div>
      
      {trend && trend.value !== 0 && (
        <div className="mt-4 flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
            trend.isPositive 
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
          }`}>
            {trend.value > 0 ? '↑' : '↓'} {Math.abs(Math.round(trend.value))}%
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">vs last period</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
