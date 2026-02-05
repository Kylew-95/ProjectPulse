import React from 'react';
import { Settings2, Filter, PieChart as PieChartIcon, Users, Clock, Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface WidgetConfig {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface AnalyticsCustomizerProps {
  showCustomizer: boolean;
  setShowCustomizer: (show: boolean) => void;
  activeWidgets: Record<string, boolean>;
  toggleWidget: (id: string) => void;
}

const WIDGETS: WidgetConfig[] = [
  { id: 'volume', label: 'Volume Trends', icon: Filter },
  { id: 'priority', label: 'Priority Dist.', icon: PieChartIcon },
  { id: 'status', label: 'Status Dist.', icon: Filter },
  { id: 'type', label: 'Type Breakdown', icon: PieChartIcon },
  { id: 'workload', label: 'Team Workload', icon: Users },
  { id: 'heatmap', label: 'Activity Heatmap', icon: Clock },
];

const AnalyticsCustomizer: React.FC<AnalyticsCustomizerProps> = ({ 
  showCustomizer, 
  setShowCustomizer, 
  activeWidgets, 
  toggleWidget 
}) => {
  return (
    <div className="relative">
      <button 
        onClick={() => setShowCustomizer(!showCustomizer)}
        className={`p-2 rounded-lg transition-all border active:scale-95 shadow-sm flex items-center gap-2 text-xs font-bold uppercase tracking-wider
          ${showCustomizer 
            ? "bg-primary text-white border-primary" 
            : "bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5"}
        `}
      >
        <Settings2 size={16} />
        Customize
      </button>

      {showCustomizer && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl z-50 p-4 animate-in fade-in zoom-in duration-200">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Toggle Widgets</h4>
          <div className="space-y-1">
            {WIDGETS.map((w) => (
              <button
                key={w.id}
                onClick={() => toggleWidget(w.id)}
                className="w-full flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-md ${activeWidgets[w.id] ? "bg-primary/10 text-primary" : "bg-slate-100 dark:bg-slate-800 text-slate-400 transition-colors"}`}>
                    <w.icon size={14} />
                  </div>
                  <span className={`text-sm font-medium ${activeWidgets[w.id] ? "text-slate-900 dark:text-white" : "text-slate-500"}`}>{w.label}</span>
                </div>
                {activeWidgets[w.id] && <Check size={14} className="text-primary" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsCustomizer;
