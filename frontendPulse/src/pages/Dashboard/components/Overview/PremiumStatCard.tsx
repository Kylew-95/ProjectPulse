import React from 'react';
import type { LucideIcon } from 'lucide-react';
import Card from '../../../../components/ui/Card';
import Badge from '../../../../components/ui/Badge';

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
    <Card hoverable className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 transition-colors group-hover:bg-slate-100 dark:group-hover:bg-white/10" style={{ color: color }}>
          <Icon size={20} />
        </div>
        {trend && (
          <Badge 
            variant={trendIsPositive ? 'emerald' : 'red'} 
            size="sm"
            className="font-bold border"
          >
            {trend}
          </Badge>
        )}
      </div>
      
      <div className="space-y-1">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">{title}</p>
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">{value}</h2>
      </div>
    </Card>
  );
};

export default PremiumStatCard;
