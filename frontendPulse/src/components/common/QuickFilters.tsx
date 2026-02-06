import React from 'react';
import { User, AlertCircle, Clock, Inbox } from 'lucide-react';

export type QuickFilterType = 'all' | 'my-tickets' | 'unassigned' | 'high-priority' | 'overdue';

interface QuickFiltersProps {
  activeFilter: QuickFilterType;
  onFilterChange: (filter: QuickFilterType) => void;
  counts?: {
    all: number;
    myTickets: number;
    unassigned: number;
    highPriority: number;
    overdue: number;
  };
}

const QuickFilters: React.FC<QuickFiltersProps> = ({ 
  activeFilter, 
  onFilterChange,
  counts 
}) => {
  const filters: { 
    value: QuickFilterType; 
    label: string; 
    icon: React.ElementType;
  }[] = [
    { value: 'all', label: 'All Tickets', icon: Inbox },
    { value: 'my-tickets', label: 'My Tickets', icon: User },
    { value: 'unassigned', label: 'Unassigned', icon: AlertCircle },
    { value: 'high-priority', label: 'High Priority', icon: AlertCircle },
    { value: 'overdue', label: 'Overdue', icon: Clock },
  ];

  const getCount = (filter: QuickFilterType): number | undefined => {
    if (!counts) return undefined;
    switch (filter) {
      case 'all': return counts.all;
      case 'my-tickets': return counts.myTickets;
      case 'unassigned': return counts.unassigned;
      case 'high-priority': return counts.highPriority;
      case 'overdue': return counts.overdue;
    }
  };

  return (
    <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800">
      {filters.map((filter) => {
        const Icon = filter.icon;
        const isActive = activeFilter === filter.value;
        const count = getCount(filter.value);
        
        return (
          <button
            key={filter.value}
            onClick={() => onFilterChange(filter.value)}
            className={`
              relative flex items-center gap-2 px-4 py-3 text-sm font-medium
              transition-colors duration-150
              ${isActive 
                ? 'text-slate-900 dark:text-slate-100' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }
            `}
          >
            <Icon size={16} className="shrink-0" />
            <span>{filter.label}</span>
            {count !== undefined && (
              <span className={`
                text-xs font-medium tabular-nums px-1.5 py-0.5 rounded-md
                ${isActive 
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }
              `}>
                {count}
              </span>
            )}
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-500" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default QuickFilters;



