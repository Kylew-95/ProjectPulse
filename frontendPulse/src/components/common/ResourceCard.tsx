import { ArrowRight, Trash2, Edit2 } from 'lucide-react';
import type { ReactNode } from 'react';

interface ResourceCardProps {
  title: string;
  subtitle?: ReactNode;
  description?: string;
  icon?: React.ElementType;
  decorationIcon?: React.ElementType;
  onClick?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  children?: ReactNode;
  footer?: ReactNode;
  actionLabel?: string;
  className?: string;
  testId?: string;
  decorationSize?: number;
}

export default function ResourceCard({
  title,
  subtitle,
  description,
  icon: Icon,
  decorationIcon: DecorationIcon,
  onClick,
  onDelete,
  onEdit,
  children,
  footer,
  actionLabel,
  className = '',
  testId,
  decorationSize = 140
}: ResourceCardProps) {
  return (
    <div 
      className={`group relative bg-white dark:bg-slate-800 border border-border-main dark:border-white/5 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden ${className}`}
      onClick={onClick}
      data-testid={testId}
    >
      {/* Decorative Background Animated Logo */}
      {DecorationIcon && (
        <div className="absolute -right-6 -bottom-6 text-slate-100 dark:text-white/5 group-hover:text-slate-200 dark:group-hover:text-white/10 transition-all duration-700 pointer-events-none group-hover:rotate-12 group-hover:scale-110">
          <DecorationIcon size={decorationSize} aria-hidden="true" strokeWidth={1} />
        </div>
      )}

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          {Icon ? (
            <div className="p-3 rounded-xl bg-primary/10 text-primary dark:text-blue-400 border border-primary/20 dark:border-blue-500/20">
              <Icon size={20} aria-hidden="true" />
            </div>
          ) : (
            <div /> /* Spacer if no icon */
          )}
          
          <div className="flex items-center gap-1">
            {subtitle && (
                <div className="mr-2 text-xs font-bold text-text-secondary dark:text-gray-400">
                    {subtitle}
                </div>
            )}
            {onEdit && (
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="text-text-secondary hover:text-primary p-2 transition-all rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10"
                aria-label="Edit"
              >
                <Edit2 size={16} aria-hidden="true" />
              </button>
            )}
            {onDelete && (
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="text-text-secondary hover:text-red-500 p-2 transition-all rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
                aria-label="Delete"
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
        
        <h3 className="text-lg font-bold text-text-primary dark:text-gray-100 mb-1 group-hover:text-primary dark:group-hover:text-blue-400 transition-colors line-clamp-1" title={title}>
            {title}
        </h3>
        
        {description && (
            <p className="text-text-secondary dark:text-gray-400 text-xs mb-6 opacity-70 line-clamp-2">
                {description}
            </p>
        )}

        <div className="mb-6">
            {children}
        </div>

        {footer ? footer : actionLabel ? (
          <div className="w-full flex items-center justify-between px-4 py-2 bg-background dark:bg-white/5 border border-border-main dark:border-gray-700 rounded-xl text-text-primary dark:text-gray-200 text-xs font-bold transition-all group-hover:bg-primary group-hover:text-white dark:group-hover:bg-blue-600">
            {actionLabel} <ArrowRight size={14} aria-hidden="true" className="group-hover:translate-x-1 transition-transform" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
