import React from 'react';
import { AlertCircle, AlertTriangle, Info, Minus } from 'lucide-react';

export type Priority = 'urgent' | 'high' | 'medium' | 'low';

interface PriorityBadgeProps {
  priority: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const PriorityBadge: React.FC<PriorityBadgeProps> = ({ 
  priority, 
  size = 'sm',
  showIcon = false 
}) => {
  const getPriorityConfig = (priority: string) => {
    const normalized = priority.toLowerCase();
    switch (normalized) {
      case 'urgent':
      case 'critical':
        return {
          color: 'text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800',
          icon: AlertCircle,
          label: 'Urgent'
        };
      case 'high':
        return {
          color: 'text-orange-700 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400 border-orange-200 dark:border-orange-800',
          icon: AlertTriangle,
          label: 'High'
        };
      case 'medium':
        return {
          color: 'text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800',
          icon: Info,
          label: 'Medium'
        };
      case 'low':
      default:
        return {
          color: 'text-slate-600 bg-slate-50 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700',
          icon: Minus,
          label: 'Low'
        };
    }
  };

  const config = getPriorityConfig(priority);
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5'
  };

  return (
    <span className={`inline-flex items-center gap-1 font-bold rounded border uppercase tracking-wider ${config.color} ${sizeClasses[size]}`}>
      {showIcon && <Icon size={size === 'sm' ? 10 : size === 'md' ? 12 : 14} />}
      {config.label}
    </span>
  );
};

export default PriorityBadge;
