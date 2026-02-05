import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface StatusDistributionProps {
  data: { name: string; value: number }[];
}

const StatusDistribution: React.FC<StatusDistributionProps> = ({ data }) => {
  return (
    <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
       <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">Status Distribution</h3>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-white/5 px-2.5 py-1 rounded-full border border-slate-100 dark:border-white/5">
          Workflow Health
        </span>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888810" />
            <XAxis 
              dataKey="name" 
              stroke="#64748b" 
              fontSize={10} 
              fontWeight={600}
              tickLine={false} 
              axisLine={false} 
              dy={10}
              tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={10} 
              fontWeight={600}
              tickLine={false} 
              axisLine={false} 
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0f172a', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '12px', 
                color: '#fff',
                fontSize: '12px',
                fontWeight: 600
              }}
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            />
            <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StatusDistribution;
