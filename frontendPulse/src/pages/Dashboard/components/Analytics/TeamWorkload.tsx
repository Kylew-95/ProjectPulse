import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TeamWorkloadProps {
  data: { name: string; count: number }[];
}

const TeamWorkload: React.FC<TeamWorkloadProps> = ({ data }) => {
  return (
    <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm lg:col-span-2">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">Assignee Workload</h3>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-white/5 px-2.5 py-1 rounded-full border border-slate-100 dark:border-white/5">
          Active Tickets
        </span>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#88888810" />
            <XAxis 
              type="number" 
              stroke="#64748b" 
              fontSize={10} 
              fontWeight={600}
              tickLine={false} 
              axisLine={false} 
            />
            <YAxis 
              dataKey="name" 
              type="category" 
              stroke="#64748b" 
              fontSize={10} 
              fontWeight={600}
              tickLine={false} 
              axisLine={false} 
              width={100}
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
            <Bar dataKey="count" fill="#10b981" radius={[0, 6, 6, 0]} barSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TeamWorkload;
