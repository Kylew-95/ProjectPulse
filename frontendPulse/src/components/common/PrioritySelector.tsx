import React from 'react';
import { AlertCircle, AlertTriangle, Info, Minus } from 'lucide-react';

export type Priority = 'urgent' | 'high' | 'medium' | 'low';

interface PrioritySelectorProps {
  value: string;
  onChange: (priority: Priority) => void;
  size?: 'sm' | 'md' | 'lg';
}

const PrioritySelector: React.FC<PrioritySelectorProps> = ({ 
  value, 
  onChange,
  size = 'md'
}) => {
  const priorities: { value: Priority; label: string; icon: React.ElementType; color: string }[] = [
    { 
      value: 'urgent', 
      label: 'Urgent', 
      icon: AlertCircle,
      color: 'hover:bg-red-50 dark:hover:bg-red-900/20 text-red-700 dark:text-red-400'
    },
    { 
      value: 'high', 
      label: 'High', 
      icon: AlertTriangle,
      color: 'hover:bg-orange-50 dark:hover:bg-orange-900/20 text-orange-700 dark:text-orange-400'
    },
    { 
      value: 'medium', 
      label: 'Medium', 
      icon: Info,
      color: 'hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-400'
    },
    { 
      value: 'low', 
      label: 'Low', 
      icon: Minus,
      color: 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
    },
  ];

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-2.5'
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      {priorities.map((priority) => {
        const Icon = priority.icon;
        const isSelected = value.toLowerCase() === priority.value;
        
        return (
          <button
            key={priority.value}
            type="button"
            onClick={() => onChange(priority.value)}
            className={`flex items-center gap-2 ${sizeClasses[size]} rounded-lg border font-semibold transition-all duration-200 ${
              isSelected
                ? 'bg-white dark:bg-slate-800 border-slate-300 dark:border-white/20 shadow-sm ring-2 ring-blue-500/20'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10'
            } ${priority.color}`}
          >
            <Icon size={size === 'sm' ? 14 : size === 'md' ? 16 : 18} />
            <span>{priority.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default PrioritySelector;
