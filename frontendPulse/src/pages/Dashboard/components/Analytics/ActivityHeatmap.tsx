import React from 'react';
import Card from '../../../../components/ui/Card';

interface HeatmapData {
  day: string;
  hour: number;
  count: number;
}

interface ActivityHeatmapProps {
  data: HeatmapData[];
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ data }) => {
  return (
    <Card className="p-8 lg:col-span-2">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">Activity Heatmap</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Less</span>
            <div className="flex gap-1">
              {[0.1, 0.3, 0.6, 1].map((op) => (
                <div key={op} className="w-2.5 h-2.5 rounded-[3px] border border-white/5" style={{ backgroundColor: `rgba(59, 130, 246, ${op})` }} />
              ))}
            </div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">More</span>
          </div>
        </div>
      </div>

      <div className="space-y-3 overflow-x-auto pb-4 custom-scrollbar">
        <div className="flex min-w-[600px]">
          <div className="w-14" />
          <div className="flex-1 flex justify-between px-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter opacity-60">
                {i * 2}h
              </span>
            ))}
          </div>
        </div>

        {DAYS.map((day) => (
          <div key={day} className="flex items-center min-w-[600px] group/row">
            <span className="w-14 text-[10px] font-bold text-slate-500 uppercase tracking-widest group-hover/row:text-slate-900 dark:group-hover/row:text-white transition-colors">
              {day}
            </span>
            <div className="flex-1 flex gap-1.5 h-10">
              {data.filter(h => h.day === day).sort((a, b) => a.hour - b.hour).map((h) => {
                const intensity = Math.min(h.count * 15, 100);
                return (
                  <div 
                    key={h.hour}
                    className="flex-1 rounded-[4px] cursor-help transition-all duration-300 hover:ring-2 hover:ring-blue-500/50 hover:scale-[1.1] relative group/cell"
                    style={{ 
                      backgroundColor: h.count === 0 
                        ? 'rgba(0,0,0,0.02)' 
                        : `rgba(59, 130, 246, ${0.1 + (intensity / 100) * 0.9})` 
                    }}
                  >
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 dark:bg-slate-800 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover/cell:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none border border-white/10 shadow-xl">
                      {h.count} tickets • {h.hour}:00
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default ActivityHeatmap;
